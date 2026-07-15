import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "./Navbar";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import api from "../api";
import { EXPENSE_CATEGORIES } from "../constants";
import { FileText, UploadCloud, CheckCircle, Trash2, Calendar, DollarSign, Sparkles, ArrowUpRight, ArrowDownRight, RefreshCw, Layers } from "lucide-react";

const sampleMessages = `Rs.250 debited from your account for UPI payment to SWIGGY on 18-May-2026 at 20:14.
INR 1250.00 spent on HDFC Bank Card xx1234 at AMAZON on 17/05/2026.
Your a/c is debited by Rs 80 for UPI payment to METRO RAIL on 16-05-2026.
Rs.55000 credited to your account via salary credit on 01-May-2026.
INR 1200 received from RAHUL by UPI on 12/05/2026 at 10:45.`;

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatCurrency(n) {
  return `₹${(parseFloat(n) || 0).toLocaleString("en-IN")}`;
}

function normalizeDate(value) {
  if (!value) return getToday();

  const clean = value.replace(/,/g, "").trim();
  const monthMap = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };

  let match = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${year}-${pad(match[2])}-${pad(match[1])}`;
  }

  match = clean.match(/^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{2,4})$/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    const month = monthMap[match[2].slice(0, 3).toLowerCase()];
    if (month) return `${year}-${month}-${pad(match[1])}`;
  }

  match = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) return `${match[1]}-${pad(match[2])}-${pad(match[3])}`;

  return getToday();
}

function guessCategory(text) {
  const lower = text.toLowerCase();
  if (guessType(text) === "credit") {
    if (lower.includes("salary")) return "Income";
    if (lower.includes("refund")) return "Refund";
    return "Income";
  }

  const rules = [
    ["Food", ["swiggy", "zomato", "restaurant", "cafe", "food", "pizza", "burger"]],
    ["Travel", ["uber", "ola", "metro", "rail", "irctc", "fuel", "petrol", "diesel", "rapido"]],
    ["Shopping", ["amazon", "flipkart", "myntra", "shopping", "store", "mart"]],
    ["Bills", ["electricity", "bill", "recharge", "broadband", "airtel", "jio", "vi ", "gas"]],
    ["Health", ["pharmacy", "medical", "hospital", "doctor", "clinic"]],
    ["Entertainment", ["netflix", "prime", "hotstar", "movie", "bookmyshow", "spotify"]],
    ["Education", ["course", "school", "college", "tuition", "exam"]],
  ];

  const match = rules.find(([, words]) => words.some((word) => lower.includes(word)));
  return match?.[0] || "Other";
}

function guessType(text) {
  const lower = text.toLowerCase();
  const creditWords = ["credited", "credit", "received", "deposited", "refund", "salary", "cashback"];
  const debitWords = ["debited", "debit", "spent", "paid", "payment", "withdrawn", "purchase"];

  const hasCredit = creditWords.some((word) => lower.includes(word));
  const hasDebit = debitWords.some((word) => lower.includes(word));

  if (hasCredit && !hasDebit) return "credit";
  return "debit";
}

function extractAmount(text) {
  const patterns = [
    /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i,
    /(?:debited|credited|spent|paid|payment|purchase|withdrawn|received|deposited|refund)\D{0,20}([0-9][0-9,]*(?:\.\d{1,2})?)/i,
    /([0-9][0-9,]*(?:\.\d{1,2})?)\s*(?:rs\.?|inr)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseFloat(match[1].replace(/,/g, ""));
  }

  return 0;
}

function extractDate(text) {
  const patterns = [
    /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/,
    /\b(\d{1,2}[-\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[-\s]\d{2,4})\b/i,
    /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return normalizeDate(match[1]);
  }

  return getToday();
}

function extractTime(text) {
  const match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  return match ? `${pad(match[1])}:${match[2]}` : "";
}

function extractTitle(text) {
  const patterns = [
    /(?:upi payment to|paid to|payment to|transferred to)\s+([A-Za-z0-9 .&_-]+)/i,
    /(?:received from|credited from|from)\s+([A-Za-z0-9 .&_-]+?)(?:\s+by|\s+via|\s+on|\.|$)/i,
    /(?:salary credit|salary)/i,
    /(?:at|towards)\s+([A-Za-z0-9 .&_-]+?)(?:\s+on|\s+dt|\s+for|\.|$)/i,
    /(?:merchant|payee)\s*[:-]\s*([A-Za-z0-9 .&_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (pattern.source.includes("salary") && match) return "Salary";
    if (match?.[1]) {
      return match[1]
        .replace(/\b(on|at|ref|txn|upi|debited|credited)\b.*$/i, "")
        .trim()
        .slice(0, 60);
    }
  }

  return "Imported transaction";
}

function parseMessages(input) {
  return input
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((message, index) => {
      const amount = extractAmount(message);
      return {
        id: `${Date.now()}-${index}`,
        title: extractTitle(message),
        amount: amount ? String(amount) : "",
        type: guessType(message),
        category: guessCategory(message),
        date: extractDate(message),
        time: extractTime(message),
        source: message,
        selected: amount > 0,
      };
    });
}

export default function ImportTransactions() {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
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

  const parse = () => {
    const results = parseMessages(rawText);
    setParsed(results);
    if (results.length === 0) {
      showToast("Paste at least one transaction message", "warning");
      return;
    }
    showToast(`Found ${results.length} possible transaction${results.length === 1 ? "" : "s"}`, "success");
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
      showToast(`${debitCount} debits and ${creditCount} credits imported`, "success");
      setRawText("");
      setParsed([]);
      loadLedger();
    } catch (err) {
      showToast(err.response?.data?.msg || "Import failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}
      <Navbar />

      <div className="min-h-screen py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-card relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-60 h-60 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> AI parser & bulk importer
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Bulk SMS & UPI Importer
              </h1>
              <p className="mt-1 text-slate-300 text-sm sm:text-base">
                Paste raw SMS or UPI notification texts to automatically extract amounts, payees, and timestamps.
              </p>
            </div>
          </header>

          <section className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              <div className="glass-panel rounded-3xl p-5 border border-white shadow-card flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Credited</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/50 flex items-center justify-center text-emerald-600">
                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-600">{formatCurrency(ledgerSummary?.total_credit)}</p>
              </div>

              <div className="glass-panel rounded-3xl p-5 border border-white shadow-card flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Debited</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/50 flex items-center justify-center text-rose-600">
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <p className="text-2xl font-black text-rose-600">{formatCurrency(ledgerSummary?.total_debit)}</p>
              </div>

              <div className="glass-panel rounded-3xl p-5 border border-white shadow-card flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Net Cash Flow</span>
                  <div className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-200/50 flex items-center justify-center text-primary-600">
                    <DollarSign className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <p className={`text-2xl font-black ${(ledgerSummary?.net || 0) >= 0 ? "text-primary-600" : "text-rose-600"}`}>
                  {formatCurrency(ledgerSummary?.net)}
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white shadow-sm flex flex-wrap items-center gap-3 bg-slate-50/60">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-primary-600" />
                <span>Filter Month/Year:</span>
              </div>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 shadow-sm outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {new Date(0, i).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="2020"
                max="2035"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-24 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 shadow-sm outline-none"
              />
              <button
                type="button"
                onClick={loadLedger}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-card mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Paste Payment SMS / Notifications</h2>
              </div>
              <button
                type="button"
                onClick={() => setRawText(sampleMessages)}
                className="px-4 py-2 text-xs font-extrabold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-all border border-primary-200 active:scale-95 shadow-sm"
              >
                + Load Sample Messages
              </button>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste one transaction message per line (e.g., Rs.250 debited from your account for UPI payment to SWIGGY on 18-May-2026)..."
              className="w-full min-h-48 px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl font-mono text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y transition-all shadow-inner"
            />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={parse}
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-card hover:shadow-glow transition-all active:scale-95 text-sm"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Parse & Extract Data</span>
              </button>
              <button
                type="button"
                onClick={() => { setRawText(""); setParsed([]); }}
                className="px-6 py-3.5 border border-slate-200/80 bg-white text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm"
              >
                Clear Text
              </button>
            </div>
          </section>

          {parsed.length > 0 && (
            <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-card mb-8 animate-slide-up">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" /> Review & Confirm Extraction
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Check off rows and edit details before saving to your master ledger.</p>
                </div>
                <button
                  type="button"
                  onClick={importSelected}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-card hover:shadow-glow transition-all disabled:opacity-50 active:scale-95 text-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{loading ? "Importing Selected…" : `Import Selected (${selectedCount})`}</span>
                </button>
              </div>

              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      {["Select", "Type", "Title / Payee", "Amount (₹)", "Category", "Date", "Time", "Action"].map((h, i) => (
                        <th key={`${h}-${i}`} className="px-3.5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors align-middle">
                        <td className="px-3.5 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => updateRow(item.id, "selected", e.target.checked)}
                            className="w-4 h-4 rounded accent-primary-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-3.5 py-3.5 min-w-32">
                          <select
                            value={item.type}
                            onChange={(e) => updateRow(item.id, "type", e.target.value)}
                            className={`w-full px-3 py-1.5 border rounded-xl font-bold text-xs bg-white focus:ring-2 focus:ring-primary-500 outline-none shadow-sm ${
                              item.type === "credit" ? "border-emerald-200 text-emerald-700 bg-emerald-50/50" : "border-rose-200 text-rose-600 bg-rose-50/50"
                            }`}
                          >
                            <option value="debit">Debit (-)</option>
                            <option value="credit">Credit (+)</option>
                          </select>
                        </td>
                        <td className="px-3.5 py-3.5 min-w-56">
                          <input
                            value={item.title}
                            onChange={(e) => updateRow(item.id, "title", e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm bg-white"
                          />
                          <p className="mt-1 text-[11px] font-medium text-slate-400 line-clamp-1 italic">{item.source}</p>
                        </td>
                        <td className="px-3.5 py-3.5 min-w-32">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => updateRow(item.id, "amount", e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-black text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm bg-white"
                          />
                        </td>
                        <td className="px-3.5 py-3.5 min-w-40">
                          <select
                            value={item.category}
                            onChange={(e) => updateRow(item.id, "category", e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 bg-white focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                          >
                            {EXPENSE_CATEGORIES.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3.5 py-3.5 min-w-40">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => updateRow(item.id, "date", e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm bg-white"
                          />
                        </td>
                        <td className="px-3.5 py-3.5 min-w-28">
                          <input
                            type="time"
                            value={item.time}
                            onChange={(e) => updateRow(item.id, "time", e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm bg-white"
                          />
                        </td>
                        <td className="px-3.5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(item.id)}
                            className="p-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all active:scale-95 shadow-sm"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-card">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <Layers className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Monthly Transaction Ledger History</h2>
            </div>
            {ledger.length === 0 ? (
              <div className="py-16 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-slate-500 font-medium">
                No imported transactions for this selected month.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      {["Type", "Title / Payee", "Amount (₹)", "Category", "Date", "Time"].map((h) => (
                        <th key={h} className="px-3.5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledger.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3.5 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            item.type === "credit" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-rose-100 text-rose-700 border border-rose-200"
                          }`}>
                            {item.type === "credit" ? "Credit (+)" : "Debit (-)"}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-extrabold text-slate-800 text-sm">{item.title}</td>
                        <td className={`px-3.5 py-3 font-black text-base ${item.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                          {item.type === "credit" ? "+" : "-"}{formatCurrency(item.amount)}
                        </td>
                        <td className="px-3.5 py-3 text-xs font-bold text-slate-600">{item.category}</td>
                        <td className="px-3.5 py-3 text-xs font-semibold text-slate-600">{item.date}</td>
                        <td className="px-3.5 py-3 text-xs font-semibold text-slate-400">{item.time || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
