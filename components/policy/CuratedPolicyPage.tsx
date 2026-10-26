import Link from "next/link";
import { ScoreSection } from "@/components/scoring/ScoreSection";
import { AskAnvaya } from "@/components/policy/AskAnvaya";
import { Evidence } from "@/components/policy/Evidence";
import { StakeholderExplorer, type ExplorerGroup } from "@/components/policy/StakeholderExplorer";
import { Shell } from "@/components/site/Shell";
import { formatDate, legalStatus, phaseCountdown, phaseState, phaseWhen } from "@/lib/knowledge";
import type { PolicyKnowledge } from "@/lib/knowledge";
import { loadVerificationReport, resolveEvidence } from "@/lib/knowledge/resolve";

const sections = [
  { id: "overview", label: "In short" },
  { id: "changes", label: "What changes" },
  { id: "timing", label: "When it applies" },
  { id: "affected", label: "Who is affected" },
  { id: "ask", label: "Ask a question" },
  { id: "watch", label: "Things to watch" },
  { id: "documents", label: "Original documents" },
];

/** Full citizen research page for a policy that has curated, source-verified knowledge. */
export function CuratedPolicyPage({ knowledge, asOf }: { knowledge: PolicyKnowledge; asOf: string }) {
  const report = loadVerificationReport(knowledge.slug);
  const status = legalStatus(knowledge, asOf);
  const evidenceFor = (claimIds: string[]) => resolveEvidence(knowledge, claimIds, report);
  const phaseById = new Map(knowledge.phases.map((phase) => [phase.id, phase]));

  const groups: ExplorerGroup[] = knowledge.stakeholders.map((stakeholder) => ({
    id: stakeholder.id,
    label: stakeholder.label,
    prompt: stakeholder.prompt,
    headline: stakeholder.headline,
    openQuestions: stakeholder.openQuestions,
    points: stakeholder.implications.map((implication) => {
      const phase = implication.phaseId ? phaseById.get(implication.phaseId) : undefined;
      return {
        kind: implication.kind,
        text: implication.text,
        when: phase ? phaseWhen(phase, asOf) : undefined,
        whenState: phase ? phaseState(phase, asOf) : undefined,
        evidence: evidenceFor(implication.claimIds),
      };
    }),
  }));

  const suggestions = knowledge.baselineAnswers
    .filter((answer) => !answer.validThrough || answer.validThrough >= asOf)
    .slice(0, 4)
    .map((answer) => answer.question);

  return (
    <Shell>
      <div className="a-container">
        <nav className="a-crumbs" aria-label="Breadcrumb">
          <Link href="/explore">Explore</Link> / <span>{knowledge.shortTitle}</span>
        </nav>

        <header className="a-policy-head">
          <span className="a-eyebrow">{knowledge.ministry}</span>
          <h1 className="a-h1">{knowledge.title}</h1>
          <div className="a-statusbar">
            <span className="a-chip a-chip--soon" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>{status.label}</span>
            <p className="a-small">{status.sentence}</p>
          </div>
          <p className="a-small" style={{ marginTop: "0.5rem" }}>
            {knowledge.identifier} · Sources last checked {formatDate(knowledge.lastChecked)} · <a className="a-link" href="#documents">{knowledge.documents.length} official documents</a>
          </p>
        </header>

        <div className="a-layout">
          <div>
            {/* 1 · In short */}
            <section id="overview" className="a-block" aria-labelledby="h-overview">
              <span className="a-eyebrow">In short</span>
              <h2 id="h-overview" className="sr-only">In short</h2>
              <p className="a-brief">{knowledge.brief}</p>
              <ol className="a-tracker" aria-label="When the Act switches on">
                {knowledge.phases.map((phase) => {
                  const state = phaseState(phase, asOf);
                  return (
                    <li key={phase.id} data-state={state}>
                      <div className="a-tracker__date">{formatDate(phase.date)}</div>
                      <span className={`a-tracker__when ${state === "in_force" ? "a-tracker__when--ok" : "a-tracker__when--soon"}`}>
                        {state === "in_force" ? "✓ In force now" : `Starts ${phaseCountdown(phase, asOf)}`}
                      </span>
                      <p className="a-tracker__label">{phase.label}</p>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* 2 · What changes */}
            <ScoreSection slug={knowledge.slug} />

            <section id="changes" className="a-block" aria-labelledby="h-changes">
              <span className="a-eyebrow">What changes</span>
              <h2 id="h-changes" className="a-h2">Five things the Act changes</h2>
              <div className="a-changes">
                {knowledge.whatChanges.map((change) => {
                  const phase = phaseById.get(change.phaseId);
                  return (
                    <article key={change.id} className="a-change">
                      <div className="a-change__top">
                        <h3 className="a-h3">{change.title}</h3>
                        {phase ? <span className={`a-chip ${phaseState(phase, asOf) === "in_force" ? "a-chip--ok" : "a-chip--soon"}`}>{phaseState(phase, asOf) === "in_force" ? `In force since ${formatDate(phase.date)}` : `From ${formatDate(phase.date)}`}</span> : null}
                      </div>
                      <p>{change.body}</p>
                      <Evidence items={evidenceFor(change.claimIds)} />
                    </article>
                  );
                })}
              </div>
            </section>

            {/* 3 · When it applies */}
            <section id="timing" className="a-block" aria-labelledby="h-timing">
              <span className="a-eyebrow">When it applies</span>
              <h2 id="h-timing" className="a-h2">The Act switches on in three steps</h2>
              <p className="a-prose a-muted" style={{ marginBottom: "1.5rem" }}>
                Section 1(2) lets the Government bring different sections into force on different dates. The Rules, which hold the practical detail, have their own separate schedule.
              </p>
              {knowledge.phases.map((phase, index) => {
                const rulesPhase = knowledge.rulesPhases[index];
                const state = phaseState(phase, asOf);
                return (
                  <article key={phase.id} className="a-phase">
                    <div className="a-phase__head">
                      <h3 className="a-h3">{formatDate(phase.date)} · {phase.label}</h3>
                      <span className={`a-chip ${state === "in_force" ? "a-chip--ok" : "a-chip--soon"}`}>{phaseWhen(phase, asOf)}</span>
                    </div>
                    <p style={{ margin: "0.75rem 0 0", maxWidth: "42rem" }}>{phase.summary}</p>
                    <ul>
                      {phase.whatBegins.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <dl className="a-kv">
                      <dt>Who should care</dt>
                      <dd>{phase.whoShouldCare}</dd>
                      <dt>Sections of the Act</dt>
                      <dd>{phase.actProvisions}</dd>
                      <dt>Rules</dt>
                      <dd>
                        {rulesPhase?.rules} <span className="a-muted">— {rulesPhase?.plain}</span>
                      </dd>
                    </dl>
                    <Evidence items={evidenceFor([...phase.claimIds, ...(rulesPhase?.claimIds ?? [])])} />
                  </article>
                );
              })}

              <h3 className="a-h3" style={{ marginTop: "3rem" }}>How the law got here</h3>
              <ol className="a-journey" style={{ marginTop: "1rem" }}>
                {knowledge.events.map((event) => (
                  <li key={`${event.date}-${event.title}`}>
                    <time dateTime={event.date}>{formatDate(event.date)}</time>
                    <div>
                      <h3>{event.title}</h3>
                      <p>{event.detail}</p>
                      <Evidence items={evidenceFor(event.claimIds)} />
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* 4 · Who is affected */}
            <section id="affected" className="a-block" aria-labelledby="h-affected">
              <span className="a-eyebrow">Who is affected</span>
              <h2 id="h-affected" className="a-h2">What it means for you</h2>
              <p className="a-prose a-muted" style={{ marginBottom: "1.5rem" }}>
                Choose the group closest to you. Each point is marked as what the law says or as our own reading, and opens the exact passage behind it.
              </p>
              <StakeholderExplorer groups={groups} />
            </section>

            {/* 5 · Ask */}
            <section id="ask" className="a-block" aria-labelledby="h-ask" style={{ borderTop: 0 }}>
              <h2 id="h-ask" className="sr-only">Ask a question</h2>
              <AskAnvaya placeholder="For example: do I need consent to email my customers?" policySlug={knowledge.slug} policyName={knowledge.shortTitle} suggestions={suggestions} />
            </section>

            {/* 6 · Things to watch */}
            <section id="watch" className="a-block" aria-labelledby="h-watch">
              <span className="a-eyebrow">Things to watch</span>
              <h2 id="h-watch" className="a-h2">What we could not confirm</h2>
              <div className="a-watch">
                {knowledge.watch.map((item) => (
                  <article key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    {item.sources.length ? (
                      <ul>
                        {item.sources.map((source) => (
                          <li key={source.url}>
                            <a className="a-link" href={source.url} target="_blank" rel="noreferrer noopener">{source.label} ↗</a> <span className="a-muted">({source.official ? "official" : "secondary source, not official"})</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            {/* 7 · Documents */}
            <section id="documents" className="a-block" aria-labelledby="h-docs">
              <span className="a-eyebrow">Original documents</span>
              <h2 id="h-docs" className="a-h2">Read the official text</h2>
              <p className="a-prose a-muted" style={{ marginBottom: "1.5rem" }}>
                Every document below was downloaded from the Ministry of Electronics and Information Technology. Newer documents modify older ones, so read them together.
              </p>
              <div className="a-docs">
                {[...knowledge.documents]
                  .sort((a, b) => a.publishedDate.localeCompare(b.publishedDate))
                  .map((document) => (
                    <div key={document.key} className="a-doc">
                      <div>
                        <h3>{document.title}{document.identifier ? ` · ${document.identifier}` : ""}</h3>
                        <p>{document.kind} · {formatDate(document.publishedDate)}. {document.whyItMatters}</p>
                      </div>
                      <a className="a-btn a-btn--ghost" href={document.url} target="_blank" rel="noreferrer noopener">
                        Open the PDF ↗
                      </a>
                    </div>
                  ))}
              </div>

              <details className="a-about">
                <summary>About this page and how we checked it</summary>
                <div>
                  <p>
                    Anvaya is an independent student prototype. It is not an official government service and does not give legal advice. It explains what official documents say so you can read them with more confidence.
                  </p>
                  <p>
                    Each statement on this page is tied to passages in the official PDFs.{" "}
                    {report
                      ? `On ${formatDate(report.checkedAt.slice(0, 10))}, ${report.supported} of ${report.totalRefs} quoted passages were checked word-for-word against the PDF text, and ${report.failures.length === 0 ? "every one was found on the stated page" : `${report.failures.length} could not be found`}.`
                      : "The quoted passages have not been machine-checked in this build."}{" "}
                    That check proves the words are there; it does not replace a lawyer’s judgment about what they mean. Points marked “Our reading” are our interpretation.
                  </p>
                  <p>
                    Legal status and dates are computed from the Gazette notifications, never written by an AI model. AI is used only to answer your own questions, and each AI answer is checked a second time against the passages it cites.
                  </p>
                </div>
              </details>
            </section>
          </div>

          <aside className="a-rail" aria-label="On this page">
            <div>
              <h2>On this page</h2>
              <nav>
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`}>{section.label}</a>
                ))}
              </nav>
            </div>
            <div>
              <h2>Status today</h2>
              <p className="a-small" style={{ margin: 0 }}>{status.label}. Checked {formatDate(knowledge.lastChecked)}.</p>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
