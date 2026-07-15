import { useState } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { Tag, IndianRupee, FolderHeart, Calendar, Clock, Plus, Sparkles } from "lucide-react";

const getToday = () => new Date().toISOString().split("T")[0];
const getNow = () => new Date().toTimeString().slice(0, 5); // HH:MM

const POPULAR_CATEGORIES = ["Food & Dining", "Groceries", "Transport", "Shopping", "Entertainment", "Utilities", "Health"];

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

  const selectCategory = (cat) => {
    setForm((prev) => ({ ...prev, category: cat }));
  };

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
      showToast("Expense added successfully!", "success");
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

      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          {/* Title */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-400" /> Title
            </label>
            <input
              type="text"
              placeholder="e.g. Starbucks Coffee"
              value={form.title}
              onChange={set("title")}
              className="w-full px-3.5 py-2.5 bg-[#1A253D] border border-white/20 rounded-2xl font-semibold text-sm text-white placeholder-slate-400 focus:bg-[#1E2B48] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Amount */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Amount (₹)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={set("amount")}
                className="w-full pl-8 pr-3.5 py-2.5 bg-[#1A253D] border border-white/20 rounded-2xl font-bold text-sm text-emerald-400 placeholder-slate-400 focus:bg-[#1E2B48] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 outline-none transition-all shadow-inner"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
            </div>
          </div>

          {/* Category */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
              <FolderHeart className="w-3.5 h-3.5 text-blue-400" /> Category
            </label>
            <input
              type="text"
              placeholder="e.g. Dining"
              value={form.category}
              onChange={set("category")}
              className="w-full px-3.5 py-2.5 bg-[#1A253D] border border-white/20 rounded-2xl font-semibold text-sm text-white placeholder-slate-400 focus:bg-[#1E2B48] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Date */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={set("date")}
              className="w-full px-3.5 py-2.5 bg-[#1A253D] border border-white/20 rounded-2xl font-semibold text-sm text-white focus:bg-[#1E2B48] focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Time */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> Time
            </label>
            <input
              type="time"
              value={form.time}
              onChange={set("time")}
              className="w-full px-3.5 py-2.5 bg-[#1A253D] border border-white/20 rounded-2xl font-semibold text-sm text-white focus:bg-[#1E2B48] focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Submit */}
          <div className="lg:col-span-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{loading ? "Adding…" : "Log Entry"}</span>
            </button>
          </div>
        </div>

        {/* Quick Category Pills */}
        <div className="pt-2 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Quick Select:
          </span>
          {POPULAR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => selectCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border ${
                form.category === cat
                  ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/30 scale-105"
                  : "bg-[#1A253D] text-slate-200 border-white/10 hover:border-indigo-400 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </form>
    </>
  );
}
