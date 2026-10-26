/**
 * Baseline for the "what is new" comparison: the SAME model (gpt-6-luna via Portkey) answering the same benchmark questions
 * with NO retrieved documents and NO Anvaya checks, i.e. how a general chatbot would answer from memory. Scored with the same
 * mechanical assertions as scripts/benchmark-ask.ts, on the questions that have a factual answer. This does not test ChatGPT
 * itself (we have no access to it on the course key); it isolates what retrieval and checking add for one model.
 * Usage: npx tsx scripts/baseline-chatbot.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import OpenAI from "openai";
import { getAIConfig } from "../lib/env";

type Item = { id: string; category: string; question: string; expect: string; mustMatch?: string[]; mustNotMatch?: string[] };
const config = getAIConfig();
if (!config) throw new Error("No AI key configured.");
const model = config.model;
const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL, defaultHeaders: config.headers, timeout: 60000, maxRetries: 1 });
const today = new Date().toISOString().slice(0, 10);

async function main() {
  const items = ([...JSON.parse(readFileSync("data/benchmarks/ask-benchmark.json", "utf8")), ...JSON.parse(readFileSync("data/benchmarks/ask-holdout.json", "utf8"))] as Item[]).filter((item) => item.expect === "answer");
  const rows: any[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (next < items.length) {
      const i = next++;
      const item = items[i];
      let response: Awaited<ReturnType<typeof client.responses.create>>;
      try {
        response = await client.responses.create({ model, input: `Today is ${today}. Answer this question about India's Digital Personal Data Protection Act, 2023 and its Rules, concisely and precisely.\n\nQuestion: ${item.question}`, max_output_tokens: 700 });
      } catch (error) {
        rows[i] = { id: item.id, category: item.category, question: item.question, pass: false, error: error instanceof Error ? error.message.slice(0, 120) : "error", failures: ["no answer: provider error"], answer: "", inputTokens: 0, outputTokens: 0 };
        console.log("ERROR", item.id, rows[i].error);
        continue;
      }
      const text = (response as { output_text?: string }).output_text ?? "";
      const failures: string[] = [];
      for (const pattern of item.mustMatch ?? []) if (!new RegExp(pattern, "i").test(text)) failures.push(`missing /${pattern}/`);
      for (const pattern of item.mustNotMatch ?? []) if (new RegExp(pattern, "i").test(text)) failures.push(`forbidden /${pattern}/`);
      rows[i] = { id: item.id, category: item.category, question: item.question, pass: failures.length === 0, failures, answer: text.slice(0, 400), inputTokens: response.usage?.input_tokens ?? 0, outputTokens: response.usage?.output_tokens ?? 0 };
      console.log(rows[i].pass ? "PASS" : "FAIL", item.id, failures.join("; "));
    }
  }));
  const errored = rows.filter((r) => r.error).length;
  const out = { errored, ranAt: new Date().toISOString(), model, method: "same model, no documents, no checks; questions with expect=answer from both benchmark files; same regex assertions", questions: rows.length, passed: rows.filter((r) => r.pass).length, results: rows };
  writeFileSync("data/benchmarks/baseline-chatbot-results.json", JSON.stringify(out, null, 1));
  console.log(`baseline: ${out.passed}/${out.questions}`);
}
main();
