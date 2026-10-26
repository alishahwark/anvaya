import Link from "next/link";
import { ScoreSection } from "@/components/scoring/ScoreSection";
import { AskAnvaya } from "@/components/policy/AskAnvaya";
import { DocumentAnalysis } from "@/components/policy/DocumentAnalysis";
import { Shell } from "@/components/site/Shell";
import type { AnalysisView } from "@/lib/analysis/generate";
import type { EngineRecord } from "@/lib/engine/store";
import type { Check } from "@/lib/engine/verify-bill";
import { formatDate } from "@/lib/knowledge";
import { readableTitle } from "@/lib/research/record";

const ICON: Record<Check["status"], string> = { pass: "✓", fail: "!", unavailable: "–", info: "i" };

const LEVEL: Record<string, { chip: string; text: string }> = {
  corroborated: { chip: "a-chip a-chip--ok", text: "Verified · two official sources" },
  verified: { chip: "a-chip a-chip--ok", text: "Verified against official sources" },
  partly: { chip: "a-chip a-chip--soon", text: "Partly verified" },
  failed: { chip: "a-chip a-chip--bad", text: "Could not be verified" },
};

const KIND_ORDER = ["introduced", "passed_lok_sabha", "passed_rajya_sabha", "passed_both_houses", "errata", "committee_report", "gazette", "synopsis", "act_text"];

