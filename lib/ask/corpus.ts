import { createHash } from "node:crypto";
import { createDatabaseClient } from "@/lib/db/config";
import { getKnowledge, evidenceUrl, formatDate, legalStatus, phaseWhen } from "@/lib/knowledge";
import { englishPages, loadPdfPages } from "@/lib/knowledge/pdf-text";
import type { PolicyKnowledge } from "@/lib/knowledge";
import { chunkText, type Corpus, type Passage } from "@/lib/ask/retrieval";
import { normalizeSansadDate, readableTitle } from "@/lib/research/record";
import { readEngineRecord, readPages, type EngineRecord } from "@/lib/engine/store";

export type LoadedCorpus = Corpus & {
  /** Facts computed by Anvaya (never by the model) that the answer must stay consistent with. */
  statusBlock: string;
};

const researchSlug = /-research-(\d+)$/;

async function curatedCorpus(knowledge: PolicyKnowledge, asOf: string): Promise<LoadedCorpus> {
  const passages: Passage[] = [];
  for (const document of knowledge.documents) {
    const pages = await loadPdfPages(document.localFile);
    const first = document.firstEnglishPage ?? 1;
    pages.forEach((text, index) => {
      const page = index + 1;
      if (page < first) return;
      chunkText(text).forEach((chunk, part) => {
        passages.push({
          id: `${document.key}:p${page}:${part + 1}`,
          docKey: document.key,
          docTitle: document.title,
          identifier: document.identifier,
          page,
          text: chunk,
          url: evidenceUrl(document, page),
        });
      });
    });
  }
  // Reviewed claims are added as concise, high-precision passages. They matter most where the raw
  // PDF text is hard to read (for example the penalty Schedule, whose table extracts out of order).
  const documents = new Map(knowledge.documents.map((document) => [document.key, document]));
  for (const claim of knowledge.claims) {
    const first = claim.evidence[0];
    const document = first ? documents.get(first.doc) : undefined;
    if (!first || !document) continue;
    const quotes = claim.evidence.map((ref) => `${ref.section}: “${ref.quote.replace(/\s+/g, " ").trim()}”`).join(" | ");
    passages.push({
      id: `note:${claim.id}`,
      docKey: first.doc,
      docTitle: document.title,
      identifier: document.identifier,
      page: first.page,
      text: `Reviewed note (wording checked against the official text). ${claim.claim} Source quotes: ${quotes}`,
      url: evidenceUrl(document, first.page),
    });
  }
  const status = legalStatus(knowledge, asOf);
  const phaseLines = knowledge.phases.map((phase) => `- ${phase.label}: ${phaseWhen(phase, asOf)}. Act: ${phase.actProvisions}. Rules: ${phase.rules}.`);
  const statusBlock = [
    `Today's date for this answer: ${formatDate(asOf)}.`,
    `Policy: ${knowledge.title} (${knowledge.identifier}).`,
    `Overall legal status computed by Anvaya from the Gazette notification G.S.R. 843(E): ${status.label}. ${status.sentence}`,
    "Commencement schedule (dates are 13 Nov 2025 + 0, 12 and 18 months):",
    ...phaseLines,
    "Later official documents in the source set: Corrigendum G.S.R. 892(E) (wording fixes to the Rules, 11 Dec 2025) and Removal of Difficulties Order S.O. 5458(E) (drafting fixes to sections 9(1) and 10(2)(c)(ii), October 2026).",
    "Anvaya has not found any official notification that changes the commencement dates, designates a Significant Data Fiduciary, or exempts startups under section 17(3). Press reports of a possible shortening of the 18-month period are unconfirmed.",
  ].join("\n");
  const version = createHash("sha256").update(knowledge.documents.map((document) => `${document.key}:${document.publishedDate}:${document.url}`).join("|")).digest("hex").slice(0, 12);
  return { policySlug: knowledge.slug, policyTitle: knowledge.title, curated: true, verified: true, version, passages, statusBlock };
}

