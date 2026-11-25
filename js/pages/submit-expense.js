// submit-expense.js

const user = requireRole("employee");

if (user) {
  renderNavbar("submit-expense");

  const employee = findEmployee(user.id);
  document.getElementById("employeeName").value = employee.name;
  document.getElementById("employeeId").value = employee.employeeId;

  // Default date is today, and future dates are not allowed
  const dateInput = document.getElementById("expenseDate");
  dateInput.value = getToday();
  dateInput.max = getToday();

  showSubsidyBox();

  const form = document.getElementById("expenseForm");
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const values = {
      expenseDate: form.expenseDate.value,
      amount: form.amount.value,
      category: form.category.value,
      description: form.description.value,
      receiptReference: form.receiptReference.value
    };

    const errors = validateExpense(values);
    showFormErrors(form, errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const result = submitExpense(values);
    if (!result.success) {
      showToast(result.message, "error");
      return;
    }

    // Success: show confirmation and clear the form
    const successBox = document.getElementById("successBox");
    document.getElementById("successDetails").textContent =
      result.expense.expenseId + ": " + formatRupees(result.expense.amount) + " for " + result.expense.category + " on " + formatDate(result.expense.expenseDate) + ". Status: Pending.";
    successBox.classList.remove("d-none");
    successBox.scrollIntoView({ behavior: "smooth", block: "center" });

    form.reset();
    dateInput.value = getToday();
    showFormErrors(form, {});
    showSubsidyBox();
  });

  // Clear error messages when the form is reset
  form.addEventListener("reset", function () {
    setTimeout(function () {
      showFormErrors(form, {});
      dateInput.value = getToday();
    }, 0);
  });
}

function showSubsidyBox() {
  const summary = getSubsidySummary(user.id);
  const pendingTotal = getData(KEYS.expenses)
    .filter(function (expense) {
      return expense.employeeId === user.id && expense.status === "Pending";
    })
    .reduce(function (total, expense) {
      return total + expense.amount;
    }, 0);

  document.getElementById("subsidyBox").innerHTML = `
    ${mealCard(findEmployee(user.id), summary)}
    <p class="small text-body-secondary mt-3 mb-0">
      <i class="bi bi-info-circle" aria-hidden="true"></i>
      ${formatRupees(pendingTotal)} is waiting for HR review. It will count only after approval.
    </p>`;
}
