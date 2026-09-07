// Spielt db/schema.sql manuell ein (z. B. nach Schema-Änderungen).
// Beim allerersten Docker-Start passiert das automatisch über docker-compose.yml.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./connection');

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Schema erfolgreich eingespielt.');
  await pool.end();
}

init().catch((err) => {
  console.error('Fehler beim Einspielen des Schemas:', err.message);
  process.exit(1);
});
