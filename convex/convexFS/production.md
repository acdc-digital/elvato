Prod & dev environments
The challenge
Convex gives you flexible development environments for each team member, preview environments for every CI run, and production environments. Each of these needs access to blob storage—but setting up separate Bunny.net deployments for all of them is a pain.

Recommended setup
We recommend a two-tier approach:

One shared Bunny.net zone for dev/CI — Shared across all non-production environments
One locked-down Bunny.net zone for production — Dedicated to your production deployment, with access restricted to project admins
1. Create a shared dev/CI storage zone
Set up a Bunny.net storage zone for development and CI use. This zone will be shared across all your team’s dev environments and CI preview deployments.

Since these environments are ephemeral and don’t contain real user data, this zone doesn’t need the same level of access control as production. You can also replicate to fewer regions and use a slower/cheaper storage tier to save money.

2. Set project environment variable defaults
In your Convex dashboard, go to Project Settings and configure the dev/CI credentials as project environment variable defaults. Set defaults for:

BUNNY_API_KEY
BUNNY_STORAGE_ZONE
BUNNY_CDN_HOSTNAME
BUNNY_TOKEN_KEY
All new deployments (dev environments, preview deployments) will automatically use these credentials. Each deployment gets its own independent filesystem view (separate database tables), but they all share the same underlying blob storage.

3. Create a production storage zone
Set up a separate Bunny.net storage zone for production. Restrict access to the API credentials—only project admins should have access to the production storage zone settings.

4. Override environment variables for production
In the Convex dashboard, override the environment variables specifically for your production deployment with the production Bunny.net credentials.

This keeps your production data completely isolated from dev/CI.

Caveats
Caution

Because dev and CI deployments are ephemeral, soft-deleted blobs may be abandoned in the shared storage zone. The GC jobs run per-deployment, so when a deployment is torn down, its orphaned blobs are never cleaned up.

This isn’t a big deal—storage is cheap—but periodically wiping and rotating the dev/CI storage zone will keep costs manageable. You might do this quarterly or whenever the zone grows uncomfortably large.