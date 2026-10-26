import { describe, expect, it } from "vitest";
import { confirmQuotes } from "@/lib/ask/answer";
import { distinctiveTokens, isoDate, parseBill, queryVariants, stageOf, titleScore, type SansadBill } from "@/lib/engine/sansad";
import { findCommencement, printedFacts, verifyBill, type FetchedDoc } from "@/lib/engine/verify-bill";
import type { Passage } from "@/lib/ask/retrieval";

// Opening text as Parliament's PDFs actually extract: letters spaced out, odd line breaks.
const PASSED_BOTH = "Bill No. 1 50 -F of 2026 THE TAXATION AND OTHER LAWS (AMENDMENT) BILL, 2026 (A S PASSED BY THE H OUSES OF P ARLIAMENT — L OK S ABHA ON 6 TH A UGUST , 2026 R AJYA S ABHA ON 1 0 TH A UGUST , 2026) ASSENTED TO ON 17 AUG 2026 Act. No. 21 of 2026 A BILL further to amend the Payment and Settlement Systems Act, 2007";
const INTRODUCED = "5 A S INTRODUCED IN L OK S ABHA Bill No. 150 of 2026 THE TAXATION AND OTHER LAWS (AMENDMENT) BILL, 2026 A BILL further to amend the Payment and Settlement Systems Act, 2007. 1 . ( 1 ) This Act may be called the Taxation and Other Laws (Amendment) Act, 2026. ( 2 ) Save as otherwise provided in this Act, it shall be deemed to have come into force on the 1st day of April, 2026.";

const raw = {
  billNumber: 150, billName: "THE TAXATION AND OTHER LAWS (AMENDMENT) BILL, 2026", billType: "Government", billCategory: "Money Bill", ministryName: "FINANCE", billYear: 2026,
  billIntroducedInHouse: "Lok Sabha", billIntroducedDate: "2026-08-04 00:00:00.0", billIntroducedFile: "https://sansad.in/getFile/BillsTexts/a.pdf?source=legislation",
  billPassedInLSDate: "2026-08-06 00:00:00.0", billPassedInLSFile: "https://sansad.in/getFile/BillsTexts/b.pdf?source=legislation", billPassedInRSDate: "2026-08-10 00:00:00.0", billPassedInRSFile: null,
  billPassedInBothHousesFile: "https://sansad.in/getFile/BillsTexts/c.pdf?source=legislation", errataFile: null, referredToCommitteeDate: null, reportPresentedDate: null, actNo: "21 ", actYear: 2026, billAssentedDate: "17/08/2026", billGazettedFile: null, status: "Assented",
};
const bill = parseBill(raw)!;
const FILLER = " Be it enacted by Parliament in the Seventy-seventh Year of the Republic of India as follows. In this Act, unless the context otherwise requires, the expressions used in it shall have the meanings assigned to them under the provisions of the principal Act, and the Central Government may, by notification in the Official Gazette, make rules for carrying out the purposes of this Act. Every such rule shall be laid before each House of Parliament.";
const doc = (kind: FetchedDoc["kind"], text: string): FetchedDoc => ({ kind, label: kind, url: `https://sansad.in/${kind}.pdf`, pages: [text + FILLER] });

describe("Parliament record parsing", () => {
  it("normalises both date formats and 'None'", () => {
    expect(isoDate("2026-08-04 00:00:00.0")).toBe("2026-08-04");
    expect(isoDate("17/08/2026")).toBe("2026-08-17");
    expect(isoDate("None")).toBeNull();
    expect(isoDate(null)).toBeNull();
  });
  it("reads the record, trims the act number and lists every file", () => {
    expect(bill.actNo).toBe("21");
    expect(bill.assentDate).toBe("2026-08-17");
    expect(bill.files.map((file) => file.kind)).toEqual(["introduced", "passed_lok_sabha", "passed_both_houses"]);
  });
  it("rejects records without a title or number rather than guessing", () => {
    expect(parseBill({ billName: "X" })).toBeNull();
  });
  it("ignores file links that are not on sansad.in", () => {
    expect(parseBill({ ...raw, billIntroducedFile: "https://evil.example.com/a.pdf" })!.files.some((file) => file.kind === "introduced")).toBe(false);
  });
});

