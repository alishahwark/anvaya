CREATE TABLE IF NOT EXISTS imported_source_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_document_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL UNIQUE,
  local_path TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  extraction_quality TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  imported_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS source_excerpts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_document_id INTEGER NOT NULL,
  page_number INTEGER,
  section_label TEXT,
  excerpt TEXT NOT NULL,
  excerpt_hash TEXT NOT NULL UNIQUE
);
