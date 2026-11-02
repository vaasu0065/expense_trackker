import { useState, useEffect } from "react";
import api from "../api";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { BarChart3 } from "lucide-react";
import { parseDate } from "../utils/date";

function formatShortDate(dateStr) {
  const d = parseDate(dateStr);
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

  const FONT = "'IBM Plex Sans', system-ui, sans-serif";

  const barData = {
    labels: data.map((d) => formatShortDate(d.date)),
    datasets: [
      {
        label: "Daily Spend (₹)",
        data: data.map((d) => parseFloat(d.total) || 0),
        backgroundColor: data.map((d) =>
          maxDay && d.date === maxDay.date ? "#FB7185" : "#6366F1"
        ),
        hoverBackgroundColor: data.map((d) =>
          maxDay && d.date === maxDay.date ? "#FDA4AF" : "#818CF8"
        ),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 48,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#101A2E",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#94A3B8",
        bodyColor: "#F8FAFC",
        titleFont: { family: FONT, size: 12, weight: "500" },
        bodyFont: { family: FONT, size: 13, weight: "600" },
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => `₹${ctx.parsed.y.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: "rgba(255,255,255,0.08)" },
        ticks: { font: { family: FONT, size: 12 }, color: "#94A3B8", maxRotation: 0, autoSkipPadding: 8 },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.06)" },
        border: { display: false },
        ticks: {
          callback: (v) => `₹${v.toLocaleString("en-IN")}`,
          font: { family: FONT, size: 12 },
          color: "#94A3B8",
          maxTicksLimit: 6,
        },
      },
    },
  };

  return (
    <section className="card card-pad h-full" aria-labelledby="daily-chart-title">
      <div className="card-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile hidden bg-brand-500/10 text-brand-400 sm:flex">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="daily-chart-title" className="card-title">Daily spending</h2>
            <p className="card-subtitle">How much you spent each day</p>
          </div>
        </div>
        <div className="shrink-0">
          <label htmlFor="chart-month" className="sr-only">Month</label>
          <select
            id="chart-month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="select min-h-[40px] w-auto py-2 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>
                {new Date(0, i).toLocaleString("en", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && data.length > 0 && (
        <dl className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-ink-850 px-3 py-2.5">
            <dt className="text-xs text-slate-400">Total</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white sm:text-base">
              ₹{totalSpent.toLocaleString("en-IN")}
            </dd>
          </div>
          <div className="rounded-xl bg-ink-850 px-3 py-2.5">
            <dt className="text-xs text-slate-400">Avg / day</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white sm:text-base">
              ₹{Number(avgPerDay).toLocaleString("en-IN")}
            </dd>
          </div>
          {maxDay && (
            <div className="rounded-xl bg-ink-850 px-3 py-2.5">
              <dt className="text-xs text-slate-400">Highest</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-expense-400 sm:text-base">
                ₹{parseFloat(maxDay.total).toLocaleString("en-IN")}
              </dd>
            </div>
          )}
        </dl>
      )}

      {/* Chart */}
      {loading ? (
        <div className="flex h-64 items-end gap-3 px-2" aria-busy="true" aria-label="Loading daily chart">
          {[45, 70, 30, 85, 55, 40, 65].map((h, i) => (
            <div key={i} className="skeleton flex-1" style={{ height: `${h}%` }} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state h-64 rounded-xl border border-dashed border-white/10">
          <BarChart3 className="h-8 w-8 text-slate-500" aria-hidden="true" />
          <p className="font-medium text-slate-200">No spending this month</p>
          <p>Log some expenses to see your daily totals.</p>
        </div>
      ) : (
        <div className="h-64">
          <Bar
            data={barData}
            options={options}
            aria-label={`Bar chart of daily spending. Highest day ${
              maxDay ? formatShortDate(maxDay.date) : ""
            }.`}
            role="img"
          />
        </div>
      )}

      {!loading && maxDay && (
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-expense-400" aria-hidden="true" />
          Highest day: <span className="font-medium text-slate-200">{formatShortDate(maxDay.date)}</span>
          <span className="tabular-nums">(₹{parseFloat(maxDay.total).toLocaleString("en-IN")})</span>
        </p>
      )}
    </section>
  );
}
