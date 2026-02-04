export interface FrameworkControlTemplate {
  controlId: string;
  name: string;
  description: string;
  category: string;
  implementationGuidance: string;
  evidenceRequirements: string[];
  testProcedures: string[];
  status: string;
}

export const NIST_CSF_CONTROLS: FrameworkControlTemplate[] = [
  // ============================================================
  // GV - GOVERN
  // ============================================================

  // --- GV.OC: Organizational Context ---
  {
    controlId: 'GV.OC-01',
    name: 'Organizational Mission Understanding',
    description:
      'The organizational mission is understood and informs cybersecurity risk management.',
    category: 'Govern - Organizational Context',
    implementationGuidance:
      'Document the organization\'s mission, vision, and strategic objectives. Ensure cybersecurity risk management priorities are aligned with and derived from the organizational mission. Communicate mission-driven cybersecurity goals to all stakeholders and integrate them into risk appetite statements and governance charters.',
    evidenceRequirements: [
      'Documented organizational mission and vision statements',
      'Cybersecurity strategy aligned to mission objectives',
      'Board or executive-approved risk appetite statement referencing mission priorities',
      'Meeting minutes showing mission-driven cybersecurity discussions',
    ],
    testProcedures: [
      'Review cybersecurity strategy documents for alignment with organizational mission',
      'Interview senior leadership to confirm cybersecurity priorities reflect mission',
      'Verify that risk appetite statements reference organizational objectives',
      'Assess whether cybersecurity investments map to mission-critical functions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.OC-02',
    name: 'Internal and External Stakeholder Understanding',
    description:
      'Internal and external stakeholders are understood, and their needs and expectations regarding cybersecurity risk management are understood and considered.',
    category: 'Govern - Organizational Context',
    implementationGuidance:
      'Identify all internal stakeholders (executives, IT, legal, HR, business units) and external stakeholders (regulators, customers, partners, suppliers). Document their cybersecurity expectations and requirements. Establish communication channels and feedback mechanisms to ensure stakeholder needs inform cybersecurity risk decisions.',
    evidenceRequirements: [
      'Stakeholder register identifying internal and external stakeholders',
      'Documented stakeholder cybersecurity expectations and requirements',
      'Evidence of stakeholder engagement processes and feedback mechanisms',
      'Regulatory and contractual obligation inventory',
    ],
    testProcedures: [
      'Review stakeholder register for completeness of internal and external parties',
      'Verify that stakeholder expectations are documented and current',
      'Confirm feedback mechanisms exist and are actively used',
      'Validate regulatory and contractual requirements are mapped to cybersecurity controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.OC-03',
    name: 'Legal, Regulatory, and Contractual Requirements',
    description:
      'Legal, regulatory, and contractual requirements regarding cybersecurity, including privacy and civil liberties obligations, are understood and managed.',
    category: 'Govern - Organizational Context',
    implementationGuidance:
      'Maintain an inventory of all applicable legal, regulatory, and contractual cybersecurity requirements. Assign ownership for compliance with each requirement. Implement processes to monitor regulatory changes and assess their impact on cybersecurity practices. Ensure privacy and civil liberties requirements are integrated into cybersecurity operations.',
    evidenceRequirements: [
      'Inventory of applicable laws, regulations, and contractual obligations',
      'Compliance responsibility assignments (RACI matrix)',
      'Regulatory change monitoring process documentation',
      'Privacy impact assessments and civil liberties review records',
    ],
    testProcedures: [
      'Review the regulatory and contractual requirements inventory for completeness',
      'Verify compliance ownership assignments are current and acknowledged',
      'Confirm regulatory change monitoring process is active and effective',
      'Assess integration of privacy and civil liberties into cybersecurity operations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.OC-04',
    name: 'Critical Objectives and Dependencies',
    description:
      'Critical objectives, capabilities, and services that external stakeholders depend on or expect are understood and communicated.',
    category: 'Govern - Organizational Context',
    implementationGuidance:
      'Identify and document all critical business services, objectives, and capabilities that stakeholders depend upon. Map these to supporting technology and cybersecurity infrastructure. Ensure cybersecurity protections are prioritized for critical dependencies and that disruption impacts are assessed. Communicate critical service expectations to relevant teams.',
    evidenceRequirements: [
      'Critical services and capabilities inventory',
      'Dependency mapping between critical services and technology assets',
      'Business impact analysis for critical services',
      'Communication records showing critical service expectations shared with teams',
    ],
    testProcedures: [
      'Review critical services inventory for completeness',
      'Validate dependency mapping between services and supporting infrastructure',
      'Verify business impact analysis covers all critical services',
      'Confirm critical service expectations are communicated to cybersecurity teams',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.OC-05',
    name: 'Outcomes and Priorities for Risk Management',
    description:
      'Outcomes, capabilities, and services that the organization depends on are understood and communicated.',
    category: 'Govern - Organizational Context',
    implementationGuidance:
      'Define and prioritize outcomes, capabilities, and services the organization depends on from both internal and external sources. Evaluate cybersecurity risks associated with these dependencies. Integrate dependency risk into organizational risk management and communicate priorities to leadership for resource allocation decisions.',
    evidenceRequirements: [
      'Documented organizational dependencies on internal and external services',
      'Risk assessments for critical dependencies',
      'Prioritized list of outcomes and capabilities with cybersecurity relevance',
      'Leadership briefings on dependency risks and resource allocation needs',
    ],
    testProcedures: [
      'Review documentation of organizational dependencies',
      'Verify risk assessments exist for key dependencies',
      'Confirm prioritization reflects cybersecurity risk exposure',
      'Validate leadership has been briefed on dependency risks',
    ],
    status: 'Not Started',
  },

  // --- GV.RM: Risk Management Strategy ---
  {
    controlId: 'GV.RM-01',
    name: 'Risk Management Objectives',
    description:
      'Risk management objectives are established and agreed to by organizational stakeholders.',
    category: 'Govern - Risk Management Strategy',
    implementationGuidance:
      'Define clear, measurable risk management objectives that align with the organizational mission and are approved by executive leadership. Objectives should specify acceptable risk levels, risk treatment priorities, and desired security outcomes. Obtain formal agreement from key stakeholders and review objectives at least annually.',
    evidenceRequirements: [
      'Documented risk management objectives approved by leadership',
      'Stakeholder sign-off records for risk management objectives',
      'Annual review records of risk management objectives',
      'Mapping of risk management objectives to organizational goals',
    ],
    testProcedures: [
      'Review risk management objective documentation for clarity and measurability',
      'Verify executive approval and stakeholder agreement',
      'Confirm annual review has been conducted',
      'Assess alignment between risk objectives and organizational mission',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.RM-02',
    name: 'Risk Appetite and Tolerance Statements',
    description:
      'Risk appetite and risk tolerance statements are established, communicated, and maintained.',
    category: 'Govern - Risk Management Strategy',
    implementationGuidance:
      'Define organizational risk appetite (the level of risk the organization is willing to accept) and risk tolerance (the acceptable variation from risk appetite). Document these in formal statements, obtain board or executive approval, communicate to all relevant personnel, and ensure they are reviewed and updated as business conditions change.',
    evidenceRequirements: [
      'Board-approved risk appetite statement',
      'Risk tolerance thresholds for key risk categories',
      'Communication records demonstrating distribution to relevant personnel',
      'Evidence of periodic review and updates to risk appetite and tolerance',
    ],
    testProcedures: [
      'Review risk appetite and tolerance statements for completeness',
      'Verify board or executive approval documentation',
      'Confirm statements have been communicated to relevant staff',
      'Validate periodic review schedule is maintained',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.RM-03',
    name: 'Cybersecurity Risk Management Activities',
    description:
      'Cybersecurity risk management activities and outcomes are included in enterprise risk management processes.',
    category: 'Govern - Risk Management Strategy',
    implementationGuidance:
      'Integrate cybersecurity risk management into the enterprise risk management (ERM) framework. Ensure cybersecurity risks are reported alongside business, financial, and operational risks. Establish consistent risk assessment methodologies and reporting cadences. Cybersecurity risk owners should participate in enterprise risk committees.',
    evidenceRequirements: [
      'Enterprise risk management framework incorporating cybersecurity risks',
      'Cybersecurity risk entries in enterprise risk register',
      'Evidence of cybersecurity participation in enterprise risk committee meetings',
      'Unified risk reporting including cybersecurity metrics',
    ],
    testProcedures: [
      'Review ERM framework for cybersecurity integration',
      'Verify cybersecurity risks appear in the enterprise risk register',
      'Confirm cybersecurity leadership participates in risk governance meetings',
      'Assess risk reporting for inclusion of cybersecurity metrics',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.RM-04',
    name: 'Strategic Direction for Risk Response',
    description:
      'Strategic direction that describes appropriate risk response options is established and communicated.',
    category: 'Govern - Risk Management Strategy',
    implementationGuidance:
      'Define and document acceptable risk response strategies (accept, mitigate, transfer, avoid) along with criteria for selecting each option. Provide guidance on escalation thresholds and decision authority for risk response. Communicate the strategic direction to risk owners and ensure it is consistently applied.',
    evidenceRequirements: [
      'Risk response strategy documentation with defined options and selection criteria',
      'Escalation thresholds and decision authority matrix',
      'Communication records of risk response strategy distribution',
      'Examples of risk treatment plans applying the strategic direction',
    ],
    testProcedures: [
      'Review risk response strategy documentation for completeness',
      'Verify escalation thresholds and decision authority are clearly defined',
      'Confirm risk owners have received strategic direction communication',
      'Assess sample risk treatment plans for consistency with strategic direction',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.RM-05',
    name: 'Lines of Communication for Risk Management',
    description:
      'Lines of communication across the organization are established for cybersecurity risks, including risks from suppliers and other third parties.',
    category: 'Govern - Risk Management Strategy',
    implementationGuidance:
      'Establish formal communication channels for cybersecurity risk information across all organizational levels and with third parties. Define reporting relationships, escalation paths, and frequency of risk communications. Include supply chain and third-party risk information in regular risk reporting to leadership.',
    evidenceRequirements: [
      'Cybersecurity risk communication plan or charter',
      'Defined escalation paths and reporting relationships',
      'Evidence of regular risk communications to leadership',
      'Third-party and supply chain risk reporting processes',
    ],
    testProcedures: [
      'Review risk communication plan for defined channels and responsibilities',
      'Verify escalation paths are documented and known to relevant staff',
      'Confirm regular risk reporting occurs per the defined cadence',
      'Validate third-party risk information is included in communications',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.RM-06',
    name: 'Standardized Risk Management Method',
    description:
      'A standardized method for calculating, documenting, categorizing, and prioritizing cybersecurity risks is established and communicated.',
    category: 'Govern - Risk Management Strategy',
    implementationGuidance:
      'Adopt a standardized risk assessment methodology (e.g., FAIR, qualitative/quantitative risk matrices) for calculating and categorizing cybersecurity risks. Document the methodology including risk scoring criteria, categorization taxonomy, and prioritization rules. Train risk assessors on the methodology and ensure consistent application across the organization.',
    evidenceRequirements: [
      'Documented risk assessment methodology and scoring criteria',
      'Risk categorization taxonomy',
      'Training materials and completion records for risk assessors',
      'Sample risk assessments demonstrating consistent methodology application',
    ],
    testProcedures: [
      'Review risk assessment methodology documentation for completeness',
      'Verify scoring criteria and categorization taxonomy are well-defined',
      'Confirm risk assessors have been trained on the methodology',
      'Assess sample risk assessments for consistent application of the methodology',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.RM-07',
    name: 'Strategic Opportunities from Risk Management',
    description:
      'Strategic opportunities (i.e., positive risks) are characterized and are included in organizational cybersecurity risk discussions.',
    category: 'Govern - Risk Management Strategy',
    implementationGuidance:
      'Include identification and assessment of strategic opportunities arising from cybersecurity investments and risk management activities. Document potential positive outcomes such as competitive advantage, customer trust, and operational efficiency gains. Ensure positive risks are considered alongside threats in risk governance discussions.',
    evidenceRequirements: [
      'Documentation of strategic cybersecurity opportunities identified',
      'Risk register entries for positive risks or opportunities',
      'Meeting minutes showing positive risk discussions in governance forums',
      'Business case documentation linking cybersecurity investments to opportunities',
    ],
    testProcedures: [
      'Review risk register for inclusion of positive risks or opportunities',
      'Verify governance meeting minutes include strategic opportunity discussions',
      'Confirm business cases address potential positive outcomes from cybersecurity',
      'Assess whether opportunity identification is part of the risk assessment process',
    ],
    status: 'Not Started',
  },

  // --- GV.RR: Roles, Responsibilities, and Authorities ---
  {
    controlId: 'GV.RR-01',
    name: 'Organizational Leadership Accountability',
    description:
      'Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware, ethical, and continually improving.',
    category: 'Govern - Roles, Responsibilities, and Authorities',
    implementationGuidance:
      'Establish board-level and executive accountability for cybersecurity risk management. Assign a senior leader (e.g., CISO) with authority and resources to manage cybersecurity risk. Foster a security-aware culture through leadership communication, incentive alignment, and ethical conduct expectations. Implement metrics to measure culture maturity.',
    evidenceRequirements: [
      'Board charter or governance document assigning cybersecurity accountability',
      'CISO or equivalent role description with authority and reporting lines',
      'Leadership communications promoting security-aware culture',
      'Culture maturity assessments or survey results',
    ],
    testProcedures: [
      'Verify board or executive charter assigns cybersecurity accountability',
      'Confirm CISO role has appropriate authority and direct reporting to leadership',
      'Review leadership communications for security culture messaging',
      'Assess culture maturity metrics and improvement trends',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.RR-02',
    name: 'Cybersecurity Roles and Responsibilities',
    description:
      'Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced.',
    category: 'Govern - Roles, Responsibilities, and Authorities',
    implementationGuidance:
      'Define and document cybersecurity roles, responsibilities, and authorities for all personnel involved in cybersecurity risk management. Create a RACI matrix mapping cybersecurity functions to responsible parties. Communicate roles and responsibilities to all stakeholders and enforce accountability through performance management and governance processes.',
    evidenceRequirements: [
      'Cybersecurity RACI matrix or responsibility assignment documentation',
      'Job descriptions with cybersecurity responsibilities',
      'Communication records of role assignments to stakeholders',
      'Performance evaluation criteria incorporating cybersecurity responsibilities',
    ],
    testProcedures: [
      'Review RACI matrix for completeness across cybersecurity functions',
      'Verify job descriptions include cybersecurity responsibilities where applicable',
      'Confirm stakeholders acknowledge their cybersecurity roles',
      'Assess whether performance evaluations include cybersecurity accountability',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.RR-03',
    name: 'Adequate Cybersecurity Resources',
    description:
      'Adequate resources are allocated commensurate with the cybersecurity risk strategy, roles, responsibilities, and policies.',
    category: 'Govern - Roles, Responsibilities, and Authorities',
    implementationGuidance:
      'Assess resource needs for cybersecurity risk management including personnel, budget, technology, and training. Align resource allocation with risk priorities and strategic objectives. Conduct gap analysis to identify resource shortfalls and present to leadership for approval. Track resource utilization and effectiveness.',
    evidenceRequirements: [
      'Cybersecurity budget documentation aligned with risk priorities',
      'Staffing plans and resource allocation records',
      'Resource gap analysis and remediation plans',
      'Resource utilization and effectiveness reports',
    ],
    testProcedures: [
      'Review cybersecurity budget for alignment with risk management strategy',
      'Verify staffing levels against identified resource needs',
      'Assess gap analysis for completeness and remediation progress',
      'Confirm resource effectiveness is tracked and reported to leadership',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.RR-04',
    name: 'Cybersecurity in Human Resources Practices',
    description:
      'Cybersecurity is included in human resources practices.',
    category: 'Govern - Roles, Responsibilities, and Authorities',
    implementationGuidance:
      'Integrate cybersecurity into HR practices including hiring (background checks, security clearance verification), onboarding (security training, acceptable use acknowledgment), ongoing employment (continuous training, policy compliance monitoring), and offboarding (access revocation, asset return, knowledge transfer). Establish processes for personnel risk management.',
    evidenceRequirements: [
      'HR policies incorporating cybersecurity requirements',
      'Background check and screening procedures for cybersecurity-relevant roles',
      'Onboarding and offboarding checklists with cybersecurity elements',
      'Employee acceptable use policy acknowledgment records',
    ],
    testProcedures: [
      'Review HR policies for cybersecurity integration',
      'Verify background check procedures are followed for relevant roles',
      'Confirm onboarding includes security training and policy acknowledgment',
      'Validate offboarding processes include timely access revocation',
    ],
    status: 'Not Started',
  },

  // --- GV.SC: Supply Chain Risk Management ---
  {
    controlId: 'GV.SC-01',
    name: 'Supply Chain Risk Management Program',
    description:
      'A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established and agreed to by organizational stakeholders.',
    category: 'Govern - Supply Chain Risk Management',
    implementationGuidance:
      'Establish a formal cybersecurity supply chain risk management (C-SCRM) program with defined strategy, objectives, and policies. Obtain executive approval and stakeholder agreement. Define scope, governance structure, and resource allocation for the program. Integrate C-SCRM into enterprise risk management and acquisition processes.',
    evidenceRequirements: [
      'C-SCRM program charter or strategy document',
      'C-SCRM policies approved by leadership',
      'Stakeholder agreement records',
      'Integration documentation with enterprise risk management processes',
    ],
    testProcedures: [
      'Review C-SCRM program documentation for completeness',
      'Verify executive approval and stakeholder agreement',
      'Confirm program integration with ERM and acquisition processes',
      'Assess resource allocation for the C-SCRM program',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.SC-03',
    name: 'Supply Chain Risk Assessment',
    description:
      'Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management, risk assessment, and improvement processes.',
    category: 'Govern - Supply Chain Risk Management',
    implementationGuidance:
      'Integrate supply chain risk assessments into organizational cybersecurity risk assessment processes. Evaluate suppliers and third parties for cybersecurity risk as part of vendor onboarding and periodic reviews. Include supply chain risks in the enterprise risk register and ensure findings inform improvement activities.',
    evidenceRequirements: [
      'Supply chain risk assessment methodology and procedures',
      'Vendor risk assessment records',
      'Supply chain risks documented in enterprise risk register',
      'Evidence of supply chain risk findings driving improvement actions',
    ],
    testProcedures: [
      'Review supply chain risk assessment methodology',
      'Verify vendor risk assessments are conducted per policy',
      'Confirm supply chain risks are tracked in enterprise risk register',
      'Assess whether risk findings lead to corrective actions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.SC-05',
    name: 'Supply Chain Security Requirements',
    description:
      'Requirements to address cybersecurity risks in supply chains are established, prioritized, and integrated into contracts and other agreements with suppliers and other relevant third parties.',
    category: 'Govern - Supply Chain Risk Management',
    implementationGuidance:
      'Define cybersecurity requirements for suppliers and third parties based on risk assessments. Prioritize requirements based on criticality of the supplier relationship. Incorporate requirements into contracts, service level agreements, and procurement policies. Ensure contractual mechanisms for monitoring compliance and addressing violations.',
    evidenceRequirements: [
      'Cybersecurity requirements for suppliers documented and prioritized',
      'Contract templates with cybersecurity clauses',
      'Sample contracts showing cybersecurity requirements inclusion',
      'Supplier compliance monitoring process documentation',
    ],
    testProcedures: [
      'Review supplier cybersecurity requirements for adequacy',
      'Verify contracts include appropriate cybersecurity clauses',
      'Confirm supplier compliance monitoring is active',
      'Assess whether contractual requirements align with risk assessment findings',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.SC-07',
    name: 'Supply Chain Risk Understanding',
    description:
      'The risks posed by a supplier, their products and services, and other third parties are understood, recorded, prioritized, assessed, responded to, and monitored over the course of the relationship.',
    category: 'Govern - Supply Chain Risk Management',
    implementationGuidance:
      'Implement continuous supply chain risk monitoring throughout the supplier relationship lifecycle. Conduct initial and periodic risk assessments of suppliers. Track risk findings and treatment actions. Monitor for changes in supplier risk posture including security incidents, financial instability, and geopolitical factors.',
    evidenceRequirements: [
      'Supplier risk profiles and assessments',
      'Continuous monitoring process for supplier risks',
      'Supplier risk treatment plans and tracking records',
      'Evidence of periodic reassessment of supplier risks',
    ],
    testProcedures: [
      'Review supplier risk profiles for completeness and currency',
      'Verify continuous monitoring processes are operational',
      'Confirm risk treatment plans exist and are tracked',
      'Assess periodic reassessment schedule adherence',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.SC-10',
    name: 'Supply Chain Security Plan',
    description:
      'Cybersecurity supply chain risk management plans include provisions for activities that occur after the conclusion of a partnership or service agreement.',
    category: 'Govern - Supply Chain Risk Management',
    implementationGuidance:
      'Develop and maintain supply chain risk management plans that address end-of-relationship activities including data return/destruction, access revocation, transition planning, knowledge transfer, and residual risk assessment. Ensure contract terms support smooth transitions and include provisions for data handling upon termination.',
    evidenceRequirements: [
      'Supplier offboarding and transition plans',
      'Contract clauses addressing end-of-relationship activities',
      'Data return or destruction procedures for supplier transitions',
      'Evidence of completed supplier offboarding activities',
    ],
    testProcedures: [
      'Review supplier offboarding plans for completeness',
      'Verify contracts include end-of-relationship provisions',
      'Confirm data return/destruction procedures are documented and tested',
      'Assess completed offboarding activities for compliance with plans',
    ],
    status: 'Not Started',
  },

  // --- GV.PO: Policy ---
  {
    controlId: 'GV.PO-01',
    name: 'Cybersecurity Policy Establishment',
    description:
      'A policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities and is communicated and enforced.',
    category: 'Govern - Policy',
    implementationGuidance:
      'Develop a comprehensive cybersecurity policy based on organizational context, regulatory requirements, risk appetite, and strategic priorities. Obtain executive approval, distribute to all relevant personnel, and implement enforcement mechanisms. Include provisions for exceptions, waivers, and periodic review.',
    evidenceRequirements: [
      'Approved cybersecurity policy document',
      'Policy distribution and acknowledgment records',
      'Policy exception and waiver process documentation',
      'Enforcement mechanism documentation (e.g., disciplinary procedures)',
    ],
    testProcedures: [
      'Review cybersecurity policy for alignment with organizational context and strategy',
      'Verify executive approval and distribution to personnel',
      'Confirm enforcement mechanisms are defined and operational',
      'Assess policy exception process for appropriate controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.PO-02',
    name: 'Cybersecurity Policy Review',
    description:
      'Policy for managing cybersecurity risks is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organizational mission.',
    category: 'Govern - Policy',
    implementationGuidance:
      'Establish a periodic review cycle (at least annual) for cybersecurity policies. Trigger ad-hoc reviews when significant changes occur in threats, technology, regulations, or organizational mission. Document revision history, communicate updates to all relevant personnel, and verify acknowledgment of updated policies.',
    evidenceRequirements: [
      'Policy review schedule and records of completed reviews',
      'Policy revision history with change documentation',
      'Communication records for policy updates',
      'Updated policy acknowledgment records from personnel',
    ],
    testProcedures: [
      'Review policy revision history for timely updates',
      'Verify review schedule adherence',
      'Confirm updates are communicated to relevant personnel',
      'Assess whether policy changes reflect current threats and requirements',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ID - IDENTIFY
  // ============================================================

  // --- ID.AM: Asset Management ---
  {
    controlId: 'ID.AM-01',
    name: 'Hardware Asset Inventory',
    description:
      'Inventories of hardware managed by the organization are maintained.',
    category: 'Identify - Asset Management',
    implementationGuidance:
      'Implement and maintain a comprehensive inventory of all hardware assets managed by the organization including servers, workstations, mobile devices, networking equipment, and IoT devices. Use automated discovery tools to identify assets on the network. Track asset attributes including owner, location, configuration, and lifecycle stage. Reconcile inventory regularly.',
    evidenceRequirements: [
      'Hardware asset inventory database or system',
      'Automated asset discovery tool deployment records',
      'Asset inventory reconciliation reports',
      'Asset lifecycle tracking documentation',
    ],
    testProcedures: [
      'Review hardware asset inventory for completeness',
      'Verify automated discovery tools are deployed and operational',
      'Confirm inventory reconciliation is performed regularly',
      'Compare network scan results against inventory to identify gaps',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.AM-02',
    name: 'Software Asset Inventory',
    description:
      'Inventories of software, services, and systems managed by the organization are maintained.',
    category: 'Identify - Asset Management',
    implementationGuidance:
      'Maintain a comprehensive inventory of all software, SaaS services, and systems in use across the organization. Track software versions, license status, patch levels, and deployment locations. Use software asset management (SAM) tools for automated discovery. Include cloud services, APIs, and third-party integrations in the inventory.',
    evidenceRequirements: [
      'Software asset inventory database or system',
      'Software asset management tool deployment evidence',
      'License compliance records',
      'Cloud service and SaaS inventory',
    ],
    testProcedures: [
      'Review software inventory for completeness across all environments',
      'Verify SAM tools are deployed and actively scanning',
      'Confirm license compliance is tracked and current',
      'Validate cloud services and SaaS applications are inventoried',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.AM-03',
    name: 'Network Communication and Data Flow Mapping',
    description:
      'Representations of the organization\'s authorized network communication and internal and external network data flows are maintained.',
    category: 'Identify - Asset Management',
    implementationGuidance:
      'Create and maintain network architecture diagrams and data flow maps showing authorized communication paths, protocols, and data flows between internal systems and with external entities. Document network segmentation, firewall rules, and data exchange agreements. Update diagrams when changes occur and validate accuracy regularly.',
    evidenceRequirements: [
      'Network architecture diagrams',
      'Data flow diagrams for internal and external communications',
      'Network segmentation documentation',
      'Diagram review and update records',
    ],
    testProcedures: [
      'Review network diagrams for accuracy and completeness',
      'Verify data flow maps reflect current communication patterns',
      'Confirm network segmentation is documented and enforced',
      'Validate diagrams are updated following network changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.AM-04',
    name: 'External Service Provider Inventory',
    description:
      'Inventories of services provided by suppliers are maintained.',
    category: 'Identify - Asset Management',
    implementationGuidance:
      'Maintain an inventory of all external service providers and the services they deliver. Document the nature of each service relationship, data shared, access granted, and criticality to business operations. Include cloud providers, managed service providers, SaaS vendors, and consultants. Update the inventory as relationships change.',
    evidenceRequirements: [
      'External service provider inventory',
      'Service relationship documentation including data sharing and access',
      'Service criticality classifications',
      'Evidence of regular inventory updates',
    ],
    testProcedures: [
      'Review external service provider inventory for completeness',
      'Verify service relationships are documented with data sharing details',
      'Confirm criticality classifications are assigned and current',
      'Assess inventory update process and frequency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.AM-05',
    name: 'Asset Prioritization',
    description:
      'Assets are prioritized based on classification, criticality, resources, and impact to the mission.',
    category: 'Identify - Asset Management',
    implementationGuidance:
      'Implement an asset classification and prioritization scheme based on criticality to business operations, data sensitivity, regulatory requirements, and mission impact. Assign classification labels to all assets. Use prioritization to drive cybersecurity protection levels, resource allocation, and incident response priorities.',
    evidenceRequirements: [
      'Asset classification and prioritization policy',
      'Asset classification records showing labels applied',
      'Criticality assessment methodology documentation',
      'Evidence that classification drives protection level decisions',
    ],
    testProcedures: [
      'Review asset classification policy for comprehensiveness',
      'Verify assets are classified according to policy',
      'Confirm criticality assessments are current',
      'Assess whether classification drives cybersecurity resource allocation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.AM-07',
    name: 'Data Asset Inventory and Mapping',
    description:
      'Inventories of data and corresponding metadata for designated data types are maintained.',
    category: 'Identify - Asset Management',
    implementationGuidance:
      'Inventory all data assets including structured and unstructured data, and maintain associated metadata such as data owner, classification, retention period, storage location, and processing activities. Map data flows to understand how data moves through systems. Implement data cataloging tools where appropriate.',
    evidenceRequirements: [
      'Data asset inventory with metadata',
      'Data classification records',
      'Data flow maps showing movement through systems',
      'Data cataloging tool deployment evidence',
    ],
    testProcedures: [
      'Review data inventory for completeness and accuracy',
      'Verify data classification is applied consistently',
      'Confirm data flow maps are current',
      'Assess metadata completeness for designated data types',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.AM-08',
    name: 'System and Asset Lifecycle Management',
    description:
      'Systems, hardware, software, services, and data are managed throughout their life cycles.',
    category: 'Identify - Asset Management',
    implementationGuidance:
      'Implement lifecycle management processes for all systems, hardware, software, services, and data from acquisition or creation through disposal. Define lifecycle stages and requirements for each stage including security reviews for acquisition, secure configuration for deployment, patch management during operation, and secure disposal at end of life.',
    evidenceRequirements: [
      'Asset lifecycle management policy and procedures',
      'Lifecycle stage tracking records for assets',
      'Secure disposal and decommissioning records',
      'End-of-life and end-of-support tracking for software and hardware',
    ],
    testProcedures: [
      'Review lifecycle management policy for all asset types',
      'Verify lifecycle tracking is maintained for assets',
      'Confirm secure disposal procedures are followed',
      'Assess tracking of end-of-life and end-of-support assets',
    ],
    status: 'Not Started',
  },

  // --- ID.RA: Risk Assessment ---
  {
    controlId: 'ID.RA-01',
    name: 'Vulnerability Identification',
    description:
      'Vulnerabilities in assets are identified, validated, and recorded.',
    category: 'Identify - Risk Assessment',
    implementationGuidance:
      'Implement vulnerability identification processes including automated vulnerability scanning, penetration testing, code review, and threat intelligence analysis. Validate identified vulnerabilities to reduce false positives. Record vulnerabilities in a centralized tracking system with severity ratings, affected assets, and remediation timelines.',
    evidenceRequirements: [
      'Vulnerability scanning tool deployment and configuration evidence',
      'Vulnerability scan reports and results',
      'Vulnerability tracking system with recorded vulnerabilities',
      'Penetration testing reports',
    ],
    testProcedures: [
      'Review vulnerability scanning tool coverage across all asset types',
      'Verify vulnerability scan frequency meets policy requirements',
      'Confirm vulnerabilities are validated and recorded with severity ratings',
      'Assess vulnerability remediation tracking and timeliness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.RA-02',
    name: 'Threat Intelligence',
    description:
      'Cyber threat intelligence is received from information sharing forums and sources.',
    category: 'Identify - Risk Assessment',
    implementationGuidance:
      'Establish processes to receive, analyze, and act on cyber threat intelligence from external sources including ISACs, government agencies (e.g., CISA), commercial feeds, and peer organizations. Integrate threat intelligence into vulnerability management, risk assessment, and incident response processes. Evaluate threat intelligence for relevance and reliability.',
    evidenceRequirements: [
      'Threat intelligence source subscriptions and agreements',
      'Threat intelligence feed integration documentation',
      'Evidence of threat intelligence analysis and dissemination',
      'Records of threat intelligence informing security decisions',
    ],
    testProcedures: [
      'Review threat intelligence sources for comprehensiveness',
      'Verify threat intelligence feeds are integrated into security tools',
      'Confirm threat intelligence is analyzed and distributed to relevant teams',
      'Assess whether threat intelligence informs risk assessment and response',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.RA-03',
    name: 'Threat Identification',
    description:
      'Internal and external threats to the organization are identified and recorded.',
    category: 'Identify - Risk Assessment',
    implementationGuidance:
      'Identify and document internal threats (insider threats, misconfigurations, human error) and external threats (nation-state actors, cybercriminals, hacktivists, natural disasters). Use threat modeling methodologies to systematically identify threats to critical assets and systems. Maintain a threat catalog and update it based on threat intelligence.',
    evidenceRequirements: [
      'Threat catalog documenting internal and external threats',
      'Threat modeling outputs for critical systems',
      'Threat assessment records linked to threat intelligence',
      'Evidence of regular threat catalog updates',
    ],
    testProcedures: [
      'Review threat catalog for comprehensiveness',
      'Verify threat modeling has been performed for critical systems',
      'Confirm threat assessments are updated based on intelligence',
      'Assess whether threats are mapped to organizational assets and risks',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.RA-04',
    name: 'Impact and Likelihood Assessment',
    description:
      'Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded.',
    category: 'Identify - Risk Assessment',
    implementationGuidance:
      'Assess and document the potential business impact and likelihood of threat scenarios exploiting identified vulnerabilities. Use consistent assessment criteria aligned with the organizational risk methodology. Consider factors such as threat capability, vulnerability severity, asset value, and existing controls. Record results in the risk register.',
    evidenceRequirements: [
      'Risk assessment records with impact and likelihood ratings',
      'Risk scoring methodology documentation',
      'Risk register entries with assessed threats and vulnerabilities',
      'Business impact analysis results informing risk assessments',
    ],
    testProcedures: [
      'Review risk assessments for consistent impact and likelihood scoring',
      'Verify scoring methodology aligns with organizational standards',
      'Confirm risk register contains assessed threat-vulnerability pairs',
      'Assess whether business impact analysis informs likelihood and impact ratings',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.RA-06',
    name: 'Risk Response Selection',
    description:
      'Risk responses are chosen, prioritized, planned, tracked, and communicated.',
    category: 'Identify - Risk Assessment',
    implementationGuidance:
      'Select appropriate risk responses (accept, mitigate, transfer, avoid) for each identified risk based on organizational risk appetite and tolerance. Develop risk treatment plans with specific actions, owners, timelines, and resources. Track implementation progress and communicate risk response status to stakeholders.',
    evidenceRequirements: [
      'Risk treatment plans for identified risks',
      'Risk response selection rationale documentation',
      'Risk treatment implementation tracking records',
      'Stakeholder communication records on risk response status',
    ],
    testProcedures: [
      'Review risk treatment plans for completeness and alignment with risk appetite',
      'Verify risk response selections are documented with rationale',
      'Confirm treatment plan implementation is tracked and on schedule',
      'Assess stakeholder communication on risk response progress',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.RA-07',
    name: 'Risk Change Management',
    description:
      'Changes and exceptions are managed, assessed for risk impact, recorded, and tracked.',
    category: 'Identify - Risk Assessment',
    implementationGuidance:
      'Implement processes to assess cybersecurity risk implications of changes to systems, networks, processes, and policies. Evaluate and track exceptions to security policies and standards. Document risk assessments for changes and exceptions, obtain appropriate approvals, and monitor compensating controls.',
    evidenceRequirements: [
      'Change management process incorporating risk assessment',
      'Risk impact assessments for system and process changes',
      'Exception request and approval records',
      'Compensating control documentation for approved exceptions',
    ],
    testProcedures: [
      'Review change management process for cybersecurity risk assessment integration',
      'Verify risk impact assessments are performed for changes',
      'Confirm exceptions are documented with approvals and compensating controls',
      'Assess tracking and periodic review of active exceptions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.RA-10',
    name: 'Critical Supplier Risk Assessment',
    description:
      'Critical suppliers are assessed prior to acquisition.',
    category: 'Identify - Risk Assessment',
    implementationGuidance:
      'Conduct cybersecurity risk assessments of critical suppliers before entering into agreements. Evaluate supplier security posture, certifications, incident history, and alignment with organizational security requirements. Use standardized assessment questionnaires and, where appropriate, request third-party audit reports or certifications (e.g., SOC 2, ISO 27001).',
    evidenceRequirements: [
      'Pre-acquisition supplier risk assessment records',
      'Supplier security questionnaire responses',
      'Supplier certifications and audit reports reviewed',
      'Risk-based supplier approval decision documentation',
    ],
    testProcedures: [
      'Review supplier risk assessment process for pre-acquisition coverage',
      'Verify assessments are completed before supplier agreements are finalized',
      'Confirm supplier certifications and audit reports are reviewed',
      'Assess whether assessment findings inform contractual requirements',
    ],
    status: 'Not Started',
  },

  // --- ID.IM: Improvement ---
  {
    controlId: 'ID.IM-01',
    name: 'Improvement from Evaluations',
    description:
      'Improvements are identified from evaluations.',
    category: 'Identify - Improvement',
    implementationGuidance:
      'Establish processes to identify cybersecurity improvements from evaluations such as audits, assessments, reviews, and testing. Document findings and develop improvement action plans with owners, timelines, and resources. Track improvement implementation and verify effectiveness.',
    evidenceRequirements: [
      'Evaluation findings and improvement recommendations',
      'Improvement action plans with assigned owners and timelines',
      'Implementation tracking records for improvements',
      'Effectiveness verification records for completed improvements',
    ],
    testProcedures: [
      'Review evaluation findings for improvement identification',
      'Verify improvement action plans are developed and assigned',
      'Confirm implementation tracking is maintained',
      'Assess effectiveness verification for completed improvements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.IM-02',
    name: 'Improvement from Security Tests',
    description:
      'Improvements are identified from security tests and exercises, including those done in coordination with suppliers and relevant third parties.',
    category: 'Identify - Improvement',
    implementationGuidance:
      'Conduct regular security tests and exercises including penetration tests, red team exercises, tabletop exercises, and business continuity tests. Include suppliers and third parties in exercises where relevant. Document lessons learned and improvement actions. Track remediation of identified weaknesses.',
    evidenceRequirements: [
      'Security test and exercise schedules and results',
      'Lessons learned documentation from exercises',
      'Improvement action items from tests and exercises',
      'Evidence of supplier participation in relevant exercises',
    ],
    testProcedures: [
      'Review security test and exercise schedule for completeness',
      'Verify lessons learned are documented and action items created',
      'Confirm improvement items are tracked to completion',
      'Assess supplier participation in relevant security exercises',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.IM-03',
    name: 'Improvement from Incident Response',
    description:
      'Improvements are identified from execution of operational processes, procedures, and activities.',
    category: 'Identify - Improvement',
    implementationGuidance:
      'Identify improvements from operational cybersecurity processes including incident response, change management, access management, and vulnerability management. Conduct post-incident reviews and operational process assessments. Document findings and integrate improvements into process updates.',
    evidenceRequirements: [
      'Post-incident review reports with improvement recommendations',
      'Operational process assessment findings',
      'Process improvement tracking records',
      'Updated process documentation reflecting improvements',
    ],
    testProcedures: [
      'Review post-incident reports for improvement identification',
      'Verify operational process assessments are conducted',
      'Confirm process improvements are tracked and implemented',
      'Assess updated documentation reflecting implemented improvements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ID.IM-04',
    name: 'Cybersecurity Plan Improvement',
    description:
      'Incident response plans and other cybersecurity plans that affect operations are established, communicated, maintained, and improved.',
    category: 'Identify - Improvement',
    implementationGuidance:
      'Develop and maintain comprehensive cybersecurity plans including incident response, disaster recovery, business continuity, and vulnerability management plans. Ensure plans are communicated to relevant personnel, tested regularly, and updated based on lessons learned, changes in the environment, and evolving threats.',
    evidenceRequirements: [
      'Current cybersecurity plans (incident response, DR, BC, vulnerability management)',
      'Plan communication and distribution records',
      'Plan testing and exercise records',
      'Plan update and revision history',
    ],
    testProcedures: [
      'Review cybersecurity plans for completeness and currency',
      'Verify plans are communicated to relevant personnel',
      'Confirm plans are tested regularly',
      'Assess plan updates based on lessons learned and environment changes',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // PR - PROTECT
  // ============================================================

  // --- PR.AA: Identity Management, Authentication, and Access Control ---
  {
    controlId: 'PR.AA-01',
    name: 'Identity and Credential Management',
    description:
      'Identities and credentials for authorized users, services, and hardware are managed by the organization.',
    category: 'Protect - Identity Management, Authentication, and Access Control',
    implementationGuidance:
      'Implement comprehensive identity and credential management processes including identity provisioning, credential issuance, lifecycle management, and deprovisioning. Use centralized identity management systems (e.g., Active Directory, IAM platforms). Enforce unique identity assignment, credential strength requirements, and timely credential rotation or revocation.',
    evidenceRequirements: [
      'Identity management policy and procedures',
      'Centralized identity management system deployment evidence',
      'Credential lifecycle management processes (issuance, rotation, revocation)',
      'Identity provisioning and deprovisioning records',
    ],
    testProcedures: [
      'Review identity management policy for comprehensiveness',
      'Verify centralized identity management system is deployed and operational',
      'Confirm credential lifecycle processes are enforced',
      'Assess timeliness of identity provisioning and deprovisioning',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.AA-02',
    name: 'Identity Proofing',
    description:
      'Identities are proofed and bound to credentials based on the context of interactions.',
    category: 'Protect - Identity Management, Authentication, and Access Control',
    implementationGuidance:
      'Implement identity proofing processes to verify the identity of users before issuing credentials. Align proofing rigor with the sensitivity of access being granted. Use multi-factor verification for high-assurance proofing. Document proofing procedures and maintain records of identity verification.',
    evidenceRequirements: [
      'Identity proofing procedures for different assurance levels',
      'Identity verification records for personnel',
      'Evidence of proofing rigor aligned to access sensitivity',
      'Multi-factor identity verification evidence for high-privilege accounts',
    ],
    testProcedures: [
      'Review identity proofing procedures for adequacy',
      'Verify proofing records exist for recently provisioned identities',
      'Confirm proofing rigor matches access sensitivity levels',
      'Assess multi-factor proofing for high-privilege account issuance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.AA-03',
    name: 'Access Control Enforcement',
    description:
      'Users, services, and hardware are authenticated.',
    category: 'Protect - Identity Management, Authentication, and Access Control',
    implementationGuidance:
      'Implement strong authentication mechanisms for all users, services, and hardware accessing organizational resources. Enforce multi-factor authentication (MFA) for remote access, privileged accounts, and access to sensitive data. Use certificate-based or token-based authentication for services and hardware. Monitor for authentication anomalies.',
    evidenceRequirements: [
      'Authentication policy specifying requirements by access type',
      'MFA deployment records and coverage metrics',
      'Service and hardware authentication mechanism documentation',
      'Authentication monitoring and anomaly detection evidence',
    ],
    testProcedures: [
      'Review authentication policy for coverage of all access types',
      'Verify MFA is enforced for remote, privileged, and sensitive access',
      'Confirm service and hardware authentication mechanisms are implemented',
      'Assess authentication anomaly detection and response',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.AA-04',
    name: 'Identity Assertions',
    description:
      'Identity assertions are protected, conveyed, and verified.',
    category: 'Protect - Identity Management, Authentication, and Access Control',
    implementationGuidance:
      'Protect identity assertions (e.g., SAML tokens, OAuth tokens, Kerberos tickets) during creation, transmission, and verification. Use encryption and signing for assertion protection. Implement assertion validation at service points. Configure appropriate assertion lifetimes and refresh mechanisms to limit exposure from compromised assertions.',
    evidenceRequirements: [
      'Identity federation and assertion protocol documentation',
      'Assertion encryption and signing configuration evidence',
      'Assertion lifetime and refresh policy documentation',
      'Assertion validation configuration at service endpoints',
    ],
    testProcedures: [
      'Review identity assertion protection mechanisms',
      'Verify assertions are encrypted and signed in transit',
      'Confirm assertion lifetimes are configured appropriately',
      'Assess assertion validation at consuming service endpoints',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.AA-05',
    name: 'Least Privilege and Separation of Duties',
    description:
      'Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed, and incorporate the principles of least privilege and separation of duties.',
    category: 'Protect - Identity Management, Authentication, and Access Control',
    implementationGuidance:
      'Implement least privilege access controls ensuring users, services, and processes have only the minimum permissions necessary to perform their functions. Enforce separation of duties for critical business and security functions. Define access permissions in formal policies, implement role-based access control (RBAC), and conduct periodic access reviews to identify and remediate excessive privileges.',
    evidenceRequirements: [
      'Access control policy incorporating least privilege and separation of duties',
      'Role-based access control (RBAC) definitions and assignments',
      'Periodic access review records and remediation actions',
      'Separation of duties matrix for critical functions',
    ],
    testProcedures: [
      'Review access control policy for least privilege and SoD requirements',
      'Verify RBAC definitions align with job functions',
      'Confirm periodic access reviews are conducted and excessive access remediated',
      'Assess separation of duties enforcement for critical functions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.AA-06',
    name: 'Physical Access Management',
    description:
      'Physical access to assets is managed, monitored, and enforced commensurate with risk.',
    category: 'Protect - Identity Management, Authentication, and Access Control',
    implementationGuidance:
      'Implement physical access controls for facilities housing critical IT assets including data centers, server rooms, and network closets. Use badge access, biometric systems, or multi-factor physical authentication as appropriate. Monitor and log physical access events. Conduct periodic reviews of physical access permissions and investigate anomalies.',
    evidenceRequirements: [
      'Physical access control policy and procedures',
      'Physical access control system deployment evidence (badge, biometric)',
      'Physical access logs and monitoring records',
      'Periodic physical access review records',
    ],
    testProcedures: [
      'Review physical access control policy for adequacy',
      'Verify physical access control systems are deployed at critical facilities',
      'Confirm physical access events are logged and monitored',
      'Assess periodic physical access reviews for completeness',
    ],
    status: 'Not Started',
  },

  // --- PR.AT: Awareness and Training ---
  {
    controlId: 'PR.AT-01',
    name: 'Security Awareness Training',
    description:
      'Personnel are provided with awareness and training so that they possess the knowledge and skills to perform general tasks with cybersecurity risks in mind.',
    category: 'Protect - Awareness and Training',
    implementationGuidance:
      'Implement a comprehensive security awareness training program for all personnel. Cover topics including phishing recognition, password hygiene, social engineering, data handling, incident reporting, and acceptable use. Deliver training during onboarding and at least annually thereafter. Track completion rates and assess training effectiveness through tests and simulated attacks.',
    evidenceRequirements: [
      'Security awareness training program documentation',
      'Training content covering key cybersecurity topics',
      'Training completion records for all personnel',
      'Training effectiveness metrics (test scores, phishing simulation results)',
    ],
    testProcedures: [
      'Review training program for topic coverage and currency',
      'Verify training is delivered during onboarding and annually',
      'Confirm training completion rates meet policy requirements',
      'Assess training effectiveness through test scores and simulation results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.AT-02',
    name: 'Role-Based Security Training',
    description:
      'Individuals in specialized roles are provided with awareness and training so that they possess the knowledge and skills to perform relevant tasks with cybersecurity risks in mind.',
    category: 'Protect - Awareness and Training',
    implementationGuidance:
      'Provide specialized cybersecurity training to individuals in roles with elevated security responsibilities including system administrators, developers, security analysts, incident responders, and executives. Tailor training content to role-specific threats, tools, and responsibilities. Require certifications or demonstrated competency where appropriate.',
    evidenceRequirements: [
      'Role-based training curriculum for specialized roles',
      'Training completion records for specialized personnel',
      'Certification or competency verification records',
      'Training needs assessment documentation',
    ],
    testProcedures: [
      'Review role-based training curriculum for relevance to each role',
      'Verify specialized personnel complete required training',
      'Confirm certifications or competency assessments are maintained',
      'Assess training needs analysis process for identifying role-specific requirements',
    ],
    status: 'Not Started',
  },

  // --- PR.DS: Data Security ---
  {
    controlId: 'PR.DS-01',
    name: 'Data-at-Rest Protection',
    description:
      'The confidentiality, integrity, and availability of data-at-rest are protected.',
    category: 'Protect - Data Security',
    implementationGuidance:
      'Implement encryption for sensitive data at rest using industry-standard algorithms (e.g., AES-256). Apply encryption to databases, file systems, backups, and removable media. Manage encryption keys securely using a key management system. Implement integrity controls (checksums, digital signatures) for critical data. Ensure backup and recovery processes maintain data availability.',
    evidenceRequirements: [
      'Data-at-rest encryption policy and standards',
      'Encryption deployment records for databases, file systems, and backups',
      'Key management system documentation and procedures',
      'Data integrity verification procedures and records',
    ],
    testProcedures: [
      'Review encryption policy for data-at-rest requirements',
      'Verify encryption is applied to sensitive data stores',
      'Confirm key management practices follow security standards',
      'Assess data integrity controls and verification processes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.DS-02',
    name: 'Data-in-Transit Protection',
    description:
      'The confidentiality, integrity, and availability of data-in-transit are protected.',
    category: 'Protect - Data Security',
    implementationGuidance:
      'Encrypt all sensitive data in transit using TLS 1.2 or higher for web traffic, IPsec or WireGuard for VPN connections, and SSH for administrative access. Disable insecure protocols (SSL, TLS 1.0/1.1). Implement certificate management for TLS endpoints. Use mutual authentication where appropriate. Monitor for unencrypted data transmission.',
    evidenceRequirements: [
      'Data-in-transit encryption policy and standards',
      'TLS configuration and certificate management evidence',
      'VPN and secure communication deployment records',
      'Evidence of insecure protocol deprecation',
    ],
    testProcedures: [
      'Review encryption policy for data-in-transit requirements',
      'Verify TLS configurations meet minimum standards (TLS 1.2+)',
      'Confirm insecure protocols are disabled across the environment',
      'Assess certificate management and renewal processes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.DS-10',
    name: 'Data-in-Use Protection',
    description:
      'The confidentiality, integrity, and availability of data-in-use are protected.',
    category: 'Protect - Data Security',
    implementationGuidance:
      'Implement protections for data while it is being processed or in memory. Use memory encryption technologies, secure enclaves, or trusted execution environments where available. Implement endpoint protection to prevent memory scraping attacks. Control access to debugging tools and memory dump capabilities. Apply data masking for non-production environments.',
    evidenceRequirements: [
      'Data-in-use protection policy and procedures',
      'Endpoint protection deployment covering memory protection',
      'Data masking procedures for non-production environments',
      'Secure processing environment documentation',
    ],
    testProcedures: [
      'Review data-in-use protection policy for adequacy',
      'Verify endpoint protection includes memory protection capabilities',
      'Confirm data masking is applied in non-production environments',
      'Assess secure processing environment implementations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.DS-01A',
    name: 'Data Loss Prevention',
    description:
      'Technical controls are implemented to prevent unauthorized data exfiltration and loss.',
    category: 'Protect - Data Security',
    implementationGuidance:
      'Deploy data loss prevention (DLP) technologies to monitor, detect, and prevent unauthorized transmission of sensitive data through email, web, cloud services, and removable media. Define DLP policies based on data classification. Implement network and endpoint DLP agents. Monitor DLP alerts and investigate policy violations.',
    evidenceRequirements: [
      'DLP policy aligned with data classification scheme',
      'DLP tool deployment and configuration evidence',
      'DLP alert monitoring and incident records',
      'DLP effectiveness reports showing detected and prevented violations',
    ],
    testProcedures: [
      'Review DLP policies for alignment with data classification',
      'Verify DLP tools are deployed across key channels (email, web, endpoint)',
      'Confirm DLP alerts are monitored and violations investigated',
      'Assess DLP effectiveness through testing controlled data transfers',
    ],
    status: 'Not Started',
  },

  // --- PR.PS: Platform Security ---
  {
    controlId: 'PR.PS-01',
    name: 'Configuration Management',
    description:
      'The configuration of current hardware, software, firmware, and networks is managed, documented, reviewed, and approved with security principles addressed, including the principle of least functionality.',
    category: 'Protect - Platform Security',
    implementationGuidance:
      'Implement configuration management processes to establish, document, and maintain secure baseline configurations for all hardware, software, firmware, and network devices. Apply the principle of least functionality by disabling unnecessary services, ports, and features. Use configuration management databases (CMDB) and automated tools to track and enforce configurations.',
    evidenceRequirements: [
      'Secure baseline configuration standards for each platform type',
      'Configuration management database (CMDB) or system',
      'Configuration review and approval records',
      'Evidence of least functionality implementation (disabled services/ports)',
    ],
    testProcedures: [
      'Review baseline configuration standards for security adequacy',
      'Verify CMDB accuracy against deployed configurations',
      'Confirm configuration reviews and approvals are documented',
      'Assess least functionality implementation through configuration scanning',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.PS-02',
    name: 'Software Maintenance and Patching',
    description:
      'Software is maintained, replaced, and removed commensurate with risk.',
    category: 'Protect - Platform Security',
    implementationGuidance:
      'Implement a patch management program to maintain current software versions and apply security patches in a timely manner based on risk. Define patching timelines by severity (e.g., critical patches within 14 days). Establish processes for removing or replacing end-of-life software. Test patches in non-production environments before deployment.',
    evidenceRequirements: [
      'Patch management policy with defined timelines by severity',
      'Patch deployment records and compliance reports',
      'End-of-life software tracking and remediation plans',
      'Patch testing procedures and results',
    ],
    testProcedures: [
      'Review patch management policy for risk-based timelines',
      'Verify patch deployment compliance rates meet targets',
      'Confirm end-of-life software is tracked and remediation planned',
      'Assess patch testing procedures and deployment success rates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.PS-03',
    name: 'Hardware Maintenance',
    description:
      'Hardware is maintained, replaced, and removed commensurate with risk.',
    category: 'Protect - Platform Security',
    implementationGuidance:
      'Implement hardware maintenance programs including preventive maintenance schedules, replacement planning for aging or failing hardware, and secure disposal processes for decommissioned equipment. Track hardware warranty and support status. Ensure maintenance activities do not compromise security (e.g., vendor access controls during maintenance).',
    evidenceRequirements: [
      'Hardware maintenance policy and procedures',
      'Preventive maintenance schedules and completion records',
      'Hardware replacement and disposal records',
      'Vendor access controls for maintenance activities',
    ],
    testProcedures: [
      'Review hardware maintenance policy for completeness',
      'Verify preventive maintenance schedules are followed',
      'Confirm secure disposal processes are applied to decommissioned hardware',
      'Assess vendor access controls during maintenance activities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.PS-04',
    name: 'Log Management',
    description:
      'Log records are generated and made available for continuous monitoring.',
    category: 'Protect - Platform Security',
    implementationGuidance:
      'Implement centralized log management collecting security-relevant events from all critical systems, applications, and network devices. Define log retention periods based on regulatory and operational requirements. Protect log integrity through write-once storage, digital signatures, or centralized SIEM. Ensure log sources are synchronized using NTP for accurate timestamps.',
    evidenceRequirements: [
      'Log management policy defining sources, retention, and protection requirements',
      'Centralized log management or SIEM deployment evidence',
      'Log source coverage documentation',
      'Time synchronization (NTP) configuration evidence',
    ],
    testProcedures: [
      'Review log management policy for adequacy',
      'Verify centralized log collection from critical systems',
      'Confirm log retention meets policy requirements',
      'Assess log integrity protection mechanisms',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.PS-05',
    name: 'Unauthorized Software Prevention',
    description:
      'Installation and execution of unauthorized software is prevented.',
    category: 'Protect - Platform Security',
    implementationGuidance:
      'Implement application whitelisting or software restriction policies to prevent installation and execution of unauthorized software. Use endpoint protection platforms to enforce software policies. Maintain an approved software list and review it regularly. Implement controls to prevent users from bypassing software restrictions.',
    evidenceRequirements: [
      'Software restriction or application whitelisting policy',
      'Approved software list and review records',
      'Application whitelisting tool deployment evidence',
      'Endpoint protection configuration for software control',
    ],
    testProcedures: [
      'Review software restriction policy for clarity and coverage',
      'Verify application whitelisting or restriction tools are deployed',
      'Confirm approved software list is reviewed and maintained',
      'Test software restriction enforcement by attempting unauthorized installation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.PS-06',
    name: 'Secure Software Development',
    description:
      'Secure software development practices are integrated, and their performance is monitored throughout the software development life cycle.',
    category: 'Protect - Platform Security',
    implementationGuidance:
      'Integrate security into the software development lifecycle (SDLC) including secure coding standards, threat modeling during design, static and dynamic application security testing (SAST/DAST), code review, and security testing before deployment. Train developers on secure coding practices. Monitor SDLC security metrics.',
    evidenceRequirements: [
      'Secure SDLC policy and procedures',
      'Secure coding standards documentation',
      'SAST/DAST tool deployment and scan records',
      'Developer security training completion records',
    ],
    testProcedures: [
      'Review secure SDLC policy for integration of security at each phase',
      'Verify SAST/DAST tools are integrated into the development pipeline',
      'Confirm developers receive secure coding training',
      'Assess security testing results and remediation rates',
    ],
    status: 'Not Started',
  },

  // --- PR.IR: Technology Infrastructure Resilience ---
  {
    controlId: 'PR.IR-01',
    name: 'Network Protection and Resilience',
    description:
      'Networks and environments are protected from unauthorized logical access and usage.',
    category: 'Protect - Technology Infrastructure Resilience',
    implementationGuidance:
      'Implement network security controls including firewalls, intrusion prevention systems (IPS), network segmentation, and access control lists (ACLs). Deploy network monitoring for unauthorized access detection. Implement zero trust network architecture principles where feasible. Establish redundancy and failover for critical network infrastructure.',
    evidenceRequirements: [
      'Network security architecture documentation',
      'Firewall and IPS deployment and rule documentation',
      'Network segmentation implementation evidence',
      'Network redundancy and failover configuration evidence',
    ],
    testProcedures: [
      'Review network security architecture for defense-in-depth',
      'Verify firewall and IPS rules are documented and reviewed',
      'Confirm network segmentation is implemented and effective',
      'Test network redundancy and failover capabilities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.IR-02',
    name: 'Technology Asset Resilience',
    description:
      'The organization\'s technology assets are protected from environmental threats and unauthorized physical access.',
    category: 'Protect - Technology Infrastructure Resilience',
    implementationGuidance:
      'Implement environmental controls for facilities housing technology assets including fire suppression, HVAC monitoring, water leak detection, and uninterruptible power supplies (UPS). Protect against environmental threats through site selection and building design. Implement redundancy for critical infrastructure components. Monitor environmental conditions continuously.',
    evidenceRequirements: [
      'Environmental control deployment documentation',
      'Environmental monitoring system deployment and alert records',
      'UPS and power redundancy configuration evidence',
      'Fire suppression system maintenance records',
    ],
    testProcedures: [
      'Review environmental controls for critical facilities',
      'Verify environmental monitoring systems are active and alerting',
      'Confirm UPS and power redundancy systems are operational',
      'Assess fire suppression system testing and maintenance records',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // DE - DETECT
  // ============================================================

  // --- DE.CM: Continuous Monitoring ---
  {
    controlId: 'DE.CM-01',
    name: 'Network Monitoring',
    description:
      'Networks and network services are monitored to find potentially adverse events.',
    category: 'Detect - Continuous Monitoring',
    implementationGuidance:
      'Implement continuous network monitoring using SIEM, IDS/IPS, network traffic analysis (NTA), and flow monitoring tools. Monitor for anomalous traffic patterns, known attack signatures, unauthorized connections, and policy violations. Establish baselines for normal network behavior and configure alerts for deviations. Ensure monitoring covers all network segments.',
    evidenceRequirements: [
      'Network monitoring architecture and tool deployment documentation',
      'Network monitoring coverage map across all segments',
      'Alert rules and threshold configuration documentation',
      'Network monitoring operational reports showing detected events',
    ],
    testProcedures: [
      'Review network monitoring tools and coverage',
      'Verify monitoring covers all critical network segments',
      'Confirm alert rules are configured for key threat indicators',
      'Assess operational effectiveness through detected event analysis',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'DE.CM-02',
    name: 'Physical Environment Monitoring',
    description:
      'The physical environment is monitored to find potentially adverse events.',
    category: 'Detect - Continuous Monitoring',
    implementationGuidance:
      'Implement physical environment monitoring including video surveillance, intrusion detection systems, environmental sensors (temperature, humidity, water), and physical access logging. Monitor for unauthorized physical access, environmental anomalies, and security breaches. Integrate physical security monitoring with IT security operations where possible.',
    evidenceRequirements: [
      'Physical monitoring system deployment documentation',
      'Video surveillance coverage documentation',
      'Environmental sensor deployment and alert configuration',
      'Physical security monitoring operational records',
    ],
    testProcedures: [
      'Review physical monitoring system deployment and coverage',
      'Verify video surveillance covers critical areas',
      'Confirm environmental sensors are operational and alerting',
      'Assess integration between physical and IT security monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'DE.CM-03',
    name: 'Personnel Activity Monitoring',
    description:
      'Personnel activity and technology usage are monitored to find potentially adverse events.',
    category: 'Detect - Continuous Monitoring',
    implementationGuidance:
      'Monitor personnel activity and technology usage for indicators of insider threats, policy violations, and compromised accounts. Implement user and entity behavior analytics (UEBA), privileged access monitoring, and acceptable use policy enforcement. Establish baselines for normal user behavior and alert on anomalies. Ensure monitoring complies with privacy requirements.',
    evidenceRequirements: [
      'Personnel activity monitoring policy compliant with privacy requirements',
      'UEBA or user monitoring tool deployment evidence',
      'Privileged access monitoring configuration documentation',
      'Anomaly detection alerts and investigation records',
    ],
    testProcedures: [
      'Review personnel monitoring policy for privacy compliance',
      'Verify UEBA or monitoring tools are deployed and operational',
      'Confirm privileged access activities are monitored',
      'Assess anomaly detection effectiveness and investigation follow-through',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'DE.CM-06',
    name: 'External Service Provider Monitoring',
    description:
      'External service provider activities and services are monitored to find potentially adverse events.',
    category: 'Detect - Continuous Monitoring',
    implementationGuidance:
      'Monitor activities of external service providers with access to organizational systems and data. Implement logging and monitoring for third-party access sessions. Review service provider security reports and certifications periodically. Establish automated alerting for anomalous third-party behavior and contractual compliance deviations.',
    evidenceRequirements: [
      'Third-party activity monitoring procedures',
      'Logging and monitoring configuration for external access',
      'Service provider security report review records',
      'Anomaly detection alerts for third-party activities',
    ],
    testProcedures: [
      'Review third-party monitoring procedures for adequacy',
      'Verify logging is enabled for all external access points',
      'Confirm service provider security reports are reviewed per schedule',
      'Assess anomaly detection for third-party activity effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'DE.CM-09',
    name: 'Computing Hardware and Software Monitoring',
    description:
      'Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events.',
    category: 'Detect - Continuous Monitoring',
    implementationGuidance:
      'Deploy endpoint detection and response (EDR) tools, host-based intrusion detection, and application monitoring to detect adverse events on computing assets. Monitor for malware, unauthorized changes, configuration drift, and runtime anomalies. Implement file integrity monitoring (FIM) for critical system files and configurations.',
    evidenceRequirements: [
      'EDR and endpoint monitoring tool deployment evidence',
      'File integrity monitoring (FIM) deployment and configuration',
      'Application and runtime monitoring documentation',
      'Endpoint monitoring alert and investigation records',
    ],
    testProcedures: [
      'Review EDR tool deployment coverage across endpoints',
      'Verify FIM is configured for critical system files',
      'Confirm application monitoring covers critical applications',
      'Assess endpoint alert investigation and response effectiveness',
    ],
    status: 'Not Started',
  },

  // --- DE.AE: Adverse Event Analysis ---
  {
    controlId: 'DE.AE-02',
    name: 'Adverse Event Analysis',
    description:
      'Potentially adverse events are analyzed to better understand associated activities.',
    category: 'Detect - Adverse Event Analysis',
    implementationGuidance:
      'Establish processes and capabilities to analyze potentially adverse events identified by monitoring systems. Correlate events across multiple data sources to understand attack patterns and scope. Use SIEM correlation rules, threat intelligence enrichment, and analyst investigation procedures. Document analysis findings and escalate confirmed incidents.',
    evidenceRequirements: [
      'Event analysis procedures and playbooks',
      'SIEM correlation rule documentation',
      'Event analysis and investigation records',
      'Threat intelligence enrichment integration evidence',
    ],
    testProcedures: [
      'Review event analysis procedures for comprehensiveness',
      'Verify SIEM correlation rules are configured and tuned',
      'Confirm event investigations are documented with findings',
      'Assess threat intelligence integration effectiveness in analysis',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'DE.AE-03',
    name: 'Event Correlation and Aggregation',
    description:
      'Information is correlated from multiple sources.',
    category: 'Detect - Adverse Event Analysis',
    implementationGuidance:
      'Implement event correlation and aggregation across multiple data sources including network logs, endpoint telemetry, application logs, threat intelligence, and physical security events. Use SIEM platforms to aggregate and correlate events. Develop correlation rules that identify multi-stage attacks and lateral movement patterns.',
    evidenceRequirements: [
      'SIEM or correlation platform deployment documentation',
      'Data source integration inventory for correlation',
      'Correlation rule library documentation',
      'Evidence of multi-source correlation in investigation records',
    ],
    testProcedures: [
      'Review SIEM deployment and data source integration',
      'Verify correlation rules address key attack patterns',
      'Confirm multi-source correlation is used in investigations',
      'Assess correlation rule effectiveness through detection metrics',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'DE.AE-06',
    name: 'Incident Declaration',
    description:
      'Information on adverse events is provided to authorized staff and tools.',
    category: 'Detect - Adverse Event Analysis',
    implementationGuidance:
      'Establish clear criteria and processes for declaring security incidents based on adverse event analysis. Define notification workflows that alert authorized personnel and activate response tools. Implement automated alerting for high-severity events. Ensure incident declaration triggers appropriate response plan activation.',
    evidenceRequirements: [
      'Incident declaration criteria and thresholds',
      'Notification workflow documentation',
      'Automated alerting configuration for high-severity events',
      'Incident declaration records showing timely escalation',
    ],
    testProcedures: [
      'Review incident declaration criteria for clarity and completeness',
      'Verify notification workflows are configured and tested',
      'Confirm automated alerting functions for high-severity events',
      'Assess timeliness of incident declaration through historical records',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // RS - RESPOND
  // ============================================================

  // --- RS.MA: Incident Management ---
  {
    controlId: 'RS.MA-01',
    name: 'Incident Response Plan Execution',
    description:
      'The incident response plan is executed in coordination with relevant third parties once an incident is declared.',
    category: 'Respond - Incident Management',
    implementationGuidance:
      'Upon incident declaration, execute the incident response plan including activating the incident response team, establishing command and communication structures, and coordinating with relevant third parties (law enforcement, regulators, vendors, ISACs). Ensure plan execution follows defined procedures and adapts to incident specifics.',
    evidenceRequirements: [
      'Incident response plan with execution procedures',
      'Incident response team activation records',
      'Third-party coordination records during incidents',
      'Incident response execution logs and timelines',
    ],
    testProcedures: [
      'Review incident response plan for execution procedures',
      'Verify incident response team activation processes are tested',
      'Confirm third-party coordination procedures are established',
      'Assess incident execution logs for adherence to plan',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RS.MA-02',
    name: 'Incident Triage and Prioritization',
    description:
      'Incidents are triaged and validated.',
    category: 'Respond - Incident Management',
    implementationGuidance:
      'Implement incident triage processes to validate reported incidents, assess severity and scope, and prioritize response activities. Define triage criteria including impact, urgency, affected systems, and data sensitivity. Assign incidents to appropriate responders based on severity and type. Document triage decisions and rationale.',
    evidenceRequirements: [
      'Incident triage procedures and severity classification criteria',
      'Incident triage records showing validation and classification',
      'Prioritization framework documentation',
      'Responder assignment records based on triage outcome',
    ],
    testProcedures: [
      'Review triage procedures for comprehensiveness',
      'Verify incident triage records include validation and severity assessment',
      'Confirm prioritization framework is consistently applied',
      'Assess responder assignment appropriateness based on incident type',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RS.MA-03',
    name: 'Incident Categorization and Tracking',
    description:
      'Incidents are categorized and prioritized.',
    category: 'Respond - Incident Management',
    implementationGuidance:
      'Implement incident categorization using a standardized taxonomy (e.g., malware, phishing, data breach, DoS, insider threat). Assign priority levels based on organizational impact. Track all incidents in a centralized incident management system from detection through closure. Maintain metrics for incident categories, volumes, and response times.',
    evidenceRequirements: [
      'Incident categorization taxonomy documentation',
      'Centralized incident tracking system deployment evidence',
      'Incident records with categorization and prioritization',
      'Incident metrics and trending reports',
    ],
    testProcedures: [
      'Review incident categorization taxonomy for completeness',
      'Verify incident tracking system captures all required fields',
      'Confirm incidents are consistently categorized and prioritized',
      'Assess incident metrics for trend identification capability',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RS.MA-04',
    name: 'Incident Escalation',
    description:
      'Incidents are escalated or elevated as needed.',
    category: 'Respond - Incident Management',
    implementationGuidance:
      'Define and implement incident escalation procedures including criteria for escalation, escalation paths, and notification requirements. Establish escalation timelines for different severity levels. Ensure escalation procedures reach appropriate decision-makers including executive leadership for major incidents. Document and track all escalation actions.',
    evidenceRequirements: [
      'Incident escalation procedures and criteria',
      'Escalation path documentation including contacts and timelines',
      'Escalation records for incidents requiring elevation',
      'Executive notification records for major incidents',
    ],
    testProcedures: [
      'Review escalation procedures for clarity and appropriateness',
      'Verify escalation paths are current and contacts are accurate',
      'Confirm escalation records demonstrate adherence to timelines',
      'Assess executive notification for major incidents',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RS.MA-05',
    name: 'Incident Closure and Post-Incident Review',
    description:
      'The criteria for initiating incident recovery are applied.',
    category: 'Respond - Incident Management',
    implementationGuidance:
      'Define criteria for incident closure and transition to recovery. Conduct post-incident reviews for significant incidents to identify root causes, evaluate response effectiveness, and document lessons learned. Track improvement actions from post-incident reviews. Update incident response plans based on findings.',
    evidenceRequirements: [
      'Incident closure criteria documentation',
      'Post-incident review reports with root cause analysis',
      'Lessons learned documentation and improvement action tracking',
      'Updated incident response plans reflecting post-incident findings',
    ],
    testProcedures: [
      'Review incident closure criteria for completeness',
      'Verify post-incident reviews are conducted for significant incidents',
      'Confirm lessons learned result in tracked improvement actions',
      'Assess incident response plan updates based on review findings',
    ],
    status: 'Not Started',
  },

  // --- RS.AN: Incident Analysis ---
  {
    controlId: 'RS.AN-03',
    name: 'Incident Root Cause Analysis',
    description:
      'Analysis is performed to determine what has taken place during an incident and the root cause of the incident.',
    category: 'Respond - Incident Analysis',
    implementationGuidance:
      'Conduct detailed incident analysis to determine the timeline of events, attack vectors, compromised assets, data affected, and root cause. Use digital forensics techniques, log analysis, malware analysis, and threat intelligence to reconstruct incident details. Document findings in a structured format that supports remediation and prevention efforts.',
    evidenceRequirements: [
      'Incident analysis methodology and procedures',
      'Root cause analysis reports for significant incidents',
      'Forensic analysis tools and capabilities documentation',
      'Incident timeline reconstruction documentation',
    ],
    testProcedures: [
      'Review incident analysis methodology for rigor',
      'Verify root cause analysis is performed for significant incidents',
      'Confirm forensic capabilities are maintained and available',
      'Assess quality of incident timeline reconstructions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RS.AN-06',
    name: 'Incident Impact Understanding',
    description:
      'Actions performed during an investigation are recorded, and the integrity of and provenance of collected data and observations is safeguarded.',
    category: 'Respond - Incident Analysis',
    implementationGuidance:
      'Implement chain of custody procedures for all evidence collected during incident investigations. Document all investigative actions taken, by whom, and when. Use forensically sound collection methods to preserve evidence integrity. Maintain secure evidence storage with access controls. Ensure evidence handling meets legal and regulatory requirements.',
    evidenceRequirements: [
      'Chain of custody procedures and forms',
      'Investigative action logs from incident investigations',
      'Evidence integrity verification records (hashes, digital signatures)',
      'Secure evidence storage documentation',
    ],
    testProcedures: [
      'Review chain of custody procedures for completeness',
      'Verify investigative actions are logged in investigation records',
      'Confirm evidence integrity is maintained through proper procedures',
      'Assess secure evidence storage and access controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RS.AN-07',
    name: 'Incident Forensic Data Collection',
    description:
      'Incident data and metadata are collected, and their integrity and provenance are preserved.',
    category: 'Respond - Incident Analysis',
    implementationGuidance:
      'Establish processes and capabilities for collecting and preserving incident data and metadata including log files, system images, memory dumps, network captures, and threat intelligence. Use write-blockers and forensic imaging tools to preserve evidence. Maintain timestamps and hash values for all collected data. Store evidence in a secure, access-controlled repository.',
    evidenceRequirements: [
      'Forensic data collection procedures',
      'Forensic tool inventory and deployment documentation',
      'Evidence collection records with hash values and timestamps',
      'Secure evidence repository access logs',
    ],
    testProcedures: [
      'Review forensic data collection procedures for adequacy',
      'Verify forensic tools are available and maintained',
      'Confirm evidence collection records include integrity verification',
      'Assess evidence repository security controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RS.AN-08',
    name: 'Incident Trend Analysis',
    description:
      'An incident\'s magnitude is estimated and validated.',
    category: 'Respond - Incident Analysis',
    implementationGuidance:
      'Estimate and validate the magnitude of incidents by assessing the scope of compromise, number of affected systems and users, volume and sensitivity of data exposed, and business impact. Use structured assessment criteria for magnitude estimation. Update magnitude assessments as new information becomes available during the investigation.',
    evidenceRequirements: [
      'Incident magnitude assessment criteria',
      'Magnitude assessment records for incidents',
      'Impact quantification documentation',
      'Updated magnitude assessments reflecting investigation progress',
    ],
    testProcedures: [
      'Review magnitude assessment criteria for comprehensiveness',
      'Verify magnitude assessments are performed for incidents',
      'Confirm impact quantification is documented',
      'Assess whether magnitude updates occur as investigations progress',
    ],
    status: 'Not Started',
  },

  // --- RS.CO: Incident Reporting and Communication ---
  {
    controlId: 'RS.CO-02',
    name: 'Internal Incident Reporting',
    description:
      'Internal and external stakeholders are notified of incidents.',
    category: 'Respond - Incident Reporting and Communication',
    implementationGuidance:
      'Implement incident notification procedures for both internal stakeholders (executives, legal, HR, affected business units) and external stakeholders (regulators, law enforcement, customers, partners) as required. Define notification timelines, content requirements, and communication channels for each stakeholder group. Ensure notifications comply with regulatory breach notification requirements.',
    evidenceRequirements: [
      'Incident notification procedures for internal and external stakeholders',
      'Notification timeline requirements by stakeholder type',
      'Incident notification records and templates',
      'Regulatory breach notification compliance documentation',
    ],
    testProcedures: [
      'Review notification procedures for all stakeholder groups',
      'Verify notification timelines meet regulatory requirements',
      'Confirm notification records exist for past incidents',
      'Assess notification template completeness and accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RS.CO-03',
    name: 'Incident Information Sharing',
    description:
      'Information is shared with designated internal and external stakeholders.',
    category: 'Respond - Incident Reporting and Communication',
    implementationGuidance:
      'Establish processes for sharing incident information with designated internal teams and external partners, including ISACs, sector partners, and government agencies. Define information sharing agreements, classification levels for shared information, and approved sharing mechanisms. Ensure shared information is sanitized to protect sensitive details while providing actionable intelligence.',
    evidenceRequirements: [
      'Information sharing agreements with external partners',
      'Information sharing procedures and classification guidelines',
      'Records of incident information shared with partners',
      'Information sanitization procedures for external sharing',
    ],
    testProcedures: [
      'Review information sharing agreements and procedures',
      'Verify sharing classification guidelines are defined and followed',
      'Confirm incident information has been shared per agreements',
      'Assess information sanitization before external sharing',
    ],
    status: 'Not Started',
  },

  // --- RS.MI: Incident Mitigation ---
  {
    controlId: 'RS.MI-01',
    name: 'Incident Containment',
    description:
      'Incidents are contained.',
    category: 'Respond - Incident Mitigation',
    implementationGuidance:
      'Implement incident containment procedures to limit the spread and impact of security incidents. Define containment strategies for different incident types (e.g., network isolation, account lockout, system quarantine, traffic blocking). Establish decision criteria for selecting containment actions. Ensure containment actions are documented and reversible where possible.',
    evidenceRequirements: [
      'Incident containment procedures by incident type',
      'Containment strategy decision criteria',
      'Containment action records from past incidents',
      'Containment playbooks for common incident scenarios',
    ],
    testProcedures: [
      'Review containment procedures for coverage of incident types',
      'Verify decision criteria for containment actions are documented',
      'Confirm containment actions are recorded during incidents',
      'Test containment playbook execution through exercises',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RS.MI-02',
    name: 'Incident Eradication',
    description:
      'Incidents are eradicated.',
    category: 'Respond - Incident Mitigation',
    implementationGuidance:
      'Implement incident eradication procedures to eliminate the root cause of incidents from the environment. Eradication activities may include removing malware, closing vulnerabilities, resetting compromised credentials, rebuilding affected systems, and implementing additional controls. Verify eradication completeness before transitioning to recovery.',
    evidenceRequirements: [
      'Incident eradication procedures',
      'Eradication action records from past incidents',
      'Eradication verification and validation records',
      'Evidence of vulnerability closure and control implementation post-incident',
    ],
    testProcedures: [
      'Review eradication procedures for comprehensiveness',
      'Verify eradication actions are documented for past incidents',
      'Confirm eradication verification is performed before recovery',
      'Assess post-incident vulnerability closure and control implementation',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // RC - RECOVER
  // ============================================================

  // --- RC.RP: Incident Recovery Plan Execution ---
  {
    controlId: 'RC.RP-01',
    name: 'Recovery Plan Execution',
    description:
      'The recovery portion of the incident response plan is executed once initiated from the incident response process.',
    category: 'Recover - Incident Recovery Plan Execution',
    implementationGuidance:
      'Execute recovery plans once incident containment and eradication are confirmed. Restore affected systems, data, and services following prioritized recovery procedures. Validate system integrity before returning to production. Coordinate recovery activities with business continuity plans and communicate progress to stakeholders.',
    evidenceRequirements: [
      'Recovery plan with prioritized restoration procedures',
      'Recovery execution records and timelines',
      'System integrity validation records before production return',
      'Stakeholder communication records during recovery',
    ],
    testProcedures: [
      'Review recovery plan for prioritized restoration procedures',
      'Verify recovery execution records exist for past incidents',
      'Confirm system integrity validation is performed before restoration',
      'Assess stakeholder communication during recovery activities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RC.RP-02',
    name: 'Recovery Action Selection',
    description:
      'Recovery actions are selected, scoped, and prioritized, considering the collection and preservation of forensic data and the notional and actual impacts of the incident.',
    category: 'Recover - Incident Recovery Plan Execution',
    implementationGuidance:
      'Select recovery actions based on incident impact assessment, forensic data preservation needs, and business priorities. Scope recovery to affected systems while preserving evidence. Prioritize recovery of critical business functions. Balance speed of recovery with thoroughness of eradication and forensic requirements.',
    evidenceRequirements: [
      'Recovery action selection criteria and prioritization framework',
      'Recovery scoping documentation for incidents',
      'Evidence of forensic preservation considered during recovery planning',
      'Critical business function recovery prioritization documentation',
    ],
    testProcedures: [
      'Review recovery action selection criteria for comprehensiveness',
      'Verify recovery scoping considers forensic preservation',
      'Confirm critical business functions are prioritized in recovery',
      'Assess balance between recovery speed and forensic integrity',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RC.RP-03',
    name: 'Recovery Verification',
    description:
      'The integrity of backups and other restoration assets is verified before using them for restoration.',
    category: 'Recover - Incident Recovery Plan Execution',
    implementationGuidance:
      'Verify the integrity and security of backups, system images, and other restoration assets before using them for recovery. Scan restoration media for malware. Validate backup data integrity through checksums and test restores. Ensure restoration assets are from before the incident or are verified clean. Document verification activities.',
    evidenceRequirements: [
      'Backup integrity verification procedures',
      'Backup testing and validation records',
      'Malware scanning records for restoration media',
      'Pre-restoration verification checklists',
    ],
    testProcedures: [
      'Review backup integrity verification procedures',
      'Verify backup testing is conducted regularly',
      'Confirm restoration media is scanned before use',
      'Assess pre-restoration verification checklist completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RC.RP-04',
    name: 'Critical Function Restoration',
    description:
      'Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms.',
    category: 'Recover - Incident Recovery Plan Execution',
    implementationGuidance:
      'Establish post-incident operational norms that address both critical mission function restoration and updated cybersecurity risk management. Implement enhanced monitoring for recovered systems. Update security controls based on incident findings. Define criteria for returning to normal operations from heightened security posture.',
    evidenceRequirements: [
      'Post-incident operational norm documentation',
      'Enhanced monitoring configuration for recovered systems',
      'Updated security controls based on incident findings',
      'Criteria for transitioning from enhanced to normal security posture',
    ],
    testProcedures: [
      'Review post-incident operational norm documentation',
      'Verify enhanced monitoring is implemented for recovered systems',
      'Confirm security controls are updated based on incident findings',
      'Assess criteria and process for returning to normal operations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RC.RP-05',
    name: 'Operational Integrity Verification',
    description:
      'The integrity of restored assets is verified, systems and services are restored, and normal operating status is confirmed.',
    category: 'Recover - Incident Recovery Plan Execution',
    implementationGuidance:
      'Verify the integrity of all restored assets, systems, and services before confirming normal operational status. Conduct thorough testing including functionality testing, security scanning, and performance validation. Obtain business owner sign-off for service restoration. Monitor restored systems closely for a defined period post-recovery.',
    evidenceRequirements: [
      'Restored asset integrity verification records',
      'Post-restoration testing and validation results',
      'Business owner sign-off for service restoration',
      'Post-recovery monitoring plans and results',
    ],
    testProcedures: [
      'Review integrity verification records for restored assets',
      'Verify post-restoration testing covers functionality and security',
      'Confirm business owner sign-off is obtained',
      'Assess post-recovery monitoring plan execution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RC.RP-06',
    name: 'Recovery Documentation and Closure',
    description:
      'The end of incident recovery is declared based on criteria, and incident-related documentation is completed.',
    category: 'Recover - Incident Recovery Plan Execution',
    implementationGuidance:
      'Define criteria for declaring the end of incident recovery. Ensure all incident-related documentation is completed including incident timelines, response actions, forensic findings, impact assessments, and lessons learned. Obtain formal sign-off from incident commander or designated authority. Archive documentation per retention requirements.',
    evidenceRequirements: [
      'Recovery completion criteria documentation',
      'Complete incident documentation packages',
      'Recovery closure sign-off records',
      'Incident documentation archival records',
    ],
    testProcedures: [
      'Review recovery completion criteria for adequacy',
      'Verify incident documentation is complete for past incidents',
      'Confirm recovery closure sign-off is obtained',
      'Assess incident documentation archival and retention compliance',
    ],
    status: 'Not Started',
  },

  // --- RC.CO: Recovery Communication ---
  {
    controlId: 'RC.CO-03',
    name: 'Recovery Status Communication',
    description:
      'Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders.',
    category: 'Recover - Recovery Communication',
    implementationGuidance:
      'Establish communication procedures for providing recovery status updates to internal stakeholders (executives, business units, employees) and external stakeholders (customers, partners, regulators). Define communication frequency, channels, and content based on stakeholder needs. Provide transparent and timely updates on recovery progress and expected timelines.',
    evidenceRequirements: [
      'Recovery communication plan and procedures',
      'Recovery status update templates for different stakeholder groups',
      'Recovery communication records from past incidents',
      'Stakeholder feedback on recovery communications',
    ],
    testProcedures: [
      'Review recovery communication plan for stakeholder coverage',
      'Verify communication templates exist for different audiences',
      'Confirm recovery communications were sent during past incidents',
      'Assess stakeholder feedback on communication effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RC.CO-04',
    name: 'Public Recovery Communication',
    description:
      'Public updates on incident recovery are shared using approved methods and messaging.',
    category: 'Recover - Recovery Communication',
    implementationGuidance:
      'Develop and maintain procedures for public communication about incident recovery including media statements, customer notifications, and website updates. Ensure all public communications are reviewed and approved by legal, communications, and executive leadership before release. Maintain consistent messaging across all channels. Prepare holding statements for rapid deployment.',
    evidenceRequirements: [
      'Public communication procedures and approval workflows',
      'Pre-approved communication templates and holding statements',
      'Public communication review and approval records',
      'Media and customer notification records from past incidents',
    ],
    testProcedures: [
      'Review public communication procedures and approval workflows',
      'Verify pre-approved templates and holding statements exist',
      'Confirm communications undergo legal and executive review',
      'Assess public communication records from past incidents for consistency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RC.CO-05',
    name: 'Stakeholder Recovery Feedback',
    description:
      'Feedback from stakeholders on recovery effectiveness is collected and incorporated into recovery plan improvements.',
    category: 'Recover - Recovery Communication',
    implementationGuidance:
      'Establish mechanisms to collect feedback from internal and external stakeholders on recovery effectiveness. Conduct post-recovery surveys and debriefs. Analyze feedback to identify areas for improvement in recovery processes, communication, and coordination. Incorporate feedback into recovery plan updates.',
    evidenceRequirements: [
      'Stakeholder feedback collection mechanisms and surveys',
      'Post-recovery debrief records',
      'Feedback analysis and improvement recommendations',
      'Recovery plan updates based on stakeholder feedback',
    ],
    testProcedures: [
      'Review stakeholder feedback collection mechanisms',
      'Verify post-recovery debriefs are conducted',
      'Confirm feedback analysis leads to improvement recommendations',
      'Assess recovery plan updates incorporate stakeholder feedback',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RC.CO-06',
    name: 'Regulatory Recovery Reporting',
    description:
      'Recovery activities and outcomes are reported to regulators and oversight bodies as required.',
    category: 'Recover - Recovery Communication',
    implementationGuidance:
      'Maintain awareness of regulatory reporting requirements related to incident recovery. Prepare and submit required reports to regulators, industry oversight bodies, and government agencies. Ensure reports meet content, format, and timing requirements. Track regulatory inquiries and responses related to recovery activities.',
    evidenceRequirements: [
      'Regulatory recovery reporting requirements inventory',
      'Regulatory report templates and submission records',
      'Correspondence with regulators regarding recovery activities',
      'Tracking of regulatory inquiries and responses',
    ],
    testProcedures: [
      'Review regulatory reporting requirements inventory',
      'Verify regulatory reports are submitted as required',
      'Confirm correspondence with regulators is maintained',
      'Assess tracking of regulatory inquiries and response timeliness',
    ],
    status: 'Not Started',
  },

  // --- GV.PO: Policy ---
  {
    controlId: 'GV.PO-03',
    name: 'Policy Communication and Training',
    description:
      'Cybersecurity policies are communicated to all personnel and training is provided to ensure understanding and compliance.',
    category: 'Govern - Policy',
    implementationGuidance:
      'Develop comprehensive communication and training programs for cybersecurity policies. Ensure all personnel understand their policy obligations. Conduct regular training updates when policies change. Track training completion and comprehension. Provide role-specific policy training for personnel with elevated responsibilities.',
    evidenceRequirements: [
      'Policy communication records and distribution lists',
      'Training materials for cybersecurity policies',
      'Training completion and comprehension records',
      'Role-specific policy training documentation',
    ],
    testProcedures: [
      'Review policy communication and distribution records',
      'Verify training materials cover all key policies',
      'Confirm training completion tracking is maintained',
      'Assess role-specific training for personnel with elevated access',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.PO-04',
    name: 'Policy Exception Management',
    description:
      'Policy exceptions are documented, approved, monitored, and reviewed for continued necessity.',
    category: 'Govern - Policy',
    implementationGuidance:
      'Establish formal process for requesting, approving, and tracking policy exceptions. Document business justification and compensating controls for each exception. Set expiration dates and conduct periodic reviews. Ensure exceptions are approved by appropriate authority levels. Monitor exception usage and remediate when possible.',
    evidenceRequirements: [
      'Policy exception request and approval process documentation',
      'Exception records with business justification',
      'Compensating control documentation for exceptions',
      'Exception review and renewal records',
    ],
    testProcedures: [
      'Review policy exception process documentation',
      'Verify exception records include business justification',
      'Confirm compensating controls are documented and effective',
      'Assess exception review and renewal compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.RM-08',
    name: 'Risk Treatment Tracking',
    description:
      'Risk treatment decisions and actions are tracked through implementation and verified for effectiveness.',
    category: 'Govern - Risk Management Strategy',
    implementationGuidance:
      'Implement system to track risk treatment decisions from approval through implementation. Monitor treatment action progress and completion. Verify treatment effectiveness through testing and measurement. Document residual risk after treatment. Escalate delayed or ineffective treatments.',
    evidenceRequirements: [
      'Risk treatment tracking system and reports',
      'Treatment action progress and completion records',
      'Treatment effectiveness verification records',
      'Residual risk documentation after treatment',
    ],
    testProcedures: [
      'Review risk treatment tracking system capabilities',
      'Verify treatment actions are tracked to completion',
      'Confirm treatment effectiveness is verified',
      'Assess residual risk documentation accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.SC-09',
    name: 'Supply Chain Security Metrics',
    description:
      'Metrics are established to measure and monitor supply chain cybersecurity risk management effectiveness.',
    category: 'Govern - Supply Chain Risk Management',
    implementationGuidance:
      'Define key performance indicators for supply chain security including vendor assessment completion rates, security incident frequency, compliance status, and risk reduction trends. Collect and analyze metrics regularly. Report metrics to leadership and use for program improvement.',
    evidenceRequirements: [
      'Supply chain security metrics definitions',
      'Metrics collection and analysis records',
      'Metrics reporting to leadership',
      'Program improvements based on metrics analysis',
    ],
    testProcedures: [
      'Review supply chain security metrics definitions',
      'Verify metrics are collected and analyzed regularly',
      'Confirm metrics are reported to leadership',
      'Assess program improvements driven by metrics',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GV.SC-10',
    name: 'Critical Supplier Continuity',
    description:
      'Business continuity requirements are established and verified for critical suppliers and service providers.',
    category: 'Govern - Supply Chain Risk Management',
    implementationGuidance:
      'Identify critical suppliers and service providers essential to business operations. Define business continuity requirements for critical suppliers including RTOs and RPOs. Verify supplier continuity capabilities through documentation review and testing. Develop contingency plans for critical supplier failures.',
    evidenceRequirements: [
      'Critical supplier identification and classification',
      'Business continuity requirements for critical suppliers',
      'Supplier continuity capability verification records',
      'Contingency plans for critical supplier failures',
    ],
    testProcedures: [
      'Review critical supplier identification criteria',
      'Verify continuity requirements are defined for critical suppliers',
      'Confirm supplier continuity capabilities are verified',
      'Assess contingency plans for critical supplier scenarios',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PR.AT-03',
    name: 'Privileged User Security Training',
    description:
      'Users with privileged access receive enhanced security training commensurate with their access level and responsibilities.',
    category: 'Protect - Awareness and Training',
    implementationGuidance:
      'Develop enhanced security training program for privileged users including administrators, developers, and security personnel. Cover advanced threats, secure practices, and responsibilities specific to privileged access. Conduct training more frequently than general awareness. Verify comprehension through testing.',
    evidenceRequirements: [
      'Privileged user training curriculum and materials',
      'Training completion records for privileged users',
      'Training frequency and scheduling documentation',
      'Comprehension testing results for privileged users',
    ],
    testProcedures: [
      'Review privileged user training curriculum',
      'Verify training completion for all privileged users',
      'Confirm training frequency meets requirements',
      'Assess comprehension testing results',
    ],
    status: 'Not Started',
  },
];
