import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { createDatabaseClient } from "@/lib/db/config";
import { actPdfUrl, corroborateAct, searchActs, type IndiaCodeAct } from "@/lib/engine/indiacode";
import { downloadFiles, type DownloadedDoc } from "@/lib/engine/fetch-docs";
import { findBillByIdentity, searchBills, stageOf, titleScore, type SansadBill, type Stage } from "@/lib/engine/sansad";
import { saveAlternatives, saveDocument, savePages, saveRecord, saveVerification, findSlugByIdentity, type Alternative } from "@/lib/engine/store";
import { findCommencement, verifyBill, type Check, type FetchedDoc, type Verification } from "@/lib/engine/verify-bill";
import { allKnowledge } from "@/lib/knowledge";
import { readableTitle } from "@/lib/research/record";
import { englishShare } from "@/lib/knowledge/pdf-text";

export type ResolveResult = {
  slug: string | null;
  /** Plain-language outcome for the job page. */
  summary: string;
  documents: number;
  errors: string[];
  sourceNotes: Array<{ adapter: string; status: "discovered" | "failed" | "blocked"; found: number; retrieved: number; error: string | null }>;
};

const db = () => createDatabaseClient();

const STATUS_FOR_STAGE: Record<Stage["code"], string> = {
  enacted: "presidential_assent",
  passed_both: "passed_parliament",
  passed_lok_sabha: "under_consideration",
  passed_rajya_sabha: "under_consideration",
  in_committee: "under_consideration",
  pending: "introduced",
  negatived: "rejected",
  removed: "lapsed",
  withdrawn: "withdrawn",
  unknown: "unknown",
};

function slugFor(title: string, jobId: number) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "record";
  return `${base}-research-${jobId}`;
}

/** Stores the original file once (by hash) and returns its source_documents id. */
async function registerFile(doc: DownloadedDoc, title: string, publisher: string): Promise<number | null> {
  if (!doc.bytes) return null;
  const hash = createHash("sha256").update(doc.bytes).digest("hex");
  const directory = resolvePath("data/research-cache");
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolvePath(directory, `${hash}.pdf`), doc.bytes);
  await db().execute({
    sql: "INSERT OR IGNORE INTO source_documents (canonical_url,title,publisher,source_type,published_date,retrieved_at,verification_status,excerpt,locator,content_hash) VALUES (?,?,?,?,?,?,?,?,?,?)",
    args: [doc.url, title, publisher, doc.label, null, new Date().toISOString(), "unknown", null, doc.pages ? `pages: 1-${doc.pages.length}` : "no readable text", hash],
  });
  const row = await db().execute({ sql: "SELECT id FROM source_documents WHERE content_hash = ?", args: [hash] });
  return row.rows[0] ? Number(row.rows[0].id) : null;
}

async function storeDocuments(slug: string, jobId: number, docs: DownloadedDoc[], titleOf: (doc: DownloadedDoc) => string, publisher: string) {
  let stored = 0;
  for (const doc of docs) {
    const id = await registerFile(doc, titleOf(doc), publisher);
    if (id === null) continue;
    const readable = !!doc.pages && doc.pages.join("").replace(/\s+/g, "").length > 200 && englishShare(doc.pages) >= 0.25;
    if (doc.pages && readable) await savePages(id, doc.pages);
    await saveDocument(slug, { kind: doc.kind, label: doc.label, url: doc.url, sourceDocumentId: id, pageCount: doc.pages?.length ?? 0, readable });
    await db().execute({ sql: "INSERT OR IGNORE INTO research_job_documents (job_id,source_document_id,candidate_title,source_url,identity_status,retrieved_at) VALUES (?,?,?,?,?,?)", args: [jobId, id, doc.label, doc.url, "checked", new Date().toISOString()] });
    stored += 1;
  }
  return stored;
}

