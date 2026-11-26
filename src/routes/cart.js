const express = require('express');
const { requireAuth } = require('../middleware/auth');

function getUserCartPayload(db, userId) {
  const rows = db
    .prepare(
      `SELECT
        c.id,
        c.product_id,
        c.variant,
        c.quantity,
        p.slug,
        p.sku,
        p.name,
        p.category,
        p.price,
        p.stock,
        p.image_url
      FROM cart_items c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ?
      ORDER BY c.id ASC`
    )
    .all(userId);

  let subtotal = 0;
  let itemCount = 0;
  const items = rows.map((r) => {
    const lineTotal = r.price * r.quantity;
    subtotal += lineTotal;
    itemCount += r.quantity;
    return {
      id: r.id,
      productId: r.product_id,
      slug: r.slug,
      sku: r.sku,
      name: r.name,
      category: r.category,
      variant: r.variant,
      price: r.price,
      stock: r.stock,
      image_url: r.image_url,
      quantity: r.quantity,
      lineTotal,
    };
  });

  return { items, subtotal, itemCount };
}

function createCartRouter(db) {
  const router = express.Router();

  router.use(requireAuth);

  router.get('/', (req, res) => {
    res.json(getUserCartPayload(db, req.user.id));
  });

  router.post('/items', (req, res) => {
    const productId = Number(req.body?.productId);
    const quantity = Math.max(1, Math.floor(Number(req.body?.quantity || 1)));
    let variant = String(req.body?.variant || '').trim();

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Valid productId is required.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ error: `${product.name} is currently out of stock.` });
    }

    const variants = JSON.parse(product.variants_json);
    if (!variant || !variants.includes(variant)) {
      variant = variants[0] || 'Standard';
    }

    const existing = db
      .prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND variant = ?')
      .get(req.user.id, productId, variant);

    const newQuantity = Math.min(product.stock, (existing ? existing.quantity : 0) + quantity);

    if (existing) {
      db.prepare("UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?").run(
        newQuantity,
        existing.id
      );
    } else {
      db.prepare('INSERT INTO cart_items (user_id, product_id, variant, quantity) VALUES (?, ?, ?, ?)').run(
        req.user.id,
        productId,
        variant,
        newQuantity
      );
    }

    return res.status(200).json(getUserCartPayload(db, req.user.id));
  });

  router.patch('/items/:id', (req, res) => {
    const itemId = Number(req.params.id);
    const quantity = Math.floor(Number(req.body?.quantity));

    const item = db
      .prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?')
      .get(itemId, req.user.id);
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);
      return res.json(getUserCartPayload(db, req.user.id));
    }

    const product = db.prepare('SELECT stock, name FROM products WHERE id = ?').get(item.product_id);
    if (!product || product.stock <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);
      return res.status(400).json({ error: 'Product is out of stock.' });
    }

    const clamped = Math.min(product.stock, quantity);
    db.prepare("UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?").run(
      clamped,
      itemId
    );

    return res.json(getUserCartPayload(db, req.user.id));
  });

  router.delete('/items/:id', (req, res) => {
    const itemId = Number(req.params.id);
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(itemId, req.user.id);
    return res.json(getUserCartPayload(db, req.user.id));
  });

  router.post('/sync', (req, res) => {
    const incoming = Array.isArray(req.body?.items) ? req.body.items : [];

    db.exec('BEGIN');
    try {
      for (const entry of incoming) {
        const productId = Number(entry?.productId);
        const qty = Math.floor(Number(entry?.quantity || 0));
        if (!Number.isInteger(productId) || productId <= 0 || qty <= 0) continue;

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
        if (!product || product.stock <= 0) continue;

        const variants = JSON.parse(product.variants_json);
        let variant = String(entry?.variant || '').trim();
        if (!variant || !variants.includes(variant)) {
          variant = variants[0] || 'Standard';
        }

        const existing = db
          .prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND variant = ?')
          .get(req.user.id, productId, variant);

        const targetQty = Math.min(product.stock, Math.max(qty, existing ? existing.quantity : 0));
        if (existing) {
          db.prepare("UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?").run(
            targetQty,
            existing.id
          );
        } else {
          db.prepare(
            'INSERT INTO cart_items (user_id, product_id, variant, quantity) VALUES (?, ?, ?, ?)'
          ).run(req.user.id, productId, variant, targetQty);
        }
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    return res.json(getUserCartPayload(db, req.user.id));
  });

  return router;
}

module.exports = {
  createCartRouter,
  getUserCartPayload,
};
