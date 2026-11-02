import { useState } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { todayLocal } from "../utils/date";
import { Plus } from "lucide-react";

const getNow = () => new Date().toTimeString().slice(0, 5); // HH:MM

const POPULAR_CATEGORIES = ["Food & Dining", "Groceries", "Transport", "Shopping", "Entertainment", "Utilities", "Health"];

export default function AddExpense({ onAdded }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: todayLocal(),
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
      setForm({ title: "", amount: "", category: "", date: todayLocal(), time: getNow() });
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

      <form onSubmit={save} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="add-title" className="label">Title</label>
            <input
              id="add-title"
              type="text"
              placeholder="e.g. Starbucks coffee"
              value={form.title}
              onChange={set("title")}
              className="input"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="add-amount" className="label">Amount</label>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-stone-400"
                aria-hidden="true"
              >
                ₹
              </span>
              <input
                id="add-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={form.amount}
                onChange={set("amount")}
                className="input pl-8 font-semibold tabular-nums"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="add-category" className="label">Category</label>
            <input
              id="add-category"
              type="text"
              placeholder="e.g. Dining"
              value={form.category}
              onChange={set("category")}
              className="input"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="add-date" className="label">Date</label>
            <input id="add-date" type="date" value={form.date} onChange={set("date")} className="input tabular-nums" />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="add-time" className="label">Time</label>
            <input id="add-time" type="time" value={form.time} onChange={set("time")} className="input tabular-nums" />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-labelledby="quick-cat-label" className="flex flex-wrap items-center gap-2">
            <span id="quick-cat-label" className="mr-1 text-xs font-medium text-stone-400">
              Quick pick
            </span>
            {POPULAR_CATEGORIES.map((cat) => {
              const active = form.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => selectCategory(cat)}
                  aria-pressed={active}
                  className={`min-h-[36px] rounded-full border px-3 text-xs font-medium transition-colors duration-150 ${
                    active
                      ? "border-brand-400/60 bg-brand-500/15 text-brand-300"
                      : "border-white/10 bg-ink-850 text-stone-300 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full shrink-0 lg:w-auto lg:min-w-[160px]">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {loading ? "Adding…" : "Add expense"}
          </button>
        </div>
      </form>
    </>
  );
}
