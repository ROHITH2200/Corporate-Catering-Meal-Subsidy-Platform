// hr-dashboard.js

const user = requireRole("hr");

if (user) {
  renderNavbar("dashboard");
  document.getElementById("monthText").textContent = "Hello " + user.name.split(" ")[0] + ". Here is the overview for " + getCurrentMonthName() + ".";
  document.getElementById("dashboardContent").innerHTML = loadingState();
  setTimeout(showDashboard, 300);
}

function sumAmounts(list) {
  return list.reduce(function (total, expense) {
    return total + expense.amount;
  }, 0);
}

// The review queue: pending expenses shown as small receipt chits, oldest first
function reviewQueueHtml(pending) {
  if (pending.length === 0) {
    return `
      <div class="review-queue">
        <div class="queue-count">0</div>
        <h2 class="h4 fw-bold mb-1">No expense requests are pending.</h2>
        <p class="queue-text mb-0">You are all caught up. New expenses will appear here.</p>
      </div>`;
  }

  const oldestFirst = pending.slice().sort(function (a, b) {
    return a.submittedAt.localeCompare(b.submittedAt);
  });

  const chits = oldestFirst.slice(0, 4).map(function (expense) {
    const employee = findEmployee(expense.employeeId);
    return `
      <a class="chit" href="expenses.html?status=Pending">
        <div class="d-flex align-items-center gap-2 mb-2">
          ${avatar(employee.name)}
          <div class="lh-sm text-truncate"><div class="fw-semibold small text-truncate">${escapeHtml(employee.name)}</div><div class="chit-meta">${expense.category}</div></div>
        </div>
        <div class="chit-amount">${formatRupees(expense.amount)}</div>
        <div class="chit-meta">${getWaitingText(expense.submittedAt)}</div>
      </a>`;
  }).join("");

  return `
    <div class="review-queue">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <div class="queue-label">Review queue</div>
          <div class="d-flex align-items-baseline gap-2">
            <span class="queue-count">${pending.length}</span>
            <span class="queue-text">${pending.length === 1 ? "expense waiting" : "expenses waiting"} · ${formatRupees(sumAmounts(pending))}</span>
          </div>
        </div>
        <a class="btn btn-accent" href="expenses.html?status=Pending">Review pending</a>
      </div>
      <div class="chit-row">${chits}</div>
    </div>`;
}

// The kitchen order ticket of the nearest upcoming event
function nextOrderHtml(upcomingEvents) {
  if (upcomingEvents.length === 0) {
    return emptyState("bi-calendar-x", "There are no upcoming catering events.", '<a class="btn btn-primary" href="create-event.html">Create event</a>');
  }
  const event = upcomingEvents[0];
  return `
    <h2 class="section-title d-flex justify-content-between align-items-center">Next catering order ${eventStatusBadge(event.status)}</h2>
    ${orderTicket(event)}
    <a class="btn btn-outline-primary w-100 mt-2" href="summary.html?id=${event.eventId}">Open order summary</a>`;
}

function showDashboard() {
  const expenses = getData(KEYS.expenses);
  const pending = expenses.filter(function (expense) {
    return expense.status === "Pending";
  });
  const approved = expenses.filter(function (expense) {
    return expense.status === "Approved";
  });
  const upcomingEvents = getUpcomingEvents();

  // Upcoming events with registration count
  const eventsHtml = upcomingEvents.length
    ? '<div class="row g-3">' + upcomingEvents.slice(0, 2).map(function (event) {
        const registered = getPreferencesForEvent(event.eventId).length;
        const action = `
          <p class="small mb-2"><i class="bi bi-people" aria-hidden="true"></i> <strong>${registered}</strong> ${registered === 1 ? "employee" : "employees"} registered</p>
          <a class="btn btn-sm btn-outline-primary" href="summary.html?id=${event.eventId}">Order summary</a>`;
        return '<div class="col-md-6">' + cateringEventCard(event, action) + "</div>";
      }).join("") + "</div>"
    : emptyState("bi-calendar-x", "There are no upcoming catering events.", '<a class="btn btn-primary" href="create-event.html">Create event</a>');

  // Allowance board: subsidy usage for every employee
  const usageRows = getData(KEYS.employees).map(function (employee) {
    const summary = getSubsidySummary(employee.employeeId);
    let barClass = "bg-forest";
    let flag = "";
    if (summary.level === "near") {
      barClass = "bg-saffron";
      flag = '<span class="status-badge status-pending ms-1"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> Near limit</span>';
    }
    if (summary.level === "reached") {
      barClass = "bg-danger";
      flag = '<span class="status-badge status-rejected ms-1"><i class="bi bi-exclamation-octagon" aria-hidden="true"></i> Limit reached</span>';
    }
    return `
      <tr>
        <td><div class="d-flex align-items-center gap-2">${avatar(employee.name)}<div>${escapeHtml(employee.name)}<div class="small text-body-secondary">${employee.department}</div></div></div></td>
        <td class="text-end amount">${formatRupees(summary.limit)}</td>
        <td class="text-end amount">${formatRupees(summary.used)}</td>
        <td class="text-end amount">${formatRupees(summary.remaining)}</td>
        <td style="min-width: 180px">
          <div class="progress subsidy-bar" role="progressbar" aria-label="${escapeHtml(employee.name)} subsidy used" aria-valuenow="${summary.percent}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar ${barClass}" style="width: ${summary.percent}%"></div>
          </div>
          <div class="small text-body-secondary mt-1">${summary.percent}% used ${flag}</div>
        </td>
      </tr>`;
  }).join("");

  document.getElementById("dashboardContent").innerHTML = `
    <div class="row g-4 mb-4">
      <div class="col-lg-7">
        ${reviewQueueHtml(pending)}
        <div class="mt-4">
          ${ledgerStrip([
            { label: "Total submitted", value: formatRupees(sumAmounts(expenses)), note: expenses.length + " expenses in total" },
            { label: "Approved amount", value: formatRupees(sumAmounts(approved)), note: approved.length + " expenses approved" },
            { label: "Upcoming events", value: upcomingEvents.length, note: upcomingEvents.filter(isRegistrationOpen).length + " open for registration" }
          ])}
        </div>
        <div class="d-flex justify-content-between align-items-center mt-4 mb-3">
          <h2 class="section-title mb-0">Upcoming catering events</h2>
          <a href="catering.html" class="small fw-semibold">All events</a>
        </div>
        ${eventsHtml}
      </div>
      <div class="col-lg-5">${nextOrderHtml(upcomingEvents)}</div>
    </div>

    <div class="card section-card">
      <div class="card-body">
        <h2 class="section-title">Allowance board for ${getCurrentMonthName()}</h2>
        <div class="table-responsive">
          <table class="table align-middle app-table mb-0">
            <thead>
              <tr>
                <th scope="col">Employee</th>
                <th scope="col" class="text-end">Limit</th>
                <th scope="col" class="text-end">Used</th>
                <th scope="col" class="text-end">Remaining</th>
                <th scope="col">Usage</th>
              </tr>
            </thead>
            <tbody>${usageRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}
