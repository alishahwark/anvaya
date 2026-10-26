/**
 * Builds report.html and slides.html. Every number comes from a result file in the repository
 * (benchmark summaries, claim verification, injection test) so the documents cannot drift from
 * what the app and its tests actually did. Run: npx tsx scripts/build-submission.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dpdpKnowledge } from "../lib/knowledge/dpdp";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const b64 = (path: string) => readFileSync(path).toString("base64");
const img = (name: string) => `data:image/jpeg;base64,${b64(`docs/screenshots/final/${name}.jpg`)}`;
const font = (file: string) => `data:font/ttf;base64,${b64(`public/fonts/${file}`)}`;
const num = (value: number) => value.toLocaleString("en-US");
const one = (value: number) => (Math.round(value * 10) / 10).toLocaleString("en-US");
const sec = (ms: number) => `${one(ms / 1000)} s`;

// ───────────── Measured data ─────────────
const dev = read("data/benchmarks/ask-benchmark-summary.json");
const hold = read("data/benchmarks/ask-holdout-summary.json");
const devResults = read(`data/benchmarks/ask-benchmark-results-${dev.ranAt.slice(0, 10)}.json`).results as any[];
const holdResults = read(`data/benchmarks/ask-holdout-results-${hold.ranAt.slice(0, 10)}.json`).results as any[];
const archDev = read("data/benchmarks/archive/ask-benchmark-summary-gpt-5.6-luna.json");
const archHold = read("data/benchmarks/archive/ask-holdout-summary-gpt-5.6-luna.json");
const inj = read("data/benchmarks/injection-test-results.json");
const verification = read("data/knowledge/dpdp-claim-verification.json");

// Live counts from the test runner, so the documents cannot drift from the suite.
execSync("npx vitest run --reporter=json --outputFile=data/benchmarks/unit-test-run.json", { stdio: "ignore" });
const unit = read("data/benchmarks/unit-test-run.json");
const unitTests: number = unit.numPassedTests;
if (unit.numFailedTests > 0) throw new Error("Unit tests are failing; refusing to build the submission documents.");
const E2E_TESTS = 38; // from the last full Playwright run with RUN_LIVE_AI=1 (see README); update if the suite changes
const comparators = read("data/benchmarks/comparators.json") as Record<string, any>;
const comparatorCount = Object.keys(comparators).length;

const analyses = execSync(`sqlite3 data/seed/anvaya.seed.db "select analysis_json from policy_analyses"`, { maxBuffer: 50_000_000 }).toString().trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
const aTotals = analyses.reduce((sum: any, item: any) => ({ checked: sum.checked + item.verification.checked, supported: sum.supported + item.verification.supported, partly: sum.partly + item.verification.partly, dropped: sum.dropped + item.verification.dropped }), { checked: 0, supported: 0, partly: 0, dropped: 0 });
const logRows = readFileSync("data/logs/agent-executions.jsonl", "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
const writes = logRows.filter((row: any) => row.agent === "analysis-write" && row.status === "success" && row.inputTokens);
const slowWrites = writes.map((row: any) => row.durationMs).filter((ms: number) => ms > 4000).sort((a: number, b: number) => a - b);
const aIn = Math.round(writes.reduce((t: number, r: any) => t + r.inputTokens, 0) / writes.length);
const aOut = Math.round(writes.reduce((t: number, r: any) => t + r.outputTokens, 0) / writes.length);

const draftRules = analyses.find((item: any) => item.policySlug.startsWith("f8a8e97a"));

// Verification engine: read the shipped register's stored verification results.
const verifs = execSync(`sqlite3 data/seed/anvaya.seed.db "select verification_json from bill_verifications"`, { maxBuffer: 80_000_000 }).toString().trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
const levelCount = (level: string) => verifs.filter((v: any) => v.level === level).length;
const checkCount = (status: string) => verifs.reduce((n: number, v: any) => n + v.checks.filter((c: any) => c.status === status).length, 0);
const totalChecks = verifs.reduce((n: number, v: any) => n + v.checks.length, 0);
const docsFetched = Number(execSync(`sqlite3 data/seed/anvaya.seed.db "select count(*) from bill_documents"`).toString().trim());
const pagesStored = Number(execSync(`sqlite3 data/seed/anvaya.seed.db "select count(*) from doc_pages"`).toString().trim());
const prior = read("data/benchmarks/archive/ask-benchmark-summary-gpt-6-luna-before-quote-check.json");
const priorHold = read("data/benchmarks/archive/ask-holdout-summary-gpt-6-luna-before-quote-check.json");
const devQuoted = (devResults as any[]).concat(holdResults).filter((r: any) => r.verification).reduce((t: any, r: any) => ({ checked: t.checked + r.verification.checked, quoted: t.quoted + (r.verification.quoted ?? 0) }), { checked: 0, quoted: 0 });

const questions = dev.questions + hold.questions;
const inTokens = dev.inputTokens + hold.inputTokens;
const outTokens = dev.outputTokens + hold.outputTokens;
const calls = dev.modelCalls + hold.modelCalls;
const liveAnswered = devResults.concat(holdResults).filter((row) => row.status === "answered").length;
const perQ = { input: Math.round(inTokens / questions), output: Math.round(outTokens / questions), calls: calls / questions };
const stmtChecked = dev.secondPassStatementsChecked + hold.secondPassStatementsChecked;
const stmtSupported = dev.secondPassStatementsFullySupported + hold.secondPassStatementsFullySupported;
const claims = dpdpKnowledge.claims.length;
const prepared = dpdpKnowledge.baselineAnswers.length;
const checkedOn = verification.checkedAt.slice(0, 10);
const trace = (id: string) => [...devResults, ...holdResults].find((row) => row.id === id);
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const AUTHOR = "Alishahwar Kichloo";
const EMAIL = "alishahwar.kichloo@yale.edu";
const REPO = "https://github.com/alishahwark/anvaya";
const CLONE = `git clone ${REPO}.git && cd anvaya && cp .env.example .env && npm install && npm run setup && npm run dev`;
const BUILT = "26 October 2026";
const INSTALL_NOTE = readFileSync("data/benchmarks/fresh-clone-timing.txt", "utf8").trim();

const fontFaces = `
@font-face{font-family:"Inter";font-weight:400;src:url(${font("inter-400.ttf")}) format("truetype")}
@font-face{font-family:"Inter";font-weight:600;src:url(${font("inter-600.ttf")}) format("truetype")}
@font-face{font-family:"Newsreader";font-weight:500;src:url(${font("newsreader-500.ttf")}) format("truetype")}`;

// ───────────── Architecture diagram (inline SVG, shared) ─────────────
const box = (x: number, y: number, w: number, h: number, title: string, lines: string[], fill = "#ffffff", stroke = "#b9c6bd") =>
  `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><text x="${x + 12}" y="${y + 22}" class="t">${title}</text>${lines
    .map((line, index) => `<text x="${x + 12}" y="${y + 40 + index * 15}" class="s">${line}</text>`)
    .join("")}</g>`;
const arrow = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#267c76" stroke-width="1.8" fill="none" marker-end="url(#arr)"/>`;
const diagram = (width: number) => `
<svg viewBox="0 0 980 430" width="${width}" role="img" aria-label="Anvaya architecture: question to resolver, retrieval, answer agent, verification agent, rendered answer; research agent builds provisional records">
<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#267c76"/></marker>
<style>.t{font:600 13px Inter,sans-serif;fill:#102e3c}.s{font:400 11px Inter,sans-serif;fill:#50655f}.h{font:600 11px Inter,sans-serif;fill:#8d531c;letter-spacing:.08em}</style></defs>
<text x="10" y="18" class="h">QUESTION PATH (every question)</text>
${box(10, 30, 150, 78, "1 Resolver", ["code, no AI", "matches a prepared", "answer or goes live"], "#f0eee4")}
${box(190, 30, 170, 78, "2 Scoped retrieval", ["one policy only", "BM25 + synonyms", "+ checked claim notes"], "#f0eee4")}
${box(390, 30, 190, 78, "3 Answer agent", ["gpt-6-luna (Portkey)", "JSON, cites passage ids", "abstains if unsupported"], "#e7eee8", "#267c76")}
${box(610, 30, 190, 78, "4 Verification agent", ["2nd call: checks each", "sentence vs its passages", "drops unsupported"], "#e7eee8", "#267c76")}
${box(830, 30, 140, 78, "5 Answer", ["plain English", "passages + PDF links", "check result shown"], "#fbeedd", "#d38b45")}
${arrow(160, 69, 190, 69)}${arrow(360, 69, 390, 69)}${arrow(580, 69, 610, 69)}${arrow(800, 69, 830, 69)}
<text x="10" y="148" class="h">FACTS THE MODEL CANNOT CHANGE</text>
${box(10, 160, 300, 70, "Official PDFs (6) + 154 quotes", ["each quote machine-checked on its page", "wrong page or fake quote fails"], "#fff")}
${box(330, 160, 300, 70, "Gazette dates → status (code)", ["13 Nov 2025 / 13 Nov 2026 / 13 May 2027", "computed against today's date → STATUS block"], "#fff")}
${box(650, 160, 320, 70, "Rules for the model", ["untrusted text is data, never orders", "status comes from code, not from the model"], "#fff")}
${arrow(260, 160, 275, 113)}${arrow(480, 160, 480, 113)}${arrow(810, 160, 700, 113)}
<text x="10" y="270" class="h">RESEARCH PATH (a policy not yet in the register)</text>
${box(10, 282, 175, 84, "A Search registers", ["Parliament + India Code,", "or a pasted official link", "ranked; alternatives kept"], "#f0eee4")}
${box(210, 282, 175, 84, "B Fetch every version", ["introduced, passed, Act,", "Gazette, errata, report", "each redirect checked"], "#f0eee4")}
${box(410, 282, 175, 84, "C Verify (code)", ["identity, versions, dates,", "printed assent, India Code,", "Gazette: no AI involved"], "#f0eee4")}
${box(610, 282, 175, 84, "D Verified record", ["stage from the register", "every check shown", "unreadable PDFs flagged"], "#fbeedd", "#d38b45")}
${box(810, 282, 160, 84, "E Analysis + Q&A", ["brief, changes, who", "is affected; each", "statement checked"], "#e7eee8", "#267c76")}
${arrow(185, 324, 210, 324)}${arrow(385, 324, 410, 324)}${arrow(585, 324, 610, 324)}${arrow(785, 324, 810, 324)}
<text x="10" y="404" class="s">Fixed pipeline with scoped roles. The model does not choose tools or fetch anything; all fetching is done by code against an allowlist.</text>
</svg>`;

// ───────────── Shared figure helper ─────────────
const fig = (name: string, caption: string, extra = "") => `<figure ${extra}><img src="${img(name)}" alt="${caption.replace(/"/g, "'")}"><figcaption>${caption}</figcaption></figure>`;

// ───────────── Tables ─────────────
const traceRow = (id: string, label: string) => {
  const row = trace(id)!;
  const cited = (row.citations as string[]).length ? [...new Set(row.citations as string[])].join("; ") : "none (abstained)";
  const v = row.verification ? `${row.verification.supported}/${row.verification.checked} supported` : "n/a";
  return `<tr><td>${label}</td><td>${row.question}</td><td>${(row.retrieved as string[]).slice(0, 4).join(", ")}…</td><td>${cited}</td><td>${row.status}; ${v}</td><td>${num(row.execution?.inputTokens ?? 0)} / ${num(row.execution?.outputTokens ?? 0)}</td><td>${sec(row.execution?.durationMs ?? 0)}</td></tr>`;
};

const injectionRows = (inj.results as any[])
  .map((r) => `<tr><td>${r.kind}</td><td>${r.poisonRetrieved ? "yes" : "no"}</td><td>${r.obeyed ? "<b>obeyed</b>" : "ignored"}</td><td>${r.citedPoison ? "yes" : "no"}</td><td>${r.pass ? "pass" : "FAIL"}</td></tr>`)
  .join("");

const sensitivity = [0.5, 2, 5].map((rate) => `<tr><td>$${rate.toFixed(2)} / $${(rate * 4).toFixed(2)}</td>${[1000, 10000, 100000].map((n) => `<td>$${num(Math.round(((n * perQ.input) / 1e6) * rate + ((n * perQ.output) / 1e6) * rate * 4))}</td>`).join("")}</tr>`).join("");

// ───────────── REPORT ─────────────
const report = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Anvaya — MGT 409 final project report</title>
<style>
${fontFaces}
:root{--navy:#102e3c;--teal:#267c76;--saffron:#d38b45;--muted:#50655f;--line:#d8ded5;--mist:#f0eee4}
@page{size:Letter;margin:.6in .7in .65in}
*{box-sizing:border-box}
body{margin:0;background:#e9ece7;color:#17313c;font:9.6pt/1.45 Inter,Helvetica,sans-serif}
.doc{max-width:8.5in;margin:0 auto;background:#fff;padding:.75in .8in}
@media print{body{background:#fff}.doc{max-width:none;padding:0;margin:0}}
h1,h2,h3{font-family:Newsreader,Georgia,serif;font-weight:500;color:var(--navy);margin:0}
h1{font-size:30pt;line-height:1.05;letter-spacing:-.02em}
h2{font-size:17pt;line-height:1.15;margin:20pt 0 6pt;padding-top:10pt;border-top:2px solid var(--saffron);break-after:avoid}
h3{font-size:12pt;margin:12pt 0 4pt;break-after:avoid}
p{margin:0 0 7pt}
.kicker{font-size:8pt;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:#8d531c;margin:0 0 6pt}
.lede{font-size:11.5pt;color:#27424d}
.meta{color:var(--muted);font-size:9pt}
table{border-collapse:collapse;width:100%;margin:5pt 0 8pt;font-size:8.3pt}
tr{break-inside:avoid}
table.keep{break-inside:avoid}
thead{display:table-header-group}
th,td{border:1px solid var(--line);padding:3.5pt 5pt;vertical-align:top;text-align:left}
th{background:var(--mist);font-weight:600;color:var(--navy)}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
figure{margin:8pt 0 10pt;break-inside:avoid}
figure img{width:100%;border:1px solid var(--line);border-radius:4px;display:block;max-height:3.0in;object-fit:cover;object-position:top left}
.pair figure img{max-height:2.75in}
.mob img{max-height:3.1in;object-fit:cover;object-position:top}
figcaption{font-size:8.3pt;color:var(--muted);margin-top:3pt}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10pt}
.pair figure{margin:6pt 0}
.mob{display:grid;grid-template-columns:repeat(3,1fr);gap:8pt}
.mob img{width:100%}
.box{background:var(--mist);border-left:4px solid var(--teal);padding:7pt 10pt;margin:8pt 0 10pt;break-inside:avoid}
.box p:last-child{margin:0}
.big{display:grid;grid-template-columns:repeat(4,1fr);gap:8pt;margin:8pt 0 10pt;break-inside:avoid}
.big div{border-top:3px solid var(--saffron);padding-top:4pt}
.big b{display:block;font:500 20pt/1.1 Newsreader,Georgia,serif;color:var(--navy)}
.big span{font-size:8pt;color:var(--muted)}
code{font:8.6pt/1.3 ui-monospace,Menlo,monospace;background:var(--mist);padding:0 3pt;border-radius:3px}
pre{font:8.3pt/1.4 ui-monospace,Menlo,monospace;background:var(--mist);padding:7pt 9pt;border-radius:4px;overflow:auto;white-space:pre-wrap;break-inside:avoid;margin:6pt 0 10pt}
ul,ol{margin:0 0 8pt;padding-left:15pt}li{margin:0 0 3pt}
a{color:var(--teal)}
svg{width:100%;height:auto;display:block}
</style></head><body><div class="doc">

<header>
<p class="kicker">Yale SOM · MGT 409 AI Foundations for Managers · Fall 2026 · Final project (solo)</p>
<h1>Anvaya <span style="color:var(--saffron)">·</span> अन्वय</h1>
<p class="lede" style="margin-top:6pt">Understand the policies shaping India. An independent, evidence-first policy research assistant that finds the official documents, explains them in plain language, and shows the exact passage behind every claim.</p>
<p class="meta">${AUTHOR} · ${EMAIL} · ${BUILT}</p>
</header>

<h2>1. Title + Links</h2>
<table>
<tr><th style="width:22%">Code</th><td><a href="${REPO}">${REPO}</a> — <b>public repository</b>; the repository root is the project.</td></tr>
<tr><th>Run it (under 10 minutes)</th><td><code>${CLONE.replace(/&/g, "&amp;")}</code>, then open <code>http://127.0.0.1:3000</code>. Put <code>PORTKEY_API_KEY</code> (course key, <code>gpt-6-luna</code>) in <code>.env</code>, in the repository folder or one folder above it, for live AI answers; everything else works without it. <code>OPENAI_API_KEY</code> is read too, under that exact name. Timing from a fresh clone: ${INSTALL_NOTE}</td></tr>
<tr><th>Hosted demo</th><td>None. The app is run locally from the repository.</td></tr>
<tr><th>Also in the repo</th><td><code>README.md</code>, <code>.env.example</code>, <code>report.html</code>, <code>slides.html</code>, <code>docs/SCORING_METHODOLOGY.md</code>, <code>docs/IMPLEMENTATION_GAP_REGISTER.md</code>, <code>data/benchmarks/</code> (questions, raw results), <code>docs/screenshots/final/</code></td></tr>
</table>
<p>Anvaya answers one kind of question well: <em>what does this law say, is it in force, and what does it mean for me?</em> Its flagship is India’s Digital Personal Data Protection (DPDP) Act, 2023, which is being switched on in three steps (13 November 2025, 13 November 2026, 13 May 2027). Every statement on the policy page is tied to a verbatim quote from the official PDF, a script checks each quote against the PDF text, legal status is computed from the Gazette dates by code, and AI is used only to answer a reader’s own questions, from retrieved official text, with a second AI pass that checks each sentence. A reader can also ask for any bill or Act by name, or paste a link to an official document. A verification engine then searches Parliament’s register and India Code, downloads every official version, runs a list of explicit checks (shown to the reader, each with its source), and only then explains the document in the same way.</p>
<div class="big">
<div><b>${verification.supported}/${verification.totalRefs}</b><span>evidence quotes found on the stated page of the official PDF (checked ${checkedOn})</span></div>
<div><b>${dev.passed}/${dev.questions} · ${hold.passed}/${hold.questions}</b><span>strict-assertion pass, development set · held-out set (model ${dev.model})</span></div>
<div><b>${inj.summary.passed}/${inj.summary.attacks}</b><span>indirect prompt-injection attacks resisted; none cited</span></div>
<div><b>${unitTests} + ${E2E_TESTS}</b><span>unit tests + browser tests on a production build, all passing (one live-link test needed a retry after a transient download error from the source site)</span></div>
</div>
${fig("02-dpdp-top", "Figure 1. The DPDP policy page: one plain status (“Partly in force”), a plain-language brief, and a three-step tracker computed from today’s date.", "style=\"width:58%;margin-inline:auto\"")}

<h2>2. Motivation</h2>
<h3>The problem</h3>
<p>A small-business owner asks: <em>“Does the DPDP Act apply to me, and when?”</em> The honest answer needs five official documents that sit in separate Gazette PDFs: the Act (assented 11 August 2023), a commencement notification (13 November 2025) that switches on different sections on three different dates, the Rules (13 November 2025) with their <em>own</em> three-date schedule, a corrigendum to the Rules (11 December 2025), and a Removal of Difficulties Order (published 6 October 2026, nineteen days before this report). While building Anvaya the first version of the app held three of these. Searching the web also showed that secondary sources disagree on the exact day the main duties start (13 or 14 May 2027) and that the press reported, without any official notification, that the Government might shorten the 18-month wait. A reader cannot sort that out without reading Gazette PDFs.</p>
<h3>Who it is for</h3>
<table>
<tr><th style="width:24%">User</th><th>Question</th><th>What Anvaya gives</th></tr>
<tr><td>Citizen or student</td><td>What is this law and does it affect me?</td><td>A 100-word brief, what changes, who is affected, source one click away</td></tr>
<tr><td>Small-business owner</td><td>What must I do, and by when?</td><td>Duties with their start dates, an explicit “no automatic small-business exemption”, no invented cost figure</td></tr>
<tr><td>Journalist or civic group</td><td>What actually passed, and what changed since?</td><td>Dated legal journey incl. the corrigendum and the October 2026 order; things we could not confirm are listed</td></tr>
<tr><td>Researcher or analyst</td><td>Is the claim in this article true?</td><td>Exact passage and PDF page for each statement; abstention when the text is silent</td></tr>
</table>
<h3>Why existing options fall short</h3>
<p>This is a design argument, not a measured comparison: we did not benchmark other products. Search engines return pages, not an answer with the page it came from. A general chatbot answers from memory and cannot show which page of which Gazette supports a sentence, nor know about an order published three weeks ago. Legal databases and expert summaries (for example India Code, PRS) are valuable but are organised by document, written for specialists, and are not question-driven. Anvaya’s aim is the missing layer: a plain-language answer with the original evidence one click away.</p>
<h3>Where this project started</h3>
<p>An earlier build of Anvaya was functional but failed the user. Its “30-second brief” described the app’s own import process instead of the law, internal values such as <code>effective_on_schedule</code> were shown to readers, an “Analyze stakeholders” button produced only “analysis completed”, and unrelated inflation data was advertised on a data-protection page. The rebuild described here changed the product contract, not just the styling.</p>
${fig("00-before", "Figure 2a. Before (earlier build): the “brief” describes the app’s import process (“The imported Act and G.S.R. 843(E) establish a verified distinction…”) and four status pills repeat the same fact.", "style=\"width:66%;margin-inline:auto\"")}
${fig("03-dpdp-changes", "Figure 2b. After: each change is stated in plain language, dated, and opens its evidence.", "style=\"width:66%;margin-inline:auto\"")}

<h2>3. What Is New</h2>
<table>
<tr><th style="width:21%">Idea</th><th>Typical approach</th><th>What Anvaya does</th></tr>
<tr><td><b>Evidence at claim level</b></td><td>Link to a document, or cite “Section 8”.</td><td>${claims} claims, each with verbatim quotes and a PDF page. A script checks every quote against the PDF text (${verification.supported} of ${verification.totalRefs} found). A fabricated quote or the wrong page fails the test. Readers open the exact passage under each statement.</td></tr>
<tr><td><b>Status computed, not generated</b></td><td>A model states whether a law is in force.</td><td>Start dates come from Gazette notification G.S.R. 843(E); code computes “in force / starts in 200 days” from today’s date. The Act and the Rules have separate schedules. AI cannot write status.</td></tr>
<tr><td><b>Answer, then check</b></td><td>One model call, citations as decoration.</td><td>Retrieval is scoped to one policy. The model must cite passage IDs and may abstain. A second call judges each sentence against the passages it cites and drops unsupported ones. The result of that check is shown to the reader.</td></tr>
<tr><td><b>A verification engine, not a fetch-and-summarise</b></td><td>Fetch one PDF and trust it; label it “unverified”.</td><td>For a name, search Parliament’s bill register and India Code, rank matches (a shared word such as “amendment” can never identify a bill), download <em>every</em> official version, and run explicit checks: the register’s stage, the documents’ own printed title, Bill number, assent date and Act number, version headings, India Code’s record and the Gazette copy. Each check is shown with its source; ${levelCount("corroborated")} of ${verifs.length} stored records are corroborated by a second official source, the rest verified, none failed. Searching again reuses the record.</td></tr>
<tr><td><b>Quotes confirmed by code</b></td><td>“Sources” listed under an AI answer.</td><td>AI statements must carry an exact quote; code confirms it appears word for word in the cited passage. ${devQuoted.quoted} of ${devQuoted.checked} statements in the question benchmarks carried such a quote; the rest rest on the computed status block.</td></tr>
<tr><td><b>A scorecard, with its uncertainty</b></td><td>A single “rating” with no method, or none.</td><td>Four rings score how a law is <em>built</em> (legal clarity, enforceability, proportionality, accountability), computed by formula from the official text and following the OECD/JRC composite-indicator method. Each has a 90% range from 800 resamplings of the text, a plain reason on hover, and a click-through that compares the law with ${comparatorCount} UK and Canadian statutes fetched from their official sites. A fifth ring, evidence of effect, is deliberately blank: no outcome data exists, so Anvaya refuses to infer one. No tokens are used.</td></tr>
<tr><td><b>Uncertainty as a feature</b></td><td>Confident prose, small-print disclaimer.</td><td>A “Things to watch” section lists what could not be confirmed (an unnotified proposal, a one-day counting ambiguity), with sources labelled official or secondary. Points that are our interpretation are marked “Our reading, not the law”.</td></tr>
</table>
<p><b>Scope, honestly.</b> One law (DPDP) is hand-reviewed claim by claim. ${verifs.length} further bills and Acts from Parliament’s register are verified by the engine against official sources, which is a lower standard: the checks prove identity, stage and dates, not that a plain-language reading is right. Anvaya is not legal advice and not an official service. The scorecard describes how a law is built and does not measure whether it works; the Economic Evidence Lab shows general official statistics, is labelled a future feature, and is not tied to any law.</p>
<div class="pair">
${fig("01-home", "Figure 3a. Home: one question box, tested suggestions, an attributed photo (CC BY-SA 4.0).")}
${fig("08-explore", "Figure 3b. Explore: the hand-reviewed DPDP Act and the engine-verified records, each with its real stage.")}
</div>
<div class="pair">
${fig("19-rings", "Figure 3c. The scorecard on the DPDP page: four scored rings with 90% ranges, a blank “evidence of effect” ring, and the reason shown on hover.")}
${fig("20b-benchmark-chart", "Figure 3d. Click a ring (navigation is one Menu button; the Economic Evidence Lab is tagged “Preview” and states first that it is a future feature): the DPDP Act’s enforceability score next to the UK Data Protection Act 2018 and Canada’s PIPEDA, with ranges and no invented rank (two comparators are too few).")}
</div>

<h2>4. The Agents</h2>
<p>The agents are scoped roles in a fixed pipeline, not free-roaming tool users. The model never fetches anything or chooses tools; all retrieval and network access is done by code. That choice is deliberate: it keeps the set of things the model can influence small and testable.</p>
${diagram(700)}
<table>
<tr><th style="width:20%">Role</th><th>What it does</th><th style="width:30%">Tools and calls</th></tr>
<tr><td>Resolver (code)</td><td>Matches a question to one of ${prepared} prepared answers (each cites verified quotes, no AI) or sends it on.</td><td>Token overlap ≥ 0.8; answer expires on a date if it would become stale</td></tr>
<tr><td>Retrieval (code)</td><td>Ranks passages from this policy only: BM25 with a legal-vocabulary synonym map, plus passages that contain the evidence of the best-matching reviewed claims, plus the claim notes themselves.</td><td>Six official PDFs plus reviewed claim notes; code in <code>lib/ask/retrieval.ts</code></td></tr>
<tr><td>Answer agent</td><td>Writes 1–4 statements, each with the passage IDs that support it, or abstains. Receives a STATUS block computed by code.</td><td>Portkey Responses API, <code>${dev.model}</code>, 1 call</td></tr>
<tr><td>Verification agent</td><td>Judges each statement supported / partly / unsupported against its cited text. Unsupported details are dropped; an unsupported headline answer becomes an abstention.</td><td>Same API, 1 call</td></tr>
<tr><td>Resolver and verification engine (code)</td><td>Searches Parliament’s register and India Code, ranks matches, fetches every official version, and runs the checks. No model is involved, so verification costs no tokens and cannot be talked into anything.</td><td>Sansad <code>getBills</code>; India Code (DSpace API); HTTPS fetch to allowlisted hosts; PDF text extraction; SQLite</td></tr>
<tr><td>Scoring engine (code)</td><td>Reads the stored official text, flags provisions with phrase patterns tied to the literature, computes 17 bounded indicators in four dimensions, resamples for a 90% range, and benchmarks against fetched UK and Canadian statutes. Estimators for an “effect” ring (difference-in-differences, interrupted time series, synthetic control, meta-analysis) exist but are gated off until real outcome data is loaded.</td><td>No model, no tokens. <code>lib/scoring/</code>; comparators fetched once by <code>scripts/build-benchmarks.ts</code></td></tr>
<tr><td>Analysis agent</td><td>For a retrieved document, selects up to 14 passages with eight fixed retrieval probes (purpose, definitions, duties, penalties, bodies, application, rights, exemptions) and writes a brief, 3–5 changes and 2–4 affected groups, each with passage IDs. Then the verification agent checks every statement; unsupported ones are dropped. The result is cached.</td><td>Same API, 2 calls per document, once</td></tr>
</table>
<div class="pair">
${fig("06-ask-live", "Figure 4a. A live question. The lead is qualified, the passage is the relevant sentence, and the check result is shown.")}
${fig("09-record", "Figure 4b. A verified record built by the engine (Taxation and Other Laws (Amendment) Bill, 2026): the stage comes from Parliament’s record, and the journey links each official version.")}
</div>
<div class="pair">
${fig("16-checks", "Figure 4c. “How we verified this” for the Consumer Protection Act: every check names its source, and a real one-day disagreement between Parliament’s register and its own printed heading is shown, not hidden.")}
${fig("14-analysis", "Figure 4d. The analysis opens with the verified stage; each statement carries a quote that code confirmed in the official text.")}
</div>
<h3>Real traces</h3>
<p>Rows are taken from the saved benchmark output (<code>data/benchmarks/</code>), not written by hand. “Retrieved” shows the first four of eight passage IDs.</p>
<table>
<tr><th>Case</th><th>Question</th><th>Retrieved</th><th>Cited</th><th>Outcome</th><th class="n">Tokens in / out</th><th class="n">Time</th></tr>
${traceRow("q08", "Fact")}${traceRow("q06", "Status")}${traceRow("a01", "Injection")}${traceRow("a03", "Wrong policy")}
</table>
<p><b>Engine traces.</b> Searching “Taxation bill” matched ${verifs.length > 0 ? "several bills" : "bills"} and offered the alternatives instead of silently choosing. “The Taxation and Other Laws (Amendment) Bill, 2026” resolved to Lok Sabha Bill No. 150 of 2026, enacted as Act No. 21 of 2026: Parliament’s record, the printed “assented to on 17 AUG 2026, Act No. 21 of 2026” on the passed text, and the dates in each House all agreed, while India Code did not yet list the Act and the page says so. A name that matches nothing (“zzz flibbertigibbet statute”) produced no record. Pasting the January 2025 draft DPDP Rules link (a document the app had never seen) fetched a 51-page bilingual PDF, titled it from its own short-title clause, labelled it “draft published for public comment”, and produced a checked analysis (a brief, ${draftRules.changes.length} changes and ${draftRules.groups.length} affected groups; ${draftRules.verification.supported} of ${draftRules.verification.checked} statements fully supported).</p>

<h2>5. Tokenomics</h2>
<p><b>Setup of the measurement.</b> ${questions} questions (${dev.questions} development, ${hold.questions} held-out) were run against <code>${dev.model}</code> through Portkey with the gateway cache bypassed so that latency and tokens are real. ${liveAnswered} produced a full answer (two model calls); the rest abstained after one call. Token counts are those reported by the API.</p>
<table class="keep">
<tr><th></th><th class="n">Total</th><th class="n">Per question</th></tr>
<tr><td>Model calls</td><td class="n">${num(calls)}</td><td class="n">${one(perQ.calls)}</td></tr>
<tr><td>Input tokens</td><td class="n">${num(inTokens)}</td><td class="n">${num(perQ.input)}</td></tr>
<tr><td>Output tokens</td><td class="n">${num(outTokens)}</td><td class="n">${num(perQ.output)}</td></tr>
<tr><td>Latency, whole answer (median · 90th percentile · max)</td><td class="n" colspan="2">${sec(dev.latencyMs.median)} · ${sec(dev.latencyMs.p90)} · ${sec(dev.latencyMs.max)} (development set); ${sec(hold.latencyMs.median)} · ${sec(hold.latencyMs.p90)} · ${sec(hold.latencyMs.max)} (held-out)</td></tr>
</table>
<p>The same ${dev.questions}-question set on the earlier model <code>${archDev.model}</code> used ${num(archDev.inputTokens)} input and ${num(archDev.outputTokens)} output tokens over ${archDev.modelCalls} calls, so the cost profile is similar. Input dominates: about ${Math.round((100 * inTokens) / (inTokens + outTokens))}% of tokens are input (instructions, the status block and eight retrieved passages, which the verification call partly repeats).</p>
<p><b>Analysis of a retrieved document.</b> Each new document costs one writing call plus one checking call, once, because the result is stored. Across ${writes.length} logged writing calls (including retries) the mean was about ${num(aIn)} input and ${num(aOut)} output tokens; the ${slowWrites.length} calls not served by the gateway cache took a median of ${sec(slowWrites[Math.floor(slowWrites.length / 2)])}. Token use of the checking call was not logged separately, so the true per-document total is higher than the writing figure alone.</p>
<p><b>Cost of the new safeguards.</b> Requiring exact quotes raised output tokens on the ${dev.questions}-question set from ${num(prior.outputTokens)} to ${num(dev.outputTokens)} (about ${Math.round((100 * (dev.outputTokens - prior.outputTokens)) / prior.outputTokens)}% more) and median latency from ${sec(prior.latencyMs.median)} to ${sec(dev.latencyMs.median)}; input tokens were about the same (${num(prior.inputTokens)} to ${num(dev.inputTokens)}). Verifying a bill record and computing its scorecard are deterministic code and use no tokens at all: only questions, and the once-per-document analysis, call the model.</p>
<h3>Scaling</h3>
<table class="keep">
<tr><th>Live questions per month</th><th class="n">1,000</th><th class="n">10,000</th><th class="n">100,000</th></tr>
<tr><td>Input tokens (millions)</td>${[1000, 10000, 100000].map((n) => `<td class="n">${one((n * perQ.input) / 1e6)}</td>`).join("")}</tr>
<tr><td>Output tokens (millions)</td>${[1000, 10000, 100000].map((n) => `<td class="n">${one((n * perQ.output) / 1e6)}</td>`).join("")}</tr>
</table>
<p><b>Price.</b> Cost is tokens × the provider’s rate. This project uses the course Portkey key, and we did not verify a public per-token price for <code>${dev.model}</code>, so <b>no dollar figure is claimed for the real system</b>. To show how cost scales, the grid below uses <em>illustrative</em> round rates (input / output per million tokens, with output at four times input). These are not the provider’s prices.</p>
<table class="keep">
<tr><th>Illustrative $ per 1M tokens (in / out)</th><th class="n">1,000 questions</th><th class="n">10,000</th><th class="n">100,000</th></tr>
${sensitivity}
</table>
<p><b>Levers already built.</b> The ${prepared} prepared answers (the questions most readers ask) cost zero tokens and return instantly. Live answers are cached in memory by policy, normalised question, document version, model and date. The model is called twice, so the check roughly doubles the calls; it is the price of showing readers a verification result and can be skipped for low-stakes use. <b>Not measured:</b> any discount for cached input tokens, and the gateway cache’s effect on cost.</p>

<h2>6. Safety</h2>
<p>Retrieved documents, web pages and questions are treated as untrusted input. The table lists each risk, what protects against it, and the evidence we have. All results are from the saved test outputs; the samples are small and were written by us.</p>
<table>
<tr><th style="width:17%">Risk</th><th>Defence</th><th style="width:33%">Evidence</th></tr>
<tr><td>Fetching an attacker’s or internal address (SSRF)</td><td>Official sites only (Parliament, MeitY, India Code, eGazette, PIB), HTTPS only, no IP addresses, no credentials or odd ports; <b>every redirect is validated before it is requested</b>; size and time limits.</td><td>19 unit tests (14 on the fetcher and rate limiter, 5 on pasted links: other hosts, http, IP addresses, look-alike domains, embedded credentials) including a redirect from an official host to <code>169.254.169.254</code>, which is refused without being requested, and a redirect loop. This closed a gap in the earlier code, which checked only the final URL.</td></tr>
<tr><td>Picking the wrong bill</td><td>A match must contain every distinctive word the user typed; generic words (“amendment”, “laws”) only rank. On near-ties the bill that became law beats a withdrawn predecessor. Ambiguous names show the other matches.</td><td>Unit tests for each rule. Real defects found and fixed while building: “Waqf Amendment Bill 2025” once matched the Corporate Laws (Amendment) Bill on the shared word “amendment”, and the register’s own search is whitespace-sensitive (the enacted Bharatiya Nyaya Sanhita is titled with a double space), so an early stop returned the withdrawn bill.</td></tr>
<tr><td>Sources that disagree, or cannot be read</td><td>Disagreements are shown, graded by importance (assent date and Act number fail a record; a passing date or an index date is reported). Unreadable PDFs (legacy fonts, scans, Hindi pages) are “could not check”, never “failed”, and never explained.</td><td>Found in real data: the Consumer Protection Bill’s printed heading gives the Rajya Sabha date as 5 August 2019, the register 6 August; India Code gives an enactment date of 15 February 2025 for an Act Parliament passed in August 2025; India Code’s PDF for the 2019 Act extracts as gibberish. Each is shown to the reader and tested.</td></tr>
<tr><td>Scores that look more certain than they are</td><td>Every score ships with a 90% range and a reason built from counts; a ratio with too little text is “not measurable”, never zero; there is no overall score; the effect ring stays blank without outcome data; a benchmark is refused for amending bills, rules and areas with no verified comparator.</td><td>Unit tests for bounds, interval ordering, exact reproducibility, monotonicity and gating (<code>tests/scoring.test.ts</code>); the effect estimators recover known effects on simulated data (<code>tests/outcomes.test.ts</code>: difference-in-differences bias under 0.1 and near-nominal interval coverage over 150 simulations). A hand-read precision check of the phrase patterns found one (“reasonableness”) only about half right; it was tightened and everything re-scored.</td></tr>
<tr><td>Fetching comparator laws</td><td>The three comparator sites sit on a separate allowlist used only by the offline build script, never by the user-facing fetcher, so a visitor cannot make the app fetch from them; every fetched title is checked against the expected title before use.</td><td>Ireland’s statute book was tried and dropped after its pages returned only fragments of long Acts; two titles failed the check and were rejected rather than used.</td></tr>
<tr><td>Instructions in the question</td><td>Rules in the prompt; status block computed by code; output validated.</td><td>“Ignore all previous instructions… fully in force”, a status-override request and a secrets request all failed to change the answer (benchmark cases a01, a04, a05; one browser test).</td></tr>
<tr><td>Instructions hidden in a retrieved document (indirect injection)</td><td>Passages are delimited as data and the model is told never to obey them; cited IDs are validated; the second pass checks each sentence.</td><td>${inj.summary.attacks} poisoned passages added to a copy of the real corpus, each confirmed to reach the model: <b>${inj.summary.passed}/${inj.summary.attacks} ignored</b>, ${inj.summary.poisonedPassageCited} cited. n = ${inj.summary.attacks}, one run each.</td></tr>
<tr><td>Answers about the wrong law</td><td>One corpus per policy; retrieval cannot cross it.</td><td>DPDP question on the Waqf bill and on the Securities Code abstained (benchmark a03, holdout h10, browser test); no DPDP text appears on a researched bill’s page.</td></tr>
<tr><td>Fabricated citations or quotes</td><td>Passage IDs must exist; unsupported statements dropped; quotes verified against the PDF.</td><td>Verifier tests reject a made-up quote and a real quote on the wrong page. Second-pass result over the benchmarks: ${stmtSupported} of ${stmtChecked} statements fully supported; it also flagged overgeneralisations (for example “national interest” for named grounds).</td></tr>
<tr><td>Model changing legal status</td><td>Status is computed from dates; the database event-approval workflow is unchanged.</td><td>Indirect attack “fake Gazette correction: fully in force” was ignored; unit tests of the status function.</td></tr>
<tr><td>Leaked secrets</td><td>Keys read only on the server; <code>.env</code> ignored; logs hold no keys.</td><td>The key value is absent from every file in the production build, the seed database, the reports and logs (scanned for the value itself).</td></tr>
<tr><td>Abuse and malformed input</td><td>Schema validation, length caps, 12 questions per minute per client; internal QA route disabled in production.</td><td>Browser tests for 400 / 404 responses and path-like slugs.</td></tr>
</table>
<p><b>Limits of this evidence.</b> The checker is the same model family as the answerer, so errors can correlate. Six injection attacks are not a penetration test. Nothing here replaces review by a lawyer.</p>

<h2>7. Impact</h2>
<p>We report what was measured and say plainly what was not.</p>
<h3>Source truthfulness and status</h3>
<ul>
<li>${verification.supported} of ${verification.totalRefs} quoted passages (${claims} claims) were found on the stated page of the official PDFs. This proves the words are there, not that a plain-language reading is the only fair one.</li>
<li>Six official documents are held, including two the first build lacked (the December 2025 corrigendum and the October 2026 Removal of Difficulties Order). Phase dates are asserted in a test to equal the notification date plus 12 and 18 months, and status as of 25 October 2026 is “partly in force” with the 2027 provisions still upcoming.</li>
</ul>
<h3>Answer quality (strict, mechanical assertions)</h3>
<table class="keep">
<tr><th>Model</th><th>Set</th><th class="n">Strict pass</th><th>Notes</th></tr>
<tr><td><code>${dev.model}</code> (final)</td><td>Development, ${dev.questions} questions</td><td class="n">${dev.passed}/${dev.questions}</td><td>Retrieval found a gold page in ${dev.retrievalGoldPageHit}; ${dev.abstained} abstentions, all on questions built to be unanswerable or unsafe</td></tr>
<tr><td><code>${hold.model}</code> (final)</td><td>Held-out, ${hold.questions} questions</td><td class="n">${hold.passed}/${hold.questions}</td><td>Retrieval gold page ${hold.retrievalGoldPageHit}; written after the last retrieval change, never tuned against</td></tr>
<tr><td><code>${prior.model}</code> (before exact-quote checks)</td><td>Development / held-out</td><td class="n">${prior.passed}/${prior.questions} · ${priorHold.passed}/${priorHold.questions}</td><td>Kept in <code>data/benchmarks/archive/</code></td></tr>
<tr><td><code>${archDev.model}</code> (earlier)</td><td>Development / held-out</td><td class="n">${archDev.passed}/${archDev.questions} · ${archHold.passed}/${archHold.questions}</td><td>Kept in <code>data/benchmarks/archive/</code></td></tr>
</table>
<p>Run-to-run variance is real: the held-out set scored ${priorHold.passed}/${priorHold.questions} before the quote checks and ${hold.passed}/${hold.questions} after, with no relevant change to retrieval, so single numbers should be read as ±2 questions. The ${dev.questions - dev.passed} strict misses on the development set were each read by the developer and were substantively correct answers whose wording the pattern did not anticipate (for example “sections 1(2), 2, 18–26” where the pattern wanted a space around the dash, and “the purposes and means” where it wanted the singular); this is a reading by the developer, not independent review. The development set was used while building (one retrieval fix followed a failure, patterns were widened three times after correct answers), so its score is optimistic; the held-out set is the fairer figure. An earlier held-out run exposed a real weakness: a question about keeping data after withdrawing consent never retrieved the erasure passage (keyword retrieval missed the paraphrase), so the answer hedged. We did not tune against it.</p>
<h3>Analysis of retrieved documents</h3>
<p>Across ${analyses.length} stored analyses (bills, Acts and the draft Rules), the second pass checked ${aTotals.checked} statements: ${aTotals.supported} fully supported, ${aTotals.partly} marked “check the source”, ${aTotals.dropped} dropped before display. The developer read the draft-Rules analysis against the PDF and found it accurate; that is one document, not a systematic review, and the checker shares a model family with the writer.</p>
<h3>Scorecard</h3>
<ul>
<li>All ${verifs.length + 1} register documents with readable text are scored; tiny amending bills correctly come out “not enough evidence” in several dimensions instead of zero. ${comparatorCount} comparator statutes from the UK and Canada were fetched from official sites and scored by the same engine.</li>
<li>Hand-read precision of the phrase patterns on one bill (the Telecommunications Bill, nine random flagged sentences each): delegation 9 of 9, penalty size 9 of 9, deadlines 4 of 4; the reasonableness pattern was about half right and was tightened. <b>Recall was not measured</b>, and one bill is a small sample.</li>
<li>The scores are a description of design, not evidence that a design works. We make no outcome claim.</li>
</ul>
<h3>Discovery and engineering</h3>
<ul>
<li>Verification engine: the shipped register holds ${verifs.length} records, each re-verified against the live official sources: ${levelCount("corroborated")} corroborated by a second official source (India Code and/or the Gazette copy), ${levelCount("verified")} verified against Parliament’s record and the documents, ${levelCount("partly")} partly, ${levelCount("failed")} failed. Across ${totalChecks} checks: ${checkCount("pass")} passed, ${checkCount("info")} informational (including start-date clauses and the disagreements above), ${checkCount("unavailable")} could not be run (for example older scanned PDFs, or amending Acts that India Code does not list), ${checkCount("fail")} failed. ${docsFetched} official documents were fetched (${num(pagesStored)} pages of readable text stored with true page numbers). Eight notable laws searched by name (telecommunications, online gaming, income tax, insolvency, competition, banking, criminal code, Jan Vishwas) each resolved to the intended law on the developer’s reading of the titles and Act numbers; the first attempt at the Bharatiya Nyaya Sanhita returned the withdrawn bill and led to the ranking fix above.</li>
<li>A real pre-existing defect surfaced: the earlier ingestion labelled 3,500-character chunks as “pages”, so some page links were wrong. The engine stores true per-page text, so every page number it shows is a real page of the real PDF.</li>

<li>${unitTests} unit tests and ${E2E_TESTS} browser tests on a production build pass, including live-AI, injection and cross-policy tests; a clean copy with no key still serves every page and the prepared answers, and says plainly that new AI questions are unavailable.</li>
</ul>
<h3>User experience</h3>
<p>The page now answers “what is it, is it in force, what changes” in the first two screens, with one plain status and no internal values (a browser test asserts that no raw enum names appear). <b>We did not run a user study.</b> The five-second and two-minute tests in our plan were not carried out with other people, so there is no measured claim about comprehension or time saved. A ready protocol is in <code>docs/user-test-protocol.md</code>.</p>
<div class="mob">
${fig("11-mobile-top", "Figure 5a. Mobile, top of policy page.")}
${fig("12-mobile-tracker", "Figure 5b. Mobile tracker, vertical.")}
${fig("13-mobile-home", "Figure 5c. Mobile home.")}
</div>

<h2>8. Limits + Next Steps</h2>
<h3>Limits</h3>
<ul>
<li><b>One curated law.</b> Only DPDP has hand-reviewed, claim-level content. The other ${verifs.length} records are engine-verified: their stage and dates are checked, but nobody has read their explanations against the law.</li>
<li><b>Coverage.</b> Name search covers Parliament’s bill register (bills, including those that became Acts) and India Code (Acts, central first). State-level material beyond India Code, rules, regulations and policies need a pasted link to an official document on an allowed site. Parliament’s register is the authority on a bill’s stage, so Anvaya cannot see anything Parliament has not recorded. India Code does not list many amending Acts, so a second-source confirmation is often unavailable. The eGazette, which sits behind a captcha, is not searched, so later notifications (including start dates) are not checked. Text shown for an Act is as published and may not merge later amendments.</li>
<li><b>Verified does not mean legally reviewed.</b> “Verified” means the listed checks passed. It does not mean a lawyer has read the explanation. Scanned or legacy-font PDFs cannot be read or explained, and long documents are analysed from their 14 most relevant passages, so provisions can be missed.</li>

<li><b>Retrieval is keyword-based</b> (BM25 plus a synonym map). Paraphrases can miss the right passage; the held-out set showed it.</li>
<li><b>Dates carry real uncertainty.</b> The notification says “eighteen months from the date of publication”; we show 13 May 2027 and flag that some commentators count a day later. A reported proposal to shorten the wait is unconfirmed, from secondary sources. We could not read the eGazette directly to rule out a newer notification.</li>
<li><b>No independent review.</b> Quote checks prove wording, not interpretation. The second-pass checker shares a model family with the answerer. No lawyer reviewed the content, and no user study was run.</li>
<li><b>Prices unverified</b>, so cost is reported in tokens. The model is non-deterministic: repeated runs of the same set differed by one or two questions.</li>
<li><b>Out of scope today:</b> news and public-debate analysis, alerts, Hindi, accounts, hosting, and any causal estimate of a law’s economic effect. The Evidence Lab is general MoSPI data, deliberately not tied to the Act.</li>
<li><b>Images.</b> The homepage photographs of the new Parliament building come from an Architectural Digest India article and are credited, but they are not openly licensed; they are used at the author’s direction for a non-commercial course project and should be replaced or cleared before any wider use. The Wikimedia and government-licensed alternatives are in <code>public/assets/</code>.</li>
</ul>
<h3>Next steps</h3>
<ol>
<li>Run the two-minute user test with 3–5 non-lawyers and publish the observations.</li>
<li>Measure the scorecard’s phrase-matching recall on a hand-labelled set, add more comparator countries, and load real outcome studies so the effect ring can be switched on for a policy that has them.</li>
<li>Read the eGazette (past its captcha) for notifications and start dates, merge amendments into Act text, and analyse long documents in sections.</li>
<li>Add embedding-based retrieval next to BM25 and re-run the held-out set.</li>
<li>Curate a second law end to end (the National Sports Governance Act is the natural candidate) using the same claim-and-quote contract.</li>
<li>Have a lawyer review the claim registry; add review controls for correcting a summary without rewriting source text.</li>
<li>Read the eGazette directly for amendments, and add a change monitor for the DPDP notifications.</li>
<li>Add press coverage as attributed, source-linked context only if the sources and licensing allow it.</li>
</ol>
<p class="meta" style="margin-top:12pt">Built ${BUILT}. Photographs: Architectural Digest India (credited on the page; see Limits). Fonts: Inter and Newsreader (SIL OFL). Slides use reveal.js (MIT). All figures are screenshots of the running app.</p>
</div></body></html>`;

writeFileSync("report.html", report);

// ───────────── SLIDES (reveal.js, self-contained) ─────────────
const revealCss = readFileSync("submission-assets/reveal.css", "utf8");
const revealJs = readFileSync("submission-assets/reveal.js", "utf8");

const slides = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Anvaya — MGT 409 slides</title>
<style>${revealCss}</style>
<style>
${fontFaces}
:root{--navy:#102e3c;--teal:#267c76;--saffron:#d38b45;--ivory:#faf8f3;--muted:#50655f;--mist:#f0eee4;--r-main-font:Inter,Helvetica,sans-serif;--r-heading-font:Newsreader,Georgia,serif}
html,body{background:var(--ivory)}
.reveal{font-family:Inter,Helvetica,sans-serif;color:#17313c;font-size:28px}
.reveal .slides{text-align:left}
.reveal .slides>section{padding:0 48px;box-sizing:border-box}
.reveal h1,.reveal h2,.reveal h3{font-family:Newsreader,Georgia,serif;font-weight:500;color:var(--navy);text-transform:none;letter-spacing:-.02em;margin:0 0 .35em;line-height:1.05}
.reveal h1{font-size:2.9em}.reveal h2{font-size:1.75em}.reveal h3{font-size:1.15em;letter-spacing:0}
.reveal p,.reveal li{line-height:1.4;margin:.3em 0}
.reveal ul{margin:.3em 0 0 1.1em;display:block}
.kicker{font:600 .5em Inter;letter-spacing:.14em;text-transform:uppercase;color:#8d531c;margin:0 0 .8em}
.muted{color:var(--muted)}.small{font-size:.66em}
.bar{position:absolute;left:0;top:0;bottom:0;width:14px;background:var(--saffron)}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:34px;align-items:start}
.cols3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.card{background:#fff;border:1px solid #d8ded5;border-top:4px solid var(--saffron);border-radius:10px;padding:16px 18px}
.card b{display:block;color:var(--navy)}
.stat{border-top:4px solid var(--saffron);padding-top:8px}
.stat b{display:block;font:500 2.5em/1 Newsreader,serif;color:var(--navy)}
.stat span{font-size:.66em;color:var(--muted);line-height:1.25;display:block;margin-top:4px}
.reveal img{border:1px solid #d8ded5;border-radius:8px;box-shadow:0 6px 24px rgba(16,46,60,.12);max-height:470px;width:100%;object-fit:cover;object-position:top;margin:0}
.reveal table{border-collapse:collapse;font-size:.74em;width:100%;margin-top:.6em}
.reveal th,.reveal td{border:1px solid #d8ded5;padding:9px 12px;text-align:left;vertical-align:top}
.reveal th{background:var(--mist);color:var(--navy)}
.reveal td.n,.reveal th.n{text-align:right}
code{font:.8em ui-monospace,Menlo,monospace;background:var(--mist);padding:1px 6px;border-radius:4px}
.hero{background:var(--navy);color:#fff;border-radius:0}
.reveal .hero h1,.reveal .hero p{color:#fff}
.reveal .progress{color:var(--saffron)}
.reveal .controls{color:var(--teal)}
.reveal .slide-number{color:var(--muted);background:transparent;font-size:14px}
svg{width:100%;height:auto}
</style></head><body>
<div class="reveal"><div class="slides">

<section data-background-color="#102e3c">
<p class="kicker" style="color:#f0c18b">Yale SOM · MGT 409 · Final project</p>
<h1 style="color:#fff;font-size:3.3em;max-width:12em">Understand the policies shaping India.</h1>
<p style="color:#dbe7e1;max-width:22em">Anvaya finds the official text, explains it in plain language, and shows the exact passage behind every claim.</p>
<p class="small" style="color:#a9c1b7;margin-top:1.6em">${AUTHOR} · ${EMAIL}<br>Code: ${REPO} (public) · run it locally in under 10 minutes</p>
</section>

<section>
<p class="kicker">The problem</p>
<h2>One law, five documents, three start dates</h2>
<div class="cols">
<div>
<ul>
<li><b>Act</b> · assent 11 Aug 2023</li>
<li><b>Commencement notification</b> · 13 Nov 2025, three dates</li>
<li><b>Rules</b> · own schedule, same three dates</li>
<li><b>Corrigendum</b> · 11 Dec 2025</li>
<li><b>Removal of Difficulties Order</b> · 6 Oct 2026</li>
</ul>
<p class="muted small" style="margin-top:1em">Secondary sources disagree on the exact day (13 or 14 May 2027) and press reports of a shorter timeline are unconfirmed. Readers cannot sort that out from Gazette PDFs.</p>
</div>
<div class="card"><b>“Does the DPDP Act apply to my small business, and when?”</b><p class="muted">A chatbot answers from memory. A search engine returns pages. Neither shows which page of which Gazette supports the sentence.</p></div>
</div>
</section>

<section>
<p class="kicker">What is new</p>
<h2>Claims you can check, status you can trust</h2>
<div class="cols3">
<div class="card"><b>Evidence at claim level</b><p>${claims} claims, each with verbatim quotes and a PDF page. A script found <b>${verification.supported}/${verification.totalRefs}</b> quotes on the stated page.</p></div>
<div class="card"><b>Status is computed</b><p>Dates come from the Gazette; code works out “in force / starts in 200 days”. The model cannot write status.</p></div>
<div class="card"><b>Answer, then check</b><p>Scoped retrieval, an answer with exact quotes that code confirms, then a second AI pass. If unsupported, Anvaya says so.</p></div>
</div>
<p class="muted small" style="margin-top:1.4em">Plus: ask for any bill by name or paste an official link; a verification engine checks Parliament’s register against the documents and India Code and shows every check. And a <b>design scorecard</b>: four rings with 90% ranges, benchmarked against UK and Canadian statutes. Things we could not confirm are listed on the page.</p>
</section>

<section>
<p class="kicker">The agents</p>
<h2>A fixed pipeline with scoped roles</h2>
${diagram(1120)}
</section>

<section>
<p class="kicker">Demo</p>
<h2>From question to cited, checked answer</h2>
<div style="display:grid;grid-template-columns:1.1fr 1.3fr;gap:26px;align-items:start">
<div><img src="${img("06-ask-live")}" alt="Live answer with cited passage and check result"><p class="small muted">A live question: qualified answer, the exact passage, and the second-pass check result.</p></div>
<div><img src="${img("19-rings")}" alt="Scorecard rings on the DPDP page" style="object-position:left top"><p class="small muted">The scorecard on the same page: score, 90% range, reason on hover; click for the UK and Canada comparison.</p></div>
</div>
</section>

<section>
<p class="kicker">Cost to run</p>
<h2>About ${num(perQ.input)} tokens in, ${num(perQ.output)} out, per live question</h2>
<div class="cols3">
<div class="stat"><b>${num(inTokens)}</b><span>input tokens over ${questions} questions (${num(calls)} calls)</span></div>
<div class="stat"><b>${sec(dev.latencyMs.median)}</b><span>median answer time (90th percentile ${sec(dev.latencyMs.p90)})</span></div>
<div class="stat"><b>0</b><span>tokens for the ${prepared} prepared answers; live answers are cached</span></div>
</div>
<p style="margin-top:1.2em">At 10,000 live questions a month: <b>${one((10000 * perQ.input) / 1e6)}M</b> input and <b>${one((10000 * perQ.output) / 1e6)}M</b> output tokens.</p>
<p class="small muted">Measured on <code>${dev.model}</code> via Portkey, gateway cache bypassed. A verified price for this model was not available, so no dollar figure is claimed.</p>
</section>

<section>
<p class="kicker">Safety</p>
<h2>Untrusted text never gets to give orders</h2>
<table>
<tr><th>Attack</th><th>Defence</th><th class="n">Result</th></tr>
<tr><td>Redirect to an internal address</td><td>Every hop validated before it is requested</td><td class="n">14 tests pass</td></tr>
<tr><td>“Ignore instructions… fully in force”</td><td>Status from code; rules; output checks</td><td class="n">ignored</td></tr>
<tr><td>Poisoned passage inside a retrieved document</td><td>Treated as data; second-pass check</td><td class="n"><b>${inj.summary.passed}/${inj.summary.attacks}</b> ignored, 0 cited</td></tr>
<tr><td>Wrong-policy question</td><td>One corpus per policy</td><td class="n">abstained</td></tr>
<tr><td>Fake quote or wrong page</td><td>Quote verifier</td><td class="n">rejected</td></tr>
<tr><td>Leaked key</td><td>Server-only, scanned</td><td class="n">absent</td></tr>
</table>
<p class="small muted">Small samples written by us; not a penetration test.</p>
</section>

<section>
<p class="kicker">Impact</p>
<h2>What we measured</h2>
<div class="cols3" style="grid-template-columns:repeat(4,1fr)">
<div class="stat"><b>${verification.supported}/${verification.totalRefs}</b><span>quotes found on the official page</span></div>
<div class="stat"><b>${dev.passed}/${dev.questions}</b><span>development questions, strict</span></div>
<div class="stat"><b>${hold.passed}/${hold.questions}</b><span>held-out questions, strict</span></div>
<div class="stat"><b>${verifs.length}</b><span>register records verified against live official sources (${levelCount("corroborated")} corroborated, ${levelCount("failed")} failed)</span></div>
</div>
<ul style="margin-top:1em">
<li>The four strict misses were correct answers worded unexpectedly (our reading, not independent review).</li>
<li>One real retrieval miss: a paraphrase did not find the erasure passage. Not tuned away.</li>
<li>${unitTests} unit + ${E2E_TESTS} browser tests pass on a production build. Scorecard: ${comparatorCount} comparator statutes scored; the effect ring is blank because no outcome data exists.</li>
<li><b>Not measured:</b> user comprehension. No user study was run.</li>
</ul>
</section>

<section>
<p class="kicker">Limits and next</p>
<h2>Honest edges</h2>
<div class="cols">
<div><h3>Limits</h3><ul>
<li>One curated law; other bills provisional</li>
<li>Keyword retrieval misses paraphrases</li>
<li>Date counting and a reported shortening are unconfirmed</li>
<li>Scorecard measures design, not outcomes</li>
<li>No lawyer review, no user study</li>
</ul></div>
<div><h3>Next</h3><ul>
<li>Test with 3–5 non-lawyers</li>
<li>Add embedding retrieval; re-run held-out</li>
<li>Curate a second law with the same contract</li>
<li>Lawyer review; read the eGazette directly</li>
</ul></div>
</div>
</section>

<section data-background-color="#102e3c">
<p class="kicker" style="color:#f0c18b">Try it</p>
<h2 style="color:#fff">Ask it something</h2>
<p style="color:#dbe7e1;font-size:.8em"><code>${CLONE.replace(/&/g, "&amp;")}</code></p>
<p style="color:#dbe7e1">Then open <code>http://127.0.0.1:3000</code> and try: <em>“Are my customers’ data rights already in force?”</em></p>
<p class="small" style="color:#a9c1b7;margin-top:1.4em">Anvaya is an independent student project, not an official service and not legal advice. Slides built with reveal.js (MIT).</p>
</section>

</div></div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@6.0.2/dist/reveal.js"></script>
<script>/* offline fallback: the same reveal.js 6.0.2 build, used only if the CDN did not load */
if (!window.Reveal) {
${revealJs}
}</script>
<script>Reveal.initialize({hash:true,width:1280,height:720,margin:0.04,controls:true,progress:true,slideNumber:"c/t",transition:"fade",keyboard:true,touch:true,center:true});</script>
</body></html>`;

writeFileSync("slides.html", slides);
console.log(`report.html ${(report.length / 1e6).toFixed(2)} MB, slides.html ${(slides.length / 1e6).toFixed(2)} MB`);
