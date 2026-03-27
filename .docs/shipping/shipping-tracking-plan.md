# Shipping Tracking — Implementation Plan

**Feature:** Real-time order tracking page with FedEx-style progress indicators  
**Status:** 📋 Planning  
**Last updated:** March 2026

---

## Overview

Build a standalone `/shipping` route accessible from the main navigation. Orders flow from **Medusa → Convex (real-time DB) → Storefront**. CJ Dropshipping logistics webhooks update tracking status in real-time via a **Medusa admin API relay → Convex mutation** pipeline.

- **Unauthenticated users** see a sign-in prompt
- **Authenticated users** see all active shipments with live progress indicators
- **Shipment detail view** shows a FedEx-inspired progress tracker with 7 supply-chain milestones

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ORDER CREATION PIPELINE                                               │
│                                                                        │
│  Customer checkout → Medusa Order Created                              │
│    │                                                                   │
│    └→ Medusa Order Subscriber (admin/src/subscribers/order-placed.ts)  │
│         │                                                              │
│         └→ Convex HTTP mutation: POST /shipping/webhook                │
│              │                                                         │
│              └→ Creates shippingTracking record                        │
│                   status: "order_placed"                               │
│                   items, address, totals, dates copied from order      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  TRACKING UPDATE PIPELINE                                              │
│                                                                        │
│  CJ Dropshipping                                                       │
│    │                                                                   │
│    └→ CJ Logistics Webhook (LOGISTICS topic, status codes 0-14)       │
│         │                                                              │
│         └→ Medusa Admin: POST /admin/custom/cj-webhook                │
│              │                                                         │
│              └→ Validates webhook secret, parses payload               │
│                   │                                                    │
│                   └→ Convex HTTP mutation: POST /shipping/webhook      │
│                        │                                               │
│                        └→ Updates shippingTracking record              │
│                             Maps CJ code → milestone step             │
│                             Appends to trackingEvents timeline         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  STOREFRONT REAL-TIME DISPLAY                                          │
│                                                                        │
│  ConvexProvider (client-side)                                          │
│    │                                                                   │
│    └→ useQuery(api.shipping.tracking.getByCustomerId)                 │
│         │                                                              │
│         └→ Reactive subscription — UI updates instantly on mutation    │
│              │                                                         │
│              ├→ /shipping — Dashboard: list of all active shipments    │
│              └→ /shipping/[orderId] — FedEx-style tracking detail     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Convex Schema & Backend Pipeline

### Step 1.1 — Add `shippingTracking` table to Convex schema

**File:** `convex/schema.ts`

Add a new table with the following field groups:

**Order references:**
| Field | Type | Description |
|-------|------|-------------|
| `medusaOrderId` | string | Medusa order ID (e.g., `ord_01KL...`) |
| `medusaOrderDisplayId` | number | Human-readable order number |
| `customerId` | string | Medusa customer ID |

**CJ references:**
| Field | Type | Description |
|-------|------|-------------|
| `cjOrderId` | optional string | CJ Dropshipping order ID |
| `trackingNumber` | optional string | Primary tracking number |
| `lastMileCarrier` | optional string | Final delivery carrier name |
| `lastMileTrackingNumber` | optional string | Last-mile tracking number |
| `logisticName` | optional string | Shipping method name (e.g., "CJPacket Ordinary") |

**Order details:**
| Field | Type | Description |
|-------|------|-------------|
| `orderItems` | array of objects | Each: `{ title, quantity, unitPrice, thumbnail, sku }` |
| `orderTotal` | number | Total in cents |
| `currencyCode` | string | ISO currency code (e.g., "usd") |

**Dates:**
| Field | Type | Description |
|-------|------|-------------|
| `orderDate` | number | Unix timestamp — when order was placed |
| `estimatedDeliveryDate` | optional number | Unix timestamp — computed from shipping method transit days |
| `actualDeliveryDate` | optional number | Unix timestamp — populated when delivered |

**Shipping address:**
| Field | Type | Description |
|-------|------|-------------|
| `shippingAddress` | object | `{ firstName, lastName, address1, address2, city, postalCode, countryCode, phone }` |

