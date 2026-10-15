// Routen für den Subtyp "shape" (rechteckige Form) der Obertabelle "thing".
// Eine Form hat Breite und Höhe in Plan-Koordinaten und wird über "platziert"
// an einem Ort verankert (der Ort ist der Mittelpunkt des Rechtecks).
// Eingebunden unter /api/shapes.
const express = require('express');
const pool = require('../db/connection');
const { withTransaction, newThingId, deleteThing, parseText, parseNumber } = require('../db/things');

const router = express.Router();

const SELECT = `
  SELECT s.thing_id, s.width, s.height, s.notizen,
         (SELECT count(*)::int FROM platziert p WHERE p.thing_id = s.thing_id) AS anzahl_platzierungen
  FROM shape s
`;

async function fetchShape(thingId) {
  const { rows } = await pool.query(`${SELECT} WHERE s.thing_id = $1`, [thingId]);
  return rows[0] ?? null;
}

function fromBody(body) {
  return {
    width: parseNumber(body.width),
    height: parseNumber(body.height),
    notizen: parseText(body.notizen),
  };
}

const sizeValid = (f) => f.width !== null && f.height !== null && f.width > 0 && f.height > 0;

// GET alle Formen
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT} ORDER BY s.thing_id`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET eine Form
router.get('/:id', async (req, res) => {
  try {
    const row = await fetchShape(req.params.id);
    if (!row) return res.status(404).json({ error: 'Form nicht gefunden' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST neue Form
router.post('/', async (req, res) => {
  const f = fromBody(req.body);
  if (!sizeValid(f)) return res.status(400).json({ error: 'width und height müssen positive Zahlen sein' });
  try {
    const thingId = await withTransaction(async (client) => {
      const id = await newThingId(client);
      await client.query(
        'INSERT INTO shape (thing_id, width, height, notizen) VALUES ($1, $2, $3, $4)',
        [id, f.width, f.height, f.notizen]
      );
      return id;
    });
    res.status(201).json(await fetchShape(thingId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Form ändern (z. B. Größe im Editor angepasst)
router.put('/:id', async (req, res) => {
  const f = fromBody(req.body);
  if (!sizeValid(f)) return res.status(400).json({ error: 'width und height müssen positive Zahlen sein' });
  try {
    const { rowCount } = await pool.query(
      'UPDATE shape SET width = $1, height = $2, notizen = $3 WHERE thing_id = $4',
      [f.width, f.height, f.notizen, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Form nicht gefunden' });
    res.json(await fetchShape(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Form — entfernt auch ihre Platzierungen und verwaiste Orte
router.delete('/:id', async (req, res) => {
  try {
    const ok = await deleteThing(req.params.id, 'shape');
    if (!ok) return res.status(404).json({ error: 'Form nicht gefunden' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
