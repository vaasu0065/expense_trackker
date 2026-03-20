import { useState, useEffect } from "react";
import api from "../api";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

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
          maxDay && d.date === maxDay.date ? "#ef4444" : "#22c55e"
        ),
        borderRadius: 6,
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
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed.y.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, maxRotation: 45 },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: {
          callback: (v) => `₹${v.toLocaleString("en-IN")}`,
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-slate-800">Daily spending</h3>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white"
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
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="px-3 py-1.5 bg-primary-50 rounded-xl text-sm">
            <span className="text-slate-500">Total </span>
            <span className="font-semibold text-primary-700">
              ₹{totalSpent.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-blue-50 rounded-xl text-sm">
            <span className="text-slate-500">Avg/day </span>
            <span className="font-semibold text-blue-700">
              ₹{Number(avgPerDay).toLocaleString("en-IN")}
            </span>
          </div>
          {maxDay && (
            <div className="px-3 py-1.5 bg-red-50 rounded-xl text-sm">
              <span className="text-slate-500">Highest </span>
              <span className="font-semibold text-red-600">
                {formatShortDate(maxDay.date)} — ₹{parseFloat(maxDay.total).toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading…</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <p className="text-4xl mb-2">📊</p>
          <p>No expenses this month</p>
        </div>
      ) : (
        <div className="h-64">
          <Bar data={barData} options={options} />
        </div>
      )}

      <p className="text-xs text-slate-400 mt-3 text-center">
        Red bar = highest spending day
      </p>
    </div>
  );
}
