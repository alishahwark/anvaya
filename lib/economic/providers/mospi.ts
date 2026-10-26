import { createHash } from "node:crypto";
import type { EconomicDataset, EconomicObservation, EconomicMetric } from "../types";

const API = "https://api.mospi.gov.in/api";
const sourceUrl = "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi";
const months: Record<string, string> = { January: "01", February: "02", March: "03", April: "04", May: "05", June: "06", July: "07", August: "08", September: "09", October: "10", November: "11", December: "12" };

export const mospiCpiDataset: EconomicDataset = {
  datasetKey: "mospi-cpi-general-index-all-india-2019",
  title: "Consumer Price Index — General Index, All India",
  institution: "Ministry of Statistics and Programme Implementation (MoSPI), Government of India",
  sourceUrl,
  retrievalMethod: "MoSPI eSankhyiki JSON API: cpialrl/getCpialrlRecords",
  geography: "All India",
  frequency: "Monthly",
  variables: ["index_al", "index_rl", "inflation_al", "inflation_rl"],
  units: { index_al: "index points (2019=100), all groups", index_rl: "index points (2019=100), rural + urban", inflation_al: "percent year-on-year, all groups", inflation_rl: "percent year-on-year, rural + urban" },
  licenseAttribution: "Official statistics published by MoSPI; source URL and retrieval timestamp retained.",
  verificationStatus: "verified",
};

type ApiRow = { base_year: string; year: string; month: string; state: string; index_al: string; index_rl: string; inflation_al: string; inflation_rl: string };

export function normalizeMospiCpi(payload: { data?: ApiRow[]; meta_data?: { totalRecords?: number } }, retrievedAt = new Date().toISOString()) {
  if (!Array.isArray(payload.data) || !payload.data.length) throw new Error("MoSPI returned no CPI observations");
  const observations: EconomicObservation[] = [];
  for (const row of payload.data) {
    if (row.state !== "All India" || row.base_year !== "2019") continue;
    const period = `${row.year}-${months[row.month] ?? "01"}`;
    for (const metric of ["index_al", "index_rl", "inflation_al", "inflation_rl"] as EconomicMetric[]) {
      const value = Number(row[metric]);
      if (!Number.isFinite(value)) continue;
      observations.push({ period, geography: row.state, metric, value, unit: mospiCpiDataset.units[metric] });
    }
  }
  return { dataset: mospiCpiDataset, observations, rawPayload: payload, retrievedAt, checksum: createHash("sha256").update(JSON.stringify(payload)).digest("hex") };
}

export async function fetchMospiCpi(signal?: AbortSignal) {
  const params = new URLSearchParams({ indicator_code: "1", state_code: "99", base_year: "2019", page: "1", limit: "500" });
  const response = await fetch(`${API}/cpialrl/getCpialrlRecords?${params}`, { signal, headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`MoSPI returned HTTP ${response.status}`);
  return normalizeMospiCpi(await response.json() as { data?: ApiRow[]; meta_data?: { totalRecords?: number } });
}
