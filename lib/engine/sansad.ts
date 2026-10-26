import { fetchBounded } from "@/lib/research/security";

/**
 * Client for Parliament of India's Digital Sansad bill register: the authority on a bill's stage.
 * Records are typed, de-duplicated and ranked against what the user asked for.
 */

export type BillFileKind =
  | "introduced"
  | "passed_lok_sabha"
  | "passed_rajya_sabha"
  | "passed_both_houses"
  | "errata"
  | "committee_report"
  | "gazette"
  | "synopsis"
  | "act_text";

export type BillFile = { kind: BillFileKind; label: string; url: string };

export type SansadBill = {
  house: string;
  number: number;
  year: number;
  title: string;
  type: string;
  category: string;
  ministry: string | null;
  introducedDate: string | null;
  passedLokSabha: string | null;
  passedRajyaSabha: string | null;
  assentDate: string | null;
  committeeReferralDate: string | null;
  committeeReportDate: string | null;
  actNo: string | null;
  actYear: number | null;
  /** Parliament's own status word: Pending, Passed, Assented, Negatived, Removed, Withdrawn. */
  status: string;
  files: BillFile[];
};

export type Stage = {
  code: "enacted" | "passed_both" | "passed_lok_sabha" | "passed_rajya_sabha" | "in_committee" | "pending" | "negatived" | "removed" | "withdrawn" | "unknown";
  /** Short citizen label, e.g. "Enacted as Act No. 21 of 2026". */
  label: string;
  /** One sentence in plain words. */
  detail: string;
  /** Whether the text is law. */
  isLaw: boolean;
};

const FILE_LABELS: Record<BillFileKind, string> = {
  introduced: "Bill as introduced",
  passed_lok_sabha: "Bill as passed by the Lok Sabha",
  passed_rajya_sabha: "Bill as passed by the Rajya Sabha",
  passed_both_houses: "Bill as passed by both Houses",
  errata: "Errata",
  committee_report: "Parliamentary committee report",
  gazette: "Gazette copy of the Act",
  synopsis: "Synopsis",
  act_text: "Act text (India Code)",
};

const FILE_FIELDS: Array<[string, BillFileKind]> = [
  ["billIntroducedFile", "introduced"],
  ["billPassedInLSFile", "passed_lok_sabha"],
  ["billPassedInRSFile", "passed_rajya_sabha"],
  ["billPassedInBothHousesFile", "passed_both_houses"],
  ["errataFile", "errata"],
  ["reportFile", "committee_report"],
  ["billGazettedFile", "gazette"],
  ["billSynopsisFile", "synopsis"],
];

const str = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text && text.toLowerCase() !== "none" && text !== "null" ? text : null;
};

