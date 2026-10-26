import { describe, expect, it } from "vitest";
import { assertAllowedUrl, htmlToText } from "@/lib/research/security";

describe("research source safeguards", () => {
  it("allows only approved HTTPS government hosts", () => {
    expect(assertAllowedUrl("https://sansad.in/api_rs/legislation/getBills").hostname).toBe("sansad.in");
    expect(() => assertAllowedUrl("http://127.0.0.1/private")).toThrow();
    expect(() => assertAllowedUrl("https://example.com/document.pdf")).toThrow();
  });
  it("extracts readable text without executing markup", () => {
    expect(htmlToText("<script>alert(1)</script><p>Official bill</p>")).toBe("Official bill");
  });
});
