// employee-events.js

const user = requireRole("employee");

if (user) {
  renderNavbar("events");
  document.getElementById("eventList").innerHTML = loadingState();
  setTimeout(showEvents, 300);
}

function showEvents() {
  const events = getUpcomingEvents();
  const list = document.getElementById("eventList");

  if (events.length === 0) {
    list.innerHTML = emptyState("bi-calendar-x", "There are no upcoming catering events.");
    return;
  }

  const openCount = events.filter(isRegistrationOpen).length;
  const intro = openCount > 0
    ? `<div class="alert alert-success d-flex gap-2 align-items-center" role="status"><i class="bi bi-megaphone" aria-hidden="true"></i><span>A new team meal is open for registration.</span></div>`
    : "";

  const cards = events.map(function (event) {
    const myPreference = getMyPreference(event.eventId);
    let action = "";

    if (isRegistrationOpen(event)) {
      if (myPreference) {
        action = `
          <p class="small mb-2"><i class="bi bi-check-circle-fill text-success" aria-hidden="true"></i> Registered: <strong>${myPreference.mealCategory}</strong></p>
          <a class="btn btn-outline-primary btn-sm" href="preference.html?event=${event.eventId}">Edit my meal</a>`;
      } else {
        action = `<a class="btn btn-accent btn-sm" href="preference.html?event=${event.eventId}">Choose my meal</a>`;
      }
    } else {
      action = myPreference
        ? `<p class="small mb-2"><i class="bi bi-check-circle-fill text-success" aria-hidden="true"></i> Registered: <strong>${myPreference.mealCategory}</strong></p>
           <a class="btn btn-light btn-sm" href="preference.html?event=${event.eventId}">View my meal</a>`
        : `<p class="small text-body-secondary mb-0">You did not register for this event.</p>`;
    }

    return `<div class="col-md-6 col-xl-4">${cateringEventCard(event, action)}</div>`;
  });

  list.innerHTML = intro + `<div class="row g-3">${cards.join("")}</div>`;
}
