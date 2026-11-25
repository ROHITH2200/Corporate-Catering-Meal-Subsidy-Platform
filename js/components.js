// components.js
// Reusable pieces of UI (PRD section 9, Component Breakdown).
// Each function returns HTML text or adds something to the page.

// ----- Navbar -----

const NAV_LINKS = {
  employee: [
    { page: "dashboard", label: "Dashboard", icon: "bi-grid", href: "dashboard.html" },
    { page: "submit-expense", label: "Submit Expense", icon: "bi-receipt", href: "submit-expense.html" },
    { page: "expenses", label: "My Expenses", icon: "bi-list-check", href: "expenses.html" },
    { page: "events", label: "Catering Events", icon: "bi-calendar-event", href: "events.html" }
  ],
  hr: [
    { page: "dashboard", label: "HR Dashboard", icon: "bi-grid", href: "dashboard.html" },
    { page: "expenses", label: "Expense Management", icon: "bi-clipboard-check", href: "expenses.html" },
    { page: "catering", label: "Catering Management", icon: "bi-calendar-event", href: "catering.html" }
  ],
  vendor: [
    { page: "dashboard", label: "Assigned Orders", icon: "bi-box-seam", href: "dashboard.html" }
  ]
};

const ROLE_NAMES = { employee: "Employee", hr: "HR Manager", vendor: "Vendor" };

function renderNavbar(activePage) {
  const user = getCurrentUser();
  const links = NAV_LINKS[user.role]
    .map(function (link) {
      const isActive = link.page === activePage;
      return `
        <li class="nav-item">
          <a class="nav-link ${isActive ? "active" : ""}" href="${link.href}" ${isActive ? 'aria-current="page"' : ""}>
            <i class="bi ${link.icon}" aria-hidden="true"></i> ${link.label}
          </a>
        </li>`;
    })
    .join("");

  document.getElementById("navbar").innerHTML = `
    <nav class="navbar navbar-expand-lg app-navbar" data-bs-theme="dark">
      <div class="container">
        <a class="navbar-brand brand" href="dashboard.html">
          <img class="brand-logo" src="../images/logo-mark.svg" width="34" height="34" alt=""> MealMate
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainMenu"
          aria-controls="mainMenu" aria-expanded="false" aria-label="Open menu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainMenu">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">${links}</ul>
          <div class="d-flex align-items-center gap-3 user-box">
            <div class="small lh-sm">
              <div class="fw-semibold">${escapeHtml(user.name)}</div>
              <div class="nav-role">${ROLE_NAMES[user.role]}</div>
            </div>
            <button class="btn btn-sm btn-outline-light" id="switchRoleBtn" type="button">
              <i class="bi bi-arrow-left-right" aria-hidden="true"></i> Switch role
            </button>
          </div>
        </div>
      </div>
    </nav>`;

  document.getElementById("switchRoleBtn").addEventListener("click", function () {
    logout();
    window.location.href = "../index.html";
  });
}

// ----- Dashboard card -----

function dashboardCard(title, value, description, icon, style) {
  return `
    <div class="card stat-card h-100 ${style || ""}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <p class="stat-title mb-1">${title}</p>
          <span class="stat-icon" aria-hidden="true"><i class="bi ${icon}"></i></span>
        </div>
        <p class="stat-value mb-1">${value}</p>
        <p class="stat-text mb-0">${description}</p>
      </div>
    </div>`;
}

// ----- Status badges (icon + text, so colour is not the only signal) -----

function statusBadge(status) {
  const icons = { Pending: "bi-hourglass-split", Approved: "bi-check-circle-fill", Rejected: "bi-x-circle-fill" };
  return `<span class="status-badge status-${status.toLowerCase()}"><i class="bi ${icons[status]}" aria-hidden="true"></i> ${status}</span>`;
}

function eventStatusBadge(status) {
  const icons = { Open: "bi-unlock-fill", Closed: "bi-lock-fill", Confirmed: "bi-patch-check-fill", Completed: "bi-flag-fill" };
  return `<span class="status-badge event-${status.toLowerCase()}"><i class="bi ${icons[status]}" aria-hidden="true"></i> ${status}</span>`;
}

