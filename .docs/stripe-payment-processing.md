# Stripe Payment Processing — Elvato

**Provider:** Stripe  
**Mode:** Test (sandbox `elvato-storefront`)  
**Provider ID:** `pp_stripe_stripe`  
**Capture mode:** Auto-capture (charge on order placement)  
**Webhook endpoint:** `https://medusa-backend-production-d681.up.railway.app/hooks/payment/stripe_stripe`  
**Status:** ✅ Configured  
**Last verified:** February 2026

---

## Architecture Overview

Stripe payment processing spans three layers: the Medusa backend (Payment Module), the storefront (Stripe Elements UI), and Stripe's API. The backend holds the secret key and manages payment intents; the storefront holds the publishable key and renders the card input.

```
┌──────────────────────────┐         ┌──────────────────────────┐
│  Storefront (Vercel)     │         │  Stripe API              │
│  Next.js 15              │         │                          │
│                          │         │  PaymentIntents           │
│  NEXT_PUBLIC_STRIPE_KEY  │────────▶│  Webhooks                │
│  (pk_test_...)           │         │  Customer/Payment Methods│
│                          │         │                          │
│  @stripe/react-stripe-js │         └──────────┬───────────────┘
│  @stripe/stripe-js       │                    │
└──────────┬───────────────┘                    │ Webhook POST
           │ API calls                          │
           ▼                                    ▼
┌──────────────────────────────────────────────────────────────┐
│  Medusa Backend (Railway)                                    │
│                                                              │
│  Payment Module:  @medusajs/medusa/payment                   │
│  Stripe Provider: @medusajs/medusa/payment-stripe            │
│                                                              │
│  STRIPE_API_KEY          (sk_test_...)                        │
│  STRIPE_WEBHOOK_SECRET   (whsec_...)                         │
│                                                              │
│  Webhook route: /hooks/payment/stripe_stripe                 │
└──────────────────────────────────────────────────────────────┘
```

### Payment Flow

```
1. Customer selects Stripe at checkout
       │
2. Storefront calls initiatePaymentSession() → Medusa API
       │
3. Medusa creates PaymentIntent via Stripe API → returns client_secret
       │
4. Storefront renders Stripe CardElement with client_secret
       │
5. Customer enters card details → Stripe.js handles PCI-compliant tokenization
       │
6. Storefront calls stripe.confirmCardPayment(client_secret)
       │
7. Stripe processes → returns succeeded / requires_action / failed
       │
8. If succeeded → storefront calls cart.complete() → Medusa creates order
       │
9. Stripe sends webhook (payment_intent.succeeded) → Medusa confirms
```

---

## Configuration

### Backend — `admin/medusa-config.ts`

The Stripe Module Provider is registered in the `modules` array of the Medusa config:

```typescript
{
  resolve: "@medusajs/medusa/payment",
  options: {
    providers: [
      {
        resolve: "@medusajs/medusa/payment-stripe",
        id: "stripe",
        options: {
          apiKey: process.env.STRIPE_API_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
          capture: true,
        },
      },
    ],
  },
},
```

| Option | Value | Purpose |
|--------|-------|---------|
| `apiKey` | `STRIPE_API_KEY` env var | Stripe Secret Key — authenticates server-side API calls |
| `webhookSecret` | `STRIPE_WEBHOOK_SECRET` env var | Validates webhook signatures from Stripe |
| `capture` | `true` | Auto-captures payment on authorization (no manual capture step) |

### Environment Variables

**Backend (Railway + local `admin/.env`):**

| Variable | Value | Scope |
|----------|-------|-------|
| `STRIPE_API_KEY` | `sk_test_...` | Railway env vars + local `.env` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Railway env vars + local `.env` |

