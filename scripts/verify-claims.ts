import { mkdirSync, writeFileSync } from "node:fs";
import { dpdpKnowledge as dpdpDraft } from "../lib/knowledge/dpdp";
import { verifyKnowledge } from "../lib/knowledge/verify";

async function main() {
  const report = await verifyKnowledge(dpdpDraft);
  mkdirSync("data/knowledge", { recursive: true });
  writeFileSync("data/knowledge/dpdp-claim-verification.json", JSON.stringify(report, null, 2));
  console.log(`${report.supported}/${report.totalRefs} evidence quotes verified against the official PDFs`);
  for (const failure of report.failures) console.log(" ✗", failure.claimId, failure.doc, `p${failure.page}`, failure.section, failure.status, failure.foundOnPages ?? "");
  if (report.failures.length) process.exitCode = 1;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
