import { useState, useEffect, useCallback } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

export default function ExpenseList({ filters, setFilters, selectedDate }) {
  const [expenses, setExpenses] = useState([]);
  const { toast, showToast, hideToast } = useToast();

  const load = useCallback(async (params = {}) => {
    try {
      const res = await api.get("/expenses/filter", { params });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load expenses", "error");
    }
  }, [showToast]);

  useEffect(() => {
    const params = { ...filters };
    if (selectedDate) params.date = selectedDate;
    load(params);
  }, [filters, selectedDate, load]);

  // DELETE EXPENSE
  const del = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    
    try {
      await api.delete(`/expenses/${id}`);
      showToast("Expense deleted successfully! 🗑️", "success");
      const params = { ...filters };
      if (selectedDate) params.date = selectedDate;
      load(params);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete expense", "error");
    }
  };

  // ✅ CSV DOWNLOAD
  const downloadCSV = async () => {
    try {
      const res = await api.get("/expenses/export/csv", {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "expenses.csv";
      a.click();
      
      showToast("CSV exported successfully! 📊", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export CSV", "error");
    }
  };

  // ✅ EXCEL DOWNLOAD
  const downloadExcel = async () => {
    try {
      const res = await api.get("/expenses/export/excel", {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "expenses.xlsx";
      a.click();
      
      showToast("Excel exported successfully! 📈", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export Excel", "error");
    }
  };

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
      
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Expenses
      </h3>

      {/* ✅ EXPORT BUTTONS */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={downloadCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>

        <button
          onClick={downloadExcel}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex gap-3 mb-4">
        {/* Month */}
        <select
          onChange={(e)=> setFilters(prev => ({...prev, month:e.target.value}))}
          className="border p-2 rounded"
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option value={i + 1} key={i}>
              {new Date(0, i).toLocaleString("en", { month: "short" })}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          onChange={(e)=> setFilters(prev => ({...prev, category:e.target.value}))}
          className="border p-2 rounded"
        >
          <option value="">All Categories</option>
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Shopping">Shopping</option>
          <option value="Bills">Bills</option>
          <option value="Other">Other</option>
        </select>

        {/* Sort */}
        <select
          onChange={(e)=> setFilters(prev => ({...prev, sort:e.target.value}))}
          className="border p-2 rounded"
        >
          <option value="">Sort By</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="high">Highest Amount</option>
          <option value="low">Lowest Amount</option>
        </select>
      </div>

      {/* TABLE */}
      {expenses.length === 0 && (
        <p className="text-gray-500">No expenses found</p>
      )}

      {expenses.length > 0 && (
        <table className="w-full text-left">
          <thead className="text-gray-600 border-b">
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Category</th>
              <th className="p-2">Date</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="p-2">{e.title}</td>
                <td className="p-2 font-bold text-green-600">
                  ₹{e.amount}
                </td>
                <td className="p-2">{e.category}</td>
                <td className="p-2">
                  {new Date(e.date).toLocaleDateString()}
                </td>

                <td className="p-2">
                  <button
                    onClick={() => del(e.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
