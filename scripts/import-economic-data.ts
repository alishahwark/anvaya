import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createDatabaseClient } from "../lib/db/config";
import { fetchMospiCpi, normalizeMospiCpi } from "../lib/economic/providers/mospi";

async function main() {
  const rawFile = process.env.MOSPI_RAW_FILE;
  const result = rawFile ? normalizeMospiCpi(JSON.parse(readFileSync(resolve(rawFile), "utf8"))) : await fetchMospiCpi();
  const db = createDatabaseClient();
  const now = result.retrievedAt;
  const raw = JSON.stringify(result.rawPayload);
  const rawHash = createHash("sha256").update(raw).digest("hex");
  mkdirSync(resolve("data/economic/raw"), { recursive: true });
  writeFileSync(resolve(`data/economic/raw/mospi-cpi-${rawHash}.json`), raw);
  await db.execute({ sql: "INSERT INTO economic_datasets (dataset_key,title,institution,source_url,retrieval_method,geography,frequency,variables_json,units_json,license_attribution,verification_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(dataset_key) DO UPDATE SET updated_at=excluded.updated_at", args: [result.dataset.datasetKey, result.dataset.title, result.dataset.institution, result.dataset.sourceUrl, result.dataset.retrievalMethod, result.dataset.geography, result.dataset.frequency, JSON.stringify(result.dataset.variables), JSON.stringify(result.dataset.units), result.dataset.licenseAttribution, result.dataset.verificationStatus, now, now] });
  const datasetResult = await db.execute({ sql: "SELECT id FROM economic_datasets WHERE dataset_key = ?", args: [result.dataset.datasetKey] });
  const datasetId = Number((datasetResult.rows[0] as unknown as { id: number }).id);
  const existing = await db.execute({ sql: "SELECT id FROM economic_vintages WHERE dataset_id = ? AND source_file_sha256 = ?", args: [datasetId, rawHash] });
  let vintageId: number;
  if (existing.rows[0]) {
    vintageId = Number((existing.rows[0] as unknown as { id: number }).id);
  } else {
    await db.execute({ sql: "UPDATE economic_vintages SET is_current = 0 WHERE dataset_id = ?", args: [datasetId] });
    const start = result.observations.map((o) => o.period).sort()[0] ?? null;
    const end = result.observations.map((o) => o.period).sort().at(-1) ?? null;
    const missing = { rowsSkipped: 0, note: "Rows with non-numeric values were excluded; source payload is preserved." };
    const inserted = await db.execute({ sql: "INSERT INTO economic_vintages (dataset_id,source_file_name,source_file_sha256,retrieved_at,published_at,observation_start,observation_end,observation_count,missing_data_json,processing_steps_json,raw_payload,is_current) VALUES (?,?,?,?,?,?,?,?,?,?,?,1) RETURNING id", args: [datasetId, `mospi-cpi-${rawHash}.json`, rawHash, now, null, start, end, result.observations.length, JSON.stringify(missing), JSON.stringify(["Fetched official JSON API", "Validated All India rows", "Normalized year-month periods", "Parsed numeric fields", "Stored source payload and checksum"]), raw] });
    vintageId = Number((inserted.rows[0] as unknown as { id: number }).id);
    for (const observation of result.observations) await db.execute({ sql: "INSERT INTO economic_observations (dataset_id,vintage_id,period,geography,metric,value,unit,source_row_json) VALUES (?,?,?,?,?,?,?,?)", args: [datasetId, vintageId, observation.period, observation.geography, observation.metric, observation.value, observation.unit, JSON.stringify(observation)] });
  }
  console.log(JSON.stringify({ dataset: result.dataset.datasetKey, observations: result.observations.length, rawHash, vintageId, first: result.observations[0], last: result.observations.at(-1) }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
