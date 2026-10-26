CREATE TABLE IF NOT EXISTS source_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  canonical_url TEXT,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  source_type TEXT NOT NULL,
  published_date TEXT,
  retrieved_at TEXT,
  verified_at TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unknown',
  excerpt TEXT,
  locator TEXT,
  content_hash TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS legislative_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  official_name TEXT NOT NULL,
  ministry TEXT,
  category TEXT NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'unknown',
  status_confidence TEXT NOT NULL DEFAULT 'unverified',
  summary TEXT NOT NULL,
  current_information TEXT NOT NULL,
  last_verified_at TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS legislative_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  source_document_id INTEGER,
  UNIQUE(policy_id, event_type, event_date, title)
);
CREATE TABLE IF NOT EXISTS legislative_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id INTEGER NOT NULL,
  version_label TEXT NOT NULL,
  version_type TEXT NOT NULL,
  version_date TEXT,
  source_document_id INTEGER,
  UNIQUE(policy_id, version_label, version_type)
);
CREATE TABLE IF NOT EXISTS policy_provisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id INTEGER NOT NULL,
  provision_label TEXT NOT NULL,
  commencement_status TEXT NOT NULL DEFAULT 'unknown',
  commencement_date TEXT,
  source_document_id INTEGER,
  UNIQUE(policy_id, provision_label)
);
CREATE TABLE IF NOT EXISTS judicial_developments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id INTEGER NOT NULL,
  court TEXT NOT NULL,
  case_reference TEXT,
  event_date TEXT,
  development_type TEXT NOT NULL,
  detail TEXT NOT NULL,
  stay_status TEXT NOT NULL DEFAULT 'unknown',
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  source_document_id INTEGER,
  UNIQUE(policy_id, court, case_reference, event_date, development_type)
);
CREATE TABLE IF NOT EXISTS ingestion_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  documents_seen INTEGER NOT NULL DEFAULT 0,
  events_added INTEGER NOT NULL DEFAULT 0,
  errors TEXT
);
CREATE TABLE IF NOT EXISTS ingestion_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingestion_run_id INTEGER NOT NULL,
  policy_slug TEXT NOT NULL,
  issue TEXT NOT NULL,
  proposed_change TEXT,
  resolution TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);
