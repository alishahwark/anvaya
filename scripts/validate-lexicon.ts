/** Prints a seeded random sample of sentences flagged by each pattern, for hand-reading (precision check). Usage: npx tsx scripts/validate-lexicon.ts <slug> [n] */
import { extractFeatures } from "@/lib/scoring/features";
import { loadFeatureInput } from "@/lib/scoring/inputs";
import { sentencesOf, splitOperative } from "@/lib/scoring/text";
import { seeded } from "@/lib/scoring/rng";

async function main() {
  const slug = process.argv[2];
  const n = Number(process.argv[3] ?? 10);
  const loaded = await loadFeatureInput(slug);
  if (!loaded) return console.log("no text");
  const f = extractFeatures(loaded.input);
  const sents = sentencesOf(splitOperative(loaded.input.pages).operative).sentences;
  const random = seeded(42);
  for (const key of ["del", "timed", "qual", "qsanc", "obl"] as const) {
    const idx = [...f.flags[key]].map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    console.log(`\n=== ${key}: ${idx.length} flagged of ${f.sentences}`);
    for (let k = 0; k < Math.min(n, idx.length); k += 1) console.log(`- ${(sents[idx[Math.floor(random() * idx.length)]]?.text ?? "").slice(0, 230)}`);
  }
}
main();
