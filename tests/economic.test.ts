import { describe, expect, it } from "vitest";
import { calculateScenario } from "../lib/economic/scenario";
import { calculateStatistics, periodChange } from "../lib/economic/statistics";

const observations = [
  { period: "2024-01", geography: "All India", metric: "index_al" as const, value: 100, unit: "index points" },
  { period: "2024-02", geography: "All India", metric: "index_al" as const, value: 105, unit: "index points" },
  { period: "2024-03", geography: "All India", metric: "index_al" as const, value: 110, unit: "index points" },
];

describe("economic calculations", () => {
  it("calculates deterministic summary statistics", () => {
    const result = calculateStatistics(observations);
    expect(result.count).toBe(3);
    expect(result.mean).toBe(105);
    expect(result.median).toBe(105);
    expect(result.absoluteChange).toBe(10);
    expect(result.percentageChange).toBe(10);
  });
  it("returns null for a zero denominator", () => {
    expect(calculateStatistics([{ ...observations[0], value: 0 }, observations[1]]).percentageChange).toBeNull();
  });
  it("uses the requested lag for period changes", () => {
    expect(periodChange(observations, 1).at(-1)?.change).toBeCloseTo(4.7619, 3);
  });
  it("calculates the illustrative scenario without an LLM", () => {
    expect(calculateScenario({ businesses: 10, initialPerBusiness: 100, recurringPerBusiness: 20, years: 2, sharedReductionPercent: 50 })).toEqual({ initial: 1000, recurringAnnual: 100, cumulative: 1200, effectiveRecurring: 10 });
  });
});
