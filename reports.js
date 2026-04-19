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

const expensesByCategoryBody = document.getElementById("expensesByCategoryBody");
const incomeBySourceBody = document.getElementById("incomeBySourceBody");
const savingsByGoalBody = document.getElementById("savingsByGoalBody");


const reportMonth = document.getElementById("reportMonth");



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

  const [expensesRes, incomeRes, monthlySavingsRes, allSavingsRes, goalsRes] = await Promise.all([
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
    .select("id,name,target_amount")

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


  const expenses = expensesRes.data || [];
  const income = incomeRes.data || [];
  const monthlySavings = monthlySavingsRes.data || [];
const allSavings = allSavingsRes.data || [];
  const goals = goalsRes.data || [];
  const goalsMap = Object.fromEntries(goals.map((goal) => [goal.id, goal]));


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

  expensesByCategoryBody.innerHTML = Object.entries(totalsByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, total]) => `
      <tr>
        <td data-label="Category">${escapeHtml(category)}</td>
        <td data-label="Total">${money(total)}</td>
      </tr>
    `)
    .join("");

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

mobileMenuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
});

reportMonth.addEventListener("change", loadReports);


logoutBtn.addEventListener("click", logout);
mobileLogoutBtn.addEventListener("click", logout);

initReportsPage().catch(console.error);
