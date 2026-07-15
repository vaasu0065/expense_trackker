import { useState, useEffect, useCallback } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, Save, RefreshCw } from "lucide-react";

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

function formatCurrency(n) {
  const num = parseFloat(n) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function Budget({ onSaved }) {
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(currentYear);
  const [income, setIncome] = useState("");
  const [budget, setBudget] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const load = useCallback(async () => {
    if (!month || !year) return;
    try {
      const res = await api.get("/expenses/budget", { params: { month, year } });
      setSummary(res.data);
      setIncome(res.data?.income != null ? String(res.data.income) : "");
      setBudget(res.data?.budget != null ? String(res.data.budget) : "");
    } catch (err) {
      setSummary(null);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e?.preventDefault?.();
    if (!month || !year || !income || !budget) {
      showToast("Fill month, year, income and budget", "warning");
      return;
    }
    setLoading(true);
    try {
      await api.post("/expenses/budget", {
        month: Number(month),
        year: Number(year),
        income: Number(income),
        budget: Number(budget),
      });
      showToast("Budget target updated successfully!", "success");
      load();
      if (typeof onSaved === "function") onSaved();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to save budget", "error");
    } finally {
      setLoading(false);
    }
  };

  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("en", {
    month: "long",
  });
  const spent = summary?.spent ?? 0;
  const budgetVal = parseFloat(summary?.budget) || parseFloat(budget) || 1;
  const pct = Math.min(100, (spent / budgetVal) * 100);

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-card relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-200/60 flex items-center justify-center text-violet-600 shadow-sm">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Budget & Income Target</h3>
              <p className="text-xs text-slate-500">Set monthly caps to track your spending threshold</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" /> {monthName} {year}
          </span>
        </div>

        <form onSubmit={save} className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-inner"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {new Date(0, i).toLocaleString("en", { month: "short" })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Year</label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Income (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl font-bold text-sm text-emerald-700 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Budget Cap (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl font-bold text-sm text-violet-700 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-card hover:shadow-glow transition-all duration-300 disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving…" : "Save Monthly Target"}</span>
            </button>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200/80 rounded-2xl font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors active:scale-95 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </form>

        {summary && (summary.budget > 0 || summary.spent > 0) && (
          <div className="mt-8 pt-6 border-t border-slate-100 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                {pct >= 100 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> Budget Exceeded!
                  </span>
                ) : pct >= 80 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5" /> Nearing Limit ({pct.toFixed(0)}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Budget ({pct.toFixed(0)}% used)
                  </span>
                )}
                <span className="text-sm font-bold text-slate-700">
                  {monthName} {year}
                </span>
              </div>
              <div className="text-sm font-extrabold flex items-center gap-2">
                <span className="text-slate-500">
                  Spent: <span className="text-slate-800">{formatCurrency(summary.spent)}</span>
                </span>
                <span className="text-slate-300">/</span>
                <span
                  className={
                    (summary.remaining ?? 0) < 0
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }
                >
                  Remaining: {formatCurrency(summary.remaining)}
                </span>
              </div>
            </div>

            {/* Premium Animated Progress Bar */}
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 shadow-sm ${
                  pct >= 100 
                    ? "bg-gradient-to-r from-rose-500 to-red-600" 
                    : pct >= 80 
                    ? "bg-gradient-to-r from-amber-400 to-orange-500" 
                    : "bg-gradient-to-r from-emerald-400 via-teal-500 to-primary-600"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {summary.income != null && summary.income > 0 && (
              <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/50">
                <span>Recorded Monthly Income: <strong className="text-emerald-600 font-bold">{formatCurrency(summary.income)}</strong></span>
                <span>Savings Potential: <strong className="text-primary-600 font-bold">{formatCurrency(Math.max(0, summary.income - summary.spent))}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
