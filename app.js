import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const LEGACY_STORAGE_KEY = "natural-ledger-records-v1";
const LEDGER_SELECT_COLUMNS = "id, entry_type, amount, occurred_on, occurred_time, category, purpose, note, created_at";

const CATEGORY_OPTIONS = [
  "餐饮",
  "交通",
  "购物",
  "住房",
  "日用",
  "娱乐",
  "医疗",
  "学习",
  "社交",
  "工资",
  "报销",
  "其他"
];

const CATEGORY_KEYWORDS = [
  { category: "餐饮", words: ["早餐", "午餐", "晚餐", "吃", "饭", "火锅", "咖啡", "奶茶", "外卖", "饮料", "零食"] },
  { category: "交通", words: ["地铁", "公交", "高铁", "火车", "机票", "打车", "滴滴", "加油", "停车", "过路费"] },
  { category: "购物", words: ["买", "购物", "衣服", "鞋", "包", "耳机", "手机", "电脑", "数码"] },
  { category: "住房", words: ["房租", "水电", "物业", "燃气", "宽带", "租房"] },
  { category: "日用", words: ["超市", "日用品", "纸巾", "洗发水", "牙膏", "生活用品"] },
  { category: "娱乐", words: ["电影", "游戏", "ktv", "演出", "旅游", "旅行", "门票"] },
  { category: "医疗", words: ["医院", "药", "挂号", "体检", "诊所"] },
  { category: "学习", words: ["书", "课程", "培训", "学费", "笔记本", "文具"] },
  { category: "社交", words: ["请客", "聚餐", "客户", "礼物", "红包", "同事"] },
  { category: "工资", words: ["工资", "薪资", "薪水", "奖金", "津贴"] },
  { category: "报销", words: ["报销", "退款", "返现", "退回"] }
];

const INCOME_KEYWORDS = ["收入", "赚了", "收到", "工资", "薪水", "奖金", "报销", "退款", "返现", "转入", "入账"];
const EXPENSE_KEYWORDS = ["花了", "用了", "支出", "付了", "支付", "买了", "买", "交了", "消费", "请客", "转出"];

const state = {
  supabase: null,
  config: null,
  isSetupReady: false,
  session: null,
  user: null,
  records: [],
  editingId: null,
  isSavingRecord: false,
  isLoadingRecords: false,
  selectedWeekStart: getStartOfWeek(new Date()),
  selectedMonthDate: getStartOfMonth(new Date())
};

const refs = {
  setupPanel: document.querySelector("#setup-panel"),
  guestPanel: document.querySelector("#guest-panel"),
  appShell: document.querySelector("#app-shell"),
  authForm: document.querySelector("#auth-form"),
  authEmail: document.querySelector("#auth-email"),
  authPassword: document.querySelector("#auth-password"),
  signInBtn: document.querySelector("#sign-in-btn"),
  signUpBtn: document.querySelector("#sign-up-btn"),
  sendLinkBtn: document.querySelector("#send-link-btn"),
  refreshSessionBtn: document.querySelector("#refresh-session-btn"),
  signOutBtn: document.querySelector("#sign-out-btn"),
  authStatus: document.querySelector("#auth-status"),
  syncTitle: document.querySelector("#sync-title"),
  syncDescription: document.querySelector("#sync-description"),
  currentUser: document.querySelector("#current-user"),
  syncState: document.querySelector("#sync-state"),
  entryInput: document.querySelector("#entry-input"),
  analyzeBtn: document.querySelector("#analyze-btn"),
  resetBtn: document.querySelector("#reset-btn"),
  status: document.querySelector("#analysis-status"),
  form: document.querySelector("#record-form"),
  type: document.querySelector("#record-type"),
  amount: document.querySelector("#record-amount"),
  date: document.querySelector("#record-date"),
  time: document.querySelector("#record-time"),
  category: document.querySelector("#record-category"),
  purpose: document.querySelector("#record-purpose"),
  note: document.querySelector("#record-note"),
  saveRecordBtn: document.querySelector("#save-record-btn"),
  monthlyExpense: document.querySelector("#monthly-expense"),
  monthlyIncome: document.querySelector("#monthly-income"),
  balanceTotal: document.querySelector("#balance-total"),
  recordCount: document.querySelector("#record-count"),
  reportTabWeekly: document.querySelector("#report-tab-weekly"),
  reportTabMonthly: document.querySelector("#report-tab-monthly"),
  weeklyPanel: document.querySelector("#weekly-report-panel"),
  monthlyPanel: document.querySelector("#monthly-report-panel"),
  weeklyPrevBtn: document.querySelector("#weekly-prev-btn"),
  weeklyNextBtn: document.querySelector("#weekly-next-btn"),
  weeklyRange: document.querySelector("#weekly-range"),
  weeklySummary: document.querySelector("#weekly-summary"),
  weeklyDailyList: document.querySelector("#weekly-daily-list"),
  weeklyCategoryList: document.querySelector("#weekly-category-list"),
  weeklyRecordsList: document.querySelector("#weekly-records-list"),
  monthlyPrevBtn: document.querySelector("#monthly-prev-btn"),
  monthlyNextBtn: document.querySelector("#monthly-next-btn"),
  monthlyRange: document.querySelector("#monthly-range"),
  monthlySummary: document.querySelector("#monthly-summary"),
  monthlyCategoryChart: document.querySelector("#monthly-category-chart"),
  monthlyTrendChart: document.querySelector("#monthly-trend-chart"),
  monthlyCategoryList: document.querySelector("#monthly-category-list"),
  monthlyWeekList: document.querySelector("#monthly-week-list"),
  monthlyDailyList: document.querySelector("#monthly-daily-list"),
  monthlyRecordsList: document.querySelector("#monthly-records-list"),
  trendList: document.querySelector("#trend-list"),
  recordsList: document.querySelector("#records-list"),
  exportBtn: document.querySelector("#export-btn"),
  seedBtn: document.querySelector("#seed-btn"),
  template: document.querySelector("#record-item-template")
};

init();

