const pad = (n) => String(n).padStart(2, "0");

// Today's date as YYYY-MM-DD in the user's timezone.
// (toISOString() gives the UTC date, which is "yesterday" before 5:30 AM in India.)
export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Parse a date from the API. Plain YYYY-MM-DD strings are read as local dates,
// because new Date("YYYY-MM-DD") treats them as UTC and can shift the day.
export function parseDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}
