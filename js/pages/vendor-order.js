// vendor-order.js - order details for one assigned event

const user = requireRole("vendor");
const eventId = getUrlParam("id");

if (user) {
  renderNavbar("dashboard");
  showOrder();
}

function showOrder() {
  const event = eventId ? findEvent(eventId) : null;
  const content = document.getElementById("orderContent");

  // A vendor can only open orders assigned to them
  if (!event || event.vendorId !== user.id) {
    content.innerHTML = emptyState("bi-shield-lock", "This order is not assigned to you.",
      '<a class="btn btn-primary" href="dashboard.html">Back to my orders</a>');
    return;
  }

  const open = isRegistrationOpen(event);

  let statusAction = "";
  if (event.status === "Open" || event.status === "Closed") {
    statusAction = `<button class="btn btn-accent btn-mobile-full" id="confirmOrderBtn" type="button"><i class="bi bi-patch-check" aria-hidden="true"></i> Confirm order</button>`;
  } else if (event.status === "Confirmed") {
    statusAction = `<button class="btn btn-primary btn-mobile-full" id="completeOrderBtn" type="button"><i class="bi bi-flag" aria-hidden="true"></i> Mark as delivered</button>`;
  }

  content.innerHTML = `
    <div class="page-header pt-2 d-flex flex-wrap justify-content-between align-items-end gap-3">
      <div>
        <h1>${escapeHtml(event.eventName)}</h1>
        <p>${formatDate(event.eventDate)}, ${formatTime(event.eventTime)}. ${escapeHtml(event.location)}</p>
      </div>
      <div class="d-flex flex-wrap gap-2 no-print">
        <button class="btn btn-outline-primary btn-mobile-full" id="printBtn" type="button"><i class="bi bi-printer" aria-hidden="true"></i> Print</button>
        ${statusAction}
      </div>
    </div>

    ${open ? `<div class="alert alert-warning d-flex gap-2" role="status"><i class="bi bi-hourglass-split" aria-hidden="true"></i>
      <span>Employees can still register until ${formatDateTime(event.registrationDeadline)}. Quantities may change.</span></div>` : ""}

    <div class="row g-4">
      <div class="col-lg-5">
        <h2 class="section-title d-flex justify-content-between align-items-center">Order ticket ${eventStatusBadge(event.status)}</h2>
        ${orderTicket(event)}
      </div>
      <div class="col-lg-7">
        <h2 class="section-title">Dietary details</h2>
        <div class="card section-card">
          <div class="card-body">${dietarySummary(event.eventId)}</div>
        </div>
      </div>
    </div>`;

  document.getElementById("printBtn").addEventListener("click", function () {
    window.print();
  });

  const confirmBtn = document.getElementById("confirmOrderBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      changeStatus(event, "Confirmed", "Confirm this order?", "You agree to prepare these meals for " + event.eventName + ".");
    });
  }
  const completeBtn = document.getElementById("completeOrderBtn");
  if (completeBtn) {
    completeBtn.addEventListener("click", function () {
      changeStatus(event, "Completed", "Mark as delivered?", "This tells HR the meals for " + event.eventName + " were delivered.");
    });
  }
}

function changeStatus(event, newStatus, title, message) {
  showConfirm({ title: title, message: message, confirmText: newStatus === "Confirmed" ? "Confirm order" : "Mark delivered", confirmClass: "btn-primary" },
    function () {
      const result = updateEventStatus(event.eventId, newStatus);
      showToast(result.message, result.success ? "success" : "error");
      showOrder();
    });
}
