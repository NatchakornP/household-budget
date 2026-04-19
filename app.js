const SUPABASE_URL = "https://dbqprjqpjnxxsdsnazag.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicXByanFwam54eHNkc25hemFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTM4MDksImV4cCI6MjA5MjA4OTgwOX0.i2vB5P0_6DMkqVmD7MjuTpFbXa6Fxjg6xEbZSiG-WYY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");
const reportsLink = document.getElementById("reportsLink");
const toast = document.getElementById("toast");

const trackedBalanceEl = document.getElementById("trackedBalance");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const totalSavedEl = document.getElementById("totalSaved");

const expensesBody = document.getElementById("expensesBody");
const incomeBody = document.getElementById("incomeBody");
const savingsBody = document.getElementById("savingsBody");
const goalsBody = document.getElementById("goalsBody");

const goalSelect = document.getElementById("goalSelect");
const goalForm = document.getElementById("goalForm");

const categorySelect = document.getElementById("categorySelect");
const newCategoryBox = document.getElementById("newCategoryBox");
const newCategoryInput = document.getElementById("newCategoryInput");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");
const sourceSelect = document.getElementById("sourceSelect");
const newSourceBox = document.getElementById("newSourceBox");
const newSourceInput = document.getElementById("newSourceInput");
const saveSourceBtn = document.getElementById("saveSourceBtn");


const editSection = document.getElementById("editSection");
const editTitle = document.getElementById("editTitle");
const editForm = document.getElementById("editForm");
const closeEditBtn = document.getElementById("closeEditBtn");

const viewAllExpensesBtn = document.getElementById("viewAllExpensesBtn");
const viewAllIncomeBtn = document.getElementById("viewAllIncomeBtn");
const viewAllSavingsBtn = document.getElementById("viewAllSavingsBtn");
const viewAllSection = document.getElementById("viewAllSection");
const viewAllTitle = document.getElementById("viewAllTitle");
const viewAllHead = document.getElementById("viewAllHead");
const viewAllBody = document.getElementById("viewAllBody");
const closeViewAllBtn = document.getElementById("closeViewAllBtn");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");


let allExpenses = [];
let allIncome = [];
let allSavings = [];
let allGoalsMap = {};
let reopenViewAllType = null;





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

