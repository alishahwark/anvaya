import { describe, expect, it } from "vitest";
import { dpdpKnowledge, dpdpKnowledge as dpdpDraft } from "@/lib/knowledge/dpdp";
import { daysBetween, formatDate, legalStatus, phaseState } from "@/lib/knowledge";
import { verifyKnowledge } from "@/lib/knowledge/verify";
import type { PolicyKnowledge } from "@/lib/knowledge/types";

const withClaims = (evidence: { page: number; quote: string }[]): PolicyKnowledge =>
  ({
    ...dpdpDraft,
    claims: [{ id: "probe", claimType: "statutory_text", claim: "probe", evidence: evidence.map((item) => ({ doc: "act", section: "probe", ...item })) }],
  }) as PolicyKnowledge;

describe("evidence verifier", () => {
  it("rejects a quote that is not in the document", async () => {
    const report = await verifyKnowledge(withClaims([{ page: 7, quote: "Small businesses with fewer than 50 employees are exempt from this Act" }]));
    expect(report.checks[0].status).toBe("not_found");
  });

  it("detects a real quote cited on the wrong page and says where it is", async () => {
    const report = await verifyKnowledge(withClaims([{ page: 3, quote: "by taking reasonable security safeguards to prevent personal data breach" }]));
    expect(report.checks[0].status).toBe("wrong_page");
    expect(report.checks[0].foundOnPages).toContain(7);
  });

  it("accepts a real quote on the right page", async () => {
    const report = await verifyKnowledge(withClaims([{ page: 7, quote: "by taking reasonable security safeguards to prevent personal data breach" }]));
    expect(report.checks[0].status).toBe("supported");
  });
});

describe("DPDP knowledge integrity", () => {
  const knowledge = dpdpKnowledge;
  const claimIds = new Set(knowledge.claims.map((claim) => claim.id));

  const referenced = [
    ...knowledge.whatChanges.flatMap((item) => item.claimIds),
    ...knowledge.phases.flatMap((item) => item.claimIds),
    ...knowledge.rulesPhases.flatMap((item) => item.claimIds),
    ...knowledge.events.flatMap((item) => item.claimIds),
    ...knowledge.stakeholders.flatMap((group) => group.implications.flatMap((item) => item.claimIds)),
    ...knowledge.baselineAnswers.flatMap((item) => item.claimIds),
  ];

  it("only references claims that exist", () => {
    expect(referenced.filter((id) => !claimIds.has(id))).toEqual([]);
  });

  it("gives every stakeholder implication and baseline answer at least one claim", () => {
    for (const group of knowledge.stakeholders) for (const item of group.implications) expect(item.claimIds.length, `${group.id}: ${item.text.slice(0, 40)}`).toBeGreaterThan(0);
    for (const answer of knowledge.baselineAnswers) expect(answer.claimIds.length, answer.id).toBeGreaterThan(0);
  });

  it("only references documents that are in the source library", () => {
    const docs = new Set(knowledge.documents.map((document) => document.key));
    for (const claim of knowledge.claims) for (const ref of claim.evidence) expect(docs.has(ref.doc), `${claim.id} -> ${ref.doc}`).toBe(true);
  });

  it("computes phase dates as the publication date plus 12 and 18 months", () => {
    const [p1, p2, p3] = knowledge.phases;
    const publication = new Date(`${p1.date}T00:00:00Z`);
    const plus = (months: number) => { const d = new Date(publication); d.setUTCMonth(d.getUTCMonth() + months); return d.toISOString().slice(0, 10); };
    expect(p2.date).toBe(plus(12));
    expect(p3.date).toBe(plus(18));
    expect(knowledge.rulesPhases.map((item) => item.date)).toEqual([p1.date, p2.date, p3.date]);
  });

  it("does not show internal enum names to citizens", () => {
    const text = JSON.stringify([knowledge.brief, knowledge.whatChanges, knowledge.phases, knowledge.stakeholders, knowledge.baselineAnswers]);
    expect(text).not.toMatch(/effective_on_schedule|future_on_schedule|partially_commenced|sourceStatus|Group [ABC]\b/);
  });

  it("keeps the brief within 80–130 words and leads with substance, not ingestion", () => {
    const words = knowledge.brief.split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(80);
    expect(words).toBeLessThanOrEqual(130);
    expect(knowledge.brief).not.toMatch(/imported|ingest|SHA|hash/i);
  });
});

describe("status as of a date", () => {
  it("is partly in force on 25 October 2026, with 2027 provisions still upcoming", () => {
    const status = legalStatus(dpdpKnowledge, "2026-10-25");
    expect(status.label).toBe("Partly in force");
    expect(status.sentence).toContain("13 May 2027");
    expect(phaseState(dpdpKnowledge.phases[2], "2026-10-25")).toBe("upcoming");
    expect(phaseState(dpdpKnowledge.phases[0], "2026-10-25")).toBe("in_force");
  });
  it("moves phase 2 into force on 13 November 2026 and everything on 13 May 2027", () => {
    expect(phaseState(dpdpKnowledge.phases[1], "2026-11-13")).toBe("in_force");
    expect(legalStatus(dpdpKnowledge, "2027-05-13").label).toBe("In force");
  });
  it("formats dates in readable English", () => {
    expect(formatDate("2026-11-13")).toBe("13 November 2026");
    expect(daysBetween("2026-10-25", "2026-11-13")).toBe(19);
  });
});

import { cleanStatementText } from "@/lib/ask/answer";
describe("model text hygiene", () => {
  it("strips citation arrays and passage ids leaked into sentences", () => {
    expect(cleanStatementText('Consent must be specific. ["act:p5:1"]')).toBe("Consent must be specific.");
    expect(cleanStatementText("These duties start in 2027. []")).toBe("These duties start in 2027.");
    expect(cleanStatementText("See section 8 (act:p7:2) for safeguards.")).toBe("See section 8 for safeguards.");
    expect(cleanStatementText("Plain sentence with [brackets] inside stays.")).toBe("Plain sentence with [brackets] inside stays.");
  });
});

import { relevantQuote } from "@/lib/ask/answer";
describe("citation quote selection", () => {
  const text = "( 1 ) The consent given by the Data Principal shall be free, specific, informed, unconditional and unambiguous with a clear affirmative action. Illustration. X, an individual, downloads a telemedicine app. ( 4 ) Where consent is the basis of processing, the Data Principal shall have the right to withdraw her consent at any time.";
  it("shows the sentence the answer relies on, not the start of the chunk", () => {
    const quote = relevantQuote({ id: "act:p5:1", text }, ["People can withdraw consent at any time."]);
    expect(quote).toContain("right to withdraw her consent at any time");
    expect(quote.length).toBeLessThanOrEqual(381);
  });
  it("shows the verified quotes for reviewed notes", () => {
    const quote = relevantQuote({ id: "note:duty.security", text: "Reviewed note (wording checked against the official text). A business must protect data. Source quotes: Section 8(5): “reasonable security safeguards”" }, ["x"]);
    expect(quote).toBe("Section 8(5): “reasonable security safeguards”");
  });
  it("never starts mid-word for a short passage", () => {
    expect(relevantQuote({ id: "act:p1:1", text: "Short passage that fits." }, ["short"])).toBe("Short passage that fits.");
  });
});
