import { createRepository } from "./data-store.js";
import { isSupabaseConfigured, supabase } from "./supabase-config.js";
import { getCurrentSession, signIn, signOut, signUp, subscribeToAuthChanges } from "./auth.js";

(() => {
  "use strict";

  const today = new Date();
  const isoDate = (offset = 0) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };

  const demoData = {
    clients: [
      { id: "c-1001", name: "Анна Кузнецова", email: "anna@sever-group.ru", phone: "+7 (916) 234-18-09", company: "Север Групп", category: "Постоянный", status: "active", notes: "Предпочитает связь по электронной почте. Обсуждаем годовой контракт.", createdAt: isoDate(-2) },
      { id: "c-1002", name: "Михаил Орлов", email: "m.orlov@atlas.pro", phone: "+7 (903) 810-44-26", company: "Атлас Проект", category: "Партнёр", status: "active", notes: "Попросил прислать обновлённую презентацию.", createdAt: isoDate(-5) },
      { id: "c-1003", name: "Елена Смирнова", email: "elena@brightway.ru", phone: "+7 (925) 110-07-63", company: "Brightway", category: "Новый", status: "potential", notes: "Первичный контакт с конференции. Интересуется запуском в ноябре.", createdAt: isoDate(-8) },
      { id: "c-1004", name: "Дмитрий Волков", email: "d.volkov@logistix.ru", phone: "+7 (985) 611-29-17", company: "Логистикс", category: "VIP", status: "active", notes: "Ключевой клиент. Встреча раз в месяц.", createdAt: isoDate(-13) },
      { id: "c-1005", name: "Ольга Белова", email: "o.belova@forma.ru", phone: "+7 (916) 870-32-40", company: "Форма Дизайн", category: "Новый", status: "potential", notes: "Запросила коммерческое предложение.", createdAt: isoDate(-19) },
      { id: "c-1006", name: "Илья Морозов", email: "ilya@vector.tech", phone: "+7 (903) 540-88-12", company: "Вектор Тех", category: "Постоянный", status: "inactive", notes: "Пауза в проекте до конца квартала.", createdAt: isoDate(-27) },
      { id: "c-1007", name: "Мария Соколова", email: "m.sokolova@urbanline.ru", phone: "+7 (926) 411-05-75", company: "Урбан Лайн", category: "Партнёр", status: "active", notes: "Передать контакт руководителю отдела продаж.", createdAt: isoDate(-34) },
    ],
    deals: [
      { id: "d-2001", title: "Годовое обслуживание", clientId: "c-1001", amount: 480000, status: "progress", closeDate: isoDate(5), createdAt: isoDate(-1) },
      { id: "d-2002", title: "Внедрение CRM", clientId: "c-1002", amount: 320000, status: "won", closeDate: isoDate(-3), createdAt: isoDate(-4) },
      { id: "d-2003", title: "Поставка оборудования", clientId: "c-1004", amount: 765000, status: "won", closeDate: isoDate(-8), createdAt: isoDate(-10) },
      { id: "d-2004", title: "Стартовый пакет", clientId: "c-1003", amount: 185000, status: "new", closeDate: isoDate(12), createdAt: isoDate(-7) },
      { id: "d-2005", title: "Редизайн платформы", clientId: "c-1005", amount: 240000, status: "progress", closeDate: isoDate(9), createdAt: isoDate(-15) },
      { id: "d-2006", title: "Техническая поддержка", clientId: "c-1006", amount: 95000, status: "lost", closeDate: isoDate(-6), createdAt: isoDate(-20) },
    ],
    tasks: [
      { id: "t-3001", title: "Подготовить предложение", description: "Собрать варианты годового тарифа и расчёт экономии.", clientId: "c-1001", dealId: "d-2001", dueDate: isoDate(0), priority: "high", status: "open" },
      { id: "t-3002", title: "Созвониться по запуску", description: "Уточнить дату начала и ответственных со стороны клиента.", clientId: "c-1003", dealId: "d-2004", dueDate: isoDate(1), priority: "medium", status: "open" },
      { id: "t-3003", title: "Отправить документы", description: "Договор и акт после финальной сверки реквизитов.", clientId: "c-1002", dealId: "d-2002", dueDate: isoDate(2), priority: "low", status: "open" },
      { id: "t-3004", title: "Подтвердить состав поставки", description: "Проверить спецификацию перед отправкой заказа.", clientId: "c-1004", dealId: "d-2003", dueDate: isoDate(4), priority: "high", status: "open" },
      { id: "t-3005", title: "Подготовить макеты", description: "Собрать референсы для первого этапа редизайна.", clientId: "c-1005", dealId: "d-2005", dueDate: isoDate(-1), priority: "medium", status: "open" },
      { id: "t-3006", title: "Проверить обратную связь", description: "Запросить комментарии команды по новой версии.", clientId: "c-1007", dealId: "", dueDate: isoDate(-2), priority: "low", status: "completed" },
      { id: "t-3007", title: "Обновить карточку клиента", description: "Добавить контакты нового участника проекта.", clientId: "c-1007", dealId: "", dueDate: isoDate(6), priority: "low", status: "open" },
    ],
  };

  // UI reads from a cache; this adapter switches the cache source between demo data and Supabase.
  const repository = createRepository(demoData, supabase, isSupabaseConfigured);

  const pageContent = document.querySelector("#page-content");
  const modalRoot = document.querySelector("#modal-root");
  const toastRegion = document.querySelector("#toast-region");
  const appShell = document.querySelector(".app-shell");
  const authRoot = document.querySelector("#auth-root");
  const setupBanner = document.querySelector("#setup-banner");
  const profileButton = document.querySelector("#profile-button");
  const profileName = document.querySelector("#profile-name");
  const profileRole = document.querySelector("#profile-role");
  const profileAvatar = document.querySelector("#profile-avatar");
  const notificationButton = document.querySelector("#notification-button");
  const notificationPanel = document.querySelector("#notification-panel");
  const notificationPanelContent = document.querySelector("#notification-panel-content");
  const notificationIndicator = document.querySelector("#notification-indicator");
  const breadcrumbCurrent = document.querySelector("#breadcrumb-current");
  const pageNames = { dashboard: "Дашборд", clients: "Клиенты", deals: "Сделки", tasks: "Задачи" };
  const stateLabels = {
    client: { active: "Активный", potential: "Потенциальный", inactive: "Неактивный" },
    deal: { new: "Новая", progress: "В работе", won: "Успешно закрыта", lost: "Проиграна" },
    task: { open: "Открыта", completed: "Выполнена" },
    priority: { low: "Низкий", medium: "Средний", high: "Высокий" },
  };
  const categoryOptions = ["Постоянный", "Новый", "Партнёр", "VIP"];
  let activePage = "dashboard";
  let toastTimer;
  let currentSession = null;
  let activeUserId = null;
  let activationPromise = null;

  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const money = (value) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const displayDate = (value, options = { day: "numeric", month: "short", year: "numeric" }) => {
    if (!value) return "—";
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ru-RU", options).format(date);
  };
  const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?";
  const avatarClass = (index) => `table-avatar ${["", "v2", "v3", "v4"][index % 4]}`;
  const getClient = (id) => repository.get("clients", id);
  const getDeal = (id) => repository.get("deals", id);
  const badge = (kind, value) => {
    const label = (stateLabels[kind] && stateLabels[kind][value]) || value || "—";
    const css = ({ active: "active", potential: "medium", inactive: "inactive", new: "new", progress: "progress", won: "success", lost: "lost", open: "new", completed: "completed", low: "low", medium: "medium", high: "high" })[value] || "";
    return `<span class="badge ${css}">${escapeHTML(label)}</span>`;
  };
  const updateNavCounts = () => {
    document.querySelector("#nav-client-count").textContent = repository.list("clients").length;
    document.querySelector("#nav-deal-count").textContent = repository.list("deals").length;
    document.querySelector("#nav-task-count").textContent = repository.list("tasks").filter((task) => task.status === "open").length;
    renderNotifications();
  };

  function renderNotifications() {
    const tasks = repository.list("tasks")
      .filter((task) => task.status === "open")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    notificationIndicator.hidden = tasks.length === 0;
    notificationButton.setAttribute("aria-label", tasks.length ? `Уведомления: ${tasks.length} открытых задач` : "Уведомления");
    notificationPanelContent.innerHTML = `<header class="notification-header"><div><strong>Напоминания</strong><small>${tasks.length ? `${tasks.length} открытых задач` : "Задачи по сроку"}</small></div><button class="notification-close" id="notification-close" type="button" aria-label="Закрыть уведомления">×</button></header>${tasks.length ? `<div class="notification-list">${tasks.slice(0, 6).map((task) => {
      const client = getClient(task.clientId);
      const overdue = task.dueDate < isoDate();
      return `<button class="notification-item" type="button" data-notification-task="${escapeHTML(task.id)}"><span class="notification-item-mark ${overdue ? "is-overdue" : ""}" aria-hidden="true">${overdue ? "!" : "•"}</span><span class="notification-item-copy"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(client?.name || "Без клиента")} · ${overdue ? "Просрочена" : `Срок ${escapeHTML(displayDate(task.dueDate, { day: "numeric", month: "short" }))}`}</small></span></button>`;
    }).join("")}</div>` : `<p class="notification-empty">Открытых задач пока нет.</p>`}`;
  }

  function closeNotifications() {
    notificationPanel.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
  }

  notificationButton.addEventListener("click", () => {
    const isOpen = notificationPanel.hidden;
    notificationPanel.hidden = !isOpen;
    notificationButton.setAttribute("aria-expanded", String(isOpen));
  });

  function updateProfile(user) {
    const email = user?.email || "Демо-режим";
    profileName.textContent = email;
    profileRole.textContent = user ? "Аккаунт Supabase" : "Supabase не настроен";
    profileAvatar.textContent = initials(email);
    profileButton.disabled = !user;
    profileButton.setAttribute("aria-label", user ? `Выйти из аккаунта ${email}` : "Демо-режим");
  }

  function renderAuth(mode = "sign-in", message = "") {
    appShell.hidden = true;
    authRoot.hidden = false;
    const isSignUp = mode === "sign-up";
    authRoot.innerHTML = `<section class="auth-card"><a class="brand auth-brand" href="#" aria-label="Север CRM"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M20 4.5 34 12.6v14.8L20 35.5 6 27.4V12.6L20 4.5Z"/><path d="m13 23 7-12 7 12M16 19h8"/></svg></span><span class="brand-copy"><strong>север</strong><small>МИНИ CRM</small></span></a><p class="eyebrow">БЕЗОПАСНЫЙ ДОСТУП</p><h1>${isSignUp ? "Создать аккаунт" : "С возвращением"}</h1><p class="auth-description">${isSignUp ? "Зарегистрируйтесь, чтобы начать работу с CRM." : "Войдите в аккаунт, чтобы открыть клиентов, сделки и задачи."}</p><form id="auth-form" data-auth-mode="${mode}"><label class="form-field"><span>Email</span><input type="email" name="email" autocomplete="email" placeholder="name@example.com" required /></label><label class="form-field"><span>Пароль</span><input type="password" name="password" autocomplete="${isSignUp ? "new-password" : "current-password"}" minlength="8" placeholder="Не менее 8 символов" required /></label><p class="auth-message ${message ? "is-visible" : ""}" id="auth-message" role="status">${escapeHTML(message)}</p><button class="button button-primary auth-submit" type="submit">${isSignUp ? "Создать аккаунт" : "Войти"}</button></form><p class="auth-switch">${isSignUp ? "Уже есть аккаунт?" : "Впервые здесь?"} <button type="button" data-auth-switch="${isSignUp ? "sign-in" : "sign-up"}">${isSignUp ? "Войти" : "Зарегистрироваться"}</button></p><p class="auth-security">Доступ к данным защищён политиками RLS в Supabase.</p></section>`;
  }

  function authErrorMessage(error) {
    const message = String(error?.message || "");
    if (/invalid login credentials/i.test(message)) return "Неверный email или пароль.";
    if (/email not confirmed/i.test(message)) return "Подтвердите email по ссылке из письма и войдите снова.";
    if (/user already registered/i.test(message)) return "Аккаунт с таким email уже существует. Попробуйте войти.";
    return message || "Не удалось выполнить вход. Попробуйте ещё раз.";
  }

  function databaseErrorMessage(error) {
    const message = String(error?.message || "");
    if (/relation .* does not exist|could not find the table|schema cache/i.test(message)) {
      return "Таблицы CRM не найдены. Примените SQL-миграцию из supabase/migrations и повторите попытку.";
    }
    if (/row-level security|permission denied|42501/i.test(message)) {
      return "Доступ запрещён. Проверьте вход в аккаунт и политики RLS в Supabase.";
    }
    return "Не удалось загрузить данные из Supabase. Проверьте URL проекта, Data API и применённую миграцию.";
  }

  function writeErrorMessage(error) {
    const message = String(error?.message || "");
    if (/23503|foreign key|violates.*constraint/i.test(message)) {
      return "Не удалось удалить запись: сначала удалите связанные задачи или сделки.";
    }
    if (/row-level security|permission denied|42501/i.test(message)) {
      return "Операция запрещена политикой доступа. Проверьте вход и RLS в Supabase.";
    }
    if (/relation .* does not exist|could not find the table|schema cache/i.test(message)) {
      return "Таблицы CRM не найдены. Сначала примените SQL-миграцию.";
    }
    return "Не удалось сохранить изменения в Supabase. Проверьте соединение и повторите попытку.";
  }

  function showDataLoadError(error) {
    appShell.hidden = true;
    authRoot.hidden = false;
    authRoot.innerHTML = `<section class="auth-card"><a class="brand auth-brand" href="#"><span class="brand-mark" aria-hidden="true">!</span><span class="brand-copy"><strong>север</strong><small>МИНИ CRM</small></span></a><p class="eyebrow">ПРОБЛЕМА ПОДКЛЮЧЕНИЯ</p><h1>Не удалось загрузить CRM</h1><p class="auth-description">${escapeHTML(databaseErrorMessage(error))}</p><div class="auth-actions"><button class="button button-primary" type="button" data-auth-action="retry">Повторить</button><button class="button" type="button" data-auth-action="sign-out">Выйти</button></div></section>`;
  }

  async function activateSession(session) {
    const user = session?.user;
    if (!user) {
      renderAuth();
      return false;
    }
    if (activeUserId === user.id && !appShell.hidden) return true;
    if (activationPromise) return activationPromise;

    activationPromise = (async () => {
      currentSession = session;
      authRoot.hidden = false;
      authRoot.innerHTML = `<section class="auth-card auth-loading"><span class="loading-spinner" aria-hidden="true"></span><p>Загружаем ваши данные…</p></section>`;
      appShell.hidden = true;
      try {
        await repository.load();
      } catch (error) {
        showDataLoadError(error);
        return false;
      }
      activeUserId = user.id;
      setupBanner.hidden = true;
      updateProfile(user);
      authRoot.hidden = true;
      appShell.hidden = false;
      render();
      return true;
    })();
    try {
      return await activationPromise;
    } finally {
      activationPromise = null;
    }
  }

  function handleSignedOut(message = "") {
    currentSession = null;
    activeUserId = null;
    repository.clear();
    updateProfile(null);
    renderAuth("sign-in", message);
  }

  async function submitAuthForm(form) {
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const mode = form.dataset.authMode;
    const button = form.querySelector("button[type=submit]");
    const message = authRoot.querySelector("#auth-message");
    button.disabled = true;
    if (message) message.textContent = "";
    try {
      const result = mode === "sign-up" ? await signUp(email, password) : await signIn(email, password);
      if (result.session) {
        await activateSession(result.session);
      } else if (mode === "sign-up") {
        renderAuth("sign-in", "Аккаунт создан. Подтвердите email по ссылке из письма, затем войдите.");
      } else {
        throw new Error("Supabase не вернул активную сессию. Попробуйте войти ещё раз.");
      }
    } catch (error) {
      if (message) {
        message.textContent = authErrorMessage(error);
        message.classList.add("is-visible");
      }
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }

  async function initializeAuthentication() {
    if (!isSupabaseConfigured) {
      setupBanner.hidden = false;
      updateProfile(null);
      render();
      return;
    }
    setupBanner.hidden = true;
    appShell.hidden = true;
    authRoot.hidden = false;
    authRoot.innerHTML = `<section class="auth-card auth-loading"><span class="loading-spinner" aria-hidden="true"></span><p>Проверяем сессию…</p></section>`;
    const subscription = subscribeToAuthChanges((event, session) => {
      window.setTimeout(() => {
        if (event === "SIGNED_OUT") handleSignedOut();
        else if (session?.user) void activateSession(session);
      }, 0);
    });
    window.addEventListener("beforeunload", () => subscription.unsubscribe(), { once: true });
    try {
      const { data, error } = await getCurrentSession();
      if (error) throw error;
      if (data.session) await activateSession(data.session);
      else renderAuth();
    } catch (error) {
      renderAuth("sign-in", authErrorMessage(error));
    }
  }

  function taskCheckboxMarkup(task, surface) {
    const actionLabel = task.status === "completed" ? `Вернуть задачу «${task.title}» в работу` : `Отметить задачу «${task.title}» выполненной`;
    return `<input class="task-checkbox" type="checkbox" data-task-toggle data-task-id="${escapeHTML(task.id)}" data-task-surface="${surface}" aria-label="${escapeHTML(actionLabel)}" title="${escapeHTML(actionLabel)}" ${task.status === "completed" ? "checked" : ""} />`;
  }

  function render() {
    document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("is-active", link.dataset.page === activePage));
    breadcrumbCurrent.textContent = pageNames[activePage];
    document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long" }).format(new Date());
    updateNavCounts();
    if (activePage === "dashboard") renderDashboard();
    else renderEntityPage(activePage);
  }

  function renderDashboard() {
    const clients = repository.list("clients");
    const deals = repository.list("deals");
    const tasks = repository.list("tasks");
    const wonTotal = deals.filter((deal) => deal.status === "won").reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
    const openTasks = tasks.filter((task) => task.status === "open");
    const recentClients = [...clients].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
    const recentDeals = [...deals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
    const upcomingTasks = [...openTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);

    pageContent.innerHTML = `
      <section class="page-heading">
        <div><p class="eyebrow">${escapeHTML(new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(new Date()).toLocaleUpperCase("ru-RU"))}</p><h1>Добрый день, Дениз 👋</h1><p class="page-subtitle">Вот что происходит в вашем рабочем пространстве.</p></div>
        <div class="heading-actions"><button class="button" type="button" data-action="new" data-entity="tasks"><span class="plus">＋</span> Новая задача</button><button class="button button-primary" type="button" data-action="new" data-entity="clients"><span class="plus">＋</span> Добавить клиента</button></div>
      </section>
      <section class="stats-grid" aria-label="Статистика">
        <article class="stat-card"><div class="stat-top"><span>Всего клиентов</span><span class="stat-icon">♙</span></div><div class="stat-value">${clients.length}</div><div class="stat-foot"><span class="positive">${clients.filter((client) => client.status === "active").length} активных</span> в базе</div></article>
        <article class="stat-card"><div class="stat-top"><span>Всего сделок</span><span class="stat-icon blue">◇</span></div><div class="stat-value">${deals.length}</div><div class="stat-foot"><span class="positive">${deals.filter((deal) => deal.status === "progress" || deal.status === "new").length} открытых</span> в работе</div></article>
        <article class="stat-card"><div class="stat-top"><span>Сумма успешных сделок</span><span class="stat-icon orange">₽</span></div><div class="stat-value">${escapeHTML(money(wonTotal))}</div><div class="stat-foot">${deals.filter((deal) => deal.status === "won").length} успешно закрыто</div></article>
        <article class="stat-card"><div class="stat-top"><span>Открытые задачи</span><span class="stat-icon red">☷</span></div><div class="stat-value">${openTasks.length}</div><div class="stat-foot">${openTasks.filter((task) => task.dueDate < isoDate()).length} требуют внимания</div></article>
      </section>
      <section class="dashboard-grid">
        <article class="panel"><header class="panel-header"><div><h2>Последние клиенты</h2><p>Недавно добавленные контакты</p></div><button class="text-button" type="button" data-page="clients">Все клиенты&nbsp; →</button></header><div class="compact-list">${recentClients.length ? recentClients.map((client, index) => `<div class="compact-row"><div class="compact-main"><span class="mini-avatar ${index ? `a${index + 1}` : ""}">${escapeHTML(initials(client.name))}</span><span><strong>${escapeHTML(client.name)}</strong><small>${escapeHTML(client.company || "Без компании")}</small></span></div><span class="compact-meta">${escapeHTML(client.email || "—")}</span>${badge("client", client.status)}</div>`).join("") : emptyCompact("Клиентов пока нет")}</div></article>
        <article class="panel"><header class="panel-header"><div><h2>Ближайшие задачи</h2><p>Открытые задачи по сроку</p></div><button class="text-button" type="button" data-page="tasks">Все задачи&nbsp; →</button></header><div class="task-list">${upcomingTasks.length ? upcomingTasks.map((task) => {
          const client = getClient(task.clientId);
          const overdue = task.dueDate < isoDate();
          return `<div class="task-row">${taskCheckboxMarkup(task, "dashboard")}<span class="task-copy"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(client ? client.name : "Без клиента")}</small></span><span class="task-date ${overdue ? "overdue" : ""}">${overdue ? "Просрочена" : escapeHTML(displayDate(task.dueDate, { day: "numeric", month: "short" }))}</span></div>`;
        }).join("") : emptyCompact("Открытых задач нет")}</div></article>
      </section>
      <section class="dashboard-grid">
        <article class="panel"><header class="panel-header"><div><h2>Последние сделки</h2><p>Недавно созданные возможности</p></div><button class="text-button" type="button" data-page="deals">Все сделки&nbsp; →</button></header><div class="compact-list">${recentDeals.length ? recentDeals.map((deal) => {
          const client = getClient(deal.clientId);
          return `<div class="compact-row deal-row"><div class="compact-deal"><strong>${escapeHTML(deal.title)}</strong><small>${escapeHTML(client ? client.name : "Клиент не выбран")}</small></div><span>${badge("deal", deal.status)}</span><span class="compact-amount">${escapeHTML(money(deal.amount))}</span></div>`;
        }).join("") : emptyCompact("Сделок пока нет")}</div></article>
        <article class="panel"><header class="panel-header"><div><h2>Воронка продаж</h2><p>Распределение сделок по статусам</p></div><span class="badge new">${deals.length} сделок</span></header><div class="compact-list funnel-list">${renderFunnel(deals)}</div></article>
      </section>`;
  }

  function emptyCompact(message) { return `<div class="empty-compact">${escapeHTML(message)}</div>`; }
  function renderFunnel(deals) {
    const stages = [{ key: "new", color: "#6d88cb" }, { key: "progress", color: "#d4a24f" }, { key: "won", color: "#4b9279" }, { key: "lost", color: "#cc7772" }];
    return stages.map(({ key, color }) => {
      const count = deals.filter((deal) => deal.status === key).length;
      const percent = deals.length ? Math.round((count / deals.length) * 100) : 0;
      return `<div class="funnel-row"><span>${badge("deal", key)}</span><span class="funnel-track"><i style="width:${percent}%;background:${color}"></i></span><strong>${count}</strong></div>`;
    }).join("");
  }

  const pageConfig = {
    clients: { singular: "клиента", title: "Клиенты", subtitle: "Вся информация о ваших контактах и компаниях.", search: "Поиск по имени, компании или email", filters: [{ name: "status", label: "Все статусы", options: [["active", "Активный"], ["potential", "Потенциальный"], ["inactive", "Неактивный"]] }, { name: "category", label: "Все категории", options: categoryOptions.map((value) => [value, value]) }] },
    deals: { singular: "сделку", title: "Сделки", subtitle: "Следите за ходом продаж и результатами команды.", search: "Поиск по сделке или клиенту", filters: [{ name: "status", label: "Все статусы", options: [["new", "Новая"], ["progress", "В работе"], ["won", "Успешно закрыта"], ["lost", "Проиграна"]] }] },
    tasks: { singular: "задачу", title: "Задачи", subtitle: "Планируйте работу и не упускайте важные сроки.", search: "Поиск по задаче или клиенту", filters: [{ name: "status", label: "Все статусы", options: [["open", "Открыта"], ["completed", "Выполнена"]] }, { name: "priority", label: "Любой приоритет", options: [["high", "Высокий"], ["medium", "Средний"], ["low", "Низкий"]] }] },
  };

  function renderEntityPage(entity) {
    const config = pageConfig[entity];
    pageContent.innerHTML = `
      <section class="page-heading">
        <div><p class="eyebrow">УПРАВЛЕНИЕ</p><h1>${config.title}</h1><p class="page-subtitle">${config.subtitle}</p></div>
        <div class="heading-actions"><button class="button button-primary" type="button" data-action="new" data-entity="${entity}"><span class="plus">＋</span> Добавить ${config.singular}</button></div>
      </section>
      <section class="panel table-panel">
        <div class="toolbar"><label class="search-field"><span aria-hidden="true">⌕</span><input type="search" data-search placeholder="${config.search}" aria-label="${config.search}" autocomplete="off" /></label>${config.filters.map((filter) => `<select class="filter-select" data-filter="${filter.name}" aria-label="${filter.label}"><option value="">${filter.label}</option>${filter.options.map(([value, label]) => `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`).join("")}</select>`).join("")}<span class="toolbar-spacer"></span><span class="result-count" id="result-count"></span></div>
        <div class="table-wrap" id="table-container"></div>
      </section>`;
    renderEntityTable(entity);
  }

  function renderEntityTable(entity) {
    const container = document.querySelector("#table-container");
    if (!container) return;
    const query = (document.querySelector("[data-search]")?.value || "").trim().toLocaleLowerCase("ru");
    const selectedFilters = [...document.querySelectorAll("[data-filter]")].reduce((acc, select) => ({ ...acc, [select.dataset.filter]: select.value }), {});
    let records = repository.list(entity);
    if (query) records = records.filter((record) => {
      const client = entity === "clients" ? null : getClient(record.clientId);
      const values = entity === "clients" ? [record.name, record.email, record.phone, record.company] : entity === "deals" ? [record.title, client?.name, client?.company] : [record.title, record.description, client?.name, getDeal(record.dealId)?.title];
      return values.some((value) => String(value || "").toLocaleLowerCase("ru").includes(query));
    });
    Object.entries(selectedFilters).forEach(([key, value]) => { if (value) records = records.filter((record) => record[key] === value); });
    document.querySelector("#result-count").textContent = `${records.length} ${pluralize(entity, records.length)}`;
    if (!records.length) {
      container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⌕</span><strong>${repository.list(entity).length ? "Ничего не найдено" : "Здесь пока пусто"}</strong><p>${repository.list(entity).length ? "Измените запрос или выберите другие фильтры." : `Добавьте первую запись — ${entity === "clients" ? "клиенты" : entity === "deals" ? "сделки" : "задачи"} появятся здесь.`}</p>${repository.list(entity).length ? "" : `<button class="button button-primary" type="button" data-action="new" data-entity="${entity}"><span class="plus">＋</span> Добавить ${pageConfig[entity].singular}</button>`}</div>`;
      return;
    }
    if (entity === "clients") container.innerHTML = renderClientTable(records);
    if (entity === "deals") container.innerHTML = renderDealTable(records);
    if (entity === "tasks") container.innerHTML = renderTaskTable(records);
  }

  function pluralize(entity, count) {
    if (entity === "clients") return count === 1 ? "клиент" : count > 1 && count < 5 ? "клиента" : "клиентов";
    if (entity === "deals") return count === 1 ? "сделка" : count > 1 && count < 5 ? "сделки" : "сделок";
    return count === 1 ? "задача" : count > 1 && count < 5 ? "задачи" : "задач";
  }
  const actionButtons = (entity, id) => `<div class="row-actions"><button class="row-action" type="button" title="Просмотреть" aria-label="Просмотреть" data-action="view" data-entity="${entity}" data-id="${escapeHTML(id)}">↗</button><button class="row-action" type="button" title="Редактировать" aria-label="Редактировать" data-action="edit" data-entity="${entity}" data-id="${escapeHTML(id)}">✎</button><button class="row-action danger" type="button" title="Удалить" aria-label="Удалить" data-action="delete" data-entity="${entity}" data-id="${escapeHTML(id)}">×</button></div>`;
  function renderClientTable(records) {
    return `<table><thead><tr><th>Клиент</th><th>Компания</th><th>Категория</th><th>Статус</th><th>Добавлен</th><th></th></tr></thead><tbody>${records.map((client, index) => `<tr><td><div class="primary-cell"><span class="${avatarClass(index)}">${escapeHTML(initials(client.name))}</span><span><strong>${escapeHTML(client.name)}</strong><small>${escapeHTML(client.email || "Email не указан")}</small></span></div></td><td>${escapeHTML(client.company || "—")}</td><td>${escapeHTML(client.category || "—")}</td><td>${badge("client", client.status)}</td><td>${escapeHTML(displayDate(client.createdAt))}</td><td>${actionButtons("clients", client.id)}</td></tr>`).join("")}</tbody></table>`;
  }
  function renderDealTable(records) {
    return `<table><thead><tr><th>Сделка</th><th>Клиент</th><th>Сумма</th><th>Статус</th><th>Дата завершения</th><th></th></tr></thead><tbody>${records.map((deal, index) => { const client = getClient(deal.clientId); return `<tr><td><div class="primary-cell"><span class="${avatarClass(index)}">◇</span><span><strong>${escapeHTML(deal.title)}</strong><small>Создана ${escapeHTML(displayDate(deal.createdAt))}</small></span></div></td><td>${escapeHTML(client ? client.name : "Клиент не выбран")}</td><td class="cell-strong">${escapeHTML(money(deal.amount))}</td><td>${badge("deal", deal.status)}</td><td>${escapeHTML(displayDate(deal.closeDate))}</td><td>${actionButtons("deals", deal.id)}</td></tr>`; }).join("")}</tbody></table>`;
  }
  function renderTaskTable(records) {
    return `<table><thead><tr><th>Задача</th><th>Клиент</th><th>Сделка</th><th>Срок</th><th>Приоритет</th><th>Статус</th><th></th></tr></thead><tbody>${records.map((task, index) => { const client = getClient(task.clientId); const deal = getDeal(task.dealId); const overdue = task.status === "open" && task.dueDate < isoDate(); return `<tr><td><div class="primary-cell">${taskCheckboxMarkup(task, "tasks")}<span class="${avatarClass(index)}">☷</span><span><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.description || "Без описания")}</small></span></div></td><td>${escapeHTML(client ? client.name : "—")}</td><td>${escapeHTML(deal ? deal.title : "—")}</td><td class="${overdue ? "cell-overdue" : ""}">${overdue ? "Просрочена · " : ""}${escapeHTML(displayDate(task.dueDate))}</td><td><span class="priority-label ${escapeHTML(task.priority)}">${escapeHTML(stateLabels.priority[task.priority] || "—")}</span></td><td>${badge("task", task.status)}</td><td>${actionButtons("tasks", task.id)}</td></tr>`; }).join("")}</tbody></table>`;
  }

  const optionMarkup = (items, selected, placeholder) => `<option value="">${placeholder}</option>${items.map(([value, label]) => `<option value="${escapeHTML(value)}" ${value === selected ? "selected" : ""}>${escapeHTML(label)}</option>`).join("")}`;
  const field = (label, name, input, full = false) => `<div class="form-field ${full ? "full" : ""}"><label for="field-${name}">${label}</label>${input}</div>`;
  const textInput = (name, value, placeholder = "", type = "text", required = false) => `<input id="field-${name}" name="${name}" type="${type}" value="${escapeHTML(value || "")}" placeholder="${escapeHTML(placeholder)}" ${required ? "required" : ""} />`;
  const clientOptions = () => repository.list("clients").map((client) => [client.id, `${client.name}${client.company ? ` · ${client.company}` : ""}`]);
  const dealOptions = (selectedClientId, selectedDealId) => repository.list("deals").filter((deal) => !selectedClientId || deal.clientId === selectedClientId).map((deal) => [deal.id, deal.title]);
  const clientSelectMarkup = (selectedId, { required = false, locked = false, placeholder = "Выберите клиента" } = {}) => {
    const selectedClient = selectedId ? repository.get("clients", selectedId) : null;
    const selection = locked && selectedClient ? [[selectedClient.id, `${selectedClient.name}${selectedClient.company ? ` · ${selectedClient.company}` : ""}`]] : clientOptions();
    return `<select id="field-clientId" name="clientId" ${required ? "required" : ""} ${locked ? "disabled" : ""}>${optionMarkup(selection, selectedId, placeholder)}</select>${locked && selectedClient ? `<input type="hidden" name="clientId" value="${escapeHTML(selectedClient.id)}" />` : ""}`;
  };

  function activeModalEntity() { return modalRoot.dataset.entity || ""; }
  function openForm(entity, id = "", options = {}) {
    if (!pageConfig[entity]) {
      showToast("Не удалось открыть форму записи.");
      return;
    }
    const record = id ? repository.get(entity, id) : {};
    if (!record) return;
    const isEdit = Boolean(id);
    const prefillClientId = !isEdit ? options.prefillClientId || "" : "";
    const returnClientId = options.returnClientId || "";
    const lockClient = Boolean(prefillClientId);
    const formId = "record-form";
    let fields = "";
    if (entity === "clients") {
      fields = `${field('Имя <span class="required">*</span>', "name", textInput("name", record.name, "Например, Анна Кузнецова", "text", true))}${field("Email", "email", textInput("email", record.email, "name@company.ru", "email"))}${field("Телефон", "phone", textInput("phone", record.phone, "+7 (___) ___-__-__", "tel"))}${field("Компания", "company", textInput("company", record.company, "Название компании"))}${field("Категория", "category", `<select id="field-category" name="category">${optionMarkup(categoryOptions.map((value) => [value, value]), record.category || "Новый", "Выберите категорию")}</select>`)}${field("Статус", "status", `<select id="field-status" name="status">${optionMarkup([["active", "Активный"], ["potential", "Потенциальный"], ["inactive", "Неактивный"]], record.status || "potential", "Выберите статус")}</select>`)}${field("Заметки", "notes", `<textarea id="field-notes" name="notes" placeholder="Добавьте важную информацию о клиенте">${escapeHTML(record.notes || "")}</textarea>`, true)}`;
    }
    if (entity === "deals") {
      const clientId = record.clientId || prefillClientId;
      fields = `${field('Название сделки <span class="required">*</span>', "title", textInput("title", record.title, "Например, Годовое обслуживание", "text", true), true)}${field('Клиент <span class="required">*</span>', "clientId", clientSelectMarkup(clientId, { required: true, locked: lockClient }), true)}${field('Сумма, ₽ <span class="required">*</span>', "amount", `<input id="field-amount" name="amount" type="number" min="0" step="1" value="${escapeHTML(record.amount ?? "")}" placeholder="0" required />`)}${field("Статус", "status", `<select id="field-status" name="status">${optionMarkup([["new", "Новая"], ["progress", "В работе"], ["won", "Успешно закрыта"], ["lost", "Проиграна"]], record.status || "new", "Выберите статус")}</select>`)}${field("Дата завершения", "closeDate", textInput("closeDate", record.closeDate, "", "date"), true)}`;
    }
    if (entity === "tasks") {
      const clientId = record.clientId || prefillClientId;
      fields = `${field('Название задачи <span class="required">*</span>', "title", textInput("title", record.title, "Например, Подготовить предложение", "text", true), true)}${field("Описание", "description", `<textarea id="field-description" name="description" placeholder="Что нужно сделать?">${escapeHTML(record.description || "")}</textarea>`, true)}${field("Клиент", "clientId", clientSelectMarkup(clientId, { locked: lockClient, placeholder: "Без клиента" }), true)}${field("Связанная сделка", "dealId", `<select id="field-dealId" name="dealId">${optionMarkup(dealOptions(clientId, record.dealId), record.dealId || "", "Без сделки")}</select>`, true)}${field('Срок выполнения <span class="required">*</span>', "dueDate", textInput("dueDate", record.dueDate, "", "date", true))}${field("Приоритет", "priority", `<select id="field-priority" name="priority">${optionMarkup([["low", "Низкий"], ["medium", "Средний"], ["high", "Высокий"]], record.priority || "medium", "Выберите приоритет")}</select>`)}${field("Статус", "status", `<select id="field-status" name="status">${optionMarkup([["open", "Открыта"], ["completed", "Выполнена"]], record.status || "open", "Выберите статус")}</select>`)}`;
    }
    const entityName = pageConfig[entity].singular;
    modalRoot.dataset.entity = entity;
    if (returnClientId) modalRoot.dataset.returnClientId = returnClientId;
    else delete modalRoot.dataset.returnClientId;
    modalRoot.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><h2 id="modal-title">${isEdit ? "Редактировать" : "Добавить"} ${entityName}</h2><p>${isEdit ? "Измените данные записи и сохраните результат." : "Заполните информацию о новой записи."}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Закрыть">×</button></header><form id="${formId}" data-entity="${entity}" data-id="${escapeHTML(id)}"><div class="modal-body"><div class="form-grid">${fields}</div></div><footer class="modal-footer"><span class="form-hint">${isEdit && record.createdAt ? `Создано ${escapeHTML(displayDate(record.createdAt))}` : "Поля со звёздочкой обязательны"}</span><span class="modal-footer-right"><button class="button" type="button" data-action="close-modal">Отмена</button><button class="button button-primary" type="submit">${isEdit ? "Сохранить" : "Добавить"}</button></span></footer></form></section>`;
    window.requestAnimationFrame(() => modalRoot.querySelector("input, select, textarea")?.focus());
  }

  function detailFields(entity, record) {
    const item = (label, value, full = false) => `<div class="detail-item ${full ? "full" : ""}"><dt>${label}</dt><dd>${value || "—"}</dd></div>`;
    if (entity === "clients") return `${item("Имя", escapeHTML(record.name))}${item("Компания", escapeHTML(record.company || "—"))}${item("Email", escapeHTML(record.email || "—"))}${item("Телефон", escapeHTML(record.phone || "—"))}${item("Категория", escapeHTML(record.category || "—"))}${item("Статус", badge("client", record.status))}${item("Дата создания", escapeHTML(displayDate(record.createdAt)))}${item("Заметки", escapeHTML(record.notes || "Нет заметок"), true)}`;
    if (entity === "deals") { const client = getClient(record.clientId); return `${item("Название", escapeHTML(record.title))}${item("Клиент", escapeHTML(client ? client.name : "Клиент удалён"))}${item("Сумма", escapeHTML(money(record.amount)))}${item("Статус", badge("deal", record.status))}${item("Дата завершения", escapeHTML(displayDate(record.closeDate)))}${item("Дата создания", escapeHTML(displayDate(record.createdAt)))}`; }
    const client = getClient(record.clientId); const deal = getDeal(record.dealId);
    return `${item("Название", escapeHTML(record.title))}${item("Статус", badge("task", record.status))}${item("Клиент", escapeHTML(client ? client.name : "—"))}${item("Связанная сделка", escapeHTML(deal ? deal.title : "—"))}${item("Срок выполнения", escapeHTML(displayDate(record.dueDate)))}${item("Приоритет", badge("priority", record.priority))}${item("Описание", escapeHTML(record.description || "Нет описания"), true)}`;
  }

  function renderClientRelations(client) {
    const deals = repository.list("deals").filter((deal) => deal.clientId === client.id);
    const tasks = repository.list("tasks").filter((task) => task.clientId === client.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const dealRows = deals.length ? deals.map((deal) => `<div class="relation-row"><div class="relation-copy"><strong>${escapeHTML(deal.title)}</strong><small>${escapeHTML(money(deal.amount))}</small></div>${badge("deal", deal.status)}<button class="row-action" type="button" title="Редактировать сделку" aria-label="Редактировать сделку ${escapeHTML(deal.title)}" data-action="edit" data-entity="deals" data-id="${escapeHTML(deal.id)}" data-return-client="${escapeHTML(client.id)}">✎</button></div>`).join("") : `<p class="relation-empty">У этого клиента пока нет сделок.</p>`;
    const taskRows = tasks.length ? tasks.map((task) => `<div class="relation-row"><div class="relation-task-toggle">${taskCheckboxMarkup(task, "client-card")}</div><div class="relation-copy"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(displayDate(task.dueDate))} · <span class="priority-label ${escapeHTML(task.priority)}">${escapeHTML(stateLabels.priority[task.priority] || "—")}</span></small></div>${badge("task", task.status)}<button class="row-action" type="button" title="Редактировать задачу" aria-label="Редактировать задачу ${escapeHTML(task.title)}" data-action="edit" data-entity="tasks" data-id="${escapeHTML(task.id)}" data-return-client="${escapeHTML(client.id)}">✎</button></div>`).join("") : `<p class="relation-empty">У этого клиента пока нет задач.</p>`;
    return `<div class="client-relations"><section class="relation-section" aria-labelledby="client-deals-title"><header class="relation-header"><h3 id="client-deals-title">Сделки клиента <span>${deals.length}</span></h3><button class="button button-small" type="button" data-action="new" data-entity="deals" data-prefill-client="${escapeHTML(client.id)}" data-return-client="${escapeHTML(client.id)}"><span class="plus">＋</span> Добавить сделку</button></header><div class="relation-list">${dealRows}</div></section><section class="relation-section" aria-labelledby="client-tasks-title"><header class="relation-header"><h3 id="client-tasks-title">Задачи клиента <span>${tasks.length}</span></h3><button class="button button-small" type="button" data-action="new" data-entity="tasks" data-prefill-client="${escapeHTML(client.id)}" data-return-client="${escapeHTML(client.id)}"><span class="plus">＋</span> Добавить задачу</button></header><div class="relation-list">${taskRows}</div></section></div>`;
  }

  function openDetails(entity, id) {
    const record = repository.get(entity, id);
    if (!record) return;
    const title = entity === "clients" ? record.name : entity === "deals" ? record.title : record.title;
    modalRoot.dataset.entity = entity;
    modalRoot.dataset.recordId = id;
    delete modalRoot.dataset.returnClientId;
    const relationSections = entity === "clients" ? renderClientRelations(record) : "";
    modalRoot.innerHTML = `<section class="modal ${entity === "clients" ? "modal-client" : "modal-small"}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><p class="eyebrow">${pageNames[entity]}</p><h2 id="modal-title">${escapeHTML(title)}</h2></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Закрыть">×</button></header><div class="modal-body"><dl class="details-grid">${detailFields(entity, record)}</dl>${relationSections}</div><footer class="modal-footer"><span class="form-hint">Карточка записи</span><span class="modal-footer-right"><button class="button" type="button" data-action="close-modal">Закрыть</button><button class="button button-primary" type="button" data-action="edit" data-entity="${entity}" data-id="${escapeHTML(id)}">Редактировать</button></span></footer></section>`;
  }

  function closeModal() { modalRoot.innerHTML = ""; delete modalRoot.dataset.entity; delete modalRoot.dataset.recordId; delete modalRoot.dataset.returnClientId; }
  function showToast(message) {
    window.clearTimeout(toastTimer);
    toastRegion.innerHTML = `<div class="toast" role="status">${escapeHTML(message)}</div>`;
    toastTimer = window.setTimeout(() => { toastRegion.innerHTML = ""; }, 3000);
  }

  function refreshTaskSurface(surface) {
    if (surface === "dashboard" && activePage === "dashboard") renderDashboard();
    else if (surface === "tasks" && activePage === "tasks") renderEntityTable("tasks");
    else if (surface === "client-card" && modalRoot.dataset.entity === "clients" && modalRoot.dataset.recordId) {
      openDetails("clients", modalRoot.dataset.recordId);
    }
  }

  async function setTaskStatus(id, completed, surface) {
    const task = repository.get("tasks", id);
    if (!task) {
      showToast("Не удалось найти задачу. Обновите список и попробуйте ещё раз.");
      refreshTaskSurface(surface);
      return false;
    }
    const nextStatus = completed ? "completed" : "open";
    try {
      if (task.status !== nextStatus && !await repository.update("tasks", id, { status: nextStatus })) {
        showToast("Не удалось обновить задачу. Обновите список и попробуйте ещё раз.");
        refreshTaskSurface(surface);
        return false;
      }
      updateNavCounts();
      refreshTaskSurface(surface);
      return true;
    } catch (error) {
      showToast(writeErrorMessage(error));
      refreshTaskSurface(surface);
      return false;
    }
  }

  async function deleteRecord(entity, id, returnClientId = "") {
    const record = repository.get(entity, id);
    if (!record) {
      showToast("Запись уже недоступна. Обновите список.");
      if (activePage === "dashboard") renderDashboard();
      else renderEntityPage(activePage);
      return;
    }
    const label = entity === "clients" ? record.name : record.title;
    if (!window.confirm(`Удалить «${label}»? Это действие нельзя отменить.`)) return;
    try {
      const deleted = await repository.delete(entity, id);
      if (!deleted) {
        showToast("Запись не найдена или у вас нет доступа к ней.");
        return;
      }
      updateNavCounts();
      if (returnClientId && getClient(returnClientId)) openDetails("clients", returnClientId);
      else if (activePage === "dashboard") renderDashboard();
      else renderEntityPage(activePage);
      showToast("Запись удалена");
    } catch (error) {
      showToast(writeErrorMessage(error));
    }
  }

  document.addEventListener("click", async (event) => {
    if (event.target.closest("#notification-close")) {
      closeNotifications();
      return;
    }
    const notificationTask = event.target.closest("[data-notification-task]");
    if (notificationTask) {
      closeNotifications();
      openDetails("tasks", notificationTask.dataset.notificationTask);
      return;
    }
    if (!event.target.closest(".notification-wrap")) closeNotifications();

    const authSwitch = event.target.closest("[data-auth-switch]");
    if (authSwitch) {
      renderAuth(authSwitch.dataset.authSwitch);
      return;
    }
    const authAction = event.target.closest("[data-auth-action]");
    if (authAction) {
      if (authAction.dataset.authAction === "retry" && currentSession) await activateSession(currentSession);
      if (authAction.dataset.authAction === "sign-out") {
        try {
          await signOut();
          handleSignedOut("Вы вышли из аккаунта.");
        } catch (error) {
          showToast(authErrorMessage(error));
        }
      }
      return;
    }
    const pageLink = event.target.closest("[data-page]");
    if (pageLink) {
      event.preventDefault();
      activePage = pageLink.dataset.page;
      document.querySelector("#sidebar").classList.remove("is-open");
      document.querySelector("#sidebar-scrim").classList.remove("is-visible");
      render();
      return;
    }
    const action = event.target.closest("[data-action]");
    if (!action) return;
    if (action.dataset.action === "new") openForm(action.dataset.entity, "", { prefillClientId: action.dataset.prefillClient, returnClientId: action.dataset.returnClient });
    if (action.dataset.action === "edit") openForm(action.dataset.entity, action.dataset.id, { returnClientId: action.dataset.returnClient });
    if (action.dataset.action === "view") openDetails(action.dataset.entity, action.dataset.id);
    if (action.dataset.action === "delete") await deleteRecord(action.dataset.entity, action.dataset.id, action.dataset.returnClient);
    if (action.dataset.action === "close-modal") closeModal();
    if (action.dataset.action === "sign-out") {
      try {
        await signOut();
        handleSignedOut("Вы вышли из аккаунта.");
      } catch (error) {
        showToast(authErrorMessage(error));
      }
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-search]")) renderEntityTable(activePage);
  });
  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-task-toggle]")) {
      void setTaskStatus(event.target.dataset.taskId, event.target.checked, event.target.dataset.taskSurface);
      return;
    }
    if (event.target.matches("[data-filter]")) renderEntityTable(activePage);
    if (event.target.matches('#field-clientId') && activeModalEntity() === "tasks") {
      const dealSelect = modalRoot.querySelector('#field-dealId');
      const previous = dealSelect.value;
      const options = dealOptions(event.target.value, previous);
      dealSelect.innerHTML = optionMarkup(options, options.some(([value]) => value === previous) ? previous : "", "Без сделки");
    }
    if (event.target.matches('#field-dealId') && activeModalEntity() === "tasks" && event.target.value) {
      const deal = getDeal(event.target.value);
      const clientSelect = modalRoot.querySelector('#field-clientId');
      if (deal && !clientSelect.value) {
        clientSelect.value = deal.clientId;
        const dealSelect = modalRoot.querySelector('#field-dealId');
        dealSelect.innerHTML = optionMarkup(dealOptions(deal.clientId, deal.id), deal.id, "Без сделки");
      }
    }
  });

  document.addEventListener("submit", async (event) => {
    if (event.target.id === "auth-form") {
      event.preventDefault();
      await submitAuthForm(event.target);
      return;
    }
    if (event.target.id !== "record-form") return;
    event.preventDefault();
    const form = event.target;
    const entity = form.dataset.entity;
    const id = form.dataset.id;
    const values = Object.fromEntries(new FormData(form).entries());
    if (entity === "deals") values.amount = Number(values.amount);
    if (entity === "tasks" && values.dealId) {
      const deal = getDeal(values.dealId);
      if (deal && !values.clientId) values.clientId = deal.clientId;
      if (deal && values.clientId && deal.clientId !== values.clientId) {
        showToast("Выбранная сделка не связана с этим клиентом.");
        return;
      }
    }
    if (entity === "clients" && !values.createdAt) values.createdAt = isoDate();
    if (entity === "deals") {
      const previous = id ? repository.get(entity, id) : null;
      values.createdAt = previous?.createdAt || isoDate();
    }
    try {
      const updated = id
        ? await repository.update(entity, id, values)
        : await repository.add(entity, entity === "clients" ? { ...values, createdAt: isoDate() } : entity === "deals" ? { ...values, createdAt: isoDate() } : values);
      if (!updated) {
        showToast("Запись не найдена или у вас нет доступа к ней.");
        return;
      }
      const returnClientId = modalRoot.dataset.returnClientId;
      closeModal();
      updateNavCounts();
      if (returnClientId && getClient(returnClientId)) openDetails("clients", returnClientId);
      else if (activePage === "dashboard") renderDashboard(); else renderEntityPage(activePage);
      showToast(id ? "Изменения сохранены" : "Запись добавлена");
    } catch (error) {
      showToast(writeErrorMessage(error));
    }
  });

  document.querySelector("#mobile-menu-button").addEventListener("click", () => {
    document.querySelector("#sidebar").classList.add("is-open");
    document.querySelector("#sidebar-scrim").classList.add("is-visible");
  });
  document.querySelector("#sidebar-scrim").addEventListener("click", () => {
    document.querySelector("#sidebar").classList.remove("is-open");
    document.querySelector("#sidebar-scrim").classList.remove("is-visible");
  });
  modalRoot.addEventListener("click", (event) => { if (event.target === modalRoot) closeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && modalRoot.innerHTML) closeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !notificationPanel.hidden) closeNotifications(); });

  void initializeAuthentication();
})();