function showToast(message, type) {
  toast.textContent = message;
  toast.className = `toast ${type}`;

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

function clearForms() {
  document.querySelectorAll("form").forEach((form) => {
    form.reset();
  });

  newCategoryInput.value = "";
  newCategoryBox.classList.add("hidden");
  editForm.innerHTML = "";
  editSection.classList.add("hidden");
}

function getExpensesByCategory(expenses) {
  const totals = {};

  expenses.forEach((expense) => {
    const category = expense.category || "Uncategorized";
    totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
  });

  return totals;
}

function getCategoryOptions(categories, includeAddNew) {
  const options =
    '<option value="">Category</option>' +
    categories.map((category) => `
      <option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>
    `).join("");

  if (!includeAddNew) {
    return options;
  }

  return options + '<option value="__add_new__">+ Add new category</option>';
}

function getSourceOptions(sources, includeAddNew) {
  const options =
    '<option value="">Source</option>' +
    sources.map((source) => `
      <option value="${escapeHtml(source.name)}">${escapeHtml(source.name)}</option>
    `).join("");

  if (!includeAddNew) {
    return options;
  }

  return options + '<option value="__add_new__">+ Add new source</option>';
}

async function getIncomeSources() {
  const { data, error } = await supabaseClient
    .from("income_sources")
    .select("id,name")
    .order("name", { ascending: true });

  if (error) {
    alert(error.message);
    return [];
  }

  return data || [];
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

async function showAppIfLoggedIn() {
  const user = await getCurrentUser();
  const loggedIn = !!user;

  authSection.classList.toggle("hidden", loggedIn);
  appSection.classList.toggle("hidden", !loggedIn);
  logoutBtn.classList.toggle("hidden", !loggedIn);
  reportsLink.classList.toggle("hidden", !loggedIn);
  mobileMenuBtn.classList.toggle("hidden", !loggedIn);

  if (!loggedIn) {
    mobileMenu.classList.add("hidden");
  }

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

  clearForms();
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

  if (error) {
    authMessage.textContent = error.message;
    return;
  }

  clearForms();
  authMessage.textContent = "Signed up. Check your email if confirmation is enabled.";
}

async function logout() {
  await supabaseClient.auth.signOut();
  clearForms();
  authMessage.textContent = "Logged out.";
  await showAppIfLoggedIn();
}

async function refreshDashboard() {
  const [expensesRes, incomeRes, goalsRes, savingsRes, categoriesRes, sourcesRes] = await Promise.all([
    supabaseClient
      .from("expenses")
      .select("id,title,amount,date,paid_by,category,note,created_at")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),

    supabaseClient
      .from("income")
      .select("id,amount,date,source,received_by,note,created_at")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),

    supabaseClient
      .from("savings_goals")
      .select("id,name,target_amount,created_at")
      .order("created_at", { ascending: false }),

    supabaseClient
      .from("savings_contributions")
      .select("id,goal_id,amount,date,created_by,note,created_at")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),

    supabaseClient
      .from("expense_categories")
      .select("id,name")
      .order("name", { ascending: true }),

      supabaseClient
      .from("income_sources")
      .select("id,name")
      .order("name", { ascending: true })

  ]);

  if (expensesRes.error) throw expensesRes.error;
  if (incomeRes.error) throw incomeRes.error;
  if (goalsRes.error) throw goalsRes.error;
  if (savingsRes.error) throw savingsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  if (sourcesRes.error) throw sourcesRes.error;


  const expenses = expensesRes.data || [];
  const income = incomeRes.data || [];
  const goals = goalsRes.data || [];
  const savings = savingsRes.data || [];
  const categories = categoriesRes.data || [];
  const sources = sourcesRes.data || [];


  viewAllExpensesBtn.classList.toggle("hidden", expenses.length <= 5);
  viewAllIncomeBtn.classList.toggle("hidden", income.length <= 5);
  viewAllSavingsBtn.classList.toggle("hidden", savings.length <= 5);


  getExpensesByCategory(expenses);

  categorySelect.innerHTML = getCategoryOptions(categories, true);
sourceSelect.innerHTML = getSourceOptions(sources, true);



  const totalIncome = income.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalSaved = savings.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const startingBalance = 0;
  const trackedBalance = startingBalance + totalIncome - totalExpenses - totalSaved;

  trackedBalanceEl.textContent = money(trackedBalance);
  totalIncomeEl.textContent = money(totalIncome);
  totalExpensesEl.textContent = money(totalExpenses);
  totalSavedEl.textContent = money(totalSaved);

  const goalsMap = Object.fromEntries(goals.map((goal) => [goal.id, goal]));
  allExpenses = expenses;
  allIncome = income;
  allSavings = savings;
  allGoalsMap = goalsMap;

  const savedByGoal = {};

  savings.forEach((row) => {
    savedByGoal[row.goal_id] = (savedByGoal[row.goal_id] || 0) + Number(row.amount || 0);
  });

  expensesBody.innerHTML = expenses.slice(0, 5).map((row) => `
  <tr>
    <td data-label="Title">${escapeHtml(row.title)}</td>
    <td data-label="Amount">${money(row.amount)}</td>
    <td data-label="Date">${escapeHtml(row.date)}</td>
    <td data-label="Paid by">${escapeHtml(row.paid_by)}</td>
    <td data-label="Actions">
      <div class="actions">
        <button type="button" onclick="openEditExpense('${row.id}')">Details</button>
        <button type="button" class="danger" onclick="deleteExpense('${row.id}')">Delete</button>
      </div>
    </td>
  </tr>
`).join("");

  incomeBody.innerHTML = income.slice(0, 5).map((row) => `
  <tr>
    <td data-label="Amount">${money(row.amount)}</td>
    <td data-label="Date">${escapeHtml(row.date)}</td>
    <td data-label="Received by">${escapeHtml(row.received_by)}</td>
    <td data-label="Actions">
      <div class="actions">
        <button type="button" onclick="openEditIncome('${row.id}')">Details</button>
        <button type="button" class="danger" onclick="deleteIncome('${row.id}')">Delete</button>
      </div>
    </td>
  </tr>
`).join("");

  savingsBody.innerHTML = savings.slice(0, 5).map((row) => `
  <tr>
    <td data-label="Goal">${escapeHtml(goalsMap[row.goal_id]?.name || "Unknown")}</td>
    <td data-label="Amount">${money(row.amount)}</td>
    <td data-label="Date">${escapeHtml(row.date)}</td>
    <td data-label="Created by">${escapeHtml(row.created_by)}</td>
    <td data-label="Actions">
      <div class="actions">
        <button type="button" onclick="openEditSavings('${row.id}')">Details</button>
        <button type="button" class="danger" onclick="deleteSavings('${row.id}')">Delete</button>
      </div>
    </td>
  </tr>
`).join("");

  goalsBody.innerHTML = goals.map((goal) => `
  <tr>
    <td data-label="Goal">${escapeHtml(goal.name)}</td>
    <td data-label="Target">${money(goal.target_amount)}</td>
    <td data-label="Saved">${money(savedByGoal[goal.id] || 0)}</td>
    <td data-label="Actions">
      <div class="actions">
        <button type="button" onclick="openEditGoal('${goal.id}')">Details</button>
        <button type="button" class="danger" onclick="deleteGoal('${goal.id}')">Delete</button>
      </div>
    </td>
  </tr>
`).join("");

  goalSelect.innerHTML =
    '<option value="">Choose goal</option>' +
    goals.map((goal) => `<option value="${goal.id}">${escapeHtml(goal.name)}</option>`).join("");
}

