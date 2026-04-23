const SUPABASE_URL = "https://dbqprjqpjnxxsdsnazag.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicXByanFwam54eHNkc25hemFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTM4MDksImV4cCI6MjA5MjA4OTgwOX0.i2vB5P0_6DMkqVmD7MjuTpFbXa6Fxjg6xEbZSiG-WYY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APP_LOCALE = "en-US";

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


const editCategoriesBtn = document.getElementById("editCategoriesBtn");
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

const addGoalBtn = document.getElementById("addGoalBtn");
const editGoalsBtn = document.getElementById("editGoalsBtn");

const goalModal = document.getElementById("goalModal");
const closeGoalModalBtn = document.getElementById("closeGoalModalBtn");
const goalModalForm = document.getElementById("goalModalForm");

const editGoalsModal = document.getElementById("editGoalsModal");
const closeEditGoalsModalBtn = document.getElementById("closeEditGoalsModalBtn");
const editGoalsModalForm = document.getElementById("editGoalsModalForm");
const goalInputs = document.getElementById("goalInputs");
let currentGoals = [];

const exportMenuBtn = document.getElementById("exportMenuBtn");
const exportMenu = document.getElementById("exportMenu");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportZipBtn = document.getElementById("exportZipBtn");

const editSourcesBtn = document.getElementById("editSourcesBtn");
const sourceModal = document.getElementById("sourceModal");
const closeSourceModalBtn = document.getElementById("closeSourceModalBtn");
const sourceModalForm = document.getElementById("sourceModalForm");
const sourceInputs = document.getElementById("sourceInputs");
let currentSources = [];

const recurringExpensesBody = document.getElementById("recurringExpensesBody");
const addRecurringExpenseBtn = document.getElementById("addRecurringExpenseBtn");
const editRecurringExpensesBtn = document.getElementById("editRecurringExpensesBtn");

const recurringExpenseModal = document.getElementById("recurringExpenseModal");
const closeRecurringExpenseModalBtn = document.getElementById("closeRecurringExpenseModalBtn");
const recurringExpenseForm = document.getElementById("recurringExpenseForm");
const recurringCategorySelect = document.getElementById("recurringCategorySelect");

const editRecurringExpensesModal = document.getElementById("editRecurringExpensesModal");
const closeEditRecurringExpensesModalBtn = document.getElementById("closeEditRecurringExpensesModalBtn");
const recurringExpenseInputs = document.getElementById("recurringExpenseInputs");
let currentRecurringExpenses = [];




function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

async function exportBackupJson() {
  const [
    expensesRes,
    incomeRes,
    savingsRes,
    goalsRes,
    categoriesRes,
    sourcesRes,
    budgetsRes
  ] = await Promise.all([
    supabaseClient.from("expenses").select("*"),
    supabaseClient.from("income").select("*"),
    supabaseClient.from("savings_contributions").select("*"),
    supabaseClient.from("savings_goals").select("*"),
    supabaseClient.from("expense_categories").select("*"),
    supabaseClient.from("income_sources").select("*"),
    supabaseClient.from("category_budgets").select("*")
  ]);

  const responses = [
    expensesRes,
    incomeRes,
    savingsRes,
    goalsRes,
    categoriesRes,
    sourcesRes,
    budgetsRes
  ];

  const failed = responses.find((res) => res.error);

  if (failed) {
    alert(failed.error.message);
    return;
  }

  const backup = {
    exported_at: new Date().toISOString(),
    expenses: expensesRes.data || [],
    income: incomeRes.data || [],
    savings_contributions: savingsRes.data || [],
    savings_goals: goalsRes.data || [],
    expense_categories: categoriesRes.data || [],
    income_sources: sourcesRes.data || [],
    category_budgets: budgetsRes.data || []
  };

  const date = new Date().toISOString().slice(0, 10);

  downloadFile(
    `household-budget-backup-${date}.json`,
    JSON.stringify(backup, null, 2),
    "application/json"
  );

  exportMenu.classList.add("hidden");
}

