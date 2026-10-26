"use client";

import { useMemo, useState } from "react";
import { calculateScenario, type ScenarioInputs } from "@/lib/economic/scenario";
import { calculateStatistics, formatNumber, periodChange } from "@/lib/economic/statistics";
import type { EconomicSeries } from "@/lib/economic/types";

const metricLabels = { index_al: "CPI index · all India", index_rl: "CPI index · rural + urban", inflation_al: "Inflation · all India", inflation_rl: "Inflation · rural + urban" } as const;
const metricUnits = { index_al: "index points (2019=100)", index_rl: "index points (2019=100)", inflation_al: "% year-on-year", inflation_rl: "% year-on-year" } as const;

function LineChart({ observations, metric }: { observations: EconomicSeries["observations"]; metric: keyof typeof metricLabels }) {
  const [hover, setHover] = useState<number | null>(null);
  const data = observations.filter((item) => item.metric === metric).slice(-120);
  if (!data.length) return <div className="evidence-empty">No observations are available for this metric.</div>;
  const W = 760, H = 300, L = 52, R = 16, T = 16, B = 34;
  const min = Math.min(...data.map((item) => item.value)); const max = Math.max(...data.map((item) => item.value)); const span = max - min || 1;
  const px = (i: number) => L + (i / Math.max(data.length - 1, 1)) * (W - L - R);
  const py = (v: number) => T + (1 - (v - min) / span) * (H - T - B);
  const line = data.map((item, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(item.value).toFixed(1)}`).join(" ");
  const area = `${line} L${px(data.length - 1).toFixed(1)} ${H - B} L${px(0).toFixed(1)} ${H - B} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + span * t);
  const active = hover === null ? null : data[hover];
  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * W;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(((x - L) / (W - L - R)) * (data.length - 1)))));
  };
  return (
    <div className="evidence-chart-wrap">
      <div className="chart-stage">
        <svg className="evidence-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${metricLabels[metric]} over the selected period. Hover to read each value.`} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#267c76" stopOpacity="0.22" /><stop offset="1" stopColor="#267c76" stopOpacity="0" /></linearGradient></defs>
          {ticks.map((tick) => (<g key={tick}><line x1={L} x2={W - R} y1={py(tick)} y2={py(tick)} className="chart-grid" /><text x={L - 8} y={py(tick) + 4} textAnchor="end" className="chart-tick">{formatNumber(tick)}</text></g>))}
          <path d={area} fill="url(#chart-fill)" className="chart-area" />
          <path d={line} className="chart-line" pathLength={1} />
          <text x={L} y={H - 10} className="chart-tick">{data[0].period}</text>
          <text x={W - R} y={H - 10} textAnchor="end" className="chart-tick">{data.at(-1)?.period}</text>
          {active ? (<g><line x1={px(hover!)} x2={px(hover!)} y1={T} y2={H - B} className="chart-cross" /><circle cx={px(hover!)} cy={py(active.value)} r="5" className="chart-dot" /></g>) : null}
        </svg>
        {active ? <div className="chart-tip" style={{ left: `${(px(hover!) / W) * 100}%` }}><strong>{formatNumber(active.value)}</strong><span>{active.period}</span></div> : null}
      </div>
      <p className="chart-labels"><span>Low {formatNumber(min)}</span><span>High {formatNumber(max)}</span></p>
    </div>
  );
}

