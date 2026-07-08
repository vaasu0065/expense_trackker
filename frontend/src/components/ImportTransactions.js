import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "./Navbar";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import api from "../api";
import { EXPENSE_CATEGORIES } from "../constants";

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

      <div className="min-h-screen bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Import Transactions
            </h1>
            <p className="mt-1 text-slate-500">
              Paste payment messages and review credits and debits before saving.
            </p>
          </header>

          <section className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Credited</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(ledgerSummary?.total_credit)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Debited</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(ledgerSummary?.total_debit)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Net</p>
                <p className={`text-2xl font-bold ${(ledgerSummary?.net || 0) >= 0 ? "text-primary-600" : "text-red-500"}`}>
                  {formatCurrency(ledgerSummary?.net)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 flex flex-wrap items-center gap-3">
              <label className="font-medium text-slate-700">Monthly transactions:</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {new Date(0, i).toLocaleString("en", { month: "short" })}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="2020"
                max="2035"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-28 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={loadLedger}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Refresh
              </button>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Payment messages</h2>
              <button
                type="button"
                onClick={() => setRawText(sampleMessages)}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Use sample
              </button>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste one transaction message per line..."
              className="w-full min-h-56 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={parse}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-card transition-colors"
              >
                Parse Messages
              </button>
              <button
                type="button"
                onClick={() => { setRawText(""); setParsed([]); }}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </section>

          {parsed.length > 0 && (
            <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Review import</h2>
                  <p className="text-sm text-slate-500">{selectedCount} selected of {parsed.length}</p>
                </div>
                <button
                  type="button"
                  onClick={importSelected}
                  disabled={loading}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Importing..." : "Import Selected"}
                </button>
              </div>

              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {["", "Type", "Title", "Amount", "Category", "Date", "Time", ""].map((h, i) => (
                        <th key={`${h}-${i}`} className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 align-top">
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => updateRow(item.id, "selected", e.target.checked)}
                            className="w-4 h-4 accent-primary-600"
                          />
                        </td>
                        <td className="px-3 py-3 min-w-32">
                          <select
                            value={item.type}
                            onChange={(e) => updateRow(item.id, "type", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none ${
                              item.type === "credit" ? "border-primary-200 text-primary-700" : "border-red-200 text-red-600"
                            }`}
                          >
                            <option value="debit">Debit</option>
                            <option value="credit">Credit</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 min-w-52">
                          <input
                            value={item.title}
                            onChange={(e) => updateRow(item.id, "title", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.source}</p>
                        </td>
                        <td className="px-3 py-3 min-w-32">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => updateRow(item.id, "amount", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </td>
                        <td className="px-3 py-3 min-w-40">
                          <select
                            value={item.category}
                            onChange={(e) => updateRow(item.id, "category", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                          >
                            {EXPENSE_CATEGORIES.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 min-w-40">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => updateRow(item.id, "date", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </td>
                        <td className="px-3 py-3 min-w-28">
                          <input
                            type="time"
                            value={item.time}
                            onChange={(e) => updateRow(item.id, "time", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(item.id)}
                            className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 mt-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Monthly transaction ledger</h2>
            {ledger.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No imported transactions for this month.</div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {["Type", "Title", "Amount", "Category", "Date", "Time"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                            item.type === "credit" ? "bg-primary-100 text-primary-700" : "bg-red-100 text-red-600"
                          }`}>
                            {item.type === "credit" ? "Credit" : "Debit"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">{item.title}</td>
                        <td className={`px-3 py-2.5 font-semibold ${item.type === "credit" ? "text-primary-600" : "text-red-500"}`}>
                          {item.type === "credit" ? "+" : "-"}{formatCurrency(item.amount)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{item.category}</td>
                        <td className="px-3 py-2.5 text-slate-600">{item.date}</td>
                        <td className="px-3 py-2.5 text-slate-500">{item.time || "—"}</td>
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