async function addExpense(e) {
  e.preventDefault();

  const form = new FormData(e.target);
  const user = await getCurrentUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const payload = Object.fromEntries(form.entries());

  if (payload.category === "__add_new__") {
    categorySelect.setCustomValidity("Please add the new category first.");
    categorySelect.reportValidity();
    return;
  }

  payload.user_id = user.id;
  payload.amount = Number(payload.amount);
  payload.note = payload.note || null;

  const { error } = await supabaseClient.from("expenses").insert(payload);

  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  newCategoryBox.classList.add("hidden");
  showToast("Expense successfully added", "success-add");
  await refreshDashboard();
}

async function addIncome(e) {
  e.preventDefault();

  const form = new FormData(e.target);
  const user = await getCurrentUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const payload = Object.fromEntries(form.entries());
  if (payload.source === "__add_new__") {
  sourceSelect.setCustomValidity("Please add the new source first.");
  sourceSelect.reportValidity();
  return;
}


  payload.user_id = user.id;
  payload.amount = Number(payload.amount);
  payload.note = payload.note || null;

  const { error } = await supabaseClient.from("income").insert(payload);

  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  showToast("Income successfully added", "success-add");
  await refreshDashboard();
}

async function addSavings(e) {
  e.preventDefault();

  const form = new FormData(e.target);
  const user = await getCurrentUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const payload = Object.fromEntries(form.entries());

  payload.user_id = user.id;
  payload.amount = Number(payload.amount);
  payload.note = payload.note || null;

  const { error } = await supabaseClient.from("savings_contributions").insert(payload);

  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  showToast("Savings successfully added", "success-add");
  await refreshDashboard();
}

async function addGoal(e) {
  e.preventDefault();

  const form = new FormData(e.target);
  const user = await getCurrentUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const payload = Object.fromEntries(form.entries());

  payload.user_id = user.id;
  payload.target_amount = Number(payload.target_amount);

  const { error } = await supabaseClient.from("savings_goals").insert(payload);

  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  showToast("Goal successfully added", "success-add");
  await refreshDashboard();
}

async function addCategoryFromDropdown() {
  const user = await getCurrentUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const name = newCategoryInput.value.trim();

  if (!name) {
    newCategoryInput.required = true;
    newCategoryInput.reportValidity();
    return;
  }

  const { error } = await supabaseClient
    .from("expense_categories")
    .insert({
      name,
      user_id: user.id
    });

  if (error) {
    alert(error.message);
    return;
  }

  newCategoryInput.value = "";
  newCategoryBox.classList.add("hidden");
  showToast("Category successfully added", "success-add");
  await refreshDashboard();

  categorySelect.value = name;
}

