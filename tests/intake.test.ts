import { describe, expect, it } from "vitest";
import { looksLikeUrl, officialUrlAdapter, titleFromText } from "@/lib/research/adapters";

describe("link intake", () => {
  it("tells links from names", () => {
    expect(looksLikeUrl("https://www.meity.gov.in/static/uploads/2025/02/x.pdf")).toBe(true);
    expect(looksLikeUrl("Waqf Amendment Bill")).toBe(false);
    expect(looksLikeUrl("see https://sansad.in/x")).toBe(false);
  });

  it("accepts an official link and names its publisher", async () => {
    const [candidate] = await officialUrlAdapter.discover("https://sansad.in/getFile/BillsTexts/Some%20Bill.pdf");
    expect(candidate.publisher).toContain("Digital Sansad");
    expect(candidate.title).toBe("Some Bill");
  });

  it.each([
    "https://evil.example.com/x.pdf",
    "http://sansad.in/x.pdf",
    "https://127.0.0.1/x.pdf",
    "https://sansad.in.evil.example.com/x.pdf",
    "https://user:pw@sansad.in/x.pdf",
  ])("rejects a link that is not an official HTTPS address: %s", async (link) => {
    await expect(officialUrlAdapter.discover(link)).rejects.toThrow();
  });

  it("ignores a name search", async () => {
    expect(await officialUrlAdapter.discover("Digital Personal Data Protection Act")).toEqual([]);
  });
});

describe("title from document text", () => {
  it("uses the short-title clause", () => {
    expect(titleFromText("Whereas ... under the Digital Personal Data Protection Act, 2023 (22 of 2023). 1. Short title. These rules may be called the Digital Personal Data Protection Rules, 2025.")).toBe("Digital Personal Data Protection Rules, 2025");
  });
  it("does not mistake a reference for the title", () => {
    expect(titleFromText("Notification issued under the Digital Personal Data Protection Act, 2023 for general information.")).toBeNull();
  });
  it("finds a heading-style title", () => {
    expect(titleFromText("THE NATIONAL SPORTS GOVERNANCE BILL, 2025 A Bill to provide")).toBeNull(); // upper case is not matched; callers fall back to the file name
    expect(titleFromText("The National Sports Governance Bill, 2025 A Bill to provide for")).toBe("National Sports Governance Bill, 2025");
  });
});
