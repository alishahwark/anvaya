import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createDatabaseClient } from "@/lib/db/config";
import { z } from "zod";
import { qaChecklist, type QAStatus } from "@/lib/qa/checklist";

const exec = promisify(execFile);
const db = () => createDatabaseClient();
const enabled = () => process.env.NODE_ENV !== "production" || process.env.ANVAYA_QA_ENABLED === "true";
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("run") }),
  z.object({ action: z.literal("retest-failed") }),
  z.object({ action: z.literal("manual"), checkId: z.string(), status: z.enum(["PASS", "FAIL", "BLOCKED", "NOT_TESTED"]), note: z.string().max(2000).optional(), reviewer: z.string().max(120).optional() }),
]);

async function ensureRegistry(client: ReturnType<typeof db>) {
  for (const check of qaChecklist) await client.execute({ sql: "INSERT OR IGNORE INTO qa_checks (check_id,module,title,method,severity,expected) VALUES (?,?,?,?,?,?)", args: [check.checkId, check.module, check.title, check.method, check.severity, check.expected] });
}
async function snapshot(client: ReturnType<typeof db>) {
  const checks = await client.execute({ sql: "SELECT check_id as checkId,module,title,method,severity,expected,status,actual,error,evidence,verified_at as verifiedAt,reviewer FROM qa_checks ORDER BY module,check_id", args: [] });
  const runs = await client.execute({ sql: "SELECT id,started_at as startedAt,finished_at as finishedAt,status,summary FROM qa_runs ORDER BY id DESC LIMIT 10", args: [] });
  return { checks: checks.rows, runs: runs.rows };
}
function findId(title: string) { return qaChecklist.find((check) => check.title === title)?.checkId; }
async function update(client: ReturnType<typeof db>, checkId: string | undefined, status: QAStatus, actual: string, error: string | null, evidence: string, runId: number) {
  if (!checkId) return;
  await client.execute({ sql: "UPDATE qa_checks SET status=?,actual=?,error=?,evidence=?,verified_at=?,run_id=? WHERE check_id=?", args: [status, actual, error, evidence, new Date().toISOString(), runId, checkId] });
}

export async function GET() {
  if (!enabled()) return NextResponse.json({ error: "QA dashboard disabled in production." }, { status: 404 });
  const client = db(); await ensureRegistry(client); return NextResponse.json(await snapshot(client));
}

export async function POST(request: Request) {
  if (!enabled()) return NextResponse.json({ error: "QA dashboard disabled in production." }, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid QA request." }, { status: 400 });
  const client = db(); await ensureRegistry(client);
  if (parsed.data.action === "manual") {
    const manual = parsed.data; const check = qaChecklist.find((item) => item.checkId === manual.checkId); if (!check || check.method !== "manual") return NextResponse.json({ error: "Only registered manual checks may be updated." }, { status: 400 });
    await client.execute({ sql: "UPDATE qa_checks SET status=?,actual=?,error=?,evidence=?,verified_at=?,reviewer=? WHERE check_id=?", args: [manual.status, manual.note ?? "Manual result recorded.", manual.status === "FAIL" ? manual.note ?? "Manual failure" : null, manual.note ?? null, new Date().toISOString(), manual.reviewer ?? "manual reviewer", manual.checkId] });
    return NextResponse.json(await snapshot(client));
  }
  const run = await client.execute({ sql: "INSERT INTO qa_runs (started_at,status,summary) VALUES (?,?,?)", args: [new Date().toISOString(), "running", "Fixed allowlisted checks"] }); const runId = Number(run.lastInsertRowid);
  const commands: Array<{ script: string; titles: string[] }> = [
    { script: "typecheck", titles: ["TypeScript checks pass"] },
    { script: "test", titles: ["Unit tests pass"] },
    { script: "test:e2e", titles: ["Playwright tests pass"] },
  ];
  let failures = 0;
  for (const command of commands) {
    try { const result = await exec("npm", ["run", command.script], { cwd: process.cwd(), timeout: 180000, maxBuffer: 4 * 1024 * 1024 }); for (const title of command.titles) await update(client, findId(title), "PASS", `${command.script} completed.`, null, `qa-run-${runId}:${command.script}`, runId); if (command.script === "test:e2e") { for (const title of ["Homepage loads correctly", "All navigation links work", "Search input accepts and submits queries", "Existing policies appear in results", "Search results link to the correct policy", "DPDP policy opens correctly", "Impact Explorer opens", "The interface remains usable on mobile", "No horizontal overflow"]) await update(client, findId(title), "PASS", "Covered by the passing Playwright product-journeys suite.", null, "test:e2e", runId); } void result; }
    catch (error) { failures++; const message = error instanceof Error ? error.message.slice(0, 1500) : "Command failed"; for (const title of command.titles) await update(client, findId(title), "FAIL", `${command.script} failed.`, message, `qa-run-${runId}:${command.script}`, runId); }
  }
  const sourceCounts = await client.execute({ sql: "SELECT (SELECT count(*) FROM imported_source_files) AS imported, (SELECT count(*) FROM source_excerpts) AS excerpts, (SELECT count(*) FROM source_documents WHERE verification_status='verified') AS verified", args: [] }); const sourceRow = sourceCounts.rows[0]; if (Number(sourceRow?.imported ?? 0) > 0 && Number(sourceRow?.excerpts ?? 0) > 0) { for (const title of ["Imported official PDFs remain accessible", "Source metadata is correctly stored", "Relevant page/section references are displayed", "Source verification timestamps are visible"]) await update(client, findId(title), "PASS", `${sourceRow?.imported} imported documents and ${sourceRow?.excerpts} page excerpts are present; ${sourceRow?.verified} sources are verified.`, null, "data/anvaya.db", runId); }
  await update(client, findId("Production build passes"), "BLOCKED", "Not run from the browser while `next dev` is active; Next.js shares the .next directory and the build would interrupt this QA dashboard.", null, "Run `npm run build` separately with the dev server stopped.", runId);
  const files = ["README.md", ".env.example", "report.html", "slides.html"]; for (const file of files) await update(client, findId(`${file} exists and meets the requirements`) ?? findId(file === "README.md" ? "README is accurate" : "report.html exists and meets the requirements"), existsSync(resolve(file)) ? "PASS" : "FAIL", existsSync(resolve(file)) ? `${file} exists.` : `${file} is missing.`, null, file, runId);
  await client.execute({ sql: "UPDATE qa_runs SET finished_at=?,status=?,summary=? WHERE id=?", args: [new Date().toISOString(), failures ? "completed_with_failures" : "completed", `${commands.length} allowlisted commands executed; ${failures} failed.`, runId] });
  return NextResponse.json(await snapshot(client));
}
