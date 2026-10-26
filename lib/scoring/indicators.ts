import { countFlag } from "@/lib/scoring/features";
import type { DimensionId, IndicatorSpec } from "@/lib/scoring/types";

/**
 * The indicator set. Every indicator is bounded in [0,1], where 1 means "more of the design feature
 * the cited research associates with this dimension". They describe design, not the merit of the
 * policy's goals, so a high score is not "good" and a low score is not "bad".
 */

const frac = (n: number, d: number) => n / d;

/**
 * Regime-level features (an enforcer, appeals, review clauses…) can only exist in a text that creates a regime.
 * Below this many binding sentences a text is usually a narrow amendment, and those features live in the law it
 * amends, so they are reported as not measurable rather than as zero.
 */
export const MIN_BINDING = 20;

export const DIMENSIONS: Array<{ id: DimensionId; name: string; question: string; short: string }> = [
  { id: "clarity", name: "Legal clarity", short: "Clarity", question: "How much of the law is settled in the text, rather than left to future instruments?" },
  { id: "enforceability", name: "Enforceability", short: "Enforce", question: "Does the design give the law a credible way to detect breaches and respond to them?" },
  { id: "proportionality", name: "Proportionality", short: "Fit", question: "Are duties calibrated to who is regulated, with safeguards for those subject to them?" },
  { id: "accountability", name: "Accountability & learning", short: "Learn", question: "Does the design build in oversight, assessment and the means to learn whether it works?" },
  { id: "effect", name: "Evidence of effect", short: "Effect", question: "Is there credible evidence that the policy moved the outcome it targets?" },
];