async function addSourceFromDropdown() {
  const user = await getCurrentUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const name = newSourceInput.value.trim();

  if (!name) {
    newSourceInput.required = true;
    newSourceInput.reportValidity();
    return;
  }

  const { error } = await supabaseClient
    .from("income_sources")
    .insert({
      name,
      user_id: user.id
    });

  if (error) {
    alert(error.message);
    return;
  }

  newSourceInput.value = "";
  newSourceBox.classList.add("hidden");
  showToast("Source successfully added", "success-add");
  await refreshDashboard();

  sourceSelect.value = name;
}


function openViewAll(type) {
  if (type === "expenses") {
    viewAllTitle.textContent = "All Expenses";

    viewAllHead.innerHTML = `
      <tr>
        <th>Title</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Category</th>
        <th>Paid by</th>
        <th>Note</th>
        <th>Actions</th>
      </tr>
    `;

    viewAllBody.innerHTML = allExpenses.map((row) => `
  <tr>
    <td data-label="Title">${escapeHtml(row.title)}</td>
    <td data-label="Amount">${money(row.amount)}</td>
    <td data-label="Date">${escapeHtml(row.date)}</td>
    <td data-label="Category">${escapeHtml(row.category)}</td>
    <td data-label="Paid by">${escapeHtml(row.paid_by)}</td>
    <td data-label="Note">${escapeHtml(row.note)}</td>
    <td data-label="Actions">
      <div class="actions">
        <button type="button" onclick="openEditFromViewAll('expenses', openEditExpense, '${row.id}')">Details</button>
        <button type="button" class="danger" onclick="deleteExpense('${row.id}')">Delete</button>
      </div>
    </td>
  </tr>
`).join("");
  }

  if (type === "income") {
    viewAllTitle.textContent = "All Income";

    viewAllHead.innerHTML = `
      <tr>
        <th>Amount</th>
        <th>Date</th>
        <th>Source</th>
        <th>Received by</th>
        <th>Note</th>
        <th>Actions</th>
      </tr>
    `;

    viewAllBody.innerHTML = allIncome.map((row) => `
  <tr>
    <td data-label="Amount">${money(row.amount)}</td>
    <td data-label="Date">${escapeHtml(row.date)}</td>
    <td data-label="Source">${escapeHtml(row.source)}</td>
    <td data-label="Received by">${escapeHtml(row.received_by)}</td>
    <td data-label="Note">${escapeHtml(row.note)}</td>
    <td data-label="Actions">
      <div class="actions">
        <button type="button" onclick="openEditFromViewAll('income', openEditIncome, '${row.id}')">Details</button>
        <button type="button" class="danger" onclick="deleteIncome('${row.id}')">Delete</button>
      </div>
    </td>
  </tr>
`).join("");
  }

  if (type === "savings") {
    viewAllTitle.textContent = "All Savings";

    viewAllHead.innerHTML = `
      <tr>
        <th>Goal</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Created by</th>
        <th>Note</th>
        <th>Actions</th>
      </tr>
    `;

    viewAllBody.innerHTML = allSavings.map((row) => `
  <tr>
    <td data-label="Goal">${escapeHtml(allGoalsMap[row.goal_id]?.name || "Unknown")}</td>
    <td data-label="Amount">${money(row.amount)}</td>
    <td data-label="Date">${escapeHtml(row.date)}</td>
    <td data-label="Created by">${escapeHtml(row.created_by)}</td>
    <td data-label="Note">${escapeHtml(row.note)}</td>
    <td data-label="Actions">
      <div class="actions">
        <button type="button" onclick="openEditFromViewAll('savings', openEditSavings, '${row.id}')">Details</button>
        <button type="button" class="danger" onclick="deleteSavings('${row.id}')">Delete</button>
      </div>
    </td>
  </tr>
`).join("");
  }

  viewAllSection.classList.remove("hidden");
}

function openEditFromViewAll(type, openEditFunction, id) {
  reopenViewAllType = type;
  viewAllSection.classList.add("hidden");
  openEditFunction(id);
}

async function closeEditAfterChange() {
  editSection.classList.add("hidden");
  await refreshDashboard();

  if (reopenViewAllType) {
    openViewAll(reopenViewAllType);
    reopenViewAllType = null;
  }
}

