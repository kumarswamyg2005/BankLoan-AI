import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function FeatureImportanceChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 140 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="feature" type="category" tick={{ fontSize: 11 }} width={140} />
        <Tooltip />
        <Bar dataKey="importance" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
