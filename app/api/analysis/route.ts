import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnalysis } from "@/lib/analysis/generate";
import { isRateLimited } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 150;

const bodySchema = z.object({ policySlug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/) });

/** Returns the cached analysis for a retrieved document, or writes and checks one (cached afterwards). */
export async function POST(request: Request) {
  if (isRateLimited("analysis", request, 5)) return NextResponse.json({ error: "Too many requests in a short time. Please wait a minute." }, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A valid policy is required." }, { status: 400 });
  const outcome = await getAnalysis(parsed.data.policySlug);
  if (outcome.status === "missing") return NextResponse.json({ error: outcome.message }, { status: 404 });
  return NextResponse.json(outcome);
}
