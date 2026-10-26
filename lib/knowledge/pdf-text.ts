import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import parsePdf from "pdf-parse/lib/pdf-parse.js";

const cache = new Map<string, Promise<string[]>>();

/** Plain text of every page of a local PDF (index 0 = page 1). Cached per process. */
export function loadPdfPages(localFile: string): Promise<string[]> {
  const path = resolve(process.cwd(), localFile);
  let pages = cache.get(path);
  if (!pages) {
    pages = (async () => {
      if (!existsSync(path)) throw new Error(`Source file not found: ${localFile}`);
      const collected: string[] = [];
      await parsePdf(readFileSync(path), {
        pagerender: async (page: unknown) => {
          const content = await (page as { getTextContent: () => Promise<{ items: { str: string }[] }> }).getTextContent();
          const text = content.items.map((item) => item.str).join(" ");
          collected.push(text);
          return text;
        },
      });
      return collected;
    })();
    cache.set(path, pages);
  }
  return pages;
}

/** Per-page text of a PDF held in memory (index 0 = page 1). Empty array when the file has no text layer. */
export async function parsePdfBytes(bytes: Uint8Array | Buffer): Promise<string[]> {
  const collected: string[] = [];
  await parsePdf(Buffer.from(bytes), {
    pagerender: async (page: unknown) => {
      const content = await (page as { getTextContent: () => Promise<{ items: { str: string }[] }> }).getTextContent();
      const text = content.items.map((item) => item.str).join(" ");
      collected.push(text);
      return text;
    },
  });
  return collected;
}

const STOPWORDS = new Set("the of and to in a for by is shall be or as on this that with any which from an are at it its has have under such said not may where".split(" "));

/**
 * True when extracted text reads as English. Some official PDFs use legacy fonts that extract as
 * gibberish ("ST 1] AR <hT TSTIA…") and others are Hindi; neither can be checked or explained,
 * and neither should be mistaken for a document that fails a check.
 */
export function looksLikeEnglish(text: string, minWords = 40): boolean {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  if (words.length < minWords) return false;
  const sample = words.slice(0, 600);
  return sample.filter((word) => STOPWORDS.has(word)).length / sample.length >= 0.12;
}

/** Per-page English flags. Bilingual Gazettes carry the Hindi text first, so readability is judged page by page. */
export const englishPages = (pages: string[]): boolean[] => pages.map((page) => looksLikeEnglish(page, 25));

/** Share of pages that are readable English; a document is treated as readable above 25%. */
export function englishShare(pages: string[]): number {
  if (!pages.length) return 0;
  return englishPages(pages).filter(Boolean).length / pages.length;
}

/** Collapses the typography differences between a quote we wrote and PDF extraction. */
export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[“”„"]/g, '"')
    .replace(/[‘’']/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, "");
}

export function pageContains(pageText: string, quote: string): boolean {
  return normalizeForMatch(pageText).includes(normalizeForMatch(quote));
}
