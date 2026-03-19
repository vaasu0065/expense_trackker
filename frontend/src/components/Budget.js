import { useState, useEffect, useCallback } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

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
      showToast("Budget saved", "success");
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

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Budget & Income</h3>

        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {new Date(0, i).toLocaleString("en", { month: "short" })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Income (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving…" : "Save Budget"}
            </button>
            <button
              type="button"
              onClick={load}
              className="px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </form>

        {summary && (summary.budget > 0 || summary.spent > 0) && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-2">
              {monthName} {year}
            </p>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">
                Spent {formatCurrency(summary.spent)} of {formatCurrency(summary.budget)}
              </span>
              <span
                className={
                  (summary.remaining ?? 0) < 0
                    ? "font-semibold text-red-600"
                    : "font-semibold text-primary-600"
                }
              >
                {formatCurrency(summary.remaining)} left
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-primary-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {summary.income != null && (
              <p className="text-xs text-slate-500 mt-2">Income: {formatCurrency(summary.income)}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
