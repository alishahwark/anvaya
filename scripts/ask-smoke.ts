import { askPolicy } from "../lib/ask/answer";

async function main() {
  const questions = process.argv.slice(2);
  for (const question of questions.length ? questions : ["Do I need consent before sending marketing emails to customers?"]) {
    const started = Date.now();
    const result = await askPolicy({ policySlug: process.env.SLUG ?? "dpdp-act-2023", question, skipBaseline: true });
    console.log("\nQ:", question, `(${Date.now() - started} ms)`);
    console.log(JSON.stringify({ ...result, citations: result.citations.map((c) => `${c.label}`) }, null, 2));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
