/* ArcLink Community Hub — browser-side dashboard logic.
 * Public Roblox data is fetched through the companion Cloudflare Worker in /src/index.js.
 * Staff logs, sessions, group bookmarks, and settings are stored only in this browser.
 */

const ICONS = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  player: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5M8 10.5h5M10.5 8v5"/>',
  group: '<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M17 11a4 4 0 0 0 0-8M21 21v-2a4 4 0 0 0-3-3.87"/>',
  audit: '<path d="M8 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="8" y="2" width="8" height="5" rx="1.5"/><path d="M8 12h8M8 16h6"/>',
  sessions: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h6"/>',
  docs: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4L7.7 15a7.4 7.4 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8H14l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7.4 7.4 0 0 1 0 1.8Z" transform="translate(-1.3 -1.3) scale(1.11)"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  external: '<path d="M14 3h7v7M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sparkles: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3ZM19 14l1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z"/>',
  chart: '<path d="M3 3v18h18M8 15l4-4 3 3 5-7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  warning: '<path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  database: '<ellipse cx="12" cy="5" rx="8.5" ry="3"/><path d="M3.5 5v7c0 1.7 3.8 3 8.5 3s8.5-1.3 8.5-3V5M3.5 12v7c0 1.7 3.8 3 8.5 3s8.5-1.3 8.5-3v-7"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>',
  gamepad: '<path d="M6 11h4M8 9v4M16 10h.01M18 12h.01"/><path d="M6 7h12a4 4 0 0 1 3.9 4.9l-1 4A3 3 0 0 1 18 18h-1.5l-2.6-3h-3.8l-2.6 3H6a3 3 0 0 1-2.9-2.1l-1-4A4 4 0 0 1 6 7Z"/>',
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  empty: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/>',
};

function icon(name, className = "") {
  const path = ICONS[name] || ICONS.sparkles;
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

const STORAGE_KEY = "arclink.community-hub.v1";
const defaults = {
  workspaceName: "ArcLink HQ",
  history: [],
  savedGroups: [],
  audit: [],
  sessions: [],
};

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaults);
    const saved = JSON.parse(raw);
    return {
      workspaceName: typeof saved.workspaceName === "string" ? saved.workspaceName.slice(0, 50) : defaults.workspaceName,
      history: Array.isArray(saved.history) ? saved.history.slice(0, 10) : [],
      savedGroups: Array.isArray(saved.savedGroups) ? saved.savedGroups.slice(0, 50) : [],
      audit: Array.isArray(saved.audit) ? saved.audit.slice(0, 200) : [],
      sessions: Array.isArray(saved.sessions) ? saved.sessions.slice(0, 100) : [],
    };
  } catch {
    return structuredClone(defaults);
  }
}

const stored = loadStored();
const state = {
  page: "overview",
  workspaceName: stored.workspaceName,
  history: stored.history,
  savedGroups: stored.savedGroups,
  audit: stored.audit,
  sessions: stored.sessions,
  apiStatus: "checking",
  playerQuery: "",
  groupQuery: "",
  userLookup: null,
  groupLookup: null,
  busy: false,
};

