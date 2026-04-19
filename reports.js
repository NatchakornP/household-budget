const SUPABASE_URL = "https://dbqprjqpjnxxsdsnazag.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicXByanFwam54eHNkc25hemFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTM4MDksImV4cCI6MjA5MjA4OTgwOX0.i2vB5P0_6DMkqVmD7MjuTpFbXa6Fxjg6xEbZSiG-WYY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const logoutBtn = document.getElementById("logoutBtn");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");

const reportTotalExpenses = document.getElementById("reportTotalExpenses");
const reportTotalIncome = document.getElementById("reportTotalIncome");
const reportTotalSaved = document.getElementById("reportTotalSaved");
const reportBalance = document.getElementById("reportBalance");

const expenseBudgetBody = document.getElementById("expenseBudgetBody");
const editBudgetsBtn = document.getElementById("editBudgetsBtn");
const incomeBySourceBody = document.getElementById("incomeBySourceBody");
const savingsByGoalBody = document.getElementById("savingsByGoalBody");

const reportMonth = document.getElementById("reportMonth");

const moneyFlowChartEl = document.getElementById("moneyFlowChart");
let moneyFlowChart = null;


const manageCategoriesBtn = document.getElementById("manageCategoriesBtn");
const categoryModal = document.getElementById("categoryModal");
const closeCategoryModalBtn = document.getElementById("closeCategoryModalBtn");
const categoryModalForm = document.getElementById("categoryModalForm");
const categoryInputs = document.getElementById("categoryInputs");

const budgetModal = document.getElementById("budgetModal");
const closeBudgetModalBtn = document.getElementById("closeBudgetModalBtn");
const budgetModalForm = document.getElementById("budgetModalForm");
const budgetInputs = document.getElementById("budgetInputs");

let currentCategories = [];
let currentBudgets = [];
const expenseTrendChartEl = document.getElementById("expenseTrendChart");
let expenseTrendChart = null;




function money(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "DKK"
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function getCurrentUser() {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    return null;
  }

  const { data, error } = await supabaseClient.auth.getUser();

  if (error) {
    console.error(error);
    return null;
  }

  return data.user;
}

async function initReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }
}

