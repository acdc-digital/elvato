# Data Architecture Principles

## Principle 1: One Canonical Source For Each Data Class

Every data class must have one system of record.

- Product identity: Neon/PostgreSQL through Medusa or a dedicated PIM-owned schema.
- Commerce transactions: Neon/PostgreSQL through Medusa and marketplace order imports.
- Realtime operational state: Convex.
- Media workflow state: Convex, with durable asset URLs and final product references synchronized back to the canonical product model.
- Analytics history: reporting warehouse or analytics schema, not ad hoc JSON scattered across apps.

## Principle 2: Separate Canonical Data From Channel Projections

The master product record should not be shaped around one marketplace. Store channel-specific requirements in marketplace listing projection tables or documents.

## Principle 3: Treat Marketplace Listings As Derived Assets

A listing is not the same thing as a product. A product may have many listings, each with marketplace-specific title, category, attributes, images, price, inventory policy, and compliance state.

## Principle 4: Preserve Historical Facts

Orders, prices, inventory events, listing revisions, and supplier costs should be immutable or versioned where business decisions depend on history.

## Principle 5: AI Needs Clean Ground Truth

AI-generated titles, tags, descriptions, and enrichment should be stored as proposals with provenance, confidence, review status, and final approval state. Do not overwrite canonical fields without review/audit trails.

## Principle 6: Optimize For Operational Simplicity First

Avoid introducing an external PIM, warehouse, or ETL platform before the operating pain is real enough to justify it. Design seams so those systems can be added later.