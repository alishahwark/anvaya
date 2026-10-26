import { NextResponse } from "next/server";
import { z } from "zod";
import { legislativeRecords } from "@/data/fixtures/legislative-records";
import { runPolicyAgent, type AgentMode } from "@/lib/agents/policy-intelligence";
import { getResearchJob } from "@/lib/research/service";

const requestSchema = z.object({ question: z.string().min(3).max(1000), policySlug: z.string().min(1).max(120), mode: z.enum(["research", "explanation", "impact", "verification"]).default("explanation") });
// Superseded by /api/ask, which is rate-limited and checks every answer. Kept for reference, off by default.
export async function POST(request: Request) {
  if (process.env.ANVAYA_LEGACY_API !== "1") return NextResponse.json({ error: "This endpoint has been replaced by /api/ask." }, { status: 410 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "A policy slug, mode, and question are required." }, { status: 400 });
  let record = legislativeRecords.find((item) => item.slug === parsed.data.policySlug);
  if (!record) { const match = parsed.data.policySlug.match(/-research-(\d+)$/); const research = match ? await getResearchJob(Number(match[1])) : null; if (research?.job.result_policy_slug === parsed.data.policySlug) { record = { slug: parsed.data.policySlug, officialName: String(research.job.query), ministry: null, category: "Discovered government record", currentStatus: "unknown", statusConfidence: "unverified", summary: String(research.job.summary ?? "Source-backed research result."), currentInformation: "This is a provisional research record. Candidate events require human review.", lastVerifiedAt: null, sources: research.documents.map((document) => ({ title: String(document.title), publisher: String(document.publisher), sourceType: String(document.source_type), url: String(document.source_url), verificationStatus: "unverified" as const, locator: String(document.locator ?? "Document pages indexed") })), events: research.events.map((event) => ({ type: String(event.event_type) as "gazette_publication", date: event.event_date ? String(event.event_date) : null, title: String(event.title), detail: String(event.detail), verificationStatus: "unverified" as const, locator: "Candidate event — review required" })) }; } }
  if (!record) return NextResponse.json({ error: "That policy is not in the local register." }, { status: 404 });
  try { const response = await runPolicyAgent({ mode: parsed.data.mode as AgentMode, question: parsed.data.question, record }); return NextResponse.json({ mode: parsed.data.mode, policySlug: record.slug, ...response }); } catch (error) { console.error("Anvaya agent failed", error); return NextResponse.json({ error: "The agent could not complete this analysis. No invented answer was substituted.", detail: error instanceof Error ? error.message : "Unknown failure" }, { status: 502 }); }
}
