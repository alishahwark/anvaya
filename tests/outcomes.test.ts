import { describe, expect, it } from "vitest";
import { differenceInDifferences, interruptedTimeSeries, metaAnalysis, normalCdf, simulateDid, syntheticControl, ols } from "@/lib/scoring/outcomes/estimators";
import { effectStatus } from "@/lib/scoring/outcomes/evidence";
import { seeded, standardNormal } from "@/lib/scoring/rng";

describe("estimators recover known effects", () => {
  it("OLS recovers coefficients exactly without noise", () => {
    const X = [[1, 0], [1, 1], [1, 2], [1, 3]];
    const fit = ols(X, [1, 3, 5, 7]);
    expect(fit.beta[0]).toBeCloseTo(1, 8);
    expect(fit.beta[1]).toBeCloseTo(2, 8);
  });
  it("normalCdf is accurate", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });
  it("DiD is approximately unbiased with near-nominal coverage", () => {
    let covered = 0;
    let sum = 0;
    const R = 150;
    for (let r = 0; r < R; r += 1) {
      const est = differenceInDifferences(simulateDid(seeded(1000 + r), { units: 40, treatedUnits: 20, periods: 8, adoption: 4, effect: 2 }));
      sum += est.effect;
      if (est.lo <= 2 && 2 <= est.hi) covered += 1;
    }
    expect(Math.abs(sum / R - 2)).toBeLessThan(0.1);
    expect(covered / R).toBeGreaterThan(0.88);
    expect(covered / R).toBeLessThan(0.99);
  });
  it("DiD finds no effect when there is none", () => {
    const est = differenceInDifferences(simulateDid(seeded(7), { units: 40, treatedUnits: 20, periods: 8, adoption: 4, effect: 0 }));
    expect(est.lo).toBeLessThan(0.0001 + 0.5);
    expect(est.lo <= 0 && 0 <= est.hi).toBe(true);
  });
  it("DiD warns when there are few clusters", () => {
    const est = differenceInDifferences(simulateDid(seeded(3), { units: 8, treatedUnits: 4, periods: 6, adoption: 3, effect: 1 }));
    expect(est.notes.join(" ")).toMatch(/Fewer than 20 clusters/);
  });
  it("ITS recovers a level shift under autocorrelated noise", () => {
    let covered = 0;
    const R = 150;
    for (let r = 0; r < R; r += 1) {
      const random = seeded(500 + r);
      const y: number[] = [];
      let e = 0;
      for (let t = 0; t < 60; t += 1) {
        e = 0.4 * e + standardNormal(random);
        y.push(10 + 0.1 * t + (t >= 30 ? 3 : 0) + e);
      }
      const est = interruptedTimeSeries(y, 30);
      if (est.lo <= 3 && 3 <= est.hi) covered += 1;
    }
    expect(covered / R).toBeGreaterThan(0.82);
  });
  it("synthetic control detects a large effect and not a null", () => {
    const build = (effect: number, seed: number) => {
      const random = seeded(seed);
      const T = 20;
      const factor = Array.from({ length: T }, (_, t) => Math.sin(t / 3) * 2 + t * 0.2);
      const unit = (load: number) => factor.map((f) => load * f + 5 + standardNormal(random) * 0.2);
      const donors = Array.from({ length: 12 }, (_, j) => unit(0.6 + (j % 5) * 0.15));
      const treated = unit(1.0).map((v, t) => v + (t >= 14 ? effect : 0));
      return syntheticControl(treated, donors, 14);
    };
    const big = build(4, 11);
    expect(big.effect).toBeGreaterThan(3);
    expect(big.pPlacebo).toBeLessThan(0.15);
    expect(build(0, 12).pPlacebo).toBeGreaterThan(0.15);
  });
  it("meta-analysis pools and reports heterogeneity", () => {
    const same = metaAnalysis([{ id: "a", effect: 1, se: 0.2 }, { id: "b", effect: 1.1, se: 0.2 }, { id: "c", effect: 0.9, se: 0.2 }]);
    expect(same.effect).toBeCloseTo(1, 1);
    expect(same.i2).toBeLessThan(0.1);
    const diff = metaAnalysis([{ id: "a", effect: -1, se: 0.1 }, { id: "b", effect: 2, se: 0.1 }]);
    expect(diff.i2).toBeGreaterThan(0.9);
    expect(diff.hi - diff.lo).toBeGreaterThan(2);
  });
});

describe("effect circle is gated", () => {
  it("is not measurable without studies or with only weak designs", () => {
    expect(effectStatus([]).measurable).toBe(false);
    expect(effectStatus([{ id: "x", source: "s", url: "u", outcome: "o", design: "before_after", effect: 1, se: 1, n: 10, unit: "u", retrieved: "2026-10-25" }]).measurable).toBe(false);
    expect(effectStatus([{ id: "x", source: "s", url: "u", outcome: "o", design: "did", effect: 1, se: 1, n: 10, unit: "u", retrieved: "2026-10-25" }]).measurable).toBe(true);
  });
});
