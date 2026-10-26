import type { ResolvedEvidence } from "@/lib/knowledge/resolve";

/**
 * "Show the evidence" disclosure. Every item is an exact passage from an official
 * document with a link that opens the PDF at that page. Works without JavaScript.
 */
export function Evidence({ items, open = false, label }: { items: ResolvedEvidence[]; open?: boolean; label?: string }) {
  if (!items.length) return null;
  const heading = label ?? `Evidence · ${items.length} ${items.length === 1 ? "passage" : "passages"} from official documents`;
  return (
    <details className="a-evidence" open={open}>
      <summary>{heading}</summary>
      <ol>
        {items.map((item) => (
          <li key={`${item.url}|${item.quote}`}>
            <div className="a-evidence__ref">
              {item.label}
              {item.section ? <span> · {item.section}</span> : null}
              {item.verified ? <span className="a-verified"> · ✓ wording checked in the PDF</span> : null}
            </div>
            <blockquote>“{item.quote}”</blockquote>
            <a className="a-link" href={item.url} target="_blank" rel="noreferrer noopener" style={{ fontSize: "0.82rem" }}>
              Open the official PDF at page {item.page} ↗
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
