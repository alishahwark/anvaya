import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { Shell } from "@/components/site/Shell";

export const metadata: Metadata = { title: "How it works — Anvaya" };

const steps = [
  { n: "1", title: "Find the official documents", body: "Anvaya searches Parliament’s bill register (Digital Sansad) and India Code, then downloads every version of the document: as introduced, as passed, the Gazette copy and any committee report. It keeps the originals." },
  { n: "2", title: "Check them against each other", body: "Dates, Act numbers and versions in Parliament’s register are compared with what the PDFs themselves print, and with India Code. Each check is shown on the policy page. A check that cannot be run is shown as not run, never hidden." },
  { n: "3", title: "Explain in plain language", body: "An AI model writes the summary, using only passages retrieved from the official text. Whether a law is in force is computed from the Gazette notification, never decided by the model." },
  { n: "4", title: "Score the design", body: "A formula reads the text and measures design features that research links to implementation. Each score has a 90% range and a plain-language reason, and can be compared with laws from the UK and Canada." },
];

export default function HowItWorks() {
  return (
    <Shell>
      <section className="a-intro">
        <span className="a-eyebrow">How it works</span>
        <h1>From official text to a checked answer</h1>
        <p>What Anvaya does with a policy, and how it avoids saying things the documents do not support.</p>
      </section>

      <ol className="a-shelf" style={{ listStyle: "none", padding: 0, margin: "3rem auto 0", display: "grid", gap: "1.1rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {steps.map((step, index) => (
          <Reveal as="li" key={step.n} delay={index * 80}>
            <div className="a-tile" style={{ height: "100%", minHeight: "13rem" }}>
              <span className="a-eyebrow">Step {step.n}</span>
              <h2 className="a-tile__title">{step.title}</h2>
              <p>{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>

      <div className="a-doc-page">
        <h2 id="answers">How answers are checked</h2>
        <ul>
          <li><strong>Retrieval first.</strong> The model sees only the official passages Anvaya retrieved for the question, and is told to ignore any instructions inside them.</li>
          <li><strong>A second pass.</strong> A separate check tests each sentence of the answer against the passages it cites.</li>
          <li><strong>Quotes confirmed by code.</strong> Every quoted passage must appear word for word in the stored text; otherwise it is dropped.</li>
          <li><strong>Abstention.</strong> If the documents do not support an answer, Anvaya says it could not confirm one and suggests questions it can answer.</li>
        </ul>

        <h2 id="scorecard">How the scorecard works</h2>
        <p>Four rings are computed from the text: legal clarity, enforceability, proportionality, and accountability and learning. A fifth, evidence of effect, stays blank until real outcome studies exist. The rings describe how a law is built. They do not judge its goals, and there is no overall score. <Link className="a-link" href="/methodology">Read the method and references</Link>.</p>

        <h2>What is not covered yet</h2>
        <ul>
          <li>Newspaper coverage and public debate.</li>
          <li>Measured effects of any law on outcomes. The <Link className="a-link" href="/evidence">economic evidence lab</Link> is a preview of that future work.</li>
          <li>State laws, court judgments and subordinate rules, except where listed.</li>
        </ul>
      </div>
    </Shell>
  );
}