async function writeRegisterRow(slug: string, title: string, ministry: string | null, category: string, stage: Stage, verification: Verification, summary: string) {
  const confidence = verification.level === "verified" || verification.level === "corroborated" ? "verified" : "unverified";
  await db().execute({
    sql: "INSERT OR IGNORE INTO legislative_policies (slug,official_name,ministry,category,current_status,status_confidence,summary,current_information,last_verified_at,is_verified) VALUES (?,?,?,?,?,?,?,?,?,?)",
    args: [slug, title, ministry, category, STATUS_FOR_STAGE[stage.code], confidence, summary, stage.detail, verification.checkedAt.slice(0, 10), confidence === "verified" ? 1 : 0],
  });
  await db().execute({
    sql: "UPDATE legislative_policies SET official_name = ?, ministry = ?, category = ?, current_status = ?, status_confidence = ?, summary = ?, current_information = ?, last_verified_at = ?, is_verified = ? WHERE slug = ?",
    args: [title, ministry, category, STATUS_FOR_STAGE[stage.code], confidence, summary, stage.detail, verification.checkedAt.slice(0, 10), confidence === "verified" ? 1 : 0, slug],
  });
  if (confidence === "verified") await db().execute({ sql: "UPDATE source_documents SET verification_status = 'verified', verified_at = ? WHERE id IN (SELECT source_document_id FROM bill_documents WHERE slug = ?)", args: [verification.checkedAt.slice(0, 10), slug] });
}

/** If this bill became an Act that already has a hand-curated page, send readers there. */
function curatedSlugFor(bill: SansadBill): string | null {
  const known = allKnowledge().find((knowledge) => knowledge.act && String(knowledge.act.number) === bill.actNo && knowledge.act.year === bill.actYear);
  return known ? known.slug : null;
}

const labelFor = (bill: SansadBill) => `${bill.title} — ${bill.house} Bill No. ${bill.number} of ${bill.year}`;

/** Fetches everything for one bill from the official sources, verifies it, and stores it. */
export async function buildBillRecord(slug: string, jobId: number, bill: SansadBill, query?: string): Promise<{ verification: Verification; documents: number; errors: string[] }> {
  const errors: string[] = [];
  const downloaded = await downloadFiles(bill.files);
  for (const doc of downloaded) if (doc.error) errors.push(`${doc.label}: ${doc.error}`);

  let indiaCode = null as Awaited<ReturnType<typeof corroborateAct>> | null;
  const docs: DownloadedDoc[] = [...downloaded];
  if (bill.actNo && bill.actYear) {
    indiaCode = await corroborateAct(bill.title, bill.actNo, bill.actYear, bill.assentDate);
    if (indiaCode.status === "found") {
      const pdf = await actPdfUrl(indiaCode.act);
      if (pdf) {
        const [act] = await downloadFiles([{ kind: "act_text", label: "Act text (India Code)", url: pdf }]);
        if (act.error) errors.push(`Act text: ${act.error}`);
        else docs.push(act);
      }
    }
  }

  const stage = stageOf(bill);
  const verification = verifyBill({ bill, docs: docs.map((doc): FetchedDoc => ({ kind: doc.kind, label: doc.label, url: doc.url, pages: doc.pages })), indiaCode, query });
  await saveRecord({ slug, kind: "bill", bill, title: bill.title, jobId });
  const stored = await storeDocuments(slug, jobId, docs, (doc) => `${bill.title} — ${doc.label}`, doc_publisher(bill));
  await saveVerification(slug, verification);
  await writeRegisterRow(slug, bill.title, bill.ministry, bill.type === "Private Member" ? "Private member’s bill" : "Government bill", stage, verification, `${stage.label}. ${stage.detail}`);
  return { verification, documents: stored, errors };
}

const doc_publisher = (bill: SansadBill) => `Parliament of India — Digital Sansad${bill.house ? ` (${bill.house})` : ""}`;

