import { useState, useEffect } from "react";
import api from "../api";
import { Pie, Bar } from "react-chartjs-2";
import "chart.js/auto";

export default function Charts({ selectedDate }) {
  const [chart, setChart] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/expenses/daily", {
          params: { date: selectedDate }
        });

        setChart(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, [selectedDate]);   // ✅ Correct dependency → No ESLint warning

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
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Expense Charts</h3>

      {chart.length > 0 ? (
        <>
          <div className="w-1/3 mx-auto">
            <Pie data={pieData} />
          </div>

          <div className="mt-6">
            <Bar data={barData} />
          </div>
        </>
      ) : (
        <p>No data found for this date</p>
      )}
    </div>
  );
}
