function pad(n) {
  return String(n).padStart(2, "0");
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function normalizeDate(value) {
  if (!value) return today();

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

  return today();
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

function guessCategory(text, type) {
  const lower = text.toLowerCase();
  if (type === "credit") {
    if (lower.includes("salary")) return "Income";
    if (lower.includes("refund") || lower.includes("cashback")) return "Refund";
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

  return today();
}

function extractTime(text) {
  const match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  return match ? `${pad(match[1])}:${match[2]}` : "";
}

function extractTitle(text) {
  if (/salary/i.test(text)) return "Salary";

  const patterns = [
    /(?:upi payment to|paid to|payment to|transferred to)\s+([A-Za-z0-9 .&_-]+)/i,
    /(?:received from|credited from|from)\s+([A-Za-z0-9 .&_-]+?)(?:\s+by|\s+via|\s+on|\.|$)/i,
    /(?:at|towards)\s+([A-Za-z0-9 .&_-]+?)(?:\s+on|\s+dt|\s+for|\.|$)/i,
    /(?:merchant|payee)\s*[:-]\s*([A-Za-z0-9 .&_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/\b(on|at|ref|txn|upi|debited|credited)\b.*$/i, "")
        .trim()
        .slice(0, 60);
    }
  }

  return "Imported transaction";
}

function parseTransactionMessage(message) {
  const source = String(message || "").trim();
  const amount = extractAmount(source);
  const type = guessType(source);

  return {
    type,
    title: extractTitle(source),
    amount,
    category: guessCategory(source, type),
    date: extractDate(source),
    time: extractTime(source),
    source,
  };
}

module.exports = { parseTransactionMessage };
