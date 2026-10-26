import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { claimMap, documentMap, evidenceUrl } from "./index";
import type { PolicyKnowledge } from "./types";
import type { VerificationReport } from "./verify";

/** A citation ready to render: no IDs, hashes or enums, just what a reader needs. */
export type ResolvedEvidence = {
  label: string;
  section: string;
  page: number;
  quote: string;
  url: string;
  /** True when the quote was found on this page of the official PDF in the last verification run. */
  verified: boolean;
};

export function loadVerificationReport(slug: string): VerificationReport | null {
  const path = resolve(process.cwd(), "data/knowledge", `${slug.split("-")[0]}-claim-verification.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as VerificationReport;
  } catch {
    return null;
  }
}

export function resolveEvidence(knowledge: PolicyKnowledge, claimIds: string[], report: VerificationReport | null): ResolvedEvidence[] {
  const claims = claimMap(knowledge);
  const documents = documentMap(knowledge);
  const failed = new Set((report?.failures ?? []).map((failure) => `${failure.claimId}|${failure.doc}|${failure.page}|${failure.section}`));
  const seen = new Set<string>();
  const items: ResolvedEvidence[] = [];
  for (const claimId of claimIds) {
    const claim = claims.get(claimId);
    if (!claim) continue;
    for (const ref of claim.evidence) {
      const document = documents.get(ref.doc);
      if (!document) continue;
      const key = `${ref.doc}|${ref.page}|${ref.quote}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        label: `${document.identifier ?? document.title}, page ${ref.page}`,
        section: ref.section,
        page: ref.page,
        quote: ref.quote.replace(/\s+/g, " ").trim(),
        url: evidenceUrl(document, ref.page),
        verified: report !== null && !failed.has(`${claimId}|${ref.doc}|${ref.page}|${ref.section}`),
      });
    }
  }
  return items;
}