/** A record built by the verification engine: a bill, an Act, or an official document. */
export function VerifiedRecordPage({ record, analysis }: { record: EngineRecord; analysis: AnalysisView | null }) {
  const { bill, verification } = record;
  const title = readableTitle(record.title);
  const docOf = (kind: string) => record.documents.find((doc) => doc.kind === kind);
  const stage = verification?.stage;
  const stageChip = stage?.isLaw ? "a-chip a-chip--ok" : stage && ["negatived", "removed", "withdrawn"].includes(stage.code) ? "a-chip" : "a-chip a-chip--soon";

  const journey: Array<{ date: string; title: string; detail: string; doc?: string }> = [];
  if (bill) {
    if (bill.introducedDate) journey.push({ date: bill.introducedDate, title: `Introduced in the ${bill.house}`, detail: `${/private/i.test(bill.type) ? "Private member’s bill" : "Government bill"} · ${bill.category.toLowerCase()}${bill.ministry ? ` · ${bill.ministry.toLowerCase()} ministry` : ""}.`, doc: "introduced" });
    if (bill.committeeReferralDate) journey.push({ date: bill.committeeReferralDate, title: "Referred to a parliamentary committee", detail: "Parliament’s record shows the bill was sent to a committee for examination.", doc: "committee_report" });
    if (bill.committeeReportDate) journey.push({ date: bill.committeeReportDate, title: "Committee report presented", detail: "The committee’s report was presented to the House.", doc: "committee_report" });
    if (bill.passedLokSabha) journey.push({ date: bill.passedLokSabha, title: "Passed by the Lok Sabha", detail: "The Lok Sabha passed the bill.", doc: "passed_lok_sabha" });
    if (bill.passedRajyaSabha) journey.push({ date: bill.passedRajyaSabha, title: "Passed by the Rajya Sabha", detail: "The Rajya Sabha passed the bill.", doc: "passed_rajya_sabha" });
    if (bill.assentDate) journey.push({ date: bill.assentDate, title: bill.actNo && bill.actYear ? `President’s assent: Act No. ${bill.actNo} of ${bill.actYear}` : "President’s assent", detail: "The bill became an Act.", doc: docOf("gazette") ? "gazette" : "passed_both_houses" });
    journey.sort((a, b) => a.date.localeCompare(b.date));
  }

  const subject = stage?.isLaw ? "this Act" : "this bill";
  // Questions that read naturally for any document. The change titles are verb or noun phrases, so they are
  // introduced with "Explain this change:" rather than forced into a grammatical question.
  const first = stage?.isLaw ? "What does this Act do?" : "What does this bill propose to change?";
  const suggestions = analysis
    ? [first, ...analysis.changes.slice(0, 2).map((change) => `Explain this change: ${change.title.replace(/\.$/, "").replace(/^./, (c) => c.toUpperCase())}`), "When does it come into force?"]
    : [first, `Who is affected by ${subject}?`, "When does it come into force?"];

  return (
    <Shell>
      <div className="a-container">
        <nav className="a-crumbs" aria-label="Breadcrumb">
          <Link href="/explore">Explore</Link> / <span>{record.kind === "bill" ? "Bill" : "Document"}</span>
        </nav>

        <header className="a-policy-head">
          <span className="a-eyebrow">{bill ? `Parliament of India · ${bill.house} Bill No. ${bill.number} of ${bill.year}` : (record.documents[0] ? "Official document" : "Record")}</span>
          <h1 className="a-h1">{title}</h1>
          {stage ? (
            <div className="a-statusbar">
              <span className={stageChip} style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>{stage.label}</span>
              <p className="a-small" style={{ maxWidth: "46rem" }}>{stage.detail}</p>
            </div>
          ) : null}
          {verification ? (
            <div className="a-vbar">
              <span className={LEVEL[verification.level].chip}>{LEVEL[verification.level].text}</span>
              <span className="a-small" style={{ margin: 0 }}>Checked {formatDate(verification.checkedAt.slice(0, 10))} · <a className="a-link" href="#verification">see the checks</a></span>
            </div>
          ) : null}
        </header>

        <div className="a-narrow" style={{ marginInline: 0, maxWidth: "52rem" }}>
          {journey.length ? (
            <section className="a-block" aria-labelledby="h-journey">
              <span className="a-eyebrow">Where it stands</span>
              <h2 id="h-journey" className="a-h2">The legislative journey</h2>
              <ol className="a-journey" style={{ marginTop: "1rem" }}>
                {journey.map((event) => {
                  const doc = event.doc ? docOf(event.doc) : undefined;
                  return (
                    <li key={`${event.date}-${event.title}`}>
                      <time dateTime={event.date}>{formatDate(event.date)}</time>
                      <div>
                        <h3>{event.title}</h3>
                        <p>{event.detail}</p>
                        {doc ? <a className="a-link" style={{ fontSize: "0.85rem" }} href={doc.url} target="_blank" rel="noreferrer noopener">Open: {doc.label} ↗</a> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {verification?.commencement ? (
                <p className="a-small" style={{ marginTop: "1rem", maxWidth: "46rem" }}>
                  <strong>When it comes into force.</strong> The text says: “{verification.commencement.quote}” (page {verification.commencement.page}). Anvaya has not checked whether a start date has since been notified.
                </p>
              ) : null}
            </section>
          ) : null}

          <ScoreSection slug={record.slug} />

          <section className="a-block" aria-labelledby="h-analysis">
            <span className="a-eyebrow">In plain language</span>
            <h2 id="h-analysis" className="a-h2" style={{ marginBottom: "1.25rem" }}>What this {stage?.isLaw ? "Act" : "document"} says</h2>
            <DocumentAnalysis slug={record.slug} initial={analysis} />
          </section>

          <section id="ask" className="a-block" aria-labelledby="h-ask">
            <h2 id="h-ask" className="sr-only">Ask about this document</h2>
            <AskAnvaya policySlug={record.slug} policyName={stage?.isLaw ? "Act" : record.kind === "bill" ? "bill" : "document"} suggestions={suggestions} />
          </section>

          {verification ? (
            <section id="verification" className="a-block" aria-labelledby="h-verify">
              <span className="a-eyebrow">How we verified this</span>
              <h2 id="h-verify" className="a-h2">{verification.headline}</h2>
              <p className="a-prose a-muted">Each check below says what Anvaya looked at. A “–” means a check could not be run, which is shown rather than hidden.</p>
              <ol className="a-checks">
                {verification.checks.map((check) => (
                  <li key={check.id} className="a-check" data-status={check.status}>
                    <span className="a-check__icon" aria-hidden="true">{ICON[check.status]}</span>
                    <div>
                      <h3><span className="sr-only">{check.status === "pass" ? "Passed: " : check.status === "fail" ? "Failed: " : check.status === "unavailable" ? "Not available: " : "Note: "}</span>{check.label}</h3>
                      <p>{check.detail}</p>
                      {check.sources.length ? (
                        <p className="a-small">
                          Source: {check.sources.map((source, index) => (
                            <span key={source.url}>{index ? ", " : ""}<a className="a-link" href={source.url} target="_blank" rel="noreferrer noopener">{source.label} ↗</a></span>
                          ))}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
              <ul className="a-small" style={{ marginTop: "1rem", paddingLeft: "1.1rem", display: "grid", gap: "0.3rem" }}>
                {verification.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section id="documents" className="a-block" aria-labelledby="h-docs">
            <span className="a-eyebrow">Original documents</span>
            <h2 id="h-docs" className="a-h2">Read the official text</h2>
            <div className="a-docs" style={{ marginTop: "1rem" }}>
              {[...record.documents].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)).map((doc) => (
                <div key={doc.kind} className="a-doc">
                  <div>
                    <h3>{doc.label}</h3>
                    <p>{doc.readable ? `${doc.pageCount} ${doc.pageCount === 1 ? "page" : "pages"}` : "Text could not be read (scanned or not in English)"}{doc.kind === "act_text" ? " · from India Code" : " · from Digital Sansad"}</p>
                  </div>
                  <a className="a-btn a-btn--ghost" href={doc.url} target="_blank" rel="noreferrer noopener">Open original ↗</a>
                </div>
              ))}
            </div>
            <details className="a-about">
              <summary>About this record</summary>
              <div>
                <p>Anvaya looked the bill up in Parliament’s official register, downloaded every file Parliament lists for it, and ran the checks above. It is an independent student project and not an official service.</p>
                <p>Explanations are written by AI from the text of the official version of the document and checked against it. Anvaya never lets AI decide a bill’s stage; that comes from Parliament’s record.</p>
              </div>
            </details>
          </section>
        </div>
      </div>
    </Shell>
  );
}
