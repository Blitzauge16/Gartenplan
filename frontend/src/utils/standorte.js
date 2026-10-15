import hotspotMeta from '../data/hotspotMeta'

// Macht aus den Platzierungen eines things eine Liste von Standorten für die
// Anzeige: gruppiert nach Bereich; stehen mehrere im selben Bereich, werden
// sie durchnummeriert ("Rosenbeet 1", "Rosenbeet 2").
export function buildStandorte(platzierungen) {
  const countPerBereich = {}
  for (const p of platzierungen) {
    countPerBereich[p.ort.bereich] = (countPerBereich[p.ort.bereich] ?? 0) + 1
  }
  const seen = {}
  return platzierungen.map((p) => {
    const bereich = p.ort.bereich
    const title = hotspotMeta[bereich]?.title ?? bereich ?? 'Unbekannter Bereich'
    seen[bereich] = (seen[bereich] ?? 0) + 1
    return {
      id: p.id,
      bereich,
      label: countPerBereich[bereich] > 1 ? `${title} ${seen[bereich]}` : title,
      datum: p.datum,
    }
  })
}

export function formatDatum(datum) {
  if (!datum) return null
  return new Date(datum).toLocaleDateString('de-DE')
}