async function researchCorpus(slug: string, jobId: number): Promise<LoadedCorpus | null> {
  const db = createDatabaseClient();
  const job = await db.execute({ sql: "SELECT * FROM research_jobs WHERE id = ?", args: [jobId] });
  if (!job.rows[0] || String(job.rows[0].result_policy_slug ?? "") !== slug) return null;
  const documents = await db.execute({
    sql: "SELECT d.source_document_id, d.source_url, s.title, s.content_hash FROM research_job_documents d JOIN source_documents s ON s.id = d.source_document_id WHERE d.job_id = ?",
    args: [jobId],
  });
  const events = await db.execute({ sql: "SELECT event_type, event_date, title FROM research_job_events WHERE job_id = ? ORDER BY event_date", args: [jobId] });
  const passages: Passage[] = [];
  for (const document of documents.rows) {
    const excerpts = await db.execute({ sql: "SELECT page_number, excerpt FROM source_excerpts WHERE source_document_id = ? ORDER BY page_number, id", args: [document.source_document_id] });
    for (const row of excerpts.rows) {
      const page = Number(row.page_number ?? 1);
      chunkText(String(row.excerpt)).forEach((chunk, part) => {
        passages.push({ id: `d${document.source_document_id}:p${page}:${part + 1}`, docKey: `d${document.source_document_id}`, docTitle: String(document.title), page, text: chunk, url: /\.pdf/i.test(String(document.source_url)) ? `${String(document.source_url).split("#")[0]}#page=${page}` : String(document.source_url) });
      });
    }
  }
  const title = documents.rows[0] ? readableTitle(String(documents.rows[0].title)) : String(job.rows[0].query);
  const eventLines = events.rows.map((event) => `- ${normalizeSansadDate(event.event_date ? String(event.event_date) : null) ?? "date unknown"}: ${String(event.title)} (from the Sansad bill record; not verified by Anvaya)`);
  const statusBlock = [
    `Policy: ${title}.`,
    "This is a provisional record found by Anvaya's automatic research. Anvaya has NOT verified its legal status, and nothing below changes any legal status.",
    eventLines.length ? "Candidate milestones reported by the source record:" : "No milestones were reported by the source record.",
    ...eventLines,
  ].join("\n");
  const version = createHash("sha256").update(documents.rows.map((document) => String(document.content_hash)).join("|")).digest("hex").slice(0, 12);
  return { policySlug: slug, policyTitle: title, curated: false, verified: false, version, passages, statusBlock };
}

/** Order in which a bill's versions are authoritative; the first available is the text we explain. */
const PRIMARY_ORDER = ["act_text", "passed_both_houses", "passed_rajya_sabha", "passed_lok_sabha", "introduced"];
/** Different versions of the bill's own text. Only the authoritative one is explained; the rest are listed as documents. */
const BILL_TEXT = new Set(PRIMARY_ORDER);

async function engineCorpus(record: EngineRecord, asOf: string): Promise<LoadedCorpus> {
  const primary = PRIMARY_ORDER.map((kind) => record.documents.find((doc) => doc.kind === kind && doc.readable)).find(Boolean);
  // The explained text is the authoritative version, plus supporting documents (committee report, synopsis, errata).
  const finalKinds = new Set(record.documents.filter((doc) => doc.kind === primary?.kind || !BILL_TEXT.has(doc.kind)).map((doc) => doc.kind));
  const passages: Passage[] = [];
  for (const doc of record.documents) {
    if (!doc.readable || !finalKinds.has(doc.kind)) continue;
    const pages = await readPages(doc.sourceDocumentId);
    const english = englishPages(pages);
    const docTitle = `${record.title} (${doc.label.toLowerCase()})`;
    pages.forEach((text, index) => {
      if (!english[index] && text.split(/\s+/).length >= 25) return; // Hindi or garbled pages cannot be explained or quoted
      const page = index + 1;
      chunkText(text).forEach((chunk, part) => {
        passages.push({ id: `d${doc.sourceDocumentId}:p${page}:${part + 1}`, docKey: `d${doc.sourceDocumentId}`, docTitle, page, text: chunk, url: /\.pdf|bitstreams/i.test(doc.url) ? `${doc.url.split("#")[0]}#page=${page}` : doc.url });
      });
    });
  }
  const v = record.verification;
  const lines = [
    `Today's date for this answer: ${asOf}.`,
    `Record: ${record.title}${record.bill ? ` (Bill No. ${record.bill.number} of ${record.bill.year}, ${record.bill.house})` : ""}.`,
    v ? `Stage, from Parliament's/official records and checked by Anvaya on ${v.checkedAt.slice(0, 10)}: ${v.stage.label}. ${v.stage.detail}` : "Anvaya has not verified this record's stage.",
    v ? `Verification: ${v.headline}.` : "",
    ...(v ? v.checks.filter((check) => check.status === "pass" || check.status === "unavailable").map((check) => `- ${check.label}: ${check.status === "pass" ? "confirmed" : "could not be checked"}. ${check.detail}`) : []),
    v?.commencement ? `Commencement clause in the text (page ${v.commencement.page}): "${v.commencement.quote}". Anvaya has not checked whether a start date has since been notified.` : "Anvaya has not found or confirmed a start date.",
    primary ? `The explained text is: ${primary.label}.` : "No readable text is available.",
    "The stage and dates above are facts computed and checked by Anvaya from official records. Use them as given. Do not infer anything about legal status beyond them.",
  ].filter(Boolean);
  const version = createHash("sha256").update([...record.documents.map((doc) => `${doc.kind}:${doc.sourceDocumentId}:${doc.readable}`), v?.stage.code].join("|")).digest("hex").slice(0, 12);
  return { policySlug: record.slug, policyTitle: record.title, curated: false, verified: v?.level === "verified" || v?.level === "corroborated", version, passages, statusBlock: lines.join("\n") };
}

/** Builds the evidence set for one policy. Returns null if the policy is unknown. */
export async function loadCorpus(slug: string, asOf: string): Promise<LoadedCorpus | null> {
  const knowledge = getKnowledge(slug);
  if (knowledge) return curatedCorpus(knowledge, asOf);
  const engine = await readEngineRecord(slug);
  if (engine) return engineCorpus(engine, asOf);
  const match = slug.match(researchSlug);
  if (match) return researchCorpus(slug, Number(match[1]));
  return null;
}
