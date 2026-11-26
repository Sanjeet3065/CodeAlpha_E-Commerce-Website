const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { generateOrderNumber } = require('../utils/security');

const FREE_SHIPPING_THRESHOLD = 5000;
const STANDARD_SHIPPING_FEE = 250;
const PROMO_CODES = {
  KOBO10: 0.1,
  ATELIER15: 0.15,
};

function hydrateOrders(db, orderRows) {
  const selectItems = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC');
  return orderRows.map((order) => ({
    ...order,
    items: selectItems.all(order.id),
  }));
}

function createOrdersRouter(db) {
  const router = express.Router();

  router.use(requireAuth);

  router.get('/', (req, res) => {
    const rows = db
      .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
      .all(req.user.id);
    return res.json({ orders: hydrateOrders(db, rows) });
  });

  router.get('/:orderRef', (req, res) => {
    const ref = String(req.params.orderRef || '').trim();
    const isNumeric = /^\d+$/.test(ref);
    const row = isNumeric
      ? db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(Number(ref), req.user.id)
      : db
          .prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?')
          .get(ref, req.user.id);

    if (!row) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.json({ order: hydrateOrders(db, [row])[0] });
  });

  router.post('/', (req, res) => {
    const customerName = String(req.body?.customerName || '').trim();
    const customerEmail = String(req.body?.customerEmail || '').trim().toLowerCase();
    const customerPhone = String(req.body?.customerPhone || '').trim();
    const shippingAddress = String(req.body?.shippingAddress || '').trim();
    const city = String(req.body?.city || '').trim();
    const postalCode = String(req.body?.postalCode || '').trim();
    const country = String(req.body?.country || 'India').trim() || 'India';
    const paymentMethod = String(req.body?.paymentMethod || '').trim();
    const promoCode = String(req.body?.promoCode || '').trim().toUpperCase();

    if (customerName.length < 2) {
      return res.status(400).json({ error: 'Recipient name is required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ error: 'Valid delivery email is required.' });
    }
    if (customerPhone.length < 7) {
      return res.status(400).json({ error: 'Valid contact phone number is required.' });
    }
    if (shippingAddress.length < 5 || city.length < 2 || postalCode.length < 4) {
      return res.status(400).json({ error: 'Complete shipping address, city, and postal code are required.' });
    }
    if (!['Card', 'UPI', 'Cash on Delivery'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Please select a valid payment method.' });
    }

    const explicitItems = Array.isArray(req.body?.items) ? req.body.items : null;

    db.exec('BEGIN IMMEDIATE');
    try {
      let requestedItems = [];
      if (explicitItems && explicitItems.length > 0) {
        requestedItems = explicitItems.map((entry) => ({
          productId: Number(entry.productId),
          variant: String(entry.variant || '').trim(),
          quantity: Math.floor(Number(entry.quantity || 0)),
        }));
      } else {
        requestedItems = db
          .prepare('SELECT product_id AS productId, variant, quantity FROM cart_items WHERE user_id = ?')
          .all(req.user.id);
      }

      if (requestedItems.length === 0) {
        db.exec('ROLLBACK');
        return res.status(400).json({ error: 'Your shopping bag is empty.' });
      }

      const verifiedLines = [];
      let subtotal = 0;

      for (const reqLine of requestedItems) {
        if (!Number.isInteger(reqLine.productId) || reqLine.quantity <= 0) {
          db.exec('ROLLBACK');
          return res.status(400).json({ error: 'Invalid item quantity in order.' });
        }

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(reqLine.productId);
        if (!product) {
          db.exec('ROLLBACK');
          return res.status(404).json({ error: `Product #${reqLine.productId} no longer exists.` });
        }
        if (product.stock < reqLine.quantity) {
          db.exec('ROLLBACK');
          return res.status(400).json({
            error: `Insufficient stock for ${product.name} (${product.stock} remaining).`,
          });
        }

        const variants = JSON.parse(product.variants_json);
        const variant = variants.includes(reqLine.variant)
          ? reqLine.variant
          : variants[0] || 'Standard';

        const lineTotal = product.price * reqLine.quantity;
        subtotal += lineTotal;

        verifiedLines.push({
          product_id: product.id,
          product_name: product.name,
          product_slug: product.slug,
          product_image: product.image_url,
          variant,
          unit_price: product.price,
          quantity: reqLine.quantity,
          line_total: lineTotal,
        });
      }

      const discountRate = promoCode && PROMO_CODES[promoCode] ? PROMO_CODES[promoCode] : 0;
      const appliedPromo = discountRate > 0 ? promoCode : '';
      const discount = Math.round(subtotal * discountRate);
      const afterDiscount = subtotal - discount;
      const shippingFee = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
      const total = afterDiscount + shippingFee;

      let orderNumber = generateOrderNumber();
      while (db.prepare('SELECT id FROM orders WHERE order_number = ?').get(orderNumber)) {
        orderNumber = generateOrderNumber();
      }

      const orderResult = db
        .prepare(
          `INSERT INTO orders (
            order_number, user_id, status, customer_name, customer_email,
            customer_phone, shipping_address, city, postal_code, country,
            payment_method, promo_code, subtotal, discount, shipping_fee, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          orderNumber,
          req.user.id,
          'Confirmed',
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          city,
          postalCode,
          country,
          paymentMethod,
          appliedPromo,
          subtotal,
          discount,
          shippingFee,
          total
        );

      const orderId = Number(orderResult.lastInsertRowid);
      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_slug, product_image,
          variant, unit_price, quantity, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

      for (const line of verifiedLines) {
        insertOrderItem.run(
          orderId,
          line.product_id,
          line.product_name,
          line.product_slug,
          line.product_image,
          line.variant,
          line.unit_price,
          line.quantity,
          line.line_total
        );
        decrementStock.run(line.quantity, line.product_id);
      }

      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
      db.exec('COMMIT');

      const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      return res.status(201).json({ order: hydrateOrders(db, [created])[0] });
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore rollback error
      }
      throw err;
    }
  });

  return router;
}

module.exports = {
  createOrdersRouter,
};
