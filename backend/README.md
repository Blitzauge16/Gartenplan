# Gartenplan Backend

REST-API für den interaktiven Gartenplan. Stack: **Node.js + Express + PostgreSQL** (via Docker).

## Ordnerstruktur

```
backend/
├── server.js            # Einstiegspunkt: Express-Server, CORS, bindet alle Routen ein
├── docker-compose.yml   # Startet PostgreSQL 17 im Docker-Container
├── .env                 # Konfiguration: PORT und DATABASE_URL (nicht in Git)
├── .env.example         # Vorlage für .env
├── data/                # ER-Modell und Klassendiagramm (draw.io)
├── db/
│   ├── schema.sql       # Datenbankschema (Tabellen aus dem ER-Modell)
│   ├── connection.js    # Zentraler pg-Verbindungspool, wird von allen Routen genutzt
│   ├── things.js        # Helfer für die Obertabelle thing (Transaktionen, Löschen, Parsen)
│   ├── init.js          # Spielt schema.sql ein (npm run db:init)
│   └── migrate.js       # Übernimmt Daten aus der alten Struktur (npm run db:migrate)
├── uploads/icons/       # Hochgeladene Icon-Bilder (nicht in Git)
└── routes/
    ├── gewaechse.js     # /api/gewaechse  – Pflanzen (Subtyp von thing)
    ├── objects.js       # /api/objects    – Gegenstände (Subtyp von thing)
    ├── shapes.js        # /api/shapes     – Rechteck-Formen (Subtyp von thing)
    ├── orte.js          # /api/orte       – Positionen im Gartenplan (x/y + Bereich)
    ├── platziert.js     # /api/platziert  – was steht wo (thing ↔ Ort)
    └── icons.js         # /api/icons      – Icon-Upload und -Verwaltung
```

## Setup & Starten

Voraussetzung: Docker Desktop ist installiert und läuft.

```bash
# 1. Datenbank starten (beim ersten Start wird das Schema automatisch eingespielt)
docker compose up -d

# 2. Abhängigkeiten installieren (nur beim ersten Mal)
npm install

# 3. Server starten (Entwicklung, mit Auto-Reload)
npm run dev
```

Die API läuft dann auf `http://localhost:5000`. Schnelltest:

```bash
curl http://localhost:5000/api/health
```

### Bestehende Datenbank auf das neue Schema bringen

Wer die Datenbank schon mit der alten Struktur (`gewaechs.id`, `gepflanzt`, `typ`)
benutzt hat, übernimmt seine Daten mit:

```bash
npm run db:migrate
```

Alternativ ohne Datenübernahme komplett neu aufsetzen:

```bash
docker compose down -v ; docker compose up -d
```

### npm-Skripte

| Skript | Zweck |
|---|---|
| `npm run dev` | Server mit nodemon (startet bei Codeänderungen neu) |
| `npm start` | Server ohne Auto-Reload (Produktion) |
| `npm run db:init` | `db/schema.sql` einspielen (alle `CREATE` sind mit `IF NOT EXISTS` abgesichert) |
| `npm run db:migrate` | Alte Struktur in die neue überführen, Daten bleiben erhalten (läuft in einer Transaktion) |

### Konfiguration (.env)

| Variable | Bedeutung | Standard |
|---|---|---|
| `PORT` | Port des Express-Servers | `5000` |
| `DATABASE_URL` | PostgreSQL-Verbindung: `postgres://benutzer:passwort@host:port/datenbank` | `postgres://gartenplan:gartenplan@localhost:5432/gartenplan` |

## Datenbankschema

Umsetzung des ER-Modells ([data/ER-Modell_Gartenplan.drawio](data/ER-Modell_Gartenplan.drawio)).
Alles, was im Plan stehen kann, ist ein **thing**. Ein thing ist genau eines von
Gewächs, Objekt oder Form („gehört zu“); die Subtyp-Tabellen teilen sich den
Primärschlüssel `thing_id`. Die Beziehung „platziert“ verbindet things mit Orten.