function closeEditWithoutChange() {
  editSection.classList.add("hidden");

  if (reopenViewAllType) {
    openViewAll(reopenViewAllType);
    reopenViewAllType = null;
  }
}



async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  const { error } = await supabaseClient.from("expenses").delete().eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  showToast("Expense successfully deleted", "success-delete");
  await refreshDashboard();
}

async function deleteIncome(id) {
  if (!confirm("Delete this income?")) return;

  const { error } = await supabaseClient.from("income").delete().eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  showToast("Income successfully deleted", "success-delete");
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

  showToast("Savings successfully deleted", "success-delete");
  await refreshDashboard();
}

async function deleteGoal(id) {
  if (!confirm("Delete this savings goal?")) return;

  const { error } = await supabaseClient
    .from("savings_goals")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  showToast("Goal successfully deleted", "success-delete");
  await refreshDashboard();
}

async function openEditExpense(id) {
  const { data, error } = await supabaseClient
    .from("expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  const categoriesRes = await supabaseClient
    .from("expense_categories")
    .select("id,name")
    .order("name", { ascending: true });

  if (categoriesRes.error) {
    alert(categoriesRes.error.message);
    return;
  }

  editTitle.textContent = "Expense details";

  editForm.innerHTML = `
    <input name="title" value="${escapeHtml(data.title)}" placeholder="Title" required />
    <input name="amount" type="number" inputmode="decimal" step="0.01" value="${escapeHtml(data.amount)}" required />
    <input name="date" type="date" value="${escapeHtml(data.date)}" required />
    <select name="category" required>
      ${getCategoryOptions(categoriesRes.data || [], false)}
    </select>
    <select name="paid_by" required>
      <option value="">Paid by</option>
      <option value="Chompoo">Chompoo</option>
      <option value="Mads">Mads</option>
    </select>
    <input name="note" value="${escapeHtml(data.note)}" placeholder="Note" />
    <button type="submit">Save changes</button>
  `;

  editForm.querySelector('[name="category"]').value = data.category || "";
  editForm.querySelector('[name="paid_by"]').value = data.paid_by || "";

  editForm.onsubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(editForm);
    const payload = Object.fromEntries(form.entries());

    payload.amount = Number(payload.amount);
    payload.note = payload.note || null;

    const { error: updateError } = await supabaseClient
      .from("expenses")
      .update(payload)
      .eq("id", id);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    editSection.classList.add("hidden");
    showToast("Expense successfully edited", "success-edit");
    await closeEditAfterChange();
  };

  editSection.classList.remove("hidden");
}

async function openEditIncome(id) {
  const { data, error } = await supabaseClient
    .from("income")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  editTitle.textContent = "Income details";

  editForm.innerHTML = `
    <input name="amount" type="number" inputmode="decimal" step="0.01" value="${escapeHtml(data.amount)}" required />
    <input name="date" type="date" value="${escapeHtml(data.date)}" required />
    <select name="source" required>
  ${getSourceOptions(await getIncomeSources(), false)}
</select>

    <select name="received_by" required>
      <option value="">Received by</option>
      <option value="Chompoo">Chompoo</option>
      <option value="Mads">Mads</option>
    </select>
    <input name="note" value="${escapeHtml(data.note)}" placeholder="Note" />
    <button type="submit">Save changes</button>
  `;

  editForm.querySelector('[name="source"]').value = data.source || "";

  editForm.querySelector('[name="received_by"]').value = data.received_by || "";

  editForm.onsubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(editForm);
    const payload = Object.fromEntries(form.entries());

    payload.amount = Number(payload.amount);
    payload.note = payload.note || null;

    const { error: updateError } = await supabaseClient
      .from("income")
      .update(payload)
      .eq("id", id);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    editSection.classList.add("hidden");
    showToast("Income successfully edited", "success-edit");
    await closeEditAfterChange();
  };

  editSection.classList.remove("hidden");
}

