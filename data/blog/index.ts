/**
 * Blog post content for the /blog/* pages.
 *
 * Every post opens answer-first: the H1 names the query, `hook` is a one-line
 * summary, `answer` is a 40–60-word direct answer shown right under the H1,
 * and `tldr` lists the key takeaways. The markdown `body` uses question-style
 * H2s, `faqs` feeds a visible FAQ and FAQPage structured data, and `sources`
 * lists the primary sources behind every regulatory fact.
 *
 * Internal links in `body` point only at public routes
 * (scripts/publicRoutes.mjs); __tests__/data/blogContent.test.ts checks this.
 */

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogSource {
  label: string;
  /** https URL of the primary source. */
  url: string;
}

export interface BlogPost {
  slug: string;
  /** H1. Names the query the post answers. */
  title: string;
  /** Document <title>, 60 characters or fewer including the brand suffix. */
  seoTitle: string;
  /** Meta description. */
  description: string;
  /** One-line hook shown under the H1 (22 words or fewer). */
  hook: string;
  /** Direct answer shown under the hook (40–60 words). */
  answer: string;
  /** Key takeaways, one sentence each. */
  tldr: string[];
  /** Publication date, e.g. '2026-06-07'. */
  date: string;
  /** Date of the last content review; also the Article dateModified. */
  lastReviewed: string;
  /** Markdown body; every H2 is a question. */
  body: string;
  faqs: BlogFaq[];
  sources: BlogSource[];
  tags: string[];
}

/** Date of the September 2026 content review. */
const REVIEWED = '2026-09-27';

const EUR_LEX_AI_ACT: BlogSource = {
  label: 'EUR-Lex, Regulation (EU) 2024/1689 (AI Act)',
  url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
};

const EUR_LEX_AI_OMNIBUS: BlogSource = {
  label: 'EUR-Lex, Regulation (EU) 2026/1744 (Digital Omnibus on AI)',
  url: 'https://eur-lex.europa.eu/eli/reg/2026/1744/oj',
};

const COMMISSION_AI_OMNIBUS: BlogSource = {
  label: 'European Commission, AI Omnibus enters into force',
  url: 'https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force',
};

