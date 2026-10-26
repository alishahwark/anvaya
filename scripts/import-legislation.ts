import { createDatabaseClient } from "../lib/db/config";
import { legislativeRecords } from "../data/fixtures/legislative-records";
import { canApplyStatus } from "../lib/policy-status/engine";

async function main() {
  const client = createDatabaseClient();
  const startedAt = new Date().toISOString();
  const run = await client.execute({ sql: "INSERT INTO ingestion_runs (started_at,mode,status) VALUES (?,?,?)", args: [startedAt, "local-fixture", "running"] });
  let documentsSeen = 0; let eventsAdded = 0; const errors: string[] = [];
  for (const record of legislativeRecords) {
    const current = await client.execute({ sql: "SELECT id,current_status FROM legislative_policies WHERE slug = ?", args: [record.slug] });
    const policyId = current.rows[0]?.id;
    if (policyId === undefined) { errors.push(`${record.slug}: policy missing; run npm run db:seed first`); continue; }
    for (const source of record.sources) {
      await client.execute({ sql: "INSERT OR IGNORE INTO source_documents (canonical_url,title,publisher,source_type,verified_at,verification_status,locator) VALUES (?,?,?,?,?,?,?)", args: [source.url, source.title, source.publisher, source.sourceType, record.lastVerifiedAt, source.verificationStatus, source.locator ?? null] }); documentsSeen++;
    }
    for (const event of record.events) {
      if (!["proposed", "introduced", "under_consideration", "passed_parliament", "presidential_assent", "in_force", "withdrawn", "rejected", "lapsed", "partially_commenced", "unknown"].includes(event.type)) continue;
      const eventType = event.type as Parameters<typeof canApplyStatus>[1];
      const status = String(current.rows[0]?.current_status ?? "unknown") as Parameters<typeof canApplyStatus>[0];
      if (!canApplyStatus(status, eventType, { eventType, verificationStatus: event.verificationStatus })) { errors.push(`${record.slug}: rejected unsupported or unverified status ${eventType}`); continue; }
      const inserted = await client.execute({ sql: "INSERT OR IGNORE INTO legislative_events (policy_id,event_type,event_date,title,detail,verification_status) VALUES (?,?,?,?,?,?)", args: [policyId, event.type, event.date, event.title, event.detail, event.verificationStatus] });
      if (inserted.rowsAffected > 0) { eventsAdded++; await client.execute({ sql: "UPDATE legislative_policies SET current_status = ?, status_confidence = ?, is_verified = ? WHERE id = ?", args: [event.type, event.verificationStatus, event.verificationStatus === "verified", policyId] }); }
    }
  }
  const status = errors.length ? "completed_with_review" : "completed";
  await client.execute({ sql: "UPDATE ingestion_runs SET finished_at = ?,status = ?,documents_seen = ?,events_added = ?,errors = ? WHERE id = ?", args: [new Date().toISOString(), status, documentsSeen, eventsAdded, errors.length ? JSON.stringify(errors) : null, run.lastInsertRowid ?? 0] });
  console.log(JSON.stringify({ status, documentsSeen, eventsAdded, errors }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