| Tabelle | Spalten | Beschreibung |
|---|---|---|
| `thing` | `thing_id` | Obertabelle, vergibt die ID |
| `gewaechs` | `thing_id`→thing, `icon_id`→icon, `name`, `lateinischer_name`, `herkunft`, `benoetigtes_licht`, `bluehzeit`, `typ`, `notizen` | Pflanze. `typ` ist ein freies Textfeld (z. B. „Staude“) |
| `objects` | `thing_id`→thing, `icon_id`→icon, `name`, `notizen` | Gegenstand (Bank, Regentonne, …) |
| `shape` | `thing_id`→thing, `width`, `height`, `notizen` | Rechteck; Maße in Plan-Einheiten, der Ort ist der Mittelpunkt |
| `icon` | `id`, `dateiname`, `erstellt_am` | Hochgeladenes Bild; Datei liegt unter `uploads/icons/<dateiname>` |
| `ort` | `id`, `x_koordinate`, `y_koordinate`, `bereich` | Position im Plan; `bereich` ist die Hotspot-ID des Areals (z. B. `gewaechshaus`) |
| `platziert` | `id`, `thing_id`→thing, `ort_id`→ort, `datum`, `notizen` | „thing steht an Ort“; `(thing_id, ort_id)` ist eindeutig |

Fremdschlüssel auf `thing` und `ort` haben `ON DELETE CASCADE`, `icon_id` hat
`ON DELETE SET NULL`. Beim Löschen eines things oder einer Platzierung räumt die
API Orte mit auf, an denen sonst nichts mehr steht.

Hinweis: Koordinaten und Maße sind `DOUBLE PRECISION` (nicht Integer wie im
Klassendiagramm), weil der Editor frei in Plan-Koordinaten positioniert.

## API-Referenz

Alle Endpunkte senden und empfangen JSON. Fehler kommen als `{ "error": "..." }`
mit passendem HTTP-Status (400 = ungültige Eingabe, 404 = nicht gefunden, 500 = Serverfehler).
Leere Strings werden als `NULL` gespeichert.

