import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Government and Defense Frameworks
 * ITAR, EAR, DFARS, NATO STANAG, UK Cyber Essentials, Cyber Essentials Plus, IRAP, PROTECTED Australia
 */

export const ITAR_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ITAR-1.1',
    name: 'USML Classification',
    description: 'Determine if items are on the US Munitions List requiring ITAR compliance.',
    category: 'Classification',
    implementationGuidance: 'Review products against USML. Document classification decisions. Obtain commodity jurisdiction determinations. Maintain records.',
    evidenceRequirements: ['USML review records', 'Classification decisions', 'CJ determinations', 'Classification records'],
    testProcedures: ['Review classification process', 'Verify decisions', 'Check determinations', 'Assess records'],
    status: 'Not Started'
  },
  {
    controlId: 'ITAR-1.2',
    name: 'Registration',
    description: 'Register with DDTC as required for manufacturers and exporters of defense articles.',
    category: 'Registration',
    implementationGuidance: 'Determine registration requirement. Complete registration. Maintain registration. Renew annually.',
    evidenceRequirements: ['Registration requirement analysis', 'Registration documentation', 'Maintenance records', 'Renewal records'],
    testProcedures: ['Review requirement', 'Verify registration', 'Check maintenance', 'Assess renewals'],
    status: 'Not Started'
  },
  {
    controlId: 'ITAR-2.1',
    name: 'Export License',
    description: 'Obtain required export licenses for defense articles and services.',
    category: 'Export Control',
    implementationGuidance: 'Identify license requirements. Apply for licenses. Track licenses. Ensure compliance with terms.',
    evidenceRequirements: ['License requirements', 'License applications', 'License tracking', 'Compliance records'],
    testProcedures: ['Review requirements', 'Verify applications', 'Check tracking', 'Assess compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'ITAR-2.2',
    name: 'Technical Data Controls',
    description: 'Control access to ITAR-controlled technical data.',
    category: 'Data Protection',
    implementationGuidance: 'Identify technical data. Implement access controls. Restrict foreign access. Document access.',
    evidenceRequirements: ['Technical data inventory', 'Access controls', 'Foreign access restrictions', 'Access documentation'],
    testProcedures: ['Review inventory', 'Test controls', 'Verify restrictions', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ITAR-3.1',
    name: 'Foreign Person Controls',
    description: 'Control foreign person access to ITAR-controlled items and data.',
    category: 'Personnel',
    implementationGuidance: 'Screen personnel. Identify foreign persons. Restrict access. Monitor compliance.',
    evidenceRequirements: ['Personnel screening', 'Foreign person identification', 'Access restrictions', 'Compliance monitoring'],
    testProcedures: ['Test screening', 'Verify identification', 'Check restrictions', 'Assess monitoring'],
    status: 'Not Started'
  }
];

export const EAR_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'EAR-1.1',
    name: 'ECCN Classification',
    description: 'Classify items under Export Control Classification Number for EAR compliance.',
    category: 'Classification',
    implementationGuidance: 'Review items against CCL. Determine ECCN. Document classification. Request classification assistance if needed.',
    evidenceRequirements: ['CCL review', 'ECCN determination', 'Classification documentation', 'BIS consultation records'],
    testProcedures: ['Review classification', 'Verify ECCN', 'Check documentation', 'Assess BIS records'],
    status: 'Not Started'
  },
  {
    controlId: 'EAR-1.2',
    name: 'License Determination',
    description: 'Determine license requirements based on item, destination, end-use, and end-user.',
    category: 'Licensing',
    implementationGuidance: 'Check license exceptions. Screen end-users. Determine requirements. Apply for licenses.',
    evidenceRequirements: ['Exception analysis', 'End-user screening', 'License requirements', 'License applications'],
    testProcedures: ['Review exceptions', 'Verify screening', 'Check requirements', 'Assess applications'],
    status: 'Not Started'
  },
  {
    controlId: 'EAR-2.1',
    name: 'Denied Party Screening',
    description: 'Screen parties against denied party lists.',
    category: 'Screening',
    implementationGuidance: 'Implement screening tools. Screen all transactions. Document results. Escalate matches.',
    evidenceRequirements: ['Screening tools', 'Transaction screening', 'Screening results', 'Match escalation'],
    testProcedures: ['Test screening tools', 'Verify screening', 'Check results', 'Assess escalation'],
    status: 'Not Started'
  },
  {
    controlId: 'EAR-2.2',
    name: 'Red Flag Indicators',
    description: 'Train on and respond to red flag indicators of diversion.',
    category: 'Due Diligence',
    implementationGuidance: 'Train staff on red flags. Document red flag responses. Investigate concerns. Refuse suspicious transactions.',
    evidenceRequirements: ['Training records', 'Red flag documentation', 'Investigation records', 'Transaction refusals'],
    testProcedures: ['Verify training', 'Review documentation', 'Check investigations', 'Assess refusals'],
    status: 'Not Started'
  }
];

