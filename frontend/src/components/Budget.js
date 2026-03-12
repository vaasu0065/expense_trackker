import { useState } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

export default function Budget({ onSaved }){
  const [month,setMonth] = useState("");
  const [year,setYear] = useState(new Date().getFullYear());
  const [income,setIncome] = useState("");
  const [budget,setBudget] = useState("");
  const [summary,setSummary] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const save = async ()=>{
    if (!month || !year || !income || !budget) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    try {
      await api.post("/expenses/budget",{
        month,
        year,
        income,
        budget
      });
      showToast("Budget saved successfully! 💰", "success");
      load();
      if (typeof onSaved === "function") onSaved();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.msg || "Failed to save budget", "error");
    }
  }

  const load = async ()=>{
    if (!month || !year) {
      showToast("Please select month and year", "info");
      return;
    }

    try {
      const res = await api.get("/expenses/budget",{
        params:{month,year}
      });
      setSummary(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load budget data", "error");
    }
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
      
      <div className="bg-white shadow-md rounded-xl p-6 mb-8">

        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Budget & Income
        </h3>

        <div className="flex gap-3 mb-3">
          <select className="border p-2" onChange={e=>setMonth(e.target.value)}>
            <option value="">Month</option>
            {[...Array(12)].map((_,i)=>(
              <option value={i+1} key={i}>
                {new Date(0,i).toLocaleString("en",{month:"short"})}
              </option>
            ))}
          </select>

          <input 
            type="number"
            className="border p-2"
            placeholder="Year"
            value={year}
            onChange={e=>setYear(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mb-3">
          <input className="border p-2"
            placeholder="Income"
            value={income}
            onChange={e=>setIncome(e.target.value)}
          />

          <input className="border p-2"
            placeholder="Budget"
            value={budget}
            onChange={e=>setBudget(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Save Budget
          </button>

          <button
            onClick={load}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
            Load Budget
          </button>
        </div>

        {summary && (
          <div className="mt-5">
            <p>Income: ₹{summary.income}</p>
            <p>Budget: ₹{summary.budget}</p>
            <p>Spent: ₹{summary.spent}</p>
            <p className={summary.remaining < 0 ? "text-red-600" : "text-green-600"}>
              Remaining: ₹{summary.remaining}
            </p>

            <div className="w-full bg-gray-300 h-3 rounded mt-2">
              <div
                className="bg-green-500 h-3 rounded"
                style={{width: `${(summary.spent / summary.budget) * 100}%`}}
              ></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