**Progress:**
| Field | Type | Description |
|-------|------|-------------|
| `currentStatus` | union | One of: `order_placed`, `processing`, `shipped`, `in_transit`, `arrived_in_country`, `out_for_delivery`, `delivered`, `issue`, `returned` |
| `cjStatusCode` | optional number | Raw CJ status code (0-14) |

**Timeline:**
| Field | Type | Description |
|-------|------|-------------|
| `trackingEvents` | array of objects | Each: `{ status, description, location, timestamp, cjStatusCode }` |

**Timestamps:**
| Field | Type | Description |
|-------|------|-------------|
| `createdAt` | number | Record creation timestamp |
| `updatedAt` | number | Last update timestamp |

**Indexes:** `by_customerId`, `by_medusaOrderId`, `by_trackingNumber`, `by_currentStatus`

---

### Step 1.2 — Shipping progress steps (supply-chain optimized)

CJ Dropshipping provides 15 raw status codes (0–14). These are mapped into **7 user-facing milestones** that match standard carrier tracking UX patterns:

| Step | Milestone Label | CJ Status Codes | Icon | Customer-Facing Description |
|------|----------------|-----------------|------|-----------------------------|
| 1 | **Order Placed** | — | ✓ | Order confirmed and payment received |
| 2 | **Processing** | 0 | ⚙️ | Warehouse is preparing your shipment |
| 3 | **Shipped** | 1, 2, 3, 4 | 📦 | Package has left the warehouse |
| 4 | **In Transit** | 5 | ✈️ | Shipment is in international transit |
| 5 | **Arrived in Country** | 6, 7, 8 | 🏛️ | Arrived at destination, clearing customs |
| 6 | **Out for Delivery** | 9, 10, 11 | 🚚 | With local carrier for final delivery |
| 7 | **Delivered** | 12 | ✅ | Package delivered successfully |

**Exception statuses:**
| Status | CJ Code | Description |
|--------|---------|-------------|
| `issue` | 13 | Failure or abnormality during shipping |
| `returned` | 14 | Package returned to sender |

**CJ Raw Status Code Reference:**

| Code | CJ Description | Maps To |
|------|---------------|---------|
| 0 | No tracking info available | `processing` |
| 1 | Warehouse outbound | `shipped` |
| 2 | Freight forwarder inbound | `shipped` |
| 3 | Freight forwarder return | `shipped` |
| 4 | Freight forwarder outbound | `shipped` |
| 5 | First leg transportation | `in_transit` |
| 6 | Arrival at destination country | `arrived_in_country` |
| 7 | Starting customs clearance | `arrived_in_country` |
| 8 | Customs clearance completed | `arrived_in_country` |
| 9 | Terminal retrieval | `out_for_delivery` |
| 10 | Delivery | `out_for_delivery` |
| 11 | Arrival waiting for retrieval | `out_for_delivery` |
| 12 | Signed for (Delivered) | `delivered` |
| 13 | Failure/abnormality | `issue` |
| 14 | Return | `returned` |

Full `currentStatus` union type:
```typescript
"order_placed" | "processing" | "shipped" | "in_transit" | "arrived_in_country" | "out_for_delivery" | "delivered" | "issue" | "returned"
```

---

### Step 1.3 — Convex shipping mutations & queries

**New file:** `convex/shipping/tracking.ts`

Follows the existing pattern in `convex/medusa/staging.ts`.

**Mutations:**

| Mutation | Description | Called By |
|----------|-------------|----------|
| `createShipment` | Creates record with status `order_placed`. Copies order items, address, totals from Medusa order data | Medusa order subscriber |
| `linkCjOrder` | Links a CJ order ID and tracking number to an existing shipment. Sets status to `processing` | Admin script |
| `updateTrackingStatus` | Maps CJ status code → milestone step. Appends to `trackingEvents` array. Updates `currentStatus`, `cjStatusCode`, timestamps | Webhook handler |
| `updateTrackingEvents` | Batch-updates tracking events from CJ `logisticsTrackEvents` payload (array of events with activity, location, eventTime) | Webhook handler |

