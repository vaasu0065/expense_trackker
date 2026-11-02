import { useState, useCallback, useEffect } from "react";
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
  Check,
  Trash2,
  X,
} from "lucide-react";
import { todayLocal, parseDate } from "../utils/date";

const today = todayLocal;

function formatCurrency(n) {
  return `₹${(parseFloat(n) || 0).toLocaleString("en-IN")}`;
}
function formatDate(d) {
  if (!d) return "—";
  return parseDate(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function isOverdue(due_date, status) {
  if (!due_date || status === "settled") return false;
  return String(due_date).slice(0, 10) < todayLocal();
}

const emptyForm = { type: "lend", person_name: "", amount: "", note: "", date: today(), due_date: "" };

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "lend", label: "Lent" },
  { value: "borrow", label: "Borrowed" },
];
const STATUS_FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "settled", label: "Settled" },
  { value: "", label: "All" },
];

function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="segmented">
      {options.map((o) => (
        <button
          key={o.value || "all"}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`segmented-item ${value === o.value ? "segmented-item-active" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

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

  const refresh = useCallback(() => { load(); loadSummary(); }, [load, loadSummary]);

  // Loads immediately, then every 5 minutes (summary included)
  useAutoRefresh(refresh);

  // Close the add-entry dialog with Escape
  useEffect(() => {
    if (!showForm) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setShowForm(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showForm]);

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
  const overdueCount = parseInt(summary?.overdue_count, 10) || 0;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}
      <Navbar />

      <main className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">Lend &amp; Borrow</h1>
            <p className="page-subtitle">Track money you’ve lent to friends and money you owe.</p>
          </div>
          <button type="button" onClick={() => setShowForm(true)} className="btn-primary self-start sm:self-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add entry
          </button>
        </header>

        {/* Summary */}
        <section aria-label="Summary" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {summary ? (
            <>
              <div className="kpi">
                <div className="flex items-center justify-between gap-2">
                  <span className="kpi-label">You lent</span>
                  <ArrowUpRight className="h-4 w-4 text-income-400" aria-hidden="true" />
                </div>
                <p className="kpi-value text-income-400">{formatCurrency(summary.total_lent)}</p>
                <p className="kpi-hint">Others owe you</p>
              </div>

              <div className="kpi">
                <div className="flex items-center justify-between gap-2">
                  <span className="kpi-label">You borrowed</span>
                  <ArrowDownLeft className="h-4 w-4 text-expense-400" aria-hidden="true" />
                </div>
                <p className="kpi-value text-expense-400">{formatCurrency(summary.total_borrowed)}</p>
                <p className="kpi-hint">You owe others</p>
              </div>

              <div className="kpi">
                <div className="flex items-center justify-between gap-2">
                  <span className="kpi-label">Net balance</span>
                  <Scale className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
                <p className={`kpi-value ${netBalance > 0 ? "text-income-400" : netBalance < 0 ? "text-expense-400" : ""}`}>
                  {netBalance > 0 ? "+" : netBalance < 0 ? "−" : ""}
                  {formatCurrency(Math.abs(netBalance))}
                </p>
                <p className="kpi-hint">{netBalance >= 0 ? "In your favour" : "You owe overall"}</p>
              </div>

              <div className="kpi">
                <div className="flex items-center justify-between gap-2">
                  <span className="kpi-label">Overdue</span>
                  <AlertTriangle
                    className={`h-4 w-4 ${overdueCount > 0 ? "text-amber-400" : "text-slate-500"}`}
                    aria-hidden="true"
                  />
                </div>
                <p className={`kpi-value ${overdueCount > 0 ? "text-amber-400" : ""}`}>{overdueCount}</p>
                <p className="kpi-hint">{overdueCount === 1 ? "Entry past due date" : "Entries past due date"}</p>
              </div>
            </>
          ) : (
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="kpi">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton mt-3 h-7 w-28" />
                <div className="skeleton mt-2 h-3 w-24" />
              </div>
            ))
          )}
        </section>

        {/* Entries */}
        <section className="card" aria-labelledby="entries-title">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="entries-title" className="card-title">Entries</h2>
              <p className="card-subtitle">
                {loading ? "Loading…" : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Segmented label="Filter by type" options={TYPE_FILTERS} value={filterType} onChange={setFilterType} />
              <Segmented label="Filter by status" options={STATUS_FILTERS} value={filterStatus} onChange={setFilterStatus} />
            </div>
          </div>

          {loading ? (
            <ul aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-4 border-b border-white/[0.05] p-4 last:border-0 sm:p-5">
                  <div className="skeleton h-10 w-10 rounded-xl" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton mt-2 h-3 w-48" />
                  </div>
                  <div className="skeleton h-5 w-20" />
                </li>
              ))}
            </ul>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <div className="icon-tile mb-2 bg-white/[0.06] text-slate-400">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-base font-medium text-slate-200">No entries here yet</p>
              <p className="max-w-sm">
                {filterType || filterStatus
                  ? "Nothing matches these filters. Try another filter or add a new entry."
                  : "Record money you lend or borrow to keep track of who owes what."}
              </p>
              <button type="button" onClick={() => setShowForm(true)} className="btn-secondary mt-3">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add entry
              </button>
            </div>
          ) : (
            <ul>
              {entries.map((e) => {
                const overdue = isOverdue(e.due_date, e.status);
                const lend = e.type === "lend";
                const settled = e.status === "settled";
                return (
                  <li
                    key={e.id}
                    className="flex gap-3 border-b border-white/[0.05] p-4 transition-colors duration-150 last:border-0 hover:bg-white/[0.02] sm:gap-4 sm:p-5"
                  >
                    <div
                      className={`icon-tile ${
                        settled
                          ? "bg-white/[0.06] text-slate-400"
                          : lend
                          ? "bg-income-500/15 text-income-400"
                          : "bg-expense-500/15 text-expense-400"
                      }`}
                    >
                      {lend ? (
                        <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5" aria-hidden="true" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="break-words text-[15px] font-semibold text-white">{e.person_name}</span>
                            <span className={lend ? "badge-income" : "badge-expense"}>
                              {lend ? "You lent" : "You borrowed"}
                            </span>
                            {settled && (
                              <span className="badge-neutral">
                                <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Settled
                              </span>
                            )}
                          </div>
                          {e.note && <p className="mt-1 break-words text-sm text-slate-400">{e.note}</p>}
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={`amount text-base sm:text-lg ${
                              settled ? "text-slate-400 line-through decoration-slate-600" : lend ? "text-income-400" : "text-expense-400"
                            }`}
                          >
                            {formatCurrency(e.amount)}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {settled ? "Settled" : lend ? "Owes you" : "You owe"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatDate(e.date)}
                          </span>
                          {e.due_date && (
                            <span
                              className={`inline-flex items-center gap-1.5 ${overdue ? "font-medium text-amber-400" : ""}`}
                            >
                              {overdue ? (
                                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              {overdue ? "Overdue · was due" : "Due"} {formatDate(e.due_date)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {e.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => settle(e.id)}
                              className="btn-secondary btn-sm"
                              aria-label={`Mark entry with ${e.person_name} as settled`}
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              Settle
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => remove(e.id)}
                            className="btn-icon h-9 w-9 hover:bg-expense-500/10 hover:text-expense-400"
                            aria-label={`Delete entry with ${e.person_name}`}
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Add entry dialog */}
      {showForm && (
        <div className="modal-backdrop" onMouseDown={(ev) => { if (ev.target === ev.currentTarget) setShowForm(false); }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lb-form-title"
            className="modal-panel max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="lb-form-title" className="card-title">New entry</h2>
                <p className="card-subtitle">Record money you lent or borrowed.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-icon -mr-2 -mt-2"
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="label" id="lb-type-label">Type</span>
                <div role="radiogroup" aria-labelledby="lb-type-label" className="segmented flex w-full">
                  {["lend", "borrow"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={form.type === t}
                      onClick={() => setForm((p) => ({ ...p, type: t }))}
                      className={`segmented-item inline-flex flex-1 items-center justify-center gap-1.5 ${
                        form.type === t ? "segmented-item-active" : ""
                      }`}
                    >
                      {t === "lend" ? (
                        <ArrowUpRight className={`h-4 w-4 ${form.type === t ? "text-income-400" : ""}`} aria-hidden="true" />
                      ) : (
                        <ArrowDownLeft className={`h-4 w-4 ${form.type === t ? "text-expense-400" : ""}`} aria-hidden="true" />
                      )}
                      {t === "lend" ? "I lent money" : "I borrowed money"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="lb-person" className="label">
                  {form.type === "lend" ? "Lent to" : "Borrowed from"}
                </label>
                <input
                  id="lb-person"
                  type="text"
                  placeholder="Person’s name"
                  value={form.person_name}
                  onChange={set("person_name")}
                  className="input"
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="lb-amount" className="label">Amount (₹)</label>
                <input
                  id="lb-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={set("amount")}
                  className="input tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="lb-date" className="label">Date</label>
                <input id="lb-date" type="date" value={form.date} onChange={set("date")} className="input" />
              </div>

              <div>
                <label htmlFor="lb-due" className="label">
                  Due date <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input id="lb-due" type="date" value={form.due_date} onChange={set("due_date")} className="input" />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="lb-note" className="label">
                  Note <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  id="lb-note"
                  type="text"
                  placeholder="e.g. Dinner, rent split"
                  value={form.note}
                  onChange={set("note")}
                  className="input"
                />
              </div>

              <div className="mt-2 flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Saving…" : "Save entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
