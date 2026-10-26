import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
function readEnv(path: string) { if (!existsSync(path)) return {}; return Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => { const [key, ...rest] = line.split("="); return [key.trim(), rest.join("=").trim().replace(/^['"]|['"]$/g, "")]; })); }
export function getAIConfig() {
  const root = process.cwd(); const repo = readEnv(join(root, ".env")); const parent = readEnv(join(dirname(root), ".env"));
  const values = { ...parent, ...process.env, ...repo };
  if (values.PORTKEY_API_KEY) return { apiKey: values.PORTKEY_API_KEY, model: values.ANVAYA_MODEL || "gpt-6-luna", baseURL: "https://api.portkey.ai/v1", headers: { "x-portkey-api-key": values.PORTKEY_API_KEY, ...(values.ANVAYA_BYPASS_GATEWAY_CACHE ? { "x-portkey-cache-force-refresh": "true" } : {}) }, provider: "portkey" as const };
  if (values.OPENAI_API_KEY) return { apiKey: values.OPENAI_API_KEY, model: values.OPENAI_MODEL || "gpt-4o-mini", baseURL: undefined, headers: undefined, provider: "openai" as const };
  return null;
}
export function getPortkeyKey() { return getAIConfig()?.provider === "portkey" ? getAIConfig()?.apiKey ?? "" : ""; }
