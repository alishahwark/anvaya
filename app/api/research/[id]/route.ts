import { NextResponse } from "next/server";
import { getResearchJob } from "@/lib/research/service";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const jobId = Number(id); if (!Number.isInteger(jobId) || jobId < 1) return NextResponse.json({ error: "Invalid research job." }, { status: 400 }); const result = await getResearchJob(jobId); return result ? NextResponse.json(result) : NextResponse.json({ error: "Research job not found." }, { status: 404 }); }
