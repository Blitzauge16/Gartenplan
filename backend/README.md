# Gartenplan Backend

REST-API für den interaktiven Gartenplan. Stack: **Node.js + Express + PostgreSQL** (via Docker).

## Ordnerstruktur

```
backend/
├── server.js            # Einstiegspunkt: Express-Server, CORS, bindet alle Routen ein
├── docker-compose.yml   # Startet PostgreSQL 17 im Docker-Container
├── .env                 # Konfiguration: PORT und DATABASE_URL (nicht in Git)
├── .env.example         # Vorlage für .env
├── db/
│   ├── schema.sql       # Datenbankschema (Tabellen aus dem ER-Modell)
│   ├── connection.js    # Zentraler pg-Verbindungspool, wird von allen Routen genutzt
│   └── init.js          # Spielt schema.sql manuell ein (npm run db:init)
└── routes/
    ├── orte.js          # /api/orte       – Orte im Gartenplan (x/y-Koordinaten)
    ├── gewaechse.js     # /api/gewaechse  – Pflanzen inkl. Typ-Zuordnung
    ├── typen.js         # /api/typen      – Kategorien (z. B. Staude, Gemüse)
    └── gepflanzt.js     # /api/gepflanzt  – was wurde wo wann gepflanzt
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

# 4. Docker neustarten nach schema.sql änderungen
docker compose down -v ; docker compose up -d
```

Die API läuft dann auf `http://localhost:5000`. Schnelltest:

```bash
curl http://localhost:5000/api/health
```

### npm-Skripte

| Skript | Zweck |
|---|---|
| `npm run dev` | Server mit nodemon (startet bei Codeänderungen neu) |
| `npm start` | Server ohne Auto-Reload (Produktion) |
| `npm run db:init` | `db/schema.sql` erneut einspielen (z. B. nach Schema-Änderungen; alle `CREATE` sind mit `IF NOT EXISTS` abgesichert) |

### Konfiguration (.env)

| Variable | Bedeutung | Standard |
|---|---|---|
| `PORT` | Port des Express-Servers | `5000` |
| `DATABASE_URL` | PostgreSQL-Verbindung: `postgres://benutzer:passwort@host:port/datenbank` | `postgres://gartenplan:gartenplan@localhost:5432/gartenplan` |

## Datenbankschema

Umsetzung des ER-Modells. Die beiden n:m-Beziehungen („gepflanzt“ und „haben“)
werden zu Verknüpfungstabellen:

```
ort (1) ──< gepflanzt >── (1) gewaechs (1) ──< gewaechs_typ >── (1) typ
```

| Tabelle | Spalten | Beschreibung |
|---|---|---|
| `ort` | `id`, `x_koordinate`, `y_koordinate`, `bereich` | Position im Gartenplan; `bereich` ist die Hotspot-ID des Areals (z. B. `gewaechshaus`), zu dem der Punkt gehört |
| `gewaechs` | `id`, `name`, `lateinischer_name`, `herkunft`, `benoetigtes_licht`, `bluehzeit`, `notizen` | Eine Pflanze/Pflanzenart |
| `typ` | `id`, `name` (eindeutig) | Kategorie, z. B. „Staude“ |
| `gepflanzt` | `id`, `ort_id`→ort, `gewaechs_id`→gewaechs, `datum`, `notizen` | Beziehung „Gewächs wurde an Ort gepflanzt“ |
| `gewaechs_typ` | `gewaechs_id`→gewaechs, `typ_id`→typ (zusammen Primärschlüssel) | Beziehung „Gewächs hat Typ“ |

Alle Fremdschlüssel haben `ON DELETE CASCADE`: Löscht man z. B. einen Ort,
verschwinden automatisch auch dessen `gepflanzt`-Einträge.

## API-Referenz

Alle Endpunkte senden und empfangen JSON. Fehler kommen als `{ "error": "..." }`
mit passendem HTTP-Status (400 = ungültige Eingabe, 404 = nicht gefunden, 500 = Serverfehler).

