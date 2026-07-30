const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Determine current DB path
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data', 'phonebook.db');

if (!fs.existsSync(dbPath)) {
  console.error(`[ERROR] Database not found at ${dbPath}`);
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `phonebook-backup-${timestamp}.db`);

console.log(`[INFO] Starting online backup of ${dbPath}...`);

try {
  // Open read-only connection
  const db = new Database(dbPath, { readonly: true });
  
  // Use better-sqlite3 native backup API to ensure a transactionally consistent
  // snapshot. Because we are in WAL mode, this does not block concurrent writers!
  db.backup(backupPath)
    .then(() => {
      console.log(`[SUCCESS] Backup successfully created at: ${backupPath}`);
      db.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[ERROR] Backup failed during copy process:', err);
      db.close();
      process.exit(1);
    });
} catch (error) {
  console.error('[ERROR] Failed to initialize backup:', error);
  process.exit(1);
}