function renderMoneyFlowChart(expenses, savings) {
  const expenseTotals = getExpensesByCategory(expenses);
  const savingsTotal = savings.reduce((sum, row) => {
    return sum + Number(row.amount || 0);
  }, 0);

  const labels = Object.keys(expenseTotals);
  const values = Object.values(expenseTotals);

  if (savingsTotal > 0) {
    labels.push("Savings");
    values.push(savingsTotal);
  }

  if (moneyFlowChart) {
    moneyFlowChart.destroy();
  }

  moneyFlowChart = new Chart(moneyFlowChartEl, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#2563eb",
            "#16a34a",
            "#f59e0b",
            "#dc2626",
            "#7c3aed",
            "#0891b2",
            "#db2777",
            "#65a30d",
            "#9333ea",
            "#ea580c"
          ]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${money(context.raw)}`;
            }
          }
        }
      }
    }
  });
}

function getPreviousMonths(count) {
  const selectedMonth = reportMonth.value || getCurrentMonthValue();
  const [year, month] = selectedMonth.split("-").map(Number);
  const months = [];

  for (let index = count - 1; index >= 0; index--) {
    const date = new Date(year, month - 1 - index, 1);
    const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    months.push(monthValue);
  }

  return months;
}

function formatMonthLabel(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric"
  }).format(date);
}

function renderExpenseTrendChart(months, expenses) {
  const totalsByMonth = Object.fromEntries(months.map((month) => [month, 0]));

  expenses.forEach((expense) => {
    const month = String(expense.date || "").slice(0, 7);

    if (month in totalsByMonth) {
      totalsByMonth[month] += Number(expense.amount || 0);
    }
  });

  if (expenseTrendChart) {
    expenseTrendChart.destroy();
  }

  expenseTrendChart = new Chart(expenseTrendChartEl, {
    type: "bar",
    data: {
      labels: months.map(formatMonthLabel),
      datasets: [
        {
          label: "Expenses",
          data: months.map((month) => totalsByMonth[month]),
          backgroundColor: "#2563eb"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label(context) {
              return money(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback(value) {
              return money(value);
            }
          }
        }
      }
    }
  });
}


function openCategoryModal() {
  categoryInputs.innerHTML = currentCategories.map((category) => `
    <div class="category-input-row">
      <label for="category-${category.id}">${escapeHtml(category.name)}</label>
      <input
        id="category-${category.id}"
        name="${category.id}"
        value="${escapeHtml(category.name)}"
        required
      />
      <button
        type="button"
        class="danger"
        onclick="deleteCategoryIfUnused('${category.id}', '${escapeHtml(category.name)}')"
      >
        Delete
      </button>
    </div>
  `).join("");

  categoryModal.classList.remove("hidden");
}

async function saveCategoryChanges(e) {
  e.preventDefault();

  const form = new FormData(categoryModalForm);

  for (const category of currentCategories) {
    const newName = String(form.get(category.id) || "").trim();
    const oldName = category.name;

    if (!newName || newName === oldName) {
      continue;
    }

    const { error: categoryError } = await supabaseClient
      .from("expense_categories")
      .update({ name: newName })
      .eq("id", category.id);

    if (categoryError) {
      alert(categoryError.message);
      return;
    }

    const { error: expensesError } = await supabaseClient
      .from("expenses")
      .update({ category: newName })
      .eq("category", oldName);

    if (expensesError) {
      alert(expensesError.message);
      return;
    }

    const { error: budgetsError } = await supabaseClient
      .from("category_budgets")
      .update({ category_name: newName })
      .eq("category_name", oldName);

    if (budgetsError) {
      alert(budgetsError.message);
      return;
    }
  }

  categoryModal.classList.add("hidden");
  await loadReports();
}

async function deleteCategoryIfUnused(id, name) {
  const [expensesRes, budgetsRes] = await Promise.all([
    supabaseClient
      .from("expenses")
      .select("id")
      .eq("category", name)
      .limit(1),

    supabaseClient
      .from("category_budgets")
      .select("id")
      .eq("category_name", name)
      .limit(1)
  ]);

  if (expensesRes.error) {
    alert(expensesRes.error.message);
    return;
  }

  if (budgetsRes.error) {
    alert(budgetsRes.error.message);
    return;
  }

  if ((expensesRes.data || []).length > 0 || (budgetsRes.data || []).length > 0) {
    alert("This category is already used. Rename it instead.");
    return;
  }

  if (!confirm(`Delete category "${name}"?`)) return;

  const { error } = await supabaseClient
    .from("expense_categories")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  categoryModal.classList.add("hidden");
await loadReports();

}


function openBudgetModal() {
  const budgetByCategory = Object.fromEntries(
    currentBudgets.map((budget) => [budget.category_name, Number(budget.budget_amount || 0)])
  );

  budgetInputs.innerHTML = currentCategories.map((category) => `
    <div class="budget-input-row">
      <label for="budget-${category.id}">${escapeHtml(category.name)}</label>
      <input
        id="budget-${category.id}"
        name="${escapeHtml(category.name)}"
        type="number"
        inputmode="decimal"
        step="0.01"
        min="0"
        value="${budgetByCategory[category.name] ?? ""}"
        placeholder="No budget"
      />
    </div>
  `).join("");

  budgetModal.classList.remove("hidden");
}

async function saveBudgets(e) {
  e.preventDefault();

  const user = await getCurrentUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const selectedMonth = reportMonth.value || getCurrentMonthValue();
  const form = new FormData(budgetModalForm);
  const payloads = [];

  currentCategories.forEach((category) => {
    const rawValue = form.get(category.name);

    if (rawValue === null || rawValue === "") {
      return;
    }

    payloads.push({
      category_name: category.name,
      month: selectedMonth,
      budget_amount: Number(rawValue),
      user_id: user.id
    });
  });

  if (payloads.length === 0) {
    budgetModal.classList.add("hidden");
    return;
  }

  const { error } = await supabaseClient
    .from("category_budgets")
    .upsert(payloads, {
      onConflict: "category_name,month"
    });

  if (error) {
    alert(error.message);
    return;
  }

  budgetModal.classList.add("hidden");
  await loadReports();
}


function getExpensesByCategory(expenses) {
  const totals = {};

  expenses.forEach((expense) => {
    const category = expense.category || "Uncategorized";
    totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
  });

  return totals;
}

function getIncomeBySource(income) {
  const totals = {};

  income.forEach((row) => {
    const source = row.source || "Unknown";
    totals[source] = (totals[source] || 0) + Number(row.amount || 0);
  });

  return totals;
}

function getSavingsByGoal(savings, goalsMap) {
  const totals = {};

  savings.forEach((row) => {
    const goal = goalsMap[row.goal_id]?.name || "Unknown";
    totals[goal] = (totals[goal] || 0) + Number(row.amount || 0);
  });

  return totals;
}


async function loadReports() {
  const selectedMonth = reportMonth.value || getCurrentMonthValue();
  const nextMonth = getNextMonthValue(selectedMonth);

  const startDate = `${selectedMonth}-01`;
  const endDate = `${nextMonth}-01`;
  const trendMonths = getPreviousMonths(4);
const trendStartDate = `${trendMonths[0]}-01`;

  const [
  expensesRes,
  incomeRes,
  monthlySavingsRes,
  allSavingsRes,
  goalsRes,
  categoriesRes,
  budgetsRes,
  trendExpensesRes
] = await Promise.all([

    supabaseClient
      .from("expenses")
      .select("amount,category,date")
      .gte("date", startDate)
      .lt("date", endDate),

    supabaseClient
      .from("income")
        .select("amount,source,date")
      .gte("date", startDate)
      .lt("date", endDate),

    supabaseClient
  .from("savings_contributions")
  .select("amount,date,goal_id")
  .gte("date", startDate)
  .lt("date", endDate),

supabaseClient
  .from("savings_contributions")
  .select("amount,goal_id"),


    supabaseClient
    .from("savings_goals")
    .select("id,name,target_amount"),

    supabaseClient
  .from("expense_categories")
  .select("id,name")
  .order("name", { ascending: true }),

supabaseClient
  .from("category_budgets")
  .select("category_name,budget_amount")
  .eq("month", selectedMonth),

  supabaseClient
  .from("expenses")
  .select("amount,date")
  .gte("date", trendStartDate)
  .lt("date", endDate)

  ]);

  if (expensesRes.error) {
    alert(expensesRes.error.message);
    return;
  }

  if (incomeRes.error) {
    alert(incomeRes.error.message);
    return;
  }

  if (monthlySavingsRes.error) {
  alert(monthlySavingsRes.error.message);
  return;
}

if (allSavingsRes.error) {
  alert(allSavingsRes.error.message);
  return;
}

  if (goalsRes.error) {
  alert(goalsRes.error.message);
  return;
}

if (categoriesRes.error) {
  alert(categoriesRes.error.message);
  return;
}

if (budgetsRes.error) {
  alert(budgetsRes.error.message);
  return;
}

if (trendExpensesRes.error) {
  alert(trendExpensesRes.error.message);
  return;
}



  const expenses = expensesRes.data || [];
const income = incomeRes.data || [];
const monthlySavings = monthlySavingsRes.data || [];
const allSavings = allSavingsRes.data || [];
const goals = goalsRes.data || [];
const goalsMap = Object.fromEntries(goals.map((goal) => [goal.id, goal]));
const categories = categoriesRes.data || [];
const budgets = budgetsRes.data || [];
const trendExpenses = trendExpensesRes.data || [];

renderMoneyFlowChart(expenses, monthlySavings);
renderExpenseTrendChart(trendMonths, trendExpenses);
currentCategories = categories;
currentBudgets = budgets;




  const totalExpenses = expenses.reduce((sum, expense) => {
    return sum + Number(expense.amount || 0);
  }, 0);

  const totalIncome = income.reduce((sum, row) => {
    return sum + Number(row.amount || 0);
  }, 0);

  const totalSaved = monthlySavings.reduce((sum, row) => {
  return sum + Number(row.amount || 0);
}, 0);

  const balance = totalIncome - totalExpenses - totalSaved;

  reportTotalIncome.textContent = money(totalIncome);
  reportTotalExpenses.textContent = money(totalExpenses);
  reportTotalSaved.textContent = money(totalSaved);
  reportBalance.textContent = money(balance);

  const totalsByCategory = getExpensesByCategory(expenses);
const budgetByCategory = Object.fromEntries(
  budgets.map((budget) => [budget.category_name, Number(budget.budget_amount || 0)])
);

expenseBudgetBody.innerHTML = categories.map((category) => {
  const spent = totalsByCategory[category.name] || 0;
  const budget = budgetByCategory[category.name];
  const hasBudget = budget !== undefined;
  const remaining = hasBudget ? budget - spent : null;

  let rowClass = "budget-row-none";

if (hasBudget) {
  const warningLimit = Number(budget) * 0.25;

  if (remaining < 0) {
    rowClass = "budget-row-over";
  } else if (remaining <= warningLimit) {
    rowClass = "budget-row-warning";
  } else {
    rowClass = "budget-row-good";
  }

}


  return `
    <tr class="${rowClass}">
      <td data-label="Category">${escapeHtml(category.name)}</td>
      <td data-label="Total spent">${money(spent)}</td>
      <td data-label="Budget">${hasBudget ? money(budget) : "No budget"}</td>
      <td data-label="Remaining">${hasBudget ? money(remaining) : "-"}</td>
    </tr>
  `;
}).join("");


    const incomeBySource = getIncomeBySource(income);

incomeBySourceBody.innerHTML = Object.entries(incomeBySource)
  .sort((a, b) => b[1] - a[1])
  .map(([source, total]) => `
    <tr>
      <td data-label="Source">${escapeHtml(source)}</td>
      <td data-label="Total">${money(total)}</td>
    </tr>
  `)
  .join("");

  const monthlySavingsByGoal = getSavingsByGoal(monthlySavings, goalsMap);
const totalSavingsByGoal = getSavingsByGoal(allSavings, goalsMap);

savingsByGoalBody.innerHTML = goals.map((goal) => {
  const thisMonth = monthlySavingsByGoal[goal.name] || 0;
  const totalSavedForGoal = totalSavingsByGoal[goal.name] || 0;
  const target = Number(goal.target_amount || 0);
  const progress = target > 0 ? Math.min((totalSavedForGoal / target) * 100, 100) : 0;

  return `
    <tr>
      <td data-label="Goal">${escapeHtml(goal.name)}</td>
      <td data-label="This month">${money(thisMonth)}</td>
      <td data-label="Total saved">${money(totalSavedForGoal)}</td>
      <td data-label="Target">${money(target)}</td>
      <td data-label="Progress">${progress.toFixed(0)}%</td>
    </tr>
  `;
}).join("");



}


async function initReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  reportMonth.value = getCurrentMonthValue();
  await loadReports();

}

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getNextMonthValue(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const nextMonthDate = new Date(year, month, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, "0");

  return `${nextYear}-${nextMonth}`;
}


async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

manageCategoriesBtn.addEventListener("click", openCategoryModal);

closeCategoryModalBtn.addEventListener("click", () => {
  categoryModal.classList.add("hidden");
});

categoryModalForm.addEventListener("submit", saveCategoryChanges);

editBudgetsBtn.addEventListener("click", openBudgetModal);

closeBudgetModalBtn.addEventListener("click", () => {
  budgetModal.classList.add("hidden");
});

budgetModalForm.addEventListener("submit", saveBudgets);


mobileMenuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
});

reportMonth.addEventListener("change", loadReports);


logoutBtn.addEventListener("click", logout);
mobileLogoutBtn.addEventListener("click", logout);

window.deleteCategoryIfUnused = deleteCategoryIfUnused;

initReportsPage().catch(console.error);
