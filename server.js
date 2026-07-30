const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const db = require('./database');

const app = express();

const helmet = require('helmet');
const compression = require('compression');

// PRODUCTION-FIX: Security & Headers
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for now to avoid breaking Vite inline scripts if any
}));
app.use(compression());
app.use(cors({ origin: 'same-origin' })); // Only allow self
app.use(express.json({ limit: '10mb' }));

// PRODUCTION-FIX: Static Asset Caching (1 day for assets, no-cache for HTML)
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    }
  }
}));

// ---------------------------------------------------------------------------
// Authentication Middleware
// ---------------------------------------------------------------------------
// SEC-2 FIX: Use crypto.timingSafeEqual for PIN comparison to prevent
// statistical timing-side-channel attacks that can reveal correct prefixes.
function timingSafeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  // Buffers must be same length for timingSafeEqual; if lengths differ they
  // cannot be equal, but we still perform a dummy comparison to avoid
  // short-circuiting that leaks the length.
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA); // consume constant time
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

const requireAuth = (req, res, next) => {
  const pin = req.header('X-Auth-PIN');
  if (!pin) {
    return res.status(401).json({ error: 'Unauthorized: Missing PIN' });
  }

  const config = db.getConfig() || {};

  // SEC-1 FIX: Do NOT fall back to hardcoded default credentials. If the
  // application has not been configured with a PIN, refuse authentication.
  // A fresh install must complete setup before any protected route is accessible.
  const adminPin = config.adminPin;
  const devPin = config.devPin;

  if (!adminPin && !devPin) {
    return res.status(503).json({ error: 'Server not configured. Please set admin credentials.' });
  }

  if (adminPin && timingSafeCompare(pin, adminPin)) {
    req.userRole = 'admin';
    return next();
  }
  if (devPin && timingSafeCompare(pin, devPin)) {
    req.userRole = 'dev';
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Invalid PIN' });
};

// ---------------------------------------------------------------------------
// Centralized Error Handler Wrapper
// ---------------------------------------------------------------------------
// NOTE: better-sqlite3 is fully synchronous — all DB calls are blocking and
// never return Promises, so a plain try/catch wrapper is correct and complete.
const catchErrors = fn => (req, res, next) => {
  try {
    fn(req, res, next);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Contact Validation
// ---------------------------------------------------------------------------
// PERF-1 NOTE: This performs an in-memory full table scan for uniqueness.
// For small phonebooks this is acceptable. If the dataset grows significantly
// this should be replaced with a SQL uniqueness check via a filtered SELECT.
function validateContact(contactData, config, currentId = null) {
  const fields = config.fields || [];
  const contacts = db.getContacts();

  for (const field of fields) {
    const val = contactData[field.id];

    if (field.required && (val === undefined || val === null || val === '')) {
      return { valid: false, error: `Field '${field.label}' is required.` };
    }

    if (field.unique && val !== undefined && val !== null && val !== '') {
      const duplicate = contacts.find(c =>
        String(c[field.id]).toLowerCase() === String(val).toLowerCase() &&
        String(c.id) !== String(currentId)
      );
      if (duplicate) {
        return { valid: false, error: `Field '${field.label}' must be unique. '${val}' already exists.` };
      }
    }
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// Healthcheck endpoint for orchestrators (e.g. Docker, Kubernetes, Load Balancers)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// PRODUCTION-FIX: PIN Brute-Force Protection
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 failed requests per windowMs
  skipSuccessfulRequests: true, // Only count failed requests!
  message: { error: 'Too many login attempts, please try again later.' }
});

// Auth check endpoint
app.post('/api/auth', authLimiter, requireAuth, (req, res) => {
  res.json({ success: true, role: req.userRole });
});

// Public read endpoint — the directory is meant for anonymous access.
// Authentication is only required for write operations (add, edit, delete).
app.get('/api/contacts', catchErrors((req, res) => {
  const contacts = db.getContacts();
  res.json(contacts);
}));

app.post('/api/contacts', requireAuth, catchErrors((req, res) => {
  const config = db.getConfig() || {};
  const validation = validateContact(req.body, config);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  const id = db.addContact(req.body);
  const newContact = db.getContactById(id);
  res.json(newContact);
}));

app.put('/api/contacts/:id', requireAuth, catchErrors((req, res) => {
  const config = db.getConfig() || {};
  const validation = validateContact(req.body, config, req.params.id);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  // REL-2 FIX: Check the return value of updateContact (number of changed rows).
  // A value of 0 means the ID did not exist; respond with 404 instead of 200/null.
  const changes = db.updateContact(req.params.id, req.body);
  if (changes === 0) {
    return res.status(404).json({ error: 'Contact not found.' });
  }
  const updated = db.getContactById(req.params.id);
  res.json(updated);
}));

app.delete('/api/contacts/:id', requireAuth, catchErrors((req, res) => {
  db.deleteContact(req.params.id);
  res.json({ success: true });
}));

app.delete('/api/contacts', requireAuth, catchErrors((req, res) => {
  db.clearContacts();
  res.json({ success: true });
}));

app.post('/api/contacts/bulk-delete', requireAuth, catchErrors((req, res) => {
  // SEC-3 FIX: Validate the shape of ids before passing to the DB layer.
  // A non-array body (e.g. a string) would bypass the length guard and cause
  // the DB function to iterate over characters producing malformed SQL.
  const ids = req.body.ids;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids must be an array.' });
  }
  if (ids.length > 0) {
    db.deleteContactsBulk(ids);
  }
  res.json({ success: true, count: ids.length });
}));

// REL-4 FIX: Bulk import now uses the transacted addContactsBulk helper so a
// failure mid-import rolls back all rows atomically. Field validation is applied
// per contact so uniqueness / required constraints are not silently bypassed.
app.post('/api/contacts/bulk', requireAuth, catchErrors((req, res) => {
  const contacts = req.body.contacts;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ error: 'contacts must be an array.' });
  }
  if (contacts.length === 0) {
    return res.json({ count: 0 });
  }
  const config = db.getConfig() || {};
  for (let i = 0; i < contacts.length; i++) {
    const validation = validateContact(contacts[i], config);
    if (!validation.valid) {
      return res.status(400).json({ error: `Contact at index ${i}: ${validation.error}` });
    }
  }
  db.addContactsBulk(contacts);
  res.json({ count: contacts.length });
}));

