import { isIP } from "node:net";
import { URL } from "node:url";

/**
 * Anvaya only fetches from a short list of official Indian government hosts over HTTPS.
 * Every redirect hop is checked *before* it is requested, so a trusted host cannot bounce
 * the fetcher to an internal address. Retrieved content is untrusted evidence, never instructions.
 */
const allowedHosts = new Set([
  "sansad.in",
  "www.sansad.in",
  "meity.gov.in",
  "www.meity.gov.in",
  "indiacode.nic.in",
  "www.indiacode.nic.in",
  "indiacode.gov.in",
  "www.indiacode.gov.in",
  "egazette.gov.in",
  "www.egazette.gov.in",
  "pib.gov.in",
  "www.pib.gov.in",
]);

/**
 * Official legislation sites of comparator countries. Used only by the benchmark builder (scripts/build-benchmarks.ts),
 * never by user-facing intake, so a visitor cannot make Anvaya fetch from them.
 */
export const COMPARATOR_HOSTS = ["www.legislation.gov.uk", "laws-lois.justice.gc.ca", "www.irishstatutebook.ie"] as const;

export function assertAllowedUrl(input: string, extraHosts: readonly string[] = []) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Source URL is not a valid address.");
  }
  if (url.protocol !== "https:") throw new Error("Source URL must use HTTPS.");
  if (url.username || url.password) throw new Error("Source URL must not contain credentials.");
  if (url.port && url.port !== "443") throw new Error("Source URL must use the standard HTTPS port.");
  const host = url.hostname.toLowerCase();
  if (isIP(host) || host.startsWith("[")) throw new Error("Source URL must use a host name, not an IP address.");
  if (!allowedHosts.has(host) && !extraHosts.includes(host)) throw new Error("Source URL is outside Anvaya's approved government host registry.");
  return url;
}

const MAX_REDIRECTS = 5;

export async function fetchBounded(input: string, timeoutMs = 15000, maxBytes = 12_000_000, extraHosts: readonly string[] = []) {
  let url = assertAllowedUrl(input, extraHosts);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "manual",
        headers: { "user-agent": "Anvaya research client/1.0 (+source-backed policy research)" },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Source redirected without a destination.");
        url = assertAllowedUrl(new URL(location, url).toString(), extraHosts);
        continue;
      }
      if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
      const length = Number(response.headers.get("content-length") ?? 0);
      if (length > maxBytes) throw new Error("Source document exceeds the download limit.");
      const buffer = new Uint8Array(await response.arrayBuffer());
      if (buffer.byteLength > maxBytes) throw new Error("Source document exceeds the download limit.");
      return { response, buffer, finalUrl: url.toString() };
    }
    throw new Error("Source redirected too many times.");
  } finally {
    clearTimeout(timeout);
  }
}

export function htmlToText(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
