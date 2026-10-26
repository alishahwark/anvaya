/**
 * Runs one real live question through the full pipeline and saves a step-by-step trace (what each stage received and
 * produced, tokens including cached input, time). Read by scripts/build-submission.ts for the report.
 * Usage: ANVAYA_BYPASS_GATEWAY_CACHE=1 npx tsx scripts/trace-run.ts ["question"]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { askPolicy } from "../lib/ask/answer";

const question = process.argv[2] ?? "Do I need consent before emailing my customers about offers?";
async function main() {
  const before = readFileSync("data/logs/agent-executions.jsonl", "utf8").split("\n").filter(Boolean).length;
  const started = Date.now();
  const result = await askPolicy({ policySlug: "dpdp-act-2023", question, skipBaseline: true });
  const rows = readFileSync("data/logs/agent-executions.jsonl", "utf8").split("\n").filter(Boolean).slice(before).map((line) => JSON.parse(line));
  const out = {
    ranAt: new Date().toISOString(),
    question,
    source: result.source,
    status: result.status,
    wallMs: Date.now() - started,
    retrieved: result.retrieved,
    answer: result.answer,
    details: result.details,
    uncertainty: result.uncertainty,
    verification: result.verification,
    citations: result.citations.map((c) => ({ label: c.label, page: c.page, url: c.url, quote: c.quote })),
    execution: result.execution,
    logRows: rows,
  };
  writeFileSync("data/benchmarks/trace-run.json", JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ status: out.status, source: out.source, retrieved: out.retrieved?.length, execution: out.execution, verification: out.verification, rows: rows.map((r: any) => [r.agent, r.inputTokens, r.cachedInputTokens, r.outputTokens, r.durationMs]) }, null, 1));
}
main();
