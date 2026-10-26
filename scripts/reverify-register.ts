/**
 * Re-fetches and re-verifies every researched record against the live official sources, replacing
 * "provisional" records with checked ones. Safe to re-run; it never deletes anything.
 * Usage: npx tsx scripts/reverify-register.ts
 */
import { buildBillRecord, buildDocumentRecord } from "../lib/engine/resolve";
import { downloadFiles } from "../lib/engine/fetch-docs";
import { searchBills, titleScore } from "../lib/engine/sansad";
import { listResearchRecords, readableTitle } from "../lib/research/record";
import { readEngineRecord } from "../lib/engine/store";

const norm = (url: string) => decodeURIComponent(url).replace(/\s+/g, "").split("?")[0].toLowerCase();

async function main() {
  const records = await listResearchRecords();
  console.log(`${records.length} researched records to verify\n`);
  for (const record of records) {
    const url = record.documents[0]?.url ?? "";
    const started = Date.now();
    try {
      if (/sansad\.in/.test(url)) {
        const known = await readEngineRecord(record.slug);
        const { ranked } = await searchBills(known?.title ?? readableTitle(record.title));
        const candidates = ranked.filter((item) => item.score >= 0.9).map((item) => item.bill);
        // Several bills can share a title (private members re-introduce the same bill), so match on the stored file.
        const bill = candidates.find((b) => b.files.some((f) => norm(f.url) === norm(url))) ?? candidates[0];
        if (!bill) { console.log(`✗ ${record.title}: not found in Parliament's register`); continue; }
        const built = await buildBillRecord(record.slug, record.jobId, bill);
        console.log(`✓ ${bill.title.slice(0, 60).padEnd(60)} ${bill.house} ${bill.number}/${bill.year} → ${built.verification.level.toUpperCase().padEnd(12)} ${built.verification.stage.label} · ${built.documents} docs · ${((Date.now() - started) / 1000).toFixed(0)}s${built.errors.length ? " · warnings: " + built.errors.join("; ") : ""}`);
      } else {
        const known = await readEngineRecord(record.slug);
        const [file] = await downloadFiles([{ kind: "act_text", label: "Official document", url }]);
        const built = await buildDocumentRecord(record.slug, record.jobId, { ...file, kind: "act_text", label: "Official document" }, known?.title ?? readableTitle(record.title), record.title);
        console.log(`✓ ${record.title.slice(0, 60).padEnd(60)} document → ${built.verification.level.toUpperCase().padEnd(12)} ${built.verification.stage.label}`);
      }
    } catch (error) {
      console.log(`✗ ${record.title}: ${error instanceof Error ? error.message : error}`);
    }
  }
}
main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
