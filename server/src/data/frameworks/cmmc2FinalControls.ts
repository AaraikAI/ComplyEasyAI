import { FrameworkControlTemplate } from './soc2Controls';

/**
 * CMMC 2.0 Final Rule — 32 CFR Part 170
 *
 * The Cybersecurity Maturity Model Certification Program Final Rule was
 * published October 15, 2024 and became effective December 16, 2024. The
 * companion 48 CFR (DFARS) acquisition rule that triggers CMMC contract
 * clauses began phased rollout on November 10, 2025.
 *
 * This catalog covers FINAL-RULE-SPECIFIC obligations — not the full set of
 * NIST SP 800-171 r2 / r3 or NIST SP 800-172 controls (those are covered by
 * the base CMMC catalog). Use these alongside the existing CMMC controls.
 *
 * Phase-in schedule (DFARS 252.204-7021 rollout):
 *   - Phase 1 (Nov 10, 2025): Level 1 and Level 2 self-assessment required
 *     for applicable solicitations and contracts
 *   - Phase 2 (Nov 10, 2026): Level 2 C3PAO certification required
 *   - Phase 3 (Nov 10, 2027): Level 3 DIBCAC assessment required
 *   - Phase 4 (Nov 10, 2028): All applicable contracts include CMMC clauses
 *
 * Reference: 32 CFR Part 170 Subparts A-F.
 */

