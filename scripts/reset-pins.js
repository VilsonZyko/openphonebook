const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data', 'phonebook.db');

if (!fs.existsSync(dbPath)) {
  console.error(`[ERROR] Database not found at ${dbPath}`);
  process.exit(1);
}

try {
  const db = new Database(dbPath);
  
  // Fetch current config
  const row = db.prepare("SELECT value FROM config WHERE key = 'app_config'").get();
  if (row) {
    const config = JSON.parse(row.value);
    
    // Remove PINs
    delete config.adminPin;
    delete config.devPin;
    
    // Save updated config
    const stmt = db.prepare(`
      UPDATE config SET value = @value WHERE key = 'app_config'
    `);
    stmt.run({ value: JSON.stringify(config) });
    
    console.log('[SUCCESS] Administrative PINs have been successfully wiped.');
    console.log('[INFO] OpenPhonebook is now back in Bootstrap Mode.');
    console.log('[ACTION REQUIRED] Please restart the server and navigate to the application to configure new PINs.');
  } else {
    console.log('[INFO] No configuration found in the database. The server is already in Bootstrap Mode.');
  }
  
  db.close();
  process.exit(0);
} catch (error) {
  console.error('[ERROR] Failed to reset PINs:', error);
  process.exit(1);
}
