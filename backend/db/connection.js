// Zentraler PostgreSQL-Verbindungspool.
// Alle Routen importieren dieses eine Pool-Objekt und rufen pool.query() auf —
// der Pool öffnet/verwaltet die Verbindungen selbst (erst beim ersten Query).
// Die Zugangsdaten stehen in backend/.env als DATABASE_URL.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
