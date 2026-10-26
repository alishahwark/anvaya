/**
 * Evidence-to-claim data contracts.
 *
 *   Policy -> official document -> page/section -> exact quote
 *          -> claim -> citizen explanation -> stakeholder implication
 *
 * Everything shown to a citizen on a policy page is derived from these types.
 * A claim is only displayable if each of its evidence quotes can be found on
 * the stated page of the stated official PDF (see verify.ts).
 */

/** Short key for an official document in a policy's source library. */
export type DocKey = string;

export type OfficialDocument = {
  key: DocKey;
  /** Citizen-readable title. */
  title: string;
  /** Official identifier, e.g. "G.S.R. 843(E)". */
  identifier?: string;
  /** What the document is, in plain words. */
  kind: string;
  publisher: string;
  /** ISO date the document was published. */
  publishedDate: string;
  /** Original official URL (opened in a new tab). */
  url: string;
  /** Local copy under data/source-inbox, used for quote verification and retrieval. */
  localFile: string;
  /** First page of the English text, for documents with a Hindi section first. */
  firstEnglishPage?: number;
  /** One sentence telling a citizen why they would open this document. */
  whyItMatters: string;
};

/** Pointer to an exact passage in an official document. */
export type EvidenceRef = {
  doc: DocKey;
  /** 1-based PDF page. */
  page: number;
  /** Human locator, e.g. "Section 8(5)". */
  section: string;
  /** Verbatim text (whitespace-insensitive) that supports the claim. */
  quote: string;
};

export type ClaimType =
  | "statutory_text" // what the law says
  | "lifecycle" // assent, notification, commencement, corrections
  | "implementation" // rules, schedules, institutions
  | "analyst_inference" // our reading of what the text implies in practice
  | "hypothetical_scenario"
  | "empirical_observation"
  | "media_attribution";

export type EvidenceClaim = {
  id: string;
  claimType: ClaimType;
  /** Precise, plain-language assertion that the evidence must support. */
  claim: string;
  evidence: EvidenceRef[];
};

export type Phase = {
  id: string;
  /** ISO date this phase takes effect. */
  date: string;
  /** Short plain label, e.g. "Foundations and the Data Protection Board". */
  label: string;
  /** Who/what this phase is about, in one sentence. */
  summary: string;
  /** Provisions of the Act that start in this phase, as the notification lists them. */
  actProvisions: string;
  /** Rules that start in this phase. */
  rules: string;
  /** Plain bullets: what actually begins. */
  whatBegins: string[];
  /** Who should care. */
  whoShouldCare: string;
  claimIds: string[];
};

export type LegalEvent = {
  date: string;
  title: string;
  detail: string;
  /** "done" events are in the past relative to the as-of date. */
  claimIds: string[];
  doc?: DocKey;
};

export type WhatChanges = {
  id: string;
  title: string;
  body: string;
  /** Phase id when the main effect begins. */
  phaseId: string;
  claimIds: string[];
};

export type ImplicationKind = "legal_duty" | "legal_right" | "legal_fact" | "our_reading";

export type Implication = {
  kind: ImplicationKind;
  text: string;
  phaseId?: string;
  claimIds: string[];
};

export type Stakeholder = {
  id: string;
  label: string;
  /** "You" framing for the selector, e.g. "If you run a small business". */
  prompt: string;
  headline: string;
  implications: Implication[];
  /** What is genuinely unknown for this group. */
  openQuestions: string[];
};

export type BaselineAnswer = {
  id: string;
  question: string;
  /** 1-3 sentences, the direct answer. */
  answer: string;
  /** Optional supporting detail bullets. */
  details?: string[];
  claimIds: string[];
  /** Last ISO date on which the wording is still true; after it, fall back to live research. */
  validThrough?: string;
};

export type WatchItem = {
  title: string;
  body: string;
  /** Secondary or unofficial sources are labelled as such. */
  sources: { label: string; url: string; official: boolean }[];
};

export type PolicyKnowledge = {
  slug: string;
  title: string;
  shortTitle: string;
  identifier: string;
  ministry: string;
  /** ISO date the content was last checked against sources. */
  lastChecked: string;
  /** 80–130 word citizen brief. */
  brief: string;
  /** One line for cards and search results. */
  purpose: string;
  /** The Act's number and year, so a search that resolves to it opens this page. */
  act?: { number: number; year: number };
  /** Lower-case words a citizen might search for. */
  aliases: string[];
  whatChanges: WhatChanges[];
  phases: Phase[];
  /** Rules have their own schedule, kept separate from the Act. */
  rulesPhases: { date: string; rules: string; plain: string; claimIds: string[] }[];
  events: LegalEvent[];
  stakeholders: Stakeholder[];
  baselineAnswers: BaselineAnswer[];
  watch: WatchItem[];
  documents: OfficialDocument[];
  claims: EvidenceClaim[];
};
