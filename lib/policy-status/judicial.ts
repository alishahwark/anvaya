export type JudicialEvent = { developmentType: "challenge" | "order" | "judgment"; stayStatus: "granted" | "denied" | "not_stated" | "unknown"; verificationStatus: "verified" | "unverified" };
export function hasVerifiedStay(event: JudicialEvent) { return event.developmentType === "order" && event.stayStatus === "granted" && event.verificationStatus === "verified"; }
