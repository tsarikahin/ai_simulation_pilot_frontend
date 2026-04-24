import React, { useMemo, useState } from 'react'
import './App.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

// Simple markdown-like text renderer for bold and lists
function renderExplanation(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '')
  return lines.map((line, idx) => {
    // Handle headers (###, ##, #)
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const content = headerMatch[2]
      const tagName = `h${3 + level}`
      return React.createElement(tagName, { key: idx, className: 'explanation-heading' }, content)
    }

    // Handle bold text
    const parts = line.split(/\*\*(.+?)\*\*/g).map((part, i) => {
      return i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    })

    return <p key={idx}>{parts}</p>
  })
}

function App() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [visualization, setVisualization] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('explanation')

  const explainEndpoint = useMemo(() => `${apiBaseUrl.replace(/\/$/, '')}/explain`, [])
  const visualizeEndpoint = useMemo(() => `${apiBaseUrl.replace(/\/$/, '')}/visualize`, [])

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null

    setFile(nextFile)
    setResult(null)
    setVisualization(null)
    setError('')
  }

  const fetchVisualization = async (fileToVisualize) => {
    try {
      const formData = new FormData()
      formData.append('file', fileToVisualize)

      const response = await fetch(visualizeEndpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail ?? 'Visualization failed.')
      }

      const blob = await response.blob()
      const imageUrl = URL.createObjectURL(blob)
      setVisualization(imageUrl)
    } catch (visualizationError) {
      console.error('Visualization error:', visualizationError.message)
      setVisualization(null)
    }
  }

  const callApi = async () => {
    if (!file) {
      setError('Select an Abaqus .inp file before running the analysis.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setIsLoading(true)
    setError('')
    setVisualization(null)

    try {
      const response = await fetch(explainEndpoint, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail ?? 'Analysis request failed.')
      }

      setResult(data)
      
      // Fetch visualization after getting results
      await fetchVisualization(file)
    } catch (requestError) {
      setResult(null)
      setError(requestError.message || 'Unable to reach the backend.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">AI Simulation Pilot</p>
        <h1>SimCopilot</h1>
        <p className="lead">
          Upload an Abaqus input deck, send it to your local FastAPI backend, and
          inspect the parsed structure, validation issues, and generated explanation.
        </p>
      </section>

      <section className="workspace-panel">
        <div className="control-card">
          <label className="file-picker" htmlFor="inp-file">
            <span>Choose .inp file</span>
            <input
              id="inp-file"
              type="file"
              accept=".inp,text/plain"
              onChange={handleFileChange}
            />
          </label>

          <div className="selection-row">
            <span>{file ? file.name : 'No file selected yet'}</span>
            {file && <strong>{Math.ceil(file.size / 1024)} KB</strong>}
          </div>

          <button type="button" className="run-button" onClick={callApi} disabled={isLoading}>
            {isLoading ? 'Running analysis...' : 'Explain model with SimCopilot'}
          </button>

          {error && <p className="message error">{error}</p>}
          {!error && result && <p className="message success">Analysis completed successfully.</p>}
        </div>

        <div className="output-card">
          <div className="output-header">
            <h2>Analysis Results</h2>
            <span>{result ? 'Ready' : 'Waiting for request'}</span>
          </div>

          {!result ? (
            <div className="empty-state">
              <p>Run an analysis to view results and AI-generated explanation</p>
            </div>
          ) : (
            <>
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'visualization' ? 'active' : ''}`}
                  onClick={() => setActiveTab('visualization')}
                >
                  🎨 Visualization
                </button>
                <button
                  className={`tab ${activeTab === 'explanation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('explanation')}
                >
                  📝 Explanation
                </button>
                <button
                  className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('validation')}
                >
                  ✓ Validation Issues ({result.validation_issues?.length || 0})
                </button>
                <button
                  className={`tab ${activeTab === 'json' ? 'active' : ''}`}
                  onClick={() => setActiveTab('json')}
                >
                  {'</>'} JSON
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'visualization' && (
                  <div className="visualization-panel">
                    {visualization ? (
                      <img src={visualization} alt="Mesh visualization" className="mesh-image" />
                    ) : (
                      <p className="loading-message">Loading visualization...</p>
                    )}
                  </div>
                )}

                {activeTab === 'explanation' && (
                  <div className="explanation-panel">
                    {renderExplanation(result.explanation)}
                  </div>
                )}

                {activeTab === 'validation' && (
                  <div className="validation-panel">
                    {result.validation_issues && result.validation_issues.length > 0 ? (
                      <ul className="issues-list">
                        {result.validation_issues.map((issue, idx) => (
                          <li key={idx} className="issue-item">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="success-message">✓ No validation issues found!</p>
                    )}
                  </div>
                )}

                {activeTab === 'json' && (
                  <pre className="json-view">{JSON.stringify(result, null, 2)}</pre>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
