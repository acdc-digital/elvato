Advanced configuration
This page documents all configuration options for ConvexFS, including storage backend settings, URL TTLs, and garbage collection tuning.

ConvexFS constructor options
When creating a ConvexFS instance, you pass an options object with the following properties:

const fs = new ConvexFS(components.fs, {
  storage: {
    type: "bunny",
    apiKey: process.env.BUNNY_API_KEY!,
    storageZoneName: process.env.BUNNY_STORAGE_ZONE!,
    cdnHostname: process.env.BUNNY_CDN_HOSTNAME!,
    tokenKey: process.env.BUNNY_TOKEN_KEY,
    region: "ny",
  },
  downloadUrlTtl: 3600,
  blobGracePeriod: 86400,
});

storage (required)
Configuration for the storage backend. ConvexFS supports Bunny.net Edge Storage and an in-memory test backend for use with convex-test.

Bunny.net storage options
Option	Type	Required	Description
type	string	Yes	Must be "bunny"
apiKey	string	Yes	Your Bunny.net Edge Storage API key (from the FTP & API Access panel)
storageZoneName	string	Yes	Name of your storage zone
cdnHostname	string	Yes	CDN hostname for downloads (e.g., "myzone.b-cdn.net" or a custom domain)
tokenKey	string	No	Token authentication key for signed CDN URLs. Strongly recommended even for public zones, as token generation is very inexpensive.
region	string	No	Storage zone region code. Leave empty for Frankfurt (default). See Bunny.net storage endpoints for available regions: uk, ny, la, sg, se, br, jh, syd
Tip

See Storage/CDN Setup for a walkthrough of finding these values in the Bunny.net dashboard.

downloadUrlTtl (optional)
Time-to-live for signed download URLs, in seconds.

Type	Default	Description
number	3600	How long signed CDN URLs remain valid (1 hour)
Shorter TTLs improve security by reducing the window where a leaked or revoked URL can still be used. Longer TTLs improve user experience for media playback and reduce load on your Convex backend.

See Authn & Authz for security considerations.

blobGracePeriod (optional)
Grace period before orphaned blobs are permanently deleted, in seconds.

Type	Default	Description
number	86400	How long to keep orphaned blobs before GC (24 hours)
This is your recovery window for accidental deletions. During this period, you can restore deleted files using their blobId.

See Garbage collection for details on how this works with the background GC jobs.

HTTP route options
When calling registerRoutes(), you configure the HTTP endpoints for uploads and downloads:

registerRoutes(http, components.fs, fs, {
  pathPrefix: "/fs",
  uploadAuth: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
  downloadAuth: async (ctx, blobId) => {
    return true; // Public downloads
  },
});

pathPrefix (optional)
Type	Default	Description
string	"/fs"	URL path prefix for upload/download routes
The component registers two routes under this prefix:

POST {pathPrefix}/upload — Upload endpoint
GET {pathPrefix}/blobs/{blobId} — Download redirect endpoint
uploadAuth (required)
Authentication callback for uploads. Called before any upload is accepted.

uploadAuth: async (ctx: HttpActionCtx) => Promise<boolean>;

Return true to allow the upload, false to reject with a 401 response.

See Authn & Authz for details.

downloadAuth (required)
Authentication callback for downloads. Called before redirecting to a signed CDN URL.

downloadAuth: async (
  ctx: HttpActionCtx,
  blobId: string,
  path?: string,
  extraParams?: Record<string, string>,
) => Promise<boolean>;

Parameter	Type	Description
ctx	HttpActionCtx	The HTTP action context
blobId	string	The blob ID being requested
path	string | undefined	The file path, if provided in the download URL
extraParams	Record<string, string> | undefined	Any extra query parameters from the request (see CDN parameters)
Return true to allow the download, false to reject with a 403 response.

See Authn & Authz for details.

Multiple filesystems
You can mount multiple ConvexFS instances in the same project. This is useful when you need different storage configurations—for example, separate zones for user uploads vs. static assets with different access control rules, or different retention policies.

1. Mount the component multiple times
In your convex.config.ts, mount the component with different names:

import { defineApp } from "convex/server";
import fs from "convex-fs/convex.config.js";

const app = defineApp();
app.use(fs, { name: "userFiles" });
app.use(fs, { name: "staticAssets" });

export default app;

2. Create separate ConvexFS instances
Create a file for each filesystem with its own configuration:

convex/userFiles.ts
import { ConvexFS } from "convex-fs";
import { components } from "./_generated/api";

export const userFiles = new ConvexFS(components.userFiles, {
  storage: {
    type: "bunny",
    apiKey: process.env.USER_FILES_BUNNY_API_KEY!,
    storageZoneName: process.env.USER_FILES_STORAGE_ZONE!,
    cdnHostname: process.env.USER_FILES_CDN_HOSTNAME!,
  },
  blobGracePeriod: 604800, // 7 days for user content
});

convex/staticAssets.ts
import { ConvexFS } from "convex-fs";
import { components } from "./_generated/api";

export const staticAssets = new ConvexFS(components.staticAssets, {
  storage: {
    type: "bunny",
    apiKey: process.env.STATIC_BUNNY_API_KEY!,
    storageZoneName: process.env.STATIC_STORAGE_ZONE!,
    cdnHostname: process.env.STATIC_CDN_HOSTNAME!,
  },
  blobGracePeriod: 86400, // 24 hours for static assets
});

3. Register routes for each filesystem
Mount each filesystem at a different path prefix:

convex/http.ts
import { httpRouter } from "convex/server";
import { registerRoutes } from "convex-fs";
import { components } from "./_generated/api";
import { userFiles } from "./userFiles";
import { staticAssets } from "./staticAssets";

const http = httpRouter();

registerRoutes(http, components.userFiles, userFiles, {
  pathPrefix: "/user-files",
  uploadAuth: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
  downloadAuth: async (ctx, blobId) => {
    // Check user has access to this blob
    return true;
  },
});

registerRoutes(http, components.staticAssets, staticAssets, {
  pathPrefix: "/static",
  uploadAuth: async (ctx) => {
    // Only admins can upload static assets
    const identity = await ctx.auth.getUserIdentity();
    return identity?.role === "admin";
  },
  downloadAuth: async () => true, // Public access
});

export default http;

Tip

Each filesystem instance is completely independent—they have separate database tables, separate GC jobs, and separate configuration. Files in one filesystem cannot reference blobs from another.

Technically, multiple ConvexFS instances can share the same backing Bunny.net storage zone, since each instance manages its own subset of blobs independently and the UUIDv4 blob IDs make collisions virtually impossible. This lets you have multiple logical filesystems without setting up multiple storage zones.

