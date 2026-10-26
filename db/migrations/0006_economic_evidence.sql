CREATE TABLE IF NOT EXISTS economic_datasets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  institution TEXT NOT NULL,
  source_url TEXT NOT NULL,
  retrieval_method TEXT NOT NULL,
  geography TEXT NOT NULL,
  frequency TEXT NOT NULL,
  variables_json TEXT NOT NULL,
  units_json TEXT NOT NULL,
  license_attribution TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS economic_vintages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id INTEGER NOT NULL REFERENCES economic_datasets(id),
  source_file_name TEXT NOT NULL,
  source_file_sha256 TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  published_at TEXT,
  observation_start TEXT,
  observation_end TEXT,
  observation_count INTEGER NOT NULL,
  missing_data_json TEXT NOT NULL,
  processing_steps_json TEXT NOT NULL,
  raw_payload TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 1,
  UNIQUE(dataset_id, source_file_sha256)
);

CREATE TABLE IF NOT EXISTS economic_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id INTEGER NOT NULL REFERENCES economic_datasets(id),
  vintage_id INTEGER NOT NULL REFERENCES economic_vintages(id),
  period TEXT NOT NULL,
  geography TEXT NOT NULL,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  source_row_json TEXT NOT NULL,
  UNIQUE(dataset_id, vintage_id, period, geography, metric)
);

CREATE INDEX IF NOT EXISTS economic_observations_lookup
  ON economic_observations(dataset_id, vintage_id, period, metric);
