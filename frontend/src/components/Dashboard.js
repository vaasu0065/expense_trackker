import { useEffect, useState, useCallback } from "react";
import api from "../api";
import Navbar from "./Navbar";
import ExpenseList from "./ExpenseList";
import AddExpense from "./AddExpense";
import Charts from "./Charts";
import Budget from "./Budget";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { 
  Wallet, 
  ArrowUpRight, 
  Receipt, 
  CalendarRange, 
  Target, 
  RefreshCw, 
  Sparkles,
  PlusCircle,
  TrendingDown
} from "lucide-react";

function formatCurrency(n) {
  const num = parseFloat(n) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [monthlyCredit, setMonthlyCredit] = useState(0);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [filters, setFilters] = useState({ month: "", category: "", sort: "" });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
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
      const res = await api.get("/expenses/monthly", { params: { month: currentMonth } });
      const total = Array.isArray(res.data)
        ? res.data.reduce((sum, row) => sum + parseFloat(row.total || 0), 0)
        : 0;
      setMonthlyTotal(total);
    } catch (err) {
      setMonthlyTotal(0);
    }
  }, [currentMonth]);

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

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadMonthlyTotal();
    loadBudgetStatus();
    loadMonthlyCredit();
  }, [loadMonthlyTotal, loadBudgetStatus, loadMonthlyCredit]);

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

  return (
    <>
      <Navbar />

      <div className="min-h-screen py-8 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 rounded-3xl text-white shadow-card relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-60 h-60 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  <Sparkles className="w-3.5 h-3.5 animate-pulseGlow" /> Live Dashboard
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Financial Overview
              </h1>
              <p className="mt-1 text-slate-300 text-sm sm:text-base">
                Track every penny, optimize budgets, and achieve financial freedom.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 self-start sm:self-center">
              <button
                onClick={refreshAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-sm backdrop-blur-md transition-all duration-300 active:scale-95 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary-400" : ""}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </header>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
            {/* Total Expenses */}
            <div className="glass-card rounded-3xl p-6 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Expenses
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {summary ? formatCurrency(summary.total) : "—"}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-rose-600">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>All-time spent</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Credited */}
            <div className="glass-card rounded-3xl p-6 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Credited Income
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                    {formatCurrency(monthlyCredit)}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>In {monthName}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Total Entries */}
            <div className="glass-card rounded-3xl p-6 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Entries
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
                    {summary ? (summary.count || 0) : "—"}
                  </p>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Recorded logs
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Monthly Total */}
            <div className="glass-card rounded-3xl p-6 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {monthName} Total
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
                    {formatCurrency(monthlyTotal)}
                  </p>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Current month burn
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <CalendarRange className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Budget Status */}
            <div className="glass-card rounded-3xl p-6 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Budget Target
                  </p>
                  {budgetStatus && (budgetStatus.budget > 0 || budgetStatus.spent > 0) ? (
                    <>
                      <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                        {formatCurrency(budgetStatus.remaining)} left
                      </p>
                      <div className="mt-2 text-xs font-medium text-slate-500 truncate">
                        {formatCurrency(budgetStatus.spent)} / {formatCurrency(budgetStatus.budget)}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-lg font-bold text-slate-500">Not Set</p>
                      <div className="mt-2 text-xs font-medium text-violet-600">
                        Configure target below
                      </div>
                    </>
                  )}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Target className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Budget Section */}
          <section className="mb-8">
            <Budget onSaved={refreshAll} />
          </section>

          {/* Add Expense Section */}
          <section className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 border border-white shadow-card relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-200/60 flex items-center justify-center text-primary-600 shadow-sm">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Quick Expense Entry</h2>
                <p className="text-xs text-slate-500">Log new transactions instantly into your ledger</p>
              </div>
            </div>
            <AddExpense onAdded={refreshAll} />
          </section>

          {/* Date Selector Filter Bar */}
          <div className="glass-card rounded-2xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4 border border-slate-200/60">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-primary-600" />
              <label className="font-bold text-slate-700 text-sm">Filter ledger by specific date:</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 shadow-inner"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Main Expense List & Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-card">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ledger & History</h2>
                  <p className="text-xs text-slate-500">View, search, or edit recent transactions</p>
                </div>
              </div>
              <ExpenseList
                filters={filters}
                setFilters={setFilters}
                selectedDate={selectedDate}
                refreshKey={refreshKey}
              />
            </section>

            <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-card">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Analytics & Trends</h2>
                  <p className="text-xs text-slate-500">Visual breakdown of your category allocations</p>
                </div>
              </div>
              <Charts />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
