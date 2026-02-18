import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Download, Search, Filter, Eye,
  AlertTriangle, CheckCircle, XCircle, X, ChevronDown, ChevronRight,
  Shield, Layers, Link2, BarChart3, Brain, Zap, RefreshCw, Check,
  FileText, Settings, HelpCircle, ThumbsUp, ThumbsDown, Minus,
  GitCompare, Target, TrendingUp, Loader2, Copy, Hash, Info
} from 'lucide-react';
import { api } from '../../services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Framework {
  id: string;
  name: string;
  shortName: string;
  color: string;
  controlCount: number;
  category: 'Security' | 'Privacy' | 'AI Governance' | 'Sustainability' | 'Industry';
}

interface Control {
  id: string;
  frameworkId: string;
  controlId: string;
  title: string;
  description: string;
  domain: string;
}

interface ControlMapping {
  id: string;
  sourceControlId: string;
  targetControlId: string;
  confidence: number;
  status: 'AI Suggested' | 'Confirmed' | 'Rejected' | 'Manual';
  rationale: string;
  mappingType: 'Full' | 'Partial' | 'Semantic';
  confirmedBy?: string;
  confirmedDate?: string;
}

interface MappingSession {
  id: string;
  sourceFrameworkId: string;
  targetFrameworkId: string;
  createdDate: string;
  lastUpdated: string;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Reviewed';
  mappings: ControlMapping[];
  coveragePercent: number;
  avgConfidence: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FRAMEWORKS: Framework[] = [
  { id: 'soc2', name: 'SOC 2 Type II', shortName: 'SOC 2', color: 'bg-blue-500', controlCount: 64, category: 'Security' },
  { id: 'iso27001', name: 'ISO/IEC 27001:2022', shortName: 'ISO 27001', color: 'bg-indigo-500', controlCount: 93, category: 'Security' },
  { id: 'nist-csf', name: 'NIST Cybersecurity Framework 2.0', shortName: 'NIST CSF', color: 'bg-green-600', controlCount: 108, category: 'Security' },
  { id: 'hipaa', name: 'HIPAA Security Rule', shortName: 'HIPAA', color: 'bg-pink-500', controlCount: 54, category: 'Industry' },
  { id: 'pci-dss', name: 'PCI DSS v4.0', shortName: 'PCI DSS', color: 'bg-red-500', controlCount: 78, category: 'Industry' },
  { id: 'gdpr', name: 'GDPR (Regulation EU 2016/679)', shortName: 'GDPR', color: 'bg-purple-600', controlCount: 42, category: 'Privacy' },
  { id: 'eu-ai-act', name: 'EU AI Act', shortName: 'EU AI Act', color: 'bg-cyan-600', controlCount: 36, category: 'AI Governance' },
  { id: 'cra', name: 'Cyber Resilience Act (CRA)', shortName: 'CRA', color: 'bg-teal-600', controlCount: 31, category: 'Security' },
  { id: 'nis2', name: 'NIS2 Directive', shortName: 'NIS2', color: 'bg-amber-600', controlCount: 44, category: 'Security' },
  { id: 'csrd', name: 'Corporate Sustainability Reporting Directive', shortName: 'CSRD', color: 'bg-emerald-600', controlCount: 38, category: 'Sustainability' },
  { id: 'nist-ai-rmf', name: 'NIST AI Risk Management Framework', shortName: 'NIST AI RMF', color: 'bg-violet-600', controlCount: 28, category: 'AI Governance' },
  { id: 'iso42001', name: 'ISO/IEC 42001 AI Management', shortName: 'ISO 42001', color: 'bg-fuchsia-600', controlCount: 32, category: 'AI Governance' },
];

/* ------------------------------------------------------------------ */
/*  Pre-built controls database                                         */
/* ------------------------------------------------------------------ */

const CONTROLS_DB: Control[] = [
  // SOC 2
  { id: 'soc2-cc6.1', frameworkId: 'soc2', controlId: 'CC6.1', title: 'Logical and Physical Access Controls', description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets.', domain: 'Logical and Physical Access' },
  { id: 'soc2-cc6.2', frameworkId: 'soc2', controlId: 'CC6.2', title: 'Access Authentication', description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.', domain: 'Logical and Physical Access' },
  { id: 'soc2-cc6.3', frameworkId: 'soc2', controlId: 'CC6.3', title: 'Access Authorization', description: 'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets.', domain: 'Logical and Physical Access' },
  { id: 'soc2-cc6.6', frameworkId: 'soc2', controlId: 'CC6.6', title: 'System Boundary Protection', description: 'The entity implements logical access security measures to protect against threats from outside its system boundaries.', domain: 'Logical and Physical Access' },
  { id: 'soc2-cc6.7', frameworkId: 'soc2', controlId: 'CC6.7', title: 'Data Transmission Protection', description: 'The entity restricts the transmission, movement, and removal of information to authorized users and processes.', domain: 'Logical and Physical Access' },
  { id: 'soc2-cc6.8', frameworkId: 'soc2', controlId: 'CC6.8', title: 'Malicious Software Prevention', description: 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.', domain: 'Logical and Physical Access' },
  { id: 'soc2-cc7.1', frameworkId: 'soc2', controlId: 'CC7.1', title: 'Vulnerability Management', description: 'To meet its objectives, the entity uses detection and monitoring procedures to identify changes to configurations resulting in vulnerabilities.', domain: 'System Operations' },
  { id: 'soc2-cc7.2', frameworkId: 'soc2', controlId: 'CC7.2', title: 'Anomaly Detection', description: 'The entity monitors system components and the operation of those components for anomalies.', domain: 'System Operations' },
  { id: 'soc2-cc7.3', frameworkId: 'soc2', controlId: 'CC7.3', title: 'Security Incident Evaluation', description: 'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity.', domain: 'System Operations' },
  { id: 'soc2-cc7.4', frameworkId: 'soc2', controlId: 'CC7.4', title: 'Incident Response', description: 'The entity responds to identified security incidents by executing a defined incident response program.', domain: 'System Operations' },
  { id: 'soc2-cc8.1', frameworkId: 'soc2', controlId: 'CC8.1', title: 'Change Management', description: 'The entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes to infrastructure and software.', domain: 'Change Management' },
  { id: 'soc2-cc9.1', frameworkId: 'soc2', controlId: 'CC9.1', title: 'Risk Mitigation', description: 'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.', domain: 'Risk Mitigation' },
  { id: 'soc2-cc1.1', frameworkId: 'soc2', controlId: 'CC1.1', title: 'COSO Principle 1 - Integrity & Ethics', description: 'The entity demonstrates a commitment to integrity and ethical values.', domain: 'Control Environment' },
  { id: 'soc2-cc1.2', frameworkId: 'soc2', controlId: 'CC1.2', title: 'Board Oversight', description: 'The board of directors demonstrates independence from management and exercises oversight.', domain: 'Control Environment' },
  { id: 'soc2-cc5.1', frameworkId: 'soc2', controlId: 'CC5.1', title: 'Control Activities', description: 'The entity selects and develops control activities that contribute to the mitigation of risks.', domain: 'Control Activities' },

  // ISO 27001
  { id: 'iso-a5.1', frameworkId: 'iso27001', controlId: 'A.5.1', title: 'Policies for Information Security', description: 'A set of policies for information security shall be defined, approved by management, published and communicated.', domain: 'Organizational Controls' },
  { id: 'iso-a5.2', frameworkId: 'iso27001', controlId: 'A.5.2', title: 'Information Security Roles and Responsibilities', description: 'Information security roles and responsibilities shall be defined and allocated.', domain: 'Organizational Controls' },
  { id: 'iso-a5.3', frameworkId: 'iso27001', controlId: 'A.5.3', title: 'Segregation of Duties', description: 'Conflicting duties and conflicting areas of responsibility shall be segregated.', domain: 'Organizational Controls' },
  { id: 'iso-a8.1', frameworkId: 'iso27001', controlId: 'A.8.1', title: 'User Endpoint Devices', description: 'Information stored on, processed by or accessible via user endpoint devices shall be protected.', domain: 'Technological Controls' },
  { id: 'iso-a8.2', frameworkId: 'iso27001', controlId: 'A.8.2', title: 'Privileged Access Rights', description: 'The allocation and use of privileged access rights shall be restricted and managed.', domain: 'Technological Controls' },
  { id: 'iso-a8.3', frameworkId: 'iso27001', controlId: 'A.8.3', title: 'Information Access Restriction', description: 'Access to information and other associated assets shall be restricted in accordance with the topic-specific policy.', domain: 'Technological Controls' },
  { id: 'iso-a8.5', frameworkId: 'iso27001', controlId: 'A.8.5', title: 'Secure Authentication', description: 'Secure authentication technologies and procedures shall be established and implemented.', domain: 'Technological Controls' },
  { id: 'iso-a8.7', frameworkId: 'iso27001', controlId: 'A.8.7', title: 'Protection Against Malware', description: 'Protection against malware shall be implemented and supported by appropriate user awareness.', domain: 'Technological Controls' },
  { id: 'iso-a8.8', frameworkId: 'iso27001', controlId: 'A.8.8', title: 'Management of Technical Vulnerabilities', description: 'Information about technical vulnerabilities of information systems in use shall be obtained timely.', domain: 'Technological Controls' },
  { id: 'iso-a8.9', frameworkId: 'iso27001', controlId: 'A.8.9', title: 'Configuration Management', description: 'Configurations, including security configurations, of hardware, software, services and networks shall be managed.', domain: 'Technological Controls' },
  { id: 'iso-a8.15', frameworkId: 'iso27001', controlId: 'A.8.15', title: 'Logging', description: 'Logs that record activities, exceptions, faults and other relevant events shall be produced and stored.', domain: 'Technological Controls' },
  { id: 'iso-a8.16', frameworkId: 'iso27001', controlId: 'A.8.16', title: 'Monitoring Activities', description: 'Networks, systems and applications shall be monitored for anomalous behavior.', domain: 'Technological Controls' },
  { id: 'iso-a8.20', frameworkId: 'iso27001', controlId: 'A.8.20', title: 'Networks Security', description: 'Networks and network devices shall be secured, managed and controlled to protect information in systems.', domain: 'Technological Controls' },
  { id: 'iso-a8.24', frameworkId: 'iso27001', controlId: 'A.8.24', title: 'Use of Cryptography', description: 'Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.', domain: 'Technological Controls' },
  { id: 'iso-a8.25', frameworkId: 'iso27001', controlId: 'A.8.25', title: 'Secure Development Life Cycle', description: 'Rules for the secure development of software and systems shall be established and applied.', domain: 'Technological Controls' },
  { id: 'iso-a8.32', frameworkId: 'iso27001', controlId: 'A.8.32', title: 'Change Management', description: 'Changes to information processing facilities and information systems shall be subject to change management procedures.', domain: 'Technological Controls' },
  { id: 'iso-a5.24', frameworkId: 'iso27001', controlId: 'A.5.24', title: 'Incident Management Planning', description: 'The organization shall plan and prepare for managing information security incidents.', domain: 'Organizational Controls' },
  { id: 'iso-a5.25', frameworkId: 'iso27001', controlId: 'A.5.25', title: 'Assessment of Information Security Events', description: 'The organization shall assess information security events and decide if they are to be categorized as incidents.', domain: 'Organizational Controls' },
  { id: 'iso-a5.26', frameworkId: 'iso27001', controlId: 'A.5.26', title: 'Response to Information Security Incidents', description: 'Information security incidents shall be responded to in accordance with the documented procedures.', domain: 'Organizational Controls' },
  { id: 'iso-a5.29', frameworkId: 'iso27001', controlId: 'A.5.29', title: 'ICT Readiness for Business Continuity', description: 'ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives.', domain: 'Organizational Controls' },

  // NIST CSF
  { id: 'nist-pr.ac-1', frameworkId: 'nist-csf', controlId: 'PR.AC-1', title: 'Identities and Credentials', description: 'Identities and credentials are issued, managed, verified, revoked, and audited for authorized devices, users, and processes.', domain: 'Protect - Access Control' },
  { id: 'nist-pr.ac-3', frameworkId: 'nist-csf', controlId: 'PR.AC-3', title: 'Remote Access Management', description: 'Remote access is managed.', domain: 'Protect - Access Control' },
  { id: 'nist-pr.ac-4', frameworkId: 'nist-csf', controlId: 'PR.AC-4', title: 'Access Permissions', description: 'Access permissions and authorizations are managed, incorporating the principles of least privilege and separation of duties.', domain: 'Protect - Access Control' },
  { id: 'nist-pr.ac-5', frameworkId: 'nist-csf', controlId: 'PR.AC-5', title: 'Network Integrity Protection', description: 'Network integrity is protected (e.g., network segregation, network segmentation).', domain: 'Protect - Access Control' },
  { id: 'nist-pr.ds-1', frameworkId: 'nist-csf', controlId: 'PR.DS-1', title: 'Data-at-Rest Protection', description: 'Data-at-rest is protected.', domain: 'Protect - Data Security' },
  { id: 'nist-pr.ds-2', frameworkId: 'nist-csf', controlId: 'PR.DS-2', title: 'Data-in-Transit Protection', description: 'Data-in-transit is protected.', domain: 'Protect - Data Security' },
  { id: 'nist-pr.ip-1', frameworkId: 'nist-csf', controlId: 'PR.IP-1', title: 'Security Baseline Configurations', description: 'A baseline configuration of IT/ICS systems is created and maintained incorporating security principles.', domain: 'Protect - Information Protection' },
  { id: 'nist-pr.ip-3', frameworkId: 'nist-csf', controlId: 'PR.IP-3', title: 'Configuration Change Control', description: 'Configuration change control processes are in place.', domain: 'Protect - Information Protection' },
  { id: 'nist-de.ae-1', frameworkId: 'nist-csf', controlId: 'DE.AE-1', title: 'Network Operations Baseline', description: 'A baseline of network operations and expected data flows is established and managed.', domain: 'Detect - Anomalies and Events' },
  { id: 'nist-de.cm-1', frameworkId: 'nist-csf', controlId: 'DE.CM-1', title: 'Network Monitoring', description: 'The network is monitored to detect potential cybersecurity events.', domain: 'Detect - Continuous Monitoring' },
  { id: 'nist-de.cm-4', frameworkId: 'nist-csf', controlId: 'DE.CM-4', title: 'Malicious Code Detection', description: 'Malicious code is detected.', domain: 'Detect - Continuous Monitoring' },
  { id: 'nist-de.cm-8', frameworkId: 'nist-csf', controlId: 'DE.CM-8', title: 'Vulnerability Scans', description: 'Vulnerability scans are performed.', domain: 'Detect - Continuous Monitoring' },
  { id: 'nist-rs.rp-1', frameworkId: 'nist-csf', controlId: 'RS.RP-1', title: 'Response Plan Execution', description: 'Response plan is executed during or after an incident.', domain: 'Respond - Response Planning' },
  { id: 'nist-rs.an-1', frameworkId: 'nist-csf', controlId: 'RS.AN-1', title: 'Incident Investigation', description: 'Notifications from detection systems are investigated.', domain: 'Respond - Analysis' },
  { id: 'nist-rc.rp-1', frameworkId: 'nist-csf', controlId: 'RC.RP-1', title: 'Recovery Plan Execution', description: 'Recovery plan is executed during or after a cybersecurity incident.', domain: 'Recover - Recovery Planning' },

  // GDPR
  { id: 'gdpr-art5', frameworkId: 'gdpr', controlId: 'Art. 5', title: 'Principles of Processing', description: 'Personal data shall be processed lawfully, fairly and in a transparent manner (lawfulness, fairness, transparency).', domain: 'Principles' },
  { id: 'gdpr-art6', frameworkId: 'gdpr', controlId: 'Art. 6', title: 'Lawfulness of Processing', description: 'Processing shall be lawful only if and to the extent that at least one legal basis applies.', domain: 'Lawful Basis' },
  { id: 'gdpr-art25', frameworkId: 'gdpr', controlId: 'Art. 25', title: 'Data Protection by Design and Default', description: 'The controller shall implement appropriate technical and organisational measures for implementing data-protection principles.', domain: 'Technical Measures' },
  { id: 'gdpr-art28', frameworkId: 'gdpr', controlId: 'Art. 28', title: 'Processor Requirements', description: 'Processing by a processor shall be governed by a contract or other legal act that is binding on the processor.', domain: 'Third Parties' },
  { id: 'gdpr-art30', frameworkId: 'gdpr', controlId: 'Art. 30', title: 'Records of Processing Activities', description: 'Each controller shall maintain a record of processing activities under its responsibility.', domain: 'Documentation' },
  { id: 'gdpr-art32', frameworkId: 'gdpr', controlId: 'Art. 32', title: 'Security of Processing', description: 'The controller and processor shall implement appropriate technical and organisational measures to ensure security.', domain: 'Security' },
  { id: 'gdpr-art33', frameworkId: 'gdpr', controlId: 'Art. 33', title: 'Notification to Supervisory Authority', description: 'In the case of a personal data breach, the controller shall notify the supervisory authority within 72 hours.', domain: 'Breach Notification' },
  { id: 'gdpr-art35', frameworkId: 'gdpr', controlId: 'Art. 35', title: 'Data Protection Impact Assessment', description: 'Where processing is likely to result in a high risk, the controller shall carry out a DPIA.', domain: 'Risk Assessment' },

  // NIS2
  { id: 'nis2-art21a', frameworkId: 'nis2', controlId: 'Art. 21(a)', title: 'Risk Analysis and IS Policies', description: 'Policies on risk analysis and information system security.', domain: 'Risk Management' },
  { id: 'nis2-art21b', frameworkId: 'nis2', controlId: 'Art. 21(b)', title: 'Incident Handling', description: 'Incident handling procedures and capabilities.', domain: 'Incident Response' },
  { id: 'nis2-art21c', frameworkId: 'nis2', controlId: 'Art. 21(c)', title: 'Business Continuity', description: 'Business continuity, such as backup management and disaster recovery, and crisis management.', domain: 'Continuity' },
  { id: 'nis2-art21d', frameworkId: 'nis2', controlId: 'Art. 21(d)', title: 'Supply Chain Security', description: 'Supply chain security, including security-related aspects concerning the relationships between entities and their direct suppliers.', domain: 'Supply Chain' },
  { id: 'nis2-art21e', frameworkId: 'nis2', controlId: 'Art. 21(e)', title: 'Network and IS Security', description: 'Security in network and information systems acquisition, development and maintenance, including vulnerability handling and disclosure.', domain: 'System Security' },
  { id: 'nis2-art21g', frameworkId: 'nis2', controlId: 'Art. 21(g)', title: 'Cybersecurity Training', description: 'Basic cyber hygiene practices and cybersecurity training.', domain: 'Awareness' },
  { id: 'nis2-art21h', frameworkId: 'nis2', controlId: 'Art. 21(h)', title: 'Cryptography and Encryption', description: 'Policies and procedures regarding the use of cryptography and, where appropriate, encryption.', domain: 'Cryptography' },
  { id: 'nis2-art21i', frameworkId: 'nis2', controlId: 'Art. 21(i)', title: 'HR Security and Access Control', description: 'Human resources security, access control policies and asset management.', domain: 'People & Access' },
  { id: 'nis2-art21j', frameworkId: 'nis2', controlId: 'Art. 21(j)', title: 'Multi-factor Authentication', description: 'Use of multi-factor authentication or continuous authentication solutions.', domain: 'Authentication' },

  // EU AI Act
  { id: 'aiact-art9', frameworkId: 'eu-ai-act', controlId: 'Art. 9', title: 'Risk Management System', description: 'A risk management system shall be established, implemented, documented and maintained for high-risk AI systems.', domain: 'Risk Management' },
  { id: 'aiact-art10', frameworkId: 'eu-ai-act', controlId: 'Art. 10', title: 'Data and Data Governance', description: 'High-risk AI systems which make use of techniques involving training with data shall be developed on the basis of training, validation and testing data sets.', domain: 'Data Governance' },
  { id: 'aiact-art13', frameworkId: 'eu-ai-act', controlId: 'Art. 13', title: 'Transparency and Provision of Information', description: 'High-risk AI systems shall be designed and developed in such a way to ensure their operation is sufficiently transparent.', domain: 'Transparency' },
  { id: 'aiact-art14', frameworkId: 'eu-ai-act', controlId: 'Art. 14', title: 'Human Oversight', description: 'High-risk AI systems shall be designed and developed to be effectively overseen by natural persons.', domain: 'Human Oversight' },
  { id: 'aiact-art15', frameworkId: 'eu-ai-act', controlId: 'Art. 15', title: 'Accuracy, Robustness and Cybersecurity', description: 'High-risk AI systems shall be designed and developed to achieve an appropriate level of accuracy, robustness and cybersecurity.', domain: 'Technical Requirements' },
  { id: 'aiact-art17', frameworkId: 'eu-ai-act', controlId: 'Art. 17', title: 'Quality Management System', description: 'Providers of high-risk AI systems shall put a quality management system in place.', domain: 'Quality' },

  // CRA
  { id: 'cra-annex1-1', frameworkId: 'cra', controlId: 'Annex I.1', title: 'Security by Design', description: 'Products with digital elements shall be designed, developed and produced to ensure an appropriate level of cybersecurity.', domain: 'Design' },
  { id: 'cra-annex1-2', frameworkId: 'cra', controlId: 'Annex I.2', title: 'Vulnerability Handling', description: 'Manufacturers shall identify and document vulnerabilities and components, address and remediate vulnerabilities without delay.', domain: 'Vulnerability Management' },
  { id: 'cra-art11', frameworkId: 'cra', controlId: 'Art. 11', title: 'Reporting Obligations', description: 'Manufacturers shall notify any actively exploited vulnerability and any severe incident to ENISA.', domain: 'Reporting' },

  // HIPAA
  { id: 'hipaa-164.312a', frameworkId: 'hipaa', controlId: '164.312(a)', title: 'Access Control', description: 'Implement technical policies and procedures for electronic information systems that maintain ePHI.', domain: 'Technical Safeguards' },
  { id: 'hipaa-164.312c', frameworkId: 'hipaa', controlId: '164.312(c)', title: 'Integrity Controls', description: 'Implement policies and procedures to protect ePHI from improper alteration or destruction.', domain: 'Technical Safeguards' },
  { id: 'hipaa-164.312e', frameworkId: 'hipaa', controlId: '164.312(e)', title: 'Transmission Security', description: 'Implement technical security measures to guard against unauthorized access to ePHI being transmitted.', domain: 'Technical Safeguards' },
  { id: 'hipaa-164.308a1', frameworkId: 'hipaa', controlId: '164.308(a)(1)', title: 'Security Management Process', description: 'Implement policies and procedures to prevent, detect, contain, and correct security violations.', domain: 'Administrative Safeguards' },
  { id: 'hipaa-164.308a6', frameworkId: 'hipaa', controlId: '164.308(a)(6)', title: 'Security Incident Procedures', description: 'Implement policies and procedures to address security incidents.', domain: 'Administrative Safeguards' },

  // PCI DSS
  { id: 'pci-1.1', frameworkId: 'pci-dss', controlId: 'Req 1', title: 'Network Security Controls', description: 'Install and maintain network security controls to protect cardholder data.', domain: 'Network Security' },
  { id: 'pci-3.1', frameworkId: 'pci-dss', controlId: 'Req 3', title: 'Protect Stored Account Data', description: 'Protect stored account data with strong cryptography.', domain: 'Data Protection' },
  { id: 'pci-4.1', frameworkId: 'pci-dss', controlId: 'Req 4', title: 'Protect Data in Transit', description: 'Protect cardholder data with strong cryptography during transmission over open, public networks.', domain: 'Data Protection' },
  { id: 'pci-6.1', frameworkId: 'pci-dss', controlId: 'Req 6', title: 'Secure Systems and Software', description: 'Develop and maintain secure systems and software.', domain: 'Secure Development' },
  { id: 'pci-7.1', frameworkId: 'pci-dss', controlId: 'Req 7', title: 'Restrict Access', description: 'Restrict access to system components and cardholder data by business need to know.', domain: 'Access Control' },
  { id: 'pci-10.1', frameworkId: 'pci-dss', controlId: 'Req 10', title: 'Log and Monitor', description: 'Log and monitor all access to system components and cardholder data.', domain: 'Monitoring' },
  { id: 'pci-11.1', frameworkId: 'pci-dss', controlId: 'Req 11', title: 'Test Security', description: 'Test security of systems and networks regularly.', domain: 'Testing' },
  { id: 'pci-12.1', frameworkId: 'pci-dss', controlId: 'Req 12', title: 'Information Security Policy', description: 'Support information security with organizational policies and programs.', domain: 'Governance' },

  // CSRD
  { id: 'csrd-e1', frameworkId: 'csrd', controlId: 'ESRS E1', title: 'Climate Change', description: 'Disclosure of climate-related risks, opportunities, targets and transition plans.', domain: 'Environment' },
  { id: 'csrd-s1', frameworkId: 'csrd', controlId: 'ESRS S1', title: 'Own Workforce', description: 'Disclosure of impacts, risks and opportunities related to own workforce.', domain: 'Social' },
  { id: 'csrd-g1', frameworkId: 'csrd', controlId: 'ESRS G1', title: 'Business Conduct', description: 'Disclosure of governance, risk management and internal controls related to sustainability.', domain: 'Governance' },
];

/* ------------------------------------------------------------------ */
/*  Pre-built mapping database (50+ mappings)                          */
/* ------------------------------------------------------------------ */

const PREBUILT_MAPPINGS: Omit<ControlMapping, 'id'>[] = [
  // SOC 2 <-> ISO 27001
  { sourceControlId: 'soc2-cc6.1', targetControlId: 'iso-a8.3', confidence: 92, status: 'AI Suggested', rationale: 'Both address logical access control and restriction of access to information assets based on policy.', mappingType: 'Full' },
  { sourceControlId: 'soc2-cc6.2', targetControlId: 'iso-a8.5', confidence: 88, status: 'AI Suggested', rationale: 'Both controls address user registration, authentication and credential management processes.', mappingType: 'Full' },
  { sourceControlId: 'soc2-cc6.3', targetControlId: 'iso-a8.2', confidence: 85, status: 'AI Suggested', rationale: 'Both address authorization of access rights including privileged access management.', mappingType: 'Partial' },
  { sourceControlId: 'soc2-cc6.6', targetControlId: 'iso-a8.20', confidence: 90, status: 'AI Suggested', rationale: 'Both address network boundary protection and segmentation for security.', mappingType: 'Full' },
  { sourceControlId: 'soc2-cc6.7', targetControlId: 'iso-a8.24', confidence: 82, status: 'AI Suggested', rationale: 'SOC 2 data transmission protection maps to ISO 27001 cryptography requirements for data in transit.', mappingType: 'Partial' },
  { sourceControlId: 'soc2-cc6.8', targetControlId: 'iso-a8.7', confidence: 95, status: 'AI Suggested', rationale: 'Direct mapping - both specifically address malware prevention and detection controls.', mappingType: 'Full' },
  { sourceControlId: 'soc2-cc7.1', targetControlId: 'iso-a8.8', confidence: 91, status: 'AI Suggested', rationale: 'Both focus on vulnerability identification, assessment, and management processes.', mappingType: 'Full' },
  { sourceControlId: 'soc2-cc7.2', targetControlId: 'iso-a8.16', confidence: 93, status: 'AI Suggested', rationale: 'Direct mapping for anomaly detection and monitoring activities.', mappingType: 'Full' },
  { sourceControlId: 'soc2-cc7.3', targetControlId: 'iso-a5.25', confidence: 87, status: 'AI Suggested', rationale: 'Both address evaluation and assessment of security events for incident classification.', mappingType: 'Full' },
  { sourceControlId: 'soc2-cc7.4', targetControlId: 'iso-a5.26', confidence: 94, status: 'AI Suggested', rationale: 'Both cover incident response procedures and execution of response plans.', mappingType: 'Full' },
  { sourceControlId: 'soc2-cc8.1', targetControlId: 'iso-a8.32', confidence: 96, status: 'AI Suggested', rationale: 'Direct mapping - both address change management processes for systems and infrastructure.', mappingType: 'Full' },
  { sourceControlId: 'soc2-cc9.1', targetControlId: 'iso-a5.29', confidence: 78, status: 'AI Suggested', rationale: 'SOC 2 risk mitigation for business disruptions maps partially to ISO ICT readiness for business continuity.', mappingType: 'Partial' },
  { sourceControlId: 'soc2-cc1.1', targetControlId: 'iso-a5.1', confidence: 72, status: 'AI Suggested', rationale: 'SOC 2 integrity and ethics principles relate to ISO information security policy governance.', mappingType: 'Semantic' },
  { sourceControlId: 'soc2-cc5.1', targetControlId: 'iso-a5.1', confidence: 74, status: 'AI Suggested', rationale: 'Control activities selection and development maps to overall policy framework.', mappingType: 'Semantic' },

  // NIST CSF <-> SOC 2
  { sourceControlId: 'nist-pr.ac-1', targetControlId: 'soc2-cc6.2', confidence: 90, status: 'AI Suggested', rationale: 'NIST identity and credential management directly maps to SOC 2 access authentication controls.', mappingType: 'Full' },
  { sourceControlId: 'nist-pr.ac-4', targetControlId: 'soc2-cc6.1', confidence: 91, status: 'AI Suggested', rationale: 'NIST access permissions with least privilege maps to SOC 2 logical access controls.', mappingType: 'Full' },
  { sourceControlId: 'nist-pr.ac-5', targetControlId: 'soc2-cc6.6', confidence: 88, status: 'AI Suggested', rationale: 'Network integrity protection maps to system boundary protection.', mappingType: 'Full' },
  { sourceControlId: 'nist-pr.ds-2', targetControlId: 'soc2-cc6.7', confidence: 93, status: 'AI Suggested', rationale: 'Data-in-transit protection directly corresponds to data transmission protection.', mappingType: 'Full' },
  { sourceControlId: 'nist-pr.ip-3', targetControlId: 'soc2-cc8.1', confidence: 89, status: 'AI Suggested', rationale: 'Configuration change control maps to change management process.', mappingType: 'Full' },
  { sourceControlId: 'nist-de.cm-4', targetControlId: 'soc2-cc6.8', confidence: 94, status: 'AI Suggested', rationale: 'Malicious code detection directly maps to malicious software prevention.', mappingType: 'Full' },
  { sourceControlId: 'nist-de.cm-8', targetControlId: 'soc2-cc7.1', confidence: 92, status: 'AI Suggested', rationale: 'Vulnerability scanning maps to vulnerability management.', mappingType: 'Full' },
  { sourceControlId: 'nist-de.cm-1', targetControlId: 'soc2-cc7.2', confidence: 90, status: 'AI Suggested', rationale: 'Network monitoring for cybersecurity events maps to anomaly detection.', mappingType: 'Full' },
  { sourceControlId: 'nist-rs.rp-1', targetControlId: 'soc2-cc7.4', confidence: 91, status: 'AI Suggested', rationale: 'Response plan execution maps to incident response program.', mappingType: 'Full' },

  // NIST CSF <-> ISO 27001
  { sourceControlId: 'nist-pr.ac-1', targetControlId: 'iso-a8.5', confidence: 87, status: 'AI Suggested', rationale: 'Identity management maps to secure authentication.', mappingType: 'Full' },
  { sourceControlId: 'nist-pr.ac-4', targetControlId: 'iso-a8.2', confidence: 86, status: 'AI Suggested', rationale: 'Least privilege access permissions map to privileged access rights management.', mappingType: 'Full' },
  { sourceControlId: 'nist-pr.ds-1', targetControlId: 'iso-a8.24', confidence: 84, status: 'AI Suggested', rationale: 'Data-at-rest protection maps to cryptography controls.', mappingType: 'Partial' },
  { sourceControlId: 'nist-de.cm-1', targetControlId: 'iso-a8.16', confidence: 92, status: 'AI Suggested', rationale: 'Network monitoring maps to monitoring activities.', mappingType: 'Full' },
  { sourceControlId: 'nist-rs.an-1', targetControlId: 'iso-a5.25', confidence: 85, status: 'AI Suggested', rationale: 'Incident investigation maps to assessment of security events.', mappingType: 'Full' },

  // GDPR <-> ISO 27001
  { sourceControlId: 'gdpr-art32', targetControlId: 'iso-a8.24', confidence: 80, status: 'AI Suggested', rationale: 'GDPR security of processing maps to ISO cryptography as one technical measure.', mappingType: 'Partial' },
  { sourceControlId: 'gdpr-art33', targetControlId: 'iso-a5.26', confidence: 76, status: 'AI Suggested', rationale: 'GDPR breach notification relates to ISO incident response, though GDPR adds regulatory notification requirements.', mappingType: 'Partial' },
  { sourceControlId: 'gdpr-art25', targetControlId: 'iso-a8.25', confidence: 73, status: 'AI Suggested', rationale: 'Data protection by design maps to secure development lifecycle for privacy-by-design implementation.', mappingType: 'Semantic' },

  // NIS2 <-> ISO 27001
  { sourceControlId: 'nis2-art21a', targetControlId: 'iso-a5.1', confidence: 88, status: 'AI Suggested', rationale: 'NIS2 risk analysis and IS policies directly correspond to ISO information security policies.', mappingType: 'Full' },
  { sourceControlId: 'nis2-art21b', targetControlId: 'iso-a5.24', confidence: 91, status: 'AI Suggested', rationale: 'NIS2 incident handling maps to ISO incident management planning.', mappingType: 'Full' },
  { sourceControlId: 'nis2-art21c', targetControlId: 'iso-a5.29', confidence: 89, status: 'AI Suggested', rationale: 'NIS2 business continuity maps to ISO ICT readiness for business continuity.', mappingType: 'Full' },
  { sourceControlId: 'nis2-art21e', targetControlId: 'iso-a8.8', confidence: 86, status: 'AI Suggested', rationale: 'NIS2 vulnerability handling maps to ISO management of technical vulnerabilities.', mappingType: 'Full' },
  { sourceControlId: 'nis2-art21h', targetControlId: 'iso-a8.24', confidence: 93, status: 'AI Suggested', rationale: 'Direct mapping of cryptography and encryption policies.', mappingType: 'Full' },
  { sourceControlId: 'nis2-art21i', targetControlId: 'iso-a8.2', confidence: 84, status: 'AI Suggested', rationale: 'NIS2 access control maps to ISO privileged access rights.', mappingType: 'Partial' },
  { sourceControlId: 'nis2-art21j', targetControlId: 'iso-a8.5', confidence: 90, status: 'AI Suggested', rationale: 'NIS2 MFA requirement maps to ISO secure authentication.', mappingType: 'Full' },

  // HIPAA <-> SOC 2
  { sourceControlId: 'hipaa-164.312a', targetControlId: 'soc2-cc6.1', confidence: 87, status: 'AI Suggested', rationale: 'HIPAA access control maps to SOC 2 logical access controls.', mappingType: 'Full' },
  { sourceControlId: 'hipaa-164.312e', targetControlId: 'soc2-cc6.7', confidence: 91, status: 'AI Suggested', rationale: 'HIPAA transmission security maps to SOC 2 data transmission protection.', mappingType: 'Full' },
  { sourceControlId: 'hipaa-164.308a6', targetControlId: 'soc2-cc7.4', confidence: 85, status: 'AI Suggested', rationale: 'HIPAA security incident procedures map to SOC 2 incident response.', mappingType: 'Partial' },

  // PCI DSS <-> ISO 27001
  { sourceControlId: 'pci-1.1', targetControlId: 'iso-a8.20', confidence: 88, status: 'AI Suggested', rationale: 'PCI network security controls map to ISO network security.', mappingType: 'Full' },
  { sourceControlId: 'pci-3.1', targetControlId: 'iso-a8.24', confidence: 86, status: 'AI Suggested', rationale: 'PCI stored data protection with cryptography maps to ISO cryptography controls.', mappingType: 'Partial' },
  { sourceControlId: 'pci-6.1', targetControlId: 'iso-a8.25', confidence: 89, status: 'AI Suggested', rationale: 'PCI secure systems and software maps to ISO secure development lifecycle.', mappingType: 'Full' },
  { sourceControlId: 'pci-7.1', targetControlId: 'iso-a8.3', confidence: 90, status: 'AI Suggested', rationale: 'PCI restrict access maps to ISO information access restriction.', mappingType: 'Full' },
  { sourceControlId: 'pci-10.1', targetControlId: 'iso-a8.15', confidence: 92, status: 'AI Suggested', rationale: 'PCI logging and monitoring maps to ISO logging requirements.', mappingType: 'Full' },
  { sourceControlId: 'pci-11.1', targetControlId: 'iso-a8.8', confidence: 84, status: 'AI Suggested', rationale: 'PCI security testing maps to ISO vulnerability management.', mappingType: 'Partial' },
  { sourceControlId: 'pci-12.1', targetControlId: 'iso-a5.1', confidence: 91, status: 'AI Suggested', rationale: 'PCI information security policy maps to ISO information security policies.', mappingType: 'Full' },

  // CRA <-> NIS2
  { sourceControlId: 'cra-annex1-2', targetControlId: 'nis2-art21e', confidence: 87, status: 'AI Suggested', rationale: 'CRA vulnerability handling maps to NIS2 vulnerability handling and disclosure requirements.', mappingType: 'Full' },
  { sourceControlId: 'cra-art11', targetControlId: 'nis2-art21b', confidence: 79, status: 'AI Suggested', rationale: 'CRA reporting obligations relate to NIS2 incident handling, though CRA focuses on product vulnerabilities while NIS2 is broader.', mappingType: 'Partial' },

  // EU AI Act <-> NIST AI RMF (semantic)
  { sourceControlId: 'aiact-art9', targetControlId: 'gdpr-art35', confidence: 71, status: 'AI Suggested', rationale: 'AI Act risk management system shares conceptual alignment with GDPR DPIA for high-risk processing involving AI.', mappingType: 'Semantic' },
  { sourceControlId: 'aiact-art15', targetControlId: 'cra-annex1-1', confidence: 74, status: 'AI Suggested', rationale: 'AI Act cybersecurity requirements for AI systems align with CRA security by design principles.', mappingType: 'Semantic' },
];

/* ------------------------------------------------------------------ */
/*  ID helper                                                          */
/* ------------------------------------------------------------------ */
let _uid = 8000;
const uid = (prefix = 'id') => `${prefix}-${++_uid}`;

/* ------------------------------------------------------------------ */
/*  Helper functions                                                    */
/* ------------------------------------------------------------------ */

const confidenceColor = (c: number) => {
  if (c >= 90) return 'bg-green-100 text-green-800 border-green-300';
  if (c >= 75) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (c >= 60) return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-red-100 text-red-800 border-red-300';
};

const confidenceBar = (c: number) => {
  if (c >= 90) return 'bg-green-500';
  if (c >= 75) return 'bg-blue-500';
  if (c >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

const statusBadge = (s: ControlMapping['status']) => {
  switch (s) {
    case 'AI Suggested': return 'bg-purple-100 text-purple-700';
    case 'Confirmed': return 'bg-green-100 text-green-700';
    case 'Rejected': return 'bg-red-100 text-red-700';
    case 'Manual': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const mappingTypeBadge = (t: ControlMapping['mappingType']) => {
  switch (t) {
    case 'Full': return 'bg-green-50 text-green-700 border-green-200';
    case 'Partial': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Semantic': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-600';
  }
};

const getControl = (id: string) => CONTROLS_DB.find(c => c.id === id);
const getFramework = (id: string) => FRAMEWORKS.find(f => f.id === id);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const CrossFrameworkMapper: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  /* state */
  const [sourceFrameworkId, setSourceFrameworkId] = useState<string>('');
  const [targetFrameworkId, setTargetFrameworkId] = useState<string>('');
  const [sessions, setSessions] = useState<MappingSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [searchMappings, setSearchMappings] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [activeView, setActiveView] = useState<'mappings' | 'visual' | 'gaps' | 'report'>('mappings');
  const [expandedMapping, setExpandedMapping] = useState<string | null>(null);
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualSource, setManualSource] = useState('');
  const [manualTarget, setManualTarget] = useState('');

  /* derived */
  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) ?? null, [sessions, activeSessionId]);
  const sourceFramework = useMemo(() => getFramework(activeSession?.sourceFrameworkId ?? sourceFrameworkId), [activeSession, sourceFrameworkId]);
  const targetFramework = useMemo(() => getFramework(activeSession?.targetFrameworkId ?? targetFrameworkId), [activeSession, targetFrameworkId]);

  const sourceControls = useMemo(() => {
    const fid = activeSession?.sourceFrameworkId ?? sourceFrameworkId;
    return CONTROLS_DB.filter(c => c.frameworkId === fid);
  }, [activeSession, sourceFrameworkId]);

  const targetControls = useMemo(() => {
    const fid = activeSession?.targetFrameworkId ?? targetFrameworkId;
    return CONTROLS_DB.filter(c => c.frameworkId === fid);
  }, [activeSession, targetFrameworkId]);

  const filteredMappings = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.mappings.filter(m => {
      if (filterStatus !== 'All' && m.status !== filterStatus) return false;
      if (filterType !== 'All' && m.mappingType !== filterType) return false;
      if (searchMappings) {
        const src = getControl(m.sourceControlId);
        const tgt = getControl(m.targetControlId);
        const term = searchMappings.toLowerCase();
        if (!src?.title.toLowerCase().includes(term) && !src?.controlId.toLowerCase().includes(term) && !tgt?.title.toLowerCase().includes(term) && !tgt?.controlId.toLowerCase().includes(term) && !m.rationale.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [activeSession, filterStatus, filterType, searchMappings]);

  /* gap analysis */
  const gapAnalysis = useMemo(() => {
    if (!activeSession) return { unmappedSource: [] as Control[], unmappedTarget: [] as Control[], coverage: 0 };
    const mappedSourceIds = new Set(activeSession.mappings.filter(m => m.status !== 'Rejected').map(m => m.sourceControlId));
    const mappedTargetIds = new Set(activeSession.mappings.filter(m => m.status !== 'Rejected').map(m => m.targetControlId));
    const unmappedSource = sourceControls.filter(c => !mappedSourceIds.has(c.id));
    const unmappedTarget = targetControls.filter(c => !mappedTargetIds.has(c.id));
    const coverage = sourceControls.length > 0 ? Math.round((mappedSourceIds.size / sourceControls.length) * 100) : 0;
    return { unmappedSource, unmappedTarget, coverage };
  }, [activeSession, sourceControls, targetControls]);

  /* callbacks */
  const [aiError, setAiError] = useState<string | null>(null);

  const runMapping = useCallback(async () => {
    if (!sourceFrameworkId || !targetFrameworkId || sourceFrameworkId === targetFrameworkId) return;
    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    setAiError(null);

    const srcFw = FRAMEWORKS.find(f => f.id === sourceFrameworkId);
    const tgtFw = FRAMEWORKS.find(f => f.id === targetFrameworkId);

    try {
      setAnalyzeProgress(10);

      // Call real AI backend for cross-framework mapping
      const aiResult = await api.ai.crossFrameworkMapping(
        srcFw?.name || sourceFrameworkId,
        tgtFw?.name || targetFrameworkId,
        sourceControls.map(c => ({ controlId: c.controlId, title: c.title, description: c.description, domain: c.domain })),
        targetControls.map(c => ({ controlId: c.controlId, title: c.title, description: c.description, domain: c.domain }))
      );

      setAnalyzeProgress(80);

      // Convert AI response into ControlMapping objects
      const aiMappings: ControlMapping[] = (aiResult.mappings || []).map((m: any) => {
        // Match AI-returned control IDs to our internal IDs
        const srcCtl = sourceControls.find(c => c.controlId === m.sourceControlId) || sourceControls[0];
        const tgtCtl = targetControls.find(c => c.controlId === m.targetControlId) || targetControls[0];
        return {
          id: uid('map'),
          sourceControlId: srcCtl?.id || m.sourceControlId,
          targetControlId: tgtCtl?.id || m.targetControlId,
          confidence: m.confidence || 75,
          status: 'AI Suggested' as const,
          rationale: m.rationale || '',
          mappingType: (m.mappingType || 'Semantic') as 'Full' | 'Partial' | 'Semantic',
        };
      });

      // Also include any pre-built mappings that the AI may have missed
      const prebuiltMappings = PREBUILT_MAPPINGS.filter(m => {
        const src = getControl(m.sourceControlId);
        const tgt = getControl(m.targetControlId);
        return (src?.frameworkId === sourceFrameworkId && tgt?.frameworkId === targetFrameworkId) ||
               (src?.frameworkId === targetFrameworkId && tgt?.frameworkId === sourceFrameworkId);
      }).map(m => {
        const src = getControl(m.sourceControlId);
        if (src?.frameworkId === sourceFrameworkId) {
          return { ...m, id: uid('map') };
        }
        return { ...m, id: uid('map'), sourceControlId: m.targetControlId, targetControlId: m.sourceControlId };
      });

      // Merge: AI mappings take precedence, add prebuilt ones that don't overlap
      const aiPairKeys = new Set(aiMappings.map(m => `${m.sourceControlId}:${m.targetControlId}`));
      const mergedMappings = [
        ...aiMappings,
        ...prebuiltMappings.filter(m => !aiPairKeys.has(`${m.sourceControlId}:${m.targetControlId}`)),
      ];

      setAnalyzeProgress(100);

      const totalSource = sourceControls.length;
      const mappedSourceIds = new Set(mergedMappings.map(m => m.sourceControlId));
      const coverage = totalSource > 0 ? Math.round((mappedSourceIds.size / totalSource) * 100) : 0;
      const avgConf = mergedMappings.length > 0 ? Math.round(mergedMappings.reduce((a, m) => a + m.confidence, 0) / mergedMappings.length) : 0;

      const session: MappingSession = {
        id: uid('session'),
        sourceFrameworkId, targetFrameworkId,
        createdDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        status: 'In Progress',
        mappings: mergedMappings as ControlMapping[],
        coveragePercent: coverage,
        avgConfidence: avgConf,
      };

      setSessions(prev => [...prev, session]);
      setActiveSessionId(session.id);
    } catch (error: any) {
      console.error('Cross-framework mapping error:', error);
      setAiError(error?.message || 'Failed to perform AI mapping. Please try again.');

      // Fallback to pre-built mappings only
      const fallbackMappings = PREBUILT_MAPPINGS.filter(m => {
        const src = getControl(m.sourceControlId);
        const tgt = getControl(m.targetControlId);
        return (src?.frameworkId === sourceFrameworkId && tgt?.frameworkId === targetFrameworkId) ||
               (src?.frameworkId === targetFrameworkId && tgt?.frameworkId === sourceFrameworkId);
      }).map(m => {
        const src = getControl(m.sourceControlId);
        if (src?.frameworkId === sourceFrameworkId) return { ...m, id: uid('map') };
        return { ...m, id: uid('map'), sourceControlId: m.targetControlId, targetControlId: m.sourceControlId };
      });

      if (fallbackMappings.length > 0) {
        const totalSource = sourceControls.length;
        const mappedSourceIds = new Set(fallbackMappings.map(m => m.sourceControlId));
        const coverage = totalSource > 0 ? Math.round((mappedSourceIds.size / totalSource) * 100) : 0;
        const avgConf = fallbackMappings.length > 0 ? Math.round(fallbackMappings.reduce((a, m) => a + m.confidence, 0) / fallbackMappings.length) : 0;

        const session: MappingSession = {
          id: uid('session'),
          sourceFrameworkId, targetFrameworkId,
          createdDate: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'In Progress',
          mappings: fallbackMappings as ControlMapping[],
          coveragePercent: coverage,
          avgConfidence: avgConf,
        };
        setSessions(prev => [...prev, session]);
        setActiveSessionId(session.id);
      }
    } finally {
      setIsAnalyzing(false);
      setAnalyzeProgress(0);
    }
  }, [sourceFrameworkId, targetFrameworkId, sourceControls, targetControls]);

  const updateMappingStatus = useCallback((mappingId: string, status: ControlMapping['status']) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const updated = {
        ...s,
        mappings: s.mappings.map(m => m.id === mappingId ? { ...m, status, confirmedBy: status === 'Confirmed' ? 'Current User' : undefined, confirmedDate: status === 'Confirmed' ? new Date().toISOString().split('T')[0] : undefined } : m),
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      // Recalculate coverage
      const sourceCtls = CONTROLS_DB.filter(c => c.frameworkId === s.sourceFrameworkId);
      const mappedIds = new Set(updated.mappings.filter(m => m.status !== 'Rejected').map(m => m.sourceControlId));
      updated.coveragePercent = sourceCtls.length > 0 ? Math.round((mappedIds.size / sourceCtls.length) * 100) : 0;
      updated.avgConfidence = updated.mappings.length > 0 ? Math.round(updated.mappings.filter(m => m.status !== 'Rejected').reduce((a, m) => a + m.confidence, 0) / updated.mappings.filter(m => m.status !== 'Rejected').length) : 0;
      return updated;
    }));
  }, [activeSessionId]);

  const addManualMapping = useCallback(() => {
    if (!manualSource || !manualTarget || !activeSessionId) return;
    const newMapping: ControlMapping = {
      id: uid('map'), sourceControlId: manualSource, targetControlId: manualTarget,
      confidence: 100, status: 'Manual', rationale: 'Manually added by user.',
      mappingType: 'Full',
    };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, mappings: [...s.mappings, newMapping], lastUpdated: new Date().toISOString().split('T')[0] } : s));
    setManualSource(''); setManualTarget(''); setShowAddManual(false);
  }, [manualSource, manualTarget, activeSessionId]);

  const exportReport = useCallback(() => {
    if (!activeSession) return;
    const sf = getFramework(activeSession.sourceFrameworkId);
    const tf = getFramework(activeSession.targetFrameworkId);
    const reportData = {
      title: `Cross-Framework Control Mapping Report`,
      sourceFramework: sf?.name,
      targetFramework: tf?.name,
      generatedDate: new Date().toISOString(),
      summary: {
        totalMappings: activeSession.mappings.length,
        confirmed: activeSession.mappings.filter(m => m.status === 'Confirmed').length,
        aiSuggested: activeSession.mappings.filter(m => m.status === 'AI Suggested').length,
        rejected: activeSession.mappings.filter(m => m.status === 'Rejected').length,
        manual: activeSession.mappings.filter(m => m.status === 'Manual').length,
        coverage: activeSession.coveragePercent,
        averageConfidence: activeSession.avgConfidence,
      },
      mappings: activeSession.mappings.map(m => ({
        source: getControl(m.sourceControlId),
        target: getControl(m.targetControlId),
        confidence: m.confidence,
        status: m.status,
        type: m.mappingType,
        rationale: m.rationale,
      })),
      gaps: {
        unmappedSourceControls: gapAnalysis.unmappedSource.map(c => ({ controlId: c.controlId, title: c.title })),
        unmappedTargetControls: gapAnalysis.unmappedTarget.map(c => ({ controlId: c.controlId, title: c.title })),
      },
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mapping_${sf?.shortName}_to_${tf?.shortName}_report.json`; a.click();
    URL.revokeObjectURL(url);
  }, [activeSession, gapAnalysis]);

  /* ================================================================ */
  /*  RENDER - Framework Selection (no active session)                  */
  /* ================================================================ */
  if (!activeSession) {
    return (
      <div className="h-full flex flex-col space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cross-Framework Control Mapper</h2>
            <p className="text-sm text-gray-500">AI-powered NLP mapping between compliance frameworks with confidence scoring</p>
          </div>
        </div>

        {/* Previous sessions */}
        {sessions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Previous Mapping Sessions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.map(s => {
                const sf = getFramework(s.sourceFrameworkId);
                const tf = getFramework(s.targetFrameworkId);
                return (
                  <div key={s.id} onClick={() => setActiveSessionId(s.id)} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${sf?.color}`}>{sf?.shortName}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${tf?.color}`}>{tf?.shortName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                      <div><p className="font-medium text-gray-900">{s.mappings.length}</p>Mappings</div>
                      <div><p className="font-medium text-gray-900">{s.coveragePercent}%</p>Coverage</div>
                      <div><p className="font-medium text-gray-900">{s.avgConfidence}%</p>Avg Conf.</div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{s.lastUpdated}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New mapping */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Brain size={18} className="text-brand-600" /> New AI-Powered Mapping</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Framework</label>
              <select value={sourceFrameworkId} onChange={e => setSourceFrameworkId(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select source...</option>
                {FRAMEWORKS.map(f => <option key={f.id} value={f.id} disabled={f.id === targetFrameworkId}>{f.name} ({f.controlCount} controls)</option>)}
              </select>
            </div>
            <div className="flex items-center justify-center"><ArrowRight size={24} className="text-gray-400" /></div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Framework</label>
              <select value={targetFrameworkId} onChange={e => setTargetFrameworkId(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select target...</option>
                {FRAMEWORKS.map(f => <option key={f.id} value={f.id} disabled={f.id === sourceFrameworkId}>{f.name} ({f.controlCount} controls)</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={runMapping} disabled={!sourceFrameworkId || !targetFrameworkId || sourceFrameworkId === targetFrameworkId || isAnalyzing} className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Zap size={16} /> Run AI Mapping</>}
            </button>
          </div>
          {isAnalyzing && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Analyzing control relationships...</span>
                <span>{analyzeProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full transition-all duration-300 ${confidenceBar(analyzeProgress)}`} style={{ width: `${analyzeProgress}%` }} /></div>
              <div className="mt-2 text-xs text-gray-400">
                {analyzeProgress < 30 ? 'Parsing source framework controls...' : analyzeProgress < 60 ? 'Running NLP similarity analysis...' : analyzeProgress < 90 ? 'Computing confidence scores...' : 'Finalizing mappings...'}
              </div>
            </div>
          )}
        </div>

