const CONFIG = {
  High:   { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200' },
  Medium: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-200' },
  Low:    { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200'   },
}

export default function SimilarityBadge({ label = 'Medium' }) {
  const c = CONFIG[label] ?? CONFIG.Medium
  return (
    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {label} Similarity
    </span>
  )
}