describe("stage from Parliament's own fields", () => {
  it("enacted", () => {
    const stage = stageOf(bill);
    expect(stage.code).toBe("enacted");
    expect(stage.label).toBe("Enacted as Act No. 21 of 2026");
    expect(stage.isLaw).toBe(true);
    expect(stage.detail).toContain("17 August 2026");
  });
  it("pending private member's bill is not law and says so", () => {
    const stage = stageOf({ ...bill, status: "Pending", type: "Private Member", passedLokSabha: null, passedRajyaSabha: null, assentDate: null, actNo: null, actYear: null });
    expect(stage.code).toBe("pending");
    expect(stage.isLaw).toBe(false);
    expect(stage.detail).toContain("private member");
  });
  it("passed one House only", () => {
    expect(stageOf({ ...bill, status: "Pending", passedRajyaSabha: null, assentDate: null }).code).toBe("passed_lok_sabha");
  });
  it.each([["Negatived", "negatived"], ["Withdrawn", "withdrawn"], ["Removed", "removed"]])("%s is never law", (status, code) => {
    const stage = stageOf({ ...bill, status, passedLokSabha: null, passedRajyaSabha: null, assentDate: null });
    expect(stage.code).toBe(code);
    expect(stage.isLaw).toBe(false);
  });
});

describe("matching a name to a bill", () => {
  it("never matches on a shared generic word", () => {
    expect(titleScore("Waqf Amendment Bill 2025", "THE CORPORATE LAWS (AMENDMENT) BILL, 2026")).toBeLessThan(0.5);
    expect(titleScore("Waqf Amendment Bill 2025", "THE WAQF (AMENDMENT) BILL, 2025")).toBeGreaterThan(0.9);
  });
  it("finds the bill from a short, informal name", () => {
    expect(titleScore("waqf", "THE WAQF (AMENDMENT) BILL, 2025")).toBeGreaterThan(0.7);
    expect(titleScore("Taxation and Other Laws", bill.title)).toBeGreaterThan(0.8);
  });
  it("prefers the title with the right year", () => {
    expect(titleScore("Taxation Laws Amendment Bill 2021", "THE TAXATION LAWS (AMENDMENT) BILL, 2021")).toBeGreaterThan(titleScore("Taxation Laws Amendment Bill 2021", "THE TAXATION LAWS (AMENDMENT) BILL, 2025"));
  });
  it("tries distinctive words on their own when the exact phrase fails", () => {
    expect(distinctiveTokens("Waqf Amendment Bill")).toEqual(["waqf"]);
    expect(queryVariants("The Waqf (Amendment) Bill, 2025")).toContain("waqf");
  });
  it("matches nothing for gibberish", () => {
    expect(titleScore("zzzz nonexistent statute", bill.title)).toBeLessThan(0.5);
  });
});

describe("what the official PDF prints about itself", () => {
  it("reads assent, Act number and passing dates despite letter spacing", () => {
    const facts = printedFacts([PASSED_BOTH]);
    expect(facts.assentDate).toBe("2026-08-17");
    expect(facts.actNo).toBe("21");
    expect(facts.actYear).toBe(2026);
    expect(facts.lokSabhaDate).toBe("2026-08-06");
    expect(facts.rajyaSabhaDate).toBe("2026-08-10");
    expect(facts.billNumber).toBe(150);
  });
  it("quotes the commencement clause exactly", () => {
    const found = findCommencement(doc("introduced", INTRODUCED));
    expect(found?.quote).toContain("deemed to have come into force on the 1st day of April, 2026");
    expect(found?.page).toBe(1);
  });
});

