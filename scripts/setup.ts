/**
 * One-command first run: `npm run setup`.
 * Creates data/anvaya.db from the committed snapshot (public official documents and the
 * derived research records, no secrets) unless a database already exists. Never overwrites.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const target = "data/anvaya.db";
const seed = "data/seed/anvaya.seed.db";

mkdirSync("data", { recursive: true });
if (existsSync(target)) {
  console.log(`Database already exists at ${target}; leaving it untouched.`);
} else if (existsSync(seed)) {
  copyFileSync(seed, target);
  console.log(`Created ${target} from the committed snapshot.`);
} else {
  console.error("No database and no snapshot found. Run: npm run db:migrate && npm run db:seed && npm run data:import:files");
  process.exitCode = 1;
}
if (!process.env.PORTKEY_API_KEY && !existsSync(".env") && !existsSync("../.env")) {
  console.log("No API key found. Everything works except AI answers to new questions. To enable them, copy .env.example to .env and set PORTKEY_API_KEY.");
}
