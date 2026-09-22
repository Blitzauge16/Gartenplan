// Einstiegspunkt des Backends.
// Startet den Express-Server, aktiviert CORS (damit das Frontend auf
// localhost:5173 die API aufrufen darf) und bindet alle Routen unter /api/* ein.
// Konfiguration (PORT, DATABASE_URL) kommt aus backend/.env.
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Gartenplan API läuft!' });
});

app.use('/api/orte', require('./routes/orte'));
app.use('/api/gewaechse', require('./routes/gewaechse'));
app.use('/api/typen', require('./routes/typen'));
app.use('/api/gepflanzt', require('./routes/gepflanzt'));

app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});
