import { createDatabaseClient } from "../lib/db/config";
import { seedEvidence, seedMilestones, seedPolicies } from "../data/fixtures/seed-data";
import { legislativeRecords } from "../data/fixtures/legislative-records";
async function main() {
  const client = createDatabaseClient();
  for (const p of seedPolicies) await client.execute({ sql: "INSERT OR IGNORE INTO policies (slug,title,status,summary,updated_at) VALUES (?,?,?,?,?)", args: [p.slug,p.title,p.status,p.summary,p.updatedAt] });
  for (const m of seedMilestones) await client.execute({ sql: "INSERT INTO milestones (policy_id,label,date,detail,is_verified) SELECT id,?,?,?,? FROM policies WHERE slug = ? AND NOT EXISTS (SELECT 1 FROM milestones WHERE label = ?)", args: [m.label,m.date,m.detail,m.isVerified,m.policySlug,m.label] });
  for (const e of seedEvidence) await client.execute({ sql: "INSERT INTO evidence (policy_id,title,publisher,source_type,url,claim) SELECT id,?,?,?,?,? FROM policies WHERE slug = ? AND NOT EXISTS (SELECT 1 FROM evidence WHERE title = ?)", args: [e.title,e.publisher,e.sourceType,e.url,e.claim,e.policySlug,e.title] });
  for (const record of legislativeRecords) {
    await client.execute({ sql: "INSERT OR IGNORE INTO legislative_policies (slug,official_name,ministry,category,current_status,status_confidence,summary,current_information,last_verified_at,is_verified) VALUES (?,?,?,?,?,?,?,?,?,?)", args: [record.slug, record.officialName, record.ministry, record.category, record.currentStatus, record.statusConfidence, record.summary, record.currentInformation, record.lastVerifiedAt, record.statusConfidence === "verified"] });
    const policy = await client.execute({ sql: "SELECT id FROM legislative_policies WHERE slug = ?", args: [record.slug] });
    const policyId = policy.rows[0]?.id;
    if (policyId === undefined) continue;
    for (const source of record.sources) {
      await client.execute({ sql: "INSERT OR IGNORE INTO source_documents (canonical_url,title,publisher,source_type,verified_at,verification_status,locator) VALUES (?,?,?,?,?,?,?)", args: [source.url, source.title, source.publisher, source.sourceType, record.lastVerifiedAt, source.verificationStatus, source.locator ?? null] });
    }
    for (const event of record.events) {
      const source = record.sources[0];
      const sourceRow = source ? await client.execute({ sql: "SELECT id FROM source_documents WHERE title = ? LIMIT 1", args: [source.title] }) : { rows: [] };
      await client.execute({ sql: "INSERT OR IGNORE INTO legislative_events (policy_id,event_type,event_date,title,detail,verification_status,source_document_id) VALUES (?,?,?,?,?,?,?)", args: [policyId, event.type, event.date, event.title, event.detail, event.verificationStatus, sourceRow.rows[0]?.id ?? null] });
    }
  }
  console.log("Seed data ready.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