describe("verifyBill", () => {
  const docs = [doc("introduced", INTRODUCED), doc("passed_both_houses", PASSED_BOTH)];

  it("verifies a consistent enacted bill and links each check to a source", () => {
    const v = verifyBill({ bill, docs, indiaCode: { status: "not_found", checked: "2026-10-25" }, query: "Taxation and Other Laws Amendment Bill 2026" });
    expect(v.level).toBe("verified");
    expect(v.checks.find((check) => check.id === "printed")?.status).toBe("pass");
    expect(v.checks.find((check) => check.id === "indiacode")?.status).toBe("unavailable");
    expect(v.checks.find((check) => check.id === "record")?.sources[0].url).toContain("sansad.in");
    expect(v.commencement?.quote).toContain("1st day of April, 2026");
  });

  it("upgrades to 'corroborated' when India Code confirms the Act", () => {
    const v = verifyBill({ bill, docs, indiaCode: { status: "found", act: { title: "The Taxation and Other Laws (Amendment) Act, 2026", handle: "1/2", uuid: "u", actNumber: "21", actYear: 2026, enactDate: "2026-08-17", ministry: "Ministry of Finance", repealed: false, jurisdiction: "central", url: "https://indiacode.gov.in/handle/1/2", bundlesUrl: null } } });
    expect(v.level).toBe("corroborated");
  });

  it("FAILS when the register and the official document disagree on the assent date", () => {
    const v = verifyBill({ bill: { ...bill, assentDate: "2026-08-19" }, docs, indiaCode: null });
    expect(v.level).toBe("failed");
    expect(v.checks.find((check) => check.id === "printed")?.detail).toContain("Discrepancy");
  });

  it("reports, but does not fail the record for, a passing date that differs between the register and the document", () => {
    const v = verifyBill({ bill: { ...bill, passedRajyaSabha: "2026-08-11", assentDate: "2026-08-17" }, docs, indiaCode: null });
    expect(v.level).not.toBe("failed");
    const check = v.checks.find((c) => c.id === "printed");
    expect(check?.status).toBe("info");
    expect(check?.detail).toContain("the document says 2026-08-10, the register says 2026-08-11");
  });

  it("FAILS when the register and the document disagree on the Act number", () => {
    const v = verifyBill({ bill: { ...bill, actNo: "22" }, docs, indiaCode: null });
    expect(v.level).toBe("failed");
  });

  it("FAILS when a document is a different bill", () => {
    const wrong = doc("introduced", "A S INTRODUCED IN L OK S ABHA Bill No. 999 of 2026 THE CORPORATE LAWS (AMENDMENT) BILL, 2026 A BILL to amend the Companies Act");
    const v = verifyBill({ bill, docs: [wrong], indiaCode: null });
    expect(v.level).toBe("failed");
    expect(v.checks.find((check) => check.id === "identity")?.status).toBe("fail");
  });

  it("FAILS when a version is not what its label says", () => {
    const mislabelled = doc("passed_both_houses", INTRODUCED);
    const v = verifyBill({ bill, docs: [mislabelled], indiaCode: null });
    expect(v.checks.find((check) => check.id === "versions")?.status).toBe("fail");
  });

  it("FAILS on impossible dates", () => {
    const v = verifyBill({ bill: { ...bill, passedLokSabha: "2026-07-01" }, docs, indiaCode: null });
    expect(v.level).toBe("failed");
  });

  it("is only 'partly' verified, never 'verified', when the PDFs have no readable text", () => {
    const scanned: FetchedDoc[] = [{ kind: "introduced", label: "Bill as introduced", url: "https://sansad.in/a.pdf", pages: null }];
    const v = verifyBill({ bill, docs: scanned, indiaCode: null });
    expect(v.level).toBe("partly");
    expect(v.checks.find((check) => check.id === "identity")?.status).toBe("unavailable");
  });

  it("reports India Code being down as unavailable, not as a failure", () => {
    const v = verifyBill({ bill, docs, indiaCode: { status: "unreachable", reason: "timeout" } });
    expect(v.level).toBe("verified");
    expect(v.checks.find((check) => check.id === "indiacode")?.status).toBe("unavailable");
  });

  it("does not claim a pending bill is law", () => {
    const pending = { ...bill, status: "Pending", passedLokSabha: null, passedRajyaSabha: null, assentDate: null, actNo: null, actYear: null };
    const v = verifyBill({ bill: pending, docs: [doc("introduced", INTRODUCED)], indiaCode: null });
    expect(v.stage.isLaw).toBe(false);
    expect(v.checks.some((check) => check.id === "indiacode")).toBe(false);
  });
});

describe("quotes in AI statements are confirmed by code", () => {
  const passage: Passage = { id: "d1:p3:1", docKey: "d1", docTitle: "Bill", page: 3, url: "https://sansad.in/a.pdf#page=3", text: "( 2 ) Save as otherwise provided in this Act, it shall be deemed to have come into force on the 1st day of April, 2026." };
  const byId = new Map([[passage.id, passage]]);
  it("accepts an exact quote, ignoring whitespace and spacing", () => {
    expect(confirmQuotes({ text: "x", passages: [passage.id], quotes: ["it shall be deemed to have come into force on the 1st day of April, 2026"] }, byId)).toHaveLength(1);
  });
  it("rejects a paraphrase and a quote from a passage the statement does not cite", () => {
    expect(confirmQuotes({ text: "x", passages: [passage.id], quotes: ["it takes effect from the first of April 2026"] }, byId)).toHaveLength(0);
    expect(confirmQuotes({ text: "x", passages: [], quotes: ["it shall be deemed to have come into force on the 1st day of April, 2026"] }, byId)).toHaveLength(0);
  });
});

