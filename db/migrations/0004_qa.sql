CREATE TABLE IF NOT EXISTS qa_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  summary TEXT
);
CREATE TABLE IF NOT EXISTS qa_checks (
  check_id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  title TEXT NOT NULL,
  method TEXT NOT NULL,
  severity TEXT NOT NULL,
  expected TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_TESTED',
  actual TEXT,
  error TEXT,
  evidence TEXT,
  verified_at TEXT,
  reviewer TEXT,
  run_id INTEGER
);
