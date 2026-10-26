/**
 * The drafting patterns the scorecard counts. Each pattern states what it detects and why that
 * feature matters in the literature. Patterns are deliberately conservative: a miss lowers a count,
 * it does not invent one. They are checked against hand-read samples by scripts/validate-lexicon.ts.
 *
 * Drafting conventions differ between systems (Indian "shall…as may be prescribed", UK "must…by
 * regulations", Canadian "the Governor in Council may make regulations"), so each concept lists the
 * common forms of all three.
 */

/** Obligations and prohibitions (RegData counts binding words in the same spirit: Al-Ubaydli & McLaughlin 2017). */
export const OBLIGATION = /\b(shall not|must not|may not|shall|must|is required to|are required to|is obliged to|are obliged to|duty to|is prohibited|are prohibited|prohibited from|is liable|are liable|commits an offence)\b/i;
/** "shall" used to define, deem, extend or commence rather than to bind a person. */
export const NOT_BINDING = /\b(shall|must) (mean|have the (same )?meaning|be construed|be deemed|be taken|be read|be called|be cited|extend to|come into force|be treated|include|stand repealed|stand substituted|be substituted|be inserted|be omitted)\b|\bmay be called\b|\bmay be cited\b/i;
export const PERMISSION = /\bmay\b(?! be (called|cited))/i;

/** Deferral of substance to future subordinate instruments (Epstein & O'Halloran 1999: delegation as the transfer of discretion). */
export const DELEGATION = new RegExp(
  [
    "as may be prescribed", "may be prescribed", "be prescribed", "prescribed by (the )?(rules|regulations)", "by rules", "rules made under", "(may|shall) make rules",
    "power to make (rules|regulations)", "(central|state) government may,? (by notification|notify|specify|prescribe|determine|direct)",
    "as (the )?(central|state) government may (notify|specify|determine|direct|decide|by notification)", "may,? by (notification|order|regulations?|rules)",
    "by regulations? (make|prescribe|provide)", "regulations? may (prescribe|provide|make)", "in such (manner|form|period|time|way) as may be",
    "(secretary of state|minister|governor in council|lieutenant governor|treasury) may,? (make|by (order|regulations)|prescribe)", "as may be (specified|notified|determined|decided|directed) (by|under)",
    "may make regulations", "by order (make|provide)",
  ].join("|"),
  "i",
);

/** An explicit time limit on a duty (certainty of timing: Fuller 1964, possibility of compliance). */
export const TIME_LIMIT = /\bwithin\b[^.;]{0,50}\b(hours?|days?|weeks?|months?|years?)\b|\bnot later than\b|\bon or before\b|\bat least \d+ (days|months)|\b(period|term) of (\w+ ){0,3}(hours?|days?|weeks?|months?|years?)\b|\bforthwith\b|\bwithout delay\b|\bwithout undue delay\b/i;

/** Reasonableness / necessity / proportionality qualifiers (proportionality as a design standard: Barak 2012). Plain exceptions (“unless”, “except”) are not counted: hand-reading showed they are exemptions, not reasonableness tests. */
export const QUALIFIER = /\b(reasonabl[ey]|necessary|appropriate|proportionate|as far as (is )?(reasonably )?practicable|having regard to|to the extent|where (applicable|necessary|appropriate))\b|\bin the public interest\b|\bif (it is |the [a-z ]{3,40} is )?satisfied\b/i;

/** Sanctions (Becker 1968; Polinsky & Shavell 2000). */
export const SANCTION = /\b(penalty|penalties|fine|fined|imprisonment|punishable|punished|liable to|commits an offence|guilty of an offence|forfeit(ure)?)\b/i;
/** A sanction with a stated size: an amount, a term, a level, or a formula. */
export const QUANTIFIED = /(₹|\brs\.?\s?\d|rupees|£|\$|€|\bcrore\b|\blakh\b|\bthousand\b|\bmillion\b|per ?cent|%|\b\d+ (years?|months?|days?)\b|\blevel \d\b|statutory maximum|turnover)/i;

/** Escalation ladder rungs (Ayres & Braithwaite 1992, the enforcement pyramid). */
export const RUNGS = {
  direction: /\b(warning|reprimand|improvement notice|enforcement notice|information notice|compliance order|cease and desist|issue (such )?directions?|direct(s|ion)? (the person|him|her|it) to)\b/i,
  undertaking: /\b(voluntary undertaking|undertakings?|compound(ing)? of offences|compounded|settlement|commitments?)\b/i,
  monetary: /\b(monetary penalty|civil penalty|penalty|penalties|fine)\b/i,
  suspension: /\b(suspend(ed)?|suspension|cancel(led|lation)?|revoke[ds]?|revocation|disqualif\w+|withdrawal of (the )?(licen[cs]e|registration|recognition|approval))\b/i,
  blocking: /\b(block(ing)?|injunction|interim (order|relief)|prohibition order|stop order|restrain\w*|seiz(e|ure)|attach(ment)?|take ?down|take down)\b/i,
  criminal: /\b(imprisonment|imprisoned|commits an offence|guilty of an offence|punishable with imprisonment)\b/i,
};