async function init() {
  populateCategoryOptions();
  bindEvents();
  fillDefaultDateTime();
  render();

  state.config = getSupabaseConfig();
  state.isSetupReady = Boolean(state.config.supabaseUrl && state.config.supabaseAnonKey);

  if (!state.isSetupReady) {
    refs.setupPanel?.classList.remove("hidden");
    setAuthStatus("请先完成 Supabase 配置，当前页面还不能登录。", "warn");
    updateSyncCard();
    return;
  }

  refs.setupPanel?.classList.add("hidden");
  state.supabase = createClient(state.config.supabaseUrl, state.config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  state.supabase.auth.onAuthStateChange(async (_event, session) => {
    const previousUserId = state.user?.id || null;
    state.session = session;
    state.user = session?.user || null;
    updateAuthUi();

    const nextUserId = state.user?.id || null;
    if (!nextUserId) {
      state.records = [];
      state.editingId = null;
      resetComposer();
      render();
      return;
    }

    if (previousUserId !== nextUserId) {
      await loadRecords({ importLegacy: true });
    }
  });

  await hydrateSession();
}

function bindEvents() {
  refs.authForm?.addEventListener("submit", handlePasswordSignIn);
  refs.signUpBtn?.addEventListener("click", handlePasswordSignUp);
  refs.sendLinkBtn?.addEventListener("click", handleMagicLinkSignIn);
  refs.refreshSessionBtn?.addEventListener("click", hydrateSession);
  refs.signOutBtn?.addEventListener("click", signOut);
  refs.analyzeBtn?.addEventListener("click", analyzeInput);
  refs.resetBtn?.addEventListener("click", resetComposer);
  refs.form?.addEventListener("submit", handleSaveRecord);
  refs.saveRecordBtn?.addEventListener("click", handleSaveRecord);
  refs.exportBtn?.addEventListener("click", exportCsv);
  refs.seedBtn?.addEventListener("click", seedExampleRecords);
  refs.reportTabWeekly?.addEventListener("click", () => setReportTab("weekly"));
  refs.reportTabMonthly?.addEventListener("click", () => setReportTab("monthly"));
  refs.weeklyPrevBtn?.addEventListener("click", () => {
    state.selectedWeekStart = addDays(state.selectedWeekStart, -7);
    renderReports();
  });
  refs.weeklyNextBtn?.addEventListener("click", () => {
    state.selectedWeekStart = addDays(state.selectedWeekStart, 7);
    renderReports();
  });
  refs.monthlyPrevBtn?.addEventListener("click", () => {
    state.selectedMonthDate = addMonths(state.selectedMonthDate, -1);
    renderReports();
  });
  refs.monthlyNextBtn?.addEventListener("click", () => {
    state.selectedMonthDate = addMonths(state.selectedMonthDate, 1);
    renderReports();
  });
  refs.entryInput?.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      analyzeInput();
    }
  });

  document.querySelectorAll(".sample-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (!refs.entryInput) {
        return;
      }
      refs.entryInput.value = chip.dataset.sample || "";
      if (state.user) {
        analyzeInput();
      }
    });
  });
}

function setReportTab(tab) {
  if (!refs.reportTabWeekly || !refs.reportTabMonthly || !refs.weeklyPanel || !refs.monthlyPanel) {
    return;
  }

  refs.reportTabWeekly.classList.toggle("is-active", tab === "weekly");
  refs.reportTabMonthly.classList.toggle("is-active", tab === "monthly");
  refs.weeklyPanel.classList.toggle("hidden", tab !== "weekly");
  refs.monthlyPanel.classList.toggle("hidden", tab !== "monthly");
}

function getSupabaseConfig() {
  const appConfig = window.APP_CONFIG || {};
  return {
    supabaseUrl: String(appConfig.supabaseUrl || "").trim(),
    supabaseAnonKey: String(appConfig.supabaseAnonKey || "").trim()
  };
}

async function hydrateSession() {
  if (!state.supabase) {
    return;
  }

  setAuthStatus("正在检查当前登录会话…", "idle");
  const { data, error } = await state.supabase.auth.getSession();
  if (error) {
    console.error(error);
    setAuthStatus(`会话检查失败：${error.message}`, "warn");
    return;
  }

  state.session = data.session;
  state.user = data.session?.user || null;
  updateAuthUi();

  if (state.user) {
    await loadRecords({ importLegacy: true });
  } else {
    render();
    setAuthStatus("当前未登录。你可以直接输入邮箱和密码登录，也可以使用魔法链接。", "idle");
  }
}

async function handleMagicLinkSignIn(event) {
  if (event) {
    event.preventDefault();
  }

  if (!state.supabase) {
    setAuthStatus("请先完成 Supabase 配置。", "warn");
    return;
  }

  const email = refs.authEmail.value.trim();
  if (!email) {
    setAuthStatus("请输入邮箱地址。", "warn");
    return;
  }

  refs.sendLinkBtn.disabled = true;
  setAuthStatus("正在发送登录链接，请稍候…", "idle");

  const { error } = await state.supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getRedirectUrl()
    }
  });

  refs.sendLinkBtn.disabled = false;

  if (error) {
    console.error(error);
    setAuthStatus(`发送失败：${error.message}`, "warn");
    return;
  }

  setAuthStatus("登录链接已发送，请去邮箱打开，再回到这个页面。", "success");
}

async function handlePasswordSignIn(event) {
  event.preventDefault();

  if (!state.supabase) {
    setAuthStatus("请先完成 Supabase 配置。", "warn");
    return;
  }

  const email = refs.authEmail.value.trim();
  const password = refs.authPassword?.value || "";

  if (!email) {
    setAuthStatus("请输入邮箱地址。", "warn");
    return;
  }

  if (!password) {
    setAuthStatus("请输入密码。", "warn");
    return;
  }

  refs.signInBtn.disabled = true;
  setAuthStatus("正在登录，请稍候…", "idle");

  const { error } = await state.supabase.auth.signInWithPassword({
    email,
    password
  });

  refs.signInBtn.disabled = false;

  if (error) {
    console.error(error);
    setAuthStatus(`密码登录失败：${error.message}`, "warn");
    return;
  }

  setAuthStatus("登录成功，正在同步你的账本。", "success");
}

async function handlePasswordSignUp() {
  if (!state.supabase) {
    setAuthStatus("请先完成 Supabase 配置。", "warn");
    return;
  }

  const email = refs.authEmail.value.trim();
  const password = refs.authPassword?.value || "";

  if (!email) {
    setAuthStatus("请输入邮箱地址。", "warn");
    return;
  }

  if (!password || password.length < 6) {
    setAuthStatus("密码至少需要 6 位。", "warn");
    return;
  }

  refs.signUpBtn.disabled = true;
  setAuthStatus("正在注册账号，请稍候…", "idle");

  const { data, error } = await state.supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectUrl()
    }
  });

  refs.signUpBtn.disabled = false;

  if (error) {
    console.error(error);
    setAuthStatus(`注册失败：${error.message}`, "warn");
    return;
  }

  if (data.session) {
    setAuthStatus("注册成功，已自动登录。", "success");
    return;
  }

  setAuthStatus("注册成功，请去邮箱完成确认，然后再回来用密码登录。", "success");
}

