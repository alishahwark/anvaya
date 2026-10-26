import type { OfficialDocument } from "./types";

const MEITY = "Ministry of Electronics and Information Technology, Government of India";

/**
 * The official DPDP source library. Every file below is a government-published
 * PDF that was downloaded from the URL shown and stored under data/source-inbox.
 * Where an official PDF opens with a Hindi section, `firstEnglishPage` marks the
 * start of the English text.
 */
export const dpdpDocuments: OfficialDocument[] = [
  {
    key: "act",
    title: "The Digital Personal Data Protection Act, 2023",
    identifier: "Act No. 22 of 2023",
    kind: "The Act of Parliament",
    publisher: MEITY,
    publishedDate: "2023-08-11",
    url: "https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023.pdf",
    localFile: "data/source-inbox/Digital-Personal-Data-Protection-Act-2023.pdf",
    firstEnglishPage: 1,
    whyItMatters: "The law itself: who it applies to, what organisations must do, what people can ask for, and the penalties.",
  },
  {
    key: "notification",
    title: "Commencement notification",
    identifier: "G.S.R. 843(E)",
    kind: "Gazette notification",
    publisher: MEITY,
    publishedDate: "2025-11-13",
    url: "https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf",
    localFile: "data/source-inbox/c56ceae6c383460ca69577428d36828b.pdf",
    firstEnglishPage: 2,
    whyItMatters: "Says exactly which sections switch on now, after one year, and after eighteen months.",
  },
  {
    key: "board",
    title: "Establishment of the Data Protection Board of India",
    identifier: "G.S.R. 844(E)",
    kind: "Gazette notification",
    publisher: MEITY,
    publishedDate: "2025-11-13",
    url: "https://www.meity.gov.in/static/uploads/2025/11/cc217843dc3bcb37b2b05bcc3b4e031f.pdf",
    localFile: "data/source-inbox/cc217843dc3bcb37b2b05bcc3b4e031f.pdf",
    firstEnglishPage: 2,
    whyItMatters: "Creates the regulator that will receive complaints and impose penalties.",
  },
  {
    key: "rules",
    title: "The Digital Personal Data Protection Rules, 2025",
    identifier: "G.S.R. 846(E)",
    kind: "Rules made under the Act",
    publisher: MEITY,
    publishedDate: "2025-11-13",
    url: "https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf",
    localFile: "data/source-inbox/53450e6e5dc0bfa85ebd78686cadad39.pdf",
    firstEnglishPage: 24,
    whyItMatters: "The practical detail: what a privacy notice must contain, security minimums, breach reporting, retention and children's data.",
  },
  {
    key: "corrigendum",
    title: "Corrigendum to the Rules",
    identifier: "G.S.R. 892(E)",
    kind: "Gazette corrigendum",
    publisher: MEITY,
    publishedDate: "2025-12-11",
    url: "https://www.meity.gov.in/static/uploads/2025/12/3c7ebbae0e5456f493f486e6845df86b.pdf",
    localFile: "data/source-inbox/3c7ebbae0e5456f493f486e6845df86b.pdf",
    firstEnglishPage: 1,
    whyItMatters: "Corrects wording and cross-reference slips in the Rules; read it alongside the Rules.",
  },
  {
    key: "rod",
    title: "Removal of Difficulties Order, 2026",
    identifier: "S.O. 5458(E)",
    kind: "Gazette order",
    publisher: MEITY,
    publishedDate: "2026-10-06",
    url: "https://www.meity.gov.in/static/uploads/2026/10/daf495a7b5798a3dfa72a944b51fc176.pdf",
    localFile: "data/source-inbox/daf495a7b5798a3dfa72a944b51fc176.pdf",
    firstEnglishPage: 2,
    whyItMatters: "The most recent official change to the Act's text: two small drafting fixes in sections 9 and 10.",
  },
];
