const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// GET alle Pflanzungen (mit Ort- und Gewächsdaten)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.datum, p.notizen,
             json_build_object('id', o.id, 'x_koordinate', o.x_koordinate, 'y_koordinate', o.y_koordinate) AS ort,
             json_build_object('id', g.id, 'name', g.name, 'lateinischer_name', g.lateinischer_name) AS gewaechs
      FROM gepflanzt p
      JOIN ort o ON o.id = p.ort_id
      JOIN gewaechs g ON g.id = p.gewaechs_id
      ORDER BY p.datum DESC NULLS LAST, p.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET alles, was an einem Ort gepflanzt ist
router.get('/ort/:ortId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.datum, p.notizen,
              json_build_object('id', g.id, 'name', g.name, 'lateinischer_name', g.lateinischer_name,
                                'bluehzeit', g.bluehzeit, 'benoetigtes_licht', g.benoetigtes_licht) AS gewaechs
       FROM gepflanzt p
       JOIN gewaechs g ON g.id = p.gewaechs_id
       WHERE p.ort_id = $1
       ORDER BY p.datum DESC NULLS LAST, p.id DESC`,
      [req.params.ortId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST neue Pflanzung
router.post('/', async (req, res) => {
  const { ort_id, gewaechs_id, datum, notizen } = req.body;
  if (!ort_id || !gewaechs_id) {
    return res.status(400).json({ error: 'ort_id und gewaechs_id sind erforderlich' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO gepflanzt (ort_id, gewaechs_id, datum, notizen)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ort_id, gewaechs_id, datum, notizen]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Pflanzung ändern
router.put('/:id', async (req, res) => {
  const { ort_id, gewaechs_id, datum, notizen } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE gepflanzt
       SET ort_id = $1, gewaechs_id = $2, datum = $3, notizen = $4
       WHERE id = $5 RETURNING *`,
      [ort_id, gewaechs_id, datum, notizen, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Pflanzung nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Pflanzung
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM gepflanzt WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Pflanzung nicht gefunden' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