        {/* Framework catalog */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Available Frameworks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {FRAMEWORKS.map(f => (
              <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${f.color}`} />
                  <h4 className="font-semibold text-gray-900 text-sm">{f.shortName}</h4>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{f.name}</p>
                <div className="flex justify-between text-xs">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{f.category}</span>
                  <span className="text-gray-400">{f.controlCount} controls</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER - Active Mapping Session                                   */
  /* ================================================================ */
  const confirmed = activeSession.mappings.filter(m => m.status === 'Confirmed').length;
  const aiSuggested = activeSession.mappings.filter(m => m.status === 'AI Suggested').length;
  const rejected = activeSession.mappings.filter(m => m.status === 'Rejected').length;
  const manual = activeSession.mappings.filter(m => m.status === 'Manual').length;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => setActiveSessionId(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${sourceFramework?.color}`}>{sourceFramework?.shortName}</span>
              <ArrowRight size={16} className="text-gray-400" />
              <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${targetFramework?.color}`}>{targetFramework?.shortName}</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{sourceFramework?.name} to {targetFramework?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportReport} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"><Download size={14} /> Export Report</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Mappings', value: activeSession.mappings.length, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'AI Suggested', value: aiSuggested, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Confirmed', value: confirmed, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Rejected', value: rejected, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Coverage', value: `${activeSession.coveragePercent}%`, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Avg Confidence', value: `${activeSession.avgConfidence}%`, color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl border border-gray-200 p-3 text-center`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'mappings' as const, label: 'Control Mappings', icon: <Link2 size={14} /> },
          { key: 'visual' as const, label: 'Visual Diagram', icon: <GitCompare size={14} /> },
          { key: 'gaps' as const, label: `Gap Analysis (${gapAnalysis.unmappedSource.length})`, icon: <Target size={14} /> },
          { key: 'report' as const, label: 'Summary Report', icon: <FileText size={14} /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setActiveView(t.key)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeView === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* MAPPINGS VIEW */}
      {activeView === 'mappings' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchMappings} onChange={e => setSearchMappings(e.target.value)} placeholder="Search controls..." className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
              <option value="All">All Statuses</option>
              {['AI Suggested', 'Confirmed', 'Rejected', 'Manual'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
              <option value="All">All Types</option>
              {['Full', 'Partial', 'Semantic'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => setShowAddManual(true)} className="flex items-center gap-1 bg-brand-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-brand-700"><Plus size={14} /> Manual Mapping</button>
          </div>

          {/* Mapping list */}
          {filteredMappings.map(mapping => {
            const src = getControl(mapping.sourceControlId);
            const tgt = getControl(mapping.targetControlId);
            const isExpanded = expandedMapping === mapping.id;
            return (
              <div key={mapping.id} className={`bg-white rounded-xl border transition-all ${mapping.status === 'Rejected' ? 'border-red-200 opacity-60' : 'border-gray-200'}`}>
                <div className="p-4 cursor-pointer" onClick={() => setExpandedMapping(isExpanded ? null : mapping.id)}>
                  <div className="flex items-center gap-3">
                    {/* Source */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${sourceFramework?.color}`}>{src?.controlId}</span>
                        <span className="font-medium text-gray-900 text-sm truncate">{src?.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{src?.domain}</p>
                    </div>
                    {/* Arrow + Confidence */}
                    <div className="flex flex-col items-center shrink-0 px-2">
                      <div className="flex items-center gap-1">
                        <ArrowRight size={16} className="text-gray-400" />
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${confidenceColor(mapping.confidence)}`}>{mapping.confidence}%</span>
                      </div>
                      <span className={`mt-0.5 px-1.5 py-0 rounded text-[10px] font-medium border ${mappingTypeBadge(mapping.mappingType)}`}>{mapping.mappingType}</span>
                    </div>
                    {/* Target */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${targetFramework?.color}`}>{tgt?.controlId}</span>
                        <span className="font-medium text-gray-900 text-sm truncate">{tgt?.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{tgt?.domain}</p>
                    </div>
                    {/* Status + Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(mapping.status)}`}>{mapping.status}</span>
                      {mapping.status === 'AI Suggested' && (
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); updateMappingStatus(mapping.id, 'Confirmed'); }} className="p-1 rounded hover:bg-green-100 text-green-600" title="Confirm"><ThumbsUp size={14} /></button>
                          <button onClick={e => { e.stopPropagation(); updateMappingStatus(mapping.id, 'Rejected'); }} className="p-1 rounded hover:bg-red-100 text-red-600" title="Reject"><ThumbsDown size={14} /></button>
                        </div>
                      )}
                      {mapping.status === 'Rejected' && (
                        <button onClick={e => { e.stopPropagation(); updateMappingStatus(mapping.id, 'AI Suggested'); }} className="p-1 rounded hover:bg-gray-100 text-gray-500" title="Restore"><RefreshCw size={14} /></button>
                      )}
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>
                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Source: {src?.controlId}</p>
                        <p className="text-sm text-gray-700">{src?.description}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Target: {tgt?.controlId}</p>
                        <p className="text-sm text-gray-700">{tgt?.description}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Brain size={12} /> AI Rationale</p>
                      <p className="text-sm text-gray-700">{mapping.rationale}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Confidence: {mapping.confidence}%</span>
                      <span>Type: {mapping.mappingType}</span>
                      {mapping.confirmedBy && <span>Confirmed by: {mapping.confirmedBy} on {mapping.confirmedDate}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredMappings.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
              <Link2 size={36} className="mx-auto mb-2 opacity-40" />
              <p>No mappings match your current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* VISUAL DIAGRAM VIEW */}
      {activeView === 'visual' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-auto">
          <div className="flex gap-16 min-w-[900px]">
            {/* Source column */}
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-xs text-white ${sourceFramework?.color}`}>{sourceFramework?.shortName}</span> Source Controls</h4>
              <div className="space-y-1.5">
                {sourceControls.map(ctrl => {
                  const hasMappings = activeSession.mappings.some(m => m.sourceControlId === ctrl.id && m.status !== 'Rejected');
                  return (
                    <div key={ctrl.id} className={`px-3 py-2 rounded-lg border text-sm ${hasMappings ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                      <span className="font-mono text-xs font-bold mr-2">{ctrl.controlId}</span>
                      <span className="text-xs">{ctrl.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Mapping lines (simplified visual) */}
            <div className="w-48 shrink-0 flex flex-col items-center justify-center">
              <svg className="w-full h-full" style={{ minHeight: Math.max(sourceControls.length, targetControls.length) * 36 }}>
                {activeSession.mappings.filter(m => m.status !== 'Rejected').map((m, i) => {
                  const srcIdx = sourceControls.findIndex(c => c.id === m.sourceControlId);
                  const tgtIdx = targetControls.findIndex(c => c.id === m.targetControlId);
                  if (srcIdx < 0 || tgtIdx < 0) return null;
                  const y1 = srcIdx * 36 + 18;
                  const y2 = tgtIdx * 36 + 18;
                  const strokeColor = m.confidence >= 90 ? '#22c55e' : m.confidence >= 75 ? '#3b82f6' : m.confidence >= 60 ? '#f59e0b' : '#ef4444';
                  return (
                    <line key={m.id} x1={0} y1={y1} x2={192} y2={y2} stroke={strokeColor} strokeWidth={1.5} strokeOpacity={0.6} />
                  );
                })}
              </svg>
            </div>
            {/* Target column */}
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-xs text-white ${targetFramework?.color}`}>{targetFramework?.shortName}</span> Target Controls</h4>
              <div className="space-y-1.5">
                {targetControls.map(ctrl => {
                  const hasMappings = activeSession.mappings.some(m => m.targetControlId === ctrl.id && m.status !== 'Rejected');
                  return (
                    <div key={ctrl.id} className={`px-3 py-2 rounded-lg border text-sm ${hasMappings ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                      <span className="font-mono text-xs font-bold mr-2">{ctrl.controlId}</span>
                      <span className="text-xs">{ctrl.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-green-500 inline-block" /> 90%+ confidence</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-blue-500 inline-block" /> 75-89%</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-amber-500 inline-block" /> 60-74%</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-red-500 inline-block" /> Below 60%</span>
          </div>
        </div>
      )}

      {/* GAP ANALYSIS VIEW */}
      {activeView === 'gaps' && (
        <div className="space-y-4">
          {/* Coverage overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h4 className="font-semibold text-gray-900 mb-3">Mapping Coverage</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Source Coverage</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${gapAnalysis.coverage >= 80 ? 'bg-green-500' : gapAnalysis.coverage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${gapAnalysis.coverage}%` }} /></div>
                  <span className="text-lg font-bold text-gray-900">{gapAnalysis.coverage}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Unmapped Source Controls</p>
                <p className="text-2xl font-bold text-red-600">{gapAnalysis.unmappedSource.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Unmapped Target Controls</p>
                <p className="text-2xl font-bold text-amber-600">{gapAnalysis.unmappedTarget.length}</p>
              </div>
            </div>
          </div>

          {/* Unmapped source controls */}
          {gapAnalysis.unmappedSource.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Source Controls Without Target Mapping</h4>
              <p className="text-sm text-gray-500 mb-3">These {sourceFramework?.shortName} controls have no equivalent mapping in {targetFramework?.shortName}. Consider implementing additional controls or accepting the gap with justification.</p>
              <div className="space-y-2">
                {gapAnalysis.unmappedSource.map(ctrl => (
                  <div key={ctrl.id} className="flex items-start gap-3 bg-red-50 rounded-lg border border-red-200 p-3">
                    <span className="font-mono text-xs font-bold text-red-800 shrink-0 mt-0.5">{ctrl.controlId}</span>
                    <div>
                      <p className="text-sm font-medium text-red-900">{ctrl.title}</p>
                      <p className="text-xs text-red-700 mt-0.5">{ctrl.description}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">{ctrl.domain}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmapped target controls */}
          {gapAnalysis.unmappedTarget.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Info size={16} className="text-amber-500" /> Target Controls Without Source Mapping</h4>
              <p className="text-sm text-gray-500 mb-3">These {targetFramework?.shortName} controls are not covered by any {sourceFramework?.shortName} control. Additional implementation may be required.</p>
              <div className="space-y-2">
                {gapAnalysis.unmappedTarget.map(ctrl => (
                  <div key={ctrl.id} className="flex items-start gap-3 bg-amber-50 rounded-lg border border-amber-200 p-3">
                    <span className="font-mono text-xs font-bold text-amber-800 shrink-0 mt-0.5">{ctrl.controlId}</span>
                    <div>
                      <p className="text-sm font-medium text-amber-900">{ctrl.title}</p>
                      <p className="text-xs text-amber-700 mt-0.5">{ctrl.description}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs">{ctrl.domain}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gapAnalysis.unmappedSource.length === 0 && gapAnalysis.unmappedTarget.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
              <p className="text-lg font-semibold text-gray-900">Full Coverage Achieved</p>
              <p className="text-sm text-gray-500 mt-1">All controls in both frameworks have been mapped.</p>
            </div>
          )}
        </div>
      )}

      {/* REPORT VIEW */}
      {activeView === 'report' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Mapping Summary Report</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Source</p><p className="font-semibold text-gray-900">{sourceFramework?.name}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Target</p><p className="font-semibold text-gray-900">{targetFramework?.name}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Generated</p><p className="font-semibold text-gray-900">{activeSession.createdDate}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Last Updated</p><p className="font-semibold text-gray-900">{activeSession.lastUpdated}</p></div>
            </div>

            {/* Mapping type breakdown */}
            <h4 className="font-semibold text-gray-900 mb-3">Mapping Type Breakdown</h4>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {(['Full', 'Partial', 'Semantic'] as const).map(type => {
                const count = activeSession.mappings.filter(m => m.mappingType === type && m.status !== 'Rejected').length;
                const pct = activeSession.mappings.filter(m => m.status !== 'Rejected').length > 0 ? Math.round((count / activeSession.mappings.filter(m => m.status !== 'Rejected').length) * 100) : 0;
                return (
                  <div key={type} className={`rounded-lg border p-4 ${mappingTypeBadge(type)}`}>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm font-medium">{type} Mappings ({pct}%)</p>
                    <p className="text-xs mt-1 opacity-75">{type === 'Full' ? 'Direct 1:1 control equivalence' : type === 'Partial' ? 'Overlapping but not identical' : 'Conceptually similar intent'}</p>
                  </div>
                );
              })}
            </div>

            {/* Confidence distribution */}
            <h4 className="font-semibold text-gray-900 mb-3">Confidence Distribution</h4>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: '90-100%', min: 90, max: 100, color: 'bg-green-100 text-green-800' },
                { label: '75-89%', min: 75, max: 89, color: 'bg-blue-100 text-blue-800' },
                { label: '60-74%', min: 60, max: 74, color: 'bg-amber-100 text-amber-800' },
                { label: '<60%', min: 0, max: 59, color: 'bg-red-100 text-red-800' },
              ].map(range => {
                const count = activeSession.mappings.filter(m => m.confidence >= range.min && m.confidence <= range.max && m.status !== 'Rejected').length;
                return (
                  <div key={range.label} className={`rounded-lg p-3 text-center ${range.color}`}>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs">{range.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Review status */}
            <h4 className="font-semibold text-gray-900 mb-3">Review Status</h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-purple-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-purple-700">{aiSuggested}</p><p className="text-xs text-purple-600">Awaiting Review</p></div>
              <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-green-700">{confirmed}</p><p className="text-xs text-green-600">Confirmed</p></div>
              <div className="bg-red-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-red-700">{rejected}</p><p className="text-xs text-red-600">Rejected</p></div>
              <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-blue-700">{manual}</p><p className="text-xs text-blue-600">Manual</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Mapping Modal */}
      {showAddManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Add Manual Mapping</h3><button onClick={() => setShowAddManual(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Control ({sourceFramework?.shortName})</label>
              <select value={manualSource} onChange={e => setManualSource(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select source control...</option>
                {sourceControls.map(c => <option key={c.id} value={c.id}>{c.controlId} - {c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Control ({targetFramework?.shortName})</label>
              <select value={manualTarget} onChange={e => setManualTarget(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select target control...</option>
                {targetControls.map(c => <option key={c.id} value={c.id}>{c.controlId} - {c.title}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddManual(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={addManualMapping} disabled={!manualSource || !manualTarget} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">Add Mapping</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
