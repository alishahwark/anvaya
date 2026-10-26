CREATE TABLE IF NOT EXISTS source_identity_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_document_id INTEGER NOT NULL,
  document_identifier TEXT,
  expected_markers TEXT NOT NULL,
  matched_markers TEXT NOT NULL,
  identity_status TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  error TEXT
);
