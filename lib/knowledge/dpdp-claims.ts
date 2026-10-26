import type { EvidenceClaim } from "./types";

/**
 * Claim registry for the Digital Personal Data Protection Act, 2023 and the
 * 2025 Rules. Each claim is a plain-language assertion; each evidence quote is
 * verbatim from the stated page of the official PDF and is mechanically checked
 * by `npm run knowledge:verify`.
 *
 * "analyst_inference" claims are our reading of what the text means in practice
 * and are shown to citizens as such.
 */
export const dpdpClaims: EvidenceClaim[] = [
  // ───────────── Lifecycle: assent, notification, rules, corrections ─────────────
  {
    id: "life.assent",
    claimType: "lifecycle",
    claim: "The Act is Act No. 22 of 2023 and received the President's assent on 11 August 2023.",
    evidence: [
      { doc: "act", page: 1, section: "Title and Gazette header", quote: "received the assent of the President on the 11th August, 2023" },
      { doc: "act", page: 1, section: "Title", quote: "THE DIGITAL PERSONAL DATA PROTECTION ACT, 2023 (N O . 22 OF 2023)" },
    ],
  },
  {
    id: "life.staged-power",
    claimType: "statutory_text",
    claim: "The Act lets the Central Government switch it on by notification, with different dates for different provisions.",
    evidence: [{ doc: "act", page: 1, section: "Section 1(2)", quote: "different dates may be appointed for different provisions of this Act" }],
  },
  {
    id: "life.notification-date",
    claimType: "lifecycle",
    claim: "The commencement notification G.S.R. 843(E) was issued on 13 November 2025.",
    evidence: [{ doc: "notification", page: 2, section: "Notification", quote: "New Delhi, the 13 th November , 2025 G.S.R. 843 (E)" }],
  },
  {
    id: "life.phase-1",
    claimType: "lifecycle",
    claim: "On 13 November 2025 (the date of publication) section 1(2), section 2, sections 18 to 26, 35 and 38 to 43, and section 44(1) and (3) came into force.",
    evidence: [
      {
        doc: "notification",
        page: 2,
        section: "Clause (a)",
        quote: "sub - section (2) of section 1, section 2, sections 18 to 26 sections 35, 38, 39, 40, 41, 42, 43, and sub - sections (1) and (3) of section 44",
      },
    ],
  },
  {
    id: "life.phase-2",
    claimType: "lifecycle",
    claim: "One year after publication (13 November 2026), section 6(9) and section 27(1)(d) come into force.",
    evidence: [
      {
        doc: "notification",
        page: 2,
        section: "Clause (b)",
        quote: "one year from the date of publication of this gazette on which the provisions of sub - section (9) of section 6 and clause (d) of sub - section (1) of section 27",
      },
    ],
  },
  {
    id: "life.phase-3",
    claimType: "lifecycle",
    claim: "Eighteen months after publication (13 May 2027), sections 3 to 5, 6(1)–(8) and (10), 7 to 17, the rest of 27, 28 to 34, 36, 37 and section 44(2) come into force.",
    evidence: [
      {
        doc: "notification",
        page: 2,
        section: "Clause (c)",
        quote: "eighteen months from the date of publication of this gazette, on which the provision of sections 3 to 5, sub - sections (1) to (8) and (10) of section 6,sections 7 to 10, sections 11 to 17, section 27 except clause (d)",
      },
      { doc: "notification", page: 2, section: "Clause (c)", quote: "sections 28 to 34, 36, 37 and sub - section (2) of section 44" },
    ],
  },
  {
    id: "life.board-established",
    claimType: "lifecycle",
    claim: "The Data Protection Board of India was established by notification with effect from 13 November 2025, with its head office in the National Capital Region.",
    evidence: [
      { doc: "board", page: 2, section: "Paragraph 1", quote: "hereby establishes, the Data Protection Board of India" },
      { doc: "board", page: 2, section: "Paragraph 1", quote: "with effect from the date of publication of this notification in the Official Gazette" },
      { doc: "board", page: 2, section: "Paragraph 2", quote: "The head office of the Data Protection Board of India shall be in the National Capital Region of India" },
    ],
  },
  {
    id: "life.draft-rules",
    claimType: "lifecycle",
    claim: "Draft Rules were published on 3 January 2025 for objections and suggestions before the final Rules were made.",
    evidence: [
      { doc: "rules", page: 24, section: "Preamble", quote: "draft of the Digital Personal Data Protection Rules, 2025 were published" },
      { doc: "rules", page: 24, section: "Preamble", quote: "dated the 3 rd January, 2025" },
    ],
  },
  {
    id: "life.rules-made",
    claimType: "lifecycle",
    claim: "The final Digital Personal Data Protection Rules, 2025 were notified on 13 November 2025 as G.S.R. 846(E).",
    evidence: [
      { doc: "rules", page: 24, section: "Preamble", quote: "New Delhi, the 13 th November, 2025 G.S.R. 846 (E)" },
      { doc: "rules", page: 24, section: "Preamble", quote: "the Central Government hereby makes the following rules" },
    ],
  },
  {
    id: "life.rules-schedule",
    claimType: "lifecycle",
    claim: "The Rules have their own commencement schedule: Rules 1, 2 and 17–21 on publication, Rule 4 after one year, and Rules 3, 5–16, 22 and 23 after eighteen months.",
    evidence: [
      { doc: "rules", page: 24, section: "Rule 1(2)", quote: "Rules 1, 2 and 17 to 21 shall come into force on the date of their publication" },
      { doc: "rules", page: 24, section: "Rule 1(3)", quote: "Rule 4 shall come into force one year after the date of publication" },
      { doc: "rules", page: 24, section: "Rule 1(4)", quote: "Rules 3, 5 to 16, 22 and 23 shall come into force eighteen months after" },
    ],
  },
  {
    id: "life.corrigendum",
    claimType: "lifecycle",
    claim: "Corrigendum G.S.R. 892(E) of December 2025 corrects wording and cross-references in the Rules text (for example “of this Gazette” becomes “in the Official Gazette”).",
    evidence: [
      { doc: "corrigendum", page: 1, section: "Corrigendum", quote: "G.S.R. 892 (E)" },
      { doc: "corrigendum", page: 1, section: "Item (i)", quote: "for “of this Gazette”, read “in the Official Gazette" },
      { doc: "corrigendum", page: 1, section: "Item (iv)(b)", quote: "for “(18 or 2013)”, read “(18 of 2013)”" },
    ],
  },
  {
    id: "life.rod-order",
    claimType: "lifecycle",
    claim: "A Removal of Difficulties Order (S.O. 5458(E)), published in October 2026, makes two drafting fixes to the Act: section 9(1) now reads “child or of a person with disability” and section 10(2)(c)(ii) refers to “data audit”.",
    evidence: [
      { doc: "rod", page: 3, section: "Paragraph 1", quote: "This Order may be called the Digital Personal Data Protection (Removal of Difficulties) Order, 2026" },
      { doc: "rod", page: 3, section: "Paragraph 2(i)", quote: "the words “child or of a person with disability ”shall be substituted" },
      { doc: "rod", page: 3, section: "Paragraph 2(ii)", quote: "for the word “audit”, the words “data audit” shall be substituted" },
    ],
  },
  {
    id: "life.rod-editorial",
    claimType: "lifecycle",
    claim: "The Order describes the difficulties it removes as textual and editorial in nature.",
    evidence: [{ doc: "rod", page: 3, section: "Preamble", quote: "which are textual, editorial in nature" }],
  },

  // ───────────── Scope: who and what the Act covers ─────────────
  {
    id: "scope.purpose",
    claimType: "statutory_text",
    claim: "The Act exists to regulate processing of digital personal data while recognising both people's right to protect their data and the need to process it for lawful purposes.",
    evidence: [
      {
        doc: "act",
        page: 1,
        section: "Long title",
        quote: "the processing of digital personal data in a manner that recognises both the right of individuals to protect their personal data and the need to process such personal data for lawful purposes",
      },
    ],
  },
  {
    id: "scope.territory",
    claimType: "statutory_text",
    claim: "The Act applies to digital personal data processed in India, including data collected on paper and digitised later.",
    evidence: [
      { doc: "act", page: 3, section: "Section 3(a)", quote: "apply to the processing of digital personal data within the territory of India" },
      { doc: "act", page: 3, section: "Section 3(a)(ii)", quote: "in non-digital form and digitised subsequently" },
    ],
  },
  {
    id: "scope.extraterritorial",
    claimType: "statutory_text",
    claim: "It also applies outside India when the processing relates to offering goods or services to people in India.",
    evidence: [
      {
        doc: "act",
        page: 3,
        section: "Section 3(b)",
        quote: "also apply to processing of digital personal data outside the territory of India, if such processing is in connection with any activity related to offering of goods or services to Data Principals within the territory of India",
      },
    ],
  },
  {
    id: "scope.fiduciary",
    claimType: "statutory_text",
    claim: "A “Data Fiduciary” is any person who decides why and how personal data is processed, alone or with others.",
    evidence: [{ doc: "act", page: 2, section: "Section 2(i)", quote: "means any person who alone or in conjunction with other persons determines the purpose and means of processing of personal data" }],
  },
  {
    id: "scope.person-includes-business",
    claimType: "statutory_text",
    claim: "“Person” covers companies, firms, associations, the State and individuals, so a business of any form can be a Data Fiduciary.",
    evidence: [{ doc: "act", page: 3, section: "Section 2(s)", quote: "a company; ( iv ) a firm; ( v ) an association of persons or a body of individuals" }],
  },
  {
    id: "scope.principal",
    claimType: "statutory_text",
    claim: "A “Data Principal” is the individual the data is about; for a child this includes the parent or lawful guardian.",
    evidence: [
      { doc: "act", page: 2, section: "Section 2(j)", quote: "means the individual to whom the personal data relates" },
      { doc: "act", page: 2, section: "Section 2(j)(i)", quote: "includes the parents or lawful guardian of such a child" },
    ],
  },
  {
    id: "scope.child-18",
    claimType: "statutory_text",
    claim: "A “child” is anyone under eighteen.",
    evidence: [{ doc: "act", page: 2, section: "Section 2(f)", quote: "means an individual who has not completed the age of eighteen years" }],
  },
  {
    id: "scope.personal-domestic",
    claimType: "statutory_text",
    claim: "The Act does not apply to data an individual processes for purely personal or domestic purposes, or to data a person has made public themselves.",
    evidence: [
      { doc: "act", page: 4, section: "Section 3(c)(i)", quote: "personal data processed by an individual for any personal or domestic purpose" },
      { doc: "act", page: 4, section: "Section 3(c)(ii)(A)", quote: "the Data Principal to whom such personal data relates" },
    ],
  },

  // ───────────── Duties of organisations (Data Fiduciaries) ─────────────
  {
    id: "inference.smb-tasks",
    claimType: "analyst_inference",
    claim: "Our reading: a small business preparing for the main duties would in practice need to know what personal data it holds, redo its notices and consent screens, review contracts with vendors that handle the data, and prepare a breach-response routine.",
    evidence: [
      { doc: "rules", page: 24, section: "Rule 3(b)(i)", quote: "an itemised description of such personal data" },
      { doc: "act", page: 5, section: "Section 6(1)", quote: "free, specific, informed, unconditional and unambiguous with a clear affirmative action" },
      { doc: "rules", page: 26, section: "Rule 6(1)(f)", quote: "appropriate provision in the contract entered into between such Data Fiduciary and such a Data Processor" },
      { doc: "rules", page: 26, section: "Rule 7(2)(b)", quote: "within seventy - two hours of becoming aware of the breach" },
    ],
  },
  {
    id: "duty.lawful-basis",
    claimType: "statutory_text",
    claim: "Personal data may be processed only for a lawful purpose, with the person's consent or under one of the Act's “certain legitimate uses”.",
    evidence: [
      { doc: "act", page: 4, section: "Section 4(1)", quote: "only in accordance with the provisions of this Act and for a lawful purpose" },
      { doc: "act", page: 4, section: "Section 4(1)(b)", quote: "for certain legitimate uses" },
    ],
  },
  {
    id: "duty.notice",
    claimType: "statutory_text",
    claim: "Every consent request must come with, or after, a notice saying what data is collected, why, how to exercise rights and how to complain to the Board.",
    evidence: [
      { doc: "act", page: 4, section: "Section 5(1)", quote: "shall be accompanied or preceded by a notice given by the Data Fiduciary to the Data Principal" },
      { doc: "act", page: 4, section: "Section 5(1)(iii)", quote: "the manner in which the Data Principal may make a complaint to the Board" },
    ],
  },
  {
    id: "duty.notice-existing",
    claimType: "statutory_text",
    claim: "For people who consented before the Act started, the business must send a notice as soon as reasonably practicable and may keep processing until consent is withdrawn.",
    evidence: [
      { doc: "act", page: 4, section: "Section 5(2)(a)", quote: "the Data Fiduciary shall, as soon as it is reasonably practicable, give to the Data Principal a notice" },
      { doc: "act", page: 5, section: "Section 5(2)(b)", quote: "may continue to process the personal data until and unless the Data Principal withdraws her consent" },
    ],
  },
  {
    id: "duty.notice-rules",
    claimType: "implementation",
    claim: "Under the Rules the notice must be understandable on its own, in plain language, with an itemised description of the data and the specific purpose.",
    evidence: [
      { doc: "rules", page: 24, section: "Rule 3(a)", quote: "be presented and be understandable independently of any other information" },
      { doc: "rules", page: 24, section: "Rule 3(b)(i)", quote: "an itemised description of such personal data" },
    ],
  },
  {
    id: "duty.notice-language",
    claimType: "statutory_text",
    claim: "Notices and consent requests must be available in English or any language in the Eighth Schedule to the Constitution.",
    evidence: [{ doc: "act", page: 5, section: "Section 5(3)", quote: "in English or any language specified in the Eighth Schedule to the Constitution" }],
  },
  {
    id: "duty.consent-quality",
    claimType: "statutory_text",
    claim: "Consent must be free, specific, informed, unconditional and unambiguous, given by a clear affirmative action, and limited to the data necessary for the stated purpose.",
    evidence: [
      { doc: "act", page: 5, section: "Section 6(1)", quote: "free, specific, informed, unconditional and unambiguous with a clear affirmative action" },
      { doc: "act", page: 5, section: "Section 6(1)", quote: "limited to such personal data as is necessary for such specified purpose" },
    ],
  },
  {
    id: "duty.consent-withdraw",
    claimType: "statutory_text",
    claim: "People can withdraw consent at any time, and withdrawing must be about as easy as giving it.",
    evidence: [{ doc: "act", page: 5, section: "Section 6(4)", quote: "right to withdraw her consent at any time, with the ease of doing so being comparable to the ease with which such consent was given" }],
  },
  {
    id: "duty.burden-of-proof",
    claimType: "statutory_text",
    claim: "If consent is disputed, the business must prove it gave notice and obtained consent in line with the Act.",
    evidence: [{ doc: "act", page: 6, section: "Section 6(10)", quote: "the Data Fiduciary shall be obliged to prove that a notice was given" }],
  },
  {
    id: "duty.legitimate-uses",
    claimType: "statutory_text",
    claim: "Besides consent, data may be processed for listed “legitimate uses”, such as a purpose the person voluntarily provided data for, legal obligations, medical emergencies and employment.",
    evidence: [
      { doc: "act", page: 6, section: "Section 7(a)", quote: "for the specified purpose for which the Data Principal has voluntarily provided her personal data" },
      { doc: "act", page: 7, section: "Section 7(f)", quote: "for responding to a medical emergency" },
      { doc: "act", page: 7, section: "Section 7(i)", quote: "for the purposes of employment or those related to safeguarding the employer from loss or liability" },
    ],
  },
  {
    id: "duty.responsible",
    claimType: "statutory_text",
    claim: "The business stays responsible for compliance even when a Data Processor does the work, and whatever a contract says.",
    evidence: [{ doc: "act", page: 7, section: "Section 8(1)", quote: "irrespective of any agreement to the contrary or failure of a Data Principal to carry out the duties provided under this Act, be responsible for complying" }],
  },
  {
    id: "duty.processor-contract",
    claimType: "statutory_text",
    claim: "A business may use a Data Processor to offer goods or services only under a valid contract.",
    evidence: [{ doc: "act", page: 7, section: "Section 8(2)", quote: "only under a valid contract" }],
  },
  {
    id: "duty.accuracy",
    claimType: "statutory_text",
    claim: "If data will be used to make a decision about a person, or shared with another Data Fiduciary, the business must ensure it is complete, accurate and consistent.",
    evidence: [{ doc: "act", page: 7, section: "Section 8(3)", quote: "shall ensure its completeness, accuracy and consistency" }],
  },
  {
    id: "duty.security",
    claimType: "statutory_text",
    claim: "A business must protect personal data it holds with reasonable security safeguards to prevent a personal data breach.",
    evidence: [
      { doc: "act", page: 7, section: "Section 8(5)", quote: "by taking reasonable security safeguards to prevent personal data breach" },
      { doc: "act", page: 7, section: "Section 8(4)", quote: "appropriate technical and organisational measures" },
    ],
  },
  {
    id: "duty.security-rules",
    claimType: "implementation",
    claim: "The Rules set minimum safeguards: encryption/masking/tokens, access control, logging and monitoring, backups, a one-year log retention, and security terms in processor contracts.",
    evidence: [
      { doc: "rules", page: 26, section: "Rule 6(1)(a)", quote: "securing of personal data through encryption, obfuscation, masking or the use of virtual tokens" },
      { doc: "rules", page: 26, section: "Rule 6(1)(c)", quote: "through appropriate logs, monitoring and review" },
      { doc: "rules", page: 26, section: "Rule 6(1)(e)", quote: "retain such logs and personal data for a period of one year" },
      { doc: "rules", page: 26, section: "Rule 6(1)(f)", quote: "appropriate provision in the contract entered into between such Data Fiduciary and such a Data Processor" },
    ],
  },
  {
    id: "duty.breach-act",
    claimType: "statutory_text",
    claim: "After a personal data breach the business must tell the Board and each affected person.",
    evidence: [{ doc: "act", page: 7, section: "Section 8(6)", quote: "give the Board and each affected Data Principal, intimation of such breach" }],
  },
  {
    id: "duty.breach-rules",
    claimType: "implementation",
    claim: "Under the Rules, affected people must be told without delay, and the Board must get a first description without delay and fuller details within 72 hours (unless it allows longer).",
    evidence: [
      { doc: "rules", page: 26, section: "Rule 7(1)", quote: "intimate to each affected Data Principal, in a concise, clear and plain manner and without delay" },
      { doc: "rules", page: 26, section: "Rule 7(2)(b)", quote: "within seventy - two hours of becoming aware of the breach" },
    ],
  },
  {
    id: "duty.erasure",
    claimType: "statutory_text",
    claim: "Unless the law requires retention, a business must erase personal data when consent is withdrawn or once the purpose is no longer served, and have its processors erase it too.",
    evidence: [
      { doc: "act", page: 7, section: "Section 8(7)(a)", quote: "erase personal data, upon the Data Principal withdrawing her consent or as" },
      { doc: "act", page: 8, section: "Section 8(7)(b)", quote: "cause its Data Processor to erase any personal data" },
    ],
  },
  {
    id: "duty.retention-logs",
    claimType: "implementation",
    claim: "The Rules require personal data, traffic data and processing logs to be kept for at least one year, for the purposes in the Seventh Schedule, before erasure.",
    evidence: [{ doc: "rules", page: 27, section: "Rule 8(3)", quote: "for a minimum period of one year from the date of such processing" }],
  },
  {
    id: "duty.erasure-big-platforms",
    claimType: "implementation",
    claim: "Large e-commerce (2 crore+ users), online gaming (50 lakh+ users) and social media (2 crore+ users) companies must erase data three years after the person last used the service, with 48 hours’ prior warning.",
    evidence: [
      { doc: "rules", page: 35, section: "Third Schedule, item 1", quote: "e - commerce entity having not less than two crore registered users in India" },
      { doc: "rules", page: 35, section: "Third Schedule, item 2", quote: "online gaming intermediary having not less than fifty lakh registered users in India" },
      { doc: "rules", page: 36, section: "Third Schedule, item 3", quote: "social media intermediary having not less than two crore registered users in India" },
      { doc: "rules", page: 35, section: "Third Schedule", quote: "Three years from the date on which the Data Principal last approached the Data Fiduciary" },
      { doc: "rules", page: 27, section: "Rule 8(2)", quote: "At least forty - eight hours before completion of the time period for erasure" },
    ],
  },
  {
    id: "duty.contact",
    claimType: "statutory_text",
    claim: "A business must publish contact details of a Data Protection Officer or another person who can answer questions about the data it holds.",
    evidence: [
      { doc: "act", page: 8, section: "Section 8(9)", quote: "the business contact information of a Data Protection Officer" },
      { doc: "rules", page: 27, section: "Rule 9", quote: "shall prominently publish on its website or app" },
    ],
  },
  {
    id: "duty.grievance",
    claimType: "statutory_text",
    claim: "A business must run an effective grievance mechanism, and under the Rules must publish its response period, which may not exceed ninety days.",
    evidence: [
      { doc: "act", page: 8, section: "Section 8(10)", quote: "establish an effective mechanism to redress the grievances of Data Principals" },
      { doc: "rules", page: 30, section: "Rule 14(3)", quote: "within a reasonable period not exceeding ninety days" },
    ],
  },
  {
    id: "duty.rights-channel",
    claimType: "implementation",
    claim: "Businesses must publish how a person can make a request to exercise their rights, and what identifier they need to supply.",
    evidence: [
      { doc: "rules", page: 29, section: "Rule 14(1)", quote: "the Data Fiduciary and, where applicable, the Consent Manager, shall prominently publish on its website or app" },
      { doc: "rules", page: 30, section: "Rule 14(1)(a)", quote: "the details of the means using which a Data Principal may make a request for the exercise of such rights" },
    ],
  },

  // ───────────── Children ─────────────
  {
    id: "children.consent",
    claimType: "statutory_text",
    claim: "Before processing a child’s data, a business must obtain verifiable consent from the parent or lawful guardian.",
    evidence: [{ doc: "act", page: 8, section: "Section 9(1)", quote: "obtain verifiable consent of the parent of such child or the lawful guardian" }],
  },
  {
    id: "children.no-tracking",
    claimType: "statutory_text",
    claim: "Businesses may not track or behaviourally monitor children, or target advertising at them, and may not process data in ways likely to harm a child’s well-being.",
    evidence: [
      { doc: "act", page: 8, section: "Section 9(3)", quote: "shall not undertake tracking or behavioural monitoring of children or targeted advertising directed at children" },
      { doc: "act", page: 8, section: "Section 9(2)", quote: "likely to cause any detrimental effect on the well-being of a child" },
    ],
  },
  {
    id: "children.rules-diligence",
    claimType: "implementation",
    claim: "The Rules require the business to check that the person claiming to be the parent is an identifiable adult.",
    evidence: [{ doc: "rules", page: 27, section: "Rule 10(1)", quote: "ensure that verifiable consent of the parent is obtained before the processing of any personal data of a child" }],
  },
  {
    id: "children.exemptions",
    claimType: "implementation",
    claim: "Some classes of businesses and purposes are exempt from the parental-consent and tracking rules, as listed in the Fourth Schedule.",
    evidence: [{ doc: "rules", page: 29, section: "Rule 12", quote: "shall not be applicable to processing of personal data of a child by such class of Data Fiduciaries as are specified in Part A of Fourth Schedule" }],
  },

  // ───────────── Significant Data Fiduciaries ─────────────
  {
    id: "sdf.designation",
    claimType: "statutory_text",
    claim: "The Government may designate a business or class of businesses as a Significant Data Fiduciary based on factors such as data volume and sensitivity and risk to people’s rights.",
    evidence: [
      { doc: "act", page: 8, section: "Section 10(1)", quote: "may notify any Data Fiduciary or class of Data Fiduciaries as Significant Data Fiduciary" },
      { doc: "act", page: 9, section: "Section 10(1)(a)–(b)", quote: "the volume and sensitivity of personal data processed" },
    ],
  },
  {
    id: "sdf.duties",
    claimType: "statutory_text",
    claim: "A Significant Data Fiduciary must appoint an India-based Data Protection Officer and an independent data auditor, and carry out periodic Data Protection Impact Assessments and audits.",
    evidence: [
      { doc: "act", page: 9, section: "Section 10(2)(a)(ii)", quote: "be based in India" },
      { doc: "act", page: 9, section: "Section 10(2)(b)", quote: "appoint an independent data auditor" },
      { doc: "act", page: 9, section: "Section 10(2)(c)(i)", quote: "periodic Data Protection Impact Assessment" },
    ],
  },
  {
    id: "sdf.rules",
    claimType: "implementation",
    claim: "Under the Rules, a Significant Data Fiduciary must run an impact assessment and audit every twelve months and report significant findings to the Board.",
    evidence: [
      { doc: "rules", page: 29, section: "Rule 13(1)", quote: "once in every period of twelve months from the date on which it is notified as such" },
      { doc: "rules", page: 29, section: "Rule 13(2)", quote: "furnish to the Board a report containing significant observations" },
    ],
  },
  {
    id: "sdf.localisation",
    claimType: "implementation",
    claim: "Significant Data Fiduciaries must ensure that personal data the Government specifies, and its related traffic data, is not transferred outside India.",
    evidence: [{ doc: "rules", page: 29, section: "Rule 13(4)", quote: "is not transferred outside the territory of India" }],
  },
  {
    id: "transfer.act",
    claimType: "statutory_text",
    claim: "Transfers of personal data abroad are allowed except to countries the Central Government restricts by notification.",
    evidence: [{ doc: "act", page: 11, section: "Section 16(1)", quote: "restrict the transfer of personal data by a Data Fiduciary for processing to such country or territory outside India as may be so notified" }],
  },
  {
    id: "transfer.rules",
    claimType: "implementation",
    claim: "Under the Rules, transfers abroad are subject to requirements the Government may specify for making data available to foreign States or entities they control.",
    evidence: [{ doc: "rules", page: 30, section: "Rule 15", quote: "subject to the restriction that the Data Fiduciary shall meet such requirements as the Central Government may" }],
  },

  // ───────────── Rights of individuals ─────────────
  {
    id: "right.access",
    claimType: "statutory_text",
    claim: "People can ask a business they gave consent to for a summary of the personal data it processes and what it does with it, and who it has shared it with.",
    evidence: [
      { doc: "act", page: 9, section: "Section 11(1)(a)", quote: "a summary of personal data which is being processed by such Data Fiduciary and the processing activities" },
      { doc: "act", page: 9, section: "Section 11(1)(b)", quote: "the identities of all other Data Fiduciaries and Data Processors with whom the personal data has been shared" },
    ],
  },
  {
    id: "right.correct-erase",
    claimType: "statutory_text",
    claim: "People have the right to correction, completion, updating and erasure of their personal data, subject to legal retention needs.",
    evidence: [
      { doc: "act", page: 10, section: "Section 12(1)", quote: "right to correction, completion, updating and erasure of her personal data" },
      { doc: "act", page: 10, section: "Section 12(3)", quote: "unless retention of the same is necessary for the specified purpose or for compliance with any law" },
    ],
  },
  {
    id: "right.grievance",
    claimType: "statutory_text",
    claim: "People have the right to readily available grievance redressal from the business or Consent Manager, and must use it before going to the Board.",
    evidence: [
      { doc: "act", page: 10, section: "Section 13(1)", quote: "right to have readily available means of grievance redressal" },
      { doc: "act", page: 10, section: "Section 13(3)", quote: "shall exhaust the opportunity of redre" },
    ],
  },
  {
    id: "right.nominate",
    claimType: "statutory_text",
    claim: "People can nominate another individual to exercise their rights if they die or become incapacitated.",
    evidence: [
      { doc: "act", page: 10, section: "Section 14(1)", quote: "right to nominate" },
      { doc: "act", page: 10, section: "Section 14(2)", quote: "inability to exercise the rights of the Data Principal" },
    ],
  },
  {
    id: "right.duties",
    claimType: "statutory_text",
    claim: "People also have duties: not to impersonate others, not to suppress material information, and not to file false or frivolous complaints (penalty up to ₹10,000).",
    evidence: [
      { doc: "act", page: 10, section: "Section 15(b)", quote: "to ensure not to impersonate another person" },
      { doc: "act", page: 10, section: "Section 15(d)", quote: "not to register a false or frivolous grievance or complaint" },
      { doc: "act", page: 21, section: "Schedule, item 5", quote: "Breach in observance of the duties under section 15" },
      { doc: "act", page: 21, section: "Schedule, item 5", quote: "May extend to ten thousand rupees" },
    ],
  },
  {
    id: "right.rules-channel",
    claimType: "implementation",
    claim: "Under the Rules a person exercises rights by asking the business through the means it publishes, and may nominate someone under its terms of service.",
    evidence: [
      { doc: "rules", page: 30, section: "Rule 14(2)", quote: "she may make a request to the Data Fiduciary to whom she has previously given consent" },
      { doc: "rules", page: 30, section: "Rule 14(4)", quote: "she may, in accordance with the terms of service of the Data Fiduciary and such law as may be applicable, nominate one or more individuals" },
    ],
  },

  // ───────────── Consent Managers ─────────────
  {
    id: "cm.role",
    claimType: "statutory_text",
    claim: "A Consent Manager is a Board-registered intermediary that lets a person give, manage, review and withdraw consent through one interoperable platform.",
    evidence: [
      { doc: "act", page: 2, section: "Section 2(g)", quote: "acts as a single point of contact to enable a Data Principal to give, manage, review and withdraw her consent" },
      { doc: "act", page: 6, section: "Section 6(7)", quote: "may give, manage, review or withdraw her consent to the Data Fiduciary through a Consent Manager" },
    ],
  },
  {
    id: "cm.registration",
    claimType: "statutory_text",
    claim: "Every Consent Manager must be registered with the Board.",
    evidence: [{ doc: "act", page: 6, section: "Section 6(9)", quote: "Every Consent Manager shall be registered with the Board" }],
  },
  {
    id: "cm.rule4",
    claimType: "implementation",
    claim: "Rule 4 lets a person meeting the First Schedule conditions apply to the Board for registration; the Board can reject, suspend or cancel registrations.",
    evidence: [
      { doc: "rules", page: 25, section: "Rule 4(1)", quote: "may apply to the Board for registration as a Consent Manager" },
      { doc: "rules", page: 25, section: "Rule 4(5)", quote: "suspend or cancel the registration of such Consent Manager" },
    ],
  },
  {
    id: "cm.conditions",
    claimType: "implementation",
    claim: "To register as a Consent Manager a company must be incorporated in India and have a net worth of at least ₹2 crore, among other conditions in the First Schedule.",
    evidence: [
      { doc: "rules", page: 32, section: "First Schedule, Part A, item 1", quote: "The applicant is a company incorporated in India" },
      { doc: "rules", page: 32, section: "First Schedule, Part A, item 4", quote: "The net worth of the applicant is not less than two crore rupees" },
    ],
  },
  {
    id: "cm.board-inquiry",
    claimType: "statutory_text",
    claim: "Section 27(1)(d) lets the Board inquire into breaches of a Consent Manager’s registration conditions and impose penalties.",
    evidence: [{ doc: "act", page: 14, section: "Section 27(1)(d)", quote: "on receipt of an intimation of breach of any condition of registration of a Consent Manager" }],
  },

  // ───────────── Exemptions ─────────────
  {
    id: "exempt.startups",
    claimType: "statutory_text",
    claim: "The Government may exempt notified classes of Data Fiduciaries, including startups, from section 5 (notice), parts of section 8, section 10 (significant fiduciary duties) and section 11 (access), by notification. The Act has no automatic small-business exemption.",
    evidence: [
      { doc: "act", page: 12, section: "Section 17(3)", quote: "notify certain Data Fiduciaries or class of Data Fiduciaries, including startups" },
      { doc: "act", page: 12, section: "Section 17(3)", quote: "the provisions of section 5, sub-sections ( 3 ) and ( 7 ) of section 8 and sections 10 and 11 shall not apply" },
    ],
  },
  {
    id: "exempt.state",
    claimType: "statutory_text",
    claim: "The Government can exempt notified State instrumentalities from the whole Act in the interests of sovereignty, security, foreign relations or public order.",
    evidence: [{ doc: "act", page: 11, section: "Section 17(2)(a)", quote: "by such instrumentality of the State as the Central Government may notify" }],
  },
  {
    id: "exempt.research",
    claimType: "statutory_text",
    claim: "Processing for research, archiving or statistics is exempt if the data is not used to take decisions about a specific person and prescribed standards are followed.",
    evidence: [{ doc: "act", page: 12, section: "Section 17(2)(b)", quote: "necessary for research, archiving or statistical purposes if the personal data is not to be used to take any decision specific to a Data Principal" }],
  },
  {
    id: "exempt.legal-claims",
    claimType: "statutory_text",
    claim: "Many duties and rights do not apply where processing is needed to enforce a legal right or claim, or to prevent and investigate offences.",
    evidence: [
      { doc: "act", page: 11, section: "Section 17(1)(a)", quote: "necessary for enforcing any legal right or claim" },
      { doc: "act", page: 11, section: "Section 17(1)(c)", quote: "in the interest of prevention, detection, investigation or prosecution of any offence" },
    ],
  },
  {
    id: "exempt.state-processing",
    claimType: "statutory_text",
    claim: "The State may process data for subsidies, benefits, services, certificates, licences and permits, and for functions under law, without relying on consent.",
    evidence: [
      { doc: "act", page: 6, section: "Section 7(b)", quote: "for the State and any of its instrumentalities to provide or issue to the Data Principal such subsidy, benefit, service, certificate, licence or permit" },
      { doc: "act", page: 7, section: "Section 7(c)", quote: "for the performance by the State or any of its instrumentalities of any function under any law" },
    ],
  },

  // ───────────── Board, enforcement, penalties ─────────────
  {
    id: "board.role",
    claimType: "statutory_text",
    claim: "The Data Protection Board of India is the regulator: it receives breach intimations and complaints, inquires, can issue directions and imposes penalties.",
    evidence: [
      { doc: "act", page: 12, section: "Section 18(1)", quote: "there shall be established, for the purposes of this Act, a Board to be called the Data Protection Board of India" },
      { doc: "act", page: 14, section: "Section 27(1)(b)", quote: "on a complaint made by a Data Principal in respect of a personal data breach" },
    ],
  },
  {
    id: "board.digital",
    claimType: "statutory_text",
    claim: "The Board is to work as an independent, digital-by-design office, with complaints and decisions handled online.",
    evidence: [{ doc: "act", page: 14, section: "Section 28(1)", quote: "shall function as an independent body and shall, as far as practicable, function as a digital office" }],
  },
  {
    id: "board.mediation",
    claimType: "statutory_text",
    claim: "The Board may direct mediation, and may accept a voluntary undertaking from a business instead of continuing with penalties.",
    evidence: [
      { doc: "act", page: 16, section: "Section 31", quote: "it may direct the parties concerned to attempt resolution of the dispute through such mediation" },
      { doc: "act", page: 16, section: "Section 32(1)", quote: "may accept a voluntary undertaking" },
    ],
  },
  {
    id: "board.appeal",
    claimType: "statutory_text",
    claim: "Anyone aggrieved by a Board order can appeal to the Telecom Disputes Settlement and Appellate Tribunal.",
    evidence: [
      { doc: "act", page: 15, section: "Section 29(1)", quote: "may prefer an appeal before the Appellate Tribunal" },
      { doc: "act", page: 2, section: "Section 2(a)", quote: "means the Telecom Disputes Settlement and Appellate Tribunal" },
    ],
  },
  {
    id: "penalty.factors",
    claimType: "statutory_text",
    claim: "The Board may impose a penalty after an inquiry finds a significant breach, weighing factors such as the nature, gravity, duration and repetition of the breach and any mitigation.",
    evidence: [
      { doc: "act", page: 17, section: "Section 33(1)", quote: "impose such monetary penalty specified in the Schedule" },
      { doc: "act", page: 17, section: "Section 33(2)(a)", quote: "the nature, gravity and duration of the breach" },
      { doc: "act", page: 17, section: "Section 33(2)(e)", quote: "whether the person took any action to mitigate the effects and consequences of the breach" },
    ],
  },
  {
    id: "penalty.max",
    claimType: "statutory_text",
    claim: "The Schedule sets maximum penalties: up to ₹250 crore for failing to take reasonable security safeguards, up to ₹200 crore for failing to notify a breach or for breaching children’s obligations, up to ₹150 crore for Significant Data Fiduciary duties, and up to ₹50 crore for any other breach.",
    evidence: [
      { doc: "act", page: 21, section: "Schedule, item 1", quote: "Breach in observing the obligation of Data Fiduciary to take reasonable security safeguards to prevent personal data breach" },
      { doc: "act", page: 21, section: "Schedule, item 1", quote: "May extend to two hundred and fifty crore rupees" },
      { doc: "act", page: 21, section: "Schedule, item 2", quote: "Breach in observing the obligation to give the Board or affected Data Principal notice of a personal data breach" },
      { doc: "act", page: 21, section: "Schedule, items 2–3", quote: "May extend to two hundred crore rupees" },
      { doc: "act", page: 21, section: "Schedule, item 4", quote: "May extend to one hundred and fifty crore rupees" },
      { doc: "act", page: 21, section: "Schedule, item 7", quote: "May extend to fifty crore rupees" },
    ],
  },
  {
    id: "penalty.to-treasury",
    claimType: "statutory_text",
    claim: "Penalties go to the Consolidated Fund of India, not to the affected person.",
    evidence: [{ doc: "act", page: 17, section: "Section 34", quote: "shall be credited to the Consolidated Fund of India" }],
  },
  {
    id: "enforce.blocking",
    claimType: "statutory_text",
    claim: "After a business has been penalised twice or more, the Government can on the Board’s reference order access to its services blocked in India.",
    evidence: [
      { doc: "act", page: 17, section: "Section 37(1)(a)", quote: "imposition of monetary penalty by the Board on a Data Fiduciary in two or more instances" },
      { doc: "act", page: 17, section: "Section 37(1)", quote: "block for access by the public" },
    ],
  },
  {
    id: "enforce.government-info",
    claimType: "statutory_text",
    claim: "The Government may require the Board and any Data Fiduciary or intermediary to furnish information it calls for.",
    evidence: [{ doc: "act", page: 17, section: "Section 36", quote: "require the Board and any Data Fiduciary or intermediary to furnish such information as it may call for" }],
  },

  // ───────────── Effects on other laws (already in force) ─────────────
  {
    id: "other.prevail",
    claimType: "statutory_text",
    claim: "The Act adds to other laws, and where they conflict the DPDP Act prevails to the extent of the conflict.",
    evidence: [
      { doc: "act", page: 18, section: "Section 38(1)", quote: "shall be in addition to and not in derogation of any other law" },
      { doc: "act", page: 18, section: "Section 38(2)", quote: "the provision of this Act shall prevail to the extent of such conflict" },
    ],
  },
  {
    id: "other.rti",
    claimType: "statutory_text",
    claim: "Section 44(3) rewrites the Right to Information Act’s personal-information exemption (section 8(1)(j)) to read “information which relates to personal information”; this provision has been in force since 13 November 2025.",
    evidence: [
      { doc: "act", page: 20, section: "Section 44(3)", quote: "In section 8 of the Right to Information Act, 2005" },
      { doc: "act", page: 20, section: "Section 44(3)", quote: "information which relates to personal information" },
    ],
  },
  {
    id: "other.it-act",
    claimType: "statutory_text",
    claim: "Section 44(2) removes section 43A of the Information Technology Act, 2000 (compensation for failure to protect data); this starts on 13 May 2027.",
    evidence: [{ doc: "act", page: 20, section: "Section 44(2)(a)", quote: "section 43A shall be omitted" }],
  },
  {
    id: "other.rules-power",
    claimType: "statutory_text",
    claim: "The Government makes rules under section 40, which must be laid before Parliament, and may remove difficulties in applying the Act by order under section 43.",
    evidence: [
      { doc: "act", page: 18, section: "Section 40(1)", quote: "make rules not inconsistent with the provisions of this Act" },
      { doc: "act", page: 19, section: "Section 43(1)", quote: "If any difficulty arises in" },
    ],
  },
];
