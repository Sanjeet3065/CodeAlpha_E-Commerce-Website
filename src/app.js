const path = require('node:path');
const express = require('express');
const { initDatabase } = require('./db/database');
const { attachUser } = require('./middleware/auth');
const { createProductsRouter } = require('./routes/products');
const { createAuthRouter } = require('./routes/auth');
const { createCartRouter } = require('./routes/cart');
const { createOrdersRouter } = require('./routes/orders');

function createApp(options = {}) {
  const db = initDatabase(options.dbPath);
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(attachUser(db));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', store: 'KOBO Objects' });
  });

  app.use('/api/products', createProductsRouter(db));
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/cart', createCartRouter(db));
  app.use('/api/orders', createOrdersRouter(db));

  // Keep authenticated users inside their member workspace rather than the guest homepage
  app.get(['/', '/index.html', '/auth', '/auth.html'], (req, res, next) => {
    if (req.user) {
      const requested = String(req.query.redirect || '').trim();
      const target =
        requested.startsWith('/') && !requested.startsWith('//') ? requested : '/account.html';
      return res.redirect(target);
    }
    return next();
  });

  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir, { extensions: ['html'] }));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Unexpected server error.' });
  });

  return { app, db };
}

module.exports = {
  createApp,
};
