// Klickbare Bereiche des Gartenplans. Der Key muss dem inkscape:label
// in grundstuecksplan.svg entsprechen.
// Mit `alias` verweist eine Teilfläche auf ihren Hauptbereich: Klicks führen
// dann zu dessen URL (/bereich/<alias>) und teilen dessen Daten. Auf der
// Detailseite werden Hauptbereich und alle Teilflächen gemeinsam angezeigt.
//
// `category` bestimmt die Sidebar-Gruppe: 'gebaeude', 'beet', 'baum', 'hecke'
const hotspotMeta = {
  // Gebäude
  haus: { title: 'Haus', category: 'gebaeude' },
  haus_tuer: { title: 'Haus', alias: 'haus' },
  haus_varanda: { title: 'Haus', alias: 'haus' },
  schuppen: { title: 'Schuppen', category: 'gebaeude' },
  schuppenanbau: { title: 'Schuppenanbau', category: 'gebaeude' },
  garage: { title: 'Garage', category: 'gebaeude' },
  gewaechshaus: { title: 'Gewächshaus', category: 'gebaeude' },
  holzschuppen: { title: 'Holzschuppen', category: 'gebaeude' },
  sitzecke: { title: 'Sitzecke', category: 'gebaeude' },

  // Bäume
  apfelbaum: { title: 'Apfelbaum', alias: 'apfelbaumbeet' },
  apfelbaum2: { title: 'Apfelbaum 2', category: 'baum' },
  pflaumenbaum: { title: 'Pflaumenbaum', category: 'baum' },

  // Beete
  rosenbeet: { title: 'Rosenbeet', category: 'beet' },
  apfelbaumbeet: { title: 'Apfelbaumbeet', category: 'beet' },
  hofbeet2: { title: 'Hofbeet 2', category: 'beet' },
  rosenbeet_sitzecke: { title: 'Rosenbeet Sitzecke', category: 'beet' },
  hauptbeet2: { title: 'Hauptbeet 2', category: 'beet' },
  hauptbeet1: { title: 'Hauptbeet 1', category: 'beet' },
  hauptbeet3: { title: 'Hauptbeet 3', category: 'beet' },
  hauptbeet4: { title: 'Hauptbeet 4', category: 'beet' },
  gemuesebeet: { title: 'Gemüsebeet', category: 'beet' },
  waldbeet_kompost: { title: 'Waldbeet & Kompost', category: 'beet' },
  waldbeet_garten: { title: 'Waldbeet Garten', category: 'beet' },
  waldbeet_eingang: { title: 'Waldbeet Eingang', category: 'beet' },
  kirschbaumbeet: { title: 'Kirschbaumbeet', category: 'beet' },
  teichbeet: { title: 'Teichbeet', category: 'beet' },
  holzschuppenbeet: { title: 'Holzschuppenbeet', category: 'beet' },
  weintraubenbeet: { title: 'Weintraubenbeet', category: 'beet' },
  hofbeet: { title: 'Hofbeet', category: 'beet' },
  nussbaum_beet: { title: 'Nussbaumbeet', category: 'beet' },
  einfahrtbeet1: { title: 'Einfahrtbeet', category: 'beet' },
  einfahrtbeet2: { title: 'Einfahrtbeet', alias: 'einfahrtbeet1' },
  einfahrtbeet_rhododendron: { title: 'Einfahrtbeet', alias: 'einfahrtbeet1' },

  // Hecken
  hecke1: { title: 'Hecke Links Eingang', category: 'hecke' },
  hecke2: { title: 'Hecke Rechts Eingang', category: 'hecke' },
  hecke3: { title: 'Hecke Schiewer', category: 'hecke' },
  hecke_tor: { title: 'Hecke Turm', category: 'hecke' },
};

// Löst eine Hotspot-ID auf ihren Hauptbereich auf (folgt dem alias, falls vorhanden)
export function resolveHotspotId(id) {
  return hotspotMeta[id]?.alias ?? id
}

// Alle SVG-Labels, die zu einem Hauptbereich gehören (er selbst + seine Teilflächen)
export function labelsForBereich(bereich) {
  return Object.keys(hotspotMeta).filter((key) => resolveHotspotId(key) === bereich)
}

// Gibt alle Bereiche einer Kategorie zurück (ohne Aliase)
export function getByCategory(category) {
  return Object.entries(hotspotMeta)
    .filter(([, meta]) => !meta.alias && meta.category === category)
    .map(([id, meta]) => ({ id, ...meta }))
}

export default hotspotMeta;
