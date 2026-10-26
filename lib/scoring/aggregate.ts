import { countFlag } from "@/lib/scoring/features";
import { DIMENSIONS, INDICATORS, ratioValue, refsById } from "@/lib/scoring/indicators";
import { dirichletCentred, hashSeed, seeded } from "@/lib/scoring/rng";
import type { DimensionId, DimensionResult, FlagKey, IndicatorResult, PolicyFeatures } from "@/lib/scoring/types";

/**
 * Composite construction follows the OECD/JRC Handbook on Constructing Composite Indicators:
 * a stated framework, bounded indicators, equal weights as the transparent default, and an explicit
 * uncertainty and sensitivity analysis (Saisana, Saltelli & Tarantola 2005) instead of a single number
 * that hides its own fragility.
 */

export const MIN_AVAILABLE = 2;
export const MIN_COVERAGE = 0.5;
/** Concentration of the weight prior around equal weights (see rng.ts). */
export const WEIGHT_ALPHA = 10;
const FLAGS: FlagKey[] = ["ops", "obl", "del", "timed", "qual", "sanc", "qsanc"];

export function evaluateIndicators(features: PolicyFeatures): IndicatorResult[] {
  return INDICATORS.map((spec) => {
    const base = { id: spec.id, dimension: spec.dimension, label: spec.label, plain: spec.plain, definition: spec.definition, refs: spec.refs, samples: features.samples[spec.id] ?? [] };
    if (spec.kind === "ratio") {
      const numerator = countFlag(features.flags[spec.num]);
      const denominator = countFlag(features.flags[spec.den]);
      const value = ratioValue(spec, numerator, denominator);
      return { ...base, value, numerator, denominator, note: value === null ? `Not measurable: only ${denominator} relevant sentences (at least ${spec.minDen} needed).` : undefined };
    }
    const value = spec.value(features);
    return { ...base, value, note: value === null ? "Not measurable for this document." : undefined };
  });
}

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
const quantile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))];

/**
 * Resamples sentences with replacement (the bill is treated as one draw of its drafter's style) and
 * recomputes every sentence-based ratio, while drawing fresh uniform random weights over the available
 * indicators. The 5th–95th percentile of the resulting scores is the 90% interval.
 */
function monteCarlo(features: PolicyFeatures, dims: DimensionId[], replicates: number, exclude: ReadonlySet<string>): Map<DimensionId, number[]> {
  const n = features.sentences;
  const random = seeded(hashSeed(`${features.label}|${n}|${features.words}`));
  const out = new Map<DimensionId, number[]>(dims.map((dim) => [dim, []]));
  if (n === 0) return out;
  const sums: Record<FlagKey, number> = { ops: 0, obl: 0, del: 0, timed: 0, qual: 0, sanc: 0, qsanc: 0 };
  for (let b = 0; b < replicates; b += 1) {
    for (const key of FLAGS) sums[key] = 0;
    for (let draw = 0; draw < n; draw += 1) {
      const j = Math.floor(random() * n);
      for (const key of FLAGS) sums[key] += features.flags[key][j];
    }
    for (const dim of dims) {
      const specs = INDICATORS.filter((spec) => spec.dimension === dim && !exclude.has(spec.id));
      const values: number[] = [];
      for (const spec of specs) {
        const value = spec.kind === "ratio" ? ratioValue(spec, sums[spec.num], sums[spec.den]) : spec.value(features);
        if (value !== null) values.push(value);
      }
      if (values.length < MIN_AVAILABLE) continue;
      const weights = dirichletCentred(values.length, WEIGHT_ALPHA, random);
      out.get(dim)!.push(100 * values.reduce((sum, value, i) => sum + value * weights[i], 0));
    }
  }
  return out;
}

const pct = (value: number) => `${Math.round(100 * value)}%`;
const n1 = (value: number) => (Math.round(value * 10) / 10).toString();

