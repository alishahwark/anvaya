"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

/** Starts a real research job against the supported official sources. */
export function ResearchLauncher({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 3) return setError("Please enter at least three characters.");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/research", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }) });
      const body = (await response.json()) as { jobId?: number; error?: string };
      if (!response.ok || !body.jobId) throw new Error(body.error ?? "Research could not start.");
      router.push(`/research/${body.jobId}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Research could not start.");
      setLoading(false);
    }
  }

  return (
    <div className="a-card a-card--dashed" id="research">
      <span className="a-eyebrow">Not listed?</span>
      <h2 className="a-h3" style={{ marginTop: "0.6rem" }}>Ask for any bill, law or policy</h2>
      <p className="a-small" style={{ marginTop: "0.5rem", maxWidth: "36rem" }}>
        Type its name and Anvaya searches Parliament’s bill register, or paste a link to an official document (sansad.in, meity.gov.in, indiacode.nic.in, egazette.gov.in, pib.gov.in). It downloads the document, explains it in plain language and checks each statement against the text. The record stays marked unverified.
      </p>
      <form onSubmit={submit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <label htmlFor="research-query" className="sr-only">Name of the bill or policy, or a link to an official document</label>
        <input
          id="research-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="A name, or a link to an official PDF"
          style={{ flex: "1 1 16rem", minHeight: "2.9rem", border: "1px solid var(--a-line-strong)", borderRadius: "999px", padding: "0 1.1rem", background: "#fff", font: "inherit" }}
        />
        <button type="submit" className="a-btn a-btn--primary" disabled={loading}>
          {loading ? "Checking official sources…" : "Fetch and explain"}
        </button>
      </form>
      {error ? <p role="alert" style={{ marginTop: "0.75rem", color: "#9a4f36", fontSize: "0.9rem" }}>{error}</p> : null}
    </div>
  );
}
