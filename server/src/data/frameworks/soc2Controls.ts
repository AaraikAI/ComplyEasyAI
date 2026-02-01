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

export const SOC2_CONTROLS: FrameworkControlTemplate[] = [
  // ===== CC1: Control Environment (CC1.1 - CC1.5) =====
  {
    controlId: 'CC1.1',
    name: 'COSO Principle 1: Demonstrates Commitment to Integrity and Ethical Values',
    description:
      'The entity demonstrates a commitment to integrity and ethical values. Management and the board of directors establish standards of conduct and evaluate adherence to those standards. Deviations are identified and remediated in a timely manner.',
    category: 'Control Environment',
    implementationGuidance:
      'Establish a formal code of conduct and ethics policy that is communicated to all personnel. Implement a process for employees to report ethical concerns or violations confidentially. Conduct annual ethics training and require acknowledgment from all staff.',
    evidenceRequirements: [
      'Signed code of conduct acknowledgments from all employees',
      'Ethics training completion records and attendance logs',
      'Whistleblower or ethics hotline activity reports',
      'Board meeting minutes documenting ethics oversight discussions',
    ],
    testProcedures: [
      'Inspect the code of conduct policy for completeness and review distribution records to confirm all employees received and acknowledged it',
      'Interview a sample of employees to verify awareness of ethical reporting channels and expectations',
      'Review ethics violation logs and confirm that reported incidents were investigated and resolved in accordance with policy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC1.2',
    name: 'COSO Principle 2: Board Exercises Oversight Responsibility',
    description:
      'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal controls. The board retains oversight responsibility for management actions and holds them accountable for their responsibilities.',
    category: 'Control Environment',
    implementationGuidance:
      'Establish an independent audit committee with a formal charter outlining oversight responsibilities. Schedule regular board meetings to review risk management activities and internal control effectiveness. Ensure board members have relevant expertise and receive periodic training on governance topics.',
    evidenceRequirements: [
      'Board and audit committee charters with defined roles and responsibilities',
      'Board meeting minutes and attendance records for the review period',
      'Evidence of board independence assessments and conflict-of-interest disclosures',
      'Reports presented to the board on internal control effectiveness',
    ],
    testProcedures: [
      'Inspect the audit committee charter and verify it defines oversight responsibilities for internal controls and risk management',
      'Review board meeting minutes for evidence that internal control matters and management performance were discussed regularly',
      'Confirm that board composition meets independence requirements through conflict-of-interest disclosures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC1.3',
    name: 'COSO Principle 3: Establishes Structure, Authority, and Responsibility',
    description:
      'Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities in pursuit of objectives. Organizational design supports effective internal control and accountability across the entity.',
    category: 'Control Environment',
    implementationGuidance:
      'Define and document the organizational structure including clear reporting lines, roles, and responsibilities. Implement a RACI matrix for key processes and ensure delegations of authority are formally documented. Review the organizational structure periodically to ensure it remains aligned with business objectives.',
    evidenceRequirements: [
      'Organizational charts showing reporting lines and departmental structure',
      'Job descriptions and role definitions for key personnel',
      'Delegation of authority matrices and approval hierarchies',
      'RACI charts for critical business processes and IT functions',
    ],
    testProcedures: [
      'Inspect the organizational chart and verify that reporting lines are clearly defined and segregation of duties is maintained',
      'Select a sample of key roles and confirm that documented job descriptions accurately reflect assigned authorities and responsibilities',
      'Review delegation of authority records to verify that approval limits are appropriately assigned and enforced',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC1.4',
    name: 'COSO Principle 4: Demonstrates Commitment to Competence',
    description:
      'The entity demonstrates a commitment to attract, develop, and retain competent individuals in alignment with objectives. Competency standards are defined for key roles and personnel receive adequate training and professional development opportunities.',
    category: 'Control Environment',
    implementationGuidance:
      'Define competency requirements for each role and incorporate them into hiring and performance evaluation processes. Establish ongoing training programs, including role-specific technical training and security awareness training. Track certifications and professional development activities for staff in critical positions.',
    evidenceRequirements: [
      'Competency requirements documented in job descriptions and hiring criteria',
      'Training plans and completion records for employees in key roles',
      'Performance review records demonstrating evaluation of competency',
      'Certification tracking and professional development logs',
    ],
    testProcedures: [
      'Review hiring records for a sample of recent hires to verify competency requirements were evaluated during the selection process',
      'Inspect training records and confirm employees in key roles completed required training within defined timeframes',
      'Review performance evaluations for evidence that competency and skill development were assessed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC1.5',
    name: 'COSO Principle 5: Enforces Accountability',
    description:
      'The entity holds individuals accountable for their internal control responsibilities in pursuit of objectives. Performance measures, incentives, and other mechanisms are established to reinforce accountability at all levels of the organization.',
    category: 'Control Environment',
    implementationGuidance:
      'Integrate internal control responsibilities into performance objectives and evaluation criteria. Establish consequences for non-compliance with policies and procedures and communicate them clearly to all staff. Implement regular reporting mechanisms to track and communicate control performance metrics to management.',
    evidenceRequirements: [
      'Performance evaluation templates that include internal control responsibilities',
      'Disciplinary action records related to policy or control violations',
      'Management reports tracking control performance and accountability metrics',
      'Evidence of incentive structures tied to compliance and control objectives',
    ],
    testProcedures: [
      'Review a sample of performance evaluations to confirm that internal control responsibilities are included and assessed',
      'Inspect disciplinary action records to verify that policy violations were addressed consistently and in accordance with policy',
      'Interview management to confirm that accountability mechanisms are actively enforced and communicated to staff',
    ],
    status: 'Not Started',
  },

  // ===== CC2: Communication and Information (CC2.1 - CC2.3) =====
  {
    controlId: 'CC2.1',
    name: 'COSO Principle 13: Uses Relevant Information',
    description:
      'The entity obtains or generates and uses relevant, quality information to support the functioning of internal controls. Information systems produce data that is timely, current, accurate, and accessible to support decision-making and control activities.',
    category: 'Communication and Information',
    implementationGuidance:
      'Identify the information requirements for each internal control activity and ensure supporting systems capture and process data accurately. Implement data quality controls including input validation, reconciliation, and integrity checks. Establish data governance policies that define data ownership, quality standards, and retention requirements.',
    evidenceRequirements: [
      'Data governance policies and data quality standards documentation',
      'System-generated reports demonstrating data accuracy and completeness checks',
      'Data flow diagrams showing information sources and processing for key controls',
      'Records of data quality reviews and exception handling',
    ],
    testProcedures: [
      'Review data governance policies and verify that information quality requirements are defined for critical control activities',
      'Inspect system configurations and validate that data input controls and integrity checks are in place and functioning',
      'Test a sample of reports used in control activities to confirm data accuracy and completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC2.2',
    name: 'COSO Principle 14: Communicates Internally',
    description:
      'The entity internally communicates information, including objectives and responsibilities for internal control, necessary to support the functioning of internal controls. Internal communication channels ensure personnel understand their roles and the importance of control activities.',
    category: 'Communication and Information',
    implementationGuidance:
      'Establish formal internal communication channels such as policy portals, newsletters, and regular team meetings to disseminate control-related information. Implement a policy management system to ensure employees have access to current policies and procedures. Conduct periodic town halls and departmental briefings to communicate changes in objectives, risks, or control requirements.',
    evidenceRequirements: [
      'Internal communication records such as policy distribution logs and meeting minutes',
      'Policy management system access logs showing employee engagement',
      'Security awareness and policy update communications sent to staff',
      'Evidence of regular management briefings on internal control topics',
    ],
    testProcedures: [
      'Review internal communication records to verify that control responsibilities and policy updates are regularly disseminated to personnel',
      'Interview a sample of employees across departments to confirm awareness of their internal control responsibilities',
      'Inspect the policy management system to verify that current policies are accessible and employees acknowledge review',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC2.3',
    name: 'COSO Principle 15: Communicates Externally',
    description:
      'The entity communicates with external parties regarding matters affecting the functioning of internal controls. This includes communication with customers, vendors, regulators, and other stakeholders about policies, commitments, and changes that may affect them.',
    category: 'Communication and Information',
    implementationGuidance:
      'Establish formal external communication processes including customer notification procedures, regulatory reporting mechanisms, and vendor communication protocols. Maintain a public-facing trust center or system description document that outlines the entity\'s controls and commitments. Implement processes to receive and respond to external inquiries, complaints, and security disclosures.',
    evidenceRequirements: [
      'External communication policies and procedures documentation',
      'Customer and vendor notification records for material changes',
      'Regulatory filing and reporting records',
      'Trust center or system description publications and update history',
    ],
    testProcedures: [
      'Review external communication policies and confirm they address notification requirements for customers, vendors, and regulators',
      'Inspect records of external communications sent during the period to verify compliance with notification obligations',
      'Verify that the trust center or system description is current and accurately reflects the entity\'s control environment',
    ],
    status: 'Not Started',
  },

  // ===== CC3: Risk Assessment (CC3.1 - CC3.4) =====
  {
    controlId: 'CC3.1',
    name: 'COSO Principle 6: Specifies Suitable Objectives',
    description:
      'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to objectives. Objectives are aligned with the entity\'s mission, regulatory requirements, and stakeholder expectations.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Document clear, measurable objectives for security, availability, processing integrity, confidentiality, and privacy that align with business strategy. Map each objective to specific trust service criteria and ensure they are reviewed and updated annually. Communicate objectives to relevant stakeholders and incorporate them into risk assessment activities.',
    evidenceRequirements: [
      'Documented organizational and IT objectives aligned to trust service criteria',
      'Annual objective review and approval records from management',
      'Mapping of objectives to specific trust service categories',
      'Evidence of objectives communicated to relevant stakeholders',
    ],
    testProcedures: [
      'Review documented objectives and confirm they are specific, measurable, and aligned to the applicable trust service criteria',
      'Verify that objectives were reviewed and approved by management within the audit period',
      'Trace a sample of objectives to risk assessment activities to confirm they are considered in the risk identification process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC3.2',
    name: 'COSO Principle 7: Identifies and Analyzes Risk',
    description:
      'The entity identifies risks to the achievement of its objectives across the entity and analyzes risks as a basis for determining how the risks should be managed. Risk identification considers internal and external factors including technology changes, regulatory changes, and emerging threats.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Conduct formal risk assessments at least annually, covering operational, IT, security, and compliance risks. Use a standardized risk assessment methodology that includes risk identification, likelihood and impact analysis, and risk scoring. Maintain a risk register that documents identified risks, risk owners, and planned treatments.',
    evidenceRequirements: [
      'Risk assessment methodology documentation and scoring criteria',
      'Completed risk assessment reports from the audit period',
      'Risk register with identified risks, risk ratings, and assigned owners',
      'Evidence of risk assessment inputs including threat intelligence and vulnerability data',
    ],
    testProcedures: [
      'Inspect the risk assessment methodology and verify it addresses likelihood, impact, and considers both internal and external risk factors',
      'Review the risk register and confirm that identified risks are rated, assigned to owners, and linked to treatment plans',
      'Interview risk management personnel to confirm that risk assessments are performed at the required frequency and incorporate current threat information',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC3.3',
    name: 'COSO Principle 8: Assesses Fraud Risk',
    description:
      'The entity considers the potential for fraud in assessing risks to the achievement of objectives. Fraud risk assessments evaluate incentives and pressures, opportunities, and attitudes that could lead to fraudulent activities.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Incorporate fraud risk assessment into the overall enterprise risk management process, evaluating fraud risk factors such as management override of controls, unauthorized access, and data manipulation. Implement anti-fraud controls including segregation of duties, access restrictions, and anomaly detection. Establish a fraud response plan and communicate anti-fraud policies to all employees.',
    evidenceRequirements: [
      'Fraud risk assessment documentation identifying key fraud risk factors',
      'Anti-fraud policy and procedures including the fraud response plan',
      'Evidence of fraud awareness training provided to employees',
      'Segregation of duties analysis for key financial and IT processes',
    ],
    testProcedures: [
      'Review the fraud risk assessment and verify that it addresses the fraud triangle elements of incentive, opportunity, and rationalization',
      'Inspect anti-fraud controls such as segregation of duties and access restrictions to confirm they are implemented and operating effectively',
      'Verify that fraud awareness training was completed by personnel in high-risk roles during the audit period',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC3.4',
    name: 'COSO Principle 9: Identifies and Analyzes Significant Change',
    description:
      'The entity identifies and assesses changes that could significantly impact the system of internal control. This includes changes in the external environment, business model, technology infrastructure, and regulatory landscape.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Implement a formal change impact assessment process that evaluates how significant changes to the business, technology, or regulatory environment affect internal controls. Establish triggers and thresholds that require re-evaluation of the risk assessment when significant changes occur. Document change impact analyses and update the risk register accordingly.',
    evidenceRequirements: [
      'Change impact assessment procedures and criteria for significant changes',
      'Completed change impact assessments from the audit period',
      'Updated risk register entries reflecting identified significant changes',
      'Management meeting minutes discussing significant change events',
    ],
    testProcedures: [
      'Review the change impact assessment process and confirm that criteria for identifying significant changes are defined and appropriate',
      'Inspect a sample of significant changes that occurred during the period and verify that impact assessments were completed',
      'Confirm that the risk register was updated to reflect risks arising from significant changes identified during the period',
    ],
    status: 'Not Started',
  },

  // ===== CC4: Monitoring Activities (CC4.1 - CC4.2) =====
  {
    controlId: 'CC4.1',
    name: 'COSO Principle 16: Selects, Develops, and Performs Ongoing and/or Separate Evaluations',
    description:
      'The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning. Monitoring activities provide assurance that controls continue to operate effectively over time.',
    category: 'Monitoring Activities',
    implementationGuidance:
      'Establish a continuous monitoring program that includes automated control monitoring, periodic internal audits, and management reviews. Define key performance indicators and control metrics that are tracked and reported on a regular basis. Implement automated alerting for control failures or deviations and ensure timely investigation and resolution.',
    evidenceRequirements: [
      'Continuous monitoring program documentation and monitoring schedule',
      'Internal audit plans and completed audit reports from the review period',
      'Control monitoring dashboards and KPI reports',
      'Automated alert configurations and alert response records',
    ],
    testProcedures: [
      'Review the monitoring program documentation and verify that it includes both ongoing monitoring activities and periodic separate evaluations',
      'Inspect internal audit reports and confirm that control assessments were completed according to the defined schedule',
      'Review a sample of automated monitoring alerts and verify that they were investigated and resolved in a timely manner',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC4.2',
    name: 'COSO Principle 17: Evaluates and Communicates Deficiencies',
    description:
      'The entity evaluates and communicates internal control deficiencies in a timely manner to those parties responsible for taking corrective action, including senior management and the board of directors as appropriate. Deficiency tracking ensures identified issues are remediated.',
    category: 'Monitoring Activities',
    implementationGuidance:
      'Implement a formal process for documenting, evaluating, and tracking internal control deficiencies from identification through remediation. Establish severity classifications for deficiencies and define escalation procedures based on severity. Report deficiency status to management and the board on a regular basis and track remediation progress against defined timelines.',
    evidenceRequirements: [
      'Deficiency management policy and severity classification criteria',
      'Deficiency tracking log with remediation status and timelines',
      'Management and board reports on internal control deficiency status',
      'Evidence of corrective action plans and completion verification',
    ],
    testProcedures: [
      'Review the deficiency management process and confirm that severity classifications and escalation procedures are defined',
      'Inspect the deficiency tracking log and verify that identified deficiencies have assigned owners, remediation plans, and target dates',
      'Confirm that deficiency status reports were provided to management and the board at the required frequency during the audit period',
    ],
    status: 'Not Started',
  },

  // ===== CC5: Control Activities (CC5.1 - CC5.3) =====
  {
    controlId: 'CC5.1',
    name: 'COSO Principle 10: Selects and Develops Control Activities',
    description:
      'The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels. Control activities are designed based on the results of risk assessments and tailored to the specific risks they address.',
    category: 'Control Activities',
    implementationGuidance:
      'Map control activities to identified risks in the risk register to ensure comprehensive risk coverage. Design controls with a mix of preventive and detective mechanisms, and document the control objectives, procedures, and expected outputs. Perform a control design assessment to verify that each control adequately addresses its target risk.',
    evidenceRequirements: [
      'Risk-to-control mapping documentation showing controls aligned to identified risks',
      'Control design documentation including objectives, procedures, and frequency',
      'Control design effectiveness assessments and gap analyses',
      'Evidence of management approval for control design decisions',
    ],
    testProcedures: [
      'Review the risk-to-control mapping and verify that each significant risk has at least one associated control activity',
      'Inspect control design documentation for a sample of controls and confirm that control objectives and procedures are clearly defined',
      'Evaluate the design of selected controls to assess whether they would effectively mitigate the associated risks if operating as intended',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC5.2',
    name: 'COSO Principle 11: Selects and Develops General Controls over Technology',
    description:
      'The entity selects and develops general control activities over technology to support the achievement of objectives. Technology general controls include controls over IT infrastructure, security management, and technology acquisition and development.',
    category: 'Control Activities',
    implementationGuidance:
      'Implement IT general controls covering access management, change management, IT operations, and system development lifecycle. Establish baseline security configurations for all technology components and monitor compliance with those baselines. Document ITGC procedures and ensure they are integrated with business process controls for end-to-end coverage.',
    evidenceRequirements: [
      'IT general controls framework documentation and control catalog',
      'Baseline security configuration standards for servers, databases, and network devices',
      'ITGC operating procedures for access management, change management, and IT operations',
      'ITGC testing results and compliance reports from the audit period',
    ],
    testProcedures: [
      'Review the ITGC framework and verify that it addresses access management, change management, IT operations, and system development',
      'Inspect baseline security configurations for a sample of technology components and confirm compliance with documented standards',
      'Test a sample of ITGC operating procedures to verify they are functioning effectively during the audit period',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC5.3',
    name: 'COSO Principle 12: Deploys Through Policies and Procedures',
    description:
      'The entity deploys control activities through policies that establish what is expected and procedures that put policies into action. Policies and procedures are documented, communicated to personnel, and updated as necessary to reflect changes.',
    category: 'Control Activities',
    implementationGuidance:
      'Maintain a comprehensive policy framework that includes information security, acceptable use, data protection, and operational policies. Implement a policy lifecycle management process that includes drafting, review, approval, distribution, and periodic updates. Ensure all policies have associated operational procedures that provide step-by-step guidance for implementation.',
    evidenceRequirements: [
      'Policy inventory listing all active policies with version history and review dates',
      'Policy approval and distribution records',
      'Operational procedures aligned to each policy area',
      'Employee acknowledgment records confirming policy awareness',
    ],
    testProcedures: [
      'Review the policy inventory and confirm that policies cover all required control areas and have been reviewed within the defined review cycle',
      'Inspect policy distribution and acknowledgment records for a sample of employees to verify awareness',
      'Select a sample of policies and verify that corresponding operational procedures exist and are consistent with the policy requirements',
    ],
    status: 'Not Started',
  },

  // ===== CC6: Logical and Physical Access Controls (CC6.1 - CC6.8) =====
  {
    controlId: 'CC6.1',
    name: 'Logical Access Security Software, Infrastructure, and Architectures',
    description:
      'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events. This includes implementation of access control systems, network security architectures, and authentication mechanisms.',
    category: 'Logical and Physical Access',
    implementationGuidance:
      'Deploy enterprise access control solutions including identity and access management platforms, multi-factor authentication, and network segmentation. Implement defense-in-depth architecture with firewalls, intrusion detection systems, and endpoint protection. Maintain an inventory of all access control systems and ensure they are configured according to security baselines.',
    evidenceRequirements: [
      'Network architecture diagrams showing security zones and access control points',
      'Identity and access management system configuration documentation',
      'Multi-factor authentication deployment records and coverage reports',
      'Firewall and network segmentation rule sets and review records',
    ],
    testProcedures: [
      'Review network architecture diagrams and verify that security zones and access control points are appropriately designed and documented',
      'Inspect IAM system configurations and verify that authentication requirements meet defined security standards including MFA enforcement',
      'Test a sample of firewall rules to confirm they are consistent with documented network access policies',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC6.2',
    name: 'User Access Registration and Authorization',
    description:
      'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users. The registration and authorization process includes formal access request and approval workflows based on the principle of least privilege.',
    category: 'Logical and Physical Access',
    implementationGuidance:
      'Implement a formal access provisioning process that requires documented requests, manager approval, and role-based access assignment. Ensure all access grants follow the principle of least privilege and are based on job function requirements. Maintain records of all access provisioning activities for audit purposes.',
    evidenceRequirements: [
      'Access provisioning policy and procedures documentation',
      'Access request and approval records for new users provisioned during the period',
      'Role-based access control matrix defining access levels by job function',
      'Evidence of access grants reviewed and approved by authorized personnel',
    ],
    testProcedures: [
      'Review the access provisioning process and verify that it requires formal requests, appropriate approvals, and role-based access assignment',
      'Select a sample of new user accounts provisioned during the period and verify that access requests were properly approved before access was granted',
      'Inspect the RBAC matrix and confirm that access levels are aligned with job functions and the principle of least privilege',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC6.3',
    name: 'Role-Based Access and Least Privilege',
    description:
      'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design and changes. Access rights are reviewed and updated as personnel roles change.',
    category: 'Logical and Physical Access',
    implementationGuidance:
      'Implement role-based access control with defined access profiles for each job function. Establish processes for modifying access when employees change roles and for promptly revoking access upon termination. Conduct periodic access reviews to identify and remediate excessive or inappropriate access rights.',
    evidenceRequirements: [
      'Role-based access control definitions and access profiles',
      'Access modification and revocation records for role changes and terminations',
      'Periodic access review reports and remediation actions taken',
      'Terminated user access revocation evidence and timeliness metrics',
    ],
    testProcedures: [
      'Review access modification records for a sample of role changes and verify that access was updated to reflect new responsibilities',
      'Select a sample of terminated employees and verify that access was revoked within the required timeframe',
      'Inspect the most recent periodic access review and confirm that inappropriate access identified was remediated',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC6.4',
    name: 'Physical Access Restrictions',
    description:
      'The entity restricts physical access to facilities and protected information assets to authorized personnel. Physical security controls include access badges, biometric systems, visitor management, and environmental controls for sensitive areas such as data centers.',
    category: 'Logical and Physical Access',
    implementationGuidance:
      'Implement physical access controls for all facilities including badge access systems, visitor management procedures, and surveillance cameras. Apply enhanced physical security measures for sensitive areas such as data centers and server rooms, including biometric authentication and mantrap entries. Conduct regular physical access reviews and maintain access logs.',
    evidenceRequirements: [
      'Physical access control policy and procedures documentation',
      'Physical access badge assignment and revocation records',
      'Visitor management logs and escort procedures documentation',
      'Data center physical access logs and surveillance monitoring records',
    ],
    testProcedures: [
      'Inspect physical access controls at key facilities and verify that badge access systems are operational and configured to restrict unauthorized entry',
      'Review visitor management logs and confirm that visitors were properly registered and escorted during the audit period',
      'Select a sample of physical access revocations for terminated employees and verify badges were deactivated promptly',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC6.5',
    name: 'Logical Access Deprovisioning',
    description:
      'The entity discontinues logical and physical access to protected assets when access is no longer needed, such as upon employee termination, role change, or contract completion. Deprovisioning processes are timely and comprehensive across all systems.',
    category: 'Logical and Physical Access',
    implementationGuidance:
      'Establish formal deprovisioning procedures that are triggered by HR termination notifications and role change events. Implement automated workflows where possible to disable accounts across all systems upon termination. Conduct periodic reconciliation between HR records and active system accounts to identify orphaned accounts.',
    evidenceRequirements: [
      'Access deprovisioning policy with defined timelines and procedures',
      'Termination and role change access removal records with timestamps',
      'HR-to-IT notification workflow documentation and evidence of operation',
      'Periodic reconciliation reports comparing HR records to active system accounts',
    ],
    testProcedures: [
      'Select a sample of terminated employees and verify that logical access was removed across all systems within the required timeframe',
      'Review the HR-to-IT notification process and confirm that termination events trigger timely access removal workflows',
      'Inspect the most recent account reconciliation report and confirm that orphaned accounts were identified and remediated',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC6.6',
    name: 'System Boundary and Threat Protection',
    description:
      'The entity implements logical access security measures to protect against threats from sources outside its system boundaries. Boundary protection mechanisms include firewalls, web application firewalls, DDoS protection, and intrusion prevention systems.',
    category: 'Logical and Physical Access',
    implementationGuidance:
      'Deploy layered boundary protection including next-generation firewalls, web application firewalls, and intrusion prevention systems at all network entry points. Implement DDoS mitigation services and content delivery networks to protect internet-facing services. Regularly test boundary defenses through penetration testing and vulnerability scanning.',
    evidenceRequirements: [
      'Network boundary protection architecture documentation',
      'Firewall and IPS rule sets with change history and review records',
      'Penetration testing reports and remediation evidence',
      'DDoS protection and WAF configuration documentation',
    ],
    testProcedures: [
      'Review boundary protection architecture and verify that layered defenses are implemented at all network entry points',
      'Inspect the most recent penetration test report and confirm that identified vulnerabilities were remediated within defined timelines',
      'Review firewall and IPS logs to verify that external threats are being detected and blocked effectively',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC6.7',
    name: 'Data Transmission, Movement, and Removal Restrictions',
    description:
      'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes, and protects it during transmission, movement, or removal to meet the entity\'s objectives. Encryption and data loss prevention controls are applied.',
    category: 'Logical and Physical Access',
    implementationGuidance:
      'Implement encryption for all data in transit using TLS 1.2 or higher and enforce encryption standards for data at rest on servers and endpoints. Deploy data loss prevention tools to monitor and prevent unauthorized data transfers via email, web, and removable media. Establish data classification policies and apply handling requirements based on sensitivity levels.',
    evidenceRequirements: [
      'Data encryption policy and standards documentation',
      'TLS configuration evidence for internet-facing and internal services',
      'Data loss prevention tool configuration and alert reports',
      'Data classification policy and handling procedures',
    ],
    testProcedures: [
      'Inspect TLS configurations for a sample of services and verify that encryption standards meet minimum requirements of TLS 1.2 or higher',
      'Review DLP tool configurations and alert logs to confirm that unauthorized data transmission attempts are detected and blocked',
      'Verify that data at rest encryption is enabled on databases and storage systems containing sensitive information',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC6.8',
    name: 'Unauthorized or Malicious Software Prevention',
    description:
      'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software to meet the entity\'s objectives. Anti-malware, application whitelisting, and endpoint detection and response solutions are deployed.',
    category: 'Logical and Physical Access',
    implementationGuidance:
      'Deploy endpoint detection and response solutions on all workstations and servers with real-time malware scanning capabilities. Implement application whitelisting or software restriction policies to prevent execution of unauthorized software. Ensure anti-malware signatures and endpoint agents are updated automatically and monitor for coverage gaps.',
    evidenceRequirements: [
      'Endpoint protection deployment documentation and coverage reports',
      'Anti-malware and EDR configuration standards and update records',
      'Application whitelisting or software restriction policy documentation',
      'Malware detection and incident response records from the audit period',
    ],
    testProcedures: [
      'Review endpoint protection deployment reports and verify that EDR agents are installed and active on all in-scope endpoints',
      'Inspect anti-malware update logs to confirm that signature updates are applied within defined timeframes',
      'Review malware detection alerts from the audit period and confirm that incidents were investigated and resolved according to the incident response process',
    ],
    status: 'Not Started',
  },

  // ===== CC7: System Operations (CC7.1 - CC7.5) =====
  {
    controlId: 'CC7.1',
    name: 'Vulnerability Management and Monitoring',
    description:
      'The entity uses detection and monitoring procedures to identify changes to configurations that result in the introduction of new vulnerabilities, and susceptibilities to newly discovered vulnerabilities. Vulnerability scanning and patch management programs are maintained.',
    category: 'System Operations',
    implementationGuidance:
      'Implement a comprehensive vulnerability management program that includes regular vulnerability scanning of all systems, prioritized remediation based on risk, and tracking through resolution. Subscribe to vendor security advisories and threat intelligence feeds to stay informed of new vulnerabilities. Establish patching timelines based on vulnerability severity and track compliance with patching SLAs.',
    evidenceRequirements: [
      'Vulnerability management policy and procedures documentation',
      'Vulnerability scan reports and trending data from the audit period',
      'Patch management records with remediation timelines and SLA compliance',
      'Threat intelligence subscription and advisory review records',
    ],
    testProcedures: [
      'Review vulnerability scan reports and confirm that scanning is performed at the required frequency across all in-scope systems',
      'Select a sample of critical and high vulnerabilities identified and verify they were remediated within the defined SLA timelines',
      'Inspect patch management records and confirm that patches are applied according to the defined patching schedule',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC7.2',
    name: 'Security Event Monitoring and Anomaly Detection',
    description:
      'The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity\'s ability to meet its objectives. Security information and event management systems are used to detect threats.',
    category: 'System Operations',
    implementationGuidance:
      'Deploy a SIEM solution to aggregate and correlate security events from all critical systems, network devices, and security tools. Define detection rules and use cases that align with common attack patterns and the MITRE ATT&CK framework. Establish 24/7 monitoring capabilities either through an internal SOC or managed security service provider.',
    evidenceRequirements: [
      'SIEM architecture documentation and log source inventory',
      'Detection rule catalog and use case documentation',
      'Security monitoring procedures and escalation criteria',
      'SOC or MSSP operational reports and SLA compliance metrics',
    ],
    testProcedures: [
      'Review the SIEM log source inventory and verify that all critical systems and security tools are sending logs to the SIEM',
      'Inspect detection rules and confirm they cover common attack patterns and are regularly updated',
      'Review a sample of security alerts generated during the period and verify that they were triaged and escalated according to defined procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC7.3',
    name: 'Security Incident Evaluation and Classification',
    description:
      'The entity evaluates security events to determine whether they constitute security incidents, including an assessment of the nature and scope of the event, and the potential impact on the entity\'s operations and stakeholders.',
    category: 'System Operations',
    implementationGuidance:
      'Develop a security event triage process with clear criteria for classifying events as incidents based on severity, scope, and impact. Implement an incident classification scheme with defined severity levels and corresponding response procedures. Train security operations personnel on event evaluation procedures and escalation criteria.',
    evidenceRequirements: [
      'Incident classification and severity criteria documentation',
      'Security event triage procedures and decision trees',
      'Incident classification records from the audit period',
      'Security analyst training records on incident evaluation procedures',
    ],
    testProcedures: [
      'Review the incident classification criteria and confirm that severity levels are clearly defined with corresponding response requirements',
      'Select a sample of security events from the period and verify that they were properly evaluated and classified according to the defined criteria',
      'Interview security operations personnel to confirm understanding of event evaluation and escalation procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC7.4',
    name: 'Security Incident Response',
    description:
      'The entity responds to identified security incidents by executing a defined incident response program to understand, contain, remediate, and communicate security incidents. The incident response program is tested and updated regularly to maintain effectiveness.',
    category: 'System Operations',
    implementationGuidance:
      'Maintain a comprehensive incident response plan that defines roles, responsibilities, communication procedures, and escalation paths. Conduct incident response tabletop exercises and simulations at least annually to test the plan\'s effectiveness. Establish relationships with external incident response resources, legal counsel, and law enforcement as needed.',
    evidenceRequirements: [
      'Incident response plan documentation with roles, procedures, and communication templates',
      'Incident response tabletop exercise or simulation reports',
      'Incident response records documenting containment, remediation, and communication activities',
      'Post-incident review reports and lessons learned documentation',
    ],
    testProcedures: [
      'Review the incident response plan and verify that it defines roles, escalation procedures, and communication requirements for different incident types',
      'Inspect records of incident response exercises conducted during the period and confirm that lessons learned were documented and incorporated',
      'Select a sample of security incidents from the period and verify that response activities followed the defined incident response procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC7.5',
    name: 'Incident Recovery and Lessons Learned',
    description:
      'The entity identifies, develops, and implements activities to recover from identified security incidents. Recovery includes restoring affected systems and data, conducting root cause analysis, and implementing corrective actions to prevent recurrence.',
    category: 'System Operations',
    implementationGuidance:
      'Define recovery procedures for various incident scenarios including system restoration, data recovery, and service failover. Conduct formal root cause analysis for all significant incidents and develop corrective action plans. Implement a lessons learned process to feed incident findings back into risk assessments, control improvements, and training programs.',
    evidenceRequirements: [
      'Incident recovery procedures and runbooks for key systems',
      'Root cause analysis reports for significant incidents during the period',
      'Corrective action plans with assigned owners and completion timelines',
      'Lessons learned documentation and evidence of control improvements implemented',
    ],
    testProcedures: [
      'Review recovery procedures and verify they cover key incident scenarios and include defined RTOs and RPOs for critical systems',
      'Inspect root cause analysis reports for significant incidents and confirm that corrective actions were identified and tracked',
      'Verify that lessons learned from incidents were incorporated into updated procedures, training materials, or control enhancements',
    ],
    status: 'Not Started',
  },

  // ===== CC8: Change Management (CC8.1) =====
  {
    controlId: 'CC8.1',
    name: 'Change Management Process',
    description:
      'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives. A formal change management process ensures changes are controlled, tested, and approved before deployment.',
    category: 'Change Management',
    implementationGuidance:
      'Implement a formal change management process that requires change requests, impact assessments, testing, approval, and post-implementation reviews for all changes to production systems. Segregate development, testing, and production environments and enforce controls to prevent unauthorized changes to production. Maintain a change advisory board to review and approve significant changes.',
    evidenceRequirements: [
      'Change management policy and procedures documentation',
      'Change request records with impact assessments, test results, and approvals',
      'Evidence of environment segregation between development, testing, and production',
      'Change advisory board meeting minutes and approval records',
    ],
    testProcedures: [
      'Select a sample of changes deployed to production during the period and verify that each followed the change management process including request, testing, and approval steps',
      'Inspect environment configurations and verify that development, testing, and production environments are properly segregated',
      'Review emergency change records and confirm that they were retroactively reviewed and approved according to the defined process',
    ],
    status: 'Not Started',
  },

  // ===== CC9: Risk Mitigation (CC9.1 - CC9.2) =====
  {
    controlId: 'CC9.1',
    name: 'Risk Mitigation Activities',
    description:
      'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions. Risk mitigation strategies include avoidance, acceptance, reduction, and transfer based on the organization\'s risk appetite and tolerance.',
    category: 'Risk Mitigation',
    implementationGuidance:
      'Develop risk treatment plans for all significant risks identified in the risk assessment, selecting appropriate mitigation strategies based on cost-benefit analysis and risk appetite. Implement business continuity and disaster recovery plans to address risks from potential business disruptions. Review risk mitigation effectiveness periodically and adjust strategies as the risk landscape changes.',
    evidenceRequirements: [
      'Risk treatment plans with selected mitigation strategies for significant risks',
      'Business continuity and disaster recovery plan documentation',
      'Risk acceptance records approved by appropriate management levels',
      'Evidence of periodic risk mitigation effectiveness reviews',
    ],
    testProcedures: [
      'Review risk treatment plans and verify that appropriate mitigation strategies are defined for each significant risk in the risk register',
      'Inspect business continuity and disaster recovery plans and confirm they address critical business processes and systems',
      'Verify that risk acceptance decisions are documented and approved by personnel with appropriate authority',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CC9.2',
    name: 'Vendor and Third-Party Risk Management',
    description:
      'The entity assesses and manages risks associated with vendors and business partners who have access to or process data on behalf of the entity. Third-party risk management includes due diligence, contractual requirements, and ongoing monitoring of vendor compliance.',
    category: 'Risk Mitigation',
    implementationGuidance:
      'Establish a formal vendor risk management program that includes pre-engagement due diligence, risk-based vendor classification, and contractual security requirements. Require vendors to provide SOC 2 reports or equivalent assurance evidence and review them annually. Monitor vendor compliance through periodic assessments and maintain the right to audit vendor operations.',
    evidenceRequirements: [
      'Vendor risk management policy and procedures documentation',
      'Vendor risk assessments and due diligence records',
      'Vendor contracts with security requirements and SLA provisions',
      'Annual vendor SOC report reviews and compliance assessment records',
    ],
    testProcedures: [
      'Review the vendor risk management program and verify that it includes risk-based classification, due diligence procedures, and ongoing monitoring requirements',
      'Select a sample of critical vendors and inspect due diligence records and contractual security requirements',
      'Verify that SOC reports or equivalent assurance evidence was obtained and reviewed for high-risk vendors during the audit period',
    ],
    status: 'Not Started',
  },

  // ===== A1: Availability (A1.1 - A1.3) =====
  {
    controlId: 'A1.1',
    name: 'Availability Commitments and System Performance Monitoring',
    description:
      'The entity maintains, monitors, and evaluates current processing capacity and use of system components to manage capacity demand and to enable the implementation of additional capacity to help meet its availability commitments and system requirements.',
    category: 'Availability',
    implementationGuidance:
      'Implement comprehensive system monitoring to track resource utilization, performance metrics, and capacity trends for all critical infrastructure components. Establish capacity thresholds and alerting to provide early warning when systems approach capacity limits. Develop capacity plans that forecast future requirements based on growth trends and planned business activities.',
    evidenceRequirements: [
      'System monitoring configuration and dashboard documentation',
      'Capacity planning reports and forecasting analyses',
      'Performance monitoring alerts and threshold configuration records',
      'SLA performance reports showing uptime and availability metrics',
    ],
    testProcedures: [
      'Review system monitoring configurations and verify that critical infrastructure components are monitored for performance and capacity',
      'Inspect capacity planning documents and confirm that forecasts are based on current utilization data and growth projections',
      'Review SLA performance reports and verify that availability commitments were met during the audit period',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A1.2',
    name: 'Environmental Protection and Recovery Infrastructure',
    description:
      'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure to meet its availability objectives.',
    category: 'Availability',
    implementationGuidance:
      'Implement environmental controls including redundant power supplies, UPS systems, HVAC monitoring, and fire suppression in data center facilities. Establish automated backup procedures with defined schedules, retention periods, and offsite storage for all critical data. Deploy recovery infrastructure including failover systems, data replication, and geographically diverse redundancy.',
    evidenceRequirements: [
      'Environmental control documentation and monitoring records for data center facilities',
      'Backup configuration records including schedules, retention settings, and offsite storage',
      'Backup completion and integrity verification reports from the audit period',
      'Recovery infrastructure documentation including failover architecture and replication configurations',
    ],
    testProcedures: [
      'Inspect environmental controls at data center facilities and verify that power, cooling, and fire suppression systems are operational and monitored',
      'Review backup completion reports and verify that backups were completed successfully according to the defined schedule',
      'Verify that backup restoration tests were performed during the period and that data integrity was confirmed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A1.3',
    name: 'Business Continuity and Disaster Recovery Testing',
    description:
      'The entity tests recovery plan procedures supporting system recovery to meet its availability objectives. Testing validates that recovery procedures are effective and that recovery time and recovery point objectives can be achieved.',
    category: 'Availability',
    implementationGuidance:
      'Develop and maintain business continuity and disaster recovery plans that define RTO and RPO for critical systems and processes. Conduct DR testing at least annually, including failover testing, backup restoration testing, and communication plan testing. Document test results, identify gaps, and update recovery plans based on lessons learned from testing.',
    evidenceRequirements: [
      'Business continuity and disaster recovery plan documentation with defined RTO and RPO',
      'DR test plans and schedules from the audit period',
      'DR test execution reports with results and identified gaps',
      'Recovery plan update records reflecting changes based on test findings',
    ],
    testProcedures: [
      'Review the BCP/DR plan and verify that RTOs and RPOs are defined for all critical systems and business processes',
      'Inspect DR test reports and confirm that testing was conducted according to the defined schedule and included failover and restoration scenarios',
      'Verify that gaps identified during DR testing were addressed and that recovery plans were updated accordingly',
    ],
    status: 'Not Started',
  },

  // ===== PI1: Processing Integrity (PI1.1 - PI1.5) =====
  {
    controlId: 'PI1.1',
    name: 'Processing Completeness and Accuracy Objectives',
    description:
      'The entity obtains or generates, uses, and communicates relevant, quality information regarding the objectives related to processing, including definitions of data processed and product and service specifications, to support the use of products and services.',
    category: 'Processing Integrity',
    implementationGuidance:
      'Define and document processing integrity objectives including data completeness, accuracy, timeliness, and authorization requirements for all critical processing activities. Establish input, processing, and output controls that validate data meets defined quality criteria at each stage. Communicate processing specifications and quality requirements to all personnel involved in data processing operations.',
    evidenceRequirements: [
      'Processing integrity policy and objectives documentation',
      'Data quality criteria and processing specifications for critical systems',
      'Input validation and processing control configuration documentation',
      'Processing quality reports and exception records',
    ],
    testProcedures: [
      'Review processing integrity objectives and verify they define completeness, accuracy, and timeliness requirements for critical processing activities',
      'Inspect input validation controls for a sample of critical systems and verify they enforce data quality requirements',
      'Review processing exception reports and confirm that data quality issues were identified and resolved',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PI1.2',
    name: 'System Processing Accuracy and Completeness Policies',
    description:
      'The entity implements policies and procedures over system processing to result in products, services, and reporting to meet the entity\'s objectives. Processing controls ensure that transactions are processed completely, accurately, and in a timely manner.',
    category: 'Processing Integrity',
    implementationGuidance:
      'Implement automated processing controls including transaction validation, duplicate detection, sequence checking, and reconciliation. Establish batch processing controls with job scheduling, completion monitoring, and error handling procedures. Define and document processing SLAs and monitor compliance with processing timeliness requirements.',
    evidenceRequirements: [
      'Processing control policies and procedures documentation',
      'Automated processing control configuration records',
      'Batch processing schedules and completion monitoring reports',
      'Processing SLA compliance reports and timeliness metrics',
    ],
    testProcedures: [
      'Review processing control policies and verify they define requirements for transaction validation, reconciliation, and error handling',
      'Inspect automated processing controls for a sample of critical systems and confirm they enforce completeness and accuracy checks',
      'Review processing SLA compliance reports and verify that processing timeliness requirements were met during the audit period',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PI1.3',
    name: 'Processing Integrity Error Identification and Correction',
    description:
      'The entity implements policies and procedures over system processing to identify and address errors and omissions in system processing. Error handling includes detection, logging, notification, and correction of processing errors.',
    category: 'Processing Integrity',
    implementationGuidance:
      'Implement error detection and handling mechanisms that capture, log, and alert on processing errors and exceptions. Establish error correction procedures that include root cause identification, data correction, and reprocessing as needed. Maintain error logs and track error trends to identify systemic issues requiring process improvements.',
    evidenceRequirements: [
      'Error handling policies and procedures documentation',
      'Processing error logs and exception reports from the audit period',
      'Error correction and reprocessing records',
      'Error trend analysis reports and process improvement records',
    ],
    testProcedures: [
      'Review error handling procedures and verify they define requirements for error detection, logging, notification, and correction',
      'Select a sample of processing errors from the period and verify they were detected, logged, and corrected according to defined procedures',
      'Inspect error trend analysis reports and confirm that systemic issues were identified and addressed through process improvements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PI1.4',
    name: 'Processing Input and Output Controls',
    description:
      'The entity implements policies and procedures to make available or deliver output completely, accurately, and timely in accordance with specifications to meet the entity\'s objectives. Input controls validate data before processing and output controls verify results before delivery.',
    category: 'Processing Integrity',
    implementationGuidance:
      'Implement input validation controls that verify data format, range, completeness, and authorization before processing. Establish output reconciliation procedures that compare processing results to expected outputs and identify discrepancies. Define output distribution controls that ensure reports and data are delivered to authorized recipients in a timely manner.',
    evidenceRequirements: [
      'Input validation control documentation and configuration records',
      'Output reconciliation procedures and completion records',
      'Output distribution controls and delivery confirmation records',
      'Input rejection and output discrepancy logs from the audit period',
    ],
    testProcedures: [
      'Inspect input validation controls for a sample of critical systems and verify that data validation rules are configured and operating effectively',
      'Review output reconciliation records and verify that processing outputs are compared to expected results on a regular basis',
      'Test a sample of output deliveries and confirm they were distributed to authorized recipients accurately and within required timeframes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PI1.5',
    name: 'Processing Integrity Storage and Protection',
    description:
      'The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely in accordance with system specifications to meet the entity\'s objectives. Data integrity is maintained throughout the processing lifecycle.',
    category: 'Processing Integrity',
    implementationGuidance:
      'Implement data integrity controls for stored data including checksums, hash verification, and database integrity constraints. Establish data retention policies that define storage requirements, retention periods, and secure disposal procedures. Monitor storage systems for integrity issues and implement automated alerting for data corruption or unauthorized modifications.',
    evidenceRequirements: [
      'Data storage and integrity control documentation',
      'Data retention policy and schedule documentation',
      'Storage integrity monitoring and alert configuration records',
      'Database integrity check logs and data corruption incident records',
    ],
    testProcedures: [
      'Review data storage controls and verify that integrity mechanisms such as checksums or database constraints are implemented for critical data',
      'Inspect data retention schedules and confirm that data is retained and disposed of in accordance with policy requirements',
      'Review storage integrity monitoring logs and confirm that integrity issues are detected and addressed promptly',
    ],
    status: 'Not Started',
  },

  // ===== P1: Privacy (P1.1 - P1.8) =====
  {
    controlId: 'P1.1',
    name: 'Privacy Notice and Consent',
    description:
      'The entity provides notice to data subjects about its privacy practices to meet the entity\'s objectives related to privacy. The notice is conspicuous, uses clear language, and describes the types of personal information collected, purposes of use, and data subject rights.',
    category: 'Privacy',
    implementationGuidance:
      'Develop and publish comprehensive privacy notices that describe data collection practices, purposes of processing, retention periods, and data subject rights. Implement consent management mechanisms that capture, record, and manage data subject consent for different processing activities. Review and update privacy notices regularly to reflect changes in data practices or regulatory requirements.',
    evidenceRequirements: [
      'Privacy notice documentation published on websites and applications',
      'Consent management platform configuration and consent records',
      'Privacy notice review and update history records',
      'Evidence of privacy notice accessibility and language clarity assessments',
    ],
    testProcedures: [
      'Review published privacy notices and verify they describe data collection, processing purposes, retention, sharing, and data subject rights',
      'Inspect the consent management platform and verify that consent is captured and recorded for different processing activities',
      'Confirm that privacy notices have been reviewed and updated within the required review cycle',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'P1.2',
    name: 'Choice and Consent Management',
    description:
      'The entity communicates choices available to data subjects regarding the collection, use, retention, disclosure, and disposal of personal information, and obtains and documents consent for personal information processing activities that require it.',
    category: 'Privacy',
    implementationGuidance:
      'Implement mechanisms for data subjects to express their choices regarding data processing, including opt-in and opt-out capabilities. Maintain records of consent that document what was consented to, when, and by whom. Provide data subjects with the ability to withdraw consent and ensure that withdrawal is processed in a timely manner.',
    evidenceRequirements: [
      'Consent management policy and procedures documentation',
      'Consent records documenting data subject choices and timestamps',
      'Opt-in and opt-out mechanism documentation and configuration records',
      'Consent withdrawal processing records and compliance metrics',
    ],
    testProcedures: [
      'Review consent management procedures and verify they address consent capture, recording, and withdrawal processes',
      'Test opt-in and opt-out mechanisms and confirm they function correctly and record data subject choices accurately',
      'Select a sample of consent withdrawal requests and verify they were processed within the required timeframe',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'P1.3',
    name: 'Personal Information Collection Limitation',
    description:
      'The entity collects personal information only for the purposes identified in the notice and with the consent of the data subject, and limits collection to what is necessary for those stated purposes. Data minimization principles are applied to limit the collection scope.',
    category: 'Privacy',
    implementationGuidance:
      'Implement data collection controls that limit personal information collection to what is necessary for the stated processing purposes. Conduct data mapping exercises to document what personal information is collected, where it is stored, and how it is used. Review collection practices periodically to identify and eliminate unnecessary data collection points.',
    evidenceRequirements: [
      'Data minimization policy and collection limitation procedures',
      'Data mapping documentation showing collection points and data flows',
      'Data collection review records and reduction actions taken',
      'System configuration evidence showing collection fields are limited to necessary data elements',
    ],
    testProcedures: [
      'Review data mapping documentation and verify that personal information collection is limited to what is necessary for stated purposes',
      'Inspect data collection forms and system configurations to confirm that only necessary data fields are captured',
      'Verify that data collection reviews were conducted during the period and that unnecessary collection points were identified and addressed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'P1.4',
    name: 'Personal Information Use, Retention, and Disposal',
    description:
      'The entity limits the use of personal information to the purposes identified in the entity\'s privacy notice, retains personal information for only the period necessary, and disposes of it securely. Use limitation, retention schedules, and secure disposal methods are enforced.',
    category: 'Privacy',
    implementationGuidance:
      'Establish data use limitation policies that restrict personal information use to purposes disclosed in the privacy notice. Implement retention schedules that define retention periods for each category of personal information based on legal and business requirements. Deploy secure data disposal methods including cryptographic erasure, secure deletion, and physical destruction for end-of-life media.',
    evidenceRequirements: [
      'Data use limitation policy and purpose specification documentation',
      'Data retention schedules with defined retention periods by data category',
      'Secure data disposal procedures and destruction certificates',
      'Data retention compliance reports and purging execution records',
    ],
    testProcedures: [
      'Review data use limitation policies and verify they restrict use of personal information to purposes identified in the privacy notice',
      'Inspect data retention schedules and confirm that retention periods are defined and enforced for all categories of personal information',
      'Select a sample of data disposal activities and verify that secure disposal methods were used and documented',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'P1.5',
    name: 'Personal Information Access Rights',
    description:
      'The entity grants identified and authenticated data subjects the ability to access their stored personal information for review, and provides a mechanism for them to request corrections or deletion. Access request processes are documented and completed within required timeframes.',
    category: 'Privacy',
    implementationGuidance:
      'Implement a data subject access request process that allows individuals to submit requests to access, correct, or delete their personal information. Establish identity verification procedures for data subject requests to prevent unauthorized access to personal information. Track and respond to access requests within regulatory timeframes and maintain records of all requests and responses.',
    evidenceRequirements: [
      'Data subject access request policy and procedures documentation',
      'DSAR tracking log with request details, timelines, and resolution status',
      'Identity verification procedures for data subject requests',
      'DSAR response templates and sample completed responses',
    ],
    testProcedures: [
      'Review DSAR procedures and verify they define the process for receiving, verifying, processing, and responding to data subject requests',
      'Select a sample of DSARs from the period and verify that responses were provided within required regulatory timeframes',
      'Inspect identity verification records for DSARs and confirm that requestor identity was validated before personal information was disclosed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'P1.6',
    name: 'Personal Information Disclosure and Sharing',
    description:
      'The entity discloses personal information to third parties with the consent of the data subject or as disclosed in the privacy notice, and only for identified purposes. Third-party data sharing agreements and controls protect personal information during and after transfer.',
    category: 'Privacy',
    implementationGuidance:
      'Establish policies governing the disclosure and sharing of personal information with third parties, requiring data processing agreements and appropriate safeguards. Implement controls to verify that third-party recipients have adequate privacy and security protections before sharing personal information. Maintain records of all personal information disclosures and ensure they are consistent with the privacy notice and consent records.',
    evidenceRequirements: [
      'Third-party data sharing policy and procedures documentation',
      'Data processing agreements with third-party recipients',
      'Personal information disclosure logs and records',
      'Third-party privacy and security assessment records',
    ],
    testProcedures: [
      'Review data sharing policies and verify they require consent or privacy notice disclosure, data processing agreements, and appropriate safeguards',
      'Select a sample of third-party data sharing arrangements and verify that data processing agreements are in place with required provisions',
      'Inspect personal information disclosure records and confirm that disclosures are consistent with the privacy notice and consent records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'P1.7',
    name: 'Personal Information Quality and Accuracy',
    description:
      'The entity collects and maintains accurate, up-to-date, complete, and relevant personal information for the purposes identified in the privacy notice. Data quality controls ensure personal information remains accurate throughout its lifecycle.',
    category: 'Privacy',
    implementationGuidance:
      'Implement data quality controls that validate personal information at the point of collection and periodically verify accuracy of stored data. Provide mechanisms for data subjects to update their personal information and promptly process correction requests. Establish data quality monitoring processes to identify and remediate inaccurate or outdated personal information.',
    evidenceRequirements: [
      'Data quality policy and procedures documentation',
      'Data validation control configurations at collection points',
      'Data correction request records and processing logs',
      'Data quality audit reports and remediation records',
    ],
    testProcedures: [
      'Review data quality policies and verify they define requirements for accuracy, completeness, and currency of personal information',
      'Inspect data validation controls at collection points and confirm they enforce data quality requirements',
      'Select a sample of data correction requests and verify they were processed accurately and within required timeframes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'P1.8',
    name: 'Privacy Incident and Breach Management',
    description:
      'The entity implements a process for receiving, addressing, resolving, and communicating the resolution of inquiries, complaints, and disputes from data subjects and for identifying and addressing privacy breaches and incidents. Breach notification procedures comply with applicable regulations.',
    category: 'Privacy',
    implementationGuidance:
      'Establish a privacy incident response plan that defines procedures for identifying, investigating, containing, and reporting privacy breaches. Implement breach notification procedures that comply with applicable regulatory requirements including notification timelines and content requirements. Maintain a privacy complaint and inquiry tracking system to document and resolve data subject concerns.',
    evidenceRequirements: [
      'Privacy incident response plan and breach notification procedures',
      'Privacy incident and breach tracking log with investigation records',
      'Breach notification records and regulatory filing evidence',
      'Privacy complaint and inquiry tracking records with resolution documentation',
    ],
    testProcedures: [
      'Review the privacy incident response plan and verify it defines procedures for identification, investigation, containment, notification, and remediation of privacy breaches',
      'Select a sample of privacy incidents or breaches from the period and verify that response and notification procedures were followed',
      'Inspect the privacy complaint log and verify that inquiries and complaints were tracked and resolved in a timely manner',
    ],
    status: 'Not Started',
  },

  // ===== C1: Confidentiality (C1.1 - C1.2) =====
  {
    controlId: 'C1.1',
    name: 'Confidential Information Identification and Protection',
    description:
      'The entity identifies and maintains confidential information to meet the entity\'s objectives related to confidentiality. Information classification schemes are used to categorize data by sensitivity level and apply appropriate protection measures based on classification.',
    category: 'Confidentiality',
    implementationGuidance:
      'Implement an information classification policy that defines classification levels such as public, internal, confidential, and restricted, with handling requirements for each level. Deploy technical controls including encryption, access restrictions, and data loss prevention to protect confidential information. Conduct data discovery and classification exercises to identify and label confidential information across systems and repositories.',
    evidenceRequirements: [
      'Information classification policy and handling requirements by classification level',
      'Data classification inventory and labeling records',
      'Technical controls documentation for confidential information protection including encryption and DLP',
      'Data discovery and classification scan results and remediation records',
    ],
    testProcedures: [
      'Review the information classification policy and verify that classification levels and handling requirements are clearly defined',
      'Inspect data classification records and confirm that confidential information is identified and labeled across critical systems',
      'Verify that technical protection controls such as encryption and access restrictions are applied to information classified as confidential',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'C1.2',
    name: 'Confidential Information Disposal',
    description:
      'The entity disposes of confidential information to meet the entity\'s objectives related to confidentiality. Secure disposal methods are applied when confidential information is no longer needed, and disposal activities are documented and verified.',
    category: 'Confidentiality',
    implementationGuidance:
      'Establish secure disposal procedures for confidential information in all forms including electronic data, physical documents, and storage media. Implement cryptographic erasure or secure overwrite methods for electronic data and physical destruction for storage media and documents. Maintain disposal records including certificates of destruction and verify that disposal was performed in accordance with the confidential information handling requirements.',
    evidenceRequirements: [
      'Confidential information disposal policy and procedures documentation',
      'Certificates of destruction for disposed media and documents',
      'Electronic data disposal records including secure deletion and cryptographic erasure logs',
      'Disposal verification records confirming compliance with handling requirements',
    ],
    testProcedures: [
      'Review confidential information disposal procedures and verify they define secure disposal methods for electronic and physical media',
      'Select a sample of disposal activities from the period and inspect certificates of destruction or disposal logs to verify secure methods were used',
      'Verify that disposal activities are tracked and that verification procedures confirm complete and secure destruction of confidential information',
    ],
    status: 'Not Started',
  },
];
