// Gemeinsame Helfer für die Obertabelle "thing" und ihre Subtypen
// (gewaechs, objects, shape). Wird von den Routen genutzt.
const pool = require('./connection');

// SQL-Ausdruck für die URL eines Icons (NULL = Standard-Icon).
// alias ist der Tabellenalias der per LEFT JOIN eingebundenen icon-Tabelle.
const iconUrlSql = (alias) =>
  `CASE WHEN ${alias}.id IS NULL THEN NULL ELSE '/uploads/icons/' || ${alias}.dateiname END`;

// Führt fn(client) in einer Transaktion aus (COMMIT bei Erfolg, sonst ROLLBACK).
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Legt eine neue thing-Zeile an und gibt die vergebene thing_id zurück.
async function newThingId(client) {
  const { rows } = await client.query('INSERT INTO thing DEFAULT VALUES RETURNING thing_id');
  return rows[0].thing_id;
}

// Löscht ein thing eines bestimmten Subtyps. Die Subtyp-Zeile und alle
// Platzierungen verschwinden per ON DELETE CASCADE; Orte, an denen danach
// nichts mehr steht, werden mit entfernt, damit keine verwaisten Marker bleiben.
// Gibt false zurück, wenn es kein thing dieses Subtyps mit der ID gibt.
async function deleteThing(thingId, subtypeTable) {
  return withTransaction(async (client) => {
    const { rowCount: exists } = await client.query(
      `SELECT 1 FROM ${subtypeTable} WHERE thing_id = $1`,
      [thingId]
    );
    if (exists === 0) return false;
    await client.query(
      `DELETE FROM ort
       WHERE id IN (SELECT ort_id FROM platziert WHERE thing_id = $1)
         AND NOT EXISTS (
           SELECT 1 FROM platziert p WHERE p.ort_id = ort.id AND p.thing_id <> $1
         )`,
      [thingId]
    );
    await client.query('DELETE FROM thing WHERE thing_id = $1', [thingId]);
    return true;
  });
}

// Leere Strings/undefined als NULL behandeln, sonst als ganze Zahl (z. B. icon_id)
const parseId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
};

// Leere Strings als NULL speichern, sonst getrimmten Text
const parseText = (value) => {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
};

// Zahl oder null
const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

module.exports = { iconUrlSql, withTransaction, newThingId, deleteThing, parseId, parseText, parseNumber };
