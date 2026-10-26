import { afterEach, describe, expect, it } from "vitest";
import { BUDGET_MESSAGE, budgetExhausted, dailyTokenBudget, recordTokens, tokensUsedToday } from "@/lib/security/budget";
import { answerWithCorpus } from "@/lib/ask/answer";
import type { LoadedCorpus } from "@/lib/ask/corpus";

const original = { budget: process.env.ANVAYA_DAILY_TOKEN_BUDGET, key: process.env.PORTKEY_API_KEY };
afterEach(() => {
  process.env.ANVAYA_DAILY_TOKEN_BUDGET = original.budget;
  if (original.budget === undefined) delete process.env.ANVAYA_DAILY_TOKEN_BUDGET;
  if (original.key === undefined) delete process.env.PORTKEY_API_KEY; else process.env.PORTKEY_API_KEY = original.key;
});

describe("daily token budget", () => {
  it("counts tokens and trips at the limit", () => {
    process.env.ANVAYA_DAILY_TOKEN_BUDGET = "1000";
    const day = new Date("2031-03-03T10:00:00Z");
    recordTokens(600, day);
    expect(budgetExhausted(day)).toBe(false);
    recordTokens(450, day);
    expect(tokensUsedToday(day)).toBe(1050);
    expect(budgetExhausted(day)).toBe(true);
  });
  it("resets on a new UTC day", () => {
    process.env.ANVAYA_DAILY_TOKEN_BUDGET = "1000";
    recordTokens(5000, new Date("2031-03-04T23:59:00Z"));
    expect(budgetExhausted(new Date("2031-03-04T23:59:30Z"))).toBe(true);
    expect(budgetExhausted(new Date("2031-03-05T00:00:30Z"))).toBe(false);
  });
  it("ignores a nonsense limit and falls back to the default", () => {
    process.env.ANVAYA_DAILY_TOKEN_BUDGET = "-5";
    expect(dailyTokenBudget()).toBeGreaterThan(0);
  });
  it("refuses a live question without calling the model once the budget is spent", async () => {
    process.env.PORTKEY_API_KEY = "test-key-never-used";
    process.env.ANVAYA_DAILY_TOKEN_BUDGET = "10";
    recordTokens(100);
    const corpus = { policySlug: "demo", policyTitle: "Demo Act", curated: false, verified: false, version: "v1", statusBlock: "", passages: [{ id: "p1", docKey: "d", docTitle: "Demo Act", page: 1, text: "Every operator shall file a return within thirty days.", url: "https://sansad.in/x" }] } as unknown as LoadedCorpus;
    const result = await answerWithCorpus({ policySlug: "demo", question: "When must an operator file a return?" }, corpus, null);
    expect(result.status).toBe("unavailable");
    expect(result.notice).toBe(BUDGET_MESSAGE);
    expect(result.execution).toBeUndefined();
  });
});
