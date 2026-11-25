// helpers.js
// Small reusable functions for formatting and dates.

// 1250 -> "₹1,250"
function formatRupees(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

// "2026-11-06" -> "6 Nov 2026"
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString.length === 10 ? dateString + "T00:00" : dateString);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// "2026-11-05T18:00" -> "5 Nov 2026, 6:00 pm"
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "-";
  const date = new Date(dateTimeString);
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// "13:00" -> "1:00 pm"
function formatTime(timeString) {
  if (!timeString) return "-";
  const date = new Date("2000-01-01T" + timeString);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

// Today as "YYYY-MM-DD"
function getToday() {
  return dateFromToday(0);
}

// This month as "YYYY-MM"
function getCurrentMonth() {
  return getToday().slice(0, 7);
}

// Name of this month, for example "November 2026"
function getCurrentMonthName() {
  return new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// Returns text like "2 days left" or "5 hours left"
function getTimeLeftText(deadline) {
  const difference = new Date(deadline) - new Date();
  if (difference <= 0) {
    return "Closed";
  }
  const hours = Math.floor(difference / (1000 * 60 * 60));
  if (hours < 1) {
    return "Less than an hour left";
  }
  if (hours < 24) {
    return hours + (hours === 1 ? " hour left" : " hours left");
  }
  const days = Math.floor(hours / 24);
  return days + (days === 1 ? " day left" : " days left");
}

// Stops user text from being read as HTML when we use innerHTML
function escapeHtml(text) {
  return String(text === undefined || text === null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Reads a value from the page URL, for example ?id=EVT001
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Builds a CSV file from a list of rows and downloads it
function downloadCSV(fileName, rows) {
  const csvText = rows
    .map(function (row) {
      return row
        .map(function (cell) {
          const value = String(cell === undefined || cell === null ? "" : cell).replace(/"/g, '""');
          return '"' + value + '"';
        })
        .join(",");
    })
    .join("\n");

  const file = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Smooth fade between pages (Chrome and Edge). Browsers only allow it when the app is served
// over http or https, not when index.html is opened as a file, so we switch it on only then.
// It is also skipped for people who turned on "reduce motion" in their system settings.
if (location.protocol.startsWith("http") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const pageFade = document.createElement("style");
  pageFade.textContent = "@view-transition { navigation: auto; }";
  document.head.appendChild(pageFade);
}
