import { readFileSync } from "node:fs";
import path from "node:path";
import { TOPICS, topicOf } from "@/lib/scoring/benchmarks/registry";
import type { DimensionId, Scorecard } from "@/lib/scoring/types";

/** Smallest comparator Act that is scored. Shorter texts give ratios too coarse to compare. */
export const MIN_COMPARATOR_SENTENCES = 100;
/** Smallest comparator set for which a rank and percentile are reported; fewer are shown as a table only. */
export const MIN_FOR_RANK = 3;

type StoredComparator = {
  topic: string; country: string; title: string; year: number; url: string; sha256: string; fetchedAt: string; basis: string; sentences: number; words: number; instrument: string;
  dimensions: Array<{ id: DimensionId; score: number | null; lo: number | null; hi: number | null; status: string; available: number; total: number; indicators: Array<{ id: string; value: number | null }> }>;
};

let cache: Record<string, StoredComparator> | null = null;
export function loadComparators(): Record<string, StoredComparator> {
  if (!cache) {
    try {
      cache = JSON.parse(readFileSync(path.join(process.cwd(), "data/benchmarks/comparators.json"), "utf8"));
    } catch {
      cache = {};
    }
  }
  return cache!;
}

export type ComparatorPoint = { id: string; label: string; country: string; year: number; score: number; lo: number | null; hi: number | null; sentences: number; url: string; basis: string; indicators: Record<string, number | null> };

export type DimensionBenchmark = {
  dimension: DimensionId;
  focal: { score: number; lo: number | null; hi: number | null; indicators: Record<string, number | null> } | null;
  comparators: ComparatorPoint[];
  /** Reported only with at least MIN_FOR_RANK comparators. */
  stats: { n: number; median: number; min: number; max: number; below: number; percentile: number; looMedianRange: [number, number]; gapToMedian: number } | null;
  /** Same statistic across every comparator in every area, as a wider reference distribution. */
  pooled: number[];
};

export type Benchmark =
  | { eligible: false; reason: string }
  | { eligible: true; topic: { id: string; label: string }; dimensions: DimensionBenchmark[]; excluded: Array<{ id: string; title: string; reason: string }>; selection: string };

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Builds the benchmark for a policy from its like-for-like scorecard (computed without Indian-only indicators,
 * exactly as the comparators were). Percentile is the share of comparators scoring below the policy plus half the ties.
 */
export function buildBenchmark(title: string, card: Scorecard): Benchmark {
  if (card.instrument === "amending") return { eligible: false, reason: "This is an amending bill. It changes parts of an existing law, so measuring its text alone would compare a patch with whole statutes. Benchmarks are only shown for principal laws." };
  if (/\brules\b/i.test(title) && !/\bact\b/i.test(title)) return { eligible: false, reason: "These are rules made under an Act (subordinate legislation). Comparing them with whole statutes would not be like for like." };
  const topic = topicOf(title);
  if (!topic) return { eligible: false, reason: "Anvaya has no comparator laws registered for this policy area yet, so it makes no international comparison rather than inventing one." };
  const all = loadComparators();
  const eligible = (c: StoredComparator) => c.sentences >= MIN_COMPARATOR_SENTENCES && c.instrument === "principal";
  const mine = Object.entries(all).filter(([, c]) => c.topic === topic.id);
  const usable = mine.filter(([, c]) => eligible(c));
  const excluded = [
    ...mine.filter(([, c]) => !eligible(c)).map(([id, c]) => ({ id, title: `${c.title} (${c.country}, ${c.year})`, reason: `Only ${c.sentences} sentences, below the ${MIN_COMPARATOR_SENTENCES} needed for stable ratios.` })),
    ...TOPICS.find((t) => t.id === topic.id)!.comparators.filter((c) => !(c.id in all)).map((c) => ({ id: c.id, title: `${c.title} (${c.country}, ${c.year})`, reason: "Could not be fetched and verified from the official site." })),
  ];
  if (!usable.length) return { eligible: false, reason: `Anvaya has no verified comparator laws for ${topic.label.toLowerCase()} yet, so it makes no international comparison.` };
  const dimensions: DimensionBenchmark[] = card.dimensions.map((dimension) => {
    const focalScored = dimension.status === "scored" && dimension.score !== null;
    const points: ComparatorPoint[] = usable.flatMap(([id, c]) => {
      const d = c.dimensions.find((x) => x.id === dimension.id);
      if (!d || d.status !== "scored" || d.score === null) return [];
      return [{ id, label: c.title, country: c.country, year: c.year, score: d.score, lo: d.lo, hi: d.hi, sentences: c.sentences, url: c.url, basis: c.basis, indicators: Object.fromEntries(d.indicators.map((i) => [i.id, i.value])) }];
    });
    const pooled = Object.values(all).filter(eligible).flatMap((c) => {
      const d = c.dimensions.find((x) => x.id === dimension.id);
      return d && d.status === "scored" && d.score !== null ? [d.score] : [];
    });
    let stats: DimensionBenchmark["stats"] = null;
    if (focalScored && points.length >= MIN_FOR_RANK) {
      const scores = points.map((p) => p.score);
      const f = dimension.score as number;
      const below = scores.filter((s) => s < f).length;
      const ties = scores.filter((s) => s === f).length;
      const loo = scores.map((_, i) => median(scores.filter((__, j) => j !== i)));
      stats = { n: scores.length, median: median(scores), min: Math.min(...scores), max: Math.max(...scores), below, percentile: (100 * (below + ties / 2)) / scores.length, looMedianRange: [Math.min(...loo), Math.max(...loo)], gapToMedian: f - median(scores) };
    }
    return { dimension: dimension.id, focal: focalScored ? { score: dimension.score as number, lo: dimension.lo, hi: dimension.hi, indicators: Object.fromEntries(dimension.indicators.map((i) => [i.id, i.value])) } : null, comparators: points, stats, pooled };
  });
  return { eligible: true, topic: { id: topic.id, label: topic.label }, dimensions, excluded, selection: `${usable.length} comparator law${usable.length === 1 ? "" : "s"} from ${[...new Set(usable.map(([, c]) => c.country))].join(" and ")}, chosen by Anvaya from official statute books. A different choice could change the comparison; the leave-one-out range shows how much.` };
}