// ----- Subsidy progress -----

// forHr = true shows the warning about "this employee" instead of "you"
function subsidyProgress(summary, forHr) {
  let barClass = "bg-forest";
  let message = "";
  if (summary.level === "near") {
    barClass = "bg-saffron";
    const text = forHr ? "This employee is close to their monthly meal allowance." : "You're close to reaching your monthly meal allowance.";
    message = `<div class="alert alert-warning d-flex gap-2 mt-3 mb-0" role="alert">
      <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
      <span>${text}</span></div>`;
  } else if (summary.level === "reached") {
    barClass = "bg-danger";
    const text = forHr ? "This employee has used their full monthly meal allowance." : "You have reached your monthly meal allowance. New expenses may not be covered.";
    message = `<div class="alert alert-danger d-flex gap-2 mt-3 mb-0" role="alert">
      <i class="bi bi-exclamation-octagon-fill" aria-hidden="true"></i>
      <span>${text}</span></div>`;
  }

  return `
    <div class="d-flex justify-content-between small mb-2">
      <span>${formatRupees(summary.used)} used</span>
      <span>${summary.percent}% of ${formatRupees(summary.limit)}</span>
    </div>
    <div class="progress subsidy-bar" role="progressbar" aria-label="Monthly subsidy used"
      aria-valuenow="${summary.percent}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-bar ${barClass}" style="width: ${summary.percent}%"></div>
    </div>
    ${message}`;
}

// ----- Avatar with initials, for example "Aarav Sharma" -> "AS" -----

const AVATAR_COLOURS = ["#1f4d3a", "#2f6f52", "#c98118", "#8f3b1b", "#3d5a6c"];

function avatar(name) {
  const parts = name.trim().split(" ");
  const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  // Pick the same colour every time for the same name
  let total = 0;
  for (let i = 0; i < name.length; i++) {
    total += name.charCodeAt(i);
  }
  const colour = AVATAR_COLOURS[total % AVATAR_COLOURS.length];
  return `<span class="avatar" style="background: ${colour}" aria-hidden="true">${initials}</span>`;
}

// ----- Ledger strip: several numbers in one card, split by lines -----
// items: [{ label, value, note }]

function ledgerStrip(items) {
  const columns = items
    .map(function (item) {
      return `
        <div class="ledger-item">
          <div class="stat-title mb-1">${item.label}</div>
          <div class="ledger-value">${item.value}</div>
          <div class="stat-text">${item.note}</div>
        </div>`;
    })
    .join("");
  return `<div class="ledger">${columns}</div>`;
}

// ----- How long an expense has been waiting for review -----

