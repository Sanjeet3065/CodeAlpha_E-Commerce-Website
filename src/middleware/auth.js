const { parseCookies, hashToken } = require('../utils/security');

const SESSION_COOKIE_NAME = 'kobo_session';

/**
 * Middleware that resolves the currently authenticated user from the session cookie.
 */
function attachUser(db) {
  const selectSessionStmt = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.default_address,
      u.created_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND datetime(s.expires_at) > datetime('now')
    LIMIT 1
  `);

  return function authMiddleware(req, _res, next) {
    req.user = null;
    const cookies = parseCookies(req.headers.cookie);
    const rawToken = cookies[SESSION_COOKIE_NAME];
    if (!rawToken) return next();

    try {
      const tokenHash = hashToken(rawToken);
      const user = selectSessionStmt.get(tokenHash);
      if (user) {
        req.user = user;
        req.sessionTokenHash = tokenHash;
      }
    } catch {
      req.user = null;
    }
    next();
  };
}

/**
 * Guard middleware for protected endpoints.
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  return next();
}

function setSessionCookie(res, rawToken) {
  const maxAgeSeconds = 7 * 24 * 60 * 60;
  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

module.exports = {
  SESSION_COOKIE_NAME,
  attachUser,
  requireAuth,
  setSessionCookie,
  clearSessionCookie,
};