const PARLIAMENT_AI_OMNIBUS: BlogSource = {
  label: 'European Parliament, AI Act: deal on simplification measures (7 May 2026)',
  url: 'https://www.europarl.europa.eu/news/en/press-room/20260427IPR42011/',
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'eu-ai-act-timeline-digital-omnibus',
    title: 'EU AI Act timeline after the Digital Omnibus (Regulation (EU) 2026/1744)',
    seoTitle: 'EU AI Act Timeline After the Digital Omnibus | ComplyEasyAI',
    description:
      'Every EU AI Act date after the Digital Omnibus, Regulation (EU) 2026/1744: what already applies, the new December 2026 bans, and high-risk duties in 2027 and 2028.',
    hook: 'The Digital Omnibus kept the 2025 and 2026 dates but moved high-risk duties to December 2027 and August 2028.',
    answer:
      'The EU AI Act applies in stages. Prohibitions have applied since 2 February 2025, general-purpose AI duties since 2 August 2025 and transparency rules since 2 August 2026. The Digital Omnibus, Regulation (EU) 2026/1744, adds two bans from 2 December 2026 and moves high-risk duties to 2 December 2027 (Annex III) and 2 August 2028 (Annex I).',
    tldr: [
      'Regulation (EU) 2026/1744 was published on 24 July 2026 and entered into force on 27 July 2026.',
      'Stand-alone high-risk systems (Annex III) must comply from 2 December 2027, and AI in regulated products (Annex I) from 2 August 2028.',
      'New bans on AI that generates non-consensual intimate imagery or child sexual abuse material apply from 2 December 2026.',
      'Generative AI already on the market before 2 August 2026 must mark its outputs by 2 December 2026.',
      'Prohibitions, AI literacy, general-purpose AI duties and transparency rules were not postponed.',
    ],
    date: '2026-09-27',
    lastReviewed: REVIEWED,
    tags: ['EU AI Act', 'Digital Omnibus', 'AI governance', 'regulatory timeline'],
    body: `## What applies today?

The Digital Omnibus did not pause the AI Act. Four layers already apply to anyone who places AI systems on the EU market or whose AI output is used in the EU:

- **Prohibited practices (since 2 February 2025).** Article 5 bans uses such as social scoring, manipulative techniques that cause significant harm, untargeted scraping of facial images and emotion recognition in workplaces and schools, with narrow exceptions.
- **AI literacy (since 2 February 2025).** The Omnibus rewrote Article 4: providers and deployers must take measures to support the AI literacy of the people who operate their systems, but they are not required to guarantee a specific level for each person.
- **General-purpose AI models (since 2 August 2025).** Providers of general-purpose AI (GPAI) models keep technical documentation, publish a copyright policy and a summary of the content used for training. Models with systemic risk also need evaluations, serious-incident reporting and cybersecurity protection. Models placed on the market before 2 August 2025 have until 2 August 2027.
- **Transparency (since 2 August 2026).** Article 50 applies from the Act's general application date. People must be told when they are interacting with an AI system, generative systems must mark synthetic audio, image, video and text in a machine-readable way, and deployers must disclose deepfakes and AI-generated text published to inform the public.

The governance structure (the AI Office and national authorities) and the penalty rules have applied since 2 August 2025. For the full list of requirements behind these dates, see our [EU AI Act guide](/eu-ai-act).

## What changes on 2 December 2026?

Two things, both introduced by the Omnibus.

**New prohibited practices.** Article 5 gains two bans:

- AI systems that generate or manipulate realistic images, video or audio of an identifiable person's intimate parts, or of that person engaged in sexually explicit activity, without their explicit consent.
- AI systems that generate or manipulate child sexual abuse material.

Placing such a system on the market is prohibited where that output is its intended purpose, or where it is a reasonably foreseeable and reproducible outcome and the system lacks adequate safeguards to prevent it. Using one is prohibited when the deployer uses it for that purpose.

**The marking deadline for systems already on the market.** Providers of generative systems placed on the market before 2 August 2026 must meet the Article 50(2) marking duty by 2 December 2026. New systems have had to comply since 2 August 2026.

## When do high-risk rules apply?

The Omnibus replaced the original dates for the high-risk obligations in Chapter III, Sections 1 to 3, with fixed calendar dates:

- **2 December 2027** for stand-alone high-risk systems listed in Annex III, such as biometrics, critical infrastructure, education, employment, access to essential services including credit scoring, law enforcement, migration and the administration of justice. The original date was 2 August 2026.
- **2 August 2028** for AI that is a safety component of a product covered by the EU harmonisation legislation in Annex I, such as toys, lifts, radio equipment and medical devices. The original date was 2 August 2027.

The requirements themselves are largely unchanged: risk management, data governance, technical documentation, logging, transparency to deployers, human oversight, accuracy and robustness, a quality management system and conformity assessment. For Annex I products, the Commission may use delegated acts, due by 2 August 2027, to limit specific requirements where the sectoral law already gives equivalent protection.

Systems already on the market before these dates are caught only if their design changes significantly afterwards, and the grace period covers further units of the same type and model. High-risk systems intended for public authorities must comply by 2 August 2030 regardless.

## What else did the Omnibus change?

- **Small mid-cap enterprises (SMCs).** Several SME measures now extend to SMCs, including a simplified technical documentation form and, for breaches other than prohibited practices, fines capped at the lower of the fixed amount or the turnover percentage.
- **Registration.** Systems that a provider concludes are not high-risk under Article 6(3) still go in the EU database, but with less information.
- **Bias detection.** A new Article 4a lets providers process special categories of personal data where strictly necessary to detect and correct bias, under strict safeguards.
- **Supervision.** The AI Office becomes exclusively competent for AI systems built on a general-purpose AI model by the same provider, and for AI in very large online platforms and search engines.
- **Sandboxes.** Each Member State must have a national AI regulatory sandbox running by 2 August 2027, and the AI Office may run one at EU level.

## What should you do this quarter?

1. **Refresh your AI inventory.** Record every AI system you build, buy or embed, and your role for each: provider, deployer, importer or distributor.
2. **Close the transparency gaps.** Check chatbot disclosures and machine-readable marking now; for generative systems launched before 2 August 2026, the deadline is 2 December 2026.
3. **Screen for the new prohibitions.** If a product generates images, video or audio of people, document the safeguards that prevent intimate or abusive content and how you correct reported misuse.
4. **Re-plan high-risk work, do not pause it.** The extra time is for building risk management, documentation and oversight properly. Our [EU AI Act compliance checklist](/blog/eu-ai-act-compliance-checklist) walks through each obligation.
5. **Collect upstream documentation.** If you build on a third-party general-purpose model, keep the provider's documentation in your own technical file.
6. **Reuse what you already run.** An AI management system under [ISO/IEC 42001](/iso-42001) and existing security controls cover much of the process work; [control mapping](/glossary/control-mapping) avoids doing it twice.

For a plain-language definition of the Act, see the [EU AI Act glossary entry](/glossary/eu-ai-act); for the wider picture, read [what AI compliance involves](/platform/ai-compliance).`,
    faqs: [
      {
        q: 'Did the Digital Omnibus delay the whole EU AI Act?',
        a: 'No. Prohibitions, AI literacy and general-purpose AI duties already applied, and transparency rules applied from 2 August 2026 as planned. The Omnibus moved the high-risk obligations, added a four-month marking grace period for existing generative systems and introduced two new prohibitions.',
      },
      {
        q: 'When do the new bans on AI-generated intimate imagery apply?',
        a: 'From 2 December 2026. They cover AI systems that generate or manipulate realistic intimate images, video or audio of an identifiable person without explicit consent, and systems that generate child sexual abuse material, where that is the intended purpose or a foreseeable outcome without adequate safeguards.',
      },
      {
        q: 'Do high-risk systems already on the market have to comply?',
        a: 'Only if their design changes significantly after the new application date; the grace period also covers further units of the same type and model. High-risk systems intended for use by public authorities must comply by 2 August 2030 in any case.',
      },
      {
        q: 'What is a small mid-cap enterprise under the AI Act?',
        a: 'A company that has outgrown the SME definition, as defined in Commission Recommendation (EU) 2025/1099. The Omnibus extends some SME relief to these companies, including simplified technical documentation and lower fine caps.',
      },
    ],
    sources: [EUR_LEX_AI_OMNIBUS, EUR_LEX_AI_ACT, COMMISSION_AI_OMNIBUS, PARLIAMENT_AI_OMNIBUS],
  },
  {
    slug: 'india-dpdp-rules-2025-timeline',
    title: 'India DPDP Rules 2025: what applies on 13 May 2027',
    seoTitle: 'DPDP Rules 2025: What Applies on 13 May 2027 | ComplyEasyAI',
    description:
      "When India's DPDP Rules 2025 apply and what they require: the Data Protection Board from November 2025, Consent Managers from 13 November 2026 and most duties from 13 May 2027.",
    hook: "Most of India's data protection duties switch on together on 13 May 2027. Here is what lands that day.",
    answer:
      "Most obligations under India's Digital Personal Data Protection Act, 2023 apply from 13 May 2027, eighteen months after the DPDP Rules, 2025 were published on 13 November 2025. The Data Protection Board provisions already apply, and Consent Manager rules start on 13 November 2026. Data Fiduciaries should use the time to rebuild notices, consent, security and rights handling.",
    tldr: [
      'The Data Protection Board provisions (Rules 1, 2 and 17 to 21) applied on publication, 13 November 2025.',
      'Consent Manager registration and obligations (Rule 4) apply from 13 November 2026.',
      "Notice, security, breach intimation, retention, children's data, Significant Data Fiduciary duties and rights handling apply from 13 May 2027.",
      'Breaches must be reported to the Board in detail within 72 hours, and rights requests answered within 90 days.',
      'Penalties reach INR 250 crore for failing to take reasonable security safeguards.',
    ],
    date: '2026-09-27',
    lastReviewed: REVIEWED,
    tags: ['India DPDP Act', 'DPDP Rules 2025', 'privacy', 'regulatory timeline'],
    body: `## Who is in scope?

The Digital Personal Data Protection Act, 2023 (the DPDP Act) covers digital personal data: data collected in digital form, or collected on paper and digitised later. It applies to processing in India, and to processing outside India that is connected with offering goods or services to people in India (section 3). A company serving Indian users is in scope wherever it is based.

The Act assigns four roles:

- **Data Fiduciary:** decides why and how personal data is processed, alone or with others.
- **Data Processor:** processes personal data on a Data Fiduciary's behalf.
- **Consent Manager:** a registered platform through which people give, review and withdraw consent.
- **Significant Data Fiduciary (SDF):** a Data Fiduciary the government notifies because of the volume and sensitivity of data it processes or the risk it poses.

## What applies on each date?

The DPDP Rules, 2025 were published in the Gazette of India on 13 November 2025 (G.S.R. 846(E)). Rule 1 staggers their start:

- **13 November 2025:** Rules 1, 2 and 17 to 21, which set up the Data Protection Board of India as a digital office, applied immediately.
- **13 November 2026:** Rule 4 on the registration and obligations of Consent Managers.
- **13 May 2027:** Rules 3, 5 to 16, 22 and 23, which cover notice, security safeguards, breach intimation, retention and erasure, contact details, children's data, SDF duties, Data Principal rights, cross-border transfers and the research exemption.

The Act's own sections were brought into force on the same staggered dates, so the core duties in sections 3 to 17 start on 13 May 2027. In January 2026 MeitY consulted industry on shortening the eighteen-month period to twelve. As of 27 September 2026 we have found no notified amendment, so the dates above stand; check MeitY and the Gazette before relying on them.

## What changes for notice and consent?

Consent must be free, specific, informed, unconditional and unambiguous, given by a clear affirmative action and limited to the data needed for the stated purpose (section 6). Rule 3 sets the minimum notice:

- It must stand on its own, not be buried in other terms.
- It must itemise the personal data collected and the specific purpose of the processing.
- It must link to a way to withdraw consent as easily as it was given, to exercise rights and to complain to the Board.

Unlike the GDPR, the Act has no general legitimate-interest ground. Processing without consent is limited to the "certain legitimate uses" listed in section 7, such as data a person provides voluntarily for a specified purpose, employment and legal obligations.

## What security and breach duties apply?

Rule 6 lists minimum reasonable security safeguards: encryption, masking, obfuscation or tokenisation; access control; logging and monitoring to detect and investigate unauthorised access; backups for continuity; and contracts that bind Data Processors to the same safeguards. Logs must be kept for one year.

When a breach occurs, Rule 7 requires two notices:

1. Each affected person, without delay and in plain language: what happened, the likely consequences, what you are doing and what they can do.
2. The Board, without delay, followed within 72 hours of becoming aware by a detailed report on the facts, causes, mitigation, remedial measures and the notices sent.

Rule 8 adds retention limits. Large e-commerce, online gaming and social media platforms must erase a user's data three years after the user last engaged, unless another law requires it, and warn the user 48 hours before erasure. Every Data Fiduciary must also keep processing logs for at least one year.

## What extra duties apply to children's data and SDFs?

A child is anyone under 18. Data Fiduciaries need verifiable parental consent before processing a child's data (Rule 10), and may not track, behaviourally monitor or target advertising at children (section 9). The Fourth Schedule exempts specified classes, such as healthcare and educational institutions, and specified purposes.

An SDF must appoint a Data Protection Officer based in India and an independent data auditor, run a Data Protection Impact Assessment and an audit every twelve months and report significant findings to the Board (Rule 13). It must also check that its algorithmic software does not risk Data Principals' rights, and keep government-specified data in India.

## How does DPDP compare with GDPR?

Programs built for the [GDPR](/gdpr) carry over well: both require notice, security, breach reporting and individual rights, and both reach companies outside their territory. The differences matter:

- DPDP relies on consent and a closed list of legitimate uses; there is no legitimate-interest ground.
- It covers only digital personal data and has no special categories of data.
- Rights requests get up to 90 days, against one month (extendable by two) under the GDPR.
- Penalties are fixed amounts, up to INR 250 crore for security failures and INR 200 crore for breach-notification or children's-data failures, not a share of turnover.

## What should you do before 13 May 2027?

1. **Map your data.** Build an inventory of the personal data you process about people in India, the purposes, and your role for each activity.
2. **Rewrite notices and consent flows** to the Rule 3 format, and plan for Consent Managers from 13 November 2026.
3. **Test breach response** against the two-stage Rule 7 process and the 72-hour report.
4. **Set up rights handling** that answers access, correction, erasure and nomination requests within 90 days.
5. **Check children's data and SDF exposure,** including age assurance and parental consent.
6. **Reuse your privacy evidence.** Our [India DPDPA guide](/india-dpdpa) lists the requirements, and [control mapping](/glossary/control-mapping) lets GDPR controls count twice.`,
    faqs: [
      {
        q: 'When does the DPDP Act take full effect?',
        a: 'On 13 May 2027 for most obligations, eighteen months after the DPDP Rules were published on 13 November 2025. The Data Protection Board provisions applied immediately and Consent Manager rules apply from 13 November 2026. MeitY consulted on shortening the timeline in January 2026, but we found no notified amendment as of 27 September 2026.',
      },
      {
        q: 'Does the DPDP Act apply to companies outside India?',
        a: 'Yes. Section 3 covers processing outside India that is connected with offering goods or services to Data Principals in India, so businesses serving Indian users are in scope wherever they are based.',
      },
      {
        q: 'How fast must a personal data breach be reported?',
        a: 'Affected people and the Data Protection Board must be told without delay, and the Board must receive a detailed report within 72 hours of the Data Fiduciary becoming aware of the breach, unless the Board allows longer on a written request.',
      },
      {
        q: 'What are the penalties under the DPDP Act?',
        a: 'Up to INR 250 crore for failing to take reasonable security safeguards, up to INR 200 crore for failing to notify a breach or breaching the duties on children, and up to INR 50 crore for other breaches by a Data Fiduciary.',
      },
    ],
    sources: [
      {
        label: 'Gazette of India, Digital Personal Data Protection Rules, 2025 (G.S.R. 846(E), 13 November 2025)',
        url: 'https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf',
      },
      {
        label: 'Gazette of India, Digital Personal Data Protection Act, 2023',
        url: 'https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf',
      },
      {
        label: 'PIB, Government notifies DPDP Rules (14 November 2025)',
        url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190014',
      },
      {
        label: 'PIB backgrounder, DPDP Rules, 2025 notified (17 November 2025)',
        url: 'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf',
      },
      {
        label: 'Internet Freedom Foundation, statement on the DPDP Rules and the Act’s staggered commencement',
        url: 'https://internetfreedom.in/iffs-initial-statement-on-the-notification-of-the-digital-data-protection-rules-2025/',
      },
      {
        label: 'S.S. Rana & Co., MeitY consultation on shortening the DPDP timeline (February 2026)',
        url: 'https://ssrana.in/articles/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs/',
      },
    ],
  },
  {
    slug: 'csrd-after-omnibus-i',
    title: 'CSRD after Omnibus I (Directive (EU) 2026/470): who still reports?',
    seoTitle: 'CSRD After Omnibus I: Who Still Reports? | ComplyEasyAI',
    description:
      'Omnibus I cut CSRD scope to companies with more than 1,000 employees and €450 million turnover. Who still reports, from when, and with what assurance.',
    hook: 'Omnibus I cut the CSRD back to the largest companies. Check both thresholds before you plan another report.',
    answer:
      'After Omnibus I, Directive (EU) 2026/470, the CSRD covers only EU companies and groups with more than 1,000 employees on average and net turnover above €450 million, plus non-EU groups with over €450 million of EU turnover from 2028. Listed SMEs are out, reasonable assurance is dropped, and Member States must transpose the changes by 19 March 2027.',
    tldr: [
      'From financial year 2027, EU companies, groups and issuers report only if they exceed both 1,000 employees on average and €450 million net turnover.',
      'Listed SMEs are removed from the regime, and the planned move to reasonable assurance is deleted.',
      'Non-EU groups report from financial year 2028 if their EU turnover exceeds €450 million and an EU subsidiary or branch exceeds €200 million.',
      'First-wave companies below the new thresholds can be exempted by their Member State for 2025 and 2026.',
      'Member States must transpose the CSRD changes by 19 March 2027.',
    ],
    date: '2026-09-27',
    lastReviewed: REVIEWED,
    tags: ['CSRD', 'Omnibus I', 'ESRS', 'sustainability reporting'],
    body: `## Who is still in scope?

Omnibus I, Directive (EU) 2026/470, was published in the Official Journal on 26 February 2026 and entered into force on 18 March 2026. It rewrites the Corporate Sustainability Reporting Directive (CSRD) scope around two thresholds that must **both** be exceeded:

- an average of more than **1,000 employees** during the financial year; and
- net turnover above **€450 million**.

The same test applies at three levels: an individual undertaking, a parent measured on its consolidated group, and an issuer with securities on an EU regulated market. Companies below either threshold are out of mandatory reporting, although they may report voluntarily.

Two groups lose their obligation entirely. **Listed SMEs**, which were due to report later in the phase-in, are removed from the regime. **First-wave companies** that reported for 2024 (large public-interest entities with more than 500 employees) stay subject to the old rules only for financial years 2024 to 2026; from 2027 they report only if they meet the new thresholds, and Member States may exempt those below the thresholds for 2025 and 2026.

## What changed for non-EU groups?

Non-EU groups report through their EU subsidiaries or branches, and Omnibus I raises both triggers:

- the group's net turnover in the EU must exceed **€450 million** in each of the last two consecutive financial years (previously €150 million); and
- the EU subsidiary or branch that publishes the report must have net turnover above **€200 million**.

These reports apply to financial years starting on or after 1 January 2028. Financial holding groups whose subsidiaries run independent businesses may choose not to publish the group report.

## What happened to assurance?

Sustainability reports still need an assurance opinion from a statutory auditor or, where a Member State allows it, an accredited independent assurance provider. Two things changed:

- **Only limited assurance.** The Commission's power to adopt reasonable-assurance standards, planned for 2028, is deleted.
- **Standards later.** The deadline for the Commission's limited-assurance standards moves from 1 October 2026 to 1 July 2027.

A transitional regime also lets non-EU auditors that assure the reports of non-EU companies listed in the EU register under simpler conditions for financial years 2025 to 2030.

## What happens to the ESRS and value-chain requests?

Reports still follow the European Sustainability Reporting Standards (ESRS) and the double-materiality principle. The Commission adopted revised ESRS on 3 July 2026, cutting mandatory datapoints by more than 60% and total datapoints by more than 70%. EFRAG states that they apply to financial years beginning on or after 1 January 2027, with voluntary use for 2026 once the delegated act is in force.

Omnibus I also:

- **drops sector-specific standards**, which were due by 30 June 2026; and
- **caps value-chain requests.** Companies in scope may not require suppliers with up to 1,000 employees to provide more than the voluntary reporting standard covers.

## What are the next dates?

- **17 April 2025:** the "stop-the-clock" Directive (EU) 2025/794 entered into force, postponing the second wave to financial year 2027.
- **18 March 2026:** Omnibus I entered into force.
- **19 March 2027:** Member States must transpose the CSRD changes into national law.
- **1 July 2027:** deadline for the Commission's limited-assurance standards.
- **Financial year 2027:** first reports under the new thresholds, published in 2028.
- **Financial year 2028:** first reports by non-EU groups.

Omnibus I also amended the Corporate Sustainability Due Diligence Directive: Member States now transpose it by 26 July 2028 and apply it from 26 July 2029.

## What should companies now out of scope do?

Leaving the mandatory regime does not end the questions. Banks, investors and large customers still ask for emissions, workforce and governance data, and the value-chain cap only limits what CSRD reporters can demand of you.

1. **Confirm your position** against both thresholds, at company and group level, and watch your national transposition law.
2. **Keep the data you already built.** Emissions inventories and policies remain useful for customers and lenders.
3. **Answer requests with the voluntary standard** so one data set serves every customer.
4. **Track headcount and turnover each year.** Crossing both thresholds brings you back into scope.

If you are still in scope, our [CSRD guide](/csrd-compliance) covers double materiality and the ESRS. Treating disclosures as evidence tied to owned controls, the same way you run [evidence collection](/glossary/evidence-collection) for security audits, makes limited assurance easier.`,
    faqs: [
      {
        q: 'Do listed SMEs still have to report under the CSRD?',
        a: 'No. Omnibus I removed listed small and medium-sized undertakings from mandatory sustainability reporting. They can still report voluntarily, and the voluntary standard also caps what larger customers can ask of them.',
      },
      {
        q: 'Does the €450 million threshold apply to the company or the group?',
        a: 'Both, depending on the report. An undertaking exceeding both thresholds reports on its own, and a parent whose group exceeds them on a consolidated basis reports for the group. Issuers on EU regulated markets use the same test.',
      },
      {
        q: 'Is reasonable assurance still coming?',
        a: 'No. Omnibus I deleted the Commission’s power to adopt reasonable-assurance standards, so reports need limited assurance only. The limited-assurance standards are now due by 1 July 2027.',
      },
      {
        q: 'When do companies in scope first report under the new rules?',
        a: 'For financial years starting on or after 1 January 2027, with reports published in 2028. Non-EU groups report for financial years starting on or after 1 January 2028. National transposition, due by 19 March 2027, can add detail, so check your Member State’s law.',
      },
    ],
    sources: [
      {
        label: 'EUR-Lex, Directive (EU) 2026/470 (Omnibus I)',
        url: 'https://eur-lex.europa.eu/eli/dir/2026/470/oj',
      },
      {
        label: 'EUR-Lex, Directive (EU) 2025/794 (stop-the-clock)',
        url: 'https://eur-lex.europa.eu/eli/dir/2025/794/oj',
      },
      {
        label: 'EUR-Lex, Directive (EU) 2022/2464 (CSRD)',
        url: 'https://eur-lex.europa.eu/eli/dir/2022/2464/oj',
      },
      {
        label: 'European Commission, revised sustainability reporting standards adopted (3 July 2026)',
        url: 'https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-2026-07-03_en',
      },
      {
        label: 'EFRAG, Commission publishes delegated act on revised ESRS',
        url: 'https://www.efrag.org/en/news-and-calendar/news/european-commission-publishes-delegated-act-on-revised-esrs-and-voluntary-sustainability-reporting',
      },
      {
        label: 'European Parliament, Legislative Train: Omnibus I (CSRD and CSDDD)',
        url: 'https://www.europarl.europa.eu/legislative-train/package-simplification-business/file-first-omnibus-package-on-sustainability-proposal-amending-csrd-and-csddd',
      },
    ],
  },
  {
    slug: 'eu-ai-act-compliance-checklist',
    title: 'EU AI Act Compliance Checklist: 2026 Update',
    seoTitle: 'EU AI Act Compliance Checklist (2026) | ComplyEasyAI',
    description:
      'A step-by-step EU AI Act checklist with the post-Omnibus dates: transparency since August 2026, new bans from December 2026, high-risk duties from December 2027.',
    hook: 'A step-by-step EU AI Act checklist with the new dates: transparency since August 2026, high-risk duties from December 2027.',
    answer:
      "To comply with the EU AI Act, inventory your AI systems, classify each by risk tier and your role, then apply that tier's duties by its deadline. Prohibited practices are already banned, general-purpose AI duties apply and transparency duties have applied since 2 August 2026. Most high-risk duties now apply from 2 December 2027.",
    tldr: [
      'The 2026 Digital Omnibus moved high-risk deadlines to 2 December 2027 (Annex III) and 2 August 2028 (Annex I).',
      'Transparency duties for chatbots and synthetic content have applied since 2 August 2026.',
      'Prohibitions (since February 2025) and general-purpose AI duties (since August 2025) already apply.',
      'Fines reach €35 million or 7% of worldwide annual turnover for prohibited practices.',
    ],
    date: '2026-06-07',
    lastReviewed: REVIEWED,
    tags: ['EU AI Act', 'AI compliance', 'AI governance', 'checklist'],
    body: `## What are the key EU AI Act dates?

- **2 February 2025:** prohibited practices banned; AI-literacy provisions apply.
- **2 August 2025:** general-purpose AI (GPAI) model obligations apply.
- **2 August 2026:** Article 50 transparency duties apply (chatbots, deepfakes, AI-generated text).
- **2 December 2026:** new bans on AI that generates non-consensual intimate imagery or child sexual abuse material; marking deadline for generative systems already on the market.
- **2 December 2027:** high-risk obligations for Annex III systems (for example hiring, education, credit scoring, critical infrastructure).
- **2 August 2028:** high-risk obligations for AI in products covered by Annex I (for example toys, lifts and medical devices).

These dates reflect Regulation (EU) 2026/1744, the Digital Omnibus on AI, which amended the Act from 27 July 2026. Our [EU AI Act timeline](/blog/eu-ai-act-timeline-digital-omnibus) explains each change, and the [EU AI Act guide](/eu-ai-act) and [glossary entry](/glossary/eu-ai-act) cover the regulation itself.

## How do you work through the checklist?

### Step 1 — Inventory your AI systems

You cannot classify what you have not catalogued. Build an inventory of every AI system you develop, deploy or embed, recording for each:

- Its purpose and the decisions it influences
- Whether you act as a provider, deployer, or both
- The data it is trained on and operates over
- Where and to whom it is made available

This inventory is the foundation for every later step and overlaps with the data mapping you may already maintain for the [GDPR](/gdpr).

### Step 2 — Classify each system by risk tier

The Act applies obligations according to risk:

- **Prohibited:** practices such as social scoring or harmful manipulation are banned outright.
- **High-risk:** systems used in the areas listed in Annex III, or as safety components of products in Annex I, carry the most extensive obligations.
- **Limited-risk:** systems that interact with people (for example, chatbots) or generate synthetic content carry transparency duties.
- **Minimal-risk:** most other AI faces no specific obligations.

Record your role for each system: provider, deployer, importer or distributor. The duties differ. Document the rationale for each classification and revisit it when a system changes.

### Step 3 — Eliminate prohibited practices

For any system that falls into a prohibited category, the only compliant path is to stop the practice. Confirm that none of your systems engage in banned uses, including the two bans that apply from 2 December 2026, and record the assessment as evidence.

### Step 4 — Meet high-risk obligations (by 2 December 2027 or 2 August 2028)

High-risk systems require a coordinated control set:

- **Risk management system:** a continuous process to identify and mitigate risks across the lifecycle
- **Data governance:** controls over training, validation and testing data quality and representativeness
- **Technical documentation:** enough detail to demonstrate conformity
- **Record-keeping:** automatic logging of system events for traceability
- **Transparency:** clear information that lets deployers use the system correctly
- **Human oversight:** measures allowing meaningful human intervention
- **Accuracy, robustness and cybersecurity:** appropriate performance and resilience measures
- **Quality management system:** organizational processes that keep the system conformant
- **Conformity assessment:** completed before placing the system on the market
- **Registration:** register Annex III systems in the EU database before placing them on the market (Article 49)
- **Post-market monitoring and incident reporting:** monitor performance in use and report serious incidents (Articles 72 and 73)
- **Fundamental rights impact assessment:** required before use by deployers that are public bodies or provide public services, and by deployers of credit-scoring and life or health insurance pricing systems (Article 27)

Many of these map onto controls you already operate for security and privacy. [Control mapping](/glossary/control-mapping) lets you reuse that work rather than duplicate it.

### Step 5 — Apply transparency duties

People must be told when they are interacting with an AI system unless it is obvious, and synthetic audio, image, video and text must be marked as AI-generated in a machine-readable way. Deployers must disclose deepfakes and AI-generated text published to inform the public. These duties have applied since 2 August 2026; generative systems already on the market before then have until 2 December 2026 to add marking.

### Step 6 — Check general-purpose AI duties

If you provide a general-purpose AI model, you need technical documentation, a copyright policy and a public summary of the content used for training; models with systemic risk also need evaluations, serious-incident reporting and cybersecurity protections. If you build on a third-party model, collect the provider's documentation for your own file.

### Step 7 — Operationalize governance and oversight

The Act expects governance to be ongoing, not a one-time exercise. Align your program with a recognized framework such as the [NIST AI RMF](/glossary/nist-ai-rmf), which structures AI risk work into GOVERN, MAP, MEASURE and MANAGE functions. Assign clear ownership, define human-oversight procedures, and schedule periodic review of each system's classification and controls.

### Step 8 — Maintain continuous evidence

As with security frameworks, you must be able to *demonstrate* conformity, not just assert it. Maintain current documentation, event logs, risk assessments and oversight records. [Continuous evidence collection](/glossary/continuous-compliance) keeps this material current as systems evolve and makes a conformity assessment or regulator inquiry far less disruptive.

## What did the 2026 Digital Omnibus change?

It postponed the high-risk deadlines, added two prohibited practices (AI-generated non-consensual intimate imagery and child sexual abuse material), extended some SME simplifications to small mid-caps, softened the AI-literacy duty, simplified registration for systems a provider assesses as not high-risk, and gave the AI Office wider supervision of AI built on general-purpose models. The high-risk requirements themselves stay largely the same; what changed is when they apply.

## How does it all fit together?

The EU AI Act rewards organizations that treat AI governance as an extension of their existing compliance program rather than a separate silo. Inventory and classify first, apply tier-appropriate controls, reuse mapped controls across frameworks, and keep evidence continuous. To see how ComplyEasyAI supports this, visit the [EU AI Act guide](/eu-ai-act) or read [what AI compliance involves](/platform/ai-compliance).`,
    faqs: [
      {
        q: 'When do EU AI Act high-risk rules apply?',
        a: 'From 2 December 2027 for stand-alone systems listed in Annex III, and from 2 August 2028 for AI in products covered by Annex I, after the 2026 Digital Omnibus. The original dates were 2 August 2026 and 2 August 2027.',
      },
      {
        q: 'Does the EU AI Act apply to US companies?',
        a: "Yes, if you place AI systems or general-purpose models on the EU market, or your system's output is used in the EU, whether or not you have an EU establishment.",
      },
      {
        q: 'What are the penalties?',
        a: 'Up to €35 million or 7% of worldwide annual turnover for prohibited practices, €15 million or 3% for most other breaches, and €7.5 million or 1% for supplying incorrect information. SMEs pay the lower of the two amounts, and the Omnibus extends that to small mid-caps for the lower two tiers.',
      },
      {
        q: 'Is ISO 42001 certification enough?',
        a: 'No. ISO/IEC 42001 gives you the AI management system many of the Act’s process duties rely on, but a certificate is not a conformity assessment under the Act. You still need its technical documentation, conformity assessment and registration steps.',
      },
    ],
    sources: [EUR_LEX_AI_ACT, EUR_LEX_AI_OMNIBUS, COMMISSION_AI_OMNIBUS, PARLIAMENT_AI_OMNIBUS],
  },
  {
    slug: 'how-to-automate-soc-2-compliance-with-ai',
    title: 'How to Automate SOC 2 Compliance with AI',
    seoTitle: 'How to Automate SOC 2 Compliance with AI | ComplyEasyAI',
    description:
      'Automate SOC 2 by connecting your systems, collecting evidence continuously and monitoring controls. What AI can and cannot do, step by step.',
    hook: 'Connect your systems, let agents collect evidence as controls run, and turn audit prep into a review.',
    answer:
      'You automate SOC 2 by connecting your cloud, identity, code and ticketing systems to a platform that collects evidence and monitors controls continuously. AI agents gather the artifacts auditors request as controls operate, flag drift immediately and keep one mapped control library current, so audit preparation becomes a review of evidence that already exists.',
    tldr: [
      'Type II tests controls over a period, typically 3–12 months, so collect evidence continuously.',
      'Connect cloud, identity, code, ticketing and HR systems first.',
      'Monitor for drift and fix issues in minutes, not at audit time.',
      'Map controls once to reuse evidence for ISO 27001, GDPR or HIPAA.',
      'AI does not replace your CPA auditor or your scoping decisions.',
    ],
    date: '2026-06-07',
    lastReviewed: REVIEWED,
    tags: ['SOC 2', 'automation', 'AI compliance', 'evidence collection'],
    body: `## What does SOC 2 actually require?

SOC 2 is an AICPA attestation that evaluates how a service organization manages customer data against the Trust Services Criteria: security, availability, processing integrity, confidentiality and privacy. A **Type I** report assesses control design at a point in time; a **Type II** report tests whether controls operated effectively over a period, usually three to twelve months.

The hard part of a Type II audit is not designing controls; it is proving they ran continuously. That proof is *evidence*: access reviews, configuration states, change-management records, log exports and vulnerability-scan results, gathered repeatedly across the audit window.

If you are new to the framework, our [SOC 2 guide](/soc2-compliance) covers scoping and the Trust Services Criteria in depth.

## How do you automate SOC 2, step by step?

### Step 1 — Connect your source systems

Automation starts with integrations. Connect the systems where your controls actually live:

- **Cloud infrastructure** (AWS, GCP, Azure) for configuration and access state
- **Identity provider** for user provisioning, MFA and access reviews
- **Code and CI/CD** (GitHub, GitLab) for change management and code review
- **Ticketing** for incident and change records
- **HR systems** for onboarding and offboarding evidence

Once connected, the platform can read control state directly from the source of truth instead of relying on manual screenshots.

### Step 2 — Let AI agents collect evidence continuously

This is where AI changes the economics. Instead of an engineer assembling a folder of screenshots before the audit, agents query each connected system on a schedule and attach the resulting artifacts to the controls they support.

Because collection happens **as controls operate**, evidence accrues steadily over the audit period, which is exactly what a Type II report needs. AI also helps interpret unstructured evidence: classifying a configuration as compliant or not, summarizing an access review, or extracting the relevant fields from a log export.

Learn more about the mechanics in our [evidence collection](/glossary/evidence-collection) and [continuous compliance](/glossary/continuous-compliance) glossary entries.

### Step 3 — Monitor controls and remediate drift

Evidence tells you what happened; monitoring tells you the moment something breaks. Continuous control monitoring watches connected systems for drift, such as a disabled MFA policy, an over-privileged role or a failed backup, and alerts the owner immediately.

Some platforms also use **agentic automation**: an agent detects a misconfiguration and proposes a remediation, with human approval for high-impact changes and a rollback path if something goes wrong. That shrinks the window in which a control is out of compliance from weeks to minutes.

### Step 4 — Map controls once, reuse everywhere

Most teams pursuing SOC 2 also need ISO 27001, GDPR or HIPAA, and these frameworks overlap heavily. With [control mapping](/glossary/control-mapping), a single control, say enforced encryption at rest, satisfies the corresponding requirement in every framework it touches. You implement and evidence it once.

This is the difference between running several separate audits and running one unified compliance program. Adding a new framework becomes a matter of identifying the incremental controls you do not already cover.

### Step 5 — Stay audit-ready, not just audit-prepared

The goal is a steady state of [audit readiness](/glossary/audit-readiness): at any moment, controls are implemented, evidence is current, and known gaps are resolved. When the auditor arrives, you grant access to an organized, continuously maintained evidence base rather than building one under deadline.

## What can AI automate, and what can't it?

AI automates the repetitive, high-volume work: collecting evidence, watching for drift, mapping controls and drafting documentation. It does **not** replace the auditor, who still issues the independent opinion, and it does not remove the need for human judgment on scoping, risk acceptance and policy decisions. Used well, it frees your team to focus on those decisions instead of on screenshots.

## How do you get started?

If you are scoping a first SOC 2 or trying to make recertification less painful, the practical path is: connect your systems, turn on continuous evidence collection and monitoring, and map your controls across every framework you need. See how ComplyEasyAI approaches this in the [SOC 2 guide](/soc2-compliance).`,
    faqs: [
      {
        q: 'Can SOC 2 be fully automated?',
        a: 'No. Evidence collection, monitoring and control mapping can be automated, but scoping, risk acceptance and the audit itself need people, and only an independent CPA firm can issue the report.',
      },
      {
        q: 'How long does SOC 2 Type II take with automation?',
        a: 'Readiness can take weeks, but the observation period usually runs three to twelve months, and tooling cannot shorten it.',
      },
      {
        q: 'What evidence do SOC 2 auditors ask for?',
        a: 'Access reviews, MFA and provisioning records, configuration baselines, change tickets, vulnerability scans, backup tests, incident records, vendor reviews and policy acknowledgements, sampled across the observation period.',
      },
    ],
    sources: [
      {
        label: 'AICPA, 2017 Trust Services Criteria (revised points of focus, 2022)',
        url: 'https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022',
      },
    ],
  },
];

export const blogSlugs = blogPosts.map((p) => p.slug);

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

/** Posts newest first: by last review, then by publication date. */
export function blogPostsNewestFirst(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => b.lastReviewed.localeCompare(a.lastReviewed) || b.date.localeCompare(a.date),
  );
}
