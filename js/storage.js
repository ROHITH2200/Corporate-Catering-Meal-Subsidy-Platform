// storage.js
// Everything that reads or writes localStorage is in this file.
// Key names follow the PRD (section 10.6).

const KEYS = {
  employees: "mm_employees",
  expenses: "mm_expenses",
  events: "mm_catering_events",
  preferences: "mm_meal_preferences",
  vendors: "mm_vendors",
  currentUser: "mm_current_user"
};

// Read a list from localStorage. Returns an empty list if nothing is saved.
function getData(key) {
  const saved = localStorage.getItem(key);
  if (saved === null) {
    return [];
  }
  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error("Could not read " + key, error);
    return [];
  }
}

// Save a list to localStorage
function saveData(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

// Load the sample data only if the app is opened for the first time
function loadSampleDataIfEmpty() {
  if (localStorage.getItem(KEYS.employees) !== null) {
    return;
  }
  const sample = createSampleData();
  saveData(KEYS.employees, sample.employees);
  saveData(KEYS.vendors, sample.vendors);
  saveData(KEYS.expenses, sample.expenses);
  saveData(KEYS.events, sample.cateringEvents);
  saveData(KEYS.preferences, sample.mealPreferences);
}

// Remove all saved data and load the sample data again
function resetDemoData() {
  Object.values(KEYS).forEach(function (key) {
    localStorage.removeItem(key);
  });
  loadSampleDataIfEmpty();
}

// ----- Current demo user -----

function getCurrentUser() {
  const saved = localStorage.getItem(KEYS.currentUser);
  if (saved === null) {
    return null;
  }
  try {
    return JSON.parse(saved);
  } catch (error) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(KEYS.currentUser, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(KEYS.currentUser);
}

// ----- Find single records -----

function findEmployee(employeeId) {
  return getData(KEYS.employees).find(function (employee) {
    return employee.employeeId === employeeId;
  });
}

function findVendor(vendorId) {
  return getData(KEYS.vendors).find(function (vendor) {
    return vendor.vendorId === vendorId;
  });
}

function findEvent(eventId) {
  return getData(KEYS.events).find(function (event) {
    return event.eventId === eventId;
  });
}

function findExpense(expenseId) {
  return getData(KEYS.expenses).find(function (expense) {
    return expense.expenseId === expenseId;
  });
}

// Makes the next ID, for example "EXP008" -> "EXP009"
function generateId(prefix, list, idField) {
  let highest = 0;
  list.forEach(function (item) {
    const number = parseInt(item[idField].replace(prefix, ""), 10);
    if (number > highest) {
      highest = number;
    }
  });
  return prefix + String(highest + 1).padStart(3, "0");
}

// Run once when any page loads
loadSampleDataIfEmpty();