export const DFARS_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'DFARS-252.204-7012',
    name: 'Safeguarding Covered Defense Information',
    description: 'Implement NIST 800-171 controls for covered defense information.',
    category: 'Information Protection',
    implementationGuidance: 'Identify CDI. Implement NIST 800-171. Assess compliance. Report gaps.',
    evidenceRequirements: ['CDI identification', 'NIST 800-171 implementation', 'Assessment records', 'Gap reporting'],
    testProcedures: ['Review CDI', 'Test controls', 'Verify assessment', 'Check reporting'],
    status: 'Not Started'
  },
  {
    controlId: 'DFARS-252.204-7019',
    name: 'NIST 800-171 Assessment',
    description: 'Conduct or submit assessment of NIST 800-171 compliance.',
    category: 'Assessment',
    implementationGuidance: 'Conduct self-assessment. Submit to SPRS. Update for changes. Maintain accuracy.',
    evidenceRequirements: ['Self-assessment', 'SPRS submission', 'Update records', 'Accuracy verification'],
    testProcedures: ['Review assessment', 'Verify submission', 'Check updates', 'Assess accuracy'],
    status: 'Not Started'
  },
  {
    controlId: 'DFARS-252.204-7020',
    name: 'NIST 800-171 Assessment Requirements',
    description: 'Support government assessment of NIST 800-171 compliance.',
    category: 'Assessment',
    implementationGuidance: 'Prepare for assessment. Provide access. Support assessors. Address findings.',
    evidenceRequirements: ['Assessment preparation', 'Access provision', 'Support records', 'Finding remediation'],
    testProcedures: ['Review preparation', 'Verify access', 'Check support', 'Assess remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'DFARS-252.204-7021',
    name: 'CMMC Requirements',
    description: 'Achieve required CMMC certification level.',
    category: 'Certification',
    implementationGuidance: 'Determine required level. Implement controls. Obtain assessment. Achieve certification.',
    evidenceRequirements: ['Level determination', 'Control implementation', 'Assessment records', 'Certification'],
    testProcedures: ['Review level', 'Test controls', 'Verify assessment', 'Check certification'],
    status: 'Not Started'
  },
  {
    controlId: 'DFARS-252.204-7012-IR',
    name: 'Cyber Incident Reporting',
    description: 'Report cyber incidents affecting covered defense information within 72 hours.',
    category: 'Incident Response',
    implementationGuidance: 'Detect incidents. Assess impact. Report within 72 hours. Preserve evidence.',
    evidenceRequirements: ['Detection capability', 'Impact assessment', 'Reporting records', 'Evidence preservation'],
    testProcedures: ['Test detection', 'Verify assessment', 'Check reporting', 'Assess preservation'],
    status: 'Not Started'
  }
];

export const UK_CYBER_ESSENTIALS_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'CE-1.1',
    name: 'Firewalls',
    description: 'Protect internet connection with firewalls.',
    category: 'Boundary Firewalls',
    implementationGuidance: 'Install firewalls. Configure default deny. Change default passwords. Block unnecessary services.',
    evidenceRequirements: ['Firewall installation', 'Configuration records', 'Password changes', 'Service blocking'],
    testProcedures: ['Test firewalls', 'Verify configuration', 'Check passwords', 'Test blocking'],
    status: 'Not Started'
  },
  {
    controlId: 'CE-1.2',
    name: 'Secure Configuration',
    description: 'Configure devices securely.',
    category: 'Secure Configuration',
    implementationGuidance: 'Remove unnecessary software. Change defaults. Disable auto-run. Implement screen locks.',
    evidenceRequirements: ['Software removal', 'Default changes', 'Auto-run disabling', 'Screen lock configuration'],
    testProcedures: ['Verify software', 'Check defaults', 'Test auto-run', 'Check screen locks'],
    status: 'Not Started'
  },
  {
    controlId: 'CE-1.3',
    name: 'Access Control',
    description: 'Control access to data and services.',
    category: 'Access Control',
    implementationGuidance: 'Create user accounts. Implement least privilege. Use strong authentication. Manage admin accounts.',
    evidenceRequirements: ['User accounts', 'Privilege assignment', 'Authentication configuration', 'Admin management'],
    testProcedures: ['Review accounts', 'Verify privileges', 'Test authentication', 'Check admin accounts'],
    status: 'Not Started'
  },
  {
    controlId: 'CE-1.4',
    name: 'Malware Protection',
    description: 'Protect against malware.',
    category: 'Malware Protection',
    implementationGuidance: 'Install anti-malware. Keep updated. Configure scanning. Use application allowlisting.',
    evidenceRequirements: ['Anti-malware installation', 'Update records', 'Scan configuration', 'Allowlisting'],
    testProcedures: ['Test anti-malware', 'Verify updates', 'Check scanning', 'Test allowlisting'],
    status: 'Not Started'
  },
  {
    controlId: 'CE-1.5',
    name: 'Security Update Management',
    description: 'Keep software up to date.',
    category: 'Patch Management',
    implementationGuidance: 'Inventory software. Apply patches within 14 days. Remove unsupported software. Document updates.',
    evidenceRequirements: ['Software inventory', 'Patch records', 'Unsupported software removal', 'Update documentation'],
    testProcedures: ['Review inventory', 'Verify patches', 'Check removal', 'Assess documentation'],
    status: 'Not Started'
  }
];

