import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Distribution, DotPlot, StripPlot, Tornado } from "@/components/scoring/charts";
import { Shell } from "@/components/site/Shell";
import { buildBenchmark } from "@/lib/scoring/benchmarks/compare";
import { DIMENSIONS, refsById } from "@/lib/scoring/indicators";
import { readableTitle } from "@/lib/research/record";
import { effectStatus } from "@/lib/scoring/outcomes/evidence";
import { scorePayload } from "@/lib/scoring/score";
import type { DimensionId } from "@/lib/scoring/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ d?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const payload = await scorePayload(slug).catch(() => null);
  return { title: `${payload?.card.title ?? "Policy"} — benchmark — Anvaya` };
}

const fmt = (v: number | null | undefined) => (v === null || v === undefined ? "—" : String(Math.round(v)));

export default async function BenchmarkPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { d } = await searchParams;
  const payload = await scorePayload(slug);
  if (!payload) notFound();
  const dimId = (DIMENSIONS.find((dim) => dim.id === d)?.id ?? "clarity") as DimensionId;
  const dim = DIMENSIONS.find((x) => x.id === dimId)!;
  const { card, likeForLike } = payload;
  const title = readableTitle(card.title);
  const bench = buildBenchmark(card.title, likeForLike);
  const full = card.dimensions.find((x) => x.id === dimId);
  const block = bench.eligible ? bench.dimensions.find((x) => x.dimension === dimId) : undefined;
  const effect = effectStatus([]);
  const refIds = [...new Set((full?.indicators ?? []).flatMap((i) => i.refs))];

  return (
    <Shell>
      <div className="a-container">
        <nav className="a-crumbs" aria-label="Breadcrumb"><Link href="/explore">Explore</Link> / <Link href={`/policies/${slug}`}>{title}</Link> / <span>Benchmark</span></nav>
        <header className="a-policy-head">
          <span className="a-eyebrow">International benchmark · {dim.name}</span>
          <h1 className="a-h1">{title}</h1>
          <p className="a-prose a-muted">{dim.question}</p>
          <ul className="a-dimtabs" aria-label="Dimension">
            {DIMENSIONS.map((x) => <li key={x.id}><Link href={`/policies/${slug}/benchmark?d=${x.id}`} aria-current={x.id === dimId ? "page" : undefined}>{x.name}</Link></li>)}
          </ul>
        </header>

        <div className="a-narrow" style={{ marginInline: 0, maxWidth: "56rem" }}>
          {dimId === "effect" ? (
            <section className="a-block">
              <span className="a-eyebrow">Evidence of effect</span>
              <h2 className="a-h2">Not yet measurable</h2>
              <p className="a-prose">{effect.reason}</p>
              <p className="a-prose">An effect can only be estimated from outcome data observed before and after the policy, ideally with a comparison group. When such studies are loaded, this ring will report an estimate with its interval and the strength of the study design, using the methods below. Until then Anvaya shows nothing rather than guess.</p>
              <table className="a-table">
                <thead><tr><th>Method</th><th>What it needs</th><th>Weakness to remember</th></tr></thead>
                <tbody>
                  <tr><td>Difference-in-differences</td><td>Outcome for affected and unaffected units, before and after</td><td>Assumes both groups would have moved in parallel; cluster-robust errors are unreliable with few units</td></tr>
                  <tr><td>Synthetic control (Abadie, Diamond &amp; Hainmueller 2010)</td><td>One affected unit, several unaffected, a long pre-period</td><td>Inference is by placebo rank, so small donor pools limit precision</td></tr>
                  <tr><td>Interrupted time series</td><td>A long series with a clear start date</td><td>No comparison group: anything else that changed then is mistaken for the policy</td></tr>
                  <tr><td>Random-effects meta-analysis (DerSimonian &amp; Laird 1986)</td><td>Several comparable studies</td><td>Pools designs of unequal quality unless tiers are respected</td></tr>
                </tbody>
              </table>
              <p className="a-small">These estimators are implemented and tested on simulated data where the true effect is known (bias and interval coverage); they have not been run on any real policy. <Link className="a-link" href="/methodology">Method and validation</Link></p>
            </section>
          ) : (
            <>
              <section className="a-block">
                <span className="a-eyebrow">This policy</span>
                <h2 className="a-h2">{full?.status === "scored" ? `${fmt(full.score)} out of 100` : "Not enough evidence to score"}</h2>
                <p className="a-prose">{full?.why}</p>
                {full?.status === "scored" ? <p className="a-small">The 90% range {fmt(full.lo)}–{fmt(full.hi)} comes from resampling the sentences of the text and varying the weights of the indicators by about ±25%, 800 times. It reflects how sensitive the score is to wording and weighting, not the quality of the policy.</p> : null}
              </section>

              {!bench.eligible ? (
                <section className="a-block"><span className="a-eyebrow">Benchmark</span><h2 className="a-h2">No international comparison</h2><p className="a-prose">{bench.reason}</p></section>
              ) : !block?.focal ? (
                <section className="a-block"><span className="a-eyebrow">Benchmark</span><h2 className="a-h2">Not comparable on this dimension</h2><p className="a-prose">This policy lacks enough measurable indicators on the like-for-like set (which leaves out Indian parliamentary records that other countries’ laws cannot supply), so no comparison is drawn.</p></section>
              ) : (
                <>
                  <section className="a-block">
                    <span className="a-eyebrow">Comparison · {bench.topic.label}</span>
                    <h2 className="a-h2">Against laws from other countries</h2>
                    <p className="a-prose a-muted">{bench.selection} Scores here use the like-for-like indicator set, so they can differ slightly from the ring.</p>
                    {block.stats ? (
                      <div className="a-stats">
                        <div className="a-stat"><b>{fmt(block.focal.score)}</b><span>this policy (like-for-like)</span></div>
                        <div className="a-stat"><b>{fmt(block.stats.median)}</b><span>median of {block.stats.n} comparators (range {fmt(block.stats.min)}–{fmt(block.stats.max)})</span></div>
                        <div className="a-stat"><b>{block.stats.gapToMedian >= 0 ? "+" : ""}{fmt(block.stats.gapToMedian)}</b><span>difference from the median</span></div>
                        <div className="a-stat"><b>{fmt(block.stats.percentile)}</b><span>percentile among these laws</span></div>
                      </div>
                    ) : <p className="a-prose">Fewer than three scored comparators, so no rank or percentile is reported, only the table and chart.</p>}
                    <DotPlot title={`${dim.name} scores of this policy and comparator laws, with 90% ranges`} median={block.stats?.median ?? null}
                      dots={[{ label: `${title.replace(/^The /, "")} (India)`, score: block.focal.score, lo: block.focal.lo, hi: block.focal.hi, focal: true }, ...block.comparators.map((c) => ({ label: `${c.label} (${c.country}, ${c.year})`, score: c.score, lo: c.lo, hi: c.hi }))]} />
                    <p className="a-small">Bars are 90% ranges from resampling the text. Where bars overlap, the difference is within the noise of the method.{block.stats ? ` Dropping any one comparator moves the median within ${fmt(block.stats.looMedianRange[0])}–${fmt(block.stats.looMedianRange[1])}.` : ""}</p>
                    <table className="a-table">
                      <thead><tr><th>Law</th><th>Score</th><th>90% range</th><th>Size</th><th>Text used</th></tr></thead>
                      <tbody>
                        <tr data-focal="true"><td>{title} (India)</td><td>{fmt(block.focal.score)}</td><td>{fmt(block.focal.lo)}–{fmt(block.focal.hi)}</td><td>{card.sentences} sentences</td><td>{card.basis}</td></tr>
                        {block.comparators.map((c) => <tr key={c.id}><td><a className="a-link" href={c.url} target="_blank" rel="noreferrer noopener">{c.label} ↗</a><br /><span className="a-small">{c.country}, {c.year}</span></td><td>{fmt(c.score)}</td><td>{fmt(c.lo)}–{fmt(c.hi)}</td><td>{c.sentences} sentences</td><td>{c.basis}</td></tr>)}
                      </tbody>
                    </table>
                    {bench.excluded.length ? <p className="a-small">Not used: {bench.excluded.map((e) => `${e.title}: ${e.reason}`).join(" ")}</p> : null}
                  </section>

                  <section className="a-block">
                    <span className="a-eyebrow">Where the difference comes from</span>
                    <h2 className="a-h2">Indicator by indicator</h2>
                    <p className="a-prose a-muted">Dark dot: this policy. Light dots: each comparator. Every indicator runs from 0 to 1.</p>
                    <StripPlot title={`Indicator values for ${dim.name}`} rows={(full?.indicators ?? []).filter((i) => i.id in (block.focal!.indicators) && !["ex_ante_assessment", "legislative_scrutiny"].includes(i.id)).map((i) => ({ label: i.label, focal: block.focal!.indicators[i.id] ?? null, others: block.comparators.map((c) => c.indicators[i.id]).filter((v): v is number => v !== null && v !== undefined) }))} />
                  </section>

                  <section className="a-block">
                    <span className="a-eyebrow">Wider context</span>
                    <h2 className="a-h2">All comparator laws together</h2>
                    <Distribution title={`Distribution of ${dim.name} scores across all comparator laws`} values={block.pooled} focal={block.focal.score} />
                    <p className="a-small">{block.pooled.length} comparator laws across every policy area Anvaya has verified. Different areas legitimately differ, so this is context, not a ranking.</p>
                  </section>
                </>
              )}

              {full && full.leaveOneOut.length ? (
                <section className="a-block">
                  <span className="a-eyebrow">Sensitivity</span>
                  <h2 className="a-h2">Does one indicator drive the score?</h2>
                  <Tornado title={`Score of ${dim.name} when each indicator is dropped`} base={full.score as number} rows={full.leaveOneOut} />
                  <p className="a-small">A long bar means the score leans on that indicator. This follows the uncertainty-and-sensitivity practice of the OECD/JRC composite-indicator handbook.</p>
                </section>
              ) : null}

              <section className="a-block">
                <span className="a-eyebrow">Evidence</span>
                <h2 className="a-h2">What the text says</h2>
                {(full?.indicators ?? []).map((i) => (
                  <details key={i.id} className="a-about" open={i.samples.length > 0 && i.value !== null && i.value > 0}>
                    <summary>{i.label}: {i.value === null ? "not measurable" : i.value.toFixed(2)}{i.numerator !== undefined ? ` (${i.numerator} of ${i.denominator})` : ""}</summary>
                    <div>
                      <p>{i.plain}</p>
                      <p className="a-small"><strong>Formula.</strong> {i.definition}</p>
                      {i.note ? <p className="a-small">{i.note}</p> : null}
                      {i.samples.map((s, k) => <blockquote key={k} className="a-quote">“{s.text}” <span className="a-small">(page {s.page})</span></blockquote>)}
                    </div>
                  </details>
                ))}
              </section>

              <section className="a-block">
                <span className="a-eyebrow">Research behind this ring</span>
                <h2 className="a-h2">References</h2>
                <ul className="a-refs">{[...refIds, "oecd-jrc-2008", "saisana-2005"].map((id) => <li key={id}>{refsById(id)?.cite ?? id}</li>)}</ul>
              </section>
            </>
          )}

          <section className="a-block">
            <span className="a-eyebrow">Read this before relying on it</span>
            <h2 className="a-h2">Limits</h2>
            <ul className="a-refs" style={{ listStyle: "disc" }}>
              <li>The scores measure features of the text. They do not measure whether the policy works, and they do not judge its goals.</li>
              <li>Comparators are a researcher’s choice, and UK and Irish texts are as enacted while Canadian texts are the current consolidated version.</li>
              <li>A phrase-matching method reads the text; it can miss or over-count wording. Its precision and recall are reported in the methodology.</li>
              <li>Higher is not “better”: a lower score on, say, delegation may be a deliberate choice for a fast-moving field.</li>
            </ul>
            <p className="a-small"><Link className="a-link" href="/methodology">Full methodology and references</Link></p>
          </section>
        </div>
      </div>
    </Shell>
  );
}
