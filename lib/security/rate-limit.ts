/**
 * Small in-process sliding-window limiter, keyed by client. Good enough for a single-instance
 * prototype; a hosted multi-instance deployment would need a shared store.
 */
const buckets = new Map<string, number[]>();

export function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Returns true when the caller has exceeded `limit` hits within `windowMs`. */
export function isRateLimited(scope: string, request: Request, limit: number, windowMs = 60_000): boolean {
  const key = `${scope}:${clientKey(request)}`;
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 5000) for (const [name, times] of buckets) if (!times.some((time) => now - time < windowMs)) buckets.delete(name);
  return recent.length > limit;
}
