export type EvidenceKind = "official" | "analysis";
export function isOfficial(kind: EvidenceKind) { return kind === "official"; }
