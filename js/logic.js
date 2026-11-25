// logic.js
// Role checks, calculations and the main actions of the app.
// Every action checks the role here, so hiding a button is not the only protection.

// ----- Role permissions (PRD section 4, Role Capabilities Matrix) -----

const PERMISSIONS = {
  employee: ["submitExpense", "viewOwnExpenses", "viewEvents", "registerMealPreference"],
  hr: ["viewAllExpenses", "approveExpense", "rejectExpense", "createCateringEvent", "viewEvents", "viewOrderSummary", "updateOrderStatus", "exportExpenseReport"],
  vendor: ["viewAssignedOrders", "updateOrderStatus"]
};

function canDo(action) {
  const user = getCurrentUser();
  if (!user || !PERMISSIONS[user.role]) {
    return false;
  }
  return PERMISSIONS[user.role].includes(action);
}

// Sends the user back to the role selection page if they are on the wrong page
function requireRole(role) {
  const user = getCurrentUser();
  if (!user || user.role !== role) {
    window.location.href = "../index.html?denied=1";
    return null;
  }
  return user;
}

// ----- Meal subsidy (PRD section 10.7) -----

// Only approved expenses of this month count towards subsidy usage
function getUsedSubsidy(employeeId) {
  const currentMonth = getCurrentMonth();
  return getData(KEYS.expenses)
    .filter(function (expense) {
      return expense.employeeId === employeeId && expense.status === "Approved" && expense.expenseDate.startsWith(currentMonth);
    })
    .reduce(function (total, expense) {
      return total + expense.amount;
    }, 0);
}

function getSubsidySummary(employeeId) {
  const employee = findEmployee(employeeId);
  const limit = employee.monthlySubsidyLimit;
  const used = getUsedSubsidy(employeeId);
  const remaining = Math.max(0, limit - used);
  const percent = Math.min(100, Math.round((used / limit) * 100));

  let level = "ok";
  if (used >= limit) {
    level = "reached";
  } else if (percent >= 80) {
    level = "near";
  }

  return { limit: limit, used: used, remaining: remaining, percent: percent, level: level };
}

// ----- Catering calculations -----

function getPreferencesForEvent(eventId) {
  return getData(KEYS.preferences).filter(function (preference) {
    return preference.eventId === eventId;
  });
}

// Counts how many meals of each category are needed for an event
function getMealCounts(eventId) {
  const mealCounts = { vegetarian: 0, nonVegetarian: 0, vegan: 0, jain: 0 };

  getPreferencesForEvent(eventId).forEach(function (preference) {
    if (preference.mealCategory === "Vegetarian") mealCounts.vegetarian++;
    if (preference.mealCategory === "Non-vegetarian") mealCounts.nonVegetarian++;
    if (preference.mealCategory === "Vegan") mealCounts.vegan++;
    if (preference.mealCategory === "Jain") mealCounts.jain++;
  });

  return mealCounts;
}

// Counts each dietary restriction, for example { "Gluten-free": 2 }
function getRestrictionCounts(eventId) {
  const counts = { "Gluten-free": 0, "Dairy-free": 0, "Nut allergy": 0, "Other": 0 };
  getPreferencesForEvent(eventId).forEach(function (preference) {
    preference.dietaryRestrictions.forEach(function (restriction) {
      counts[restriction] = (counts[restriction] || 0) + 1;
    });
  });
  return counts;
}

// Registration is open only when the event is Open and the deadline has not passed
function isRegistrationOpen(event) {
  return event.status === "Open" && new Date() < new Date(event.registrationDeadline);
}

// Events that have not happened yet, nearest first
function getUpcomingEvents() {
  const today = getToday();
  return getData(KEYS.events)
    .filter(function (event) {
      return event.eventDate >= today && event.status !== "Completed";
    })
    .sort(function (a, b) {
      return a.eventDate.localeCompare(b.eventDate);
    });
}

// ----- Actions: expenses -----

