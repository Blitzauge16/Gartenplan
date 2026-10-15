// Routen für die Tabelle "icon": hochgeladene, rund zugeschnittene Bilder,
// die Gewächsen und Objekten als Marker-Icon zugewiesen werden können.
// Die Bilddaten liegen als PNG-Dateien in backend/uploads/icons/ und werden
// über /uploads/icons/<dateiname> statisch ausgeliefert (siehe server.js);
// die Datenbank speichert nur Dateiname und Erstellungszeitpunkt.
// Eingebunden unter /api/icons.
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pool = require('../db/connection');

const router = express.Router();

const ICON_DIR = path.join(__dirname, '..', 'uploads', 'icons');
fs.mkdirSync(ICON_DIR, { recursive: true });

// Maximale Dateigröße eines Icons (das Frontend liefert 256x256-PNGs, das ist weit darunter)
const MAX_BYTES = 2 * 1024 * 1024;

const withUrl = (row) => ({ ...row, url: `/uploads/icons/${row.dateiname}` });

// GET alle Icons (neueste zuerst), jeweils mit Anzahl der Verwendungen
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.*,
             (SELECT count(*)::int FROM gewaechs g WHERE g.icon_id = i.id)
             + (SELECT count(*)::int FROM objects o WHERE o.icon_id = i.id) AS verwendungen
      FROM icon i
      ORDER BY i.erstellt_am DESC, i.id DESC
    `);
    res.json(rows.map(withUrl));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST neues Icon. Body: { data } — data ist eine PNG-Data-URL
// ("data:image/png;base64,...") oder reines Base64.
router.post('/', async (req, res) => {
  const { data } = req.body;
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ error: 'data (Base64-PNG) ist erforderlich' });
  }

  const match = data.match(/^data:image\/png;base64,(.+)$/s);
  const base64 = match ? match[1] : data;
  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return res.status(400).json({ error: 'Ungültige Bilddaten' });
  }
  if (buffer.length === 0) return res.status(400).json({ error: 'Ungültige Bilddaten' });
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: 'Icon ist zu groß (max. 2 MB)' });
  }
  // PNG-Signatur prüfen, damit nur echte PNG-Dateien abgelegt werden
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    return res.status(400).json({ error: 'Nur PNG-Daten werden akzeptiert' });
  }

  const dateiname = `${crypto.randomUUID()}.png`;
  const filePath = path.join(ICON_DIR, dateiname);
  try {
    await fs.promises.writeFile(filePath, buffer);
    const { rows } = await pool.query('INSERT INTO icon (dateiname) VALUES ($1) RETURNING *', [
      dateiname,
    ]);
    res.status(201).json(withUrl({ ...rows[0], verwendungen: 0 }));
  } catch (err) {
    // Datei wieder entfernen, wenn der DB-Eintrag fehlschlug
    fs.promises.unlink(filePath).catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

// DELETE Icon — Gewächse/Objekte, die es nutzen, fallen auf das Standard-Icon
// zurück (ON DELETE SET NULL).
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM icon WHERE id = $1 RETURNING dateiname', [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ error: 'Icon nicht gefunden' });
    await fs.promises.unlink(path.join(ICON_DIR, rows[0].dateiname)).catch(() => {});
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
