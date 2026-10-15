// Routen für den Subtyp "objects" (Gegenstände wie Bank, Regentonne, Kompost)
// der Obertabelle "thing". Objekte können wie Pflanzen im Plan platziert werden
// und ein Icon haben. Eingebunden unter /api/objects.
const express = require('express');
const pool = require('../db/connection');
const { iconUrlSql, withTransaction, newThingId, deleteThing, parseId, parseText } =
  require('../db/things');

const router = express.Router();

const SELECT = `
  SELECT o.thing_id, o.icon_id, o.name, o.notizen,
         ${iconUrlSql('i')} AS icon_url,
         (SELECT count(*)::int FROM platziert p WHERE p.thing_id = o.thing_id) AS anzahl_platzierungen
  FROM objects o
  LEFT JOIN icon i ON i.id = o.icon_id
`;

async function fetchObject(thingId) {
  const { rows } = await pool.query(`${SELECT} WHERE o.thing_id = $1`, [thingId]);
  return rows[0] ?? null;
}

function fromBody(body) {
  return {
    name: parseText(body.name),
    notizen: parseText(body.notizen),
    icon_id: parseId(body.icon_id),
  };
}

// GET alle Objekte
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT} ORDER BY o.name`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ein Objekt
router.get('/:id', async (req, res) => {
  try {
    const row = await fetchObject(req.params.id);
    if (!row) return res.status(404).json({ error: 'Objekt nicht gefunden' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST neues Objekt
router.post('/', async (req, res) => {
  const f = fromBody(req.body);
  if (!f.name) return res.status(400).json({ error: 'name ist erforderlich' });
  try {
    const thingId = await withTransaction(async (client) => {
      const id = await newThingId(client);
      await client.query(
        'INSERT INTO objects (thing_id, name, notizen, icon_id) VALUES ($1, $2, $3, $4)',
        [id, f.name, f.notizen, f.icon_id]
      );
      return id;
    });
    res.status(201).json(await fetchObject(thingId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Objekt ändern
router.put('/:id', async (req, res) => {
  const f = fromBody(req.body);
  if (!f.name) return res.status(400).json({ error: 'name ist erforderlich' });
  try {
    const { rowCount } = await pool.query(
      'UPDATE objects SET name = $1, notizen = $2, icon_id = $3 WHERE thing_id = $4',
      [f.name, f.notizen, f.icon_id, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Objekt nicht gefunden' });
    res.json(await fetchObject(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Objekt — entfernt auch seine Platzierungen und verwaiste Orte
router.delete('/:id', async (req, res) => {
  try {
    const ok = await deleteThing(req.params.id, 'objects');
    if (!ok) return res.status(404).json({ error: 'Objekt nicht gefunden' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