const NAV_PRIMARY = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "players", label: "Player lookup", icon: "player" },
  { id: "groups", label: "Group explorer", icon: "group" },
  { id: "audit", label: "Audit log", icon: "audit" },
  { id: "sessions", label: "Sessions", icon: "sessions" },
];
const NAV_SECONDARY = [
  { id: "docs", label: "API & docs", icon: "docs" },
  { id: "settings", label: "Settings", icon: "settings" },
];
const PAGE_NAMES = {
  overview: "Overview",
  players: "Player lookup",
  groups: "Group explorer",
  audit: "Audit log",
  sessions: "Sessions",
  docs: "API & docs",
  settings: "Settings",
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
function saveStored() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      workspaceName: state.workspaceName,
      history: state.history.slice(0, 10),
      savedGroups: state.savedGroups.slice(0, 50),
      audit: state.audit.slice(0, 200),
      sessions: state.sessions.slice(0, 100),
    }));
  } catch {
    toast("Your browser could not save local data. Export a backup before closing this tab.", "error");
  }
}
function safeInitials(value) {
  const name = String(value || "A").trim();
  return esc(name ? name.slice(0, 1).toUpperCase() : "A");
}
function formatNumber(value) {
  if (!Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", { notation: Number(value) >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(Number(value));
}
function formatDate(value, options = {}) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, options.year ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" });
}
function formatDateTime(value) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}
function relativeTime(value) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Recently";
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}
function localDateOffset(days = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function nowISO() { return new Date().toISOString(); }
function escAttr(value) { return esc(value); }

function toast(message, kind = "success") {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const item = document.createElement("div");
  item.className = `toast${kind === "error" ? " error" : ""}`;
  item.innerHTML = `${icon(kind === "error" ? "warning" : "check")}<span>${esc(message)}</span>`;
  region.appendChild(item);
  window.setTimeout(() => item.remove(), 4200);
}

function navItem(item) {
  return `<button type="button" class="nav-item${state.page === item.id ? " active" : ""}" data-nav="${item.id}"${state.page === item.id ? ' aria-current="page"' : ""}>${icon(item.icon)}<span>${esc(item.label)}</span></button>`;
}
function renderSidebar() {
  return `<aside class="sidebar">
    <a class="brand" href="#overview" data-nav="overview" aria-label="ArcLink home">
      <span class="brand-mark">A</span>
      <span class="brand-copy"><span class="brand-name">ArcLink</span><span class="brand-subtitle">Community suite</span></span>
    </a>
    <button class="workspace-switch" type="button" data-nav="settings" aria-label="Edit workspace settings">
      <span class="workspace-avatar">${safeInitials(state.workspaceName)}</span>
      <span class="workspace-copy"><span class="workspace-title">${esc(state.workspaceName)}</span><span class="workspace-caption">Personal workspace</span></span>
      <span class="workspace-chevron">${icon("down")}</span>
    </button>
    <div class="nav-label">Workspace</div>
    <nav class="nav-list primary-nav" aria-label="Workspace navigation">${NAV_PRIMARY.map(navItem).join("")}</nav>
    <div class="nav-divider"></div>
    <div class="nav-label">Developer</div>
    <nav class="nav-list secondary-nav" aria-label="Developer navigation">${NAV_SECONDARY.map(navItem).join("")}</nav>
    <div class="sidebar-bottom">
      <div class="api-status-card">
        <div class="status-line"><span class="status-dot ${state.apiStatus === "online" ? "online" : state.apiStatus === "offline" ? "offline" : ""}"></span><span>${state.apiStatus === "online" ? "Roblox API proxy ready" : state.apiStatus === "offline" ? "API proxy unavailable" : "Checking API connection"}</span></div>
        <p>${state.apiStatus === "online" ? "Worker health check passed. Public profile and group lookups are available." : state.apiStatus === "offline" ? "Run this project through its Cloudflare Worker to enable live Roblox lookups." : "Checking the Cloudflare Worker endpoint…"}</p>
      </div>
      <div class="sidebar-footer"><span class="footer-spark">✦</span><span>Built for Roblox communities</span></div>
    </div>
  </aside>`;
}
function renderTopbar() {
  return `<header class="topbar">
    <div class="breadcrumb"><span>ArcLink</span>${icon("chevron")}<strong>${esc(PAGE_NAMES[state.page] || "Overview")}</strong></div>
    <div class="topbar-right">
      <form class="global-search" data-form="global-player" role="search">
        ${icon("search")}<input name="query" type="search" maxlength="32" placeholder="Find a Roblox player…" aria-label="Find a Roblox player"><kbd>↵</kbd>
      </form>
      <div class="topbar-divider"></div>
      <button type="button" class="icon-button" data-nav="docs" aria-label="API help">${icon("info")}</button>
      <div class="user-chip"><span class="user-chip-avatar">${safeInitials(state.workspaceName)}</span><span class="user-chip-copy"><strong>${esc(state.workspaceName)}</strong><small>Workspace owner</small></span></div>
    </div>
  </header>`;
}
function pageHeading(eyebrow, title, description, actions = "") {
  return `<div class="page-heading"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${title}</h1><p class="page-description">${description}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ""}</div>`;
}
function btn(label, action, kind = "primary", extra = "") {
  return `<button type="button" class="button button-${kind}" data-action="${action}" ${extra}>${label}</button>`;
}
function emptyState(title, message, iconName = "empty", action = "") {
  return `<div class="empty-state"><span class="empty-icon">${icon(iconName)}</span><strong>${esc(title)}</strong><p>${esc(message)}</p>${action ? `<div style="margin-top:13px">${action}</div>` : ""}</div>`;
}
function apiNotice() {
  if (state.apiStatus === "online") return `<div class="inline-notice">${icon("globe")}<div><strong>Live public Roblox data is enabled.</strong> Profile and group lookups run through the included Worker. Staff logs, saved groups, and sessions stay local to this browser.</div></div>`;
  return `<div class="inline-notice warning">${icon("warning")}<div><strong>Live Roblox lookups need the Worker endpoint.</strong> Deploy this project to Cloudflare Workers or run <code>npm run dev</code> from the project folder. The dashboard's local tools work without a Roblox login.</div></div>`;
}

function auditLabel(type) {
  const labels = {
    note: "Staff note",
    promotion: "Promotion record",
    warning: "Warning record",
    "moderation-request": "Moderation request",
    "staff-action": "Staff action",
  };
  return labels[type] || "Staff note";
}
function sortedAudit() {
  return [...state.audit].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
function upcomingSessions() {
  return state.sessions.filter((item) => item.status !== "completed" && new Date(item.startsAt).getTime() >= Date.now()).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}
function renderActivityRows() {
  const items = [];
  state.history.slice(0, 4).forEach((user) => items.push({
    at: user.lookedUpAt || user.createdAt || nowISO(),
    title: `Looked up @${user.name}`,
    body: user.displayName && user.displayName !== user.name ? `${user.displayName} · ID ${user.id}` : `Roblox user ID ${user.id}`,
    icon: "player",
  }));
  sortedAudit().slice(0, 4).forEach((entry) => items.push({
    at: entry.createdAt,
    title: `${auditLabel(entry.type)} · ${entry.target}`,
    body: entry.details,
    icon: "audit",
  }));
  state.sessions.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 2).forEach((session) => items.push({
    at: session.createdAt,
    title: `Session created · ${session.title}`,
    body: formatDateTime(session.startsAt),
    icon: "sessions",
  }));
  items.sort((a, b) => new Date(b.at) - new Date(a.at));
  return items.slice(0, 5).map((item) => `<div class="activity-row"><span class="activity-dot-icon">${icon(item.icon)}</span><div class="activity-copy"><strong>${esc(item.title)}</strong><span>${esc(item.body || "No additional details")}</span></div><span class="activity-time">${esc(relativeTime(item.at))}</span></div>`).join("");
}

function renderOverview() {
  const actions = `<button type="button" class="button button-secondary" data-nav="groups">${icon("group")} Explore a group</button><button type="button" class="button button-primary" data-nav="players">${icon("player")} Look up a player</button>`;
  const stats = [
    { label: "Player lookups", value: state.history.length, foot: "Recent profiles on this device", icon: "player", tone: "" },
    { label: "Saved groups", value: state.savedGroups.length, foot: "Bookmarked group pages", icon: "group", tone: "cyan" },
    { label: "Staff records", value: state.audit.length, foot: "Private local audit entries", icon: "audit", tone: "green" },
    { label: "Upcoming sessions", value: upcomingSessions().length, foot: "Planned on this device", icon: "sessions", tone: "gold" },
  ];
  const recent = renderActivityRows() || emptyState("Nothing here yet", "Your player lookups, staff notes, and sessions will appear here.", "history");
  return `${pageHeading("Community command center", "Welcome to <span style=\"color:#aaa0ff\">ArcLink.</span>", "Your Roblox community toolkit. Look up public profiles, explore groups, and keep your internal records organized from one place.", actions)}
    <section class="hero-panel">
      <div class="hero-copy">
        <div class="hero-kicker"><span class="spark">✦</span> Roblox community tools</div>
        <h2 class="hero-title">Your community.<br><em>Clearer than ever.</em></h2>
        <p class="hero-description">A focused command center for player research, group discovery, staff notes, and session planning—without a Discord dependency.</p>
        <div class="hero-actions"><button type="button" class="button button-primary" data-nav="players">Find a player ${icon("arrow")}</button><button type="button" class="button button-secondary" data-nav="docs">Explore the API</button></div>
      </div>
      <div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="orbit orbit-two"></div><div class="hero-emblem"><div class="hero-emblem-inner">A</div></div><div class="hero-float float-top">${icon("globe")} Public Roblox data</div><div class="hero-float float-bottom">${icon("shield")} Community tools</div></div>
    </section>
    <section class="stat-grid" aria-label="Workspace summary">${stats.map((item) => `<div class="stat-card"><div><span class="stat-label">${esc(item.label)}</span><strong class="stat-value">${esc(item.value)}</strong><span class="stat-foot">${esc(item.foot)}</span></div><span class="stat-icon ${item.tone}">${icon(item.icon)}</span></div>`).join("")}</section>
    ${state.apiStatus === "offline" ? `<div class="inline-notice warning">${icon("warning")}<div><strong>Worker not detected.</strong> The interface is ready, but live Roblox lookup requires deployment. See <button type="button" class="panel-link" data-nav="docs">API & docs</button> for the included setup steps.</div></div>` : ""}
    <div class="content-grid">
      <section class="panel"><div class="panel-header"><div><h2>Quick actions</h2><p>Jump into a community workflow.</p></div><span class="pill">4 tools</span></div><div class="panel-body"><div class="quick-grid">
        <button type="button" class="quick-card" data-nav="players"><span class="quick-icon">${icon("player")}</span><strong>Player lookup</strong><span>Inspect a public Roblox profile.</span></button>
        <button type="button" class="quick-card" data-nav="groups"><span class="quick-icon cyan">${icon("group")}</span><strong>Group explorer</strong><span>Review public group details and ranks.</span></button>
        <button type="button" class="quick-card" data-nav="audit"><span class="quick-icon green">${icon("audit")}</span><strong>Staff log</strong><span>Keep an internal, searchable record.</span></button>
      </div></div></section>
      <section class="panel"><div class="panel-header"><div><h2>Recent activity</h2><p>Your latest local workspace activity.</p></div><button type="button" class="panel-link" data-nav="audit">Open log ${icon("chevron")}</button></div><div class="panel-body"><div class="activity-list">${recent || emptyState("Nothing here yet", "Your latest activity will show up here.", "history")}</div></div></section>
    </div>
    <div style="margin-top:15px" class="inline-notice">${icon("info")}<div><strong>Data boundary:</strong> public Roblox data is fetched live. ArcLink does not sign into Roblox or apply bans, rank changes, or other account actions. Internal notes and session plans are saved in your browser only.</div></div>`;
}

function renderUserResult() {
  if (!state.userLookup) return emptyState("Search for a Roblox player", "Enter a username or numeric user ID to load public profile information.", "player");
  if (state.userLookup.status === "loading") return `<div class="loading-box"><span class="spinner"></span><span>Looking up the Roblox profile…</span></div>`;
  if (state.userLookup.status === "error") return `<div class="error-box"><strong>Profile lookup failed</strong>${esc(state.userLookup.message)}<div style="margin-top:9px;color:#c38d9d;font-size:10px">Tip: try the exact username, or check whether the Worker is deployed.</div></div>`;
  const data = state.userLookup.data;
  if (!data?.user) return "";
  const user = data.user;
  const initial = safeInitials(user.displayName || user.name);
  const avatar = data.avatarUrl ? `<img src="${escAttr(data.avatarUrl)}" alt="${escAttr(user.displayName || user.name)} Roblox avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : initial;
  const createdYear = user.created ? new Date(user.created).getFullYear() : null;
  const createdLabel = user.created ? formatDate(user.created, { year: true }) : "Unknown";
  return `<article class="player-card">
    <div class="player-banner"></div>
    <div class="player-main"><div class="player-avatar">${avatar}</div><div class="player-identity"><h2>${esc(user.displayName || user.name)}${user.hasVerifiedBadge ? '<span class="verified-badge" title="Roblox verified badge">✓</span>' : ""}</h2><div class="player-username">@${esc(user.name)}${user.isBanned ? ' · <span style="color:#f08c9f">Banned account</span>' : ""}</div></div><div class="player-actions"><a class="button button-secondary button-small" href="${escAttr(data.profileUrl)}" target="_blank" rel="noopener noreferrer">Open Roblox ${icon("external")}</a><button type="button" class="button button-ghost button-small" data-action="copy-value" data-value="${escAttr(user.id)}">${icon("copy")} Copy ID</button></div></div>
    <div class="player-stats"><div class="player-stat"><span>Roblox user ID</span><strong>${esc(user.id)}</strong></div><div class="player-stat"><span>Friends</span><strong>${data.friendsCount === null ? "—" : esc(formatNumber(data.friendsCount))}</strong></div><div class="player-stat"><span>Joined Roblox</span><strong>${esc(createdYear || "—")}</strong></div></div>
    <div class="player-description"><h3>${icon("docs")} About ${esc(user.displayName || user.name)}</h3><p>${user.description ? esc(user.description) : "This player has no public profile description."}</p><div style="margin-top:13px;color:#747b97;font-size:9px">Account created ${esc(createdLabel)} · Data from public Roblox endpoints</div></div>
  </article>`;
}
function renderHistory() {
  if (!state.history.length) return emptyState("No recent lookups", "Players you inspect will be listed here for quick access.", "history");
  return `<div class="history-list">${state.history.map((user) => `<button type="button" class="history-item" data-action="lookup-user" data-value="${escAttr(user.name)}"><span class="history-avatar">${user.avatarUrl ? `<img src="${escAttr(user.avatarUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : safeInitials(user.displayName || user.name)}</span><span class="history-info"><strong>${esc(user.displayName || user.name)}</strong><span>@${esc(user.name)} · ID ${esc(user.id)}</span></span>${icon("chevron")}</button>`).join("")}</div>`;
}
function renderPlayers() {
  const actions = btn(`${icon("history")} Recent lookups`, "show-player-history", "secondary");
  return `${pageHeading("Roblox intelligence", "Player lookup", "View publicly available Roblox profile details, avatar, account creation date, and friend count.", actions)}
    ${apiNotice()}
    <div class="content-grid">
      <section class="panel"><div class="panel-header"><div><h2>Search profile</h2><p>Use a Roblox username or numeric user ID.</p></div><span class="pill">Public data</span></div><div class="panel-body">
        <form data-form="player-lookup"><div class="form-field"><label for="player-query">Username or user ID</label><div class="input-row"><input id="player-query" class="form-control" name="query" value="${escAttr(state.playerQuery)}" placeholder="e.g. Builderman" autocomplete="off" required maxlength="32"><button type="submit" class="button button-primary" ${state.userLookup?.status === "loading" ? "disabled" : ""}>${icon("search")} Look up</button></div><span class="field-note">Usernames are case-insensitive. No Roblox password or cookie is requested.</span></div></form>
        <div class="result-wrap">${renderUserResult()}</div>
      </div></section>
      <section class="panel"><div class="panel-header"><div><h2>Recent profiles</h2><p>Saved only in this browser.</p></div><span class="pill">${state.history.length} recent</span></div><div class="panel-body">${renderHistory()}</div></section>
    </div>
    <div class="inline-notice" style="margin-top:16px">${icon("shield")}<div><strong>Privacy note:</strong> this tool reads public profile data only. It does not require a Roblox login, read private messages, or change the account being looked up.</div></div>`;
}

function renderGroupResult() {
  if (!state.groupLookup) return emptyState("Explore a Roblox group", "Enter a public Roblox community ID to review its summary and rank structure.", "group");
  if (state.groupLookup.status === "loading") return `<div class="loading-box"><span class="spinner"></span><span>Loading public group details and roles…</span></div>`;
  if (state.groupLookup.status === "error") return `<div class="error-box"><strong>Group lookup failed</strong>${esc(state.groupLookup.message)}<div style="margin-top:9px;color:#c38d9d;font-size:10px">Check the group ID and try again.</div></div>`;
  const data = state.groupLookup.data;
  const group = data?.group;
  if (!group) return "";
  const iconMarkup = data.iconUrl ? `<img src="${escAttr(data.iconUrl)}" alt="${escAttr(group.name)} icon" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : safeInitials(group.name);
  const saved = state.savedGroups.some((item) => String(item.id) === String(group.id));
  const ownerMarkup = group.owner ? `<a href="https://www.roblox.com/users/${encodeURIComponent(group.owner.id || "")}/profile" target="_blank" rel="noopener noreferrer" class="panel-link">${esc(group.owner.displayName || group.owner.name)} ${icon("external")}</a>` : `<span style="color:#9298b4;font-size:10px">Not public</span>`;
  const roles = data.roles || [];
  return `<div class="group-overview">
    <article class="group-card"><div class="group-card-top"><div class="group-icon">${iconMarkup}</div><div style="min-width:0;flex:1"><div class="group-name">${esc(group.name)}${group.hasVerifiedBadge ? '<span class="verified-badge" title="Verified Roblox community">✓</span>' : ""}</div><div class="group-id">Roblox group ID ${esc(group.id)}</div><p class="group-desc">${group.description ? esc(group.description) : "This community has no public description."}</p></div></div>
      <div class="group-stat-strip"><div class="group-stat"><span>Members</span><strong>${group.memberCount === null ? "—" : esc(formatNumber(group.memberCount))}</strong></div><div class="group-stat"><span>Public roles</span><strong>${esc(roles.length)}${roles.length >= 16 ? "+" : ""}</strong></div><div class="group-stat"><span>Entry</span><strong>${group.publicEntryAllowed ? "Open" : "Restricted"}</strong></div></div>
      <div class="group-card-footer"><span class="pill ${group.isLocked ? "warn" : "good"}"><span>●</span>${group.isLocked ? "Locked" : "Public group"}</span><div class="table-actions"><button type="button" class="button button-secondary button-small" data-action="${saved ? "remove-saved-group" : "save-group"}" data-value="${escAttr(group.id)}">${icon(saved ? "check" : "plus")} ${saved ? "Saved" : "Save group"}</button><a class="button button-primary button-small" href="${escAttr(data.groupUrl)}" target="_blank" rel="noopener noreferrer">Open Roblox ${icon("external")}</a></div></div>
    </article>
    <section class="panel"><div class="panel-header"><div><h2>Role structure</h2><p>Public roles returned by Roblox.</p></div><span class="pill">${roles.length} shown</span></div><div class="panel-body">${roles.length ? `<div class="role-list">${roles.map((role) => `<div class="role-row"><span class="role-rank">${esc(role.rank)}</span><span class="role-main"><strong>${esc(role.name)}</strong><span>Role ID ${esc(role.id)}</span></span><span class="role-members">${role.memberCount === null ? "" : `${esc(formatNumber(role.memberCount))} members`}</span></div>`).join("")}</div>` : emptyState("No roles returned", "Roblox did not return a public role list for this group.", "group")}</div></section>
  </div><div class="inline-notice" style="margin-top:15px">${icon("info")}<div><strong>Group owner:</strong> ${ownerMarkup}<br>ArcLink can inspect public group metadata. It cannot promote, demote, ban, or message group members from this public-data tool.</div></div>`;
}
function renderSavedGroups() {
  if (!state.savedGroups.length) return emptyState("No saved groups", "Run a group lookup and use Save group to keep a shortcut here.", "group");
  return `<div>${state.savedGroups.map((group) => `<div class="saved-group-row"><span class="group-icon" style="width:40px;height:40px;border-radius:11px;font-size:14px">${group.iconUrl ? `<img src="${escAttr(group.iconUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : safeInitials(group.name)}</span><span class="saved-group-copy"><strong>${esc(group.name)}</strong><span>${esc(formatNumber(group.memberCount))} members · ID ${esc(group.id)}</span></span><button type="button" class="icon-button" title="Open group" data-action="lookup-group" data-value="${escAttr(group.id)}">${icon("arrow")}</button><button type="button" class="icon-button" title="Remove saved group" data-action="remove-saved-group" data-value="${escAttr(group.id)}">${icon("trash")}</button></div>`).join("")}</div>`;
}
function renderGroups() {
  const actions = btn(`${icon("external")} Roblox Communities`, "open-roblox-groups", "secondary");
  return `${pageHeading("Community discovery", "Group explorer", "Inspect public Roblox communities, compare member counts, and browse the roles Roblox exposes publicly.", actions)}
    ${apiNotice()}
    <section class="panel" style="margin-bottom:16px"><div class="panel-header"><div><h2>Find a community</h2><p>Group IDs can be found in the community URL.</p></div><span class="pill">Roblox public API</span></div><div class="panel-body"><form data-form="group-lookup"><div class="form-field"><label for="group-query">Roblox group ID</label><div class="input-row"><input id="group-query" class="form-control" name="groupId" value="${escAttr(state.groupQuery)}" placeholder="e.g. 1200769" inputmode="numeric" autocomplete="off" required maxlength="20"><button type="submit" class="button button-primary" ${state.groupLookup?.status === "loading" ? "disabled" : ""}>${icon("search")} Explore group</button></div><span class="field-note">Example URL: roblox.com/communities/1200769/… → use 1200769.</span></div></form><div class="result-wrap">${renderGroupResult()}</div></div></section>
    <section class="panel"><div class="panel-header"><div><h2>Saved groups</h2><p>Handy shortcuts stored in this browser.</p></div><span class="pill">${state.savedGroups.length} saved</span></div><div class="panel-body">${renderSavedGroups()}</div></section>`;
}

function renderAuditRows() {
  const rows = sortedAudit();
  if (!rows.length) return `<tr><td colspan="5" class="empty-table">${emptyState("No staff records yet", "Create an internal note, promotion record, or moderation request to start the log.", "audit")}</td></tr>`;
  return rows.map((item) => `<tr><td><span class="table-primary">${esc(auditLabel(item.type))}</span><span class="table-secondary">${esc(formatDateTime(item.createdAt))}</span></td><td><span class="table-primary">${esc(item.target)}</span>${item.robloxId ? `<span class="table-secondary">Roblox ID ${esc(item.robloxId)}</span>` : ""}</td><td>${esc(item.details)}</td><td><span class="pill">Local record</span></td><td><div class="table-actions"><button type="button" class="icon-button" title="Delete record" data-action="delete-audit" data-value="${escAttr(item.id)}">${icon("trash")}</button></div></td></tr>`).join("");
}
function renderAudit() {
  const actions = btn(`${icon("plus")} New record`, "focus-audit-form", "primary");
  return `${pageHeading("Internal operations", "Audit log", "Keep a tidy record of staff notes, promotion decisions, warnings, and moderation requests for your Roblox community.", actions)}
    <div class="inline-notice warning">${icon("warning")}<div><strong>Internal tracking only.</strong> These entries are saved in this browser and do not apply moderation actions or change anyone's Roblox account. This is a local log, not a shared or tamper-proof database.</div></div>
    <div class="content-grid">
      <section class="panel form-panel" id="audit-form-panel"><div class="panel-header"><div><h2>Create a staff record</h2><p>Document what happened and why.</p></div><span class="pill">Private to this device</span></div><div class="panel-body"><form data-form="audit-create"><div class="form-grid">
        <div class="form-field"><label for="audit-type">Record type</label><select id="audit-type" class="form-control" name="type"><option value="note">Staff note</option><option value="promotion">Promotion record</option><option value="warning">Warning record</option><option value="moderation-request">Moderation request</option><option value="staff-action">Staff action</option></select></div>
        <div class="form-field"><label for="audit-target">Player or staff member</label><input id="audit-target" class="form-control" name="target" placeholder="Roblox username or staff name" required maxlength="80"></div>
        <div class="form-field full"><label for="audit-id">Roblox user ID <span style="color:#747b97;font-weight:400">(optional)</span></label><input id="audit-id" class="form-control" name="robloxId" placeholder="Numeric ID, if known" inputmode="numeric" maxlength="20"></div>
        <div class="form-field full"><label for="audit-details">Details</label><textarea id="audit-details" class="form-control" name="details" placeholder="Record the context, decision, evidence, or next step…" required maxlength="1200"></textarea><span class="field-note">Do not store passwords, cookies, or sensitive personal information.</span></div>
      </div><div class="form-actions"><button type="submit" class="button button-primary">${icon("plus")} Save record</button></div></form></div></section>
      <section class="panel"><div class="panel-header"><div><h2>Log overview</h2><p>Records saved in local browser storage.</p></div><span class="stat-icon green">${icon("audit")}</span></div><div class="panel-body"><div class="stat-value" style="font-size:32px;margin-bottom:8px">${state.audit.length}</div><div style="color:#8288a4;font-size:10px;line-height:1.7">${state.audit.length ? `${state.audit.filter((item) => item.type === "moderation-request" || item.type === "warning").length} warnings or moderation-related records.` : "Your staff log is empty. Add a first record using the form."}</div><div class="nav-divider" style="margin:18px 0"></div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><span style="font-size:10px;color:#a8aecb">Keep a backup</span><button type="button" class="button button-secondary button-small" data-action="export-data">${icon("docs")} Export data</button></div></div></section>
    </div>
    <section class="panel" style="margin-top:16px"><div class="panel-header"><div><h2>Recent records</h2><p>Newest entries appear first.</p></div><div class="table-actions"><span class="pill">${state.audit.length} total</span><button type="button" class="button button-ghost button-small" data-action="clear-audit">Clear log</button></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Record</th><th>Target</th><th>Details</th><th>Storage</th><th></th></tr></thead><tbody>${renderAuditRows()}</tbody></table></div></section>`;
}

function renderSessionCard(session) {
  const date = new Date(session.startsAt);
  const validDate = !Number.isNaN(date.getTime());
  const dateParts = validDate ? { day: date.toLocaleDateString(undefined, { day: "2-digit" }), month: date.toLocaleDateString(undefined, { month: "short" }) } : { day: "—", month: "TBD" };
  const completed = session.status === "completed";
  return `<article class="session-card"><div class="session-card-top"><div class="session-datebox"><span>${esc(dateParts.month)}</span><strong>${esc(dateParts.day)}</strong></div><div class="session-title"><h3>${esc(session.title)}</h3><p>${esc(formatDateTime(session.startsAt))}</p><p style="margin-top:4px">${session.groupId ? `Roblox group ${esc(session.groupId)}` : "No group attached"} · ${esc(session.type || "Community session")}</p></div><span class="pill ${completed ? "good" : ""}">${completed ? "Completed" : "Planned"}</span></div><p class="session-description">${session.details ? esc(session.details) : "No session notes added."}</p><div class="session-footer"><small>Created ${esc(relativeTime(session.createdAt))}</small><div class="table-actions"><button type="button" class="button button-secondary button-small" data-action="${completed ? "reopen-session" : "complete-session"}" data-value="${escAttr(session.id)}">${icon(completed ? "history" : "check")} ${completed ? "Reopen" : "Complete"}</button><button type="button" class="icon-button" title="Delete session" data-action="delete-session" data-value="${escAttr(session.id)}">${icon("trash")}</button></div></div></article>`;
}
function renderSessions() {
  const actions = btn(`${icon("plus")} Plan a session`, "focus-session-form", "primary");
  const sessions = [...state.sessions].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  return `${pageHeading("Community planning", "Sessions", "Plan trainings, shifts, meetings, and community events with local notes and statuses.", actions)}
    <div class="inline-notice">${icon("info")}<div><strong>Planner, not live Roblox scheduling.</strong> Session details are stored in this browser. Connecting game-server attendance, group shoutouts, or staff check-ins would require a separate authenticated integration.</div></div>
    <div class="content-grid">
      <section class="panel form-panel" id="session-form-panel"><div class="panel-header"><div><h2>Plan a session</h2><p>Add an event to this workspace.</p></div><span class="pill">Local planner</span></div><div class="panel-body"><form data-form="session-create"><div class="form-grid">
        <div class="form-field full"><label for="session-title">Session name</label><input id="session-title" class="form-control" name="title" placeholder="e.g. Weekly staff training" required maxlength="100"></div>
        <div class="form-field"><label for="session-date">Date</label><input id="session-date" class="form-control" name="date" type="date" value="${localDateOffset(1)}" required min="${localDateOffset(0)}"></div>
        <div class="form-field"><label for="session-time">Start time</label><input id="session-time" class="form-control" name="time" type="time" value="18:00" required></div>
        <div class="form-field"><label for="session-type">Session type</label><select id="session-type" class="form-control" name="type"><option value="Training">Training</option><option value="Shift">Shift</option><option value="Community event">Community event</option><option value="Staff meeting">Staff meeting</option><option value="Tryout">Tryout</option><option value="Other">Other</option></select></div>
        <div class="form-field"><label for="session-group">Roblox group ID <span style="color:#747b97;font-weight:400">(optional)</span></label><input id="session-group" class="form-control" name="groupId" placeholder="Numeric group ID" inputmode="numeric" maxlength="20"></div>
        <div class="form-field full"><label for="session-details">Session notes <span style="color:#747b97;font-weight:400">(optional)</span></label><textarea id="session-details" class="form-control" name="details" placeholder="Agenda, expectations, or staff instructions…" maxlength="1000" style="min-height:76px"></textarea></div>
      </div><div class="form-actions"><button type="submit" class="button button-primary">${icon("plus")} Create session</button></div></form></div></section>
      <section class="panel"><div class="panel-header"><div><h2>Session summary</h2><p>Current planner status.</p></div><span class="stat-icon cyan">${icon("sessions")}</span></div><div class="panel-body"><div class="stat-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:0"><div><span class="stat-label">Planned</span><strong class="stat-value">${upcomingSessions().length}</strong></div><div><span class="stat-label">Completed</span><strong class="stat-value">${state.sessions.filter((item) => item.status === "completed").length}</strong></div></div><div class="nav-divider" style="margin:18px 0"></div><p style="color:#8288a4;font-size:10px;line-height:1.75;margin-bottom:0">Everything here stays on your device. Export a workspace backup from Settings to carry your session plans to another browser.</p></div></section>
    </div>
    <section class="panel" style="margin-top:16px"><div class="panel-header"><div><h2>All sessions</h2><p>Planned and completed sessions for this workspace.</p></div><span class="pill">${sessions.length} total</span></div><div class="panel-body">${sessions.length ? `<div class="session-grid">${sessions.map(renderSessionCard).join("")}</div>` : emptyState("No sessions planned", "Create a training, staff meeting, shift, or event using the form above.", "sessions")}</div></section>`;
}

function renderDocs() {
  return `${pageHeading("Developer resources", "API & docs", "Run ArcLink locally, deploy it to Cloudflare, and understand which Roblox features are active in this starter project.")}
    <div class="inline-notice">${icon("check")}<div><strong>Included and wired up:</strong> public Roblox user lookup, profile avatar, friend count when publicly available, group detail lookup, public role list, group icons, and a health-check endpoint.</div></div>
    <div class="docs-grid">
      <article class="doc-card"><span class="doc-icon">${icon("globe")}</span><h3>1. Run the project</h3><p>Install Node.js, open the project folder in a terminal, install dependencies, and start the local Cloudflare Worker preview.</p><div class="code-block"><code>npm install
npm run dev</code></div><p style="margin-top:10px">Wrangler will print a local URL, usually <code>http://localhost:8787</code>. Open that address rather than opening <code>index.html</code> directly.</p></article>
      <article class="doc-card"><span class="doc-icon">${icon("code")}</span><h3>2. Deploy to Cloudflare</h3><p>The included Worker serves the website assets and proxies public Roblox API calls on the same origin. You do not need an API key for the current public lookup features.</p><div class="code-block"><code>npm install
npx wrangler login
npm run deploy</code></div><p style="margin-top:10px">The first deployment may ask you to authenticate with Cloudflare and create the Worker.</p></article>
      <article class="doc-card"><span class="doc-icon">${icon("player")}</span><h3>3. Roblox player endpoint</h3><p>Use a Roblox username or numeric user ID. The response includes profile details, avatar URL, and a friend count when Roblox returns one.</p><div class="endpoint-row"><span class="method">GET</span><code class="endpoint-path">/api/roblox/user?username=Builderman</code><button type="button" class="icon-button" title="Copy endpoint" data-action="copy-value" data-value="/api/roblox/user?username=Builderman">${icon("copy")}</button><span class="endpoint-desc">Public profile information · Cached briefly at the edge</span></div><div class="endpoint-row"><span class="method">GET</span><code class="endpoint-path">/api/roblox/user?id=1</code><button type="button" class="icon-button" title="Copy endpoint" data-action="copy-value" data-value="/api/roblox/user?id=1">${icon("copy")}</button><span class="endpoint-desc">Look up by numeric Roblox user ID</span></div></article>
      <article class="doc-card"><span class="doc-icon">${icon("group")}</span><h3>4. Roblox group endpoint</h3><p>Returns a community's public metadata, icon, member count, owner when visible, and up to 16 of its public roles.</p><div class="endpoint-row"><span class="method">GET</span><code class="endpoint-path">/api/roblox/group?id=1200769</code><button type="button" class="icon-button" title="Copy endpoint" data-action="copy-value" data-value="/api/roblox/group?id=1200769">${icon("copy")}</button><span class="endpoint-desc">Group details and public rank structure</span></div><div class="endpoint-row"><span class="method">GET</span><code class="endpoint-path">/api/health</code><button type="button" class="icon-button" title="Copy endpoint" data-action="copy-value" data-value="/api/health">${icon("copy")}</button><span class="endpoint-desc">Deployment health check used by the dashboard</span></div></article>
    </div>
    <section class="panel" style="margin-top:15px"><div class="panel-header"><div><h2>Feature boundaries</h2><p>What this version can and cannot do today.</p></div><span class="pill">V1 starter</span></div><div class="panel-body"><div class="settings-list">
      <div class="setting-row"><div class="setting-info"><strong>Public profile and group lookups</strong><p>Fetches public Roblox data through the Worker. Availability and fields depend on Roblox's API responses and rate limits.</p></div><span class="setting-badge">${icon("check")} Enabled</span></div>
      <div class="setting-row"><div class="setting-info"><strong>Audit log and session planner</strong><p>Working browser-side tools. Data is local to this browser and does not sync between staff members.</p></div><span class="setting-badge">${icon("check")} Enabled</span></div>
      <div class="setting-row"><div class="setting-info"><strong>Rank changes, bans, private data, and in-game activity</strong><p>Not enabled. These require a secure backend, appropriate Roblox Open Cloud credentials or in-game integration, authentication, permissions, and careful testing. Never put secrets into public frontend files.</p></div><span class="pill warn">Not connected</span></div>
    </div></div></section>`;
}

function renderSettings() {
  return `${pageHeading("Workspace preferences", "Settings", "Manage the local workspace label, back up your browser-stored records, and inspect the live Worker connection.")}
    <div class="settings-layout">
      <section class="panel"><div class="panel-header"><div><h2>Workspace</h2><p>Personalize this dashboard on the current device.</p></div><span class="pill">Local setting</span></div><div class="panel-body"><form data-form="workspace-save"><div class="form-field"><label for="workspace-name">Workspace name</label><input id="workspace-name" class="form-control" name="workspaceName" value="${escAttr(state.workspaceName)}" required maxlength="50" placeholder="Your community name"><span class="field-note">This is a display label only. It does not connect or authenticate a Roblox group.</span></div><div class="form-actions"><button type="submit" class="button button-primary">${icon("check")} Save workspace</button></div></form><div class="nav-divider" style="margin:21px 0"></div><div class="setting-row"><div class="setting-info"><strong>Export workspace backup</strong><p>Download your saved groups, staff records, and session plans as a JSON file.</p></div><button type="button" class="button button-secondary button-small" data-action="export-data">${icon("docs")} Export JSON</button></div><div class="setting-row"><div class="setting-info"><strong>Clear local workspace data</strong><p>Remove saved groups, lookup history, audit entries, and sessions from this browser. This cannot be undone.</p></div><button type="button" class="button button-danger button-small" data-action="reset-data">${icon("trash")} Reset</button></div></div></section>
      <section class="panel"><div class="panel-header"><div><h2>Connection status</h2><p>Cloudflare Worker health check.</p></div><span class="status-dot ${state.apiStatus === "online" ? "online" : state.apiStatus === "offline" ? "offline" : ""}"></span></div><div class="panel-body"><div class="status-line" style="margin-bottom:7px"><span class="status-dot ${state.apiStatus === "online" ? "online" : state.apiStatus === "offline" ? "offline" : ""}"></span><span>${state.apiStatus === "online" ? "Connected" : state.apiStatus === "offline" ? "Not reachable" : "Checking…"}</span></div><p style="font-size:10px;color:#848aa6;line-height:1.75;margin-bottom:15px">${state.apiStatus === "online" ? "ArcLink can reach its Worker API. Roblox endpoints can still be rate-limited or temporarily unavailable." : "Run `npm run dev` in the project directory or deploy using `npm run deploy` to enable live lookups."}</p><button type="button" class="button button-secondary button-small" data-action="check-api">${icon("rotate")} Check again</button><div class="nav-divider" style="margin:18px 0"></div><div class="setting-info"><strong>Browser storage</strong><p>${state.history.length} player lookups · ${state.savedGroups.length} saved groups · ${state.audit.length} records · ${state.sessions.length} sessions</p></div><div style="margin-top:15px">${btn(`${icon("docs")} View API docs`, "go-docs", "ghost")}</div></div></section>
    </div>
    <div class="inline-notice" style="margin-top:16px">${icon("shield")}<div><strong>Security:</strong> no Roblox password, cookie, or private API key is stored by this page. Browser-local data belongs to the current browser profile; export a backup before clearing browser data.</div></div>`;
}

function renderPage() {
  switch (state.page) {
    case "players": return renderPlayers();
    case "groups": return renderGroups();
    case "audit": return renderAudit();
    case "sessions": return renderSessions();
    case "docs": return renderDocs();
    case "settings": return renderSettings();
    default: return renderOverview();
  }
}
function render() {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = `<div class="app-shell">${renderSidebar()}<div class="main-area">${renderTopbar()}<main class="page-container">${renderPage()}</main></div></div><div id="toast-region" class="toast-region" aria-live="polite" aria-atomic="false"></div>`;
}

async function checkApi(silent = false) {
  state.apiStatus = "checking";
  if (!silent) render();
  try {
    const response = await fetch("/api/health", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error("Health check failed");
    const body = await response.json();
    if (!body.ok) throw new Error("Health check failed");
    state.apiStatus = "online";
  } catch {
    state.apiStatus = "offline";
  }
  render();
  if (!silent) toast(state.apiStatus === "online" ? "ArcLink API is reachable." : "Could not reach the API. Run or deploy the included Worker.", state.apiStatus === "online" ? "success" : "error");
}

async function lookupUser(query) {
  const cleaned = String(query || "").trim();
  if (!cleaned) { toast("Enter a Roblox username or user ID first.", "error"); return; }
  state.page = "players";
  state.playerQuery = cleaned;
  state.userLookup = { status: "loading" };
  render();
  try {
    const params = /^\d+$/.test(cleaned) ? new URLSearchParams({ id: cleaned }) : new URLSearchParams({ username: cleaned });
    const response = await fetch(`/api/roblox/user?${params.toString()}`, { headers: { Accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Lookup failed (${response.status}).`);
    state.userLookup = { status: "success", data };
    const existing = state.history.filter((item) => String(item.id) !== String(data.user.id));
    state.history = [{
      id: data.user.id,
      name: data.user.name,
      displayName: data.user.displayName,
      avatarUrl: data.avatarUrl,
      profileUrl: data.profileUrl,
      lookedUpAt: nowISO(),
    }, ...existing].slice(0, 10);
    saveStored();
    render();
  } catch (error) {
    state.userLookup = { status: "error", message: error?.message || "Lookup failed. Try again." };
    render();
  }
}

async function lookupGroup(value) {
  const cleaned = String(value || "").trim();
  if (!/^\d{1,20}$/.test(cleaned) || Number(cleaned) <= 0) { toast("Enter a valid numeric group ID.", "error"); return; }
  state.page = "groups";
  state.groupQuery = cleaned;
  state.groupLookup = { status: "loading" };
  render();
  try {
    const response = await fetch(`/api/roblox/group?id=${encodeURIComponent(cleaned)}`, { headers: { Accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Lookup failed (${response.status}).`);
    state.groupLookup = { status: "success", data };
    render();
  } catch (error) {
    state.groupLookup = { status: "error", message: error?.message || "Group lookup failed. Try again." };
    render();
  }
}

function saveGroup() {
  const data = state.groupLookup?.data;
  if (!data?.group) return;
  const group = data.group;
  const saved = {
    id: group.id,
    name: group.name,
    memberCount: group.memberCount,
    iconUrl: data.iconUrl,
    groupUrl: data.groupUrl,
    savedAt: nowISO(),
  };
  state.savedGroups = [saved, ...state.savedGroups.filter((item) => String(item.id) !== String(group.id))].slice(0, 50);
  saveStored();
  render();
  toast(`${group.name} saved to your group list.`);
}
function removeSavedGroup(id) {
  const before = state.savedGroups.length;
  state.savedGroups = state.savedGroups.filter((item) => String(item.id) !== String(id));
  saveStored();
  render();
  if (state.savedGroups.length !== before) toast("Saved group removed.");
}
function createAudit(form) {
  const data = new FormData(form);
  const target = String(data.get("target") || "").trim();
  const details = String(data.get("details") || "").trim();
  const robloxId = String(data.get("robloxId") || "").trim();
  if (!target || !details) { toast("Add a target and details for the record.", "error"); return; }
  if (robloxId && !/^\d{1,20}$/.test(robloxId)) { toast("Roblox user ID must be numeric.", "error"); return; }
  state.audit.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: String(data.get("type") || "note"),
    target: target.slice(0, 80),
    robloxId: robloxId || "",
    details: details.slice(0, 1200),
    createdAt: nowISO(),
  });
  state.audit = state.audit.slice(0, 200);
  saveStored();
  render();
  toast("Staff record saved to this browser.");
}
function createSession(form) {
  const data = new FormData(form);
  const title = String(data.get("title") || "").trim();
  const date = String(data.get("date") || "");
  const time = String(data.get("time") || "18:00");
  const type = String(data.get("type") || "Other");
  const groupId = String(data.get("groupId") || "").trim();
  const details = String(data.get("details") || "").trim();
  if (!title || !date || !time) { toast("Add a session name, date, and start time.", "error"); return; }
  if (groupId && !/^\d{1,20}$/.test(groupId)) { toast("Group ID must be numeric.", "error"); return; }
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) { toast("The date or start time is not valid.", "error"); return; }
  state.sessions.unshift({
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.slice(0, 100),
    startsAt: parsed.toISOString(),
    type,
    groupId,
    details: details.slice(0, 1000),
    createdAt: nowISO(),
    status: "planned",
  });
  state.sessions = state.sessions.slice(0, 100);
  saveStored();
  render();
  toast("Session added to your local planner.");
}

async function copyValue(value) {
  try {
    await navigator.clipboard.writeText(String(value ?? ""));
    toast("Copied to clipboard.");
  } catch {
    toast("Clipboard access is unavailable in this browser. Copy the value manually.", "error");
  }
}
function exportData() {
  const payload = {
    exportedAt: nowISO(),
    app: "ArcLink Community Hub",
    version: 1,
    workspaceName: state.workspaceName,
    history: state.history,
    savedGroups: state.savedGroups,
    audit: state.audit,
    sessions: state.sessions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `arclink-backup-${localDateOffset(0)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Workspace backup downloaded.");
}
function resetLocalData() {
  if (!window.confirm("Reset ArcLink's local browser data? This removes saved groups, lookup history, audit records, and sessions.")) return;
  state.history = [];
  state.savedGroups = [];
  state.audit = [];
  state.sessions = [];
  state.userLookup = null;
  state.groupLookup = null;
  state.playerQuery = "";
  state.groupQuery = "";
  saveStored();
  render();
  toast("Local workspace data has been reset.");
}

function focusElement(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = el.querySelector("input, textarea, select");
    if (input) input.focus({ preventScroll: true });
  }
}

// Delegated navigation keeps the interface lightweight and dependency-free.
document.addEventListener("click", async (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    event.preventDefault();
    state.page = nav.dataset.nav;
    render();
    return;
  }

  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  const value = target.dataset.value;

  switch (action) {
    case "navigate": state.page = target.dataset.page || "overview"; render(); break;
    case "lookup-user": await lookupUser(value); break;
    case "lookup-group": await lookupGroup(value); break;
    case "save-group": saveGroup(); break;
    case "remove-saved-group": removeSavedGroup(value); break;
    case "copy-value": await copyValue(value); break;
    case "export-data": exportData(); break;
    case "reset-data": resetLocalData(); break;
    case "check-api": await checkApi(false); break;
    case "go-docs": state.page = "docs"; render(); break;
    case "open-roblox-groups": window.open("https://www.roblox.com/communities", "_blank", "noopener,noreferrer"); break;
    case "show-player-history": document.querySelector(".history-list")?.scrollIntoView({ behavior: "smooth", block: "center" }); break;
    case "focus-audit-form": focusElement("audit-form-panel"); break;
    case "focus-session-form": focusElement("session-form-panel"); break;
    case "delete-audit":
      if (window.confirm("Delete this local staff record?")) {
        state.audit = state.audit.filter((entry) => String(entry.id) !== String(value)); saveStored(); render(); toast("Record deleted.");
      }
      break;
    case "clear-audit":
      if (state.audit.length && window.confirm("Clear every local staff record? Export a backup first if you need it.")) {
        state.audit = []; saveStored(); render(); toast("Audit log cleared.");
      } else if (!state.audit.length) toast("The audit log is already empty.");
      break;
    case "complete-session":
      state.sessions = state.sessions.map((item) => String(item.id) === String(value) ? { ...item, status: "completed", completedAt: nowISO() } : item); saveStored(); render(); toast("Session marked completed.");
      break;
    case "reopen-session":
      state.sessions = state.sessions.map((item) => String(item.id) === String(value) ? { ...item, status: "planned", completedAt: null } : item); saveStored(); render(); toast("Session reopened.");
      break;
    case "delete-session":
      if (window.confirm("Delete this local session?")) { state.sessions = state.sessions.filter((item) => String(item.id) !== String(value)); saveStored(); render(); toast("Session deleted."); }
      break;
    default: break;
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  const type = form.dataset.form;
  if (!type) return;
  event.preventDefault();
  switch (type) {
    case "global-player": {
      const data = new FormData(form);
      await lookupUser(String(data.get("query") || ""));
      break;
    }
    case "player-lookup": {
      const data = new FormData(form);
      await lookupUser(String(data.get("query") || ""));
      break;
    }
    case "group-lookup": {
      const data = new FormData(form);
      await lookupGroup(String(data.get("groupId") || ""));
      break;
    }
    case "audit-create": createAudit(form); break;
    case "session-create": createSession(form); break;
    case "workspace-save": {
      const data = new FormData(form);
      const label = String(data.get("workspaceName") || "").trim();
      if (!label) { toast("Workspace name cannot be empty.", "error"); return; }
      state.workspaceName = label.slice(0, 50); saveStored(); render(); toast("Workspace name saved.");
      break;
    }
    default: break;
  }
});

// Start immediately; the health check updates the sidebar after the initial frame.
render();
checkApi(true);