function toCsv(rows) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);

  const escapeCsvValue = (value) => {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    )
  ];

  return lines.join("\n");
}

async function exportDataZip() {
  const [
    expensesRes,
    incomeRes,
    savingsRes,
    goalsRes,
    categoriesRes,
    sourcesRes,
    budgetsRes
  ] = await Promise.all([
    supabaseClient.from("expenses").select("*"),
    supabaseClient.from("income").select("*"),
    supabaseClient.from("savings_contributions").select("*"),
    supabaseClient.from("savings_goals").select("*"),
    supabaseClient.from("expense_categories").select("*"),
    supabaseClient.from("income_sources").select("*"),
    supabaseClient.from("category_budgets").select("*")
  ]);

  const responses = [
    expensesRes,
    incomeRes,
    savingsRes,
    goalsRes,
    categoriesRes,
    sourcesRes,
    budgetsRes
  ];

  const failed = responses.find((res) => res.error);

  if (failed) {
    alert(failed.error.message);
    return;
  }

  const zip = new JSZip();

  zip.file("expenses.csv", toCsv(expensesRes.data || []));
  zip.file("income.csv", toCsv(incomeRes.data || []));
  zip.file("savings_contributions.csv", toCsv(savingsRes.data || []));
  zip.file("savings_goals.csv", toCsv(goalsRes.data || []));
  zip.file("expense_categories.csv", toCsv(categoriesRes.data || []));
  zip.file("income_sources.csv", toCsv(sourcesRes.data || []));
  zip.file("category_budgets.csv", toCsv(budgetsRes.data || []));

  const blob = await zip.generateAsync({ type: "blob" });
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `household-budget-data-${date}.zip`;
  link.click();

  URL.revokeObjectURL(url);

  exportMenu.classList.add("hidden");
}


