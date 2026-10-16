import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const here = path.dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(path.join(here, "../public/app.js"), "utf8");

function createHarness() {
  const app = { innerHTML: "" };
  const storage = new Map();
  class MockFormData {
    constructor(form) { this.values = form?.values || {}; }
    get(key) { return this.values[key] ?? null; }
  }
  const listeners = {};
  const context = {
    console, URL, URLSearchParams, FormData: MockFormData, Blob, Intl, Date, Math, JSON, Number, String, Array, Object, RegExp,
    structuredClone, setTimeout, clearTimeout,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    window: { setTimeout, confirm: () => true, open: () => null, __test: null },
    document: {
      getElementById: (id) => id === "app" ? app : null,
      addEventListener: (type, handler) => { (listeners[type] ||= []).push(handler); },
      querySelector: () => null,
      activeElement: { tagName: "BODY" },
    },
    fetch: async () => ({ ok: true, status: 200, json: async () => ({ ok: true }), headers: { get: () => null } }),
  };
  vm.createContext(context);
  vm.runInContext(`${appSource}\nwindow.__test = { state, render, saveManagedForm, attachRobloxProfile };`, context, { timeout: 5000 });
  return { app, storage, ...context.window.__test };
}

const form = (collection, values) => ({ dataset: { collection }, values });

test("all ArcLink v2 workspace pages render", () => {
  const h = createHarness();
  const pages = ["overview", "players", "groups", "audit", "sessions", "accounts", "roblox-link", "rules", "custom-commands", "loa", "roles", "departments", "warps", "group-links", "docs", "settings"];
  for (const page of pages) {
    h.state.page = page;
    h.render();
    assert.match(h.app.innerHTML, /class="app-shell"/, `${page} should render the application shell`);
  }
  for (const label of ["Accounts", "Roblox Link", "Rules", "Custom Commands", "Leave of Absence", "Roles", "Departments", "Warps", "Group Links"]) {
    assert.ok(h.app.innerHTML.includes(label), `navigation should include ${label}`);
  }
});

test("managed directories create and persist records", () => {
  const h = createHarness();
  const samples = {
    accounts: { name: "Test Moderator", username: "testmod", role: "Moderator", department: "Moderation", status: "Active", notes: "Created by automated test" },
    rules: { title: "Be respectful", category: "Conduct", severity: "Warning", active: "Active", description: "Treat players fairly." },
    commands: { trigger: "!rules", name: "Show rules", permission: "Everyone", enabled: "Enabled", description: "Show the rules", response: "Please read the rules." },
    loa: { username: "testmod", robloxId: "1234", startDate: "2026-10-17", endDate: "2026-10-20", status: "Pending", reason: "Planned leave" },
    roles: { name: "Moderator", color: "#9182fa", rank: "20", description: "Moderates the community", permissions: "Review reports" },
    departments: { name: "Moderation", lead: "testmod", status: "Active", description: "Handles reports and member conduct." },
    warps: { name: "Main Spawn", placeId: "1234567", x: "0", y: "5", z: "8", description: "Spawn location" },
    groupLinks: { label: "Official Group", category: "Roblox group", groupId: "12345", url: "https://www.roblox.com/communities/12345", description: "Main community" },
  };
  for (const [collection, values] of Object.entries(samples)) {
    h.state.page = collection === "commands" ? "custom-commands" : collection === "groupLinks" ? "group-links" : collection;
    h.saveManagedForm(form(collection, values));
    assert.equal(h.state[collection].length, 1, `${collection} record should be created`);
  }
  const stored = JSON.parse(h.storage.get("arclink.community-hub.v1"));
  for (const key of Object.keys(samples)) assert.equal(stored[key].length, 1, `${key} should be saved in localStorage`);
});

test("command validation blocks invalid triggers and duplicate commands", () => {
  const h = createHarness();
  h.state.page = "custom-commands";
  const valid = { trigger: "!rules", name: "Rules", permission: "Everyone", enabled: "Enabled", description: "Show rules", response: "Read the rules." };
  h.saveManagedForm(form("commands", valid));
  h.saveManagedForm(form("commands", { ...valid, trigger: "bad command" }));
  assert.equal(h.state.commands.length, 1);
  h.saveManagedForm(form("commands", valid));
  assert.equal(h.state.commands.length, 1);
});

test("Roblox Link attaches a public profile as unverified, not authenticated", () => {
  const h = createHarness();
  h.state.page = "accounts";
  h.saveManagedForm(form("accounts", { name: "Profile Owner", username: "profileowner", role: "Member", department: "Community", status: "Active", notes: "" }));
  const account = h.state.accounts[0];
  h.state.pendingLinkAccountId = account.id;
  h.state.linkLookup = { status: "success", data: { user: { id: 12345, name: "RobloxUser", displayName: "Roblox Display" }, avatarUrl: "https://example.test/avatar.png", profileUrl: "https://www.roblox.com/users/12345/profile" } };
  h.attachRobloxProfile();
  assert.equal(h.state.accounts[0].robloxId, "12345");
  assert.equal(h.state.accounts[0].linkStatus, "Unverified");
  assert.equal(h.state.robloxLinks.length, 1);
  assert.equal(h.state.robloxLinks[0].status, "Unverified");
  assert.equal(h.state.robloxLinks[0].username, "RobloxUser");
});
