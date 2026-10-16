// Cloudflare Pages route adapter for GET /api/roblox/group?id=...
import worker from "../../../src/index.js";

export async function onRequest(context) {
  return worker.fetch(context.request, context.env);
}
