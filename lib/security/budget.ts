/**
 * Daily token budget for the AI service. Every model call adds its tokens here; once the day's total reaches the
 * budget, live AI answers and new analyses stop (prepared answers, official documents and verification, which use no
 * tokens, keep working). It protects the course key from a bug that loops or a client that sends endless questions.
 *
 * In-process by design: it resets when the server restarts and is not shared between instances. A hosted deployment
 * would keep the counter in a shared store. Set ANVAYA_DAILY_TOKEN_BUDGET to change the limit (tokens per UTC day).
 */
export const DEFAULT_DAILY_TOKEN_BUDGET = 2_000_000;

let day = "";
let used = 0;

const today = (now: Date) => now.toISOString().slice(0, 10);

export function dailyTokenBudget(): number {
  const configured = Number(process.env.ANVAYA_DAILY_TOKEN_BUDGET);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_DAILY_TOKEN_BUDGET;
}

export function recordTokens(tokens: number, now = new Date()) {
  if (today(now) !== day) { day = today(now); used = 0; }
  used += Math.max(0, Math.round(tokens));
}

export function tokensUsedToday(now = new Date()): number {
  return today(now) === day ? used : 0;
}

export function budgetExhausted(now = new Date()): boolean {
  return tokensUsedToday(now) >= dailyTokenBudget();
}

export const BUDGET_MESSAGE = "Anvaya has reached its daily limit for AI answers, so new questions are paused until tomorrow (UTC). Prepared answers and the official documents on this page still work.";
