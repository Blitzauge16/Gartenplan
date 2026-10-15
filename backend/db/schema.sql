-- Gartenplan-Datenbank, abgeleitet aus dem ER-Modell (backend/data/ER-Modell_Gartenplan.drawio):
--
--   thing      Oberbegriff für alles, was im Plan platziert werden kann.
--              Jedes thing ist genau eines von: gewaechs, objects oder shape
--              ("gehört zu"-Beziehung, umgesetzt als gemeinsamer Primärschlüssel thing_id).
--   gewaechs   Pflanze (name, lateinischer_name, herkunft, benoetigtes_licht, bluehzeit, typ, notizen)
--   objects    Gegenstand im Garten (name, notizen), z. B. Bank, Regentonne
--   shape      Rechteckige Form (width, height, notizen), z. B. zum Markieren einer Fläche
--   icon       Hochgeladenes, rund zugeschnittenes Bild (dateiname, erstellt_am);
--              gewaechs und objects "haben" optional ein icon
--   ort        Position im Gartenplan (x_koordinate, y_koordinate, bereich)
--   platziert  Beziehung thing n—m ort mit datum und notizen
--
-- Alle CREATE-Anweisungen sind mit IF NOT EXISTS abgesichert, das Schema kann
-- also gefahrlos mehrfach eingespielt werden (npm run db:init).
-- Für Datenbanken mit der alten Struktur (gewaechs.id, gepflanzt, typ):
-- npm run db:migrate übernimmt die vorhandenen Daten.

-- Hochgeladene Icons. Die Bilddatei liegt unter backend/uploads/icons/<dateiname>,
-- die Datenbank speichert nur die Metadaten.
CREATE TABLE IF NOT EXISTS icon (
  id           SERIAL PRIMARY KEY,
  dateiname    TEXT NOT NULL UNIQUE,
  erstellt_am  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Obertabelle: vergibt die thing_id, die von genau einer Subtyp-Tabelle genutzt wird
CREATE TABLE IF NOT EXISTS thing (
  thing_id  SERIAL PRIMARY KEY
);

-- Subtyp Gewächs (Pflanze)
CREATE TABLE IF NOT EXISTS gewaechs (
  thing_id           INTEGER PRIMARY KEY REFERENCES thing(thing_id) ON DELETE CASCADE,
  icon_id            INTEGER REFERENCES icon(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  lateinischer_name  TEXT,
  herkunft           TEXT,
  benoetigtes_licht  TEXT,
  bluehzeit          TEXT,
  typ                TEXT,
  notizen            TEXT
);

-- Subtyp Objekt (Gegenstand)
CREATE TABLE IF NOT EXISTS objects (
  thing_id  INTEGER PRIMARY KEY REFERENCES thing(thing_id) ON DELETE CASCADE,
  icon_id   INTEGER REFERENCES icon(id) ON DELETE SET NULL,
  name      TEXT NOT NULL,
  notizen   TEXT
);

-- Subtyp Form (Rechteck). width/height in Plan-Koordinaten, also derselben
-- Einheit wie ort.x_koordinate/y_koordinate.
CREATE TABLE IF NOT EXISTS shape (
  thing_id  INTEGER PRIMARY KEY REFERENCES thing(thing_id) ON DELETE CASCADE,
  width     DOUBLE PRECISION NOT NULL,
  height    DOUBLE PRECISION NOT NULL,
  notizen   TEXT
);

-- Ort im Plan. bereich ist die Hotspot-ID des Areals (z. B. "gewaechshaus").
CREATE TABLE IF NOT EXISTS ort (
  id            SERIAL PRIMARY KEY,
  x_koordinate  DOUBLE PRECISION NOT NULL,
  y_koordinate  DOUBLE PRECISION NOT NULL,
  bereich       TEXT
);

-- Beziehung "platziert": welches thing steht wo (und seit wann)
CREATE TABLE IF NOT EXISTS platziert (
  id        SERIAL PRIMARY KEY,
  thing_id  INTEGER NOT NULL REFERENCES thing(thing_id) ON DELETE CASCADE,
  ort_id    INTEGER NOT NULL REFERENCES ort(id) ON DELETE CASCADE,
  datum     DATE,
  notizen   TEXT,
  UNIQUE (thing_id, ort_id)
);

CREATE INDEX IF NOT EXISTS idx_platziert_thing ON platziert(thing_id);
CREATE INDEX IF NOT EXISTS idx_platziert_ort ON platziert(ort_id);
CREATE INDEX IF NOT EXISTS idx_ort_bereich ON ort(bereich);
