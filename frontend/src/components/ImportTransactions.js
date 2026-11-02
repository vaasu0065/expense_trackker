import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "./Navbar";
import AutoImportSetup from "./AutoImportSetup";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import api from "../api";
import { EXPENSE_CATEGORIES } from "../constants";
import { FileText, UploadCloud, Trash2, ArrowUpRight, ArrowDownLeft, RefreshCw, Layers, Scale, ScanText, Eraser } from "lucide-react";
import { parseDate } from "../utils/date";

const sampleMessages = `Rs.250 debited from your account for UPI payment to SWIGGY on 18-May-2026 at 20:14.
INR 1250.00 spent on HDFC Bank Card xx1234 at AMAZON on 17/05/2026.
Your a/c is debited by Rs 80 for UPI payment to METRO RAIL on 16-05-2026.
Rs.55000 credited to your account via salary credit on 01-May-2026.
INR 1200 received from RAHUL by UPI on 12/05/2026 at 10:45.`;

function formatCurrency(n) {
  return `₹${(parseFloat(n) || 0).toLocaleString("en-IN")}`;
}

function formatLedgerDate(value) {
  if (!value) return "—";
  const d = parseDate(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ImportTransactions() {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const selectedCount = useMemo(
    () => parsed.filter((item) => item.selected).length,
    [parsed]
  );

  const loadLedger = useCallback(async () => {
    try {
      const res = await api.get("/expenses/transactions", { params: { month, year } });
      setLedger(res.data?.transactions || []);
      setLedgerSummary(res.data?.summary || null);
    } catch (err) {
      setLedger([]);
      setLedgerSummary(null);
    }
  }, [month, year]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  // Parsing happens on the server so pasted messages are read exactly like
  // the ones the iPhone automation sends.
  const parse = async () => {
    if (!rawText.trim()) {
      showToast("Paste at least one transaction message", "warning");
      return;
    }
    setParsing(true);
    try {
      const res = await api.post("/expenses/parse", { text: rawText });
      const results = (res.data?.transactions || []).map((item, index) => ({
        ...item,
        id: `${Date.now()}-${index}`,
        amount: item.amount ? String(item.amount) : "",
        selected: item.amount > 0,
      }));
      setParsed(results);
      const found = results.filter((item) => item.selected).length;
      if (found === 0) {
        showToast("Couldn't find an amount in these messages. Check they're bank SMS.", "warning");
        return;
      }
      showToast(`Found ${found} transaction${found === 1 ? "" : "s"}`, "success");
    } catch (err) {
      showToast(err.response?.data?.msg || "Couldn't read these messages. Try again.", "error");
    } finally {
      setParsing(false);
    }
  };

  const updateRow = (id, field, value) => {
    setParsed((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeRow = (id) => {
    setParsed((rows) => rows.filter((row) => row.id !== id));
  };

  const importSelected = async () => {
    const transactions = parsed
      .filter((item) => item.selected)
      .map(({ title, amount, category, date, time, type, source }) => ({
        title: title.trim(),
        amount: Number(amount),
        category,
        date,
        time,
        type,
        source,
      }));

    if (transactions.length === 0) {
      showToast("Select at least one transaction to import", "warning");
      return;
    }

    const invalid = transactions.some((item) => !item.title || !item.date || !item.amount || item.amount <= 0);
    if (invalid) {
      showToast("Fix rows with missing title, amount or date", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/expenses/import", { transactions });
      const debitCount = res.data?.debitCount || 0;
      const creditCount = res.data?.creditCount || 0;
      const skipped = res.data?.skipped || 0;
      const skippedNote = skipped ? ` (${skipped} already imported, skipped)` : "";
      showToast(`${debitCount} debits and ${creditCount} credits imported${skippedNote}`, "success");
      setRawText("");
      setParsed([]);
      loadLedger();
    } catch (err) {
      showToast(err.response?.data?.msg || "Import failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const net = Number(ledgerSummary?.net) || 0;
  const periodLabel = new Date(Number(year) || new Date().getFullYear(), (Number(month) || 1) - 1, 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}
      <Navbar />

      <main className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">Import transactions</h1>
            <p className="page-subtitle">Paste bank SMS or UPI notifications to add them to your ledger in bulk.</p>
          </div>

          {/* Period toolbar: drives the summary and the ledger below */}
          <div role="group" aria-label="Ledger period" className="flex items-center gap-2">
            <select
              aria-label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="select min-h-[40px] w-auto py-2 text-base sm:text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {new Date(0, i).toLocaleString("en", { month: "long" })}
                </option>
              ))}
            </select>
            <input
              aria-label="Year"
              type="number"
              inputMode="numeric"
              min="2020"
              max="2035"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="input min-h-[40px] w-24 py-2 text-base sm:text-sm tabular-nums"
            />
            <button
              type="button"
              onClick={loadLedger}
              className="btn-icon border border-white/10 bg-ink-850 hover:bg-ink-800"
              aria-label="Refresh ledger"
              title="Refresh ledger"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Summary */}
        <section aria-label={`Summary for ${periodLabel}`} className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <div className="kpi">
            <div className="flex items-center justify-between gap-2">
              <span className="kpi-label">Credited</span>
              <ArrowDownLeft className="h-4 w-4 text-income-400" aria-hidden="true" />
            </div>
            <p className="kpi-value text-income-400">+{formatCurrency(ledgerSummary?.total_credit)}</p>
            <p className="kpi-hint">{periodLabel}</p>
          </div>
          <div className="kpi">
            <div className="flex items-center justify-between gap-2">
              <span className="kpi-label">Debited</span>
              <ArrowUpRight className="h-4 w-4 text-expense-400" aria-hidden="true" />
            </div>
            <p className="kpi-value text-expense-400">−{formatCurrency(ledgerSummary?.total_debit)}</p>
            <p className="kpi-hint">{periodLabel}</p>
          </div>
          <div className="kpi col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <span className="kpi-label">Net cash flow</span>
              <Scale className="h-4 w-4 text-stone-400" aria-hidden="true" />
            </div>
            <p className={`kpi-value ${net > 0 ? "text-income-400" : net < 0 ? "text-expense-400" : ""}`}>
              {net > 0 ? "+" : net < 0 ? "−" : ""}
              {formatCurrency(Math.abs(net))}
            </p>
            <p className="kpi-hint">{net >= 0 ? "More in than out" : "More out than in"}</p>
          </div>
        </section>

        {/* Paste */}
        <section className="card card-pad mb-6" aria-labelledby="paste-title">
          <div className="card-header mb-4">
            <div>
              <h2 id="paste-title" className="card-title">Paste messages</h2>
              <p className="card-subtitle">We’ll pick out the amount, payee, date and time from each one.</p>
            </div>
          </div>

          <label htmlFor="sms-input" className="label">Messages</label>
          <textarea
            id="sms-input"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Rs.250 debited from your account for UPI payment to SWIGGY on 18-May-2026"
            aria-describedby="sms-hint"
            spellCheck={false}
            className="input min-h-[12rem] resize-y font-mono text-base leading-relaxed sm:text-sm"
          />
          <p id="sms-hint" className="field-hint">Paste one or more bank SMS. Multi-line messages are kept together. Nothing is saved until you review and import.</p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={parse} disabled={parsing} aria-busy={parsing} className="btn-primary">
              <ScanText className="h-4 w-4" aria-hidden="true" />
              {parsing ? "Reading…" : "Parse messages"}
            </button>
            <button type="button" onClick={() => setRawText(sampleMessages)} className="btn-secondary">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Load samples
            </button>
            <button type="button" onClick={() => { setRawText(""); setParsed([]); }} className="btn-ghost">
              <Eraser className="h-4 w-4" aria-hidden="true" />
              Clear
            </button>
          </div>
        </section>

        {/* Review parsed rows */}
        {parsed.length > 0 && (
          <section className="card card-pad mb-6 animate-slide-up" aria-labelledby="review-title">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="review-title" className="card-title">Review before importing</h2>
                <p className="card-subtitle">
                  {selectedCount} of {parsed.length} selected. Edit anything that looks wrong.
                </p>
              </div>
              <button type="button" onClick={importSelected} disabled={loading} className="btn-primary">
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                {loading ? "Importing…" : `Import selected (${selectedCount})`}
              </button>
            </div>

            <ul className="space-y-3">
              {parsed.map((item, index) => {
                const fid = (f) => `row-${item.id}-${f}`;
                return (
                  <li
                    key={item.id}
                    className={`rounded-xl border p-4 transition-colors duration-150 ${
                      item.selected ? "border-white/10 bg-ink-850/60" : "border-white/[0.06] bg-transparent"
                    }`}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <input
                        id={fid("selected")}
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => updateRow(item.id, "selected", e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-brand-500"
                      />
                      <label htmlFor={fid("selected")} className="min-w-0 flex-1 cursor-pointer">
                        <span className="block text-xs font-medium text-stone-400">
                          Message {index + 1} · {item.selected ? "Will be imported" : "Skipped"}
                        </span>
                        <span className="mt-0.5 block break-words font-mono text-xs leading-relaxed text-stone-300">
                          {item.source}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        className="btn-icon -mr-2 -mt-2 hover:bg-expense-500/10 hover:text-expense-400"
                        aria-label={`Remove message ${index + 1}`}
                        title="Remove row"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div
                      className={`grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-[8.5rem_minmax(0,1fr)_7.5rem_9rem_10rem_8.5rem] ${
                        item.selected ? "" : "opacity-60"
                      }`}
                    >
                      <div>
                        <label htmlFor={fid("type")} className="mb-1 block text-xs font-medium text-stone-400">Type</label>
                        <select
                          id={fid("type")}
                          value={item.type}
                          onChange={(e) => updateRow(item.id, "type", e.target.value)}
                          className={`select min-h-[40px] py-2 text-sm font-medium ${
                            item.type === "credit" ? "text-income-300" : "text-expense-300"
                          }`}
                        >
                          <option value="debit">Debit (−)</option>
                          <option value="credit">Credit (+)</option>
                        </select>
                      </div>
                      <div className="col-span-2 row-start-1 md:col-span-1 md:row-start-auto">
                        <label htmlFor={fid("title")} className="mb-1 block text-xs font-medium text-stone-400">Title / payee</label>
                        <input
                          id={fid("title")}
                          value={item.title}
                          onChange={(e) => updateRow(item.id, "title", e.target.value)}
                          className="input min-h-[40px] py-2 text-base sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor={fid("amount")} className="mb-1 block text-xs font-medium text-stone-400">Amount (₹)</label>
                        <input
                          id={fid("amount")}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateRow(item.id, "amount", e.target.value)}
                          className="input min-h-[40px] py-2 text-base sm:text-sm tabular-nums"
                        />
                      </div>
                      <div>
                        <label htmlFor={fid("category")} className="mb-1 block text-xs font-medium text-stone-400">Category</label>
                        <select
                          id={fid("category")}
                          value={item.category}
                          onChange={(e) => updateRow(item.id, "category", e.target.value)}
                          className="select min-h-[40px] py-2 text-base sm:text-sm"
                        >
                          {(EXPENSE_CATEGORIES.includes(item.category) ? EXPENSE_CATEGORIES : [item.category, ...EXPENSE_CATEGORIES]).map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={fid("date")} className="mb-1 block text-xs font-medium text-stone-400">Date</label>
                        <input
                          id={fid("date")}
                          type="date"
                          value={item.date}
                          onChange={(e) => updateRow(item.id, "date", e.target.value)}
                          className="input min-h-[40px] py-2 text-base sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor={fid("time")} className="mb-1 block text-xs font-medium text-stone-400">Time</label>
                        <input
                          id={fid("time")}
                          type="time"
                          value={item.time}
                          onChange={(e) => updateRow(item.id, "time", e.target.value)}
                          className="input min-h-[40px] py-2 text-base sm:text-sm"
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <AutoImportSetup showToast={showToast} />

        {/* Ledger */}
        <section className="card" aria-labelledby="ledger-title">
          <div className="flex items-start gap-3 border-b border-white/[0.08] p-5 sm:p-6">
            <div>
              <h2 id="ledger-title" className="card-title">Ledger</h2>
              <p className="card-subtitle">
                Imported transactions · {periodLabel}
                {ledger.length > 0 ? ` · ${ledger.length} ${ledger.length === 1 ? "entry" : "entries"}` : ""}
              </p>
            </div>
          </div>

          {ledger.length === 0 ? (
            <div className="empty-state">
              <div className="icon-tile mb-2 bg-white/[0.06] text-stone-400">
                <Layers className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-base font-medium text-stone-200">No imported transactions</p>
              <p className="max-w-sm">Nothing was imported for {periodLabel}. Paste messages above or pick another month.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col" className="!pl-6">Type</th>
                      <th scope="col">Title / payee</th>
                      <th scope="col">Category</th>
                      <th scope="col">Date</th>
                      <th scope="col">Time</th>
                      <th scope="col" className="!pr-6 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((item) => {
                      const credit = item.type === "credit";
                      return (
                        <tr key={item.id}>
                          <td className="!pl-6">
                            <span className={credit ? "badge-income" : "badge-expense"}>
                              {credit ? "+ Credit" : "− Debit"}
                            </span>
                          </td>
                          <td className="max-w-[18rem] truncate font-medium text-white" title={item.title}>{item.title}</td>
                          <td className="text-stone-300">{item.category}</td>
                          <td className="whitespace-nowrap tabular-nums text-stone-300">{formatLedgerDate(item.date)}</td>
                          <td className="tabular-nums text-stone-400">{item.time || "—"}</td>
                          <td className={`!pr-6 whitespace-nowrap text-right ${credit ? "amount-in" : "amount-out"}`}>
                            {credit ? "+" : "−"}{formatCurrency(item.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <ul className="md:hidden">
                {ledger.map((item) => {
                  const credit = item.type === "credit";
                  return (
                    <li key={item.id} className="flex items-start gap-3 border-b border-white/[0.05] px-5 py-4 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-[15px] font-medium text-white">{item.title}</p>
                        <p className="mt-0.5 text-xs text-stone-400">
                          {item.category} · {formatLedgerDate(item.date)}
                          {item.time ? ` · ${item.time}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={`text-[15px] ${credit ? "amount-in" : "amount-out"}`}>
                          {credit ? "+" : "−"}{formatCurrency(item.amount)}
                        </span>
                        <span className={credit ? "badge-income" : "badge-expense"}>{credit ? "Credit" : "Debit"}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </main>
    </>
  );
}
