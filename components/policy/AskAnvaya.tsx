"use client";

import { useEffect, useRef, useState } from "react";
import { Evidence } from "@/components/policy/Evidence";
import type { AskResult } from "@/lib/ask/answer";
import type { ResolvedEvidence } from "@/lib/knowledge/resolve";

type State = { phase: "idle" } | { phase: "loading"; question: string; slow: boolean } | { phase: "done"; result: AskResult } | { phase: "error"; question: string; message: string };

export function AskAnvaya({ policySlug, policyName, suggestions, placeholder = "Ask a question about this document" }: { policySlug: string; policyName: string; suggestions: string[]; placeholder?: string }) {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });
  const controller = useRef<AbortController | null>(null);

  async function ask(raw: string) {
    const text = raw.trim();
    if (text.length < 3) {
      setState({ phase: "error", question: text, message: "Please type a question of at least a few words." });
      return;
    }
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setQuestion(text);
    setState({ phase: "loading", question: text, slow: false });
    const slowTimer = setTimeout(() => setState((current) => (current.phase === "loading" ? { ...current, slow: true } : current)), 2500);
    const timeout = setTimeout(() => abort.abort(), 80000);
    try {
      const response = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ policySlug, question: text }), signal: abort.signal });
      const body = (await response.json()) as AskResult & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Something went wrong.");
      setState({ phase: "done", result: body });
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError" ? "That took too long. Please try again." : error instanceof Error ? error.message : "Something went wrong.";
      setState({ phase: "error", question: text, message });
    } finally {
      clearTimeout(slowTimer);
      clearTimeout(timeout);
    }
  }

  // A question carried in from the homepage (?q=...) is asked once on arrival.
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current) return;
    const carried = new URLSearchParams(window.location.search).get("q");
    if (carried && carried.trim().length >= 3) {
      asked.current = true;
      void ask(carried);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="a-ask">
      <span className="a-eyebrow">Ask Anvaya</span>
      <h2 className="a-h2" style={{ marginTop: "0.6rem" }}>Ask a question about the {policyName}</h2>
      <p style={{ marginTop: "0.75rem", color: "#dbe7e1", maxWidth: "40rem" }}>
        Answers come only from the official documents on this page, with the passages they rely on shown underneath.
      </p>
      <form
        className="a-ask__form"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <label htmlFor="ask-input" className="sr-only">Your question</label>
        <input id="ask-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={placeholder} maxLength={600} autoComplete="off" />
        <button type="submit" className="a-btn a-btn--primary" disabled={state.phase === "loading"}>
          {state.phase === "loading" ? "Reading…" : "Ask"}
        </button>
      </form>
      <div className="a-ask__chips" aria-label="Suggested questions">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" className="a-ask__chip" onClick={() => void ask(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>

      <div aria-live="polite" aria-atomic="false">
        {state.phase === "loading" ? (
          <p className="a-ask__status" role="status">
            <span className="a-spinner" aria-hidden="true" />
            {state.slow ? "Reading the official text and checking the answer against it. This can take around ten seconds…" : "Finding the relevant passages…"}
          </p>
        ) : null}
        {state.phase === "error" ? (
          <p className="a-ask__status" role="alert">
            {state.message}{" "}
            {state.question.length >= 3 ? (
              <button type="button" className="a-link" style={{ background: "none", border: 0, cursor: "pointer", color: "#f0c18b" }} onClick={() => void ask(state.question)}>
                Try again
              </button>
            ) : null}
          </p>
        ) : null}
        {state.phase === "done" ? <Answer result={state.result} suggestions={suggestions} onAsk={(text) => void ask(text)} /> : null}
      </div>
    </div>
  );
}

function Answer({ result, suggestions, onAsk }: { result: AskResult; suggestions: string[]; onAsk: (question: string) => void }) {
  const evidence: ResolvedEvidence[] = result.citations.map((citation) => ({ label: citation.label, section: "", page: citation.page, quote: citation.quote, url: citation.url, verified: citation.quoteVerified ?? result.source === "baseline" }));

  if (result.status === "unavailable") {
    return (
      <div className="a-answer">
        <p className="a-answer__q">{result.question}</p>
        <p style={{ margin: "0.5rem 0 0" }}>{result.notice}</p>
      </div>
    );
  }

  const verification = result.verification;
  return (
    <div className="a-answer">
      <p className="a-answer__q">{result.question}</p>
      <p className="a-answer__lead">{result.answer}</p>
      {result.details.length ? (
        <ul>
          {result.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      {result.uncertainty ? <p className="a-small" style={{ marginTop: "1rem" }}><strong>What the text does not settle:</strong> {result.uncertainty}</p> : null}
      {result.notice ? <p className="a-answer__notice">{result.notice}</p> : null}
      <Evidence items={evidence} open label={evidence.length ? `Sources behind this answer · ${evidence.length}` : undefined} />
      <p className="a-answer__verify">
        {result.source === "baseline"
          ? "Prepared answer. The quoted wording was checked against the official PDFs; no AI was used."
          : verification
            ? `Written by AI from the retrieved official passages. Checks: ${verification.supported} of ${verification.checked} statements fully supported by a second AI pass${verification.unsupported ? ` (${verification.unsupported} left out)` : ""}${verification.quoted !== undefined ? `; ${verification.quoted} of ${verification.checked} carry a quote found word for word in the official text` : ""}.`
            : "Written by AI from the retrieved official passages."}
        {result.status === "abstained" ? " Anvaya prefers to say it cannot confirm something than to guess." : ""}
      </p>
      {result.status === "abstained" && suggestions.length ? (
        <div className="a-hint">
          This isn’t covered in the text Anvaya retrieved, which may simply mean the document doesn’t address it. You could ask instead:
          <div>
            {suggestions.slice(0, 4).map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => onAsk(suggestion)}>{suggestion}</button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
