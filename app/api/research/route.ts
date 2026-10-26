import { NextResponse } from "next/server";
import { z } from "zod";
import { createResearchJob, runResearchJob } from "@/lib/research/service";
import { isRateLimited } from "@/lib/security/rate-limit";

const schema = z.object({ query: z.string().trim().min(3).max(600) });
export async function POST(request: Request) {
  // Each job makes outbound requests to government sites, so it is limited more tightly than questions.
  if (isRateLimited("research", request, 6)) return NextResponse.json({ error: "Too many searches in a short time. Please wait a minute." }, { status: 429 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Enter a policy, law, bill, or consultation name." }, { status: 400 });
  const jobId = await createResearchJob(parsed.data.query); void runResearchJob(jobId, parsed.data.query).catch((error) => console.error("Research job failed", error));
  return NextResponse.json({ jobId, status: "queued" }, { status: 202 });
}
