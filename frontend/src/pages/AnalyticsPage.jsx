import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { getModelPerformance, getFeatureImportance, getFairness, getApprovalDist } from '../services/api'
import MetricCard from '../components/MetricCard'

const PIE_COLORS = ['#16a34a', '#dc2626', '#d97706']

export default function AnalyticsPage() {
  const [perf, setPerf]           = useState(null)
  const [features, setFeatures]   = useState([])
  const [fairness, setFairness]   = useState([])
  const [dist, setDist]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    Promise.all([
      getModelPerformance(),
      getFeatureImportance(),
      getFairness().catch(() => ({ data: [] })),
      getApprovalDist().catch(() => ({ data: null }))
    ]).then(([p, f, fair, d]) => {
      setPerf(p.data)
      setFeatures(f.data)
      setFairness(fair.data)
      setDist(d.data)
    }).catch(e => {
      setError(e.response?.data?.detail || 'Models not trained yet.')
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-16 text-slate-400">Loading analytics...</div>
  if (error)   return <div className="text-center py-16 text-red-500">{error}</div>

  const cm = perf?.confusion_matrix
  const distData = dist ? [
    { name: 'Approved', value: dist.approved_pct },
    { name: 'Rejected', value: dist.rejected_pct },
    { name: 'Review',   value: dist.review_pct   },
  ] : []

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-navy-600">Model Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="AUC"         value={perf?.test_auc}      color="blue" />
        <MetricCard label="Gini"        value={perf?.gini}          color="purple" />
        <MetricCard label="KS Statistic" value={perf?.ks_statistic} color="indigo" />
        <MetricCard label="F1 Score"    value={perf?.f1}            color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Feature Importance (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={features} layout="vertical" margin={{ left: 130 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="feature" type="category" tick={{ fontSize: 11 }} width={130} />
              <Tooltip />
              <Bar dataKey="importance" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Approval Distribution</h3>
          {dist?.total > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={distData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                  {distData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm text-center mt-12">No predictions logged yet.</p>}
        </div>
      </div>

      {cm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Confusion Matrix (threshold = 0.35)</h3>
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            {[
              { label: 'True Positive',  val: cm.TP, bg: 'bg-green-100 text-green-800' },
              { label: 'False Positive', val: cm.FP, bg: 'bg-red-100 text-red-800' },
              { label: 'False Negative', val: cm.FN, bg: 'bg-red-100 text-red-800' },
              { label: 'True Negative',  val: cm.TN, bg: 'bg-green-100 text-green-800' },
            ].map(c => (
              <div key={c.label} className={`${c.bg} rounded-xl p-4 text-center`}>
                <div className="text-2xl font-bold">{c.val?.toLocaleString()}</div>
                <div className="text-xs mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fairness.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Fairness — Approval Rate by Age Group</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fairness}>
              <XAxis dataKey="age_group" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="approval_rate" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
