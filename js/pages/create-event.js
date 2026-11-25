// create-event.js
// Used for both creating a new event and editing one (?id=EVT001)

const user = requireRole("hr");
const editId = getUrlParam("id");

if (user) {
  renderNavbar("catering");

  const form = document.getElementById("eventForm");
  const vendorSelect = document.getElementById("vendorId");

  // Only active vendors can be selected
  getData(KEYS.vendors)
    .filter(function (vendor) {
      return vendor.status === "Active";
    })
    .forEach(function (vendor) {
      const option = document.createElement("option");
      option.value = vendor.vendorId;
      option.textContent = vendor.vendorName;
      vendorSelect.appendChild(option);
    });

  form.eventDate.min = getToday();

  // Edit mode: fill the form with the saved event
  if (editId) {
    const event = findEvent(editId);
    if (event) {
      document.getElementById("pageTitle").textContent = "Edit " + event.eventName;
      document.getElementById("crumbText").textContent = "Edit event";
      document.title = "Edit Event | MealMate";
      document.getElementById("saveBtn").textContent = "Save changes";
      form.eventName.value = event.eventName;
      form.eventDate.value = event.eventDate;
      form.eventDate.removeAttribute("min");
      form.eventTime.value = event.eventTime;
      form.location.value = event.location;
      form.registrationDeadline.value = event.registrationDeadline.slice(0, 16);
      form.vendorId.value = event.vendorId;
      showVendorDetails(event.vendorId);
    }
  }

  vendorSelect.addEventListener("change", function () {
    showVendorDetails(vendorSelect.value);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const values = {
      eventId: editId || "",
      eventName: form.eventName.value,
      eventDate: form.eventDate.value,
      eventTime: form.eventTime.value,
      location: form.location.value,
      registrationDeadline: form.registrationDeadline.value,
      vendorId: form.vendorId.value
    };

    const errors = validateEvent(values);
    // A new event must be in the future
    if (!editId && values.eventDate && values.eventDate < getToday()) {
      errors.eventDate = "The event date cannot be in the past.";
    }
    showFormErrors(form, errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const result = saveCateringEvent(values);
    if (!result.success) {
      showToast(result.message, "error");
      return;
    }

    showToast(result.message);
    setTimeout(function () {
      window.location.href = "catering.html";
    }, 900);
  });
}

function showVendorDetails(vendorId) {
  const vendor = findVendor(vendorId);
  const box = document.getElementById("vendorDetails");
  if (!vendor) {
    box.innerHTML = `<h2 class="section-title">Vendor details</h2><p class="small text-body-secondary mb-0">Choose a vendor to see their contact details.</p>`;
    return;
  }
  box.innerHTML = `
    <h2 class="section-title">Vendor details</h2>
    <p class="fw-semibold mb-2">${escapeHtml(vendor.vendorName)}</p>
    <ul class="list-unstyled small text-body-secondary mb-0 event-meta">
      <li><i class="bi bi-person" aria-hidden="true"></i> ${escapeHtml(vendor.contactPerson)}</li>
      <li><i class="bi bi-telephone" aria-hidden="true"></i> ${vendor.phone}</li>
      <li><i class="bi bi-envelope" aria-hidden="true"></i> ${vendor.email}</li>
    </ul>`;
}
