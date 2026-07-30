const db = require('./database');
const config = db.getConfig();
if (config.brandIcon) {
  delete config.brandIcon;
  db.saveConfig(config);
  console.log('Brand icon removed.');
} else {
  console.log('No brand icon to remove.');
}