### Health

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/health` | Lebenszeichen der API |

### Gewächse — `/api/gewaechse`

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| GET | `/` | – | Alle Gewächse, jeweils mit `icon_url` und `anzahl_platzierungen` |
| GET | `/:id` | – | Ein Gewächs (`id` = `thing_id`) |
| POST | `/` | `{ name, lateinischer_name?, herkunft?, benoetigtes_licht?, bluehzeit?, typ?, notizen?, icon_id? }` | Gewächs anlegen (`name` ist Pflicht) |
| PUT | `/:id` | wie POST | Gewächs ändern |
| DELETE | `/:id` | – | Gewächs löschen (inkl. Platzierungen und verwaister Orte) |

Beispiel-Antwort `GET /api/gewaechse/1`:

```json
{
  "thing_id": 1,
  "icon_id": null,
  "name": "Lavendel",
  "lateinischer_name": "Lavandula angustifolia",
  "herkunft": "Mittelmeerraum",
  "benoetigtes_licht": "vollsonnig",
  "bluehzeit": "Juni–August",
  "typ": "Staude",
  "notizen": null,
  "icon_url": null,
  "anzahl_platzierungen": 2
}
```

### Objekte — `/api/objects`

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| GET | `/` | – | Alle Objekte mit `icon_url` und `anzahl_platzierungen` |
| GET | `/:id` | – | Ein Objekt |
| POST | `/` | `{ name, notizen?, icon_id? }` | Objekt anlegen |
| PUT | `/:id` | wie POST | Objekt ändern |
| DELETE | `/:id` | – | Objekt löschen (inkl. Platzierungen) |

### Formen — `/api/shapes`

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| GET | `/` | – | Alle Formen |
| GET | `/:id` | – | Eine Form |
| POST | `/` | `{ width, height, notizen? }` | Form anlegen (Maße > 0) |
| PUT | `/:id` | wie POST | Form ändern (z. B. nach Skalieren im Editor) |
| DELETE | `/:id` | – | Form löschen (inkl. Platzierung) |

### Orte — `/api/orte`

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| GET | `/` | – | Alle Orte; `?bereich=gewaechshaus` filtert nach Areal |
| GET | `/:id` | – | Ein Ort |
| POST | `/` | `{ x_koordinate, y_koordinate, bereich? }` | Ort anlegen |
| PUT | `/:id` | `{ x_koordinate, y_koordinate, bereich? }` | Ort ändern (Marker verschoben); ohne `bereich` bleibt der alte Wert |
| DELETE | `/:id` | – | Ort löschen (inkl. aller Platzierungen dort) |

### Platzierungen — `/api/platziert`

Jede Antwort enthält ein `ort`-Objekt und ein `thing`-Objekt. `thing.art` ist
`"gewaechs"`, `"objekt"` oder `"shape"` und bestimmt, welche weiteren Felder
vorhanden sind (siehe Tabellen oben).

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| GET | `/` | – | Alle Platzierungen |
| GET | `/bereich/:bereich` | – | Alles, was in einem Areal steht (Datenquelle des Bereichs-Editors) |
| GET | `/thing/:thingId` | – | Alle Standorte eines things |
| GET | `/ort/:ortId` | – | Alles, was an einem Ort steht |
| GET | `/:id` | – | Eine Platzierung |
| POST | `/` | `{ thing_id, ort_id, datum?, notizen? }` **oder** `{ thing_id, x_koordinate, y_koordinate, bereich, datum?, notizen? }` | Platzierung anlegen; mit Koordinaten wird der Ort in einem Schritt mit erzeugt |
| PUT | `/:id` | `{ datum?, notizen? }` | Datum/Notizen ändern (Position über `/api/orte`) |
| DELETE | `/:id` | – | Platzierung löschen; der Ort wird mit entfernt, wenn dort sonst nichts steht |

Beispiel-Antwort `GET /api/platziert/bereich/rosenbeet`:

```json
[
  {
    "id": 7,
    "thing_id": 1,
    "ort_id": 3,
    "datum": "2026-05-02",
    "notizen": null,
    "ort": { "id": 3, "x_koordinate": 474.2, "y_koordinate": 347.9, "bereich": "rosenbeet" },
    "thing": { "thing_id": 1, "art": "gewaechs", "name": "Lavendel", "typ": "Staude", "icon_url": null, "…": "…" }
  }
]
```

Beispiel-Ablauf „Lavendel im Rosenbeet eintragen“:

```bash
curl -X POST http://localhost:5000/api/gewaechse -H "Content-Type: application/json" -d '{"name": "Lavendel", "typ": "Staude", "bluehzeit": "Juni-August"}'
```

```bash
curl -X POST http://localhost:5000/api/platziert -H "Content-Type: application/json" -d '{"thing_id": 1, "x_koordinate": 474, "y_koordinate": 347, "bereich": "rosenbeet", "datum": "2026-05-02"}'
```

### Icons — `/api/icons`

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| GET | `/` | – | Alle Icons mit `url` und `verwendungen` (Anzahl Gewächse + Objekte, die es nutzen) |
| POST | `/` | `{ data }` — PNG als Data-URL `data:image/png;base64,…` | Icon hochladen (max. 2 MB, nur PNG) |
| DELETE | `/:id` | – | Icon löschen; Gewächse/Objekte fallen auf das Standard-Icon zurück |

## Nützliche Docker-Befehle

```bash
docker compose up -d        # Datenbank starten
docker compose down         # Datenbank stoppen (Daten bleiben im Volume erhalten)
docker compose down -v      # Datenbank stoppen UND alle Daten löschen
docker exec -it gartenplan-db psql -U gartenplan   # SQL-Konsole in der Datenbank öffnen
```
