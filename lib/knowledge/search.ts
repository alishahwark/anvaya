import { tokenize } from "@/lib/ask/retrieval";
import { allKnowledge, legalStatus, todayIso } from "@/lib/knowledge";
import { listResearchRecords, readableTitle } from "@/lib/research/record";
import { listEngineRecords } from "@/lib/engine/store";
import { formatDate } from "@/lib/knowledge";

export type PolicyListing = {
  slug: string;
  title: string;
  summary: string;
  /** "reviewed" = hand-reviewed in depth. "verified" = passed the engine's official-source checks. "provisional" = fetched but not verified. */
  kind: "reviewed" | "verified" | "provisional";
  statusLabel: string;
  statusDetail: string;
  keywords: string;
};

/** Every policy Anvaya can show today, curated first. */
export async function listPolicies(): Promise<PolicyListing[]> {
  const today = todayIso();
  const curated: PolicyListing[] = allKnowledge().map((knowledge) => {
    const status = legalStatus(knowledge, today);
    return {
      slug: knowledge.slug,
      title: knowledge.title,
      summary: knowledge.purpose,
      kind: "reviewed",
      statusLabel: status.label,
      statusDetail: status.sentence,
      keywords: `${knowledge.title} ${knowledge.aliases.join(" ")} ${knowledge.ministry}`,
    };
  });
  const engine = await listEngineRecords().catch(() => []);
  const verified: PolicyListing[] = engine.map((record) => {
    const stage = record.verification?.stage;
    const ok = record.verification && (record.verification.level === "verified" || record.verification.level === "corroborated");
    return {
      slug: record.slug,
      title: readableTitle(record.title),
      summary: stage ? stage.detail : "An official record.",
      kind: ok ? "verified" : "provisional",
      statusLabel: stage?.label ?? "Stage not checked",
      statusDetail: record.bill ? `${record.bill.house} Bill No. ${record.bill.number} of ${record.bill.year}${record.bill.ministry ? ` · ${record.bill.ministry.toLowerCase()} ministry` : ""}` : record.documents[0]?.label ?? "",
      keywords: `${record.title} ${record.bill?.ministry ?? ""}`,
    };
  });
  const have = new Set(engine.map((record) => record.slug));
  // Records fetched before verification existed stay visible, clearly marked, until re-verified.
  const researched = (await listResearchRecords().catch(() => [])).filter((record) => !have.has(record.slug));
  const provisional: PolicyListing[] = researched.map((record) => {
    const latest = [...record.milestones].filter((milestone) => milestone.date).pop();
    return {
      slug: record.slug,
      title: record.title,
      summary: `A bill document retrieved from ${record.documents[0]?.publisher ?? "an official source"}.`,
      kind: "provisional",
      statusLabel: "Not verified",
      statusDetail: latest?.date ? `Sansad’s record lists: ${latest.label.toLowerCase()}, ${formatDate(latest.date)}.` : "Legal status not checked.",
      keywords: record.title,
    };
  });
  return [...curated, ...verified, ...provisional];
}

/** Ranks listings against a free-text query; returns [] when nothing relevant matches. */
export function matchPolicies(listings: PolicyListing[], query: string): PolicyListing[] {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return listings;
  return listings
    .map((listing) => {
      const haystack = new Set(tokenize(listing.keywords));
      const phrase = listing.keywords.toLowerCase();
      const wholeAlias = query.toLowerCase().includes("data protection") || query.toLowerCase().includes("dpdp") || query.toLowerCase().includes("privacy");
      const score = terms.filter((term) => haystack.has(term)).length + (wholeAlias && listing.kind === "reviewed" ? 1 : 0) + (terms.some((term) => term.length > 3 && phrase.includes(term)) ? 0.5 : 0);
      return { listing, score };
    })
    .filter((item) => item.score >= 1)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.listing);
}
