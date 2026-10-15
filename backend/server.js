// Einstiegspunkt des Backends.
// Startet den Express-Server, aktiviert CORS (damit das Frontend auf
// localhost:5173 die API aufrufen darf) und bindet alle Routen unter /api/* ein.
// Konfiguration (PORT, DATABASE_URL) kommt aus backend/.env.
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Limit erhöht, damit Icon-Uploads (Base64-PNG im JSON-Body) durchpassen
app.use(express.json({ limit: '5mb' }));

// Hochgeladene Dateien (Icons) statisch ausliefern: /uploads/icons/<dateiname>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ message: 'Gartenplan API läuft!' });
});

// things und ihre Subtypen
app.use('/api/gewaechse', require('./routes/gewaechse'));
app.use('/api/objects', require('./routes/objects'));
app.use('/api/shapes', require('./routes/shapes'));
// Orte und die Beziehung "platziert"
app.use('/api/orte', require('./routes/orte'));
app.use('/api/platziert', require('./routes/platziert'));
// Icons
app.use('/api/icons', require('./routes/icons'));

app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});
