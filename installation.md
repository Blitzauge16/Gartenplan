## Setup

### ✅ Schritt 1: Frontend-Projekt erstellen
```bash
cd c:\Users\lenar\Documents\Gartenplan
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### ✅ Schritt 2: Backend-Projekt erstellen (Express)
```bash
cd ..
mkdir backend
cd backend
npm init -y
npm install express cors dotenv
npm install --save-dev nodemon
```

Erstelle `backend/server.js`:
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test-Route
app.get('/api/gardens', (req, res) => {
  res.json({ message: 'Gartenplan API läuft!' });
});

app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});
```

Aktualisiere `backend/package.json` - Scripts:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```


### ✅ Schritt 4: Zusätzliche Dependencies installieren

**Frontend:**
```bash
cd frontend
npm install lucide-react  # Icons & SVG-Komponenten (optional)
```

**Backend (optional - für Production):**
```bash
cd backend
npm install pg            # PostgreSQL Treiber
# oder
npm install mongoose      # MongoDB ODM
```

## Entwicklung mit Frontend + Backend

## Entwicklung mit Frontend + Backend

### Development Workflow
```
Terminal 1 (Frontend)        Terminal 2 (Backend)
$ cd frontend                $ cd backend
$ npm run dev                $ npm run dev

http://localhost:5173   ←→   http://localhost:5000
React App                    Express API
```

### Kommunikation Frontend ↔ Backend

**Frontend API-Aufruf (`src/services/api.js`):**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const fetchGardens = async () => {
  const response = await fetch(`${API_URL}/gardens`);
  return response.json();
};

export const saveGarden = async (gardenData) => {
  const response = await fetch(`${API_URL}/gardens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gardenData)
  });
  return response.json();
};
```

**Backend API-Endpoints (`backend/routes/gardens.js`):**
```javascript
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
```

### Scripts im `frontend/package.json`:
- `npm run dev` - Development Server mit HMR (Hot Module Reload)
- `npm run build` - Produktions-Build
- `npm run preview` - Preview des Builds

### Scripts im `backend/package.json`:
- `npm run dev` - Development Server mit Nodemon (Auto-Restart)
- `npm start` - Production Server

### Nächste Schritte:
1. ✅ Frontend-Projekt (React + Vite) erstellen
2. ✅ Backend-Projekt (Node.js + Express) erstellen
3. 🔨 SVGCanvas-Komponente bauen (Vordergrund)
4. 🔨 ControlPanel-Komponente bauen (Hintergrund)
5. 🔨 API-Integration zwischen Frontend & Backend
6. 🔨 Interaktion & State-Management
7. 💾 Datenspeicherung in Datenbank (PostgreSQL oder MongoDB)

## SSH Key einrichten

https://learn.microsoft.com/de-de/windows-hardware/manufacture/desktop/factoryos/connect-using-ssh?view=windows-11

1. SSH Schlüssel generieren mit dem Befehl
    # code
    ssh-keygen

2. alle benötigten Eingaben leer lassen und mit enter beenden

3.  Prublic Key Schlüssel ausgeben
    # code 
    cat .\id_ed25519.pub

4. Ausgegeben Schlüssel kopieren und bei den Einstellungen einfügen 