import { useState, useEffect, useCallback } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { Download, FileSpreadsheet, Pencil, Trash2, Receipt, X, Check } from "lucide-react";
import { parseDate } from "../utils/date";

function formatCurrency(n) {
  return `₹${(parseFloat(n) || 0).toLocaleString("en-IN")}`;
}

function formatDate(d) {
  if (!d) return "—";
  return parseDate(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ExpenseList({ filters, setFilters, selectedDate, setSelectedDate, refreshKey }) {
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
      if (filters.month) {
        params.month = filters.month;
        params.year = new Date().getFullYear();
      }
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

  const thisYear = new Date().getFullYear();
  const shortDate = (d) => {
    if (!d) return "—";
    const dt = parseDate(d);
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      ...(dt.getFullYear() !== thisYear ? { year: "numeric" } : {}),
    });
  };

  const closeEdit = () => {
    if (!saving) setEditModal(null);
  };

  const renderActions = (e) => (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => openEdit(e)}
        className="btn-icon h-9 w-9 hover:text-brand-300"
        aria-label={`Edit ${e.title}`}
        title="Edit"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => del(e.id)}
        className="btn-icon h-9 w-9 hover:bg-expense-500/10 hover:text-expense-400"
        aria-label={`Delete ${e.title}`}
        title="Delete"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}

      <section className="card overflow-hidden" aria-labelledby="ledger-title">
        <div className="card-pad pb-4 sm:pb-5">
          <div className="card-header mb-4 flex-wrap gap-y-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile hidden bg-brand-500/10 text-brand-400 sm:flex">
                <Receipt className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 id="ledger-title" className="card-title">Ledger &amp; history</h2>
                <p className="card-subtitle">
                  {loading
                    ? "Loading transactions…"
                    : `${expenses.length} ${expenses.length === 1 ? "transaction" : "transactions"}${
                        selectedDate ? ` on ${formatDate(selectedDate)}` : ""
                      }`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={downloadCSV} className="btn-secondary btn-sm" title="Download CSV">
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                CSV
              </button>
              <button type="button" onClick={downloadExcel} className="btn-secondary btn-sm" title="Download Excel spreadsheet">
                <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                Excel
              </button>
            </div>
          </div>

          {/* Filters toolbar */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="ledger-date" className="mb-1 block text-xs font-medium text-stone-400">
                Date
              </label>
              <div className="flex gap-2">
                <input
                  id="ledger-date"
                  type="date"
                  className="input min-h-[40px] py-2 text-sm tabular-nums"
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate && setSelectedDate(e.target.value)}
                />
                {selectedDate && setSelectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate("")}
                    className="btn-secondary min-h-[40px] shrink-0 px-3 py-2 text-xs"
                  >
                    All dates
                  </button>
                )}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label htmlFor="ledger-category" className="mb-1 block text-xs font-medium text-stone-400">
                Category
              </label>
              <select
                id="ledger-category"
                value={filters.category || ""}
                onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value || undefined }))}
                className="select min-h-[40px] py-2 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ledger-month" className="mb-1 block text-xs font-medium text-stone-400">
                Month
              </label>
              <select
                id="ledger-month"
                value={filters.month || ""}
                onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value || undefined }))}
                className="select min-h-[40px] py-2 text-sm"
              >
                <option value="">All months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {new Date(0, i).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ledger-sort" className="mb-1 block text-xs font-medium text-stone-400">
                Sort by
              </label>
              <select
                id="ledger-sort"
                value={filters.sort || ""}
                onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value || undefined }))}
                className="select min-h-[40px] py-2 text-sm"
              >
                <option value="">Default</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="high">Highest amount</option>
                <option value="low">Lowest amount</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divider" />

        {loading ? (
          <ul className="divide-y divide-white/[0.05]" aria-busy="true" aria-label="Loading transactions">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <div className="skeleton h-4 w-14" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-2/5" />
                  <div className="skeleton h-3 w-1/5" />
                </div>
                <div className="skeleton h-4 w-16" />
              </li>
            ))}
          </ul>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <Receipt className="h-8 w-8 text-stone-500" aria-hidden="true" />
            <p className="font-medium text-stone-200">No transactions found</p>
            <p>
              {selectedDate
                ? "Nothing recorded on this date. Try another date or clear the filter."
                : "Add an expense above or adjust the filters."}
            </p>
            {selectedDate && setSelectedDate && (
              <button type="button" onClick={() => setSelectedDate("")} className="btn-secondary btn-sm mt-2">
                Show all dates
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="table table-fixed">
                <colgroup>
                  <col className="w-[120px]" />
                  <col />
                  <col className="w-[180px]" />
                  <col className="w-[140px]" />
                  <col className="w-[108px]" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" className="!pl-6">Date</th>
                    <th scope="col">Title</th>
                    <th scope="col">Category</th>
                    <th scope="col" className="text-right">Amount</th>
                    <th scope="col" className="!pr-6 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="!pl-6">
                        <div className="whitespace-nowrap font-medium tabular-nums text-stone-100" title={formatDate(e.date)}>
                          {shortDate(e.date)}
                        </div>
                        <div className="text-xs tabular-nums text-stone-500">{e.time || "—"}</div>
                      </td>
                      <td>
                        <p className="truncate font-medium text-white" title={e.title}>{e.title}</p>
                      </td>
                      <td>
                        <span className="badge-neutral max-w-full truncate">{e.category || "General"}</span>
                      </td>
                      <td className="text-right">
                        <span className="amount-out whitespace-nowrap">−{formatCurrency(e.amount)}</span>
                      </td>
                      <td className="!py-2 !pr-4">
                        {renderActions(e)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y divide-white/[0.05] md:hidden">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate font-medium text-white">{e.title}</p>
                      <span className="amount-out shrink-0 whitespace-nowrap">−{formatCurrency(e.amount)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2 text-xs text-stone-400">
                        <span className="badge-neutral max-w-[45vw] truncate">{e.category || "General"}</span>
                        <span className="whitespace-nowrap tabular-nums">
                          {shortDate(e.date)}
                          {e.time ? ` · ${e.time}` : ""}
                        </span>
                      </div>
                      <div className="-my-1.5 -mr-2 shrink-0">
                        {renderActions(e)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Edit modal */}
      {editModal && (
        <div className="modal-backdrop" onClick={closeEdit} onKeyDown={(ev) => ev.key === "Escape" && closeEdit()}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-expense-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 id="edit-expense-title" className="card-title">Edit transaction</h3>
              <button type="button" onClick={closeEdit} className="btn-icon" aria-label="Close dialog">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="label">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  autoFocus
                  value={editModal.title}
                  onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-amount" className="label">Amount (₹)</label>
                  <input
                    id="edit-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={editModal.amount}
                    onChange={(e) => setEditModal({ ...editModal, amount: e.target.value })}
                    className="input font-semibold tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="edit-category" className="label">Category</label>
                  <input
                    id="edit-category"
                    type="text"
                    placeholder="e.g. Food, Travel"
                    value={editModal.category}
                    onChange={(e) => setEditModal({ ...editModal, category: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-date" className="label">Date</label>
                  <input
                    id="edit-date"
                    type="date"
                    value={editModal.date}
                    onChange={(e) => setEditModal({ ...editModal, date: e.target.value })}
                    className="input tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="edit-time" className="label">Time</label>
                  <input
                    id="edit-time"
                    type="time"
                    value={editModal.time}
                    onChange={(e) => setEditModal({ ...editModal, time: e.target.value })}
                    className="input tabular-nums"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeEdit} disabled={saving} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {saving ? "Updating…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