**Storefront (Vercel + local `storefront/.env.local`):**

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_STRIPE_KEY` | `pk_test_...` | Vercel env vars + local `.env.local` |

### Region Configuration

Stripe is enabled as a payment provider in two regions via the Medusa Admin dashboard:

| Region | Countries | Payment Provider |
|--------|-----------|-----------------|
| US | United States | Stripe (`pp_stripe_stripe`) |
| Europe | Denmark, France, Germany, Italy, Spain, Sweden, UK | Stripe (`pp_stripe_stripe`) |

To enable Stripe in a region: **Settings → Regions → [Region] → Edit → Payment Providers → Select Stripe → Save**

---

## Stripe Provider IDs

When you register the Stripe Module Provider with `id: "stripe"`, Medusa registers multiple payment providers under the format `pp_{identifier}_{id}`:

| Provider | ID | Use Case |
|----------|----|----------|
| **Basic Card Payment** | `pp_stripe_stripe` | ✅ Currently enabled |
| Bancontact | `pp_stripe-bancontact_stripe` | Belgium |
| BLIK | `pp_stripe-blik_stripe` | Poland |
| giropay | `pp_stripe-giropay_stripe` | Germany |
| iDEAL | `pp_stripe-ideal_stripe` | Netherlands |
| Przelewy24 | `pp_stripe-przelewy24_stripe` | Poland |
| PromptPay | `pp_stripe-promptpay_stripe` | Thailand |
| OXXO | `pp_stripe-oxxo_stripe` | Mexico |

Additional methods can be enabled per-region in the Medusa Admin dashboard without code changes.

---

## Webhook Setup

### Endpoint

```
POST https://medusa-backend-production-d681.up.railway.app/hooks/payment/stripe_stripe
```

Medusa provides this route out-of-the-box. The URL format is `/hooks/payment/{identifier}_{id}`.

### Subscribed Events

| Event | Purpose |
|-------|---------|
| `payment_intent.amount_capturable_updated` | Payment authorized and ready for capture |
| `payment_intent.succeeded` | Payment captured successfully |
| `payment_intent.payment_failed` | Payment failed |
| `payment_intent.partially_funded` | Partial payment received |

### Webhook Processing

When Medusa receives a webhook:

1. Validates the signature using `STRIPE_WEBHOOK_SECRET`
2. Delegates to the Stripe provider's `getWebhookActionAndData` method
3. If action is `authorized` → sets payment session to authorized
4. If action is `captured` → sets payment session to captured
5. If the associated cart is not yet completed → completes the cart automatically

This ensures orders are created even if the customer's browser session was interrupted.

---

## Storefront Implementation

The storefront's Stripe integration is fully built into the Next.js starter. No custom code was written — all components are part of the existing checkout flow.

### Key Files

| File | Purpose |
|------|---------|
| `storefront/src/modules/checkout/components/payment-wrapper/index.tsx` | Loads Stripe.js, creates the `stripePromise`, wraps checkout in Stripe `Elements` provider |
| `storefront/src/modules/checkout/components/payment-wrapper/stripe-wrapper.tsx` | Provides `Elements` context with `clientSecret` from payment session |
| `storefront/src/modules/checkout/components/payment/index.tsx` | Payment method selection UI, calls `initiatePaymentSession()` for Stripe providers |
| `storefront/src/modules/checkout/components/payment-button/index.tsx` | `StripePaymentButton` — calls `stripe.confirmCardPayment()`, handles 3DS, calls `placeOrder()` on success |
| `storefront/src/modules/checkout/components/payment-container/index.tsx` | `StripeCardContainer` — renders the Stripe `CardElement` input |
| `storefront/src/lib/constants.tsx` | Maps `pp_stripe_stripe` → "Credit card", provides `isStripeLike()` helper |
| `storefront/src/lib/data/cart.ts` | `initiatePaymentSession()` — creates payment session via Medusa SDK |
| `storefront/src/lib/data/payment.ts` | `listCartPaymentMethods()` — fetches available providers per region |

### How the Storefront Detects Stripe

```typescript
// storefront/src/lib/constants.tsx
export const isStripeLike = (providerId?: string) =>
  providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
