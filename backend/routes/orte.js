const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// GET alle Orte
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ort ORDER BY id');
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

// POST neuer Ort
router.post('/', async (req, res) => {
  const { x_koordinate, y_koordinate } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO ort (x_koordinate, y_koordinate) VALUES ($1, $2) RETURNING *',
      [x_koordinate, y_koordinate]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Ort ändern
router.put('/:id', async (req, res) => {
  const { x_koordinate, y_koordinate } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE ort SET x_koordinate = $1, y_koordinate = $2 WHERE id = $3 RETURNING *',
      [x_koordinate, y_koordinate, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Ort nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Ort (löscht über ON DELETE CASCADE auch zugehörige gepflanzt-Einträge)
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
