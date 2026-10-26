import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

export type AgentExecution = { timestamp: string; agent: string; provider: string; model: string; inputTokens: number | null; cachedInputTokens: number | null; outputTokens: number | null; totalTokens: number | null; durationMs: number; status: "success" | "error" };
export async function recordAgentExecution(execution: AgentExecution) { const path = join(process.cwd(), "data", "logs", "agent-executions.jsonl"); await mkdir(dirname(path), { recursive: true }); await appendFile(path, `${JSON.stringify(execution)}\n`, "utf8"); }
