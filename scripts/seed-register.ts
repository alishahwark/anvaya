/**
 * Adds notable laws to the register by running the real engine on each name: search both official
 * registers, fetch every document, verify. Prints exactly what was matched so a wrong match is visible.
 * Usage: npx tsx scripts/seed-register.ts "Name one" "Name two" ...
 */
import { createResearchJob } from "../lib/research/service";
import { resolveByName } from "../lib/engine/resolve";
import { readEngineRecord } from "../lib/engine/store";
import { createDatabaseClient } from "../lib/db/config";

const names = process.argv.slice(2);
async function main() {
  for (const name of names) {
    const started = Date.now();
    const jobId = await createResearchJob(name);
    const result = await resolveByName(jobId, name);
    await createDatabaseClient().execute({ sql: "UPDATE research_jobs SET status = ?, result_policy_slug = ?, summary = ?, finished_at = ? WHERE id = ?", args: [result.slug ? "completed" : "completed_no_evidence", result.slug, result.summary, new Date().toISOString(), jobId] });
    for (const note of result.sourceNotes) await createDatabaseClient().execute({ sql: "INSERT OR REPLACE INTO research_job_sources (job_id,adapter_id,status,candidates_found,documents_retrieved,error,checked_at) VALUES (?,?,?,?,?,?,?)", args: [jobId, note.adapter, note.status, note.found, note.retrieved, note.error, new Date().toISOString()] });
    const record = result.slug ? await readEngineRecord(result.slug) : null;
    console.log(`\n“${name}” → ${record ? `${record.title} [${record.verification?.level}] ${record.verification?.stage.label}` : result.slug ? `(curated page: ${result.slug})` : "NO MATCH"}  (${Math.round((Date.now() - started) / 1000)}s)`);
    if (record?.verification) for (const c of record.verification.checks.filter((c) => c.status === "fail")) console.log(`   ✗ ${c.label}: ${c.detail}`);
    if (!record && !result.slug) console.log(`   ${result.summary}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