**Queries:**

| Query | Description | Used By |
|-------|-------------|--------|
| `getByCustomerId` | All shipments for a customer, ordered by `orderDate` desc | Shipping dashboard |
| `getByMedusaOrderId` | Single shipment lookup by Medusa order ID | Tracking detail page |
| `getByTrackingNumber` | Lookup by tracking number | Webhook handler (to match incoming updates) |

---

### Step 1.4 — Convex HTTP endpoint for webhook ingestion

**File:** `convex/http.ts` (extend existing)

Add `POST /shipping/webhook` route:

1. Validates a shared secret header (`X-Webhook-Secret`)
2. Parses CJ logistics webhook payload:
   - `messageType`: `INSERT | UPDATE | DELETE`
   - `params.orderId`: CJ order ID
   - `params.trackingNumber`: tracking number
   - `params.trackingStatus`: integer status code (0-14)
   - `params.logisticsTrackEvents`: array of tracking events
3. Calls `updateTrackingStatus` mutation with mapped data
4. Returns 200 within 3 seconds (CJ webhook requirement)

---

## Phase 2: Medusa Admin Backend Integration

### Step 2.1 — CJ webhook relay endpoint

**New file:** `admin/src/api/admin/custom/cj-webhook/route.ts`

`POST /admin/custom/cj-webhook` handler:

1. Validates CJ webhook shared secret from request headers
2. Parses the `LOGISTICS` webhook payload
3. Forwards the tracking update to Convex HTTP endpoint:
   ```
   POST {CONVEX_URL}/shipping/webhook
   Headers: { X-Webhook-Secret: CONVEX_WEBHOOK_SECRET }
   Body: { type: "tracking_update", ...mappedPayload }
   ```
4. Returns 200 OK

**Why relay through Medusa?**
- CJ webhooks require HTTPS with a verifiable endpoint
- Medusa is already deployed with HTTPS on Railway
- The relay allows enriching the payload with Medusa order data before forwarding
- Centralizes webhook authentication and logging

### Step 2.2 — Medusa order subscriber

**New file:** `admin/src/subscribers/order-placed.ts`

Subscribes to `order.placed` event:

1. Fetch full order details (items, shipping address, totals, customer)
2. Call Convex HTTP mutation `createShipment` with:
   - `medusaOrderId`, `medusaOrderDisplayId`, `customerId`
   - Order items: `[{ title, quantity, unitPrice, thumbnail, sku }]`
   - `orderTotal`, `currencyCode`
   - `shippingAddress`: `{ firstName, lastName, address1, address2, city, postalCode, countryCode, phone }`
   - `orderDate`: `order.created_at`
3. Estimate delivery date: `orderDate` + shipping days from variant metadata (`shippingDaysUS` / `shippingDaysCA`, typically "7-15" days)

**Environment variables needed in `admin/.env`:**

| Variable | Description |
|----------|-------------|
| `CONVEX_URL` | Convex deployment URL (e.g., `https://xyz.convex.cloud`) |
| `CONVEX_WEBHOOK_SECRET` | Shared secret for authenticating webhook calls |

### Step 2.3 — Register CJ webhook with CJ API

**New script:** `scripts/admin/setup-cj-webhook.mjs`

Calls CJ API `POST /api2.0/v1/webhook/set` to register:

| Parameter | Value |
|-----------|-------|
| Webhook URL | `https://{MEDUSA_URL}/admin/custom/cj-webhook` |
| Topic | `LOGISTICS` (and optionally `ORDER`) |
| Protocol | HTTPS (TLS 1.2+) |

CJ will POST logistics updates to this URL whenever a shipment status changes.

---

## Phase 3: Storefront — ConvexProvider Setup

### Step 3.1 — Install Convex dependencies

**File:** `storefront/package.json`

Add dependencies:
```json
{
  "convex": "^1.x",
  "@convex/react": "^1.x"
}
```

### Step 3.2 — ConvexProvider client wrapper

**New file:** `storefront/src/lib/providers/convex-provider.tsx`

