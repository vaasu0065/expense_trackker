// Parses Indian bank / UPI SMS text into transactions. Used by the paste
// importer (/expenses/parse) and the iPhone auto-import endpoint, so both read
// messages the same way.

const MONTHS = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};
const MONTH_RE = "(?:jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*";

// Amounts preceded by these words are balances or limits, not the transaction
const NOT_TXN_AMOUNT = /(?:bal(?:ance)?|avl|available|limit|o\/s|outstanding)[\s.:a-z]{0,12}$/i;
const CURRENCY_AMOUNT = /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/gi;

const DEBIT_WORDS = /\b(debited|debit|spent|sent|paid|withdrawn|purchase|payment of|dr)\b/i;
const CREDIT_WORDS = /\b(credited|credit|received|deposited|refund(?:ed)?|cashback|salary|cr)\b/i;

function pad(n) {
  return String(n).padStart(2, "0");
}

// Bank messages are Indian, so "today" is the date in India, not UTC
function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function buildDate(day, month, year) {
  const y = String(year).length === 2 ? `20${year}` : String(year);
  const d = Number(day);
  const m = Number(month);
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

function extractDate(text) {
  let m = text.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (m) return buildDate(m[3], m[2], m[1]) || today();

  m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (m) {
    const date = buildDate(m[1], m[2], m[3]);
    if (date) return date;
  }

  // 17-May-26, 18 May 2026, 16May26, 01-Nov-2026
  m = text.match(new RegExp(`\\b(\\d{1,2})[-\\s]?(${MONTH_RE})[-\\s,]?(\\d{2,4})\\b`, "i"));
  if (m) return buildDate(m[1], MONTHS[m[2].slice(0, 3).toLowerCase()], m[3]) || today();

  return today();
}

function extractTime(text) {
  const match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\b/);
  return match ? `${pad(match[1])}:${match[2]}` : "";
}

function extractAmount(text) {
  for (const match of text.matchAll(CURRENCY_AMOUNT)) {
    if (!NOT_TXN_AMOUNT.test(text.slice(Math.max(0, match.index - 20), match.index))) {
      return parseFloat(match[1].replace(/,/g, ""));
    }
  }

  // "debited by 80.0", "credited by Rs500"
  const near = text.match(/\b(?:debited|credited|spent|sent|paid|withdrawn|received|deposited)\b(?:\s+(?:by|with|for|of))?\s+([0-9][0-9,]*(?:\.\d{1,2})?)\b/i);
  if (near) return parseFloat(near[1].replace(/,/g, ""));

  const trailing = text.match(/([0-9][0-9,]*(?:\.\d{1,2})?)\s*(?:rs\.?|inr)\b/i);
  return trailing ? parseFloat(trailing[1].replace(/,/g, "")) : 0;
}

// Whichever of debit/credit is mentioned first decides, so "debited ...;
// AMAZON credited" is a debit. "Credit card" / "debit card" name a card, not a direction.
function guessType(text) {
  const clean = text.replace(/\b(credit|debit)\s+card\b/gi, "card");
  const debit = clean.search(DEBIT_WORDS);
  const credit = clean.search(CREDIT_WORDS);
  if (credit !== -1 && (debit === -1 || credit < debit)) return "credit";
  return "debit";
}

function guessCategory(text, type) {
  const lower = text.toLowerCase();
  if (type === "credit") {
    if (lower.includes("refund") || lower.includes("cashback")) return "Refund";
    return "Income";
  }

  const rules = [
    ["Food", ["swiggy", "zomato", "restaurant", "cafe", "food", "pizza", "burger", "blinkit", "zepto", "instamart"]],
    ["Travel", ["uber", "ola", "metro", "rail", "irctc", "fuel", "petrol", "diesel", "rapido", "fastag"]],
    ["Shopping", ["amazon", "flipkart", "myntra", "ajio", "shopping", "store", "mart"]],
    ["Bills", ["electricity", "bill", "recharge", "broadband", "airtel", "jio", "vi ", "gas"]],
    ["Health", ["pharmacy", "medical", "hospital", "doctor", "clinic", "apollo"]],
    ["Entertainment", ["netflix", "prime", "hotstar", "movie", "bookmyshow", "spotify"]],
    ["Education", ["course", "school", "college", "tuition", "exam"]],
  ];

  const match = rules.find(([, words]) => words.some((word) => lower.includes(word)));
  return match?.[0] || "Other";
}

