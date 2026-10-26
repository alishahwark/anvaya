import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";

const defaultDatabasePath = resolve("data/anvaya.db");

function configuredFilePath(url: string) {
  const value = url.slice("file:".length);
  return value.startsWith("/") ? value : resolve(value);
}

export function getDatabaseUrl() {
  const configured = process.env.DATABASE_URL?.trim();
  if (!configured) return `file:${defaultDatabasePath}`;
  if (configured.startsWith("file:") && !existsSync(configuredFilePath(configured))) {
    throw new Error(`Configured SQLite database does not exist: ${configuredFilePath(configured)}`);
  }
  return configured;
}

export function createDatabaseClient() {
  const client = createClient({ url: getDatabaseUrl() });
  // Several processes (dev server, scripts, tests) can touch the same SQLite file; wait briefly instead of failing.
  void client.execute("PRAGMA busy_timeout = 8000").catch(() => undefined);
  return client;
}

/** Compatibility wrapper for older scripts; the supplied URL is intentionally ignored. */
export function createConfiguredClient(_legacyOptions?: unknown) {
  return createDatabaseClient();
}

export function getDatabaseLocation() {
  const url = getDatabaseUrl();
  return url.startsWith("file:") ? configuredFilePath(url) : url;
}
