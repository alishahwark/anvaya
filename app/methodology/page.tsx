import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { DIMENSIONS, INDICATORS, REFERENCES, refsById } from "@/lib/scoring/indicators";
import { METHOD_VERSION } from "@/lib/scoring/types";

export const metadata: Metadata = { title: "Scoring methodology — Anvaya" };

export default function MethodologyPage() {
  return (
    <Shell>
      <section className="a-intro">
        <span className="a-eyebrow">Method version {METHOD_VERSION}</span>
        <h1>How the scorecard is built</h1>
        <p>Each ring is a composite of bounded indicators computed from the policy’s official text, following the OECD/JRC Handbook on Constructing Composite Indicators.</p>
      </section>
      <div className="a-doc-page">
        <h2>What a score means</h2>
        <p>A ring shows how much of a design feature the research associates with implementation, such as settled text, enforcement tools or review duties. It does not say a policy’s goals are good, and a low score is not a criticism. Colour is a single hue, never red and green. There is no overall score, because adding unlike dimensions would hide the trade-offs.</p>
        <h2>How a score is computed</h2>
        <ul>
          <li>Each indicator runs from 0 to 1. A dimension’s score is the equal-weight mean of its indicators, times 100.</li>
          <li>A ratio whose denominator is too small is “not measurable”, never zero. A dimension is scored only if at least two indicators, and half of them, can be measured.</li>
          <li>Regime-level features, such as an enforcer or appeal route, are measured only for texts with at least 20 binding sentences. Narrow amendments usually fall below that.</li>
        </ul>
        <h2>Uncertainty</h2>
        <p>The 90% range comes from 800 resamplings of the text’s sentences (300 for very long texts), with indicator weights drawn from a Dirichlet distribution centred on equal weights (about ±25–30% per weight). Draws use a fixed seed derived from the text, so results reproduce exactly. A leave-one-indicator-out chart shows whether one indicator drives a score.</p>
        <h2>International benchmarks</h2>
        <p>Comparator laws are fetched from the UK and Canadian official statute sites, their titles are checked against the fetched text, and the same engine scores them. Two indicators that need Indian parliamentary records are left out for everyone. Comparator choice is a researcher’s decision, so each page shows leave-one-out ranges. Amending bills and subordinate rules get no benchmark.</p>
        <h2>Evidence of effect</h2>
        <p>This ring is blank until real outcome studies are loaded. The estimators exist (two-way fixed-effects difference-in-differences with cluster-robust errors, interrupted time series with Newey–West errors, synthetic control with placebo inference, random-effects meta-analysis) and are validated only on simulated data with known effects. Designs without a comparison group cannot produce a causal estimate here.</p>
        <h2>Indicators</h2>
        {DIMENSIONS.filter((dim) => dim.id !== "effect").map((dim) => (
          <section key={dim.id}>
            <h3>{dim.name}</h3>
            <p className="a-small" style={{ margin: "0.25rem 0 0" }}>{dim.question}</p>
            <ul className="a-refs" style={{ listStyle: "none", paddingLeft: 0, marginTop: "0.75rem" }}>
              {INDICATORS.filter((i) => i.dimension === dim.id).map((i) => (
                <li key={i.id}><strong>{i.label}.</strong> {i.definition} <em>({i.refs.map((r) => refsById(r)?.cite.split(" (")[0]).join("; ")})</em></li>
              ))}
            </ul>
          </section>
        ))}
        <h2>Known limits</h2>
        <ul>
          <li>Phrase matching approximates meaning. On a hand-read sample, delegation, deadline and penalty-size flags were precise; recall was not measured.</li>
          <li>Drafting conventions differ between India, the UK and Canada, so statutes are not perfectly alike.</li>
          <li>Indicators are proxies for design, not outcomes. The link between a design feature and results varies by context.</li>
        </ul>
        <h2>References</h2>
        <ul className="a-refs">{REFERENCES.map((ref) => <li key={ref.id}>{ref.cite}</li>)}</ul>
      </div>
    </Shell>
  );
}
