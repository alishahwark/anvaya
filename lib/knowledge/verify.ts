import type { PolicyKnowledge } from "./types";
import { loadPdfPages, pageContains } from "./pdf-text";

export type RefCheck = {
  claimId: string;
  doc: string;
  page: number;
  section: string;
  status: "supported" | "wrong_page" | "not_found" | "missing_document";
  /** When the quote is on a different page, where it actually is. */
  foundOnPages?: number[];
};

export type VerificationReport = {
  policy: string;
  checkedAt: string;
  totalRefs: number;
  supported: number;
  failures: RefCheck[];
  checks: RefCheck[];
};

/**
 * Mechanical evidence check: every quote must appear on the stated page of the
 * stated official PDF. This is stronger than "the citation ID exists" but still
 * weaker than human legal review: it proves the words are there, not that the
 * plain-language claim is a fair reading of them.
 */
export async function verifyKnowledge(knowledge: PolicyKnowledge): Promise<VerificationReport> {
  const docs = new Map(knowledge.documents.map((document) => [document.key, document]));
  const checks: RefCheck[] = [];
  for (const claim of knowledge.claims) {
    for (const ref of claim.evidence) {
      const document = docs.get(ref.doc);
      const base = { claimId: claim.id, doc: ref.doc, page: ref.page, section: ref.section };
      if (!document) {
        checks.push({ ...base, status: "missing_document" });
        continue;
      }
      let pages: string[];
      try {
        pages = await loadPdfPages(document.localFile);
      } catch {
        checks.push({ ...base, status: "missing_document" });
        continue;
      }
      const onStatedPage = pages[ref.page - 1] !== undefined && pageContains(pages[ref.page - 1], ref.quote);
      if (onStatedPage) {
        checks.push({ ...base, status: "supported" });
        continue;
      }
      const found = pages.flatMap((text, index) => (pageContains(text, ref.quote) ? [index + 1] : []));
      checks.push({ ...base, status: found.length ? "wrong_page" : "not_found", foundOnPages: found });
    }
  }
  const failures = checks.filter((check) => check.status !== "supported");
  return { policy: knowledge.slug, checkedAt: new Date().toISOString(), totalRefs: checks.length, supported: checks.length - failures.length, failures, checks };
}
