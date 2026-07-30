#!/usr/bin/env node
/**
 * reset-config.js — Emergency recovery & development helper
 *
 * Usage:
 *   node reset-config.js                  # Clear PINs only (keeps contacts + all other settings)
 *   node reset-config.js --full           # Clear entire config (keeps contacts)
 *   node reset-config.js --contacts       # Clear contacts only (keeps config)
 *   node reset-config.js --all            # Wipe everything (full factory reset)
 *
 * Reads DB_PATH env var, same as server.js — safe to run against a test database.
 *   DB_PATH=test.db node reset-config.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'phonebook.db');

console.log(`\n📂  Database: ${dbPath}\n`);

const db = new Database(dbPath);

const args = process.argv.slice(2);
const full     = args.includes('--full');
const contacts = args.includes('--contacts');
const all      = args.includes('--all');

// ── Config operations ──────────────────────────────────────────────────────
if (!contacts) {
  const row = db.prepare("SELECT value FROM config WHERE key = 'app_config'").get();

  if (!row) {
    console.log('ℹ️   No config found in database — nothing to reset.');
  } else if (full || all) {
    db.prepare("DELETE FROM config WHERE key = 'app_config'").run();
    console.log('✅  Full config cleared. App will return to first-time setup on next load.');
  } else {
    // PIN-only reset: parse the current config, remove PINs, write back.
    const config = JSON.parse(row.value);
    const hadAdmin = !!config.adminPin;
    const hadDev   = !!config.devPin;
    delete config.adminPin;
    delete config.devPin;
    db.prepare(`
      INSERT INTO config (key, value) VALUES ('app_config', @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run({ value: JSON.stringify(config) });

    if (hadAdmin || hadDev) {
      console.log(`✅  PINs cleared (adminPin: ${hadAdmin ? 'removed' : 'was empty'}, devPin: ${hadDev ? 'removed' : 'was empty'}).`);
      console.log('    App will show "First-Time Setup" on next load. All other settings preserved.');
    } else {
      console.log('ℹ️   No PINs were set — config unchanged.');
    }
  }
}

// ── Contacts operations ────────────────────────────────────────────────────
if (contacts || all) {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM contacts').get();
  db.prepare('DELETE FROM contacts').run();
  console.log(`✅  ${count} contacts deleted.`);
}

console.log('\n🔁  Restart the server for changes to take effect.\n');
db.close();