function alternativesFrom(bills: Array<{ bill: SansadBill; score: number }>, acts: Array<{ act: IndiaCodeAct; score: number }>, chosen: string): Alternative[] {
  const fromBills = bills
    .filter((item) => labelFor(item.bill) !== chosen)
    .slice(0, 6)
    .map((item): Alternative => ({ title: item.bill.title, subtitle: `${item.bill.house} Bill No. ${item.bill.number} of ${item.bill.year} · ${stageOf(item.bill).label}`, query: item.bill.title }));
  const fromActs = acts.filter((item) => item.act.jurisdiction === "central").slice(0, 3).map((item): Alternative => ({ title: item.act.title, subtitle: `Act No. ${item.act.actNumber} of ${item.act.actYear} · India Code`, query: item.act.title }));
  return [...fromBills, ...fromActs].slice(0, 7);
}

/**
 * Resolves a name to an official record. Bills come from Parliament's register; laws that predate
 * the register, or are not bills, come from India Code and are cross-checked against Parliament.
 */
export async function resolveByName(jobId: number, query: string): Promise<ResolveResult> {
  const notes: ResolveResult["sourceNotes"] = [];
  const bills = await searchBills(query);
  notes.push({ adapter: "sansad-bills", status: bills.reachable ? "discovered" : "failed", found: bills.ranked.length, retrieved: 0, error: bills.reachable ? null : "Parliament’s bill register did not respond." });
  const acts = await searchActs(query);
  notes.push({ adapter: "india-code", status: acts.reachable ? "discovered" : "failed", found: acts.acts.length, retrieved: 0, error: acts.reachable ? null : "India Code did not respond." });

  const bestBill = bills.ranked[0];
  const bestAct = acts.acts.find((item) => item.act.jurisdiction === "central") ?? acts.acts[0];
  // Prefer the bill; an Act only wins when it matches clearly better or no bill matched.
  const useAct = !bestBill || (bestAct && bestAct.score > bestBill.score + 0.15);

  if (!useAct && bestBill) {
    const bill = bestBill.bill;
    const curated = curatedSlugFor(bill);
    await saveAlternatives(jobId, alternativesFrom(bills.ranked, acts.acts, labelFor(bill)));
    if (curated) {
      notes[0].retrieved = 0;
      return { slug: curated, summary: `This is the ${bill.title}, which became Act No. ${bill.actNo} of ${bill.actYear}. Anvaya already has a fully reviewed page for it.`, documents: 0, errors: [], sourceNotes: notes };
    }
    const slug = (await findSlugByIdentity(bill.house, bill.number, bill.year)) ?? slugFor(bill.title, jobId);
    const built = await buildBillRecord(slug, jobId, bill, query);
    notes[0].retrieved = built.documents;
    const v = built.verification;
    return { slug, summary: `${readableTitle(bill.title)}: ${v.stage.label}. ${v.headline}. ${built.documents} official ${built.documents === 1 ? "document" : "documents"} fetched.`, documents: built.documents, errors: built.errors, sourceNotes: notes };
  }

  if (bestAct) {
    await saveAlternatives(jobId, alternativesFrom(bills.ranked, acts.acts, bestAct.act.title));
    const slug = slugFor(bestAct.act.title, jobId);
    const built = await buildActRecord(slug, jobId, bestAct.act, query);
    notes[1].retrieved = built.documents;
    return { slug: built.documents ? slug : null, summary: built.documents ? `${readableTitle(bestAct.act.title)}: ${built.verification.headline}.` : "India Code lists this Act but its text could not be downloaded.", documents: built.documents, errors: built.errors, sourceNotes: notes };
  }

  return {
    slug: null,
    summary: bills.reachable || acts.reachable ? `No bill or Act matching “${query}” was found in Parliament’s register or on India Code. Try the exact title, or paste a link to an official document.` : "Neither Parliament’s register nor India Code could be reached just now. Nothing was invented; please try again shortly.",
    documents: 0,
    errors: [],
    sourceNotes: notes,
  };
}