/** "2026-08-04 00:00:00.0" and "17/08/2026" both become "2026-08-04" / "2026-08-17". */
export function isoDate(value: unknown): string | null {
  const text = str(value);
  if (!text) return null;
  const slash = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`;
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : null;
}

export function parseBill(raw: Record<string, unknown>): SansadBill | null {
  const title = str(raw.billName);
  const number = Number(raw.billNumber);
  const year = Number(raw.billYear);
  if (!title || !Number.isFinite(number) || !Number.isFinite(year)) return null;
  const files: BillFile[] = [];
  for (const [field, kind] of FILE_FIELDS) {
    const url = str(raw[field]);
    if (url && /^https:\/\/(www\.)?sansad\.in\//.test(url)) files.push({ kind, label: FILE_LABELS[kind], url });
  }
  return {
    house: str(raw.billIntroducedInHouse) ?? "Unknown house",
    number,
    year,
    title,
    type: str(raw.billType) ?? "Unknown",
    category: str(raw.billCategory) ?? "Unknown",
    ministry: str(raw.ministryName),
    introducedDate: isoDate(raw.billIntroducedDate),
    passedLokSabha: isoDate(raw.billPassedInLSDate),
    passedRajyaSabha: isoDate(raw.billPassedInRSDate),
    assentDate: isoDate(raw.billAssentedDate),
    committeeReferralDate: isoDate(raw.referredToCommitteeDate),
    committeeReportDate: isoDate(raw.reportPresentedDate),
    actNo: str(raw.actNo),
    actYear: Number.isFinite(Number(raw.actYear)) && str(raw.actYear) ? Number(raw.actYear) : null,
    status: str(raw.status) ?? "Unknown",
    files,
  };
}

const SMALL = new Set(["the", "of", "and", "for", "a", "an", "in", "on", "to", "bill", "act", "code", "no"]);
/** Words that appear in hundreds of bill titles. They help ranking but can never identify a bill on their own. */
const WEAK = new Set(["amendment", "amendments", "laws", "law", "other", "miscellaneous", "provisions", "repeal", "second", "third", "special", "national", "public", "india", "indian", "central", "state", "states", "union", "territory", "territories", "relaxation", "validation"]);

export const normalizeTitle = (title: string): string[] =>
  (title.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((token) => !SMALL.has(token) && !/^(19|20)\d\d$/.test(token));

/** The words that identify a bill: the title's tokens minus generic ones. Falls back to all tokens if nothing is distinctive. */
export const distinctiveTokens = (title: string): string[] => {
  const all = normalizeTitle(title);
  const specific = all.filter((token) => !WEAK.has(token));
  return specific.length ? specific : all;
};

/**
 * 0–1: how well a bill's title matches what the user typed. Every distinctive word the user typed must
 * appear in the title, otherwise the score is capped low. "Waqf Amendment Bill" can therefore never match
 * the Corporate Laws (Amendment) Bill on the shared word "amendment".
 */
export function titleScore(query: string, title: string): number {
  const wanted = normalizeTitle(query);
  const have = new Set(normalizeTitle(title));
  if (!wanted.length || !have.size) return 0;
  const distinct = distinctiveTokens(query);
  const distinctHits = distinct.filter((token) => have.has(token)).length;
  if (distinctHits < distinct.length) return Math.min(0.35, (distinctHits / distinct.length) * 0.35);
  const hits = wanted.filter((token) => have.has(token)).length;
  const coverage = hits / wanted.length;
  const precision = hits / have.size;
  const yearBonus = (query.match(/\b(19|20)\d\d\b/g) ?? []).some((year) => title.includes(year)) ? 0.1 : 0;
  return Math.min(1, 0.5 + coverage * 0.3 + precision * 0.2 + yearBonus - (yearBonus === 0 && /\b(19|20)\d\d\b/.test(query) ? 0.05 : 0));
}

/** The queries tried against the register, from most to least specific. */
export function queryVariants(query: string): string[] {
  const cleaned = query.replace(/[“”"']/g, "").replace(/\s+/g, " ").trim();
  const core = cleaned.replace(/^the\s+/i, "").replace(/\b(bill|act)\b,?\s*(19|20)\d\d\s*$/i, "").replace(/\b(bill|act)\s*$/i, "").replace(/,?\s*(19|20)\d\d\s*$/, "").trim();
  const bare = core.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  // The register matches the exact phrase in the title ("WAQF (AMENDMENT)"), so also try each distinctive word alone.
  const words = distinctiveTokens(core).sort((a, b) => b.length - a.length);
  const variants = [cleaned, core, bare, ...words.slice(0, 3)];
  return [...new Set(variants.filter((variant) => variant.length >= 3))];
}

async function fetchPage(name: string, size = 25): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({ loksabha: "", sessionNo: "", billName: name, house: "", ministryName: "", billType: "", billCategory: "", billStatus: "", introductionDateFrom: "", introductionDateTo: "", passedInLsDateFrom: "", passedInLsDateTo: "", passedInRsDateFrom: "", passedInRsDateTo: "", page: "1", size: String(size), locale: "en", sortOn: "billIntroducedDate", sortBy: "desc" });
  const fetched = await fetchBounded(`https://sansad.in/api_rs/legislation/getBills?${params.toString()}`, 25000);
  const json = JSON.parse(new TextDecoder().decode(fetched.buffer)) as { records?: Record<string, unknown>[] };
  return json.records ?? [];
}

/**
 * When titles match about equally, prefer the bill that went furthest: a bill that became law beats one
 * still pending, which beats one that was withdrawn or removed (usually replaced by a successor).
 */
export const rankWeight = (bill: SansadBill): number => {
  const progress = bill.status === "Assented" ? 4 : bill.status === "Passed" ? 3 : bill.status === "Pending" ? 1 : -1;
  return progress + (/government/i.test(bill.type) ? 1 : 0);
};

/** Scores within this distance are treated as a tie. */
const TIE = 0.08;
export const compareRanked = (a: { bill: SansadBill; score: number }, b: { bill: SansadBill; score: number }): number =>
  Math.abs(a.score - b.score) < TIE
    ? rankWeight(b.bill) - rankWeight(a.bill) || b.score - a.score || (b.bill.introducedDate ?? "").localeCompare(a.bill.introducedDate ?? "")
    : b.score - a.score;

export type RankedBill = { bill: SansadBill; score: number };

