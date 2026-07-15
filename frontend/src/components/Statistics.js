import { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar";
import api from "../api";
import { Pie, Bar } from "react-chartjs-2";
import "chart.js/auto";
import { CHART_COLORS } from "../constants";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { PieChart, BarChart2, Calendar, Sparkles } from "lucide-react";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { 
    legend: { 
      position: "bottom",
      labels: { font: { family: "Inter", weight: "600", size: 12 }, padding: 16 }
    } 
  },
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

  useAutoRefresh(load);

  const colors = chart.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
  const pieData = {
    labels: chart.map((x) => x.category),
    datasets: [
      {
        data: chart.map((x) => parseFloat(x.total) || 0),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: "#ffffff",
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
        borderRadius: 10,
      },
    ],
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-card relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-60 h-60 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Category Insights
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Daily Breakdown
              </h1>
              <p className="mt-1 text-slate-300 text-sm sm:text-base">
                Examine specific date distributions across your expenditure categories.
              </p>
            </div>

            <div className="relative z-10 bg-white/10 p-3 rounded-2xl border border-white/15 backdrop-blur-md flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-300" />
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-300">Target Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
                />
              </div>
            </div>
          </header>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-card">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary-600" /> Allocation Analytics
                </h2>
                <p className="text-xs text-slate-500">Visual comparison of spends recorded on this date</p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold">Calculating charts…</span>
              </div>
            ) : chart.length === 0 ? (
              <div className="py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-bold mb-1">No expenses recorded for this date</p>
                <p className="text-xs text-slate-400">Select a different date from the top bar or log entries via Dashboard</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="bg-slate-50/60 p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                  <h3 className="text-sm font-extrabold text-slate-600 mb-4 uppercase tracking-wider">Category Share</h3>
                  <div className="max-w-xs w-full">
                    <Pie data={pieData} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-slate-50/60 p-6 rounded-3xl border border-slate-100 flex flex-col shadow-inner">
                  <h3 className="text-sm font-extrabold text-slate-600 mb-4 uppercase tracking-wider">Spend Volumes (₹)</h3>
                  <div className="h-72">
                    <Bar data={barData} options={chartOptions} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
