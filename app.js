const APP_CONFIG = {
  apiUrl: "https://court-daily-proxy.courtchaksu.workers.dev",
  courtName: "SUB DIVISIONLA MAGISTRATE COURT",
  officeName: "Chaksu, Jaipur",
  appTitle: "Court Daily Management",
};
const CASE_STAGES = ["तलबी", "साक्ष्य", "बहस", "जवाब", "आदेश", "अन्य"];
const state = {
  user: JSON.parse(sessionStorage.getItem("courtUser") || "null"),
  view: "home",
  cases: [],
  date: localDate(),
  query: "",
  stage: "",
  loading: false,
};
const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
function localDate(d = new Date()) {
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fmt(date, full = false) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: full ? "long" : "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
async function api(action, payload = {}) {
  if (APP_CONFIG.apiUrl.startsWith("YOUR_")) {
    throw new Error("Configure the proxy URL before signing in.");
  }
  const response = await fetch(APP_CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload, token: state.user?.token }),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
  return data;
}
function render() {
  document.title = APP_CONFIG.appTitle;
  if (!state.user) {
    $("app").innerHTML = loginHtml();
    bindLogin();
    return;
  }
  $("app").innerHTML = appHtml();
  bindApp();
  loadData();
}
function loginHtml() {
  return `<main class="login"><section class="login-card"><div class="brand-mark">⚖</div><span class="eyebrow">Court Office</span><h1>${esc(APP_CONFIG.appTitle)}</h1><p class="subtitle">Secure daily case-list management</p><form id="loginForm"><div class="field"><label for="username">Username</label><input id="username" autocomplete="username" required></div><div class="field"><label for="password">Password</label><div class="password"><input id="password" type="password" autocomplete="current-password" required><button type="button" id="togglePassword" aria-label="Show password">◉</button></div></div><div id="loginError" class="error"></div><button class="btn btn-primary" style="width:100%" id="loginButton">Login</button></form></section></main>`;
}
function appHtml() {
  return `<header class="topbar"><div><h1>${esc(APP_CONFIG.appTitle)}</h1><small>${esc(state.user.username)} · ${esc(state.user.role)}</small></div><button class="btn btn-ghost" style="color:#fff" id="logout">Logout</button></header><main class="main" id="content"></main><nav class="bottom-nav">${[
    ["home", "⌂", "Home"],
    ["daily", "▣", "Daily List"],
    ["cases", "▤", "Cases"],
    ["reports", "▥", "Reports"],
    ["more", "☰", "More"],
  ]
    .map(
      ([id, icon, label]) =>
        `<button class="${state.view === id ? "active" : ""}" data-view="${id}">${icon}<br>${label}</button>`,
    )
    .join(
      "",
    )}</nav>${state.user.role === "admin" ? '<button class="fab" id="addCase" aria-label="Add case">+</button>' : ""}`;
}
function bindLogin() {
  $("togglePassword").onclick = () => {
    $("password").type =
      $("password").type === "password" ? "text" : "password";
  };
  $("loginForm").onsubmit = async (e) => {
    e.preventDefault();
    $("loginButton").disabled = true;
    try {
      const data = await api("login", {
        username: $("username").value.trim(),
        password: $("password").value,
      });
      state.user = data.user;
      sessionStorage.setItem("courtUser", JSON.stringify(state.user));
      render();
    } catch (e) {
      $("loginError").textContent = e.message.includes("Failed to fetch")
        ? "Backend connection blocked. Deploy the frontend through the Apps Script app or configure a CORS-enabled proxy."
        : e.message.includes("Invalid credentials")
          ? "Invalid username or password."
          : e.message;
      $("loginButton").disabled = false;
    }
  };
}
function bindApp() {
  document.querySelectorAll("[data-view]").forEach(
    (b) =>
      (b.onclick = () => {
        state.view = b.dataset.view;
        render();
      }),
  );
  $("logout").onclick = () => {
    sessionStorage.clear();
    state.user = null;
    render();
  };
  if ($("addCase")) $("addCase").onclick = () => openCaseModal();
}
async function loadData() {
  const content = $("content");
  if (!content) return;
  content.innerHTML = '<div class="empty">Loading cases...</div>';
  try {
    const action =
      state.view === "daily" ? "getCasesByDate" : "getCases";
    const data = await api(action, {
      ...(action === "getCasesByDate" ? { date: state.date } : {}),
    });
    state.cases = data.cases || [];
    renderView();
  } catch (e) {
    content.innerHTML =
      '<div class="empty">Unable to load cases.<br>Please try again.</div>';
  }
}
function renderView() {
  const c = $("content");
  if (state.view === "home") c.innerHTML = dashboard();
  else if (state.view === "daily" || state.view === "cases")
    c.innerHTML = dailyList();
  else if (state.view === "reports") c.innerHTML = reports();
  else c.innerHTML = profile();
  bindView();
}
function dashboard() {
  const today = state.cases.filter((x) => x.nextDate === localDate()).length,
    tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const td = localDate(tomorrow);
  return `<div class="view-head"><div><span class="eyebrow">Dashboard</span><h2>Good day</h2><p>${fmt(localDate(), true)}</p></div></div><div class="grid metrics"><div class="metric accent"><span>Today’s Cases</span><strong>${today}</strong></div><div class="metric"><span>Tomorrow</span><strong>${state.cases.filter((x) => x.nextDate === td).length}</strong></div><div class="metric"><span>Total Cases</span><strong>${state.cases.length}</strong></div><div class="metric"><span>Role</span><strong style="font-size:20px">${esc(state.user.role)}</strong></div></div><section class="panel"><h3>Today by stage</h3><div class="stage-summary">${CASE_STAGES.map((stage) => `<button class="stage-chip" data-stage="${esc(stage)}"><span>${esc(stage)}</span><b>${state.cases.filter((x) => x.nextDate === localDate() && x.stage === stage).length}</b></button>`).join("")}</div></section>`;
}
function filteredCases() {
  const allCasesView = state.view === "cases";
  return state.cases
    .filter(
      (x) =>
        (allCasesView || !state.date || x.nextDate === state.date) &&
        (!state.stage || x.stage === state.stage) &&
        (!state.query ||
          [x.serialNo, x.caseNo, x.title, x.stage]
            .join(" ")
            .toLowerCase()
            .includes(state.query.toLowerCase())),
    )
    .sort((a, b) => (Number(a.serialNo) || 0) - (Number(b.serialNo) || 0));
}
function dailyList() {
  const list = filteredCases();
  return `<div class="view-head"><div><span class="eyebrow">Daily List</span><h2>${fmt(state.date, true)}</h2><p>${list.length} case${list.length === 1 ? "" : "s"}</p></div><button class="btn btn-secondary" id="printBtn">Print</button></div><div class="toolbar"><input id="search" placeholder="⌕ Case no. or title..." value="${esc(state.query)}"><div class="date-nav"><button class="btn btn-secondary" id="prevDate">‹</button><input id="date" type="date" value="${state.date}"><button class="btn btn-secondary" id="nextDate">›</button></div></div><div class="filter-row"><button class="chip ${!state.stage ? "active" : ""}" data-filter="">All stages</button>${CASE_STAGES.map((s) => `<button class="chip ${state.stage === s ? "active" : ""}" data-filter="${esc(s)}">${esc(s)}</button>`).join("")}</div>${
    list.length
      ? CASE_STAGES.map((stage) => {
          const items = list.filter((x) => x.stage === stage);
          return items.length
            ? `<section class="stage-section"><div class="stage-title"><h3>${esc(stage)}</h3><span>${items.length} cases</span></div>${items.map(caseCard).join("")}</section>`
            : "";
        }).join("")
      : '<div class="empty">No cases found for this date.</div>'
  }<div id="printContainer" class="print-only">${printView(list)}</div>`;
}
function caseCard(x) {
  const canUpdate = state.user.role === "admin" || state.user.role === "operator";
  return `<article class="case-card"><button class="case-main" data-case="${esc(x.id || x.caseNo)}"><span class="serial">क्र.सं. ${esc(x.serialNo)}</span><strong>${esc(x.caseNo)}</strong><div>${esc(x.title)}</div><div class="case-meta"><span>${esc(x.stage)}</span><span>${fmt(x.nextDate)}</span></div></button>${canUpdate ? `<form class="quick-update" data-quick-update="${esc(x.id || x.caseNo)}"><input type="date" name="nextDate" value="${esc(x.nextDate)}" aria-label="Next date"><select name="stage" aria-label="Stage">${CASE_STAGES.map((s) => `<option ${s === x.stage ? "selected" : ""}>${esc(s)}</option>`).join("")}</select><button class="btn btn-secondary" type="submit">Update</button></form>` : ""}</article>`;
}
function reports() {
  const counts = Object.fromEntries(
    CASE_STAGES.map((s) => [
      s,
      state.cases.filter((x) => x.stage === s).length,
    ]),
  );
  return `<div class="view-head"><div><span class="eyebrow">Reports</span><h2>Case overview</h2><p>Live totals from the connected sheet</p></div></div><section class="panel"><h3>Stage-wise cases</h3><div class="stage-summary">${CASE_STAGES.map((s) => `<div class="stage-chip"><span>${esc(s)}</span><b>${counts[s]}</b></div>`).join("")}</div></section>`;
}
function profile() {
  return `<div class="view-head"><div><span class="eyebrow">Profile</span><h2>${esc(state.user.username)}</h2><p>Signed in as ${esc(state.user.role)}</p></div></div><section class="panel"><h3>About</h3><p>Use the daily list to review cases and, when permitted, update the next date or stage.</p><button class="btn btn-danger" id="profileLogout">Logout</button></section>`;
}
function printView(list) {
  return `<div class="print-header"><h1>${esc(APP_CONFIG.courtName)}</h1><p>${esc(APP_CONFIG.officeName)}</p><h2>DAILY CASE LIST</h2><p>Date: ${fmt(state.date, true)} · Total Cases: ${list.length}</p></div>${CASE_STAGES.map(
    (stage) => {
      const items = list.filter((x) => x.stage === stage);
      return items.length
        ? `<section class="print-stage"><h2>${esc(stage)} — ${items.length} cases</h2><table class="print-table"><thead><tr><th>क्र.सं.</th><th>CASE NO</th><th>केस शीर्षक</th></tr></thead><tbody>${items.map((x) => `<tr class="case-row"><td>${esc(x.serialNo)}</td><td>${esc(x.caseNo)}</td><td>${esc(x.title)}</td></tr>`).join("")}</tbody></table></section>`
        : "";
    },
  ).join("")}`;
}
function bindView() {
  document.querySelectorAll("[data-stage]").forEach(
    (b) =>
      (b.onclick = () => {
        state.view = "daily";
        state.stage = b.dataset.stage;
        render();
      }),
  );
  if ($("date"))
    $("date").onchange = (e) => {
      state.date = e.target.value;
      render();
    };
  if ($("search"))
    $("search").oninput = (e) => {
      state.query = e.target.value;
      renderView();
      bindView();
    };
  document.querySelectorAll("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        state.stage = b.dataset.filter;
        renderView();
        bindView();
      }),
  );
  if ($("prevDate")) $("prevDate").onclick = () => shiftDate(-1);
  if ($("nextDate")) $("nextDate").onclick = () => shiftDate(1);
  if ($("printBtn")) $("printBtn").onclick = () => window.print();
  document
    .querySelectorAll("[data-case]")
    .forEach((b) => (b.onclick = () => openCaseModal(b.dataset.case)));
  document.querySelectorAll("[data-quick-update]").forEach((form) => {
    form.onsubmit = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const id = form.dataset.quickUpdate;
      const item = state.cases.find((x) => (x.id || x.caseNo) === id);
      try {
        await api("updateCase", {
          id,
          data: Object.fromEntries(new FormData(form)),
        });
        if (item) {
          item.nextDate = form.elements.nextDate.value;
          item.stage = form.elements.stage.value;
        }
        toast("Case updated");
        renderView();
        bindView();
      } catch (error) {
        toast(error.message);
      }
    };
  });
  if ($("profileLogout")) $("profileLogout").onclick = $("logout").onclick;
}
function shiftDate(amount) {
  const d = new Date(`${state.date}T12:00:00`);
  d.setDate(d.getDate() + amount);
  state.date = localDate(d);
  renderView();
  bindView();
}
function openCaseModal(id) {
  const item = state.cases.find((x) => (x.id || x.caseNo) === id) || {
    serialNo: "",
    caseNo: "",
    title: "",
    nextDate: state.date,
    stage: CASE_STAGES[0],
  };
  const editable = state.user.role === "admin",
    canUpdate = editable || state.user.role === "operator";
  const root = document.createElement("div");
  root.className = "modal-backdrop";
  root.innerHTML = `<section class="modal"><div class="modal-head"><h3>${id ? "Case details" : "New case"}</h3><button class="close">×</button></div><form id="caseForm"><div class="field"><label>क्र.सं.</label><input name="serialNo" value="${esc(item.serialNo)}" ${editable ? "" : "readonly"}></div><div class="field"><label>CASE NO</label><input name="caseNo" value="${esc(item.caseNo)}" ${editable ? "" : "readonly"} required></div><div class="field"><label>केस शीर्षक</label><input name="title" value="${esc(item.title)}" ${editable ? "" : "readonly"} required></div><div class="field"><label>Next Date</label><input name="nextDate" type="date" value="${esc(item.nextDate)}" ${canUpdate ? "" : "readonly"}></div><div class="field"><label>Stage</label><select name="stage" ${canUpdate ? "" : "disabled"}>${CASE_STAGES.map((s) => `<option ${s === item.stage ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></div><div class="actions">${canUpdate ? `<button class="btn btn-primary" type="submit">${id ? "Update" : "Save"} case</button>` : ""}${id && editable ? '<button type="button" class="btn btn-danger" id="deleteCase">Delete</button>' : ""}</div></form></section>`;
  document.body.append(root);
  root.querySelector(".close").onclick = () => root.remove();
  root.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      await api(id ? "updateCase" : "createCase", {
        id,
        data: Object.fromEntries(form),
      });
      toast(id ? "Case updated" : "Case added");
      root.remove();
      await loadData();
    } catch (err) {
      toast(err.message);
    }
  };
  if ($("deleteCase"))
    $("deleteCase").onclick = async () => {
      if (confirm(`Delete ${item.caseNo}?`)) {
        try {
          await api("deleteCase", { id });
          toast("Case deleted");
          root.remove();
          await loadData();
        } catch (err) {
          toast(err.message);
        }
      }
    };
}
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
render();
