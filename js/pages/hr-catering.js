// hr-catering.js

const user = requireRole("hr");
const EVENT_STATUSES = ["Open", "Closed", "Confirmed", "Completed"];
let dateFilter = "upcoming";

if (user) {
  renderNavbar("catering");
  setupFilterButtons("dateFilter", [
    { value: "upcoming", label: "Upcoming" },
    { value: "past", label: "Past" },
    { value: "all", label: "All" }
  ], dateFilter, function (value) {
    dateFilter = value;
    showEvents();
  });
  document.getElementById("vendorSearch").addEventListener("input", showVendors);

  // Status dropdowns are created later, so listen on the parent
  document.getElementById("eventList").addEventListener("change", function (e) {
    if (e.target.classList.contains("status-select")) {
      const result = updateEventStatus(e.target.dataset.id, e.target.value);
      showToast(result.message, result.success ? "success" : "error");
      showEvents();
    }
  });

  document.getElementById("eventList").innerHTML = loadingState();
  setTimeout(function () {
    showEvents();
    showVendors();
  }, 300);
}

function showEvents() {
  const filter = dateFilter;
  const today = getToday();

  const events = getData(KEYS.events)
    .filter(function (event) {
      if (filter === "upcoming") return event.eventDate >= today;
      if (filter === "past") return event.eventDate < today;
      return true;
    })
    .sort(function (a, b) {
      return filter === "past" ? b.eventDate.localeCompare(a.eventDate) : a.eventDate.localeCompare(b.eventDate);
    });

  const list = document.getElementById("eventList");
  if (events.length === 0) {
    list.innerHTML = emptyState("bi-calendar-x", filter === "past" ? "No past catering events." : "There are no upcoming catering events.",
      '<a class="btn btn-primary" href="create-event.html">Create event</a>');
    return;
  }

  list.innerHTML = '<div class="row g-3">' + events.map(function (event) {
    const registered = getPreferencesForEvent(event.eventId).length;
    const options = EVENT_STATUSES.map(function (status) {
      return `<option ${status === event.status ? "selected" : ""}>${status}</option>`;
    }).join("");

    const action = `
      <p class="small mb-3"><i class="bi bi-people" aria-hidden="true"></i> <strong>${registered}</strong> ${registered === 1 ? "employee" : "employees"} registered</p>
      <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
        <a class="btn btn-sm btn-primary" href="summary.html?id=${event.eventId}">Order summary</a>
        <a class="btn btn-sm btn-outline-primary" href="create-event.html?id=${event.eventId}">Edit event</a>
      </div>
      <label class="form-label small mb-1" for="status-${event.eventId}">Event status</label>
      <select class="form-select form-select-sm status-select" id="status-${event.eventId}" data-id="${event.eventId}">${options}</select>`;
    return `<div class="col-md-6 col-xl-4">${cateringEventCard(event, action)}</div>`;
  }).join("") + "</div>";
}

function showVendors() {
  const searchText = document.getElementById("vendorSearch").value.trim().toLowerCase();
  const vendors = getData(KEYS.vendors).filter(function (vendor) {
    return vendor.vendorName.toLowerCase().includes(searchText) || vendor.contactPerson.toLowerCase().includes(searchText);
  });

  const list = document.getElementById("vendorList");
  if (vendors.length === 0) {
    list.innerHTML = emptyState("bi-search", "No vendors match your search.");
    return;
  }

  list.innerHTML = '<div class="row g-3">' + vendors.map(function (vendor) {
    const assigned = getData(KEYS.events).filter(function (event) {
      return event.vendorId === vendor.vendorId;
    }).length;
    return `
      <div class="col-md-6 col-lg-4">
        <div class="border rounded-3 p-3 h-100 bg-white">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h3 class="h6 mb-0">${escapeHtml(vendor.vendorName)}</h3>
            <span class="status-badge ${vendor.status === "Active" ? "event-open" : "event-closed"}">${vendor.status}</span>
          </div>
          <ul class="list-unstyled small text-body-secondary mb-0 event-meta">
            <li><i class="bi bi-person" aria-hidden="true"></i> ${escapeHtml(vendor.contactPerson)}</li>
            <li><i class="bi bi-telephone" aria-hidden="true"></i> ${vendor.phone}</li>
            <li><i class="bi bi-envelope" aria-hidden="true"></i> ${vendor.email}</li>
            <li><i class="bi bi-calendar-event" aria-hidden="true"></i> ${assigned} ${assigned === 1 ? "event" : "events"} assigned</li>
          </ul>
        </div>
      </div>`;
  }).join("") + "</div>";
}
