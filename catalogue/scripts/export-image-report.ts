#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Export Products Needing Images Report
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const client = new ConvexHttpClient(CONVEX_URL);

async function run() {
  // Get summary stats
  const summary = await client.query(api.variantMapping.getVariantMappingSummary, {});
  
  // Get products needing images
  const needingImages = await client.query(api.variantMapping.getProductsNeedingImages, {
    limit: 100,
  });
  
  // Calculate tiers
  const critical = needingImages.filter(p => p.missingImages >= 10);
  const high = needingImages.filter(p => p.missingImages >= 5 && p.missingImages < 10);
  const medium = needingImages.filter(p => p.missingImages >= 2 && p.missingImages < 5);
  const low = needingImages.filter(p => p.missingImages === 1);
  
  console.log("=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
  
  console.log("\n=== PRIORITY TIERS ===");
  console.log("Critical (10+):", critical.length);
  console.log("High (5-9):", high.length);
  console.log("Medium (2-4):", medium.length);
  console.log("Low (1):", low.length);
  
  console.log("\n=== TOP 20 PRODUCTS NEEDING IMAGES ===");
  const top20 = needingImages.slice(0, 20).map(p => ({
    title: p.title,
    cjProductId: p.cjProductId,
    totalVariants: p.totalVariants,
    physicalVariants: p.physicalVariants,
    requiredImages: p.requiredImages,
    currentImages: p.currentImages,
    missingImages: p.missingImages,
    imageCoverage: p.imageCoverage,
    physicalOptions: p.physicalOptions.map(o => `${o.name}: ${o.values.slice(0, 3).join(", ")}${o.values.length > 3 ? "..." : ""}`).join(" | "),
  }));
  console.log(JSON.stringify(top20, null, 2));
  
  console.log("\n=== ALL PRODUCTS (for report) ===");
  const all = needingImages.map(p => ({
    title: p.title,
    cjProductId: p.cjProductId,
    missingImages: p.missingImages,
    requiredImages: p.requiredImages,
    currentImages: p.currentImages,
    imageCoverage: p.imageCoverage,
  }));
  console.log(JSON.stringify(all, null, 2));
}

run().catch(console.error);
