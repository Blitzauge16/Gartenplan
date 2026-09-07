-- Gartenplan-Datenbank, abgeleitet aus dem ER-Modell:
--   Ort (ID, x-Koordinate, y-Koordinate)
--   Gewächs (Name, lateinischer Name, Herkunft, benötigtes Licht, Blühzeit, Notizen)
--   Typ (Name)
--   gepflanzt: Ort n—m Gewächs, mit Datum und Notizen  -> Verknüpfungstabelle
--   haben:     Gewächs n—m Typ                          -> Verknüpfungstabelle

CREATE TABLE IF NOT EXISTS ort (
  id            SERIAL PRIMARY KEY,
  x_koordinate  DOUBLE PRECISION NOT NULL,
  y_koordinate  DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS gewaechs (
  id                 SERIAL PRIMARY KEY,
  name               TEXT NOT NULL,
  lateinischer_name  TEXT,
  herkunft           TEXT,
  benoetigtes_licht  TEXT,
  bluehzeit          TEXT,
  notizen            TEXT
);

CREATE TABLE IF NOT EXISTS typ (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

-- Beziehung "gepflanzt": welches Gewächs wurde wann an welchem Ort gepflanzt
CREATE TABLE IF NOT EXISTS gepflanzt (
  id           SERIAL PRIMARY KEY,
  ort_id       INTEGER NOT NULL REFERENCES ort(id) ON DELETE CASCADE,
  gewaechs_id  INTEGER NOT NULL REFERENCES gewaechs(id) ON DELETE CASCADE,
  datum        DATE,
  notizen      TEXT
);

-- Beziehung "haben": welche Typen ein Gewächs hat
CREATE TABLE IF NOT EXISTS gewaechs_typ (
  gewaechs_id  INTEGER NOT NULL REFERENCES gewaechs(id) ON DELETE CASCADE,
  typ_id       INTEGER NOT NULL REFERENCES typ(id) ON DELETE CASCADE,
  PRIMARY KEY (gewaechs_id, typ_id)
);

CREATE INDEX IF NOT EXISTS idx_gepflanzt_ort ON gepflanzt(ort_id);
CREATE INDEX IF NOT EXISTS idx_gepflanzt_gewaechs ON gepflanzt(gewaechs_id);
