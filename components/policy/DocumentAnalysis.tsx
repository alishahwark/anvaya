"use client";

import { useEffect, useRef, useState } from "react";
import { Evidence } from "@/components/policy/Evidence";
import { StakeholderExplorer } from "@/components/policy/StakeholderExplorer";
import type { AnalysisOutcome, AnalysisView } from "@/lib/analysis/generate";

type State = { phase: "loading" } | { phase: "ready"; analysis: AnalysisView } | { phase: "message"; text: string };

/**
 * The same analysis as the curated page (brief, what changes, who is affected), written by AI
 * from the retrieved document and checked statement by statement. Generated once, then cached.
 */
export function DocumentAnalysis({ slug, initial }: { slug: string; initial: AnalysisView | null }) {
  const [state, setState] = useState<State>(initial ? { phase: "ready", analysis: initial } : { phase: "loading" });
  const started = useRef(false);

  async function load() {
    setState({ phase: "loading" });
    try {
      const response = await fetch("/api/analysis", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ policySlug: slug }) });
      const body = (await response.json()) as AnalysisOutcome & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Something went wrong.");
      setState(body.status === "ready" ? { phase: "ready", analysis: body.analysis } : { phase: "message", text: body.message });
    } catch (error) {
      setState({ phase: "message", text: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  useEffect(() => {
    if (initial || started.current) return;
    started.current = true;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.phase === "loading") {
    return (
      <p className="a-prose" role="status" aria-live="polite">
        <span className="a-spinner" aria-hidden="true" />
        Reading the document and checking each statement against it. This takes about 30 seconds the first time; the result is then saved.
      </p>
    );
  }
  if (state.phase === "message") {
    return (
      <div className="a-card">
        <p style={{ margin: 0 }}>{state.text}</p>
        <button type="button" className="a-btn a-btn--ghost" style={{ marginTop: "1rem" }} onClick={() => void load()}>Try again</button>
      </div>
    );
  }

  const { analysis } = state;
  const unclear = analysis.verification.dropped + analysis.verification.partly;
  return (
    <div>
      <p className="a-small" style={{ marginBottom: "1rem" }}>
        <span className="a-chip a-chip--reading">AI reading of the document, not the law</span>{" "}
        Written from the retrieved text only. {analysis.verification.supported} of {analysis.verification.checked} statements were fully supported by the passages they cite{analysis.verification.quoted !== undefined ? `, and ${analysis.verification.quoted} carry a quote found word for word in the official text` : ""}
        {analysis.verification.dropped ? `; ${analysis.verification.dropped} unsupported ${analysis.verification.dropped === 1 ? "statement was" : "statements were"} left out` : ""}
        {analysis.verification.partly ? `; ${analysis.verification.partly} marked “check the source”` : ""}.
      </p>

      <p className="a-brief">{analysis.brief.text}</p>
      <Evidence items={analysis.brief.evidence} />

      {analysis.changes.length ? (
        <>
          <h3 className="a-h3" style={{ margin: "2.5rem 0 1rem" }}>What it would change</h3>
          <div className="a-changes">
            {analysis.changes.map((change) => (
              <article key={change.title} className="a-change">
                <div className="a-change__top">
                  <h3 className="a-h3">{change.title}</h3>
                  {change.caution ? <span className="a-chip a-chip--soon">Check the source</span> : null}
                </div>
                <p>{change.text}</p>
                <Evidence items={change.evidence} />
              </article>
            ))}
          </div>
        </>
      ) : null}

      {analysis.groups.length ? (
        <>
          <h3 className="a-h3" style={{ margin: "2.5rem 0 1rem" }}>Who is affected</h3>
          <StakeholderExplorer
            groups={analysis.groups.map((group) => ({
              id: group.id,
              label: group.label,
              prompt: "If you are in this group",
              headline: `What the text says about ${group.label.toLowerCase()}`,
              openQuestions: [],
              points: group.points.map((point) => ({ kind: "our_reading" as const, text: point.text, evidence: point.evidence })),
            }))}
          />
        </>
      ) : null}

      {analysis.uncertainties.length ? (
        <div className="a-open" style={{ marginTop: "2rem" }}>
          <h4>What the text does not settle</h4>
          <ul>
            {analysis.uncertainties.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {unclear ? <p className="a-small" style={{ marginTop: "1rem" }}>Statements marked “Check the source” go slightly beyond what the cited passage says.</p> : null}
    </div>
  );
}
