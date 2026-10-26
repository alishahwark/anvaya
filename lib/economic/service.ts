import type { EconomicSeries } from "./types";
import { createDatabaseClient } from "@/lib/db/config";

const client = createDatabaseClient();

export async function readCurrentEconomicSeries(datasetKey = "mospi-cpi-general-index-all-india-2019"): Promise<EconomicSeries | null> {
  const dataset = await client.execute({ sql: "SELECT * FROM economic_datasets WHERE dataset_key = ? LIMIT 1", args: [String(datasetKey)] });
  const row = dataset.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  const vintage = await client.execute({ sql: "SELECT * FROM economic_vintages WHERE dataset_id = ? AND is_current = 1 ORDER BY id DESC LIMIT 1", args: [Number(String(row.id))] });
  const vintageRow = vintage.rows[0] as Record<string, unknown> | undefined;
  if (!vintageRow) return null;
  const observations = await client.execute({ sql: "SELECT period, geography, metric, value, unit FROM economic_observations WHERE vintage_id = ? ORDER BY period ASC, metric ASC", args: [Number(String(vintageRow.id))] });
  return {
    dataset: {
      datasetKey: String(row.dataset_key), title: String(row.title), institution: String(row.institution), sourceUrl: String(row.source_url), retrievalMethod: String(row.retrieval_method), geography: String(row.geography), frequency: String(row.frequency),
      variables: JSON.parse(String(row.variables_json)), units: JSON.parse(String(row.units_json)), licenseAttribution: String(row.license_attribution), verificationStatus: String(row.verification_status) as "verified" | "unavailable",
    },
    observations: observations.rows.map((item) => ({ period: String(item.period), geography: String(item.geography), metric: String(item.metric) as never, value: Number(item.value), unit: String(item.unit) })),
    retrievedAt: String(vintageRow.retrieved_at), vintageId: Number(vintageRow.id),
  };
}

export async function listEconomicDatasets() {
  const result = await client.execute("SELECT dataset_key, title, institution, source_url, geography, frequency, verification_status FROM economic_datasets ORDER BY title");
  return result.rows;
}
