const COLOR_MAP = {
  blue:   'text-blue-600',
  purple: 'text-purple-600',
  indigo: 'text-indigo-600',
  green:  'text-green-600',
  red:    'text-red-600',
}

export default function MetricCard({ label, value, color = 'blue' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
      <div className={`text-3xl font-bold ${COLOR_MAP[color] ?? COLOR_MAP.blue}`}>
        {value !== null && value !== undefined ? value : '—'}
      </div>
      <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
    </div>
  )
}
