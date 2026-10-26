import { createDatabaseClient } from "@/lib/db/config";
import type { SansadBill } from "@/lib/engine/sansad";
import type { Verification } from "@/lib/engine/verify-bill";

/**
 * Storage for engine records. Tables are created on first use so an existing database upgrades in place.
 * Page text is stored page by page, so every page number Anvaya shows is a real page of the real PDF.
 */

export type StoredDocument = { kind: string; label: string; url: string; sourceDocumentId: number; pageCount: number; readable: boolean };
export type Alternative = { title: string; subtitle: string; query: string };

let ready: Promise<void> | null = null;

export function ensureEngineTables(): Promise<void> {
  ready ??= (async () => {
    const db = createDatabaseClient();
    const statements = [
      "CREATE TABLE IF NOT EXISTS bill_records (slug TEXT PRIMARY KEY, record_kind TEXT NOT NULL, house TEXT, bill_number INTEGER, bill_year INTEGER, title TEXT NOT NULL, bill_json TEXT, job_id INTEGER, created_at TEXT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS bill_documents (slug TEXT NOT NULL, kind TEXT NOT NULL, label TEXT NOT NULL, url TEXT NOT NULL, source_document_id INTEGER NOT NULL, page_count INTEGER NOT NULL, readable INTEGER NOT NULL, PRIMARY KEY (slug, kind))",
      "CREATE TABLE IF NOT EXISTS doc_pages (source_document_id INTEGER NOT NULL, page INTEGER NOT NULL, text TEXT NOT NULL, PRIMARY KEY (source_document_id, page))",
      "CREATE TABLE IF NOT EXISTS bill_verifications (slug TEXT PRIMARY KEY, level TEXT NOT NULL, verification_json TEXT NOT NULL, verified_at TEXT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS job_alternatives (job_id INTEGER PRIMARY KEY, alternatives_json TEXT NOT NULL)",
    ];
    for (const statement of statements) await db.execute(statement);
  })();
  return ready;
}

export async function findSlugByIdentity(house: string, number: number, year: number): Promise<string | null> {
  await ensureEngineTables();
  const rows = await createDatabaseClient().execute({ sql: "SELECT slug FROM bill_records WHERE house = ? AND bill_number = ? AND bill_year = ? ORDER BY created_at LIMIT 1", args: [house, number, year] });
  return rows.rows[0] ? String(rows.rows[0].slug) : null;
}

export async function saveRecord(input: { slug: string; kind: "bill" | "document"; bill: SansadBill | null; title: string; jobId: number }) {
  await ensureEngineTables();
  await createDatabaseClient().execute({
    sql: "INSERT INTO bill_records (slug, record_kind, house, bill_number, bill_year, title, bill_json, job_id, created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET bill_json = excluded.bill_json, title = excluded.title",
    args: [input.slug, input.kind, input.bill?.house ?? null, input.bill?.number ?? null, input.bill?.year ?? null, input.title, input.bill ? JSON.stringify(input.bill) : null, input.jobId, new Date().toISOString()],
  });
}

export async function savePages(sourceDocumentId: number, pages: string[]) {
  await ensureEngineTables();
  const db = createDatabaseClient();
  for (const [index, text] of pages.entries()) {
    await db.execute({ sql: "INSERT OR REPLACE INTO doc_pages (source_document_id, page, text) VALUES (?,?,?)", args: [sourceDocumentId, index + 1, text.replace(/\s+/g, " ").trim()] });
  }
}

export async function saveDocument(slug: string, doc: StoredDocument) {
  await ensureEngineTables();
  await createDatabaseClient().execute({
    sql: "INSERT OR REPLACE INTO bill_documents (slug, kind, label, url, source_document_id, page_count, readable) VALUES (?,?,?,?,?,?,?)",
    args: [slug, doc.kind, doc.label, doc.url, doc.sourceDocumentId, doc.pageCount, doc.readable ? 1 : 0],
  });
}

export async function saveVerification(slug: string, verification: Verification) {
  await ensureEngineTables();
  await createDatabaseClient().execute({
    sql: "INSERT OR REPLACE INTO bill_verifications (slug, level, verification_json, verified_at) VALUES (?,?,?,?)",
    args: [slug, verification.level, JSON.stringify(verification), verification.checkedAt],
  });
}

export async function saveAlternatives(jobId: number, alternatives: Alternative[]) {
  await ensureEngineTables();
  await createDatabaseClient().execute({ sql: "INSERT OR REPLACE INTO job_alternatives (job_id, alternatives_json) VALUES (?,?)", args: [jobId, JSON.stringify(alternatives)] });
}

export async function readAlternatives(jobId: number): Promise<Alternative[]> {
  await ensureEngineTables();
  const rows = await createDatabaseClient().execute({ sql: "SELECT alternatives_json FROM job_alternatives WHERE job_id = ?", args: [jobId] });
  return rows.rows[0] ? (JSON.parse(String(rows.rows[0].alternatives_json)) as Alternative[]) : [];
}

export type EngineRecord = {
  slug: string;
  kind: "bill" | "document";
  title: string;
  bill: SansadBill | null;
  verification: Verification | null;
  documents: StoredDocument[];
  jobId: number | null;
};

export async function readEngineRecord(slug: string): Promise<EngineRecord | null> {
  await ensureEngineTables();
  const db = createDatabaseClient();
  const record = await db.execute({ sql: "SELECT * FROM bill_records WHERE slug = ?", args: [slug] });
  if (!record.rows[0]) return null;
  const docs = await db.execute({ sql: "SELECT * FROM bill_documents WHERE slug = ? ORDER BY rowid", args: [slug] });
  const verification = await db.execute({ sql: "SELECT verification_json FROM bill_verifications WHERE slug = ?", args: [slug] });
  const row = record.rows[0];
  return {
    slug,
    kind: String(row.record_kind) as "bill" | "document",
    title: String(row.title),
    bill: row.bill_json ? (JSON.parse(String(row.bill_json)) as SansadBill) : null,
    verification: verification.rows[0] ? (JSON.parse(String(verification.rows[0].verification_json)) as Verification) : null,
    documents: docs.rows.map((doc) => ({ kind: String(doc.kind), label: String(doc.label), url: String(doc.url), sourceDocumentId: Number(doc.source_document_id), pageCount: Number(doc.page_count), readable: Number(doc.readable) === 1 })),
    jobId: row.job_id === null ? null : Number(row.job_id),
  };
}

export async function listEngineRecords(): Promise<EngineRecord[]> {
  await ensureEngineTables();
  const rows = await createDatabaseClient().execute("SELECT slug FROM bill_records ORDER BY created_at DESC");
  const records: EngineRecord[] = [];
  for (const row of rows.rows) {
    const record = await readEngineRecord(String(row.slug));
    if (record) records.push(record);
  }
  return records;
}

export async function readPages(sourceDocumentId: number): Promise<string[]> {
  await ensureEngineTables();
  const rows = await createDatabaseClient().execute({ sql: "SELECT page, text FROM doc_pages WHERE source_document_id = ? ORDER BY page", args: [sourceDocumentId] });
  const pages: string[] = [];
  for (const row of rows.rows) pages[Number(row.page) - 1] = String(row.text);
  return pages.map((text) => text ?? "");
}
