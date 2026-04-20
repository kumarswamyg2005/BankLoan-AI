import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { predictLoan } from "../services/api";

const INITIAL = {
  age: "35",
  MonthlyIncome: "5000",
  DebtRatio: 0.35,
  RevolvingUtilizationOfUnsecuredLines: 0.3,
  NumberOfOpenCreditLinesAndLoans: "4",
  NumberOfDependents: "1",
  NumberRealEstateLoansOrLines: "1",
  NumberOfTime30_59DaysPastDueNotWorse: "0",
  NumberOfTime60_89DaysPastDueNotWorse: "0",
  NumberOfTimes90DaysLate: "0",
};

// Defined outside component so React never remounts them on re-render
function NumberField({ label, name, value, onChange, min, max }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        type="number"
        name={name}
        value={value}
        min={min}
        max={max}
        onChange={onChange}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
      />
    </div>
  );
}

function SliderField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">
        {label} —{" "}
        <span className="text-navy-600 font-semibold">
          {(value * 100).toFixed(0)}%
        </span>
      </label>
      <input
        type="range"
        name={name}
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={onChange}
        className="w-full accent-navy-600"
      />
    </div>
  );
}

function riskColor(score) {
  if (score >= 680) return "text-green-600";
  if (score >= 500) return "text-amber-500";
  return "text-red-600";
}

export default function PredictPage() {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveScore, setLiveScore] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState("");
  const nav = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: e.target.type === "range" ? parseFloat(value) : value,
    }));
  };

  const payload = useMemo(
    () => ({
      age: parseInt(form.age) || 18,
      MonthlyIncome: parseFloat(form.MonthlyIncome) || 0,
      DebtRatio: form.DebtRatio,
      RevolvingUtilizationOfUnsecuredLines:
        form.RevolvingUtilizationOfUnsecuredLines,
      NumberOfOpenCreditLinesAndLoans:
        parseInt(form.NumberOfOpenCreditLinesAndLoans) || 0,
      NumberOfDependents: parseInt(form.NumberOfDependents) || 0,
      NumberRealEstateLoansOrLines:
        parseInt(form.NumberRealEstateLoansOrLines) || 0,
      NumberOfTime30_59DaysPastDueNotWorse:
        parseInt(form.NumberOfTime30_59DaysPastDueNotWorse) || 0,
      NumberOfTime60_89DaysPastDueNotWorse:
        parseInt(form.NumberOfTime60_89DaysPastDueNotWorse) || 0,
      NumberOfTimes90DaysLate: parseInt(form.NumberOfTimes90DaysLate) || 0,
    }),
    [form],
  );

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLiveLoading(true);
      setLiveError("");
      try {
        const res = await predictLoan(payload, { track: false });
        if (!active) return;
        setLiveScore(res.data?.risk_score ?? null);
      } catch (err) {
        if (!active) return;
        setLiveScore(null);
        setLiveError(
          err.response?.data?.detail ||
            "Live score unavailable until models are trained.",
        );
      } finally {
        if (active) setLiveLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [payload]);

  const totalLate =
    (parseInt(form.NumberOfTime30_59DaysPastDueNotWorse) || 0) +
    (parseInt(form.NumberOfTime60_89DaysPastDueNotWorse) || 0) +
    (parseInt(form.NumberOfTimes90DaysLate) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await predictLoan(payload);
      nav("/result", { state: res.data });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Prediction failed. Make sure the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-navy-600 mb-6">
        New Loan Application
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Age"
                name="age"
                value={form.age}
                onChange={handleChange}
                min={18}
                max={100}
              />
              <NumberField
                label="Monthly Income ($)"
                name="MonthlyIncome"
                value={form.MonthlyIncome}
                onChange={handleChange}
                min={1}
              />
              <NumberField
                label="Number of Dependents"
                name="NumberOfDependents"
                value={form.NumberOfDependents}
                onChange={handleChange}
                min={0}
                max={20}
              />
              <NumberField
                label="Real Estate Loans"
                name="NumberRealEstateLoansOrLines"
                value={form.NumberRealEstateLoansOrLines}
                onChange={handleChange}
                min={0}
                max={10}
              />
            </div>
          </div>

          {/* Credit History */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">
              Credit History
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <SliderField
                label="Debt Ratio"
                name="DebtRatio"
                value={form.DebtRatio}
                onChange={handleChange}
              />
              <SliderField
                label="Credit Utilization"
                name="RevolvingUtilizationOfUnsecuredLines"
                value={form.RevolvingUtilizationOfUnsecuredLines}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Open Credit Lines"
                name="NumberOfOpenCreditLinesAndLoans"
                value={form.NumberOfOpenCreditLinesAndLoans}
                onChange={handleChange}
                min={0}
                max={40}
              />
              <NumberField
                label="Times 30-59 Days Late"
                name="NumberOfTime30_59DaysPastDueNotWorse"
                value={form.NumberOfTime30_59DaysPastDueNotWorse}
                onChange={handleChange}
                min={0}
                max={20}
              />
              <NumberField
                label="Times 60-89 Days Late"
                name="NumberOfTime60_89DaysPastDueNotWorse"
                value={form.NumberOfTime60_89DaysPastDueNotWorse}
                onChange={handleChange}
                min={0}
                max={20}
              />
              <NumberField
                label="Times 90+ Days Late"
                name="NumberOfTimes90DaysLate"
                value={form.NumberOfTimes90DaysLate}
                onChange={handleChange}
                min={0}
                max={20}
              />
            </div>
          </div>
        </div>

        {/* Live Risk Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-4">
            <h3 className="font-semibold text-slate-700 mb-4">
              Live Risk Score (Model-based)
            </h3>
            <div className="text-center mb-4">
              <div
                className={`text-5xl font-bold ${liveScore == null ? "text-slate-400" : riskColor(liveScore)}`}
              >
                {liveLoading ? "…" : (liveScore ?? "—")}
              </div>
              <div className="text-slate-400 text-sm mt-1">
                / 900 from backend model
              </div>
            </div>
            <div className="h-2 rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400 mb-2" />
            <div className="flex justify-between text-xs text-slate-400 mb-4">
              <span>300</span>
              <span>500</span>
              <span>680</span>
              <span>900</span>
            </div>
            {liveError && (
              <p className="text-xs text-amber-600 mb-3">{liveError}</p>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Debt Ratio</span>
                <span className="font-medium">
                  {(form.DebtRatio * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Credit Util.</span>
                <span className="font-medium">
                  {(form.RevolvingUtilizationOfUnsecuredLines * 100).toFixed(0)}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Late Payments</span>
                <span
                  className={`font-medium ${totalLate > 0 ? "text-red-500" : "text-green-600"}`}
                >
                  {totalLate}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-600 text-white py-3 rounded-lg font-semibold hover:bg-navy-700 disabled:opacity-60 transition"
          >
            {loading ? "⏳ Checking..." : "Check Loan Eligibility"}
          </button>
        </div>
      </form>
    </div>
  );
}
