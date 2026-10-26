import { readEngineRecord, readPages } from "@/lib/engine/store";
import { getKnowledge } from "@/lib/knowledge";
import { loadPdfPages } from "@/lib/knowledge/pdf-text";
import type { FeatureInput } from "@/lib/scoring/features";

/** The version of a bill that is authoritative, in order of preference. */
const PRIMARY_ORDER = ["act_text", "passed_both_houses", "passed_rajya_sabha", "passed_lok_sabha", "introduced"];

export type LoadedInput = { input: FeatureInput; title: string; basis: string; kind: "bill" | "act" | "document" };

/** Gathers the official text for a policy: from the engine's stored pages, or the curated PDFs. */
export async function loadFeatureInput(slug: string): Promise<LoadedInput | null> {
  const curated = getKnowledge(slug);
  if (curated) {
    const act = curated.documents.find((doc) => doc.key === "act");
    if (!act) return null;
    return { input: { label: curated.title, pages: await loadPdfPages(act.localFile), introducedPages: null, committeeReferral: null }, title: curated.title, basis: `${act.title} (as enacted)`, kind: "act" };
  }
  const record = await readEngineRecord(slug);
  if (!record) return null;
  const primary = PRIMARY_ORDER.map((kind) => record.documents.find((doc) => doc.kind === kind && doc.readable)).find(Boolean);
  if (!primary) return null;
  const introduced = record.documents.find((doc) => doc.kind === "introduced" && doc.readable);
  return {
    input: {
      label: record.title,
      pages: await readPages(primary.sourceDocumentId),
      introducedPages: introduced ? await readPages(introduced.sourceDocumentId) : null,
      committeeReferral: record.bill ? Boolean(record.bill.committeeReferralDate) : null,
    },
    title: record.title,
    basis: primary.label,
    kind: record.kind === "bill" ? "bill" : "document",
  };
}
