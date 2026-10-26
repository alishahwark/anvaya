import type { LegislativeRecord } from "@/data/fixtures/legislative-records";

export type CitizenBrief = {
  plainLanguageSummary: string;
  purpose: string;
  whatChanges: string[];
  effectiveNow: string;
  startsLater: string;
  affected: string[];
  uncertainties: string;
};

const dpdpBrief: CitizenBrief = {
  plainLanguageSummary: "The Digital Personal Data Protection Act creates a framework for how organisations handle digital personal data in India. It gives people rights over their personal data, sets duties for organisations that decide how data is processed, and creates enforcement powers for the Data Protection Board.",
  purpose: "The law is intended to protect people’s digital personal data while allowing organisations to process data for lawful purposes.",
  whatChanges: [
    "People can ask about and exercise rights connected to personal data, subject to the provisions that have commenced.",
    "Data fiduciaries must use lawful, transparent practices and meet duties set out in the Act when the relevant provisions apply.",
    "The Act establishes the Data Protection Board and provides for enforcement and penalties.",
  ],
  effectiveNow: "The commencement notification places the listed Group A provisions into effect from 13 November 2025. This does not make every section of the Act operative.",
  startsLater: "The notification schedules additional provisions for 13 November 2026 and 13 May 2027. The Rules have a separate timetable.",
  affected: ["Individuals and data principals", "Businesses and other data fiduciaries", "Consent managers", "The Data Protection Board and public authorities"],
  uncertainties: "The December 2025 Rules corrigendum has not been imported into the local evidence set. The page therefore does not claim that every right, duty, or procedure is currently operational.",
};

export function citizenBriefFor(record: LegislativeRecord): CitizenBrief {
  if (record.slug === "dpdp-act-2023") return dpdpBrief;
  return { plainLanguageSummary: record.sources.length ? record.summary : "This record does not yet have enough authenticated source material for a citizen-facing explanation.", purpose: "Not established by the available sources.", whatChanges: [], effectiveNow: "No commencement claim is verified.", startsLater: "No future commencement date is verified.", affected: [], uncertainties: record.currentInformation };
}
