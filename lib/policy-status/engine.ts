export const legislativeStatuses = ["proposed", "introduced", "under_consideration", "passed_parliament", "presidential_assent", "in_force", "withdrawn", "rejected", "lapsed", "partially_commenced", "unknown"] as const;
export type LegislativeStatus = typeof legislativeStatuses[number];
export type VerifiedEvent = { eventType: LegislativeStatus; verificationStatus: "verified" | "unverified" | "conflicting" };

const order: Record<LegislativeStatus, number> = { proposed: 1, introduced: 2, under_consideration: 3, passed_parliament: 4, presidential_assent: 5, in_force: 6, withdrawn: 0, rejected: 0, lapsed: 0, partially_commenced: 5, unknown: -1 };
export function canApplyStatus(current: LegislativeStatus, next: LegislativeStatus, event: VerifiedEvent) {
  if (event.verificationStatus !== "verified") return false;
  if (current === "unknown") return true;
  if (["withdrawn", "rejected", "lapsed"].includes(next)) return ["proposed", "introduced", "under_consideration"].includes(current);
  if (next === "partially_commenced") return current === "presidential_assent" || current === "partially_commenced" || current === "in_force";
  if (next === "in_force") return current === "presidential_assent" || current === "partially_commenced";
  return order[next] >= order[current];
}
export function applyVerifiedStatus(current: LegislativeStatus, event: VerifiedEvent): LegislativeStatus { return canApplyStatus(current, event.eventType, event) ? event.eventType : current; }
export function statusLabel(status: LegislativeStatus) { return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
