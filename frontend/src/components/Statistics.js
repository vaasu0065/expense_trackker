import { useState, useCallback } from "react";
import Navbar from "./Navbar";
import api from "../api";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { PieChart } from "lucide-react";
import { todayLocal, parseDate } from "../utils/date";
import { CHART_COLORS } from "../constants";

// Dark-safe categorical palette from design-system/MASTER.md
const PALETTE = CHART_COLORS;
const FONT = "'Manrope', system-ui, sans-serif";

function formatCurrency(n) {
  return `₹${(parseFloat(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatPercent(part, total) {
  if (!total) return "0%";
  const p = (part / total) * 100;
  return `${p < 10 ? p.toFixed(1) : Math.round(p)}%`;
}

export default function Statistics() {
  const [selectedDate, setSelectedDate] = useState(todayLocal);
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

  useAutoRefresh(load);

  // Largest category first so colours, chart and table read in the same order
  const rows = chart
    .map((x) => ({ category: x.category, total: parseFloat(x.total) || 0 }))
    .sort((a, b) => b.total - a.total)
    .map((x, i) => ({ ...x, color: PALETTE[i % PALETTE.length] }));
  const total = rows.reduce((sum, r) => sum + r.total, 0);
  const top = rows[0];

  const dateLabel = selectedDate
    ? parseDate(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  const chartData = {
    labels: rows.map((r) => r.category),
    datasets: [
      {
        data: rows.map((r) => r.total),
        backgroundColor: rows.map((r) => r.color),
        hoverBackgroundColor: rows.map((r) => r.color),
        borderWidth: 3,
        borderColor: "#131316",
        hoverBorderColor: "#131316",
        hoverOffset: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "64%",
    layout: { padding: 8 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1A1A1E",
        borderColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        titleColor: "#FAFAF9",
        bodyColor: "#D6D3D1",
        titleFont: { family: FONT, weight: "600", size: 13 },
        bodyFont: { family: FONT, size: 13 },
        padding: 12,
        cornerRadius: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.parsed)} · ${formatPercent(ctx.parsed, total)}`,
        },
      },
    },
  };

  return (
    <>
      <Navbar />

      <main className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">Statistics</h1>
            <p className="page-subtitle">See where your money went on a given day.</p>
          </div>
          <div className="w-full sm:w-56">
            <label htmlFor="stats-date" className="label">Date</label>
            <input
              id="stats-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
          </div>
        </header>

        {/* Day summary */}
        <section aria-label="Day summary" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <div className="kpi col-span-2 lg:col-span-1">
            <p className="kpi-label">Spent this day</p>
            {loading ? (
              <div className="skeleton mt-3 h-7 w-32" />
            ) : (
              <p className={`kpi-value ${total > 0 ? "text-expense-400" : ""}`}>
                {total > 0 ? "−" : ""}
                {formatCurrency(total)}
              </p>
            )}
            <p className="kpi-hint">{dateLabel}</p>
          </div>
          <div className="kpi">
            <p className="kpi-label">Categories</p>
            {loading ? <div className="skeleton mt-3 h-7 w-12" /> : <p className="kpi-value">{rows.length}</p>}
            <p className="kpi-hint">With spending</p>
          </div>
          <div className="kpi min-w-0">
            <p className="kpi-label">Top category</p>
            {loading ? (
              <div className="skeleton mt-3 h-7 w-24" />
            ) : (
              <p className="kpi-value truncate">{top ? top.category : "—"}</p>
            )}
            <p className="kpi-hint tabular-nums">
              {top ? `${formatCurrency(top.total)} · ${formatPercent(top.total, total)}` : "No spending"}
            </p>
          </div>
        </section>

        <section className="card card-pad" aria-labelledby="breakdown-title">
          <div className="card-header">
            <div>
              <h2 id="breakdown-title" className="card-title">Spending by category</h2>
              <p className="card-subtitle">Share of the day’s total for each category</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" aria-hidden="true">
              <div className="skeleton mx-auto aspect-square w-full max-w-[260px] rounded-full" />
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton h-10 w-full" />
                ))}
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <div className="icon-tile mb-2 bg-white/[0.06] text-stone-400">
                <PieChart className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-base font-medium text-stone-200">No spending on this day</p>
              <p className="max-w-sm">Pick another date, or add an expense from the Dashboard to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
              <div className="relative mx-auto w-full max-w-[240px] sm:max-w-[280px]">
                <Doughnut
                  data={chartData}
                  options={chartOptions}
                  aria-label={`Doughnut chart of spending by category. Total ${formatCurrency(total)}.`}
                  role="img"
                />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400">Total</span>
                  <span className="mt-1 text-xl font-semibold tabular-nums text-white sm:text-2xl">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="-mx-5 overflow-x-auto sm:-mx-6 lg:mx-0">
                <table className="table">
                  <caption className="sr-only">Spending by category for {dateLabel}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col" className="text-right">Amount</th>
                      <th scope="col" className="w-[38%] text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.category}>
                        <td>
                          <span className="flex items-center gap-2.5">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: r.color }}
                              aria-hidden="true"
                            />
                            <span className="font-medium text-stone-100">{r.category}</span>
                          </span>
                        </td>
                        <td className="amount text-right text-stone-100">{formatCurrency(r.total)}</td>
                        <td>
                          <span className="flex items-center justify-end gap-3">
                            <span className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06] sm:block" aria-hidden="true">
                              <span
                                className="block h-full rounded-full"
                                style={{ width: `${total ? (r.total / total) * 100 : 0}%`, backgroundColor: r.color }}
                              />
                            </span>
                            <span className="w-12 text-right tabular-nums text-stone-300">{formatPercent(r.total, total)}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" className="px-4 py-3.5 text-left text-sm font-semibold text-white">Total</th>
                      <td className="amount px-4 py-3.5 text-right text-white">{formatCurrency(total)}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-stone-400">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
