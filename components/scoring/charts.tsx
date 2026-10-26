import { scoreColor } from "@/components/scoring/ScoreRings";

/** Hand-written SVG charts: no chart library, one hue, direct labels, a text equivalent beside each. */

const W = 760;
const x = (v: number, left: number, right: number) => left + ((right - left) * v) / 100;
const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export type Dot = { label: string; score: number; lo: number | null; hi: number | null; focal?: boolean };

/** Score of each law on 0–100 with its 90% interval; the analysed policy is highlighted; the median of the comparators is a vertical line. */
export function DotPlot({ dots, median, title }: { dots: Dot[]; median: number | null; title: string }) {
  const left = 270;
  const right = W - 40;
  const row = 34;
  const H = 48 + dots.length * row;
  return (
    <div className="a-chartcard"><svg className="a-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line x1={x(tick, left, right)} x2={x(tick, left, right)} y1={20} y2={H - 26} stroke="#e1e7df" />
          <text x={x(tick, left, right)} y={H - 8} textAnchor="middle" fontSize="12">{tick}</text>
        </g>
      ))}
      {median !== null ? (
        <g>
          <line x1={x(median, left, right)} x2={x(median, left, right)} y1={14} y2={H - 26} stroke="#8d531c" strokeDasharray="5 4" strokeWidth="1.5" />
          <text x={x(median, left, right)} y={11} textAnchor="middle" fontSize="11" fill="#8d531c">median of comparators {Math.round(median)}</text>
        </g>
      ) : null}
      {dots.map((dot, i) => {
        const y = 38 + i * row;
        return (
          <g key={dot.label}>
            <text x={left - 12} y={y + 4} textAnchor="end" fontSize="12.5" fontWeight={dot.focal ? 700 : 400}>{trunc(dot.label, 34)}</text>
            {dot.lo !== null && dot.hi !== null ? <line x1={x(dot.lo, left, right)} x2={x(dot.hi, left, right)} y1={y} y2={y} stroke="#267c76" strokeOpacity={0.35} strokeWidth="6" strokeLinecap="round" /> : null}
            <circle cx={x(dot.score, left, right)} cy={y} r={dot.focal ? 8 : 6} fill={dot.focal ? "#102e3c" : scoreColor(dot.score)} stroke={dot.focal ? "#fff" : "#1b5f5a"} strokeWidth={dot.focal ? 2 : 1} />
            <text x={x(dot.score, left, right)} y={y - 12} textAnchor="middle" fontSize="11.5" fontWeight={dot.focal ? 700 : 400}>{Math.round(dot.score)}</text>
          </g>
        );
      })}
    </svg></div>
  );
}

/** Where the analysed policy's indicator sits among the comparators' values (0–1 scale, one row per indicator). */
export function StripPlot({ rows, title }: { rows: Array<{ label: string; focal: number | null; others: number[] }>; title: string }) {
  const left = 270;
  const right = W - 40;
  const row = 36;
  const H = 40 + rows.length * row;
  return (
    <div className="a-chartcard"><svg className="a-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      {[0, 0.5, 1].map((tick) => (
        <g key={tick}>
          <line x1={x(tick * 100, left, right)} x2={x(tick * 100, left, right)} y1={10} y2={H - 24} stroke="#e1e7df" />
          <text x={x(tick * 100, left, right)} y={H - 8} textAnchor="middle" fontSize="12">{tick}</text>
        </g>
      ))}
      {rows.map((r, i) => {
        const y = 28 + i * row;
        return (
          <g key={r.label}>
            <text x={left - 12} y={y + 4} textAnchor="end" fontSize="12.5">{trunc(r.label, 34)}</text>
            <line x1={x(0, left, right)} x2={x(100, left, right)} y1={y} y2={y} stroke="#eef1ec" />
            {r.others.map((v, j) => <circle key={j} cx={x(v * 100, left, right) + (j % 3) * 0.01} cy={y} r="5" fill="#267c76" fillOpacity={0.45} />)}
            {r.focal !== null ? <circle cx={x(r.focal * 100, left, right)} cy={y} r="7.5" fill="#102e3c" stroke="#fff" strokeWidth="2" /> : <text x={right} y={y + 4} textAnchor="end" fontSize="11.5" fill="#50655f">not measurable here</text>}
          </g>
        );
      })}
    </svg></div>
  );
}

/** Leave-one-out: how the score moves if each indicator is dropped in turn. */
export function Tornado({ base, rows, title }: { base: number; rows: Array<{ label: string; score: number }>; title: string }) {
  const left = 270;
  const right = W - 60;
  const row = 30;
  const H = 40 + rows.length * row;
  return (
    <div className="a-chartcard"><svg className="a-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <line x1={x(base, left, right)} x2={x(base, left, right)} y1={10} y2={H - 24} stroke="#102e3c" strokeWidth="1.5" />
      <text x={x(base, left, right)} y={H - 8} textAnchor="middle" fontSize="12" fontWeight="700">full score {Math.round(base)}</text>
      {rows.map((r, i) => {
        const y = 22 + i * row;
        const a = x(Math.min(base, r.score), left, right);
        const b = x(Math.max(base, r.score), left, right);
        return (
          <g key={r.label}>
            <text x={left - 12} y={y + 4} textAnchor="end" fontSize="12.5">without: {trunc(r.label, 28)}</text>
            <rect x={a} y={y - 7} width={Math.max(2, b - a)} height="14" rx="3" fill="#267c76" fillOpacity={0.55} />
            <text x={r.score >= base ? b + 6 : a - 6} y={y + 4} textAnchor={r.score >= base ? "start" : "end"} fontSize="11.5">{Math.round(r.score)}</text>
          </g>
        );
      })}
    </svg></div>
  );
}

/** Pooled scores of every comparator (all areas) as a histogram, with the analysed policy marked. */
export function Distribution({ values, focal, title }: { values: number[]; focal: number | null; title: string }) {
  const left = 40;
  const right = W - 30;
  const bins = new Array(10).fill(0);
  values.forEach((v) => { bins[Math.min(9, Math.floor(v / 10))] += 1; });
  const top = Math.max(1, ...bins);
  const H = 190;
  return (
    <div className="a-chartcard"><svg className="a-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      {bins.map((count, i) => {
        const h = (count / top) * 110;
        const bx = x(i * 10, left, right);
        const bw = x(10, left, right) - x(0, left, right) - 3;
        return (
          <g key={i}>
            <rect x={bx} y={140 - h} width={bw} height={h} fill="#267c76" fillOpacity={0.5} />
            {count ? <text x={bx + bw / 2} y={136 - h} textAnchor="middle" fontSize="11.5">{count}</text> : null}
          </g>
        );
      })}
      {[0, 25, 50, 75, 100].map((tick) => <text key={tick} x={x(tick, left, right)} y={160} textAnchor="middle" fontSize="12">{tick}</text>)}
      {focal !== null ? (
        <g>
          <line x1={x(focal, left, right)} x2={x(focal, left, right)} y1={14} y2={142} stroke="#102e3c" strokeWidth="2" />
          <text x={x(focal, left, right)} y={11} textAnchor="middle" fontSize="12" fontWeight="700">this policy {Math.round(focal)}</text>
        </g>
      ) : null}
      <text x={left} y={182} fontSize="11.5" fill="#50655f">Number of comparator laws (all policy areas) by score</text>
    </svg></div>
  );
}
