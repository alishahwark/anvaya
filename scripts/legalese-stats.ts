/**
 * Measures how hard the official texts in the register are to read, and how the plain-language text Anvaya writes
 * about them compares. Uses the Flesch–Kincaid grade formula with a simple syllable counter: a rough proxy for reading
 * difficulty, NOT a comprehension test. Writes data/benchmarks/legalese-stats.json (read by build-submission.ts).
 * Run: npx tsx scripts/legalese-stats.ts
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { allKnowledge } from "@/lib/knowledge";
import { listEngineRecords } from "@/lib/engine/store";
import { loadFeatureInput } from "@/lib/scoring/inputs";
import { sentencesOf, splitOperative } from "@/lib/scoring/text";

const ARCHAIC = /\b(notwithstanding|hereinafter|aforesaid|thereof|therein|thereto|thereunder|hereunder|hereby|herein|hereto|whereof|whereas)\b/gi;
const DELEGATING = /\bas may be prescribed\b|\bby rules\b|\bby notification\b/gi;

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const groups = w.replace(/e$/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}
const wordsOf = (text: string) => text.split(/\s+/).filter((token) => /[A-Za-z]/.test(token));
function grade(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => /[A-Za-z]/.test(s));
  const words = wordsOf(text);
  const syl = words.reduce((n, word) => n + syllables(word), 0);
  const perSentence = words.length / Math.max(1, sentences.length);
  return { words: words.length, sentences: sentences.length, wordsPerSentence: perSentence, fk: 0.39 * perSentence + 11.8 * (syl / Math.max(1, words.length)) - 15.59 };
}
const median = (v: number[]) => { const s = [...v].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

async function main() {
  const slugs = [...allKnowledge().map((k) => k.slug), ...(await listEngineRecords()).map((r) => r.slug)];
  const docs: any[] = [];
  for (const slug of slugs) {
    const loaded = await loadFeatureInput(slug);
    if (!loaded) continue;
    const operative = splitOperative(loaded.input.pages).operative;
    const { sentences } = sentencesOf(operative);
    if (sentences.length < 100) continue; // too short to say anything about drafting style
    const text = sentences.map((s) => s.text).join(" ");
    const g = grade(text);
    const count = (re: RegExp) => (text.match(re) ?? []).length;
    docs.push({ slug, title: loaded.title, ...g, archaicPer1000: (1000 * count(ARCHAIC)) / g.words, delegatingPer1000: (1000 * count(DELEGATING)) / g.words });
  }
  // Anvaya's own plain-language briefs, same formula
  const briefs = execSync(`sqlite3 data/seed/anvaya.seed.db "select analysis_json from policy_analyses"`, { maxBuffer: 50_000_000 }).toString().trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const briefGrades = briefs.map((b: any) => grade([b.brief.text, ...b.changes.map((c: any) => c.text)].join(" "))).filter((g) => g.words > 40);
  const out = {
    measuredOn: new Date().toISOString().slice(0, 10),
    method: "Flesch-Kincaid grade, simple syllable counter; proxy for reading difficulty, not a comprehension test",
    documents: docs.length,
    legal: { medianWordsPerSentence: median(docs.map((d) => d.wordsPerSentence)), medianFk: median(docs.map((d) => d.fk)), medianArchaicPer1000: median(docs.map((d) => d.archaicPer1000)), medianDelegatingPer1000: median(docs.map((d) => d.delegatingPer1000)), min: Math.min(...docs.map((d) => d.fk)), max: Math.max(...docs.map((d) => d.fk)) },
    anvayaBriefs: { n: briefGrades.length, medianWordsPerSentence: median(briefGrades.map((g) => g.wordsPerSentence)), medianFk: median(briefGrades.map((g) => g.fk)) },
    perDocument: docs.map((d) => ({ title: d.title, words: d.words, wordsPerSentence: Math.round(d.wordsPerSentence * 10) / 10, fk: Math.round(d.fk * 10) / 10 })),
  };
  writeFileSync("data/benchmarks/legalese-stats.json", JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ ...out, perDocument: undefined }, null, 1));
}
main();
