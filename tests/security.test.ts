import { afterEach, describe, expect, it, vi } from "vitest";
import { assertAllowedUrl, fetchBounded } from "@/lib/research/security";

describe("source URL allowlist (SSRF defence)", () => {
  it.each([
    ["http://sansad.in/x.pdf", /HTTPS/],
    ["https://evil.example.com/x.pdf", /approved government host/],
    ["https://sansad.in.evil.example.com/x.pdf", /approved government host/],
    ["https://127.0.0.1/admin", /host name/],
    ["https://169.254.169.254/latest/meta-data/", /host name/],
    ["https://[::1]/", /host name/],
    ["https://user:pass@sansad.in/x.pdf", /credentials/],
    ["https://sansad.in:8443/x.pdf", /port/],
    ["file:///etc/passwd", /HTTPS/],
    ["not a url", /valid address/],
  ])("rejects %s", (url, reason) => {
    expect(() => assertAllowedUrl(url)).toThrow(reason);
  });

  it("accepts official hosts", () => {
    expect(assertAllowedUrl("https://www.meity.gov.in/static/uploads/2025/11/a.pdf").hostname).toBe("www.meity.gov.in");
    expect(assertAllowedUrl("https://egazette.gov.in/WriteReadData/2025/268455.pdf").hostname).toBe("egazette.gov.in");
  });
});

describe("redirect handling", () => {
  afterEach(() => vi.restoreAllMocks());

  it("refuses to follow a redirect from an official host to an internal address, without requesting it", async () => {
    const requested: string[] = [];
    vi.stubGlobal("fetch", async (input: URL | string) => {
      requested.push(String(input));
      return new Response(null, { status: 302, headers: { location: "https://169.254.169.254/latest/meta-data/" } });
    });
    await expect(fetchBounded("https://sansad.in/doc.pdf")).rejects.toThrow(/host name/);
    expect(requested).toEqual(["https://sansad.in/doc.pdf"]);
    vi.unstubAllGlobals();
  });

  it("refuses a redirect to a non-allowlisted public host", async () => {
    vi.stubGlobal("fetch", async () => new Response(null, { status: 301, headers: { location: "https://attacker.example.org/x" } }));
    await expect(fetchBounded("https://sansad.in/doc.pdf")).rejects.toThrow(/approved government host/);
    vi.unstubAllGlobals();
  });

  it("stops redirect loops", async () => {
    vi.stubGlobal("fetch", async () => new Response(null, { status: 302, headers: { location: "https://sansad.in/again" } }));
    await expect(fetchBounded("https://sansad.in/doc.pdf")).rejects.toThrow(/too many times/);
    vi.unstubAllGlobals();
  });
});

import { isRateLimited } from "@/lib/security/rate-limit";
describe("rate limiter", () => {
  it("allows up to the limit, then blocks, per scope and client", () => {
    const request = new Request("http://localhost/x", { headers: { "x-forwarded-for": "203.0.113.9" } });
    const results = Array.from({ length: 4 }, () => isRateLimited("test-scope-a", request, 3));
    expect(results).toEqual([false, false, false, true]);
    expect(isRateLimited("test-scope-b", request, 3)).toBe(false);
    const other = new Request("http://localhost/x", { headers: { "x-forwarded-for": "203.0.113.10" } });
    expect(isRateLimited("test-scope-a", other, 3)).toBe(false);
  });
});