export const CMMC_2_FINAL_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Program Scope and Applicability =====
  {
    controlId: 'CMMC2F-SCOPE.1',
    name: '32 CFR Part 170 Program Scope Determination',
    description: 'Determine the applicability of the CMMC Program under 32 CFR Part 170 to the organization\'s DoD contract portfolio and document the required CMMC level for each in-scope contract.',
    category: 'Program Scope',
    implementationGuidance: 'Review the current contract portfolio and pipeline. For each DoD prime or subcontract, identify whether the solicitation or contract contains DFARS 252.204-7021 (or its predecessor 7012) requirements. Determine whether the contract involves Federal Contract Information (FCI) only — Level 1 — or Controlled Unclassified Information (CUI) — Level 2 or Level 3 as specified by the contracting officer. Maintain a contract-to-level mapping refreshed at each modification.',
    evidenceRequirements: ['Contract portfolio with FCI/CUI flagging', 'DFARS clause inventory per contract', 'CMMC level determination per contract', 'Mapping refresh log following contract modifications'],
    testProcedures: ['Inspect the contract-to-level mapping for completeness', 'Sample contracts and verify DFARS clause identification', 'Confirm the mapping reflects recent contract modifications'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMC2F-SCOPE.2',
    name: 'FCI versus CUI Information Scoping',
    description: 'Categorize information assets as Federal Contract Information (FCI), Controlled Unclassified Information (CUI), or neither, and document the basis for each classification per the 32 CFR Part 170 scoping guides.',
    category: 'Program Scope',
    implementationGuidance: 'FCI is information not intended for public release that is provided by or generated for the Government under a contract. CUI is information requiring safeguarding or dissemination controls per the CUI Registry. Apply the CMMC Level 1 and Level 2 scoping guides issued by the DoD to identify in-scope assets, people, and processes. Categorize: CUI Assets (process, store, transmit), Security Protection Assets, Contractor Risk Managed Assets, Specialized Assets, and Out-of-Scope Assets. Document the rationale per asset category.',
    evidenceRequirements: ['Asset inventory with FCI/CUI/none classification', 'Application of CMMC Level 1 and Level 2 scoping guides', 'Asset categorization (CUI, SPA, CRMA, Specialized, OOS)', 'Documented rationale per category'],
    testProcedures: ['Sample assets and verify classification matches CUI Registry rules', 'Inspect the categorization decision rationale for asset categories', 'Confirm scoping decisions are aligned with the most recent DoD scoping guides'],
    status: 'Not Started'
  },

  // ===== Level Determinations =====
  {
    controlId: 'CMMC2F-L1.1',
    name: 'Level 1 Annual Self-Assessment and Affirmation',
    description: 'Conduct an annual Level 1 self-assessment of the 15 FAR 52.204-21 requirements and submit a senior official affirmation via the Supplier Performance Risk System (SPRS).',
    category: 'Level 1',
    implementationGuidance: 'Conduct a self-assessment against all 15 Level 1 practices derived from FAR 52.204-21. Document evidence demonstrating implementation. A senior official of the company must affirm continuing compliance at the time of the assessment and annually thereafter. Submit the affirmation through SPRS. Retain assessment workpapers and evidence for at least six years. Re-assess upon any material change to the information system.',
    evidenceRequirements: ['Level 1 self-assessment workpapers covering 15 practices', 'Senior official affirmation record submitted in SPRS', 'Evidence repository per practice', 'Annual reassessment schedule with completion dates'],
    testProcedures: ['Inspect the most recent self-assessment for coverage of all 15 practices', 'Verify the senior official affirmation has been submitted in SPRS within the past 12 months', 'Sample practices and verify implementing evidence exists'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMC2F-L2.1',
    name: 'Level 2 Self-Assessment Eligibility and Submission',
    description: 'For Level 2 contracts allowing self-assessment, conduct a triennial self-assessment against all 110 NIST SP 800-171 r2 requirements, score using the DoD Assessment Methodology, and submit results to SPRS.',
    category: 'Level 2',
    implementationGuidance: 'Level 2 self-assessment is permitted only where the DoD has explicitly designated the requirement as such in the contract. Conduct a full assessment against all 110 NIST SP 800-171 r2 controls. Apply the DoD Assessment Methodology scoring (starting from 110 and deducting weighted points per unmet control). Submit the score, scope, and assessment date to SPRS. Reassess at least every three years and upon material change. The senior official must affirm continuing compliance annually.',
    evidenceRequirements: ['Triennial Level 2 self-assessment report', 'DoD Assessment Methodology scoring worksheet', 'SPRS submission record with score and date', 'Annual senior official affirmation record'],
    testProcedures: ['Inspect the self-assessment for coverage of all 110 NIST SP 800-171 r2 controls', 'Recompute the DoD Assessment Methodology score from the worksheet', 'Verify SPRS submission and annual affirmation are current'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMC2F-L2.2',
    name: 'Level 2 C3PAO Certification Assessment',
    description: 'For Level 2 contracts requiring certification, engage a CMMC Third-Party Assessment Organization (C3PAO) authorized by the Cyber AB to conduct a triennial certification assessment.',
    category: 'Level 2',
    implementationGuidance: 'Engage a Cyber AB-authorized C3PAO. The C3PAO Lead Assessor must be a Certified CMMC Assessor (CCA). The assessment scope must reflect the defined CMMC assessment scope (CUI Assets and Security Protection Assets) and may not omit in-scope assets. The C3PAO uploads results to the CMMC Enterprise Mission Assurance Support Service (eMASS). Maintain the C3PAO engagement letter, scoping documentation, evidence index, and final assessment report. Recertify every three years.',
    evidenceRequirements: ['C3PAO engagement letter with Cyber AB authorization reference', 'Defined CMMC assessment scope document', 'C3PAO assessment evidence index', 'eMASS-uploaded assessment results with score'],
    testProcedures: ['Verify the C3PAO is on the current Cyber AB authorized list', 'Inspect the assessment scope for coverage of CUI and Security Protection Assets', 'Confirm assessment results were uploaded to eMASS within the required window'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMC2F-L3.1',
    name: 'Level 3 DIBCAC Government Assessment',
    description: 'For Level 3 contracts, achieve and maintain Level 2 certification as a prerequisite, then undergo a triennial Government assessment by the Defense Industrial Base Cybersecurity Assessment Center (DIBCAC).',
    category: 'Level 3',
    implementationGuidance: 'Level 3 requires implementation of all 110 NIST SP 800-171 r2 controls plus a selection of enhanced security requirements derived from NIST SP 800-172. A Level 2 certification by a C3PAO is a prerequisite. Schedule the DIBCAC assessment through the appropriate DoD coordination channel. Prepare evidence for the additional 800-172 requirements. Recertify every three years. The senior official affirms compliance annually.',
    evidenceRequirements: ['Active Level 2 certification record (prerequisite)', 'DIBCAC engagement coordination documentation', 'NIST SP 800-172 enhanced requirement evidence index', 'Triennial Level 3 assessment result and annual affirmations'],
    testProcedures: ['Verify Level 2 certification is currently active', 'Inspect evidence for selected NIST SP 800-172 enhanced requirements', 'Confirm DIBCAC assessment result is within the triennial validity period'],
    status: 'Not Started'
  },

  // ===== POA&M Restrictions =====
  {
    controlId: 'CMMC2F-POAM.1',
    name: 'Plan of Action and Milestones (POA&M) Eligibility and Restrictions',
    description: 'Manage Plans of Action and Milestones strictly within the limits set by 32 CFR Part 170 — POA&Ms are permitted only for specified lower-weighted requirements and must be closed within 180 days for conditional status conversion.',
    category: 'POA&M',
    implementationGuidance: 'A POA&M may not be used to achieve a passing assessment score for the highest-weighted requirements (5-point and 3-point items deemed POA&M-ineligible by 32 CFR 170.21). Only 1-point requirements are eligible for inclusion on a POA&M (with limited 3-point exceptions per the rule). The minimum score required for conditional status is 88 out of 110 for Level 2. POA&M items must be closed and a closeout assessment performed within 180 days, otherwise the conditional status expires and the organization loses CMMC status. Maintain a POA&M tracking system with severity, dates, owners, and closure evidence.',
    evidenceRequirements: ['POA&M register with required attributes per item', 'POA&M eligibility analysis per item (mapped to requirement weight)', 'Minimum-score verification calculation', 'Closeout assessment evidence within 180 days'],
    testProcedures: ['Inspect POA&M register and verify only eligible requirements are deferred', 'Recompute the assessment score and confirm it meets the 88-of-110 minimum for conditional status', 'Verify each POA&M is tracked through a closeout assessment within 180 days'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMC2F-POAM.2',
    name: 'Conditional Certification Lifecycle Management',
    description: 'Where a conditional CMMC status is granted pending POA&M closure, govern the conditional period under the 180-day rule and maintain executive awareness of expiration risk.',
    category: 'POA&M',
    implementationGuidance: 'When a conditional status is granted, establish a governance cadence (at minimum monthly) to track POA&M closure progress. Notify the Senior Cyber Affirming Official of expiration risk. Where closure is at risk, escalate resource allocation. Upon completion of all POA&M items, request a closeout assessment from the same C3PAO or DIBCAC (as applicable). Maintain a contingency plan for the loss of CMMC status should closeout fail.',
    evidenceRequirements: ['Conditional status notification and 180-day expiration date', 'Monthly POA&M closure progress reports to senior officials', 'Closeout assessment engagement record', 'Loss-of-status contingency plan'],
    testProcedures: ['Inspect the conditional status notification and verify the 180-day clock', 'Sample monthly progress reports and confirm escalation when at risk', 'Verify the closeout assessment was completed within the conditional period'],
    status: 'Not Started'
  },

  // ===== External Service Providers =====
  {
    controlId: 'CMMC2F-ESP.1',
    name: 'External Service Provider (ESP) Identification and Flow-Down',
    description: 'Identify all External Service Providers that process, store, transmit, or otherwise contribute to the protection of CUI on the organization\'s behalf and ensure appropriate CMMC obligations flow down.',
    category: 'External Service Providers',
    implementationGuidance: 'ESPs include managed service providers (MSPs), managed security service providers (MSSPs), cloud service providers, and other third parties handling CUI or providing security protection assets. Maintain a register of ESPs with services, CUI involvement, and CMMC obligations. If the ESP processes, stores, or transmits CUI, the ESP itself must be CMMC Level 2 certified (or higher as the contract requires). Document subcontractor flow-down clauses in the contract.',
    evidenceRequirements: ['ESP register with services and CUI involvement flag', 'CMMC level certification evidence per CUI-handling ESP', 'Subcontract flow-down language inventory', 'ESP attestation or assessment record on file'],
    testProcedures: ['Inspect the ESP register and verify CMMC certification status per CUI-handling provider', 'Sample subcontracts and verify CMMC flow-down clauses', 'Confirm the register reflects the current third-party portfolio'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMC2F-ESP.2',
    name: 'ESP Inclusion in CMMC Assessment Scope',
    description: 'Include ESP-provided systems and personnel within the defined CMMC assessment scope when those ESPs process, store, transmit, or protect CUI on the organization\'s behalf.',
    category: 'External Service Providers',
    implementationGuidance: 'When defining the CMMC assessment scope, identify which assets and processes are provided by ESPs. The C3PAO or DIBCAC will evaluate the implementation of CMMC requirements either at the organization or at the ESP, whichever is responsible. Coordinate with the ESP for evidence access, assessor interviews, and shared-responsibility clarity. Document the assignment of NIST SP 800-171 control implementation between the organization and the ESP.',
    evidenceRequirements: ['ESP scope inclusion document', 'Shared-responsibility matrix per ESP', 'Evidence-access coordination plan with ESP', 'C3PAO acknowledgement of ESP scope coverage'],
    testProcedures: ['Inspect the shared-responsibility matrix for each CUI-handling ESP', 'Verify ESPs are included in the C3PAO assessment scope document', 'Sample ESP-implemented controls and confirm evidence access during assessment'],
    status: 'Not Started'
  },

  // ===== Cloud and FedRAMP Equivalency =====
  {
    controlId: 'CMMC2F-CLOUD.1',
    name: 'FedRAMP Moderate Authorization or Equivalency for CUI Cloud Services',
    description: 'When CUI is processed, stored, or transmitted by a cloud service provider, ensure the service is FedRAMP Moderate authorized or meets FedRAMP Moderate equivalency requirements per DoD policy.',
    category: 'Cloud Services',
    implementationGuidance: 'CUI processed in cloud services must be hosted on FedRAMP Moderate-authorized offerings, or on cloud services that demonstrate equivalency to FedRAMP Moderate per the DoD CIO memorandum dated December 21, 2023. Equivalency requires a body-of-evidence submission including a SSP, SAR, and POA&M from an authorized 3PAO. Maintain authorization documentation per CSP. Track FedRAMP marketplace status for ongoing authorization validity.',
    evidenceRequirements: ['FedRAMP authorization documentation per CSP (or equivalency evidence)', 'CSP body-of-evidence file (SSP, SAR, POA&M)', 'FedRAMP marketplace status monitoring log', 'CSP contract clauses requiring continued authorization'],
    testProcedures: ['Inspect FedRAMP authorization or equivalency evidence per CSP hosting CUI', 'Verify the body of evidence is from a recognized 3PAO when relying on equivalency', 'Confirm marketplace status is monitored on a defined cadence'],
    status: 'Not Started'
  },

  // ===== Affirmations =====
  {
    controlId: 'CMMC2F-AFF.1',
    name: 'Affirmation of Continuing Compliance',
    description: 'A senior official must affirm continuing compliance with all applicable CMMC requirements following each assessment and annually thereafter, per 32 CFR 170.22.',
    category: 'Affirmation',
    implementationGuidance: 'Designate a Senior Cyber Affirming Official with sufficient authority and accountability. This individual affirms in SPRS that the organization continues to meet all applicable CMMC requirements at: (a) the time of the assessment, and (b) annually thereafter. The affirmation is a personal certification carrying potential False Claims Act exposure. Conduct a structured annual review of continuing implementation before each affirmation. Document the basis for the affirmation in retained workpapers.',
    evidenceRequirements: ['Senior Cyber Affirming Official designation record', 'Annual continuing-compliance review workpapers', 'SPRS affirmation submission records', 'Personal certification training and briefing records'],
    testProcedures: ['Inspect the Senior Cyber Affirming Official designation and authority', 'Verify annual affirmations have been submitted within the past 12 months', 'Sample the annual review workpapers and confirm they substantiate the affirmation'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMC2F-AFF.2',
    name: 'Affirmation Following Material Change',
    description: 'Submit an updated affirmation when a material change to the information system, organization, or assessment scope renders the existing affirmation no longer accurate.',
    category: 'Affirmation',
    implementationGuidance: 'Define what constitutes a material change — examples include significant changes to system boundary, the addition or removal of CUI processing systems, mergers or divestitures affecting in-scope operations, or discovery of compliance gaps in previously affirmed controls. Establish a process whereby the change management function escalates qualifying events to the Senior Cyber Affirming Official. Reaffirmation or POA&M-conversion must occur within the timelines specified by the contracting officer or 32 CFR 170.22.',
    evidenceRequirements: ['Material-change definition policy', 'Change management escalation log to Cyber Affirming Official', 'Reaffirmation records following material change events', 'Notification to contracting officer where required'],
    testProcedures: ['Inspect the material-change definition and escalation procedure', 'Sample change events and verify escalation occurred when criteria were met', 'Confirm reaffirmation was submitted within the required timeline'],
    status: 'Not Started'
  },

  // ===== Phase-In Schedule Awareness =====
  {
    controlId: 'CMMC2F-PHASE.1',
    name: 'Contract Phase-In Schedule Tracking',
    description: 'Track the DFARS 252.204-7021 phase-in schedule and align organizational readiness milestones with each phase to ensure award eligibility throughout the rollout window.',
    category: 'Phase-In Schedule',
    implementationGuidance: 'Maintain a phase-aligned readiness roadmap covering Phase 1 (Nov 10, 2025 — Level 1 and Level 2 self-assessment), Phase 2 (Nov 10, 2026 — Level 2 C3PAO certification), Phase 3 (Nov 10, 2027 — Level 3 DIBCAC assessment), and Phase 4 (Nov 10, 2028 — full clause inclusion in applicable contracts). Identify award-eligibility risks per phase. Schedule self-assessments, C3PAO engagements, and any required DIBCAC coordination to meet phase deadlines. Refresh the roadmap each quarter.',
    evidenceRequirements: ['Phase-aligned readiness roadmap', 'Award-eligibility risk register per phase', 'C3PAO engagement schedule aligned to Phase 2', 'Quarterly roadmap refresh log'],
    testProcedures: ['Inspect the readiness roadmap against each of the four phases', 'Verify C3PAO engagement is scheduled in time for Phase 2 obligations', 'Confirm the roadmap is refreshed at least quarterly'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMC2F-PHASE.2',
    name: 'Subcontractor and Supply Chain Phase Readiness',
    description: 'Verify subcontractor CMMC readiness aligns with the phase requirements of the prime contract, including flow-down obligations under DFARS 252.204-7021.',
    category: 'Phase-In Schedule',
    implementationGuidance: 'For prime contracts subject to DFARS 252.204-7021, identify subcontractors that process, store, or transmit FCI or CUI. Validate each subcontractor\'s CMMC status meets the level required for the data they handle. Coordinate timing so subcontractors achieve required levels before phase deadlines that would otherwise block award or modification. Document flow-down provisions in subcontract templates and refresh them as DFARS clauses evolve.',
    evidenceRequirements: ['Subcontractor CMMC status register', 'Phase-aligned subcontractor readiness gap analysis', 'Updated subcontract flow-down templates', 'Coordination meeting records with at-risk subcontractors'],
    testProcedures: ['Inspect the subcontractor register and verify CMMC status per subcontractor', 'Sample subcontracts and confirm DFARS flow-down language is current', 'Verify gap analysis identifies subcontractors at risk of phase non-readiness'],
    status: 'Not Started'
  },

  // ===== Assessment Retention and Reuse =====
  {
    controlId: 'CMMC2F-REC.1',
    name: 'Assessment Workpaper Retention and Inheritance',
    description: 'Retain CMMC assessment workpapers and evidence for a minimum of six years and manage inheritance of controls assessed at parent or affiliate entities per the rule\'s inheritance provisions.',
    category: 'Records and Inheritance',
    implementationGuidance: 'Retain self-assessment and certification workpapers, evidence, scoring worksheets, and affirmation records for at least six years. Where an organization inherits implementation of NIST SP 800-171 controls from a parent, affiliate, or ESP, document the inheritance source, the responsibility split, and confirm the source assessment covers the inherited controls. Inheritance must be documented in the System Security Plan and supported by evidence accessible to assessors.',
    evidenceRequirements: ['Six-year retention schedule for assessment workpapers', 'Inheritance documentation per inherited control', 'SSP inheritance section with responsibility split', 'Access agreements with inheritance source entities'],
    testProcedures: ['Inspect the retention schedule and verify it covers six years', 'Sample inherited controls and confirm inheritance documentation', 'Verify access agreements exist with inheritance sources for assessor evidence requests'],
    status: 'Not Started'
  }
];
