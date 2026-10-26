/**
 * Comparator registry: foreign statutes used as benchmarks, by policy area. Every entry is fetched from the
 * country's official legislation site by scripts/build-benchmarks.ts, its title is checked against the fetched
 * text, and the same scoring engine is applied. Ireland's statute book was tried and dropped: its HTML endpoint returns only a fragment of long Acts. Selection of comparators is a researcher choice and the
 * benchmark pages show how much it matters (leave-one-out ranges). An area with no entry here has no benchmark.
 */
export type Comparator = {
  id: string;
  country: "United Kingdom" | "Canada";
  title: string;
  year: number;
  /** Candidate source URLs in order of preference (as-enacted first where the site offers it). */
  urls: string[];
  /** Text that must appear near the start of the fetched document, else the entry is rejected. */
  expect: string;
};

export type Topic = { id: string; label: string; match: RegExp; comparators: Comparator[] };

const uk = (id: string, title: string, year: number, path: string): Comparator => ({
  id, country: "United Kingdom", title, year, expect: title.replace(/ \d{4}$/, ""),
  urls: [`https://www.legislation.gov.uk/${path}/enacted/data.xml`, `https://www.legislation.gov.uk/${path}/data.xml`],
});
const ca = (id: string, title: string, year: number, code: string, expect = title): Comparator => ({
  id, country: "Canada", title, year, expect, urls: [`https://laws-lois.justice.gc.ca/eng/acts/${code}/FullText.html`],
});

export const TOPICS: Topic[] = [
  { id: "data-protection", label: "Data protection and privacy", match: /data protection|personal data|privacy/i, comparators: [
    uk("uk-dpa-2018", "Data Protection Act 2018", 2018, "ukpga/2018/12"),
    ca("ca-pipeda", "Personal Information Protection and Electronic Documents Act", 2000, "P-8.6"),
  ] },
  { id: "consumer", label: "Consumer protection", match: /consumer protection/i, comparators: [
    uk("uk-cra-2015", "Consumer Rights Act 2015", 2015, "ukpga/2015/15"),
    ca("ca-cpsa", "Canada Consumer Product Safety Act", 2010, "C-1.68"),
  ] },
  { id: "telecom", label: "Telecommunications", match: /telecommunication|telegraph/i, comparators: [
    ca("ca-telecom", "Telecommunications Act", 1993, "T-3.4"),
    ca("ca-radiocom", "Radiocommunication Act", 1985, "R-2"),
  ] },
  { id: "gambling", label: "Gambling and gaming", match: /gaming|gambling|betting|lotter/i, comparators: [
    uk("uk-gambling-2005", "Gambling Act 2005", 2005, "ukpga/2005/19"),
  ] },
  { id: "competition", label: "Competition", match: /competition/i, comparators: [
    uk("uk-ca-1998", "Competition Act 1998", 1998, "ukpga/1998/41"),
    ca("ca-competition", "Competition Act", 1985, "C-34"),
  ] },
  { id: "insolvency", label: "Insolvency", match: /insolvency|bankruptcy/i, comparators: [
    uk("uk-ia-1986", "Insolvency Act 1986", 1986, "ukpga/1986/45"),
    ca("ca-bia", "Bankruptcy and Insolvency Act", 1985, "B-3"),
  ] },
  { id: "maritime", label: "Carriage of goods by sea", match: /carriage of goods|by sea|maritime/i, comparators: [
    uk("uk-cogsa-1992", "Carriage of Goods by Sea Act 1992", 1992, "ukpga/1992/50"),
    uk("uk-cogsa-1971", "Carriage of Goods by Sea Act 1971", 1971, "ukpga/1971/19"),
    ca("ca-mla", "Marine Liability Act", 2001, "M-0.7"),
  ] },
  { id: "statistics", label: "Official statistics bodies", match: /statistic/i, comparators: [
    uk("uk-sra-2007", "Statistics and Registration Service Act 2007", 2007, "ukpga/2007/18"),
    ca("ca-stats", "Statistics Act", 1985, "S-19"),
  ] },
  { id: "securities", label: "Securities and financial markets", match: /securities|financial services|capital market/i, comparators: [
    uk("uk-fsma-2000", "Financial Services and Markets Act 2000", 2000, "ukpga/2000/8"),
  ] },
  { id: "criminal-law", label: "Criminal law", match: /nyaya|criminal|penal code/i, comparators: [
    ca("ca-criminal-code", "Criminal Code", 1985, "C-46"),
  ] },
  { id: "tax", label: "Income tax", match: /income[- ]tax/i, comparators: [] },
  { id: "sport", label: "Sport governance", match: /sport/i, comparators: [] },
];

export function topicOf(title: string): Topic | null {
  return TOPICS.find((topic) => topic.match.test(title)) ?? null;
}
