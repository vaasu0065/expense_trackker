import { useState, useEffect, useCallback } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

function formatCurrency(n) {
  return `₹${(parseFloat(n) || 0).toLocaleString("en-IN")}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ExpenseList({ filters, setFilters, selectedDate, refreshKey }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Load dynamic categories from user's actual expense data
  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get("/expenses/categories");
      setCategories(res.data);
    } catch (_) {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.month) params.month = filters.month;
      if (filters.category) params.category = filters.category;
      if (filters.sort) params.sort = filters.sort;
      if (selectedDate) params.date = selectedDate;

      const res = await api.get("/expenses/filter", { params });
      setExpenses(res.data);
    } catch (err) {
      showToast("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, selectedDate, showToast]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const del = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      showToast("Expense deleted", "success");
      load();
      loadCategories();
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const openEdit = (e) => {
    setEditModal({
      id: e.id,
      title: e.title,
      amount: String(e.amount),
      category: e.category || "",
      date: e.date?.split?.("T")?.[0] || e.date,
      time: e.time || "",
    });
  };

  const saveEdit = async (ev) => {
    ev.preventDefault();
    if (!editModal) return;
    const { id, title, amount, category, date, time } = editModal;
    if (!title?.trim() || !amount || !category?.trim() || !date) {
      showToast("All fields required", "warning");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/expenses/${id}`, { title, amount, category: category.trim(), date, time });
      showToast("Expense updated", "success");
      setEditModal(null);
      load();
      loadCategories();
    } catch (err) {
      showToast(err.response?.data?.msg || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const res = await api.get("/expenses/export/csv", { responseType: "blob" });
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(new Blob([res.data]));
      a.download = "expenses.csv";
      a.click();
      showToast("CSV exported", "success");
    } catch { showToast("Export failed", "error"); }
  };

  const downloadExcel = async () => {
    try {
      const res = await api.get("/expenses/export/excel", { responseType: "blob" });
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(new Blob([res.data]));
      a.download = "expenses.xlsx";
      a.click();
      showToast("Excel exported", "success");
    } catch { showToast("Export failed", "error"); }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}

      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filters.month || ""}
          onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value || undefined }))}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>
              {new Date(0, i).toLocaleString("en", { month: "short" })}
            </option>
          ))}
        </select>

        {/* Dynamic category filter — built from user's own categories */}
        <select
          value={filters.category || ""}
          onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value || undefined }))}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filters.sort || ""}
          onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value || undefined }))}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">Sort: Newest</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="high">Highest amount</option>
          <option value="low">Lowest amount</option>
        </select>

        <div className="ml-auto flex gap-2">
          <button onClick={downloadCSV} className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            CSV
          </button>
          <button onClick={downloadExcel} className="px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors">
            Excel
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-8 text-center text-slate-500">Loading…</div>
      ) : expenses.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-slate-500 mb-1">No expenses found</p>
          <p className="text-sm text-slate-400">Add one above or adjust filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Title", "Amount", "Category", "Date", "Time", "Actions"].map((h) => (
                  <th key={h} className={`px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-slate-800">{e.title}</td>
                  <td className="px-3 py-2.5 font-semibold text-primary-600">{formatCurrency(e.amount)}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium">
                      {e.category || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{formatDate(e.date)}</td>
                  <td className="px-3 py-2.5 text-slate-500">{e.time || "—"}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => openEdit(e)} className="mr-2 px-2.5 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      Edit
                    </button>
                    <button onClick={() => del(e.id)} className="px-2.5 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => !saving && setEditModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Edit expense</h3>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" value={editModal.title}
                  onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={editModal.amount}
                  onChange={(e) => setEditModal({ ...editModal, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <input type="text" placeholder="e.g. Food, Travel…" value={editModal.category}
                  onChange={(e) => setEditModal({ ...editModal, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" value={editModal.date}
                    onChange={(e) => setEditModal({ ...editModal, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <input type="time" value={editModal.time}
                    onChange={(e) => setEditModal({ ...editModal, time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl disabled:opacity-50">
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button type="button" onClick={() => setEditModal(null)} disabled={saving}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
