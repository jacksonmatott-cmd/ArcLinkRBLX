// Cloudflare Pages route adapter for GET /api/roblox/user?username=...
import worker from "../../../src/index.js";

export async function onRequest(context) {
  return worker.fetch(context.request, context.env);
}
