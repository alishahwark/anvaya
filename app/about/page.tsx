import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/site/Shell";

export const metadata: Metadata = { title: "About — Anvaya" };

export default function AboutPage() {
  return (
    <Shell>
      <section className="a-intro">
        <span className="a-eyebrow">About</span>
        <h1>Independent by design</h1>
        <p>Anvaya helps people read Indian public policy by connecting every explanation to the official text. It is a student project for Yale School of Management’s MGT 409, AI Foundations for Managers.</p>
      </section>

      <div className="a-doc-page">
        <h2>What it is</h2>
        <ul>
          <li>A register of Indian bills and Acts, each checked against Parliament’s records and India Code.</li>
          <li>Plain-language explanations and answers, each tied to a quoted passage and page.</li>
          <li>A design scorecard for each law, compared with statutes from the UK and Canada.</li>
        </ul>

        <h2>What it is not</h2>
        <ul>
          <li>Not an official government service, and not affiliated with the Government of India.</li>
          <li>Not legal advice. It explains what documents say; for decisions about your situation, speak to a lawyer.</li>
          <li>Not complete. It covers the policies in its register, not every Indian law.</li>
        </ul>

        <h2>Sources</h2>
        <ul>
          <li>Parliament of India: Digital Sansad bill register and bill texts.</li>
          <li>Legislative Department: India Code and the Gazette of India.</li>
          <li>Ministry of Electronics and IT, for the Digital Personal Data Protection Act and Rules.</li>
          <li>MoSPI, for the consumer price series in the economic evidence lab.</li>
          <li>UK legislation.gov.uk and Canada’s Justice Laws website, for benchmark statutes.</li>
        </ul>

        <h2>Known limits</h2>
        <ul>
          <li>A passage check proves the words are on the page, not that a plain-language reading is the only fair one.</li>
          <li>The scorecard measures design features found in the text. It does not measure whether a policy works.</li>
          <li>Phrase matching reads wording approximately and can miss or over-count it.</li>
          <li>The <Link className="a-link" href="/evidence">economic evidence lab</Link> is a preview. It shows general statistics and does not measure the effect of any law.</li>
        </ul>
        <p style={{ marginTop: "2rem" }}><Link className="a-link" href="/how-it-works">How it works</Link> · <Link className="a-link" href="/methodology">Scorecard method</Link></p>
      </div>
    </Shell>
  );
}
