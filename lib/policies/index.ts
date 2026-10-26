export const policyStatuses = ["Proposed", "Passed", "Enacted", "Rules pending", "Unknown"] as const;
export type PolicyStatus = typeof policyStatuses[number];
