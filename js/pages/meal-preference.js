// meal-preference.js

const user = requireRole("employee");
const eventId = getUrlParam("event");

if (user) {
  renderNavbar("events");
  const event = eventId ? findEvent(eventId) : null;

  if (!event) {
    document.getElementById("preferenceArea").classList.add("d-none");
    const notFound = document.getElementById("notFound");
    notFound.classList.remove("d-none");
    notFound.innerHTML = emptyState("bi-calendar-x", "We could not find this event.",
      '<a class="btn btn-primary" href="events.html">Back to events</a>');
  } else {
    setupPage(event);
  }
}

function setupPage(event) {
  const form = document.getElementById("preferenceForm");
  const vendor = findVendor(event.vendorId);
  const open = isRegistrationOpen(event);
  const existing = getMyPreference(event.eventId);

  document.getElementById("eventTitle").textContent = event.eventName;
  document.title = event.eventName + " | MealMate";

  // Event details on the side
  document.getElementById("eventDetails").innerHTML = `
    <h2 class="section-title">Event details</h2>
    <div class="mb-3">${eventStatusBadge(event.status)}</div>
    <ul class="list-unstyled event-meta mb-0">
      <li class="mb-2"><i class="bi bi-calendar3" aria-hidden="true"></i> ${formatDate(event.eventDate)}</li>
      <li class="mb-2"><i class="bi bi-clock" aria-hidden="true"></i> ${formatTime(event.eventTime)}</li>
      <li class="mb-2"><i class="bi bi-geo-alt" aria-hidden="true"></i> ${escapeHtml(event.location)}</li>
      <li class="mb-2"><i class="bi bi-shop" aria-hidden="true"></i> ${vendor ? escapeHtml(vendor.vendorName) : "-"}</li>
      <li><i class="bi bi-alarm" aria-hidden="true"></i> Register by ${formatDateTime(event.registrationDeadline)}
        <div class="small ${open ? "deadline-open" : "text-body-secondary"}">${getTimeLeftText(event.registrationDeadline)}</div></li>
    </ul>`;

  // Fill the form if the employee already registered
  if (existing) {
    const radio = form.querySelector('input[name="mealCategory"][value="' + existing.mealCategory + '"]');
    if (radio) radio.checked = true;
    existing.dietaryRestrictions.forEach(function (restriction) {
      const box = form.querySelector('input[name="restriction"][value="' + restriction + '"]');
      if (box) box.checked = true;
    });
    form.additionalNotes.value = existing.additionalNotes;
    document.getElementById("saveBtn").textContent = "Update my preference";
  }

  const statusBox = document.getElementById("statusBox");
  if (!open) {
    statusBox.innerHTML = `<div class="alert alert-secondary d-flex gap-2" role="status"><i class="bi bi-lock-fill" aria-hidden="true"></i><span>Registration for this event has closed.${existing ? " Your saved choice is shown below." : ""}</span></div>`;
    form.querySelectorAll("input, textarea, button[type=submit]").forEach(function (field) {
      field.disabled = true;
    });
  } else if (existing) {
    statusBox.innerHTML = `<div class="alert alert-success d-flex gap-2" role="status"><i class="bi bi-check-circle-fill" aria-hidden="true"></i><span>You are registered for this event. You can change your choice until the deadline.</span></div>`;
  }

  // "Other" makes the notes field required
  const otherBox = document.getElementById("otherRestriction");
  function updateNotesLabel() {
    document.getElementById("notesOptional").textContent = otherBox.checked ? "(required for Other)" : "(optional)";
  }
  otherBox.addEventListener("change", updateNotesLabel);
  updateNotesLabel();

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const selectedMeal = form.querySelector('input[name="mealCategory"]:checked');
    const restrictions = Array.from(form.querySelectorAll('input[name="restriction"]:checked')).map(function (box) {
      return box.value;
    });

    const values = {
      mealCategory: selectedMeal ? selectedMeal.value : "",
      dietaryRestrictions: restrictions,
      additionalNotes: form.additionalNotes.value
    };

    const errors = validatePreference(values);
    showFormErrors(form, errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const result = saveMealPreference(event.eventId, values);
    if (!result.success) {
      showToast(result.message, "error");
      return;
    }

    showToast(result.message);
    statusBox.innerHTML = `<div class="alert alert-success d-flex gap-2" role="status"><i class="bi bi-check-circle-fill" aria-hidden="true"></i><span>${result.message} Meal: <strong>${values.mealCategory}</strong>${restrictions.length ? ", " + restrictions.join(", ") : ""}.</span></div>`;
    document.getElementById("saveBtn").textContent = "Update my preference";
    statusBox.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
