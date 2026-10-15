// Routen für die Tabelle "platziert" — die n:m-Beziehung zwischen thing und
// ort aus dem ER-Modell, mit den Beziehungsattributen datum und notizen.
// Ein Eintrag bedeutet: dieses thing (Pflanze, Objekt oder Form) steht an
// diesem Ort. Eingebunden unter /api/platziert.
//
// Jede Antwort enthält ein eingebettetes "ort"-Objekt und ein "thing"-Objekt,
// dessen Feld "art" angibt, um welchen Subtyp es sich handelt:
//   'gewaechs' | 'objekt' | 'shape'
const express = require('express');
const pool = require('../db/connection');
const { iconUrlSql, withTransaction, parseId, parseText, parseNumber } = require('../db/things');

const router = express.Router();

const SELECT = `
  SELECT p.id, p.thing_id, p.ort_id, p.datum, p.notizen,
         json_build_object('id', o.id, 'x_koordinate', o.x_koordinate,
                           'y_koordinate', o.y_koordinate, 'bereich', o.bereich) AS ort,
         CASE
           WHEN g.thing_id IS NOT NULL THEN json_build_object(
             'thing_id', g.thing_id, 'art', 'gewaechs', 'name', g.name,
             'lateinischer_name', g.lateinischer_name, 'herkunft', g.herkunft,
             'benoetigtes_licht', g.benoetigtes_licht, 'bluehzeit', g.bluehzeit,
             'typ', g.typ, 'notizen', g.notizen,
             'icon_id', g.icon_id, 'icon_url', ${iconUrlSql('gi')})
           WHEN ob.thing_id IS NOT NULL THEN json_build_object(
             'thing_id', ob.thing_id, 'art', 'objekt', 'name', ob.name, 'notizen', ob.notizen,
             'icon_id', ob.icon_id, 'icon_url', ${iconUrlSql('oi')})
           WHEN s.thing_id IS NOT NULL THEN json_build_object(
             'thing_id', s.thing_id, 'art', 'shape', 'name', 'Form',
             'width', s.width, 'height', s.height, 'notizen', s.notizen)
           ELSE json_build_object('thing_id', p.thing_id, 'art', 'unbekannt', 'name', 'Unbekannt')
         END AS thing
  FROM platziert p
  JOIN ort o ON o.id = p.ort_id
  LEFT JOIN gewaechs g ON g.thing_id = p.thing_id
  LEFT JOIN icon gi ON gi.id = g.icon_id
  LEFT JOIN objects ob ON ob.thing_id = p.thing_id
  LEFT JOIN icon oi ON oi.id = ob.icon_id
  LEFT JOIN shape s ON s.thing_id = p.thing_id
`;

async function fetchPlatzierung(id) {
  const { rows } = await pool.query(`${SELECT} WHERE p.id = $1`, [id]);
  return rows[0] ?? null;
}

// GET alle Platzierungen
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT} ORDER BY p.datum DESC NULLS LAST, p.id DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET alles, was in einem Bereich (Hotspot-ID, z. B. "gewaechshaus") steht —
// Datenquelle des Bereichs-Editors im Frontend
router.get('/bereich/:bereich', async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT} WHERE o.bereich = $1 ORDER BY p.id`, [
      req.params.bereich,
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET alle Platzierungen eines things (wo steht diese Pflanze/dieses Objekt überall?)
router.get('/thing/:thingId', async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT} WHERE p.thing_id = $1 ORDER BY o.bereich, p.id`, [
      req.params.thingId,
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET alles, was an einem Ort steht
router.get('/ort/:ortId', async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT} WHERE p.ort_id = $1 ORDER BY p.id`, [
      req.params.ortId,
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET eine Platzierung
router.get('/:id', async (req, res) => {
  try {
    const row = await fetchPlatzierung(req.params.id);
    if (!row) return res.status(404).json({ error: 'Platzierung nicht gefunden' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST neue Platzierung.
// Entweder mit vorhandenem Ort:   { thing_id, ort_id, datum?, notizen? }
// oder mit neuem Ort in einem Schritt: { thing_id, x_koordinate, y_koordinate, bereich, datum?, notizen? }
router.post('/', async (req, res) => {
  const thingId = parseId(req.body.thing_id);
  let ortId = parseId(req.body.ort_id);
  const x = parseNumber(req.body.x_koordinate);
  const y = parseNumber(req.body.y_koordinate);
  const bereich = parseText(req.body.bereich);
  const datum = parseText(req.body.datum);
  const notizen = parseText(req.body.notizen);

  if (!thingId) return res.status(400).json({ error: 'thing_id ist erforderlich' });
  if (!ortId && (x === null || y === null)) {
    return res.status(400).json({ error: 'ort_id oder x_koordinate/y_koordinate sind erforderlich' });
  }

  try {
    const id = await withTransaction(async (client) => {
      if (!ortId) {
        const { rows } = await client.query(
          'INSERT INTO ort (x_koordinate, y_koordinate, bereich) VALUES ($1, $2, $3) RETURNING id',
          [x, y, bereich]
        );
        ortId = rows[0].id;
      }
      const { rows } = await client.query(
        `INSERT INTO platziert (thing_id, ort_id, datum, notizen)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [thingId, ortId, datum, notizen]
      );
      return rows[0].id;
    });
    res.status(201).json(await fetchPlatzierung(id));
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'thing_id oder ort_id existiert nicht' });
    }
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Dieses thing steht bereits an diesem Ort' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT Datum/Notizen einer Platzierung ändern (die Position wird über /api/orte geändert)
router.put('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'UPDATE platziert SET datum = $1, notizen = $2 WHERE id = $3',
      [parseText(req.body.datum), parseText(req.body.notizen), req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Platzierung nicht gefunden' });
    res.json(await fetchPlatzierung(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Platzierung — der Ort wird mit gelöscht, wenn dort sonst nichts steht
router.delete('/:id', async (req, res) => {
  try {
    const found = await withTransaction(async (client) => {
      const { rows } = await client.query(
        'DELETE FROM platziert WHERE id = $1 RETURNING ort_id',
        [req.params.id]
      );
      if (rows.length === 0) return false;
      await client.query(
        'DELETE FROM ort WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM platziert WHERE ort_id = $1)',
        [rows[0].ort_id]
      );
      return true;
    });
    if (!found) return res.status(404).json({ error: 'Platzierung nicht gefunden' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
