import { useState, useEffect } from "react";
import api from "../api";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { BarChart3, TrendingUp, Calendar, Flame, Sparkles } from "lucide-react";

function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function Charts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get("/expenses/daily-totals", { params: { month, year } });
        if (!cancelled) setData(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [month, year]);

  const totalSpent = data.reduce((sum, d) => sum + parseFloat(d.total || 0), 0);
  const avgPerDay = data.length ? (totalSpent / data.length).toFixed(0) : 0;
  const maxDay = data.length
    ? data.reduce((a, b) => (parseFloat(a.total) > parseFloat(b.total) ? a : b))
    : null;

  const barData = {
    labels: data.map((d) => formatShortDate(d.date)),
    datasets: [
      {
        label: "Daily Spend (₹)",
        data: data.map((d) => parseFloat(d.total) || 0),
        backgroundColor: data.map((d) =>
          maxDay && d.date === maxDay.date ? "#f43f5e" : "#10b981"
        ),
        hoverBackgroundColor: data.map((d) =>
          maxDay && d.date === maxDay.date ? "#e11d48" : "#059669"
        ),
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 13, weight: "bold" },
        padding: 10,
        cornerRadius: 12,
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed.y.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: "600" }, color: "#64748b", maxRotation: 45 },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: {
          callback: (v) => `₹${v.toLocaleString("en-IN")}`,
          font: { size: 11, weight: "600" },
          color: "#64748b",
        },
      },
    },
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-slate-800 tracking-tight">Daily Expenditure</span>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500 bg-white text-slate-700 outline-none shadow-sm"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>
              {new Date(0, i).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
      </div>

      {/* Summary pills */}
      {!loading && data.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-6">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-primary-50 border border-primary-200/60 rounded-xl text-xs shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 text-primary-600" />
            <span className="text-slate-500 font-semibold">Total: </span>
            <span className="font-extrabold text-primary-700">
              ₹{totalSpent.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200/60 rounded-xl text-xs shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500 font-semibold">Avg/day: </span>
            <span className="font-extrabold text-blue-700">
              ₹{Number(avgPerDay).toLocaleString("en-IN")}
            </span>
          </div>
          {maxDay && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200/60 rounded-xl text-xs shadow-sm">
              <Flame className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
              <span className="text-slate-500 font-semibold">Highest: </span>
              <span className="font-extrabold text-rose-600">
                {formatShortDate(maxDay.date)} (₹{parseFloat(maxDay.total).toLocaleString("en-IN")})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
          <div className="w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading daily chart…</span>
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <BarChart3 className="w-10 h-10 text-slate-300 mb-2" />
          <p className="font-bold text-slate-600 text-sm">No spend data right now</p>
          <p className="text-xs text-slate-400">Log some expenses to view daily burn statistics</p>
        </div>
      ) : (
        <div className="h-64">
          <Bar data={barData} options={options} />
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
        <span>Red bar highlights your highest spending day of the month</span>
      </div>
    </>
  );
}
