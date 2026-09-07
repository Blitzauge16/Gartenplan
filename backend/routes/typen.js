const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// GET alle Typen
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM typ ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST neuer Typ
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name ist erforderlich' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO typ (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
      [name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Typ
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM typ WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Typ nicht gefunden' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
