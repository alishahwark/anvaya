/**
 * Sizes used in the report's cost and impact sections, computed from the real documents:
 *  - how many tokens the whole DPDP corpus would be if sent with every question (vs what retrieval sends);
 *  - how many words a reader must read in the official Act and Rules versus Anvaya's brief and change summaries.
 * Tokens are estimated as characters / 4, a common rule of thumb for English; it is an estimate, not a tokenizer count.
 * Run: npx tsx scripts/cost-stats.ts
 */
import { writeFileSync } from "node:fs";
import { loadPdfPages } from "../lib/knowledge/pdf-text";
import { dpdpKnowledge } from "../lib/knowledge/dpdp";

const words = (text: string) => text.split(/\s+/).filter((token) => /[A-Za-z0-9]/.test(token)).length;
async function main() {
  // Unique page text of the six official documents (passages overlap, so they are not used for sizing).
  let chars = 0;
  let officialWords = 0;
  let actWords = 0;
  for (const document of dpdpKnowledge.documents) {
    const pages = await loadPdfPages(document.localFile);
    const text = pages.join(" ");
    chars += text.length;
    const count = words(text);
    officialWords += count;
    if (document.key === "act") actWords = count;
  }
  const anvayaWords = words(dpdpKnowledge.brief) + dpdpKnowledge.whatChanges.reduce((n, c) => n + words(c.title) + words(c.body), 0);
  const out = { computedOn: new Date().toISOString().slice(0, 10), documents: dpdpKnowledge.documents.length, corpusChars: chars, corpusTokensEstimate: Math.round(chars / 4), officialWords, actWords, anvayaBriefAndChangesWords: anvayaWords, readingWordsPerMinuteAssumed: 200 };
  writeFileSync("data/benchmarks/cost-stats.json", JSON.stringify(out, null, 1));
  console.log(out);
}
main();
