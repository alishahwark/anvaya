import { createDatabaseClient } from "@/lib/db/config";

export type ResearchMilestone = { date: string | null; type: string; label: string };
export type ResearchDocument = { id: number; title: string; publisher: string; sourceType: string; url: string; retrievedAt: string; pagesIndexed: number };
export type ResearchRecord = {
  slug: string;
  jobId: number;
  title: string;
  query: string;
  documents: ResearchDocument[];
  milestones: ResearchMilestone[];
  /** Other slugs created by repeated searches that point at the same documents. */
  aliasSlugs: string[];
};

const MILESTONE_LABELS: Record<string, string> = {
  introduced: "Introduced in Parliament",
  passed_lok_sabha: "Passed by the Lok Sabha",
  passed_rajya_sabha: "Passed by the Rajya Sabha",
  presidential_assent: "Received the President’s assent",
};

/** Sansad sometimes returns DD/MM/YYYY; everything else in Anvaya uses ISO dates. */
export function normalizeSansadDate(value: string | null): string | null {
  if (!value) return null;
  const slash = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`;
  const iso = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : null;
}

/** "THE WAQF (AMENDMENT) BILL, 2025" → "The Waqf (Amendment) Bill, 2025". */
export function readableTitle(title: string): string {
  const letters = title.replace(/[^A-Za-z]/g, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (!letters.length || upper / letters.length < 0.8) return title.trim();
  const small = new Set(["of", "and", "the", "in", "for", "to", "on", "by", "at", "or", "with"]);
  return title
    .toLowerCase()
    .replace(/\b[a-z][a-z']*/g, (word, index: number) => (index > 0 && small.has(word) ? word : word[0].toUpperCase() + word.slice(1)))
    .trim();
}

const SLUG_JOB = /-research-(\d+)$/;

/** The earliest job that retrieved the same document owns the canonical record. */
export async function canonicalResearchSlug(slug: string): Promise<string | null> {
  const match = slug.match(SLUG_JOB);
  if (!match) return null;
  const db = createDatabaseClient();
  const own = await db.execute({ sql: "SELECT source_document_id FROM research_job_documents WHERE job_id = ? ORDER BY id LIMIT 1", args: [Number(match[1])] });
  const documentId = own.rows[0]?.source_document_id;
  if (documentId === undefined) return slug;
  const canonical = await db.execute({
    sql: "SELECT j.result_policy_slug AS slug FROM research_job_documents d JOIN research_jobs j ON j.id = d.job_id WHERE d.source_document_id = ? AND j.result_policy_slug IS NOT NULL ORDER BY d.job_id LIMIT 1",
    args: [documentId],
  });
  return canonical.rows[0]?.slug ? String(canonical.rows[0].slug) : slug;
}

export async function getResearchRecord(slug: string): Promise<ResearchRecord | null> {
  const match = slug.match(SLUG_JOB);
  if (!match) return null;
  const jobId = Number(match[1]);
  const db = createDatabaseClient();
  const job = await db.execute({ sql: "SELECT * FROM research_jobs WHERE id = ?", args: [jobId] });
  if (!job.rows[0] || String(job.rows[0].result_policy_slug ?? "") !== slug) return null;
  const documentRows = await db.execute({
    sql: "SELECT d.source_document_id AS id, s.title, s.publisher, s.source_type, d.source_url, d.retrieved_at, (SELECT COUNT(*) FROM source_excerpts e WHERE e.source_document_id = d.source_document_id) AS pages FROM research_job_documents d JOIN source_documents s ON s.id = d.source_document_id WHERE d.job_id = ? ORDER BY d.id",
    args: [jobId],
  });
  const eventRows = await db.execute({ sql: "SELECT event_type, event_date FROM research_job_events WHERE job_id = ? ORDER BY id", args: [jobId] });
  const seen = new Set<string>();
  const milestones: ResearchMilestone[] = [];
  for (const row of eventRows.rows) {
    const type = String(row.event_type);
    const date = normalizeSansadDate(row.event_date ? String(row.event_date) : null);
    const key = `${type}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    milestones.push({ date, type, label: MILESTONE_LABELS[type] ?? type.replaceAll("_", " ") });
  }
  milestones.sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  const documents: ResearchDocument[] = documentRows.rows.map((row) => ({
    id: Number(row.id),
    title: readableTitle(String(row.title)),
    publisher: String(row.publisher),
    sourceType: String(row.source_type),
    url: String(row.source_url),
    retrievedAt: String(row.retrieved_at),
    pagesIndexed: Number(row.pages),
  }));
  const aliases = documents[0]
    ? await db.execute({
        sql: "SELECT DISTINCT j.result_policy_slug AS slug FROM research_job_documents d JOIN research_jobs j ON j.id = d.job_id WHERE d.source_document_id = ? AND j.result_policy_slug IS NOT NULL AND j.result_policy_slug <> ?",
        args: [documents[0].id, slug],
      })
    : { rows: [] };
  return {
    slug,
    jobId,
    title: documents[0]?.title ?? String(job.rows[0].query),
    query: String(job.rows[0].query),
    documents,
    milestones,
    aliasSlugs: aliases.rows.map((row) => String(row.slug)),
  };
}

/** One entry per researched document, for the Explore list. */
export async function listResearchRecords(): Promise<ResearchRecord[]> {
  const db = createDatabaseClient();
  const jobs = await db.execute({ sql: "SELECT result_policy_slug AS slug FROM research_jobs WHERE result_policy_slug IS NOT NULL ORDER BY id", args: [] });
  const records: ResearchRecord[] = [];
  const seenDocuments = new Set<number>();
  for (const row of jobs.rows) {
    const record = await getResearchRecord(String(row.slug));
    if (!record || !record.documents.length) continue;
    if (seenDocuments.has(record.documents[0].id)) continue;
    seenDocuments.add(record.documents[0].id);
    records.push(record);
  }
  return records;
}
