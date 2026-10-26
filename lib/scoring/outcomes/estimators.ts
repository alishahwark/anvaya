import { standardNormal } from "@/lib/scoring/rng";

/**
 * Causal-effect estimators for the "evidence of effect" dimension. They are generic: give them an outcome
 * series or panel and they return an effect estimate with an uncertainty interval. They are validated only on
 * simulated data with a known true effect (tests/outcomes.test.ts). No real outcome data is bundled.
 */

export type Estimate = { method: string; effect: number; se: number; lo: number; hi: number; n: number; notes: string[] };

const Z95 = 1.959964;

export function normalCdf(x: number): number {
  // Abramowitz–Stegun 7.1.26 via erf
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp((-x * x) / 2);
  return 0.5 * (1 + (x >= 0 ? y : -y));
}

/** Solve A x = b by Gaussian elimination with partial pivoting. */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c += 1) {
    let p = c;
    for (let r = c + 1; r < n; r += 1) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) throw new Error("Singular design matrix");
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r += 1) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k += 1) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r -= 1) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k += 1) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

function inverse(A: number[][]): number[][] {
  const n = A.length;
  const cols = Array.from({ length: n }, (_, j) => solve(A, Array.from({ length: n }, (_, i) => (i === j ? 1 : 0))));
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => cols[j][i]));
}

export type Ols = { beta: number[]; resid: number[]; XtXinv: number[][] };

export function ols(X: number[][], y: number[]): Ols {
  const k = X[0].length;
  const XtX = Array.from({ length: k }, () => new Array(k).fill(0));
  const Xty = new Array(k).fill(0);
  X.forEach((row, i) => {
    for (let a = 0; a < k; a += 1) {
      Xty[a] += row[a] * y[i];
      for (let b = 0; b < k; b += 1) XtX[a][b] += row[a] * row[b];
    }
  });
  const XtXinv = inverse(XtX);
  const beta = solve(XtX, Xty);
  const resid = y.map((v, i) => v - X[i].reduce((s, x, j) => s + x * beta[j], 0));
  return { beta, resid, XtXinv };
}

/** Cluster-robust (CR1) variance of OLS coefficients: Liang & Zeger (1986) with the usual small-sample factor. */
export function clusterVariance(X: number[][], fit: Ols, clusters: Array<string | number>): number[][] {
  const k = X[0].length;
  const groups = new Map<string | number, number[]>();
  clusters.forEach((g, i) => groups.set(g, [...(groups.get(g) ?? []), i]));
  const meat = Array.from({ length: k }, () => new Array(k).fill(0));
  for (const rows of groups.values()) {
    const s = new Array(k).fill(0);
    for (const i of rows) for (let a = 0; a < k; a += 1) s[a] += X[i][a] * fit.resid[i];
    for (let a = 0; a < k; a += 1) for (let b = 0; b < k; b += 1) meat[a][b] += s[a] * s[b];
  }
  const G = groups.size;
  const n = X.length;
  const factor = (G / (G - 1)) * ((n - 1) / (n - k));
  const B = fit.XtXinv;
  const mult = (P: number[][], Q: number[][]) => P.map((row) => Q[0].map((_, j) => row.reduce((s, v, m) => s + v * Q[m][j], 0)));
  return mult(mult(B, meat), B).map((row) => row.map((v) => v * factor));
}

function finish(method: string, effect: number, se: number, n: number, notes: string[]): Estimate {
  return { method, effect, se, lo: effect - Z95 * se, hi: effect + Z95 * se, n, notes };
}

export type PanelRow = { unit: string; period: number; y: number; treated: boolean };

/**
 * Two-way fixed-effects difference-in-differences with cluster-robust standard errors. `treated` marks
 * unit-periods under the policy. Valid for a single common adoption date; with staggered adoption and
 * heterogeneous effects TWFE can be biased (Goodman-Bacon 2021), which is stated in the notes.
 */