/** A law that India Code carries: fetch its text and cross-check Parliament's record. */
async function buildActRecord(slug: string, jobId: number, act: IndiaCodeAct, query: string): Promise<{ verification: Verification; documents: number; errors: string[] }> {
  const errors: string[] = [];
  const pdf = await actPdfUrl(act);
  const docs: DownloadedDoc[] = pdf ? await downloadFiles([{ kind: "act_text", label: "Act text (India Code)", url: pdf }]) : [];
  for (const doc of docs) if (doc.error) errors.push(`Act text: ${doc.error}`);

  // Parliament's register, where the Act began life as a bill, is a second official source.
  let parliament: SansadBill | null = null;
  if (act.actNumber && act.actYear) {
    const found = await searchBills(act.title.replace(/\bAct\b/i, "Bill"));
    parliament = found.ranked.map((item) => item.bill).find((bill) => bill.actNo === act.actNumber && bill.actYear === act.actYear) ?? null;
  }
  const text = docs[0]?.pages ?? null;
  const checks: Check[] = [];
  const iso = (value: string | null) => value ?? "—";
  checks.push({ id: "record", label: "Listed on India Code", status: "pass", detail: `India Code lists ${act.title} as Act No. ${act.actNumber} of ${act.actYear}${act.enactDate ? `, enacted ${act.enactDate}` : ""}${act.ministry ? `, ${act.ministry}` : ""}${act.repealed ? ". It is marked as repealed." : "."}`, sources: [{ label: "India Code", url: act.url }] });
  checks.push({ id: "match", label: "Matches what you asked for", status: titleScore(query, act.title) >= 0.75 ? "pass" : "info", detail: titleScore(query, act.title) >= 0.75 ? `Your search “${query}” matches this Act’s title.` : `Your search “${query}” is a partial match for this Act. Check it is the one you meant.`, sources: [] });
  const compact = (text ?? []).slice(0, 4).join(" ").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const numberOk = new RegExp(`no\\.?${Number(act.actNumber)}of${act.actYear}`).test(compact) || new RegExp(`${act.actYear}\\(no`).test(compact);
  const titleOk = text ? compact.includes(act.title.toLowerCase().replace(/\bthe\b/, "").replace(/[^a-z0-9]+/g, "").slice(0, 28)) : false;
  checks.push({ id: "identity", label: "The document is this Act", status: !text ? "unavailable" : titleOk ? "pass" : "fail", detail: !text ? "The Act’s PDF has no readable text, so its identity could not be checked." : titleOk ? `The title printed in the PDF matches India Code${numberOk ? ", and it prints the same Act number" : ""}.` : "The title printed in the PDF does not match India Code’s record.", sources: docs[0] ? [{ label: docs[0].label, url: docs[0].url }] : [] });
  if (parliament) {
    const agree = parliament.assentDate === act.enactDate || !parliament.assentDate || !act.enactDate;
    checks.push({ id: "parliament", label: "Confirmed in Parliament’s register", status: agree ? "pass" : "fail", detail: agree ? `Digital Sansad lists the bill that became this Act (${parliament.house} Bill No. ${parliament.number} of ${parliament.year}), with assent on ${iso(parliament.assentDate)}.` : `Parliament’s record gives assent on ${parliament.assentDate}; India Code gives ${act.enactDate}.`, sources: [{ label: "Digital Sansad bill register", url: "https://sansad.in/ls/legislation/bills" }] });
  } else {
    checks.push({ id: "parliament", label: "Confirmed in Parliament’s register", status: "unavailable", detail: "Parliament’s register has no matching bill (older Acts and some Acts are not in it). India Code’s record stands alone.", sources: [] });
  }
  const commencement = docs[0] ? findCommencement(docs[0]) : null;
  checks.push({ id: "commencement", label: "When it comes into force", status: "info", detail: commencement ? `The text itself says: “${commencement.quote}” (page ${commencement.page}). Anvaya has not checked whether a start date has since been notified.` : "The text has no single start-date clause that Anvaya could find; Anvaya has not confirmed any start date.", sources: docs[0] ? [{ label: docs[0].label, url: docs[0].url }] : [] });

  const failed = checks.some((check) => check.status === "fail");
  const core = checks.find((check) => check.id === "identity")?.status === "pass";
  const level: Verification["level"] = failed ? "failed" : core ? (parliament ? "corroborated" : "verified") : "partly";
  const stage: Stage = act.repealed
    ? { code: "removed", label: `Act No. ${act.actNumber} of ${act.actYear} (repealed)`, detail: "India Code marks this Act as repealed. It is no longer law.", isLaw: false }
    : { code: "enacted", label: `Act No. ${act.actNumber} of ${act.actYear}`, detail: `This is an Act of ${act.jurisdiction === "central" ? "Parliament" : "a State legislature"}${act.enactDate ? `, enacted ${act.enactDate}` : ""}. The text shown is as published on India Code; later amendments may not be merged into it.`, isLaw: true };
  const verification: Verification = {
    level,
    headline: level === "failed" ? "A check found a discrepancy, so Anvaya cannot vouch for this record" : level === "corroborated" ? "Verified against India Code and Parliament’s register" : level === "verified" ? "Verified against India Code and the Act’s own text" : "Partly verified: some checks could not be run",
    checkedAt: new Date().toISOString(),
    stage,
    checks,
    commencement,
    limitations: ["The Act’s text is as published on India Code. Amendments made by later Acts may not be merged into it, and Anvaya has not checked for them.", "Whether and when each provision came into force depends on the Act’s own clause and any Gazette notifications, which Anvaya has not checked."],
  };
  await saveRecord({ slug, kind: "document", bill: null, title: act.title, jobId });
  const stored = await storeDocuments(slug, jobId, docs, () => `${act.title} — Act text`, "India Code, Legislative Department, Government of India");
  await saveVerification(slug, verification);
  await writeRegisterRow(slug, act.title, act.ministry, act.jurisdiction === "central" ? "Central Act" : "State Act", stage, verification, `${stage.label}. ${stage.detail}`);
  return { verification, documents: stored, errors };
}