export const INDICATORS: IndicatorSpec[] = [
  // ───────────── Legal clarity ─────────────
  {
    id: "delegation_share", dimension: "clarity", label: "Settled in the text", kind: "ratio", num: "del", den: "ops", invert: true, minDen: 8,
    plain: "The share of provision-bearing sentences that do not hand the detail to future rules or notifications.",
    definition: "1 − D/O, where O is the number of sentences that impose a duty, grant a power, delegate or sanction, and D the number of those that defer substance to subordinate instruments (“as may be prescribed”, “by regulations”).",
    refs: ["epstein-ohalloran-1999", "fuller-1964"],
  },
  {
    id: "deadline_share", dimension: "clarity", label: "Duties with a time limit", kind: "ratio", num: "timed", den: "obl", minDen: MIN_BINDING,
    plain: "The share of duties that state when they must be done.",
    definition: "T/B, where B is the number of sentences that bind a person and T the number of those stating an explicit period or deadline.",
    refs: ["fuller-1964", "oecd-2025"],
  },
  {
    id: "fixed_commencement", dimension: "clarity", label: "Certain start date", kind: "doc",
    plain: "Whether the law says when it starts, rather than leaving the date to a later notification.",
    definition: "1 if the commencement clause fixes a date or event; 0 if it leaves the date to a future notification only; 0.5 if the law does both; not measurable if no clause is found.",
    refs: ["fuller-1964"],
    value: (f) => f.doc.commencement,
  },
  // ───────────── Enforceability ─────────────
  {
    id: "enforcer_designated", dimension: "enforceability", label: "A designated enforcer", kind: "doc",
    plain: "Whether the law creates or names a body responsible for administering and enforcing it.",
    definition: "1 if the text establishes, constitutes or appoints an authority, board, commission, tribunal, regulator or similar body; otherwise 0.",
    refs: ["polinsky-shavell-2000", "oecd-enforcement-2018"],
    value: (f) => (f.countObl >= MIN_BINDING ? (f.doc.enforcer ? 1 : 0) : null),
  },
  {
    id: "sanction_quantification", dimension: "enforceability", label: "Sanctions with a stated size", kind: "ratio", num: "qsanc", den: "sanc", minDen: 2,
    plain: "The share of penalty provisions that state an amount, term or formula.",
    definition: "Q/S, where S is the number of sentences about penalties or offences and Q the number of those stating an amount, a term of years or months, a level, or a formula such as a share of turnover.",
    refs: ["becker-1968", "polinsky-shavell-2000"],
  },
  {
    id: "escalation_breadth", dimension: "enforceability", label: "A ladder of responses", kind: "doc",
    plain: "How many different kinds of response the law provides, from warnings to prosecution.",
    definition: "R/6, where R counts the response types present: directions or warnings; undertakings or settlement; monetary penalty; suspension or cancellation; blocking, injunction or seizure; imprisonment or criminal offence.",
    refs: ["ayres-braithwaite-1992", "oecd-enforcement-2018"],
    value: (f) => (f.countObl >= MIN_BINDING ? Object.values(f.doc.rungs).filter(Boolean).length / 6 : null),
  },
  {
    id: "redress_and_appeal", dimension: "enforceability", label: "A route to appeal", kind: "doc",
    plain: "Whether a person can appeal a decision, and whether the appeal has a time limit.",
    definition: "1 if an appeal to a named body is provided with a time limit; 0.5 if provided without one; 0 if there is none.",
    refs: ["fuller-1964", "oecd-enforcement-2018"],
    value: (f) => (f.countObl >= MIN_BINDING ? f.doc.appeal : null),
  },
  {
    id: "monitoring_powers", dimension: "enforceability", label: "Powers to detect breaches", kind: "doc",
    plain: "Whether the enforcer can obtain information, inspect, investigate and act on an interim basis.",
    definition: "M/4, where M counts the powers present: calling for information; inspection, search or audit; inquiry or investigation; interim orders.",
    refs: ["becker-1968", "oecd-enforcement-2018"],
    value: (f) => (f.countObl >= MIN_BINDING ? Object.values(f.doc.monitoring).filter(Boolean).length / 4 : null),
  },
  // ───────────── Proportionality ─────────────
  {
    id: "risk_tiering", dimension: "proportionality", label: "Duties scaled to who is regulated", kind: "doc",
    plain: "Whether obligations differ by size, class, risk or small-business status.",
    definition: "min(1, K/3), where K counts the calibration devices present: size or volume thresholds; class-based rules; risk or significance tests; small-business or start-up provisions.",
    refs: ["oecd-2025", "barak-2012"],
    value: (f) => (f.countObl >= MIN_BINDING ? Math.min(1, Object.values(f.doc.tiering).filter(Boolean).length / 3) : null),
  },
  {
    id: "qualified_obligations", dimension: "proportionality", label: "Duties qualified by reasonableness", kind: "ratio", num: "qual", den: "obl", minDen: MIN_BINDING,
    plain: "The share of duties that are tempered by tests such as “reasonable”, “necessary” or “where applicable”.",
    definition: "Q/B, where B is the number of sentences that bind a person and Q the number of those containing a reasonableness, necessity, proportionality or applicability qualifier.",
    refs: ["barak-2012", "oecd-2025"],
  },
  {
    id: "procedural_safeguards", dimension: "proportionality", label: "Safeguards for those subject to the law", kind: "doc",
    plain: "Whether people get a hearing, reasons for decisions, and a right of appeal.",
    definition: "S/3, where S counts the safeguards present: an opportunity to be heard; written reasons for decisions; a right of appeal.",
    refs: ["fuller-1964", "barak-2012"],
    value: (f) => (f.countObl >= MIN_BINDING ? Object.values(f.doc.safeguards).filter(Boolean).length / 3 : null),
  },
  {
    id: "exemption_provisions", dimension: "proportionality", label: "Room for exemptions", kind: "doc",
    plain: "Whether the law provides for exemptions or carve-outs.",
    definition: "1 if the text contains an exemption or disapplication provision; otherwise 0.",
    refs: ["oecd-2025"],
    value: (f) => (f.countObl >= MIN_BINDING ? (f.doc.exemption ? 1 : 0) : null),
  },
  // ───────────── Accountability & learning ─────────────
  {
    id: "review_or_sunset", dimension: "accountability", label: "A duty to review or end it", kind: "doc",
    plain: "Whether the law requires its own operation to be reviewed, or ends it after a period.",
    definition: "1 if the text provides for a periodic review, post-implementation evaluation, sunset or expiry; otherwise 0.",
    refs: ["oecd-2025", "hahn-tetlock-2008"],
    value: () => null, // replaced below once DocFacts are available
  },
  {
    id: "oversight_of_delegation", dimension: "accountability", label: "Parliament sees delegated rules", kind: "doc",
    plain: "Whether rules made under the law must be placed before the legislature.",
    definition: "1 if the text requires subordinate instruments to be laid before the legislature or subjects them to annulment or approval; 0 otherwise. Not measurable if the law delegates nothing.",
    refs: ["epstein-ohalloran-1999"],
    value: () => null,
  },
  {
    id: "transparency_duties", dimension: "accountability", label: "Reporting and publication", kind: "doc",
    plain: "Whether the enforcer or regulated parties must report or publish.",
    definition: "1 if the text requires annual reports or publication of decisions or reports; otherwise 0.",
    refs: ["oecd-2025"],
    value: () => null,
  },
  {
    id: "consultation_requirement", dimension: "accountability", label: "Consultation before rules", kind: "doc",
    plain: "Whether rules or designations must be preceded by consultation or public comment.",
    definition: "1 if the text requires consultation, prior publication or an invitation for comments before secondary rules are made; otherwise 0.",
    refs: ["oecd-2025"],
    value: () => null,
  },
  {
    id: "ex_ante_assessment", dimension: "accountability", label: "Costs assessed before enactment", kind: "doc",
    plain: "Whether the bill as introduced carried a financial memorandum, and whether it put a figure on costs.",
    definition: "0 if the bill as introduced has no financial memorandum; 0.5 if it has one without figures; 1 if it quantifies costs. Not measurable when the introduced version is unavailable.",
    refs: ["hahn-tetlock-2008", "oecd-2025"],
    value: () => null,
  },
  {
    id: "legislative_scrutiny", dimension: "accountability", label: "Referred to a committee", kind: "doc",
    plain: "Whether Parliament sent the bill to a committee for detailed scrutiny.",
    definition: "1 if Parliament's record shows referral to a committee; 0 otherwise. Only measurable for bills in Parliament's register.",
    refs: ["oecd-2025"],
    value: (f) => (f.committeeReferral === null ? null : f.committeeReferral ? 1 : 0),
  },
];