function getWaitingText(submittedAt) {
  const days = Math.floor((new Date() - new Date(submittedAt)) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Submitted today";
  if (days === 1) return "Waiting 1 day";
  return "Waiting " + days + " days";
}

// ----- Status timeline for one expense: Submitted -> Under review -> Approved / Rejected -----

function statusTimeline(expense) {
  const reviewed = expense.status !== "Pending";
  const lastLabel = expense.status === "Rejected" ? "Rejected" : "Approved";
  const lastIcon = expense.status === "Rejected" ? "bi-x-lg" : "bi-check-lg";

  return `
    <ol class="timeline">
      <li class="done"><span class="timeline-dot"><i class="bi bi-check-lg" aria-hidden="true"></i></span>
        <div><strong>Submitted</strong><div class="small text-body-secondary">${formatDateTime(expense.submittedAt)}</div></div></li>
      <li class="${reviewed ? "done" : "current"}"><span class="timeline-dot"><i class="bi ${reviewed ? "bi-check-lg" : "bi-hourglass-split"}" aria-hidden="true"></i></span>
        <div><strong>HR review</strong><div class="small text-body-secondary">${reviewed ? "Reviewed" : getWaitingText(expense.submittedAt)}</div></div></li>
      <li class="${reviewed ? "done " + expense.status.toLowerCase() : ""}"><span class="timeline-dot"><i class="bi ${reviewed ? lastIcon : "bi-dash"}" aria-hidden="true"></i></span>
        <div><strong>${reviewed ? lastLabel : "Decision"}</strong><div class="small text-body-secondary">${reviewed ? (expense.status === "Approved" ? "Counts towards the allowance" : "Not counted") : "Not decided yet"}</div></div></li>
    </ol>`;
}

// ----- Expense table (desktop) and expense cards (phone) -----

function expenseTable(expenses, options) {
  const showEmployee = options && options.showEmployee;
  const showActions = options && options.showActions;

  const rows = expenses
    .map(function (expense) {
      const employee = findEmployee(expense.employeeId);
      const isWaiting = showActions && expense.status === "Pending";
      return `
        <tr class="${isWaiting ? "pending-row" : ""}">
          <td class="fw-semibold">${expense.expenseId}</td>
          ${showEmployee ? `<td><div class="d-flex align-items-center gap-2">${avatar(employee ? employee.name : "?")}<div>${escapeHtml(employee ? employee.name : expense.employeeId)}<div class="small text-body-secondary">${employee ? employee.department : ""}</div></div></div></td>` : ""}
          <td>${formatDate(expense.expenseDate)}</td>
          <td>${expense.category}</td>
          <td class="text-truncate" style="max-width: 220px">${escapeHtml(expense.description)}
            ${expense.status === "Rejected" && !showActions ? `<div class="reject-note"><i class="bi bi-chat-left-text" aria-hidden="true"></i> ${escapeHtml(expense.rejectionReason)}</div>` : ""}
          </td>
          <td class="text-end amount">${formatRupees(expense.amount)}</td>
          <td>${statusBadge(expense.status)}${isWaiting ? `<div class="waiting-text">${getWaitingText(expense.submittedAt)}</div>` : ""}</td>
          ${showActions ? `<td class="text-end"><button class="btn btn-sm btn-outline-primary view-expense-btn" type="button" data-id="${expense.expenseId}">Review<span class="visually-hidden"> expense ${expense.expenseId}</span></button></td>` : ""}
        </tr>`;
    })
    .join("");

  return `
    <div class="table-responsive d-none d-md-block">
      <table class="table align-middle app-table mb-0">
        <thead>
          <tr>
            <th scope="col">ID</th>
            ${showEmployee ? '<th scope="col">Employee</th>' : ""}
            <th scope="col">Date</th>
            <th scope="col">Category</th>
            <th scope="col">Description</th>
            <th scope="col" class="text-end">Amount</th>
            <th scope="col">Status</th>
            ${showActions ? '<th scope="col" class="text-end">Action</th>' : ""}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="d-md-none">${expenses.map(function (expense) { return expenseCard(expense, options); }).join("")}</div>`;
}

function expenseCard(expense, options) {
  const showEmployee = options && options.showEmployee;
  const showActions = options && options.showActions;
  const employee = findEmployee(expense.employeeId);
  return `
    <div class="card expense-card mb-2 ${showActions && expense.status === "Pending" ? "pending-card" : ""}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="fw-semibold">${expense.category} <span class="text-body-secondary fw-normal small">${expense.expenseId}</span></div>
            ${showEmployee ? `<div class="small d-flex align-items-center gap-2 my-1">${avatar(employee ? employee.name : "?")} ${escapeHtml(employee ? employee.name : "")}</div>` : ""}
            ${showActions && expense.status === "Pending" ? `<div class="waiting-text">${getWaitingText(expense.submittedAt)}</div>` : ""}
            <div class="small text-body-secondary">${formatDate(expense.expenseDate)}</div>
          </div>
          <div class="text-end">
            <div class="amount fw-bold">${formatRupees(expense.amount)}</div>
            ${statusBadge(expense.status)}
          </div>
        </div>
        <p class="small mb-0 mt-2">${escapeHtml(expense.description)}</p>
        ${expense.status === "Rejected" ? `<div class="reject-note"><i class="bi bi-chat-left-text" aria-hidden="true"></i> ${escapeHtml(expense.rejectionReason)}</div>` : ""}
        ${showActions ? `<button class="btn btn-outline-primary w-100 mt-3 view-expense-btn" type="button" data-id="${expense.expenseId}">Review expense</button>` : ""}
      </div>
    </div>`;
}

// ----- Catering event card -----

function cateringEventCard(event, actionHtml) {
  const vendor = findVendor(event.vendorId);
  const open = isRegistrationOpen(event);
  const [year, month, day] = event.eventDate.split("-");
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short" });

  // Looks like an event ticket: date stub on the left, a dashed tear line, details on the right
  return `
    <div class="ticket h-100">
      <div class="ticket-stub" aria-hidden="true">
        <span class="date-month">${monthName}</span>
        <span class="date-day">${Number(day)}</span>
        <span class="ticket-time">${formatTime(event.eventTime)}</span>
      </div>
      <div class="ticket-body">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <h3 class="ticket-title mb-0">${escapeHtml(event.eventName)}</h3>
          ${eventStatusBadge(event.status)}
        </div>
        <ul class="list-unstyled small text-body-secondary mb-3 event-meta">
          <li><i class="bi bi-calendar3" aria-hidden="true"></i>${formatDate(event.eventDate)}, ${formatTime(event.eventTime)}</li>
          <li><i class="bi bi-geo-alt" aria-hidden="true"></i>${escapeHtml(event.location)}</li>
          <li><i class="bi bi-shop" aria-hidden="true"></i>${vendor ? escapeHtml(vendor.vendorName) : "No vendor"}</li>
        </ul>
        <p class="deadline-pill ${open ? "is-open" : ""}">
          <i class="bi ${open ? "bi-alarm" : "bi-lock"}" aria-hidden="true"></i>
          <span>${open ? "Register by " + formatDateTime(event.registrationDeadline) + " · <strong>" + getTimeLeftText(event.registrationDeadline) + "</strong>" : "Registration for this event has closed."}</span>
        </p>
        ${actionHtml || ""}
      </div>
    </div>`;
}

// ----- Meal card (the employee's monthly allowance, shown like a meal benefit card) -----

function mealCard(employee, summary) {
  let barColor = "var(--mm-saffron)";
  if (summary.level === "reached") barColor = "#ff8a80";

  return `
    <div class="meal-card" role="group" aria-label="Monthly meal allowance card">
      <div class="meal-card-top">
        <span class="meal-card-brand"><img class="brand-logo" src="../images/logo-mark.svg" width="28" height="28" alt=""> MealMate</span>
        <span class="meal-card-month">${getCurrentMonthName()}</span>
      </div>
      <div class="meal-card-label">Available this month</div>
      <div class="meal-card-balance">${formatRupees(summary.remaining)}</div>
      <div class="meal-card-bar" role="progressbar" aria-label="Allowance used" aria-valuenow="${summary.percent}" aria-valuemin="0" aria-valuemax="100">
        <span style="width: ${summary.percent}%; background: ${barColor}"></span>
      </div>
      <div class="meal-card-row">
        <span>${formatRupees(summary.used)} used</span>
        <span>Limit ${formatRupees(summary.limit)}</span>
      </div>
      <div class="meal-card-bottom">
        <span>${escapeHtml(employee.name)}</span>
        <span>${employee.employeeId}</span>
      </div>
    </div>`;
}

// ----- Kitchen order ticket (what the vendor receives) -----

function orderTicket(event) {
  const vendor = findVendor(event.vendorId);
  const counts = getMealCounts(event.eventId);
  const restrictions = getRestrictionCounts(event.eventId);
  const total = counts.vegetarian + counts.nonVegetarian + counts.vegan + counts.jain;

  const mealRows = MEAL_TYPES.map(function (type) {
    return `<li class="kot-row"><span class="d-inline-flex align-items-center gap-2">${foodMark(type.mark)} ${type.label}</span><span class="kot-dots"></span><strong>${counts[type.key]}</strong></li>`;
  }).join("");

  const restrictionRows = Object.keys(restrictions)
    .filter(function (name) {
      return restrictions[name] > 0;
    })
    .map(function (name) {
      return `<li class="kot-row"><span>${name}</span><span class="kot-dots"></span><strong>${restrictions[name]}</strong></li>`;
    })
    .join("");

  return `
    <div class="kot">
      <div class="kot-head">
        <span>Kitchen order</span>
        <span>#${event.eventId}</span>
      </div>
      <p class="kot-event">${escapeHtml(event.eventName)}</p>
      <p class="kot-meta">${formatDate(event.eventDate)} · ${formatTime(event.eventTime)}<br>${escapeHtml(event.location)}</p>
      <p class="kot-meta">For: ${vendor ? escapeHtml(vendor.vendorName) : "-"}</p>
      <hr class="kot-line">
      <ul class="list-unstyled mb-0">${mealRows}</ul>
      <hr class="kot-line">
      <div class="kot-total"><span>Total meals</span><strong>${total}</strong></div>
      <hr class="kot-line">
      <p class="kot-label">Special requests</p>
      <ul class="list-unstyled mb-0">${restrictionRows || '<li class="kot-meta">None</li>'}</ul>
    </div>`;
}

// ----- Meal count summary -----

const MEAL_TYPES = [
  { key: "vegetarian", label: "Vegetarian", mark: "veg" },
  { key: "nonVegetarian", label: "Non-vegetarian", mark: "nonveg" },
  { key: "vegan", label: "Vegan", mark: "vegan" },
  { key: "jain", label: "Jain", mark: "jain" }
];

function foodMark(type) {
  return `<span class="food-mark food-${type}" aria-hidden="true"><span></span></span>`;
}

function mealCountSummary(counts) {
  const total = counts.vegetarian + counts.nonVegetarian + counts.vegan + counts.jain;
  const boxes = MEAL_TYPES.map(function (type) {
    return `
      <div class="col-6 col-lg-3">
        <div class="meal-count meal-${type.mark} h-100">
          <div class="d-flex align-items-center gap-2 mb-2">${foodMark(type.mark)} <span class="small fw-semibold">${type.label}</span></div>
          <div class="meal-number">${counts[type.key]}</div>
          <div class="small text-body-secondary">${counts[type.key] === 1 ? "meal" : "meals"}</div>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="total-meals mb-3">
      <span class="total-number">${total}</span>
      <span>${total === 1 ? "employee registered" : "employees registered"}</span>
    </div>
    <div class="row g-3">${boxes}</div>`;
}

// ----- Dietary summary -----

function dietarySummary(eventId) {
  const counts = getRestrictionCounts(eventId);
  const notes = getPreferencesForEvent(eventId).filter(function (preference) {
    return preference.additionalNotes !== "";
  });

  const chips = Object.keys(counts)
    .map(function (name) {
      return `<li class="diet-chip ${counts[name] > 0 ? "has-count" : ""}"><span>${name}</span><strong>${counts[name]}</strong></li>`;
    })
    .join("");

  const noteItems = notes.length
    ? notes
        .map(function (preference) {
          const employee = findEmployee(preference.employeeId);
          return `<li class="note-item"><span class="fw-semibold">${escapeHtml(employee ? employee.name : preference.employeeId)}</span> (${preference.mealCategory}): ${escapeHtml(preference.additionalNotes)}</li>`;
        })
        .join("")
    : `<li class="text-body-secondary small">No additional notes.</li>`;

  return `
    <h3 class="h6">Dietary restrictions</h3>
    <ul class="list-unstyled diet-list mb-4">${chips}</ul>
    <h3 class="h6">Additional notes</h3>
    <ul class="list-unstyled mb-0">${noteItems}</ul>`;
}

// ----- Empty state and loading -----

function emptyState(icon, message, buttonHtml) {
  return `
    <div class="empty-state">
      <span class="empty-icon" aria-hidden="true"><i class="bi ${icon}"></i></span>
      <p class="mb-3">${message}</p>
      ${buttonHtml || ""}
    </div>`;
}

// Grey placeholder blocks shaped like the content, shown while data loads
function loadingState() {
  return `
    <div role="status" class="py-2">
      <span class="visually-hidden">Loading your data...</span>
      <div class="row g-3" aria-hidden="true">
        <div class="col-md-5"><div class="skeleton" style="height: 220px"></div></div>
        <div class="col-md-7">
          <div class="skeleton mb-3" style="height: 102px"></div>
          <div class="skeleton" style="height: 102px"></div>
        </div>
        <div class="col-12"><div class="skeleton" style="height: 180px"></div></div>
      </div>
    </div>`;
}

// ----- Toast message -----

function showToast(message, type) {
  let container = document.getElementById("toastArea");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastArea";
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(container);
  }
  const icon = type === "error" ? "bi-x-circle-fill" : "bi-check-circle-fill";
  const toast = document.createElement("div");
  toast.className = "toast app-toast toast-" + (type || "success");
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="toast-body"><i class="bi ${icon}" aria-hidden="true"></i> ${escapeHtml(message)}</div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  container.appendChild(toast);
  new bootstrap.Toast(toast, { delay: 3500 }).show();
  toast.addEventListener("hidden.bs.toast", function () {
    toast.remove();
  });
}

// ----- Confirmation modal -----
// options: { title, message, confirmText, confirmClass, askReason }
// onConfirm gets the reason text (or "" when no reason is asked)

function showConfirm(options, onConfirm) {
  let modalElement = document.getElementById("confirmModal");
  if (!modalElement) {
    modalElement = document.createElement("div");
    modalElement.id = "confirmModal";
    modalElement.className = "modal fade";
    modalElement.tabIndex = -1;
    modalElement.setAttribute("aria-labelledby", "confirmTitle");
    modalElement.setAttribute("aria-hidden", "true");
    modalElement.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5" id="confirmTitle"></h2>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p id="confirmMessage" class="mb-0"></p>
            <div id="reasonBox" class="mt-3">
              <label for="reasonInput" class="form-label">Rejection reason</label>
              <textarea id="reasonInput" class="form-control" rows="3" maxlength="200"></textarea>
              <div class="form-text">The employee will see this note.</div>
              <div class="invalid-feedback">Please add a short rejection reason.</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn" id="confirmButton"></button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modalElement);
  }

  const reasonBox = document.getElementById("reasonBox");
  const reasonInput = document.getElementById("reasonInput");
  const confirmButton = document.getElementById("confirmButton");

  document.getElementById("confirmTitle").textContent = options.title;
  document.getElementById("confirmMessage").textContent = options.message;
  confirmButton.textContent = options.confirmText;
  confirmButton.className = "btn " + (options.confirmClass || "btn-primary");
  reasonBox.style.display = options.askReason ? "block" : "none";
  reasonInput.value = "";
  reasonInput.classList.remove("is-invalid");

  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

  // Replace the button so old click handlers are removed
  const newButton = confirmButton.cloneNode(true);
  confirmButton.parentNode.replaceChild(newButton, confirmButton);
  newButton.addEventListener("click", function () {
    const reason = reasonInput.value.trim();
    if (options.askReason && reason.length < 3) {
      reasonInput.classList.add("is-invalid");
      reasonInput.focus();
      return;
    }
    modal.hide();
    onConfirm(reason);
  });

  modal.show();
}

// ----- Form errors (shown below each field) -----

function showFormErrors(form, errors) {
  form.querySelectorAll(".is-invalid").forEach(function (field) {
    field.classList.remove("is-invalid");
  });
  form.querySelectorAll(".error-text").forEach(function (box) {
    box.textContent = "";
  });

  let firstField = null;
  Object.keys(errors).forEach(function (name) {
    const field = form.querySelector('[name="' + name + '"]');
    const box = document.getElementById(name + "Error");
    if (field) {
      field.classList.add("is-invalid");
      if (!firstField) firstField = field;
    }
    if (box) {
      box.textContent = errors[name];
    }
  });
  if (firstField) {
    firstField.focus();
  }
}

// ----- Filter buttons (used instead of small dropdowns, easier to tap on phones) -----
// options: [{ value: "All", label: "All" }, ...]
// onChange is called with the new value when a button is clicked

function setupFilterButtons(containerId, options, selected, onChange) {
  const box = document.getElementById(containerId);

  function draw() {
    box.innerHTML = options
      .map(function (option) {
        const isActive = option.value === selected;
        return `<button type="button" class="filter-pill ${isActive ? "active" : ""}" data-value="${option.value}" aria-pressed="${isActive}">${option.label}</button>`;
      })
      .join("");
  }

  box.addEventListener("click", function (e) {
    const button = e.target.closest(".filter-pill");
    if (!button) return;
    selected = button.dataset.value;
    draw();
    onChange(selected);
  });

  draw();
}
