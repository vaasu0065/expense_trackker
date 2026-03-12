import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import { Pie, Bar } from "react-chartjs-2";
import "chart.js/auto";

export default function Statistics() {

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [chart, setChart] = useState([]);

  // ✅ Wrap load in useCallback
  const load = useCallback(async () => {
    try {
      const res = await api.get("/expenses/daily", {
        params: { date: selectedDate }
      });
      setChart(res.data);
    } catch (err) {
      console.log(err);
    }
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);   // ✅ No warning now

  const pieData = {
    labels: chart.map(x => x.category),
    datasets: [
      {
        data: chart.map(x => x.total),
        backgroundColor: [
          "#ff6384",
          "#36a2eb",
          "#ffce56",
          "#4bc0c0",
          "#9966ff",
          "#ff9f40"
        ]
      }
    ]
  };

  const barData = {
    labels: chart.map(x => x.category),
    datasets: [
      {
        label: "Expenses",
        data: chart.map(x => x.total),
        backgroundColor: "#36a2eb"
      }
    ]
  };

  return (
    <>
      <Navbar />

      <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Daily Statistics</h1>

        {/* DATE PICKER */}
        <div className="mb-6">
          <label className="font-semibold mr-3">Select Date:</label>
          <input
            type="date"
            className="border p-2 rounded"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* CHARTS */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl font-semibold mb-3">Expense Charts</h3>

          {chart.length > 0 ? (
            <>
              <div className="w-1/3 mx-auto">
                <Pie data={pieData} />
              </div>

              <div className="mt-8">
                <Bar data={barData} />
              </div>
            </>
          ) : (
            <p>No Expenses Found for this Date</p>
          )}
        </div>
      </div>
    </>
  );
}
