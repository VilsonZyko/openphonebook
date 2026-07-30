const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// DB_PATH env var lets you point at a different database file for testing.
// Default is ./data/phonebook.db so it can be easily mounted in Docker.
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'data', 'phonebook.db');

// Ensure the directory exists before opening the database
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
console.log(`[DB] Using database: ${dbPath}`);

// PRODUCTION-FIX: Enable WAL mode for concurrent read/write stability
db.pragma('journal_mode = WAL');


// Initialize schema
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
}
initDB();

module.exports = {
  getContacts: () => {
    const rows = db.prepare('SELECT * FROM contacts').all();
    return rows.map(r => ({ id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, ...JSON.parse(r.data) }));
  },

  getContactById: (id) => {
    const r = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    if (!r) return null;
    return { id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, ...JSON.parse(r.data) };
  },

  addContact: (contactData) => {
    const { createdAt, updatedAt, id, ...customData } = contactData;
    // REL-3 FIX: createdAt/updatedAt are always authoritative server-side timestamps.
    // Trusting client-supplied values allows arbitrary record backdating.
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO contacts (data, createdAt, updatedAt)
      VALUES (@data, @createdAt, @updatedAt)
    `);
    const info = stmt.run({
      data: JSON.stringify(customData),
      createdAt: now,
      updatedAt: now,
    });
    return info.lastInsertRowid;
  },

  // REL-2 FIX: Returns info.changes (0 or 1) so the caller can detect a
  // missing-ID update and respond with 404 instead of a silent 200/null body.
  updateContact: (id, contactData) => {
    const { createdAt, updatedAt, id: _id, ...customData } = contactData;
    const stmt = db.prepare(`
      UPDATE contacts
      SET data = @data, updatedAt = @updatedAt
      WHERE id = @id
    `);
    // REL-3 FIX: updatedAt always server-side; never echo the client's value.
    const info = stmt.run({
      id,
      data: JSON.stringify(customData),
      updatedAt: new Date().toISOString(),
    });
    return info.changes; // 0 = ID not found
  },

  deleteContact: (id) => {
    db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  },

  clearContacts: () => {
    db.prepare('DELETE FROM contacts').run();
  },

  // SEC-3 FIX: Validate and cast every element to a finite integer before building
  // the parameterized IN clause. Non-numeric / object entries are filtered out,
  // preventing crash-via-type-confusion and any residual injection surface from
  // the spread-based binding approach.
  deleteContactsBulk: (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const safeIds = ids.map(id => parseInt(id, 10)).filter(n => Number.isFinite(n));
    if (safeIds.length === 0) return;
    const placeholders = safeIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM contacts WHERE id IN (${placeholders})`).run(...safeIds);
  },

  // REL-4 FIX: Wraps all inserts in a single SQLite transaction — a mid-import
  // error now rolls back all previously inserted rows rather than leaving orphans.
  // Also enforces server-side timestamps and skips any per-contact validation
  // (that responsibility belongs to the route layer before calling this).
  addContactsBulk: (contactsArray) => {
    const insertStmt = db.prepare(`
      INSERT INTO contacts (data, createdAt, updatedAt)
      VALUES (@data, @createdAt, @updatedAt)
    `);
    const now = new Date().toISOString();
    const runTransaction = db.transaction((contacts) => {
      for (const contactData of contacts) {
        const { id, createdAt, updatedAt, ...customData } = contactData;
        insertStmt.run({ data: JSON.stringify(customData), createdAt: now, updatedAt: now });
      }
    });
    runTransaction(contactsArray);
  },

  renameDepartment: (oldDept, newDept) => {
    const contacts = module.exports.getContacts();
    let updatedCount = 0;
    const updateStmt = db.prepare('UPDATE contacts SET data = @data, updatedAt = @updatedAt WHERE id = @id');
    const updateMany = db.transaction((contactsToUpdate) => {
      const now = new Date().toISOString();
      for (const contact of contactsToUpdate) {
        const { id, createdAt, updatedAt, ...customData } = contact;
        customData.department = newDept;
        updateStmt.run({
          id,
          data: JSON.stringify(customData),
          updatedAt: now
        });
        updatedCount++;
      }
    });
    const toUpdate = contacts.filter(c => c.department === oldDept);
    if (toUpdate.length > 0) {
      updateMany(toUpdate);
    }
    return updatedCount;
  },

  getConfig: () => {
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get('app_config');
    return row ? JSON.parse(row.value) : null;
  },

  saveConfig: (configObj) => {
    const stmt = db.prepare(`
      INSERT INTO config (key, value) VALUES ('app_config', @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run({ value: JSON.stringify(configObj) });
  },

  close: () => db.close()
};
