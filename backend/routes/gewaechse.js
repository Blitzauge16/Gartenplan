const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// Basis-Query: Gewächs inkl. seiner Typen (Beziehung "haben")
const GEWAECHS_SELECT = `
  SELECT g.*,
         COALESCE(
           json_agg(json_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL),
           '[]'
         ) AS typen
  FROM gewaechs g
  LEFT JOIN gewaechs_typ gt ON gt.gewaechs_id = g.id
  LEFT JOIN typ t ON t.id = gt.typ_id
`;

// GET alle Gewächse
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`${GEWAECHS_SELECT} GROUP BY g.id ORDER BY g.name`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ein Gewächs
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${GEWAECHS_SELECT} WHERE g.id = $1 GROUP BY g.id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Gewächs nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST neues Gewächs
router.post('/', async (req, res) => {
  const { name, lateinischer_name, herkunft, benoetigtes_licht, bluehzeit, notizen } = req.body;
  if (!name) return res.status(400).json({ error: 'name ist erforderlich' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO gewaechs (name, lateinischer_name, herkunft, benoetigtes_licht, bluehzeit, notizen)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, lateinischer_name, herkunft, benoetigtes_licht, bluehzeit, notizen]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Gewächs ändern
router.put('/:id', async (req, res) => {
  const { name, lateinischer_name, herkunft, benoetigtes_licht, bluehzeit, notizen } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE gewaechs
       SET name = $1, lateinischer_name = $2, herkunft = $3,
           benoetigtes_licht = $4, bluehzeit = $5, notizen = $6
       WHERE id = $7 RETURNING *`,
      [name, lateinischer_name, herkunft, benoetigtes_licht, bluehzeit, notizen, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Gewächs nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Gewächs
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM gewaechs WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Gewächs nicht gefunden' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Typ zu Gewächs hinzufügen (Beziehung "haben")
router.post('/:id/typen', async (req, res) => {
  const { typ_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO gewaechs_typ (gewaechs_id, typ_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, typ_id]
    );
    res.status(201).json({ gewaechs_id: Number(req.params.id), typ_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Typ von Gewächs entfernen
router.delete('/:id/typen/:typId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM gewaechs_typ WHERE gewaechs_id = $1 AND typ_id = $2',
      [req.params.id, req.params.typId]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
