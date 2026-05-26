import { FrameworkControlTemplate } from './soc2Controls';

/**
 * ISO/IEC 27001:2022/Amd 1:2024 — Climate Action Changes
 *
 * Published February 2024 by ISO and IEC, this amendment introduces climate
 * change considerations into the Information Security Management System
 * (ISMS). Two clauses were modified:
 *
 *   - Clause 4.1: organizations must determine whether climate change is a
 *     relevant issue affecting their ability to achieve ISMS outcomes.
 *   - Clause 4.2: interested-party requirements must now include climate
 *     change-related expectations where applicable.
 *
 * This is an OVERLAY amendment — it does not replace ISO 27001:2022 baseline
 * controls. Organizations already certified to ISO 27001:2022 must integrate
 * these climate-relevance assessments into their next ISMS review cycle and
 * document the determination, even when the conclusion is that climate change
 * is not a relevant issue for that organization.
 */

export const ISO_27001_AMD1_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Clause 4.1 — Context Determination =====
  {
    controlId: 'ISO27001-AMD1-4.1.1',
    name: 'Climate Change Relevance Determination',
    description: 'Determine whether climate change is a relevant issue affecting the organization\'s ability to achieve the intended outcomes of its Information Security Management System (ISMS), as required by the 2024 amendment to Clause 4.1.',
    category: 'Context of the Organization',
    implementationGuidance: 'Conduct a documented climate-relevance assessment as part of the annual ISMS context review. Evaluate physical risks (flooding, wildfire, extreme heat affecting data centers and offices) and transition risks (regulation, market shifts, technology changes). Record the determination outcome — either "climate change is a relevant ISMS issue" with supporting analysis, or "not relevant" with documented rationale. Reassess at least annually or upon material change in operations or geography.',
    evidenceRequirements: ['Documented climate-relevance assessment with conclusion', 'ISMS context review minutes referencing climate', 'Risk register entries linked to climate factors', 'Annual reassessment evidence'],
    testProcedures: ['Inspect the climate-relevance determination record for the current ISMS cycle', 'Verify the assessment considers both physical and transition climate risks', 'Confirm the conclusion is supported by documented analysis rather than asserted'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27001-AMD1-4.1.2',
    name: 'Integration with Environmental Management Systems',
    description: 'Where the organization operates an environmental management system (e.g., ISO 14001), align the ISMS climate-relevance determination with environmental risk outputs to ensure consistency across management systems.',
    category: 'Context of the Organization',
    implementationGuidance: 'Establish a documented interface between the ISMS and any ISO 14001 or equivalent environmental management system. Cross-reference climate-related risk registers, materiality assessments, and adaptation plans. Where the organization does not operate a formal environmental management system, document the alternative source of climate analysis used to inform the ISMS determination.',
    evidenceRequirements: ['Cross-reference register between ISMS and EMS', 'Shared climate risk assessment outputs', 'Coordination meeting minutes between ISMS and EMS owners', 'Alternative climate analysis source where no EMS exists'],
    testProcedures: ['Inspect the cross-reference between ISMS climate determination and EMS outputs', 'Interview the ISMS and environmental managers on coordination practice', 'Verify consistency of climate conclusions across management systems'],
    status: 'Not Started'
  },

  // ===== Clause 4.2 — Interested Parties =====
  {
    controlId: 'ISO27001-AMD1-4.2.1',
    name: 'Interested Party Climate Requirements',
    description: 'Identify and document climate change-related requirements expressed by interested parties (regulators, customers, investors, insurers, employees) that are relevant to the ISMS, as required by the 2024 amendment to Clause 4.2.',
    category: 'Interested Parties',
    implementationGuidance: 'Survey interested-party requirements at least annually and capture climate-related expectations. Examples include customer contractual requirements for climate-resilient service availability, regulatory disclosures (TCFD, ISSB, CSRD), insurer underwriting questionnaires, and investor ESG ratings. Maintain a register mapping each climate requirement to ISMS controls that respond to it.',
    evidenceRequirements: ['Interested-party requirements register with climate column', 'Customer contracts referencing climate-related security obligations', 'Regulatory climate disclosure mappings', 'Annual interested-party survey results'],
    testProcedures: ['Inspect the interested-party register for climate-related entries', 'Sample customer contracts and verify climate-related clauses are captured', 'Confirm the register is reviewed within the past 12 months'],
    status: 'Not Started'
  },

  // ===== ISMS Scope Impact =====
  {
    controlId: 'ISO27001-AMD1-SCOPE.1',
    name: 'ISMS Scope Update for Climate Considerations',
    description: 'Update the ISMS scope statement, Statement of Applicability, and risk treatment plan to reflect outcomes of the climate-relevance determination where climate change is identified as a relevant issue.',
    category: 'ISMS Scope',
    implementationGuidance: 'When the Clause 4.1 determination concludes climate change is relevant, update the ISMS scope document to acknowledge climate as an external context factor. Review the Statement of Applicability to confirm Annex A controls covering business continuity (A.5.29, A.5.30), physical security (A.7), and supplier relationships (A.5.19-A.5.22) adequately address climate-amplified risks. Document any control additions or strengthened implementations.',
    evidenceRequirements: ['Updated ISMS scope statement', 'Statement of Applicability with climate-impacted controls flagged', 'Risk treatment plan reflecting climate scenarios', 'Change control records for scope updates'],
    testProcedures: ['Inspect the current ISMS scope statement for climate references', 'Verify SoA flags controls affected by climate determination', 'Trace risk treatment plan entries to climate risk register'],
    status: 'Not Started'
  },

  // ===== Climate-Related Cyber Risk =====
  {
    controlId: 'ISO27001-AMD1-RISK.1',
    name: 'Climate-Amplified Infrastructure Risk Assessment',
    description: 'Assess and treat information security risks that arise or are amplified by climate change, including data center cooling failures during heatwaves, flood damage to primary or alternate sites, and wildfire smoke ingestion into HVAC.',
    category: 'Risk Assessment',
    implementationGuidance: 'Extend the ISMS risk assessment methodology to include climate-amplified scenarios. Map each owned and leased facility against forward-looking climate hazard data (e.g., national flood maps, heatwave projections, wildfire risk zones). Quantify the likelihood and impact of climate-driven availability and integrity events. Treat residual risks through site selection, redundancy, mechanical cooling upgrades, or supplier diversification.',
    evidenceRequirements: ['Climate hazard mapping for in-scope facilities', 'Risk register entries for climate-amplified scenarios', 'Treatment plan with redundancy and cooling upgrade decisions', 'Insurance coverage analysis for climate perils'],
    testProcedures: ['Sample in-scope facilities and verify climate hazard analysis exists', 'Inspect risk register for climate-amplified entries with treatment owners', 'Confirm treatment actions are tracked through completion'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27001-AMD1-RISK.2',
    name: 'Supply Chain Climate Disruption Assessment',
    description: 'Evaluate climate-driven disruption risk across the information and communications technology supply chain, including upstream component manufacturing, cloud service providers, and connectivity carriers.',
    category: 'Risk Assessment',
    implementationGuidance: 'Augment supplier due-diligence questionnaires (aligned to Annex A.5.19-A.5.22) with climate resilience questions covering facility geography, business continuity testing under climate scenarios, and disclosed climate-related material risks. Identify single-source dependencies in climate-vulnerable regions. Document mitigation through dual-sourcing, contractual recovery time objectives, or strategic inventory.',
    evidenceRequirements: ['Updated supplier questionnaire including climate questions', 'Supplier climate disclosure register', 'Single-source dependency analysis with geographic overlay', 'Mitigation decisions and contractual amendments'],
    testProcedures: ['Inspect the current supplier questionnaire for climate coverage', 'Sample critical suppliers and verify climate disclosures are on file', 'Verify dual-source or other mitigation exists for climate-exposed dependencies'],
    status: 'Not Started'
  },

  // ===== Business Continuity and DR =====
  {
    controlId: 'ISO27001-AMD1-BCP.1',
    name: 'Climate-Aware Business Continuity Planning',
    description: 'Incorporate climate-driven scenarios into business continuity and ICT readiness planning required under Annex A.5.29 and A.5.30, including extended-duration utility outages, multi-site simultaneous events, and personnel inaccessibility.',
    category: 'Business Continuity',
    implementationGuidance: 'Add climate scenarios to the BCP scenario library — examples include sustained grid outage during heatwave, regional flood preventing site access, and wildfire evacuation orders affecting key personnel. Validate that recovery time and recovery point objectives remain achievable under these scenarios. Confirm alternate processing sites are not co-located within the same climate hazard zone as primary sites. Exercise plans against at least one climate scenario annually.',
    evidenceRequirements: ['BCP scenario library including climate events', 'Geographic separation analysis for primary and alternate sites', 'Annual climate-scenario tabletop or live exercise report', 'Updated RTO and RPO commitments after climate analysis'],
    testProcedures: ['Inspect the BCP scenario library and confirm climate scenarios are present', 'Verify the most recent BCP exercise included a climate scenario', 'Compare primary and alternate site coordinates against shared climate hazard zones'],
    status: 'Not Started'
  },

  // ===== Transition Risk to Controls =====
  {
    controlId: 'ISO27001-AMD1-TRANS.1',
    name: 'Transition Risk Impact on Information Security Controls',
    description: 'Assess how climate transition risks — including carbon pricing, energy regulation, and shifts to lower-carbon infrastructure — affect existing ISMS controls and the cost or feasibility of maintaining them.',
    category: 'Transition Risk',
    implementationGuidance: 'Identify ISMS controls whose operation depends on energy-intensive activities (on-premises data centers, redundant cooling, backup generators). Evaluate the impact of carbon pricing, renewable energy mandates, and grid decarbonization on operating cost and feasibility. Consider transition opportunities — migration to lower-PUE cloud regions, server consolidation, or efficiency upgrades — and document decisions in the risk treatment plan.',
    evidenceRequirements: ['Inventory of energy-intensive ISMS controls', 'Transition risk and opportunity register', 'Documented cloud region or efficiency decisions tied to transition risk', 'Cost projections under carbon-pricing scenarios'],
    testProcedures: ['Inspect the inventory of energy-intensive controls', 'Sample transition risks and verify treatment decisions are documented', 'Confirm transition opportunities have been evaluated alongside risks'],
    status: 'Not Started'
  },

  // ===== Management Review =====
  {
    controlId: 'ISO27001-AMD1-MR.1',
    name: 'Management Review Inclusion of Climate Outcomes',
    description: 'Include climate-relevance determination outcomes, interested-party climate requirements, and climate-related ISMS risk treatment status as standing inputs to management review meetings.',
    category: 'Management Review',
    implementationGuidance: 'Update the management review agenda template to include a climate section covering the Clause 4.1 determination, interested-party climate requirements, climate-amplified risk register entries, and BCP exercise results involving climate scenarios. Capture decisions, owners, and timelines in the meeting minutes. Confirm climate items are tracked to closure between reviews.',
    evidenceRequirements: ['Updated management review agenda template', 'Recent management review minutes with climate section', 'Action register entries for climate-related decisions', 'Evidence of action closure between reviews'],
    testProcedures: ['Inspect the management review agenda template for climate items', 'Sample recent management review minutes and verify climate coverage', 'Trace climate-related actions through to closure'],
    status: 'Not Started'
  }
];
