// Kleiner Client für die Backend-API.
// Basis-URL kann über VITE_API_URL in frontend/.env überschrieben werden.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

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
  getGewaechse: () => request('/gewaechse'),
  createGewaechs: (data) => request('/gewaechse', { method: 'POST', body: data }),

  createOrt: (data) => request('/orte', { method: 'POST', body: data }),
  updateOrt: (id, data) => request(`/orte/${id}`, { method: 'PUT', body: data }),
  deleteOrt: (id) => request(`/orte/${id}`, { method: 'DELETE' }),

  getPflanzungenForBereich: (bereich) => request(`/gepflanzt/bereich/${bereich}`),
  createPflanzung: (data) => request('/gepflanzt', { method: 'POST', body: data }),
}
