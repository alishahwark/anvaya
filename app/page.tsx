import Image from "next/image";
import Link from "next/link";
import { HeroSearch, SuggestionChips } from "@/components/site/HeroSearch";
import { Reveal } from "@/components/site/Reveal";
import { Shell } from "@/components/site/Shell";
import { RingSvg } from "@/components/scoring/ScoreRings";
import { DIMENSIONS } from "@/lib/scoring/indicators";
import { getKnowledge, todayIso } from "@/lib/knowledge";
import { loadVerificationReport, resolveEvidence } from "@/lib/knowledge/resolve";
import { listPolicies } from "@/lib/knowledge/search";
import { scorePayload } from "@/lib/scoring/score";

export const dynamic = "force-dynamic";

const Arrow = () => <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export default async function Home() {
  const today = todayIso();
  const dpdp = getKnowledge("dpdp-act-2023")!;
  const all = await listPolicies();
  const verified = all.filter((listing) => listing.kind === "verified");
  const featured = [all.find((listing) => listing.kind === "reviewed"), ...verified.filter((listing) => !/amendment/i.test(listing.title)).slice(0, 2)].filter((listing): listing is NonNullable<typeof listing> => Boolean(listing));
  const proof = resolveEvidence(dpdp, ["life.assent"], loadVerificationReport(dpdp.slug))[0];
  const card = (await scorePayload(dpdp.slug).catch(() => null))?.card;
  void today;

  return (
    <Shell>
      <section className="a-stage" aria-labelledby="home-title">
        <h1 id="home-title">Understand the policies shaping India.</h1>
        <p className="a-stage__sub">Ask about a law or bill. Anvaya finds the official text, explains it in plain language, and shows the passage behind every claim.</p>
        <div className="a-stagecard">
          <Image src="/assets/ad-parliament-cover.jpg" alt="Inside the Lok Sabha chamber of India’s new Parliament building, with carved peacock panels above the galleries" fill priority quality={90} sizes="(max-width: 900px) 100vw, 1000px" style={{ objectPosition: "50% 50%" }} />
          <HeroSearch />
          <span className="a-stagecard__credit">Photo: Architectural Digest India</span>
        </div>
        <SuggestionChips suggestions={["What does the DPDP Act mean for a small business?", "Are my customers’ data rights already in force?", "What happens on 13 November 2026?"]} />
        <Link href="/policies/dpdp-act-2023#scorecard" className="a-newpill"><b>New</b> Policy scorecards, benchmarked against UK and Canadian law <Arrow /></Link>
      </section>

      <Reveal as="section" className="a-feature">
        <div className="a-feature__media">
          <Image src="/assets/ad-parliament-night.jpg" alt="The Parliament complex in New Delhi at night, seen from above" fill quality={90} sizes="(max-width: 900px) 100vw, 560px" style={{ objectPosition: "42% 50%" }} />
          <span className="a-feature__credit">Photo: Architectural Digest India</span>
        </div>
        <div>
          <h2>Start from the official text.</h2>
          <p>Anvaya fetches each Act, bill and notification from Digital Sansad, India Code and the Gazette, checks the documents against one another, and keeps the originals.</p>
          <Link href="/how-it-works" className="a-textlink">See how it works <span aria-hidden="true">→</span></Link>
        </div>
      </Reveal>

      <Reveal as="section" className="a-feature a-feature--flip">
        <div className="a-feature__media" style={{ background: "linear-gradient(160deg, #e8efea, #d6e2dc)" }}>
          {proof ? (
            <>
              <div className="a-quotecard">
                <small>{dpdp.shortTitle} · page {proof.page}</small>
                <blockquote>“{proof.quote}”</blockquote>
                <span>{proof.label}</span>
              </div>
              <div className="a-quotecard">
                <small>Checked</small>
                <span><span className="a-tick">✓</span> Quote found on page {proof.page} of the official PDF</span>
              </div>
            </>
          ) : null}
        </div>
        <div>
          <h2>Every claim shows its passage.</h2>
          <p>Open any statement to see the exact words and the page of the official PDF they come from. If the text does not support an answer, Anvaya says so.</p>
          <Link href="/how-it-works#answers" className="a-textlink">How answers are checked <span aria-hidden="true">→</span></Link>
        </div>
      </Reveal>

      <Reveal as="section" className="a-feature">
        <div className="a-feature__media" style={{ background: "linear-gradient(160deg, #eef2ec, #dbe5de)" }}>
          <div className="a-feature__rings">
            <div className="a-minirings">
              {DIMENSIONS.map((dim) => {
                const result = card?.dimensions.find((d) => d.id === dim.id);
                const score = dim.id !== "effect" && result?.status === "scored" ? (result.score as number) : null;
                return (
                  <div key={dim.id}>
                    <RingSvg score={score} lo={result?.lo} hi={result?.hi} />
                    {dim.short}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <h2>Scored by formula. Compared with the world.</h2>
          <p>Five lenses on how a law is built, from legal clarity to accountability. Hover a score for the reason, or open it to compare the law with statutes from the UK and Canada.</p>
          <Link href="/methodology" className="a-textlink">How scoring works <span aria-hidden="true">→</span></Link>
        </div>
      </Reveal>

      <section className="a-shelf" aria-labelledby="shelf-title">
        <Reveal className="a-shelf__head">
          <h2 id="shelf-title">Policies you can read today</h2>
          <Link href="/explore" className="a-textlink" style={{ marginTop: 0 }}>All {all.length} policies <span aria-hidden="true">→</span></Link>
        </Reveal>
        <div className="a-shelf__grid">
          {featured.map((listing, index) => (
            <Reveal key={listing.slug} delay={index * 90}>
              <Link href={`/policies/${listing.slug}`} className="a-tile" style={{ height: "100%" }}>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span className="a-chip a-chip--soon">{listing.statusLabel}</span>
                  <span className="a-chip a-chip--ok">{listing.kind === "reviewed" ? "Reviewed in depth" : "Verified"}</span>
                </div>
                <h3>{listing.title.replace(/^THE /, "").replace(/\s+/g, " ")}</h3>
                <p>{listing.statusDetail}</p>
                <span className="a-tile__go" aria-hidden="true"><Arrow /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal as="section" className="a-closing a-closing--photo">
        <Image src="/assets/ad-parliament-chamber.jpg" alt="Overhead view of the green seating in India’s new Lok Sabha chamber" fill quality={90} sizes="100vw" />
        <div className="a-closing__body">
          <h2><span style={{ display: "block" }}>Not listed?</span><span style={{ display: "block" }}>Ask Anvaya to look.</span></h2>
          <p>Name a bill, or paste a link to an official PDF. Anvaya searches Parliament’s register and India Code, downloads the documents and checks them.</p>
          <Link href="/explore#research" className="a-btn a-btn--light a-btn--lg">Research a policy</Link>
        </div>
        <span className="a-feature__credit" style={{ left: "auto", right: "1.2rem" }}>Photo: Architectural Digest India</span>
      </Reveal>
    </Shell>
  );
}
