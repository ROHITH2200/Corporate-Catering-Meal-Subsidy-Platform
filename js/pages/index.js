// index.js - Role selection / demo login page

const HR_USERS = [{ id: "HR001", name: "Meera Kapoor" }];

// Fill the employee dropdown
const employeeSelect = document.getElementById("employeeSelect");
getData(KEYS.employees).forEach(function (employee) {
  const option = document.createElement("option");
  option.value = employee.employeeId;
  option.textContent = employee.name + " (" + employee.department + ")";
  employeeSelect.appendChild(option);
});

// Fill the vendor dropdown (only active vendors)
const vendorSelect = document.getElementById("vendorSelect");
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

// Show a message if the user was sent back from a page of another role
if (getUrlParam("denied") === "1") {
  document.getElementById("deniedMessage").classList.remove("d-none");
}

document.getElementById("employeeBtn").addEventListener("click", function () {
  const employee = findEmployee(employeeSelect.value);
  setCurrentUser({ role: "employee", id: employee.employeeId, name: employee.name });
  window.location.href = "employee/dashboard.html";
});

document.getElementById("hrBtn").addEventListener("click", function () {
  const hrUser = HR_USERS.find(function (user) {
    return user.id === document.getElementById("hrSelect").value;
  });
  setCurrentUser({ role: "hr", id: hrUser.id, name: hrUser.name });
  window.location.href = "hr/dashboard.html";
});

document.getElementById("vendorBtn").addEventListener("click", function () {
  const vendor = findVendor(vendorSelect.value);
  setCurrentUser({ role: "vendor", id: vendor.vendorId, name: vendor.vendorName });
  window.location.href = "vendor/dashboard.html";
});

document.getElementById("resetBtn").addEventListener("click", function () {
  showConfirm(
    {
      title: "Reset demo data?",
      message: "All expenses, events and meal preferences you added will be removed and the sample data will be loaded again.",
      confirmText: "Reset data",
      confirmClass: "btn-danger"
    },
    function () {
      resetDemoData();
      showToast("Demo data has been reset.");
    }
  );
});
