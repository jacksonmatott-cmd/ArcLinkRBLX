import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const assets = { fetch: async () => new Response("static fallback", { status: 200 }) };
const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { "content-type": "application/json" },
});

function mockRobloxFetch() {
  return async (input) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    if (url.hostname === "users.roblox.com" && url.pathname === "/v1/usernames/users") {
      return json({ data: [{ id: 12345, name: "Builderman", displayName: "Builderman" }] });
    }
    if (url.hostname === "users.roblox.com" && url.pathname === "/v1/users/12345") {
      return json({
        id: 12345,
        name: "Builderman",
        displayName: "Builderman",
        description: "A public profile used for the test.",
        created: "2007-09-01T00:00:00Z",
        isBanned: false,
        hasVerifiedBadge: true,
      });
    }
    if (url.hostname === "users.roblox.com" && url.pathname === "/v1/users/67890") {
      return json({ id: 67890, name: "SecondUser", displayName: "Second User", description: "", created: null, isBanned: false });
    }
    if (url.hostname === "thumbnails.roblox.com" && url.pathname.includes("/users/avatar")) {
      return json({ data: [{ imageUrl: "https://example.test/avatar.png" }] });
    }
    if (url.hostname === "friends.roblox.com") return json({ count: 888 });
    if (url.hostname === "groups.roblox.com" && url.pathname === "/v1/groups/555") {
      return json({
        id: 555,
        name: "Test Community",
        description: "A community for API tests.",
        memberCount: 2468,
        isLocked: false,
        publicEntryAllowed: true,
        hasVerifiedBadge: false,
        owner: { userId: 7, username: "Owner", displayName: "Owner" },
      });
    }
    if (url.hostname === "groups.roblox.com" && url.pathname.endsWith("/roles")) {
      return json({ roles: [
        { id: 2, name: "Member", rank: 1, memberCount: 2400 },
        { id: 3, name: "Owner", rank: 255, memberCount: 1 },
      ] });
    }
    if (url.hostname === "thumbnails.roblox.com" && url.pathname.includes("/groups/icons")) {
      return json({ data: [{ imageUrl: "https://example.test/group.png" }] });
    }
    return json({ errors: [{ message: `Unexpected mock URL: ${url.href}` }] }, 404);
  };
}

test("health endpoint returns a healthy response", async () => {
  const response = await worker.fetch(new Request("https://arclink.test/api/health"), { ASSETS: assets });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "ArcLink API");
});

test("public username lookup normalizes user and avatar data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockRobloxFetch();
  try {
    const response = await worker.fetch(new Request("https://arclink.test/api/roblox/user?username=Builderman"), { ASSETS: assets });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.user.id, 12345);
    assert.equal(body.user.name, "Builderman");
    assert.equal(body.friendsCount, 888);
    assert.equal(body.avatarUrl, "https://example.test/avatar.png");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("numeric user ID lookup avoids the username search route", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockRobloxFetch();
  try {
    const response = await worker.fetch(new Request("https://arclink.test/api/roblox/user?id=67890"), { ASSETS: assets });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.user.id, 67890);
    assert.equal(body.profileUrl, "https://www.roblox.com/users/67890/profile");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("group lookup returns the group, icon, and roles ordered by rank", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockRobloxFetch();
  try {
    const response = await worker.fetch(new Request("https://arclink.test/api/roblox/group?id=555"), { ASSETS: assets });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.group.id, 555);
    assert.equal(body.group.memberCount, 2468);
    assert.equal(body.iconUrl, "https://example.test/group.png");
    assert.equal(body.roles[0].name, "Owner");
    assert.equal(body.groupUrl, "https://www.roblox.com/communities/555");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("invalid group IDs are rejected before upstream requests", async () => {
  const response = await worker.fetch(new Request("https://arclink.test/api/roblox/group?id=not-a-number"), { ASSETS: assets });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.match(body.error, /numeric Roblox group ID/i);
});

test("unknown API endpoints return JSON 404 and non-API requests fall through to assets", async () => {
  const apiResponse = await worker.fetch(new Request("https://arclink.test/api/nope"), { ASSETS: assets });
  assert.equal(apiResponse.status, 404);
  assert.match((await apiResponse.json()).error, /not found/i);

  const siteResponse = await worker.fetch(new Request("https://arclink.test/"), { ASSETS: assets });
  assert.equal(siteResponse.status, 200);
  assert.equal(await siteResponse.text(), "static fallback");
});
