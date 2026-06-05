const express = require('express');
const router = express.Router();

// GET alle Gartenpläne
router.get('/', (req, res) => {
  res.json([{ id: 1, name: 'Mein Garten', elements: [] }]);
});

// POST neuer Gartenplan
router.post('/', (req, res) => {
  res.json({ success: true, data: req.body });
});

module.exports = router;