export const CYBER_ESSENTIALS_PLUS_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'CEP-1.1',
    name: 'Independent Technical Verification',
    description: 'Undergo independent technical testing of Cyber Essentials controls.',
    category: 'Verification',
    implementationGuidance: 'Prepare for assessment. Support testing. Address findings. Obtain certification.',
    evidenceRequirements: ['Assessment preparation', 'Testing support', 'Finding remediation', 'Certification'],
    testProcedures: ['Review preparation', 'Verify testing', 'Check remediation', 'Assess certification'],
    status: 'Not Started'
  },
  {
    controlId: 'CEP-1.2',
    name: 'Vulnerability Scanning',
    description: 'Undergo external and internal vulnerability scanning.',
    category: 'Verification',
    implementationGuidance: 'Support external scanning. Support internal scanning. Remediate findings. Document results.',
    evidenceRequirements: ['External scan results', 'Internal scan results', 'Remediation records', 'Result documentation'],
    testProcedures: ['Review external scans', 'Review internal scans', 'Verify remediation', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CEP-1.3',
    name: 'On-Site Assessment',
    description: 'Support on-site assessment by certification body.',
    category: 'Verification',
    implementationGuidance: 'Prepare documentation. Support assessors. Address findings. Maintain compliance.',
    evidenceRequirements: ['Documentation package', 'Assessor support', 'Finding resolution', 'Compliance evidence'],
    testProcedures: ['Review documentation', 'Verify support', 'Check resolution', 'Assess compliance'],
    status: 'Not Started'
  }
];

export const IRAP_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'IRAP-1.1',
    name: 'ISM Control Implementation',
    description: 'Implement Information Security Manual controls for Australian government.',
    category: 'Security Controls',
    implementationGuidance: 'Identify applicable ISM controls. Implement controls. Document implementation. Prepare for assessment.',
    evidenceRequirements: ['Control identification', 'Implementation records', 'Documentation', 'Assessment preparation'],
    testProcedures: ['Review controls', 'Test implementation', 'Check documentation', 'Assess preparation'],
    status: 'Not Started'
  },
  {
    controlId: 'IRAP-1.2',
    name: 'IRAP Assessment',
    description: 'Undergo assessment by IRAP assessor.',
    category: 'Assessment',
    implementationGuidance: 'Select IRAP assessor. Prepare for assessment. Support assessment. Address findings.',
    evidenceRequirements: ['Assessor selection', 'Assessment preparation', 'Assessment support', 'Finding remediation'],
    testProcedures: ['Verify assessor', 'Review preparation', 'Check support', 'Assess remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'IRAP-1.3',
    name: 'Security Documentation',
    description: 'Prepare security documentation including System Security Plan.',
    category: 'Documentation',
    implementationGuidance: 'Develop System Security Plan. Document security controls. Prepare incident response plan. Maintain documentation.',
    evidenceRequirements: ['System Security Plan', 'Control documentation', 'Incident response plan', 'Documentation maintenance'],
    testProcedures: ['Review SSP', 'Verify controls', 'Check IRP', 'Assess maintenance'],
    status: 'Not Started'
  }
];

export const PROTECTED_AUSTRALIA_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'PROT-1.1',
    name: 'PROTECTED Classification Handling',
    description: 'Implement controls for handling PROTECTED classified information.',
    category: 'Classification',
    implementationGuidance: 'Identify PROTECTED information. Apply handling requirements. Control access. Document handling.',
    evidenceRequirements: ['Information identification', 'Handling requirements', 'Access controls', 'Handling documentation'],
    testProcedures: ['Review identification', 'Test handling', 'Check access', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'PROT-1.2',
    name: 'Personnel Security',
    description: 'Ensure appropriate personnel security for PROTECTED access.',
    category: 'Personnel',
    implementationGuidance: 'Obtain security clearances. Brief personnel. Monitor access. Debrief on departure.',
    evidenceRequirements: ['Clearance records', 'Briefing records', 'Access monitoring', 'Departure debriefs'],
    testProcedures: ['Verify clearances', 'Check briefings', 'Test monitoring', 'Review debriefs'],
    status: 'Not Started'
  },
  {
    controlId: 'PROT-2.1',
    name: 'ICT Security for PROTECTED',
    description: 'Implement ICT security controls for PROTECTED systems.',
    category: 'ICT Security',
    implementationGuidance: 'Apply ISM controls. Implement encryption. Control network access. Monitor systems.',
    evidenceRequirements: ['ISM control implementation', 'Encryption configuration', 'Network controls', 'System monitoring'],
    testProcedures: ['Test ISM controls', 'Verify encryption', 'Check network controls', 'Review monitoring'],
    status: 'Not Started'
  }
];
