export type CommencementGroup = { id: "A" | "B" | "C"; relativeRule: string; calculatedDate: string; provisions: string[]; sourceStatus: "unverified" | "verified" };
const publicationDate = "2025-11-13";
function addMonths(isoDate: string, months: number) { const date = new Date(`${isoDate}T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() + months); return date.toISOString().slice(0, 10); }
export const dpdpCommencementGroups: CommencementGroup[] = [
  { id: "A", relativeRule: "From publication of the notification", calculatedDate: publicationDate, provisions: ["Section 1(2)", "Section 2", "Sections 18–26", "Section 35", "Sections 38–43", "Section 44(1) and 44(3)"], sourceStatus: "unverified" },
  { id: "B", relativeRule: "One year after publication of the notification", calculatedDate: addMonths(publicationDate, 12), provisions: ["Section 6(9)", "Section 27(1)(d)"], sourceStatus: "unverified" },
  { id: "C", relativeRule: "Eighteen months after publication of the notification", calculatedDate: addMonths(publicationDate, 18), provisions: ["Sections 3–5", "Section 6(1)–(8) and 6(10)", "Sections 7–17", "Remaining specified portions of Section 27", "Sections 28–34", "Sections 36–37", "Section 44(2)"], sourceStatus: "unverified" }
];
export function commencementState(group: CommencementGroup, asOf: string) { if (group.sourceStatus !== "verified") return "scheduled_unverified" as const; return asOf >= group.calculatedDate ? "effective_on_schedule" as const : "future_on_schedule" as const; }
