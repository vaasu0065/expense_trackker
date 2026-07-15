import { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Scale, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Sparkles,
  DollarSign
} from "lucide-react";

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

  useAutoRefresh(load);

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

      <div className="min-h-screen py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Banner */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-card relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Credit & Debt Log
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Lend & Borrow Tracker
              </h1>
              <p className="mt-1 text-slate-300 text-sm sm:text-base">
                Keep crystal clear tabs on funds you gave out or borrowed from friends.
              </p>
            </div>

            <button
              onClick={() => setShowForm((v) => !v)}
              className="relative z-10 flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-card hover:shadow-glow transition-all active:scale-95 text-sm"
            >
              <Plus className={`w-5 h-5 transition-transform duration-300 ${showForm ? "rotate-45" : ""}`} />
              <span>{showForm ? "Close Form" : "Add Transaction"}</span>
            </button>
          </header>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="glass-panel rounded-3xl p-5 border border-white shadow-card flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">You Lent</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/50 flex items-center justify-center text-blue-600">
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-blue-600">{formatCurrency(summary.total_lent)}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">Others owe you</p>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-5 border border-white shadow-card flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">You Borrowed</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/50 flex items-center justify-center text-orange-600">
                    <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-orange-500">{formatCurrency(summary.total_borrowed)}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">You owe others</p>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-5 border border-white shadow-card flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Net Balance</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/50 flex items-center justify-center text-emerald-600">
                    <Scale className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <div>
                  <p className={`text-xl sm:text-2xl font-black ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {netBalance >= 0 ? "+" : ""}{formatCurrency(Math.abs(netBalance))}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">{netBalance >= 0 ? "In your favour" : "You owe net"}</p>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-5 border border-white shadow-card flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Overdue Due</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/50 flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <div>
                  <p className={`text-xl sm:text-2xl font-black ${parseInt(summary.overdue_count) > 0 ? "text-rose-600 animate-pulse" : "text-slate-400"}`}>
                    {summary.overdue_count}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">Past due date</p>
                </div>
              </div>
            </div>
          )}

          {/* Add form */}
          {showForm && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-card mb-8 animate-slide-up">
              <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary-600" /> Record New Transaction
              </h2>
              <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                {/* Type toggle */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Transaction Type</label>
                  <div className="flex gap-4">
                    {["lend", "borrow"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, type: t }))}
                        className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-sm border flex items-center justify-center gap-2 ${
                          form.type === t
                            ? t === "lend"
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-card"
                              : "bg-gradient-to-r from-orange-500 to-amber-600 border-orange-500 text-white shadow-card"
                            : "bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {t === "lend" ? <ArrowUpRight className="w-4 h-4 stroke-[3]" /> : <ArrowDownLeft className="w-4 h-4 stroke-[3]" />}
                        <span>{t === "lend" ? "I Lent Money (They Owe Me)" : "I Borrowed Money (I Owe Them)"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {form.type === "lend" ? "Lent to" : "Borrowed from"}
                  </label>
                  <input
                    type="text"
                    placeholder="Person's name"
                    value={form.person_name}
                    onChange={set("person_name")}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl font-bold text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={set("amount")}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl font-black text-sm text-emerald-700 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={set("date")}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Due date <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={set("due_date")}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Note <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. For dinner, rent split…"
                    value={form.note}
                    onChange={set("note")}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 text-white font-black rounded-xl shadow-card hover:shadow-glow transition-all disabled:opacity-50 active:scale-95"
                  >
                    {submitting ? "Saving Entry…" : "Save Ledger Entry"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500 bg-white text-slate-700 outline-none shadow-sm"
              >
                <option value="">All Types</option>
                <option value="lend">💸 Lent Only</option>
                <option value="borrow">🤝 Borrowed Only</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500 bg-white text-slate-700 outline-none shadow-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending Settlement</option>
                <option value="settled">Settled & Closed</option>
              </select>
            </div>
          </div>

          {/* Entries list */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold">Syncing records…</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="py-16 text-center glass-panel rounded-3xl border border-dashed border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Users className="w-7 h-7" />
                </div>
                <p className="text-slate-700 font-bold text-base mb-1">No transactions logged yet</p>
                <p className="text-slate-400 text-xs mt-1">Click the + Add Transaction button above to record a credit or debt</p>
              </div>
            ) : (
              entries.map((e) => {
                const overdue = isOverdue(e.due_date, e.status);
                return (
                  <div
                    key={e.id}
                    className={`glass-panel rounded-2xl p-5 flex flex-wrap items-center gap-4 transition-all duration-300 hover:scale-[1.006] ${
                      overdue
                        ? "border-rose-300/80 bg-rose-50/40 shadow-rose-500/5"
                        : "border-white shadow-card hover:shadow-glow"
                    } ${e.status === "settled" ? "opacity-65 bg-slate-50/40" : ""}`}
                  >
                    {/* Type badge */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        e.type === "lend"
                          ? "bg-blue-100/80 text-blue-600 border border-blue-200/60"
                          : "bg-orange-100/80 text-orange-600 border border-orange-200/60"
                      }`}
                    >
                      {e.type === "lend" ? <ArrowUpRight className="w-6 h-6 stroke-[2.5]" /> : <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-800 text-base">{e.person_name}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            e.type === "lend" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {e.type === "lend" ? "You Lent" : "You Borrowed"}
                        </span>
                        {e.status === "settled" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Settled
                          </span>
                        )}
                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>
                      {e.note && <p className="text-sm font-medium text-slate-600 mt-1 truncate">{e.note}</p>}
                      <div className="flex gap-4 mt-2 text-xs font-semibold text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(e.date)}</span>
                        {e.due_date && (
                          <span className={`flex items-center gap-1 ${overdue ? "text-rose-600 font-bold" : ""}`}>
                            <Clock className="w-3.5 h-3.5" /> Due: {formatDate(e.due_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl sm:text-2xl font-black ${e.type === "lend" ? "text-blue-600" : "text-orange-600"}`}>
                        {formatCurrency(e.amount)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {e.status === "pending" && (
                        <button
                          onClick={() => settle(e.id)}
                          className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all active:scale-95 shadow-sm"
                          title="Mark as Settled"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Settle</span>
                        </button>
                      )}
                      <button
                        onClick={() => remove(e.id)}
                        className="p-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all active:scale-95 shadow-sm"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
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
