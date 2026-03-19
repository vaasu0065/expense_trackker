import { useState } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

const getToday = () => new Date().toISOString().split("T")[0];
const getNow = () => new Date().toTimeString().slice(0, 5); // HH:MM

export default function AddExpense({ onAdded }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: getToday(),
    time: getNow(),
  });
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();

    if (!form.title?.trim()) { showToast("Title is required", "warning"); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { showToast("Enter a valid amount", "warning"); return; }
    if (!form.category?.trim()) { showToast("Category is required", "warning"); return; }
    if (!form.date) { showToast("Date is required", "warning"); return; }

    setLoading(true);
    try {
      await api.post("/expenses/add", {
        ...form,
        category: form.category.trim(),
      });
      showToast("Expense added!", "success");
      setForm({ title: "", amount: "", category: "", date: getToday(), time: getNow() });
      if (typeof onAdded === "function") onAdded();
    } catch (err) {
      showToast(err.response?.data?.msg || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}

      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        {/* Title */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            type="text"
            placeholder="e.g. Groceries"
            value={form.title}
            onChange={set("title")}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
          />
        </div>

        {/* Amount */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={set("amount")}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
          />
        </div>

        {/* Category – free text */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <input
            type="text"
            placeholder="e.g. Food, Travel…"
            value={form.category}
            onChange={set("category")}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
          />
        </div>

        {/* Date – defaults to today, user can change */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={set("date")}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        {/* Time */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
          <input
            type="time"
            value={form.time}
            onChange={set("time")}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        {/* Submit */}
        <div className="lg:col-span-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-card hover:shadow-card-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding…" : "Add Expense"}
          </button>
        </div>
      </form>
    </>
  );
}