```

Any provider ID starting with `pp_stripe_` triggers the Stripe UI path (Elements wrapper, CardElement, confirmCardPayment flow).

### Payment Session Initialization

When a customer selects Stripe, the storefront calls:

```typescript
await initiatePaymentSession(cart, { provider_id: "pp_stripe_stripe" })
```

Medusa creates a Stripe PaymentIntent and returns the `client_secret` in the payment session's `data` property. The `StripeWrapper` component reads this and passes it to Stripe `Elements`:

```typescript
const options: StripeElementsOptions = {
  clientSecret: paymentSession.data.client_secret as string
}
```

### Card Confirmation and Order Placement

`StripePaymentButton` calls `stripe.confirmCardPayment(clientSecret, { payment_method: { card, billing_details } })`. On success (`requires_capture` or `succeeded`), it calls `placeOrder()` which completes the cart via Medusa's API.

3D Secure (SCA) is handled automatically — if the card requires authentication, Stripe's SDK shows the 3DS modal. The existing code handles both `requires_capture` and `succeeded` statuses.

---

## Testing

### Test Card Numbers

| Card | Number | Behavior |
|------|--------|----------|
| Visa (success) | `4242 4242 4242 4242` | Payment succeeds |
| Visa (3DS required) | `4000 0025 0000 3155` | Triggers 3D Secure authentication |
| Visa (declined) | `4000 0000 0000 0002` | Payment declined |
| Visa (insufficient funds) | `4000 0000 0000 9995` | Insufficient funds error |

Use any future expiry date. Use any 3-digit CVC. Use any 5-digit ZIP code.

### Verification Checklist

- [ ] Medusa Admin → Settings → Regions → Stripe visible as payment provider
- [ ] Storefront checkout → Stripe card input renders on payment step
- [ ] Test card `4242 4242 4242 4242` → order placed successfully
- [ ] Stripe Dashboard → Payments → test payment visible
- [ ] Stripe Dashboard → Webhooks → endpoint shows successful deliveries
- [ ] 3DS test card `4000 0025 0000 3155` → authentication modal appears → order placed

---

## Switching to Live Mode

When ready to accept real payments:

1. **Toggle Stripe Dashboard to Live mode** → copy **live** API keys
2. **Update Railway env vars:**
   - `STRIPE_API_KEY=sk_live_...`
   - Create a **new webhook endpoint** in live mode with the same URL and events → update `STRIPE_WEBHOOK_SECRET=whsec_...`
3. **Update Vercel env vars:**
   - `NEXT_PUBLIC_STRIPE_KEY=pk_live_...`
4. **Redeploy both services**

> **Important:** Test and live mode are completely separate in Stripe. Webhook endpoints, API keys, customers, and payments do not cross between modes.

---

## Future Enhancements

### Apple Pay / Google Pay

Enable by adding `automatic_payment_methods: true` to the Stripe provider options in `medusa-config.ts`. Requires domain verification with Stripe (registering your domain in the Stripe Dashboard under Settings → Payment methods).

### Saved Payment Methods

Allow returning customers to reuse cards. Requires:

1. Passing `data: { setup_future_usage: "off_session" }` in `initiatePaymentSession()` calls in the storefront payment component
2. Creating an API route in admin to list saved payment methods via `paymentModuleService.listPaymentMethods()`
3. Adding UI in the storefront checkout to select from saved cards

See `.medusa/payment/savePaymentMethod.md` for the full tutorial.

### Additional European Payment Methods

Enable iDEAL, giropay, Bancontact, etc. per-region in the Medusa Admin dashboard. The storefront already has UI mapping for these in `storefront/src/lib/constants.tsx`. Each method has its own webhook URL (e.g., `/hooks/payment/stripe-ideal_stripe`) — add the corresponding webhook endpoint in Stripe if you enable any.

### Manual Capture

To switch from auto-capture to manual capture (authorize first, capture later from admin):

1. Set `capture: false` in the Stripe provider options in `medusa-config.ts`
2. Payments will be authorized but not captured — capture manually via Medusa Admin → Orders → [Order] → Payment → Capture

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| No payment providers shown at checkout | Stripe not enabled in the region | Medusa Admin → Settings → Regions → Edit → add Stripe |
| "Stripe key missing" error in storefront | `NEXT_PUBLIC_STRIPE_KEY` empty or not set | Set the publishable key in `.env.local` / Vercel env vars |
| Card input doesn't render | `client_secret` missing from payment session | Verify `STRIPE_API_KEY` is correct on the backend |
| Payment succeeds but no order created | Webhook not configured or failing | Check Stripe Dashboard → Webhooks → recent deliveries for errors |
| Webhook signature validation fails | Wrong `STRIPE_WEBHOOK_SECRET` | Re-copy the signing secret from Stripe Dashboard |
| CORS errors during checkout | Storefront domain not in `STORE_CORS` | Add the Vercel domain to `STORE_CORS` on Railway |
| "Payment intent requires action" | Card requires 3D Secure | Expected behavior — Stripe.js handles the 3DS modal automatically |
