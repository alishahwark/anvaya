"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Row = Record<string, unknown>;
type Alternative = { title: string; subtitle: string; query: string };
type ResearchResult = { job: Row; sources: Row[]; documents: Row[]; events: Row[]; alternatives?: Alternative[] };

const SOURCE_NAMES: Record<string, string> = {
  "sansad-bills": "Parliament’s bill register (Digital Sansad)",
  "india-code": "India Code (the statute book)",
  "official-link": "The link you pasted",
};

function sourceName(id: string) {
  return SOURCE_NAMES[id] ?? id.replaceAll("-", " ");
}

/** Plain-language summary of one persisted source check. */
function sourceLine(source: Row): string {
  const status = String(source.status);
  const found = Number(source.candidates_found ?? 0);
  const retrieved = Number(source.documents_retrieved ?? 0);
  if (status === "blocked" || status === "failed") return "Could not be reached, so nothing was taken from it.";
  if (!found) return "Checked. No matching document.";
  return `Checked. ${found} possible ${found === 1 ? "match" : "matches"}, ${retrieved} downloaded.`;
}

export function ResearchJobView({ id }: { id: string }) {
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const response = await fetch(`/api/research/${id}`, { cache: "no-store" });
        const body = (await response.json()) as ResearchResult & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "This research job could not be found.");
        if (!cancelled) {
          setResult(body);
          if (!["queued", "running"].includes(String(body.job.status))) return;
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "This research job could not be loaded.");
        return;
      }
      if (!cancelled) timer = setTimeout(poll, 1000);
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  // Once a document has been found, go straight to its page, where the analysis is written.
  const finishedSlug = result && !["queued", "running"].includes(String(result.job.status)) ? String(result.job.result_policy_slug ?? "") : "";
  useEffect(() => {
    if (!finishedSlug) return;
    if ((result?.alternatives?.length ?? 0) > 0) return; // let the reader choose between matches
    const timer = setTimeout(() => router.push(`/policies/${finishedSlug}`), 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishedSlug, router]);

  async function searchAgain(query: string) {
    const response = await fetch("/api/research", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }) });
    const body = (await response.json()) as { jobId?: number };
    if (body.jobId) router.push(`/research/${body.jobId}`);
  }

  if (error) return <p role="alert" className="a-card">{error}</p>;
  if (!result) return <p role="status" className="a-card"><span className="a-spinner" aria-hidden="true" />Starting the search…</p>;

  const job = result.job;
  const running = ["queued", "running"].includes(String(job.status));
  const slug = String(job.result_policy_slug ?? "");
  const found = result.documents.length;

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      <div aria-live="polite">
        {running ? (
          <p className="a-lede"><span className="a-spinner" aria-hidden="true" />Checking official sources for “{String(job.query)}”…</p>
        ) : slug && job.summary ? (
          <p className="a-lede">{String(job.summary)}</p>
        ) : found ? (
          <p className="a-lede">We found {found} official {found === 1 ? "document" : "documents"} for “{String(job.query)}”.</p>
        ) : slug ? (
          <p className="a-lede">{String(job.summary ?? "Found.")}</p>
        ) : (
          <p className="a-lede">{String(job.summary ?? "")}</p>
        )}
      </div>

      {slug && !running ? (
        <div>
          <Link href={`/policies/${slug}`} className="a-btn a-btn--primary">Open the verified record →</Link>
        </div>
      ) : null}

      <section aria-labelledby="where">
        <h2 id="where" className="a-h3">Where we looked</h2>
        <ul className="a-docs" style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
          {result.sources.map((source) => (
            <li key={String(source.adapter_id)} className="a-doc" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <h3>{sourceName(String(source.adapter_id))}</h3>
                <p>{sourceLine(source)}</p>
                {source.error != null ? <p style={{ color: "#9a4f36" }}>{String(source.error)}</p> : null}
              </div>
            </li>
          ))}
          {!result.sources.length && running ? <li className="a-small">Starting…</li> : null}
        </ul>
      </section>

      {found ? (
        <section aria-labelledby="found">
          <h2 id="found" className="a-h3">What we found</h2>
          <div className="a-docs" style={{ marginTop: "1rem" }}>
            {result.documents.map((document) => (
              <div key={String(document.id)} className="a-doc">
                <div>
                  <h3>{String(document.candidate_title)}</h3>
                  <p>{String(document.publisher ?? "") || String(document.source_type)}</p>
                </div>
                <a className="a-btn a-btn--ghost" href={String(document.source_url)} target="_blank" rel="noreferrer noopener">Open original ↗</a>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!running && (result.alternatives?.length ?? 0) > 0 ? (
        <section aria-labelledby="alts">
          <h2 id="alts" className="a-h3">Did you mean a different one?</h2>
          <p className="a-small" style={{ marginTop: "0.4rem" }}>Other matches in the official registers. Pick one to fetch and verify it instead.</p>
          <div className="a-alt">
            {result.alternatives!.map((alternative) => (
              <a key={`${alternative.title}-${alternative.subtitle}`} href="#" onClick={(event) => { event.preventDefault(); void searchAgain(alternative.query); }}>
                <strong>{alternative.title}</strong>
                <span className="a-small">{alternative.subtitle}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

    </div>
  );
}
