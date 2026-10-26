/**
 * Fetches each comparator statute from its official legislation site, checks the title, scores it with the
 * same engine as Indian records, and writes data/benchmarks/comparators.json. Run: npx tsx scripts/build-benchmarks.ts [id-substring]
 * Network is needed here and nowhere else: the app reads the committed JSON.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { COMPARATOR_HOSTS, fetchBounded } from "@/lib/research/security";
import { extractFeatures } from "@/lib/scoring/features";
import { TOPICS } from "@/lib/scoring/benchmarks/registry";
import { INDIA_ONLY_INDICATORS, textScorecard } from "@/lib/scoring/score";
import { markupToPages } from "@/lib/scoring/text";

const OUT = "data/benchmarks/comparators.json";
const filter = process.argv[2] ?? "";
const existing: Record<string, any> = filter && existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

async function main() {
  for (const topic of TOPICS) {
    for (const comp of topic.comparators) {
      if (filter && !comp.id.includes(filter)) continue;
      let ok = false;
      for (const url of comp.urls) {
        try {
          const got = await fetchBounded(url, 120000, 60_000_000, COMPARATOR_HOSTS);
          const raw = new TextDecoder().decode(got.buffer);
          const pages = markupToPages(raw);
          const head = pages.slice(0, 2).join(" ").toLowerCase();
          if (!head.includes(comp.expect.toLowerCase())) {
            console.log(`REJECT ${comp.id}: title "${comp.expect}" not near the start of ${url}`);
            continue;
          }
          const features = extractFeatures({ label: comp.title, pages });
          const card = textScorecard(comp.id, comp.title, `${comp.country}: ${url.includes("/enacted/") ? "as enacted" : "current consolidated text"}`, features, INDIA_ONLY_INDICATORS);
          existing[comp.id] = {
            topic: topic.id, country: comp.country, title: comp.title, year: comp.year, url: got.finalUrl,
            sha256: createHash("sha256").update(got.buffer).digest("hex"), fetchedAt: new Date().toISOString(),
            basis: card.basis, sentences: card.sentences, words: card.words, instrument: card.instrument,
            dimensions: card.dimensions.map((d) => ({ id: d.id, score: d.score, lo: d.lo, hi: d.hi, status: d.status, available: d.available, total: d.total, indicators: d.indicators.map((i) => ({ id: i.id, value: i.value })) })),
          };
          console.log(`OK ${comp.id} (${card.basis}) ${card.sentences} sentences; ${card.dimensions.map((d) => (d.score === null ? "—" : Math.round(d.score))).join("/")}`);
          ok = true;
          break;
        } catch (error) {
          console.log(`FAIL ${comp.id} ${url}: ${error instanceof Error ? error.message : error}`);
        }
      }
      if (!ok) console.log(`SKIPPED ${comp.id}: not verified, so it will not be used`);
    }
  }
  writeFileSync(OUT, JSON.stringify(existing, null, 1));
}
main();
