#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const POSTS_FILE = path.join(REPO_ROOT, "storefront", "src", "content", "leditorial", "posts.json");

function loadEnv() {
  for (const rel of [".env.local", ".env", "storefront/.env.local"]) {
    const file = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(file)) continue;

    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    convexUrl: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (arg === "--convex-url") {
      args.convexUrl = argv[++i];
      if (!args.convexUrl) throw new Error("--convex-url requires a URL");
      continue;
    }
    if (arg === "--help") {
      console.log([
        "Usage: node scripts/blog/sync-leditorial-posts.mjs [--dry-run] [--convex-url URL]",
        "",
        "Uploads storefront/src/content/leditorial/posts.json into the Convex blogPosts table.",
      ].join("\n"));
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function readPosts() {
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, "utf8"));
  if (!Array.isArray(posts)) {
    throw new Error("storefront/src/content/leditorial/posts.json must be an array");
  }

  return posts.map((post) => ({
    ...post,
    status: post.status || "published",
  }));
}

loadEnv();

const args = parseArgs(process.argv);
const posts = readPosts();
const convexUrl =
  args.convexUrl || process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing Convex URL. Set CONVEX_URL, NEXT_PUBLIC_CONVEX_URL, or pass --convex-url.");
}

console.log(`Loaded ${posts.length} LED-itorial posts from ${path.relative(REPO_ROOT, POSTS_FILE)}`);

if (args.dryRun) {
  for (const post of posts) {
    console.log(`dry-run ${post.slug} (${post.status})`);
  }
  process.exit(0);
}

const convex = new ConvexHttpClient(convexUrl);
const results = await convex.mutation(api.blog.batchUpsert, { posts });

for (const result of results) {
  console.log(`${result.action} ${result.slug}`);
}

console.log(`Synced ${results.length} LED-itorial posts to Convex.`);