/** Re-fetches and re-verifies a stored bill record against the live official sources. */
export async function reverifyBill(slug: string, jobId: number, house: string, number: number, year: number, title: string): Promise<{ ok: boolean; level?: Verification["level"]; message: string }> {
  const bill = await findBillByIdentity(title, house, number, year);
  if (!bill) return { ok: false, message: "Not found in Parliament’s register." };
  const built = await buildBillRecord(slug, jobId, bill);
  return { ok: true, level: built.verification.level, message: `${bill.title}: ${built.verification.stage.label} (${built.verification.level}), ${built.documents} documents` };
}

const HOST_NAMES: Record<string, string> = {
  "sansad.in": "Parliament of India (sansad.in)",
  "meity.gov.in": "Ministry of Electronics and Information Technology (meity.gov.in)",
  "indiacode.gov.in": "India Code (indiacode.gov.in)",
  "indiacode.nic.in": "India Code (indiacode.nic.in)",
  "egazette.gov.in": "The Gazette of India (egazette.gov.in)",
  "pib.gov.in": "Press Information Bureau (pib.gov.in)",
};

/**
 * A document the user pointed us to by link. Anvaya can verify that it is an authentic official
 * document (official host, readable, self-identifying) but not a bill's stage, so it says exactly that.
 */
