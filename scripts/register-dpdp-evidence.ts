import { createDatabaseClient } from "../lib/db/config";

/**
 * Registers only facts that are present in the imported, identity-checked PDFs.
 * This is deliberately separate from import and approval: importing a PDF does
 * not change legal status, and this script creates reviewable candidate rows.
 */
const db = createDatabaseClient();

async function main() {
  const policy = await db.execute({ sql: "SELECT id FROM legislative_policies WHERE slug = ?", args: ["dpdp-act-2023"] });
  const policyId = policy.rows[0]?.id;
  if (policyId === undefined) throw new Error("Run db:seed before registering DPDP evidence.");

  const document = async (title: string) => {
    const result = await db.execute({ sql: "SELECT id FROM source_documents WHERE title = ? AND verification_status = 'verified' LIMIT 1", args: [title] });
    const id = result.rows[0]?.id;
    if (id === undefined) throw new Error(`Verified source is missing: ${title}`);
    return Number(id);
  };
  const act = await document("Digital Personal Data Protection Act, 2023 — Act No. 22 of 2023");
  const commencement = await document("Digital Personal Data Protection Act, 2023 — Commencement Notification");
  const rules = await document("Digital Personal Data Protection Rules, 2025");

  await db.execute({
    sql: "UPDATE legislative_events SET title = ?, detail = ?, source_document_id = ? WHERE policy_id = ? AND event_type = 'presidential_assent'",
    args: ["Presidential assent recorded in the Act", "The Act PDF identifies this as Act No. 22 of 2023 and records assent on 11 August 2023 (Act PDF, p. 1).", act, policyId],
  });
  await db.execute({
    sql: "INSERT OR IGNORE INTO legislative_events (policy_id,event_type,event_date,title,detail,verification_status,source_document_id) VALUES (?,?,?,?,?,?,?)",
    args: [policyId, "gazette_publication", "2025-11-13", "Commencement notification published", "G.S.R. 843(E) was published on 13 November 2025. Its text sets relative commencement rules for different Act provisions (notification PDF, p. 2).", "verified", commencement],
  });
  await db.execute({
    sql: "INSERT OR IGNORE INTO legislative_events (policy_id,event_type,event_date,title,detail,verification_status,source_document_id) VALUES (?,?,?,?,?,?,?)",
    args: [policyId, "partially_commenced", "2025-11-13", "Group A provisions commenced on publication", "The notification states that Group A provisions come into force on publication. Approval of this candidate changes the policy status only to partially commenced; it does not imply that every provision is in force (notification PDF, p. 2).", "unverified", commencement],
  });
  await db.execute({
    sql: "INSERT OR IGNORE INTO legislative_events (policy_id,event_type,event_date,title,detail,verification_status,source_document_id) VALUES (?,?,?,?,?,?,?)",
    args: [policyId, "rules_published", "2025-11-13", "Digital Personal Data Protection Rules, 2025 published", "G.S.R. 846(E) separately states the Rules' own commencement schedule (Rules PDF, p. 24). Rules are subordinate legislation and are not substituted for Act provisions.", "verified", rules],
  });

  const actGroups: Array<[string, string, string]> = [
    ["Group A — publication date", "2025-11-13", "effective"],
    ["Group B — one year after publication", "2026-11-13", "scheduled"],
    ["Group C — eighteen months after publication", "2027-05-13", "scheduled"],
  ];
  for (const [label, date, status] of actGroups) {
    await db.execute({ sql: "INSERT OR IGNORE INTO policy_provisions (policy_id,provision_label,commencement_status,commencement_date,source_document_id) VALUES (?,?,?,?,?)", args: [policyId, `Act commencement: ${label}`, status, date, commencement] });
  }
  const ruleGroups: Array<[string, string]> = [
    ["Rules 1, 2 and 17–21 — publication date", "2025-11-13"],
    ["Rule 4 — one year after publication", "2026-11-13"],
    ["Rules 3, 5–16, 22 and 23 — eighteen months after publication", "2027-05-13"],
  ];
  for (const [label, date] of ruleGroups) {
    await db.execute({ sql: "INSERT OR IGNORE INTO policy_provisions (policy_id,provision_label,commencement_status,commencement_date,source_document_id) VALUES (?,?,?,?,?)", args: [policyId, `Rules commencement: ${label}`, date === "2025-11-13" ? "effective" : "scheduled", date, rules] });
  }
  await db.execute({ sql: "UPDATE legislative_policies SET current_information = ?, last_verified_at = ?, status_confidence = 'verified' WHERE id = ?", args: ["Act identity, assent, G.S.R. 843(E), and the separate G.S.R. 846(E) Rules schedule are verified from imported PDFs. A December 2025 corrigendum was not found in the inbox and the Rules are not presented as consolidated.", "2026-10-25", policyId] });
  console.log("Registered 6 DPDP provision schedule rows and 4 reviewable timeline candidates.");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
