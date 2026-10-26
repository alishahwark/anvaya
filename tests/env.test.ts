import { describe, expect, it } from "vitest";
import { seedEvidence, seedMilestones, seedPolicies } from "../data/fixtures/seed-data";
describe("Anvaya seed contract", () => { it("ships offline with a policy, milestones, and evidence", () => { expect(seedPolicies[0].status).toBe("Enacted"); expect(seedMilestones.length).toBeGreaterThan(0); expect(seedEvidence.every((item) => item.sourceType.includes("Official"))).toBe(true); }); });
