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

  // ============================================================
  // IT GENERAL CONTROLS (ITGC) - SECURITY
  // ============================================================
  {
    controlId: 'SOX-ITGC-SEC-1',
    name: 'Network Security and Perimeter Protection',
    description:
      'Network security controls must protect financially significant systems from unauthorized access, including firewalls, intrusion detection/prevention systems, and network segmentation. Critical financial systems must be isolated in secure network zones.',
    category: 'IT General Controls - Security',
    implementationGuidance:
      'Implement defense-in-depth network security including: perimeter firewalls with deny-by-default rules, network segmentation isolating financial systems in dedicated VLANs or subnets, intrusion detection and prevention systems (IDS/IPS) monitoring traffic to financial systems, web application firewalls (WAF) for internet-facing financial applications, and DMZ architecture for external-facing services. Conduct quarterly firewall rule reviews to remove unnecessary rules and verify alignment with business requirements. Implement network access control (NAC) to prevent unauthorized devices from connecting. Monitor and alert on suspicious network activity targeting financial systems.',
    evidenceRequirements: [
      'Network architecture diagram showing segmentation of financial systems',
      'Firewall configurations and rule sets for financial system zones',
      'IDS/IPS configuration and monitoring procedures',
      'Quarterly firewall rule review records with approval',
      'Network access control (NAC) policy and configuration',
      'Network security monitoring alerts and incident response records',
    ],
    testProcedures: [
      'Review network architecture to verify financial systems are appropriately segmented',
      'Test firewall rules to confirm only authorized traffic can reach financial systems',
      'Verify IDS/IPS is actively monitoring and alerting on financial system traffic',
      'Confirm quarterly firewall rule reviews were completed with documented approvals',
      'Test network access controls by attempting to connect an unauthorized device',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-SEC-2',
    name: 'Vulnerability Management',
    description:
      'A vulnerability management program must identify, assess, and remediate security vulnerabilities in systems supporting financial reporting. Regular vulnerability scanning and timely patching must be performed on all in-scope systems.',
    category: 'IT General Controls - Security',
    implementationGuidance:
      'Implement a vulnerability management program covering all in-scope financial systems. Conduct authenticated vulnerability scans at least monthly for critical systems and quarterly for all in-scope systems. Prioritize remediation based on CVSS scores and business impact: critical vulnerabilities within 7 days, high within 30 days, medium within 90 days. Track remediation progress and report to management monthly. Implement compensating controls when immediate patching is not feasible. Conduct annual penetration testing of financial systems by an independent party. Maintain a vulnerability exception process requiring business justification and compensating controls.',
    evidenceRequirements: [
      'Vulnerability management policy with scanning frequency and remediation timelines',
      'Vulnerability scan reports for in-scope financial systems',
      'Remediation tracking records showing resolution within defined timelines',
      'Vulnerability exception requests with business justification and compensating controls',
      'Annual penetration test report and remediation plan',
      'Monthly vulnerability management reports to management',
    ],
    testProcedures: [
      'Verify vulnerability scans were conducted at the required frequency for in-scope systems',
      'Review scan results and confirm critical and high vulnerabilities were remediated within defined timelines',
      'Examine vulnerability exceptions for appropriate justification and compensating controls',
      'Review the most recent penetration test report and verify findings were addressed',
      'Confirm monthly vulnerability reports were provided to management',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-SEC-3',
    name: 'Endpoint Security',
    description:
      'Endpoint security controls must protect workstations and servers accessing or hosting financial data. Controls must include anti-malware protection, endpoint detection and response, and secure configuration baselines.',
    category: 'IT General Controls - Security',
    implementationGuidance:
      'Deploy enterprise endpoint protection on all systems accessing or processing financial data. Implement next-generation anti-malware with real-time scanning and behavioral analysis. Deploy endpoint detection and response (EDR) capabilities for advanced threat detection and investigation. Establish secure configuration baselines (hardening standards) for workstations and servers based on CIS benchmarks or equivalent. Disable unnecessary services and protocols. Implement application whitelisting on critical financial servers. Conduct monthly compliance scans against configuration baselines. Ensure endpoint protection cannot be disabled by end users.',
    evidenceRequirements: [
      'Endpoint security policy covering anti-malware, EDR, and hardening requirements',
      'Anti-malware deployment and signature update reports',
      'EDR deployment and alert monitoring procedures',
      'Secure configuration baselines (hardening standards) for workstations and servers',
      'Monthly configuration compliance scan results',
      'Application whitelisting configuration for critical servers',
    ],
    testProcedures: [
      'Verify endpoint protection is deployed on all in-scope systems',
      'Confirm anti-malware signatures are updated at least daily',
      'Review EDR alerts and incident response for a sample period',
      'Test configuration compliance against hardening baselines for a sample of systems',
      'Verify endpoint protection cannot be disabled by standard users',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-SEC-4',
    name: 'Security Information and Event Management (SIEM)',
    description:
      'Security events from financially significant systems must be centrally collected, correlated, and monitored in real time. Security alerts must be investigated and escalated according to defined procedures.',
    category: 'IT General Controls - Security',
    implementationGuidance:
      'Implement a SIEM solution to aggregate security logs from all in-scope financial systems, including operating systems, databases, applications, network devices, and security tools. Define use cases and correlation rules for detecting threats to financial systems: unauthorized access attempts, privilege escalation, data exfiltration indicators, and anomalous user behavior. Establish a security operations center (SOC) or managed security service to monitor SIEM alerts 24/7 or during business hours based on risk. Define escalation procedures for different alert severity levels. Conduct regular tuning to reduce false positives while maintaining detection effectiveness. Retain security logs for at least one year.',
    evidenceRequirements: [
      'SIEM architecture documentation showing coverage of in-scope systems',
      'Log sources and collection configuration for financial systems',
      'Use cases and correlation rules targeting financial system threats',
      'Alert monitoring and escalation procedures',
      'Sample security alerts and investigation records',
      'Log retention configuration demonstrating one-year minimum retention',
    ],
    testProcedures: [
      'Verify all in-scope financial systems are sending logs to the SIEM',
      'Review use cases and correlation rules for adequacy in detecting financial system threats',
      'Examine security alert investigation records for appropriate response and documentation',
      'Test detection capabilities by simulating a suspicious event and verifying alert generation',
      'Confirm log retention meets the one-year minimum requirement',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-SEC-5',
    name: 'Data Encryption and Protection',
    description:
      'Sensitive financial data must be encrypted at rest and in transit. Encryption key management must follow secure practices including key rotation, secure storage, and access controls.',
    category: 'IT General Controls - Security',
    implementationGuidance:
      'Implement encryption for financial data at rest in databases, file systems, and backups using AES-256 or equivalent. Encrypt all data in transit using TLS 1.2 or higher for network communications and SFTP/SCP for file transfers. Implement a key management solution or HSM for secure key storage. Define key rotation schedules: annual rotation for data encryption keys, more frequent for high-risk keys. Segregate key management duties so no single individual controls both encrypted data and decryption keys. Document and test key recovery procedures. Conduct annual cryptographic reviews to ensure algorithms and key lengths remain appropriate.',
    evidenceRequirements: [
      'Data encryption policy specifying encryption requirements and algorithms',
      'Database and file system encryption configurations',
      'TLS configuration for in-transit encryption',
      'Key management procedures including rotation schedules',
      'HSM or key management solution configuration',
      'Key recovery procedure documentation and test records',
      'Annual cryptographic review records',
    ],
    testProcedures: [
      'Verify financial databases are encrypted at rest using approved algorithms',
      'Test TLS configuration to confirm TLS 1.2+ is enforced for financial system communications',
      'Review key rotation records to verify keys were rotated on schedule',
      'Verify segregation of duties between data access and key management',
      'Test key recovery procedures in a non-production environment',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITGC-SEC-6',
    name: 'Security Awareness and Training',
    description:
      'Personnel with access to financially significant systems must receive security awareness training on protecting financial data, recognizing threats, and complying with security policies. Training must be completed annually and upon initial access.',
    category: 'IT General Controls - Security',
    implementationGuidance:
      'Develop a security awareness training program tailored to personnel with financial system access. Include topics: protecting sensitive financial information, recognizing phishing and social engineering attacks, secure password practices, reporting security incidents, and compliance with security policies. Require completion within 30 days of gaining access to financial systems and annually thereafter. Conduct periodic phishing simulations to assess awareness and provide targeted training for those who fail. Track training completion and report compliance to management. Provide role-specific training for privileged users, developers, and other specialized roles.',
    evidenceRequirements: [
      'Security awareness training policy and curriculum',
      'Training completion records for personnel with financial system access',
      'Phishing simulation results and remedial training records',
      'Role-specific training materials for privileged users and developers',
      'Training compliance reports to management',
      'Annual training effectiveness assessment records',
    ],
    testProcedures: [
      'Verify security awareness training curriculum covers appropriate topics for financial system users',
      'Confirm all personnel with financial system access completed training within required timelines',
      'Review phishing simulation results and verify remedial training was provided',
      'Verify role-specific training was completed by privileged users and developers',
      'Confirm training compliance reports were provided to management',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ENTITY-LEVEL CONTROLS
  // ============================================================
  {
    controlId: 'SOX-ELC-1',
    name: 'Control Environment - Tone at the Top',
    description:
      'Senior management and the board of directors must demonstrate commitment to integrity, ethical values, and effective internal control. The tone at the top must be communicated throughout the organization and reinforced through actions and policies.',
    category: 'Entity-Level Controls',
    implementationGuidance:
      'Develop and communicate a code of conduct approved by the board that emphasizes integrity, ethical behavior, and the importance of internal controls. Require annual acknowledgment of the code by all employees. Hold senior leadership accountable for control effectiveness in their areas. Include control effectiveness in performance evaluations for management. Conduct periodic ethics and compliance communications from senior leadership. Establish clear consequences for code of conduct violations, applied consistently regardless of position. Monitor and address ethical concerns promptly. Report control environment matters to the audit committee regularly.',
    evidenceRequirements: [
      'Code of conduct approved by the board of directors',
      'Employee code of conduct acknowledgment records',
      'Senior leadership communications on ethics and controls',
      'Management performance evaluation criteria including control effectiveness',
      'Code of conduct violation investigation and resolution records',
      'Audit committee reports on control environment matters',
    ],
    testProcedures: [
      'Review the code of conduct for comprehensiveness and board approval',
      'Verify code of conduct acknowledgments are collected from all employees annually',
      'Review senior leadership communications for emphasis on ethics and controls',
      'Confirm management performance evaluations include control effectiveness criteria',
      'Review code of conduct violations for consistent enforcement',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ELC-2',
    name: 'Risk Assessment Process',
    description:
      'The organization must maintain a formal risk assessment process to identify and analyze risks to achieving financial reporting objectives. Risk assessments must consider internal and external factors, likelihood, and impact, and must be updated at least annually.',
    category: 'Entity-Level Controls',
    implementationGuidance:
      'Establish a formal enterprise risk management (ERM) process with specific focus on financial reporting risks. Identify risks from internal sources (process changes, new systems, organizational changes) and external sources (regulatory changes, economic conditions, industry trends). Assess each risk for likelihood and impact using a consistent methodology. Define risk tolerance levels approved by management. Develop risk response strategies: accept, mitigate, transfer, or avoid. Map financial reporting risks to specific controls. Update the risk assessment at least annually and when significant changes occur. Report risk assessment results to the audit committee.',
    evidenceRequirements: [
      'Enterprise risk management policy and methodology',
      'Financial reporting risk register with likelihood and impact assessments',
      'Risk tolerance definitions approved by management',
      'Risk response strategies and action plans',
      'Risk-to-control mapping documentation',
      'Annual risk assessment update records',
      'Audit committee reports on risk assessment results',
    ],
    testProcedures: [
      'Review the risk assessment methodology for comprehensiveness and consistency',
      'Verify the risk register includes relevant financial reporting risks',
      'Confirm risk assessments consider both internal and external factors',
      'Verify risk response strategies are defined and implemented for significant risks',
      'Confirm the risk assessment was updated within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ELC-3',
    name: 'Information and Communication',
    description:
      'Relevant and reliable information must be identified, captured, and communicated in a form and timeframe that enables personnel to carry out their financial reporting responsibilities. Communication must flow in all directions: downward, upward, and across the organization.',
    category: 'Entity-Level Controls',
    implementationGuidance:
      'Establish processes to capture information relevant to financial reporting from internal and external sources. Define information requirements for each financial reporting role. Implement systems and reports that provide timely, accurate, and complete information to support financial reporting. Establish communication channels for reporting control issues and concerns upward to management. Communicate financial reporting policies, procedures, and changes to affected personnel. Provide channels for business units to communicate significant events and transactions to finance. Maintain open communication lines with external parties (auditors, regulators, investors).',
    evidenceRequirements: [
      'Information flow diagrams for financial reporting processes',
      'Financial reporting role definitions with information requirements',
      'Communication procedures for control issues and concerns',
      'Policy and procedure communication records',
      'Significant event reporting procedures and records',
      'External party communication procedures and records',
    ],
    testProcedures: [
      'Review information flows to verify relevant data reaches financial reporting personnel',
      'Verify communication channels exist for reporting control issues upward',
      'Confirm policy and procedure changes were communicated to affected personnel',
      'Review significant event reporting for timely communication to finance',
      'Verify external communications with auditors and regulators are appropriately managed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ELC-4',
    name: 'Monitoring of Controls',
    description:
      'The effectiveness of internal controls must be monitored through ongoing activities and separate evaluations. Control deficiencies must be identified, communicated, and corrected in a timely manner. The monitoring program must cover both entity-level and process-level controls.',
    category: 'Entity-Level Controls',
    implementationGuidance:
      'Implement a comprehensive control monitoring program combining ongoing monitoring (built into business processes) and separate evaluations (internal audit, self-assessments). Define monitoring activities for each key control. Establish key risk indicators (KRIs) and key control indicators (KCIs) with thresholds triggering investigation. Conduct periodic control self-assessments by control owners. Require internal audit to test high-risk controls annually. Establish a deficiency tracking process covering identification, evaluation, remediation planning, and closure verification. Report control monitoring results and deficiency status to management and the audit committee.',
    evidenceRequirements: [
      'Control monitoring program documentation with coverage and frequency',
      'Key risk indicators and key control indicators with thresholds',
      'Control self-assessment procedures and completed assessments',
      'Internal audit control testing plans and results',
      'Deficiency tracking log with evaluation and remediation records',
      'Management and audit committee reports on control monitoring results',
    ],
    testProcedures: [
      'Review the control monitoring program for adequate coverage of key controls',
      'Verify KRIs and KCIs are defined and monitored with appropriate thresholds',
      'Confirm control self-assessments were completed by control owners',
      'Review internal audit testing results for high-risk controls',
      'Verify deficiencies were tracked through remediation and closure',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ELC-5',
    name: 'Organizational Structure and Authority',
    description:
      'The organizational structure must support effective internal control with clear reporting lines, defined authority and responsibility, and appropriate accountability. Roles critical to financial reporting must have defined competency requirements.',
    category: 'Entity-Level Controls',
    implementationGuidance:
      'Maintain an organizational structure that clearly defines reporting relationships and authority for financial reporting functions. Document roles and responsibilities for key financial reporting positions in job descriptions. Define competency requirements (education, experience, certifications) for personnel in financial reporting roles. Implement appropriate spans of control to ensure adequate supervision. Establish clear delegation of authority with documented limits. Ensure the CFO and controller have sufficient authority and independence. Review organizational structure changes for impact on financial reporting controls.',
    evidenceRequirements: [
      'Organizational charts for finance and IT functions',
      'Job descriptions for key financial reporting positions',
      'Competency requirements and verification records for financial roles',
      'Delegation of authority matrix with documented limits',
      'Organizational change impact assessment records',
      'CFO/Controller reporting line and authority documentation',
    ],
    testProcedures: [
      'Review organizational structure for clear reporting lines and appropriate authority',
      'Verify job descriptions exist for key financial reporting positions',
      'Confirm personnel in financial roles meet defined competency requirements',
      'Review delegation of authority for appropriate limits and documentation',
      'Verify organizational changes were assessed for impact on financial reporting controls',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // FRAUD RISK MANAGEMENT
  // ============================================================
  {
    controlId: 'SOX-FRM-1',
    name: 'Fraud Risk Assessment',
    description:
      'The organization must conduct periodic fraud risk assessments to identify and evaluate fraud risks that could affect financial reporting. The assessment must consider incentives, opportunities, and rationalization for fraud, as well as management override of controls.',
    category: 'Fraud Risk Management',
    implementationGuidance:
      'Conduct annual fraud risk assessments focusing on financial reporting fraud. Apply the fraud triangle framework (incentive/pressure, opportunity, rationalization) to identify fraud risks. Consider specific fraud schemes: fraudulent financial reporting (revenue manipulation, expense timing), misappropriation of assets, and management override of controls. Assess inherent risk and residual risk after considering controls. Identify fraud indicators and warning signs. Involve internal audit, legal, and compliance in the assessment. Document anti-fraud controls that address identified risks. Report fraud risk assessment results to the audit committee.',
    evidenceRequirements: [
      'Fraud risk assessment methodology and framework',
      'Annual fraud risk assessment documentation',
      'Fraud risk register with identified schemes and risk ratings',
      'Anti-fraud control mapping to identified risks',
      'Fraud indicator and warning sign documentation',
      'Audit committee reports on fraud risk assessment results',
    ],
    testProcedures: [
      'Review the fraud risk assessment methodology for alignment with fraud triangle framework',
      'Verify the assessment considers financial reporting fraud, asset misappropriation, and management override',
      'Confirm anti-fraud controls are mapped to identified risks',
      'Verify the assessment was conducted within the last 12 months',
      'Confirm results were reported to the audit committee',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRM-2',
    name: 'Anti-Fraud Programs and Controls',
    description:
      'The organization must implement programs and controls to prevent, detect, and respond to fraud. This includes management oversight, anti-fraud training, fraud detection analytics, and a fraud response plan.',
    category: 'Fraud Risk Management',
    implementationGuidance:
      'Develop and implement a comprehensive anti-fraud program including: fraud prevention controls (segregation of duties, authorization requirements, access controls), fraud detection controls (data analytics, exception monitoring, reconciliations), fraud awareness training for employees, management fraud detection activities (variance analysis, trend monitoring), and fraud investigation and response procedures. Implement data analytics to detect anomalies and patterns indicative of fraud (Benford\'s Law analysis, duplicate detection, unusual timing patterns). Establish a fraud response plan defining investigation procedures, evidence preservation, and reporting requirements.',
    evidenceRequirements: [
      'Anti-fraud program documentation',
      'Fraud prevention control inventory',
      'Fraud detection analytics and monitoring reports',
      'Fraud awareness training materials and completion records',
      'Management fraud detection activity documentation',
      'Fraud response plan and investigation procedures',
    ],
    testProcedures: [
      'Review the anti-fraud program for comprehensiveness (prevention, detection, response)',
      'Verify fraud prevention controls address identified fraud risks',
      'Review fraud detection analytics output and investigation of flagged items',
      'Confirm fraud awareness training was completed by employees',
      'Verify the fraud response plan includes investigation, evidence preservation, and reporting procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRM-3',
    name: 'Management Override Controls',
    description:
      'Controls must specifically address the risk of management override of internal controls, which is inherent in any control environment. This includes unpredictable procedures, journal entry reviews, and audit committee oversight of unusual transactions.',
    category: 'Fraud Risk Management',
    implementationGuidance:
      'Implement controls specifically targeting management override risk: require audit committee review and approval of unusual or significant transactions, implement unpredictable audit procedures (surprise audits, unannounced counts), require independent review of journal entries made by management, analyze accounting estimates for bias (compare estimates to actual outcomes), review significant year-end adjusting entries, monitor for transactions without apparent business purpose, and implement dual authorization for high-risk transactions above management thresholds. Ensure internal audit has direct access to the audit committee.',
    evidenceRequirements: [
      'Management override risk control matrix',
      'Audit committee review records for unusual transactions',
      'Unpredictable audit procedure schedules and results',
      'Management journal entry review and approval records',
      'Accounting estimate bias analysis documentation',
      'Significant year-end adjustment review records',
    ],
    testProcedures: [
      'Review controls specifically designed to address management override risk',
      'Verify audit committee reviewed and approved unusual or significant transactions',
      'Confirm unpredictable audit procedures were conducted during the period',
      'Review management journal entries for independent review and approval',
      'Verify accounting estimates were analyzed for potential bias',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRM-4',
    name: 'Related Party Transaction Controls',
    description:
      'Controls must ensure that related party transactions are identified, properly authorized, reviewed for business purpose, and disclosed appropriately in financial statements. Related party relationships must be monitored on an ongoing basis.',
    category: 'Fraud Risk Management',
    implementationGuidance:
      'Establish procedures to identify related parties and their transactions: maintain a related party registry updated at least annually, require key personnel to disclose relationships that could create related parties, screen new vendors and customers against the related party registry, implement transaction monitoring to detect undisclosed related party transactions. Require audit committee or independent board approval for material related party transactions. Ensure related party transactions are at arm\'s length or have documented business purpose. Coordinate with external auditors on related party identification and disclosure.',
    evidenceRequirements: [
      'Related party policy and procedures',
      'Related party registry with annual update records',
      'Key personnel relationship disclosure questionnaires',
      'Related party transaction screening procedures and results',
      'Audit committee approval records for material related party transactions',
      'Related party disclosure documentation for financial statements',
    ],
    testProcedures: [
      'Review the related party registry for completeness and current updates',
      'Verify key personnel completed relationship disclosure questionnaires',
      'Test transaction screening against the related party registry',
      'Review audit committee approvals for material related party transactions',
      'Verify related party disclosures in financial statements are complete',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FRM-5',
    name: 'Fraud Investigation and Response',
    description:
      'The organization must have established procedures for investigating suspected fraud, preserving evidence, taking appropriate remedial action, and reporting findings to appropriate parties including the audit committee and external auditors when required.',
    category: 'Fraud Risk Management',
    implementationGuidance:
      'Establish a fraud investigation protocol covering: initial assessment of allegations, evidence preservation (legal hold, system access suspension), investigation procedures (interviews, document review, forensic analysis), documentation requirements, legal privilege considerations, determination of findings, remedial action recommendations, and reporting procedures. Define roles and responsibilities for fraud investigations (internal audit, legal, HR, forensics). Establish reporting requirements for suspected and confirmed fraud to the audit committee and external auditors. Document lessons learned and control improvements from fraud incidents.',
    evidenceRequirements: [
      'Fraud investigation policy and procedures',
      'Investigation role and responsibility matrix',
      'Evidence preservation procedures and legal hold templates',
      'Sample fraud investigation reports (anonymized)',
      'Audit committee and external auditor notification records',
      'Lessons learned and control improvement documentation',
    ],
    testProcedures: [
      'Review fraud investigation procedures for comprehensiveness',
      'Verify evidence preservation procedures include legal hold and access suspension',
      'Confirm roles and responsibilities are clearly defined for investigations',
      'Review investigation reports for appropriate documentation and conclusions',
      'Verify audit committee and external auditors were notified of significant fraud matters',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // THIRD-PARTY AND VENDOR MANAGEMENT
  // ============================================================
  {
    controlId: 'SOX-TPM-1',
    name: 'Service Organization Risk Assessment and Due Diligence',
    description:
      'Third-party service providers that process or host financial data must undergo risk assessment and due diligence before engagement. The assessment must evaluate the provider\'s control environment, financial stability, and compliance posture.',
    category: 'Third-Party and Vendor Management',
    implementationGuidance:
      'Implement a third-party risk assessment process for service providers with access to financial data or systems. Conduct due diligence including: review of SOC reports (SOC 1 Type II for financial processing, SOC 2 for technology services), financial stability assessment, information security assessment, compliance certifications review, reference checks, and business continuity assessment. Categorize vendors by risk level based on data access, criticality, and control reliance. Require more extensive due diligence for high-risk vendors. Document due diligence findings and risk acceptance decisions.',
    evidenceRequirements: [
      'Third-party risk assessment policy and procedures',
      'Vendor risk categorization criteria and assessments',
      'Due diligence documentation for in-scope service providers',
      'SOC report review records with complementary user entity control (CUEC) gap analysis',
      'Vendor financial stability assessments',
      'Risk acceptance documentation for identified gaps',
    ],
    testProcedures: [
      'Review the third-party risk assessment methodology for comprehensiveness',
      'Verify risk assessments were completed for in-scope service providers',
      'Review SOC reports for service providers and verify CUEC gaps were addressed',
      'Confirm due diligence was conducted before vendor engagement',
      'Review risk acceptance decisions for appropriate authority and documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TPM-2',
    name: 'Service Organization Agreements and SLAs',
    description:
      'Contracts with service organizations processing financial data must include appropriate terms for security requirements, control requirements, audit rights, data protection, service levels, and incident notification.',
    category: 'Third-Party and Vendor Management',
    implementationGuidance:
      'Develop standard contract clauses for service provider agreements covering: security and control requirements, right to audit clause, annual SOC report delivery requirement, data protection and confidentiality, incident notification timelines (within 24-72 hours), business continuity requirements, subcontractor approval and flow-down requirements, termination and transition assistance, and data return/destruction upon termination. Define SLAs for availability, performance, and recovery time objectives. Review contracts with legal and IT security before execution. Maintain a contract repository with renewal tracking.',
    evidenceRequirements: [
      'Standard contract clause templates for service provider agreements',
      'Executed contracts with in-scope service providers',
      'SLA definitions and performance reporting',
      'Right to audit clause documentation',
      'Contract review and approval records',
      'Contract repository with renewal tracking',
    ],
    testProcedures: [
      'Review contracts with in-scope service providers for required security and control clauses',
      'Verify audit rights and SOC report delivery requirements are included',
      'Confirm incident notification timelines are specified',
      'Verify SLAs are defined and performance is monitored',
      'Review contract renewal tracking for timely renewals',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TPM-3',
    name: 'Service Organization Monitoring',
    description:
      'Ongoing monitoring must be performed to ensure service organizations maintain appropriate controls and meet contractual obligations. Monitoring must include SOC report reviews, performance monitoring, and periodic reassessments.',
    category: 'Third-Party and Vendor Management',
    implementationGuidance:
      'Establish an ongoing monitoring program for service providers handling financial data. Obtain and review annual SOC reports: assess the auditor\'s opinion, review control exceptions and management responses, evaluate complementary user entity controls for implementation in your organization. Monitor SLA performance through regular reporting and dashboards. Conduct periodic risk reassessments (annually for high-risk vendors). Participate in or conduct periodic on-site assessments for critical vendors. Track and follow up on identified issues until resolution. Maintain regular communication with service provider account teams.',
    evidenceRequirements: [
      'Service organization monitoring program documentation',
      'Annual SOC report review records with exception analysis',
      'Complementary user entity control (CUEC) implementation evidence',
      'SLA performance monitoring reports and dashboards',
      'Annual risk reassessment records for high-risk vendors',
      'Issue tracking and resolution records for service provider concerns',
    ],
    testProcedures: [
      'Verify SOC reports were obtained and reviewed for all in-scope service providers',
      'Review SOC report analysis for identified exceptions and management responses',
      'Confirm CUECs are implemented in your control environment',
      'Verify SLA performance is monitored and issues are addressed',
      'Confirm annual risk reassessments were completed for high-risk vendors',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TPM-4',
    name: 'Fourth-Party and Subcontractor Risk Management',
    description:
      'Risks associated with subcontractors and fourth parties used by service providers must be identified and managed. Service providers must disclose material subcontractors and ensure appropriate controls flow down to subcontractors.',
    category: 'Third-Party and Vendor Management',
    implementationGuidance:
      'Require service providers to disclose material subcontractors (fourth parties) as part of the contracting and monitoring process. Include subcontractor approval rights in contracts. Require service providers to flow down security and control requirements to subcontractors. Review SOC reports for inclusion of subcontractor controls or carve-outs requiring separate assessment. Assess concentration risk where multiple vendors rely on the same fourth party. Establish procedures to assess critical fourth parties directly when subcontractor carve-outs exist in SOC reports.',
    evidenceRequirements: [
      'Fourth-party risk management policy and procedures',
      'Subcontractor disclosure requirements in contracts',
      'Material subcontractor inventory from service providers',
      'SOC report analysis identifying subcontractor carve-outs',
      'Fourth-party assessment records for material carve-outs',
      'Concentration risk assessment for fourth parties',
    ],
    testProcedures: [
      'Verify contracts require subcontractor disclosure and approval',
      'Review subcontractor inventories provided by service providers',
      'Identify subcontractor carve-outs in SOC reports and verify separate assessment',
      'Review concentration risk for critical fourth parties',
      'Confirm control requirements flow down to subcontractors',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TPM-5',
    name: 'Service Organization Termination and Transition',
    description:
      'Procedures must be in place for terminating service provider relationships in an orderly manner, ensuring data is returned or destroyed, access is revoked, and transition to alternative providers is managed without disruption to financial reporting.',
    category: 'Third-Party and Vendor Management',
    implementationGuidance:
      'Develop service provider termination and transition procedures covering: notification requirements and timelines, transition planning and knowledge transfer, data extraction and migration, data return certification and destruction verification, access revocation for all personnel and systems, return of company assets (equipment, documentation), final settlement of contractual obligations, and post-termination audit rights. Maintain contingency plans for critical service providers including alternative provider identification. Conduct tabletop exercises for critical vendor termination scenarios. Ensure transition clauses are included in contracts.',
    evidenceRequirements: [
      'Service provider termination and transition procedures',
      'Transition clause requirements in contracts',
      'Contingency plans for critical service providers',
      'Termination checklist templates',
      'Data return/destruction certifications from terminated providers',
      'Transition tabletop exercise records for critical vendors',
    ],
    testProcedures: [
      'Review termination procedures for completeness and practicality',
      'Verify contracts include transition assistance and data return clauses',
      'Confirm contingency plans exist for critical service providers',
      'Review data return/destruction certifications from recent terminations',
      'Verify tabletop exercises were conducted for critical vendor scenarios',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // BUSINESS CONTINUITY
  // ============================================================
  {
    controlId: 'SOX-BC-1',
    name: 'Business Impact Analysis for Financial Reporting',
    description:
      'A business impact analysis (BIA) must be conducted to identify critical processes, systems, and resources required for financial reporting. The BIA must define recovery time objectives (RTO) and recovery point objectives (RPO) for financially significant systems.',
    category: 'Business Continuity',
    implementationGuidance:
      'Conduct a business impact analysis specifically covering financial reporting processes and supporting systems. Identify all processes required for financial close and reporting, their dependencies, and the resources required. Assess the impact of disruption over time (financial, operational, regulatory, reputational). Define recovery time objectives (maximum acceptable downtime) and recovery point objectives (maximum acceptable data loss) for each critical system. Prioritize recovery based on financial close deadlines and regulatory filing requirements. Update the BIA at least annually and when significant changes occur.',
    evidenceRequirements: [
      'Business impact analysis methodology and scope',
      'BIA results for financial reporting processes and systems',
      'RTO and RPO definitions for financially significant systems',
      'Impact assessment documentation (financial, operational, regulatory)',
      'Recovery priority list based on BIA results',
      'Annual BIA update and review records',
    ],
    testProcedures: [
      'Review the BIA methodology for alignment with best practices',
      'Verify BIA coverage includes all financially significant systems and processes',
      'Confirm RTOs and RPOs are defined and approved for critical systems',
      'Verify recovery priorities align with financial reporting requirements',
      'Confirm the BIA was updated within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-BC-2',
    name: 'Business Continuity and Disaster Recovery Plans',
    description:
      'Business continuity and disaster recovery (BC/DR) plans must be documented, approved, and maintained for financially significant systems. Plans must enable recovery within defined RTOs and RPOs to support financial reporting obligations.',
    category: 'Business Continuity',
    implementationGuidance:
      'Develop comprehensive BC/DR plans covering: financial close and reporting processes, supporting IT systems and infrastructure, key personnel roles and responsibilities, communication procedures, recovery procedures and checklists, alternate work locations, and vendor coordination. Ensure plans address various scenarios (site failure, system failure, pandemic, cyber attack). Align recovery procedures with defined RTOs and RPOs. Maintain plans in accessible locations (cloud-based, offsite copies). Assign ownership and require annual review and approval. Distribute plans to all personnel with recovery responsibilities.',
    evidenceRequirements: [
      'Business continuity plans for financial reporting processes',
      'IT disaster recovery plans for financially significant systems',
      'Recovery procedures and checklists',
      'Alternate work location procedures',
      'Plan ownership assignment and distribution records',
      'Annual plan review and approval records',
    ],
    testProcedures: [
      'Review BC/DR plans for completeness and alignment with BIA requirements',
      'Verify plans address various disruption scenarios',
      'Confirm recovery procedures can achieve defined RTOs and RPOs',
      'Verify plans are accessible from alternate locations',
      'Confirm plans were reviewed and approved within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-BC-3',
    name: 'BC/DR Testing and Exercises',
    description:
      'Business continuity and disaster recovery plans must be tested periodically to validate their effectiveness. Testing must include tabletop exercises, functional testing, and full recovery tests for critical financial systems.',
    category: 'Business Continuity',
    implementationGuidance:
      'Implement a BC/DR testing program with various test types: tabletop exercises (at least semi-annually) to walk through scenarios and validate procedures, functional tests (at least annually) to verify specific recovery capabilities, and full recovery tests (at least annually for critical systems) to validate end-to-end recovery. Develop test plans with success criteria based on RTOs and RPOs. Document test results, issues identified, and lessons learned. Track remediation of identified issues. Report test results and plan updates to management. Conduct unannounced tests periodically to assess real-world readiness.',
    evidenceRequirements: [
      'BC/DR testing program with test types and frequencies',
      'Test plans with scenarios and success criteria',
      'Tabletop exercise records with participant attendance and outcomes',
      'Functional and full recovery test results',
      'Issues identified during testing and remediation tracking',
      'Test result reports to management',
    ],
    testProcedures: [
      'Review the BC/DR testing program for appropriate frequency and coverage',
      'Verify tabletop exercises were conducted at least semi-annually',
      'Review test results to confirm RTOs and RPOs were achieved',
      'Verify issues identified during testing were remediated',
      'Confirm test results were reported to management',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-BC-4',
    name: 'Crisis Communication and Escalation',
    description:
      'Crisis communication and escalation procedures must be established to ensure timely notification of key stakeholders during disruptions affecting financial reporting. Communication plans must cover internal and external parties.',
    category: 'Business Continuity',
    implementationGuidance:
      'Develop crisis communication procedures covering: escalation criteria and triggers, notification chains and contact lists, communication templates for various scenarios, roles and responsibilities for crisis communication, internal communication (employees, management, board), and external communication (auditors, regulators, investors). Maintain current contact lists with multiple contact methods. Establish communication tools that function during outages (emergency notification systems, personal devices). Define communication frequency during extended incidents. Coordinate with corporate communications and investor relations for external messaging.',
    evidenceRequirements: [
      'Crisis communication and escalation procedures',
      'Escalation criteria and notification triggers',
      'Contact lists with multiple contact methods',
      'Communication templates for various scenarios',
      'Emergency notification system configuration',
      'Crisis communication test records',
    ],
    testProcedures: [
      'Review crisis communication procedures for completeness',
      'Verify contact lists are current and include backup contacts',
      'Confirm emergency notification systems are configured and tested',
      'Review communication templates for appropriateness',
      'Verify escalation criteria clearly define when to notify key stakeholders',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // INTERNAL AUDIT
  // ============================================================
  {
    controlId: 'SOX-IA-1',
    name: 'Internal Audit Independence and Authority',
    description:
      'The internal audit function must have appropriate independence, authority, and access to fulfill its responsibilities for evaluating internal controls over financial reporting. Internal audit must report functionally to the audit committee.',
    category: 'Internal Audit',
    implementationGuidance:
      'Establish internal audit charter defining: functional reporting to the audit committee and administrative reporting to management, authority to access personnel, records, and systems, responsibility for evaluating internal controls and risk management, independence from operational responsibilities, and prohibition from performing operational duties that would compromise objectivity. Require audit committee approval of the internal audit charter, annual plan, and budget. Ensure the CAE has direct access to the audit committee without management filtering. Conduct periodic external quality assessments of the internal audit function.',
    evidenceRequirements: [
      'Internal audit charter approved by the audit committee',
      'Organizational chart showing internal audit reporting lines',
      'Audit committee meeting attendance records for CAE',
      'Annual internal audit plan with audit committee approval',
      'Internal audit budget with audit committee approval',
      'External quality assessment reports',
    ],
    testProcedures: [
      'Review the internal audit charter for appropriate authority and independence',
      'Verify internal audit reports functionally to the audit committee',
      'Confirm the CAE has direct access to the audit committee',
      'Verify the annual audit plan and budget were approved by the audit committee',
      'Review external quality assessment results and remediation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-IA-2',
    name: 'Risk-Based Internal Audit Planning',
    description:
      'Internal audit must develop an annual audit plan based on risk assessment that provides appropriate coverage of internal controls over financial reporting. The plan must address high-risk areas and key controls supporting management\'s ICFR assessment.',
    category: 'Internal Audit',
    implementationGuidance:
      'Develop the annual internal audit plan using a risk-based methodology. Consider risk inputs from: enterprise risk assessment, management\'s ICFR scoping, prior year audit results, regulatory changes, business changes, and fraud risk assessment. Ensure adequate coverage of key controls supporting management\'s Section 404 assessment. Prioritize audits based on risk: higher frequency and depth for high-risk areas. Include IT general controls, application controls, and entity-level controls in the plan. Allow flexibility for emerging risks and special projects. Present the plan to the audit committee for approval.',
    evidenceRequirements: [
      'Internal audit risk assessment methodology',
      'Annual internal audit plan with risk justification',
      'Mapping of audit plan to management\'s ICFR key controls',
      'Audit committee approval records for the annual plan',
      'Plan vs. actual tracking for audit completion',
      'Emerging risk assessment and plan amendments',
    ],
    testProcedures: [
      'Review the internal audit risk assessment methodology for comprehensiveness',
      'Verify the audit plan provides coverage of high-risk areas and key ICFR controls',
      'Confirm the audit plan was approved by the audit committee',
      'Review plan execution and completion rates',
      'Verify the plan was updated for emerging risks during the year',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-IA-3',
    name: 'Internal Audit Execution and Reporting',
    description:
      'Internal audits must be conducted according to professional standards with appropriate testing methodology, evidence documentation, and timely reporting of findings. Audit reports must be distributed to management and the audit committee.',
    category: 'Internal Audit',
    implementationGuidance:
      'Conduct internal audits in accordance with IIA Standards (International Standards for the Professional Practice of Internal Auditing). For each audit: develop audit programs with testing procedures, select appropriate sample sizes based on risk, perform testing of control design and operating effectiveness, document work performed and evidence obtained, evaluate findings and develop recommendations, prepare draft reports for management response, and issue final reports with agreed action plans. Apply professional skepticism and maintain objectivity. Distribute reports to management with copies or summaries to the audit committee. Track remediation of findings.',
    evidenceRequirements: [
      'Internal audit methodology aligned with IIA Standards',
      'Audit programs and testing procedures',
      'Workpapers documenting testing performed and evidence obtained',
      'Sample size determination methodology',
      'Draft and final audit reports',
      'Management responses and action plans',
      'Finding remediation tracking',
    ],
    testProcedures: [
      'Review internal audit methodology for alignment with IIA Standards',
      'Select sample audits and review workpapers for adequate documentation',
      'Verify sample sizes are appropriate for the control and risk level',
      'Review audit reports for clear communication of findings and recommendations',
      'Verify findings are tracked through remediation and closure',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-IA-4',
    name: 'Coordination with External Auditors',
    description:
      'Internal audit must coordinate with external auditors to ensure efficient coverage of internal controls, avoid duplication of effort, and maximize reliance on each other\'s work where appropriate.',
    category: 'Internal Audit',
    implementationGuidance:
      'Establish a coordination protocol with external auditors covering: sharing of risk assessments and audit plans, agreement on areas where external auditors will rely on internal audit work, communication of internal audit findings relevant to the financial statement audit, joint planning meetings at the beginning of the audit cycle, and ongoing communication during the audit period. Ensure internal audit work that external auditors will rely upon meets their standards for competence, objectivity, and documentation. Coordinate timing of testing to avoid duplication. Share lessons learned and emerging risks.',
    evidenceRequirements: [
      'External auditor coordination protocol',
      'Joint planning meeting records and agreed coverage',
      'Areas of reliance agreed with external auditors',
      'Internal audit findings shared with external auditors',
      'Communication records during the audit period',
      'Coordination efficiency assessment',
    ],
    testProcedures: [
      'Review the coordination protocol with external auditors',
      'Verify joint planning meetings were conducted',
      'Confirm areas of reliance were agreed and documented',
      'Verify internal audit findings were shared with external auditors',
      'Assess the effectiveness of coordination in avoiding duplication',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // DISCLOSURE CONTROLS
  // ============================================================
  {
    controlId: 'SOX-DC-1',
    name: 'Disclosure Committee and Process',
    description:
      'A disclosure committee must be established to review and evaluate the effectiveness of disclosure controls and procedures. The committee must ensure that material information is identified, evaluated, and disclosed in SEC filings on a timely basis.',
    category: 'Disclosure Controls',
    implementationGuidance:
      'Establish a disclosure committee with cross-functional representation including finance, legal, investor relations, and relevant business unit leaders. Define the committee charter specifying: responsibility for evaluating disclosure controls effectiveness, authority to gather information from all company personnel, procedures for identifying potentially material information, processes for drafting and reviewing SEC filings, and escalation procedures for disagreements. Schedule regular meetings aligned with SEC filing deadlines. Implement a disclosure questionnaire process to gather information from business units. Document committee deliberations and decisions.',
    evidenceRequirements: [
      'Disclosure committee charter defining authority and responsibilities',
      'Committee member roster with cross-functional representation',
      'Meeting schedules aligned with SEC filing deadlines',
      'Meeting minutes documenting deliberations and decisions',
      'Disclosure questionnaire templates and completed questionnaires',
      'SEC filing review and approval records',
    ],
    testProcedures: [
      'Review the disclosure committee charter for appropriate authority and scope',
      'Verify committee membership includes appropriate cross-functional representation',
      'Confirm committee meetings were held in advance of each SEC filing',
      'Review meeting minutes for evidence of thorough deliberation on material matters',
      'Verify disclosure questionnaires were collected and reviewed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-DC-2',
    name: 'Material Information Identification',
    description:
      'Procedures must be in place to identify and evaluate information that may be material to investors and require disclosure. Material events and transactions must be escalated to the disclosure committee on a timely basis.',
    category: 'Disclosure Controls',
    implementationGuidance:
      'Develop materiality guidelines for identifying information requiring disclosure. Define quantitative thresholds (e.g., percentage of revenue, assets, net income) and qualitative factors (investor interest, regulatory impact, reputation risk). Establish processes for business units to identify and report potentially material events: significant contracts, litigation, regulatory actions, accounting changes, related party transactions, and cybersecurity incidents. Implement real-time escalation procedures for time-sensitive material events. Train business unit leaders on materiality concepts and reporting responsibilities. Maintain a log of potentially material items evaluated by the disclosure committee.',
    evidenceRequirements: [
      'Materiality guidelines with quantitative and qualitative criteria',
      'Material event identification and reporting procedures',
      'Business unit training records on materiality and reporting',
      'Material event escalation records with timestamps',
      'Disclosure committee evaluation log for potentially material items',
      'Documentation of materiality assessments and conclusions',
    ],
    testProcedures: [
      'Review materiality guidelines for appropriate quantitative and qualitative criteria',
      'Verify procedures exist for business units to report potentially material events',
      'Review material event escalation records for timeliness',
      'Confirm disclosure committee evaluated all escalated items',
      'Verify business unit leaders received training on materiality and reporting',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-DC-3',
    name: 'SEC Filing Preparation and Review',
    description:
      'SEC filings must be prepared following a documented process with appropriate reviews, fact-checking, and approvals. The filing process must ensure accuracy, completeness, and compliance with SEC requirements and GAAP.',
    category: 'Disclosure Controls',
    implementationGuidance:
      'Establish a comprehensive SEC filing preparation process including: filing calendar with milestones and deadlines, role assignments for drafting, reviewing, and approving sections, fact-checking and tie-out procedures to supporting documentation, cross-reference checks between filing sections, legal review for compliance with SEC regulations, technical XBRL/iXBRL tagging review, final read-through by senior executives, and sign-off procedures before submission. Implement a filing checklist to ensure all steps are completed. Use collaborative document management with version control. Conduct post-filing reviews to identify process improvements.',
    evidenceRequirements: [
      'SEC filing preparation procedures and calendar',
      'Role assignments for drafting, review, and approval',
      'Fact-checking and tie-out documentation',
      'Legal compliance review records',
      'XBRL/iXBRL tagging review records',
      'Filing checklist completion records',
      'Final executive sign-off records',
      'Post-filing review and improvement documentation',
    ],
    testProcedures: [
      'Review SEC filing procedures for completeness and appropriate controls',
      'Verify filing calendar milestones were met for recent filings',
      'Review fact-checking and tie-out documentation for accuracy',
      'Confirm legal compliance review was completed',
      'Verify final executive sign-offs were obtained before filing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-DC-4',
    name: 'Regulation FD Compliance',
    description:
      'Controls must ensure compliance with Regulation Fair Disclosure (Reg FD), which requires that material nonpublic information disclosed to certain parties must be simultaneously disclosed to the public. Policies must govern communications with analysts, investors, and media.',
    category: 'Disclosure Controls',
    implementationGuidance:
      'Develop a Regulation FD compliance program including: policy defining material nonpublic information and prohibited selective disclosure, designated spokespersons authorized to communicate with analysts, investors, and media, pre-approval procedures for external communications and presentations, investor relations guidelines for earnings calls and conferences, monitoring of social media communications by company personnel, procedures for handling inadvertent disclosures (public disclosure within 24 hours), and training for personnel who may interact with external parties. Maintain records of all external communications and presentations.',
    evidenceRequirements: [
      'Regulation FD compliance policy and procedures',
      'Designated spokesperson list with authorization records',
      'External communication pre-approval records',
      'Investor relations communication guidelines',
      'Training records for Reg FD compliance',
      'External communication and presentation logs',
      'Inadvertent disclosure response records (if applicable)',
    ],
    testProcedures: [
      'Review Reg FD policy for appropriate scope and procedures',
      'Verify designated spokespersons are identified and authorized',
      'Review pre-approval records for external communications',
      'Confirm training was completed by relevant personnel',
      'Review external communication logs for compliance with procedures',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // REVENUE RECOGNITION & ORDER-TO-CASH CONTROLS
  // ============================================================
  {
    controlId: 'SOX-REV-1',
    name: 'Revenue Recognition Policy Compliance',
    description:
      'Revenue must be recognized in accordance with applicable accounting standards (ASC 606) and company revenue recognition policies. Controls must ensure revenue is recorded when performance obligations are satisfied and at the correct transaction price.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Document comprehensive revenue recognition policies aligned with ASC 606, covering the five-step model: identify contracts, identify performance obligations, determine transaction price, allocate transaction price, and recognize revenue upon satisfaction. Define specific policies for each revenue stream and product/service type. Implement system configurations to enforce revenue recognition rules. Require finance review of non-standard contracts and arrangements. Conduct periodic training for sales and finance personnel on revenue recognition requirements. Establish monitoring controls to detect deviations from policy.',
    evidenceRequirements: [
      'Revenue recognition policy aligned with ASC 606',
      'Revenue stream-specific recognition criteria documentation',
      'System configuration documentation for automated revenue recognition',
      'Non-standard contract review and approval records',
      'Revenue recognition training materials and completion records',
      'Revenue recognition compliance monitoring reports',
    ],
    testProcedures: [
      'Review revenue recognition policies for compliance with ASC 606',
      'Select a sample of revenue transactions and verify recognition timing aligns with policy',
      'Test system configurations for automated revenue recognition accuracy',
      'Review non-standard contract approvals for appropriate revenue treatment',
      'Verify training was completed by relevant personnel',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-2',
    name: 'Customer Contract Management',
    description:
      'Customer contracts must be properly executed, approved, and maintained in a centralized repository. Contract terms affecting revenue recognition must be accurately captured in billing and financial systems.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Implement a contract lifecycle management system or centralized contract repository. Require contracts to be reviewed and approved by authorized personnel before execution. Define approval authority matrices based on contract value and terms. Capture key contract terms in a structured format: pricing, payment terms, delivery obligations, warranties, return rights, and variable consideration. Ensure contract terms are accurately entered into billing and ERP systems. Implement contract amendment procedures requiring re-evaluation of revenue recognition. Conduct periodic contract audits for completeness and accuracy.',
    evidenceRequirements: [
      'Contract management policy and procedures',
      'Contract approval authority matrix',
      'Centralized contract repository with executed agreements',
      'Contract data entry procedures for billing/ERP systems',
      'Contract amendment review and approval records',
      'Periodic contract audit reports',
    ],
    testProcedures: [
      'Select a sample of contracts and verify proper execution and approval',
      'Verify contract terms are accurately reflected in billing systems',
      'Review contract amendments for proper re-evaluation of revenue recognition',
      'Test contract repository for completeness against sales records',
      'Verify approval authority matrix is followed for contract approvals',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-3',
    name: 'Sales Order Processing and Approval',
    description:
      'Sales orders must be accurately entered into the system with proper authorization. Credit checks and approval workflows must be completed before orders are fulfilled to minimize credit risk and ensure accurate revenue recording.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Implement a sales order management system with automated workflows. Require all orders to reference an approved customer contract or standard terms. Implement credit check integration that evaluates customer creditworthiness before order acceptance. Define credit limits by customer with approval requirements for orders exceeding limits. Require management approval for orders with non-standard terms, significant discounts, or extended payment terms. Implement edit checks to prevent incomplete or invalid orders. Segregate order entry from order approval and fulfillment functions.',
    evidenceRequirements: [
      'Sales order processing procedures',
      'Order entry system configuration and edit checks',
      'Credit check and approval workflow documentation',
      'Customer credit limit maintenance records',
      'Non-standard order approval records',
      'Segregation of duties evidence for order processing',
    ],
    testProcedures: [
      'Select a sample of sales orders and verify proper approval and credit check completion',
      'Test edit checks by attempting to enter invalid or incomplete orders',
      'Verify orders exceeding credit limits received appropriate approval',
      'Confirm segregation of duties between order entry, approval, and fulfillment',
      'Review non-standard order approvals for appropriate authorization',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-4',
    name: 'Shipping and Delivery Verification',
    description:
      'Shipment of goods must be properly documented with proof of delivery. Revenue recognition timing must align with transfer of control to the customer based on shipping terms and delivery confirmation.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Implement shipping and logistics controls that capture proof of delivery. Document shipping terms (FOB shipping point, FOB destination, etc.) for each customer and order. Configure systems to recognize revenue based on applicable shipping terms and actual delivery dates. Require carrier delivery confirmation or customer acknowledgment for FOB destination terms. Implement cutoff procedures to ensure shipments near period-end are recorded in the correct period. Reconcile shipping records to sales and inventory records. Track and investigate shipment discrepancies and returns.',
    evidenceRequirements: [
      'Shipping and delivery procedures',
      'Shipping terms documentation by customer/contract',
      'Proof of delivery records (carrier confirmations, signed receipts)',
      'Revenue recognition system configuration for delivery-based recognition',
      'Period-end shipping cutoff analysis and support',
      'Shipping-to-sales reconciliation records',
    ],
    testProcedures: [
      'Select a sample of shipments and verify proof of delivery documentation',
      'Test revenue recognition timing against shipping terms and delivery dates',
      'Review period-end cutoff procedures and verify proper revenue timing',
      'Reconcile shipping records to recorded revenue for a sample period',
      'Verify returns and discrepancies were properly investigated and recorded',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-5',
    name: 'Customer Invoicing Controls',
    description:
      'Customer invoices must be generated accurately based on contract terms and delivered goods/services. Invoice accuracy controls must verify pricing, quantities, and terms match the underlying agreement and fulfillment records.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Implement automated invoice generation from sales order and fulfillment data. Configure pricing rules in the billing system to match contract terms. Implement three-way matching (order, shipment/delivery, invoice) for goods or service verification for services. Require approval for manual invoices and invoice adjustments. Implement invoice accuracy checks: price validation against contract, quantity validation against shipment, tax calculation verification. Generate and review invoice exception reports. Establish procedures for invoice corrections and credit memos.',
    evidenceRequirements: [
      'Customer invoicing procedures',
      'Billing system pricing configuration documentation',
      'Three-way matching evidence (order, shipment, invoice)',
      'Manual invoice and adjustment approval records',
      'Invoice exception reports and resolution documentation',
      'Credit memo approval and issuance records',
    ],
    testProcedures: [
      'Select a sample of invoices and verify pricing matches contract terms',
      'Test three-way matching for a sample of invoiced orders',
      'Review invoice exceptions and verify proper resolution',
      'Verify manual invoices and adjustments received appropriate approval',
      'Test credit memo approvals for proper authorization',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-6',
    name: 'Accounts Receivable Recording and Aging',
    description:
      'Accounts receivable must be accurately recorded when invoices are issued and properly aged to support collectibility assessment. AR subledger must reconcile to the general ledger and aging must be monitored for collection follow-up.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Configure AR system to automatically record receivables upon invoice generation. Implement proper invoice dating and due date calculation based on payment terms. Generate accurate AR aging reports categorizing receivables by age (current, 30, 60, 90, 120+ days). Reconcile AR subledger to GL on at least a monthly basis. Investigate and resolve reconciling items within defined timelines. Implement AR monitoring dashboards for collection management. Define escalation procedures for past-due accounts.',
    evidenceRequirements: [
      'Accounts receivable recording procedures',
      'AR system configuration for automatic recording',
      'Monthly AR subledger to GL reconciliations',
      'AR aging reports with proper categorization',
      'Reconciling item investigation and resolution records',
      'Collection follow-up and escalation documentation',
    ],
    testProcedures: [
      'Verify AR subledger reconciles to GL for sample periods',
      'Review AR aging report accuracy by testing invoice dates and due dates',
      'Verify reconciling items were investigated and resolved timely',
      'Test AR recording by tracing invoices to subledger entries',
      'Review collection escalation for past-due accounts',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-7',
    name: 'Cash Receipts Processing',
    description:
      'Customer payments must be accurately recorded, properly applied to customer accounts, and deposited timely. Controls must ensure completeness of cash receipts and proper application to outstanding invoices.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Implement controls over all payment channels (checks, ACH, wire, credit card). Segregate cash handling from AR recording functions. Require dual custody for physical check handling. Implement lockbox services for high-volume check receipts. Apply payments to customer accounts within one business day of receipt. Require supervisory approval for payment applications that differ from invoice amounts. Reconcile daily cash receipts to bank deposits. Implement controls over unapplied cash and customer credits.',
    evidenceRequirements: [
      'Cash receipts processing procedures by payment type',
      'Segregation of duties evidence for cash handling and AR recording',
      'Lockbox agreement and processing procedures',
      'Daily cash receipts to bank deposit reconciliations',
      'Unapplied cash and customer credit reports and resolution',
      'Payment application exception approval records',
    ],
    testProcedures: [
      'Verify segregation of duties between cash handling and AR recording',
      'Select a sample of payments and verify timely and accurate application',
      'Reconcile daily cash receipts to bank deposits for a sample period',
      'Review unapplied cash aging and resolution',
      'Test payment application exceptions for proper approval',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-8',
    name: 'Bad Debt and Allowance for Doubtful Accounts',
    description:
      'An allowance for doubtful accounts must be maintained based on a systematic methodology. Bad debt expense must be recorded to reflect estimated uncollectible receivables, and write-offs must be properly authorized.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Develop and document a methodology for estimating the allowance for doubtful accounts considering: historical collection experience, aging analysis, customer-specific factors, economic conditions, and industry trends. Calculate the allowance at least quarterly using the documented methodology. Require management review and approval of the allowance calculation. Implement a bad debt write-off policy requiring documented collection efforts and appropriate approval. Reconcile the allowance account and maintain roll-forward documentation. Compare actual write-offs to prior estimates to assess methodology accuracy.',
    evidenceRequirements: [
      'Allowance for doubtful accounts policy and methodology',
      'Quarterly allowance calculation workpapers with supporting data',
      'Management review and approval of allowance estimates',
      'Bad debt write-off policy with approval requirements',
      'Write-off authorization records with collection effort documentation',
      'Allowance account reconciliation and roll-forward',
      'Estimate-to-actual comparison analysis',
    ],
    testProcedures: [
      'Review allowance methodology for reasonableness and compliance with GAAP',
      'Verify allowance calculations are supported by appropriate data and analysis',
      'Test management review and approval of allowance estimates',
      'Select a sample of write-offs and verify proper authorization and collection efforts',
      'Review estimate-to-actual comparisons and assess methodology accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-9',
    name: 'Revenue Cutoff and Period-End Procedures',
    description:
      'Revenue must be recorded in the correct accounting period. Period-end cutoff procedures must ensure transactions are recorded based on when performance obligations are satisfied and control transfers to the customer.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Implement revenue cutoff procedures that capture all shipments, deliveries, and service completions up to period-end. Review transactions near period-end for proper timing. Analyze shipping logs, delivery confirmations, and service completion records against recorded revenue. Implement post-close review of revenue recorded in the subsequent period for items that should have been recorded earlier. Analyze credit memos and returns in the subsequent period for potential prior-period adjustments. Document cutoff analysis and adjustments.',
    evidenceRequirements: [
      'Revenue cutoff procedures and checklists',
      'Period-end shipping and delivery cutoff analysis',
      'Subsequent period revenue review for prior-period items',
      'Credit memo and return analysis for prior-period adjustments',
      'Cutoff adjustment documentation and approval',
      'Service completion verification for period-end',
    ],
    testProcedures: [
      'Review cutoff procedures for adequacy',
      'Select transactions near period-end and verify proper revenue timing',
      'Analyze subsequent period revenue for items belonging to prior period',
      'Review credit memos and returns for potential cutoff issues',
      'Verify cutoff adjustments were properly approved and recorded',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-10',
    name: 'Deferred Revenue Management',
    description:
      'Deferred revenue must be accurately recorded for performance obligations not yet satisfied. Controls must ensure proper initial recording, systematic recognition, and accurate reporting of deferred revenue balances.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Identify all arrangements requiring deferred revenue treatment: prepayments, subscriptions, multi-element arrangements, and long-term contracts. Configure systems to automatically defer revenue based on arrangement type and recognize based on performance obligation satisfaction. Maintain deferred revenue schedules showing expected recognition timing. Reconcile deferred revenue subledger to GL monthly. Review deferred revenue balances for reasonableness based on open contracts and obligations. Implement controls over manual deferred revenue adjustments.',
    evidenceRequirements: [
      'Deferred revenue policy and procedures',
      'Deferred revenue system configuration documentation',
      'Deferred revenue schedules with recognition timing',
      'Monthly deferred revenue subledger to GL reconciliation',
      'Deferred revenue balance reasonableness review',
      'Manual deferred revenue adjustment approval records',
    ],
    testProcedures: [
      'Select a sample of deferred revenue items and verify proper initial recording',
      'Test deferred revenue recognition against contract terms and performance',
      'Reconcile deferred revenue subledger to GL for sample periods',
      'Review deferred revenue reasonableness against open contracts',
      'Verify manual adjustments received proper approval',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-11',
    name: 'Variable Consideration and Estimates',
    description:
      'Variable consideration elements (discounts, rebates, returns, incentives, price concessions) must be estimated and recorded at contract inception. Estimates must be updated each period and constrained to amounts highly probable of not reversing.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Identify all forms of variable consideration in customer arrangements. Develop estimation methodologies for each type: expected value method or most likely amount method based on circumstances. Document assumptions and data sources for estimates. Apply constraint to variable consideration to include only amounts highly probable of not significant reversal. Update estimates each reporting period based on new information. Maintain tracking of estimates against actual outcomes to assess methodology accuracy. Require management approval for significant variable consideration estimates.',
    evidenceRequirements: [
      'Variable consideration policy and estimation methodology',
      'Estimate calculations with assumptions and supporting data',
      'Constraint analysis documentation',
      'Quarterly estimate update workpapers',
      'Estimate-to-actual tracking and comparison',
      'Management approval records for significant estimates',
    ],
    testProcedures: [
      'Review variable consideration estimation methodologies for reasonableness',
      'Verify estimates are properly constrained per ASC 606 guidance',
      'Test estimate calculations for accuracy and completeness',
      'Review estimate-to-actual comparisons and assess methodology',
      'Verify management approval for significant estimates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-REV-12',
    name: 'Sales Returns and Allowances',
    description:
      'Sales returns and allowances must be properly estimated and recorded as a reduction to revenue. Actual returns must be processed timely and accurately, with the returns reserve adjusted based on experience.',
    category: 'Revenue Recognition & Order-to-Cash',
    implementationGuidance:
      'Develop a returns estimation methodology based on historical return rates, product-specific factors, and current market conditions. Record a returns reserve at revenue recognition for estimated returns. Process actual returns promptly: verify returned goods, issue credit memos, and adjust inventory. Reconcile returns reserve to supporting analysis. Track actual returns against estimates by product or customer segment. Adjust reserve methodology based on estimate-to-actual experience. Investigate unusual return patterns or spikes.',
    evidenceRequirements: [
      'Sales returns policy and estimation methodology',
      'Returns reserve calculation and supporting analysis',
      'Return processing procedures and documentation',
      'Credit memo issuance and approval records',
      'Returns reserve reconciliation',
      'Estimate-to-actual return tracking',
      'Unusual return investigation records',
    ],
    testProcedures: [
      'Review returns estimation methodology for reasonableness',
      'Test returns reserve calculation against supporting data',
      'Select a sample of returns and verify proper processing and credit issuance',
      'Compare actual returns to estimates and assess reserve adequacy',
      'Review investigation of unusual return patterns',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // PROCURE-TO-PAY CONTROLS
  // ============================================================
  {
    controlId: 'SOX-PTP-1',
    name: 'Vendor Master File Management',
    description:
      'The vendor master file must be accurately maintained with proper controls over additions, modifications, and deletions. Segregation of duties must prevent unauthorized vendor setup that could facilitate fraudulent payments.',
    category: 'Procure-to-Pay',
    implementationGuidance:
      'Implement a formal vendor onboarding process requiring due diligence before vendor activation: W-9 verification, bank account validation, business verification, and sanction screening. Segregate vendor master maintenance from purchase order creation and payment processing. Require documented approval for all vendor additions and banking changes. Implement system controls to flag duplicate vendors or vendors with employee-matching addresses. Conduct periodic vendor master reviews to identify inactive or suspicious vendors. Maintain audit trails of all vendor master changes.',
    evidenceRequirements: [
      'Vendor onboarding policy and procedures',
      'Vendor due diligence documentation (W-9, bank verification)',
      'Vendor addition and change approval records',
      'Segregation of duties evidence for vendor master maintenance',
      'Duplicate vendor and suspicious vendor reports',
      'Periodic vendor master review records',
      'Vendor master change audit trail',
    ],
    testProcedures: [
      'Select a sample of new vendors and verify due diligence was completed',
      'Verify vendor additions and banking changes received proper approval',
      'Confirm segregation of duties between vendor master and payment functions',
      'Review duplicate vendor reports and resolution',
      'Test vendor master audit trail for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PTP-2',
    name: 'Purchase Requisition and Authorization',
    description:
      'Purchase requisitions must be properly authorized based on dollar thresholds and budget availability. Controls must ensure only legitimate business purchases are initiated and approvals align with authority levels.',
    category: 'Procure-to-Pay',
    implementationGuidance:
      'Implement a purchase requisition system with approval workflows based on dollar amount and category. Define approval authority levels aligned with organizational hierarchy and spending limits. Require budget availability verification before requisition approval. Implement segregation between requisition initiation and approval. Require additional approvals for non-standard purchases or purchases exceeding budget. Implement commodity-specific approval requirements for specialized purchases. Maintain requisition records with approval documentation.',
    evidenceRequirements: [
      'Purchase requisition policy and procedures',
      'Approval authority matrix with dollar thresholds',
      'Requisition approval workflow configuration',
      'Budget verification procedures and evidence',
      'Sample requisitions with approval documentation',
      'Segregation of duties evidence for requisition processing',
    ],
    testProcedures: [
      'Select a sample of requisitions and verify proper approval per authority matrix',
      'Test budget verification process for requisitions',
      'Verify segregation of duties between requisition and approval',
      'Review non-standard purchase approvals for additional authorization',
      'Test approval workflow configuration against documented matrix',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PTP-3',
    name: 'Purchase Order Creation and Management',
    description:
      'Purchase orders must be created from approved requisitions with accurate terms matched to vendor agreements. PO changes must be controlled and approved to prevent unauthorized commitments.',
    category: 'Procure-to-Pay',
    implementationGuidance:
      'Create purchase orders only from approved requisitions or with separate PO approval. Verify PO terms match master agreements, contracts, or negotiated quotes. Implement system controls to prevent PO creation exceeding requisition amounts without approval. Require approval for PO changes including quantity increases, price changes, and delivery modifications. Segregate PO creation from requisition approval and goods receipt. Implement PO numbering controls to prevent duplicates or gaps. Track open POs and investigate aged items.',
    evidenceRequirements: [
      'Purchase order policy and procedures',
      'PO creation from requisition linkage evidence',
      'PO terms verification against contracts/agreements',
      'PO change approval records',
      'Segregation of duties evidence for PO processing',
      'Open PO aging reports and investigation records',
    ],
    testProcedures: [
      'Select a sample of POs and trace to approved requisitions',
      'Verify PO terms match vendor contracts or agreements',
      'Test PO changes for proper approval',
      'Confirm segregation of duties in PO processing',
      'Review open PO aging and resolution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PTP-4',
    name: 'Goods Receipt and Three-Way Matching',
    description:
      'Receipt of goods must be documented and verified against purchase orders. Three-way matching (PO, receipt, invoice) must be completed before payment to ensure payment only for goods actually received.',
    category: 'Procure-to-Pay',
    implementationGuidance:
      'Implement goods receipt procedures requiring physical verification of quantities and condition. Document receipt in the system referencing the PO number. Segregate receiving from purchasing and accounts payable functions. Implement automated three-way matching: compare invoice to PO (price, terms) and to goods receipt (quantity). Define matching tolerances and exception handling procedures. Require approval for payments outside matching tolerances. Track unmatched receipts and investigate aged items.',
    evidenceRequirements: [
      'Goods receipt procedures',
      'Receiving documentation (packing slips, inspection records)',
      'Three-way matching system configuration and tolerances',
      'Matching exception reports and resolution',
      'Segregation of duties evidence for receiving',
      'Unmatched receipt aging and investigation records',
    ],
    testProcedures: [
      'Select a sample of payments and verify three-way match completion',
      'Test matching tolerance configuration and exception handling',
      'Verify segregation of duties between receiving, purchasing, and AP',
      'Review matching exceptions for proper approval',
      'Test unmatched receipt investigation and resolution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PTP-5',
    name: 'Invoice Processing and Validation',
    description:
      'Vendor invoices must be validated for accuracy, proper authorization, and legitimate business purpose. Duplicate invoice controls must prevent paying the same invoice twice.',
    category: 'Procure-to-Pay',
    implementationGuidance:
      'Implement invoice receipt procedures (centralized mailbox, AP email, EDI). Validate invoice data: vendor information, invoice number, date, amounts, and payment terms. Check for duplicate invoices by vendor, invoice number, amount, and date. Verify invoice coding to proper GL accounts and cost centers. Require approval for invoices without POs (non-PO invoices) based on authority limits. Implement edit checks for unusual invoices: round amounts, sequential numbers, unusual patterns. Maintain invoice processing metrics and aging.',
    evidenceRequirements: [
      'Invoice processing procedures',
      'Invoice validation checklist and evidence',
      'Duplicate invoice check configuration and reports',
      'Non-PO invoice approval records',
      'Invoice coding review and approval',
      'Invoice processing aging and metrics reports',
    ],
    testProcedures: [
      'Select a sample of invoices and verify validation procedures were followed',
      'Test duplicate invoice detection by attempting duplicate entry',
      'Verify non-PO invoices received proper approval',
      'Review invoice coding for accuracy',
      'Test invoice exception handling and resolution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PTP-6',
    name: 'Accounts Payable Recording and Reconciliation',
    description:
      'Accounts payable must be accurately recorded when invoices are approved and properly aged. AP subledger must reconcile to the general ledger with timely resolution of reconciling items.',
    category: 'Procure-to-Pay',
    implementationGuidance:
      'Configure AP system to record liabilities upon invoice approval. Ensure proper invoice dating for accurate aging and accruals. Generate AP aging reports categorizing payables by due date and vendor. Reconcile AP subledger to GL at least monthly. Investigate and resolve reconciling items within defined timelines. Monitor AP aging to optimize payment timing and manage cash. Implement debit balance and credit balance reviews.',
    evidenceRequirements: [
      'Accounts payable recording procedures',
      'AP system configuration for automatic recording',
      'Monthly AP subledger to GL reconciliations',
      'AP aging reports with proper categorization',
      'Reconciling item investigation and resolution records',
      'Debit and credit balance review documentation',
    ],
    testProcedures: [
      'Verify AP subledger reconciles to GL for sample periods',
      'Test AP recording by tracing approved invoices to subledger',
      'Review AP aging accuracy by testing invoice dates and due dates',
      'Verify reconciling items were investigated and resolved timely',
      'Review debit and credit balance investigation and resolution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PTP-7',
    name: 'Payment Processing Controls',
    description:
      'Vendor payments must be properly authorized, accurately processed, and timely disbursed. Controls must prevent unauthorized payments and ensure payments are made only for legitimate obligations.',
    category: 'Procure-to-Pay',
    implementationGuidance:
      'Implement payment approval workflows based on amount thresholds. Require payment batch approval before release. Segregate payment initiation from payment approval and release. Verify payments against approved invoices (no payments without approved invoices). Implement positive pay or payee positive pay with the bank. Review and approve payment register before disbursement. Monitor for unusual payment patterns: same-day payments, payments to new vendors, payments outside normal cycles. Secure check stock and EFT credentials.',
    evidenceRequirements: [
      'Payment processing procedures',
      'Payment approval workflow configuration',
      'Payment batch approval records',
      'Segregation of duties evidence for payment processing',
      'Positive pay enrollment and exception reports',
      'Payment register review and approval records',
      'Check stock and EFT credential security documentation',
    ],
    testProcedures: [
      'Select a sample of payments and verify proper approval',
      'Verify segregation of duties in payment processing',
      'Review positive pay exception handling',
      'Test payment batch approval process',
      'Verify check stock security and access controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PTP-8',
    name: 'Expense Accruals and Cutoff',
    description:
      'Expenses must be recorded in the correct accounting period through proper accrual processes. Period-end cutoff procedures must ensure goods and services received are accrued when invoices have not yet been received.',
    category: 'Procure-to-Pay',
    implementationGuidance:
      'Implement expense accrual procedures for goods/services received but not invoiced (GRNI - goods received not invoiced). Run GRNI reports at period-end and accrue open receipts. Review purchase commitments for potential accruals. Analyze subsequent period invoices for items requiring prior-period accrual. Implement recurring accrual schedules for known ongoing expenses. Review and approve accrual entries. Compare accruals to actuals and adjust methodologies as needed.',
    evidenceRequirements: [
      'Expense accrual policy and procedures',
      'GRNI report and accrual calculation',
      'Purchase commitment analysis',
      'Subsequent invoice review for cutoff',
      'Recurring accrual schedules and support',
      'Accrual entry review and approval records',
      'Accrual-to-actual comparison analysis',
    ],
    testProcedures: [
      'Review GRNI accrual for completeness against open receipts',
      'Test subsequent period invoices for proper cutoff',
      'Verify accrual entries received appropriate approval',
      'Review recurring accruals for reasonableness',
      'Compare accruals to actual invoices received subsequently',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PTP-9',
    name: 'Employee Expense Reimbursement',
    description:
      'Employee expense reports must be properly submitted, approved, and reimbursed in accordance with company policy. Controls must verify expenses are legitimate, properly documented, and within policy limits.',
    category: 'Procure-to-Pay',
    implementationGuidance:
      'Implement an expense management system with policy-based validation rules. Require receipts for expenses above defined thresholds. Implement automated policy checks: per diem limits, category restrictions, receipt requirements. Require manager approval for all expense reports. Implement additional approvals for expenses exceeding thresholds or policy exceptions. Conduct periodic expense audits for compliance with policy. Monitor for unusual patterns: split transactions, repeated maximum amounts, personal expenses.',
    evidenceRequirements: [
      'Employee expense policy',
      'Expense management system configuration',
      'Sample expense reports with receipts and approvals',
      'Policy exception approval records',
      'Periodic expense audit reports',
      'Unusual expense pattern investigation records',
    ],
    testProcedures: [
      'Select a sample of expense reports and verify receipts and approval',
      'Test policy validation rules in the expense system',
      'Verify policy exceptions received additional approval',
      'Review expense audit findings and remediation',
      'Test segregation of duties in expense processing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PTP-10',
    name: 'Procurement Card (P-Card) Controls',
    description:
      'Procurement card usage must be controlled, monitored, and reconciled. P-card transactions must comply with policy limits and restrictions, with proper documentation and approval.',
    category: 'Procure-to-Pay',
    implementationGuidance:
      'Define P-card policy including eligible purchases, prohibited categories, single transaction limits, and monthly limits. Configure card controls with the issuer (MCC restrictions, spending limits). Require cardholders to submit transaction documentation and coding within defined timeframes. Implement manager review and approval of P-card statements. Reconcile P-card transactions to bank statements. Monitor for policy violations and unusual usage patterns. Conduct periodic P-card audits and compliance reviews.',
    evidenceRequirements: [
      'Procurement card policy',
      'Card control configuration documentation',
      'P-card statement review and approval records',
      'Transaction documentation and coding evidence',
      'P-card to bank reconciliations',
      'Policy violation reports and remediation',
      'Periodic P-card audit reports',
    ],
    testProcedures: [
      'Select a sample of P-card transactions and verify documentation and approval',
      'Test card control configurations against policy',
      'Verify P-card statements were reviewed and approved timely',
      'Review policy violations and corrective actions',
      'Test P-card reconciliation to bank statements',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // TREASURY & CASH MANAGEMENT CONTROLS
  // ============================================================
  {
    controlId: 'SOX-TRS-1',
    name: 'Bank Account Management',
    description:
      'Bank accounts must be properly authorized, documented, and controlled. Account opening, modification, and closing must follow formal procedures with appropriate approvals.',
    category: 'Treasury & Cash Management',
    implementationGuidance:
      'Implement formal bank account opening procedures requiring treasury and finance approval. Document authorized signatories and approval levels for each account. Maintain a comprehensive bank account inventory. Require documented approval for changes to authorized signatories. Conduct periodic reviews of bank accounts to identify unnecessary accounts for closure. Implement controls over bank tokens, credentials, and access. Coordinate with banks on fraud prevention services. Review bank fee schedules and service agreements.',
    evidenceRequirements: [
      'Bank account management policy',
      'Bank account opening approval records',
      'Bank account inventory with signatories and authorization levels',
      'Signatory change authorization records',
      'Periodic bank account review documentation',
      'Bank token and credential control procedures',
    ],
    testProcedures: [
      'Verify bank account inventory is complete and accurate',
      'Select a sample of accounts and verify proper opening authorization',
      'Test signatory changes for proper approval',
      'Review periodic account reviews and closures',
      'Verify bank token and credential security',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TRS-2',
    name: 'Bank Reconciliation',
    description:
      'Bank accounts must be reconciled to the general ledger on a timely basis. Reconciling items must be investigated and resolved, with proper segregation between reconciliation preparation and approval.',
    category: 'Treasury & Cash Management',
    implementationGuidance:
      'Reconcile all bank accounts to the GL at least monthly, within defined timeframes (e.g., 5 business days after month-end). Implement proper segregation: preparers should not have check signing authority or payment release access. Investigate all reconciling items, especially outstanding checks over 90 days and deposits in transit over 3 days. Document investigation results and resolution. Require independent review and approval of reconciliations. Escalate unresolved reconciling items to management. Maintain reconciliation history and supporting documentation.',
    evidenceRequirements: [
      'Bank reconciliation policy and procedures',
      'Monthly bank reconciliations with preparer and reviewer sign-off',
      'Reconciling item investigation documentation',
      'Outstanding check analysis and follow-up',
      'Segregation of duties evidence for reconciliation',
      'Escalation records for unresolved items',
    ],
    testProcedures: [
      'Verify reconciliations were completed timely for all accounts',
      'Review reconciling items for proper investigation and resolution',
      'Test segregation of duties between reconciliation and cash handling',
      'Verify independent review and approval of reconciliations',
      'Review outstanding items aging and follow-up actions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TRS-3',
    name: 'Wire Transfer and ACH Controls',
    description:
      'Wire transfers and ACH payments must be properly authorized, verified, and released. Dual authorization and callback verification must be implemented for high-risk transfers.',
    category: 'Treasury & Cash Management',
    implementationGuidance:
      'Implement dual authorization for wire transfers and ACH payments above defined thresholds. Require callback verification to a known contact for wires to new beneficiaries or above threshold amounts. Segregate wire initiation from wire release. Maintain an approved beneficiary list with verified banking details. Implement daily wire and ACH limits with the bank. Review and approve daily wire/ACH activity. Monitor for unusual patterns: timing, amounts, beneficiaries. Implement out-of-band authentication for wire releases.',
    evidenceRequirements: [
      'Wire transfer and ACH policy and procedures',
      'Dual authorization configuration and evidence',
      'Callback verification documentation',
      'Approved beneficiary list with verification',
      'Daily wire/ACH activity review and approval',
      'Segregation of duties evidence for wire processing',
    ],
    testProcedures: [
      'Select a sample of wire transfers and verify dual authorization',
      'Test callback verification for transfers to new beneficiaries',
      'Verify segregation of duties between initiation and release',
      'Review approved beneficiary list maintenance and verification',
      'Test daily activity review and approval process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TRS-4',
    name: 'Cash Forecasting and Liquidity Management',
    description:
      'Cash forecasts must be prepared regularly to ensure adequate liquidity for operations and obligations. Variances between forecasts and actual cash positions must be analyzed and explained.',
    category: 'Treasury & Cash Management',
    implementationGuidance:
      'Prepare rolling cash forecasts (13-week or longer) updated at least weekly. Incorporate inputs from AR collections, AP payments, payroll, debt service, capital expenditures, and other significant cash flows. Establish minimum cash balance targets and liquidity buffers. Monitor actual cash position against forecast and investigate significant variances. Report cash position and forecast to management regularly. Coordinate with business units on significant expected cash events. Maintain access to credit facilities for liquidity backup.',
    evidenceRequirements: [
      'Cash forecasting policy and procedures',
      'Rolling cash forecast documentation',
      'Forecast-to-actual variance analysis',
      'Minimum cash balance and liquidity policy',
      'Cash position reports to management',
      'Credit facility documentation and availability',
    ],
    testProcedures: [
      'Review cash forecast methodology and inputs',
      'Verify forecasts are updated and reviewed regularly',
      'Test forecast-to-actual variance analysis and explanations',
      'Verify minimum cash balance maintenance',
      'Review management reporting on cash position',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TRS-5',
    name: 'Investment Management',
    description:
      'Company investments must be made in accordance with board-approved investment policy. Investment transactions must be properly authorized, recorded, and valued, with appropriate custody arrangements.',
    category: 'Treasury & Cash Management',
    implementationGuidance:
      'Establish a board-approved investment policy defining: permitted investment types, credit quality requirements, concentration limits, maturity limits, and liquidity requirements. Authorize investment transactions in accordance with policy and delegation of authority. Maintain investment records including purchase date, cost basis, maturity, and fair value. Reconcile investment accounts to custodian statements. Obtain periodic fair value measurements from independent sources. Monitor compliance with investment policy limits. Report investment portfolio status to management and the board.',
    evidenceRequirements: [
      'Board-approved investment policy',
      'Investment transaction authorization records',
      'Investment portfolio documentation with cost and fair value',
      'Investment account reconciliations to custodian statements',
      'Fair value measurement documentation',
      'Investment policy compliance monitoring reports',
    ],
    testProcedures: [
      'Verify investment transactions comply with policy parameters',
      'Test investment transaction authorization',
      'Reconcile investment records to custodian statements',
      'Verify fair value measurements from independent sources',
      'Review investment policy compliance monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TRS-6',
    name: 'Debt Management and Compliance',
    description:
      'Debt instruments must be properly authorized, documented, and reported. Debt covenant compliance must be monitored and reported to ensure the organization remains in compliance with lending agreements.',
    category: 'Treasury & Cash Management',
    implementationGuidance:
      'Maintain complete documentation for all debt instruments: agreements, amendments, covenant calculations, and correspondence. Calculate and monitor debt covenants at required frequencies (typically quarterly). Prepare covenant compliance certificates for lenders. Track interest payments and principal repayments against schedules. Monitor debt maturity schedules and refinancing needs. Report debt position and covenant status to management and the board. Implement early warning processes for potential covenant violations.',
    evidenceRequirements: [
      'Debt management policy and procedures',
      'Debt instrument documentation (agreements, amendments)',
      'Covenant calculation workpapers',
      'Covenant compliance certificates to lenders',
      'Interest and principal payment records',
      'Debt maturity schedule and monitoring',
      'Covenant compliance reports to management',
    ],
    testProcedures: [
      'Review debt documentation for completeness',
      'Verify covenant calculations are accurate and complete',
      'Confirm compliance certificates were submitted timely',
      'Test interest and principal payment accuracy',
      'Review covenant compliance monitoring and reporting',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TRS-7',
    name: 'Foreign Currency Management',
    description:
      'Foreign currency transactions and exposures must be properly recorded and managed. Hedging activities must comply with policy and receive appropriate accounting treatment.',
    category: 'Treasury & Cash Management',
    implementationGuidance:
      'Identify and monitor foreign currency exposures from operations, intercompany transactions, and balance sheet items. Establish a foreign currency risk management policy defining hedging strategies and permitted instruments. Implement hedging transactions in accordance with policy with proper authorization. Document hedge designation and effectiveness testing for hedge accounting treatment. Record foreign currency gains and losses appropriately. Reconcile foreign currency accounts and revalue at period-end. Report foreign currency exposures and hedging activities to management.',
    evidenceRequirements: [
      'Foreign currency risk management policy',
      'Foreign currency exposure analysis and monitoring',
      'Hedge transaction authorization records',
      'Hedge designation and effectiveness documentation',
      'Foreign currency gain/loss calculations',
      'Foreign currency account reconciliations and revaluations',
    ],
    testProcedures: [
      'Review foreign currency exposure identification and monitoring',
      'Verify hedging transactions comply with policy',
      'Test hedge documentation for designation and effectiveness',
      'Verify foreign currency revaluations at period-end',
      'Review foreign currency gain/loss recording',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TRS-8',
    name: 'Petty Cash and Imprest Funds',
    description:
      'Petty cash and imprest funds must be controlled, reconciled, and replenished properly. Physical security and periodic counts must ensure fund integrity.',
    category: 'Treasury & Cash Management',
    implementationGuidance:
      'Establish petty cash and imprest fund policies defining authorized amounts, permitted uses, and documentation requirements. Assign custodian responsibility for each fund with signed acknowledgment. Require receipts and approval for all disbursements. Reconcile funds regularly (cash plus receipts equals authorized amount). Conduct surprise counts at least quarterly. Replenish funds through proper AP processing. Review fund necessity periodically and close unnecessary funds.',
    evidenceRequirements: [
      'Petty cash and imprest fund policy',
      'Fund authorization and custodian assignment records',
      'Disbursement receipts and approval documentation',
      'Fund reconciliation records',
      'Surprise count documentation',
      'Fund replenishment records',
    ],
    testProcedures: [
      'Verify fund authorizations and custodian assignments',
      'Conduct surprise count and reconcile to authorized amount',
      'Select sample disbursements and verify receipts and approval',
      'Review fund reconciliation frequency and accuracy',
      'Test replenishment processing through AP',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // PAYROLL & HUMAN CAPITAL CONTROLS
  // ============================================================
  {
    controlId: 'SOX-PAY-1',
    name: 'Employee Master File Management',
    description:
      'The employee master file must be accurately maintained with proper controls over additions, modifications, and terminations. Segregation of duties must prevent unauthorized changes that could result in fraudulent payments.',
    category: 'Payroll & Human Capital',
    implementationGuidance:
      'Implement formal employee onboarding procedures with documented approvals from HR and hiring managers. Verify employee identity and work authorization. Segregate employee master maintenance from payroll processing and approval. Require documented approval for all pay rate changes, direct deposit changes, and tax withholding changes. Implement system controls to flag unusual changes (significant pay increases, changes to own record). Conduct periodic employee master reviews comparing to HR records. Maintain audit trails of all employee master changes.',
    evidenceRequirements: [
      'Employee master file management procedures',
      'New hire documentation with approvals',
      'Pay rate and banking change approval records',
      'Segregation of duties evidence for master file maintenance',
      'Periodic master file review and reconciliation to HR records',
      'Employee master change audit trail',
    ],
    testProcedures: [
      'Select a sample of new hires and verify proper documentation and approval',
      'Test pay rate and banking changes for appropriate approval',
      'Verify segregation of duties between master file and payroll processing',
      'Review periodic master file reconciliation to HR records',
      'Test audit trail completeness for master file changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PAY-2',
    name: 'Time and Attendance Recording',
    description:
      'Employee time and attendance must be accurately recorded and approved before payroll processing. Controls must ensure employees are paid only for time actually worked.',
    category: 'Payroll & Human Capital',
    implementationGuidance:
      'Implement a time and attendance system for non-exempt employees. Require employees to record actual time worked (clock-in/out or timesheet entry). Require supervisor approval of time records before payroll processing. Implement edit checks for unusual time entries: excessive hours, work during holidays, time outside normal schedule. Monitor overtime and require pre-approval where practical. Investigate time record exceptions and amendments. Reconcile approved time to payroll inputs.',
    evidenceRequirements: [
      'Time and attendance policy and procedures',
      'Time recording system documentation',
      'Supervisor time approval evidence',
      'Overtime pre-approval records where applicable',
      'Time exception reports and investigation records',
      'Time-to-payroll reconciliation',
    ],
    testProcedures: [
      'Select a sample of employees and verify time approval',
      'Test time system edit checks for unusual entries',
      'Review overtime approval and monitoring',
      'Verify time exceptions were investigated',
      'Reconcile approved time to payroll for a sample period',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PAY-3',
    name: 'Payroll Processing and Approval',
    description:
      'Payroll must be accurately calculated, properly approved, and timely processed. Controls must ensure gross pay, deductions, and net pay are calculated correctly in accordance with employee records and applicable regulations.',
    category: 'Payroll & Human Capital',
    implementationGuidance:
      'Process payroll according to established schedules with defined cutoff dates. Calculate gross pay based on approved time records (hourly) or salary records (exempt). Apply mandatory deductions (taxes, garnishments) and voluntary deductions (benefits, 401k) accurately. Generate payroll register for review and approval before payment release. Implement segregation between payroll processing and payment approval/release. Verify payroll calculations for a sample of employees each period. Document and resolve payroll discrepancies before payment.',
    evidenceRequirements: [
      'Payroll processing procedures and calendar',
      'Payroll register review and approval records',
      'Payroll calculation verification documentation',
      'Segregation of duties evidence for payroll processing',
      'Payroll discrepancy investigation and resolution',
      'Deduction accuracy verification',
    ],
    testProcedures: [
      'Select a sample of employees and verify gross pay calculation',
      'Test deduction calculations for accuracy',
      'Verify payroll register approval before payment release',
      'Confirm segregation of duties in payroll processing',
      'Review payroll discrepancy resolution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PAY-4',
    name: 'Payroll Tax Compliance',
    description:
      'Payroll taxes must be accurately calculated, timely remitted to taxing authorities, and properly reported. Controls must ensure compliance with federal, state, and local tax requirements.',
    category: 'Payroll & Human Capital',
    implementationGuidance:
      'Calculate payroll taxes (federal income tax, FICA, state income tax, local taxes, unemployment taxes) accurately based on current rates and employee elections. Remit payroll taxes to taxing authorities according to deposit schedules (typically same-day or next-day for large employers). File payroll tax returns (941, 940, state returns) timely. Reconcile payroll tax liabilities to deposits and filings. Monitor tax rate changes and system updates. Maintain compliance with W-4 and state withholding certificate requirements.',
    evidenceRequirements: [
      'Payroll tax procedures',
      'Tax deposit records and confirmations',
      'Payroll tax return filings (941, 940, state)',
      'Tax liability reconciliation to deposits and filings',
      'Tax rate maintenance and update records',
      'W-4 and withholding certificate documentation',
    ],
    testProcedures: [
      'Verify payroll tax calculations for a sample of employees',
      'Confirm tax deposits were made timely',
      'Review tax return filings for accuracy and timeliness',
      'Test tax liability reconciliation to deposits and filings',
      'Verify tax rates are current and properly applied',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PAY-5',
    name: 'Benefits Administration',
    description:
      'Employee benefits must be properly administered with accurate enrollment, deductions, and employer contributions. Benefits expense and liabilities must be accurately recorded.',
    category: 'Payroll & Human Capital',
    implementationGuidance:
      'Administer benefit programs (health insurance, dental, vision, life insurance, disability, FSA, HSA, 401k) in accordance with plan documents. Process benefit enrollments and changes during qualifying events and open enrollment. Calculate and apply benefit deductions accurately. Calculate and remit employer contributions timely. Reconcile benefit deductions and contributions to carrier invoices and plan statements. Record benefits expense and related liabilities accurately. Monitor compliance with benefit plan regulations (ERISA, ACA, COBRA).',
    evidenceRequirements: [
      'Benefits administration procedures',
      'Benefit enrollment and change documentation',
      'Benefit deduction accuracy verification',
      'Employer contribution calculation and remittance records',
      'Benefits reconciliation to carrier invoices',
      'Benefits expense and liability recording',
    ],
    testProcedures: [
      'Select a sample of employees and verify benefit enrollment and deductions',
      'Test employer contribution calculations',
      'Reconcile benefit deductions to carrier invoices',
      'Verify benefits expense recording',
      'Review compliance with benefit plan requirements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PAY-6',
    name: 'Payroll Reconciliation',
    description:
      'Payroll accounts must be reconciled to the general ledger with timely investigation and resolution of reconciling items. Payroll clearing accounts must be monitored to ensure proper clearing.',
    category: 'Payroll & Human Capital',
    implementationGuidance:
      'Reconcile payroll liability accounts (wages payable, payroll taxes payable, benefits payable) to the GL at least monthly. Reconcile payroll clearing accounts and ensure proper clearing after each payroll. Investigate reconciling items and resolve within defined timelines. Reconcile payroll expense accounts to payroll registers. Analyze payroll expense trends for reasonableness. Prepare payroll-related financial statement disclosures accurately.',
    evidenceRequirements: [
      'Payroll account reconciliation procedures',
      'Monthly payroll account reconciliations',
      'Payroll clearing account monitoring',
      'Reconciling item investigation and resolution',
      'Payroll expense analysis and trend review',
      'Payroll disclosure preparation support',
    ],
    testProcedures: [
      'Verify payroll account reconciliations were completed timely',
      'Review reconciling items for proper investigation and resolution',
      'Test payroll clearing account clearing after each payroll',
      'Review payroll expense trend analysis',
      'Verify payroll disclosure accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PAY-7',
    name: 'Stock-Based Compensation',
    description:
      'Stock-based compensation must be properly authorized, accurately valued, and correctly recorded. Grant date fair values, vesting schedules, and expense recognition must comply with ASC 718.',
    category: 'Payroll & Human Capital',
    implementationGuidance:
      'Document stock compensation plan terms and board/committee approvals for grants. Determine grant date based on mutual understanding of terms. Calculate grant date fair value using appropriate models (Black-Scholes, Monte Carlo, lattice). Recognize compensation expense over the requisite service period (typically vesting period). Track forfeitures and adjust expense accordingly. Process exercises, settlements, and expirations accurately. Maintain detailed grant records and stock ledger. Prepare accurate stock compensation disclosures.',
    evidenceRequirements: [
      'Stock compensation plan documents and board approvals',
      'Grant authorization records',
      'Grant date fair value calculations with assumptions',
      'Compensation expense calculation and recognition schedule',
      'Forfeiture tracking and expense adjustment records',
      'Stock ledger and grant detail records',
      'Stock compensation disclosure support',
    ],
    testProcedures: [
      'Verify grant authorization and proper grant date determination',
      'Test fair value calculations and assumptions',
      'Verify expense recognition over requisite service period',
      'Review forfeiture tracking and expense adjustments',
      'Test stock compensation disclosure accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PAY-8',
    name: 'Termination and Final Pay Processing',
    description:
      'Employee terminations must be processed timely with accurate final pay calculations including earned wages, accrued PTO payout, and benefit adjustments. Final pay must comply with state-specific timing requirements.',
    category: 'Payroll & Human Capital',
    implementationGuidance:
      'Process terminations promptly upon HR notification. Calculate final pay including: regular wages through termination date, accrued PTO payout per policy and state law, prorated bonus if applicable, and final expense reimbursements. Adjust benefit deductions and COBRA notifications. Issue final paycheck according to state-specific timing requirements (same day to next regular payday depending on state). Recover company property and outstanding advances. Update employee master to terminated status. Retain termination records per retention requirements.',
    evidenceRequirements: [
      'Termination processing procedures',
      'Final pay calculation documentation',
      'PTO payout calculation and policy compliance',
      'State-specific final pay timing compliance',
      'Benefit termination and COBRA documentation',
      'Company property and advance recovery records',
    ],
    testProcedures: [
      'Select a sample of terminations and verify final pay accuracy',
      'Test PTO payout calculations against policy',
      'Verify final pay timing compliance with state requirements',
      'Review benefit termination processing',
      'Test property and advance recovery',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // INVENTORY & COST OF GOODS SOLD CONTROLS
  // ============================================================
  {
    controlId: 'SOX-INV-1',
    name: 'Inventory Receiving and Inspection',
    description:
      'Inventory receipts must be properly documented, inspected for quality and quantity, and accurately recorded. Controls must ensure only authorized purchases are received and recorded.',
    category: 'Inventory & Cost of Goods Sold',
    implementationGuidance:
      'Implement receiving procedures requiring verification against purchase orders. Inspect received goods for quantity, quality, and condition. Document receipt using receiving reports or system transactions referencing the PO. Segregate receiving from purchasing and inventory record maintenance. Process receipts timely to maintain accurate inventory records. Investigate and document discrepancies between ordered and received quantities. Coordinate with quality assurance for inspection requirements.',
    evidenceRequirements: [
      'Inventory receiving procedures',
      'Receiving reports or system transaction records',
      'Quality inspection documentation',
      'Receiving discrepancy investigation records',
      'Segregation of duties evidence for receiving',
      'PO-to-receipt matching documentation',
    ],
    testProcedures: [
      'Select a sample of inventory receipts and verify documentation',
      'Test receiving quantities against POs',
      'Verify quality inspection completion',
      'Review receiving discrepancy investigation',
      'Confirm segregation of duties in receiving function',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-INV-2',
    name: 'Inventory Storage and Security',
    description:
      'Inventory must be stored securely with physical access controls to prevent theft, damage, and unauthorized removal. Storage conditions must maintain inventory quality and integrity.',
    category: 'Inventory & Cost of Goods Sold',
    implementationGuidance:
      'Implement physical access controls to inventory storage areas (locked facilities, badge access, security cameras). Restrict inventory access to authorized personnel. Maintain appropriate storage conditions (temperature, humidity) for inventory type. Organize inventory storage for efficient access and counting. Implement procedures for hazardous materials handling and storage. Monitor inventory shrinkage and investigate unusual losses. Secure high-value inventory items with additional controls.',
    evidenceRequirements: [
      'Inventory security policy and procedures',
      'Physical access control documentation',
      'Authorized access list for inventory areas',
      'Storage condition monitoring records',
      'Shrinkage analysis and investigation records',
      'Security incident reports',
    ],
    testProcedures: [
      'Observe physical access controls at inventory locations',
      'Review authorized access list and compare to actual access',
      'Verify storage conditions meet requirements',
      'Review shrinkage analysis and investigation',
      'Test security controls for high-value items',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-INV-3',
    name: 'Inventory Issuance and Transfers',
    description:
      'Inventory issuances to production and transfers between locations must be properly authorized, documented, and recorded. Controls must ensure accurate inventory movement tracking.',
    category: 'Inventory & Cost of Goods Sold',
    implementationGuidance:
      'Implement inventory issuance procedures requiring documentation (material requisitions, pick lists). Issue inventory based on production orders or authorized requests. Record inventory movements in the system promptly. Require authorization for inventory transfers between locations. Reconcile transferred inventory between sending and receiving locations. Investigate discrepancies in transferred quantities. Maintain audit trail of all inventory movements.',
    evidenceRequirements: [
      'Inventory issuance and transfer procedures',
      'Material requisition and pick list documentation',
      'Inventory movement transaction records',
      'Transfer authorization documentation',
      'Inter-location transfer reconciliations',
      'Movement discrepancy investigation records',
    ],
    testProcedures: [
      'Select a sample of inventory issuances and verify documentation and authorization',
      'Test transfer recording at both sending and receiving locations',
      'Verify transfer reconciliations are completed',
      'Review movement discrepancy investigation',
      'Test audit trail for inventory movements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-INV-4',
    name: 'Physical Inventory Counts',
    description:
      'Physical inventory counts must be performed periodically to verify inventory accuracy. Count procedures must ensure complete and accurate counts with proper reconciliation to book records.',
    category: 'Inventory & Cost of Goods Sold',
    implementationGuidance:
      'Conduct physical inventory counts at least annually for all inventory locations. Consider cycle counting programs for ongoing accuracy verification. Develop count instructions covering: count teams, count procedures, tag control, cutoff procedures, and supervision. Cease inventory movements during counts or implement strict cutoff controls. Use count tags or sheets with sequence control. Investigate and resolve count variances before adjusting book records. Require management approval for significant adjustments. Document count procedures and results.',
    evidenceRequirements: [
      'Physical inventory count procedures and instructions',
      'Count schedules and planning documentation',
      'Count tag or sheet control records',
      'Count-to-book variance analysis',
      'Variance investigation and approval documentation',
      'Inventory adjustment journal entries with approval',
    ],
    testProcedures: [
      'Observe physical inventory count procedures',
      'Verify count tag or sheet control',
      'Review count-to-book variance analysis and investigation',
      'Test approval for significant inventory adjustments',
      'Verify proper inventory cutoff during counts',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-INV-5',
    name: 'Inventory Valuation',
    description:
      'Inventory must be valued at the lower of cost or net realizable value. Costing methods must be consistently applied, and obsolete or slow-moving inventory must be identified and reserved.',
    category: 'Inventory & Cost of Goods Sold',
    implementationGuidance:
      'Apply consistent inventory costing methods (FIFO, weighted average, standard cost). Calculate actual costs including purchase price, freight, duties, and handling. For standard cost systems, maintain and update standard costs appropriately and analyze variances. Evaluate inventory for lower of cost or net realizable value at each reporting period. Identify obsolete, excess, and slow-moving inventory through aging analysis. Calculate and record inventory reserves for identified items. Document reserve methodology and calculations.',
    evidenceRequirements: [
      'Inventory valuation policy and costing methodology',
      'Standard cost update and variance analysis records',
      'Lower of cost or NRV analysis',
      'Inventory aging analysis',
      'Obsolete and slow-moving inventory identification',
      'Inventory reserve calculation and approval',
    ],
    testProcedures: [
      'Verify consistent application of costing methodology',
      'Test inventory cost accuracy for a sample of items',
      'Review lower of cost or NRV analysis',
      'Test inventory aging report accuracy',
      'Verify reserve calculation and adequacy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-INV-6',
    name: 'Cost of Goods Sold Calculation',
    description:
      'Cost of goods sold must be accurately calculated and recorded. COGS must be properly matched to revenue and analyzed for reasonableness through gross margin analysis.',
    category: 'Inventory & Cost of Goods Sold',
    implementationGuidance:
      'Calculate COGS using appropriate methodology consistent with inventory costing method. Record COGS when revenue is recognized to ensure proper matching. Reconcile COGS to inventory relief and production records. Analyze gross margin by product, customer, or channel for reasonableness. Investigate unusual gross margin fluctuations. Ensure proper COGS classification (materials, labor, overhead). Allocate manufacturing overhead appropriately.',
    evidenceRequirements: [
      'COGS calculation methodology documentation',
      'COGS to inventory reconciliation',
      'Gross margin analysis by product/channel',
      'Gross margin variance investigation',
      'Manufacturing overhead allocation documentation',
      'COGS classification review',
    ],
    testProcedures: [
      'Verify COGS calculation methodology and consistency',
      'Reconcile COGS to inventory relief for sample periods',
      'Review gross margin analysis and variance investigation',
      'Test manufacturing overhead allocation',
      'Verify proper COGS classification',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-INV-7',
    name: 'Inventory Reconciliation',
    description:
      'Inventory subledgers must reconcile to the general ledger with timely investigation and resolution of reconciling items. Inventory accounts must be analyzed for accuracy and completeness.',
    category: 'Inventory & Cost of Goods Sold',
    implementationGuidance:
      'Reconcile inventory subledger to GL at least monthly. Investigate and resolve reconciling items within defined timelines. Reconcile inventory by location and category. Analyze inventory roll-forward (beginning balance + receipts - issuances = ending balance). Review negative inventory balances and investigate causes. Analyze inventory turnover and identify potential issues. Maintain documentation of reconciliation and resolution.',
    evidenceRequirements: [
      'Inventory reconciliation procedures',
      'Monthly inventory subledger to GL reconciliations',
      'Reconciling item investigation and resolution records',
      'Inventory roll-forward analysis',
      'Negative balance investigation records',
      'Inventory turnover analysis',
    ],
    testProcedures: [
      'Verify inventory reconciliations were completed timely',
      'Review reconciling items for proper investigation and resolution',
      'Test inventory roll-forward logic and accuracy',
      'Review negative balance investigation',
      'Analyze inventory turnover trends',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // FIXED ASSETS & CAPITAL EXPENDITURE CONTROLS
  // ============================================================
  {
    controlId: 'SOX-FA-1',
    name: 'Capital Expenditure Authorization',
    description:
      'Capital expenditures must be properly authorized based on amount and nature. The capital budget process and individual project approvals must ensure only appropriate investments are made.',
    category: 'Fixed Assets & Capital Expenditure',
    implementationGuidance:
      'Establish a capital expenditure policy defining: capitalization thresholds, approval authority levels, business case requirements, and ROI analysis requirements. Prepare and approve annual capital budgets. Require individual project approval for expenditures exceeding thresholds. Document business justification, expected benefits, and financial analysis for significant projects. Track approved projects through completion. Compare actual expenditures to approved amounts and investigate variances.',
    evidenceRequirements: [
      'Capital expenditure policy with approval matrix',
      'Annual capital budget approval records',
      'Individual project approval documentation',
      'Business case and financial analysis for significant projects',
      'Project expenditure tracking and variance analysis',
      'Capital budget vs. actual reporting',
    ],
    testProcedures: [
      'Select a sample of capital additions and verify proper authorization',
      'Test approval authority against policy thresholds',
      'Review business cases for significant projects',
      'Verify project expenditure tracking and variance analysis',
      'Compare actual capital spending to budget',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FA-2',
    name: 'Fixed Asset Capitalization',
    description:
      'Fixed asset additions must be properly identified, valued, and recorded. Capitalization must comply with policy thresholds and accounting standards for recognition of costs.',
    category: 'Fixed Assets & Capital Expenditure',
    implementationGuidance:
      'Apply capitalization threshold consistently (typically $X amount). Capitalize costs that extend asset useful life or increase productive capacity. Capitalize directly attributable costs: purchase price, installation, transportation, and site preparation. Expense costs that maintain rather than enhance assets. Record assets at appropriate acquisition dates. Assign proper asset categories and useful lives. Coordinate with accounts payable to identify capitalizable costs.',
    evidenceRequirements: [
      'Capitalization policy with thresholds and criteria',
      'Asset addition documentation with cost support',
      'Capitalization vs. expense analysis for significant items',
      'Asset category and useful life assignment records',
      'AP coordination procedures for capital items',
      'Capital addition journal entries with support',
    ],
    testProcedures: [
      'Select a sample of additions and verify proper capitalization',
      'Test capitalization threshold application',
      'Verify cost components are appropriate for capitalization',
      'Review asset category and useful life assignments',
      'Test for items inappropriately expensed or capitalized',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FA-3',
    name: 'Fixed Asset Depreciation',
    description:
      'Depreciation must be accurately calculated using appropriate methods and useful lives. Depreciation expense must be recorded consistently and reviewed for reasonableness.',
    category: 'Fixed Assets & Capital Expenditure',
    implementationGuidance:
      'Apply appropriate depreciation methods (straight-line, declining balance, units of production) based on asset type and consumption pattern. Assign useful lives based on expected economic benefit period. Begin depreciation when asset is placed in service. Calculate and record depreciation monthly or as appropriate for reporting needs. Review useful lives and depreciation methods when circumstances indicate change may be warranted. Analyze depreciation expense for reasonableness (trend analysis, per-asset review).',
    evidenceRequirements: [
      'Depreciation policy with methods and useful lives by category',
      'Depreciation calculation documentation',
      'Placed-in-service date records',
      'Useful life review and change documentation',
      'Depreciation expense analysis and review',
      'Depreciation journal entries',
    ],
    testProcedures: [
      'Select a sample of assets and verify depreciation calculation',
      'Test useful life assignments against policy',
      'Verify depreciation begins at placed-in-service date',
      'Review useful life change documentation',
      'Analyze depreciation expense for reasonableness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FA-4',
    name: 'Fixed Asset Disposals and Impairment',
    description:
      'Fixed asset disposals must be properly authorized and recorded with appropriate gain or loss recognition. Assets must be evaluated for impairment when indicators exist.',
    category: 'Fixed Assets & Capital Expenditure',
    implementationGuidance:
      'Implement disposal procedures requiring authorization before asset sale, scrapping, or abandonment. Calculate gain or loss as proceeds minus net book value. Remove disposed assets from the fixed asset register and GL. Document disposal transactions including authorization, proceeds, and gain/loss calculation. Identify impairment indicators: significant decrease in market value, adverse changes in use, physical damage, or deteriorating financial performance. Perform impairment testing when indicators exist. Record impairment losses when book value exceeds recoverable amount.',
    evidenceRequirements: [
      'Asset disposal policy and procedures',
      'Disposal authorization records',
      'Gain or loss calculations with support',
      'Impairment indicator assessment documentation',
      'Impairment testing calculations and conclusions',
      'Disposal and impairment journal entries',
    ],
    testProcedures: [
      'Select a sample of disposals and verify proper authorization',
      'Test gain or loss calculations',
      'Verify disposed assets were removed from records',
      'Review impairment indicator assessments',
      'Test impairment calculations for impaired assets',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FA-5',
    name: 'Physical Verification of Fixed Assets',
    description:
      'Physical verification of fixed assets must be performed periodically to confirm asset existence and condition. Verification results must be reconciled to asset records.',
    category: 'Fixed Assets & Capital Expenditure',
    implementationGuidance:
      'Conduct physical verification of fixed assets at least annually. Use asset tags or identification numbers to match physical assets to records. Verify asset existence, location, and condition. Identify assets that cannot be located or are in poor condition. Reconcile physical verification results to the fixed asset register. Investigate and resolve discrepancies. Update asset records for location changes or condition changes. Consider asset tagging programs for improved tracking.',
    evidenceRequirements: [
      'Fixed asset verification procedures',
      'Verification schedules and results',
      'Verification-to-register reconciliation',
      'Discrepancy investigation and resolution records',
      'Asset tagging program documentation',
      'Asset condition and location update records',
    ],
    testProcedures: [
      'Review physical verification procedures and coverage',
      'Observe physical verification for a sample of assets',
      'Verify verification-to-register reconciliation',
      'Review discrepancy investigation and resolution',
      'Test asset record updates for location and condition changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-FA-6',
    name: 'Fixed Asset Reconciliation',
    description:
      'Fixed asset subledgers must reconcile to the general ledger with timely investigation and resolution of reconciling items. Asset roll-forwards must be maintained and analyzed.',
    category: 'Fixed Assets & Capital Expenditure',
    implementationGuidance:
      'Reconcile fixed asset subledger to GL at least monthly. Maintain fixed asset roll-forward showing: beginning balance, additions, disposals, transfers, depreciation, impairments, and ending balance. Investigate and resolve reconciling items within defined timelines. Reconcile accumulated depreciation to detail records. Analyze fixed asset account activity for unusual items. Prepare fixed asset disclosures accurately.',
    evidenceRequirements: [
      'Fixed asset reconciliation procedures',
      'Monthly fixed asset subledger to GL reconciliations',
      'Fixed asset roll-forward schedules',
      'Reconciling item investigation and resolution records',
      'Accumulated depreciation reconciliation',
      'Fixed asset disclosure support',
    ],
    testProcedures: [
      'Verify fixed asset reconciliations were completed timely',
      'Test fixed asset roll-forward accuracy',
      'Review reconciling items for proper investigation and resolution',
      'Test accumulated depreciation reconciliation',
      'Verify fixed asset disclosure accuracy',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // FINANCIAL STATEMENT CLOSE & CONSOLIDATION CONTROLS
  // ============================================================
  {
    controlId: 'SOX-CON-1',
    name: 'Intercompany Transaction Processing',
    description:
      'Intercompany transactions must be properly recorded and documented with matching entries at both entities. Transfer pricing must comply with policy and regulations.',
    category: 'Consolidation & Intercompany',
    implementationGuidance:
      'Document intercompany transaction types and recording procedures. Establish intercompany agreements supporting transaction terms and transfer pricing. Record intercompany transactions using linked accounts for efficient identification. Ensure matching entries at both entities (one entity\'s receivable equals other entity\'s payable). Apply consistent transfer pricing methodology compliant with tax regulations. Document transfer pricing methodology and support arm\'s-length pricing. Process intercompany transactions timely for proper period recording.',
    evidenceRequirements: [
      'Intercompany policy and procedures',
      'Intercompany agreements',
      'Transfer pricing documentation',
      'Intercompany transaction records',
      'Matching entry verification',
      'Transfer pricing compliance evidence',
    ],
    testProcedures: [
      'Select a sample of intercompany transactions and verify matching entries',
      'Review intercompany agreements for completeness',
      'Test transfer pricing against methodology and documentation',
      'Verify timely recording of intercompany transactions',
      'Review transfer pricing compliance with regulations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-CON-2',
    name: 'Intercompany Reconciliation and Elimination',
    description:
      'Intercompany balances must be reconciled between entities and eliminated upon consolidation. Discrepancies must be investigated and resolved before closing.',
    category: 'Consolidation & Intercompany',
    implementationGuidance:
      'Reconcile intercompany balances between all entity pairs at each period-end. Identify and investigate intercompany discrepancies (timing differences, unrecorded transactions, errors). Resolve discrepancies before consolidation close. Prepare and review intercompany elimination entries. Eliminate intercompany balances (receivables/payables, investments/equity). Eliminate intercompany transactions (sales/cost of sales, interest, dividends). Document elimination entries with support.',
    evidenceRequirements: [
      'Intercompany reconciliation procedures',
      'Intercompany balance reconciliations between entities',
      'Discrepancy investigation and resolution records',
      'Intercompany elimination entries',
      'Elimination entry support and calculations',
      'Consolidated elimination review documentation',
    ],
    testProcedures: [
      'Review intercompany reconciliations for all entity pairs',
      'Verify discrepancies were investigated and resolved',
      'Test intercompany elimination entries for completeness',
      'Verify elimination calculations and support',
      'Confirm zero intercompany balances after elimination',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-CON-3',
    name: 'Consolidation Process and System',
    description:
      'The consolidation process must accurately combine subsidiary financial data into consolidated financial statements. System controls and manual procedures must ensure complete and accurate consolidation.',
    category: 'Consolidation & Intercompany',
    implementationGuidance:
      'Implement a consolidation process (system-based or spreadsheet-based) that accumulates subsidiary data accurately. Define chart of account mappings for subsidiaries to consolidated reporting. Collect subsidiary financial data by defined deadlines. Validate subsidiary data for completeness and accuracy. Process consolidation adjustments: intercompany eliminations, purchase accounting, minority interest. Generate consolidated trial balance and financial statements. Implement consolidation system access controls and change management.',
    evidenceRequirements: [
      'Consolidation process documentation',
      'Chart of account mapping documentation',
      'Subsidiary data submission evidence',
      'Subsidiary data validation procedures',
      'Consolidation adjustment entries',
      'Consolidated trial balance and financial statements',
      'Consolidation system access controls',
    ],
    testProcedures: [
      'Review consolidation process for completeness',
      'Test chart of account mapping accuracy',
      'Verify subsidiary data submission and validation',
      'Test consolidation adjustments for accuracy',
      'Verify consolidated financial statement accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-CON-4',
    name: 'Foreign Currency Translation',
    description:
      'Foreign subsidiary financial statements must be translated to the reporting currency using appropriate rates. Translation adjustments must be properly calculated and recorded in other comprehensive income.',
    category: 'Consolidation & Intercompany',
    implementationGuidance:
      'Determine functional currency for each foreign subsidiary. Apply appropriate translation method: current rate method for foreign entities with different functional currency. Translate assets and liabilities at period-end rates. Translate income statement at average rates for the period. Calculate cumulative translation adjustment (CTA) and record in other comprehensive income. Obtain exchange rates from reliable sources. Document rate sources and translation calculations. Remeasure transactions in currencies other than functional currency.',
    evidenceRequirements: [
      'Foreign currency translation policy',
      'Functional currency determination documentation',
      'Exchange rate sources and documentation',
      'Translation calculations',
      'CTA calculation and OCI recording',
      'Remeasurement calculations for foreign currency transactions',
    ],
    testProcedures: [
      'Verify functional currency determination for foreign subsidiaries',
      'Test exchange rate sources and accuracy',
      'Verify translation calculations using appropriate rates',
      'Test CTA calculation and OCI recording',
      'Review remeasurement of foreign currency transactions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-CON-5',
    name: 'Equity Method Investments',
    description:
      'Investments accounted for under the equity method must be properly recorded with the investor\'s share of investee income and adjustments for basis differences and impairment.',
    category: 'Consolidation & Intercompany',
    implementationGuidance:
      'Identify investments requiring equity method accounting (typically 20-50% ownership with significant influence). Record initial investment at cost. Obtain investee financial statements timely. Record share of investee net income or loss. Adjust for intercompany profits and amortization of basis differences. Assess equity method investments for impairment other than temporary. Record dividends received as reduction of investment balance. Prepare equity method investment disclosures.',
    evidenceRequirements: [
      'Equity method investment policy',
      'Significant influence assessment documentation',
      'Investee financial statements',
      'Share of income/loss calculations',
      'Basis difference amortization schedule',
      'Impairment assessment documentation',
      'Equity method investment roll-forward',
    ],
    testProcedures: [
      'Verify significant influence assessment for equity investments',
      'Test share of income/loss calculations',
      'Review basis difference identification and amortization',
      'Verify impairment assessment completion',
      'Test equity method investment roll-forward',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // TAX CONTROLS
  // ============================================================
  {
    controlId: 'SOX-TAX-1',
    name: 'Income Tax Provision Calculation',
    description:
      'The income tax provision must be accurately calculated in accordance with ASC 740. Current and deferred tax calculations must be properly supported and reviewed.',
    category: 'Tax',
    implementationGuidance:
      'Calculate current income tax expense based on taxable income and applicable tax rates. Identify and calculate deferred tax assets and liabilities for temporary differences between book and tax basis. Apply appropriate tax rates to deferred items based on expected reversal period. Evaluate need for valuation allowance on deferred tax assets. Calculate and record uncertain tax positions per ASC 740-10. Reconcile tax provision to statutory rate (rate reconciliation). Document all provision calculations and significant judgments.',
    evidenceRequirements: [
      'Income tax provision policy and procedures',
      'Current tax expense calculation',
      'Deferred tax asset and liability calculations',
      'Temporary difference schedules',
      'Valuation allowance assessment',
      'Uncertain tax position analysis',
      'Effective tax rate reconciliation',
    ],
    testProcedures: [
      'Review current tax expense calculation methodology',
      'Test deferred tax calculations for a sample of temporary differences',
      'Verify valuation allowance assessment and support',
      'Review uncertain tax position analysis',
      'Test effective tax rate reconciliation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TAX-2',
    name: 'Tax Account Reconciliation',
    description:
      'Tax accounts must be reconciled with proper support for balances. Current and deferred tax balances must tie to supporting schedules and calculations.',
    category: 'Tax',
    implementationGuidance:
      'Reconcile income tax payable/receivable to tax returns and estimated payments. Reconcile deferred tax asset and liability accounts to supporting schedules. Prepare tax account roll-forwards showing beginning balance, provision, payments, and ending balance. Investigate and resolve reconciling items. Document support for all significant tax account balances. Review tax account activity for unusual items.',
    evidenceRequirements: [
      'Tax account reconciliation procedures',
      'Income tax payable/receivable reconciliation',
      'Deferred tax account reconciliations',
      'Tax account roll-forward schedules',
      'Reconciling item resolution documentation',
      'Tax account balance support',
    ],
    testProcedures: [
      'Verify tax account reconciliations were completed',
      'Test income tax payable reconciliation to returns and payments',
      'Test deferred tax reconciliation to supporting schedules',
      'Review tax account roll-forward accuracy',
      'Verify reconciling item resolution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TAX-3',
    name: 'Tax Return Preparation and Filing',
    description:
      'Tax returns must be accurately prepared and timely filed. Return preparation must reconcile to financial records and comply with tax law requirements.',
    category: 'Tax',
    implementationGuidance:
      'Prepare tax returns using complete and accurate financial data. Reconcile taxable income to book income with documented permanent and temporary differences (book-to-tax reconciliation). Ensure return positions are supported by tax law and documented analysis. Implement review procedures for tax returns before filing. File returns by due dates or properly extend. Maintain tax return files with supporting workpapers. Monitor and respond to tax authority notices and audits.',
    evidenceRequirements: [
      'Tax return preparation procedures',
      'Book-to-tax reconciliation',
      'Tax return review and approval documentation',
      'Filed tax returns',
      'Extension filings where applicable',
      'Tax authority notice and audit tracking',
    ],
    testProcedures: [
      'Review book-to-tax reconciliation accuracy',
      'Verify tax return review and approval procedures',
      'Confirm timely filing of returns or extensions',
      'Review tax return support and workpapers',
      'Test tax authority notice response and tracking',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TAX-4',
    name: 'Sales and Use Tax Compliance',
    description:
      'Sales and use taxes must be accurately calculated, collected, and remitted. Exemption certificates must be obtained and maintained to support non-taxable transactions.',
    category: 'Tax',
    implementationGuidance:
      'Configure billing systems to calculate sales tax accurately based on jurisdiction, product taxability, and customer exemption status. Obtain and maintain exemption certificates from exempt customers. Validate exemption certificates for completeness and expiration. Remit collected sales taxes to jurisdictions by due dates. File sales tax returns accurately and timely. Accrue and remit use tax on taxable purchases. Conduct periodic sales tax compliance reviews.',
    evidenceRequirements: [
      'Sales and use tax policy and procedures',
      'Tax calculation system configuration documentation',
      'Exemption certificate file with validation records',
      'Sales tax remittance records',
      'Sales and use tax returns',
      'Use tax accrual calculations',
      'Compliance review documentation',
    ],
    testProcedures: [
      'Test sales tax calculation accuracy for a sample of transactions',
      'Verify exemption certificates are on file and valid',
      'Confirm timely remittance of sales taxes',
      'Review sales tax return accuracy',
      'Test use tax accrual completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-TAX-5',
    name: 'Transfer Pricing Compliance',
    description:
      'Intercompany transactions must be priced at arm\'s length in accordance with transfer pricing regulations. Documentation must support pricing methodology and compliance.',
    category: 'Tax',
    implementationGuidance:
      'Develop transfer pricing policies for intercompany transactions: goods, services, royalties, and financing. Select appropriate transfer pricing methods based on transaction type and comparability. Document functional analysis, economic analysis, and selected methods. Prepare contemporaneous transfer pricing documentation as required by regulations. Apply consistent transfer pricing in intercompany agreements and actual transactions. Monitor transfer pricing outcomes and adjust as needed. Coordinate transfer pricing across jurisdictions.',
    evidenceRequirements: [
      'Transfer pricing policy',
      'Transfer pricing methodology documentation',
      'Functional and economic analysis',
      'Benchmarking studies and comparable analysis',
      'Intercompany agreements reflecting transfer pricing',
      'Transfer pricing compliance documentation by jurisdiction',
    ],
    testProcedures: [
      'Review transfer pricing policy and methodology',
      'Verify transfer pricing documentation completeness',
      'Test actual transactions against documented pricing',
      'Review benchmarking studies and comparable selection',
      'Verify compliance with jurisdiction-specific requirements',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // IT APPLICATION CONTROLS
  // ============================================================
  {
    controlId: 'SOX-ITAC-1',
    name: 'Application Input Controls',
    description:
      'Application input controls must ensure data entered into financial systems is accurate, complete, and authorized. Edit checks, validation rules, and input authorization must prevent erroneous data entry.',
    category: 'IT Application Controls',
    implementationGuidance:
      'Implement input validation rules: required fields, data type checks, range checks, format checks, and reasonableness checks. Configure edit checks to prevent invalid data entry (reject or require override with approval). Implement duplicate entry detection. Require authorization for input of sensitive transactions or master data changes. Log rejected transactions for review. Implement batch control totals for bulk data entry. Design user interfaces to minimize input errors.',
    evidenceRequirements: [
      'Input control specifications for financial applications',
      'Edit check and validation rule documentation',
      'Duplicate detection configuration',
      'Input authorization requirements and evidence',
      'Rejected transaction reports and review',
      'Batch control procedures and reconciliation',
    ],
    testProcedures: [
      'Test input validation rules by attempting invalid data entry',
      'Verify edit checks reject or flag invalid data',
      'Test duplicate detection effectiveness',
      'Review input authorization for sensitive transactions',
      'Verify rejected transactions are reviewed and resolved',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITAC-2',
    name: 'Application Processing Controls',
    description:
      'Application processing controls must ensure transactions are processed completely and accurately. Calculations must be verified, and processing logic must produce expected results.',
    category: 'IT Application Controls',
    implementationGuidance:
      'Verify application calculations produce accurate results (pricing, discounts, taxes, interest, depreciation). Implement run-to-run totals to ensure complete processing. Configure automatic posting and integration between modules. Implement error handling that captures and reports processing failures. Verify processing logic through test cases during implementation and changes. Monitor processing job completion and investigate failures. Maintain audit trails of processing activities.',
    evidenceRequirements: [
      'Processing control specifications for financial applications',
      'Calculation verification test results',
      'Run-to-run total reconciliation procedures',
      'Processing error reports and resolution',
      'Job monitoring and failure investigation records',
      'Processing audit trail documentation',
    ],
    testProcedures: [
      'Test application calculations for accuracy',
      'Verify run-to-run total reconciliations',
      'Review processing error reports and resolution',
      'Test processing job monitoring and failure handling',
      'Verify audit trail captures processing activities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITAC-3',
    name: 'Application Output Controls',
    description:
      'Application output controls must ensure reports and data extracts are complete, accurate, and distributed appropriately. Output must be validated and secured from unauthorized access.',
    category: 'IT Application Controls',
    implementationGuidance:
      'Implement output validation: record counts, control totals, and reconciliation to source data. Verify report completeness through systematic testing during implementation. Distribute reports only to authorized recipients through secure channels. Implement output logging to track report generation and distribution. Secure sensitive reports with access controls or encryption. Archive reports according to retention requirements. Monitor for failed report generation and notify appropriate personnel.',
    evidenceRequirements: [
      'Output control specifications for financial applications',
      'Output validation procedures and evidence',
      'Report distribution lists and authorization',
      'Output logging and tracking records',
      'Sensitive report security controls',
      'Report archival and retention procedures',
    ],
    testProcedures: [
      'Test output validation controls (record counts, totals)',
      'Verify report distribution to authorized recipients only',
      'Review output logs for completeness',
      'Test sensitive report security controls',
      'Verify report archival compliance with retention policy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITAC-4',
    name: 'Interface Controls',
    description:
      'Interfaces between systems must ensure complete and accurate data transfer. Interface controls must detect and handle transmission errors, duplicates, and missing data.',
    category: 'IT Application Controls',
    implementationGuidance:
      'Document all interfaces affecting financial data: source system, target system, data transferred, frequency, and method. Implement interface validation: record counts, hash totals, and control totals comparing source to target. Detect and prevent duplicate transmissions. Implement error handling for failed transmissions with automatic retry and alerting. Reconcile interfaced data between systems. Monitor interface jobs for completion and investigate failures. Maintain interface audit trails.',
    evidenceRequirements: [
      'Interface inventory and documentation',
      'Interface control specifications',
      'Interface validation evidence (record counts, totals)',
      'Interface error handling procedures',
      'Interface reconciliation records',
      'Interface job monitoring and failure investigation',
    ],
    testProcedures: [
      'Review interface inventory for completeness',
      'Test interface validation controls',
      'Verify interface reconciliation between systems',
      'Review interface error handling and resolution',
      'Test interface monitoring and failure alerting',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITAC-5',
    name: 'Master Data Management Controls',
    description:
      'Master data in financial applications (customers, vendors, employees, chart of accounts) must be accurately maintained with appropriate controls over additions, changes, and deletions.',
    category: 'IT Application Controls',
    implementationGuidance:
      'Define master data ownership and governance for each data domain. Implement master data change request and approval workflows. Segregate master data maintenance from transaction processing. Implement validation rules for master data fields. Detect and prevent duplicate master data records. Log all master data changes with before/after values. Conduct periodic master data quality reviews. Synchronize master data across integrated systems.',
    evidenceRequirements: [
      'Master data governance policy',
      'Master data change approval procedures and evidence',
      'Segregation of duties for master data maintenance',
      'Master data validation rule documentation',
      'Duplicate detection procedures and reports',
      'Master data change audit logs',
      'Master data quality review records',
    ],
    testProcedures: [
      'Verify master data change approvals for a sample of changes',
      'Test segregation of duties for master data maintenance',
      'Test master data validation rules',
      'Review duplicate detection and resolution',
      'Test master data audit log completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITAC-6',
    name: 'Automated Control Configuration Management',
    description:
      'Automated controls within financial applications must be properly configured and maintained. Configuration changes must follow change management procedures and be tested before implementation.',
    category: 'IT Application Controls',
    implementationGuidance:
      'Document all automated controls within financial applications: edit checks, validation rules, workflow approvals, calculations, and security configurations. Maintain a baseline of control configurations. Subject control configuration changes to formal change management. Test configuration changes before production implementation. Verify configurations after system upgrades or patches. Conduct periodic reviews of automated control configurations. Monitor for unauthorized configuration changes.',
    evidenceRequirements: [
      'Automated control inventory and documentation',
      'Control configuration baseline',
      'Configuration change request and approval records',
      'Configuration change test results',
      'Post-upgrade configuration verification records',
      'Periodic configuration review records',
    ],
    testProcedures: [
      'Review automated control inventory and documentation',
      'Verify configuration changes followed change management',
      'Test current configurations against documented baseline',
      'Review post-upgrade configuration verification',
      'Test for unauthorized configuration changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-ITAC-7',
    name: 'Report Integrity and Security',
    description:
      'Financial reports generated from applications must accurately reflect underlying data. Report logic must be protected from unauthorized modification, and report access must be controlled.',
    category: 'IT Application Controls',
    implementationGuidance:
      'Document report logic, data sources, and calculations for key financial reports. Restrict access to modify report definitions to authorized personnel. Test report accuracy by reconciling to source data. Implement report version control. Log report generation including user, date/time, and parameters. Distribute reports through secure channels to authorized recipients. Archive reports with appropriate retention. Validate reports after system changes.',
    evidenceRequirements: [
      'Key financial report inventory with logic documentation',
      'Report modification access controls',
      'Report accuracy testing and reconciliation',
      'Report version control records',
      'Report generation logs',
      'Report distribution authorization',
      'Report archival and retention evidence',
    ],
    testProcedures: [
      'Verify report modification access is appropriately restricted',
      'Reconcile report output to source data for accuracy',
      'Review report generation logs',
      'Verify report distribution to authorized recipients',
      'Test report archival compliance',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // DATA GOVERNANCE & QUALITY CONTROLS
  // ============================================================
  {
    controlId: 'SOX-DG-1',
    name: 'Data Quality Monitoring',
    description:
      'Financial data quality must be monitored through automated checks and periodic reviews. Data quality issues must be identified, investigated, and remediated.',
    category: 'Data Governance & Quality',
    implementationGuidance:
      'Define data quality dimensions for financial data: accuracy, completeness, consistency, timeliness, and validity. Implement automated data quality checks and monitoring dashboards. Establish data quality thresholds and alerts for violations. Investigate data quality issues and identify root causes. Remediate data quality issues and implement preventive controls. Report data quality metrics to data owners and management. Track data quality trends over time.',
    evidenceRequirements: [
      'Data quality policy and standards',
      'Data quality monitoring configuration and dashboards',
      'Data quality threshold definitions',
      'Data quality issue investigation and remediation records',
      'Data quality metrics reports',
      'Data quality trend analysis',
    ],
    testProcedures: [
      'Review data quality monitoring coverage and thresholds',
      'Verify data quality alerts are generated and investigated',
      'Review data quality issue remediation effectiveness',
      'Test data quality metrics accuracy',
      'Review data quality trend analysis',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-DG-2',
    name: 'Data Lineage and Documentation',
    description:
      'Financial data flows and transformations must be documented to support data integrity and troubleshooting. Data lineage must trace data from source to financial reports.',
    category: 'Data Governance & Quality',
    implementationGuidance:
      'Document data flows for financial reporting: source systems, transformations, interfaces, and destination systems. Maintain data dictionaries defining field names, definitions, formats, and business rules. Document calculation logic and business rules applied to financial data. Create data lineage diagrams showing end-to-end data flow. Update documentation when changes occur. Use data lineage to support audit inquiries and issue investigation.',
    evidenceRequirements: [
      'Data flow documentation for financial reporting',
      'Data dictionaries for financial systems',
      'Calculation logic and business rule documentation',
      'Data lineage diagrams',
      'Documentation update and version control records',
      'Data lineage used for audit support',
    ],
    testProcedures: [
      'Review data flow documentation for completeness',
      'Verify data dictionaries are current and accurate',
      'Test calculation logic documentation against system behavior',
      'Trace data lineage from source to financial reports',
      'Verify documentation updates for recent changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-DG-3',
    name: 'Data Retention and Archival',
    description:
      'Financial data must be retained in accordance with legal, regulatory, and business requirements. Archived data must remain accessible and readable for the required retention period.',
    category: 'Data Governance & Quality',
    implementationGuidance:
      'Define retention requirements for financial data categories based on legal, regulatory, and business needs. Implement retention schedules in systems and backup procedures. Archive data according to retention schedules while maintaining accessibility. Verify archived data readability through periodic testing. Implement legal hold procedures to preserve data subject to litigation. Securely dispose of data that has exceeded retention requirements. Document retention policy compliance.',
    evidenceRequirements: [
      'Data retention policy with retention periods by category',
      'Retention schedule implementation evidence',
      'Data archival procedures and records',
      'Archived data accessibility and readability testing',
      'Legal hold procedures and implementation records',
      'Data disposal records with approval',
    ],
    testProcedures: [
      'Review data retention policy for appropriate periods',
      'Verify retention schedules are implemented in systems',
      'Test archived data accessibility and readability',
      'Review legal hold implementation for active matters',
      'Verify data disposal follows approved procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-DG-4',
    name: 'End-User Computing (EUC) Governance',
    description:
      'End-user computing tools (spreadsheets, databases, scripts) used in financial reporting must be inventoried, controlled, and monitored. High-risk EUCs must have appropriate controls.',
    category: 'Data Governance & Quality',
    implementationGuidance:
      'Identify and inventory EUCs used in financial reporting processes. Classify EUCs by risk based on financial statement impact. Implement controls for high-risk EUCs: access controls, change controls, input validation, calculation verification, and version control. Require preparer and reviewer roles for EUC-based calculations. Conduct periodic reviews of EUC controls. Establish migration plans for high-risk EUCs to controlled applications. Train users on EUC governance requirements.',
    evidenceRequirements: [
      'EUC policy and governance framework',
      'EUC inventory with risk classification',
      'EUC control documentation for high-risk items',
      'EUC preparer and reviewer sign-off records',
      'Periodic EUC control review records',
      'EUC migration plans and progress',
    ],
    testProcedures: [
      'Review EUC inventory for completeness',
      'Verify risk classification for EUCs',
      'Test controls for a sample of high-risk EUCs',
      'Verify preparer and reviewer sign-offs',
      'Review periodic EUC control assessments',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ESTIMATES & JUDGMENTS CONTROLS
  // ============================================================
  {
    controlId: 'SOX-EST-1',
    name: 'Accounting Estimates Policy and Documentation',
    description:
      'Significant accounting estimates must be prepared using documented methodologies with appropriate assumptions. Estimation processes must be consistently applied and properly approved.',
    category: 'Estimates & Judgments',
    implementationGuidance:
      'Identify all significant accounting estimates in financial statements. Document estimation methodologies including: estimation approach, data inputs, assumptions, calculation methods, and sensitivity analysis. Establish consistent processes for preparing estimates. Require management review and approval of significant estimates. Document key assumptions and judgments supporting estimates. Update estimation methodologies when circumstances change. Maintain historical record of estimates for comparison to actuals.',
    evidenceRequirements: [
      'Accounting estimates inventory',
      'Estimation methodology documentation for each significant estimate',
      'Data inputs and sources documentation',
      'Key assumptions and judgments documentation',
      'Management review and approval records',
      'Methodology change documentation',
      'Historical estimate tracking',
    ],
    testProcedures: [
      'Review completeness of accounting estimates inventory',
      'Verify estimation methodology documentation',
      'Test data inputs for accuracy and completeness',
      'Review key assumptions for reasonableness',
      'Verify management approval of significant estimates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-EST-2',
    name: 'Retrospective Review of Estimates',
    description:
      'Accounting estimates must be compared to actual outcomes to assess estimation accuracy and identify potential bias. Methodology adjustments must be made when actual results consistently differ from estimates.',
    category: 'Estimates & Judgments',
    implementationGuidance:
      'Compare prior period estimates to actual outcomes when actual results become known. Analyze differences to determine if within acceptable range. Identify patterns suggesting potential bias (consistent over/under estimation). Evaluate whether estimation methodology needs adjustment. Document retrospective review analysis and conclusions. Present retrospective review results to management and audit committee. Adjust future estimation approaches based on learnings.',
    evidenceRequirements: [
      'Retrospective review policy and procedures',
      'Estimate-to-actual comparison analysis',
      'Bias assessment documentation',
      'Methodology adjustment evaluations',
      'Management and audit committee reporting',
      'Future methodology adjustments based on review',
    ],
    testProcedures: [
      'Verify retrospective reviews were performed for significant estimates',
      'Review estimate-to-actual comparisons for accuracy',
      'Assess bias analysis methodology and conclusions',
      'Verify methodology adjustments when warranted',
      'Review management and audit committee communications',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-EST-3',
    name: 'Third-Party Specialist Management',
    description:
      'When specialists are used to assist with accounting estimates (actuaries, appraisers, valuators), their qualifications must be assessed and their work must be reviewed and approved.',
    category: 'Estimates & Judgments',
    implementationGuidance:
      'Identify estimates requiring third-party specialist assistance. Evaluate specialist qualifications: credentials, experience, independence, and reputation. Provide specialists with appropriate information and instructions. Review specialist work products for reasonableness and compliance with requirements. Understand and evaluate specialist methodologies and assumptions. Document assessment of specialist qualifications and work. Retain specialist reports and supporting documentation.',
    evidenceRequirements: [
      'Third-party specialist policy',
      'Specialist engagement documentation',
      'Specialist qualification assessment',
      'Information and instructions provided to specialists',
      'Management review of specialist work products',
      'Specialist reports and supporting documentation',
    ],
    testProcedures: [
      'Review specialist qualification assessments',
      'Verify appropriate information was provided to specialists',
      'Review management evaluation of specialist work',
      'Test specialist methodology and assumptions reasonableness',
      'Verify specialist reports are retained',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-EST-4',
    name: 'Fair Value Measurement Controls',
    description:
      'Fair value measurements must be performed using appropriate valuation techniques with observable inputs where available. Level 3 measurements must receive enhanced scrutiny and documentation.',
    category: 'Estimates & Judgments',
    implementationGuidance:
      'Identify assets and liabilities requiring fair value measurement. Determine fair value hierarchy level based on input observability. Use observable market inputs (Level 1 and 2) where available. Document valuation techniques and significant assumptions for Level 3 measurements. Obtain independent valuations for significant Level 3 items. Implement controls over valuation model inputs and calculations. Assess valuation model appropriateness periodically. Prepare fair value measurement disclosures accurately.',
    evidenceRequirements: [
      'Fair value measurement policy',
      'Fair value hierarchy level determinations',
      'Valuation technique documentation',
      'Level 3 assumption documentation',
      'Independent valuation reports where obtained',
      'Valuation model validation records',
      'Fair value disclosure support',
    ],
    testProcedures: [
      'Verify fair value hierarchy level determinations',
      'Review valuation techniques for appropriateness',
      'Test Level 3 assumptions for reasonableness',
      'Verify independent valuations where required',
      'Review fair value disclosure accuracy',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // PHYSICAL SECURITY CONTROLS
  // ============================================================
  {
    controlId: 'SOX-PS-1',
    name: 'Data Center Physical Security',
    description:
      'Data centers housing systems that process or store financial data must have appropriate physical security controls including access restrictions, monitoring, and environmental controls.',
    category: 'Physical Security',
    implementationGuidance:
      'Implement physical access controls at data center facilities: badge access, biometric authentication, mantraps, and visitor escort requirements. Monitor physical access through security cameras and guard services. Maintain access logs and review for unauthorized access attempts. Implement environmental controls: fire suppression, HVAC, uninterruptible power supplies, and water detection. Conduct periodic physical security assessments. Review and update authorized access lists regularly.',
    evidenceRequirements: [
      'Data center physical security policy',
      'Physical access control system documentation',
      'Access authorization lists and approval records',
      'Physical access logs',
      'Security camera monitoring procedures',
      'Environmental control documentation',
      'Physical security assessment reports',
    ],
    testProcedures: [
      'Observe physical access controls at data center',
      'Review access authorization list for appropriateness',
      'Test access log review procedures',
      'Verify environmental controls are operational',
      'Review physical security assessment results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-PS-2',
    name: 'Media Handling and Disposal',
    description:
      'Physical media containing financial data must be securely handled, stored, and disposed of. Controls must prevent unauthorized access to data on removable media and ensure secure destruction.',
    category: 'Physical Security',
    implementationGuidance:
      'Implement media handling procedures for removable media (tapes, USB drives, hard drives) containing financial data. Encrypt sensitive data on removable media. Track media through logging and inventory. Store media securely when not in use. Implement secure media destruction procedures: degaussing, shredding, or certified destruction services. Obtain certificates of destruction. Prohibit unauthorized removal of media from facilities.',
    evidenceRequirements: [
      'Media handling and disposal policy',
      'Media encryption requirements and evidence',
      'Media inventory and tracking records',
      'Secure storage procedures',
      'Media destruction procedures',
      'Certificates of destruction',
    ],
    testProcedures: [
      'Review media handling procedures',
      'Verify media encryption for sensitive data',
      'Test media inventory accuracy',
      'Observe secure storage controls',
      'Review media destruction certificates',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CYBERSECURITY INCIDENT RESPONSE CONTROLS
  // ============================================================
  {
    controlId: 'SOX-CIR-1',
    name: 'Cybersecurity Incident Response Plan',
    description:
      'A cybersecurity incident response plan must be maintained to detect, respond to, and recover from security incidents affecting financial systems and data. The plan must be tested periodically.',
    category: 'Cybersecurity Incident Response',
    implementationGuidance:
      'Develop and maintain a cybersecurity incident response plan covering: incident identification and classification, response team roles and responsibilities, containment and eradication procedures, evidence preservation, communication protocols (internal and external), recovery procedures, and post-incident review. Define incident severity levels and escalation criteria. Establish communication procedures for incidents affecting financial reporting or data integrity. Test the incident response plan through tabletop exercises and simulations. Update the plan based on lessons learned.',
    evidenceRequirements: [
      'Cybersecurity incident response plan',
      'Incident response team roster and contact information',
      'Incident classification and severity criteria',
      'Communication and escalation procedures',
      'Incident response testing records (tabletop exercises)',
      'Post-incident review documentation',
      'Plan update records based on lessons learned',
    ],
    testProcedures: [
      'Review incident response plan for completeness',
      'Verify response team roles are assigned and trained',
      'Review incident classification criteria',
      'Test communication and escalation procedures',
      'Review incident response testing results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-CIR-2',
    name: 'Incident Detection and Reporting',
    description:
      'Security incidents must be detected through monitoring and reported through established channels. Employees must be trained to recognize and report potential security incidents.',
    category: 'Cybersecurity Incident Response',
    implementationGuidance:
      'Implement security monitoring to detect potential incidents: SIEM alerts, IDS/IPS alerts, antivirus alerts, and user activity monitoring. Establish incident reporting channels for employees and third parties. Train employees to recognize and report security incidents. Implement procedures for initial incident assessment and triage. Log all reported incidents regardless of severity. Track incident metrics and report to management.',
    evidenceRequirements: [
      'Incident detection monitoring documentation',
      'Incident reporting channels and procedures',
      'Employee security awareness training records',
      'Incident triage procedures',
      'Incident log',
      'Incident metrics and management reporting',
    ],
    testProcedures: [
      'Review incident detection monitoring coverage',
      'Test incident reporting channels',
      'Verify employee training on incident reporting',
      'Review incident log for completeness',
      'Verify incident metrics are reported to management',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-CIR-3',
    name: 'Incident Investigation and Remediation',
    description:
      'Security incidents must be investigated to determine scope, impact, and root cause. Remediation actions must address identified vulnerabilities and prevent recurrence.',
    category: 'Cybersecurity Incident Response',
    implementationGuidance:
      'Investigate security incidents to determine: how the incident occurred, systems and data affected, timeline of events, and root cause. Preserve evidence for potential legal or regulatory proceedings. Document investigation findings and conclusions. Implement remediation actions to address identified vulnerabilities. Verify remediation effectiveness. Report incidents to appropriate parties (audit committee, regulators, affected individuals) as required. Conduct post-incident reviews to identify preventive measures.',
    evidenceRequirements: [
      'Incident investigation procedures',
      'Investigation reports with findings and root cause',
      'Evidence preservation documentation',
      'Remediation action plans and completion records',
      'Remediation effectiveness verification',
      'Required notifications and disclosures',
      'Post-incident review documentation',
    ],
    testProcedures: [
      'Review investigation procedures for adequacy',
      'Verify investigation reports document root cause',
      'Review remediation actions for appropriateness',
      'Test remediation effectiveness',
      'Verify required notifications were made',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SOX-CIR-4',
    name: 'Incident Communication and Disclosure',
    description:
      'Security incidents affecting financial reporting or requiring disclosure must be communicated to appropriate internal and external stakeholders timely and accurately.',
    category: 'Cybersecurity Incident Response',
    implementationGuidance:
      'Establish communication procedures for security incidents affecting financial reporting: escalation to CFO and audit committee, assessment of financial statement impact, and evaluation of disclosure requirements. Coordinate with legal counsel on disclosure obligations (SEC cybersecurity disclosure rules, breach notification laws). Prepare incident disclosures accurately describing the incident, impact, and response. Communicate with external auditors regarding incidents affecting financial reporting. Document all incident communications.',
    evidenceRequirements: [
      'Incident communication procedures',
      'Internal escalation records for significant incidents',
      'Legal counsel involvement documentation',
      'Disclosure assessment documentation',
      'External auditor communication records',
      'Public disclosures (if applicable)',
    ],
    testProcedures: [
      'Review incident communication procedures',
      'Verify appropriate escalation for significant incidents',
      'Review disclosure assessment process',
      'Verify external auditor communication for relevant incidents',
      'Review disclosure accuracy (if applicable)',
    ],
    status: 'Not Started',
  },
];