"use client" component that:
- Initializes `ConvexReactClient` with `process.env.NEXT_PUBLIC_CONVEX_URL`
- Wraps children in `<ConvexProvider>`

**File:** `storefront/src/app/[countryCode]/(main)/layout.tsx`

Insert `ConvexClientProvider` wrapping the page content area (nav and footer remain server components).

### Step 3.3 — Shipping data hooks

**New file:** `storefront/src/lib/data/shipping.ts`

| Hook / Function | Description |
|----------------|-------------|
| `useShipments(customerId)` | `useQuery(api.shipping.tracking.getByCustomerId, { customerId })` — real-time subscription |
| `useShipment(orderId)` | `useQuery(api.shipping.tracking.getByMedusaOrderId, { medusaOrderId })` — real-time subscription |
| `getShipments(customerId)` | Server-side fallback via HTTP fetch to Convex `/api/query` for SSR |

---

## Phase 4: Storefront — Shipping Page UI

### Step 4.1 — Add "Shipping" nav link

**File:** `storefront/src/modules/layout/templates/nav/index.tsx`

Insert after the "LED-itorial" button:

```tsx
<Button variant="link" asChild className="font-sans tracking-wide font-medium text-black">
  <LocalizedClientLink href="/shipping" data-testid="nav-shipping-link">
    Shipping
  </LocalizedClientLink>
</Button>
```

### Step 4.2 — Shipping page route (with auth gate)

**New file:** `storefront/src/app/[countryCode]/(main)/shipping/page.tsx`

Server component:
1. Calls `retrieveCustomer()` — same pattern as account layout
2. If no customer → renders `<ShippingLoginPrompt />`
3. If authenticated → renders `<ShippingDashboard customerId={customer.id} />`

### Step 4.3 — Sign-in prompt

**New file:** `storefront/src/modules/shipping/components/shipping-login-prompt/index.tsx`

Design (matches account page empty states):

```
┌───────────────────────────────────────────────────┐
│                                                   │
│                 📦 (Package icon)                 │
│                                                   │
│            Track Your Orders                      │
│                                                   │
│   Sign in to view your shipping details and       │
│   track your orders in real-time.                 │
│                                                   │
│              [ Sign In ]                          │
│                                                   │
└───────────────────────────────────────────────────┘
```

- Heading: `text-2xl-semi font-sans`
- Subtext: `text-base-regular text-ui-fg-subtle`
- Button: `Button variant="secondary"` → `/account`
- Container: `bg-white`, centered flex column

### Step 4.4 — Shipping dashboard (all orders list)

**New file:** `storefront/src/modules/shipping/templates/shipping-dashboard/index.tsx`

"use client" component:

1. Uses `useQuery(api.shipping.tracking.getByCustomerId)` for real-time data
2. Renders list of `<ShipmentCard>` components (styled like `OrderCard`)
3. Each card shows:
   - Order number (uppercase, `text-large-semi`)
   - Order date, total, item count (divided by `divide-x divide-gray-200`)
   - Current `<StatusBadge>`
   - "Track Shipment" button (`Button variant="secondary"`)
4. Layout: `flex flex-col gap-y-8 w-full` (matches `OrderOverview`)
5. Empty state: "No shipments yet" + "Continue Shopping" CTA

### Step 4.5 — Shipment tracking detail page (FedEx-style)

**New file:** `storefront/src/app/[countryCode]/(main)/shipping/[orderId]/page.tsx`
**New file:** `storefront/src/modules/shipping/templates/shipment-tracker/index.tsx`

"use client" template composed of the following sections:

#### A. Header Bar

```
← Back to shipments          Shipment Tracking          #10042
```

#### B. Date Header Row

```
┌─────────────────────────────────────────────────────────────┐
│  Ordered                              Expected Delivery     │
│  Mar 15, 2026                         Mar 27 – Apr 1, 2026  │
└─────────────────────────────────────────────────────────────┘
```

If delivered: right side shows "Delivered — Mar 28, 2026" in emerald green.

#### C. Progress Tracker (centerpiece)

