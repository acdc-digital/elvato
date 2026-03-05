const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://neondb_owner:npg_HgrSUp6Yin7Z@ep-floral-wildflower-aiom3gle-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

c.connect().then(async () => {
  const r1 = await c.query('SELECT COUNT(*) as total FROM product_variant WHERE deleted_at IS NULL');
  console.log('Total variants:', r1.rows[0].total);

  const r2 = await c.query(`
    SELECT COUNT(DISTINCT pv.id) as with_price
    FROM product_variant pv
    JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id AND pvps.deleted_at IS NULL
    JOIN price_set ps ON ps.id = pvps.price_set_id AND ps.deleted_at IS NULL
    JOIN price p ON p.price_set_id = ps.id AND p.deleted_at IS NULL
    WHERE pv.deleted_at IS NULL
  `);
  console.log('Variants WITH price:', r2.rows[0].with_price);

  const r3 = await c.query(`
    SELECT COUNT(*) as no_price
    FROM product_variant pv
    WHERE pv.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM product_variant_price_set pvps
      JOIN price_set ps ON ps.id = pvps.price_set_id AND ps.deleted_at IS NULL
      JOIN price p ON p.price_set_id = ps.id AND p.deleted_at IS NULL
      WHERE pvps.variant_id = pv.id AND pvps.deleted_at IS NULL
    )
  `);
  console.log('Variants WITHOUT price:', r3.rows[0].no_price);

  const r4 = await c.query('SELECT COUNT(*) as total FROM product WHERE deleted_at IS NULL');
  console.log('\nTotal products:', r4.rows[0].total);

  const r5 = await c.query(`
    SELECT COUNT(DISTINCT pr.id) as products_with_prices
    FROM product pr
    JOIN product_variant pv ON pv.product_id = pr.id AND pv.deleted_at IS NULL
    JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id AND pvps.deleted_at IS NULL
    JOIN price_set ps ON ps.id = pvps.price_set_id AND ps.deleted_at IS NULL
    JOIN price p ON p.price_set_id = ps.id AND p.deleted_at IS NULL
    WHERE pr.deleted_at IS NULL
  `);
  console.log('Products WITH at least one priced variant:', r5.rows[0].products_with_prices);

  const r6 = await c.query(`
    SELECT pr.status, COUNT(*) as cnt,
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM product_variant pv
        JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id AND pvps.deleted_at IS NULL
        JOIN price_set ps ON ps.id = pvps.price_set_id AND ps.deleted_at IS NULL
        JOIN price p ON p.price_set_id = ps.id AND p.deleted_at IS NULL
        WHERE pv.product_id = pr.id AND pv.deleted_at IS NULL
      ) THEN 1 ELSE 0 END) as has_prices,
      SUM(CASE WHEN NOT EXISTS (
        SELECT 1 FROM product_variant pv
        JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id AND pvps.deleted_at IS NULL
        JOIN price_set ps ON ps.id = pvps.price_set_id AND ps.deleted_at IS NULL
        JOIN price p ON p.price_set_id = ps.id AND p.deleted_at IS NULL
        WHERE pv.product_id = pr.id AND pv.deleted_at IS NULL
      ) THEN 1 ELSE 0 END) as no_prices
    FROM product pr
    WHERE pr.deleted_at IS NULL
    GROUP BY pr.status
    ORDER BY pr.status
  `);
  console.log('\nBy status:');
  for (const row of r6.rows) {
    console.log(`  ${row.status}: ${row.cnt} total, ${row.has_prices} with prices, ${row.no_prices} without prices`);
  }

  // Also check: how many variants have a price_set but no actual price rows?
  const r7 = await c.query(`
    SELECT COUNT(DISTINCT pv.id) as has_price_set_no_price
    FROM product_variant pv
    JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id AND pvps.deleted_at IS NULL
    JOIN price_set ps ON ps.id = pvps.price_set_id AND ps.deleted_at IS NULL
    LEFT JOIN price p ON p.price_set_id = ps.id AND p.deleted_at IS NULL
    WHERE pv.deleted_at IS NULL AND p.id IS NULL
  `);
  console.log('\nVariants with price_set but NO price rows:', r7.rows[0].has_price_set_no_price);

  // Check inventory levels situation too
  const r8 = await c.query(`
    SELECT COUNT(DISTINCT pv.id) as with_inv_level
    FROM product_variant pv
    JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id AND pvii.deleted_at IS NULL
    JOIN inventory_item ii ON ii.id = pvii.inventory_item_id AND ii.deleted_at IS NULL
    JOIN inventory_level il ON il.inventory_item_id = ii.id AND il.deleted_at IS NULL
    WHERE pv.deleted_at IS NULL
  `);
  console.log('\nVariants WITH inventory_level:', r8.rows[0].with_inv_level);

  const r9 = await c.query(`
    SELECT COUNT(*) as no_inv_level
    FROM product_variant pv
    WHERE pv.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM product_variant_inventory_item pvii
      JOIN inventory_item ii ON ii.id = pvii.inventory_item_id AND ii.deleted_at IS NULL
      JOIN inventory_level il ON il.inventory_item_id = ii.id AND il.deleted_at IS NULL
      WHERE pvii.variant_id = pv.id AND pvii.deleted_at IS NULL
    )
  `);
  console.log('Variants WITHOUT inventory_level:', r9.rows[0].no_inv_level);

  await c.end();
});
