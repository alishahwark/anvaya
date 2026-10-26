import { NextResponse } from "next/server";
import { readCurrentEconomicSeries } from "@/lib/economic/service";

export async function GET(request: Request) {
  try {
    const series = await readCurrentEconomicSeries();
    if (!series) return NextResponse.json({ error: "No verified economic dataset has been imported." }, { status: 404 });
    const response = NextResponse.json(series);
    if (new URL(request.url).searchParams.get("download") === "1") response.headers.set("Content-Disposition", "attachment; filename=anvaya-economic-evidence.json");
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Economic evidence is unavailable." }, { status: 500 });
  }
}