### Health

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/health` | Lebenszeichen der API |

### Orte — `/api/orte`

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| GET | `/` | – | Alle Orte; `?bereich=gewaechshaus` filtert nach Areal |
| GET | `/:id` | – | Ein Ort |
| POST | `/` | `{ x_koordinate, y_koordinate, bereich? }` | Ort anlegen |
| PUT | `/:id` | `{ x_koordinate, y_koordinate, bereich? }` | Ort ändern (z. B. Pflanze im Editor verschoben) |
| DELETE | `/:id` | – | Ort löschen (inkl. seiner Pflanzungen) |

### Gewächse — `/api/gewaechse`

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| GET | `/` | – | Alle Gewächse, jeweils mit `typen`-Array |
| GET | `/:id` | – | Ein Gewächs mit `typen`-Array |
| POST | `/` | `{ name, lateinischer_name?, herkunft?, benoetigtes_licht?, bluehzeit?, notizen? }` | Gewächs anlegen (`name` ist Pflicht) |
| PUT | `/:id` | wie POST | Gewächs ändern |
| DELETE | `/:id` | – | Gewächs löschen |
| POST | `/:id/typen` | `{ typ_id }` | Typ zuordnen (doppelte Zuordnung ist harmlos) |
| DELETE | `/:id/typen/:typId` | – | Typ-Zuordnung entfernen |

Beispiel-Antwort `GET /api/gewaechse/1`:

```json
{
  "id": 1,
  "name": "Lavendel",
  "lateinischer_name": "Lavandula angustifolia",
  "herkunft": "Mittelmeerraum",
  "benoetigtes_licht": "vollsonnig",
  "bluehzeit": "Juni–August",
  "notizen": null,
  "typen": [{ "id": 2, "name": "Staude" }]
}
```

### Typen — `/api/typen`

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| GET | `/` | – | Alle Typen |
| POST | `/` | `{ name }` | Typ anlegen (existiert der Name schon, wird der vorhandene zurückgegeben) |
| DELETE | `/:id` | – | Typ löschen (inkl. seiner Zuordnungen) |

### Pflanzungen — `/api/gepflanzt`

| Methode | Pfad | Body | Beschreibung |
|---|---|---|---|
| GET | `/` | – | Alle Pflanzungen mit eingebettetem `ort`- und `gewaechs`-Objekt |
| GET | `/ort/:ortId` | – | Alles, was an einem Ort gepflanzt ist |
| GET | `/bereich/:bereich` | – | Alle Pflanzungen eines Areals inkl. Koordinaten und Gewächsdaten (Datenquelle des Bereichs-Editors im Frontend) |
| POST | `/` | `{ ort_id, gewaechs_id, datum?, notizen? }` | Pflanzung anlegen |
| PUT | `/:id` | wie POST | Pflanzung ändern |
| DELETE | `/:id` | – | Pflanzung löschen |

Beispiel-Ablauf „Lavendel am Gewächshaus-Beet eintragen“:

```bash
curl -X POST http://localhost:5000/api/orte -H "Content-Type: application/json" -d '{"x_koordinate": 474, "y_koordinate": 347}'
```

```bash
curl -X POST http://localhost:5000/api/gewaechse -H "Content-Type: application/json" -d '{"name": "Lavendel", "bluehzeit": "Juni-August"}'
```

```bash
curl -X POST http://localhost:5000/api/gepflanzt -H "Content-Type: application/json" -d '{"ort_id": 1, "gewaechs_id": 1, "datum": "2026-09-13"}'
```

## Nützliche Docker-Befehle

```bash
docker compose up -d        # Datenbank starten
docker compose down         # Datenbank stoppen (Daten bleiben im Volume erhalten)
docker compose down -v      # Datenbank stoppen UND alle Daten löschen
docker exec -it gartenplan-db psql -U gartenplan   # SQL-Konsole in der Datenbank öffnen
```
