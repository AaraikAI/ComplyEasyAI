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

export const SOX_CONTROLS: FrameworkControlTemplate[] = [
  // ============================================================
  // IT GENERAL CONTROLS (ITGC) - ACCESS MANAGEMENT
  // ============================================================
  {
    controlId: 'SOX-ITGC-AM-1',
    name: 'User Provisioning and Account Management',
    description:
      'Formal procedures must be established for provisioning user accounts to financially significant applications and systems. Access must be authorized by appropriate management before being granted and must align with job responsibilities and the principle of least privilege.',
    category: 'IT General Controls - Access Management',
    implementationGuidance:
      'Implement a formal access request and provisioning process using an identity management system or documented manual workflow. Require written or electronic approval from the user\'s manager and the system/data owner before granting access. Define role-based access profiles aligned with job functions. Automate provisioning where possible through integration with HR systems for joiners. Maintain an audit trail of all provisioning actions including the requestor, approver, access granted, and effective date. Ensure provisioning procedures apply to all in-scope financial systems, databases, and operating systems.',
    evidenceRequirements: [
      'Access request and provisioning policy and procedures',
      'Sample access request forms with management and data owner approvals',
      'Role-based access profiles for financially significant applications',
      'Identity management system configuration and workflow documentation',
      'Provisioning audit trail reports showing request, approval, and grant timestamps',
      'List of in-scope financially significant systems covered by provisioning controls',
    ],
    testProcedures: [
      'Select a sample of new user accounts provisioned during the audit period and verify documented approval from the user\'s manager and data owner',
      'Verify that access granted matches the approved role-based access profile',
      'Confirm provisioning audit trails are complete and tamper-resistant',
      'Review the role-based access profiles for alignment with least privilege principles',
      'Verify that provisioning procedures cover all in-scope financial systems',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-AM-2',
    name: 'Periodic Access Reviews',
    description:
      'User access to financially significant applications and systems must be reviewed periodically (at least quarterly for privileged access, at least semi-annually for standard access) by appropriate management to ensure access remains appropriate based on current job responsibilities.',
    category: 'IT General Controls - Access Management',
    implementationGuidance:
      'Establish a periodic access review program with defined frequency based on access sensitivity: quarterly for privileged/administrative accounts, semi-annually for standard user accounts. Generate access review reports from each in-scope system listing all active users, their roles, and permissions. Distribute reports to application owners and business managers for review and certification. Require managers to confirm or revoke each user\'s access. Track and remediate identified access issues within a defined SLA (e.g., 5 business days for revocation). Document the review process, reviewer decisions, and remediation actions.',
    evidenceRequirements: [
      'Access review program policy with defined frequencies and responsibilities',
      'Access review reports from in-scope systems showing all active users and roles',
      'Manager/owner certification records with approve or revoke decisions for each user',
      'Remediation records for revoked or modified access with completion timestamps',
      'Access review schedule and completion tracking dashboard',
      'Evidence of escalation procedures for overdue reviews',
    ],
    testProcedures: [
      'Verify access reviews were completed on schedule (quarterly for privileged, semi-annually for standard)',
      'Select a sample of access review certifications and confirm appropriate managers reviewed and signed off',
      'Verify that access identified for revocation was removed within the defined SLA',
      'Confirm access review reports included all active accounts (reconcile against system user lists)',
      'Review the escalation process for overdue or incomplete access reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-AM-3',
    name: 'Privileged Access Management',
    description:
      'Administrative and privileged access to financially significant systems must be strictly controlled, monitored, and limited to authorized personnel who require elevated privileges to perform their job functions. Privileged activities must be logged and reviewed.',
    category: 'IT General Controls - Access Management',
    implementationGuidance:
      'Implement a privileged access management (PAM) solution or equivalent controls. Limit privileged accounts to the minimum number of personnel required. Use separate privileged accounts (not shared accounts) with enhanced authentication (MFA). Implement session recording or detailed activity logging for privileged sessions. Store privileged credentials in a secure vault with check-out/check-in procedures. Review privileged access activity logs at least weekly. Establish an emergency access (break-glass) procedure for critical situations with mandatory post-incident review.',
    evidenceRequirements: [
      'Privileged access management policy and procedures',
      'Inventory of all privileged accounts across in-scope systems',
      'PAM solution configuration documentation or equivalent manual controls',
      'Privileged session logs or recordings',
      'Weekly privileged activity review records with reviewer sign-off',
      'Emergency access (break-glass) procedure documentation and usage logs',
      'MFA configuration evidence for privileged accounts',
    ],
    testProcedures: [
      'Review the privileged account inventory and verify each account is assigned to a named individual with documented justification',
      'Verify privileged accounts require MFA for authentication',
      'Review privileged session logs for a sample period and confirm weekly reviews were completed',
      'Test the break-glass procedure and verify post-incident review is triggered',
      'Confirm shared privileged accounts have been eliminated or have compensating controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-AM-4',
    name: 'Access Termination and Transfer',
    description:
      'User access to financially significant systems must be promptly revoked upon termination of employment and appropriately modified upon job transfer. Termination access removal must occur within 24 hours of the employee\'s last working day.',
    category: 'IT General Controls - Access Management',
    implementationGuidance:
      'Integrate the access deprovisioning process with HR termination workflows. Establish automated or near-real-time notifications from HR to IT Security upon employee termination. Disable all accounts within 24 hours of the employee\'s last working day (same day for involuntary terminations). For job transfers, conduct a transfer access review to remove old role access and provision new role access, ensuring no accumulation of incompatible privileges. Maintain a termination checklist covering all in-scope systems. Conduct monthly reconciliation of active accounts against the HR active employee roster.',
    evidenceRequirements: [
      'Access termination policy with defined timelines (24-hour/same-day)',
      'HR-to-IT termination notification workflow documentation',
      'Sample termination records showing notification date, account disable date, and systems affected',
      'Transfer access review records showing old access removed and new access provisioned',
      'Monthly reconciliation reports of active accounts vs. HR active employee roster',
      'Termination checklist covering all in-scope systems',
    ],
    testProcedures: [
      'Select a sample of terminated employees and verify all accounts were disabled within 24 hours of departure',
      'Compare the active user list for each in-scope system against the HR terminated employee list to identify orphaned accounts',
      'Review transfer access reviews for a sample of transferred employees and verify old access was removed',
      'Confirm the monthly reconciliation process is performed and discrepancies are investigated',
      'Test the involuntary termination process for immediate account disablement',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-AM-5',
    name: 'Password and Authentication Policies',
    description:
      'Password and authentication policies for financially significant systems must enforce minimum complexity, rotation, lockout, and multi-factor authentication requirements aligned with current security standards.',
    category: 'IT General Controls - Access Management',
    implementationGuidance:
      'Implement and enforce password policies across all in-scope systems: minimum 12-character length, complexity requirements (uppercase, lowercase, numbers, special characters), account lockout after 5 consecutive failed attempts, and session timeout after 15 minutes of inactivity. Implement multi-factor authentication for remote access, privileged accounts, and all access to financial systems. Prohibit password sharing and the reuse of the last 12 passwords. Configure systems to enforce policies technically rather than relying on user compliance. Conduct periodic password policy compliance scans.',
    evidenceRequirements: [
      'Password and authentication policy documentation',
      'System configuration screenshots or exports showing enforced password parameters',
      'MFA configuration evidence for remote access and financial systems',
      'Account lockout configuration evidence',
      'Password policy compliance scan results',
      'Session timeout configuration evidence',
    ],
    testProcedures: [
      'Review system configurations for each in-scope application to verify password policy enforcement',
      'Attempt to create a password that does not meet complexity requirements and verify it is rejected',
      'Verify MFA is required for remote access and financial system access',
      'Test account lockout by exceeding the failed attempt threshold',
      'Verify session timeout is enforced after the configured inactivity period',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-AM-6',
    name: 'Segregation of Duties',
    description:
      'Incompatible duties within financially significant processes and systems must be segregated to prevent any single individual from having the ability to initiate, authorize, record, and reconcile a financial transaction. System access must enforce SoD rules.',
    category: 'IT General Controls - Access Management',
    implementationGuidance:
      'Define a segregation of duties (SoD) matrix identifying incompatible role and access combinations across financial processes (e.g., ability to create vendors and approve payments, ability to record journal entries and approve them). Configure role-based access controls in financial systems to enforce SoD rules technically. Implement SoD monitoring tools to detect violations in real time or during periodic reviews. Establish an exception process requiring documented business justification and compensating controls for any approved SoD exceptions. Review the SoD matrix at least annually for completeness.',
    evidenceRequirements: [
      'Segregation of duties matrix defining incompatible role/access combinations',
      'RBAC configuration evidence enforcing SoD rules in financial systems',
      'SoD violation monitoring reports (real-time or periodic)',
      'SoD exception request and approval records with compensating controls',
      'Annual SoD matrix review and update records',
      'SoD conflict remediation records',
    ],
    testProcedures: [
      'Review the SoD matrix for completeness across key financial processes',
      'Test RBAC configurations to verify a single user cannot hold incompatible roles',
      'Review SoD violation reports for the audit period and verify all violations were investigated and resolved',
      'Examine approved SoD exceptions for adequate business justification and compensating controls',
      'Verify the SoD matrix has been reviewed and updated within the last 12 months',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // IT GENERAL CONTROLS (ITGC) - CHANGE MANAGEMENT
  // ============================================================
  {
    controlId: 'SOX-ITGC-CM-1',
    name: 'Change Request and Authorization Process',
    description:
      'All changes to financially significant applications, systems, and infrastructure must follow a formal change management process that includes a documented change request, impact assessment, risk analysis, and approval by appropriate stakeholders before implementation.',
    category: 'IT General Controls - Change Management',
    implementationGuidance:
      'Implement a change management process using a ticketing system (e.g., ServiceNow, Jira). Require all changes to be submitted as formal change requests with: description of the change, business justification, impact assessment, risk analysis, rollback plan, implementation schedule, and affected systems. Classify changes by risk level (standard, normal, major). Require approval from the change advisory board (CAB) or designated approvers based on risk classification. Prohibit self-approval of changes. Maintain an audit trail of the entire change lifecycle.',
    evidenceRequirements: [
      'Change management policy and procedures',
      'Change request ticketing system configuration and workflow documentation',
      'Sample change requests showing all required fields (description, justification, impact, risk, rollback plan)',
      'Change advisory board (CAB) meeting minutes and approval records',
      'Change classification criteria (standard, normal, major)',
      'Audit trail reports from the change management system',
    ],
    testProcedures: [
      'Select a sample of changes implemented during the audit period and verify each had an approved change request prior to implementation',
      'Verify change requests include all required elements: description, justification, impact assessment, risk analysis, and rollback plan',
      'Confirm changes were approved by appropriate stakeholders (CAB or designated approvers)',
      'Verify no self-approved changes exist in the sample',
      'Review the change management audit trail for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-CM-2',
    name: 'Change Testing and Approval',
    description:
      'Changes to financially significant systems must be tested in a non-production environment before deployment to production. Test results must be documented and approved by appropriate stakeholders. Testing must verify that the change functions as intended and does not introduce defects.',
    category: 'IT General Controls - Change Management',
    implementationGuidance:
      'Maintain separate development, testing/staging, and production environments for all in-scope financial systems. Require all changes to be tested in a non-production environment that mirrors production configuration. Define testing requirements based on change type: unit testing, integration testing, user acceptance testing (UAT), and regression testing as appropriate. Document test plans, test cases, test results, and defects found. Require sign-off from business users (UAT) and technical staff before promoting to production. Ensure developers cannot promote their own code to production (separation of environments).',
    evidenceRequirements: [
      'Environment separation documentation (dev, test/staging, production)',
      'Testing policy defining requirements by change type',
      'Sample test plans, test cases, and test result documentation',
      'UAT sign-off records from business stakeholders',
      'Technical sign-off records from IT/QA staff',
      'Evidence that developers cannot promote code directly to production',
    ],
    testProcedures: [
      'Verify separate environments exist for development, testing, and production',
      'Select a sample of changes and verify testing was performed in a non-production environment',
      'Review test documentation for completeness (test plan, test cases, test results)',
      'Verify UAT and technical sign-off were obtained before production deployment',
      'Confirm that development personnel do not have the ability to promote changes to production',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-CM-3',
    name: 'Emergency Change Procedures',
    description:
      'Emergency changes to financially significant systems must follow an expedited but documented process that includes after-the-fact review, testing, and approval. Emergency changes must be formally ratified within a defined timeframe after implementation.',
    category: 'IT General Controls - Change Management',
    implementationGuidance:
      'Define criteria for what constitutes an emergency change (e.g., production outage, critical security vulnerability, regulatory deadline). Implement an expedited emergency change process that permits implementation before full approval but requires: verbal or electronic authorization from a designated emergency approver, documentation of the change and its urgency within 24 hours, post-implementation review and testing within 5 business days, and formal ratification by the CAB at the next scheduled meeting. Track all emergency changes separately and review the emergency change rate to identify systemic issues.',
    evidenceRequirements: [
      'Emergency change policy with defined criteria and expedited procedures',
      'Emergency change authorization records (verbal or electronic approval)',
      'Post-implementation documentation completed within 24 hours',
      'Post-implementation review and testing records completed within 5 business days',
      'CAB ratification records for emergency changes',
      'Emergency change rate trending reports',
    ],
    testProcedures: [
      'Review all emergency changes during the audit period and verify each met the defined emergency criteria',
      'Verify emergency authorization was obtained before or concurrent with implementation',
      'Confirm post-implementation documentation was completed within 24 hours',
      'Verify post-implementation review and testing were completed within 5 business days',
      'Confirm CAB ratification occurred at the next scheduled meeting',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-CM-4',
    name: 'Version Control and Configuration Management',
    description:
      'Source code, configurations, and scripts for financially significant systems must be managed in a version control system with access restricted to authorized personnel. All changes must be traceable to an approved change request.',
    category: 'IT General Controls - Change Management',
    implementationGuidance:
      'Store all source code, database scripts, configuration files, and infrastructure-as-code for in-scope systems in a version control system (e.g., Git). Restrict write access to authorized development and operations personnel. Require all commits to reference an approved change request or ticket number. Implement branch protection rules preventing direct commits to production branches. Require code review (pull request approval) before merging to main/release branches. Maintain complete version history with author, date, and change description. Conduct periodic access reviews of the version control system.',
    evidenceRequirements: [
      'Version control system configuration and access documentation',
      'Branch protection rules for production/release branches',
      'Sample commits demonstrating change request traceability',
      'Code review/pull request approval records',
      'Version control access review records',
      'Version history demonstrating complete traceability',
    ],
    testProcedures: [
      'Verify all in-scope system code and configurations are stored in version control',
      'Test branch protection rules by attempting a direct commit to the production branch',
      'Select a sample of commits and verify each references an approved change request',
      'Verify code review approvals were obtained before merging to production branches',
      'Review version control access for appropriateness and confirm periodic reviews are performed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-CM-5',
    name: 'Change Documentation and Audit Trail',
    description:
      'Complete documentation must be maintained for all changes to financially significant systems, including the original request, approvals, testing evidence, implementation records, and post-implementation validation. Documentation must be retained in accordance with the document retention policy.',
    category: 'IT General Controls - Change Management',
    implementationGuidance:
      'Define minimum documentation requirements for each change type. Maintain a centralized change management system that serves as the system of record for all change documentation. Required documentation includes: change request with business justification, impact and risk assessment, approvals at each stage, test plans and results, implementation runbook, implementation log with timestamps, post-implementation validation results, and rollback confirmation (if applicable). Retain change documentation for at least 7 years (SOX retention requirement). Conduct periodic quality reviews of change documentation completeness.',
    evidenceRequirements: [
      'Change documentation standards defining minimum requirements by change type',
      'Sample change records demonstrating complete documentation lifecycle',
      'Implementation logs with timestamps and responsible personnel',
      'Post-implementation validation records',
      'Document retention policy covering change management records (7+ years)',
      'Periodic quality review reports for change documentation',
    ],
    testProcedures: [
      'Select a sample of changes and verify complete documentation exists for each lifecycle stage',
      'Verify implementation logs include timestamps and responsible personnel',
      'Confirm post-implementation validation was performed and documented',
      'Review document retention configurations to verify 7-year minimum retention',
      'Assess the quality review process for change documentation completeness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // IT GENERAL CONTROLS (ITGC) - IT OPERATIONS
  // ============================================================
  {
    controlId: 'SOX-ITGC-OP-1',
    name: 'Job Scheduling and Batch Processing',
    description:
      'Automated job scheduling for financially significant batch processes must be controlled, monitored, and documented. Job schedules must be authorized, and job failures must be detected, escalated, and resolved in a timely manner.',
    category: 'IT General Controls - IT Operations',
    implementationGuidance:
      'Implement an enterprise job scheduling system for all automated batch processes affecting financial data (e.g., end-of-day processing, data feeds, reconciliations, report generation). Restrict job schedule modifications to authorized operations personnel. Require documented approval for job schedule changes. Implement automated monitoring that alerts operations staff to job failures in real time. Establish procedures for investigating and resolving job failures, including re-run procedures and data integrity verification. Maintain logs of all job executions, failures, and remediation actions.',
    evidenceRequirements: [
      'Job scheduling system documentation and access controls',
      'Authorized job schedule and change approval records',
      'Automated monitoring and alerting configuration documentation',
      'Job execution logs showing successful completions and failures',
      'Job failure investigation and resolution records',
      'Re-run procedures and data integrity verification documentation',
    ],
    testProcedures: [
      'Review job scheduling system access to verify only authorized personnel can modify schedules',
      'Verify job schedule changes were approved by appropriate management',
      'Review job execution logs for a sample period and confirm all failures were detected and resolved',
      'Test the monitoring and alerting mechanism by simulating a job failure',
      'Verify data integrity verification procedures are followed after job re-runs',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-OP-2',
    name: 'Backup and Recovery',
    description:
      'Data and system backups for financially significant systems must be performed regularly, verified, stored securely, and tested periodically to ensure recoverability. Backup procedures must ensure financial data can be restored to support business continuity and regulatory requirements.',
    category: 'IT General Controls - IT Operations',
    implementationGuidance:
      'Implement a comprehensive backup strategy for all in-scope financial systems covering databases, application data, configurations, and transaction logs. Define backup frequency based on data criticality (daily full, hourly incremental for critical financial data). Store backups in at least two geographically separate locations. Encrypt backup media in transit and at rest. Implement automated backup monitoring with failure alerts. Conduct quarterly restore tests to verify backup recoverability. Define and test recovery time objectives (RTO) and recovery point objectives (RPO) for each in-scope system. Retain backups in accordance with legal and regulatory requirements (7+ years for financial records).',
    evidenceRequirements: [
      'Backup policy defining frequency, scope, and retention for in-scope systems',
      'Backup job logs showing successful completions and any failures',
      'Offsite/secondary storage location documentation and access controls',
      'Backup encryption configuration evidence',
      'Quarterly restore test results demonstrating successful data recovery',
      'RTO/RPO definitions and test results for each in-scope system',
      'Backup monitoring and failure alerting configuration',
    ],
    testProcedures: [
      'Review backup logs for a sample period and verify all scheduled backups completed successfully',
      'Verify backup failures were detected, investigated, and resolved in a timely manner',
      'Confirm backups are stored in at least two geographically separate locations',
      'Review quarterly restore test results to verify data was successfully recovered',
      'Verify RTO and RPO targets were met during the most recent restore test',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-OP-3',
    name: 'Incident Management',
    description:
      'An incident management process must be in place to detect, record, classify, escalate, resolve, and report IT incidents affecting financially significant systems. Incidents impacting financial data integrity must be prioritized and resolved with documented root cause analysis.',
    category: 'IT General Controls - IT Operations',
    implementationGuidance:
      'Implement a formal incident management process with defined severity levels, escalation paths, and resolution SLAs. Use an incident management system to log all incidents. Classify incidents affecting financial data integrity as high priority. Require root cause analysis for all high-severity incidents and incidents affecting financial data. Implement post-incident reviews for critical incidents to identify preventive measures. Establish communication procedures for notifying management and impacted stakeholders. Track incident metrics (volume, MTTR, recurring incidents) and report to management monthly.',
    evidenceRequirements: [
      'Incident management policy with severity classification and SLAs',
      'Incident management system configuration and workflow documentation',
      'Sample incident records showing lifecycle from detection through resolution',
      'Root cause analysis reports for high-severity and financial data incidents',
      'Post-incident review records for critical incidents',
      'Monthly incident metrics reports to management',
    ],
    testProcedures: [
      'Review incident records for a sample period and verify all incidents were logged and classified',
      'Verify high-severity incidents and financial data incidents received root cause analysis',
      'Confirm incident resolution SLAs were met for the sample period',
      'Review post-incident reviews for critical incidents and verify preventive measures were implemented',
      'Verify monthly incident metrics were reported to management',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-OP-4',
    name: 'Problem Management',
    description:
      'A problem management process must be in place to identify, analyze, and resolve the root causes of recurring incidents affecting financially significant systems. Known errors and workarounds must be documented and tracked to permanent resolution.',
    category: 'IT General Controls - IT Operations',
    implementationGuidance:
      'Implement a problem management process that identifies recurring incidents and systemic issues through trend analysis. Conduct root cause analysis using structured methodologies (5-Why, fishbone, fault tree). Maintain a known error database documenting identified problems, workarounds, and resolution plans. Prioritize problems based on business impact, particularly those affecting financial data integrity. Track problem resolution through to implementation of permanent fixes. Integrate problem management with change management to ensure fixes follow formal change procedures.',
    evidenceRequirements: [
      'Problem management policy and procedures',
      'Problem records showing root cause analysis and resolution plans',
      'Known error database entries with documented workarounds',
      'Trend analysis reports identifying recurring incidents',
      'Problem resolution tracking and closure records',
      'Integration evidence between problem management and change management',
    ],
    testProcedures: [
      'Review problem records and verify root cause analysis was performed using a structured methodology',
      'Verify known errors have documented workarounds and resolution timelines',
      'Confirm recurring incident patterns triggered problem investigations',
      'Verify permanent fixes were implemented through the formal change management process',
      'Review problem management metrics for trends in open problems and resolution times',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-OP-5',
    name: 'Capacity Planning and Performance Monitoring',
    description:
      'Financially significant systems must be monitored for performance and capacity to ensure availability and processing integrity. Capacity plans must anticipate growth and peak processing periods to prevent disruptions to financial reporting processes.',
    category: 'IT General Controls - IT Operations',
    implementationGuidance:
      'Implement real-time performance monitoring for all in-scope financial systems covering CPU, memory, storage, network, and application-level metrics. Define performance thresholds and configure automated alerts when thresholds are approached. Conduct annual capacity planning reviews that consider projected growth, seasonal peaks (quarter-end, year-end), and new initiatives. Maintain sufficient capacity headroom (at least 20% above peak utilization). Document capacity plans and obtain management approval. Track capacity trends and report to management quarterly.',
    evidenceRequirements: [
      'Performance monitoring system configuration and dashboard documentation',
      'Performance threshold definitions and alerting configuration',
      'Annual capacity planning documents with growth projections',
      'Capacity utilization trend reports for in-scope systems',
      'Management-approved capacity plans',
      'Quarterly capacity and performance reports to management',
    ],
    testProcedures: [
      'Review performance monitoring dashboards for all in-scope systems',
      'Verify automated alerts are configured for performance threshold breaches',
      'Review the annual capacity plan for completeness and realistic growth projections',
      'Verify sufficient capacity headroom exists for peak processing periods',
      'Confirm quarterly capacity reports are delivered to management',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // IT GENERAL CONTROLS (ITGC) - SDLC
  // ============================================================
  {
    controlId: 'SOX-ITGC-SD-1',
    name: 'Software Development Methodology',
    description:
      'A formal software development lifecycle (SDLC) methodology must be adopted and followed for the development and modification of financially significant applications. The methodology must define phases, deliverables, quality gates, and approval requirements.',
    category: 'IT General Controls - SDLC',
    implementationGuidance:
      'Adopt and document a formal SDLC methodology (waterfall, agile, or hybrid) for all development affecting in-scope financial applications. Define lifecycle phases: requirements gathering, design, development, testing, deployment, and post-implementation review. Establish quality gates at each phase transition requiring documented deliverables and approvals. Include security and compliance requirements in the design phase. Require business requirements documentation and sign-off before development begins. Conduct post-implementation reviews for all significant releases. Train development staff on the SDLC methodology and conduct periodic compliance assessments.',
    evidenceRequirements: [
      'SDLC methodology documentation with defined phases, deliverables, and quality gates',
      'Business requirements documents with stakeholder sign-off',
      'Design documents including security and compliance requirements',
      'Quality gate review and approval records',
      'Post-implementation review records for significant releases',
      'Developer training records on SDLC methodology',
    ],
    testProcedures: [
      'Review the SDLC methodology for completeness of phase definitions and quality gates',
      'Select a sample of development projects and verify SDLC phases were followed',
      'Verify business requirements were documented and approved before development started',
      'Confirm quality gate approvals were obtained at each phase transition',
      'Review post-implementation reviews for recent significant releases',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-SD-2',
    name: 'Code Review and Quality Assurance',
    description:
      'All code changes to financially significant applications must undergo peer code review before deployment to production. Code reviews must verify functionality, security, coding standards compliance, and absence of unauthorized changes.',
    category: 'IT General Controls - SDLC',
    implementationGuidance:
      'Implement mandatory code review as part of the development workflow using pull request or merge request processes in the version control system. Require at least one reviewer who is not the code author. Define code review criteria: functional correctness, adherence to coding standards, security vulnerability assessment, performance considerations, and compliance with change request specifications. Use automated code analysis tools (static analysis, linting) to supplement manual reviews. Maintain records of code reviews including reviewer, review date, findings, and resolution. Block merging of unreviewed code to production branches.',
    evidenceRequirements: [
      'Code review policy and procedures defining review criteria and requirements',
      'Pull/merge request records showing reviewer approval before merge',
      'Code review checklists or criteria documentation',
      'Automated code analysis tool configuration and reports',
      'Branch protection rules requiring code review before merge',
      'Code review metrics (review coverage, defect detection rates)',
    ],
    testProcedures: [
      'Select a sample of code changes deployed to production and verify code review was completed',
      'Verify the reviewer was not the code author (no self-review)',
      'Review code review comments for evidence of meaningful review (not rubber-stamping)',
      'Verify branch protection rules prevent unreviewed code from reaching production',
      'Review automated code analysis results for the sample changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-SD-3',
    name: 'Testing Requirements for Financial Systems',
    description:
      'Changes to financially significant applications must undergo thorough testing including unit testing, integration testing, system testing, and user acceptance testing (UAT). Test results must demonstrate that financial calculations, data flows, and reports function correctly.',
    category: 'IT General Controls - SDLC',
    implementationGuidance:
      'Define testing requirements by change type and risk level. For changes affecting financial calculations, require test cases that verify calculation accuracy using known input/output pairs. For changes affecting financial reports, require comparison testing of report outputs before and after the change. Implement automated testing where feasible (unit tests, integration tests). Require business user acceptance testing (UAT) for all changes affecting financial processes with formal sign-off. Maintain test environments with representative data. Document test plans, test cases, expected results, actual results, and defect resolution.',
    evidenceRequirements: [
      'Testing standards and requirements by change type and risk level',
      'Test plans and test cases for financial system changes',
      'Test execution results with expected vs. actual outcomes',
      'UAT sign-off records from business stakeholders',
      'Test environment configuration and data management documentation',
      'Defect tracking and resolution records from testing',
      'Automated test coverage reports',
    ],
    testProcedures: [
      'Select a sample of changes to financial systems and verify appropriate testing was performed',
      'Review test cases for financial calculation changes to confirm accuracy verification',
      'Verify UAT was performed and formally signed off by business stakeholders',
      'Review defect reports from testing and confirm all critical/high defects were resolved before deployment',
      'Verify test environments are maintained with representative data',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-SD-4',
    name: 'Deployment Controls and Separation of Environments',
    description:
      'Deployment of changes to production environments for financially significant systems must be controlled, authorized, and performed by personnel who did not develop the change. Development, testing, and production environments must be separated.',
    category: 'IT General Controls - SDLC',
    implementationGuidance:
      'Maintain physically or logically separated development, testing/staging, and production environments. Restrict production deployment access to authorized operations or release management personnel. Prohibit developers from deploying their own code to production (enforced technically, not just procedurally). Implement a deployment checklist that includes: change request approval verification, testing completion verification, deployment authorization, pre-deployment backup, deployment execution, post-deployment verification, and rollback readiness. Automate deployment pipelines with built-in approval gates where possible.',
    evidenceRequirements: [
      'Environment separation architecture documentation',
      'Production deployment access control list and restriction evidence',
      'Deployment pipeline configuration with approval gates',
      'Deployment checklist template and completed checklist samples',
      'Evidence that developers cannot deploy to production (access restrictions)',
      'Post-deployment verification records',
    ],
    testProcedures: [
      'Verify development, testing, and production environments are separated (different servers, networks, or accounts)',
      'Review production deployment access and confirm developers are excluded',
      'Select a sample of deployments and verify the deployer was not the developer',
      'Confirm deployment checklists were completed for sample deployments',
      'Verify post-deployment verification was performed and documented',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // FINANCIAL REPORTING CONTROLS
  // ============================================================
  {
    controlId: 'SOX-FRC-1',
    name: 'Financial Close Process Controls',
    description:
      'The financial close process must follow documented procedures with defined timelines, responsibilities, and quality checks to ensure complete and accurate financial statements. Close procedures must include completeness checks, cut-off procedures, and management review.',
    category: 'Financial Reporting Controls',
    implementationGuidance:
      'Document a detailed financial close checklist with specific tasks, responsible parties, deadlines, and dependencies. Implement a close management system or tool to track task completion in real time. Define cut-off procedures for revenue recognition, expense accruals, and intercompany transactions. Require preparers and reviewers to be different individuals for each close task. Implement close timeline milestones with escalation procedures for delays. Conduct a post-close review to assess the effectiveness of the close process and identify improvements. Maintain close calendars and distribute to all involved parties.',
    evidenceRequirements: [
      'Financial close checklist with tasks, owners, deadlines, and dependencies',
      'Close management system or tracking tool screenshots',
      'Cut-off procedures for revenue, expenses, and intercompany transactions',
      'Close timeline with milestones and escalation procedures',
      'Completed close checklists for recent periods with preparer/reviewer sign-offs',
      'Post-close review records with improvement actions',
    ],
    testProcedures: [
      'Review the financial close checklist for completeness and appropriate task assignment',
      'Verify close tasks were completed on schedule for a sample period',
      'Confirm preparer and reviewer are different individuals for each close task',
      'Review cut-off procedures and verify they were followed for recent close periods',
      'Verify post-close reviews were conducted and improvement actions were tracked',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRC-2',
    name: 'Journal Entry Controls',
    description:
      'Journal entries must be properly authorized, documented, and reviewed. Unusual or non-standard journal entries must receive heightened scrutiny. Access to record journal entries must be restricted to authorized personnel, and segregation of duties must be maintained.',
    category: 'Financial Reporting Controls',
    implementationGuidance:
      'Implement a journal entry policy requiring: documented business purpose for every journal entry, supporting documentation attached, appropriate authorization before posting, segregation between preparer and approver. Define criteria for non-standard or unusual journal entries (manual entries, entries above a threshold, entries to unusual accounts, entries near period-end, entries with round numbers). Subject non-standard entries to additional review by a senior reviewer or controller. Restrict journal entry posting access to authorized accounting personnel. Implement automated fraud detection rules for suspicious journal entry patterns.',
    evidenceRequirements: [
      'Journal entry policy with authorization and documentation requirements',
      'Criteria definition for non-standard/unusual journal entries',
      'Sample journal entries with supporting documentation and approval records',
      'Non-standard journal entry enhanced review records',
      'Journal entry posting access list and restriction evidence',
      'Automated fraud detection rules and alert reports',
    ],
    testProcedures: [
      'Select a sample of journal entries (including non-standard entries) and verify proper authorization and documentation',
      'Verify the preparer and approver are different individuals for all sampled entries',
      'Review non-standard journal entries for enhanced review and approval',
      'Confirm journal entry posting access is restricted to authorized personnel',
      'Review automated fraud detection alerts and investigate disposition',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRC-3',
    name: 'Account Reconciliation',
    description:
      'All material balance sheet accounts must be reconciled on a periodic basis (at minimum monthly for significant accounts). Reconciliations must be prepared by one individual and reviewed by another, with reconciling items investigated and resolved in a timely manner.',
    category: 'Financial Reporting Controls',
    implementationGuidance:
      'Establish an account reconciliation policy defining: accounts requiring reconciliation, frequency (monthly for significant accounts, quarterly for others), reconciliation format and content requirements, preparer and reviewer responsibilities, and aging thresholds for reconciling items. Implement a reconciliation management tool or standardized templates. Require reconciliations to include: account balance per GL, balance per subledger or supporting source, reconciling items with explanations, and aging of open items. Require reviewer sign-off within defined timelines. Escalate aged reconciling items to management.',
    evidenceRequirements: [
      'Account reconciliation policy with scope, frequency, and requirements',
      'Reconciliation inventory listing all accounts, frequency, and owners',
      'Sample completed reconciliations with preparer and reviewer sign-offs',
      'Reconciling item aging reports with investigation notes',
      'Escalation records for aged or unresolved reconciling items',
      'Reconciliation completion and timeliness tracking reports',
    ],
    testProcedures: [
      'Verify all material balance sheet accounts are included in the reconciliation inventory',
      'Select a sample of reconciliations and verify completeness (GL balance, supporting balance, reconciling items)',
      'Confirm preparer and reviewer are different individuals',
      'Verify reconciliations were completed within required timelines',
      'Review aged reconciling items for appropriate investigation and resolution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRC-4',
    name: 'Management Review Controls',
    description:
      'Management must perform periodic reviews of key financial data, metrics, and reports to identify anomalies, errors, and trends that may indicate misstatements. Reviews must be documented with evidence of the analysis performed and conclusions reached.',
    category: 'Financial Reporting Controls',
    implementationGuidance:
      'Define management review controls for key financial metrics and reports: revenue analysis by product/region/period, expense analysis by category with budget comparison, gross margin analysis, intercompany balance review, and key performance indicators. Require management to document the analysis performed, data reviewed, questions raised, explanations obtained, and conclusions reached. Establish thresholds for investigation (e.g., variances greater than 10% or $X). Require follow-up on identified anomalies with documented resolution. Conduct reviews at least monthly for significant financial data.',
    evidenceRequirements: [
      'Management review control matrix defining reviews, frequency, and reviewers',
      'Review documentation templates with analysis, questions, and conclusions sections',
      'Completed management review records for recent periods',
      'Investigation and resolution records for identified anomalies',
      'Variance thresholds and escalation criteria documentation',
      'Supporting data packages provided to management for review',
    ],
    testProcedures: [
      'Review the management review control matrix for completeness across key financial areas',
      'Select a sample of management reviews and verify documented analysis, questions, and conclusions',
      'Confirm anomalies identified during reviews were investigated and resolved',
      'Verify reviews were performed at the required frequency',
      'Assess the depth and rigor of management review documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRC-5',
    name: 'Spreadsheet Controls',
    description:
      'Key spreadsheets used in the financial reporting process must be identified, controlled, and subject to accuracy validation. Controls must address formula integrity, access restrictions, version control, and periodic review.',
    category: 'Financial Reporting Controls',
    implementationGuidance:
      'Inventory all key spreadsheets used in the financial close and reporting process (end-user computing or EUC inventory). Classify spreadsheets by risk level based on their impact on financial statements. Implement controls proportionate to risk: cell and formula protection, restricted access (password protection, shared drives with access controls), version control (naming conventions, archival), input validation rules, and periodic formula integrity checks. Require preparer and reviewer roles for spreadsheet updates. Establish a migration path to move high-risk spreadsheets into controlled applications where feasible.',
    evidenceRequirements: [
      'End-user computing (EUC) inventory listing all key financial spreadsheets',
      'Spreadsheet risk classification criteria and assessments',
      'Spreadsheet control procedures (formula protection, access, version control)',
      'Formula integrity check records',
      'Preparer and reviewer sign-off records for spreadsheet updates',
      'Migration plan for high-risk spreadsheets to controlled applications',
    ],
    testProcedures: [
      'Verify the EUC inventory is complete and covers all key financial spreadsheets',
      'Select a sample of high-risk spreadsheets and verify controls are in place (formula protection, access restrictions)',
      'Confirm formula integrity checks have been performed recently',
      'Verify preparer and reviewer are different individuals for spreadsheet updates',
      'Review version control practices for key spreadsheets',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRC-6',
    name: 'Report Generation and Distribution Controls',
    description:
      'Financial reports generated from systems must be accurate, complete, and distributed only to authorized recipients. Report generation processes must be controlled and validated, and report logic must be tested when modified.',
    category: 'Financial Reporting Controls',
    implementationGuidance:
      'Inventory all system-generated financial reports used in the financial close and reporting process. Implement controls over report logic: require testing and validation when report definitions are modified, maintain documentation of report logic and data sources, restrict access to modify report definitions. Implement report distribution controls: define authorized recipient lists, use secure distribution channels, and log report generation and distribution. Conduct periodic validation of report accuracy by reconciling report outputs to source data. Implement automated report scheduling with failure detection.',
    evidenceRequirements: [
      'Financial report inventory with data sources, report logic, and owners',
      'Report modification testing and validation records',
      'Report logic documentation for key financial reports',
      'Report definition modification access controls',
      'Report distribution lists and secure delivery evidence',
      'Report accuracy validation records (reconciliation to source data)',
    ],
    testProcedures: [
      'Review the financial report inventory for completeness',
      'Select a sample of reports and verify the output reconciles to source system data',
      'Verify report definition access is restricted to authorized personnel',
      'Review report modification records for testing and validation evidence',
      'Confirm reports are distributed only to authorized recipients through secure channels',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRC-7',
    name: 'Data Integrity Controls',
    description:
      'Controls must be in place to ensure the integrity of financial data throughout its lifecycle, including data entry, processing, transfer, storage, and output. Data integrity controls must address completeness, accuracy, validity, and timeliness.',
    category: 'Financial Reporting Controls',
    implementationGuidance:
      'Implement data integrity controls at each stage of the financial data lifecycle. Input controls: field validation rules, mandatory fields, duplicate detection, authorization of data entry. Processing controls: batch totals, hash totals, run-to-run controls, reconciliation of input to output. Transfer controls: record counts, checksum validation, encryption, acknowledgment protocols. Storage controls: database constraints, referential integrity, audit trails. Output controls: report balancing, reasonableness checks, cross-system reconciliation. Implement automated data quality monitoring with alerting for integrity violations.',
    evidenceRequirements: [
      'Data integrity control framework covering input, processing, transfer, storage, and output',
      'Input validation rule configurations for financial systems',
      'Batch processing reconciliation records (input/output balancing)',
      'Data transfer integrity verification logs (record counts, checksums)',
      'Database constraint and referential integrity configurations',
      'Automated data quality monitoring alerts and resolution records',
    ],
    testProcedures: [
      'Test input validation rules by entering invalid data and verifying rejection',
      'Verify batch processing controls by comparing input and output totals for a sample batch',
      'Review data transfer logs for integrity verification (record counts, checksums)',
      'Verify database constraints prevent referential integrity violations',
      'Review data quality monitoring alerts for the audit period and confirm resolution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRC-8',
    name: 'Segregation of Duties in Financial Systems',
    description:
      'Segregation of duties must be enforced within financial systems to ensure no single individual can initiate, approve, record, and reconcile financial transactions. System access must reflect the approved SoD matrix.',
    category: 'Financial Reporting Controls',
    implementationGuidance:
      'Define SoD requirements specifically for financial system transactions: order-to-cash (create customers, enter orders, approve credit, record revenue, process receipts), procure-to-pay (create vendors, enter POs, approve invoices, process payments, record expenses), and record-to-report (prepare journal entries, approve journal entries, reconcile accounts, close periods). Configure financial system security roles to enforce SoD rules. Implement continuous monitoring for SoD violations. Require documented compensating controls for any approved exceptions. Review SoD configurations when system upgrades or role changes occur.',
    evidenceRequirements: [
      'Financial system SoD matrix covering order-to-cash, procure-to-pay, and record-to-report',
      'System role configurations enforcing SoD rules',
      'Continuous SoD monitoring reports',
      'SoD exception requests with business justification and compensating controls',
      'SoD violation investigation and resolution records',
      'SoD configuration review records for system upgrades and role changes',
    ],
    testProcedures: [
      'Review the financial system SoD matrix for completeness across key transaction cycles',
      'Test system role configurations to verify SoD enforcement for high-risk combinations',
      'Review SoD monitoring reports for the audit period and verify violation resolution',
      'Examine approved SoD exceptions for adequate compensating controls',
      'Verify SoD configurations were reviewed after recent system changes or upgrades',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // COMPLIANCE & GOVERNANCE
  // ============================================================
  {
    controlId: 'SOX-GOV-1',
    name: 'Section 302 - CEO/CFO Certifications',
    description:
      'The CEO and CFO must personally certify each quarterly and annual report filed with the SEC. Certifications attest that financial statements fairly present, in all material respects, the financial condition and results of operations, and that disclosure controls and procedures are effective.',
    category: 'Compliance & Governance',
    implementationGuidance:
      'Establish a sub-certification process where business unit leaders and functional area owners provide representations supporting the CEO/CFO certifications. Define a quarterly certification timeline aligned with SEC filing deadlines. Develop sub-certification questionnaires covering: accuracy of financial information, effectiveness of internal controls, disclosure of material events, and compliance with policies. Aggregate sub-certifications and prepare a certification package for CEO/CFO review. Schedule certification briefings for the CEO and CFO covering key financial results, control effectiveness, identified issues, and remediation status. Maintain executed certifications and supporting documentation.',
    evidenceRequirements: [
      'Sub-certification process documentation and timeline',
      'Sub-certification questionnaire templates',
      'Completed sub-certifications from business unit and functional leaders',
      'CEO/CFO certification briefing materials and meeting minutes',
      'Executed Section 302 certifications filed with the SEC',
      'Supporting documentation package maintained for each certification period',
    ],
    testProcedures: [
      'Verify Section 302 certifications were executed and filed for all required periods',
      'Review the sub-certification process and verify sub-certifications were collected from all required parties',
      'Confirm CEO/CFO certification briefings were conducted with appropriate content',
      'Verify sub-certifications are consistent with the final CEO/CFO certifications',
      'Review supporting documentation packages for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-GOV-2',
    name: 'Section 404 - Internal Control Assessment',
    description:
      'Management must assess the effectiveness of internal control over financial reporting (ICFR) as of year-end and include a report on the assessment in the annual filing. The assessment must be based on a recognized framework (COSO) and must identify any material weaknesses.',
    category: 'Compliance & Governance',
    implementationGuidance:
      'Adopt the COSO Internal Control-Integrated Framework (2013) as the assessment framework. Define the scope of ICFR assessment including significant accounts, relevant assertions, and key processes/controls. Conduct risk assessment to identify areas of significant risk. Document all key controls through process narratives and control matrices. Test key controls for design effectiveness and operating effectiveness throughout the year. Evaluate identified deficiencies and classify as control deficiencies, significant deficiencies, or material weaknesses. Prepare management\'s report on ICFR for inclusion in the annual filing. Coordinate with external auditors on the audit of ICFR.',
    evidenceRequirements: [
      'COSO framework adoption documentation',
      'ICFR scope determination (significant accounts, assertions, processes)',
      'Risk assessment documentation identifying areas of significant risk',
      'Process narratives and control matrices for key controls',
      'Control testing plans and results (design and operating effectiveness)',
      'Deficiency evaluation and classification documentation',
      'Management\'s report on ICFR',
      'External auditor coordination records',
    ],
    testProcedures: [
      'Verify the ICFR assessment is based on the COSO framework',
      'Review the scoping methodology for completeness of significant accounts and processes',
      'Verify risk assessment was performed and documented',
      'Review control testing results for adequate sample sizes and conclusions',
      'Verify deficiency evaluation and classification methodology is appropriate',
      'Confirm management\'s ICFR report is included in the annual filing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-GOV-3',
    name: 'Section 906 - Criminal Certification Requirements',
    description:
      'The CEO and CFO must certify that the periodic report containing financial statements fully complies with SEC requirements and fairly presents, in all material respects, the financial condition and results of operations. Knowing violations carry criminal penalties including fines and imprisonment.',
    category: 'Compliance & Governance',
    implementationGuidance:
      'Ensure the Section 906 certification process is integrated with the Section 302 certification process but addresses the additional criminal penalty provisions. Educate the CEO and CFO on the specific requirements and penalties associated with Section 906 (up to $5 million fine and 20 years imprisonment for willful violations). Coordinate with legal counsel to ensure proper certification language is used. Maintain executed certifications as exhibits to SEC filings. Ensure the supporting certification package provides the CEO and CFO with sufficient information to make the certification in good faith.',
    evidenceRequirements: [
      'Section 906 certification policy and procedures',
      'Executed Section 906 certifications as exhibits to SEC filings',
      'Legal counsel review and approval of certification language',
      'CEO/CFO education records on Section 906 requirements and penalties',
      'Supporting certification packages demonstrating sufficient basis for certification',
    ],
    testProcedures: [
      'Verify Section 906 certifications were executed for all required SEC filings',
      'Confirm certification language complies with statutory requirements',
      'Verify legal counsel reviewed and approved the certifications',
      'Confirm certifications are filed as exhibits to the periodic reports',
      'Review supporting documentation for sufficiency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-GOV-4',
    name: 'Whistleblower Protections and Reporting',
    description:
      'The organization must establish procedures for the receipt, retention, and treatment of complaints regarding accounting, internal accounting controls, or auditing matters. Employees must be able to submit confidential, anonymous concerns without fear of retaliation.',
    category: 'Compliance & Governance',
    implementationGuidance:
      'Establish a confidential and anonymous reporting mechanism (ethics hotline, web portal, email) managed by an independent third party or the audit committee. Publicize the reporting mechanism through employee communications, intranet, and physical postings. Implement procedures for: receiving complaints, logging them in a secure system, triaging based on severity, investigating complaints, tracking resolution, and reporting to the audit committee. Establish anti-retaliation policies protecting whistleblowers. Train all employees on the reporting mechanism and anti-retaliation protections. Report complaint metrics and significant findings to the audit committee quarterly.',
    evidenceRequirements: [
      'Whistleblower reporting mechanism documentation (hotline, portal, email)',
      'Employee communications publicizing the reporting mechanism',
      'Complaint intake, triage, and investigation procedures',
      'Anti-retaliation policy approved by the audit committee',
      'Complaint log and resolution tracking records (anonymized)',
      'Quarterly reports to the audit committee on complaint metrics and findings',
      'Employee training records on whistleblower procedures and protections',
    ],
    testProcedures: [
      'Test the whistleblower reporting mechanism by submitting a test complaint and verifying receipt',
      'Verify the mechanism supports anonymous and confidential submissions',
      'Review complaint investigation procedures for thoroughness and independence',
      'Confirm anti-retaliation policies are in place and communicated to employees',
      'Verify quarterly reports to the audit committee include complaint metrics and significant findings',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-GOV-5',
    name: 'Document Retention and Preservation',
    description:
      'The organization must establish and enforce a document retention policy covering financial records, audit workpapers, communications, and electronic records. SOX requires retention of audit workpapers for at least 7 years and prohibits destruction of records related to federal investigations.',
    category: 'Compliance & Governance',
    implementationGuidance:
      'Develop a comprehensive document retention policy covering: financial records (invoices, contracts, ledgers), audit workpapers and supporting documentation, electronic communications (emails related to financial matters), board and committee meeting minutes, and SEC filings and supporting documents. Define retention periods: 7 years for audit workpapers and supporting documents, permanent for SEC filings, and as required by applicable regulations for other categories. Implement a legal hold process to preserve documents when litigation or investigation is anticipated. Configure electronic systems to enforce retention periods automatically. Conduct annual training on document retention requirements.',
    evidenceRequirements: [
      'Document retention policy with defined retention periods by record category',
      'Legal hold policy and procedures',
      'Electronic records management system configuration showing retention enforcement',
      'Legal hold notification templates and active hold inventory',
      'Annual training records on document retention requirements',
      'Destruction logs for records that have exceeded retention periods (with approval)',
    ],
    testProcedures: [
      'Review the document retention policy for compliance with SOX retention requirements',
      'Verify electronic systems are configured to enforce retention periods',
      'Test the legal hold process by simulating a hold and verifying proper preservation',
      'Verify destruction of records is documented with appropriate approval',
      'Confirm annual training was completed by relevant personnel',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-GOV-6',
    name: 'Audit Committee Oversight',
    description:
      'The audit committee of the board of directors must provide independent oversight of financial reporting, internal controls, and the external audit process. The committee must include at least one financial expert, hold regular meetings, and have direct authority over the external auditor.',
    category: 'Compliance & Governance',
    implementationGuidance:
      'Ensure the audit committee charter defines: authority to appoint, compensate, and oversee the external auditor; responsibility for oversight of financial reporting and internal controls; authority to engage independent advisors; pre-approval of all audit and non-audit services; and procedures for handling complaints about accounting matters. Verify all committee members are independent directors and at least one qualifies as a financial expert under SEC rules. Schedule at least quarterly meetings with formal agendas. Ensure the committee receives regular reports from management, internal audit, and external auditors. Maintain detailed meeting minutes documenting discussions, decisions, and action items.',
    evidenceRequirements: [
      'Audit committee charter defining authority and responsibilities',
      'Committee member independence certifications and financial expert designation',
      'Meeting schedules and agendas for the audit period',
      'Meeting minutes documenting discussions, decisions, and action items',
      'Pre-approval records for audit and non-audit services',
      'Reports from management, internal audit, and external auditors to the committee',
      'Audit committee annual self-assessment records',
    ],
    testProcedures: [
      'Review the audit committee charter for compliance with SOX requirements',
      'Verify all committee members are independent and at least one is designated as a financial expert',
      'Confirm the committee met at least quarterly during the audit period',
      'Review meeting minutes for evidence of active oversight of financial reporting, controls, and the external audit',
      'Verify pre-approval records exist for all audit and non-audit services',
    ],
    status: 'Not Started',
  },
];
