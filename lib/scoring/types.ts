/**
 * Policy scorecard: shared types.
 *
 * Design rule: every number is computed from the policy's own official text or from a stated dataset,
 * by a formula written down in docs/SCORING_METHODOLOGY.md. Where the evidence needed does not exist,
 * the result is "insufficient evidence", never a guessed score.
 */

export type DimensionId = "clarity" | "enforceability" | "proportionality" | "accountability" | "effect";

export type FlagKey =
  | "ops" // provision-bearing sentences: obligations, permissions, delegations, sanctions
  | "obl" // obligations and prohibitions
  | "del" // deferral of substance to future subordinate instruments
  | "timed" // obligations with an explicit time limit
  | "qual" // obligations carrying a reasonableness / necessity qualifier
  | "sanc" // sentences about penalties and offences
  | "qsanc"; // sanction sentences that state an amount, term or formula

export type Sample = { text: string; page: number };

/** Document-level facts that are not per-sentence ratios. Null means "could not be determined". */
export type DocFacts = {
  enforcer: boolean;
  appeal: 0 | 0.5 | 1;
  monitoring: { information: boolean; inspection: boolean; inquiry: boolean; interim: boolean };
  tiering: { threshold: boolean; classBased: boolean; risk: boolean; smallBusiness: boolean };
  rungs: { direction: boolean; undertaking: boolean; monetary: boolean; suspension: boolean; blocking: boolean; criminal: boolean };
  safeguards: { hearing: boolean; reasons: boolean; appeal: boolean };
  exemption: boolean;
  review: boolean;
  laying: boolean;
  transparency: boolean;
  consultation: boolean;
  /** 1 fixed date, 0 only by future notification, 0.5 mixed, null no clause found. */
  commencement: 1 | 0 | 0.5 | null;
  /** From the bill as introduced (Indian bills carry these memoranda); null when that version is unavailable. */
  exAnte: { financialMemorandum: boolean; quantified: boolean; delegatedLegislationMemo: boolean } | null;
};

export type PolicyFeatures = {
  label: string;
  instrument: "principal" | "amending";
  pages: number;
  words: number;
  sentences: number;
  /** Number of binding sentences; duties-based indicators are not measurable below a minimum. */
  countObl: number;
  flags: Record<FlagKey, Uint8Array>;
  doc: DocFacts;
  /** Parliament's record: referred to a committee? Null when not an Indian bill record. */
  committeeReferral: boolean | null;
  samples: Record<string, Sample[]>;
};

export type IndicatorSpec = {
  id: string;
  dimension: DimensionId;
  label: string;
  /** One-line plain-language meaning, used in tooltips. */
  plain: string;
  /** The formula, stated exactly. */
  definition: string;
  refs: string[];
} & (
  | { kind: "ratio"; num: FlagKey; den: FlagKey; /** Report 1 − ratio. */ invert?: boolean; minDen: number }
  | { kind: "doc"; value: (f: PolicyFeatures) => number | null }
);

export type IndicatorResult = {
  id: string;
  dimension: DimensionId;
  label: string;
  plain: string;
  definition: string;
  refs: string[];
  /** 0–1, or null when not measurable for this document. */
  value: number | null;
  /** Counts behind a ratio, for transparency. */
  numerator?: number;
  denominator?: number;
  note?: string;
  samples: Sample[];
};

export type DimensionResult = {
  id: DimensionId;
  name: string;
  question: string;
  status: "scored" | "insufficient" | "not_measurable";
  /** 0–100. */
  score: number | null;
  /** 90% interval from sampling and weighting uncertainty. */
  lo: number | null;
  hi: number | null;
  available: number;
  total: number;
  coverage: number;
  /** Plain-language reason for the score, built only from computed numbers. */
  why: string;
  indicators: IndicatorResult[];
  /** Leave-one-indicator-out scores, for the sensitivity chart. */
  leaveOneOut: Array<{ id: string; label: string; score: number }>;
};

export type Scorecard = {
  slug: string;
  title: string;
  generatedAt: string;
  instrument: "principal" | "amending";
  basis: string;
  sentences: number;
  words: number;
  dimensions: DimensionResult[];
  /** Why the card may not be comparable with a principal law's, e.g. an amending bill. */
  caveats: string[];
  methodVersion: string;
};

export const METHOD_VERSION = "1.0";
