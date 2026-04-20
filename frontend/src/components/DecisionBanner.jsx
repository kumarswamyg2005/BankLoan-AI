const CONFIG = {
  APPROVE: {
    bg:     'bg-green-50 border-green-300',
    text:   'text-green-800',
    icon:   '✅',
    label:  'Loan Approved',
  },
  REJECT: {
    bg:     'bg-red-50 border-red-300',
    text:   'text-red-800',
    icon:   '❌',
    label:  'Loan Rejected',
  },
  MANUAL_REVIEW: {
    bg:     'bg-amber-50 border-amber-300',
    text:   'text-amber-800',
    icon:   '⏳',
    label:  'Sent for Manual Review',
  },
}

export default function DecisionBanner({ decision, riskScore }) {
  const c = CONFIG[decision] ?? CONFIG.MANUAL_REVIEW
  return (
    <div className={`border-2 rounded-xl p-6 flex items-center gap-4 ${c.bg}`}>
      <span className="text-4xl">{c.icon}</span>
      <div>
        <h2 className={`text-2xl font-bold ${c.text}`}>{c.label}</h2>
        <p className={`text-sm mt-1 ${c.text} opacity-80`}>Risk Score: {riskScore} / 900</p>
      </div>
    </div>
  )
}
