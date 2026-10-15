// Routen für den Subtyp "gewaechs" (Pflanze) der Obertabelle "thing".
// Eingebunden unter /api/gewaechse. Der Schlüssel heißt überall thing_id.
const express = require('express');
const pool = require('../db/connection');
const { iconUrlSql, withTransaction, newThingId, deleteThing, parseId, parseText } =
  require('../db/things');

const router = express.Router();

// Basis-Query: Gewächs inkl. Icon-URL und Anzahl seiner Platzierungen
const SELECT = `
  SELECT g.thing_id, g.icon_id, g.name, g.lateinischer_name, g.herkunft,
         g.benoetigtes_licht, g.bluehzeit, g.typ, g.notizen,
         ${iconUrlSql('i')} AS icon_url,
         (SELECT count(*)::int FROM platziert p WHERE p.thing_id = g.thing_id) AS anzahl_platzierungen
  FROM gewaechs g
  LEFT JOIN icon i ON i.id = g.icon_id
`;

async function fetchGewaechs(thingId) {
  const { rows } = await pool.query(`${SELECT} WHERE g.thing_id = $1`, [thingId]);
  return rows[0] ?? null;
}

// Felder aus dem Request-Body in Spaltenwerte umwandeln
function fromBody(body) {
  return {
    name: parseText(body.name),
    lateinischer_name: parseText(body.lateinischer_name),
    herkunft: parseText(body.herkunft),
    benoetigtes_licht: parseText(body.benoetigtes_licht),
    bluehzeit: parseText(body.bluehzeit),
    typ: parseText(body.typ),
    notizen: parseText(body.notizen),
    icon_id: parseId(body.icon_id),
  };
}

// GET alle Gewächse
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT} ORDER BY g.name`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ein Gewächs
router.get('/:id', async (req, res) => {
  try {
    const row = await fetchGewaechs(req.params.id);
    if (!row) return res.status(404).json({ error: 'Gewächs nicht gefunden' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST neues Gewächs (legt zuerst das thing an, dann die gewaechs-Zeile)
router.post('/', async (req, res) => {
  const f = fromBody(req.body);
  if (!f.name) return res.status(400).json({ error: 'name ist erforderlich' });
  try {
    const thingId = await withTransaction(async (client) => {
      const id = await newThingId(client);
      await client.query(
        `INSERT INTO gewaechs (thing_id, name, lateinischer_name, herkunft, benoetigtes_licht,
                               bluehzeit, typ, notizen, icon_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, f.name, f.lateinischer_name, f.herkunft, f.benoetigtes_licht, f.bluehzeit, f.typ, f.notizen, f.icon_id]
      );
      return id;
    });
    res.status(201).json(await fetchGewaechs(thingId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Gewächs ändern
router.put('/:id', async (req, res) => {
  const f = fromBody(req.body);
  if (!f.name) return res.status(400).json({ error: 'name ist erforderlich' });
  try {
    const { rowCount } = await pool.query(
      `UPDATE gewaechs
       SET name = $1, lateinischer_name = $2, herkunft = $3, benoetigtes_licht = $4,
           bluehzeit = $5, typ = $6, notizen = $7, icon_id = $8
       WHERE thing_id = $9`,
      [f.name, f.lateinischer_name, f.herkunft, f.benoetigtes_licht, f.bluehzeit, f.typ, f.notizen, f.icon_id, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Gewächs nicht gefunden' });
    res.json(await fetchGewaechs(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Gewächs — entfernt auch seine Platzierungen und verwaiste Orte
router.delete('/:id', async (req, res) => {
  try {
    const ok = await deleteThing(req.params.id, 'gewaechs');
    if (!ok) return res.status(404).json({ error: 'Gewächs nicht gefunden' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
