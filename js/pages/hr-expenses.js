// hr-expenses.js

const user = requireRole("hr");
const searchInput = document.getElementById("searchInput");
let currentStatus = "All";
let panel = null;

if (user) {
  renderNavbar("expenses");
  panel = new bootstrap.Offcanvas(document.getElementById("expensePanel"));

  // Open with a status filter from the URL, for example ?status=Pending
  const statusFromUrl = getUrlParam("status");
  if (["Pending", "Approved", "Rejected"].includes(statusFromUrl)) {
    currentStatus = statusFromUrl;
  }

  setupFilterButtons("statusFilter", [
    { value: "All", label: "All" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" }
  ], currentStatus, function (value) {
    currentStatus = value;
    showExpenses();
  });

  searchInput.addEventListener("input", showExpenses);
  document.getElementById("exportBtn").addEventListener("click", exportExpenses);

  // One click listener for all "Review" buttons in the list
  document.getElementById("expenseList").addEventListener("click", function (e) {
    const button = e.target.closest(".view-expense-btn");
    if (button) {
      openExpense(button.dataset.id);
    }
  });

  document.getElementById("expenseList").innerHTML = loadingState();
  setTimeout(showExpenses, 300);
}

function sumAmounts(list) {
  return list.reduce(function (total, expense) {
    return total + expense.amount;
  }, 0);
}

// Returns expenses that match the search box and the status filter
function getFilteredExpenses() {
  const searchText = searchInput.value.trim().toLowerCase();
  const status = currentStatus;

  return getData(KEYS.expenses)
    .filter(function (expense) {
      const employee = findEmployee(expense.employeeId);
      const name = employee ? employee.name.toLowerCase() : "";
      const matchesName = name.includes(searchText);
      const matchesStatus = status === "All" || expense.status === status;
      return matchesName && matchesStatus;
    })
    .sort(function (a, b) {
      return b.submittedAt.localeCompare(a.submittedAt);
    });
}

function showTotals() {
  const expenses = getData(KEYS.expenses);
  const pending = expenses.filter(function (expense) { return expense.status === "Pending"; });
  const approved = expenses.filter(function (expense) { return expense.status === "Approved"; });
  const rejected = expenses.filter(function (expense) { return expense.status === "Rejected"; });

  document.getElementById("totals").innerHTML = `<div class="col-12">${ledgerStrip([
    { label: "Total submitted", value: formatRupees(sumAmounts(expenses)), note: expenses.length + " expenses" },
    { label: "Total approved", value: formatRupees(sumAmounts(approved)), note: approved.length + " approved" },
    { label: "Pending", value: pending.length, note: formatRupees(sumAmounts(pending)) + " to review" },
    { label: "Rejected", value: rejected.length, note: formatRupees(sumAmounts(rejected)) + " rejected" }
  ])}</div>`;
}

function showExpenses() {
  showTotals();
  const filtered = getFilteredExpenses();
  const list = document.getElementById("expenseList");

  document.getElementById("resultCount").textContent = "Showing " + filtered.length + (filtered.length === 1 ? " expense" : " expenses");

  if (filtered.length > 0) {
    list.innerHTML = expenseTable(filtered, { showEmployee: true, showActions: true });
  } else if (currentStatus === "Pending" && searchInput.value.trim() === "") {
    list.innerHTML = emptyState("bi-inbox", "No expense requests are pending. You are all caught up.");
  } else {
    list.innerHTML = emptyState("bi-search", "No expenses match your search.");
  }
}

// Shows one expense in the side panel with approve / reject buttons
function openExpense(expenseId) {
  const expense = findExpense(expenseId);
  if (!expense) return;
  const employee = findEmployee(expense.employeeId);
  const summary = getSubsidySummary(expense.employeeId);
  const isThisMonth = expense.expenseDate.startsWith(getCurrentMonth());

  let warning = "";
  if (expense.status === "Pending" && isThisMonth && expense.amount > summary.remaining) {
    warning = `<div class="alert alert-warning small d-flex gap-2"><i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
      <span>This expense is more than the employee's remaining allowance (${formatRupees(summary.remaining)}).</span></div>`;
  }

  let actions = "";
  if (expense.status === "Pending") {
    actions = `
      <div class="d-grid gap-2 mt-4">
        <button class="btn btn-primary" id="approveBtn" type="button"><i class="bi bi-check-lg" aria-hidden="true"></i> Approve expense</button>
        <button class="btn btn-outline-danger" id="rejectBtn" type="button"><i class="bi bi-x-lg" aria-hidden="true"></i> Reject expense</button>
      </div>`;
  } else if (expense.status === "Rejected") {
    actions = `<div class="alert alert-danger small mt-3 mb-0"><strong>Rejection reason:</strong> ${escapeHtml(expense.rejectionReason)}</div>`;
  }

  document.getElementById("expensePanelBody").innerHTML = `
    <div class="review-head mb-3">
      <div class="d-flex align-items-center gap-2 mb-3">
        ${avatar(employee.name)}
        <div class="lh-sm"><div class="fw-semibold">${escapeHtml(employee.name)}</div><div class="small text-body-secondary">${employee.department}</div></div>
      </div>
      <div class="d-flex justify-content-between align-items-end">
        <div>
          <div class="small text-body-secondary">${expense.category} · ${expense.expenseId}</div>
          <div class="review-amount">${formatRupees(expense.amount)}</div>
        </div>
        ${statusBadge(expense.status)}
      </div>
    </div>
    ${warning}
    ${statusTimeline(expense)}
    <dl class="row small mb-0">
      <dt class="col-5 fw-normal text-body-secondary">Employee ID</dt>
      <dd class="col-7">${employee.employeeId}</dd>
      <dt class="col-5 fw-normal text-body-secondary">Expense date</dt>
      <dd class="col-7">${formatDate(expense.expenseDate)}</dd>
      <dt class="col-5 fw-normal text-body-secondary">Description</dt>
      <dd class="col-7">${escapeHtml(expense.description)}</dd>
      <dt class="col-5 fw-normal text-body-secondary">Receipt reference</dt>
      <dd class="col-7">${expense.receiptReference ? escapeHtml(expense.receiptReference) : '<span class="text-danger">Not provided</span>'}</dd>
    </dl>
    <hr>
    <h3 class="h6">Allowance this month</h3>
    ${subsidyProgress(summary, true)}
    ${actions}`;

  panel.show();

  if (expense.status === "Pending") {
    document.getElementById("approveBtn").addEventListener("click", function () {
      panel.hide();
      showConfirm(
        {
          title: "Approve this expense?",
          message: "Approve " + formatRupees(expense.amount) + " for " + employee.name + ". It will count towards their monthly allowance.",
          confirmText: "Approve",
          confirmClass: "btn-primary"
        },
        function () {
          const result = approveExpense(expense.expenseId);
          showToast(result.message, result.success ? "success" : "error");
          showExpenses();
        }
      );
    });

    document.getElementById("rejectBtn").addEventListener("click", function () {
      panel.hide();
      showConfirm(
        {
          title: "Reject this expense?",
          message: "Reject " + formatRupees(expense.amount) + " for " + employee.name + ". Please tell the employee why.",
          confirmText: "Reject",
          confirmClass: "btn-danger",
          askReason: true
        },
        function (reason) {
          const result = rejectExpense(expense.expenseId, reason);
          showToast(result.message, result.success ? "success" : "error");
          showExpenses();
        }
      );
    });
  }
}

function exportExpenses() {
  if (!canDo("exportExpenseReport")) {
    showToast("Only HR managers can export expense records.", "error");
    return;
  }
  const rows = [["Expense ID", "Employee ID", "Employee Name", "Department", "Expense Date", "Amount (INR)", "Category", "Description", "Receipt Reference", "Status", "Rejection Reason", "Submitted At"]];
  getFilteredExpenses().forEach(function (expense) {
    const employee = findEmployee(expense.employeeId);
    rows.push([
      expense.expenseId, expense.employeeId, employee ? employee.name : "", employee ? employee.department : "",
      expense.expenseDate, expense.amount, expense.category, expense.description,
      expense.receiptReference, expense.status, expense.rejectionReason, expense.submittedAt
    ]);
  });
  downloadCSV("meal-expenses-" + getToday() + ".csv", rows);
  showToast("Expense report downloaded.");
}
