/** Prints the text-based scorecard for every record in the register, for inspection. */
import { scoreSlug } from "../lib/scoring/score";
import { listEngineRecords } from "../lib/engine/store";
import { allKnowledge } from "../lib/knowledge";

async function main() {
  const slugs = [...allKnowledge().map((k) => k.slug), ...(await listEngineRecords()).map((r) => r.slug)];
  const only = process.argv[2];
  for (const slug of slugs) {
    if (only && !slug.includes(only)) continue;
    const started = Date.now();
    const out = await scoreSlug(slug);
    if (!out) { console.log(`${slug}: no readable text`); continue; }
    const { card, features } = out;
    const cells = card.dimensions.map((d) => (d.score === null ? `${d.id.slice(0, 5)}: —(${d.available}/${d.total})` : `${d.id.slice(0, 5)}: ${d.score.toFixed(0)} [${d.lo?.toFixed(0)}–${d.hi?.toFixed(0)}] (${d.available}/${d.total})`));
    console.log(`\n${card.title.slice(0, 58)} · ${card.instrument} · ${features.sentences} sentences, ${features.countObl} binding · ${Date.now() - started}ms\n   ${cells.join("  ")}`);
    if (only) for (const d of card.dimensions) { console.log(`\n## ${d.name}: ${d.why}`); for (const i of d.indicators) console.log(`   ${i.value === null ? "  —  " : i.value.toFixed(2)}  ${i.id}${i.numerator !== undefined ? ` (${i.numerator}/${i.denominator})` : ""}`); }
  }
}
main().then(() => process.exit(0));
