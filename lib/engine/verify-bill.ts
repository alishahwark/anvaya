import type { Corroboration } from "@/lib/engine/indiacode";
import { englishPages, englishShare } from "@/lib/knowledge/pdf-text";
import { distinctiveTokens, stageOf, titleScore, type BillFileKind, type SansadBill, type Stage } from "@/lib/engine/sansad";

/**
 * Verification of a bill record. "Verified" never means "an AI said so". It means a list of explicit,
 * inspectable checks passed: Parliament's structured record, what the official PDFs themselves print,
 * and (for enacted bills) India Code. Every check says what it looked at and links to its source.
 */

export type CheckStatus = "pass" | "fail" | "unavailable" | "info";
export type Check = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  sources: Array<{ label: string; url: string }>;
};

export type Verification = {
  /** corroborated: two independent official artifacts agree. verified: Parliament's record and the documents agree. partly: could not run key checks. failed: a check found a discrepancy. */
  level: "corroborated" | "verified" | "partly" | "failed";
  headline: string;
  checkedAt: string;
  stage: Stage;
  checks: Check[];
  commencement: { quote: string; page: number; docLabel: string } | null;
  limitations: string[];
};

export type FetchedDoc = { kind: BillFileKind; label: string; url: string; pages: string[] | null };

// ───────────── text helpers (PDF text arrives with odd letter spacing) ─────────────

const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "");
const lettersOnly = (text: string) => text.toLowerCase().replace(/[^a-z]+/g, "");
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** "17AUG2026", "5THAPRIL,2025", "3.4.2025" → ISO date, or null. Input has whitespace removed. */
function parseDate(compact: string): string | null {
  const named = compact.match(/^(\d{1,2})(?:st|nd|rd|th)?([a-z]{3,9}),?(\d{4})$/i);
  if (named) {
    const index = MONTHS.findIndex((month) => month.startsWith(named[2].toLowerCase().slice(0, 3)));
    if (index >= 0) return `${named[3]}-${String(index + 1).padStart(2, "0")}-${named[1].padStart(2, "0")}`;
  }
  const numeric = compact.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  return numeric ? `${numeric[3]}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}` : null;
}

export type PrintedFacts = { assentDate: string | null; actNo: string | null; actYear: number | null; lokSabhaDate: string | null; rajyaSabhaDate: string | null; billNumber: number | null; billYear: number | null };

/** What the document itself prints on its first pages: bill number, assent, Act number, passing dates. */
export function printedFacts(pages: string[]): PrintedFacts {
  const head = pages.slice(0, 2).join(" ").replace(/\s+/g, "");
  const dateAfter = (pattern: RegExp) => {
    const match = head.match(pattern);
    return match ? parseDate(match[1]) : null;
  };
  const act = head.match(/act\.?no\.?(\d+)of(\d{4})/i);
  const bill = head.match(/bill(?:no\.?)?(\d+)(?:-[a-z])?of(\d{4})/i);
  return {
    assentDate: dateAfter(/assentedtoon(\d{1,2}(?:st|nd|rd|th)?[a-z]{3,9},?\d{4})/i),
    actNo: act ? act[1] : null,
    actYear: act ? Number(act[2]) : null,
    lokSabhaDate: dateAfter(new RegExp(`loksabhaon(\\d{1,2}(?:st|nd|rd|th)?[a-z]{3,9},?\\d{4})`, "i")),
    rajyaSabhaDate: dateAfter(new RegExp(`rajyasabhaon(\\d{1,2}(?:st|nd|rd|th)?[a-z]{3,9},?\\d{4})`, "i")),
    billNumber: bill ? Number(bill[1]) : null,
    billYear: bill ? Number(bill[2]) : null,
  };
}

const BANNERS: Partial<Record<BillFileKind, RegExp>> = {
  introduced: /asintroducedin(the)?(loksabha|rajyasabha)/,
  passed_lok_sabha: /aspassedby(the)?loksabha/,
  passed_rajya_sabha: /aspassedby(the)?rajyasabha/,
  passed_both_houses: /aspassedbythehousesofparliament/,
};