async function signOut() {
  if (!state.supabase) {
    setAuthStatus("当前未完成 Supabase 配置，无法退出。", "warn");
    return;
  }

  setAuthStatus("正在退出登录…", "idle");
  if (refs.signOutBtn) {
    refs.signOutBtn.disabled = true;
  }

  try {
    const { error } = await state.supabase.auth.signOut();
    if (error) {
      console.error(error);
      setAuthStatus(`退出失败：${error.message}`, "warn");
      return;
    }

    setAuthStatus("你已退出登录。", "success");
    if (refs.authPassword) {
      refs.authPassword.value = "";
    }
  } catch (error) {
    console.error(error);
    setAuthStatus(`退出时发生异常：${error.message || error}`, "warn");
  } finally {
    if (refs.signOutBtn) {
      refs.signOutBtn.disabled = false;
    }
  }
}

function getRedirectUrl() {
  return window.location.href.split("#")[0];
}

function updateAuthUi() {
  const isLoggedIn = Boolean(state.user);
  const hasInlineAuthEntry = Boolean(refs.authForm);
  refs.signOutBtn?.classList.toggle("hidden", !isLoggedIn);
  refs.guestPanel?.classList.toggle("hidden", isLoggedIn || !state.isSetupReady);
  refs.appShell?.classList.toggle("hidden", !isLoggedIn);

  if (!state.isSetupReady) {
    if (refs.syncTitle) refs.syncTitle.textContent = "待配置";
    if (refs.currentUser) refs.currentUser.textContent = "未连接";
    if (refs.syncState) refs.syncState.textContent = "待配置";
    if (refs.syncDescription) refs.syncDescription.textContent = "先把 Supabase 项目地址和 anon key 填进 config.js，再启用登录和云同步。";
    return;
  }

  if (!isLoggedIn) {
    if (refs.syncTitle) refs.syncTitle.textContent = "未登录";
    if (refs.currentUser) refs.currentUser.textContent = "匿名访客";
    if (refs.syncState) refs.syncState.textContent = "等待登录";
    if (refs.syncDescription) {
      refs.syncDescription.textContent = hasInlineAuthEntry
        ? "支持邮箱密码登录，魔法链接也可以作为备用方式；登录后同一账号跨设备会看到同一份账本。"
        : "请先回首页登录或切换账号；登录后同一账号跨设备会看到同一份账本。";
    }
    return;
  }

  if (refs.syncTitle) refs.syncTitle.textContent = "已连接";
  if (refs.currentUser) refs.currentUser.textContent = state.user.email || state.user.id;
  if (refs.syncState) refs.syncState.textContent = state.isLoadingRecords ? "同步中" : "已同步";
  if (refs.syncDescription) refs.syncDescription.textContent = "当前账本已和 Supabase 绑定。不同账号登录时，只会读取各自 user_id 对应的数据。";
}

function updateSyncCard() {
  updateAuthUi();
}

function populateCategoryOptions() {
  if (!refs.category) {
    return;
  }
  refs.category.innerHTML = CATEGORY_OPTIONS.map(
    (category) => `<option value="${category}">${category}</option>`
  ).join("");
}

function analyzeInput() {
  const rawText = refs.entryInput.value.trim();
  if (!rawText) {
    setStatus("请先输入一句话，例如“昨天午饭花了32元”。", "warn");
    return;
  }

  const parsed = parseNaturalLanguageEntry(rawText);
  fillForm(parsed);

  const hints = [];
  if (!parsed.amount) {
    hints.push("金额未识别");
  }
  if (!parsed.purpose || parsed.purpose === "未命名记录") {
    hints.push("用途较模糊");
  }

  if (hints.length) {
    setStatus(`已完成分析，但还需要你确认：${hints.join("、")}。`, "warn");
    return;
  }

  setStatus("分析完成，结果已经填入表单，可以直接保存。", "success");
}

function parseNaturalLanguageEntry(rawText) {
  const normalizedText = normalizeText(rawText);
  const type = inferType(normalizedText);
  const amountInfo = extractAmount(normalizedText);
  const dateInfo = extractDateTime(normalizedText);
  const category = inferCategory(normalizedText, type);
  const purpose = extractPurpose(normalizedText, {
    amountText: amountInfo.matchText,
    dateText: dateInfo.dateText,
    timeText: dateInfo.timeText
  });

  return {
    type,
    amount: amountInfo.amount,
    category,
    purpose,
    note: rawText,
    date: dateInfo.date,
    time: dateInfo.time
  };
}

function normalizeText(text) {
  return text
    .replace(/[，。；]/g, " ")
    .replace(/[：]/g, ":")
    .replace(/[（(]/g, " ")
    .replace(/[）)]/g, " ")
    .replace(/[￥¥]/g, "¥")
    .replace(/\s+/g, " ")
    .trim();
}

function inferType(text) {
  if (INCOME_KEYWORDS.some((word) => text.includes(word))) {
    return "income";
  }
  if (EXPENSE_KEYWORDS.some((word) => text.includes(word))) {
    return "expense";
  }
  return "expense";
}