/** Plain sentence for each indicator, built only from the computed counts. */
function clause(result: IndicatorResult): string | null {
  const v = result.value;
  if (v === null) return null;
  const c = (num?: number, den?: number) => (num !== undefined && den !== undefined ? ` (${num} of ${den})` : "");
  switch (result.id) {
    case "delegation_share": return `${pct(1 - v)} of provision-bearing sentences leave the detail to future rules or notifications${c(result.numerator, result.denominator)}`;
    case "deadline_share": return `${pct(v)} of duties state a time limit${c(result.numerator, result.denominator)}`;
    case "fixed_commencement": return v === 1 ? "it fixes its own start date" : v === 0 ? "its start date is left to a future notification" : "it fixes some start dates and leaves others to notification";
    case "enforcer_designated": return v === 1 ? "it creates or names an enforcing body" : "it does not create or name an enforcing body";
    case "sanction_quantification": return `${pct(v)} of penalty provisions state an amount, term or formula${c(result.numerator, result.denominator)}`;
    case "escalation_breadth": return `it provides ${Math.round(v * 6)} of 6 kinds of response (directions, undertakings, penalties, suspension, blocking, prosecution)`;
    case "redress_and_appeal": return v === 1 ? "decisions can be appealed within a time limit" : v === 0.5 ? "decisions can be appealed, with no time limit stated" : "no appeal route is provided";
    case "monitoring_powers": return `it gives ${Math.round(v * 4)} of 4 detection powers (information, inspection, inquiry, interim orders)`;
    case "risk_tiering": return `${Math.round(v * 3)} of 3 calibration devices (size thresholds, classes, risk tests, small-business relief) appear`;
    case "qualified_obligations": return `${pct(v)} of duties carry a reasonableness or necessity qualifier${c(result.numerator, result.denominator)}`;
    case "procedural_safeguards": return `${Math.round(v * 3)} of 3 safeguards are present (hearing, written reasons, appeal)`;
    case "exemption_provisions": return v === 1 ? "it provides for exemptions" : "it contains no exemption provision";
    case "review_or_sunset": return v === 1 ? "it requires its own review or expires" : "it contains no review or sunset duty";
    case "oversight_of_delegation": return v === 1 ? "rules made under it must be laid before the legislature" : "rules made under it need not be laid before the legislature";
    case "transparency_duties": return v === 1 ? "it requires reporting or publication" : "it contains no reporting or publication duty";
    case "consultation_requirement": return v === 1 ? "rules must be preceded by consultation" : "no consultation is required before rules";
    case "ex_ante_assessment": return v === 1 ? "the bill as introduced quantified its costs" : v === 0.5 ? "the bill as introduced had a financial memorandum without figures" : "the bill as introduced had no financial memorandum";
    case "legislative_scrutiny": return v === 1 ? "Parliament referred it to a committee" : "it was not referred to a committee";
    default: return null;
  }
}

/**
 * `exclude` drops indicators from every calculation (used for like-for-like benchmarks, where an indicator
 * that other countries' records cannot supply, such as Indian committee referral, is left out for everyone).
 */
export function scoreDimensions(features: PolicyFeatures, indicators: IndicatorResult[], replicates?: number, exclude: ReadonlySet<string> = new Set()): DimensionResult[] {
  const textDims = DIMENSIONS.filter((dim) => dim.id !== "effect").map((dim) => dim.id);
  const draws = monteCarlo(features, textDims, replicates ?? (features.sentences > 20000 ? 300 : 800), exclude);
  return DIMENSIONS.filter((dim) => dim.id !== "effect").map((dim): DimensionResult => {
    const mine = indicators.filter((indicator) => indicator.dimension === dim.id && !exclude.has(indicator.id));
    const available = mine.filter((indicator) => indicator.value !== null);
    const coverage = mine.length ? available.length / mine.length : 0;
    const scored = available.length >= MIN_AVAILABLE && coverage >= MIN_COVERAGE;
    const point = scored ? 100 * mean(available.map((indicator) => indicator.value as number)) : null;
    const sorted = [...(draws.get(dim.id) ?? [])].sort((a, b) => a - b);
    const lo = scored && sorted.length >= 50 ? Math.min(point as number, quantile(sorted, 0.05)) : null;
    const hi = scored && sorted.length >= 50 ? Math.max(point as number, quantile(sorted, 0.95)) : null;
    const leaveOneOut = scored && available.length > 2 ? available.map((omitted) => ({ id: omitted.id, label: omitted.label, score: 100 * mean(available.filter((other) => other.id !== omitted.id).map((other) => other.value as number)) })) : [];
    const clauses = available.map(clause).filter((text): text is string => text !== null);
    const missing = mine.filter((indicator) => indicator.value === null).map((indicator) => indicator.label.toLowerCase());
    const why = scored
      ? `${n1(point as number)} out of 100. ${clauses.map((text, i) => (i === 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text)).join("; ")}.${missing.length ? ` Not measurable for this document: ${missing.join(", ")}.` : ""}`
      : `Not enough measurable evidence for a score: ${available.length} of ${mine.length} indicators could be measured (at least ${MIN_AVAILABLE}, and half, are needed).${missing.length ? ` Not measurable: ${missing.join(", ")}.` : ""}`;
    return { id: dim.id, name: dim.name, question: dim.question, status: scored ? "scored" : "insufficient", score: point, lo, hi, available: available.length, total: mine.length, coverage, why, indicators: mine, leaveOneOut };
  });
}

export { refsById };