/** Search the register with several variants, drop duplicate rows, and rank by title match. */
export async function searchBills(query: string): Promise<{ ranked: RankedBill[]; variantsTried: string[]; reachable: boolean }> {
  const variantsTried = queryVariants(query);
  const seen = new Map<string, SansadBill>();
  // The register matches the exact phrase (and is whitespace-sensitive: a title with a double space is invisible to a
  // phrase search), so every variant is always tried, in parallel, and ranking alone decides.
  const settled = await Promise.allSettled(variantsTried.map((variant) => fetchPage(variant)));
  const reachable = settled.some((result) => result.status === "fulfilled");
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const row of result.value) {
      const bill = parseBill(row);
      if (!bill) continue;
      const key = `${bill.house}|${bill.number}|${bill.year}`;
      const existing = seen.get(key);
      // The register sometimes lists a bill twice; keep the row that carries more files.
      if (!existing || bill.files.length > existing.files.length) seen.set(key, bill);
    }
  }
  const ranked = [...seen.values()]
    .map((bill) => ({ bill, score: titleScore(query, bill.title) }))
    .filter((item) => item.score >= 0.5)
    .sort(compareRanked);
  return { ranked, variantsTried, reachable };
}

/** Looks up one bill by its identity (used to refresh and re-verify stored records). */
export async function findBillByIdentity(title: string, house: string, number: number, year: number): Promise<SansadBill | null> {
  const { ranked } = await searchBills(title);
  return ranked.map((item) => item.bill).find((bill) => bill.house === house && bill.number === number && bill.year === year) ?? null;
}

const dateWords = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1]} ${y}`;
};

/** Computes the bill's stage from Parliament's structured fields. Never guesses: unknown stays unknown. */
export function stageOf(bill: SansadBill): Stage {
  const actName = bill.actNo && bill.actYear ? `Act No. ${bill.actNo} of ${bill.actYear}` : null;
  if (bill.status === "Assented" || bill.assentDate) {
    return {
      code: "enacted",
      label: actName ? `Enacted as ${actName}` : "Enacted",
      detail: `Parliament passed this bill and the President gave assent${bill.assentDate ? ` on ${dateWords(bill.assentDate)}` : ""}. It is law. Assent does not by itself say when each provision starts; check the Act's commencement clause.`,
      isLaw: true,
    };
  }
  if (bill.status === "Negatived") return { code: "negatived", label: "Rejected by the House", detail: "The House voted against this bill.", isLaw: false };
  if (bill.status === "Withdrawn") return { code: "withdrawn", label: "Withdrawn", detail: "The member withdrew this bill. It is not law.", isLaw: false };
  if (bill.status === "Removed") return { code: "removed", label: "Removed from the register", detail: "Parliament's register lists this bill as removed (for example lapsed). It is not law.", isLaw: false };
  if (bill.status === "Passed" || (bill.passedLokSabha && bill.passedRajyaSabha)) {
    return { code: "passed_both", label: "Passed by both Houses", detail: "Both Houses have passed this bill. It becomes law only after the President’s assent, which Parliament’s record does not yet show.", isLaw: false };
  }
  if (bill.passedLokSabha) return { code: "passed_lok_sabha", label: "Passed by the Lok Sabha", detail: `The Lok Sabha passed this bill on ${dateWords(bill.passedLokSabha)}. It is still pending in the Rajya Sabha and is not law.`, isLaw: false };
  if (bill.passedRajyaSabha) return { code: "passed_rajya_sabha", label: "Passed by the Rajya Sabha", detail: `The Rajya Sabha passed this bill on ${dateWords(bill.passedRajyaSabha)}. It is still pending in the Lok Sabha and is not law.`, isLaw: false };
  if (bill.committeeReferralDate) {
    return { code: "in_committee", label: "Referred to a committee", detail: `It was referred to a parliamentary committee on ${dateWords(bill.committeeReferralDate)}${bill.committeeReportDate ? `, which reported on ${dateWords(bill.committeeReportDate)}` : ""}. It is not law.`, isLaw: false };
  }
  if (bill.status === "Pending") {
    const privateMember = /private/i.test(bill.type);
    return { code: "pending", label: `Introduced in the ${bill.house}`, detail: `${privateMember ? "This is a private member’s bill, and very few of these become law. " : ""}It was introduced${bill.introducedDate ? ` on ${dateWords(bill.introducedDate)}` : ""} and is pending. It is not law.`, isLaw: false };
  }
  return { code: "unknown", label: "Stage not clear from the record", detail: "Parliament’s record does not give a clear stage for this bill.", isLaw: false };
}