export function differenceInDifferences(rows: PanelRow[]): Estimate {
  const units = [...new Set(rows.map((r) => r.unit))];
  const periods = [...new Set(rows.map((r) => r.period))].sort((a, b) => a - b);
  if (units.length < 4 || periods.length < 3) throw new Error("Difference-in-differences needs at least 4 units and 3 periods.");
  const adoption = new Set(rows.filter((r) => r.treated).map((r) => r.period));
  const treatedUnits = new Set(rows.filter((r) => r.treated).map((r) => r.unit));
  if (treatedUnits.size === 0 || treatedUnits.size === units.length) throw new Error("Need both treated and comparison units.");
  const X = rows.map((r) => [
    r.treated ? 1 : 0,
    ...units.slice(1).map((u) => (r.unit === u ? 1 : 0)),
    ...periods.slice(1).map((p) => (r.period === p ? 1 : 0)),
    1,
  ]);
  const fit = ols(X, rows.map((r) => r.y));
  const V = clusterVariance(X, fit, rows.map((r) => r.unit));
  const notes = [`${treatedUnits.size} treated and ${units.length - treatedUnits.size} comparison units, ${periods.length} periods.`];
  if (units.length < 20) notes.push("Fewer than 20 clusters: cluster-robust standard errors are anti-conservative; treat the interval as optimistic.");
  if (new Set([...adoption]).size > 0 && treatedUnits.size > 0) {
    const firstTreat = new Map<string, number>();
    for (const r of rows) if (r.treated) firstTreat.set(r.unit, Math.min(firstTreat.get(r.unit) ?? Infinity, r.period));
    if (new Set(firstTreat.values()).size > 1) notes.push("Adoption dates differ across units: TWFE can be biased under heterogeneous effects (Goodman-Bacon 2021).");
  }
  return finish("Difference-in-differences (two-way fixed effects, cluster-robust)", fit.beta[0], Math.sqrt(V[0][0]), rows.length, notes);
}

/** Newey–West HAC covariance for OLS coefficients with Bartlett kernel (Newey & West 1987). */
export function neweyWestVariance(X: number[][], fit: Ols, lag: number): number[][] {
  const k = X[0].length;
  const n = X.length;
  const g = X.map((row, i) => row.map((v) => v * fit.resid[i]));
  const S = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let l = 0; l <= lag; l += 1) {
    const w = l === 0 ? 1 : 1 - l / (lag + 1);
    for (let t = l; t < n; t += 1) {
      for (let a = 0; a < k; a += 1) {
        for (let b = 0; b < k; b += 1) {
          const add = w * g[t][a] * g[t - l][b];
          S[a][b] += add;
          if (l > 0) S[b][a] += add;
        }
      }
    }
  }
  const B = fit.XtXinv;
  const mult = (P: number[][], Q: number[][]) => P.map((row) => Q[0].map((_, j) => row.reduce((s, v, m) => s + v * Q[m][j], 0)));
  const factor = n / (n - k);
  return mult(mult(B, S), B).map((row) => row.map((v) => v * factor));
}

/**
 * Interrupted time series: segmented regression y = a + b·t + level·post + slope·(t−t0)·post.
 * Returns the level change at the interruption; Newey–West standard errors handle autocorrelation.
 */
export function interruptedTimeSeries(y: number[], interruption: number, lag?: number): Estimate & { slopeChange: number } {
  const n = y.length;
  if (interruption < 4 || n - interruption < 4) throw new Error("Interrupted time series needs at least 4 points on each side.");
  const X = y.map((_, t) => {
    const post = t >= interruption ? 1 : 0;
    return [1, t, post, post * (t - interruption)];
  });
  const fit = ols(X, y);
  const L = lag ?? Math.floor(Math.pow(n, 1 / 3));
  const V = neweyWestVariance(X, fit, L);
  const est = finish("Interrupted time series (segmented regression, Newey–West)", fit.beta[2], Math.sqrt(V[2][2]), n, [
    `${interruption} points before and ${n - interruption} after; Newey–West lag ${L}.`,
    "Identifies the effect only if nothing else changed at the interruption; there is no comparison series.",
  ]);
  return { ...est, slopeChange: fit.beta[3] };
}

/** Project a vector onto the probability simplex (Duchi et al. 2008). */
function projectSimplex(v: number[]): number[] {
  const u = [...v].sort((a, b) => b - a);
  let css = 0;
  let rho = 0;
  let theta = 0;
  u.forEach((value, i) => {
    css += value;
    const t = (css - 1) / (i + 1);
    if (value - t > 0) {
      rho = i + 1;
      theta = t;
    }
  });
  void rho;
  return v.map((x) => Math.max(x - theta, 0));
}

function fitWeights(donors: number[][], target: number[]): number[] {
  const J = donors.length;
  let w = new Array(J).fill(1 / J);
  let L = 0;
  for (const d of donors) L += d.reduce((s, x) => s + x * x, 0);
  const step = 1 / Math.max(L, 1e-9);
  for (let iter = 0; iter < 4000; iter += 1) {
    const pred = target.map((_, t) => donors.reduce((s, d, j) => s + w[j] * d[t], 0));
    const grad = donors.map((d) => d.reduce((s, x, t) => s + 2 * x * (pred[t] - target[t]), 0));
    w = projectSimplex(w.map((x, j) => x - step * grad[j]));
  }
  return w;
}

/**
 * Synthetic control (Abadie, Diamond & Hainmueller 2010): weight comparison units (non-negative, summing to
 * one) to match the treated unit before adoption; the effect is the mean post-period gap. Inference is by
 * in-space placebo: the same procedure applied to each donor, reported as a rank p-value (no normal theory).
 */