function ScenarioCalculator() {
  const [inputs, setInputs] = useState<ScenarioInputs>({ businesses: 1000, initialPerBusiness: 50000, recurringPerBusiness: 12000, years: 3, sharedReductionPercent: 0 });
  const result = calculateScenario(inputs);
  const set = (key: keyof ScenarioInputs, value: string) => setInputs((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  return <section className="evidence-scenario" aria-labelledby="scenario-title"><div><p className="eyebrow">Transparent assumptions</p><h2 id="scenario-title">A compliance-cost sensitivity tool</h2><p className="evidence-muted">Change the assumptions to see the arithmetic update immediately. These inputs are illustrative and are not official estimates.</p><span className="scenario-warning">Illustrative scenario — not an estimate of the Act’s observed economic impact.</span></div><div className="scenario-grid"><div className="scenario-inputs">{([['businesses', 'Affected businesses'], ['initialPerBusiness', 'Initial cost per business (₹)'], ['recurringPerBusiness', 'Recurring annual cost (₹)'], ['years', 'Projection period (years)'], ['sharedReductionPercent', 'Shared-resource reduction (%)']] as const).map(([key, label]) => <label key={key}>{label}<input type="number" min="0" value={inputs[key]} onChange={(event) => set(key, event.target.value)} /></label>)}</div><div className="scenario-output"><p className="eyebrow">Computed result</p><div className="scenario-number">₹{formatNumber(result.cumulative, 0)}</div><p className="evidence-muted">Cumulative expenditure over {inputs.years} year{inputs.years === 1 ? "" : "s"}</p><dl><div><dt>Initial expenditure</dt><dd>₹{formatNumber(result.initial, 0)}</dd></div><div><dt>Annual recurring expenditure</dt><dd>₹{formatNumber(result.recurringAnnual, 0)}</dd></div><div><dt>Formula</dt><dd>Initial + annual recurring × years</dd></div></dl></div></div></section>;
}

/** The lab is not a finished feature, so say so before anything else. */
export function PreviewNote() {
  return (
    <aside className="a-preview" role="note" aria-label="Preview notice">
      <span className="a-chip a-chip--soon">Future feature · preview</span>
      <p><strong>This lab is a preview.</strong> It currently shows one general national price series and an illustrative cost calculator. It does not measure the effect of any policy. Analysis of policy outcomes will be added when verified outcome data is available.</p>
    </aside>
  );
}

export function EvidenceLab({ series }: { series: EconomicSeries }) {
  const [metric, setMetric] = useState<keyof typeof metricLabels>("index_al");
  const [range, setRange] = useState("60");
  const selected = useMemo(() => { const filtered = series.observations.filter((item) => item.metric === metric); return range === "all" ? filtered : filtered.slice(-Number(range)); }, [metric, range, series.observations]);
  const statistics = calculateStatistics(selected);
  const changes = periodChange(selected, metric.startsWith("inflation") ? 1 : 12);
  const latest = changes.at(-1);
  return <div className="evidence-lab"><section className="a-intro" style={{ margin: 0 }}><span className="a-eyebrow">Economic evidence lab</span><h1>What does the official data show?</h1><p>A descriptive view of India’s consumer prices. It shows how prices moved over time; it cannot show that a particular law caused the movement.</p></section><PreviewNote /><section className="evidence-panel" aria-labelledby="dataset-heading"><div className="evidence-panel-head"><div><p className="eyebrow">Verified dataset</p><h2 id="dataset-heading">{series.dataset.title}</h2><p className="evidence-muted">{series.dataset.institution} · {series.dataset.geography} · {series.dataset.frequency}</p></div><a href={series.dataset.sourceUrl} target="_blank" rel="noreferrer">Open source ↗</a></div><div className="evidence-controls"><label>Metric<select value={metric} onChange={(event) => setMetric(event.target.value as keyof typeof metricLabels)}>{Object.entries(metricLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Observations<select value={range} onChange={(event) => setRange(event.target.value)}><option value="36">Latest 36</option><option value="60">Latest 60</option><option value="120">Latest 120</option><option value="all">All available</option></select></label></div><div className="evidence-stat-row"><div><span>Observations</span><strong>{statistics.count}</strong></div><div><span>Minimum</span><strong>{formatNumber(statistics.min)}</strong></div><div><span>Maximum</span><strong>{formatNumber(statistics.max)}</strong></div><div><span>Latest period change</span><strong>{latest?.change === null || latest?.change === undefined ? "—" : `${formatNumber(latest.change)}%`}</strong></div></div><LineChart observations={selected} metric={metric} /><p className="chart-unit">Unit: {metricUnits[metric]}. The displayed line is the official series; hover points for period and value.</p></section><section className="evidence-findings"><div><p className="eyebrow">Calculated observations</p><h2>Read the series with its units attached.</h2></div><div className="finding-copy"><p>The selected series contains {statistics.count} verified observations from {selected[0]?.period ?? "—"} through {selected.at(-1)?.period ?? "—"}. Its arithmetic mean is {formatNumber(statistics.mean)} {metricUnits[metric]}.</p><p>First-to-last change: {statistics.percentageChange === null ? "not calculable because the starting value is zero or unavailable" : `${formatNumber(statistics.percentageChange)}%`}. These are descriptive statistics, not causal estimates.</p></div></section><details className="evidence-method"><summary>Methodology, coverage and limitations</summary><div><p>MoSPI’s published JSON API was retrieved and retained as a raw source response. All India rows were selected, numeric fields were validated, and periods were normalized to year-month labels. The CPI index uses 2019 as its base year. Year-on-year inflation is presented in percentage points as published by MoSPI.</p><p>Source: <a href={series.dataset.sourceUrl} target="_blank" rel="noreferrer">eSankhyiki CPI macro indicators</a>. Retrieved {new Date(series.retrievedAt).toLocaleString("en-IN")}.</p><p>Historical revisions, missing observations, and API publication changes remain limitations. No causal relationship with the DPDP Act is inferred.</p></div></details><section className="evidence-table-section"><div className="evidence-panel-head"><div><p className="eyebrow">Accessible data view</p><h2>Latest observations</h2></div><a href="/api/evidence" download="anvaya-economic-evidence.json">Download JSON ↗</a></div><div className="table-scroll"><table><thead><tr><th>Period</th><th>Geography</th><th>Metric</th><th>Value</th><th>Unit</th></tr></thead><tbody>{selected.slice(-12).reverse().map((item) => <tr key={`${item.period}-${item.metric}`}><td>{item.period}</td><td>{item.geography}</td><td>{metricLabels[item.metric as keyof typeof metricLabels] ?? item.metric}</td><td>{formatNumber(item.value)}</td><td>{item.unit}</td></tr>)}</tbody></table></div></section><ScenarioCalculator /></div>;
}