// Checks the expense form values. Returns an object of error messages (empty means valid).
function validateExpense(values) {
  const errors = {};
  if (!values.expenseDate) {
    errors.expenseDate = "Please choose the date of the expense.";
  } else if (values.expenseDate > getToday()) {
    errors.expenseDate = "The expense date cannot be in the future.";
  }
  if (values.amount === "" || isNaN(values.amount)) {
    errors.amount = "Please enter the amount.";
  } else if (Number(values.amount) <= 0) {
    errors.amount = "Amount must be more than ₹0.";
  } else if (Number(values.amount) > 10000) {
    errors.amount = "Amount looks too high. A single meal expense can be up to ₹10,000.";
  }
  if (!values.category) {
    errors.category = "Please choose a category.";
  }
  if (values.description.trim().length < 5) {
    errors.description = "Please write a short description (at least 5 characters).";
  }
  return errors;
}

function submitExpense(values) {
  if (!canDo("submitExpense")) {
    return { success: false, message: "Only employees can submit meal expenses." };
  }
  const user = getCurrentUser();
  const expenses = getData(KEYS.expenses);

  const newExpense = {
    expenseId: generateId("EXP", expenses, "expenseId"),
    employeeId: user.id,
    expenseDate: values.expenseDate,
    amount: Number(values.amount),
    category: values.category,
    description: values.description.trim(),
    receiptReference: values.receiptReference.trim(),
    status: "Pending",
    rejectionReason: "",
    submittedAt: new Date().toISOString()
  };

  expenses.push(newExpense);
  saveData(KEYS.expenses, expenses);
  return { success: true, message: "Your meal expense has been submitted.", expense: newExpense };
}

function approveExpense(expenseId) {
  if (!canDo("approveExpense")) {
    return { success: false, message: "Only HR managers can approve expenses." };
  }
  const expenses = getData(KEYS.expenses);
  const expense = expenses.find(function (item) {
    return item.expenseId === expenseId;
  });
  if (!expense || expense.status !== "Pending") {
    return { success: false, message: "This expense is not waiting for review." };
  }
  expense.status = "Approved";
  expense.rejectionReason = "";
  saveData(KEYS.expenses, expenses);
  return { success: true, message: "Expense " + expenseId + " has been approved." };
}

function rejectExpense(expenseId, reason) {
  if (!canDo("rejectExpense")) {
    return { success: false, message: "Only HR managers can reject expenses." };
  }
  if (!reason || reason.trim().length < 3) {
    return { success: false, message: "Please add a short rejection reason." };
  }
  const expenses = getData(KEYS.expenses);
  const expense = expenses.find(function (item) {
    return item.expenseId === expenseId;
  });
  if (!expense || expense.status !== "Pending") {
    return { success: false, message: "This expense is not waiting for review." };
  }
  expense.status = "Rejected";
  expense.rejectionReason = reason.trim();
  saveData(KEYS.expenses, expenses);
  return { success: true, message: "Expense " + expenseId + " has been rejected." };
}

// ----- Actions: catering events -----

function validateEvent(values) {
  const errors = {};
  if (values.eventName.trim().length < 3) {
    errors.eventName = "Please enter the event name.";
  }
  if (!values.eventDate) {
    errors.eventDate = "Please choose the event date.";
  }
  if (!values.eventTime) {
    errors.eventTime = "Please choose the event time.";
  }
  if (values.location.trim().length < 3) {
    errors.location = "Please enter the location.";
  }
  if (!values.registrationDeadline) {
    errors.registrationDeadline = "Please set the registration deadline.";
  } else if (values.eventDate && values.eventTime) {
    const eventStart = new Date(values.eventDate + "T" + values.eventTime);
    if (new Date(values.registrationDeadline) >= eventStart) {
      errors.registrationDeadline = "The deadline must be before the event starts.";
    }
  }
  if (!values.vendorId) {
    errors.vendorId = "Please select a vendor.";
  }
  return errors;
}

