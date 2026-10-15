// Routen für die Tabelle "ort" (Entität Ort aus dem ER-Modell).
// Ein Ort ist eine Position im Gartenplan (x/y-Koordinate in Plan-Einheiten),
// an der things über "platziert" stehen können. Eingebunden unter /api/orte.
const express = require('express');
const pool = require('../db/connection');
const { parseNumber, parseText } = require('../db/things');

const router = express.Router();

// GET alle Orte, optional gefiltert nach Bereich: /api/orte?bereich=gewaechshaus
router.get('/', async (req, res) => {
  try {
    const { bereich } = req.query;
    const { rows } = bereich
      ? await pool.query('SELECT * FROM ort WHERE bereich = $1 ORDER BY id', [bereich])
      : await pool.query('SELECT * FROM ort ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ein Ort
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ort WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Ort nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST neuer Ort ("bereich" ist die Hotspot-ID des Areals, z. B. "gewaechshaus")
router.post('/', async (req, res) => {
  const x = parseNumber(req.body.x_koordinate);
  const y = parseNumber(req.body.y_koordinate);
  if (x === null || y === null) {
    return res.status(400).json({ error: 'x_koordinate und y_koordinate sind erforderlich' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO ort (x_koordinate, y_koordinate, bereich) VALUES ($1, $2, $3) RETURNING *',
      [x, y, parseText(req.body.bereich)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Ort ändern (z. B. wenn ein Marker im Editor verschoben wird).
// Wird "bereich" nicht mitgeschickt, bleibt der bisherige Wert erhalten.
router.put('/:id', async (req, res) => {
  const x = parseNumber(req.body.x_koordinate);
  const y = parseNumber(req.body.y_koordinate);
  if (x === null || y === null) {
    return res.status(400).json({ error: 'x_koordinate und y_koordinate sind erforderlich' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE ort SET x_koordinate = $1, y_koordinate = $2, bereich = COALESCE($3, bereich)
       WHERE id = $4 RETURNING *`,
      [x, y, parseText(req.body.bereich), req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Ort nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Ort (löscht über ON DELETE CASCADE auch alle Platzierungen an diesem Ort)
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM ort WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Ort nicht gefunden' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
