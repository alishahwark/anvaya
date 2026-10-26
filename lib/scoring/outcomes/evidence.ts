import type { Estimate } from "@/lib/scoring/outcomes/estimators";

/**
 * Evidence tiers in the spirit of GRADE (Guyatt et al. 2008) and the What Works Network scale: how much a
 * reader should trust an effect estimate depends on the design that produced it, not on the estimate itself.
 */
export type Design = "rct" | "did" | "synthetic_control" | "its" | "before_after" | "cross_section";

export const DESIGN_TIER: Record<Design, { tier: 1 | 2 | 3 | 4; label: string }> = {
  rct: { tier: 1, label: "Randomised experiment" },
  did: { tier: 2, label: "Difference-in-differences with comparison group" },
  synthetic_control: { tier: 2, label: "Synthetic control" },
  its: { tier: 3, label: "Interrupted time series (no comparison group)" },
  before_after: { tier: 4, label: "Before–after comparison" },
  cross_section: { tier: 4, label: "Cross-sectional association" },
};

/** Outcome study as stored in data/outcomes/<slug>.json. The folder is empty: no outcome data has been verified. */
export type OutcomeStudy = {
  id: string;
  source: string;
  url: string;
  outcome: string;
  design: Design;
  effect: number;
  se: number;
  n: number;
  unit: string;
  retrieved: string;
};

/** The effect circle is shown only when at least one tier ≤ 2 study exists; otherwise it says why not. */
export function effectStatus(studies: OutcomeStudy[]): { measurable: boolean; reason: string; best: number | null } {
  if (!studies.length) return { measurable: false, best: null, reason: "No published outcome evaluation of this policy has been loaded, so its effect cannot be estimated. Anvaya will not infer an effect from the text." };
  const best = Math.min(...studies.map((s) => DESIGN_TIER[s.design].tier));
  if (best > 2) return { measurable: false, best, reason: `Only weak designs (tier ${best}) are available; they cannot support a causal effect estimate.` };
  return { measurable: true, best, reason: `${studies.length} outcome stud${studies.length === 1 ? "y" : "ies"}, best design tier ${best}.` };
}

/** Probability that the true effect is on the favourable side of zero, under a normal approximation. Never shown without its interval. */
export function directionProbability(e: Pick<Estimate, "effect" | "se">, favourable: 1 | -1, cdf: (x: number) => number): number {
  return cdf((favourable * e.effect) / e.se);
}
