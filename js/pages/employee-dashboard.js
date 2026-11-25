// employee-dashboard.js

const user = requireRole("employee");

if (user) {
  renderNavbar("dashboard");

  const employee = findEmployee(user.id);
  document.getElementById("greeting").textContent = "Hello, " + employee.name.split(" ")[0];
  document.getElementById("monthText").textContent = "Your meal benefits for " + getCurrentMonthName();

  // Loading state while we read saved data
  document.getElementById("dashboardContent").innerHTML = loadingState();
  setTimeout(showDashboard, 300);
}

// Splits the time left until a deadline into days and hours
function getCountdown(deadline) {
  const difference = Math.max(0, new Date(deadline) - new Date());
  const totalHours = Math.floor(difference / (1000 * 60 * 60));
  return { days: Math.floor(totalHours / 24), hours: totalHours % 24 };
}

// The nearest event the employee can still register for (or change)
function nextMealHtml() {
  const openEvents = getUpcomingEvents().filter(isRegistrationOpen);
  if (openEvents.length === 0) {
    return `
      <div class="next-meal">
        <div class="next-meal-label">Next team meal</div>
        <h3>Nothing open right now</h3>
        <p class="small mb-0 text-body-secondary">There are no upcoming catering events. We will show the next one here.</p>
      </div>`;
  }

  const event = openEvents[0];
  const countdown = getCountdown(event.registrationDeadline);
  const myPreference = getMyPreference(event.eventId);
  const button = myPreference
    ? `<a class="btn btn-outline-primary btn-sm" href="preference.html?event=${event.eventId}">Change my meal (${myPreference.mealCategory})</a>`
    : `<a class="btn btn-primary btn-sm" href="preference.html?event=${event.eventId}">Choose my meal</a>`;

  return `
    <div class="next-meal">
      <div class="next-meal-label"><i class="bi bi-megaphone" aria-hidden="true"></i> A new team meal is open for registration.</div>
      <h3>${escapeHtml(event.eventName)}</h3>
      <p class="small mb-0">${formatDate(event.eventDate)}, ${formatTime(event.eventTime)} at ${escapeHtml(event.location)}</p>
      <div class="countdown" aria-label="Registration closes in ${countdown.days} days and ${countdown.hours} hours">
        <div><strong>${countdown.days}</strong><span>${countdown.days === 1 ? "day" : "days"}</span></div>
        <div><strong>${countdown.hours}</strong><span>${countdown.hours === 1 ? "hour" : "hours"}</span></div>
        <div class="d-flex align-items-center small text-start bg-transparent px-1">left to register</div>
      </div>
      ${button}
    </div>`;
}

function showDashboard() {
  const employee = findEmployee(user.id);
  const summary = getSubsidySummary(user.id);
  const currentMonth = getCurrentMonth();

  const myExpenses = getData(KEYS.expenses)
    .filter(function (expense) {
      return expense.employeeId === user.id;
    })
    .sort(function (a, b) {
      return b.submittedAt.localeCompare(a.submittedAt);
    });

  const pendingCount = myExpenses.filter(function (expense) {
    return expense.status === "Pending";
  }).length;

  const approvedThisMonth = myExpenses.filter(function (expense) {
    return expense.status === "Approved" && expense.expenseDate.startsWith(currentMonth);
  }).length;

  const recentExpenses = myExpenses.slice(0, 5);
  const upcomingEvents = getUpcomingEvents().slice(0, 3);

  // Warning under the card when the allowance is nearly or fully used
  let warning = "";
  if (summary.level === "near") {
    warning = `<div class="alert alert-warning d-flex gap-2 mt-3 mb-0" role="alert"><i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i><span>You're close to reaching your monthly meal allowance.</span></div>`;
  } else if (summary.level === "reached") {
    warning = `<div class="alert alert-danger d-flex gap-2 mt-3 mb-0" role="alert"><i class="bi bi-exclamation-octagon-fill" aria-hidden="true"></i><span>You have reached your monthly meal allowance. New expenses may not be covered.</span></div>`;
  }

  // Recent expenses or empty message
  let expensesHtml = emptyState("bi-receipt", "No expenses yet. Submit your first meal expense.",
    '<a class="btn btn-primary" href="submit-expense.html">Submit meal expense</a>');
  if (recentExpenses.length > 0) {
    expensesHtml = expenseTable(recentExpenses);
  }

  // Upcoming events or empty message
  let eventsHtml = emptyState("bi-calendar-x", "There are no upcoming catering events.");
  if (upcomingEvents.length > 0) {
    eventsHtml = '<div class="row g-3">' + upcomingEvents.map(function (event) {
      const myPreference = getMyPreference(event.eventId);
      let button = '<a class="btn btn-sm btn-outline-primary" href="preference.html?event=' + event.eventId + '">View event</a>';
      if (isRegistrationOpen(event)) {
        button = myPreference
          ? '<a class="btn btn-sm btn-outline-primary" href="preference.html?event=' + event.eventId + '">Edit my meal (' + myPreference.mealCategory + ')</a>'
          : '<a class="btn btn-sm btn-accent" href="preference.html?event=' + event.eventId + '">Choose my meal</a>';
      }
      return '<div class="col-md-6 col-xl-4">' + cateringEventCard(event, button) + "</div>";
    }).join("") + "</div>";
  }

  document.getElementById("dashboardContent").innerHTML = `
    <div class="row g-4 mb-4">
      <div class="col-lg-5">
        ${mealCard(employee, summary)}
        ${warning}
        <p class="small text-body-secondary mt-3 mb-0"><i class="bi bi-info-circle" aria-hidden="true"></i> Only approved expenses reduce your allowance. Pending and rejected ones do not.</p>
      </div>

      <div class="col-lg-7">
        <div class="row g-3 h-100">
          <div class="col-12">${nextMealHtml()}</div>
          <div class="col-sm-6">${dashboardCard("Approved this month", approvedThisMonth, approvedThisMonth === 1 ? "expense approved" : "expenses approved", "bi-check-circle")}</div>
          <div class="col-sm-6">${dashboardCard("Waiting for review", pendingCount, pendingCount === 1 ? "expense is pending" : "expenses are pending", "bi-hourglass-split")}</div>
        </div>
      </div>
    </div>

    <div class="card section-card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h2 class="section-title mb-0">Recent expenses</h2>
          <a href="expenses.html" class="small fw-semibold">View all</a>
        </div>
        ${expensesHtml}
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="section-title mb-0">Upcoming catering events</h2>
      <a href="events.html" class="small fw-semibold">All events</a>
    </div>
    ${eventsHtml}`;
}