/** First sentence in the bill that says when it comes into force, quoted exactly. */
export function findCommencement(doc: FetchedDoc): { quote: string; page: number; docLabel: string } | null {
  if (!doc.pages) return null;
  const english = englishPages(doc.pages);
  for (let index = 0; index < Math.min(doc.pages.length, 60); index += 1) {
    if (!english[index]) continue;
    const text = doc.pages[index].replace(/\s+/g, " ");
    const match = text.match(/[^.;]{0,170}\b(?:shall|will) (?:be deemed to )?(?:come|have come) into force[^.]{0,230}\./i) ?? text.match(/[^.;]{0,170}\bcame into force[^.]{0,200}\./i);
    if (match) return { quote: match[0].trim(), page: index + 1, docLabel: doc.label };
  }
  return null;
}

const sourceOf = (doc: FetchedDoc | undefined) => (doc ? [{ label: doc.label, url: doc.url }] : []);

export function verifyBill(input: { bill: SansadBill; docs: FetchedDoc[]; indiaCode: Corroboration | null; query?: string; recordUrl?: string }): Verification {
  const { bill, docs, indiaCode, query } = input;
  const stage = stageOf(bill);
  const checks: Check[] = [];
  const byKind = new Map(docs.map((doc) => [doc.kind, doc]));
  const readable = docs.filter((doc) => doc.pages && doc.pages.join("").replace(/\s+/g, "").length > 200 && englishShare(doc.pages) >= 0.25);
  const englishOf = (doc: FetchedDoc) => doc.pages!.filter((_, index) => englishPages(doc.pages!)[index]);
  const recordSource = [{ label: "Digital Sansad bill register", url: "https://sansad.in/ls/legislation/bills" }];

  // 1. Parliament's own record.
  checks.push({
    id: "record",
    label: "Listed in Parliament’s bill register",
    status: "pass",
    detail: `Digital Sansad lists ${bill.title} as Bill No. ${bill.number} of ${bill.year} (${bill.house}${bill.ministry ? `, ${bill.ministry.toLowerCase()} ministry` : ""}), status “${bill.status}”.`,
    sources: recordSource,
  });

  // 2. Is this the bill the user asked for?
  if (query) {
    const score = titleScore(query, bill.title);
    checks.push({
      id: "match",
      label: "Matches what you asked for",
      status: score >= 0.75 ? "pass" : "info",
      detail: score >= 0.75 ? `Your search “${query}” matches this bill’s title.` : `Your search “${query}” is a partial match for this bill. Check the title is the one you meant.`,
      sources: [],
    });
  }

  // 3. Each downloaded document is what it is labelled as, and is this bill.
  const identityProblems: string[] = [];
  const identityOk: string[] = [];
  const bannerProblems: string[] = [];
  const bannerOk: string[] = [];
  const bannerUnknown: string[] = [];
  for (const doc of readable) {
    // Bilingual documents can open with Hindi, so read several pages before deciding the title is absent.
    const first = englishOf(doc).slice(0, 6).join(" ");
    const facts = printedFacts(englishOf(doc));
    // Compare the distinctive words of the title (without a trailing "(Amendment of section 2, etc.)" clause or the year,
    // which can differ between versions of the same bill) against the letters-only text.
    const core = bill.title.replace(/\((?:amendment|insertion|substitution|omission)\s+of[^)]*\)\.?\s*$/i, "").replace(/\b(19|20)\d\d\b/g, "");
    const wanted = distinctiveTokens(core).filter((token) => token.length >= 3);
    const flat = lettersOnly(first);
    const titleOk = wanted.length > 0 && wanted.every((token) => flat.includes(token));
    const numberOk = facts.billNumber === null ? true : facts.billNumber === bill.number;
    if (doc.kind === "errata" || doc.kind === "committee_report" || doc.kind === "synopsis") continue;
    if (titleOk && numberOk) identityOk.push(doc.label);
    else identityProblems.push(`${doc.label}${!titleOk ? " (title not found)" : ""}${!numberOk ? ` (prints Bill No. ${facts.billNumber}, expected ${bill.number})` : ""}`);
    const banner = BANNERS[doc.kind];
    if (banner) {
      const head = squash(englishOf(doc).slice(0, 3).join(" "));
      if (banner.test(head)) bannerOk.push(doc.label);
      // Older bills have no such heading, which proves nothing. Only a heading for a *different* version is a problem.
      else if (Object.entries(BANNERS).some(([kind, other]) => kind !== doc.kind && other && other.test(head))) bannerProblems.push(doc.label);
      else bannerUnknown.push(doc.label);
    }
  }
  const textDocs = docs.filter((doc) => ["introduced", "passed_lok_sabha", "passed_rajya_sabha", "passed_both_houses"].includes(doc.kind));
  checks.push({
    id: "identity",
    label: "The documents are this bill",
    status: identityProblems.length ? "fail" : identityOk.length ? "pass" : "unavailable",
    detail: identityProblems.length
      ? `Problem: ${identityProblems.join("; ")}.`
      : identityOk.length
        ? `The title and Bill No. printed in ${identityOk.length === 1 ? "the document" : `all ${identityOk.length} documents`} match Parliament’s record.`
        : textDocs.length
          ? "The documents have no readable text (they may be scanned images), so their identity could not be checked."
          : "No bill text was available to check.",
    sources: textDocs.map((doc) => ({ label: doc.label, url: doc.url })),
  });
  checks.push({
    id: "versions",
    label: "Each version is what its label says",
    status: bannerProblems.length ? "fail" : bannerOk.length ? "pass" : "unavailable",
    detail: bannerProblems.length ? `Not as labelled: ${bannerProblems.join("; ")}.` : bannerOk.length ? `The printed headings (“as introduced”, “as passed by…”) match the register’s labels for ${bannerOk.join(", ").toLowerCase()}.${bannerUnknown.length ? ` ${bannerUnknown.join(", ")} carry no such heading (common in older bills), so they could not be checked this way.` : ""}` : "These documents carry no “as introduced / as passed by” heading (common in older bills), so their version could not be checked this way.",
    sources: [],
  });

  // 4. Dates in order, and consistent with the documents.
  const dates: Array<[string, string | null]> = [["introduced", bill.introducedDate], ["passed by the Lok Sabha", bill.passedLokSabha], ["passed by the Rajya Sabha", bill.passedRajyaSabha], ["assent", bill.assentDate]];
  const present = dates.filter((entry): entry is [string, string] => entry[1] !== null);
  const outOfOrder = present.some((entry, index) => index > 0 && entry[1] < present[index - 1][1] && !(entry[0] === "passed by the Lok Sabha" && present[index - 1][0] === "passed by the Rajya Sabha"));
  const ordered = [bill.introducedDate, bill.passedLokSabha, bill.passedRajyaSabha, bill.assentDate].filter((value): value is string => value !== null);
  const lsrsFlip = bill.passedLokSabha && bill.passedRajyaSabha && bill.passedRajyaSabha < bill.passedLokSabha; // a bill can start in the Rajya Sabha
  checks.push({
    id: "dates",
    label: "Dates are in a possible order",
    status: (outOfOrder && !lsrsFlip) || ordered.some((value) => value > new Date().toISOString().slice(0, 10)) ? "fail" : present.length > 1 ? "pass" : "info",
    detail: present.length > 1 ? `Parliament’s record gives: ${present.map(([label, value]) => `${label} ${value}`).join("; ")}. No date is out of sequence or in the future.` : "Only one date is on record, so there is no sequence to check.",
    sources: recordSource,
  });

  // 5. For enacted bills: does the official PDF print the same assent date and Act number?
  const both = byKind.get("passed_both_houses");
  const printed = both?.pages ? printedFacts(englishOf(both)) : null;
  if (stage.code === "enacted") {
    // Compare whatever the document prints: assent, Act number, and the date each House passed it.
    const compared: string[] = [];
    const problems: string[] = [];
    const soft: string[] = [];
    if (printed) {
      if (printed.assentDate && bill.assentDate) (printed.assentDate === bill.assentDate ? compared : problems).push(printed.assentDate === bill.assentDate ? `assent on ${printed.assentDate}` : `assent ${printed.assentDate} vs ${bill.assentDate}`);
      if (printed.actNo && bill.actNo) (Number(printed.actNo) === Number(bill.actNo) && printed.actYear === bill.actYear ? compared : problems).push(Number(printed.actNo) === Number(bill.actNo) && printed.actYear === bill.actYear ? `Act No. ${printed.actNo} of ${printed.actYear}` : `Act No. ${printed.actNo} of ${printed.actYear} vs ${bill.actNo} of ${bill.actYear}`);
      // Passing dates are secondary to assent and the Act number, so a difference is reported but does not void the record.
      if (printed.lokSabhaDate && bill.passedLokSabha) (printed.lokSabhaDate === bill.passedLokSabha ? compared : soft).push(printed.lokSabhaDate === bill.passedLokSabha ? `Lok Sabha passing on ${printed.lokSabhaDate}` : `Lok Sabha passing: the document says ${printed.lokSabhaDate}, the register says ${bill.passedLokSabha}`);
      if (printed.rajyaSabhaDate && bill.passedRajyaSabha) (printed.rajyaSabhaDate === bill.passedRajyaSabha ? compared : soft).push(printed.rajyaSabhaDate === bill.passedRajyaSabha ? `Rajya Sabha passing on ${printed.rajyaSabhaDate}` : `Rajya Sabha passing: the document says ${printed.rajyaSabhaDate}, the register says ${bill.passedRajyaSabha}`);
    }
    checks.push({
      id: "printed",
      label: "The official text prints the same assent, Act number and passing dates",
      status: problems.length ? "fail" : soft.length ? "info" : compared.length ? "pass" : "unavailable",
      detail: problems.length
        ? `Discrepancy between the register and the document: ${problems.join("; ")}.`
        : soft.length
          ? `${compared.length ? `Agrees on ${compared.join(", ")}. ` : ""}But the two official records differ on a passing date (${soft.join("; ")}). That does not affect whether it became law, and Anvaya cannot tell which date is right, so both are shown.`
          : compared.length
            ? `The version passed by both Houses prints ${compared.join(", ")}. Each agrees with the register.`
            : "The version passed by both Houses was not available or does not print its assent details, so this could not be compared.",
      sources: sourceOf(both),
    });

    // 6. India Code: a second, separate official source.
    if (indiaCode) {
      if (indiaCode.status === "found") {
        checks.push({
          id: "indiacode",
          label: "Confirmed on India Code",
          status: "pass",
          detail: `India Code (the Legislative Department’s statute book) lists ${indiaCode.act.title} as Act No. ${indiaCode.act.actNumber} of ${indiaCode.act.actYear}${indiaCode.act.enactDate ? `, enacted ${indiaCode.act.enactDate}` : ""}${indiaCode.act.repealed ? ". It is marked as repealed." : "."}`,
          sources: [{ label: "India Code", url: indiaCode.act.url }],
        });
      } else if (indiaCode.status === "mismatch") {
        // Same Act number, year and title, but a different enactment date. The Act exists, so the record is not voided;
        // the disagreement is shown, and called an index error when the date is impossible (before the bill passed).
        const passed = bill.passedRajyaSabha ?? bill.passedLokSabha ?? bill.introducedDate;
        const impossible = !!indiaCode.act.enactDate && !!passed && indiaCode.act.enactDate < passed;
        checks.push({
          id: "indiacode",
          label: "Confirmed on India Code",
          status: "info",
          detail: `India Code lists ${indiaCode.act.title} as Act No. ${indiaCode.act.actNumber} of ${indiaCode.act.actYear}, which matches. But the two official sources give different enactment dates: ${indiaCode.reason}${impossible ? ` India Code’s date is earlier than the date Parliament passed the bill (${passed}), so it looks like an error in India Code’s index rather than in Parliament’s record.` : " Anvaya cannot tell which is right, so both are shown."}`,
          sources: [{ label: "India Code", url: indiaCode.act.url }],
        });
      } else if (indiaCode.status === "not_found") {
        checks.push({ id: "indiacode", label: "Confirmed on India Code", status: "unavailable", detail: `India Code does not list this Act (checked ${indiaCode.checked}). India Code does not always carry amending Acts as separate entries, so this is not a sign of a problem; the other checks stand.`, sources: [] });
      } else {
        checks.push({ id: "indiacode", label: "Confirmed on India Code", status: "unavailable", detail: `India Code could not be reached (${indiaCode.reason}).`, sources: [] });
      }
    }

    // 7. Gazette copy, when Parliament links one.
    const gazette = byKind.get("gazette");
    if (gazette) {
      const gazetteEnglish = gazette.pages ? englishOf(gazette) : [];
      const facts = gazetteEnglish.length ? printedFacts(gazetteEnglish) : null;
      const compact = gazetteEnglish.slice(0, 2).join(" ").replace(/\s+/g, "").toLowerCase();
      const assent = compact.match(/assentofthepresidentonthe(\d{1,2}(?:st|nd|rd|th)?[a-z]{3,9},?\d{4})/);
      const gazetteAssent = assent ? parseDate(assent[1]) : facts?.assentDate ?? null;
      checks.push({
        id: "gazette",
        label: "The Gazette copy agrees",
        status: !gazette.pages ? "unavailable" : gazetteAssent && bill.assentDate ? (gazetteAssent === bill.assentDate ? "pass" : "fail") : "unavailable",
        detail: gazetteAssent && bill.assentDate ? (gazetteAssent === bill.assentDate ? `The Gazette copy records assent on ${gazetteAssent}, the same date as the register.` : `The Gazette copy records assent on ${gazetteAssent}; the register says ${bill.assentDate}.`) : "The Gazette copy could not be read for an assent date.",
        sources: sourceOf(gazette),
      });
    }
  }

  // 8. Commencement, quoted from the text, never inferred.
  // The authoritative version first, then earlier versions: a bill's start-date clause rarely changes.
  const textVersions = ["act_text", "passed_both_houses", "passed_rajya_sabha", "passed_lok_sabha", "introduced"].map((kind) => byKind.get(kind as BillFileKind)).filter((d): d is FetchedDoc => !!d);
  const primary = textVersions[0];
  const commencement = textVersions.map((d) => findCommencement(d)).find(Boolean) ?? null;
  checks.push({
    id: "commencement",
    label: "When it comes into force",
    status: "info",
    detail: commencement
      ? `The text itself says: “${commencement.quote}” (page ${commencement.page}). Anvaya has not checked whether a start date has since been notified.`
      : stage.isLaw
        ? "The text has no single start-date clause that Anvaya could find. Some provisions may state their own dates, and a Gazette notification may set others. Anvaya has not confirmed any."
        : "Not applicable until the bill is passed and receives assent.",
    sources: sourceOf(textVersions.find((d) => findCommencement(d)) ?? primary),
  });

  // Level.
  const failed = checks.some((check) => check.status === "fail");
  const corePass = checks.find((check) => check.id === "record")?.status === "pass" && checks.find((check) => check.id === "identity")?.status === "pass";
  const corroborated = stage.isLaw && (checks.find((check) => check.id === "indiacode")?.status === "pass" || (checks.find((check) => check.id === "printed")?.status === "pass" && checks.find((check) => check.id === "gazette")?.status === "pass"));
  const level: Verification["level"] = failed ? "failed" : corePass ? (corroborated ? "corroborated" : "verified") : "partly";
  const headline =
    level === "failed"
      ? "A check found a discrepancy, so Anvaya cannot vouch for this record"
      : level === "corroborated"
        ? "Verified against Parliament’s record, the official documents and a second official source"
        : level === "verified"
          ? "Verified against Parliament’s official record and the official documents"
          : "Partly verified: some checks could not be run";

  const limitations = [
    "Parliament’s register is the authority on a bill’s stage. Anvaya checks it against the documents but cannot see anything Parliament has not recorded.",
    ...(stage.isLaw ? ["A bill that has become an Act may later be amended or have start dates notified. Anvaya has not checked for later changes."] : []),
  ];
  return { level, headline, checkedAt: new Date().toISOString(), stage, checks, commencement, limitations };
}
