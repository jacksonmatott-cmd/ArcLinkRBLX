// Cloudflare Pages route adapter. The same Worker router is reused for both deployment types.
import worker from "../../src/index.js";

export async function onRequest(context) {
  return worker.fetch(context.request, context.env);
}