function money(value) {
  return new Intl.NumberFormat(APP_LOCALE, {
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

  return new Intl.DateTimeFormat(APP_LOCALE, {
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

    const confirmed = confirm(
  `Rename category "${oldName}" to "${newName}"? Existing expense records and budgets using this category will be updated.`
);

if (!confirmed) {
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
  trendExpensesRes,
  sourcesRes,
  recurringExpensesRes
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
    .lt("date", endDate),

    supabaseClient
    .from("income_sources")
    .select("id,name")
    .order("name", { ascending: true }),

    supabaseClient
    .from("recurring_expenses")
    .select("*")
    .order("next_due_date", { ascending: true }),


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

if (sourcesRes.error) {
  alert(sourcesRes.error.message);
  return;
}

if (recurringExpensesRes.error) {
  alert(recurringExpensesRes.error.message);
  return;
}





const expenses = expensesRes.data || [];
const income = incomeRes.data || [];
const monthlySavings = monthlySavingsRes.data || [];
const allSavings = allSavingsRes.data || [];
const goals = goalsRes.data || [];
currentGoals = goals;
const goalsMap = Object.fromEntries(goals.map((goal) => [goal.id, goal]));
const categories = categoriesRes.data || [];
const budgets = budgetsRes.data || [];
const trendExpenses = trendExpensesRes.data || [];
const sources = sourcesRes.data || [];
currentSources = sources;
const recurringExpenses = recurringExpensesRes.data || [];
currentRecurringExpenses = recurringExpenses;



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

  let progressEmoji = "🍂";

  if (progress >= 100) {
    progressEmoji = "✅";
  } else if (progress >= 51) {
    progressEmoji = "🔥";
  } else if (progress >= 11) {
    progressEmoji = "💪🏻";
  }

  return `
    <tr>
      <td data-label="Goal">${escapeHtml(goal.name)}</td>
      <td data-label="This month">${money(thisMonth)}</td>
      <td data-label="Total saved">${money(totalSavedForGoal)}</td>
      <td data-label="Target">${money(target)}</td>
      <td data-label="Progress">
        <div class="goal-progress">
          <div class="goal-progress-fill" style="width: ${progress}%;"></div>
          <span class="goal-progress-text">
  <span class="goal-progress-emoji">${progressEmoji}</span>
  <span class="goal-progress-percent">${progress.toFixed(0)}%</span>
</span>

        </div>
      </td>
    </tr>
  `;
}).join("");

if (recurringCategorySelect) {
  recurringCategorySelect.innerHTML = `
    <option value="">Category</option>
    ${categories.map((category) => `
      <option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>
    `).join("")}
  `;
}

recurringExpensesBody.innerHTML = recurringExpenses.map((row) => `
  <tr>
    <td data-label="Title">${escapeHtml(row.title)}</td>
    <td data-label="Amount">${money(row.amount)}</td>
    <td data-label="Category">${escapeHtml(row.category)}</td>
    <td data-label="Paid by">${escapeHtml(row.paid_by)}</td>
    <td data-label="Schedule">${formatRecurringSchedule(row.frequency, row.interval_count)}</td>
    <td data-label="Next due">${escapeHtml(row.next_due_date)}</td>
    <td data-label="Status">${row.active ? "Active" : "Paused"}</td>
  </tr>
`).join("");

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

function openGoalModal() {
  goalModalForm.reset();
  goalModal.classList.remove("hidden");
}

async function addGoalFromReports(e) {
  e.preventDefault();

  const user = await getCurrentUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const form = new FormData(goalModalForm);
  const payload = Object.fromEntries(form.entries());

  payload.user_id = user.id;
  payload.target_amount = Number(payload.target_amount);

  const { error } = await supabaseClient
    .from("savings_goals")
    .insert(payload);

  if (error) {
    alert(error.message);
    return;
  }

  goalModal.classList.add("hidden");
  await loadReports();
}

function openEditGoalsModal() {
  goalInputs.innerHTML = currentGoals.map((goal) => `
    <div class="goal-input-row">
      <label for="goal-${goal.id}">${escapeHtml(goal.name)}</label>
      <input
        id="goal-${goal.id}"
        name="${goal.id}"
        value="${escapeHtml(goal.name)}"
        data-target="${Number(goal.target_amount || 0)}"
        required
      />
      <input
        name="target-${goal.id}"
        type="number"
        inputmode="decimal"
        step="0.01"
        min="0"
        value="${Number(goal.target_amount || 0)}"
        placeholder="Target"
        required
      />
      <button
        type="button"
        class="danger"
        onclick="deleteGoalIfUnused('${goal.id}', '${escapeHtml(goal.name)}')"
      >
        Delete
      </button>
    </div>
  `).join("");

  editGoalsModal.classList.remove("hidden");
}

async function saveGoalChanges(e) {
  e.preventDefault();

  const form = new FormData(editGoalsModalForm);

  for (const goal of currentGoals) {
    const newName = String(form.get(goal.id) || "").trim();
    const newTarget = Number(form.get(`target-${goal.id}`) || 0);

    const oldName = goal.name;
    const oldTarget = Number(goal.target_amount || 0);

    if (!newName) {
      alert("Goal name cannot be empty.");
      return;
    }

    if (newName === oldName && newTarget === oldTarget) {
      continue;
    }

    if (newName !== oldName) {
  const confirmed = confirm(
    `Rename goal "${oldName}" to "${newName}"? Existing savings records will stay linked to this renamed goal.`
  );

  if (!confirmed) {
    continue;
  }
}

    const { error } = await supabaseClient
      .from("savings_goals")
      .update({
        name: newName,
        target_amount: newTarget
      })
      .eq("id", goal.id);

    if (error) {
      alert(error.message);
      return;
    }
  }

  editGoalsModal.classList.add("hidden");
  await loadReports();
}

async function deleteGoalIfUnused(id, name) {
  const { data, error } = await supabaseClient
    .from("savings_contributions")
    .select("id")
    .eq("goal_id", id)
    .limit(1);

  if (error) {
    alert(error.message);
    return;
  }

  if ((data || []).length > 0) {
    alert("This goal already has savings. Edit it instead.");
    return;
  }

  if (!confirm(`Delete goal "${name}"?`)) return;

  const { error: deleteError } = await supabaseClient
    .from("savings_goals")
    .delete()
    .eq("id", id);

  if (deleteError) {
    alert(deleteError.message);
    return;
  }

  await loadReports();
  openEditGoalsModal();
}

function openSourceModal() {
  sourceInputs.innerHTML = currentSources.map((source) => `
    <div class="category-input-row">
      <label for="source-${source.id}">${escapeHtml(source.name)}</label>
      <input
        id="source-${source.id}"
        name="${source.id}"
        value="${escapeHtml(source.name)}"
        required
      />
      <button
        type="button"
        class="danger"
        onclick="deleteSourceIfUnused('${source.id}', '${escapeHtml(source.name)}')"
      >
        Delete
      </button>
    </div>
  `).join("");

  sourceModal.classList.remove("hidden");
}

async function saveSourceChanges(e) {
  e.preventDefault();

  const form = new FormData(sourceModalForm);

  for (const source of currentSources) {
    const newName = String(form.get(source.id) || "").trim();
    const oldName = source.name;

    if (!newName || newName === oldName) {
      continue;
    }

    const confirmed = confirm(
      `Rename source "${oldName}" to "${newName}"? Existing income records using this source will be updated.`
    );

    if (!confirmed) {
      continue;
    }

    const { error: sourceError } = await supabaseClient
      .from("income_sources")
      .update({ name: newName })
      .eq("id", source.id);

    if (sourceError) {
      alert(sourceError.message);
      return;
    }

    const { error: incomeError } = await supabaseClient
      .from("income")
      .update({ source: newName })
      .eq("source", oldName);

    if (incomeError) {
      alert(incomeError.message);
      return;
    }
  }

  sourceModal.classList.add("hidden");
  await loadReports();
}

async function deleteSourceIfUnused(id, name) {
  const { data, error } = await supabaseClient
    .from("income")
    .select("id")
    .eq("source", name)
    .limit(1);

  if (error) {
    alert(error.message);
    return;
  }

  if ((data || []).length > 0) {
    alert("This source is already used. Rename it instead.");
    return;
  }

  if (!confirm(`Delete source "${name}"?`)) return;

  const { error: deleteError } = await supabaseClient
    .from("income_sources")
    .delete()
    .eq("id", id);

  if (deleteError) {
    alert(deleteError.message);
    return;
  }

  sourceModal.classList.add("hidden");
  await loadReports();
}

function openRecurringExpenseModal() {
  recurringExpenseForm.reset();
  recurringExpenseModal.classList.remove("hidden");
}

function openRecurringExpenseModal() {
  recurringExpenseForm.reset();
  recurringExpenseModal.classList.remove("hidden");
}

async function addRecurringExpense(e) {
  e.preventDefault();

  const user = await getCurrentUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const form = new FormData(recurringExpenseForm);
  const payload = Object.fromEntries(form.entries());

  payload.user_id = user.id;
  payload.amount = Number(payload.amount);
  payload.interval_count = Number(payload.interval_count);
  payload.next_due_date = payload.start_date;
  payload.active = true;

  const { error } = await supabaseClient
    .from("recurring_expenses")
    .insert(payload);

  if (error) {
    alert(error.message);
    return;
  }

  recurringExpenseModal.classList.add("hidden");
  await loadReports();
}

function formatRecurringSchedule(frequency, intervalCount) {
  const count = Number(intervalCount || 1);

  if (frequency === "weekly") {
    return count === 1 ? "Weekly" : `Every ${count} weeks`;
  }

  if (frequency === "monthly") {
    return count === 1 ? "Monthly" : `Every ${count} months`;
  }

  return `${count} ${frequency}`;
}


function openEditRecurringExpensesModal() {
  recurringExpenseInputs.innerHTML = currentRecurringExpenses.map((row) => `
    <div class="recurring-input-row">
      <input value="${escapeHtml(row.title)}" disabled />
      <input value="${money(row.amount)}" disabled />
      <input value="${formatRecurringSchedule(row.frequency, row.interval_count)}" disabled />

      <button
        type="button"
        class="${row.active ? 'recurring-pause-btn' : 'recurring-resume-btn'}"
        onclick="toggleRecurringExpenseActive('${row.id}', ${row.active})"
      >
        ${row.active ? "Pause" : "Resume"}
      </button>

      <button
        type="button"
        class="danger"
        onclick="deleteRecurringExpense('${row.id}', '${escapeHtml(row.title)}')"
      >
        Delete
      </button>
    </div>
  `).join("");

  editRecurringExpensesModal.classList.remove("hidden");
}

async function deleteRecurringExpense(id, title) {
  if (!confirm(`Delete recurring expense "${title}"?`)) return;

  const { error } = await supabaseClient
    .from("recurring_expenses")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadReports();
  openEditRecurringExpensesModal();
}

async function toggleRecurringExpenseActive(id, isActive) {
  const { error } = await supabaseClient
    .from("recurring_expenses")
    .update({ active: !isActive })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadReports();
  openEditRecurringExpensesModal();
}


async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

if (editCategoriesBtn) {
  editCategoriesBtn.addEventListener("click", openCategoryModal);
}

if (editBudgetsBtn) {
  editBudgetsBtn.addEventListener("click", openBudgetModal);
}

if (addGoalBtn) {
  addGoalBtn.addEventListener("click", openGoalModal);
}

if (editGoalsBtn) {
  editGoalsBtn.addEventListener("click", openEditGoalsModal);
}

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

addGoalBtn.addEventListener("click", openGoalModal);
closeGoalModalBtn.addEventListener("click", () => {
  goalModal.classList.add("hidden");
});
goalModalForm.addEventListener("submit", addGoalFromReports);

editGoalsBtn.addEventListener("click", openEditGoalsModal);
closeEditGoalsModalBtn.addEventListener("click", () => {
  editGoalsModal.classList.add("hidden");
});
editGoalsModalForm.addEventListener("submit", saveGoalChanges);

exportMenuBtn.addEventListener("click", () => {
  exportMenu.classList.toggle("hidden");
});

exportMenu.addEventListener("click", (e) => {
  e.stopPropagation();
});

exportJsonBtn.addEventListener("click", exportBackupJson);
exportZipBtn.addEventListener("click", exportDataZip);

document.addEventListener("click", (e) => {
  if (!exportMenu.contains(e.target) && !exportMenuBtn.contains(e.target)) {
    exportMenu.classList.add("hidden");
  }
});

window.deleteGoalIfUnused = deleteGoalIfUnused;

editSourcesBtn.addEventListener("click", openSourceModal);

closeSourceModalBtn.addEventListener("click", () => {
  sourceModal.classList.add("hidden");
});

sourceModalForm.addEventListener("submit", saveSourceChanges);

window.deleteSourceIfUnused = deleteSourceIfUnused;

if (addRecurringExpenseBtn) {
  addRecurringExpenseBtn.addEventListener("click", openRecurringExpenseModal);
}

if (closeRecurringExpenseModalBtn) {
  closeRecurringExpenseModalBtn.addEventListener("click", () => {
    recurringExpenseModal.classList.add("hidden");
  });
}

if (recurringExpenseForm) {
  recurringExpenseForm.addEventListener("submit", addRecurringExpense);
}

if (editRecurringExpensesBtn) {
  editRecurringExpensesBtn.addEventListener("click", openEditRecurringExpensesModal);
}

if (closeEditRecurringExpensesModalBtn) {
  closeEditRecurringExpensesModalBtn.addEventListener("click", () => {
    editRecurringExpensesModal.classList.add("hidden");
  });
}

window.toggleRecurringExpenseActive = toggleRecurringExpenseActive;
window.deleteRecurringExpense = deleteRecurringExpense;



initReportsPage().catch(console.error);