import { looksLikeEnglish } from "@/lib/knowledge/pdf-text";
describe("unreadable documents are 'could not check', not 'failed'", () => {
  const garbled = "ST 1] AR <hT TSTIA STHIERT 49 Susirer Gweror srfufm, 2019 (2019 1 Afufrm e 35) [9 &7, 2019] SRS & et 1 HREw F F e SR 3wy @ feg s faardt @ W @ i JuTe Fr A gRFei % o ok se wefia @ s faw w1 swEy w0 & fag sttt ST T < waed o # wag gr e ".repeat(12);
  const english = "An Act to provide for protection of the interests of consumers and for the said purpose, to establish authorities for timely and effective administration and settlement of consumers' disputes and for matters connected therewith. Be it enacted by Parliament in the Seventieth Year of the Republic of India as follows. This Act may be called the Consumer Protection Act, 2019 and it shall come into force on such date as the Central Government may appoint.";
  it("tells legacy-font gibberish from English", () => {
    expect(looksLikeEnglish(garbled)).toBe(false);
    expect(looksLikeEnglish(english)).toBe(true);
    expect(looksLikeEnglish("short")).toBe(false);
  });

  it("does not fail a record because one document's text is garbled", () => {
    const garbledDoc: FetchedDoc = { kind: "act_text", label: "Act text (India Code)", url: "https://indiacode.gov.in/x", pages: [garbled] };
    const v = verifyBill({ bill, docs: [garbledDoc, doc("introduced", INTRODUCED), doc("passed_both_houses", PASSED_BOTH)], indiaCode: null });
    expect(v.level).not.toBe("failed");
  });

  it("does not fail an old bill whose PDF has no 'as introduced' heading, but does fail a conflicting heading", () => {
    const oldBill = doc("introduced", "THE TAXATION AND OTHER LAWS (AMENDMENT) BILL, 2026 A BILL further to amend the Payment and Settlement Systems Act, 2007. Bill No. 150 of 2026. 1. This Act may be called the Taxation and Other Laws (Amendment) Act, 2026 and shall come into force on such date as the Central Government may by notification appoint for the purposes of this section.");
    expect(verifyBill({ bill, docs: [oldBill], indiaCode: null }).checks.find((check) => check.id === "versions")?.status).toBe("unavailable");
    const conflicting = doc("introduced", PASSED_BOTH);
    expect(verifyBill({ bill, docs: [conflicting], indiaCode: null }).checks.find((check) => check.id === "versions")?.status).toBe("fail");
  });
});

import { compareRanked } from "@/lib/engine/sansad";
describe("choosing between bills with near-identical titles", () => {
  const mk = (status: string, type = "Government"): SansadBill => ({ ...bill, status, type });
  it("prefers the bill that became law over a withdrawn predecessor", () => {
    const ranked = [{ bill: mk("Withdrawn"), score: 1 }, { bill: mk("Assented"), score: 0.94 }].sort(compareRanked);
    expect(ranked[0].bill.status).toBe("Assented");
  });
  it("still prefers a clearly better title match over a bill that went further", () => {
    const ranked = [{ bill: mk("Assented"), score: 0.6 }, { bill: mk("Pending"), score: 0.95 }].sort(compareRanked);
    expect(ranked[0].bill.status).toBe("Pending");
  });
  it("prefers a Government bill over a private member's bill on a tie", () => {
    const ranked = [{ bill: mk("Pending", "Private Member"), score: 0.9 }, { bill: mk("Pending", "Government"), score: 0.9 }].sort(compareRanked);
    expect(ranked[0].bill.type).toBe("Government");
  });
});

describe("two official sources that disagree on a date", () => {
  const docsFor = [doc("introduced", INTRODUCED), doc("passed_both_houses", PASSED_BOTH)];
  const act = { title: "The Taxation and Other Laws (Amendment) Act, 2026", handle: "1/2", uuid: "u", actNumber: "21", actYear: 2026, enactDate: "2026-02-15", ministry: "Ministry of Finance", repealed: false, jurisdiction: "central" as const, url: "https://indiacode.gov.in/handle/1/2", bundlesUrl: null };

  it("shows, but does not fail the record for, India Code giving a different enactment date for the same Act", () => {
    const v = verifyBill({ bill, docs: docsFor, indiaCode: { status: "mismatch", act, reason: "India Code gives the enactment date as 2026-02-15, Parliament’s record gives 2026-08-17." } });
    expect(v.level).toBe("verified");
    const check = v.checks.find((c) => c.id === "indiacode");
    expect(check?.status).toBe("info");
    expect(check?.detail).toContain("looks like an error in India Code’s index");
  });

  it("does not call a plausible difference an index error", () => {
    const v = verifyBill({ bill, docs: docsFor, indiaCode: { status: "mismatch", act: { ...act, enactDate: "2026-08-19" }, reason: "India Code gives 2026-08-19, Parliament’s record gives 2026-08-17." } });
    expect(v.checks.find((c) => c.id === "indiacode")?.detail).toContain("cannot tell which is right");
  });
});
