import { useState, useEffect, useCallback } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { 
  Filter, 
  ArrowUpDown, 
  Download, 
  FileSpreadsheet, 
  Pencil, 
  Trash2, 
  Receipt, 
  Calendar, 
  Clock, 
  X,
  Check
} from "lucide-react";

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
    if (!window.confirm("Delete this transaction permanently?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      showToast("Transaction removed", "success");
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
      showToast("Expense updated successfully!", "success");
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
      showToast("CSV file downloaded", "success");
    } catch { showToast("Export failed", "error"); }
  };

  const downloadExcel = async () => {
    try {
      const res = await api.get("/expenses/export/excel", { responseType: "blob" });
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(new Blob([res.data]));
      a.download = "expenses.xlsx";
      a.click();
      showToast("Excel spreadsheet downloaded", "success");
    } catch { showToast("Export failed", "error"); }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#131C31]/80 p-3.5 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={filters.month || ""}
              onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value || undefined }))}
              className="pl-8 pr-3 py-2 border border-white/20 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 bg-[#1A253D] text-white outline-none shadow-sm transition-all"
            >
              <option value="" className="bg-[#0F172A] text-white">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1} className="bg-[#0F172A] text-white">
                  {new Date(0, i).toLocaleString("en", { month: "short" })}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <select
            value={filters.category || ""}
            onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value || undefined }))}
            className="px-3 py-2 border border-white/20 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 bg-[#1A253D] text-white outline-none shadow-sm transition-all"
          >
            <option value="" className="bg-[#0F172A] text-white">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-[#0F172A] text-white">{cat}</option>
            ))}
          </select>

          <div className="relative">
            <select
              value={filters.sort || ""}
              onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value || undefined }))}
              className="pl-8 pr-3 py-2 border border-white/20 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 bg-[#1A253D] text-white outline-none shadow-sm transition-all"
            >
              <option value="" className="bg-[#0F172A] text-white">Sort: Newest</option>
              <option value="newest" className="bg-[#0F172A] text-white">Newest first</option>
              <option value="oldest" className="bg-[#0F172A] text-white">Oldest first</option>
              <option value="high" className="bg-[#0F172A] text-white">Highest amount</option>
              <option value="low" className="bg-[#0F172A] text-white">Lowest amount</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#1A253D] hover:bg-white/10 border border-white/20 rounded-xl transition-all shadow-sm active:scale-95"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={downloadExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95"
            title="Download Excel Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Updating ledger…</span>
        </div>
      ) : expenses.length === 0 ? (
        <div className="py-16 text-center bg-[#131C31]/60 rounded-2xl border border-dashed border-white/20">
          <div className="w-12 h-12 rounded-2xl bg-[#1A253D] flex items-center justify-center text-indigo-400 mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-white font-bold mb-1">No transactions recorded</p>
          <p className="text-xs text-slate-400">Add an entry above or reset date filters to explore logs</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#131C31]/80">
                {["Title", "Amount", "Category", "Date", "Time", "Actions"].map((h) => (
                  <th key={h} className={`px-4 py-3 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.map((e) => (
                <tr key={e.id} className="group hover:bg-white/5 hover:scale-[1.004] transition-all duration-200">
                  <td className="px-4 py-3.5 font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                    {e.title}
                  </td>
                  <td className="px-4 py-3.5 font-extrabold text-emerald-400 text-sm">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-colors">
                      {e.category || "General"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      {formatDate(e.date)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      {e.time || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-1.5">
                    <button
                      onClick={() => openEdit(e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-all active:scale-95"
                      title="Edit Transaction"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => del(e.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all active:scale-95"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Del</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Glassmorphic Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B14]/80 backdrop-blur-md animate-fade-in" onClick={() => !saving && setEditModal(null)}>
          <div className="glass-panel rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-scale-up border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-400" /> Edit Transaction
              </h3>
              <button onClick={() => setEditModal(null)} className="p-1 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editModal.title}
                  onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#1A253D] border border-white/20 rounded-xl font-bold text-sm text-white placeholder-slate-400 focus:bg-[#1E2B48] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editModal.amount}
                  onChange={(e) => setEditModal({ ...editModal, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#1A253D] border border-white/20 rounded-xl font-extrabold text-sm text-emerald-400 placeholder-slate-400 focus:bg-[#1E2B48] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Food, Travel…"
                  value={editModal.category}
                  onChange={(e) => setEditModal({ ...editModal, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#1A253D] border border-white/20 rounded-xl font-semibold text-sm text-white placeholder-slate-400 focus:bg-[#1E2B48] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={editModal.date}
                    onChange={(e) => setEditModal({ ...editModal, date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#1A253D] border border-white/20 rounded-xl font-semibold text-sm text-white focus:bg-[#1E2B48] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={editModal.time}
                    onChange={(e) => setEditModal({ ...editModal, time: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#1A253D] border border-white/20 rounded-xl font-semibold text-sm text-white focus:bg-[#1E2B48] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{saving ? "Updating…" : "Save Changes"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  disabled={saving}
                  className="px-5 py-3 border border-white/20 rounded-xl font-bold text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-colors"
                >
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