// Document-fact indicators read DocFacts; they are completed here so the table above stays readable.
const DOC_VALUE: Record<string, (f: Parameters<Extract<IndicatorSpec, { kind: "doc" }>["value"]>[0]) => number | null> = {
  review_or_sunset: (f) => (f.countObl >= MIN_BINDING ? (f.doc.review ? 1 : 0) : null),
  oversight_of_delegation: (f) => (f.countObl < MIN_BINDING || countFlag(f.flags.del) === 0 ? null : f.doc.laying ? 1 : 0),
  transparency_duties: (f) => (f.countObl >= MIN_BINDING ? (f.doc.transparency ? 1 : 0) : null),
  consultation_requirement: (f) => (f.countObl < MIN_BINDING || countFlag(f.flags.del) === 0 ? null : f.doc.consultation ? 1 : 0),
  ex_ante_assessment: (f) => (f.doc.exAnte === null ? null : !f.doc.exAnte.financialMemorandum ? 0 : f.doc.exAnte.quantified ? 1 : 0.5),
};
for (const spec of INDICATORS) {
  if (spec.kind === "doc" && DOC_VALUE[spec.id]) spec.value = DOC_VALUE[spec.id];
}

export const refsById = (id: string) => REFERENCES.find((ref) => ref.id === id);

export const REFERENCES: Array<{ id: string; cite: string }> = [
  { id: "fuller-1964", cite: "Fuller, L. L. (1964). The Morality of Law. Yale University Press." },
  { id: "epstein-ohalloran-1999", cite: "Epstein, D. & O’Halloran, S. (1999). Delegating Powers: A Transaction Cost Politics Approach to Policy Making under Separate Powers. Cambridge University Press." },
  { id: "becker-1968", cite: "Becker, G. S. (1968). Crime and Punishment: An Economic Approach. Journal of Political Economy 76(2): 169–217." },
  { id: "polinsky-shavell-2000", cite: "Polinsky, A. M. & Shavell, S. (2000). The Economic Theory of Public Enforcement of Law. Journal of Economic Literature 38(1): 45–76." },
  { id: "ayres-braithwaite-1992", cite: "Ayres, I. & Braithwaite, J. (1992). Responsive Regulation: Transcending the Deregulation Debate. Oxford University Press." },
  { id: "oecd-enforcement-2018", cite: "OECD (2018). OECD Regulatory Enforcement and Inspections Toolkit. OECD Publishing, Paris." },
  { id: "barak-2012", cite: "Barak, A. (2012). Proportionality: Constitutional Rights and their Limitations. Cambridge University Press." },
  { id: "oecd-2025", cite: "OECD (2025). OECD Regulatory Policy Outlook 2025. OECD Publishing, Paris (Indicators of Regulatory Policy and Governance: stakeholder engagement, regulatory impact assessment, ex post evaluation)." },
  { id: "hahn-tetlock-2008", cite: "Hahn, R. W. & Tetlock, P. C. (2008). Has Economic Analysis Improved Regulatory Decisions? Journal of Economic Perspectives 22(1): 67–84." },
  { id: "regdata-2017", cite: "Al-Ubaydli, O. & McLaughlin, P. A. (2017). RegData: A numerical database on industry-specific regulations for all United States industries and federal regulations, 1997–2012. Regulation & Governance 11(1): 109–123." },
  { id: "oecd-jrc-2008", cite: "Nardo, M., Saisana, M., Saltelli, A., Tarantola, S., Hoffmann, A. & Giovannini, E. (2008). Handbook on Constructing Composite Indicators: Methodology and User Guide. OECD/JRC, Paris." },
  { id: "saisana-2005", cite: "Saisana, M., Saltelli, A. & Tarantola, S. (2005). Uncertainty and sensitivity analysis techniques as tools for the quality assessment of composite indicators. Journal of the Royal Statistical Society A 168(2): 307–323." },
];

export const ratioValue = (spec: Extract<IndicatorSpec, { kind: "ratio" }>, numerator: number, denominator: number): number | null =>
  denominator < spec.minDen ? null : spec.invert ? 1 - frac(numerator, denominator) : frac(numerator, denominator);
