import { useState, useEffect, useCallback } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { Target, AlertTriangle, CheckCircle2, Save, RefreshCw, Pencil, X } from "lucide-react";

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

function formatCurrency(n) {
  const num = parseFloat(n) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
}

function Stat({ label, value, className = "" }) {
  return (
    <div className="rounded-xl bg-ink-850 px-3.5 py-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className={`mt-1 text-base font-semibold tabular-nums ${className || "text-white"}`}>{value}</dd>
    </div>
  );
}

export default function Budget({ onSaved }) {
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(currentYear);
  const [income, setIncome] = useState("");
  const [budget, setBudget] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
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

  const hasStatus = summary && (summary.budget > 0 || summary.spent > 0);
  const hasIncome = summary?.income != null && summary.income > 0;
  const overspent = (summary?.remaining ?? 0) < 0;

  const tone =
    pct >= 100
      ? { bar: "bg-expense-500", text: "text-expense-400", Icon: AlertTriangle, label: "Budget exceeded" }
      : pct >= 80
      ? { bar: "bg-amber-400", text: "text-amber-400", Icon: AlertTriangle, label: "Nearing limit" }
      : { bar: "bg-brand-500", text: "text-income-400", Icon: CheckCircle2, label: "On track" };

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

      <section className="card card-pad h-full" aria-labelledby="budget-title">
        <div className="card-header">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-tile hidden bg-brand-500/10 text-brand-400 sm:flex">
              <Target className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="budget-title" className="card-title">Monthly budget</h2>
              <p className="card-subtitle">
                {monthName} {year}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={load} className="btn-icon" aria-label="Reload budget">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              aria-expanded={editing}
              aria-controls="budget-form"
              className="btn-secondary btn-sm"
            >
              {editing ? (
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {editing ? "Close" : "Edit budget"}
            </button>
          </div>
        </div>

        {hasStatus ? (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <div>
                <p className="kpi-label">{overspent ? "Over budget by" : "Remaining"}</p>
                <p
                  className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${
                    overspent ? "text-expense-400" : "text-white"
                  }`}
                >
                  {formatCurrency(overspent ? Math.abs(summary.remaining) : summary.remaining)}
                </p>
              </div>
              <p className={`flex items-center gap-1.5 text-sm font-medium ${tone.text}`}>
                <tone.Icon className="h-4 w-4" aria-hidden="true" />
                {tone.label} · {pct.toFixed(0)}% used
              </p>
            </div>

            <div
              className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
              role="progressbar"
              aria-label={`Budget used in ${monthName} ${year}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${tone.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3">
              <Stat label="Spent" value={formatCurrency(summary.spent)} />
              <Stat label="Budget cap" value={formatCurrency(summary.budget)} />
              {hasIncome && (
                <Stat label="Income" value={formatCurrency(summary.income)} className="text-income-400" />
              )}
              {hasIncome && (
                <Stat
                  label="Savings potential"
                  value={formatCurrency(Math.max(0, summary.income - summary.spent))}
                />
              )}
            </dl>
          </div>
        ) : (
          !editing && (
            <div className="empty-state py-8">
              <Target className="h-8 w-8 text-slate-500" aria-hidden="true" />
              <p className="font-medium text-slate-200">No budget set for {monthName}</p>
              <p>Set your income and a spending cap to track progress.</p>
              <button type="button" onClick={() => setEditing(true)} className="btn-primary mt-2">
                Set budget
              </button>
            </div>
          )
        )}

        {editing && (
          <form
            id="budget-form"
            onSubmit={save}
            className={`space-y-4 ${hasStatus ? "mt-6 border-t border-white/[0.08] pt-5" : ""}`}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="budget-month" className="label">Month</label>
                <select
                  id="budget-month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="select"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      {new Date(0, i).toLocaleString("en", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="budget-year" className="label">Year</label>
                <input
                  id="budget-year"
                  type="number"
                  min="2020"
                  max="2030"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="input tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="budget-income" className="label">Income (₹)</label>
                <input
                  id="budget-income"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder="0"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="input tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="budget-cap" className="label">Budget cap (₹)</label>
                <input
                  id="budget-cap"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="input tabular-nums"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                <Save className="h-4 w-4" aria-hidden="true" />
                {loading ? "Saving…" : "Save budget"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