async function openEditSavings(id) {
  const { data, error } = await supabaseClient
    .from("savings_contributions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  editTitle.textContent = "Savings details";

  editForm.innerHTML = `
    <select name="goal_id" required>
      ${goalSelect.innerHTML}
    </select>
    <input name="amount" type="number" inputmode="decimal" step="0.01" value="${escapeHtml(data.amount)}" required />
    <input name="date" type="date" value="${escapeHtml(data.date)}" required />
    <select name="created_by" required>
      <option value="">Created by</option>
      <option value="Chompoo">Chompoo</option>
      <option value="Mads">Mads</option>
    </select>
    <input name="note" value="${escapeHtml(data.note)}" placeholder="Note" />
    <button type="submit">Save changes</button>
  `;

  editForm.querySelector('[name="goal_id"]').value = data.goal_id;
  editForm.querySelector('[name="created_by"]').value = data.created_by || "";

  editForm.onsubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(editForm);
    const payload = Object.fromEntries(form.entries());

    payload.amount = Number(payload.amount);
    payload.note = payload.note || null;

    const { error: updateError } = await supabaseClient
      .from("savings_contributions")
      .update(payload)
      .eq("id", id);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    editSection.classList.add("hidden");
    showToast("Savings successfully edited", "success-edit");
    await closeEditAfterChange();
  };

  editSection.classList.remove("hidden");
}

async function openEditGoal(id) {
  const { data, error } = await supabaseClient
    .from("savings_goals")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  editTitle.textContent = "Goal details";

  editForm.innerHTML = `
    <input name="name" value="${escapeHtml(data.name)}" placeholder="Goal name" required />
    <input name="target_amount" type="number" inputmode="decimal" step="0.01" value="${escapeHtml(data.target_amount)}" required />
    <button type="submit">Save changes</button>
  `;

  editForm.onsubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(editForm);
    const payload = Object.fromEntries(form.entries());

    payload.target_amount = Number(payload.target_amount);

    const { error: updateError } = await supabaseClient
      .from("savings_goals")
      .update(payload)
      .eq("id", id);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    editSection.classList.add("hidden");
    showToast("Goal successfully edited", "success-edit");
    await refreshDashboard();
  };

  editSection.classList.remove("hidden");
}

document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("signupBtn").addEventListener("click", signup);
document.getElementById("expenseForm").addEventListener("submit", addExpense);
document.getElementById("incomeForm").addEventListener("submit", addIncome);
document.getElementById("savingsForm").addEventListener("submit", addSavings);
goalForm.addEventListener("submit", addGoal);

categorySelect.addEventListener("change", () => {
  categorySelect.setCustomValidity("");

  if (categorySelect.value === "__add_new__") {
    newCategoryBox.classList.remove("hidden");
    newCategoryInput.focus();
  } else {
    newCategoryBox.classList.add("hidden");
  }
});

saveCategoryBtn.addEventListener("click", addCategoryFromDropdown);

logoutBtn.addEventListener("click", logout);

closeEditBtn.addEventListener("click", closeEditWithoutChange);


sourceSelect.addEventListener("change", () => {
  sourceSelect.setCustomValidity("");

  if (sourceSelect.value === "__add_new__") {
    newSourceBox.classList.remove("hidden");
    newSourceInput.focus();
  } else {
    newSourceBox.classList.add("hidden");
  }
});

saveSourceBtn.addEventListener("click", addSourceFromDropdown);


window.deleteExpense = deleteExpense;
window.deleteIncome = deleteIncome;
window.deleteSavings = deleteSavings;
window.deleteGoal = deleteGoal;

window.openEditExpense = openEditExpense;
window.openEditIncome = openEditIncome;
window.openEditSavings = openEditSavings;
window.openEditGoal = openEditGoal;
window.openEditFromViewAll = openEditFromViewAll;


viewAllExpensesBtn.addEventListener("click", () => openViewAll("expenses"));
viewAllIncomeBtn.addEventListener("click", () => openViewAll("income"));
viewAllSavingsBtn.addEventListener("click", () => openViewAll("savings"));

closeViewAllBtn.addEventListener("click", () => {
  viewAllSection.classList.add("hidden");
});


supabaseClient.auth.onAuthStateChange(() => {
  showAppIfLoggedIn().catch(console.error);
});

mobileMenuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
});

mobileLogoutBtn.addEventListener("click", logout);


showAppIfLoggedIn().catch(console.error);
