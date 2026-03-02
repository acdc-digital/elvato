#!/usr/bin/env node
import fs from "fs";

const base = "https://medusa-backend-production-d681.up.railway.app";
const handles = [
  "Featured",
  "chandeliers",
  "pendants",
  "ceiling",
  "wall",
  "table-floor",
  "outdoor",
  "accessories",
];

const env = fs.readFileSync("storefront/.env.local", "utf8");
const pkLine = env.split(/\r?\n/).find((l) => l.startsWith("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="));
const pk = pkLine?.split("=")[1]?.trim();

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "x-publishable-api-key": pk } });
  const json = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}: ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

const collectionsRes = await fetchJson(`${base}/store/collections?limit=200&fields=id,handle,title`);
const collections = collectionsRes.collections || [];

const selected = handles
  .map((h) => collections.find((c) => c.handle === h))
  .filter(Boolean);

const rows = [];
let sum = 0;
const uniqueIds = new Set();

for (const c of selected) {
  const res = await fetchJson(`${base}/store/products?limit=100&collection_id%5B0%5D=${c.id}`);
  sum += res.count || 0;
  for (const p of res.products || []) uniqueIds.add(p.id);
  rows.push({ handle: c.handle, id: c.id, count: res.count || 0 });
}

console.log(JSON.stringify({
  selectedCollections: rows,
  sumCounts: sum,
  uniqueAcrossCollectionsFromFirst100Each: uniqueIds.size,
}, null, 2));
