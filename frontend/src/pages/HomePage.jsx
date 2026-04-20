import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const nav = useNavigate()
  return (
    <div className="text-center py-16">
      <div className="mb-6 text-6xl">🏦</div>
      <h1 className="text-4xl font-bold text-navy-600 mb-4">BankLoan AI</h1>
      <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
        AI-powered loan approval predictions with full SHAP explainability,
        confidence scoring, and out-of-distribution detection.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
        <button
          onClick={() => nav('/predict')}
          className="bg-navy-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-navy-700 transition"
        >
          New Prediction
        </button>
        <button
          onClick={() => nav('/analytics')}
          className="border-2 border-slate-300 text-slate-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-slate-100 transition"
        >
          Analytics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          { icon: '🤖', title: 'Ensemble ML', desc: 'LightGBM + XGBoost + Random Forest with soft voting for best accuracy' },
          { icon: '🔍', title: 'SHAP Explainability', desc: 'Every decision explained with top factors for and against approval' },
          { icon: '🛡️', title: 'OOD Detection', desc: 'Flags unusual applicants for human review using Mahalanobis distance' },
        ].map(card => (
          <div key={card.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-left">
            <div className="text-3xl mb-3">{card.icon}</div>
            <h3 className="font-semibold text-navy-600 mb-2">{card.title}</h3>
            <p className="text-slate-500 text-sm">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