app.post('/api/departments/rename', requireAuth, catchErrors((req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) {
    return res.status(400).json({ error: 'oldName and newName are required.' });
  }
  const count = db.renameDepartment(oldName, newName);
  res.json({ success: true, count });
}));

// Public read endpoint — the frontend needs config (fields, theme) before any
// auth flow. PINs are always stripped. isConfigured tells the frontend whether
// first-time setup is needed without leaking the actual PIN values.
app.get('/api/config', catchErrors((req, res) => {
  const config = db.getConfig() || {};
  const safeConfig = { ...config };
  delete safeConfig.adminPin;
  delete safeConfig.devPin;
  // Expose bootstrap flag: true once at least an adminPin has been saved.
  safeConfig.isConfigured = !!(config.adminPin);
  res.json(safeConfig);
}));

// requireAuthOrBootstrap: behaves like requireAuth EXCEPT on first-run, when
// no adminPin has been saved yet. In that state, any caller may POST /api/config
// once to set their initial credentials. After that, requireAuth takes over.
const requireAuthOrBootstrap = (req, res, next) => {
  const config = db.getConfig() || {};
  if (!config.adminPin) {
    // Bootstrap mode — no PIN has ever been set. Allow this one unauthenticated
    // save so the user can establish their initial admin PIN.
    req.userRole = 'admin';
    return next();
  }
  return requireAuth(req, res, next);
};

app.post('/api/config', requireAuthOrBootstrap, catchErrors((req, res) => {
  const currentConfig = db.getConfig() || {};
  const newConfig = { ...req.body };

  // Preserve existing PINs when not explicitly changing them.
  if (!newConfig.adminPin) {
    newConfig.adminPin = currentConfig.adminPin;
  }
  if (!newConfig.devPin) {
    newConfig.devPin = currentConfig.devPin;
  }

  db.saveConfig(newConfig);
  res.json({ success: true });
}));

// ---------------------------------------------------------------------------
// SPA Fallback — must come after all API routes
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  // Only serve index.html for non-API GET requests to avoid masking 404s on
  // misspelled API paths with a silent 200 HTML response.
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// ---------------------------------------------------------------------------
// Centralized JSON Error Handler
// IMPORTANT: Must be registered AFTER the SPA fallback; Express identifies
// error handlers by their 4-argument signature (err, req, res, next).
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);
  // PRODUCTION-FIX: Clean Production Errors
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({ 
    error: isProd ? 'Internal Server Error' : err.message 
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// PRODUCTION-FIX: Graceful Shutdown
const shutdown = () => {
  console.log('Received kill signal, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    const db = require('./database');
    db.close();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
