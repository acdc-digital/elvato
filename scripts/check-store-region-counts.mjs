#!/usr/bin/env node
import fs from "fs";

const base = "https://medusa-backend-production-d681.up.railway.app";
const env = fs.readFileSync("storefront/.env.local", "utf8");
const pkLine = env.split(/\r?\n/).find((l) => l.startsWith("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="));
const pk = pkLine?.split("=")[1]?.trim();

if (!pk) {
  throw new Error("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY not found in storefront/.env.local");
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 300)}`);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}

const regions = await fetchJson(`${base}/store/regions`, { "x-publishable-api-key": pk });
const usRegion = (regions.regions || []).find((r) => (r.countries || []).some((c) => c.iso_2 === "us"));
const euRegion = (regions.regions || []).find((r) => (r.countries || []).some((c) => c.iso_2 === "de"));

const noRegion = await fetchJson(`${base}/store/products?limit=1`, { "x-publishable-api-key": pk });
const us = usRegion
  ? await fetchJson(`${base}/store/products?limit=1&region_id=${usRegion.id}`, { "x-publishable-api-key": pk })
  : { count: null };
const eu = euRegion
  ? await fetchJson(`${base}/store/products?limit=1&region_id=${euRegion.id}`, { "x-publishable-api-key": pk })
  : { count: null };

console.log(
  JSON.stringify(
    {
      noRegionCount: noRegion.count,
      usRegionId: usRegion?.id,
      usCount: us.count,
      euRegionId: euRegion?.id,
      euCount: eu.count,
    },
    null,
    2
  )
);
