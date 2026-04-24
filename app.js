(function () {
  const APP_NAME = "云朵账本";
  const RECORDS_TABLE = "natural_ledger_records";
  const RELOAD_EVENT_KEY = "cloud-ledger-reload-v1";
  const SYNC_CHANNEL_NAME = "cloud-ledger-sync";
  const LEDGER_SELECT_COLUMNS = "id, user_id, entry_type, amount, occurred_on, occurred_time, category, account, purpose, note, created_at, updated_at";

  const CATEGORY_OPTIONS = [
    "餐饮",
    "出行",
    "外卖",
    "奶茶",
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
    "理财",
    "其他"
  ];

  const CATEGORY_KEYWORDS = [
    { category: "餐饮", words: ["早餐", "午餐", "午饭", "晚餐", "晚饭", "吃", "饭", "火锅", "咖啡", "饮料", "零食"] },
    { category: "出行", words: ["高铁", "火车票", "车票", "打车"] },
    { category: "奶茶", words: ["奶茶", "珍珠", "奶盖", "茶饮", "果茶", "喜茶", "COCO", "贡茶", "一点点"] },
    { category: "外卖", words: ["外卖", "饿了么", "美团", "外送", "送餐", "点餐"] },
    { category: "交通", words: ["地铁", "公交", "高铁", "火车", "打车", "滴滴", "机票", "停车", "加油", "过路费"] },
    { category: "学习", words: ["买书", "书", "课程", "学费", "培训", "文具", "笔记本"] },
    { category: "住房", words: ["房租", "租房", "水电", "物业", "燃气", "宽带"] },
    { category: "日用", words: ["超市", "纸巾", "洗发水", "牙膏", "日用品", "生活用品"] },
    { category: "娱乐", words: ["电影", "游戏", "ktv", "演出", "门票", "旅游", "旅行"] },
    { category: "医疗", words: ["医院", "药", "挂号", "体检", "诊所"] },
    { category: "社交", words: ["请客", "聚餐", "礼物", "红包", "客户", "同事"] },
    { category: "工资", words: ["工资", "薪资", "薪水", "奖金", "津贴"] },
    { category: "报销", words: ["报销", "退款", "返现", "退回"] },
    { category: "理财", words: ["收益", "理财", "基金", "利息", "分红"] },
    { category: "购物", words: ["买", "购物", "衣服", "鞋", "包", "耳机", "手机", "电脑", "数码"] }
  ];

  const INCOME_KEYWORDS = ["收入", "赚了", "收到", "工资", "薪水", "奖金", "报销", "退款", "返现", "转入", "入账", "收益"];
  const EXPENSE_KEYWORDS = ["花了", "用了", "支出", "付了", "支付", "买了", "买", "交了", "消费", "请客", "转出"];
  const ACCOUNT_OPTIONS = ["微信", "支付宝", "银行卡", "信用卡", "现金", "其他"];

  const page = document.body.dataset.page || "home";

  const refs = {
    authPanel: byId("auth-panel"),
    authForm: byId("auth-form"),
    authEmail: byId("auth-email"),
    authPassword: byId("auth-password"),
    signInBtn: byId("sign-in-btn"),
    signUpBtn: byId("sign-up-btn"),
    signOutBtn: byId("sign-out-btn"),
    authStatus: byId("auth-status"),
    currentUserChip: byId("current-user-chip"),
    syncRefreshBtn: byId("sync-refresh-btn"),
    homeSyncTitle: byId("home-sync-title"),
    homeSyncDescription: byId("home-sync-description"),
    homeCurrentUser: byId("home-current-user"),
    homeSyncState: byId("home-sync-state"),
    pageSyncTitle: byId("page-sync-title"),
    pageSyncDescription: byId("page-sync-description"),
    pageCurrentUser: byId("page-current-user"),
    pageRecordCount: byId("page-record-count"),
    guestPanel: byId("guest-panel"),
    appShell: byId("app-shell"),

    balanceTotal: byId("balance-total"),
    monthlyExpense: byId("monthly-expense"),
    monthlyIncome: byId("monthly-income"),
    recordCount: byId("record-count"),

    quickInput: byId("quick-input"),
    analyzeBtn: byId("analyze-btn"),
    form: byId("record-form"),
    type: byId("record-type"),
    amount: byId("record-amount"),
    date: byId("record-date"),
    time: byId("record-time"),
    category: byId("record-category"),
    account: byId("record-account"),
    purpose: byId("record-purpose"),
    note: byId("record-note"),
    saveBtn: byId("save-btn"),
    clearFormBtn: byId("clear-form-btn"),
    cancelEditBtn: byId("cancel-edit-btn"),
    formStatus: byId("form-status"),
    seedBtn: byId("seed-btn"),
    exportBtn: byId("export-btn"),
    backupBtn: byId("backup-btn"),
    clearAllBtn: byId("clear-all-btn"),
    importFile: byId("import-file"),
    searchInput: byId("search-input"),
    filterType: byId("filter-type"),
    filterMonth: byId("filter-month"),
    sortOrder: byId("sort-order"),
    recordsList: byId("records-list"),
    recordTemplate: byId("record-template"),

    weeklyPrevBtn: byId("weekly-prev-btn"),
    weeklyNextBtn: byId("weekly-next-btn"),
    weeklyRange: byId("weekly-range"),
    weeklySummary: byId("weekly-summary"),
    weeklyDailyList: byId("weekly-daily-list"),
    weeklyCategoryList: byId("weekly-category-list"),
    weeklyRecordsList: byId("weekly-records-list"),

    monthlyPrevBtn: byId("monthly-prev-btn"),
    monthlyNextBtn: byId("monthly-next-btn"),
    monthlyRange: byId("monthly-range"),
    monthlySummary: byId("monthly-summary"),
    monthlyCategoryChart: byId("monthly-category-chart"),
    monthlyTrendChart: byId("monthly-trend-chart"),
    monthlyCategoryList: byId("monthly-category-list"),
    monthlyWeekList: byId("monthly-week-list"),
    monthlyDailyList: byId("monthly-daily-list"),
    monthlyRecordsList: byId("monthly-records-list"),
    trendList: byId("trend-list")
  };

  const state = {
    config: null,
    supabase: null,
    isSetupReady: false,
    session: null,
    currentUser: null,
    records: [],
    editingId: null,
    isLoadingRecords: false,
    isSavingRecord: false,
    realtimeChannel: null,
    broadcastChannel: null,
    reloadTimer: null,
    selectedWeekStart: getStartOfWeek(new Date()),
    selectedMonthDate: getStartOfMonth(new Date())
  };

  init();

  function byId(id) {
    return document.getElementById(id);
  }

  async function init() {
    populateCategoryOptions();
    fillDefaultDateTime();
    bindGlobalEvents();
    bindLedgerEvents();
    bindReportEvents();
    bindSyncEvents();
    bindSampleChips();
    renderAll();

    state.config = getSupabaseConfig();
    state.isSetupReady = Boolean(state.config.supabaseUrl && state.config.supabaseAnonKey);

    if (!state.isSetupReady) {
      handleSetupMissing();
      return;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      setAuthStatus("Supabase SDK 加载失败，请检查网络或刷新页面。", "warn");
      return;
    }

    state.supabase = window.supabase.createClient(state.config.supabaseUrl, state.config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    state.supabase.auth.onAuthStateChange(async function (_event, session) {
      const previousUserId = state.currentUser && state.currentUser.id ? state.currentUser.id : null;
      state.session = session;
      state.currentUser = session && session.user ? session.user : null;
      updateAuthUi();

      const nextUserId = state.currentUser && state.currentUser.id ? state.currentUser.id : null;
      if (!nextUserId) {
        stopRealtimeSync();
        state.records = [];
        state.editingId = null;
        renderAll();
        return;
      }

      if (previousUserId !== nextUserId) {
        startRealtimeSync();
        await loadRecords({ reason: "auth-change" });
      }
    });

    await hydrateSession();
  }

  function getSupabaseConfig() {
    const config = window.APP_CONFIG || {};
    return {
      supabaseUrl: String(config.supabaseUrl || "").trim(),
      supabaseAnonKey: String(config.supabaseAnonKey || "").trim()
    };
  }

  function handleSetupMissing() {
    updateAuthUi();
    setAuthStatus("请先编辑 config.js，填入 Supabase 项目地址和 publishable key。", "warn");
    if (refs.formStatus) {
      setStatus("当前未完成 Supabase 配置，记账功能暂不可用。", "warn");
    }
  }

  function bindGlobalEvents() {
    if (refs.authForm) {
      refs.authForm.addEventListener("submit", handleSignIn);
    }
    if (refs.signUpBtn) {
      refs.signUpBtn.addEventListener("click", handleSignUp);
    }
    if (refs.signOutBtn) {
      refs.signOutBtn.addEventListener("click", handleSignOut);
    }
    if (refs.syncRefreshBtn) {
      refs.syncRefreshBtn.addEventListener("click", function () {
        if (!state.currentUser) {
          setAuthStatus("请先登录后再刷新账本。", "warn");
          return;
        }
        loadRecords({ reason: "manual-refresh", force: true });
      });
    }
  }

  function bindLedgerEvents() {
    if (refs.analyzeBtn) refs.analyzeBtn.addEventListener("click", handleAnalyze);
    if (refs.form) refs.form.addEventListener("submit", handleSaveRecord);
    if (refs.clearFormBtn) refs.clearFormBtn.addEventListener("click", resetForm);
    if (refs.cancelEditBtn) refs.cancelEditBtn.addEventListener("click", cancelEdit);
    if (refs.seedBtn) refs.seedBtn.addEventListener("click", seedDemoData);
    if (refs.exportBtn) refs.exportBtn.addEventListener("click", exportCsv);
    if (refs.backupBtn) refs.backupBtn.addEventListener("click", exportJsonBackup);
    if (refs.clearAllBtn) refs.clearAllBtn.addEventListener("click", clearAllRecords);
    if (refs.importFile) refs.importFile.addEventListener("change", importJsonBackup);
    if (refs.searchInput) refs.searchInput.addEventListener("input", renderRecords);
    if (refs.filterType) refs.filterType.addEventListener("change", renderRecords);
    if (refs.filterMonth) refs.filterMonth.addEventListener("change", renderRecords);
    if (refs.sortOrder) refs.sortOrder.addEventListener("change", renderRecords);
    if (refs.quickInput) {
      refs.quickInput.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          handleAnalyze();
        }
      });
    }
  }

  function bindReportEvents() {
    if (refs.weeklyPrevBtn) {
      refs.weeklyPrevBtn.addEventListener("click", function () {
        state.selectedWeekStart = addDays(state.selectedWeekStart, -7);
        renderWeeklyReport();
      });
    }
    if (refs.weeklyNextBtn) {
      refs.weeklyNextBtn.addEventListener("click", function () {
        state.selectedWeekStart = addDays(state.selectedWeekStart, 7);
        renderWeeklyReport();
      });
    }
    if (refs.monthlyPrevBtn) {
      refs.monthlyPrevBtn.addEventListener("click", function () {
        state.selectedMonthDate = addMonths(state.selectedMonthDate, -1);
        renderMonthlyReport();
      });
    }
    if (refs.monthlyNextBtn) {
      refs.monthlyNextBtn.addEventListener("click", function () {
        state.selectedMonthDate = addMonths(state.selectedMonthDate, 1);
        renderMonthlyReport();
      });
    }
  }

  function bindSampleChips() {
    document.querySelectorAll(".sample-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (!refs.quickInput) return;
        refs.quickInput.value = chip.dataset.sample || "";
        handleAnalyze();
      });
    });
  }


  function bindSyncEvents() {
    if (typeof window.BroadcastChannel === "function") {
      state.broadcastChannel = new window.BroadcastChannel(SYNC_CHANNEL_NAME);
      state.broadcastChannel.addEventListener("message", function (event) {
        const data = event && event.data ? event.data : null;
        if (!data || data.type !== "records-updated") return;
        if (state.currentUser && data.userId === state.currentUser.id) {
          scheduleRecordsReload("broadcast");
        }
      });
    }

    window.addEventListener("storage", function (event) {
      if (event.key !== RELOAD_EVENT_KEY || !event.newValue || !state.currentUser) return;
      try {
        const payload = JSON.parse(event.newValue);
        if (payload.userId === state.currentUser.id) {
          scheduleRecordsReload("storage");
        }
      } catch (_error) {
        scheduleRecordsReload("storage");
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        scheduleRecordsReload("visibility");
      }
    });

    window.addEventListener("focus", function () {
      scheduleRecordsReload("focus");
    });

    window.addEventListener("pageshow", function () {
      scheduleRecordsReload("pageshow");
    });
  }

  function scheduleRecordsReload(reason) {
    if (!state.currentUser || !state.supabase) return;
    if (state.reloadTimer) {
      window.clearTimeout(state.reloadTimer);
    }
    state.reloadTimer = window.setTimeout(function () {
      state.reloadTimer = null;
      loadRecords({ reason: reason || "scheduled-refresh", silentStatus: true, force: true });
    }, 180);
  }

  function notifyRecordsChanged(reason) {
    if (!state.currentUser) return;
    const payload = {
      type: "records-updated",
      userId: state.currentUser.id,
      reason: reason || "mutation",
      at: Date.now()
    };

    try {
      localStorage.setItem(RELOAD_EVENT_KEY, JSON.stringify(payload));
    } catch (_error) {}

    if (state.broadcastChannel) {
      state.broadcastChannel.postMessage(payload);
    }
  }

  function startRealtimeSync() {
    if (!state.supabase || !state.currentUser) return;
    stopRealtimeSync();

    state.realtimeChannel = state.supabase
      .channel("ledger-sync-" + state.currentUser.id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: RECORDS_TABLE,
          filter: "user_id=eq." + state.currentUser.id
        },
        function () {
          scheduleRecordsReload("realtime");
        }
      )
      .subscribe();
  }

  function stopRealtimeSync() {
    if (!state.supabase || !state.realtimeChannel) return;
    state.supabase.removeChannel(state.realtimeChannel);
    state.realtimeChannel = null;
  }

  async function hydrateSession() {
    if (!state.supabase) return;

    setAuthStatus("正在检查登录状态…", "idle");
    try {
      const response = await withTimeout(
        state.supabase.auth.getSession(),
        12000,
        "会话检查超时，请检查当前网络是否能访问 Supabase。"
      );

      if (response.error) {
        console.error(response.error);
        setAuthStatus("读取登录状态失败：" + response.error.message, "warn");
        return;
      }

      state.session = response.data.session;
      state.currentUser = response.data.session && response.data.session.user ? response.data.session.user : null;
      updateAuthUi();

      if (state.currentUser) {
        startRealtimeSync();
        await loadRecords({ reason: "hydrate-session" });
      } else {
        renderAll();
        setAuthStatus("请输入邮箱和密码登录。首次注册后，数据会同步到云端账本。", "idle");
      }
    } catch (error) {
      console.error(error);
      setAuthStatus("会话检查失败：" + (error.message || error), "warn");
    }
  }

  async function handleSignIn(event) {
    event.preventDefault();

    if (!ensureSupabaseReady()) return;

    const email = String(refs.authEmail && refs.authEmail.value ? refs.authEmail.value : "").trim().toLowerCase();
    const password = String(refs.authPassword && refs.authPassword.value ? refs.authPassword.value : "");

    if (!email) {
      setAuthStatus("请输入邮箱地址。", "warn");
      return;
    }

    if (!password) {
      setAuthStatus("请输入密码。", "warn");
      return;
    }

    toggleAuthButtons(true);
    setAuthStatus("正在登录…", "idle");

    try {
      const response = await withTimeout(
        state.supabase.auth.signInWithPassword({ email: email, password: password }),
        12000,
        "登录超时，请检查当前网络是否能访问 Supabase。"
      );

      if (response.error) {
        console.error(response.error);
        setAuthStatus("登录失败：" + response.error.message, "warn");
        return;
      }

      setAuthStatus("登录成功，正在同步你的云端账本。", "success");
    } catch (error) {
      console.error(error);
      setAuthStatus("登录失败：" + (error.message || error), "warn");
    } finally {
      toggleAuthButtons(false);
    }
  }

  async function handleSignUp() {
    if (!ensureSupabaseReady()) return;

    const email = String(refs.authEmail && refs.authEmail.value ? refs.authEmail.value : "").trim().toLowerCase();
    const password = String(refs.authPassword && refs.authPassword.value ? refs.authPassword.value : "");

    if (!email) {
      setAuthStatus("请输入邮箱地址。", "warn");
      return;
    }

    if (!password || password.length < 6) {
      setAuthStatus("密码至少需要 6 位。", "warn");
      return;
    }

    toggleAuthButtons(true);
    setAuthStatus("正在创建账号…", "idle");

    try {
      const response = await withTimeout(
        state.supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            emailRedirectTo: getRedirectUrl()
          }
        }),
        12000,
        "注册超时，请检查当前网络是否能访问 Supabase。"
      );

      if (response.error) {
        console.error(response.error);
        setAuthStatus("注册失败：" + response.error.message, "warn");
        return;
      }

      if (response.data && response.data.session) {
        setAuthStatus("注册成功，已自动登录。", "success");
      } else {
        setAuthStatus("注册成功。请去邮箱完成确认，再回到站点登录。", "success");
      }
    } catch (error) {
      console.error(error);
      setAuthStatus("注册失败：" + (error.message || error), "warn");
    } finally {
      toggleAuthButtons(false);
    }
  }

  async function handleSignOut() {
    if (!state.supabase) return;

    setAuthStatus("正在退出登录…", "idle");
    if (refs.signOutBtn) refs.signOutBtn.disabled = true;

    try {
      const response = await state.supabase.auth.signOut();
      if (response.error) {
        console.error(response.error);
        setAuthStatus("退出失败：" + response.error.message, "warn");
        return;
      }
      state.records = [];
      state.editingId = null;
      if (refs.authPassword) refs.authPassword.value = "";
      renderAll();
      stopRealtimeSync();
      setAuthStatus("你已退出登录。", "success");
    } catch (error) {
      console.error(error);
      setAuthStatus("退出失败：" + (error.message || error), "warn");
    } finally {
      if (refs.signOutBtn) refs.signOutBtn.disabled = false;
    }
  }

  function toggleAuthButtons(disabled) {
    if (refs.signInBtn) refs.signInBtn.disabled = disabled;
    if (refs.signUpBtn) refs.signUpBtn.disabled = disabled;
  }

  function ensureSupabaseReady() {
    if (!state.isSetupReady || !state.supabase) {
      setAuthStatus("请先填写 config.js 里的 Supabase 配置。", "warn");
      return false;
    }
    return true;
  }

  function getRedirectUrl() {
    return window.location.href.split("#")[0];
  }

  function updateAuthUi() {
    const isLoggedIn = Boolean(state.currentUser);

    if (refs.currentUserChip) {
      refs.currentUserChip.textContent = !state.isSetupReady ? "待配置" : (isLoggedIn ? getUserLabel() : "未登录");
    }
    if (refs.signOutBtn) {
      refs.signOutBtn.classList.toggle("hidden", !isLoggedIn);
    }
    if (refs.authPanel) {
      refs.authPanel.classList.toggle("hidden", isLoggedIn);
    }
    if (refs.guestPanel) {
      refs.guestPanel.classList.toggle("hidden", isLoggedIn);
    }
    if (refs.appShell) {
      refs.appShell.classList.toggle("hidden", !isLoggedIn);
    }

    if (!state.isSetupReady) {
      setSyncCardTexts("待配置", "请先填写 config.js，并在 Supabase 里完成 URL 配置与数据表初始化。", "未连接", "待配置");
      return;
    }

    if (!isLoggedIn) {
      setSyncCardTexts("未登录", "登录后，账本会按当前账号写入 Supabase，并在不同设备之间同步。", "未连接", "等待登录");
      return;
    }

    setSyncCardTexts(
      "已连接",
      "当前账本正在使用 Supabase 云端同步，不同设备登录同一账号会看到同一份数据。",
      getUserLabel(),
      state.isLoadingRecords ? "同步中" : "已同步"
    );
  }

  function setSyncCardTexts(title, description, currentUserText, stateText) {
    if (refs.homeSyncTitle) refs.homeSyncTitle.textContent = title;
    if (refs.homeSyncDescription) refs.homeSyncDescription.textContent = description;
    if (refs.homeCurrentUser) refs.homeCurrentUser.textContent = currentUserText;
    if (refs.homeSyncState) refs.homeSyncState.textContent = stateText;

    if (refs.pageSyncTitle) refs.pageSyncTitle.textContent = title;
    if (refs.pageSyncDescription) refs.pageSyncDescription.textContent = description;
    if (refs.pageCurrentUser) refs.pageCurrentUser.textContent = currentUserText;
    if (refs.pageRecordCount) refs.pageRecordCount.textContent = String(state.records.length || 0);
  }

  function getUserLabel() {
    return (state.currentUser && (state.currentUser.email || state.currentUser.id)) || "未连接";
  }

  async function loadRecords(options) {
    if (!state.supabase || !state.currentUser) return;

    const opts = options || {};
    state.isLoadingRecords = true;
    updateAuthUi();

    try {
      const response = await withTimeout(
        state.supabase
          .from(RECORDS_TABLE)
          .select(LEDGER_SELECT_COLUMNS)
          .order("occurred_on", { ascending: false })
          .order("occurred_time", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
        12000,
        "账本同步超时，请检查当前网络是否能访问 Supabase。"
      );

      if (response.error) {
        console.error(response.error);
        setAuthStatus("同步失败：" + response.error.message, "warn");
        return;
      }

      state.records = sortRecords((response.data || []).map(mapRowToRecord));
      renderAll();
      if (!opts.silentStatus) {
        setAuthStatus("已连接云端账本，当前共有 " + state.records.length + " 条记录。", "success");
      }
    } catch (error) {
      console.error(error);
      setAuthStatus("同步失败：" + (error.message || error), "warn");
    } finally {
      state.isLoadingRecords = false;
      updateAuthUi();
    }
  }

  function mapRowToRecord(row) {
    return {
      id: row.id,
      type: row.entry_type,
      amount: Number(row.amount || 0),
      date: row.occurred_on,
      time: row.occurred_time || "",
      category: row.category || "其他",
      account: row.account || "其他",
      purpose: row.purpose || "未命名记录",
      note: row.note || "",
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null
    };
  }

  function renderAll() {
    updateAuthUi();
    renderStats();
    renderRecords();
    renderWeeklyReport();
    renderMonthlyReport();
  }

  function renderStats() {
    if (!refs.balanceTotal || !refs.monthlyExpense || !refs.monthlyIncome || !refs.recordCount) return;

    const currentMonth = formatMonthKey(new Date());
    let totalIncome = 0;
    let totalExpense = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    state.records.forEach(function (record) {
      const amount = Number(record.amount || 0);
      const monthKey = String(record.date || "").slice(0, 7);
      if (record.type === "income") {
        totalIncome += amount;
        if (monthKey === currentMonth) monthlyIncome += amount;
      } else {
        totalExpense += amount;
        if (monthKey === currentMonth) monthlyExpense += amount;
      }
    });

    refs.balanceTotal.textContent = formatCurrency(totalIncome - totalExpense);
    refs.monthlyExpense.textContent = formatCurrency(monthlyExpense);
    refs.monthlyIncome.textContent = formatCurrency(monthlyIncome);
    refs.recordCount.textContent = String(state.records.length);
    if (refs.pageRecordCount) refs.pageRecordCount.textContent = String(state.records.length);
  }

  function renderRecords() {
    if (!refs.recordsList || !refs.recordTemplate) return;

    const records = getFilteredRecords();
    if (!records.length) {
      refs.recordsList.innerHTML = '<div class="empty-state">当前没有匹配的账目，先新增一笔试试。</div>';
      return;
    }

    refs.recordsList.innerHTML = "";
    const fragment = document.createDocumentFragment();

    records.forEach(function (record) {
      const node = refs.recordTemplate.content.cloneNode(true);
      const amountEl = node.querySelector(".record-amount");
      node.querySelector(".record-purpose").textContent = record.purpose;
      amountEl.textContent = (record.type === "income" ? "+" : "-") + formatCurrency(record.amount);
      amountEl.classList.add(record.type === "income" ? "amount-income" : "amount-expense");
      node.querySelector(".record-meta").textContent = record.date + " " + (record.time || "") + " · " + record.category + " · " + record.account;
      node.querySelector(".record-note").textContent = record.note || "无备注";

      const editBtn = node.querySelector(".record-edit-btn");
      if (editBtn) {
        editBtn.addEventListener("click", function () {
          beginEdit(record.id);
        });
      }

      const deleteBtn = node.querySelector(".record-delete-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", function () {
          deleteRecord(record.id);
        });
      }

      fragment.appendChild(node);
    });

    refs.recordsList.appendChild(fragment);
  }

  function getFilteredRecords() {
    let records = state.records.slice();

    const keyword = refs.searchInput ? String(refs.searchInput.value || "").trim().toLowerCase() : "";
    const type = refs.filterType ? refs.filterType.value : "all";
    const month = refs.filterMonth ? refs.filterMonth.value : "";
    const sortOrder = refs.sortOrder ? refs.sortOrder.value : "desc";

    if (keyword) {
      records = records.filter(function (record) {
        const merged = (record.purpose + " " + (record.note || "") + " " + (record.category || "") + " " + (record.account || "")).toLowerCase();
        return merged.indexOf(keyword) >= 0;
      });
    }

    if (type !== "all") {
      records = records.filter(function (record) {
        return record.type === type;
      });
    }

    if (month) {
      records = records.filter(function (record) {
        return String(record.date || "").slice(0, 7) === month;
      });
    }

    records.sort(function (a, b) {
      if (sortOrder === "amount-desc") return Number(b.amount || 0) - Number(a.amount || 0);
      if (sortOrder === "amount-asc") return Number(a.amount || 0) - Number(b.amount || 0);
      const left = a.date + "T" + (a.time || "00:00");
      const right = b.date + "T" + (b.time || "00:00");
      return sortOrder === "asc" ? left.localeCompare(right) : right.localeCompare(left);
    });

    return records;
  }

  function renderWeeklyReport() {
    if (!refs.weeklyRange || !refs.weeklySummary || !refs.weeklyDailyList || !refs.weeklyCategoryList || !refs.weeklyRecordsList) {
      return;
    }

    state.selectedWeekStart = getStartOfWeek(state.selectedWeekStart);
    const weekStart = state.selectedWeekStart;
    const weekEnd = addDays(weekStart, 6);
    refs.weeklyRange.textContent = formatFriendlyDate(weekStart) + " - " + formatFriendlyDate(weekEnd);

    const weeklyRecords = state.records.filter(function (record) {
      return isRecordInRange(record, weekStart, weekEnd);
    });
    const weeklyIncome = sumAmounts(weeklyRecords.filter(function (record) { return record.type === "income"; }));
    const weeklyExpense = sumAmounts(weeklyRecords.filter(function (record) { return record.type === "expense"; }));
    const weeklyTopCategory = findTopExpenseCategory(weeklyRecords);
    const dailyBuckets = buildDailyBuckets(weekStart, 7, weeklyRecords);
    const peakDay = findPeakExpenseDay(dailyBuckets);

    refs.weeklySummary.innerHTML = renderSummaryTiles([
      { label: "本周收入", value: formatCurrency(weeklyIncome) },
      { label: "本周支出", value: formatCurrency(weeklyExpense) },
      { label: "本周净额", value: formatCurrency(weeklyIncome - weeklyExpense) },
      { label: "记录总数", value: weeklyRecords.length + " 笔" },
      { label: "最高支出日", value: peakDay.label },
      { label: "最高支出分类", value: weeklyTopCategory.name }
    ]);

    renderDailyList(refs.weeklyDailyList, dailyBuckets, "本周还没有记录。", false);
    renderCategoryBreakdown(refs.weeklyCategoryList, weeklyRecords.filter(function (record) { return record.type === "expense"; }), "本周还没有支出记录。");
    renderReportRecordList(refs.weeklyRecordsList, weeklyRecords, "本周还没有账目明细。");
  }

  function renderMonthlyReport() {
    if (!refs.monthlyRange || !refs.monthlySummary || !refs.monthlyCategoryChart || !refs.monthlyTrendChart || !refs.monthlyCategoryList || !refs.monthlyWeekList || !refs.monthlyDailyList || !refs.monthlyRecordsList || !refs.trendList) {
      return;
    }

    state.selectedMonthDate = getStartOfMonth(state.selectedMonthDate);
    const monthStart = state.selectedMonthDate;
    const monthEnd = getEndOfMonth(monthStart);
    refs.monthlyRange.textContent = formatMonthLabel(monthStart);

    const monthlyRecords = state.records.filter(function (record) {
      return isRecordInRange(record, monthStart, monthEnd);
    });
    const monthlyIncome = sumAmounts(monthlyRecords.filter(function (record) { return record.type === "income"; }));
    const monthlyExpenseRecords = monthlyRecords.filter(function (record) { return record.type === "expense"; });
    const monthlyExpense = sumAmounts(monthlyExpenseRecords);
    const monthlyTopCategory = findTopExpenseCategory(monthlyRecords);
    const monthDailyBuckets = buildDailyBuckets(monthStart, getDaysInMonth(monthStart), monthlyRecords);
    const monthlyTrend = buildMonthlyTrend(state.records, 6, monthStart);
    const peakDay = findPeakExpenseDay(monthDailyBuckets);

    refs.monthlySummary.innerHTML = renderSummaryTiles([
      { label: "本月收入", value: formatCurrency(monthlyIncome) },
      { label: "本月支出", value: formatCurrency(monthlyExpense) },
      { label: "本月净额", value: formatCurrency(monthlyIncome - monthlyExpense) },
      { label: "记录总数", value: monthlyRecords.length + " 笔" },
      { label: "最高支出分类", value: monthlyTopCategory.name },
      { label: "最高支出日", value: peakDay.label }
    ]);

    renderMonthlyCategoryChart(refs.monthlyCategoryChart, monthlyExpenseRecords, "本月还没有支出数据，先记几笔再来看图表。\n");
    renderCategoryBreakdown(refs.monthlyCategoryList, monthlyExpenseRecords, "本月还没有支出记录。");
    renderWeeklySlices(refs.monthlyWeekList, buildMonthWeekBuckets(monthStart, monthEnd, monthlyRecords), "本月还没有周度数据。");
    renderDailyList(refs.monthlyDailyList, monthDailyBuckets, "本月还没有每日流水。", true);
    renderMonthlyTrendChart(refs.monthlyTrendChart, monthlyTrend, "至少要有一个月的数据，图表趋势才会更清晰。");
    renderTrendList(refs.trendList, monthlyTrend, "至少要有一个月的数据，趋势图才会更有意思。", true);
    renderReportRecordList(refs.monthlyRecordsList, monthlyRecords, "本月还没有账目明细。");
  }

  function renderSummaryTiles(items) {
    return items.map(function (item) {
      return '\n        <article class="mini-tile">\n          <p>' + escapeHtml(item.label) + '</p>\n          <strong>' + escapeHtml(item.value) + '</strong>\n        </article>\n      ';
    }).join("");
  }

  function renderCategoryBreakdown(target, expenseRecords, emptyMessage) {
    if (!target) return;
    if (!expenseRecords.length) {
      target.innerHTML = '<div class="empty-state">' + escapeHtml(emptyMessage) + '</div>';
      return;
    }

    const grouped = expenseRecords.reduce(function (map, record) {
      map[record.category] = (map[record.category] || 0) + Number(record.amount || 0);
      return map;
    }, {});

    const items = Object.entries(grouped).sort(function (a, b) { return b[1] - a[1]; });
    const maxValue = items[0][1] || 1;

    target.innerHTML = items.map(function (item) {
      const category = item[0];
      const amount = item[1];
      const width = Math.max((amount / maxValue) * 100, 6);
      return '\n        <div class="breakdown-item">\n          <div class="breakdown-row">\n            <strong>' + escapeHtml(category) + '</strong>\n            <span>' + formatCurrency(amount) + '</span>\n          </div>\n          <div class="breakdown-track">\n            <div class="breakdown-bar" style="width:' + width + '%"></div>\n          </div>\n        </div>\n      ';
    }).join("");
  }

  function renderDailyList(target, buckets, emptyMessage, scrollable) {
    if (!target) return;
    const hasAnyValue = buckets.some(function (bucket) {
      return bucket.income > 0 || bucket.expense > 0;
    });

    target.classList.toggle("is-scrollable", Boolean(scrollable));

    if (!hasAnyValue) {
      target.innerHTML = '<div class="empty-state">' + escapeHtml(emptyMessage) + '</div>';
      return;
    }

    const maxAmount = Math.max.apply(null, buckets.map(function (bucket) {
      return Math.max(bucket.income, bucket.expense);
    }).concat([1]));

    target.innerHTML = buckets.map(function (bucket) {
      const incomeWidth = Math.max((bucket.income / maxAmount) * 100, bucket.income > 0 ? 6 : 0);
      const expenseWidth = Math.max((bucket.expense / maxAmount) * 100, bucket.expense > 0 ? 6 : 0);
      return '\n        <div class="breakdown-item">\n          <div class="breakdown-row">\n            <strong>' + escapeHtml(bucket.label) + '</strong>\n            <span>' + formatCurrency(bucket.income - bucket.expense) + '</span>\n          </div>\n          <div class="daily-track">\n            <div class="trend-track"><div class="trend-income" style="width:' + incomeWidth + '%"></div></div>\n            <div class="trend-track"><div class="trend-expense" style="width:' + expenseWidth + '%"></div></div>\n          </div>\n          <div class="trend-head muted">\n            <span>收入 ' + formatCurrency(bucket.income) + ' / 支出 ' + formatCurrency(bucket.expense) + '</span>\n            <span>' + bucket.count + ' 笔</span>\n          </div>\n        </div>\n      ';
    }).join("");
  }

  function renderWeeklySlices(target, buckets, emptyMessage) {
    if (!target) return;
    if (!buckets.length || buckets.every(function (bucket) { return bucket.income === 0 && bucket.expense === 0; })) {
      target.innerHTML = '<div class="empty-state">' + escapeHtml(emptyMessage) + '</div>';
      return;
    }

    const maxAmount = Math.max.apply(null, buckets.map(function (bucket) {
      return Math.max(bucket.income, bucket.expense);
    }).concat([1]));

    target.innerHTML = buckets.map(function (bucket) {
      const width = Math.max((Math.max(bucket.income, bucket.expense) / maxAmount) * 100, 6);
      const dominantClass = bucket.income >= bucket.expense ? "trend-income" : "trend-expense";
      return '\n        <div class="breakdown-item">\n          <div class="breakdown-row">\n            <strong>' + escapeHtml(bucket.label) + '</strong>\n            <span>' + formatCurrency(bucket.income - bucket.expense) + '</span>\n          </div>\n          <div class="trend-track"><div class="' + dominantClass + '" style="width:' + width + '%"></div></div>\n          <div class="trend-head muted">\n            <span>收入 ' + formatCurrency(bucket.income) + ' / 支出 ' + formatCurrency(bucket.expense) + '</span>\n            <span>' + bucket.count + ' 笔</span>\n          </div>\n        </div>\n      ';
    }).join("");
  }

  function renderTrendList(target, trend, emptyMessage, scrollable) {
    if (!target) return;
    target.classList.toggle("is-scrollable", Boolean(scrollable));

    if (!trend.length || trend.every(function (item) { return item.income === 0 && item.expense === 0; })) {
      target.innerHTML = '<div class="empty-state">' + escapeHtml(emptyMessage) + '</div>';
      return;
    }

    const maxAmount = Math.max.apply(null, trend.map(function (item) {
      return Math.max(item.income, item.expense);
    }).concat([1]));

    target.innerHTML = trend.map(function (item) {
      const incomeWidth = Math.max((item.income / maxAmount) * 100, item.income > 0 ? 6 : 0);
      const expenseWidth = Math.max((item.expense / maxAmount) * 100, item.expense > 0 ? 6 : 0);
      return '\n        <div class="breakdown-item">\n          <div class="breakdown-row">\n            <strong>' + escapeHtml(item.label) + '</strong>\n            <span>收入 ' + formatCurrency(item.income) + ' / 支出 ' + formatCurrency(item.expense) + '</span>\n          </div>\n          <div class="daily-track">\n            <div class="trend-track"><div class="trend-income" style="width:' + incomeWidth + '%"></div></div>\n            <div class="trend-track"><div class="trend-expense" style="width:' + expenseWidth + '%"></div></div>\n          </div>\n        </div>\n      ';
    }).join("");
  }

  function renderMonthlyCategoryChart(target, expenseRecords, emptyMessage) {
    if (!target) return;

    if (!expenseRecords.length) {
      target.innerHTML = '<div class="empty-state">' + escapeHtml(emptyMessage) + '</div>';
      return;
    }

    const grouped = expenseRecords.reduce(function (map, record) {
      map[record.category] = (map[record.category] || 0) + Number(record.amount || 0);
      return map;
    }, {});

    const entries = Object.entries(grouped).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    const total = entries.reduce(function (sum, entry) { return sum + entry[1]; }, 0) || 1;
    const topAmount = entries[0] ? entries[0][1] : 1;

    target.innerHTML = '\n      <div class="chart-shell">\n        <p class="muted">本月支出最多的分类排在最上面，条越长代表占比越高。</p>\n        <div class="breakdown-list">' +
          entries.map(function (entry) {
            const category = entry[0];
            const amount = entry[1];
            const ratio = (amount / total) * 100;
            const width = Math.max((amount / topAmount) * 100, 10);
            return '\n              <article class="breakdown-item">\n                <div class="breakdown-row">\n                  <strong>' + escapeHtml(category) + '</strong>\n                  <span>' + formatCurrency(amount) + ' · ' + ratio.toFixed(1) + '%</span>\n                </div>\n                <div class="breakdown-track"><div class="breakdown-bar" style="width:' + width + '%"></div></div>\n              </article>\n            ';
          }).join("") +
        '</div>\n      </div>\n    ';
  }

  function renderMonthlyTrendChart(target, trend, emptyMessage) {
    if (!target) return;

    if (!trend.length || trend.every(function (item) { return item.income === 0 && item.expense === 0; })) {
      target.innerHTML = '<div class="empty-state">' + escapeHtml(emptyMessage) + '</div>';
      return;
    }

    const maxAmount = Math.max.apply(null, trend.map(function (item) {
      return Math.max(item.income, item.expense);
    }).concat([1]));

    target.innerHTML = '\n      <div class="chart-shell">\n        <div class="trend-chart">' +
          trend.map(function (item) {
            const incomeHeight = Math.max((item.income / maxAmount) * 100, item.income > 0 ? 8 : 0);
            const expenseHeight = Math.max((item.expense / maxAmount) * 100, item.expense > 0 ? 8 : 0);
            return '\n              <article class="trend-col">\n                <div class="trend-bars">\n                  <div class="trend-bar trend-income" style="height:' + incomeHeight + '%"></div>\n                  <div class="trend-bar trend-expense" style="height:' + expenseHeight + '%"></div>\n                </div>\n                <strong class="trend-label">' + escapeHtml(item.label) + '</strong>\n                <span class="trend-meta">收 ' + formatCompactCurrency(item.income) + '<br />支 ' + formatCompactCurrency(item.expense) + '</span>\n              </article>\n            ';
          }).join("") +
        '</div>\n      </div>\n    ';
  }

  function renderReportRecordList(target, records, emptyMessage) {
    if (!target) return;
    if (!records.length) {
      target.innerHTML = '<div class="empty-state">' + escapeHtml(emptyMessage) + '</div>';
      return;
    }

    const sorted = sortRecords(records);
    target.innerHTML = sorted.map(function (record) {
      return '\n        <article class="record-item">\n          <div class="record-main">\n            <div class="record-heading">\n              <h4 class="record-purpose">' + escapeHtml(record.purpose) + '</h4>\n              <span class="record-amount ' + (record.type === "income" ? "amount-income" : "amount-expense") + '">' + (record.type === "income" ? "+" : "-") + formatCurrency(record.amount) + '</span>\n            </div>\n            <p class="record-meta">' + escapeHtml(record.date) + ' ' + escapeHtml(record.time || "") + ' · ' + escapeHtml(record.category) + ' · ' + escapeHtml(record.account || "其他") + '</p>\n            <p class="record-note">' + escapeHtml(record.note || "无备注") + '</p>\n          </div>\n        </article>\n      ';
    }).join("");
  }

  function buildMonthlyTrend(records, monthsBack, anchorDate) {
    const buckets = [];
    const base = getStartOfMonth(anchorDate || new Date());

    for (let index = monthsBack - 1; index >= 0; index -= 1) {
      const date = new Date(base.getFullYear(), base.getMonth() - index, 1);
      buckets.push({
        key: formatMonthKey(date),
        label: date.getMonth() + 1 + "月",
        income: 0,
        expense: 0
      });
    }

    records.forEach(function (record) {
      const bucket = buckets.find(function (item) {
        return item.key === String(record.date || "").slice(0, 7);
      });
      if (!bucket) return;
      if (record.type === "income") bucket.income += Number(record.amount || 0);
      else bucket.expense += Number(record.amount || 0);
    });

    return buckets;
  }

  function buildDailyBuckets(startDate, days, records) {
    const buckets = [];
    for (let index = 0; index < days; index += 1) {
      const currentDate = addDays(startDate, index);
      const isoDate = formatDateInput(currentDate);
      const dayRecords = records.filter(function (record) {
        return record.date === isoDate;
      });
      buckets.push({
        date: isoDate,
        label: formatDayBucketLabel(currentDate, days <= 7),
        income: sumAmounts(dayRecords.filter(function (record) { return record.type === "income"; })),
        expense: sumAmounts(dayRecords.filter(function (record) { return record.type === "expense"; })),
        count: dayRecords.length
      });
    }
    return buckets;
  }

  function buildMonthWeekBuckets(monthStart, monthEnd, records) {
    const buckets = [];
    let cursor = getStartOfWeek(monthStart);

    while (cursor <= monthEnd) {
      const sliceStart = new Date(cursor);
      const sliceEnd = addDays(sliceStart, 6);
      const visibleStart = sliceStart < monthStart ? monthStart : sliceStart;
      const visibleEnd = sliceEnd > monthEnd ? monthEnd : sliceEnd;
      const sliceRecords = records.filter(function (record) {
        return isRecordInRange(record, visibleStart, visibleEnd);
      });

      buckets.push({
        label: (visibleStart.getMonth() + 1) + "/" + visibleStart.getDate() + " - " + (visibleEnd.getMonth() + 1) + "/" + visibleEnd.getDate(),
        income: sumAmounts(sliceRecords.filter(function (record) { return record.type === "income"; })),
        expense: sumAmounts(sliceRecords.filter(function (record) { return record.type === "expense"; })),
        count: sliceRecords.length
      });

      cursor = addDays(sliceStart, 7);
    }

    return buckets;
  }

  function findTopExpenseCategory(records) {
    const map = {};
    records.filter(function (record) { return record.type === "expense"; }).forEach(function (record) {
      map[record.category] = (map[record.category] || 0) + Number(record.amount || 0);
    });
    const top = Object.entries(map).sort(function (a, b) { return b[1] - a[1]; })[0];
    return top ? { name: top[0], amount: top[1] } : { name: "暂无", amount: 0 };
  }

  function findPeakExpenseDay(buckets) {
    const top = buckets.slice().sort(function (a, b) { return b.expense - a.expense; })[0];
    if (!top || top.expense <= 0) return { label: "暂无", amount: 0 };
    return { label: top.label, amount: top.expense };
  }

  function handleAnalyze() {
    if (!refs.quickInput) return;
    const rawText = String(refs.quickInput.value || "").trim();
    if (!rawText) {
      setStatus("先输入一句话，再自动识别。", "warn");
      return;
    }

    const parsed = parseNaturalLanguageEntry(rawText);
    refs.type.value = parsed.type;
    refs.amount.value = parsed.amount != null ? parsed.amount : "";
    refs.date.value = parsed.date;
    refs.time.value = parsed.time;
    refs.category.value = parsed.category;
    refs.purpose.value = parsed.purpose;
    refs.note.value = parsed.note;

    if (!parsed.amount) {
      setStatus("已识别大部分字段，但金额没有识别出来，请手动补一下。", "warn");
      return;
    }

    setStatus("识别完成，可以直接保存，也可以继续修改。", "success");
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
      type: type,
      amount: amountInfo.amount,
      category: category,
      purpose: purpose,
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
    if (INCOME_KEYWORDS.some(function (word) { return text.indexOf(word) >= 0; })) return "income";
    if (EXPENSE_KEYWORDS.some(function (word) { return text.indexOf(word) >= 0; })) return "expense";
    return "expense";
  }

  function extractAmount(text) {
    const explicitPatterns = [
      /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:元|块钱|块|人民币)/i,
      /(?:花了|用了|支出|付了|支付|买了|消费|交了|收入|赚了|收到|报销|退款|转入|转出)\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
      /¥\s*([0-9]+(?:\.[0-9]{1,2})?)/i
    ];

    for (let index = 0; index < explicitPatterns.length; index += 1) {
      const match = text.match(explicitPatterns[index]);
      if (match) {
        return { amount: Number(match[1]), matchText: match[0] };
      }
    }

    const matches = Array.from(text.matchAll(/\d+(?:\.\d{1,2})?/g));
    const candidates = matches.map(function (match) {
      const token = match[0];
      const index = match.index || 0;
      const prev = text[index - 1] || "";
      const next = text[index + token.length] || "";
      const nearCurrency = /(元|块|¥)/.test(text.slice(index, index + token.length + 2));
      const looksLikeDateOrTime = ["年", "月", "日", "号", ":", "点"].indexOf(next) >= 0 || ["年", "月", ":"].indexOf(prev) >= 0;
      return {
        amount: Number(token),
        matchText: token,
        score: (nearCurrency ? 3 : 0) + (looksLikeDateOrTime ? -5 : 0) + (Number(token) >= 1 ? 1 : 0)
      };
    }).filter(function (candidate) {
      return candidate.score > 0;
    }).sort(function (a, b) {
      return b.score - a.score || b.amount - a.amount;
    });

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
      workingDate = new Date(Number(fullDateMatch[1]), Number(fullDateMatch[2]) - 1, Number(fullDateMatch[3]));
      dateText = fullDateMatch[0];
    } else if (monthDateMatch) {
      workingDate = new Date(now.getFullYear(), Number(monthDateMatch[1]) - 1, Number(monthDateMatch[2]));
      dateText = monthDateMatch[0];
    } else {
      const relativeDay = relativeDayMap.find(function (item) {
        return text.indexOf(item.token) >= 0;
      });
      if (relativeDay) {
        workingDate.setDate(now.getDate() + relativeDay.offset);
        dateText = relativeDay.token;
      } else {
        const weekMatch = text.match(/(上周|这周|本周)?([一二三四五六日天])(?:上午|中午|下午|晚上)?/);
        if (weekMatch && weekMatch[0].indexOf("周") >= 0) {
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
      if ((period === "下午" || period === "晚上") && hour < 12) hour += 12;
      if (period === "中午" && hour < 11) hour += 12;
      if (period === "凌晨" && hour === 12) hour = 0;
      workingDate.setHours(hour, minute, 0, 0);
      timeText = clockMatch[0];
    } else {
      workingDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    }

    return {
      date: formatDateInput(workingDate),
      time: formatTimeInput(workingDate),
      dateText: dateText,
      timeText: timeText
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
      if (diff > 0) diff -= 7;
    }

    date.setDate(date.getDate() + diff);
    return date;
  }

  function inferCategory(text, type) {
    if (type === "income" && text.indexOf("工资") >= 0) return "工资";
    if (type === "income" && /(报销|退款|返现)/.test(text)) return "报销";

    for (let index = 0; index < CATEGORY_KEYWORDS.length; index += 1) {
      const item = CATEGORY_KEYWORDS[index];
      if (item.words.some(function (word) { return text.toLowerCase().indexOf(word) >= 0; })) {
        return item.category;
      }
    }

    return "其他";
  }

  function extractPurpose(text, tokens) {
    let cleaned = text;
    [tokens.amountText, tokens.dateText, tokens.timeText].forEach(function (token) {
      if (token) cleaned = cleaned.replace(token, " ");
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

  async function handleSaveRecord(event) {
    event.preventDefault();

    if (state.isSavingRecord) return;
    if (!state.currentUser || !state.supabase) {
      setStatus("请先登录后再保存。", "warn");
      return;
    }

    const amount = Number(refs.amount && refs.amount.value ? refs.amount.value : 0);
    if (!amount || amount <= 0) {
      setStatus("请输入有效金额。", "warn");
      return;
    }

    const payload = {
      entry_type: refs.type.value,
      amount: amount,
      occurred_on: refs.date.value || formatDateInput(new Date()),
      occurred_time: refs.time.value || null,
      category: refs.category.value,
      account: refs.account ? refs.account.value : "其他",
      purpose: String(refs.purpose.value || "").trim() || "未命名记录",
      note: String(refs.note.value || "").trim() || null
    };

    state.isSavingRecord = true;
    if (refs.saveBtn) refs.saveBtn.disabled = true;
    setStatus("正在保存到云端账本…", "idle");

    try {
      let response;
      if (state.editingId) {
        response = await withTimeout(
          state.supabase
            .from(RECORDS_TABLE)
            .update(payload)
            .eq("id", state.editingId)
            .eq("user_id", state.currentUser.id)
            .select(LEDGER_SELECT_COLUMNS)
            .single(),
          12000,
          "保存超时，请检查当前网络是否能访问 Supabase。"
        );
      } else {
        response = await withTimeout(
          state.supabase
            .from(RECORDS_TABLE)
            .insert(Object.assign({ user_id: state.currentUser.id }, payload))
            .select(LEDGER_SELECT_COLUMNS)
            .single(),
          12000,
          "保存超时，请检查当前网络是否能访问 Supabase。"
        );
      }

      if (response.error) {
        console.error(response.error);
        setStatus("保存失败：" + response.error.message, "warn");
        return;
      }

      if (response.data) {
        upsertLocalRecord(mapRowToRecord(response.data));
      } else {
        await loadRecords({ reason: "save-fallback", silentStatus: true, force: true });
      }

      notifyRecordsChanged("save");
      resetForm();
      renderAll();
      setStatus("记录已保存到云端账本。", "success");
    } catch (error) {
      console.error(error);
      setStatus("保存失败：" + (error.message || error), "warn");
    } finally {
      state.isSavingRecord = false;
      if (refs.saveBtn) refs.saveBtn.disabled = false;
    }
  }

  function beginEdit(recordId) {
    const record = state.records.find(function (item) { return item.id === recordId; });
    if (!record) return;

    state.editingId = recordId;
    refs.type.value = record.type;
    refs.amount.value = record.amount;
    refs.date.value = record.date;
    refs.time.value = record.time || "";
    refs.category.value = record.category;
    if (refs.account) refs.account.value = ACCOUNT_OPTIONS.indexOf(record.account) >= 0 ? record.account : "其他";
    refs.purpose.value = record.purpose;
    refs.note.value = record.note || "";
    if (refs.quickInput) refs.quickInput.value = record.note || record.purpose;
    if (refs.cancelEditBtn) refs.cancelEditBtn.classList.remove("hidden");
    if (refs.saveBtn) refs.saveBtn.textContent = "保存修改";
    setStatus("已载入这条记录，你可以修改后重新保存。", "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    resetForm();
    setStatus("已取消编辑。", "idle");
  }

  async function deleteRecord(recordId) {
    const target = state.records.find(function (item) { return item.id === recordId; });
    if (!target || !state.supabase || !state.currentUser) return;

    const ok = window.confirm('确认删除“' + target.purpose + '”吗？');
    if (!ok) return;

    try {
      const response = await withTimeout(
        state.supabase
          .from(RECORDS_TABLE)
          .delete()
          .eq("id", recordId)
          .eq("user_id", state.currentUser.id),
        12000,
        "删除超时，请检查当前网络是否能访问 Supabase。"
      );

      if (response.error) {
        console.error(response.error);
        setStatus("删除失败：" + response.error.message, "warn");
        return;
      }

      removeLocalRecord(recordId);
      notifyRecordsChanged("delete");
      renderAll();
      setStatus("记录已删除。", "success");
    } catch (error) {
      console.error(error);
      setStatus("删除失败：" + (error.message || error), "warn");
    }
  }

  function resetForm() {
    state.editingId = null;
    if (refs.form) refs.form.reset();
    if (refs.quickInput) refs.quickInput.value = "";
    populateCategoryOptions();
    fillDefaultDateTime();
    if (refs.type) refs.type.value = "expense";
    if (refs.cancelEditBtn) refs.cancelEditBtn.classList.add("hidden");
    if (refs.saveBtn) refs.saveBtn.textContent = "保存这笔记录";
  }

  function fillDefaultDateTime() {
    if (!refs.date || !refs.time) return;
    const now = new Date();
    refs.date.value = formatDateInput(now);
    refs.time.value = formatTimeInput(now);
    if (refs.account) refs.account.value = "微信";
    if (refs.category) refs.category.value = "餐饮";
  }

  async function seedDemoData() {
    if (!state.supabase || !state.currentUser) {
      setStatus("请先登录。", "warn");
      return;
    }

    if (state.records.length) {
      setStatus("当前账号已有真实数据，就不自动写入示例了。", "warn");
      return;
    }

    const today = new Date();
    const payload = [
      {
        user_id: state.currentUser.id,
        entry_type: "expense",
        amount: 28,
        occurred_on: formatDateInput(today),
        occurred_time: "08:30",
        category: "餐饮",
        account: "微信",
        purpose: "早餐",
        note: "豆浆和三明治"
      },
      {
        user_id: state.currentUser.id,
        entry_type: "expense",
        amount: 56,
        occurred_on: formatDateInput(addDays(today, -1)),
        occurred_time: "19:20",
        category: "交通",
        account: "支付宝",
        purpose: "打车回家",
        note: "下雨天打车"
      },
      {
        user_id: state.currentUser.id,
        entry_type: "income",
        amount: 520,
        occurred_on: formatDateInput(addDays(today, -3)),
        occurred_time: "10:10",
        category: "报销",
        account: "银行卡",
        purpose: "项目报销",
        note: "4 月物料报销"
      },
      {
        user_id: state.currentUser.id,
        entry_type: "expense",
        amount: 168,
        occurred_on: formatDateInput(addDays(today, -8)),
        occurred_time: "15:00",
        category: "学习",
        account: "信用卡",
        purpose: "买书",
        note: "专业书和笔记本"
      },
      {
        user_id: state.currentUser.id,
        entry_type: "income",
        amount: 9800,
        occurred_on: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 5)),
        occurred_time: "09:00",
        category: "工资",
        account: "银行卡",
        purpose: "工资入账",
        note: "当月工资"
      }
    ];

    try {
      const response = await withTimeout(
        state.supabase.from(RECORDS_TABLE).insert(payload),
        12000,
        "示例数据写入超时，请检查当前网络是否能访问 Supabase。"
      );

      if (response.error) {
        console.error(response.error);
        setStatus("示例数据写入失败：" + response.error.message, "warn");
        return;
      }

      notifyRecordsChanged("seed");
      await loadRecords({ reason: "seed", silentStatus: true, force: true });
      setStatus("示例数据已写入当前账号。", "success");
    } catch (error) {
      console.error(error);
      setStatus("示例数据写入失败：" + (error.message || error), "warn");
    }
  }

  function exportCsv() {
    if (!state.records.length) {
      setStatus("当前没有可导出的记录。", "warn");
      return;
    }

    const lines = [
      ["id", "type", "amount", "date", "time", "category", "account", "purpose", "note"].join(",")
    ];

    state.records.forEach(function (record) {
      lines.push([
        csvEscape(record.id),
        csvEscape(record.type),
        csvEscape(record.amount),
        csvEscape(record.date),
        csvEscape(record.time || ""),
        csvEscape(record.category),
        csvEscape(record.account || ""),
        csvEscape(record.purpose),
        csvEscape(record.note || "")
      ].join(","));
    });

    downloadFile(APP_NAME + "-" + formatDateInput(new Date()) + ".csv", "text/csv;charset=utf-8;", "\ufeff" + lines.join("\n"));
    setStatus("CSV 已导出。", "success");
  }

  function exportJsonBackup() {
    if (!state.records.length) {
      setStatus("当前没有可导出的记录。", "warn");
      return;
    }

    downloadFile(
      APP_NAME + "-backup-" + formatDateInput(new Date()) + ".json",
      "application/json;charset=utf-8;",
      JSON.stringify(state.records, null, 2)
    );
    setStatus("JSON 备份已导出。", "success");
  }

  async function importJsonBackup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file || !state.supabase || !state.currentUser) return;

    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const parsed = JSON.parse(String(reader.result || "[]"));
        if (!Array.isArray(parsed)) throw new Error("文件内容不是数组");

        const payload = parsed.map(normalizeImportedRecord).filter(Boolean).map(function (record) {
          return {
            user_id: state.currentUser.id,
            entry_type: record.type,
            amount: Number(record.amount || 0),
            occurred_on: record.date,
            occurred_time: record.time || null,
            category: record.category,
            account: record.account,
            purpose: record.purpose,
            note: record.note || null
          };
        });

        if (!payload.length) {
          setStatus("文件里没有可导入的数据。", "warn");
          return;
        }

        const response = await withTimeout(
          state.supabase.from(RECORDS_TABLE).insert(payload),
          12000,
          "导入超时，请检查当前网络是否能访问 Supabase。"
        );

        if (response.error) {
          console.error(response.error);
          setStatus("导入失败：" + response.error.message, "warn");
          return;
        }

        notifyRecordsChanged("import");
        await loadRecords({ reason: "import", silentStatus: true, force: true });
        setStatus("JSON 已导入到云端账本。", "success");
      } catch (error) {
        console.error(error);
        setStatus("导入失败，请确认文件格式正确。", "warn");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function normalizeImportedRecord(item) {
    if (!item || typeof item !== "object") return null;
    return {
      type: item.type === "income" ? "income" : "expense",
      amount: Number(item.amount || 0),
      date: String(item.date || formatDateInput(new Date())),
      time: String(item.time || ""),
      category: CATEGORY_OPTIONS.indexOf(item.category) >= 0 ? item.category : "其他",
      account: ACCOUNT_OPTIONS.indexOf(item.account) >= 0 ? item.account : "其他",
      purpose: String(item.purpose || "未命名记录"),
      note: String(item.note || "")
    };
  }

  async function clearAllRecords() {
    if (!state.records.length) {
      setStatus("当前没有数据可清空。", "warn");
      return;
    }

    const ok = window.confirm("确认清空当前账号的全部云端账本数据吗？这个操作不可撤销。");
    if (!ok || !state.supabase || !state.currentUser) return;

    try {
      const response = await withTimeout(
        state.supabase
          .from(RECORDS_TABLE)
          .delete()
          .eq("user_id", state.currentUser.id),
        12000,
        "清空超时，请检查当前网络是否能访问 Supabase。"
      );

      if (response.error) {
        console.error(response.error);
        setStatus("清空失败：" + response.error.message, "warn");
        return;
      }

      state.records = [];
      notifyRecordsChanged("clear-all");
      renderAll();
      resetForm();
      setStatus("当前账号的全部云端数据已清空。", "success");
    } catch (error) {
      console.error(error);
      setStatus("清空失败：" + (error.message || error), "warn");
    }
  }

  function upsertLocalRecord(record) {
    const next = state.records.filter(function (item) {
      return item.id !== record.id;
    });
    next.push(record);
    state.records = sortRecords(next);
  }

  function removeLocalRecord(recordId) {
    state.records = state.records.filter(function (item) {
      return item.id !== recordId;
    });
  }

  function populateCategoryOptions() {
    if (!refs.category) return;
    refs.category.innerHTML = CATEGORY_OPTIONS.map(function (item) {
      return '<option value="' + escapeHtml(item) + '">' + escapeHtml(item) + '</option>';
    }).join("");
  }

  function setStatus(message, tone) {
    if (!refs.formStatus) return;
    refs.formStatus.textContent = message;
    refs.formStatus.className = "status-card";
    refs.formStatus.classList.add("status-" + (tone || "idle"));
  }

  function setAuthStatus(message, tone) {
    if (!refs.authStatus) return;
    refs.authStatus.textContent = message;
    refs.authStatus.className = "status-card";
    refs.authStatus.classList.add("status-" + (tone || "idle"));
  }

  function withTimeout(promise, timeoutMs, message) {
    let timeoutId;
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        timeoutId = window.setTimeout(function () {
          reject(new Error(message));
        }, timeoutMs);
      })
    ]).finally(function () {
      if (timeoutId) window.clearTimeout(timeoutId);
    });
  }

  function sortRecords(records) {
    return records.slice().sort(function (a, b) {
      const left = a.date + "T" + (a.time || "00:00");
      const right = b.date + "T" + (b.time || "00:00");
      return right.localeCompare(left);
    });
  }

  function sumAmounts(records) {
    return records.reduce(function (sum, record) {
      return sum + Number(record.amount || 0);
    }, 0);
  }

  function parseDateInput(value) {
    const parts = String(value).split("-").map(Number);
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
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
    const current = parseDateInput(record.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return current >= start && current <= end;
  }

  function formatDateInput(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function formatTimeInput(date) {
    return [String(date.getHours()).padStart(2, "0"), String(date.getMinutes()).padStart(2, "0")].join(":");
  }

  function formatMonthKey(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
  }

  function formatFriendlyDate(date) {
    return date.getMonth() + 1 + "月" + date.getDate() + "日";
  }

  function formatMonthLabel(date) {
    return date.getFullYear() + "年" + (date.getMonth() + 1) + "月";
  }

  function formatDayBucketLabel(date, includeWeekday) {
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    if (includeWeekday) {
      return weekdays[date.getDay()] + " · " + (date.getMonth() + 1) + "/" + date.getDate();
    }
    return (date.getMonth() + 1) + "/" + date.getDate() + " · " + weekdays[date.getDay()];
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(Number(value || 0));
  }

  function formatCompactCurrency(value) {
    const amount = Number(value || 0);
    if (amount >= 10000) return (amount / 10000).toFixed(1) + "万";
    if (amount >= 1000) return (amount / 1000).toFixed(1) + "k";
    return String(Math.round(amount));
  }

  function csvEscape(value) {
    return '"' + String(value).replace(/"/g, '""') + '"';
  }

  function downloadFile(filename, mimeType, content) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