/** A designated body that enforces or administers the law. */
export const ENFORCER_ACT = /\b(establish(ed|ment)?|constitute[ds]?|constitution of|set up|appoint(s|ed)?)\b/i;
export const ENFORCER_BODY = /\b(authority|board|commission|tribunal|regulator|council|registrar|controller|agency|ombudsman|adjudicating officer|commissioner|inspector)\b/i;

export const APPEAL = /\bappeal\b/i;
export const APPEAL_BODY = /\b(tribunal|court|authority|board|commission|appellate|appeal panel)\b/i;
export const APPEAL_TIME = /\bwithin\b[^.;]{0,40}\b(days|months|weeks)\b|\bperiod of (\w+ ){0,3}(days|months|weeks)\b/i;

export const MONITORING = {
  information: /\b(call for|furnish|require (any )?(person|entity|body)? ?(to )?(provide|furnish|produce)|information notice|request(s|ed)? (for )?information|submit (a )?returns?|produce (any )?(documents?|records?))\b/i,
  inspection: /\b(inspect(ion|or)?|enter (and )?search|search and seiz\w+|entry and inspection|audit)\b/i,
  inquiry: /\b(inquiry|inquire|investigat(e|ion|ions))\b/i,
  interim: /\b(interim (order|direction|relief|measures?)|pending (the )?(inquiry|investigation|completion))\b/i,
};

/** Calibration of duties to who is regulated (OECD proportionality; risk-based regulation). */
export const TIERING = {
  threshold: /\b(turnover|threshold|number of (users|employees|members|subscribers|customers|persons)|not less than [\w ,]{0,20}(users|employees|crore|lakh)|exceed(s|ing)? [\w ,₹.]{0,20}(crore|lakh|per cent))\b/i,
  classBased: /\b(class(es)? of|such classes|categor(y|ies) of|different (classes|categories|provisions|dates)|for different (classes|purposes|areas|provisions))\b/i,
  risk: /\b(significant|systemic|high[- ]risk|risk[- ]based|critical (infrastructure|information))\b/i,
  smallBusiness: /\b(small|micro|medium|start-?ups?|sme|msme)\b/i,
};

export const SAFEGUARD = {
  hearing: /\b(opportunity of being heard|opportunity (to be heard|of making (a )?representation)|reasonable opportunity|natural justice|show[- ]cause|right to be heard|make representations?)\b/i,
  reasons: /\b(reasons? (to be |shall be |are to be )?(recorded|in writing|given|stated)|written reasons|record(ed)? (the |its )?reasons|reasons for (its|the) (decision|order))\b/i,
};

export const EXEMPTION = /\b(shall not apply|does not apply|do not apply|exempt(ed|ion|ions)?|except where|save as otherwise provided)\b/i;

/** Ex-post learning: a built-in duty to review or end the measure (OECD iREG: ex post evaluation). */
export const REVIEW = /\b(review (of|on) the (operation|working|implementation|effectiveness|impact)|(periodic|periodical|regular|annual|five[- ]year|triennial) review|shall be reviewed|(post[- ]implementation|ex[- ]post) (review|evaluation)|sunset|shall (cease to (have effect|operate|apply)|expire)|expires? (on|after)|evaluation of the (act|scheme|operation|programme))\b/i;

/** Legislative oversight of delegated powers. */
export const LAYING = /\b(laid before (each|either|both) house|laid before parliament|laid before the (house|legislature|national assembly)|negative resolution|affirmative (resolution|procedure)|annulled by|subject to annulment|approval of parliament)\b/i;

export const TRANSPARENCY = /\b(annual report|publish(ed)? (on|in) (its|the) (website|official)|shall publish|make (it |them )?(available to )?(the )?public|publicly available|publication of (its )?(decisions|orders|reports))\b/i;

/** Consultation before secondary rules are made (OECD iREG: stakeholder engagement). */
export const CONSULTATION = /\b(after consultation with|in consultation with|consult(ation)? (with|the)|previous publication|after (giving|inviting) (an )?opportunity|inviting (objections|comments|suggestions)|public consultation|consult (such|the|any|persons))\b/i;

export const COMMENCEMENT = /\b(come|came|comes|have come|deemed to have come) into (force|operation)\b/i;
export const COMMENCE_FIXED = /\b(on|from) the (date of (its )?(publication|assent|passing|commencement|enactment|royal assent)|\d{1,2}(st|nd|rd|th)? day of [A-Z][a-z]+,? \d{4}|first day of [A-Z][a-z]+,? \d{4})|\bon (the )?\d{1,2}(st|nd|rd|th)? [A-Z][a-z]+,? \d{4}|\bat the end of the period of\b|\bon the day on which (it|this (act|bill)) (receives|is passed|is published)|\bat the expiration of\b/i;
export const COMMENCE_BY_NOTICE = /\bsuch date as\b[^.]{0,80}\b(may|shall)\b[^.]{0,60}\b(appoint|notif|order|regulations)|\bon (such|a) day as\b[^.]{0,60}\b(may|shall)\b|\bby (notification|order|regulations)\b[^.]{0,40}\bappoint/i;

export const AMENDING = /\b(a bill|an act) (further )?to (amend|repeal)\b|\bto amend (the )?[\w ,'()-]{3,90}\b(act|code|ordinance)\b/i;
