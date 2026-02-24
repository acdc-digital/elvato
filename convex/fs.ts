import { ConvexFS } from "convex-fs";
import { components } from "./_generated/api";

// ConvexFS instance backed by Bunny.net Edge Storage + CDN
// Env vars must be set in the Convex dashboard:
//   BUNNY_API_KEY, BUNNY_STORAGE_ZONE, BUNNY_CDN_HOSTNAME, BUNNY_TOKEN_KEY
//   (and optionally BUNNY_REGION if not using Frankfurt)
export const fs = new ConvexFS(components.fs, {
  storage: {
    type: "bunny",
    apiKey: process.env.BUNNY_API_KEY!,
    storageZoneName: process.env.BUNNY_STORAGE_ZONE!,
    region: process.env.BUNNY_REGION,
    cdnHostname: process.env.BUNNY_CDN_HOSTNAME!,
    tokenKey: process.env.BUNNY_TOKEN_KEY,
  },
});
