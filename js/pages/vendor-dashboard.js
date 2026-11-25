// vendor-dashboard.js - a vendor only sees events assigned to them

const user = requireRole("vendor");

if (user) {
  renderNavbar("dashboard");
  document.getElementById("vendorText").textContent = "Orders from MealMate for " + user.name + ".";
  document.getElementById("orderList").innerHTML = loadingState();
  setTimeout(showOrders, 300);
}

// Vendor order card (PRD component: VendorOrderCard)
function vendorOrderCard(event) {
  const counts = getMealCounts(event.eventId);
  const total = counts.vegetarian + counts.nonVegetarian + counts.vegan + counts.jain;
  const action = `
    <div class="d-flex flex-wrap gap-3 small mb-3">
      <span class="d-inline-flex align-items-center gap-1">${foodMark("veg")} ${counts.vegetarian}<span class="visually-hidden"> Vegetarian</span></span>
      <span class="d-inline-flex align-items-center gap-1">${foodMark("nonveg")} ${counts.nonVegetarian}<span class="visually-hidden"> Non-vegetarian</span></span>
      <span class="d-inline-flex align-items-center gap-1">${foodMark("vegan")} ${counts.vegan}<span class="visually-hidden"> Vegan</span></span>
      <span class="d-inline-flex align-items-center gap-1">${foodMark("jain")} ${counts.jain}<span class="visually-hidden"> Jain</span></span>
      <span class="fw-semibold">${total} ${total === 1 ? "meal" : "meals"}</span>
    </div>
    <a class="btn btn-sm btn-primary" href="order.html?id=${event.eventId}">View order details</a>`;
  return cateringEventCard(event, action);
}

function showOrders() {
  const myEvents = getData(KEYS.events)
    .filter(function (event) {
      return event.vendorId === user.id;
    })
    .sort(function (a, b) {
      return a.eventDate.localeCompare(b.eventDate);
    });

  const today = getToday();
  const upcoming = myEvents.filter(function (event) { return event.eventDate >= today; });
  const totalMeals = upcoming.reduce(function (total, event) {
    return total + getPreferencesForEvent(event.eventId).length;
  }, 0);
  const toConfirm = upcoming.filter(function (event) { return event.status === "Open" || event.status === "Closed"; }).length;

  document.getElementById("vendorStats").innerHTML = `
    <div class="col-sm-4">${dashboardCard("Upcoming orders", upcoming.length, "Events assigned to you", "bi-box-seam", "stat-featured")}</div>
    <div class="col-sm-4">${dashboardCard("Meals to prepare", totalMeals, "Across upcoming events", "bi-egg-fried")}</div>
    <div class="col-sm-4">${dashboardCard("Waiting for confirmation", toConfirm, "Orders not confirmed yet", "bi-patch-question")}</div>`;

  const list = document.getElementById("orderList");
  if (myEvents.length === 0) {
    list.innerHTML = emptyState("bi-inbox", "No catering order is assigned to you yet.");
    return;
  }

  list.innerHTML = '<div class="row g-3">' + myEvents.map(function (event) {
    return '<div class="col-md-6 col-xl-4">' + vendorOrderCard(event) + "</div>";
  }).join("") + "</div>";
}
