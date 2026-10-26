import { NextResponse } from "next/server";
import { z } from "zod";
import { askPolicy } from "@/lib/ask/answer";
import { isRateLimited } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 90;

const bodySchema = z.object({
  policySlug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/),
  question: z.string().trim().min(3).max(600),
  // Test hook for as-of-date checks; ISO dates only.
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(request: Request) {
  if (isRateLimited("ask", request, 12)) return NextResponse.json({ error: "Too many questions in a short time. Please wait a minute." }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please enter a question of 3–600 characters." }, { status: 400 });

  const result = await askPolicy(parsed.data);
  if (result.code === "unknown_policy") return NextResponse.json({ error: result.notice }, { status: 404 });
  return NextResponse.json(result);
}
