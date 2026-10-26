import { dpdpKnowledge } from "./dpdp";
import type { EvidenceClaim, EvidenceRef, OfficialDocument, Phase, PolicyKnowledge } from "./types";

export type { PolicyKnowledge, Phase, EvidenceClaim, EvidenceRef, OfficialDocument } from "./types";

const registry: Record<string, PolicyKnowledge> = {
  [dpdpKnowledge.slug]: dpdpKnowledge,
};

/** Curated, source-verified knowledge, or null for records that only have retrieved documents. */
export function getKnowledge(slug: string): PolicyKnowledge | null {
  return registry[slug] ?? null;
}

export function allKnowledge(): PolicyKnowledge[] {
  return Object.values(registry);
}

export function claimMap(knowledge: PolicyKnowledge): Map<string, EvidenceClaim> {
  return new Map(knowledge.claims.map((claim) => [claim.id, claim]));
}

export function documentMap(knowledge: PolicyKnowledge): Map<string, OfficialDocument> {
  return new Map(knowledge.documents.map((document) => [document.key, document]));
}

/** Deep link into the official PDF at a page. */
export function evidenceUrl(document: OfficialDocument, page: number): string {
  return `${document.url}#page=${page}`;
}

/** "Act, p. 7" style label for a reference. */
export function refLabel(document: OfficialDocument | undefined, ref: EvidenceRef): string {
  return `${document?.identifier ?? document?.title ?? ref.doc}, p. ${ref.page}`;
}

// ───────────── Dates ─────────────

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "13 November 2026" from an ISO date. Parses the parts directly to avoid timezone drift. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function todayIso(now: Date = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function utcDay(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((utcDay(toIso) - utcDay(fromIso)) / 86400000);
}

export type PhaseState = "in_force" | "upcoming";

export function phaseState(phase: Pick<Phase, "date">, asOf: string): PhaseState {
  return phase.date <= asOf ? "in_force" : "upcoming";
}

/** Plain label for a phase's date relative to the as-of date. */
export function phaseWhen(phase: Pick<Phase, "date">, asOf: string): string {
  if (phaseState(phase, asOf) === "in_force") return `In force since ${formatDate(phase.date)}`;
  const days = daysBetween(asOf, phase.date);
  return `Starts ${formatDate(phase.date)} (${days === 1 ? "tomorrow" : `in ${days} days`})`;
}

/** "in 19 days" / "tomorrow" for an upcoming phase; empty when it is already in force. */
export function phaseCountdown(phase: Pick<Phase, "date">, asOf: string): string {
  if (phaseState(phase, asOf) === "in_force") return "";
  const days = daysBetween(asOf, phase.date);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

export type LegalStatus = { label: string; sentence: string };

/** One plain status for the whole policy, computed from phase dates. */
export function legalStatus(knowledge: PolicyKnowledge, asOf: string): LegalStatus {
  const inForce = knowledge.phases.filter((phase) => phaseState(phase, asOf) === "in_force");
  const upcoming = knowledge.phases.filter((phase) => phaseState(phase, asOf) === "upcoming");
  if (!upcoming.length) return { label: "In force", sentence: "All sections of the Act are in force." };
  if (!inForce.length) return { label: "Not yet in force", sentence: `No section is in force yet. The first starts on ${formatDate(upcoming[0].date)}.` };
  const last = upcoming[upcoming.length - 1];
  const next = upcoming[0];
  const nextPart = next === last ? `The remaining provisions start on ${formatDate(last.date)}.` : `The next step is on ${formatDate(next.date)}, and the main duties and rights start on ${formatDate(last.date)}.`;
  return { label: "Partly in force", sentence: `Some provisions are in force. ${nextPart}` };
}
