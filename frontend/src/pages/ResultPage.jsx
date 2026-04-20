import { useLocation, useNavigate } from 'react-router-dom'
import DecisionBanner from '../components/DecisionBanner'
import ShapChart from '../components/ShapChart'
import ScoreGauge from '../components/ScoreGauge'
import SimilarityBadge from '../components/SimilarityBadge'

export default function ResultPage() {
  const { state: result } = useLocation()
  const nav = useNavigate()

  if (!result) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">No prediction result found.</p>
        <button onClick={() => nav('/predict')} className="bg-navy-600 text-white px-6 py-2 rounded-lg">
          Go to Predictions
        </button>
      </div>
    )
  }

  const { decision, approval_probability, risk_score, similarity,
          shap_values, top_positive_factors, top_negative_factors,
          what_if_suggestions } = result

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DecisionBanner decision={decision} riskScore={risk_score} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center">
          <div className="text-4xl font-bold text-navy-600">{(approval_probability * 100).toFixed(1)}%</div>
          <div className="text-slate-500 text-sm mt-1">Approval Probability</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center">
          <ScoreGauge score={risk_score} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center">
          <SimilarityBadge label={similarity.similarity_label} />
          <div className="text-slate-500 text-sm mt-2">Data Similarity</div>
          <div className="text-xs text-slate-400 mt-1">
            Mahal: {similarity.mahalanobis_distance} | KNN: {similarity.knn_distance}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4">Why did we make this decision?</h3>
        <ShapChart data={shap_values} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-green-700 mb-3">Top reasons FOR approval</h3>
          {top_positive_factors.length === 0
            ? <p className="text-slate-400 text-sm">None found.</p>
            : top_positive_factors.map((f, i) => (
              <div key={i} className="flex items-start gap-2 mb-2 text-sm">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-slate-600">{f.explanation}</span>
              </div>
            ))
          }
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-red-700 mb-3">Top concerns</h3>
          {top_negative_factors.length === 0
            ? <p className="text-slate-400 text-sm">None found.</p>
            : top_negative_factors.map((f, i) => (
              <div key={i} className="flex items-start gap-2 mb-2 text-sm">
                <span className="text-red-500 mt-0.5">⚠</span>
                <span className="text-slate-600">{f.explanation}</span>
              </div>
            ))
          }
        </div>
      </div>

      {(decision === 'REJECT' || decision === 'MANUAL_REVIEW') && what_if_suggestions?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-blue-700 mb-3">💡 How to improve your chances</h3>
          <div className="space-y-3">
            {what_if_suggestions.map((s, i) => (
              <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {similarity.is_ood && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 text-sm">
          <strong>⚠ Unusual Profile Detected</strong>
          <p className="mt-1">
            Your financial profile is quite different from our typical customers. This decision has been flagged
            for manual officer review. A loan officer will contact you within 2 business days.
          </p>
        </div>
      )}

      <button
        onClick={() => nav('/predict')}
        className="border border-slate-300 text-slate-600 px-6 py-2 rounded-lg hover:bg-slate-50 transition text-sm"
      >
        ← New Application
      </button>
    </div>
  )
}
