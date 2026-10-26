import { describe, expect, it } from "vitest";
import { dropPartialStart, relevantQuote } from "@/lib/ask/answer";

describe("excerpt trimming", () => {
  it("drops a word fragment at the start of a chunk", () => {
    expect(dropPartialStart("cipal has given her consent; or (b) for certain legitimate uses.")).toBe("… has given her consent; or (b) for certain legitimate uses.");
  });
  it("leaves a normal sentence alone", () => {
    expect(dropPartialStart("The Board may impose a penalty.")).toBe("The Board may impose a penalty.");
  });
  it("never starts an excerpt mid-word", () => {
    const text = "cipal has given her consent; or (b) for certain legitimate uses. Every request shall be accompanied by a notice.";
    expect(relevantQuote({ id: "act:p4:2", text }, ["consent for legitimate uses"])).not.toMatch(/^cipal/);
  });
});
