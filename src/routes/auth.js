const express = require('express');
const {
  hashPassword,
  verifyPassword,
  createSessionToken,
} = require('../utils/security');
const {
  requireAuth,
  setSessionCookie,
  clearSessionCookie,
} = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    default_address: user.default_address || '',
    created_at: user.created_at,
  };
}

function createAuthRouter(db) {
  const router = express.Router();

  const insertSession = db.prepare(`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (?, ?, datetime('now', '+7 days'))
  `);

  router.post('/register', (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const phone = String(req.body?.phone || '').trim();
    const defaultAddress = String(req.body?.default_address || '').trim();

    if (name.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = hashPassword(password);
    const result = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, phone, default_address)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(name, email, passwordHash, phone, defaultAddress);

    const userId = Number(result.lastInsertRowid);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    const { raw, tokenHash } = createSessionToken();
    insertSession.run(userId, tokenHash);
    setSessionCookie(res, raw);

    return res.status(201).json({ user: sanitizeUser(user) });
  });

  router.post('/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!EMAIL_RE.test(email) || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { raw, tokenHash } = createSessionToken();
    insertSession.run(user.id, tokenHash);
    setSessionCookie(res, raw);

    return res.json({ user: sanitizeUser(user) });
  });

  router.post('/logout', (req, res) => {
    if (req.sessionTokenHash) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.sessionTokenHash);
    }
    clearSessionCookie(res);
    return res.json({ ok: true });
  });

  router.get('/me', (req, res) => {
    return res.json({ user: req.user ? sanitizeUser(req.user) : null });
  });

  router.patch('/profile', requireAuth, (req, res) => {
    const name = String(req.body?.name ?? req.user.name).trim();
    const phone = String(req.body?.phone ?? req.user.phone ?? '').trim();
    const defaultAddress = String(
      req.body?.default_address ?? req.user.default_address ?? ''
    ).trim();

    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }

    db.prepare('UPDATE users SET name = ?, phone = ?, default_address = ? WHERE id = ?').run(
      name,
      phone,
      defaultAddress,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({ user: sanitizeUser(updated) });
  });

  return router;
}

module.exports = {
  createAuthRouter,
};
