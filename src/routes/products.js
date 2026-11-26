const express = require('express');

function formatProductRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    tagline: row.tagline,
    category: row.category,
    price: row.price,
    compare_at_price: row.compare_at_price,
    stock: row.stock,
    image_url: row.image_url,
    gallery: JSON.parse(row.gallery_json),
    variants: JSON.parse(row.variants_json),
    specs: JSON.parse(row.specs_json),
    description: row.description,
    featured: Boolean(row.featured),
    created_at: row.created_at,
  };
}

function createProductsRouter(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const category = (req.query.category || '').trim();
    const queryText = (req.query.q || '').trim().toLowerCase();
    const sort = (req.query.sort || 'featured').trim();
    const featuredOnly = req.query.featured === '1' || req.query.featured === 'true';

    const where = [];
    const params = [];

    if (category && category.toLowerCase() !== 'all') {
      where.push('LOWER(category) = LOWER(?)');
      params.push(category);
    }

    if (featuredOnly) {
      where.push('featured = 1');
    }

    if (queryText) {
      where.push(
        '(LOWER(name) LIKE ? OR LOWER(tagline) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ? OR LOWER(sku) LIKE ?)'
      );
      const pattern = `%${queryText}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    let orderBy = 'featured DESC, id ASC';
    if (sort === 'price_asc') orderBy = 'price ASC, id ASC';
    else if (sort === 'price_desc') orderBy = 'price DESC, id ASC';
    else if (sort === 'newest') orderBy = 'id DESC';

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = db
      .prepare(`SELECT * FROM products ${whereSql} ORDER BY ${orderBy}`)
      .all(...params);

    const categoryRows = db
      .prepare('SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY category ASC')
      .all();

    res.json({
      products: rows.map(formatProductRow),
      categories: categoryRows,
    });
  });

  router.get('/:slugOrId', (req, res) => {
    const param = String(req.params.slugOrId || '').trim();
    const isNumeric = /^\d+$/.test(param);

    const row = isNumeric
      ? db.prepare('SELECT * FROM products WHERE id = ?').get(Number(param))
      : db.prepare('SELECT * FROM products WHERE slug = ?').get(param);

    if (!row) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = formatProductRow(row);
    const relatedRows = db
      .prepare(
        'SELECT * FROM products WHERE id != ? ORDER BY CASE WHEN category = ? THEN 0 ELSE 1 END, featured DESC, id ASC LIMIT 3'
      )
      .all(product.id, product.category);

    return res.json({
      product,
      related: relatedRows.map(formatProductRow),
    });
  });

  return router;
}

module.exports = {
  createProductsRouter,
  formatProductRow,
};
