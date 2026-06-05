# Gartenplan
Interaktive Webseite mit SVG-Gartenplan (React + Vite)

## Inhaltsverzeichnis
- [Ordnerstruktur](#ordnerstruktur)
- [Setup](#setup)
- [Entwicklung](#entwicklung)
- [SSH Key einrichten](#ssh-key-einrichten)

## Ordnerstruktur

### Empfehlung: Monorepo-Struktur (Frontend + optionales Backend)

```
Gartenplan/
├── README.md                          # Projekt-Dokumentation
├── package.json                       # Root-Level (optional für Monorepo)
├── 
├── frontend/                          # React + Vite App
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx                  # Einstiegspunkt
│   │   ├── App.jsx                   # Haupt-Komponente
│   │   ├── App.css
│   │   ├── components/
│   │   │   ├── SVGCanvas.jsx         # SVG-Gartenplan (Vordergrund)
│   │   │   ├── ControlPanel.jsx      # Element-Manager (Hintergrund/Sidebar)
│   │   │   ├── PropertyEditor.jsx    # Eigenschaften bearbeiten
│   │   │   ├── ElementsList.jsx      # Liste aller Elemente
│   │   │   └── LayerPanel.jsx        # Layer-Management
│   │   ├── hooks/
│   │   │   ├── useGardenData.js      # Custom Hook für Gartendaten
│   │   │   └── useSVGInteraction.js  # Custom Hook für SVG-Interaktionen
│   │   ├── utils/
│   │   │   ├── svgHelpers.js         # SVG-Manipulation Utilities
│   │   │   ├── storage.js            # LocalStorage / Daten-Persistierung
│   │   │   └── constants.js          # Konstanten & Konfiguration
│   │   ├── styles/
│   │   │   └── index.css             # Globale Styles
│   │   └── data/
│   │       └── defaultGarden.json    # Standard-Gartenplan
│   ├── public/
│   │   └── (statische Assets)
│   └── .env                          # Umgebungsvariablen (optional für Backend-URL)
│
├── backend/                         # Node.js + Express API
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   │   └── gardens.js               # API für Gartenpläne
│   ├── models/
│   │   └── Garden.js                # Datenbankmodelle
│   ├── controllers/
│   │   └── gardenController.js      # Business-Logik
│   ├── middleware/
│   │   └── errorHandler.js          # Error-Handling
│   ├── db/
│   │   └── connection.js            # Datenbankverbindung
│   └── .env                         # Umgebungsvariablen (Port, DB-URL)
│
└── docs/                            # Zusätzliche Dokumentation
    └── API.md                       # API-Dokumentation (wenn Backend existiert)
```

### Erklärung der Struktur

| Ordner | Zweck |
|--------|-------|
| **frontend/** | Komplette React+Vite App mit UI & SVG-Logik |
| **src/components/** | Wiederverwendbare React-Komponenten |
| **src/hooks/** | Custom React Hooks für Datenlogik |
| **src/utils/** | Hilfs-Funktionen (SVG, Storage, etc.) |
| **backend/** | Optional: REST API für Datenpersistierung |

## Setup

### Backend-Optionen (Vergleich)

Für dein Projekt empfehle ich **Node.js + Express**:

| Backend | Sprache | Komplexität | Learning Curve | Datenbankunterstützung | Empfehlung |
|---------|---------|-------------|-----------------|----------------------|------------|
| **Express + Node.js** ⭐ | JavaScript | Niedrig | Leicht | PostgreSQL, MongoDB, SQLite | **BESTE WAHL** |
| **Fastify + Node.js** | JavaScript | Mittel | Leicht | PostgreSQL, MongoDB, SQLite | Schneller, moderner |
| **Nest.js** | TypeScript | Hoch | Mittelschwer | PostgreSQL, MongoDB, SQLite | Enterprise-Reif |
| **Python + Flask** | Python | Niedrig | Mittel | PostgreSQL, MySQL, SQLite | Wenn Python bevorzugt |
| **Next.js API Routes** | JavaScript | Gering | Sehr leicht | Variabel | Integriert mit Frontend |

### 🎯 Meine Empfehlung: **Node.js + Express**

**Warum?**
- ✅ Gleiche Sprache wie Frontend (JavaScript) - Full-Stack
- ✅ Minimale Lernkurve
- ✅ Große Community & viele Libraries
- ✅ Perfekt für MVPs und schnelle Entwicklung
- ✅ Viele Datenbank-Optionen

**Stack:**
```
Frontend: React + Vite
Backend: Node.js + Express
Datenbank: PostgreSQL oder MongoDB (empfohlen: PostgreSQL)
```

### Datenbankwahl (mit Express)

| DB | Typ | Vorteile | Nachteil |
|----|-----|----------|---------|
| **PostgreSQL** | Relational | Stabil, robust, kostenlos | Komplexere Queries |
| **MongoDB** | NoSQL/JSON | Einfach, flexibel, JSON-nativ | Keine Joins |
| **SQLite** | Lokal | Schnell starten, Datei-basiert | Nur lokal/Single-User |

**Für Anfang:** SQLite oder MongoDB (einfach zu starten)  
**Für Production:** PostgreSQL (professionell & skalierbar)

### ✅ Schritt 3: Frontend & Backend starten
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev
```

Frontend läuft auf: `http://localhost:5173`  
Backend läuft auf: `http://localhost:5000`