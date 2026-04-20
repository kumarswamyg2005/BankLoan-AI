import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadCSV, trainModel } from '../services/api'

export default function UploadPage() {
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [columns, setColumns]   = useState([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [training, setTraining] = useState(false)
  const [metrics, setMetrics]   = useState(null)
  const [error, setError]       = useState('')
  const inputRef = useRef()
  const nav = useNavigate()

  const handleFile = async (f) => {
    if (!f) return
    setFile(f)
    setError('')
    setUploading(true)
    try {
      const res = await uploadCSV(f)
      setColumns(res.data.columns)
      setPreview(res.data.preview)
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleTrain = async () => {
    setTraining(true)
    setError('')
    try {
      const res = await trainModel()
      setMetrics(res.data.metrics)
    } catch (e) {
      setError(e.response?.data?.detail || 'Training failed.')
    } finally {
      setTraining(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-navy-600 mb-6">Upload Training Data</h2>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition
          ${dragging ? 'border-navy-600 bg-navy-50' : 'border-slate-300 hover:border-navy-400'}`}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        <div className="text-4xl mb-3">📂</div>
        {file
          ? <p className="font-semibold text-navy-600">{file.name}</p>
          : <><p className="font-medium text-slate-600">Drag & drop cs-training.csv here</p>
              <p className="text-slate-400 text-sm mt-1">or click to browse</p></>
        }
        {uploading && <p className="text-blue-500 mt-2 text-sm">Uploading...</p>}
      </div>

      {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {preview && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-x-auto">
          <h3 className="font-semibold text-slate-700 mb-3">Preview (first 5 rows)</h3>
          <table className="text-xs w-full">
            <thead>
              <tr>{columns.map(c => <th key={c} className="px-2 py-1 bg-slate-100 text-left font-medium">{c}</th>)}</tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {columns.map(c => <td key={c} className="px-2 py-1 text-slate-600">{String(row[c] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview && !metrics && (
        <button
          onClick={handleTrain}
          disabled={training}
          className="mt-6 bg-navy-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-navy-700 disabled:opacity-60 transition flex items-center gap-2"
        >
          {training ? (
            <><span className="animate-spin">⏳</span> Training models… (~60 seconds)</>
          ) : '🚀 Start Training'}
        </button>
      )}

      {metrics && (
        <div className="mt-6">
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-4 font-medium">
            ✅ Models trained successfully! Ready to predict.
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'AUC',      value: metrics.test_auc },
              { label: 'Gini',     value: metrics.gini },
              { label: 'KS Stat',  value: metrics.ks_statistic },
              { label: 'F1 Score', value: metrics.f1 },
            ].map(m => (
              <div key={m.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-navy-600">{m.value}</div>
                <div className="text-xs text-slate-500 mt-1">{m.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => nav('/predict')}
            className="mt-6 bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Go to Predictions →
          </button>
        </div>
      )}
    </div>
  )
}
