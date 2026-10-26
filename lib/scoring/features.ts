import * as L from "@/lib/scoring/lexicon";
import { sentencesOf, splitOperative, type Memoranda } from "@/lib/scoring/text";
import type { DocFacts, FlagKey, PolicyFeatures, Sample } from "@/lib/scoring/types";

const trim = (text: string, max = 300) => (text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, "")}…`);

export type FeatureInput = {
  label: string;
  /** Pages of the authoritative text (the Act, or the bill as finally passed). */
  pages: string[];
  /** Pages of the bill as introduced, used only to read the memoranda Indian bills append. */
  introducedPages?: string[] | null;
  committeeReferral?: boolean | null;
};

/** True when a sentence binds, rather than defines or commences. */
export const isObligation = (sentence: string): boolean => L.OBLIGATION.test(sentence) && !L.NOT_BINDING.test(sentence);

/** Reads one document into per-sentence flags, document-level facts, and a few evidence samples. */
export function extractFeatures(input: FeatureInput): PolicyFeatures {
  const split = splitOperative(input.pages);
  const { sentences, words } = sentencesOf(split.operative);
  const n = sentences.length;
  const flags: Record<FlagKey, Uint8Array> = {
    ops: new Uint8Array(n), obl: new Uint8Array(n), del: new Uint8Array(n), timed: new Uint8Array(n), qual: new Uint8Array(n), sanc: new Uint8Array(n), qsanc: new Uint8Array(n),
  };
  const samples: Record<string, Sample[]> = {};
  const keep = (key: string, sentence: { text: string; page: number }) => {
    const bucket = (samples[key] ??= []);
    if (bucket.length < 3) bucket.push({ text: trim(sentence.text), page: sentence.page });
  };

  const monitoring = { information: false, inspection: false, inquiry: false, interim: false };
  const tiering = { threshold: false, classBased: false, risk: false, smallBusiness: false };
  const rungs = { direction: false, undertaking: false, monetary: false, suspension: false, blocking: false, criminal: false };
  const safeguards = { hearing: false, reasons: false, appeal: false };
  let enforcer = false;
  let appealSeen = false;
  let appealTimed = false;
  let exemption = false;
  let review = false;
  let laying = false;
  let transparency = false;
  let consultation = false;
  let commencementFixed = false;
  let commencementByNotice = false;
  let commencementFound = false;

  sentences.forEach((sentence, index) => {
    const text = sentence.text;
    const obligation = isObligation(text);
    const delegation = L.DELEGATION.test(text);
    const sanction = L.SANCTION.test(text) && (obligation || /\b(liable|offence|punish|penalt|fine|imprison|forfeit)/i.test(text));
    const permission = L.PERMISSION.test(text) && !obligation;
    if (obligation) flags.obl[index] = 1;
    if (delegation) flags.del[index] = 1;
    if (obligation || delegation || permission || sanction) flags.ops[index] = 1;
    if (obligation && L.TIME_LIMIT.test(text)) { flags.timed[index] = 1; keep("deadline_share", sentence); }
    if (obligation && L.QUALIFIER.test(text)) { flags.qual[index] = 1; keep("qualified_obligations", sentence); }
    if (sanction) {
      flags.sanc[index] = 1;
      if (L.QUANTIFIED.test(text)) { flags.qsanc[index] = 1; keep("sanction_quantification", sentence); }
    }
    if (delegation) keep("delegation_share", sentence);

    for (const [key, pattern] of Object.entries(L.MONITORING)) if (pattern.test(text)) { monitoring[key as keyof typeof monitoring] = true; keep("monitoring_powers", sentence); }
    for (const [key, pattern] of Object.entries(L.TIERING)) if (pattern.test(text)) { tiering[key as keyof typeof tiering] = true; keep("risk_tiering", sentence); }
    for (const [key, pattern] of Object.entries(L.RUNGS)) if (pattern.test(text) && (key !== "monetary" || sanction)) { rungs[key as keyof typeof rungs] = true; keep("escalation_breadth", sentence); }
    if (!enforcer && L.ENFORCER_ACT.test(text) && L.ENFORCER_BODY.test(text) && /\b(shall be|is hereby|are hereby|there shall be|is established|is constituted|shall (establish|constitute)|may (establish|constitute|appoint)|established|constituted)\b/i.test(text)) { enforcer = true; keep("enforcer_designated", sentence); }
    if (L.APPEAL.test(text) && L.APPEAL_BODY.test(text)) {
      appealSeen = true;
      if (L.APPEAL_TIME.test(text)) appealTimed = true;
      keep("redress_and_appeal", sentence);
    }
    if (L.SAFEGUARD.hearing.test(text)) { safeguards.hearing = true; keep("procedural_safeguards", sentence); }
    if (L.SAFEGUARD.reasons.test(text)) { safeguards.reasons = true; keep("procedural_safeguards", sentence); }
    if (L.EXEMPTION.test(text) && !exemption) { exemption = true; keep("exemption_provisions", sentence); }
    if (L.REVIEW.test(text) && !review) { review = true; keep("review_or_sunset", sentence); }
    if (L.LAYING.test(text) && !laying) { laying = true; keep("oversight_of_delegation", sentence); }
    if (L.TRANSPARENCY.test(text) && !transparency) { transparency = true; keep("transparency_duties", sentence); }
    if (L.CONSULTATION.test(text) && !consultation) { consultation = true; keep("consultation_requirement", sentence); }
    if (L.COMMENCEMENT.test(text) && index < Math.max(60, Math.floor(n * 0.15))) {
      commencementFound = true;
      if (L.COMMENCE_BY_NOTICE.test(text)) commencementByNotice = true;
      else if (L.COMMENCE_FIXED.test(text)) commencementFixed = true;
      keep("fixed_commencement", sentence);
    }
  });
  safeguards.appeal = appealSeen;

  const memoranda: Memoranda | null = input.introducedPages ? splitOperative(input.introducedPages).memoranda : split.memoranda;
  const doc: DocFacts = {
    enforcer,
    appeal: !appealSeen ? 0 : appealTimed ? 1 : 0.5,
    monitoring,
    tiering,
    rungs,
    safeguards,
    exemption,
    review,
    laying,
    transparency,
    consultation,
    commencement: !commencementFound ? null : commencementFixed && commencementByNotice ? 0.5 : commencementFixed ? 1 : commencementByNotice ? 0 : null,
    exAnte: memoranda ? { financialMemorandum: memoranda.financialMemorandum, quantified: memoranda.quantified, delegatedLegislationMemo: memoranda.delegatedLegislationMemo } : null,
  };

  const head = normalizeHead(input.pages);
  return {
    label: input.label,
    instrument: L.AMENDING.test(head) ? "amending" : "principal",
    pages: input.pages.length,
    words,
    sentences: n,
    countObl: countFlag(flags.obl),
    flags,
    doc,
    committeeReferral: input.committeeReferral ?? null,
    samples,
  };
}

function normalizeHead(pages: string[]): string {
  return pages.slice(0, 3).join(" ").replace(/\s+/g, " ").slice(0, 2500);
}

export const countFlag = (flag: Uint8Array): number => flag.reduce((sum, value) => sum + value, 0);
