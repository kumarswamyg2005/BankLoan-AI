export default function ReviewQueuePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-navy-600 mb-6">Manual Review Queue</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 text-sm mb-6">
        Cases flagged for manual review appear here. These are applicants whose profiles differ
        significantly from training data (Low similarity) or whose probability falls in the 35–65% range.
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center text-slate-400">
        <div className="text-4xl mb-3">📋</div>
        <p>No pending reviews. Predictions flagged as MANUAL_REVIEW will appear here.</p>
      </div>
    </div>
  )
}
