// Klickbare Bereiche des Gartenplans. Der Key muss dem inkscape:label
// in grundstuecksplan.svg entsprechen.
// Mit `alias` verweist eine Teilfläche auf ihren Hauptbereich: Klicks führen
// dann zu dessen URL (/bereich/<alias>) und teilen dessen Daten. Auf der
// Detailseite werden Hauptbereich und alle Teilflächen gemeinsam angezeigt.
const hotspotMeta = {
  //Gebaeude
  haus: {
    title: 'Haus',
  },
  haus_tuer: {
    title: 'Haus',
    alias: 'haus',
  },
  haus_varanda: {
    title: 'Haus',
    alias: 'haus',
  },
  schuppen: {
    title: 'Schuppen',
  },
  schuppenanbau: {
    title: 'Schuppenanbau',
  },
  garage: {
    title: 'Garage'
  },
  gewaechshaus: {
    title: 'Gewächshaus',
  },
  holzschuppen: {
    title: 'Holzschuppen',
  },
  sitzecke: {
    title: 'Sitzecke',
  },
  //baeume
  apfelbaum: {
    title: 'Apfelbaum',
    alias: 'apfelbaumbeet',  // gehört zum Apfelbaumbeet
  },
  apfelbaum2: {
    title: 'Apfelbaum',
  },
  pflaumenbaum: {
    title: 'Pflaumenbaum',
  },
  //beete
  rosenbeet: {
    title: 'Rosenbeet',
  },
  apfelbaumbeet: {
    title: 'Apfelbaumbeet',
    // Hauptbereich: KEIN alias — hierher verweist apfelbaum
  },
  hofbeet2: {
    title: 'Hofbeet 2',
  },
  rosenbeet_sitzecke: {
    title: 'Rosenbeet',
  },
  hauptbeet2: {
    title: 'Hauptbeet 2',
  },
  hauptbeet1: {
    title: 'Hauptbeet 1',
  },
  hauptbeet3: {
    title: 'Hauptbeet 3',
  },
  hauptbeet4: {
    title: 'Hauptbeet 4',
  },
  gemuesebeet: {
    title: 'Gemüsebeet',
  },
  waldbeet_kompost: {
    title: 'Waldbeet & Kompost',
  },
  waldbeet_garten: {
    title: 'Waldbeet ',
  },
  waldbeet_eingang: {
    title: 'Waldbeet',
  },
  kirschbaumbeet: {
    title: 'Kirschbaumbeet',
  },
  teichbeet: {
    title: 'Teichbeet',
  },
  holzschuppenbeet: {
    title: 'Holzschuppenbeet',
  },
  weintraubenbeet: {
    title: 'Weintraubenbeet',
  },
  hofbeet: {
    title: 'Hofbeet',
  },
  nussbaum_beet: {
    title: 'Nussbaumbeet',
  },
  einfahrtbeet1: {
    title: 'Einfahrtbeet',
    // Hauptbereich: KEIN alias — hierher verweisen die anderen Einfahrtbeet-Teile
  },
  einfahrtbeet2: {
    title: 'Einfahrtbeet',
    alias: 'einfahrtbeet1',
  },
  einfahrtbeet_rhododendron: {
    title: 'Einfahrtbeet',
    alias: 'einfahrtbeet1',
  },
  //Hecke
  hecke1: {
    title: 'Hecke Links Eingang',
  },
  hecke2: {
    title: 'Hecke Rechts Eingang',
  },
  hecke3: {
    title: 'Hecke Schiewer',
  },
  hecke_tor: {
    title: 'Hecke Turm',
  },
  //Grundfläche
};

// Löst eine Hotspot-ID auf ihren Hauptbereich auf (folgt dem alias, falls vorhanden)
export function resolveHotspotId(id) {
  return hotspotMeta[id]?.alias ?? id
}

// Alle SVG-Labels, die zu einem Hauptbereich gehören (er selbst + seine Teilflächen)
export function labelsForBereich(bereich) {
  return Object.keys(hotspotMeta).filter((key) => resolveHotspotId(key) === bereich)
}

export default hotspotMeta;
