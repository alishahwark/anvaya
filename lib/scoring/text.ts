import { englishPages } from "@/lib/knowledge/pdf-text";

export type Sentence = { text: string; page: number };

/**
 * Cleans text as it comes out of official PDFs and HTML: collapses odd letter and bracket spacing,
 * removes running headers, and fixes spaces before punctuation. It never changes wording.
 */
export function normalizeLegalText(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\(\s+([0-9A-Za-z]{1,4})\s+\)/g, "($1)")
    .replace(/\s+([,.;:)])/g, "$1")
    .replace(/([(])\s+/g, "$1")
    .replace(/\bTHE GAZETTE OF INDIA(?: EXTRAORDINARY)?\b[^\]]{0,40}\]?/gi, " ")
    .replace(/\bS\s?EC\s?\.\s?\d+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Abbreviations whose full stop is not a sentence end.
const PROTECT = /\b(No|Nos|Sl|Rs|Dr|Mr|Mrs|St|Sec|Secs|Art|Arts|Cl|Cls|Para|Vol|Ltd|Inc|Co|vs|v|i\.e|e\.g|etc|cf|viz|Govt)\./g;

/** Splits into sentence-like units. Legislative sentences are long; semicolon-separated limbs stay with their lead-in. */
export function splitSentences(text: string): string[] {
  const protectedText = text.replace(PROTECT, (match) => match.replace(".", "․"));
  return protectedText
    .split(/(?<=[.?!])\s+(?=[(“"'A-Z0-9])/)
    .map((sentence) => sentence.replace(/․/g, ".").trim())
    .filter((sentence) => sentence.length >= 25);
}

const squash = (text: string) => text.toLowerCase().replace(/[^a-z]+/g, "");

export type Memoranda = { sor: boolean; financialMemorandum: boolean; quantified: boolean; delegatedLegislationMemo: boolean };

/**
 * Indian bills append a Statement of Objects and Reasons, a Financial Memorandum and a Memorandum on
 * Delegated Legislation after the operative text. Those are the bill's own ex-ante assessment, so they
 * are measured separately and excluded from the operative sentences.
 */
export function splitOperative(pages: string[]): { operative: string[]; memoranda: Memoranda | null } {
  const english = englishPages(pages);
  for (let index = 1; index < pages.length; index += 1) {
    if (!english[index]) continue;
    const flat = squash(pages[index]);
    const at = flat.indexOf("statementofobjectsandreasons");
    if (at < 0) continue;
    // Locate the heading in the original text so the operative part of that page is kept.
    const cut = pages[index].search(/STATEMENT\s+OF\s+OBJECTS\s+AND\s+REASONS/i);
    const operative = [...pages.slice(0, index), cut > 0 ? pages[index].slice(0, cut) : ""];
    const memoText = [pages[index].slice(Math.max(cut, 0)), ...pages.slice(index + 1)].join(" ");
    const memoFlat = squash(memoText);
    const fm = memoText.match(/FINANCIAL\s+MEMORANDUM([\s\S]{0,3000})/i);
    const fmText = fm ? fm[1].split(/MEMORANDUM\s+REGARDING\s+DELEGATED|ANNEXURE/i)[0] : "";
    return {
      operative,
      memoranda: {
        sor: true,
        financialMemorandum: memoFlat.includes("financialmemorandum"),
        quantified: /(?:₹|rs\.?|rupees)\s*[\d,]+|\bcrore\b|\blakh\b/i.test(fmText),
        delegatedLegislationMemo: memoFlat.includes("memorandumregardingdelegatedlegislation"),
      },
    };
  }
  return { operative: pages, memoranda: null };
}

/** Sentences with page numbers, English pages only (Hindi and garbled pages cannot be analysed). */
export function sentencesOf(pages: string[]): { sentences: Sentence[]; words: number } {
  const english = englishPages(pages);
  const sentences: Sentence[] = [];
  let words = 0;
  pages.forEach((page, index) => {
    if (!english[index]) return;
    const clean = normalizeLegalText(page);
    words += (clean.match(/\S+/g) ?? []).length;
    for (const text of splitSentences(clean)) sentences.push({ text, page: index + 1 });
  });
  return { sentences, words };
}

/** Turns HTML or XML from an official legislation site into page-like chunks of readable text. */
export function markupToPages(markup: string, chunk = 3500): string[] {
  const text = markup
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|tr|h\d|section|article|P\d?|Text|Para)>/gi, ". ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#?\w+;/g, " ")
    .replace(/\.\s*\.(\s*\.)*/g, ".")
    .replace(/\s+/g, " ")
    .trim();
  const pages: string[] = [];
  for (let start = 0; start < text.length; start += chunk) pages.push(text.slice(start, start + chunk));
  return pages;
}
