// order-summary.js - consolidated catering order for HR (generateOrderSummary)

const user = requireRole("hr");
const eventId = getUrlParam("id");

if (user) {
  renderNavbar("catering");
  const event = eventId ? findEvent(eventId) : null;

  if (!event) {
    document.getElementById("summaryContent").innerHTML = emptyState("bi-calendar-x", "We could not find this event.",
      '<a class="btn btn-primary" href="catering.html">Back to catering</a>');
  } else {
    showSummary(event);
  }
}

function showSummary(event) {
  const vendor = findVendor(event.vendorId);
  const preferences = getPreferencesForEvent(event.eventId);
  const counts = getMealCounts(event.eventId);
  const open = isRegistrationOpen(event);
  document.title = event.eventName + " Order Summary | MealMate";

  // Partial state: registration is still running
  const partialNote = open
    ? `<div class="alert alert-warning d-flex gap-2" role="status"><i class="bi bi-hourglass-split" aria-hidden="true"></i>
        <span>Registration is still open until ${formatDateTime(event.registrationDeadline)} (${getTimeLeftText(event.registrationDeadline)}). These numbers may still change.</span></div>`
    : `<div class="alert alert-success d-flex gap-2" role="status"><i class="bi bi-lock-fill" aria-hidden="true"></i>
        <span>Registration has closed. These are the final numbers for the vendor.</span></div>`;

  const rows = preferences.map(function (preference) {
    const employee = findEmployee(preference.employeeId);
    const mealType = MEAL_TYPES.find(function (type) { return type.label === preference.mealCategory; });
    return `
      <tr>
        <td>${escapeHtml(employee ? employee.name : preference.employeeId)}<div class="small text-body-secondary">${employee ? employee.department : ""}</div></td>
        <td><span class="d-inline-flex align-items-center gap-2">${foodMark(mealType ? mealType.mark : "veg")} ${preference.mealCategory}</span></td>
        <td>${preference.dietaryRestrictions.length ? preference.dietaryRestrictions.join(", ") : "-"}</td>
        <td>${preference.additionalNotes ? escapeHtml(preference.additionalNotes) : "-"}</td>
        <td class="small text-body-secondary">${formatDateTime(preference.submittedAt)}</td>
      </tr>`;
  }).join("");

  const employeeTable = preferences.length
    ? `<div class="table-responsive"><table class="table align-middle app-table mb-0">
        <thead><tr><th scope="col">Employee</th><th scope="col">Meal</th><th scope="col">Restrictions</th><th scope="col">Notes</th><th scope="col">Registered</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
    : emptyState("bi-people", "No employees have registered yet.");

  document.getElementById("summaryContent").innerHTML = `
    <div class="page-header pt-2 d-flex flex-wrap justify-content-between align-items-end gap-3">
      <div>
        <h1>${escapeHtml(event.eventName)}</h1>
        <p>Catering order summary for ${vendor ? escapeHtml(vendor.vendorName) : "the vendor"}</p>
      </div>
      <div class="d-flex flex-wrap gap-2 no-print">
        <button class="btn btn-outline-primary btn-mobile-full" id="copyBtn" type="button"><i class="bi bi-clipboard" aria-hidden="true"></i> Copy for vendor</button>
        <button class="btn btn-outline-primary btn-mobile-full" id="csvBtn" type="button"><i class="bi bi-download" aria-hidden="true"></i> Export CSV</button>
        <button class="btn btn-accent btn-mobile-full" id="printBtn" type="button"><i class="bi bi-printer" aria-hidden="true"></i> Print summary</button>
      </div>
    </div>

    ${partialNote}

    <div class="row g-4 mb-4">
      <div class="col-lg-8">
        <div class="card section-card mb-4">
          <div class="card-body">
            <h2 class="section-title">Meal quantities</h2>
            ${mealCountSummary(counts)}
          </div>
        </div>
        <div class="card section-card">
          <div class="card-body">${dietarySummary(event.eventId)}</div>
        </div>
      </div>
      <div class="col-lg-4">
        <h2 class="section-title d-flex justify-content-between align-items-center">What the vendor gets ${eventStatusBadge(event.status)}</h2>
        ${orderTicket(event)}
        ${vendor ? `
        <div class="mt-4 small">
          <p class="fw-semibold mb-1">${escapeHtml(vendor.vendorName)}</p>
          <ul class="list-unstyled text-body-secondary event-meta mb-0">
            <li><i class="bi bi-person" aria-hidden="true"></i>${escapeHtml(vendor.contactPerson)}</li>
            <li><i class="bi bi-telephone" aria-hidden="true"></i>${vendor.phone}</li>
            <li><i class="bi bi-envelope" aria-hidden="true"></i>${vendor.email}</li>
          </ul>
        </div>` : ""}
      </div>
    </div>

    <div class="card section-card">
      <div class="card-body">
        <h2 class="section-title">Registered employees</h2>
        ${employeeTable}
      </div>
    </div>`;

  document.getElementById("printBtn").addEventListener("click", function () {
    window.print();
  });

  document.getElementById("csvBtn").addEventListener("click", function () {
    const csvRows = [
      ["Event", event.eventName],
      ["Date", event.eventDate + " " + event.eventTime],
      ["Location", event.location],
      ["Vendor", vendor ? vendor.vendorName : ""],
      [],
      ["Vegetarian", counts.vegetarian],
      ["Non-vegetarian", counts.nonVegetarian],
      ["Vegan", counts.vegan],
      ["Jain", counts.jain],
      ["Total", preferences.length],
      [],
      ["Employee", "Department", "Meal", "Restrictions", "Notes"]
    ];
    preferences.forEach(function (preference) {
      const employee = findEmployee(preference.employeeId);
      csvRows.push([employee ? employee.name : "", employee ? employee.department : "", preference.mealCategory, preference.dietaryRestrictions.join("; "), preference.additionalNotes]);
    });
    downloadCSV("order-" + event.eventId + ".csv", csvRows);
    showToast("Order summary downloaded.");
  });

  document.getElementById("copyBtn").addEventListener("click", function () {
    const restrictions = getRestrictionCounts(event.eventId);
    const restrictionText = Object.keys(restrictions)
      .filter(function (name) { return restrictions[name] > 0; })
      .map(function (name) { return name + ": " + restrictions[name]; })
      .join(", ");

    const text =
      "Catering order: " + event.eventName + "\n" +
      "Date: " + formatDate(event.eventDate) + ", " + formatTime(event.eventTime) + "\n" +
      "Location: " + event.location + "\n\n" +
      "Vegetarian: " + counts.vegetarian + "\n" +
      "Non-vegetarian: " + counts.nonVegetarian + "\n" +
      "Vegan: " + counts.vegan + "\n" +
      "Jain: " + counts.jain + "\n" +
      "Total meals: " + preferences.length + "\n\n" +
      "Dietary restrictions: " + (restrictionText || "None");

    navigator.clipboard.writeText(text).then(
      function () { showToast("Order summary copied. Paste it in an email to the vendor."); },
      function () { showToast("Could not copy. Please use Print or Export CSV.", "error"); }
    );
  });
}
