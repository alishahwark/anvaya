import { createConfiguredClient as createClient } from "../lib/db/config";
import { resolve } from "node:path";
const documentId = Number(process.argv[process.argv.indexOf("--document-id") + 1]);
if (!Number.isInteger(documentId)) { console.error("Usage: npm run data:verify:source -- --document-id <id>"); process.exit(1); }
async function main() { const client = createClient({ url: `file:${resolve("data/anvaya.db")}` }); const result = await client.execute({ sql: "UPDATE source_documents SET verification_status='verified',verified_at=? WHERE id=?", args: [new Date().toISOString().slice(0, 10), documentId] }); if (!result.rowsAffected) throw new Error("Source document not found"); console.log(`Verified source document ${documentId}. Review its excerpts before approving events.`); }
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