export async function buildDocumentRecord(slug: string, jobId: number, doc: DownloadedDoc, title: string, query: string): Promise<{ verification: Verification; documents: number; errors: string[] }> {
  const host = new URL(doc.url).hostname.replace(/^www\./, "");
  const publisher = HOST_NAMES[host] ?? host;
  const pages = doc.pages;
  const readable = !!pages && pages.join("").replace(/\s+/g, "").length > 200 && englishShare(pages) >= 0.25;
  const checks: Check[] = [];
  checks.push({ id: "source", label: "Fetched from an official government site", status: "pass", detail: `Downloaded over HTTPS from ${publisher}. Anvaya only fetches from a short list of official sites and checks every redirect.`, sources: [{ label: doc.label, url: doc.url }] });
  checks.push({ id: "readable", label: "The text can be read", status: readable ? "pass" : "fail", detail: readable ? `${pages!.length} pages of text were extracted.` : "The file has no readable text (it may be a scan), so nothing can be checked or explained.", sources: [] });
  const { titleFromText } = await import("@/lib/research/adapters");
  const found = readable ? titleFromText(pages!.join(" ")) : null;
  checks.push({ id: "identity", label: "The document names itself", status: found ? "pass" : "info", detail: found ? `The text identifies itself as “${found}”.` : "Anvaya could not find a clear title in the text, so the record uses the file’s name.", sources: [] });

  let indiaCode: Awaited<ReturnType<typeof searchActs>> | null = null;
  if (found && /\bAct\b,? ?\d{4}/.test(found)) indiaCode = await searchActs(found).catch(() => null);
  const match = indiaCode?.acts.find((item) => item.act.jurisdiction === "central" && titleScore(found!, item.act.title) >= 0.9);
  if (found && /\bAct\b,? ?\d{4}/.test(found)) {
    checks.push({ id: "indiacode", label: "Listed on India Code", status: match ? "pass" : "unavailable", detail: match ? `India Code lists ${match.act.title} as Act No. ${match.act.actNumber} of ${match.act.actYear}.` : "India Code has no entry with this title.", sources: match ? [{ label: "India Code", url: match.act.url }] : [] });
  }
  // Bilingual gazettes carry the Hindi text first, so the English wording can be deep in the file.
  const text = readable ? pages!.join(" ").replace(/\s+/g, " ").slice(0, 400_000) : "";
  const isDraft = /\bdraft of (?:the )?(?:\w+ ){0,8}(?:rules|regulations|bill|policy)/i.test(text) && /objections and suggestions|public consultation|comments/i.test(text);
  const commencement = readable ? findCommencement({ kind: doc.kind, label: doc.label, url: doc.url, pages }) : null;
  if (commencement) checks.push({ id: "commencement", label: "When it comes into force", status: "info", detail: `The text itself says: “${commencement.quote}” (page ${commencement.page}).`, sources: [{ label: doc.label, url: doc.url }] });

  const failed = checks.some((check) => check.status === "fail");
  const stage: Stage = isDraft
    ? { code: "unknown", label: "Draft published for public comment", detail: "The text describes itself as a draft open for objections and suggestions. A draft has no legal force. Anvaya has not checked whether a final version has been issued.", isLaw: false }
    : { code: "unknown", label: "Official document", detail: "This is an official document. Anvaya has not determined its legal status from a link alone.", isLaw: false };
  const verification: Verification = {
    level: failed ? "failed" : "verified",
    headline: failed ? "A check failed, so Anvaya cannot vouch for this document" : `Authentic official document from ${publisher}`,
    checkedAt: new Date().toISOString(),
    stage,
    checks,
    commencement,
    limitations: ["Anvaya has verified that this is an authentic official document. It has not determined its legal status or whether it has been replaced by a later version."],
  };
  if (isDraft && !/draft/i.test(title)) title = `${title} (draft)`;
  await saveRecord({ slug, kind: "document", bill: null, title, jobId });
  const stored = await storeDocuments(slug, jobId, [doc], () => title, publisher);
  await saveVerification(slug, verification);
  await writeRegisterRow(slug, title, null, "Official document", stage, verification, `${stage.label}. ${stage.detail}`);
  void query;
  return { verification, documents: stored, errors: [] };
}
