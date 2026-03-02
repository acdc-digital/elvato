#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const dryRun = process.env.DRY_RUN === "1";

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const categoryToCollectionHandle = {
    pcat_01KF736S869NMN0XA35AA07XPM: "chandeliers",
    pcat_01KF73711R8NF7FV7BKB96PWA6: "pendants",
    pcat_01KF7375B8QDW6HP07AHYCKZQ8: "wall",
    pcat_01KF737B8B0SPRD4DV9W2RGTM8: "ceiling",
    pcat_01KF737DY59JFQDPA35FTCZ7HM: "table-floor",
    pcat_01KF737MPK7JZFATG1DBV0RBC8: "outdoor",
    pcat_01KF737PCZPCQ39EMRNTJHQT9B: "accessories",
  };

  const targetHandles = Object.values(categoryToCollectionHandle);

  const collectionsRes = await client.query(
    `select id, handle from product_collection where handle = any($1::text[])`,
    [targetHandles]
  );
  const handleToCollectionId = Object.fromEntries(
    collectionsRes.rows.map((r) => [r.handle, r.id])
  );

  const missing = targetHandles.filter((h) => !handleToCollectionId[h]);
  if (missing.length) {
    throw new Error(`Missing target collections in DB: ${missing.join(", ")}`);
  }

  const candidates = await client.query(
    `
    with target_products as (
      select p.id as product_id,
             p.collection_id,
             pcp.product_category_id,
             row_number() over (partition by p.id order by pcp.product_category_id) as rn
      from product p
      join product_category_product pcp on pcp.product_id = p.id
      where p.status = 'published'
        and (p.collection_id is null or p.collection_id not in (
          select id from product_collection where handle = any($1::text[])
        ))
        and pcp.product_category_id = any($2::text[])
    )
    select product_id, product_category_id
    from target_products
    where rn = 1
    `,
    [["Featured", ...targetHandles], Object.keys(categoryToCollectionHandle)]
  );

  const assignments = candidates.rows.map((row) => {
    const handle = categoryToCollectionHandle[row.product_category_id];
    const collectionId = handleToCollectionId[handle];
    return {
      productId: row.product_id,
      categoryId: row.product_category_id,
      handle,
      collectionId,
    };
  });

  if (assignments.length === 0) {
    console.log(JSON.stringify({ updated: 0, note: "No unmapped published products found" }, null, 2));
    await client.end();
    return;
  }

  if (!dryRun) {
    await client.query("begin");
    try {
      for (const a of assignments) {
        await client.query(
          `update product set collection_id = $2, updated_at = now() where id = $1`,
          [a.productId, a.collectionId]
        );
      }
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      throw err;
    }
  }

  const summaryRes = await client.query(
    `
    select c.handle, count(*)::int as count
    from product p
    join product_collection c on c.id = p.collection_id
    where c.handle = any($1::text[])
    group by c.handle
    order by c.handle
    `,
    [targetHandles]
  );

  const totalPublishedRes = await client.query(
    `select count(*)::int as count from product where status = 'published'`
  );

  const mappedPublishedRes = await client.query(
    `
    select count(*)::int as count
    from product p
    join product_collection c on c.id = p.collection_id
    where p.status = 'published'
      and c.handle = any($1::text[])
    `,
    [targetHandles]
  );

  console.log(
    JSON.stringify(
      {
        dryRun,
        updated: assignments.length,
        collectionBreakdown: summaryRes.rows,
        publishedTotal: totalPublishedRes.rows[0].count,
        publishedInHomepageCollections: mappedPublishedRes.rows[0].count,
      },
      null,
      2
    )
  );

  await client.end();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
