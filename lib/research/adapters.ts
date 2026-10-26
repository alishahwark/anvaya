import { SourceAdapter, SourceCandidate, RawDocument, ParsedDocument, SourceHealth } from "@/lib/research/types";
import { assertAllowedUrl, fetchBounded, htmlToText } from "@/lib/research/security";
async function parsePdf(bytes: Uint8Array) {
  try { const pdfParse = (await import("pdf-parse")).default; const parsed = await pdfParse(Buffer.from(bytes)); return { text: parsed.text, pages: parsed.numpages, quality: parsed.text.trim().length > 200 ? "high" as const : "low" as const }; } catch { return { text: "", pages: 0, quality: "unavailable" as const }; }
}
async function parseRaw(document: RawDocument): Promise<ParsedDocument> {
  const isPdf = document.contentType.includes("pdf") || document.candidate.url.toLowerCase().includes(".pdf");
  if (isPdf) { const parsed = await parsePdf(document.bytes); return { ...document, ...{ text: parsed.text, pageCount: parsed.pages, extractionQuality: parsed.quality } }; }
  const text = htmlToText(new TextDecoder().decode(document.bytes));
  return { ...document, text, pageCount: 1, extractionQuality: text.length > 200 ? "high" : "low" };
}
async function fetchCandidate(candidate: SourceCandidate): Promise<RawDocument> { const fetched = await fetchBounded(candidate.url); return { candidate: { ...candidate, url: fetched.finalUrl }, bytes: fetched.buffer, contentType: fetched.response.headers.get("content-type") ?? "application/octet-stream", retrievedAt: new Date().toISOString() }; }

export const sansadAdapter: SourceAdapter = {
  id: "sansad-bills",
  async healthCheck(): Promise<SourceHealth> { const checkedAt = new Date().toISOString(); try { await fetchBounded("https://sansad.in/api_rs/legislation/getBills?page=1&size=1&locale=en&sortOn=billIntroducedDate&sortBy=desc"); return { adapterId: this.id, ok: true, checkedAt, detail: "Public Sansad bill endpoint responded." }; } catch (error) { return { adapterId: this.id, ok: false, checkedAt, detail: error instanceof Error ? error.message : "Sansad health check failed." }; } },
  async discover(query: string) {
    const params = new URLSearchParams({ loksabha: "", sessionNo: "", billName: query, house: "", ministryName: "", billType: "", billCategory: "", billStatus: "", introductionDateFrom: "", introductionDateTo: "", passedInLsDateFrom: "", passedInLsDateTo: "", passedInRsDateFrom: "", passedInRsDateTo: "", page: "1", size: "10", locale: "en", sortOn: "billIntroducedDate", sortBy: "desc" });
    const fetched = await fetchBounded(`https://sansad.in/api_rs/legislation/getBills?${params.toString()}`); const json = JSON.parse(new TextDecoder().decode(fetched.buffer)) as { records?: Array<Record<string, unknown>> };
    const candidates: SourceCandidate[] = []; for (const item of json.records ?? []) { const url = typeof item.billIntroducedFile === "string" ? item.billIntroducedFile : typeof item.billPassedInBothHousesFile === "string" ? item.billPassedInBothHousesFile : null; if (url) candidates.push({ title: String(item.billName ?? "Untitled Sansad bill").trim(), url, publisher: "Parliament of India — Digital Sansad", sourceType: "Official Sansad bill document", publishedDate: typeof item.billIntroducedDate === "string" ? item.billIntroducedDate.slice(0, 10) : null, identifier: `${String(item.billNumber ?? "").trim()} / ${String(item.billYear ?? "")}`, metadata: item }); } return candidates;
  },
  fetch: fetchCandidate,
  parse: parseRaw,
};

