import type { PolicyKnowledge } from "./types";
import { dpdpClaims } from "./dpdp-claims";
import { dpdpDocuments } from "./dpdp-sources";

/**
 * Citizen-facing knowledge for the Digital Personal Data Protection Act, 2023.
 *
 * Written to work with no live AI: every sentence below is either a statement of
 * the law tied to claim IDs (each backed by a verified quote in dpdp-claims.ts)
 * or is labelled "our reading". Dates are fixed facts from the Gazette; whether a
 * phase is "in force" is computed from the as-of date at render time.
 */
export const dpdpKnowledge: PolicyKnowledge = {
  slug: "dpdp-act-2023",
  title: "Digital Personal Data Protection Act, 2023",
  shortTitle: "DPDP Act",
  identifier: "Act No. 22 of 2023",
  act: { number: 22, year: 2023 },
  ministry: "Ministry of Electronics and Information Technology",
  lastChecked: "2026-10-25",
  purpose: "India’s law on how organisations collect, use and protect people’s digital personal data.",
  aliases: ["dpdp", "dpdpa", "data protection", "personal data", "digital personal data", "privacy", "data privacy", "data fiduciary", "consent manager", "data protection board"],
  brief:
    "The Digital Personal Data Protection Act, 2023 is India’s first economy-wide law on how organisations handle digital personal data. " +
    "Before using someone’s data, an organisation needs a lawful reason, usually the person’s clear consent. " +
    "People gain rights to see, correct and erase their data and to complain, organisations must keep data secure and report breaches, " +
    "and a Data Protection Board can impose penalties of up to ₹250 crore. " +
    "The Government is switching the law on in stages by notification, so different sections apply from different dates.",

  whatChanges: [
    {
      id: "lawful-use",
      title: "Organisations need a lawful reason to use your data",
      body:
        "Personal data can be used only for a lawful purpose, normally with your specific, informed consent, or under a short list of “legitimate uses” such as a medical emergency or a service you asked for. " +
        "Before asking for consent, the organisation must tell you what data it wants and why, in plain language.",
      phaseId: "p3",
      claimIds: ["duty.lawful-basis", "duty.notice", "duty.consent-quality", "duty.legitimate-uses"],
    },
    {
      id: "rights",
      title: "People get rights over their data",
      body:
        "You can ask for a summary of the data an organisation holds about you and who it was shared with, ask for corrections or erasure, use a grievance channel, withdraw consent as easily as you gave it, and nominate someone to act for you.",
      phaseId: "p3",
      claimIds: ["right.access", "right.correct-erase", "right.grievance", "duty.consent-withdraw", "right.nominate"],
    },
    {
      id: "security",
      title: "Data must be secured and breaches reported",
      body:
        "Organisations must take reasonable security safeguards. The Rules set minimums: encryption or masking, access controls, logging and backups. After a breach they must tell the Board and each affected person, with detailed information to the Board within 72 hours.",
      phaseId: "p3",
      claimIds: ["duty.security", "duty.security-rules", "duty.breach-act", "duty.breach-rules"],
    },
    {
      id: "children",
      title: "Children get stronger protection",
      body:
        "For anyone under 18, an organisation must get verifiable consent from a parent or guardian first. It may not track or behaviourally monitor children or direct targeted advertising at them.",
      phaseId: "p3",
      claimIds: ["scope.child-18", "children.consent", "children.rules-diligence", "children.no-tracking"],
    },
    {
      id: "enforcement",
      title: "A regulator with real penalties",
      body:
        "The Data Protection Board of India, already established, will take complaints and run inquiries. Penalties are capped at up to ₹250 crore for failing to take reasonable security safeguards and up to ₹50 crore for most other breaches. Appeals go to the Telecom Disputes Settlement and Appellate Tribunal.",
      phaseId: "p3",
      claimIds: ["life.board-established", "board.role", "penalty.max", "penalty.factors", "board.appeal"],
    },
  ],

  phases: [
    {
      id: "p1",
      date: "2025-11-13",
      label: "Foundations and the Data Protection Board",
      summary: "The institutional groundwork: the regulator exists and the Government’s rule-making powers are live. Day-to-day duties for organisations are not part of this step.",
      actProvisions: "Section 1(2); section 2; sections 18–26; sections 35 and 38–43; section 44(1) and (3)",
      rules: "Rules 1, 2 and 17–21",
      whatBegins: [
        "The Data Protection Board of India exists, and the Act’s definitions apply.",
        "The Government can make rules, issue notifications and remove drafting difficulties by order.",
        "The DPDP Act prevails over conflicting laws, and the Right to Information Act’s personal-information exemption is rewritten (section 44(3)).",
      ],
      whoShouldCare: "Policy watchers, RTI users and those following the Board’s set-up. Ordinary businesses are not yet bound by the main duties.",
      claimIds: ["life.phase-1", "life.board-established", "other.prevail", "other.rti", "other.rules-power"],
    },
    {
      id: "p2",
      date: "2026-11-13",
      label: "Consent Managers can register",
      summary: "A narrow step: registration of Consent Managers, the optional intermediaries that let a person manage consent in one place, begins.",
      actProvisions: "Section 6(9); section 27(1)(d)",
      rules: "Rule 4 and the First Schedule",
      whatBegins: [
        "Companies meeting the conditions (incorporated in India, net worth of at least ₹2 crore, among others) can apply to the Board to register.",
        "The Board can inquire into breaches of a Consent Manager’s registration conditions.",
      ],
      whoShouldCare: "Fintech and data-platform companies thinking of becoming Consent Managers. It creates no new duty for an ordinary business.",
      claimIds: ["life.phase-2", "cm.role", "cm.registration", "cm.rule4", "cm.conditions", "cm.board-inquiry"],
    },
    {
      id: "p3",
      date: "2027-05-13",
      label: "The main duties, rights and penalties",
      summary: "Most of the Act: what organisations must do, what people can ask for, and how the Board can enforce it.",
      actProvisions: "Sections 3–5; section 6(1)–(8) and (10); sections 7–17; section 27 (except 27(1)(d)); sections 28–34; sections 36–37; section 44(2)",
      rules: "Rules 3, 5–16, 22 and 23",
      whatBegins: [
        "Organisations must have a lawful basis, give clear notices and obtain valid consent.",
        "Security safeguards, breach reporting, erasure, grievance handling and processor contracts become legal duties.",
        "Children’s data protections and the extra duties of Significant Data Fiduciaries apply.",
        "People can exercise their rights to access, correction, erasure, grievance redressal and nomination.",
        "The Board can hear complaints, run inquiries and impose penalties. Section 43A of the IT Act is removed.",
      ],
      whoShouldCare: "Every organisation that handles digital personal data of people in India, and every person whose data they hold.",
      claimIds: ["life.phase-3", "duty.lawful-basis", "right.access", "duty.security", "children.consent", "penalty.max", "other.it-act"],
    },
  ],

  rulesPhases: [
    {
      date: "2025-11-13",
      rules: "Rules 1, 2 and 17–21",
      plain: "Definitions, and the rules for appointing the Board’s members and running the Board as a digital office.",
      claimIds: ["life.rules-schedule"],
    },
    {
      date: "2026-11-13",
      rules: "Rule 4",
      plain: "How Consent Managers apply to register with the Board and what they must do.",
      claimIds: ["life.rules-schedule", "cm.rule4"],
    },
    {
      date: "2027-05-13",
      rules: "Rules 3, 5–16, 22 and 23",
      plain:
        "Privacy notices, State processing standards, security safeguards, breach reporting, retention, contact points, children’s data, Significant Data Fiduciaries, rights requests, cross-border transfers, research exemptions, appeals and the Government’s power to call for information.",
      claimIds: ["life.rules-schedule", "duty.notice-rules", "duty.security-rules", "duty.breach-rules"],
    },
  ],

  events: [
    {
      date: "2023-08-11",
      title: "The Act receives the President’s assent",
      detail: "The Act becomes law on paper, but section 1(2) leaves its start date to a Government notification, and allows different dates for different sections.",
      claimIds: ["life.assent", "life.staged-power"],
      doc: "act",
    },
    {
      date: "2025-01-03",
      title: "Draft Rules published for comment",
      detail: "The Government published draft Rules and invited objections and suggestions for 45 days.",
      claimIds: ["life.draft-rules"],
      doc: "rules",
    },
    {
      date: "2025-11-13",
      title: "Start dates set, Board established, Rules made",
      detail:
        "Three notifications on one day: G.S.R. 843(E) sets the staged start dates, G.S.R. 844(E) establishes the Data Protection Board, and G.S.R. 846(E) makes the Rules, with their own staged schedule.",
      claimIds: ["life.notification-date", "life.phase-1", "life.board-established", "life.rules-made", "life.rules-schedule"],
      doc: "notification",
    },
    {
      date: "2025-12-11",
      title: "Corrigendum to the Rules",
      detail: "G.S.R. 892(E) corrects wording and cross-references in the Rules, for example “of this Gazette” becomes “in the Official Gazette”. It does not alter the commencement periods.",
      claimIds: ["life.corrigendum"],
      doc: "corrigendum",
    },
    {
      date: "2026-10-06",
      title: "Removal of Difficulties Order",
      detail: "S.O. 5458(E) makes two drafting fixes to the Act’s text, in sections 9(1) and 10(2)(c)(ii), which the Order describes as textual and editorial.",
      claimIds: ["life.rod-order", "life.rod-editorial"],
      doc: "rod",
    },
  ],

  stakeholders: [
    {
      id: "individuals",
      label: "Individuals",
      prompt: "If you are a person whose data organisations hold",
      headline: "Your main rights start on 13 May 2027.",
      implications: [
        { kind: "legal_right", phaseId: "p3", text: "Ask an organisation you gave consent to for a summary of the personal data it processes and the identities of those it has shared it with (section 11).", claimIds: ["right.access"] },
        { kind: "legal_right", phaseId: "p3", text: "Have inaccurate or incomplete data corrected and updated, and ask for it to be erased unless the organisation must keep it for a legal reason (section 12).", claimIds: ["right.correct-erase"] },
        { kind: "legal_right", phaseId: "p3", text: "Use the organisation’s grievance channel, which must publish a response time of no more than 90 days, before approaching the Board (sections 8(10), 13; Rule 14).", claimIds: ["right.grievance", "duty.grievance"] },
        { kind: "legal_right", phaseId: "p3", text: "Withdraw consent at any time, as easily as you gave it, and nominate someone to exercise your rights if you die or become incapacitated (sections 6(4), 14).", claimIds: ["duty.consent-withdraw", "right.nominate"] },
        { kind: "legal_duty", phaseId: "p3", text: "You have duties too: not to impersonate anyone or file a false or frivolous complaint. The penalty for breaching them can reach ₹10,000 (section 15).", claimIds: ["right.duties"] },
      ],
      openQuestions: [
        "Some organisations may be exempt from part of the Act, including the access right, if the Government notifies them under section 17. Anvaya has not found such a notification.",
        "The start date can change only by a new Government notification. Anvaya has found none (see “Things to watch”).",
      ],
    },
    {
      id: "small-business",
      label: "Small businesses and startups",
      prompt: "If you run a small business or startup",
      headline: "There is no automatic small-business exemption. The main duties start on 13 May 2027.",
      implications: [
        { kind: "legal_fact", text: "You are covered if you decide why and how personal data is used, whatever your size or legal form. A business outside India is covered if it offers goods or services to people in India (sections 2(i), 2(s), 3).", claimIds: ["scope.fiduciary", "scope.person-includes-business", "scope.territory", "scope.extraterritorial"] },
        { kind: "legal_duty", phaseId: "p3", text: "Give a clear notice and get valid consent. The notice must be understandable on its own, itemise the data and state the purpose, in English or an Eighth-Schedule language. If challenged, you must be able to prove you gave notice and obtained consent (sections 5–6; Rule 3).", claimIds: ["duty.notice", "duty.notice-rules", "duty.notice-language", "duty.consent-quality", "duty.burden-of-proof"] },
        { kind: "legal_duty", phaseId: "p3", text: "Protect the data and report breaches. At minimum: encryption or masking, access control, logs and backups, and one year of log retention. After a breach, tell affected people without delay and give the Board detailed information within 72 hours (section 8; Rules 6–7).", claimIds: ["duty.security", "duty.security-rules", "duty.breach-act", "duty.breach-rules"] },
        { kind: "legal_duty", phaseId: "p3", text: "Erase data you no longer need, publish a contact point, run a grievance process, and use processors only under a valid contract. You remain responsible for what your processors do with the data (section 8).", claimIds: ["duty.erasure", "duty.contact", "duty.grievance", "duty.processor-contract", "duty.responsible"] },
        { kind: "our_reading", phaseId: "p3", text: "In practice this points to tasks such as listing what personal data you hold, redoing sign-up and consent screens, reviewing vendor contracts and preparing a breach-response routine. This is our interpretation, not a Government checklist, and Anvaya does not estimate costs.", claimIds: ["inference.smb-tasks"] },
        { kind: "legal_fact", text: "Penalties are caps, not fixed fines: up to ₹250 crore for failing to take reasonable security safeguards and up to ₹50 crore for most other breaches. The Board weighs the gravity and duration of the breach and what you did to mitigate it (section 33; Schedule).", claimIds: ["penalty.max", "penalty.factors"] },
      ],
      openQuestions: [
        "The Government may exempt notified classes, including startups, from the notice, some retention, access and significant-fiduciary provisions (section 17(3)). Anvaya found no such notification, so assume you are covered unless one is published.",
        "How the Board will treat small or first-time lapses in practice is not set out; the Act only lists factors it must weigh.",
      ],
    },
    {
      id: "platforms",
      label: "Large platforms",
      prompt: "If you run a large platform or may be designated “significant”",
      headline: "Heavier duties apply if the Government designates you a Significant Data Fiduciary.",
      implications: [
        { kind: "legal_fact", text: "The Government can designate a business or class of businesses as a Significant Data Fiduciary, based on factors such as the volume and sensitivity of data and risk to people’s rights (section 10(1)).", claimIds: ["sdf.designation"] },
        { kind: "legal_duty", phaseId: "p3", text: "A significant fiduciary must appoint an India-based Data Protection Officer and an independent data auditor, and run impact assessments and audits every twelve months, reporting significant findings to the Board (section 10; Rule 13).", claimIds: ["sdf.duties", "sdf.rules"] },
        { kind: "legal_duty", phaseId: "p3", text: "It must ensure that data the Government specifies, and its related traffic data, is not transferred outside India (Rule 13(4)). More broadly, the Government can restrict transfers to notified countries (section 16; Rule 15).", claimIds: ["sdf.localisation", "transfer.act", "transfer.rules"] },
        { kind: "legal_duty", phaseId: "p3", text: "E-commerce and social media companies with 2 crore or more registered users, and online gaming intermediaries with 50 lakh or more, must erase most data three years after the person last used the service, with 48 hours’ warning (Rule 8; Third Schedule).", claimIds: ["duty.erasure-big-platforms"] },
        { kind: "legal_fact", phaseId: "p3", text: "After the Board has penalised a business twice or more, the Government can order access to its services blocked in India (section 37).", claimIds: ["enforce.blocking"] },
      ],
      openQuestions: [
        "Anvaya has found no notification designating any company as a Significant Data Fiduciary.",
        "Which categories of data Rule 13(4) will cover depends on a future Government specification.",
      ],
    },
    {
      id: "children",
      label: "Parents and child-facing services",
      prompt: "If you are a parent, or your service is used by under-18s",
      headline: "Under-18s get the strongest protection: services need a parent’s verifiable consent.",
      implications: [
        { kind: "legal_fact", text: "A “child” is anyone under 18, and for a child the parent or lawful guardian acts as the Data Principal (section 2).", claimIds: ["scope.child-18", "scope.principal"] },
        { kind: "legal_duty", phaseId: "p3", text: "A service must obtain verifiable consent from a parent or guardian before processing a child’s data, and the Rules require it to check that the person claiming to be the parent is an identifiable adult (section 9(1); Rule 10).", claimIds: ["children.consent", "children.rules-diligence"] },
        { kind: "legal_duty", phaseId: "p3", text: "It may not track or behaviourally monitor children, direct targeted advertising at them, or process data in ways likely to harm their well-being (section 9(2)–(3)).", claimIds: ["children.no-tracking"] },
        { kind: "legal_fact", phaseId: "p3", text: "The Fourth Schedule exempts some classes of services and some purposes from the parental-consent and tracking rules (Rule 12).", claimIds: ["children.exemptions"] },
        { kind: "legal_fact", text: "In October 2026 a Removal of Difficulties Order corrected section 9(1) to read “child or of a person with disability”. The Order calls this a textual, editorial fix.", claimIds: ["life.rod-order", "life.rod-editorial"] },
      ],
      openQuestions: ["Which services qualify for the Fourth Schedule exemptions is a detailed list that Anvaya summarises but does not reproduce here. Read Rule 12 and the Fourth Schedule."],
    },
    {
      id: "consent-managers",
      label: "Consent Managers and fintechs",
      prompt: "If you want to become a Consent Manager",
      headline: "Registration opens first, on 13 November 2026.",
      implications: [
        { kind: "legal_fact", phaseId: "p2", text: "A Consent Manager is a Board-registered intermediary that lets a person give, manage, review and withdraw consent through a single, interoperable platform (sections 2(g), 6(7)).", claimIds: ["cm.role"] },
        { kind: "legal_duty", phaseId: "p2", text: "Every Consent Manager must be registered with the Board. An applicant must be a company incorporated in India with a net worth of at least ₹2 crore, among other First Schedule conditions (section 6(9); Rule 4).", claimIds: ["cm.registration", "cm.rule4", "cm.conditions"] },
        { kind: "legal_fact", phaseId: "p2", text: "The Board can suspend or cancel a registration, and can inquire into breaches of registration conditions and impose penalties (Rule 4(5); section 27(1)(d)).", claimIds: ["cm.rule4", "cm.board-inquiry"] },
      ],
      openQuestions: ["The Board’s application form and any published list of registered Consent Managers are not in Anvaya’s sources."],
    },
    {
      id: "government",
      label: "Government bodies and public services",
      prompt: "If you work in, or deal with, a public body",
      headline: "The State has wider room to process data without consent, plus exemptions it can notify.",
      implications: [
        { kind: "legal_fact", phaseId: "p3", text: "The State and its agencies may process data without consent to provide subsidies, benefits, services, certificates, licences and permits, and to perform functions under law (section 7(b)–(c)).", claimIds: ["exempt.state-processing"] },
        { kind: "legal_fact", phaseId: "p3", text: "The Government can exempt notified State instrumentalities from the whole Act on grounds such as sovereignty, security and public order (section 17(2)(a)).", claimIds: ["exempt.state"] },
        { kind: "legal_fact", phaseId: "p1", text: "Since 13 November 2025 the Right to Information Act’s section 8(1)(j) reads “information which relates to personal information” (section 44(3)).", claimIds: ["other.rti"] },
        { kind: "legal_fact", phaseId: "p3", text: "The Government can require the Board, and any Data Fiduciary or intermediary, to furnish information it calls for (section 36; Rule 23).", claimIds: ["enforce.government-info"] },
      ],
      openQuestions: ["Which State bodies are or will be exempt depends on notifications under section 17(2)(a), which Anvaya has not found. How the RTI change applies in practice is a matter for courts and information commissions; Anvaya has not reviewed case law."],
    },
  ],

  baselineAnswers: [
    {
      id: "what-for-small-business",
      question: "What does the DPDP Act mean for a small business?",
      answer:
        "The Act covers any business that decides why and how it uses people’s digital personal data, and it has no automatic small-business exemption. The main duties (notice, consent, security, breach reporting, erasure) start on 13 May 2027.",
      details: [
        "Give a clear notice and get valid consent before using personal data (sections 5–6; Rule 3).",
        "Use reasonable security safeguards and report breaches (section 8; Rules 6–7).",
        "The Government may exempt notified startups from some provisions (section 17(3)); Anvaya found no such notification.",
      ],
      claimIds: ["scope.fiduciary", "scope.person-includes-business", "life.phase-3", "exempt.startups", "inference.smb-tasks"],
      validThrough: "2027-05-12",
    },
    {
      id: "rights-in-force",
      question: "Are my customers’ data rights already in force?",
      answer:
        "Not yet. Under the 13 November 2025 notification, people’s rights to access, correction, erasure, grievance redressal and nomination (sections 11–14) start on 13 May 2027. What is in force now is mainly the Data Protection Board and administrative provisions.",
      details: ["No amending notification changing these dates has been found; press reports of a possible shortening are unconfirmed (see “Things to watch”)."],
      claimIds: ["life.phase-3", "right.access", "right.correct-erase", "right.grievance", "right.nominate", "life.phase-1"],
      validThrough: "2027-05-12",
    },
    {
      id: "nov-2026",
      question: "What happens on 13 November 2026?",
      answer:
        "Two narrow provisions begin: Consent Managers can register with the Board (section 6(9) and Rule 4), and the Board can inquire into breaches of a Consent Manager’s registration conditions (section 27(1)(d)). The main duties for businesses do not start then; they start on 13 May 2027.",
      claimIds: ["life.phase-2", "cm.registration", "cm.rule4", "cm.board-inquiry", "life.phase-3"],
      validThrough: "2026-11-12",
    },
    {
      id: "notice-and-consent",
      question: "When do I have to give privacy notices and take consent?",
      answer:
        "From 13 May 2027 (sections 4–7 and Rule 3). From then every consent request must come with a notice, and consent must be free, specific, informed and unambiguous. For people who consented before the Act started, you must send a notice as soon as reasonably practicable.",
      claimIds: ["life.phase-3", "duty.notice", "duty.consent-quality", "duty.notice-existing", "duty.notice-rules"],
      validThrough: "2027-05-12",
    },
    {
      id: "breach-penalty",
      question: "What is the penalty for a data breach?",
      answer:
        "The Board can impose up to ₹250 crore for failing to take reasonable security safeguards, and up to ₹200 crore for failing to notify a breach. These are maximums set after an inquiry that weighs the breach’s nature, gravity, duration and any mitigation. The penalty provisions start on 13 May 2027.",
      claimIds: ["penalty.max", "penalty.factors", "life.phase-3"],
      validThrough: "2027-05-12",
    },
    {
      id: "breach-steps",
      question: "What must I do if there is a data breach?",
      answer:
        "Tell each affected person without delay, and tell the Board without delay, with detailed information within 72 hours of becoming aware (unless the Board allows longer). This duty starts on 13 May 2027.",
      claimIds: ["duty.breach-act", "duty.breach-rules", "life.phase-3"],
      validThrough: "2027-05-12",
    },
    {
      id: "outside-india",
      question: "Does the Act apply to a company outside India?",
      answer: "Yes, if it processes digital personal data in connection with offering goods or services to people in India (section 3(b)).",
      claimIds: ["scope.extraterritorial"],
    },
    {
      id: "startup-exemption",
      question: "Is there a startup or small-business exemption?",
      answer:
        "Not automatically. Section 17(3) lets the Government notify classes of Data Fiduciaries, including startups, as exempt from some provisions. Anvaya has not found any such notification, so assume a business is covered.",
      claimIds: ["exempt.startups"],
    },
    {
      id: "latest-change",
      question: "What changed in the Act most recently?",
      answer:
        "A Removal of Difficulties Order (S.O. 5458(E)), published in October 2026, made two drafting fixes: section 9(1) now reads “child or of a person with disability” and section 10(2)(c)(ii) refers to “data audit”. The Order calls them textual and editorial.",
      claimIds: ["life.rod-order", "life.rod-editorial"],
    },
  ],

  watch: [
    {
      title: "Could the 18-month wait be shortened?",
      body:
        "In November 2025 the IT Minister said the timeline might be compressed, and in January 2026 press reports said the Ministry was considering cutting the 18-month period to 12 months for some provisions. Anvaya has not found any official notification changing a date, so the dates above stand. These reports come from secondary sources and rest on unnamed officials.",
      sources: [
        { label: "DPDP Rules reference site: the 18-to-12-month proposal", url: "https://dpdprules.org/blog/dpdp-18-months-to-12-months-proposal", official: false },
        { label: "Mondaq: Compression of DPDP enforcement timeline proposed by MeitY", url: "https://www.mondaq.com/india/privacy-protection/1760380/compression-of-dpdp-enforcement-timeline-proposed-by-meity", official: false },
      ],
    },
    {
      title: "A one-day difference in counting",
      body:
        "The notification says “one year” and “eighteen months” from the date of publication (13 November 2025). Anvaya shows the calendar anniversaries, 13 November 2026 and 13 May 2027. Some commentators count so that the dates fall a day later. Treat the exact day as unconfirmed and check the Gazette before relying on it.",
      sources: [{ label: "Commencement notification G.S.R. 843(E)", url: "https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf#page=2", official: true }],
    },
    {
      title: "Exemption notifications under section 17",
      body: "Several duties can be switched off for notified classes of organisations, including startups, and for notified State bodies. Anvaya has not found any such notification in its source set.",
      sources: [],
    },
  ],

  documents: dpdpDocuments,
  claims: dpdpClaims,
};
