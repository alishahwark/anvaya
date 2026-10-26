import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createDatabaseClient } from "@/lib/db/config";
import { looksLikeUrl, sourceAdapters } from "@/lib/research/adapters";
import { buildDocumentRecord, resolveByName } from "@/lib/engine/resolve";
import { downloadFiles } from "@/lib/engine/fetch-docs";
import { readAlternatives } from "@/lib/engine/store";
import type { ParsedDocument, SourceCandidate } from "@/lib/research/types";

function client() { return createDatabaseClient(); }
function clean(value: string) { return value.normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
function slugFor(query: string, jobId: number) { const base = query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "researched-policy"; return `${base}-research-${jobId}`; }
function identityFor(query: string, candidate: SourceCandidate, text: string) { const words = clean(query).toLowerCase().split(/\s+/).filter((word) => word.length > 3); const haystack = `${candidate.title} ${text.slice(0, 5000)}`.toLowerCase(); return words.length > 0 && words.filter((word) => haystack.includes(word)).length >= Math.min(2, words.length) ? "matched_review_required" : "insufficient_evidence"; }
function eventCandidates(candidate: SourceCandidate, sourceDocumentId: number) { const metadata = candidate.metadata; const result: Array<[string, string | null, string, string]> = []; const introduced = typeof metadata.billIntroducedDate === "string" ? metadata.billIntroducedDate.slice(0, 10) : null; const passedLs = typeof metadata.billPassedInLSDate === "string" ? metadata.billPassedInLSDate.slice(0, 10) : null; const passedRs = typeof metadata.billPassedInRSDate === "string" ? metadata.billPassedInRSDate.slice(0, 10) : null; const assent = typeof metadata.billAssentedDate === "string" ? metadata.billAssentedDate : null; if (introduced) result.push(["introduced", introduced, "Bill introduced", `Sansad metadata records introduction on ${introduced}.`]); if (passedLs) result.push(["passed_lok_sabha", passedLs, "Passed Lok Sabha", `Sansad metadata records passage in Lok Sabha on ${passedLs}.`]); if (passedRs) result.push(["passed_rajya_sabha", passedRs, "Passed Rajya Sabha", `Sansad metadata records passage in Rajya Sabha on ${passedRs}.`]); if (assent) result.push(["presidential_assent", assent, "Presidential assent recorded by Sansad", `Sansad metadata records assent as ${assent}. This is a candidate event pending document-level review.`]); return result.map(([type, date, title, detail]) => ({ type, date, title, detail, sourceDocumentId })); }

async function updateJob(id: number, status: string, extra: Record<string, string | null> = {}) { const db = client(); const fields = ["status = ?"]; const args: Array<string | number | null> = [status]; for (const [key, value] of Object.entries(extra)) { fields.push(`${key} = ?`); args.push(value); } args.push(id); await db.execute({ sql: `UPDATE research_jobs SET ${fields.join(", ")} WHERE id = ?`, args }); }
async function persistDocument(jobId: number, parsed: ParsedDocument, query: string) {
  const db = client(); const hash = createHash("sha256").update(parsed.bytes).digest("hex"); const extension = parsed.contentType.includes("pdf") || parsed.candidate.url.includes(".pdf") ? "pdf" : "html"; const directory = resolve("data/research-cache"); mkdirSync(directory, { recursive: true }); const localPath = resolve(directory, `${hash}.${extension}`); writeFileSync(localPath, parsed.bytes);
  await db.execute({ sql: "INSERT OR IGNORE INTO source_documents (canonical_url,title,publisher,source_type,published_date,retrieved_at,verification_status,excerpt,locator,content_hash) VALUES (?,?,?,?,?,?,?,?,?,?)", args: [parsed.candidate.url, parsed.candidate.title, parsed.candidate.publisher, parsed.candidate.sourceType, parsed.candidate.publishedDate ?? null, parsed.retrievedAt, "unknown", parsed.text.slice(0, 1200) || null, parsed.pageCount ? `pages: 1-${parsed.pageCount}` : "page unavailable", hash] });
  const source = await db.execute({ sql: "SELECT id FROM source_documents WHERE content_hash = ?", args: [hash] }); const sourceId = Number(source.rows[0]?.id); if (!sourceId) throw new Error("Retrieved document could not be registered.");
  await db.execute({ sql: "INSERT OR IGNORE INTO imported_source_files (source_document_id,file_name,file_hash,local_path,extracted_text,page_count,extraction_quality,metadata_json,imported_at) VALUES (?,?,?,?,?,?,?,?,?)", args: [sourceId, `${hash}.${extension}`, hash, localPath, parsed.text, parsed.pageCount, parsed.extractionQuality, JSON.stringify({ query, candidate: parsed.candidate }), parsed.retrievedAt] });
  const pages = parsed.text.split("\f").map((page) => page.trim()).filter(Boolean); const chunks = pages.length > 1 ? pages : (parsed.text.match(/[\s\S]{1,3500}/g) ?? []); for (const [index, excerpt] of chunks.entries()) { const excerptHash = createHash("sha256").update(`${hash}:${index}:${excerpt}`).digest("hex"); await db.execute({ sql: "INSERT OR IGNORE INTO source_excerpts (source_document_id,page_number,excerpt,excerpt_hash) VALUES (?,?,?,?)", args: [sourceId, index + 1 <= parsed.pageCount ? index + 1 : null, excerpt.slice(0, 4000), excerptHash] }); }
  const identity = identityFor(query, parsed.candidate, parsed.text); await db.execute({ sql: "INSERT OR IGNORE INTO research_job_documents (job_id,source_document_id,candidate_title,source_url,identity_status,retrieved_at) VALUES (?,?,?,?,?,?)", args: [jobId, sourceId, parsed.candidate.title, parsed.candidate.url, identity, parsed.retrievedAt] });
  for (const event of eventCandidates(parsed.candidate, sourceId)) await db.execute({ sql: "INSERT OR IGNORE INTO research_job_events (job_id,event_type,event_date,title,detail,source_document_id,verification_status) VALUES (?,?,?,?,?,?,?)", args: [jobId, event.type, event.date, event.title, event.detail, event.sourceDocumentId, "candidate"] });
  return { sourceId, identity };
}

/** A document that was already researched keeps its original record, so re-running a search never creates a duplicate. */
async function existingSlugForDocument(sourceDocumentId: number, currentJobId: number): Promise<string | null> {
  const found = await client().execute({
    sql: "SELECT j.result_policy_slug AS slug FROM research_job_documents d JOIN research_jobs j ON j.id = d.job_id WHERE d.source_document_id = ? AND d.job_id <> ? AND j.result_policy_slug IS NOT NULL ORDER BY d.job_id LIMIT 1",
    args: [sourceDocumentId, currentJobId],
  });
  return found.rows[0]?.slug ? String(found.rows[0].slug) : null;
}

export async function createResearchJob(query: string) { const db = client(); const now = new Date().toISOString(); const result = await db.execute({ sql: "INSERT INTO research_jobs (query,status,started_at) VALUES (?,?,?)", args: [query.trim(), "queued", now] }); return Number(result.lastInsertRowid); }
/** Name searches: Parliament's register and India Code, every official file fetched, every record verified. */
async function runNameJob(jobId: number, query: string) {
  try {
    const result = await resolveByName(jobId, query);
    for (const note of result.sourceNotes) {
      await client().execute({ sql: "INSERT OR REPLACE INTO research_job_sources (job_id,adapter_id,status,candidates_found,documents_retrieved,error,checked_at) VALUES (?,?,?,?,?,?,?)", args: [jobId, note.adapter, note.status, note.found, note.retrieved, note.error, new Date().toISOString()] });
    }
    await updateJob(jobId, result.slug ? "completed" : "completed_no_evidence", { finished_at: new Date().toISOString(), result_policy_slug: result.slug, summary: result.summary, errors: result.errors.length ? JSON.stringify(result.errors) : null });
  } catch (error) {
    console.error("Anvaya research job failed", error);
    await updateJob(jobId, "completed_no_evidence", { finished_at: new Date().toISOString(), summary: "The search could not be completed. Nothing was invented. Please try again.", errors: JSON.stringify([error instanceof Error ? error.message : "Unknown failure"]) });
  }
}

export async function runResearchJob(jobId: number, query: string) {
  await updateJob(jobId, "running"); const errors: string[] = []; let documents = 0; let resultSlug: string | null = null; let resultTitle: string | null = null;
  const isLink = looksLikeUrl(query);
  if (!isLink) return runNameJob(jobId, query);
  for (const adapter of sourceAdapters) {
    // A pasted link is fetched directly; name searches go to the registers.
    if (isLink !== (adapter.id === "official-link")) continue;
    const checkedAt = new Date().toISOString(); let candidates: SourceCandidate[] = [];
    try { const health = await adapter.healthCheck(); if (!health.ok) { errors.push(`${adapter.id}: ${health.detail}`); await client().execute({ sql: "INSERT OR REPLACE INTO research_job_sources (job_id,adapter_id,status,candidates_found,documents_retrieved,error,checked_at) VALUES (?,?,?,?,?,?,?)", args: [jobId, adapter.id, "blocked", 0, 0, health.detail, health.checkedAt] }); continue; } candidates = await adapter.discover(query); await client().execute({ sql: "INSERT OR REPLACE INTO research_job_sources (job_id,adapter_id,status,candidates_found,documents_retrieved,error,checked_at) VALUES (?,?,?,?,?,?,?)", args: [jobId, adapter.id, "discovered", candidates.length, 0, null, checkedAt] }); } catch (error) { const detail = error instanceof Error ? error.message : "Adapter failed."; errors.push(`${adapter.id}: ${detail}`); await client().execute({ sql: "INSERT OR REPLACE INTO research_job_sources (job_id,adapter_id,status,candidates_found,documents_retrieved,error,checked_at) VALUES (?,?,?,?,?,?,?)", args: [jobId, adapter.id, "failed", 0, 0, detail, checkedAt] }); continue; }
    for (const candidate of candidates.slice(0, 3)) { try { const parsed = await adapter.parse(await adapter.fetch(candidate)); const stored = await persistDocument(jobId, parsed, query); documents += 1; resultTitle ??= parsed.candidate.title; resultSlug ??= (await existingSlugForDocument(stored.sourceId, jobId)) ?? slugFor(parsed.candidate.title, jobId); await client().execute({ sql: "UPDATE research_job_sources SET documents_retrieved = documents_retrieved + 1 WHERE job_id = ? AND adapter_id = ?", args: [jobId, adapter.id] }); if (stored.identity === "matched_review_required") break; } catch (error) { errors.push(`${adapter.id} / ${candidate.title}: ${error instanceof Error ? error.message : "Document retrieval failed."}`); } }
  }
  const db = client(); if (resultSlug) await db.execute({ sql: "INSERT OR IGNORE INTO legislative_policies (slug,official_name,category,current_status,status_confidence,summary,current_information,is_verified) VALUES (?,?,?,?,?,?,?,?)", args: [resultSlug, (resultTitle ?? query).trim(), "Discovered government record", "unknown", "unverified", `A research job found ${documents} official document${documents === 1 ? "" : "s"} related to “${query.trim()}”.`, "Candidate events and source identity require human review. No authoritative legal status was changed.", 0] }); if (resultSlug && resultTitle) { try { const [file] = await downloadFiles([{ kind: "act_text", label: "Official document", url: (await client().execute({ sql: "SELECT source_url FROM research_job_documents WHERE job_id = ? ORDER BY id LIMIT 1", args: [jobId] })).rows[0]?.source_url as string }]); const built = await buildDocumentRecord(resultSlug, jobId, { ...file, kind: "act_text", label: "Official document" }, resultTitle, query); void built; } catch (error) { errors.push(`verification: ${error instanceof Error ? error.message : "failed"}`); } }
  await updateJob(jobId, documents > 0 ? "completed_review_required" : "completed_no_evidence", { finished_at: new Date().toISOString(), result_policy_slug: resultSlug, summary: `Retrieved ${documents} document${documents === 1 ? "" : "s"}. ${errors.length ? "Some sources require review." : "All attempted sources completed."}`, errors: errors.length ? JSON.stringify(errors) : null });
}
export async function getResearchJob(jobId: number) { const db = client(); const job = await db.execute({ sql: "SELECT * FROM research_jobs WHERE id = ?", args: [jobId] }); if (!job.rows[0]) return null; const sources = await db.execute({ sql: "SELECT * FROM research_job_sources WHERE job_id = ? ORDER BY adapter_id", args: [jobId] }); const documents = await db.execute({ sql: "SELECT d.*, s.title, s.publisher, s.source_type, s.published_date, s.verification_status, s.locator FROM research_job_documents d JOIN source_documents s ON s.id = d.source_document_id WHERE d.job_id = ? ORDER BY d.id", args: [jobId] }); const events = await db.execute({ sql: "SELECT * FROM research_job_events WHERE job_id = ? ORDER BY event_date", args: [jobId] }); const alternatives = await readAlternatives(jobId).catch(() => []); return { job: job.rows[0], sources: sources.rows, documents: documents.rows, events: events.rows, alternatives }; }
