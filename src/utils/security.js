const crypto = require('node:crypto');

const SESSION_SECRET = process.env.SESSION_SECRET || 'kobo-atelier-local-secret-change-in-prod-2026';

/**
 * Hash a plain password with a random 16-byte salt using scrypt.
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verify a plain password against a stored "salt:hash" string in constant time.
 */
function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, expectedHex] = storedHash.split(':');
  const actualBuf = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

/**
 * Generate a secure opaque session token and its SHA-256 storage digest.
 */
function createSessionToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);
  return { raw, tokenHash };
}

function hashToken(rawToken) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(String(rawToken)).digest('hex');
}

/**
 * Parse Cookie header safely into key-value pairs.
 */
function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}

/**
 * Generate a unique human-friendly order number like KBO-2611-4829.
 */
function generateOrderNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = crypto.randomInt(1000, 9999);
  return `KBO-${yy}${mm}-${rand}`;
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashToken,
  parseCookies,
  generateOrderNumber,
};
