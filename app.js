const SUPABASE_URL = "https://dbqprjqpjnxxsdsnazag.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicXByanFwam54eHNkc25hemFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTM4MDksImV4cCI6MjA5MjA4OTgwOX0.i2vB5P0_6DMkqVmD7MjuTpFbXa6Fxjg6xEbZSiG-WYY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");

const trackedBalanceEl = document.getElementById("trackedBalance");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const totalSavedEl = document.getElementById("totalSaved");

const expensesBody = document.getElementById("expensesBody");
const incomeBody = document.getElementById("incomeBody");
const savingsBody = document.getElementById("savingsBody");
const goalsBody = document.getElementById("goalsBody");
const goalSelect = document.getElementById("goalSelect");

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
  const { data, error } = await supabaseClient.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function showAppIfLoggedIn() {
  const user = await getCurrentUser();
  const loggedIn = !!user;

  authSection.classList.toggle("hidden", loggedIn);
  appSection.classList.toggle("hidden", !loggedIn);
  logoutBtn.classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    await refreshDashboard();
  }
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  authMessage.textContent = "Logging in...";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    authMessage.textContent = error.message;
    return;
  }

  authMessage.textContent = "Logged in.";
  await showAppIfLoggedIn();
}

async function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  authMessage.textContent = error
    ? error.message
    : "Signed up. Check your email if confirmation is enabled.";
}

async function logout() {
  await supabaseClient.auth.signOut();
  authMessage.textContent = "Logged out.";
  await showAppIfLoggedIn();
}

async function refreshDashboard() {
  const [expensesRes, incomeRes, goalsRes, savingsRes] = await Promise.all([
    supabaseClient
      .from("expenses")
      .select("id,title,amount,date,paid_by,category,note")
      .order("date", { ascending: false }),

    supabaseClient
      .from("income")
      .select("id,amount,date,source,received_by,note")
      .order("date", { ascending: false }),

    supabaseClient
      .from("savings_goals")
      .select("id,name,target_amount"),

    supabaseClient
      .from("savings_contributions")
      .select("id,goal_id,amount,date,created_by,note")
      .order("date", { ascending: false })
  ]);

  if (expensesRes.error) throw expensesRes.error;
  if (incomeRes.error) throw incomeRes.error;
  if (goalsRes.error) throw goalsRes.error;
  if (savingsRes.error) throw savingsRes.error;

  const expenses = expensesRes.data || [];
  const income = incomeRes.data || [];
  const goals = goalsRes.data || [];
  const savings = savingsRes.data || [];

  const totalIncome = income.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalSaved = savings.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const startingBalance = 0;
  const trackedBalance = startingBalance + totalIncome - totalExpenses - totalSaved;

  trackedBalanceEl.textContent = money(trackedBalance);
  totalIncomeEl.textContent = money(totalIncome);
  totalExpensesEl.textContent = money(totalExpenses);
  totalSavedEl.textContent = money(totalSaved);

  const goalsMap = Object.fromEntries(goals.map(goal => [goal.id, goal]));
  const savedByGoal = {};

  savings.forEach(row => {
    savedByGoal[row.goal_id] = (savedByGoal[row.goal_id] || 0) + Number(row.amount || 0);
  });

  expensesBody.innerHTML = expenses.slice(0, 5).map(row => `
    <tr>
      <td>${escapeHtml(row.title)}</td>
      <td>${money(row.amount)}</td>
      <td>${escapeHtml(row.date)}</td>
      <td>${escapeHtml(row.paid_by)}</td>
      <td>
        <button type="button" onclick="openEditexpense('${row.id}')">Details</button>
        <button type="button" onclick="deleteExpense('${row.id}')">Delete</button>
      </td>
    </tr>
  `).join("");

  incomeBody.innerHTML = income.slice(0, 5).map(row => `
  <tr>
    <td>${money(row.amount)}</td>
    <td>${escapeHtml(row.date)}</td>
    <td>${escapeHtml(row.received_by)}</td>
    <td>
      <button type="button" onclick="openEditIncome('${row.id}')">Details</button>
      <button type="button" onclick="deleteIncome('${row.id}')">Delete</button>
    </td>
  </tr>
`).join("");

  savingsBody.innerHTML = savings.slice(0, 5).map(row => `
  <tr>
    <td>${escapeHtml(goalsMap[row.goal_id]?.name || "Unknown")}</td>
    <td>${money(row.amount)}</td>
    <td>${escapeHtml(row.date)}</td>
    <td>${escapeHtml(row.created_by)}</td>
    <td>
      <button type="button" onclick="openEditsavings('${row.id}')">Details</button>
      <button type="button" onclick="deleteSavings('${row.id}')">Delete</button>
    </td>
  </tr>
`).join("");

  goalsBody.innerHTML = goals.map(goal => `
    <tr>
      <td>${escapeHtml(goal.name)}</td>
      <td>${money(goal.target_amount)}</td>
      <td>${money(savedByGoal[goal.id] || 0)}</td>
    </tr>
  `).join("");

  goalSelect.innerHTML =
    '<option value="">Choose goal</option>' +
    goals.map(goal => `<option value="${goal.id}">${escapeHtml(goal.name)}</option>`).join("");
}

async function addExpense(e) {
  e.preventDefault();

  const form = new FormData(e.target);
  const user = await getCurrentUser();
  const payload = Object.fromEntries(form.entries());

  payload.user_id = user?.id || null;
  payload.amount = Number(payload.amount);
  payload.paid_by = payload.paid_by || null;
  payload.category = payload.category || null;
  payload.note = payload.note || null;

  const { error } = await supabaseClient.from("expenses").insert(payload);
  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  await refreshDashboard();
}

async function addIncome(e) {
  e.preventDefault();

  const form = new FormData(e.target);
  const user = await getCurrentUser();
  const payload = Object.fromEntries(form.entries());

  payload.user_id = user?.id || null;
  payload.amount = Number(payload.amount);
  payload.source = payload.source || null;
  payload.received_by = payload.received_by || null;
  payload.note = payload.note || null;

  const { error } = await supabaseClient.from("income").insert(payload);
  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  await refreshDashboard();
}

async function addSavings(e) {
  e.preventDefault();

  const form = new FormData(e.target);
  const payload = Object.fromEntries(form.entries());

  payload.amount = Number(payload.amount);
  payload.created_by = payload.created_by || null;
  payload.note = payload.note || null;

  const { error } = await supabaseClient.from("savings_contributions").insert(payload);
  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  await refreshDashboard();
}

async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  const { error } = await supabaseClient.from("expenses").delete().eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }

  await refreshDashboard();
}

async function deleteIncome(id) {
  if (!confirm("Delete this income?")) return;

  const { error } = await supabaseClient.from("income").delete().eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }

  await refreshDashboard();
}

async function deleteSavings(id) {
  if (!confirm("Delete this savings contribution?")) return;

  const { error } = await supabaseClient
    .from("savings_contributions")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await refreshDashboard();
}

document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("signupBtn").addEventListener("click", signup);
document.getElementById("expenseForm").addEventListener("submit", addExpense);
document.getElementById("incomeForm").addEventListener("submit", addIncome);
document.getElementById("savingsForm").addEventListener("submit", addSavings);
logoutBtn.addEventListener("click", logout);

window.deleteExpense = deleteExpense;
window.deleteIncome = deleteIncome;
window.deleteSavings = deleteSavings;

supabaseClient.auth.onAuthStateChange(() => {
  showAppIfLoggedIn().catch(console.error);
});

showAppIfLoggedIn().catch(console.error);