// Creates a new event, or updates one when values.eventId is given
function saveCateringEvent(values) {
  if (!canDo("createCateringEvent")) {
    return { success: false, message: "Only HR managers can create or edit catering events." };
  }
  const events = getData(KEYS.events);

  if (values.eventId) {
    const event = events.find(function (item) {
      return item.eventId === values.eventId;
    });
    if (!event) {
      return { success: false, message: "Event not found." };
    }
    event.eventName = values.eventName.trim();
    event.eventDate = values.eventDate;
    event.eventTime = values.eventTime;
    event.location = values.location.trim();
    event.registrationDeadline = values.registrationDeadline;
    event.vendorId = values.vendorId;
    saveData(KEYS.events, events);
    return { success: true, message: "The event has been updated.", event: event };
  }

  const newEvent = {
    eventId: generateId("EVT", events, "eventId"),
    eventName: values.eventName.trim(),
    eventDate: values.eventDate,
    eventTime: values.eventTime,
    location: values.location.trim(),
    registrationDeadline: values.registrationDeadline,
    vendorId: values.vendorId,
    status: "Open",
    createdAt: new Date().toISOString()
  };
  events.push(newEvent);
  saveData(KEYS.events, events);
  return { success: true, message: "A new team meal is open for registration.", event: newEvent };
}

// HR can set any status. A vendor can only confirm or complete its own orders.
function updateEventStatus(eventId, newStatus) {
  if (!canDo("updateOrderStatus")) {
    return { success: false, message: "You are not allowed to change the order status." };
  }
  const user = getCurrentUser();
  const events = getData(KEYS.events);
  const event = events.find(function (item) {
    return item.eventId === eventId;
  });
  if (!event) {
    return { success: false, message: "Event not found." };
  }
  if (user.role === "vendor") {
    if (event.vendorId !== user.id) {
      return { success: false, message: "This order is not assigned to you." };
    }
    if (newStatus !== "Confirmed" && newStatus !== "Completed") {
      return { success: false, message: "Vendors can only confirm or complete an order." };
    }
  }
  event.status = newStatus;
  saveData(KEYS.events, events);
  return { success: true, message: "Order status changed to " + newStatus + "." };
}

// ----- Actions: meal preferences -----

function validatePreference(values) {
  const errors = {};
  if (!values.mealCategory) {
    errors.mealCategory = "Please choose your meal category.";
  }
  if (values.dietaryRestrictions.includes("Other") && values.additionalNotes.trim() === "") {
    errors.additionalNotes = "You selected Other. Please describe your requirement.";
  }
  return errors;
}

// One preference per employee per event. Saving again updates the same record.
function saveMealPreference(eventId, values) {
  if (!canDo("registerMealPreference")) {
    return { success: false, message: "Only employees can register a meal preference." };
  }
  const event = findEvent(eventId);
  if (!event) {
    return { success: false, message: "Event not found." };
  }
  if (!isRegistrationOpen(event)) {
    return { success: false, message: "Registration for this event has closed." };
  }

  const user = getCurrentUser();
  const preferences = getData(KEYS.preferences);
  const existing = preferences.find(function (item) {
    return item.eventId === eventId && item.employeeId === user.id;
  });

  if (existing) {
    existing.mealCategory = values.mealCategory;
    existing.dietaryRestrictions = values.dietaryRestrictions;
    existing.additionalNotes = values.additionalNotes.trim();
    existing.submittedAt = new Date().toISOString();
  } else {
    preferences.push({
      preferenceId: generateId("PREF", preferences, "preferenceId"),
      eventId: eventId,
      employeeId: user.id,
      mealCategory: values.mealCategory,
      dietaryRestrictions: values.dietaryRestrictions,
      additionalNotes: values.additionalNotes.trim(),
      submittedAt: new Date().toISOString()
    });
  }

  saveData(KEYS.preferences, preferences);
  return { success: true, message: "Your meal preference has been recorded.", updated: Boolean(existing) };
}

function getMyPreference(eventId) {
  const user = getCurrentUser();
  return getData(KEYS.preferences).find(function (item) {
    return item.eventId === eventId && item.employeeId === user.id;
  });
}
