CREATE TABLE IF NOT EXISTS research_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TEXT NOT NULL,
  finished_at TEXT,
  result_policy_slug TEXT,
  summary TEXT,
  errors TEXT
);
CREATE TABLE IF NOT EXISTS research_job_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  adapter_id TEXT NOT NULL,
  status TEXT NOT NULL,
  candidates_found INTEGER NOT NULL DEFAULT 0,
  documents_retrieved INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  checked_at TEXT NOT NULL,
  UNIQUE(job_id, adapter_id)
);
CREATE TABLE IF NOT EXISTS research_job_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  source_document_id INTEGER NOT NULL,
  candidate_title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  identity_status TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  UNIQUE(job_id, source_document_id)
);
CREATE TABLE IF NOT EXISTS research_job_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  source_document_id INTEGER,
  verification_status TEXT NOT NULL DEFAULT 'candidate',
  UNIQUE(job_id, event_type, event_date, title)
);
