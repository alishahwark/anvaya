import { evaluateIndicators, scoreDimensions } from "@/lib/scoring/aggregate";
import { extractFeatures } from "@/lib/scoring/features";
import { MIN_BINDING } from "@/lib/scoring/indicators";
import { loadFeatureInput } from "@/lib/scoring/inputs";
import { METHOD_VERSION, type PolicyFeatures, type Scorecard } from "@/lib/scoring/types";

/** Indicators that need Indian parliamentary records; left out of cross-country benchmarks for everyone. */
export const INDIA_ONLY_INDICATORS: ReadonlySet<string> = new Set(["ex_ante_assessment", "legislative_scrutiny"]);

export function textScorecard(slug: string, title: string, basis: string, features: PolicyFeatures, exclude: ReadonlySet<string> = new Set()): Scorecard {
  const indicators = evaluateIndicators(features);
  const dimensions = scoreDimensions(features, indicators, undefined, exclude);
  const caveats: string[] = [];
  if (features.instrument === "amending") caveats.push("This is an amending instrument. It is measured on the amending text alone, so features that live in the law it amends (an enforcer, appeals, most penalties) are often not measurable here and are left out rather than scored as zero.");
  if (features.countObl < MIN_BINDING) caveats.push(`Only ${features.countObl} sentences in this text bind a person (at least ${MIN_BINDING} are needed), so indicators about the regime it creates are not measurable.`);
  caveats.push("The scores describe design features that the research links to implementation. They do not judge the policy's goals, and they do not measure outcomes.");
  return { slug, title, generatedAt: new Date().toISOString(), instrument: features.instrument, basis, sentences: features.sentences, words: features.words, dimensions, caveats, methodVersion: METHOD_VERSION };
}

/** Scores a stored policy from its official text. Deterministic: the same text always gives the same card. */
export async function scoreSlug(slug: string): Promise<{ card: Scorecard; features: PolicyFeatures } | null> {
  const loaded = await loadFeatureInput(slug);
  if (!loaded) return null;
  const features = extractFeatures(loaded.input);
  return { card: textScorecard(slug, loaded.title, loaded.basis, features), features };
}

const memo = new Map<string, { at: number; value: ScorePayload | null }>();
export type ScorePayload = { card: Scorecard; likeForLike: Scorecard };

/** Both scorecards for a stored policy: the full one shown on its rings and the like-for-like one used for benchmarks. Cached in memory. */
export async function scorePayload(slug: string): Promise<ScorePayload | null> {
  const hit = memo.get(slug);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.value;
  const scored = await scoreSlug(slug);
  const value = scored ? { card: scored.card, likeForLike: textScorecard(slug, scored.card.title, scored.card.basis, scored.features, INDIA_ONLY_INDICATORS) } : null;
  memo.set(slug, { at: Date.now(), value });
  return value;
}