export function syntheticControl(treated: number[], donors: number[][], adoption: number): Estimate & { pPlacebo: number; preRmspe: number } {
  const T = treated.length;
  if (adoption < 5 || T - adoption < 2) throw new Error("Synthetic control needs at least 5 pre-period and 2 post-period points.");
  if (donors.length < 5) throw new Error("Synthetic control needs at least 5 donor units for placebo inference.");
  const gapStat = (target: number[], pool: number[][]) => {
    const w = fitWeights(pool.map((d) => d.slice(0, adoption)), target.slice(0, adoption));
    const synth = target.map((_, t) => pool.reduce((s, d, j) => s + w[j] * d[t], 0));
    const pre = Math.sqrt(target.slice(0, adoption).reduce((s, v, t) => s + (v - synth[t]) ** 2, 0) / adoption);
    const post = target.slice(adoption).reduce((s, v, t) => s + (v - synth[adoption + t]), 0) / (T - adoption);
    const postRmspe = Math.sqrt(target.slice(adoption).reduce((s, v, t) => s + (v - synth[adoption + t]) ** 2, 0) / (T - adoption));
    return { gap: post, pre, ratio: postRmspe / Math.max(pre, 1e-9) };
  };
  const main = gapStat(treated, donors);
  const placebos = donors.map((d, j) => gapStat(d, donors.filter((_, k) => k !== j)).ratio);
  const p = (1 + placebos.filter((r) => r >= main.ratio).length) / (1 + donors.length);
  const placeboGaps = donors.map((d, j) => gapStat(d, donors.filter((_, k) => k !== j)).gap).sort((a, b) => a - b);
  const lo = placeboGaps[Math.floor(0.05 * placeboGaps.length)];
  const hi = placeboGaps[Math.ceil(0.95 * placeboGaps.length) - 1];
  return {
    method: "Synthetic control (simplex weights, placebo inference)",
    effect: main.gap,
    se: NaN,
    lo: main.gap - (hi - lo) / 2,
    hi: main.gap + (hi - lo) / 2,
    n: T,
    notes: [
      `${donors.length} donor units; pre-period RMSPE ${main.pre.toFixed(3)}.`,
      `Placebo p-value ${p.toFixed(3)} (rank of the post/pre RMSPE ratio among placebos; minimum possible ${(1 / (1 + donors.length)).toFixed(3)}).`,
      "Interval is the spread of placebo gaps, not a normal-theory interval.",
    ],
    pPlacebo: p,
    preRmspe: main.pre,
  };
}

export type StudyEffect = { id: string; effect: number; se: number };

/** DerSimonian–Laird random-effects meta-analysis (DerSimonian & Laird 1986) with I² and τ². */
export function metaAnalysis(studies: StudyEffect[]): { effect: number; se: number; lo: number; hi: number; tau2: number; i2: number; k: number } {
  if (studies.length < 2) throw new Error("Meta-analysis needs at least two studies.");
  const w = studies.map((s) => 1 / (s.se * s.se));
  const sw = w.reduce((a, b) => a + b, 0);
  const fixed = studies.reduce((s, st, i) => s + w[i] * st.effect, 0) / sw;
  const Q = studies.reduce((s, st, i) => s + w[i] * (st.effect - fixed) ** 2, 0);
  const k = studies.length;
  const c = sw - w.reduce((s, x) => s + x * x, 0) / sw;
  const tau2 = Math.max(0, (Q - (k - 1)) / c);
  const wr = studies.map((st) => 1 / (st.se * st.se + tau2));
  const swr = wr.reduce((a, b) => a + b, 0);
  const effect = studies.reduce((s, st, i) => s + wr[i] * st.effect, 0) / swr;
  const se = Math.sqrt(1 / swr);
  return { effect, se, lo: effect - Z95 * se, hi: effect + Z95 * se, tau2, i2: Q > 0 ? Math.max(0, (Q - (k - 1)) / Q) : 0, k };
}

/** Simulation helpers used by the tests and the validation script. */
export function simulateDid(random: () => number, opts: { units: number; treatedUnits: number; periods: number; adoption: number; effect: number; noise?: number }): PanelRow[] {
  const rows: PanelRow[] = [];
  const noise = opts.noise ?? 1;
  for (let u = 0; u < opts.units; u += 1) {
    const unitEffect = standardNormal(random) * 2;
    const isTreated = u < opts.treatedUnits;
    for (let p = 0; p < opts.periods; p += 1) {
      const treated = isTreated && p >= opts.adoption;
      rows.push({ unit: `u${u}`, period: p, treated, y: unitEffect + 0.3 * p + (treated ? opts.effect : 0) + standardNormal(random) * noise });
    }
  }
  return rows;
}
