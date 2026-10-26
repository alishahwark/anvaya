import { fetchBounded } from "@/lib/research/security";
import { normalizeTitle, titleScore } from "@/lib/engine/sansad";

/**
 * Client for India Code (indiacode.gov.in), the Legislative Department's statute book. It is the
 * second official source: it lets Anvaya confirm that an Act Parliament says it enacted really
 * exists with the same number, year and enactment date, and supplies the Act's own text.
 */

export type IndiaCodeAct = {
  title: string;
  handle: string;
  uuid: string;
  actNumber: string | null;
  actYear: number | null;
  enactDate: string | null;
  ministry: string | null;
  repealed: boolean;
  jurisdiction: "central" | "state";
  /** Public page for the Act. */
  url: string;
  /** Link to the item's REST record, used to find its PDF. */
  bundlesUrl: string | null;
};

const BASE = "https://indiacode.gov.in/server/api";

type Md = Record<string, Array<{ value: string }>>;
const meta = (md: Md, key: string): string | null => md[key]?.[0]?.value?.trim() || null;

function toAct(item: any): IndiaCodeAct | null {
  const md: Md = item.metadata ?? {};
  if (meta(md, "dc.identifier.collection") !== "ACT") return null;
  const title = (meta(md, "dc.title") ?? item.name ?? "").trim();
  if (!title) return null;
  const actId = meta(md, "dc.identifier.act_id") ?? "";
  const year = Number(meta(md, "dc.date.act_year"));
  return {
    title,
    handle: String(item.handle ?? ""),
    uuid: String(item.uuid ?? ""),
    actNumber: meta(md, "dc.identifier.act_number"),
    actYear: Number.isFinite(year) && year > 0 ? year : null,
    enactDate: meta(md, "dc.date.enact_date"),
    ministry: meta(md, "dc.identifier.ministry_name"),
    repealed: meta(md, "dc.identifier.repealed") === "true",
    jurisdiction: actId.startsWith("AC_CEN") ? "central" : "state",
    url: `https://indiacode.gov.in/handle/${item.handle}`,
    bundlesUrl: item._links?.bundles?.href ?? null,
  };
}

async function discover(query: string, size = 50): Promise<IndiaCodeAct[]> {
  const url = `${BASE}/discover/search/objects?${new URLSearchParams({ query, dsoType: "ITEM", size: String(size) }).toString()}`;
  const fetched = await fetchBounded(url, 30000);
  const json = JSON.parse(new TextDecoder().decode(fetched.buffer));
  const objects: any[] = json?._embedded?.searchResult?._embedded?.objects ?? [];
  return objects.map((object) => toAct(object?._embedded?.indexableObject)).filter((act): act is IndiaCodeAct => act !== null);
}

/** Search the Act collection by name. Returns matches ranked by title similarity. */
export async function searchActs(query: string): Promise<{ acts: Array<{ act: IndiaCodeAct; score: number }>; reachable: boolean }> {
  const words = normalizeTitle(query).join(" ");
  if (!words) return { acts: [], reachable: true };
  const year = query.match(/\b(19|20)\d\d\b/)?.[0];
  const attempts = [`dc.identifier.collection:ACT AND ${words}${year ? ` AND dc.date.act_year:${year}` : ""}`, `dc.identifier.collection:ACT AND ${words}`];
  const found = new Map<string, IndiaCodeAct>();
  let reachable = false;
  for (const attempt of attempts) {
    try {
      for (const act of await discover(attempt)) found.set(act.uuid, act);
      reachable = true;
    } catch {
      /* next attempt */
    }
    if ([...found.values()].some((act) => act.jurisdiction === "central")) break;
  }
  // State legislatures re-enact many central Acts under the same title, number and year, so central Acts
  // rank first and exact duplicates collapse to one.
  const unique = new Map<string, IndiaCodeAct>();
  for (const act of found.values()) unique.set(`${act.jurisdiction}|${act.title.toLowerCase()}|${act.actNumber}|${act.actYear}`, act);
  const acts = [...unique.values()]
    .map((act) => ({ act, score: titleScore(query, act.title) }))
    .filter((item) => item.score >= 0.5)
    .sort((a, b) => b.score - a.score || (a.act.jurisdiction === "central" ? -1 : 1) - (b.act.jurisdiction === "central" ? -1 : 1));
  return { acts, reachable };
}

export type Corroboration =
  | { status: "found"; act: IndiaCodeAct }
  | { status: "not_found"; checked: string }
  | { status: "mismatch"; act: IndiaCodeAct; reason: string }
  | { status: "unreachable"; reason: string };

/**
 * Confirms that an Act with this number, year and similar title exists on India Code.
 * Used to corroborate Parliament's statement that a bill was enacted.
 */
export async function corroborateAct(title: string, actNo: string, actYear: number, assentDate: string | null): Promise<Corroboration> {
  const checked = new Date().toISOString().slice(0, 10);
  try {
    const byTitle = await searchActs(title.replace(/\bBill\b/i, "Act"));
    const direct = await discover(`dc.identifier.collection:ACT AND dc.identifier.act_number:${Number(actNo)} AND dc.date.act_year:${actYear}`).catch(() => []);
    const reachable = byTitle.reachable || direct.length > 0;
    if (!reachable) return { status: "unreachable", reason: "India Code did not respond." };
    const pool = [...byTitle.acts.map((item) => item.act), ...direct];
    const central = pool.filter((act) => act.jurisdiction === "central");
    const same = central.find((act) => act.actYear === actYear && Number(act.actNumber) === Number(actNo) && titleScore(title.replace(/\bBill\b/i, "Act"), act.title) >= 0.5);
    if (!same) return { status: "not_found", checked };
    if (assentDate && same.enactDate && same.enactDate !== assentDate) return { status: "mismatch", act: same, reason: `India Code gives the enactment date as ${same.enactDate}, Parliament’s record gives ${assentDate}.` };
    return { status: "found", act: same };
  } catch (error) {
    return { status: "unreachable", reason: error instanceof Error ? error.message : "India Code could not be reached." };
  }
}

/** URL of the Act's PDF on India Code, if it has one. */
export async function actPdfUrl(act: IndiaCodeAct): Promise<string | null> {
  if (!act.bundlesUrl) return null;
  try {
    const bundles = JSON.parse(new TextDecoder().decode((await fetchBounded(act.bundlesUrl, 30000)).buffer));
    const original = (bundles?._embedded?.bundles ?? []).find((bundle: any) => bundle.name === "ORIGINAL");
    if (!original) return null;
    const streams = JSON.parse(new TextDecoder().decode((await fetchBounded(original._links.bitstreams.href, 30000)).buffer));
    const pdf = (streams?._embedded?.bitstreams ?? []).find((stream: any) => /\.pdf$/i.test(stream.name));
    return pdf?._links?.content?.href ?? null;
  } catch {
    return null;
  }
}
