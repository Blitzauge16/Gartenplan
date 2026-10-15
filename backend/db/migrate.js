// Überführt eine Datenbank mit der ALTEN Struktur (gewaechs.id, gepflanzt,
// typ/gewaechs_typ, icon.name) in die neue Struktur aus schema.sql
// (thing + Subtypen, platziert) — ohne Datenverlust:
//
//   gewaechs(id, …)          -> thing(thing_id) + gewaechs(thing_id, …)
//   gewaechs_typ + typ       -> gewaechs.typ (Namen kommagetrennt)
//   gepflanzt                -> platziert (gewaechs_id wird zu thing_id)
//   icon(name, dateiname)    -> icon(dateiname)        (name entfällt)
//   ort                      -> ort                    (unverändert)
//
// Aufruf: npm run db:migrate
// Läuft komplett in einer Transaktion. Ist die Datenbank schon auf dem neuen
// Stand (oder leer), wird nur schema.sql eingespielt.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./connection');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

async function tableExists(client, table) {
  const { rows } = await client.query('SELECT to_regclass($1) AS r', [`public.${table}`]);
  return rows[0].r !== null;
}

async function columnExists(client, table, column) {
  const { rowCount } = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return rowCount > 0;
}

// Sequenz einer SERIAL-Spalte auf max(id)+1 setzen, damit neue Zeilen keine
// vergebenen IDs bekommen
async function resetSequence(client, table, column) {
  await client.query(
    `SELECT setval(pg_get_serial_sequence('${table}', '${column}'),
                   COALESCE((SELECT max(${column}) FROM ${table}), 0) + 1, false)`
  );
}

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const oldStructure =
      (await tableExists(client, 'gewaechs')) && (await columnExists(client, 'gewaechs', 'id'));

    if (!oldStructure) {
      await client.query(schema);
      await client.query('COMMIT');
      console.log('Keine alte Struktur gefunden — schema.sql wurde eingespielt, nichts zu migrieren.');
      return;
    }

    // 1. Alte Tabellen und Indizes beiseite legen
    const oldTables = ['gewaechs', 'ort', 'gepflanzt', 'gewaechs_typ', 'typ', 'icon'];
    const present = {};
    for (const t of oldTables) {
      present[t] = await tableExists(client, t);
      if (present[t]) await client.query(`ALTER TABLE ${t} RENAME TO ${t}_old`);
    }
    for (const idx of ['idx_gepflanzt_ort', 'idx_gepflanzt_gewaechs', 'idx_ort_bereich']) {
      await client.query(`ALTER INDEX IF EXISTS ${idx} RENAME TO ${idx}_old`);
    }

    // 2. Neues Schema anlegen
    await client.query(schema);

    // 3. Daten übernehmen
    if (present.icon) {
      await client.query(
        'INSERT INTO icon (id, dateiname, erstellt_am) SELECT id, dateiname, erstellt_am FROM icon_old'
      );
      await resetSequence(client, 'icon', 'id');
    }

    await client.query('INSERT INTO thing (thing_id) SELECT id FROM gewaechs_old');
    await resetSequence(client, 'thing', 'thing_id');

    const hasIconId = await columnExists(client, 'gewaechs_old', 'icon_id');
    const hasTypen = present.gewaechs_typ && present.typ;
    await client.query(`
      INSERT INTO gewaechs (thing_id, icon_id, name, lateinischer_name, herkunft,
                            benoetigtes_licht, bluehzeit, typ, notizen)
      SELECT g.id,
             ${hasIconId ? 'g.icon_id' : 'NULL'},
             g.name, g.lateinischer_name, g.herkunft, g.benoetigtes_licht, g.bluehzeit,
             ${
               hasTypen
                 ? `(SELECT string_agg(t.name, ', ' ORDER BY t.name)
                     FROM gewaechs_typ_old gt JOIN typ_old t ON t.id = gt.typ_id
                     WHERE gt.gewaechs_id = g.id)`
                 : 'NULL'
             },
             g.notizen
      FROM gewaechs_old g
    `);

    if (present.ort) {
      await client.query(
        'INSERT INTO ort (id, x_koordinate, y_koordinate, bereich) SELECT id, x_koordinate, y_koordinate, bereich FROM ort_old'
      );
      await resetSequence(client, 'ort', 'id');
    }

    if (present.gepflanzt) {
      await client.query(`
        INSERT INTO platziert (id, thing_id, ort_id, datum, notizen)
        SELECT id, gewaechs_id, ort_id, datum, notizen FROM gepflanzt_old
        ON CONFLICT (thing_id, ort_id) DO NOTHING
      `);
      await resetSequence(client, 'platziert', 'id');
    }

    // 4. Alte Tabellen entfernen
    for (const t of oldTables) {
      if (present[t]) await client.query(`DROP TABLE ${t}_old CASCADE`);
    }

    await client.query('COMMIT');

    const counts = {};
    for (const t of ['thing', 'gewaechs', 'objects', 'shape', 'ort', 'platziert', 'icon']) {
      counts[t] = Number((await client.query(`SELECT count(*) FROM ${t}`)).rows[0].count);
    }
    console.log('Migration abgeschlossen. Zeilen pro Tabelle:', counts);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Fehler bei der Migration (nichts wurde geändert):', err.message);
  process.exit(1);
});
