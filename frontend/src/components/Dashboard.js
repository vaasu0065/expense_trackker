import { useState, useCallback } from "react";
import api from "../api";
import Navbar from "./Navbar";
import ExpenseList from "./ExpenseList";
import AddExpense from "./AddExpense";
import Charts from "./Charts";
import Budget from "./Budget";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { ArrowDownRight, ArrowUpRight, Target, Wallet, RefreshCw, Plus } from "lucide-react";
import { todayLocal } from "../utils/date";

function formatCurrency(n) {
  const num = parseFloat(n) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
}

function budgetTone(pct) {
  if (pct >= 100) return { bar: "bg-expense-500", text: "text-expense-400" };
  if (pct >= 80) return { bar: "bg-amber-400", text: "text-amber-400" };
  return { bar: "bg-brand-500", text: "text-slate-400" };
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [monthlyCredit, setMonthlyCredit] = useState(0);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [filters, setFilters] = useState({ month: "", category: "", sort: "" });
  const [selectedDate, setSelectedDate] = useState(todayLocal);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get("/expenses/summary");
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadMonthlyTotal = useCallback(async () => {
    try {
      const res = await api.get("/expenses/monthly", { params: { month: currentMonth, year: currentYear } });
      const total = Array.isArray(res.data)
        ? res.data.reduce((sum, row) => sum + parseFloat(row.total || 0), 0)
        : 0;
      setMonthlyTotal(total);
    } catch (err) {
      setMonthlyTotal(0);
    }
  }, [currentMonth, currentYear]);

  const loadBudgetStatus = useCallback(async () => {
    try {
      const res = await api.get("/expenses/budget", {
        params: { month: currentMonth, year: currentYear },
      });
      setBudgetStatus(res.data);
    } catch (err) {
      setBudgetStatus(null);
    }
  }, [currentMonth, currentYear]);

  const loadMonthlyCredit = useCallback(async () => {
    try {
      const res = await api.get("/expenses/transactions", {
        params: { month: currentMonth, year: currentYear },
      });
      setMonthlyCredit(parseFloat(res.data?.summary?.total_credit || 0));
    } catch (err) {
      setMonthlyCredit(0);
    }
  }, [currentMonth, currentYear]);

  const refreshAll = useCallback(() => {
    setIsRefreshing(true);
    loadSummary();
    loadMonthlyTotal();
    loadBudgetStatus();
    loadMonthlyCredit();
    setRefreshKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  }, [loadSummary, loadMonthlyTotal, loadBudgetStatus, loadMonthlyCredit]);

  useAutoRefresh(refreshAll);

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString("en", {
    month: "long",
  });

  const hasBudget = budgetStatus && (budgetStatus.budget > 0 || budgetStatus.spent > 0);
  const budgetPct = hasBudget
    ? Math.min(100, ((parseFloat(budgetStatus.spent) || 0) / (parseFloat(budgetStatus.budget) || 1)) * 100)
    : 0;
  const tone = budgetTone(budgetPct);

  return (
    <>
      <Navbar />

      <main className="page">
        {/* Page header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {monthName} {currentYear} overview
            </p>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            disabled={isRefreshing}
            className="btn-secondary self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {/* KPI row */}
        <section aria-label="Key figures" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* Spent this month */}
          <div className="kpi">
            <div className="flex items-start justify-between gap-3">
              <p className="kpi-label">Spent in {monthName}</p>
              <span className="icon-tile hidden h-8 w-8 rounded-lg sm:flex bg-expense-500/10 text-expense-400">
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="kpi-value">{formatCurrency(monthlyTotal)}</p>
            <p className="kpi-hint">Current month burn</p>
          </div>

          {/* Income credited */}
          <div className="kpi">
            <div className="flex items-start justify-between gap-3">
              <p className="kpi-label">Income credited</p>
              <span className="icon-tile hidden h-8 w-8 rounded-lg sm:flex bg-income-500/10 text-income-400">
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="kpi-value text-income-400">+{formatCurrency(monthlyCredit)}</p>
            <p className="kpi-hint">Credited in {monthName}</p>
          </div>

          {/* Budget left */}
          <div className="kpi">
            <div className="flex items-start justify-between gap-3">
              <p className="kpi-label">Budget left</p>
              <span className="icon-tile hidden h-8 w-8 rounded-lg sm:flex bg-brand-500/10 text-brand-400">
                <Target className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            {hasBudget ? (
              <>
                <p
                  className={`kpi-value ${
                    (budgetStatus.remaining ?? 0) < 0 ? "text-expense-400" : ""
                  }`}
                >
                  {formatCurrency(budgetStatus.remaining)}
                </p>
                <div
                  className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
                  role="progressbar"
                  aria-label="Budget used"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(budgetPct)}
                >
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${budgetPct}%` }} />
                </div>
                <p className="kpi-hint flex justify-between gap-2 tabular-nums">
                  <span className="truncate">
                    {formatCurrency(budgetStatus.spent)} / {formatCurrency(budgetStatus.budget)}
                  </span>
                  <span className={tone.text}>{budgetPct.toFixed(0)}%</span>
                </p>
              </>
            ) : (
              <>
                <p className="kpi-value text-slate-500">Not set</p>
                <p className="kpi-hint">Set a monthly budget below</p>
              </>
            )}
          </div>

          {/* All-time */}
          <div className="kpi">
            <div className="flex items-start justify-between gap-3">
              <p className="kpi-label">All-time spent</p>
              <span className="icon-tile hidden h-8 w-8 rounded-lg sm:flex bg-white/[0.06] text-slate-300">
                <Wallet className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="kpi-value">{summary ? formatCurrency(summary.total) : "—"}</p>
            <p className="kpi-hint">
              {summary ? `${summary.count || 0} entries recorded` : "Loading entries…"}
            </p>
          </div>
        </section>

        {/* Add expense */}
        <section className="card card-pad mb-6" aria-labelledby="add-expense-title">
          <div className="card-header mb-4">
            <div className="flex items-center gap-3">
              <span className="icon-tile hidden bg-brand-500/10 text-brand-400 sm:flex">
                <Plus className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="add-expense-title" className="card-title">Quick expense entry</h2>
                <p className="card-subtitle">Log a new transaction to your ledger</p>
              </div>
            </div>
          </div>
          <AddExpense onAdded={refreshAll} />
        </section>

        {/* Budget + daily chart */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Budget onSaved={refreshAll} />
          </div>
          <div className="lg:col-span-3">
            <Charts />
          </div>
        </div>

        {/* Ledger */}
        <ExpenseList
          filters={filters}
          setFilters={setFilters}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          refreshKey={refreshKey}
        />
      </main>
    </>
  );
}