export const meityAdapter: SourceAdapter = {
  id: "meity-public-pages",
  async healthCheck(): Promise<SourceHealth> { const checkedAt = new Date().toISOString(); try { await fetchBounded("https://www.meity.gov.in/"); return { adapterId: this.id, ok: true, checkedAt, detail: "MeitY public homepage responded." }; } catch (error) { return { adapterId: this.id, ok: false, checkedAt, detail: error instanceof Error ? error.message : "MeitY health check failed." }; } },
  async discover(query: string) { const fetched = await fetchBounded("https://www.meity.gov.in/"); const html = new TextDecoder().decode(fetched.buffer); const wanted = query.toLowerCase().split(/\s+/).filter((word) => word.length > 3); const candidates: SourceCandidate[] = []; const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let match: RegExpExecArray | null; while ((match = linkPattern.exec(html))) { const label = htmlToText(match[2]); const haystack = `${label} ${match[1]}`.toLowerCase(); if (wanted.length && wanted.filter((word) => haystack.includes(word)).length >= Math.min(2, wanted.length)) { const url = new URL(match[1], "https://www.meity.gov.in/").toString(); if (/^https:\/\/(www\.)?meity\.gov\.in\//.test(url)) candidates.push({ title: label || url, url, publisher: "Ministry of Electronics and Information Technology, Government of India", sourceType: "Official MeitY public page", metadata: { matchedQuery: query } }); } } return candidates.slice(0, 10); },
  fetch: fetchCandidate,
  parse: parseRaw,
};

const HOST_PUBLISHERS: Record<string, string> = {
  "sansad.in": "Parliament of India — Digital Sansad",
  "meity.gov.in": "Ministry of Electronics and Information Technology, Government of India",
  "indiacode.nic.in": "India Code, Legislative Department, Government of India",
  "egazette.gov.in": "The Gazette of India (eGazette)",
  "pib.gov.in": "Press Information Bureau, Government of India",
};

/** True when the text a user typed is a web address rather than a policy name. */
export function looksLikeUrl(query: string): boolean {
  return /^https?:\/\/\S+$/i.test(query.trim());
}

/**
 * Best-effort document title: the short-title clause ("These rules may be called the …"), else a
 * title-like phrase that is not merely a reference ("under the … Act, 2023"). Null when unsure.
 */
export function titleFromText(text: string): string | null {
  const opening = text.replace(/\s+/g, " ");
  const kinds = "Act|Bill|Rules|Code|Policy|Order|Regulations|Scheme|Guidelines";
  const own = opening.match(new RegExp(`(?:may be called|may be cited as|shall be called|is) (?:the )?([A-Z][A-Za-z()&,'\\- ]{5,120}?\\b(?:${kinds})\\b,? ?\\d{4})`));
  if (own) return own[1].trim();
  // Runs of capitalised words (with small connecting words) ending in a kind and a year, so a clause
  // such as "Notification issued under the …" cannot be swallowed into the title.
  const word = "(?:[A-Z][A-Za-z()&'\\-]*|of|and|for|the|on|in|to)";
  const phrase = new RegExp(`(?:${word},? ){1,12}?(?:${kinds}),? ?\\d{4}`, "g");
  for (let match = phrase.exec(opening); match; match = phrase.exec(opening)) {
    if (!/\b(?:under|of|in|to|by|with|from|and) (?:the )?$/i.test(opening.slice(Math.max(0, match.index - 14), match.index))) return match[0].replace(/^(?:(?:of|and|for|the|on|in|to) )+/i, "").trim();
  }
  return null;
}

/**
 * Direct intake: the user pastes a link to an official document. The link must pass the same
 * allowlist, HTTPS and redirect checks as every other fetch; nothing else is requested.
 */
export const officialUrlAdapter: SourceAdapter = {
  id: "official-link",
  async healthCheck(): Promise<SourceHealth> { return { adapterId: this.id, ok: true, checkedAt: new Date().toISOString(), detail: "Direct link intake; checked per link." }; },
  async discover(query: string) {
    if (!looksLikeUrl(query)) return [];
    const url = assertAllowedUrl(query.trim());
    const host = url.hostname.replace(/^www\./, "");
    const name = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? host).replace(/\.(pdf|html?)$/i, "").replace(/[_+-]+/g, " ").trim();
    return [{ title: name || host, url: url.toString(), publisher: HOST_PUBLISHERS[host] ?? host, sourceType: "Official document (link provided by the user)", metadata: { provided: true } }];
  },
  fetch: fetchCandidate,
  async parse(document: RawDocument): Promise<ParsedDocument> {
    const parsed = await parseRaw(document);
    // File names are often hashes; prefer a title found in the document's own text.
    if (/^[0-9a-f]{16,}$/i.test(document.candidate.title.replace(/\s/g, ""))) {
      const found = titleFromText(parsed.text);
      if (found) return { ...parsed, candidate: { ...parsed.candidate, title: found } };
    }
    return parsed;
  },
};

export const sourceAdapters = [officialUrlAdapter, sansadAdapter, meityAdapter];
