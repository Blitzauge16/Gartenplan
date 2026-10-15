// Kleiner Client für die Backend-API.
// Basis-URL kann über VITE_API_URL in frontend/.env überschrieben werden.
//
// Datenmodell (siehe backend/db/schema.sql): Alles, was im Plan stehen kann,
// ist ein "thing" mit einer thing_id — entweder ein Gewächs (Pflanze), ein
// Objekt (Gegenstand) oder eine Form (Rechteck). Eine "Platzierung" verbindet
// ein thing mit einem Ort (x/y im Plan + Bereich).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'
// Ursprung des Backends (ohne /api) für statische Dateien wie Icons
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')

// Macht aus einem relativen Pfad des Backends (z. B. "/uploads/icons/x.png")
// eine vollständige URL. Gibt null zurück, wenn kein Pfad vorliegt.
export function assetUrl(path) {
  if (!path) return null
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new Error(
      'Backend nicht erreichbar. Läuft der Server (npm run dev im backend) und die Datenbank (docker compose up -d)?'
    )
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Fehler ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // Gewächse (Pflanzen) — Schlüssel: thing_id
  getGewaechse: () => request('/gewaechse'),
  getGewaechs: (thingId) => request(`/gewaechse/${thingId}`),
  createGewaechs: (data) => request('/gewaechse', { method: 'POST', body: data }),
  updateGewaechs: (thingId, data) => request(`/gewaechse/${thingId}`, { method: 'PUT', body: data }),
  deleteGewaechs: (thingId) => request(`/gewaechse/${thingId}`, { method: 'DELETE' }),

  // Objekte (Gegenstände) — Schlüssel: thing_id
  getObjects: () => request('/objects'),
  getObject: (thingId) => request(`/objects/${thingId}`),
  createObject: (data) => request('/objects', { method: 'POST', body: data }),
  updateObject: (thingId, data) => request(`/objects/${thingId}`, { method: 'PUT', body: data }),
  deleteObject: (thingId) => request(`/objects/${thingId}`, { method: 'DELETE' }),

  // Formen (Rechtecke) — Schlüssel: thing_id; width/height in Plan-Einheiten
  getShapes: () => request('/shapes'),
  createShape: (data) => request('/shapes', { method: 'POST', body: data }),
  updateShape: (thingId, data) => request(`/shapes/${thingId}`, { method: 'PUT', body: data }),
  deleteShape: (thingId) => request(`/shapes/${thingId}`, { method: 'DELETE' }),

  // Orte (Positionen im Plan)
  createOrt: (data) => request('/orte', { method: 'POST', body: data }),
  updateOrt: (id, data) => request(`/orte/${id}`, { method: 'PUT', body: data }),
  deleteOrt: (id) => request(`/orte/${id}`, { method: 'DELETE' }),

  // Platzierungen (thing an Ort). Jede Antwort enthält ort {…} und thing {art, …}
  getPlatzierungenForBereich: (bereich) => request(`/platziert/bereich/${bereich}`),
  getPlatzierungenForThing: (thingId) => request(`/platziert/thing/${thingId}`),
  // data: { thing_id, ort_id } oder { thing_id, x_koordinate, y_koordinate, bereich }, optional datum/notizen
  createPlatzierung: (data) => request('/platziert', { method: 'POST', body: data }),
  // data: { datum, notizen }
  updatePlatzierung: (id, data) => request(`/platziert/${id}`, { method: 'PUT', body: data }),
  deletePlatzierung: (id) => request(`/platziert/${id}`, { method: 'DELETE' }),

  // Icons
  getIcons: () => request('/icons'),
  // data: PNG als Data-URL ("data:image/png;base64,…")
  createIcon: (data) => request('/icons', { method: 'POST', body: data }),
  deleteIcon: (id) => request(`/icons/${id}`, { method: 'DELETE' }),
}
