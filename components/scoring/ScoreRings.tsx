import Link from "next/link";
import { useId } from "react";
import { DIMENSIONS } from "@/lib/scoring/indicators";
import { effectStatus } from "@/lib/scoring/outcomes/evidence";
import type { Scorecard } from "@/lib/scoring/types";

const R = 46;
const C = 2 * Math.PI * R;
const RO = 57; // outer arc that carries the 90% range
const CO = 2 * Math.PI * RO;

/** One hue, darker = more of the design feature. No red/green: a score describes design, not merit. */
export const scoreColor = (score: number) => `hsl(174 ${Math.round(38 + score * 0.25)}% ${Math.round(72 - score * 0.45)}%)`;

/**
 * The ring graphic. The thick arc is the score. A thin outer arc is the 90% range, so the uncertainty is visible
 * without competing with the score. The dot marks the end of the score arc.
 */
export function RingSvg({ score, lo, hi }: { score: number | null; lo?: number | null; hi?: number | null }) {
  const id = useId();
  const has = score !== null;
  const len = has ? (C * score) / 100 : 0;
  const angle = has ? (360 * score) / 100 : 0;
  const range = has && lo != null && hi != null ? { from: (CO * lo) / 100, len: Math.max(2, (CO * (hi - lo)) / 100), a0: (360 * lo) / 100 } : null;
  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true" focusable="false">
      {has ? (
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={scoreColor(score * 0.55)} />
            <stop offset="1" stopColor={scoreColor(score)} />
          </linearGradient>
        </defs>
      ) : null}
      <circle cx="64" cy="64" r={R} fill="none" stroke="#edf1ec" strokeWidth="10" strokeDasharray={has ? undefined : "2 6"} strokeLinecap="round" />
      {range ? <circle className="a-arc a-arc--range" style={{ ["--c" as string]: CO }} cx="64" cy="64" r={RO} fill="none" stroke="#267c76" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${range.len} ${CO}`} transform={`rotate(${-90 + range.a0} 64 64)`} /> : null}
      {has && len > 0 ? <circle className="a-arc" style={{ ["--c" as string]: C }} cx="64" cy="64" r={R} fill="none" stroke={`url(#g${id})`} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${len} ${C}`} transform="rotate(-90 64 64)" /> : null}
      {has && len > 0 ? (
        <g className="a-knob" style={{ ["--a" as string]: `${angle}deg` }}>
          <circle cx="64" cy={64 - R} r="3.2" fill="#fff" />
        </g>
      ) : null}
      <text x="64" y="68" textAnchor="middle" className="a-ring__num">{has ? Math.round(score) : "—"}</text>
      {has ? <text x="64" y="84" textAnchor="middle" className="a-ring__of">of 100</text> : null}
    </svg>
  );
}

/**
 * Five rings, one per dimension. Hover or keyboard focus reveals the reason for the score (CSS only, no script);
 * clicking opens the benchmark analysis for that dimension.
 */
export function ScoreRings({ slug, card }: { slug: string; card: Scorecard }) {
  const effect = effectStatus([]);
  return (
    <section className="a-rings" aria-labelledby="h-rings">
      <span className="a-eyebrow">Policy scorecard</span>
      <h2 id="h-rings" className="a-h2">How the policy is built</h2>
      <p className="a-prose a-muted" style={{ marginTop: "0.75rem" }}>
        Scores are computed from the official text by formula, using measures from public-policy and law-and-economics research. They describe design, not whether a policy’s goals are right, and there is no overall score. Hover a ring for the reason; open it to compare with laws from other countries.
      </p>
      <ul className="a-ringrow">
        {DIMENSIONS.map((dim) => {
          const result = card.dimensions.find((d) => d.id === dim.id);
          const isEffect = dim.id === "effect";
          const scored = !isEffect && result?.status === "scored" && result.score !== null;
          const score = scored ? (result!.score as number) : null;
          const why = isEffect ? effect.reason : result?.why ?? "";
          const href = `/policies/${slug}/benchmark?d=${dim.id}`;
          return (
            <li key={dim.id} className="a-ringitem">
              <Link href={href} className="a-ring" aria-label={`${dim.name}: ${scored ? `${Math.round(score!)} out of 100` : "not measurable"}. ${why} Open the benchmark.`}>
                <RingSvg score={score} lo={result?.lo} hi={result?.hi} />
                <span className="a-ring__name">{dim.name}</span>
                <span className="a-ring__sub">{scored ? `90% range ${Math.round(result!.lo ?? score!)}–${Math.round(result!.hi ?? score!)}` : isEffect ? "Not yet measurable" : "Not enough evidence"}</span>
              </Link>
              <div className="a-ringtip" role="tooltip">
                <strong>{dim.name}</strong>
                <p>{why}</p>
                <span>{isEffect ? "Open to see what would be needed" : "Click for the international benchmark"} →</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="a-small">{card.caveats[card.caveats.length - 1]} Basis: {card.basis}. <Link className="a-link" href="/methodology">How the scores are built</Link></p>
      {card.caveats.length > 1 ? <p className="a-small">{card.caveats.slice(0, -1).join(" ")}</p> : null}
    </section>
  );
}
