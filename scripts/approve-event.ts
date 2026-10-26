import { createConfiguredClient as createClient } from "../lib/db/config";
import { resolve } from "node:path";
import { canApplyStatus, type LegislativeStatus } from "../lib/policy-status/engine";

const eventId = Number(process.argv[process.argv.indexOf("--event-id") + 1]);
if (!Number.isInteger(eventId)) { console.error("Usage: npm run data:approve:event -- --event-id <id>"); process.exit(1); }
async function main() {
  const client = createClient({ url: `file:${resolve("data/anvaya.db")}` }); const result = await client.execute({ sql: "SELECT e.id,e.event_type,e.policy_id,e.verification_status,d.verification_status AS source_status,p.current_status FROM legislative_events e JOIN legislative_policies p ON p.id=e.policy_id LEFT JOIN source_documents d ON d.id=e.source_document_id WHERE e.id = ?", args: [eventId] }); const row = result.rows[0]; if (!row) throw new Error("Event not found"); if (row.source_status !== "verified") throw new Error("Source document must be verified before event approval"); const current = String(row.current_status) as LegislativeStatus; const next = String(row.event_type) as LegislativeStatus; if (!canApplyStatus(current, next, { eventType: next, verificationStatus: "verified" })) throw new Error(`Status transition ${current} → ${next} is not permitted`); await client.execute({ sql: "UPDATE legislative_events SET verification_status = 'verified' WHERE id = ?", args: [eventId] }); await client.execute({ sql: "UPDATE legislative_policies SET current_status = ?,status_confidence = 'verified',is_verified = 1,last_verified_at = ? WHERE id = ?", args: [next, new Date().toISOString().slice(0, 10), row.policy_id] }); console.log(`Approved event ${eventId}: ${current} → ${next}`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
