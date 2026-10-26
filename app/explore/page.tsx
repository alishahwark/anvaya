import Link from "next/link";
import { redirect } from "next/navigation";
import { ResearchLauncher } from "@/components/research/ResearchLauncher";
import { Reveal } from "@/components/site/Reveal";
import { Shell } from "@/components/site/Shell";
import { readableTitle } from "@/lib/research/record";
import { listPolicies, matchPolicies } from "@/lib/knowledge/search";

export const dynamic = "force-dynamic";
export const metadata = { title: "Explore policies — Anvaya" };

type Props = { searchParams: Promise<{ q?: string; show?: string }> };

export default async function ExplorePage({ searchParams }: Props) {
  const { q = "", show = "all" } = await searchParams;
  const query = q.trim().slice(0, 200);
  const all = await listPolicies();
  const matches = query ? matchPolicies(all, query) : all;

  // A full question about a policy we know goes straight to that policy, with the question asked.
  const top = matches[0];
  if (query && top?.kind === "reviewed" && query.split(/\s+/).length >= 4) redirect(`/policies/${top.slug}?q=${encodeURIComponent(query)}#ask`);

  const shown = matches.filter((listing) => show === "all" || listing.kind === show);
  const hrefFor = (value: string) => `/explore?${new URLSearchParams({ ...(query ? { q: query } : {}), show: value }).toString()}`;

  return (
    <Shell>
      <section className="a-intro">
        <span className="a-eyebrow">Explore</span>
        <h1>Find a policy</h1>
        <p>Search the register by name or topic. Every entry links to the official text.</p>
        <form action="/explore" role="search" className="a-search">
          <label htmlFor="explore-q" className="sr-only">Search policies</label>
          <input id="explore-q" name="q" defaultValue={query} placeholder="Try ‘data protection’ or ‘telecommunications’" autoComplete="off" />
          <button type="submit" className="a-search__go" aria-label="Search">
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </form>
      </section>

      <div className="a-shelf" style={{ marginTop: "2.5rem" }}>
        <div className="a-filter" role="group" aria-label="Filter by verification" style={{ justifyContent: "center", margin: 0 }}>
          {[["all", "All"], ["reviewed", "Reviewed in depth"], ["verified", "Verified against official sources"]].map(([value, label]) => (
            <Link key={value} href={hrefFor(value)} replace aria-current={show === value ? "true" : undefined} className="a-pill" data-on={show === value}>
              {label}
            </Link>
          ))}
        </div>

        <p className="a-small" role="status" style={{ textAlign: "center", margin: "1.25rem 0 0" }}>
          {shown.length ? `${shown.length} ${shown.length === 1 ? "policy" : "policies"}${query ? ` for “${query}”` : ""}` : query ? `No policy in Anvaya’s register matches “${query}”. You can ask Anvaya to search the official sources below.` : "Nothing here yet."}
        </p>

        <div className="a-shelf__grid" style={{ marginTop: "1.5rem" }}>
          {shown.map((listing, index) => (
            <Reveal key={listing.slug} delay={Math.min(index, 5) * 60}>
              <Link href={`/policies/${listing.slug}`} className="a-tile" style={{ height: "100%" }}>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span className={`a-chip ${listing.kind === "provisional" ? "" : "a-chip--soon"}`}>{listing.statusLabel}</span>
                  {listing.kind === "reviewed" ? <span className="a-chip a-chip--ok">Reviewed in depth</span> : listing.kind === "verified" ? <span className="a-chip a-chip--ok">Verified</span> : <span className="a-chip">Not yet verified</span>}
                </div>
                <h2 className="a-tile__title">{readableTitle(listing.title)}</h2>
                <p>{listing.summary}</p>
                <p className="a-small">{listing.statusDetail}</p>
                <span className="a-tile__go" aria-hidden="true"><svg viewBox="0 0 20 20" width="18" height="18"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              </Link>
            </Reveal>
          ))}
        </div>

        <div style={{ marginTop: "4rem" }}>
          <ResearchLauncher initialQuery={shown.length ? "" : query} />
        </div>
      </div>
    </Shell>
  );
}
