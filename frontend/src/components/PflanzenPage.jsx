import { useEffect, useState } from 'react'
import { api } from '../api'
import CreatePlantModal from './CreatePlantModal'

export default function PflanzenPage() {
  const [gewaechse, setGewaechse] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadData = async () => {
    try {
      const data = await api.getGewaechse()
      setGewaechse(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreated = () => {
    loadData()
  }

  if (loading) return <p>Lade Pflanzen...</p>
  if (error) return <p className="editor-error">{error}</p>

  return (
    <section className="main-layout">
      <div className="canvas-section">
        <h2>🌱 Alle Pflanzen</h2>

        <button
          type="button"
          className="editor-button"
          onClick={() => setShowCreateModal(true)}
          style={{ marginBottom: '1rem' }}
        >
          + Neue Pflanze anlegen
        </button>

        <CreatePlantModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />

        {gewaechse.length === 0 ? (
          <p>Noch keine Pflanzen angelegt.</p>
        ) : (
          <div className="pflanzen-grid">
            {gewaechse.map((g) => (
              <div key={g.id} className="pflanzen-card">
                <h3>{g.name}</h3>
                {g.lateinischer_name && (
                  <p className="pflanzen-latin">{g.lateinischer_name}</p>
                )}
                {g.herkunft && <p><strong>Herkunft:</strong> {g.herkunft}</p>}
                {g.benoetigtes_licht && <p><strong>Licht:</strong> {g.benoetigtes_licht}</p>}
                {g.bluehzeit && <p><strong>Blühzeit:</strong> {g.bluehzeit}</p>}
                {g.notizen && <p className="pflanzen-notes">{g.notizen}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
