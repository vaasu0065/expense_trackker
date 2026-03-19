import { useState, useEffect } from "react";
import api from "../api";
import { Pie, Bar } from "react-chartjs-2";
import "chart.js/auto";
import { CHART_COLORS } from "../constants";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: "bottom" },
  },
};

export default function Charts({ selectedDate }) {
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/expenses/daily", { params: { date: selectedDate } });
        if (!cancelled) setChart(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setChart([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [selectedDate]);

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
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Expense breakdown</h3>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading…</div>
      ) : chart.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          No data for this period
        </div>
      ) : (
        <div className="space-y-6">
          <div className="max-w-xs mx-auto">
            <Pie data={pieData} options={chartOptions} />
          </div>
          <div className="h-64">
            <Bar data={barData} options={{ ...chartOptions, indexAxis: "y" }} />
          </div>
        </div>
      )}
    </div>
  );
}
