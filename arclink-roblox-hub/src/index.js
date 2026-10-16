const API_ORIGIN = "https://users.roblox.com";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "Content-Type",
  "x-content-type-options": "nosniff",
};

class ApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function respondJson(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function parsePositiveId(value) {
  if (!/^\d{1,20}$/.test(String(value ?? ""))) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function robloxJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "User-Agent": "ArcLinkCommunityHub/1.0 (public Roblox profile and group lookup)",
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(9000),
    });
  } catch (error) {
    throw new ApiError("Roblox could not be reached. Please try again in a moment.", 502);
  }

  if (response.status === 404) {
    throw new ApiError("That Roblox profile or group could not be found.", 404);
  }
  if (response.status === 429) {
    throw new ApiError("Roblox is rate-limiting requests. Wait a little and try again.", 429);
  }
  if (!response.ok) {
    throw new ApiError(`Roblox returned an upstream error (${response.status}). Please retry shortly.`, 502);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError("Roblox returned an unexpected response. Please retry shortly.", 502);
  }
}

async function getUser(url) {
  const idParam = url.searchParams.get("id");
  const usernameParam = (url.searchParams.get("username") || "").trim();
  let id = parsePositiveId(idParam);
  let matchedUser = null;

  if (!id) {
    if (!usernameParam) {
      return respondJson({ error: "Enter a Roblox username or user ID." }, 400);
    }
    if (usernameParam.length > 20 || !/^[A-Za-z0-9_]+$/.test(usernameParam)) {
      return respondJson({ error: "Use a valid Roblox username (letters, numbers, and underscores)." }, 400);
    }
    const lookup = await robloxJson(`${API_ORIGIN}/v1/usernames/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ usernames: [usernameParam], excludeBannedUsers: false }),
    });
    matchedUser = Array.isArray(lookup.data) ? lookup.data[0] : null;
    if (!matchedUser) {
      return respondJson({ error: `No Roblox user was found for “${usernameParam}”. Check the spelling and try again.` }, 404);
    }
    id = parsePositiveId(matchedUser.id);
  }

  if (!id) return respondJson({ error: "That Roblox user ID is not valid." }, 400);

  const details = await robloxJson(`${API_ORIGIN}/v1/users/${id}`);
  const [thumbnailResult, friendsResult] = await Promise.allSettled([
    robloxJson(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=420x420&format=Png&isCircular=false`),
    robloxJson(`https://friends.roblox.com/v1/users/${id}/friends/count`),
  ]);

  const thumbnailData = thumbnailResult.status === "fulfilled" ? thumbnailResult.value?.data?.[0] : null;
  const friendsCount = friendsResult.status === "fulfilled" ? friendsResult.value?.count : null;

  return respondJson({
    user: {
      id: details.id,
      name: details.name || matchedUser?.name || String(id),
      displayName: details.displayName || matchedUser?.displayName || details.name || String(id),
      description: details.description || "",
      created: details.created || null,
      isBanned: Boolean(details.isBanned),
      hasVerifiedBadge: Boolean(details.hasVerifiedBadge),
    },
    avatarUrl: thumbnailData?.imageUrl || null,
    friendsCount: Number.isFinite(friendsCount) ? friendsCount : null,
    profileUrl: `https://www.roblox.com/users/${id}/profile`,
  }, 200, { "cache-control": "public, max-age=0, s-maxage=120" });
}

async function getGroup(url) {
  const rawId = url.searchParams.get("id") || url.searchParams.get("groupId");
  const id = parsePositiveId(rawId);
  if (!id) return respondJson({ error: "Enter a valid numeric Roblox group ID." }, 400);

  const [groupResult, rolesResult, iconResult] = await Promise.allSettled([
    robloxJson(`https://groups.roblox.com/v1/groups/${id}`),
    robloxJson(`https://groups.roblox.com/v1/groups/${id}/roles`),
    robloxJson(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${id}&size=150x150&format=Png&isCircular=false`),
  ]);

  if (groupResult.status === "rejected") throw groupResult.reason;
  const group = groupResult.value;
  const rolesPayload = rolesResult.status === "fulfilled" ? rolesResult.value : { roles: [] };
  const iconPayload = iconResult.status === "fulfilled" ? iconResult.value : { data: [] };
  const roles = Array.isArray(rolesPayload?.roles) ? rolesPayload.roles : [];
  const owner = group.owner || null;

  return respondJson({
    group: {
      id: group.id,
      name: group.name || `Group ${id}`,
      description: group.description || "",
      memberCount: Number.isFinite(group.memberCount) ? group.memberCount : null,
      isLocked: Boolean(group.isLocked),
      publicEntryAllowed: Boolean(group.publicEntryAllowed),
      hasVerifiedBadge: Boolean(group.hasVerifiedBadge),
      owner: owner ? {
        id: owner.userId ?? owner.id ?? null,
        name: owner.username || owner.name || "Unknown owner",
        displayName: owner.displayName || owner.username || owner.name || "Unknown owner",
      } : null,
    },
    iconUrl: iconPayload?.data?.[0]?.imageUrl || null,
    roles: roles
      .slice()
      .sort((a, b) => Number(b.rank || 0) - Number(a.rank || 0))
      .slice(0, 16)
      .map((role) => ({
        id: role.id,
        name: role.name || "Unnamed role",
        rank: Number(role.rank || 0),
        memberCount: Number.isFinite(role.memberCount) ? role.memberCount : null,
      })),
    groupUrl: `https://www.roblox.com/communities/${id}`,
  }, 200, { "cache-control": "public, max-age=0, s-maxage=120" });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return respondJson({ ok: true, service: "ArcLink API", timestamp: new Date().toISOString() }, 200, {
        "cache-control": "no-store",
      });
    }

    if (url.pathname === "/api/roblox/user" && request.method === "GET") {
      try {
        return await getUser(url);
      } catch (error) {
        const status = error instanceof ApiError ? error.status : 502;
        const message = error instanceof ApiError ? error.message : "The Roblox lookup failed unexpectedly. Please try again.";
        return respondJson({ error: message }, status, { "cache-control": "no-store" });
      }
    }

    if (url.pathname === "/api/roblox/group" && request.method === "GET") {
      try {
        return await getGroup(url);
      } catch (error) {
        const status = error instanceof ApiError ? error.status : 502;
        const message = error instanceof ApiError ? error.message : "The Roblox group lookup failed unexpectedly. Please try again.";
        return respondJson({ error: message }, status, { "cache-control": "no-store" });
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return respondJson({ error: "API route not found." }, 404, { "cache-control": "no-store" });
    }

    return env.ASSETS.fetch(request);
  },
};
