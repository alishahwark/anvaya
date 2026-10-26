import { mkdirSync, readdirSync } from "node:fs";
import { readFileSync } from "node:fs";
import { createDatabaseClient, getDatabaseLocation } from "../lib/db/config";
mkdirSync("data", { recursive: true });
async function main() {
  const client = createDatabaseClient();
  const migrations = readdirSync("db/migrations").filter((file) => file.endsWith(".sql")).sort();
  for (const migration of migrations) {
    const sql = readFileSync(`db/migrations/${migration}`, "utf8");
    for (const statement of sql.split(";").map((part) => part.trim()).filter(Boolean)) await client.execute(statement);
  }
  console.log(`Database schema ready: ${getDatabaseLocation()}`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
