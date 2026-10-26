import Link from "next/link";
import { AskAnvaya } from "@/components/policy/AskAnvaya";
import { DocumentAnalysis } from "@/components/policy/DocumentAnalysis";
import type { AnalysisView } from "@/lib/analysis/generate";
import { Shell } from "@/components/site/Shell";
import { formatDate } from "@/lib/knowledge";
import type { ResearchRecord } from "@/lib/research/record";

/**
 * Provisional record for a policy that Anvaya found by autonomous research.
 * Nothing here is presented as verified legal status.
 */
export function ResearchRecordPage({ record, analysis }: { record: ResearchRecord; analysis: AnalysisView | null }) {
  const document = record.documents[0];
  return (
    <Shell>
      <div className="a-container">
        <nav className="a-crumbs" aria-label="Breadcrumb">
          <Link href="/explore">Explore</Link> / <span>Provisional record</span>
        </nav>

        <header className="a-policy-head">
          <span className="a-eyebrow">Found by Anvaya’s research · {document?.publisher ?? "Official source"}</span>
          <h1 className="a-h1">{record.title}</h1>
          <div className="a-statusbar">
            <span className="a-chip" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>Not independently verified</span>
            <p className="a-small">
              Anvaya retrieved this document from the official source. It has not checked the bill’s current legal status.
            </p>
          </div>
        </header>

        <div className="a-narrow" style={{ marginInline: 0, maxWidth: "52rem" }}>
          <section className="a-block" aria-labelledby="h-analysis">
            <span className="a-eyebrow">In plain language</span>
            <h2 id="h-analysis" className="a-h2" style={{ marginBottom: "1.25rem" }}>What this document says</h2>
            <DocumentAnalysis slug={record.slug} initial={analysis} />
          </section>

          <section className="a-block" aria-labelledby="h-record">
            <span className="a-eyebrow">What Parliament’s record shows</span>
            <h2 id="h-record" className="a-h2">Milestones reported by the source</h2>
            {record.milestones.length ? (
              <ol className="a-journey" style={{ marginTop: "1rem" }}>
                {record.milestones.map((milestone) => (
                  <li key={`${milestone.type}-${milestone.date}`}>
                    <time dateTime={milestone.date ?? undefined}>{milestone.date ? formatDate(milestone.date) : "Date not given"}</time>
                    <div>
                      <h3>{milestone.label}</h3>
                      <p>As reported in the Sansad bill record. Not verified by Anvaya.</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="a-prose a-muted">The source record gave no milestones, so Anvaya cannot say where this bill stands.</p>
            )}
          </section>

          <section id="ask" className="a-block" aria-labelledby="h-ask">
            <h2 id="h-ask" className="sr-only">Ask about this document</h2>
            <AskAnvaya
              policySlug={record.slug}
              policyName="document"
              suggestions={["What does this bill propose to change?", "Who would be affected by this bill?", "What are the main definitions in this bill?"]}
            />
            <p className="a-small" style={{ marginTop: "1rem" }}>
              These answers are written by AI from the text of the retrieved document only, then checked against it. They explain what the document says; they do not say whether it is in force.
            </p>
          </section>

          <section className="a-block" aria-labelledby="h-docs">
            <span className="a-eyebrow">Original document</span>
            <h2 id="h-docs" className="a-h2">Read it yourself</h2>
            <div className="a-docs" style={{ marginTop: "1rem" }}>
              {record.documents.map((item) => (
                <div key={item.id} className="a-doc">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.sourceType} · {item.publisher} · retrieved {formatDate(item.retrievedAt.slice(0, 10))} · {item.pagesIndexed} {item.pagesIndexed === 1 ? "page" : "pages"} indexed</p>
                  </div>
                  <a className="a-btn a-btn--ghost" href={item.url} target="_blank" rel="noreferrer noopener">Open original ↗</a>
                </div>
              ))}
            </div>
            <details className="a-about">
              <summary>How this record was made</summary>
              <div>
                <p>
                  A search for “{record.query}” checked official sources, downloaded this document, stored a fingerprint of it, and indexed its text. Searching again finds the same record instead of creating a copy.
                </p>
                <p>
                  Milestones come from the source’s own record and are shown as reported. Anvaya never changes a legal status automatically.
                </p>
              </div>
            </details>
          </section>
        </div>
      </div>
    </Shell>
  );
}
