import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CuratedPolicyPage } from "@/components/policy/CuratedPolicyPage";
import { ResearchRecordPage } from "@/components/policy/ResearchRecordPage";
import { VerifiedRecordPage } from "@/components/policy/VerifiedRecordPage";
import { readEngineRecord } from "@/lib/engine/store";
import { readCachedAnalysis } from "@/lib/analysis/generate";
import { getKnowledge, todayIso } from "@/lib/knowledge";
import { canonicalResearchSlug, getResearchRecord } from "@/lib/research/record";

// Status is computed against today's date, so this page is rendered per request.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const knowledge = getKnowledge(slug);
  if (knowledge) return { title: `${knowledge.shortTitle} explained — Anvaya`, description: knowledge.purpose };
  const engine = await readEngineRecord(slug).catch(() => null);
  if (engine) return { title: `${engine.title} — Anvaya` };
  const record = await getResearchRecord(slug).catch(() => null);
  return { title: record ? `${record.title} — Anvaya` : "Policy — Anvaya" };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const knowledge = getKnowledge(slug);
  if (knowledge) return <CuratedPolicyPage knowledge={knowledge} asOf={todayIso()} />;

  const engine = await readEngineRecord(slug);
  if (engine) return <VerifiedRecordPage record={engine} analysis={await readCachedAnalysis(slug)} />;

  const canonical = await canonicalResearchSlug(slug);
  if (canonical && canonical !== slug) redirect(`/policies/${canonical}`);
  const record = await getResearchRecord(slug);
  if (!record) notFound();
  return <ResearchRecordPage record={record} analysis={await readCachedAnalysis(slug)} />;
}
