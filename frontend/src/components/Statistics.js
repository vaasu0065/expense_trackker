import { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar";
import api from "../api";
import { Pie, Bar } from "react-chartjs-2";
import "chart.js/auto";
import { CHART_COLORS } from "../constants";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { position: "bottom" } },
};

export default function Statistics() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/expenses/daily", {
        params: { date: selectedDate },
      });
      setChart(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setChart([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  const colors = chart.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
  const pieData = {
    labels: chart.map((x) => x.category),
    datasets: [
      {
        data: chart.map((x) => parseFloat(x.total) || 0),
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  };
  const barData = {
    labels: chart.map((x) => x.category),
    datasets: [
      {
        label: "Amount (₹)",
        data: chart.map((x) => parseFloat(x.total) || 0),
        backgroundColor: colors,
        borderRadius: 8,
      },
    ],
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Statistics
            </h1>
            <p className="mt-1 text-slate-500">Daily expense breakdown by category</p>
          </header>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Expense charts</h2>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-500">
                Loading…
              </div>
            ) : chart.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No expenses for this date. Add some from the dashboard.
              </div>
            ) : (
              <div className="space-y-8">
                <div className="max-w-sm mx-auto">
                  <Pie data={pieData} options={chartOptions} />
                </div>
                <div className="h-72">
                  <Bar data={barData} options={chartOptions} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