**Desktop (horizontal):**
```
  ●━━━━━━━●━━━━━━━●━━━━━━━◉━━━━━━━○━━━━━━━○━━━━━━━○
  Order   Processing  Shipped  In Transit  Arrived  Out for   Delivered
  Placed                       ▲ current   in       Delivery
                                           Country
```

**Mobile (vertical):**
```
  ● Order Placed         ✓ Mar 15
  │
  ● Processing           ✓ Mar 16
  │
  ● Shipped              ✓ Mar 17
  │
  ◉ In Transit           ← Current
  │
  ○ Arrived in Country
  │
  ○ Out for Delivery
  │
  ○ Delivered
```

- Completed: filled circle `bg-accent-700` (#8B6914 gold) with white check
- Current: larger filled circle with subtle pulse animation
- Future: hollow circle `border-gray-300`
- Connecting line: `bg-accent-700` up to current, `bg-gray-200` after
- Exception state (issue/returned): current step in `bg-red-500` with warning icon

#### D. Status Summary Card

```
┌─────────────────────────────────────────────────────────────┐
│  ✈️  In Transit                                             │
│                                                             │
│  Carrier: CJPacket Ordinary                                 │
│  Tracking: CJ1234567890  →                                  │
│  Last update: Mar 20, 2026 at 3:45 PM                       │
└─────────────────────────────────────────────────────────────┘
```

#### E. Order Items

```
┌──────────┬──────────┬──────────┬──────────┐
│ 🖼 Item 1│ 🖼 Item 2│ 🖼 Item 3│          │
│ Title    │ Title    │ Title    │          │
│ x2       │ x1       │ x1       │          │
│ $45.99   │ $89.99   │ $34.50   │          │
└──────────┴──────────┴──────────┴──────────┘
                                 Total: $216.47
```

Grid: `grid-cols-2 small:grid-cols-4` (matches `OrderCard` pattern)

#### F. Tracking Timeline

```
  ● Mar 20, 3:45 PM  — Departed transit hub, Shanghai CN
  │
  ● Mar 19, 8:12 AM  — Arrived at transit hub, Shanghai CN
  │
  ● Mar 18, 2:30 PM  — Picked up by freight forwarder
  │
  ● Mar 17, 10:00 AM — Left warehouse, Yiwu CN
  │
  ○ Mar 16, 6:00 PM  — Shipment prepared
  │
  ○ Mar 15, 2:15 PM  — Order placed
```

- Most recent event at top
- Active event dot: `accent-700` gold
- Past events: `gray-300`
- Line: `border-l-2`

#### G. Shipping Address

Same 3-column layout as existing `ShippingDetails` component:

| Shipping Address | Contact | Method |
|-----------------|---------|--------|
| John Doe | +1 555-1234 | CJPacket Ordinary ($0.00) |
| 123 Main St | john@example.com | |
| 90210, Los Angeles | | |
| US | | |

---

### Step 4.6 — Progress Tracker component

**New file:** `storefront/src/modules/shipping/components/progress-tracker/index.tsx`

Reusable component props:

```typescript
type ProgressTrackerProps = {
  steps: Array<{ key: string; label: string }>
  currentStep: string
  isException?: boolean  // For issue/returned states
}
```

Responsive behavior:
- **Desktop (≥ 1024px):** Horizontal bar with dots and labels below
- **Mobile (< 1024px):** Vertical bar with dots and labels to the right

### Step 4.7 — Status Badge component

**New file:** `storefront/src/modules/shipping/components/status-badge/index.tsx`

Color-coded pill badge:

| Status | Colors | Ring |
|--------|--------|------|
| `order_placed` | `bg-gray-50 text-gray-700` | `ring-gray-600/20` |
| `processing` | `bg-amber-50 text-amber-700` | `ring-amber-600/20` |
| `shipped` | `bg-blue-50 text-blue-700` | `ring-blue-600/20` |
| `in_transit` | `bg-blue-50 text-blue-700` | `ring-blue-600/20` |
| `arrived_in_country` | `bg-indigo-50 text-indigo-700` | `ring-indigo-600/20` |
| `out_for_delivery` | `bg-indigo-50 text-indigo-700` | `ring-indigo-600/20` |
| `delivered` | `bg-emerald-50 text-emerald-700` | `ring-emerald-600/20` |
| `issue` | `bg-red-50 text-red-700` | `ring-red-600/20` |
| `returned` | `bg-orange-50 text-orange-700` | `ring-orange-600/20` |

Matches existing "Free Shipping" badge pattern from product detail page.

---

## Phase 5: Admin Tooling

### Step 5.1 — Link CJ orders to Medusa orders

**New script:** `scripts/admin/link-cj-order.mjs`

```bash
# Link a CJ order to a Medusa order in the shipping tracking table
node scripts/admin/link-cj-order.mjs \
  --medusa-order-id ord_01KL... \
  --cj-order-id 12345678 \
  --tracking-number CJ1234567890
```

Calls Convex `linkCjOrder` mutation. Sets status to `processing`.

### Step 5.2 — Manually trigger tracking update

**New script:** `scripts/admin/update-shipping-status.mjs`

```bash
# Simulate a CJ tracking update (for testing)
node scripts/admin/update-shipping-status.mjs \
  --tracking-number CJ1234567890 \
  --status 5 \
  --description "Departed transit hub" \
  --location "Shanghai, CN"
```

Calls Convex `updateTrackingStatus` mutation directly. Useful for:
- Testing the progress tracker UI at each milestone
- Manually updating status if webhooks fail
- Demo/staging environments

---

## Files Summary

### Existing files to modify

| File | Change |
|------|--------|
| `convex/schema.ts` | Add `shippingTracking` table definition |
| `convex/http.ts` | Add `POST /shipping/webhook` route |
| `storefront/src/modules/layout/templates/nav/index.tsx` | Add "Shipping" nav link after "LED-itorial" |
| `storefront/src/app/[countryCode]/(main)/layout.tsx` | Wrap content in `ConvexClientProvider` |
| `storefront/package.json` | Add `convex`, `@convex/react` dependencies |

### New files to create (16 files)

| File | Purpose |
|------|---------|
| `convex/shipping/tracking.ts` | Queries & mutations for shipping tracking |
| `admin/src/api/admin/custom/cj-webhook/route.ts` | CJ webhook relay endpoint |
| `admin/src/subscribers/order-placed.ts` | Medusa order subscriber → Convex |
| `storefront/src/lib/providers/convex-provider.tsx` | ConvexProvider client wrapper |
| `storefront/src/lib/data/shipping.ts` | Shipping data hooks (useQuery wrappers) |
| `storefront/src/app/[countryCode]/(main)/shipping/page.tsx` | Shipping dashboard page |
| `storefront/src/app/[countryCode]/(main)/shipping/[orderId]/page.tsx` | Tracking detail page |
| `storefront/src/modules/shipping/templates/shipping-dashboard/index.tsx` | Dashboard template |
| `storefront/src/modules/shipping/templates/shipment-tracker/index.tsx` | Tracking detail template |
| `storefront/src/modules/shipping/components/shipping-login-prompt/index.tsx` | Auth gate prompt |
| `storefront/src/modules/shipping/components/progress-tracker/index.tsx` | Progress bar component |
| `storefront/src/modules/shipping/components/status-badge/index.tsx` | Status pill component |
| `scripts/admin/setup-cj-webhook.mjs` | Register CJ webhook |
| `scripts/admin/link-cj-order.mjs` | Link CJ order to Medusa order |
| `scripts/admin/update-shipping-status.mjs` | Manual status update tool |

---

## Verification Checklist

| # | Test | Expected |
|---|------|----------|
| 1 | Run `npx convex dev` | `shippingTracking` table deploys without errors |
| 2 | Place test order via storefront | Convex record appears in `shippingTracking` table |
| 3 | Run `update-shipping-status.mjs` with status 5 | Convex record updates `currentStatus` to `in_transit` |
| 4 | Visit `/shipping` logged out | Sign-in prompt renders with "Track Your Orders" heading |
| 5 | Visit `/shipping` logged in | Dashboard renders with order list |
| 6 | Open tracking detail page, push status update via script | UI updates **without page refresh** (real-time) |
| 7 | Advance shipment through all 7 steps | Progress bar fills correctly at each milestone |
| 8 | View on mobile (< 1024px) | Progress bar switches to vertical layout |
| 9 | Compare to account pages | InclusiveSans font, accent-700 gold, gray-200 borders match |

---

## Design System Alignment

The shipping pages use **identical styling** to the existing account/order pages:

| Token | Value | Usage |
|-------|-------|-------|
| Body font | InclusiveSans (`font-sans`) | All text |
| Display font | Fraunces (`--font-fraunces`) | Logo only |
| Heading class | `text-2xl-semi` | Page titles |
| Subheading class | `text-large-semi` | Card headings |
| Body text | `text-base-regular`, `txt-medium` | Descriptions |
| Small text | `text-small-regular`, `txt-small` | Metadata, labels |
| Accent color | `accent-700` (#8B6914) | Progress bar, active states |
| Border color | `border-gray-200` | Card borders, dividers |
| Background | `bg-white` | Card containers |
| Max width | `content-container` (1440px) | Page container |
| Responsive BP | `small: 1024px` | Desktop nav, grid columns |
| Nav link style | `font-sans tracking-wide font-medium text-black` | "Shipping" button |
| Card layout | `flex flex-col gap-y-8 w-full` | Shipment list |
| Badge pattern | `bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20` | Status badges |

---

## CJ API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /api2.0/v1/webhook/set` | Register webhook URL for LOGISTICS updates |
| `GET /api2.0/v1/logistic/trackInfo?trackNumber={n}` | Manual tracking lookup (fallback) |
| `POST /api2.0/v1/authentication/getAccessToken` | Auth token for CJ API calls |

**CJ Webhook payload structure (LOGISTICS topic):**
```json
{
  "messageId": "msg_xxx",
  "type": "LOGISTIC",
  "messageType": "UPDATE",
  "params": {
    "orderId": "CJ order ID",
    "logisticName": "CJPacket Ordinary",
    "trackingNumber": "CJ1234567890",
    "trackingUrl": "https://...",
    "trackingStatus": 5,
    "logisticsTrackEvents": [
      {
        "status": 5,
        "activity": "Departed transit hub",
        "location": "Shanghai, CN",
        "eventTime": "2026-03-20T15:45:00Z",
        "statusDesc": "First leg transportation"
      }
    ]
  }
}
```

---

## Decisions

| Decision | Rationale |
|----------|-----------|
| Standalone `/shipping` route | Accessible from main nav; auth-gated for guests rather than buried in account |
| ConvexProvider added to storefront | Enables real-time subscriptions — current storefront is HTTP-only for Convex |
| CJ webhook relays through Medusa | Medusa is deployed HTTPS on Railway; CJ requires HTTPS webhook target |
| CJ orders created manually | Admin links CJ order IDs via script; auto-creation deferred to Phase 6 |
| 7-step progress model | CJ's 15 raw codes grouped into supply-chain milestones matching FedEx/UPS patterns |
| Design matches account pages | Same fonts, colors, spacing, Tailwind classes for brand consistency |

---

## Future Considerations

### Phase 6: CJ Auto-Order Creation
Medusa order subscriber also calls CJ `POST /api2.0/v1/shopping/order/createOrderV2` to automatically place the CJ dropship order when a customer order is placed. This eliminates the manual linking step. **Recommended:** implement after tracking UI is validated.

### Email Notifications
Trigger customer emails on shipping status changes (e.g., "Your order has shipped!"). Medusa has notification infrastructure that can subscribe to Convex mutations or webhook events. **Recommended:** add as follow-up.

### ConvexProvider Scope
ConvexProvider currently wraps only the main layout content. If other features need real-time Convex data in the future (e.g., live inventory, chat), the provider can be hoisted higher. **Recommended:** keep scoped for now, expand as needed.

### Tracking Number Deep Link
Allow customers to access tracking via a direct URL like `/shipping/track?n=CJ1234567890` without needing to be authenticated (uses tracking number as lookup key). **Recommended:** add as convenience feature.
