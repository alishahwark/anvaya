import type { EconomicObservation } from "./types";

export function sortedNumeric(observations: EconomicObservation[]) {
  return [...observations].sort((a, b) => a.period.localeCompare(b.period));
}

export function calculateStatistics(observations: EconomicObservation[]) {
  const values = observations.map((item) => item.value).filter(Number.isFinite);
  if (!values.length) return { count: 0, min: null, max: null, mean: null, median: null, absoluteChange: null, percentageChange: null, missing: 0 };
  const ordered = [...values].sort((a, b) => a - b);
  const first = sortedNumeric(observations)[0]?.value;
  const last = sortedNumeric(observations).at(-1)?.value;
  const denominator = first ?? 0;
  return {
    count: values.length,
    min: ordered[0],
    max: ordered.at(-1),
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    median: ordered.length % 2 ? ordered[Math.floor(ordered.length / 2)] : (ordered[ordered.length / 2 - 1] + ordered[ordered.length / 2]) / 2,
    absoluteChange: first !== undefined && last !== undefined ? last - first : null,
    percentageChange: denominator === 0 || first === undefined || last === undefined ? null : ((last - first) / denominator) * 100,
    missing: observations.length - values.length,
  };
}

export function periodChange(observations: EconomicObservation[], lag: number) {
  const sorted = sortedNumeric(observations);
  return sorted.map((item, index) => {
    const prior = sorted[index - lag]?.value;
    return { ...item, change: prior === undefined || prior === 0 ? null : ((item.value - prior) / prior) * 100 };
  });
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  return value === null || value === undefined ? "—" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(value);
}
