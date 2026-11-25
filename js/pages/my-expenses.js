// my-expenses.js

const user = requireRole("employee");
let currentStatus = "All";

if (user) {
  renderNavbar("expenses");
  document.getElementById("expenseList").innerHTML = loadingState();

  setupFilterButtons("statusFilter", [
    { value: "All", label: "All" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" }
  ], currentStatus, function (value) {
    currentStatus = value;
    showExpenses();
  });

  setTimeout(showExpenses, 300);
}

function getMyExpenses() {
  return getData(KEYS.expenses)
    .filter(function (expense) {
      return expense.employeeId === user.id;
    })
    .sort(function (a, b) {
      return b.submittedAt.localeCompare(a.submittedAt);
    });
}

function showExpenses() {
  const myExpenses = getMyExpenses();
  const status = currentStatus;

  // Summary cards
  function totalFor(statusName) {
    return myExpenses
      .filter(function (expense) {
        return expense.status === statusName;
      })
      .reduce(function (total, expense) {
        return total + expense.amount;
      }, 0);
  }
  const rejectedCount = myExpenses.filter(function (expense) {
    return expense.status === "Rejected";
  }).length;

  document.getElementById("summaryCards").innerHTML = `
    <div class="col-sm-6 col-lg-4">${dashboardCard("Approved", formatRupees(totalFor("Approved")), "All approved expenses", "bi-check-circle")}</div>
    <div class="col-sm-6 col-lg-4">${dashboardCard("Pending", formatRupees(totalFor("Pending")), "Waiting for HR review", "bi-hourglass-split")}</div>
    <div class="col-sm-12 col-lg-4">${dashboardCard("Needs attention", rejectedCount, rejectedCount === 1 ? "expense was rejected. Check the review note." : "expenses were rejected", "bi-exclamation-circle")}</div>`;

  // Filtered list
  const filtered = myExpenses.filter(function (expense) {
    return status === "All" || expense.status === status;
  });

  const list = document.getElementById("expenseList");
  if (myExpenses.length === 0) {
    list.innerHTML = emptyState("bi-receipt", "No expenses yet. Submit your first meal expense.",
      '<a class="btn btn-primary" href="submit-expense.html">Submit meal expense</a>');
  } else if (filtered.length === 0) {
    list.innerHTML = emptyState("bi-funnel", "No " + status.toLowerCase() + " expenses.");
  } else {
    list.innerHTML = expenseTable(filtered);
  }
}
