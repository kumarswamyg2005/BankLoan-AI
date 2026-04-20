import { useState, useEffect } from 'react'
import { trainModel, getTrainStatus } from '../services/api'
import MetricCard from '../components/MetricCard'

export default function TrainPage() {
  const [status, setStatus]   = useState(null)
  const [training, setTraining] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    getTrainStatus().then(r => setStatus(r.data)).catch(() => {})
  }, [])

  const handleTrain = async () => {
    setTraining(true)
    setError('')
    try {
      const res = await trainModel()
      setStatus({ is_trained: true, metrics: res.data.metrics })
    } catch (e) {
      setError(e.response?.data?.detail || 'Training failed.')
    } finally {
      setTraining(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-navy-600 mb-6">Model Training</h2>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-slate-700">
              Status: {status?.is_trained
                ? <span className="text-green-600">Trained ✅</span>
                : <span className="text-amber-500">Not trained</span>}
            </p>
            {status?.trained_at && (
              <p className="text-xs text-slate-400 mt-1">Last trained: {new Date(status.trained_at).toLocaleString()}</p>
            )}
          </div>
          <button
            onClick={handleTrain}
            disabled={training}
            className="bg-navy-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-navy-700 disabled:opacity-60 transition"
          >
            {training ? '⏳ Training...' : 'Retrain Models'}
          </button>
        </div>

        {training && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
            Training LightGBM + XGBoost + Random Forest ensemble… this takes ~60 seconds.
          </div>
        )}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
      </div>

      {status?.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="AUC"       value={status.metrics.test_auc}    color="blue" />
          <MetricCard label="Gini"      value={status.metrics.gini}        color="purple" />
          <MetricCard label="KS Stat"   value={status.metrics.ks_statistic} color="indigo" />
          <MetricCard label="F1 Score"  value={status.metrics.f1}          color="green" />
        </div>
      )}
    </div>
  )
}
