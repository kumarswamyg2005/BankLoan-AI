import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'

export default function ShapChart({ data = [] }) {
  if (!data.length) return <p className="text-slate-400 text-sm">No SHAP data.</p>

  const chartData = [...data]
    .sort((a, b) => a.shap_impact - b.shap_impact)
    .map(d => ({
      feature: d.feature.replace(/NumberOf/g, '# ').replace(/DaysPastDueNotWorse/, 'Late'),
      impact:  d.shap_impact,
    }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 140, right: 30 }}>
        <XAxis type="number" tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 11 }} />
        <YAxis dataKey="feature" type="category" tick={{ fontSize: 11 }} width={140} />
        <Tooltip formatter={(v) => v.toFixed(4)} />
        <ReferenceLine x={0} stroke="#94a3b8" />
        <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.impact >= 0 ? '#16a34a' : '#dc2626'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
