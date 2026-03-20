import { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

const today = () => new Date().toISOString().split("T")[0];

function formatCurrency(n) {
  return `₹${(parseFloat(n) || 0).toLocaleString("en-IN")}`;
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function isOverdue(due_date, status) {
  if (!due_date || status === "settled") return false;
  return new Date(due_date) < new Date(new Date().toDateString());
}

const emptyForm = { type: "lend", person_name: "", amount: "", note: "", date: today(), due_date: "" };

export default function LendBorrow() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [showForm, setShowForm] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get("/lendborrow/summary");
      setSummary(res.data);
    } catch (_) {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get("/lendborrow", { params });
      setEntries(res.data);
    } catch {
      showToast("Failed to load entries", "error");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, showToast]);

  useEffect(() => { load(); loadSummary(); }, [load, loadSummary]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.person_name.trim()) { showToast("Person name is required", "warning"); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { showToast("Enter a valid amount", "warning"); return; }

    setSubmitting(true);
    try {
      await api.post("/lendborrow", form);
      showToast(`${form.type === "lend" ? "Lent" : "Borrowed"} entry added!`, "success");
      setForm(emptyForm);
      setShowForm(false);
      load();
      loadSummary();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to add", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const settle = async (id) => {
    try {
      await api.patch(`/lendborrow/${id}/settle`);
      showToast("Marked as settled!", "success");
      load();
      loadSummary();
    } catch {
      showToast("Failed to settle", "error");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await api.delete(`/lendborrow/${id}`);
      showToast("Deleted", "success");
      load();
      loadSummary();
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const netBalance = summary
    ? parseFloat(summary.total_lent) - parseFloat(summary.total_borrowed)
    : 0;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}
      <Navbar />

      <div className="min-h-screen bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Lend & Borrow</h1>
              <p className="text-slate-500 mt-1">Track money you gave or received</p>
            </div>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-card transition-all"
            >
              {showForm ? "Cancel" : "+ Add Entry"}
            </button>
          </div>

          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">You lent</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.total_lent)}</p>
                <p className="text-xs text-slate-400 mt-1">others owe you</p>
              </div>
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">You borrowed</p>
                <p className="text-xl font-bold text-orange-500">{formatCurrency(summary.total_borrowed)}</p>
                <p className="text-xs text-slate-400 mt-1">you owe others</p>
              </div>
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Net balance</p>
                <p className={`text-xl font-bold ${netBalance >= 0 ? "text-primary-600" : "text-red-500"}`}>
                  {netBalance >= 0 ? "+" : ""}{formatCurrency(Math.abs(netBalance))}
                </p>
                <p className="text-xs text-slate-400 mt-1">{netBalance >= 0 ? "in your favour" : "you owe more"}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Overdue</p>
                <p className={`text-xl font-bold ${parseInt(summary.overdue_count) > 0 ? "text-red-500" : "text-slate-400"}`}>
                  {summary.overdue_count}
                </p>
                <p className="text-xs text-slate-400 mt-1">past due date</p>
              </div>
            </div>
          )}

          {/* Add form */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 mb-8 animate-slide-up">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">New entry</h2>
              <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Type toggle */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <div className="flex gap-3">
                    {["lend", "borrow"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, type: t }))}
                        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                          form.type === t
                            ? t === "lend"
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-orange-500 border-orange-500 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {t === "lend" ? "💸 I lent money" : "🤝 I borrowed money"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {form.type === "lend" ? "Lent to" : "Borrowed from"}
                  </label>
                  <input type="text" placeholder="Person's name" value={form.person_name}
                    onChange={set("person_name")}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
                    onChange={set("amount")}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={set("date")}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due date <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input type="date" value={form.due_date} onChange={set("due_date")}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Note <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input type="text" placeholder="e.g. For dinner, rent split…" value={form.note}
                    onChange={set("note")}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <button type="submit" disabled={submitting}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-card transition-all disabled:opacity-50">
                    {submitting ? "Saving…" : "Save entry"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">All types</option>
              <option value="lend">Lent</option>
              <option value="borrow">Borrowed</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
            </select>
          </div>

          {/* Entries list */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading…</div>
            ) : entries.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl shadow-card border border-slate-100">
                <p className="text-4xl mb-3">🤝</p>
                <p className="text-slate-600 font-medium">No entries found</p>
                <p className="text-slate-400 text-sm mt-1">Add a lend or borrow entry above</p>
              </div>
            ) : (
              entries.map((e) => {
                const overdue = isOverdue(e.due_date, e.status);
                return (
                  <div key={e.id}
                    className={`bg-white rounded-2xl shadow-card border p-5 flex flex-wrap items-center gap-4 transition-all ${
                      overdue ? "border-red-200 bg-red-50/30" : "border-slate-100"
                    } ${e.status === "settled" ? "opacity-60" : ""}`}
                  >
                    {/* Type badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      e.type === "lend" ? "bg-blue-100" : "bg-orange-100"
                    }`}>
                      {e.type === "lend" ? "💸" : "🤝"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{e.person_name}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          e.type === "lend" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {e.type === "lend" ? "You lent" : "You borrowed"}
                        </span>
                        {e.status === "settled" && (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-primary-100 text-primary-700">✓ Settled</span>
                        )}
                        {overdue && (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600">⚠ Overdue</span>
                        )}
                      </div>
                      {e.note && <p className="text-sm text-slate-500 mt-0.5 truncate">{e.note}</p>}
                      <div className="flex gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                        <span>📅 {formatDate(e.date)}</span>
                        {e.due_date && <span className={overdue ? "text-red-500 font-medium" : ""}>⏰ Due {formatDate(e.due_date)}</span>}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl font-bold ${e.type === "lend" ? "text-blue-600" : "text-orange-500"}`}>
                        {formatCurrency(e.amount)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {e.status === "pending" && (
                        <button onClick={() => settle(e.id)}
                          className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 border border-primary-200 rounded-lg transition-colors">
                          Settle
                        </button>
                      )}
                      <button onClick={() => remove(e.id)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
