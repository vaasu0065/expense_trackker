import { useEffect, useState, useCallback } from "react";
import api from "../api";
import Navbar from "./Navbar";
import ExpenseList from "./ExpenseList";
import AddExpense from "./AddExpense";
import Charts from "./Charts";
import Budget from "./Budget";

function formatCurrency(n) {
  const num = parseFloat(n) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [filters, setFilters] = useState({ month: "", category: "", sort: "" });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [refreshKey, setRefreshKey] = useState(0);

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

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadMonthlyTotal();
    loadBudgetStatus();
  }, [loadMonthlyTotal, loadBudgetStatus]);

  const refreshAll = useCallback(() => {
    loadSummary();
    loadMonthlyTotal();
    loadBudgetStatus();
    setRefreshKey((k) => k + 1);
  }, [loadSummary, loadMonthlyTotal, loadBudgetStatus]);

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString("en", {
    month: "long",
  });

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-slate-500">Overview of your expenses and budget</p>
          </header>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Total expenses
                  </p>
                  <p className="mt-2 text-2xl font-bold text-primary-600">
                    {summary ? formatCurrency(summary.total) : "—"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-2xl">
                  ₹
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Total entries
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {summary ? (summary.count || 0) : "—"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600">
                  #
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    {monthName}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">
                    {formatCurrency(monthlyTotal)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-600">
                  📅
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Budget
                  </p>
                  {budgetStatus &&
                  (budgetStatus.budget > 0 || budgetStatus.spent > 0) ? (
                    <>
                      <p className="mt-2 text-xl font-bold text-slate-800">
                        {formatCurrency(budgetStatus.remaining)} left
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatCurrency(budgetStatus.spent)} of{" "}
                        {formatCurrency(budgetStatus.budget)} spent
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-lg font-semibold text-slate-500">Set budget below</p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-xl font-bold text-violet-600">
                  🎯
                </div>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <Budget onSaved={refreshAll} />
          </section>

          <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Add expense</h2>
            <AddExpense onAdded={refreshAll} />
          </section>

          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 mb-8 flex flex-wrap items-center gap-4">
            <label className="font-medium text-slate-700">View by date:</label>
            <input
              type="date"
              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Expenses</h2>
              <ExpenseList
                filters={filters}
                setFilters={setFilters}
                selectedDate={selectedDate}
                refreshKey={refreshKey}
              />
            </section>

            <section>
              <Charts selectedDate={selectedDate} />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