function extractAmount(text) {
  const explicitPatterns = [
    /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:元|块钱|块|人民币)/i,
    /(?:花了|用了|支出|付了|支付|买了|消费|交了|收入|赚了|收到|报销|退款|转入|转出)\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    /¥\s*([0-9]+(?:\.[0-9]{1,2})?)/i
  ];

  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        amount: Number(match[1]),
        matchText: match[0]
      };
    }
  }

  const matches = Array.from(text.matchAll(/\d+(?:\.\d{1,2})?/g));
  const candidates = matches
    .map((match) => {
      const token = match[0];
      const index = match.index || 0;
      const prev = text[index - 1] || "";
      const next = text[index + token.length] || "";
      const nearCurrency = /(元|块|¥)/.test(text.slice(index, index + token.length + 2));
      const looksLikeDateOrTime = ["年", "月", "日", "号", ":", "点"].includes(next) || ["年", "月", ":"].includes(prev);

      return {
        amount: Number(token),
        matchText: token,
        score: (nearCurrency ? 3 : 0) + (looksLikeDateOrTime ? -5 : 0) + (Number(token) >= 1 ? 1 : 0)
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.amount - a.amount);

  return candidates[0] || { amount: null, matchText: "" };
}

function extractDateTime(text) {
  const now = new Date();
  let workingDate = new Date(now);
  let dateText = "";
  let timeText = "";

  const fullDateMatch = text.match(/(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?/);
  const monthDateMatch = text.match(/(\d{1,2})[月/-](\d{1,2})日?/);
  const relativeDayMap = [
    { token: "今天", offset: 0 },
    { token: "昨日", offset: -1 },
    { token: "昨天", offset: -1 },
    { token: "前天", offset: -2 },
    { token: "明天", offset: 1 }
  ];

  if (fullDateMatch) {
    workingDate = new Date(
      Number(fullDateMatch[1]),
      Number(fullDateMatch[2]) - 1,
      Number(fullDateMatch[3])
    );
    dateText = fullDateMatch[0];
  } else if (monthDateMatch) {
    workingDate = new Date(now.getFullYear(), Number(monthDateMatch[1]) - 1, Number(monthDateMatch[2]));
    dateText = monthDateMatch[0];
  } else {
    const relativeDay = relativeDayMap.find((item) => text.includes(item.token));
    if (relativeDay) {
      workingDate.setDate(now.getDate() + relativeDay.offset);
      dateText = relativeDay.token;
    } else {
      const weekMatch = text.match(/(上周|这周|本周)?([一二三四五六日天])(?:上午|中午|下午|晚上)?/);
      if (weekMatch && weekMatch[0].includes("周")) {
        workingDate = resolveWeekdayDate(weekMatch[1] || "这周", weekMatch[2], now);
        dateText = weekMatch[0];
      }
    }
  }

  const clockMatch = text.match(/(凌晨|早上|上午|中午|下午|晚上)?\s*(\d{1,2})(?:[:点时](\d{1,2}))?(半)?(?:分)?/);
  if (clockMatch && /[:点时]|半/.test(clockMatch[0])) {
    let hour = Number(clockMatch[2]);
    const minute = clockMatch[4] ? 30 : Number(clockMatch[3] || 0);
    const period = clockMatch[1] || "";

    if ((period === "下午" || period === "晚上") && hour < 12) {
      hour += 12;
    }
    if (period === "中午" && hour < 11) {
      hour += 12;
    }
    if (period === "凌晨" && hour === 12) {
      hour = 0;
    }

    workingDate.setHours(hour, minute, 0, 0);
    timeText = clockMatch[0];
  } else {
    workingDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
  }

  return {
    date: formatDateInput(workingDate),
    time: formatTimeInput(workingDate),
    dateText,
    timeText
  };
}

function resolveWeekdayDate(prefix, weekdayText, now) {
  const weekdayMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 };
  const target = weekdayMap[weekdayText];
  const date = new Date(now);
  const current = date.getDay();
  let diff = target - current;

  if (prefix === "上周") {
    diff -= 7;
  } else if (prefix === "这周" || prefix === "本周") {
    if (diff > 0) {
      diff -= 7;
    }
  }

  date.setDate(date.getDate() + diff);
  return date;
}

function inferCategory(text, type) {
  if (type === "income" && text.includes("工资")) {
    return "工资";
  }
  if (type === "income" && /(报销|退款|返现)/.test(text)) {
    return "报销";
  }

  for (const item of CATEGORY_KEYWORDS) {
    if (item.words.some((word) => text.toLowerCase().includes(word))) {
      return item.category;
    }
  }

  return "其他";
}

function extractPurpose(text, tokens) {
  let cleaned = text;
  [tokens.amountText, tokens.dateText, tokens.timeText].forEach((token) => {
    if (token) {
      cleaned = cleaned.replace(token, " ");
    }
  });

  cleaned = cleaned
    .replace(/(今天|昨天|前天|明天|上周|这周|本周|上午|中午|下午|晚上|凌晨|早上)/g, " ")
    .replace(/(花了|用了|支出|付了|支付|买了|消费|交了|收入|赚了|收到|报销|退款|转入|转出|一共|总共)/g, " ")
    .replace(/(元|块钱|块|人民币|¥)/g, " ")
    .replace(/\d+(?:\.\d{1,2})?/g, " ")
    .replace(/[,:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned.replace(/^[在把给跟和请]+/, "").trim();
  return cleaned || "未命名记录";
}

function fillForm(record, options = {}) {
  if (!refs.type || !refs.amount || !refs.date || !refs.time || !refs.category || !refs.purpose || !refs.note) {
    return;
  }
  state.editingId = options.preserveId ? record.id : null;
  refs.type.value = record.type;
  refs.amount.value = record.amount ?? "";
  refs.date.value = record.date;
  refs.time.value = record.time || "";
  refs.category.value = CATEGORY_OPTIONS.includes(record.category) ? record.category : "其他";
  refs.purpose.value = record.purpose;
  refs.note.value = record.note || "";
}

function fillDefaultDateTime() {
  if (!refs.date || !refs.time) {
    return;
  }
  const now = new Date();
  refs.date.value = formatDateInput(now);
  refs.time.value = formatTimeInput(now);
}

function setStatus(message, tone) {
  if (!refs.status) {
    return;
  }
  refs.status.textContent = message;
  refs.status.className = "status-card";
  refs.status.classList.add(`status-${tone || "idle"}`);
}

function setAuthStatus(message, tone) {
  if (!refs.authStatus) {
    return;
  }
  refs.authStatus.textContent = message;
  refs.authStatus.className = "status-card";
  refs.authStatus.classList.add(`status-${tone || "idle"}`);
}

async function loadRecords(options = {}) {
  if (!state.supabase || !state.user) {
    return;
  }

  state.isLoadingRecords = true;
  updateSyncCard();
  setAuthStatus("正在同步当前账号的账本…", "idle");

  const { data, error } = await state.supabase
    .from("ledger_entries")
    .select(LEDGER_SELECT_COLUMNS)
    .order("occurred_on", { ascending: false })
    .order("occurred_time", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    state.isLoadingRecords = false;
    updateSyncCard();
    console.error(error);
    setAuthStatus(`拉取账本失败：${error.message}`, "warn");
    return;
  }

  let records = data.map(mapRowToRecord);

  if (options.importLegacy && records.length === 0) {
    const imported = await importLegacyRecords();
    if (imported > 0) {
      const secondPass = await state.supabase
        .from("ledger_entries")
        .select(LEDGER_SELECT_COLUMNS)
        .order("occurred_on", { ascending: false })
        .order("occurred_time", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (!secondPass.error) {
        records = secondPass.data.map(mapRowToRecord);
      }
    }
  }

  state.records = sortRecords(records);
  state.isLoadingRecords = false;
  updateSyncCard();
  render();
  setAuthStatus(`已连接到云端账本，当前共有 ${state.records.length} 条记录。`, "success");
}

async function importLegacyRecords() {
  const legacy = loadLegacyRecords();
  if (!legacy.length || !state.user) {
    return 0;
  }

  const payload = legacy.map((record) => ({
    user_id: state.user.id,
    entry_type: record.type,
    amount: Number(record.amount || 0),
    occurred_on: record.date || formatDateInput(new Date()),
    occurred_time: record.time || null,
    category: record.category || "其他",
    purpose: record.purpose || "未命名记录",
    note: record.note || null
  }));

  const { error } = await state.supabase.from("ledger_entries").insert(payload);
  if (error) {
    console.error(error);
    setAuthStatus(`发现旧本地数据，但迁移失败：${error.message}`, "warn");
    return 0;
  }

  localStorage.removeItem(LEGACY_STORAGE_KEY);
  setAuthStatus(`已把 ${payload.length} 条旧本地记录迁移到当前账号。`, "success");
  return payload.length;
}

function loadLegacyRecords() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function handleSaveRecord(event) {
  event?.preventDefault();

  if (state.isSavingRecord) {
    return;
  }

  if (!state.user || !state.supabase) {
    setStatus("请先登录后再保存。", "warn");
    return;
  }

  const amount = Number(refs.amount.value);
  if (!amount || amount <= 0) {
    setStatus("保存前需要一个有效金额。", "warn");
    return;
  }

  const payload = {
    user_id: state.user.id,
    entry_type: refs.type.value,
    amount,
    occurred_on: refs.date.value || formatDateInput(new Date()),
    occurred_time: refs.time.value || null,
    category: refs.category.value,
    purpose: refs.purpose.value.trim() || "未命名记录",
    note: refs.note.value.trim() || null
  };

  const saveBtn = refs.saveRecordBtn || refs.form?.querySelector('button[type="submit"]');
  state.isSavingRecord = true;
  if (saveBtn) {
    saveBtn.disabled = true;
  }
  setStatus("正在保存到云端账本…", "idle");
  console.info("[ledger] save start", {
    editingId: state.editingId,
    userId: state.user.id,
    payload
  });

  try {
    let error = null;

    if (state.editingId) {
      const response = await state.supabase
        .from("ledger_entries")
        .update(payload)
        .eq("id", state.editingId)
        .eq("user_id", state.user.id)
        .select(LEDGER_SELECT_COLUMNS)
        .single();

      console.info("[ledger] update response", response);
      error = response.error;
      if (!error && response.data) {
        upsertLocalRecord(mapRowToRecord(response.data));
      }
    } else {
      const response = await state.supabase
        .from("ledger_entries")
        .insert(payload)
        .select(LEDGER_SELECT_COLUMNS)
        .single();
      console.info("[ledger] insert response", response);
      error = response.error;
      if (!error && response.data) {
        upsertLocalRecord(mapRowToRecord(response.data));
      }
    }

    if (error) {
      console.error(error);
      setStatus(`保存失败：${error.message}`, "warn");
      return;
    }

    resetComposer();
    render();
    setStatus("记录已保存到云端账本。", "success");
  } catch (error) {
    console.error(error);
    setStatus(`保存时发生异常：${error.message || error}`, "warn");
  } finally {
    state.isSavingRecord = false;
    if (saveBtn) {
      saveBtn.disabled = false;
    }
  }
}

function resetComposer() {
  state.editingId = null;
  if (refs.entryInput) {
    refs.entryInput.value = "";
  }
  refs.form?.reset();
  populateCategoryOptions();
  fillDefaultDateTime();
  if (refs.type) {
    refs.type.value = "expense";
  }
  setStatus("等待输入。点击“自动分析”后会把结果填入右侧表单。", "idle");
}

function render() {
  updateSyncCard();
  renderStats();
  renderReports();
  renderRecords();
}

function renderStats() {
  if (!refs.monthlyExpense || !refs.monthlyIncome || !refs.balanceTotal || !refs.recordCount) {
    return;
  }
  const currentMonth = formatMonthKey(new Date());
  let monthlyExpense = 0;
  let monthlyIncome = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  state.records.forEach((record) => {
    const monthKey = (record.date || "").slice(0, 7);
    if (record.type === "income") {
      totalIncome += record.amount;
      if (monthKey === currentMonth) {
        monthlyIncome += record.amount;
      }
    } else {
      totalExpense += record.amount;
      if (monthKey === currentMonth) {
        monthlyExpense += record.amount;
      }
    }
  });

  refs.monthlyExpense.textContent = formatCurrency(monthlyExpense);
  refs.monthlyIncome.textContent = formatCurrency(monthlyIncome);
  refs.balanceTotal.textContent = formatCurrency(totalIncome - totalExpense);
  refs.recordCount.textContent = String(state.records.length);
}

function renderReports() {
  setReportTab(state.selectedReportTab);
  renderWeeklyReport();
  renderMonthlyReport();
}

function renderWeeklyReport() {
  if (!refs.weeklyRange || !refs.weeklySummary || !refs.weeklyDailyList || !refs.weeklyCategoryList || !refs.weeklyRecordsList) {
    return;
  }
  state.selectedWeekStart = getStartOfWeek(state.selectedWeekStart);
  const weekStart = state.selectedWeekStart;
  const weekEnd = addDays(weekStart, 6);
  refs.weeklyRange.textContent = `${formatFriendlyDate(weekStart)} - ${formatFriendlyDate(weekEnd)}`;

  const weeklyRecords = state.records.filter((record) => isRecordInRange(record, weekStart, weekEnd));
  const weeklyIncome = sumAmounts(weeklyRecords.filter((record) => record.type === "income"));
  const weeklyExpense = sumAmounts(weeklyRecords.filter((record) => record.type === "expense"));
  const weeklyTopCategory = findTopExpenseCategory(weeklyRecords);
  const weekDailyBuckets = buildDailyBuckets(weekStart, 7, weeklyRecords);
  const peakDay = findPeakExpenseDay(weekDailyBuckets);

  refs.weeklySummary.innerHTML = renderSummaryTiles([
    { label: "本周收入", value: formatCurrency(weeklyIncome) },
    { label: "本周支出", value: formatCurrency(weeklyExpense) },
    { label: "本周净额", value: formatCurrency(weeklyIncome - weeklyExpense) },
    { label: "记录总数", value: `${weeklyRecords.length} 笔` },
    { label: "最高支出日", value: peakDay.label },
    { label: "最高支出分类", value: weeklyTopCategory.name }
  ]);

  renderDailyList(refs.weeklyDailyList, weekDailyBuckets, "本周还没有记录。");
  renderCategoryBreakdown(
    refs.weeklyCategoryList,
    weeklyRecords.filter((record) => record.type === "expense"),
    "本周还没有支出记录。"
  );
  renderReportRecordList(refs.weeklyRecordsList, weeklyRecords, "本周还没有账目明细。");
}

function renderMonthlyReport() {
  if (
    !refs.monthlyRange ||
    !refs.monthlySummary ||
    !refs.monthlyCategoryChart ||
    !refs.monthlyTrendChart ||
    !refs.monthlyCategoryList ||
    !refs.monthlyWeekList ||
    !refs.monthlyDailyList ||
    !refs.monthlyRecordsList ||
    !refs.trendList
  ) {
    return;
  }
  state.selectedMonthDate = getStartOfMonth(state.selectedMonthDate);
  const monthStart = state.selectedMonthDate;
  const monthEnd = getEndOfMonth(monthStart);
  refs.monthlyRange.textContent = formatMonthLabel(monthStart);

  const monthlyRecords = state.records.filter((record) => isRecordInRange(record, monthStart, monthEnd));
  const monthlyIncome = sumAmounts(monthlyRecords.filter((record) => record.type === "income"));
  const monthlyExpenseRecords = monthlyRecords.filter((record) => record.type === "expense");
  const monthlyExpense = sumAmounts(monthlyExpenseRecords);
  const monthlyTopCategory = findTopExpenseCategory(monthlyRecords);
  const monthDailyBuckets = buildDailyBuckets(monthStart, getDaysInMonth(monthStart), monthlyRecords);
  const monthlyTrend = buildMonthlyTrend(state.records, 6);
  const peakDay = findPeakExpenseDay(monthDailyBuckets);

  refs.monthlySummary.innerHTML = renderSummaryTiles([
    { label: "本月收入", value: formatCurrency(monthlyIncome) },
    { label: "本月支出", value: formatCurrency(monthlyExpense) },
    { label: "本月净额", value: formatCurrency(monthlyIncome - monthlyExpense) },
    { label: "记录总数", value: `${monthlyRecords.length} 笔` },
    { label: "最高支出分类", value: monthlyTopCategory.name },
    { label: "最高支出日", value: peakDay.label }
  ]);

  renderMonthlyCategoryChart(refs.monthlyCategoryChart, monthlyExpenseRecords, "本月还没有支出数据，先记几笔再来看图表。");
  renderCategoryBreakdown(refs.monthlyCategoryList, monthlyExpenseRecords, "本月还没有支出记录。");
  renderWeeklySlices(refs.monthlyWeekList, buildMonthWeekBuckets(monthStart, monthEnd, monthlyRecords), "本月还没有周度数据。");
  renderDailyList(refs.monthlyDailyList, monthDailyBuckets, "本月还没有每日流水。");
  renderMonthlyTrendChart(refs.monthlyTrendChart, monthlyTrend, "至少要有一个月的数据，图表趋势才会更清晰。");
  renderTrendList(refs.trendList, monthlyTrend, "至少要有一个月的数据，趋势图才会更有意思。");
  renderReportRecordList(refs.monthlyRecordsList, monthlyRecords, "本月还没有账目明细。");
}

function renderSummaryTiles(items) {
  return items
    .map(
      (item) => `
        <article class="report-tile">
          <p>${item.label}</p>
          <strong class="report-number">${item.value}</strong>
        </article>
      `
    )
    .join("");
}

function renderCategoryBreakdown(target, expenseRecords, emptyMessage) {
  if (!expenseRecords.length) {
    target.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  const grouped = expenseRecords.reduce((map, record) => {
    map[record.category] = (map[record.category] || 0) + record.amount;
    return map;
  }, {});

  const items = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  const maxValue = items[0][1];

  target.innerHTML = items
    .map(([category, amount]) => {
      const width = Math.max((amount / maxValue) * 100, 6);
      return `
        <div class="breakdown-item">
          <div class="breakdown-row">
            <strong>${category}</strong>
            <span>${formatCurrency(amount)}</span>
          </div>
          <div class="breakdown-track">
            <div class="breakdown-bar" style="width:${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderDailyList(target, buckets, emptyMessage) {
  const hasAnyValue = buckets.some((bucket) => bucket.income > 0 || bucket.expense > 0);
  if (!hasAnyValue) {
    target.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  const maxAmount = Math.max(...buckets.map((bucket) => Math.max(bucket.income, bucket.expense)), 1);
  target.innerHTML = buckets
    .map((bucket) => {
      const incomeWidth = Math.max((bucket.income / maxAmount) * 100, bucket.income > 0 ? 6 : 0);
      const expenseWidth = Math.max((bucket.expense / maxAmount) * 100, bucket.expense > 0 ? 6 : 0);
      return `
        <div class="daily-item">
          <div class="daily-row">
            <strong>${bucket.label}</strong>
            <span>${formatCurrency(bucket.income - bucket.expense)}</span>
          </div>
          <div class="daily-track">
            <div class="daily-bar"><div class="daily-bar-fill income" style="width:${incomeWidth}%"></div></div>
            <div class="daily-bar"><div class="daily-bar-fill expense" style="width:${expenseWidth}%"></div></div>
          </div>
          <div class="daily-row daily-meta">
            <span>收入 ${formatCurrency(bucket.income)} / 支出 ${formatCurrency(bucket.expense)}</span>
            <span>${bucket.count} 笔</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderWeeklySlices(target, buckets, emptyMessage) {
  if (!buckets.length || buckets.every((bucket) => bucket.income === 0 && bucket.expense === 0)) {
    target.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  const maxAmount = Math.max(...buckets.map((bucket) => Math.max(bucket.income, bucket.expense)), 1);
  target.innerHTML = buckets
    .map((bucket) => {
      const width = Math.max((Math.max(bucket.income, bucket.expense) / maxAmount) * 100, 6);
      const dominantClass = bucket.income >= bucket.expense ? "income" : "expense";
      return `
        <div class="week-item">
          <div class="week-row">
            <strong>${bucket.label}</strong>
            <span>${formatCurrency(bucket.income - bucket.expense)}</span>
          </div>
          <div class="week-track"><div class="week-bar-fill ${dominantClass}" style="width:${width}%"></div></div>
          <div class="week-row week-meta">
            <span>收入 ${formatCurrency(bucket.income)} / 支出 ${formatCurrency(bucket.expense)}</span>
            <span>${bucket.count} 笔</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTrendList(target, trend, emptyMessage) {
  if (!trend.length || trend.every((item) => item.income === 0 && item.expense === 0)) {
    target.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  const maxAmount = Math.max(...trend.map((item) => Math.max(item.income, item.expense)), 1);
  target.innerHTML = trend
    .map((item) => {
      const incomeWidth = Math.max((item.income / maxAmount) * 100, item.income > 0 ? 6 : 0);
      const expenseWidth = Math.max((item.expense / maxAmount) * 100, item.expense > 0 ? 6 : 0);
      return `
        <div class="trend-item">
          <div class="trend-row">
            <strong>${item.label}</strong>
            <span>收入 ${formatCurrency(item.income)} / 支出 ${formatCurrency(item.expense)}</span>
          </div>
          <div class="trend-stack">
            <div class="trend-track"><div class="trend-income" style="width:${incomeWidth}%"></div></div>
            <div class="trend-track"><div class="trend-expense" style="width:${expenseWidth}%"></div></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderMonthlyCategoryChart(target, expenseRecords, emptyMessage) {
  if (!target) {
    return;
  }

  if (!expenseRecords.length) {
    target.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  const grouped = expenseRecords.reduce((map, record) => {
    map[record.category] = (map[record.category] || 0) + record.amount;
    return map;
  }, {});

  const entries = Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0) || 1;
  const topAmount = entries[0]?.[1] || 1;

  target.innerHTML = `
    <div class="chart-shell">
      <p class="chart-caption">本月支出最多的分类会排在最上面，条越长代表占比越高。</p>
      <div class="category-chart">
        ${entries
          .map(([category, amount]) => {
            const ratio = (amount / total) * 100;
            const width = Math.max((amount / topAmount) * 100, 10);
            return `
              <article class="category-bar-item">
                <div class="category-bar-head">
                  <strong class="category-bar-label">${escapeHtml(category || "未分类")}</strong>
                  <span class="category-bar-value">${formatCurrency(amount)} · ${ratio.toFixed(1)}%</span>
                </div>
                <div class="category-bar-track">
                  <div class="category-bar-fill" style="width:${width}%"></div>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
      <p class="chart-note">仅统计本月支出记录，最多展示前 6 个分类。</p>
    </div>
  `;
}

function renderMonthlyTrendChart(target, trend, emptyMessage) {
  if (!target) {
    return;
  }

  if (!trend.length || trend.every((item) => item.income === 0 && item.expense === 0)) {
    target.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  const maxAmount = Math.max(...trend.map((item) => Math.max(item.income, item.expense)), 1);

  target.innerHTML = `
    <div class="chart-shell trend-chart">
      <div class="chart-legend">
        <span class="legend-chip" style="--legend-color: var(--income)">收入</span>
        <span class="legend-chip" style="--legend-color: var(--expense)">支出</span>
      </div>
      <div class="trend-plot">
        ${trend
          .map((item) => {
            const incomeHeight = Math.max((item.income / maxAmount) * 100, item.income > 0 ? 8 : 0);
            const expenseHeight = Math.max((item.expense / maxAmount) * 100, item.expense > 0 ? 8 : 0);
            return `
              <article class="trend-column">
                <div class="trend-bars">
                  <div class="trend-bar trend-bar-income" style="height:${incomeHeight}%"></div>
                  <div class="trend-bar trend-bar-expense" style="height:${expenseHeight}%"></div>
                </div>
                <strong class="trend-column-label">${escapeHtml(item.label)}</strong>
                <span class="trend-column-values">收 ${formatCompactCurrency(item.income)}<br />支 ${formatCompactCurrency(item.expense)}</span>
              </article>
            `;
          })
          .join("")}
      </div>
      <p class="chart-note">同一月份里，绿色代表收入，橙色代表支出。</p>
    </div>
  `;
}

function buildMonthlyTrend(records, monthsBack) {
  const buckets = [];
  const cursor = new Date();
  cursor.setDate(1);

  for (let index = monthsBack - 1; index >= 0; index -= 1) {
    const monthDate = new Date(cursor.getFullYear(), cursor.getMonth() - index, 1);
    const key = formatMonthKey(monthDate);
    buckets.push({
      key,
      label: `${monthDate.getMonth() + 1}月`,
      income: 0,
      expense: 0
    });
  }

  records.forEach((record) => {
    const bucket = buckets.find((item) => item.key === (record.date || "").slice(0, 7));
    if (!bucket) {
      return;
    }

    if (record.type === "income") {
      bucket.income += record.amount;
    } else {
      bucket.expense += record.amount;
    }
  });

  return buckets;
}

function findTopExpenseCategory(records) {
  const map = {};
  records
    .filter((record) => record.type === "expense")
    .forEach((record) => {
      map[record.category] = (map[record.category] || 0) + record.amount;
    });

  const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
  return top ? { name: top[0], amount: top[1] } : { name: "暂无", amount: 0 };
}

function findPeakExpenseDay(buckets) {
  const top = [...buckets].sort((a, b) => b.expense - a.expense)[0];
  if (!top || top.expense <= 0) {
    return { label: "暂无", amount: 0 };
  }
  return { label: top.label, amount: top.expense };
}

function buildDailyBuckets(startDate, days, records) {
  return Array.from({ length: days }, (_, index) => {
    const currentDate = addDays(startDate, index);
    const isoDate = formatDateInput(currentDate);
    const dayRecords = records.filter((record) => record.date === isoDate);
    return {
      date: isoDate,
      label: formatDayBucketLabel(currentDate, days <= 7),
      income: sumAmounts(dayRecords.filter((record) => record.type === "income")),
      expense: sumAmounts(dayRecords.filter((record) => record.type === "expense")),
      count: dayRecords.length
    };
  });
}

function buildMonthWeekBuckets(monthStart, monthEnd, records) {
  const buckets = [];
  let cursor = getStartOfWeek(monthStart);

  while (cursor <= monthEnd) {
    const sliceStart = new Date(cursor);
    const sliceEnd = addDays(sliceStart, 6);
    const visibleStart = sliceStart < monthStart ? monthStart : sliceStart;
    const visibleEnd = sliceEnd > monthEnd ? monthEnd : sliceEnd;
    const sliceRecords = records.filter((record) => isRecordInRange(record, visibleStart, visibleEnd));

    buckets.push({
      label: `${visibleStart.getMonth() + 1}/${visibleStart.getDate()} - ${visibleEnd.getMonth() + 1}/${visibleEnd.getDate()}`,
      income: sumAmounts(sliceRecords.filter((record) => record.type === "income")),
      expense: sumAmounts(sliceRecords.filter((record) => record.type === "expense")),
      count: sliceRecords.length
    });

    cursor = addDays(sliceStart, 7);
  }

  return buckets;
}

function renderReportRecordList(target, records, emptyMessage) {
  if (!records.length) {
    target.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  const sorted = [...records].sort((a, b) => {
    const left = `${a.date}T${a.time || "00:00"}`;
    const right = `${b.date}T${b.time || "00:00"}`;
    return right.localeCompare(left);
  });

  target.innerHTML = sorted
    .map(
      (record) => `
        <article class="record-item">
          <div class="record-main">
            <div class="record-heading">
              <h3>${escapeHtml(record.purpose)}</h3>
              <span class="record-amount ${record.type === "income" ? "amount-income" : "amount-expense"}">
                ${record.type === "income" ? "+" : "-"}${formatCurrency(record.amount)}
              </span>
            </div>
            <p class="record-meta">${escapeHtml(record.date)} ${escapeHtml(record.time || "")} · ${escapeHtml(record.category)} · ${record.type === "income" ? "收入" : "支出"}</p>
            <p class="record-note">${escapeHtml(record.note || "无原始描述")}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderRecords() {
  if (!refs.recordsList) {
    return;
  }
  if (!state.records.length) {
    refs.recordsList.innerHTML = '<div class="empty-state">当前账号还没有账目。登录后点一条示例句子，或者直接录入你自己的消费记录。</div>';
    return;
  }

  refs.recordsList.innerHTML = "";
  const batch = document.createDocumentFragment();

  state.records.forEach((record) => {
    const fragment = refs.template.content.cloneNode(true);
    const amountEl = fragment.querySelector(".record-amount");

    fragment.querySelector(".record-purpose").textContent = record.purpose;
    amountEl.textContent = `${record.type === "income" ? "+" : "-"}${formatCurrency(record.amount)}`;
    amountEl.classList.add(record.type === "income" ? "amount-income" : "amount-expense");
    fragment.querySelector(".record-meta").textContent = `${record.date} ${record.time || ""} · ${record.category} · ${record.type === "income" ? "收入" : "支出"}`;
    fragment.querySelector(".record-note").textContent = record.note || "无原始描述";

    fragment.querySelector(".record-edit-btn").addEventListener("click", () => {
      fillForm(record, { preserveId: true });
      refs.entryInput.value = record.note || record.purpose;
      setStatus("这条记录已回填到表单，你可以修改后重新保存。", "success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    fragment.querySelector(".record-delete-btn").addEventListener("click", async () => {
      if (!state.supabase || !state.user) {
        return;
      }

      const { error } = await state.supabase
        .from("ledger_entries")
        .delete()
        .eq("id", record.id)
        .eq("user_id", state.user.id);

      if (error) {
        console.error(error);
        setStatus(`删除失败：${error.message}`, "warn");
        return;
      }

      removeLocalRecord(record.id);
      render();
      setStatus("记录已删除。", "success");
    });
    batch.appendChild(fragment);
  });

  refs.recordsList.appendChild(batch);
}

function exportCsv() {
  if (!state.records.length) {
    setStatus("当前没有可导出的记录。", "warn");
    return;
  }

  const lines = [
    ["id", "type", "amount", "date", "time", "category", "purpose", "note"].join(","),
    ...state.records.map((record) =>
      [
        record.id,
        record.type,
        record.amount,
        record.date,
        record.time || "",
        csvEscape(record.category),
        csvEscape(record.purpose),
        csvEscape(record.note || "")
      ].join(",")
    )
  ];

  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ledger-export-${formatDateInput(new Date())}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("CSV 已导出。", "success");
}

function csvEscape(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function seedExampleRecords() {
  if (!state.user || !state.supabase) {
    setStatus("请先登录。", "warn");
    return;
  }

  if (state.records.length) {
    setStatus("当前账号已有真实数据，我就不自动写入示例了，避免打乱你的账本。", "warn");
    return;
  }

  const payload = [
    {
      user_id: state.user.id,
      entry_type: "expense",
      amount: 12,
      occurred_on: formatDateInput(new Date()),
      occurred_time: "08:20",
      category: "餐饮",
      purpose: "早餐豆浆油条",
      note: "今天早餐豆浆油条花了12元"
    },
    {
      user_id: state.user.id,
      entry_type: "expense",
      amount: 86.5,
      occurred_on: shiftDate(-1),
      occurred_time: "18:40",
      category: "交通",
      purpose: "打车去机场",
      note: "昨天打车去浦东机场用了86.5"
    },
    {
      user_id: state.user.id,
      entry_type: "income",
      amount: 520,
      occurred_on: "2026-04-20",
      occurred_time: "10:30",
      category: "报销",
      purpose: "项目报销",
      note: "4月20日收到项目报销520元"
    }
  ];

  const { error } = await state.supabase.from("ledger_entries").insert(payload);
  if (error) {
    console.error(error);
    setStatus(`示例数据写入失败：${error.message}`, "warn");
    return;
  }

  await loadRecords();
  setStatus("示例数据已写入当前账号，方便你先检查报表和同步效果。", "success");
}

function shiftDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDateInput(date);
}

function mapRowToRecord(row) {
  return {
    id: row.id,
    type: row.entry_type,
    amount: Number(row.amount),
    date: row.occurred_on,
    time: row.occurred_time || "",
    category: row.category,
    purpose: row.purpose,
    note: row.note || ""
  };
}

function sortRecords(records) {
  return [...records].sort((a, b) => {
    const left = `${a.date}T${a.time || "00:00"}`;
    const right = `${b.date}T${b.time || "00:00"}`;
    return right.localeCompare(left);
  });
}

function upsertLocalRecord(record) {
  const next = state.records.filter((item) => item.id !== record.id);
  next.push(record);
  state.records = sortRecords(next);
}

function removeLocalRecord(recordId) {
  state.records = state.records.filter((item) => item.id !== recordId);
}

function sumAmounts(records) {
  return records.reduce((sum, record) => sum + Number(record.amount || 0), 0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseDateInput(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function getStartOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + diff);
  return next;
}

function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getDaysInMonth(date) {
  return getEndOfMonth(date).getDate();
}

function addDays(date, offset) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function addMonths(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function isRecordInRange(record, startDate, endDate) {
  const recordDate = parseDateInput(record.date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return recordDate >= start && recordDate <= end;
}

function formatFriendlyDate(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatMonthLabel(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatDayBucketLabel(date, includeWeekday) {
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
  if (includeWeekday) {
    return `${weekday} · ${date.getMonth() + 1}/${date.getDate()}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()} · ${weekday}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY"
  }).format(Number(value || 0));
}

function formatCompactCurrency(value) {
  const amount = Number(value || 0);
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  }
  return amount.toFixed(0);
}

function formatDateInput(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function formatTimeInput(date) {
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0")
  ].join(":");
}

function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
