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

async function loadReports() {
  const selectedMonth = reportMonth.value || getCurrentMonthValue();
  const nextMonth = getNextMonthValue(selectedMonth);

  const startDate = `${selectedMonth}-01`;
  const endDate = `${nextMonth}-01`;

  const [expensesRes, incomeRes, savingsRes] = await Promise.all([
    supabaseClient
      .from("expenses")
      .select("amount,category,date")
      .gte("date", startDate)
      .lt("date", endDate),

    supabaseClient
      .from("income")
      .select("amount,date")
      .gte("date", startDate)
      .lt("date", endDate),

    supabaseClient
      .from("savings_contributions")
      .select("amount,date")
      .gte("date", startDate)
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

  if (savingsRes.error) {
    alert(savingsRes.error.message);
    return;
  }

  const expenses = expensesRes.data || [];
  const income = incomeRes.data || [];
  const savings = savingsRes.data || [];

  const totalExpenses = expenses.reduce((sum, expense) => {
    return sum + Number(expense.amount || 0);
  }, 0);

  const totalIncome = income.reduce((sum, row) => {
    return sum + Number(row.amount || 0);
  }, 0);

  const totalSaved = savings.reduce((sum, row) => {
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
