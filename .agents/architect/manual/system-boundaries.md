# System Boundaries

## Neon PostgreSQL

Recommended role: durable transactional system of record.

Belongs in Neon:

- Products
- Variants
- Categories
- Collections
- Attributes/specifications
- Suppliers
- Warehouses/stock locations
- Inventory positions and inventory movements
- Prices and price history
- Marketplace account/listing mappings
- Orders, order lines, fulfillments, returns, refunds
- Channel synchronization state
- Audit/history tables where relational consistency matters

## Convex

Recommended role: realtime workflow and operational application layer.

Belongs in Convex:

- Realtime UI state
- Operational workflows
- Activity feeds
- Notifications
- Image pipeline state
- Human review queues
- Temporary marketplace candidate review state
- AI proposal/review workflow state where realtime collaboration matters

## MeiliSearch

Recommended role: derived search index.

MeiliSearch should never be the source of truth. Rebuild it from canonical product/listing data.

## Marketplace APIs

Recommended role: external channel systems.

Marketplace data should be imported, normalized, and reconciled. Do not let marketplace payloads become the internal canonical product model.