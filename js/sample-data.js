// sample-data.js
// Sample employees, vendors, expenses, events and meal preferences.
// This data is saved to localStorage the first time the app opens (see storage.js).
// Dates are made relative to today so the demo always shows "this month".

// Adds a leading zero: 5 -> "05"
function pad(number) {
  return String(number).padStart(2, "0");
}

// Returns a date as "YYYY-MM-DD", moved by some number of days from today
function dateFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

// Returns a date in the current month. If the day has not come yet, today is used.
function dateThisMonth(day) {
  const today = new Date();
  const safeDay = Math.min(day, today.getDate());
  return today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(safeDay);
}

// Returns a date some days before today, but never before the 1st of this month
function daysAgoThisMonth(days) {
  const dayOfMonth = new Date().getDate() - days;
  return dateThisMonth(Math.max(1, dayOfMonth));
}

// Returns a date in the previous month
function dateLastMonth(day) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(day);
}

function createSampleData() {
  const employees = [
    { employeeId: "EMP001", name: "Aarav Sharma", email: "aarav@example.com", department: "Engineering", monthlySubsidyLimit: 3000 },
    { employeeId: "EMP002", name: "Priya Nair", email: "priya@example.com", department: "Marketing", monthlySubsidyLimit: 2500 },
    { employeeId: "EMP003", name: "Rohan Mehta", email: "rohan@example.com", department: "Finance", monthlySubsidyLimit: 3000 },
    { employeeId: "EMP004", name: "Sneha Iyer", email: "sneha@example.com", department: "Design", monthlySubsidyLimit: 2000 },
    { employeeId: "EMP005", name: "Kabir Singh", email: "kabir@example.com", department: "Sales", monthlySubsidyLimit: 3500 }
  ];

  const vendors = [
    { vendorId: "VEN001", vendorName: "Annapoorna Caterers", contactPerson: "Ramesh Kulkarni", phone: "+91 90000 11111", email: "orders@annapoorna.example.com", status: "Active" },
    { vendorId: "VEN002", vendorName: "Green Leaf Kitchen", contactPerson: "Fatima Shaikh", phone: "+91 90000 22222", email: "hello@greenleaf.example.com", status: "Active" },
    { vendorId: "VEN003", vendorName: "Spice Route Foods", contactPerson: "Joseph Dsouza", phone: "+91 90000 33333", email: "contact@spiceroute.example.com", status: "Inactive" }
  ];

  const expenses = [
    { expenseId: "EXP001", employeeId: "EMP001", expenseDate: dateThisMonth(2), amount: 850, category: "Team Meal", description: "Sprint planning lunch with the team", receiptReference: "receipt-001", status: "Approved", rejectionReason: "", submittedAt: dateThisMonth(2) + "T14:10:00" },
    { expenseId: "EXP002", employeeId: "EMP001", expenseDate: dateThisMonth(5), amount: 1250, category: "Dinner", description: "Late night release support dinner", receiptReference: "receipt-002", status: "Approved", rejectionReason: "", submittedAt: dateThisMonth(5) + "T22:45:00" },
    { expenseId: "EXP003", employeeId: "EMP001", expenseDate: daysAgoThisMonth(1), amount: 320, category: "Lunch", description: "Office lunch", receiptReference: "receipt-003", status: "Pending", rejectionReason: "", submittedAt: daysAgoThisMonth(1) + "T13:30:00" },
    { expenseId: "EXP004", employeeId: "EMP002", expenseDate: dateThisMonth(3), amount: 450, category: "Lunch", description: "Client visit lunch", receiptReference: "receipt-004", status: "Approved", rejectionReason: "", submittedAt: dateThisMonth(3) + "T15:00:00" },
    { expenseId: "EXP005", employeeId: "EMP002", expenseDate: dateThisMonth(8), amount: 980, category: "Dinner", description: "Dinner during campaign launch", receiptReference: "", status: "Rejected", rejectionReason: "Receipt is missing. Please add the receipt reference.", submittedAt: dateThisMonth(8) + "T21:20:00" },
    { expenseId: "EXP006", employeeId: "EMP003", expenseDate: daysAgoThisMonth(2), amount: 210, category: "Breakfast", description: "Breakfast before audit meeting", receiptReference: "receipt-006", status: "Pending", rejectionReason: "", submittedAt: daysAgoThisMonth(2) + "T09:15:00" },
    { expenseId: "EXP007", employeeId: "EMP004", expenseDate: daysAgoThisMonth(1), amount: 640, category: "Team Meal", description: "Design review lunch", receiptReference: "receipt-007", status: "Pending", rejectionReason: "", submittedAt: daysAgoThisMonth(0) + "T09:40:00" },
    { expenseId: "EXP008", employeeId: "EMP005", expenseDate: dateLastMonth(24), amount: 1500, category: "Dinner", description: "Sales team dinner", receiptReference: "receipt-008", status: "Approved", rejectionReason: "", submittedAt: dateLastMonth(24) + "T22:00:00" }
  ];

  const cateringEvents = [
    { eventId: "EVT001", eventName: "Friday Team Lunch", eventDate: dateFromToday(4), eventTime: "13:00", location: "Office Cafeteria, 3rd Floor", registrationDeadline: dateFromToday(2) + "T18:00", vendorId: "VEN001", status: "Open", createdAt: dateFromToday(-3) + "T10:00:00" },
    { eventId: "EVT002", eventName: "Quarterly Town Hall Dinner", eventDate: dateFromToday(10), eventTime: "19:30", location: "Main Conference Hall", registrationDeadline: dateFromToday(7) + "T17:00", vendorId: "VEN002", status: "Open", createdAt: dateFromToday(-1) + "T11:30:00" },
    { eventId: "EVT003", eventName: "Diwali Celebration Lunch", eventDate: dateFromToday(-12), eventTime: "12:30", location: "Office Terrace", registrationDeadline: dateFromToday(-14) + "T18:00", vendorId: "VEN001", status: "Completed", createdAt: dateFromToday(-25) + "T10:00:00" }
  ];

  const mealPreferences = [
    { preferenceId: "PREF001", eventId: "EVT001", employeeId: "EMP002", mealCategory: "Vegetarian", dietaryRestrictions: ["Dairy-free", "Nut allergy"], additionalNotes: "Please avoid dairy products.", submittedAt: dateFromToday(-2) + "T10:15:00" },
    { preferenceId: "PREF002", eventId: "EVT001", employeeId: "EMP003", mealCategory: "Non-vegetarian", dietaryRestrictions: [], additionalNotes: "", submittedAt: dateFromToday(-2) + "T11:00:00" },
    { preferenceId: "PREF003", eventId: "EVT001", employeeId: "EMP004", mealCategory: "Jain", dietaryRestrictions: ["Gluten-free"], additionalNotes: "No onion, garlic or root vegetables.", submittedAt: dateFromToday(-1) + "T09:40:00" },
    { preferenceId: "PREF004", eventId: "EVT003", employeeId: "EMP001", mealCategory: "Vegan", dietaryRestrictions: [], additionalNotes: "", submittedAt: dateFromToday(-15) + "T12:00:00" },
    { preferenceId: "PREF005", eventId: "EVT003", employeeId: "EMP005", mealCategory: "Non-vegetarian", dietaryRestrictions: ["Other"], additionalNotes: "Mild spice please.", submittedAt: dateFromToday(-15) + "T12:30:00" }
  ];

  return { employees, vendors, expenses, cateringEvents, mealPreferences };
}