// A payee name runs until one of these words or punctuation
const NAME = "([A-Za-z0-9@][A-Za-z0-9@ .&_'-]*?)";
const NAME_END = "(?=\\s+(?:thru|through|via|on|ref|refno|upi|for|at|avl|bal|by|is|has|dt|date)\\b|\\s*[;,(\\n]|\\.(?:\\s|$|[A-Z])|\\s*$)";

const DEBIT_PAYEE = [
  /UPI\/[A-Z0-9]+\/\d+\/([A-Za-z0-9@ .&_-]+)/i,
  new RegExp(`\\b(?:trf to|transferred to|payment to|paid to|sent to)\\s+(?:vpa\\s+)?${NAME}${NAME_END}`, "i"),
  new RegExp(`;\\s*${NAME}\\s+credited\\b`, "i"),
  new RegExp(`(?:^|\\s)to\\s+(?:vpa\\s+)?${NAME}${NAME_END}`, "im"),
  new RegExp(`\\b(?:at|towards)\\s+${NAME}${NAME_END}`, "i"),
  new RegExp(`\\b(?:merchant|payee)\\s*[:-]\\s*${NAME}${NAME_END}`, "i"),
];

const CREDIT_PAYER = [
  new RegExp(`\\b(?:received from|credited from|from)\\s+(?:vpa\\s+)?${NAME}${NAME_END}`, "i"),
  new RegExp(`\\bby\\s+(?:vpa\\s+)?${NAME}${NAME_END}`, "i"),
];

// Bank/account references and phone numbers are never the payee
function looksLikeName(value) {
  if (!value || value.length < 2) return false;
  if (/^[x*\d\s-]+$/i.test(value)) return false;
  if (/\b(a\/?c|acct|account|bank|card|your|ur|you|rs|inr|upi|block|dispute)\b/i.test(value)) return false;
  return /[a-z]/i.test(value);
}

function extractTitle(text, type) {
  if (type === "credit" && /salary/i.test(text)) return "Salary";

  for (const pattern of type === "credit" ? CREDIT_PAYER : DEBIT_PAYEE) {
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    for (const match of text.matchAll(re)) {
      const name = match[1].replace(/\s+/g, " ").trim();
      if (looksLikeName(name)) return name.slice(0, 60);
    }
  }

  return type === "credit" ? "Money received" : "Imported transaction";
}

function parseTransactionMessage(message) {
  const source = String(message || "").trim();
  const type = guessType(source);

  return {
    type,
    title: extractTitle(source, type),
    amount: extractAmount(source),
    category: guessCategory(source, type),
    date: extractDate(source),
    time: extractTime(source),
    source,
  };
}

function hasTxnAmount(line) {
  return extractAmount(line) > 0;
}

// Splits pasted text into individual messages. Blank lines always separate
// messages; otherwise a line with a new amount starts a new message, so
// multi-line SMS (HDFC, Axis) stay together while one-per-line pastes split.
function splitMessages(text) {
  const messages = [];
  for (const block of String(text || "").split(/\n\s*\n/)) {
    let current = [];
    let currentHasAmount = false;
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const lineHasAmount = hasTxnAmount(line);
      if (lineHasAmount && currentHasAmount) {
        messages.push(current.join("\n"));
        current = [];
        currentHasAmount = false;
      }
      current.push(line);
      currentHasAmount = currentHasAmount || lineHasAmount;
    }
    if (current.length) messages.push(current.join("\n"));
  }
  return messages;
}

module.exports = { parseTransactionMessage, splitMessages };
