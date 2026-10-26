/**
 * Scoped passage retrieval. A corpus belongs to exactly one policy, so a query
 * about one law can never retrieve another law's text.
 */

export type Passage = {
  /** Stable ID the model must cite, e.g. "act:p7:2". */
  id: string;
  docKey: string;
  docTitle: string;
  identifier?: string;
  page: number;
  text: string;
  /** Official URL, deep-linked to the page when the host supports it. */
  url: string;
};

export type Corpus = {
  policySlug: string;
  policyTitle: string;
  /** True for hand-reviewed policies that have curated claims; false for engine-built records. */
  curated: boolean;
  /** True when the record passed Anvaya's verification checks. */
  verified: boolean;
  /** Changes whenever the underlying documents change; used in cache keys. */
  version: string;
  passages: Passage[];
};

const STOPWORDS = new Set(
  "a an and are as at be but by can do does for from has have how i if in is it its of on or our that the their them they this to was we what when where which who why will with would you your my me should".split(" "),
);

/** Small domain synonym map so lay words reach statutory vocabulary. */
const SYNONYMS: Record<string, string[]> = {
  business: ["fiduciary", "company", "person"],
  company: ["fiduciary", "person"],
  startup: ["fiduciary", "startups", "exempt"],
  msme: ["fiduciary", "exempt"],
  small: ["fiduciary", "exempt", "startups"],
  customer: ["principal", "individual"],
  user: ["principal", "individual"],
  people: ["principal", "individual"],
  fine: ["penalty", "monetary", "crore"],
  penalty: ["monetary", "crore", "schedule"],
  fined: ["penalty", "monetary", "crore"],
  hack: ["breach", "unauthorised"],
  leak: ["breach", "unauthorised"],
  breach: ["intimation", "board", "seventy"],
  kid: ["child", "children", "parent"],
  kids: ["child", "children", "parent"],
  minor: ["child", "children", "parent"],
  parent: ["child", "guardian", "verifiable"],
  delete: ["erase", "erasure"],
  deletion: ["erase", "erasure"],
  access: ["summary", "right"],
  complain: ["grievance", "complaint", "board"],
  complaint: ["grievance", "board"],
  force: ["commencement", "come", "notification", "date"],
  effective: ["commencement", "come", "force"],
  start: ["commencement", "come", "force"],
  begin: ["commencement", "come", "force"],
  when: ["commencement", "date"],
  abroad: ["outside", "transfer", "territory"],
  foreign: ["outside", "transfer", "territory"],
  overseas: ["outside", "transfer", "territory"],
  consent: ["consent", "notice"],
  cookies: ["consent", "notice", "personal"],
  privacy: ["personal", "notice", "consent"],
  regulator: ["board", "protection"],
  email: ["personal", "digital"],
};

function stem(token: string): string {
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  return token;
}

export function tokenize(text: string, expand = false): string[] {
  const raw = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const tokens: string[] = [];
  for (const word of raw) {
    if (STOPWORDS.has(word) || word.length < 2) continue;
    tokens.push(stem(word));
    if (expand && SYNONYMS[word]) tokens.push(...SYNONYMS[word].map(stem));
  }
  return tokens;
}

/** Splits page text into ~maxChars chunks at sentence-ish boundaries, with small overlap. */
export function chunkText(text: string, maxChars = 1500, overlap = 200): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean ? [clean] : [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + maxChars, clean.length);
    if (end < clean.length) {
      const boundary = clean.lastIndexOf(". ", end);
      if (boundary > start + maxChars * 0.5) end = boundary + 1;
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

type Scored = { passage: Passage; score: number };

/** BM25 over a corpus's passages, with domain synonym expansion on the query. */
export function rankPassages(corpus: Corpus, query: string, limit = 6): Scored[] {
  const queryTerms = [...new Set(tokenize(query, true))];
  if (!queryTerms.length) return [];
  const docs = corpus.passages.map((passage) => {
    const tokens = tokenize(`${passage.text} ${passage.docTitle}`);
    const counts = new Map<string, number>();
    for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
    return { passage, counts, length: tokens.length };
  });
  const averageLength = docs.reduce((sum, doc) => sum + doc.length, 0) / Math.max(docs.length, 1);
  const k1 = 1.2;
  const b = 0.75;
  const scores: Scored[] = docs.map((doc) => {
    let score = 0;
    for (const term of queryTerms) {
      const frequency = doc.counts.get(term) ?? 0;
      if (!frequency) continue;
      const containing = docs.filter((other) => other.counts.has(term)).length;
      const idf = Math.log(1 + (docs.length - containing + 0.5) / (containing + 0.5));
      score += idf * ((frequency * (k1 + 1)) / (frequency + k1 * (1 - b + (b * doc.length) / averageLength)));
    }
    return { passage: doc.passage, score };
  });
  return scores.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}
