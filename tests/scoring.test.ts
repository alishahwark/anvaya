import { describe, expect, it } from "vitest";
import { evaluateIndicators, scoreDimensions } from "@/lib/scoring/aggregate";
import { extractFeatures } from "@/lib/scoring/features";
import { DELEGATION, QUALIFIER, SANCTION, TIME_LIMIT } from "@/lib/scoring/lexicon";
import { textScorecard } from "@/lib/scoring/score";
import { buildBenchmark } from "@/lib/scoring/benchmarks/compare";

const clauses = (n: number, sentence: string) => Array.from({ length: n }, (_, i) => `(${i + 1}) ${sentence}`).join(" ");
const sample = [
  "1. Short title. This Act may be called the Sample Act, 2026. It shall come into force on the 1st day of April, 2027.",
  clauses(25, "Every operator shall file a return within thirty days, and shall give reasonable notice to the Authority."),
  clauses(6, "The Central Government may, by rules, prescribe the manner of filing, as may be prescribed."),
  "The Authority is hereby established. Whoever contravenes this Act shall be punishable with fine which may extend to ten lakh rupees. Whoever obstructs an inspector shall be liable to a penalty of five lakh rupees. Any person aggrieved by an order of the Authority may appeal within sixty days. Every rule made under this Act shall be laid before each House of Parliament.",
].join(" ");

describe("lexicon", () => {
  it("matches the intended phrases and not their near-misses", () => {
    expect(DELEGATION.test("The manner shall be as may be prescribed.")).toBe(true);
    expect(TIME_LIMIT.test("shall file within thirty days")).toBe(true);
    expect(TIME_LIMIT.test("shall file in due course")).toBe(false);
    expect(QUALIFIER.test("on reasonable grounds")).toBe(true);
    expect(QUALIFIER.test("unless otherwise notified")).toBe(false);
    expect(SANCTION.test("shall be punishable with fine")).toBe(true);
  });
});

describe("scoring", () => {
  const features = extractFeatures({ label: "Sample Act, 2026", pages: [sample] });
  const card = textScorecard("sample", "Sample Act, 2026", "test", features);
  it("keeps every score and interval inside 0–100 with lo ≤ score ≤ hi", () => {
    for (const d of card.dimensions) {
      if (d.status !== "scored") continue;
      expect(d.score!).toBeGreaterThanOrEqual(0);
      expect(d.score!).toBeLessThanOrEqual(100);
      expect(d.lo!).toBeLessThanOrEqual(d.score!);
      expect(d.hi!).toBeGreaterThanOrEqual(d.score!);
    }
  });
  it("is exactly reproducible", () => {
    const again = textScorecard("sample", "Sample Act, 2026", "test", extractFeatures({ label: "Sample Act, 2026", pages: [sample] }));
    expect(again.dimensions.map((d) => [d.score, d.lo, d.hi])).toEqual(card.dimensions.map((d) => [d.score, d.lo, d.hi]));
  });
  it("detects the planted features", () => {
    const byId = Object.fromEntries(evaluateIndicators(features).map((i) => [i.id, i.value]));
    expect(byId.fixed_commencement).toBe(1);
    expect(byId.enforcer_designated).toBe(1);
    expect(byId.oversight_of_delegation).toBe(1);
    expect(byId.sanction_quantification).toBe(1);
  });
  it("monotone: removing the time limits lowers the deadline share", () => {
    const without = extractFeatures({ label: "Sample Act, 2026", pages: [sample.replace(/within thirty days/g, "promptly")] });
    const a = evaluateIndicators(features).find((i) => i.id === "deadline_share")!.value!;
    const b = evaluateIndicators(without).find((i) => i.id === "deadline_share")!.value!;
    expect(b).toBeLessThan(a);
  });
  it("reports insufficient evidence for a tiny text, never zero", () => {
    const tiny = extractFeatures({ label: "Tiny Amendment Bill, 2026", pages: ["In section 5 of the principal Act, for the word “ten” substitute “twelve”."] });
    const dims = scoreDimensions(tiny, evaluateIndicators(tiny));
    expect(dims.find((d) => d.id === "enforceability")!.status).toBe("insufficient");
    expect(dims.find((d) => d.id === "enforceability")!.score).toBeNull();
  });
});

describe("benchmarks", () => {
  const features = extractFeatures({ label: "Sample Act, 2026", pages: [sample] });
  it("refuses a benchmark for areas with no verified comparators, and for amending bills", () => {
    const card = textScorecard("s", "Sample Act, 2026", "t", features);
    expect(buildBenchmark("Sample Act, 2026", card).eligible).toBe(false);
    const amending = { ...card, instrument: "amending" as const };
    expect(buildBenchmark("Telecommunications (Amendment) Bill", amending).eligible).toBe(false);
  });
  it("benchmarks a telecom statute against the stored comparators", () => {
    const card = textScorecard("s", "The Telecommunications Bill, 2023", "t", features);
    const bench = buildBenchmark("The Telecommunications Bill, 2023", card);
    expect(bench.eligible).toBe(true);
  });
});
