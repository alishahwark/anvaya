"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnalysisActivity } from "@/components/agents/AnalysisActivity";
import { dpdpStakeholderBaseline } from "@/lib/policies/dpdp-stakeholders";

type Stakeholder = { name?: string; whatChanges?: string; timing?: string; implications?: string; uncertainty?: string; provisions?: string; sourceTitle?: string; sourceUrl?: string; benefits?: string[]; costs?: string[]; evidenceGaps?: string[] };
type AnalysisState = { execution?: { model: string; inputTokens: number | null; outputTokens: number | null; durationMs: number }; evidenceValidation?: { stage1?: { citationIdsExist: boolean }; stage2?: { status: string } } } | null;

export function ImpactExplorer({ policySlug }: { policySlug: string }) {
  const baseline: Stakeholder[] = policySlug === "dpdp-act-2023" ? dpdpStakeholderBaseline : [];
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(baseline);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisState>(null);

  async function analyze() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/interpret", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ policySlug, mode: "impact", question: "Identify stakeholder impacts from the selected policy register. Separate evidence from analysis and do not invent numbers." }) });
      const body = await response.json() as { result?: { stakeholders?: Stakeholder[] }; execution?: AnalysisState extends { execution?: infer T } ? T : never; evidenceValidation?: AnalysisState extends { evidenceValidation?: infer T } ? T : never; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Optional AI analysis is unavailable.");
      if (!body.result?.stakeholders?.length) throw new Error("The optional analysis returned no usable stakeholder findings.");
      setStakeholders(body.result.stakeholders); setSelected(0); setAnalysis({ execution: body.execution, evidenceValidation: body.evidenceValidation });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Optional AI analysis is unavailable. The source-backed baseline remains available."); }
    finally { setLoading(false); }
  }

  const stakeholder = stakeholders[selected];
  return <div className="rounded-3xl border border-[#bbc9bf] bg-white p-7"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="eyebrow">Stakeholder analysis</p><h2 className="mt-2 text-3xl">Who could be affected?</h2><p className="sans mt-2 text-sm text-[#60716c]">{baseline.length ? "Source-backed statutory baseline. Practical effects remain distinct from legal obligations." : "A policy-specific analysis is unavailable until this record has supporting evidence."}</p></div><Button aria-label="Analyze stakeholders" onClick={analyze} disabled={loading}>{loading ? "Analyzing…" : "Optional AI analysis"}</Button></div><div className="mt-5"><AnalysisActivity active={loading} agent="Optional stakeholder analysis" execution={analysis?.execution} validation={analysis?.evidenceValidation} /></div>{message && <p role="status" className="sans mt-5 rounded-xl bg-[#f0eee4] p-4 text-sm">{message}</p>}{stakeholders.length > 0 && <div className="mt-7 grid gap-6 md:grid-cols-[.35fr_.65fr]"><div className="flex flex-wrap gap-2 md:flex-col">{stakeholders.map((item, index) => <button key={item.name ?? index} onClick={() => setSelected(index)} className={`rounded-xl px-4 py-3 text-left sans text-sm font-bold ${selected === index ? "bg-[#19342e] text-white" : "bg-[#f0eee4]"}`}>{item.name ?? `Stakeholder ${index + 1}`}</button>)}</div>{stakeholder && <div className="space-y-5"><div><p className="eyebrow">What changes</p><p className="mt-1 text-sm leading-6">{stakeholder.whatChanges ?? stakeholder.benefits?.join(" ") ?? "Not established by the supplied register."}</p></div><div><p className="eyebrow">When</p><p className="mt-1 text-sm leading-6">{stakeholder.timing ?? "Timing is not verified."}</p></div><div><p className="eyebrow">Practical implications</p><p className="mt-1 text-sm leading-6">{stakeholder.implications ?? stakeholder.costs?.join(" ") ?? "Not established by the supplied register."}</p></div><div><p className="eyebrow">What remains unknown</p><p className="mt-1 text-sm leading-6 text-[#60716c]">{stakeholder.uncertainty ?? stakeholder.evidenceGaps?.join(" ") ?? "Not established by the supplied register."}</p></div><div className="border-t border-[#d8ded5] pt-4"><p className="sans text-xs text-[#60716c]">Relevant provisions: {stakeholder.provisions ?? "Not available"}</p>{stakeholder.sourceUrl && <a href={stakeholder.sourceUrl} target="_blank" rel="noreferrer" className="sans mt-2 inline-block text-xs font-bold text-[#267c76] underline">Open supporting document ↗</a>}</div></div>}</div>}</div>;
}
