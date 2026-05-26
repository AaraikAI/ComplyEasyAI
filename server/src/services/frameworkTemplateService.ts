/**
 * Framework Template Service
 *
 * Loads pre-built compliance control templates for major frameworks
 * and applies them to organization frameworks in the database.
 */
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { SOC2_CONTROLS } from '../data/frameworks/soc2Controls';
import { ISO27001_CONTROLS } from '../data/frameworks/iso27001Controls';
import { HIPAA_CONTROLS } from '../data/frameworks/hipaaControls';
import { GDPR_CONTROLS } from '../data/frameworks/gdprControls';
import { PCI_DSS_CONTROLS } from '../data/frameworks/pciDssControls';
import { NIST_800_53_CONTROLS } from '../data/frameworks/nist80053Controls';
import { CCPA_CONTROLS } from '../data/frameworks/ccpaControls';
import { SOX_CONTROLS } from '../data/frameworks/soxControls';
import { NIST_CSF_CONTROLS } from '../data/frameworks/nistCsfControls';
import { FEDRAMP_CONTROLS } from '../data/frameworks/fedRampControls';
import { CMMC_CONTROLS } from '../data/frameworks/cmmcControls';
import { HITRUST_CONTROLS } from '../data/frameworks/hitrustControls';
import { CIS_CONTROLS } from '../data/frameworks/cisControls';
import { ISO27017_CONTROLS } from '../data/frameworks/iso27017Controls';
import { EU_AI_ACT_CONTROLS } from '../data/frameworks/euAiActControls';
import { NIS2_CONTROLS } from '../data/frameworks/nis2Controls';
import { DORA_CONTROLS } from '../data/frameworks/doraControls';
import { NIST800171_CONTROLS } from '../data/frameworks/nist800171Controls';
import { ISO27701_CONTROLS } from '../data/frameworks/iso27701Controls';
import { CSA_CCM_CONTROLS } from '../data/frameworks/csaCcmControls';
import { ISO27018_CONTROLS } from '../data/frameworks/iso27018Controls';
import { ISO22301_CONTROLS } from '../data/frameworks/iso22301Controls';
import { COBIT_CONTROLS } from '../data/frameworks/cobitControls';
import { GLBA_CONTROLS } from '../data/frameworks/glbaControls';
import { SOC1_CONTROLS } from '../data/frameworks/soc1Controls';
import { FISMA_CONTROLS } from '../data/frameworks/fismaControls';
import { VCDPA_CONTROLS, CPA_CONTROLS, CTDPA_CONTROLS, UCPA_CONTROLS, TDPSA_CONTROLS } from '../data/frameworks/statePrivacyControls';
import { NIST80063_CONTROLS } from '../data/frameworks/nist80063Controls';
import { PIPEDA_CONTROLS } from '../data/frameworks/pipedaControls';
import { LGPD_CONTROLS } from '../data/frameworks/lgpdControls';
import { PDPA_CONTROLS } from '../data/frameworks/pdpaControls';
import { HITECH_CONTROLS } from '../data/frameworks/hitechControls';
import { ISO21434_CONTROLS } from '../data/frameworks/iso21434Controls';
import { IEC62443_CONTROLS } from '../data/frameworks/iec62443Controls';
import { CFR42PART2_CONTROLS } from '../data/frameworks/cfr42Part2Controls';
import { NIST80082_CONTROLS } from '../data/frameworks/nist80082Controls';
import { FDA21CFR11_CONTROLS } from '../data/frameworks/fda21cfrPart11Controls';
import { POPIA_CONTROLS } from '../data/frameworks/popiaControls';
import { APPI_CONTROLS } from '../data/frameworks/appiControls';
import { NIST80066_CONTROLS } from '../data/frameworks/nist80066Controls';
import { NERC_CIP_CONTROLS } from '../data/frameworks/nerc_cipControls';
import { SOC2_PLUS_CONTROLS } from '../data/frameworks/soc2PlusControls';
import { ISO27799_CONTROLS } from '../data/frameworks/iso27799Controls';
import { TISAX_CONTROLS } from '../data/frameworks/tisaxControls';
import { OCPA_CONTROLS, MCDPA_CONTROLS, DPDPA_CONTROLS, ICDPA_CONTROLS, NJDPA_CONTROLS } from '../data/frameworks/moreStatePrivacyControls';
import { PCI_DSS4_CONTROLS } from '../data/frameworks/pcidss4Controls';
import { ISO13485_CONTROLS } from '../data/frameworks/iso13485Controls';

// Additional frameworks - EU Digital Regulations
import { DMA_CONTROLS } from '../data/frameworks/dmaControls';
import { DSA_CONTROLS } from '../data/frameworks/dsaControls';
import { EU_CRA_CONTROLS } from '../data/frameworks/euCraControls';
import { CSRD_CONTROLS } from '../data/frameworks/csrdControls';
import { ECODESIGN_CONTROLS } from '../data/frameworks/ecodesignControls';
import { DATA_ACT_CONTROLS } from '../data/frameworks/dataActControls';
import { DATA_GOVERNANCE_ACT_CONTROLS } from '../data/frameworks/dataGovernanceActControls';
import { EU_WHISTLEBLOWER_CONTROLS, EU_PRODUCT_LIABILITY_CONTROLS, MACHINERY_REGULATION_CONTROLS, EPRIVACY_CONTROLS, MIFID_II_CONTROLS, PSD2_CONTROLS, ENISA_CONTROLS, ADEQUACY_DECISION_CONTROLS } from '../data/frameworks/euRegulationsControls';

// Additional ISO Standards
import { ISO9001_CONTROLS } from '../data/frameworks/iso9001Controls';
import { ISO14001_CONTROLS } from '../data/frameworks/iso14001Controls';
import { ISO45001_CONTROLS } from '../data/frameworks/iso45001Controls';
import { ISO_27002_2022_CONTROLS, ISO_27005_CONTROLS, ISO_31000_CONTROLS, ISO_27035_CONTROLS, ISO_27032_CONTROLS, ISO_20000_1_CONTROLS, ISO_42001_CONTROLS } from '../data/frameworks/isoAdditionalControls';

// Additional US Federal & State
import { NYDFS_CONTROLS } from '../data/frameworks/nydfsControls';
import { FERPA_CONTROLS } from '../data/frameworks/ferpaControls';
import { COPPA_CONTROLS } from '../data/frameworks/coppaControls';
import { CJIS_CONTROLS } from '../data/frameworks/cjisControls';
import { INCDPA_CONTROLS, TIPA_CONTROLS, NH_PRIVACY_CONTROLS as NH_CONTROLS, MD_PRIVACY_CONTROLS as MD_CONTROLS, MN_PRIVACY_CONTROLS as MN_CONTROLS, NE_PRIVACY_CONTROLS as NE_CONTROLS, RI_PRIVACY_CONTROLS as RI_CONTROLS, VT_PRIVACY_CONTROLS as VT_CONTROLS, KCDPA_CONTROLS } from '../data/frameworks/additionalStatePrivacyControls';

// Additional International Privacy
import { PDPA_MALAYSIA_CONTROLS, PIPL_CONTROLS, PDPB_CONTROLS, PRIVACY_SHIELD_CONTROLS, APEC_CBPR_CONTROLS } from '../data/frameworks/internationalPrivacyControls';

// Additional Security Standards
import { NIST_800_207_CONTROLS, NIST_800_218_CONTROLS, NIST_800_172_CONTROLS, FIPS_140_3_CONTROLS } from '../data/frameworks/nistSecurityControls';
import { OWASP_TOP_10_CONTROLS as OWASP_TOP10_CONTROLS, OWASP_SAMM_CONTROLS, ASVS_CONTROLS } from '../data/frameworks/owaspControls';
import { CSA_STAR_CONTROLS, CIS_RAM_CONTROLS, MITRE_ATTACK_CONTROLS, MITRE_D3FEND_CONTROLS, SANS_TOP_20_CONTROLS, BSIMM_CONTROLS, IEEE_P2675_CONTROLS, COMMON_CRITERIA_CONTROLS } from '../data/frameworks/cloudTechControls';

// Financial Controls
import { BASEL_III_CONTROLS, SOC3_CONTROLS, SOX_ITGC_CONTROLS, FFIEC_CAT_CONTROLS, SWIFT_CSP_CONTROLS, OSFI_B13_CONTROLS, APRA_CPS234_CONTROLS, MAS_TRM_CONTROLS, FCA_PRA_CONTROLS } from '../data/frameworks/financialControls';

// Government & Defense
import { ITAR_CONTROLS, EAR_CONTROLS, DFARS_CONTROLS, UK_CYBER_ESSENTIALS_CONTROLS, CYBER_ESSENTIALS_PLUS_CONTROLS, IRAP_CONTROLS, PROTECTED_AUSTRALIA_CONTROLS } from '../data/frameworks/governmentDefenseControls';

// Healthcare
import { EU_MDR_CONTROLS, EU_IVDR_CONTROLS, ICH_GUIDELINES_CONTROLS, GAMP5_CONTROLS, HL7_FHIR_SECURITY_CONTROLS, FDA_21_CFR_820_CONTROLS, GXP_CONTROLS } from '../data/frameworks/healthcareControls';

// Industrial
import { GSMA_NESAS_CONTROLS, THREE_GPP_SECURITY_CONTROLS, IEC_62351_CONTROLS, TSA_PIPELINE_CONTROLS } from '../data/frameworks/industrialControls';

// Automotive & IoT
import { UNECE_WP29_CONTROLS, ETSI_EN_303_645_CONTROLS, IEC_62443_4_1_CONTROLS, MATTER_PROTOCOL_CONTROLS } from '../data/frameworks/automotiveIoTControls';

// Quality & Process
import { ITIL_CONTROLS, CMMI_CONTROLS } from '../data/frameworks/qualityFrameworkControls';

// 2026 framework additions: 4 AI laws + 4 ISO/NIST AI standards + 4 amendments
import { TRAIGA_CONTROLS } from '../data/frameworks/traigaControls';
import { COLORADO_AI_ACT_CONTROLS } from '../data/frameworks/coloradoAiActControls';
import { KOREA_AI_BASIC_ACT_CONTROLS } from '../data/frameworks/koreaAiBasicActControls';
import { CALIFORNIA_AI_TRANSPARENCY_CONTROLS } from '../data/frameworks/californiaAiTransparencyControls';
import { ISO_23894_CONTROLS } from '../data/frameworks/iso23894Controls';
import { ISO_5338_CONTROLS } from '../data/frameworks/iso5338Controls';
import { ISO_38507_CONTROLS } from '../data/frameworks/iso38507Controls';
import { NIST_AI_600_1_CONTROLS } from '../data/frameworks/nistAi600Controls';
import { ISO_27001_AMD1_CONTROLS } from '../data/frameworks/iso27001Amd1Controls';
import { NYDFS_AMD2_CONTROLS } from '../data/frameworks/nydfsAmd2Controls';
import { CMMC_2_FINAL_CONTROLS } from '../data/frameworks/cmmc2FinalControls';
import { HIPAA_SECURITY_NPRM_CONTROLS } from '../data/frameworks/hipaaSecurityNprmControls';

import { getMappingsBetweenFrameworks } from '../data/frameworks/controlCrosswalk';
import type { FrameworkControlTemplate } from '../data/frameworks/soc2Controls';

export { FrameworkControlTemplate };

// Map framework names/types to their control templates
const FRAMEWORK_TEMPLATE_MAP: Record<string, { controls: FrameworkControlTemplate[]; displayName: string; description: string }> = {
  'SOC 2 Type II': {
    controls: SOC2_CONTROLS,
    displayName: 'SOC 2 Type II',
    description: 'AICPA Trust Service Criteria covering Security, Availability, Processing Integrity, Confidentiality, and Privacy',
  },
  'ISO 27001': {
    controls: ISO27001_CONTROLS,
    displayName: 'ISO 27001:2022',
    description: 'International standard for information security management systems with 93 Annex A controls',
  },
  'HIPAA': {
    controls: HIPAA_CONTROLS,
    displayName: 'HIPAA Security Rule',
    description: 'Health Insurance Portability and Accountability Act safeguards for protected health information',
  },
  'GDPR': {
    controls: GDPR_CONTROLS,
    displayName: 'GDPR',
    description: 'EU General Data Protection Regulation covering data subject rights and controller obligations',
  },
  'PCI DSS': {
    controls: PCI_DSS_CONTROLS,
    displayName: 'PCI DSS v4.0',
    description: 'Payment Card Industry Data Security Standard with 12 core requirements',
  },
  'NIST 800-53': {
    controls: NIST_800_53_CONTROLS,
    displayName: 'NIST 800-53 Rev 5',
    description: 'Security and Privacy Controls for Information Systems across 20 control families',
  },
  'CCPA': {
    controls: CCPA_CONTROLS,
    displayName: 'CCPA/CPRA',
    description: 'California Consumer Privacy Act and California Privacy Rights Act compliance requirements',
  },
  'SOX': {
    controls: SOX_CONTROLS,
    displayName: 'SOX (Sarbanes-Oxley)',
    description: 'IT General Controls and financial reporting controls for public company compliance',
  },
  'NIST CSF': {
    controls: NIST_CSF_CONTROLS,
    displayName: 'NIST CSF 2.0',
    description: 'Cybersecurity Framework 2.0 with Govern, Identify, Protect, Detect, Respond, and Recover functions',
  },
  'FedRAMP': {
    controls: FEDRAMP_CONTROLS,
    displayName: 'FedRAMP Moderate',
    description: 'Federal Risk and Authorization Management Program for cloud service providers',
  },
  'CMMC': {
    controls: CMMC_CONTROLS,
    displayName: 'CMMC 2.0',
    description: 'Cybersecurity Maturity Model Certification for Department of Defense contractors',
  },
  'HITRUST CSF': {
    controls: HITRUST_CONTROLS,
    displayName: 'HITRUST CSF',
    description: 'Health Information Trust Alliance Common Security Framework for healthcare organizations',
  },
  'CIS Controls': {
    controls: CIS_CONTROLS,
    displayName: 'CIS Controls v8',
    description: 'Center for Internet Security Controls with 18 critical security controls and implementation groups',
  },
  'ISO 27017': {
    controls: ISO27017_CONTROLS,
    displayName: 'ISO 27017:2015',
    description: 'Cloud security controls extending ISO 27001 with guidance for cloud service providers and customers',
  },
  'EU AI Act': {
    controls: EU_AI_ACT_CONTROLS,
    displayName: 'EU AI Act (2024/1689)',
    description: 'European Union Artificial Intelligence Act establishing comprehensive AI regulation with risk-based approach',
  },
  'NIS2': {
    controls: NIS2_CONTROLS,
    displayName: 'NIS2 Directive (2022/2555)',
    description: 'EU Network and Information Security Directive 2 for essential and important entities across critical sectors',
  },
  'DORA': {
    controls: DORA_CONTROLS,
    displayName: 'DORA (2022/2554)',
    description: 'Digital Operational Resilience Act for financial entities covering ICT risk management and operational resilience',
  },
  'NIST 800-171': {
    controls: NIST800171_CONTROLS,
    displayName: 'NIST SP 800-171 Rev 2',
    description: 'Protecting Controlled Unclassified Information (CUI) in nonfederal systems with 110 security requirements',
  },
  'ISO 27701': {
    controls: ISO27701_CONTROLS,
    displayName: 'ISO 27701:2019',
    description: 'Privacy Information Management System (PIMS) extending ISO 27001/27002 for privacy compliance',
  },
  'CSA CCM': {
    controls: CSA_CCM_CONTROLS,
    displayName: 'CSA CCM v4.0',
    description: 'Cloud Security Alliance Cloud Controls Matrix with 17 domains covering cloud security governance and operations',
  },
  'ISO 27018': {
    controls: ISO27018_CONTROLS,
    displayName: 'ISO 27018:2019',
    description: 'Code of practice for protection of personally identifiable information (PII) in public clouds acting as PII processors',
  },
  'ISO 22301': {
    controls: ISO22301_CONTROLS,
    displayName: 'ISO 22301:2019',
    description: 'Business Continuity Management Systems requirements for planning, implementing, and maintaining a BCMS',
  },
  'COBIT': {
    controls: COBIT_CONTROLS,
    displayName: 'COBIT 2019',
    description: 'Control Objectives for Information and Related Technologies framework for IT governance and management',
  },
  'GLBA': {
    controls: GLBA_CONTROLS,
    displayName: 'GLBA Safeguards Rule',
    description: 'Gramm-Leach-Bliley Act requirements for financial institutions to protect customer information',
  },
  'SOC 1': {
    controls: SOC1_CONTROLS,
    displayName: 'SOC 1 Type II',
    description: 'Service Organization Control 1 report on controls relevant to user entities internal control over financial reporting',
  },
  'FISMA': {
    controls: FISMA_CONTROLS,
    displayName: 'FISMA',
    description: 'Federal Information Security Modernization Act requirements for federal agency information security programs',
  },
  'VCDPA': {
    controls: VCDPA_CONTROLS,
    displayName: 'VCDPA',
    description: 'Virginia Consumer Data Protection Act consumer privacy rights and controller obligations',
  },
  'CPA': {
    controls: CPA_CONTROLS,
    displayName: 'Colorado Privacy Act',
    description: 'Colorado Privacy Act consumer privacy rights including universal opt-out mechanism requirements',
  },
  'CTDPA': {
    controls: CTDPA_CONTROLS,
    displayName: 'CTDPA',
    description: 'Connecticut Data Privacy Act consumer privacy rights and data protection requirements',
  },
  'UCPA': {
    controls: UCPA_CONTROLS,
    displayName: 'UCPA',
    description: 'Utah Consumer Privacy Act consumer privacy rights for businesses with specific revenue/data thresholds',
  },
  'TDPSA': {
    controls: TDPSA_CONTROLS,
    displayName: 'TDPSA',
    description: 'Texas Data Privacy and Security Act consumer privacy rights with small business accommodations',
  },
  'NIST 800-63': {
    controls: NIST80063_CONTROLS,
    displayName: 'NIST SP 800-63-3',
    description: 'Digital Identity Guidelines covering identity proofing, authentication, and federation assurance levels',
  },
  'PIPEDA': {
    controls: PIPEDA_CONTROLS,
    displayName: 'PIPEDA',
    description: 'Canada Personal Information Protection and Electronic Documents Act with 10 fair information principles',
  },
  'LGPD': {
    controls: LGPD_CONTROLS,
    displayName: 'LGPD',
    description: 'Brazil Lei Geral de Proteção de Dados - comprehensive data protection law modeled after GDPR',
  },
  'PDPA': {
    controls: PDPA_CONTROLS,
    displayName: 'PDPA Singapore',
    description: 'Singapore Personal Data Protection Act governing collection, use, and disclosure of personal data',
  },
  'HITECH': {
    controls: HITECH_CONTROLS,
    displayName: 'HITECH Act',
    description: 'Health Information Technology for Economic and Clinical Health Act strengthening HIPAA with breach notification',
  },
  'ISO 21434': {
    controls: ISO21434_CONTROLS,
    displayName: 'ISO/SAE 21434:2021',
    description: 'Road Vehicles Cybersecurity Engineering standard covering entire vehicle lifecycle',
  },
  'IEC 62443': {
    controls: IEC62443_CONTROLS,
    displayName: 'IEC 62443',
    description: 'Industrial Automation and Control Systems Security standard series for OT/ICS environments',
  },
  '42 CFR Part 2': {
    controls: CFR42PART2_CONTROLS,
    displayName: '42 CFR Part 2',
    description: 'Confidentiality of Substance Use Disorder Patient Records federal regulations',
  },
  'NIST 800-82': {
    controls: NIST80082_CONTROLS,
    displayName: 'NIST SP 800-82 Rev 3',
    description: 'Guide to Operational Technology (OT) Security for ICS, SCADA, and industrial control systems',
  },
  'FDA 21 CFR Part 11': {
    controls: FDA21CFR11_CONTROLS,
    displayName: 'FDA 21 CFR Part 11',
    description: 'Electronic Records and Electronic Signatures requirements for FDA-regulated industries',
  },
  'POPIA': {
    controls: POPIA_CONTROLS,
    displayName: 'POPIA',
    description: 'South Africa Protection of Personal Information Act comprehensive data protection law',
  },
  'APPI': {
    controls: APPI_CONTROLS,
    displayName: 'APPI',
    description: 'Japan Act on the Protection of Personal Information governing personal data handling',
  },
  'NIST 800-66': {
    controls: NIST80066_CONTROLS,
    displayName: 'NIST SP 800-66 Rev 2',
    description: 'Implementation guide for HIPAA Security Rule requirements for covered entities',
  },
  'NERC CIP': {
    controls: NERC_CIP_CONTROLS,
    displayName: 'NERC CIP',
    description: 'North American Electric Reliability Corporation Critical Infrastructure Protection standards',
  },
  'SOC 2+': {
    controls: SOC2_PLUS_CONTROLS,
    displayName: 'SOC 2+',
    description: 'Extended SOC 2 examination with additional subject matter criteria (HIPAA, CCM, custom)',
  },
  'ISO 27799': {
    controls: ISO27799_CONTROLS,
    displayName: 'ISO 27799:2016',
    description: 'Health Informatics Information Security Management guidelines for healthcare organizations',
  },
  'TISAX': {
    controls: TISAX_CONTROLS,
    displayName: 'TISAX',
    description: 'Trusted Information Security Assessment Exchange for automotive industry supply chain security',
  },
  'OCPA': {
    controls: OCPA_CONTROLS,
    displayName: 'OCPA',
    description: 'Oregon Consumer Privacy Act consumer data protection requirements',
  },
  'MCDPA': {
    controls: MCDPA_CONTROLS,
    displayName: 'MCDPA',
    description: 'Montana Consumer Data Privacy Act consumer rights and controller duties',
  },
  'DPDPA': {
    controls: DPDPA_CONTROLS,
    displayName: 'DPDPA',
    description: 'Delaware Personal Data Privacy Act consumer privacy protections',
  },
  'ICDPA': {
    controls: ICDPA_CONTROLS,
    displayName: 'ICDPA',
    description: 'Iowa Consumer Data Protection Act consumer data rights and business obligations',
  },
  'NJDPA': {
    controls: NJDPA_CONTROLS,
    displayName: 'NJDPA',
    description: 'New Jersey Data Privacy Act comprehensive consumer data protection',
  },
  'PCI DSS v4.0': {
    controls: PCI_DSS4_CONTROLS,
    displayName: 'PCI DSS v4.0.1',
    description: 'Payment Card Industry Data Security Standard version 4.0.1 with enhanced requirements',
  },
  'ISO 13485': {
    controls: ISO13485_CONTROLS,
    displayName: 'ISO 13485:2016',
    description: 'Medical Devices Quality Management Systems requirements for regulatory compliance',
  },
  // EU Digital Regulations
  'DMA': {
    controls: DMA_CONTROLS,
    displayName: 'Digital Markets Act',
    description: 'EU regulation establishing fair competition rules for gatekeeper platforms',
  },
  'DSA': {
    controls: DSA_CONTROLS,
    displayName: 'Digital Services Act',
    description: 'EU regulation establishing accountability for online intermediaries and platforms',
  },
  'EU CRA': {
    controls: EU_CRA_CONTROLS,
    displayName: 'EU Cyber Resilience Act',
    description: 'EU regulation on cybersecurity requirements for products with digital elements',
  },
  'CSRD': {
    controls: CSRD_CONTROLS,
    displayName: 'Corporate Sustainability Reporting Directive',
    description: 'EU directive on sustainability and ESG reporting for large companies',
  },
  'ESPR': {
    controls: ECODESIGN_CONTROLS,
    displayName: 'Ecodesign for Sustainable Products',
    description: 'EU regulation setting ecodesign requirements for sustainable products',
  },
  'Data Act': {
    controls: DATA_ACT_CONTROLS,
    displayName: 'EU Data Act',
    description: 'EU regulation on fair access to and use of data across sectors',
  },
  'DGA': {
    controls: DATA_GOVERNANCE_ACT_CONTROLS,
    displayName: 'Data Governance Act',
    description: 'EU regulation establishing framework for data intermediation and sharing',
  },
  'EU Whistleblower Directive': {
    controls: EU_WHISTLEBLOWER_CONTROLS,
    displayName: 'EU Whistleblower Directive',
    description: 'EU directive on protection of persons reporting breaches of Union law',
  },
  'EU Product Liability Directive': {
    controls: EU_PRODUCT_LIABILITY_CONTROLS,
    displayName: 'EU Product Liability Directive',
    description: 'EU directive on liability for defective products including software',
  },
  'Machinery Regulation': {
    controls: MACHINERY_REGULATION_CONTROLS,
    displayName: 'EU Machinery Regulation',
    description: 'EU regulation on machinery safety requirements including software safety',
  },
  'ePrivacy': {
    controls: EPRIVACY_CONTROLS,
    displayName: 'ePrivacy Directive',
    description: 'EU directive on privacy in electronic communications',
  },
  'MiFID II': {
    controls: MIFID_II_CONTROLS,
    displayName: 'MiFID II',
    description: 'Markets in Financial Instruments Directive II for investment services',
  },
  'PSD2': {
    controls: PSD2_CONTROLS,
    displayName: 'PSD2',
    description: 'Payment Services Directive 2 for electronic payment services',
  },
  'ENISA': {
    controls: ENISA_CONTROLS,
    displayName: 'ENISA Guidelines',
    description: 'European Union Agency for Cybersecurity guidelines and recommendations',
  },
  'Adequacy Decision': {
    controls: ADEQUACY_DECISION_CONTROLS,
    displayName: 'Adequacy Decision Framework',
    description: 'EU adequacy decision compliance for third country data transfers',
  },
  // Additional ISO Standards
  'ISO 9001': {
    controls: ISO9001_CONTROLS,
    displayName: 'ISO 9001:2015',
    description: 'Quality Management Systems requirements for consistent products and services',
  },
  'ISO 14001': {
    controls: ISO14001_CONTROLS,
    displayName: 'ISO 14001:2015',
    description: 'Environmental Management Systems requirements for environmental performance',
  },
  'ISO 45001': {
    controls: ISO45001_CONTROLS,
    displayName: 'ISO 45001:2018',
    description: 'Occupational Health and Safety Management Systems requirements',
  },
  'ISO 27002:2022': {
    controls: ISO_27002_2022_CONTROLS,
    displayName: 'ISO 27002:2022',
    description: 'Information security controls guidance with organizational, people, physical, and technological controls',
  },
  'ISO 27005': {
    controls: ISO_27005_CONTROLS,
    displayName: 'ISO 27005:2022',
    description: 'Information security risk management guidance',
  },
  'ISO 31000': {
    controls: ISO_31000_CONTROLS,
    displayName: 'ISO 31000:2018',
    description: 'Risk management principles and guidelines',
  },
  'ISO 27035': {
    controls: ISO_27035_CONTROLS,
    displayName: 'ISO 27035',
    description: 'Information security incident management guidance',
  },
  'ISO 27032': {
    controls: ISO_27032_CONTROLS,
    displayName: 'ISO 27032:2012',
    description: 'Guidelines for cybersecurity covering cyberspace security',
  },
  'ISO 20000-1': {
    controls: ISO_20000_1_CONTROLS,
    displayName: 'ISO 20000-1:2018',
    description: 'Service Management System requirements for IT service management',
  },
  'ISO 42001': {
    controls: ISO_42001_CONTROLS,
    displayName: 'ISO 42001:2023',
    description: 'Artificial Intelligence Management System requirements',
  },
  // US Federal & State
  'NYDFS': {
    controls: NYDFS_CONTROLS,
    displayName: 'NYDFS 23 NYCRR 500',
    description: 'New York Department of Financial Services Cybersecurity Regulation',
  },
  'FERPA': {
    controls: FERPA_CONTROLS,
    displayName: 'FERPA',
    description: 'Family Educational Rights and Privacy Act for educational records protection',
  },
  'COPPA': {
    controls: COPPA_CONTROLS,
    displayName: 'COPPA',
    description: "Children's Online Privacy Protection Act for children's data protection",
  },
  'CJIS': {
    controls: CJIS_CONTROLS,
    displayName: 'CJIS Security Policy',
    description: 'Criminal Justice Information Services Security Policy for law enforcement data',
  },
  'INCDPA': {
    controls: INCDPA_CONTROLS,
    displayName: 'Indiana Consumer Data Protection Act',
    description: 'Indiana consumer data protection requirements',
  },
  'TIPA': {
    controls: TIPA_CONTROLS,
    displayName: 'Tennessee Information Protection Act',
    description: 'Tennessee consumer data protection requirements',
  },
  'NH SB 255': {
    controls: NH_CONTROLS,
    displayName: 'New Hampshire SB 255',
    description: 'New Hampshire consumer data privacy protection',
  },
  'MODP': {
    controls: MD_CONTROLS,
    displayName: 'Maryland Online Data Privacy Act',
    description: 'Maryland consumer data privacy requirements',
  },
  'MCDPA-MN': {
    controls: MN_CONTROLS,
    displayName: 'Minnesota Consumer Data Privacy Act',
    description: 'Minnesota consumer data privacy requirements',
  },
  'NDPA': {
    controls: NE_CONTROLS,
    displayName: 'Nebraska Data Privacy Act',
    description: 'Nebraska consumer data privacy requirements',
  },
  'RI DPPA': {
    controls: RI_CONTROLS,
    displayName: 'Rhode Island Data Privacy Protection Act',
    description: 'Rhode Island consumer data privacy requirements',
  },
  'VT DPA': {
    controls: VT_CONTROLS,
    displayName: 'Vermont Data Privacy Act',
    description: 'Vermont consumer data privacy requirements',
  },
  'KCDPA': {
    controls: KCDPA_CONTROLS,
    displayName: 'Kentucky Consumer Data Protection Act',
    description: 'Kentucky consumer data privacy requirements',
  },
  // International Privacy
  'PDPA Malaysia': {
    controls: PDPA_MALAYSIA_CONTROLS,
    displayName: 'PDPA Malaysia',
    description: 'Malaysia Personal Data Protection Act for personal data processing',
  },
  'PIPL': {
    controls: PIPL_CONTROLS,
    displayName: 'PIPL China',
    description: 'China Personal Information Protection Law for personal data protection',
  },
  'PDPB': {
    controls: PDPB_CONTROLS,
    displayName: 'PDPB India',
    description: 'India Digital Personal Data Protection Bill requirements',
  },
  'Privacy Shield': {
    controls: PRIVACY_SHIELD_CONTROLS,
    displayName: 'EU-US Data Privacy Framework',
    description: 'EU-US Data Privacy Framework for transatlantic data transfers',
  },
  'APEC CBPR': {
    controls: APEC_CBPR_CONTROLS,
    displayName: 'APEC CBPR',
    description: 'APEC Cross-Border Privacy Rules for Asia-Pacific data transfers',
  },
  // Security Standards
  'NIST 800-207': {
    controls: NIST_800_207_CONTROLS,
    displayName: 'NIST SP 800-207',
    description: 'Zero Trust Architecture guidance for network security',
  },
  'NIST 800-218': {
    controls: NIST_800_218_CONTROLS,
    displayName: 'NIST SP 800-218',
    description: 'Secure Software Development Framework for secure SDLC',
  },
  'NIST 800-172': {
    controls: NIST_800_172_CONTROLS,
    displayName: 'NIST SP 800-172',
    description: 'Enhanced Security Requirements for Protecting CUI',
  },
  'FIPS 140-3': {
    controls: FIPS_140_3_CONTROLS,
    displayName: 'FIPS 140-3',
    description: 'Security Requirements for Cryptographic Modules',
  },
  'OWASP Top 10': {
    controls: OWASP_TOP10_CONTROLS,
    displayName: 'OWASP Top 10 2021',
    description: 'Top 10 critical web application security risks',
  },
  'OWASP SAMM': {
    controls: OWASP_SAMM_CONTROLS,
    displayName: 'OWASP SAMM',
    description: 'Software Assurance Maturity Model for secure development',
  },
  'ASVS': {
    controls: ASVS_CONTROLS,
    displayName: 'OWASP ASVS',
    description: 'Application Security Verification Standard for security testing',
  },
  'CSA STAR': {
    controls: CSA_STAR_CONTROLS,
    displayName: 'CSA STAR',
    description: 'Cloud Security Alliance Security Trust Assurance and Risk',
  },
  'CIS RAM': {
    controls: CIS_RAM_CONTROLS,
    displayName: 'CIS RAM',
    description: 'Center for Internet Security Risk Assessment Method',
  },
  'MITRE ATT&CK': {
    controls: MITRE_ATTACK_CONTROLS,
    displayName: 'MITRE ATT&CK',
    description: 'Adversarial Tactics, Techniques, and Common Knowledge framework',
  },
  'MITRE D3FEND': {
    controls: MITRE_D3FEND_CONTROLS,
    displayName: 'MITRE D3FEND',
    description: 'Knowledge graph of defensive cybersecurity techniques',
  },
  'SANS Top 20': {
    controls: SANS_TOP_20_CONTROLS,
    displayName: 'SANS CIS Controls',
    description: 'SANS Top 20 Critical Security Controls',
  },
  'BSIMM': {
    controls: BSIMM_CONTROLS,
    displayName: 'BSIMM',
    description: 'Building Security In Maturity Model for software security',
  },
  'IEEE P2675': {
    controls: IEEE_P2675_CONTROLS,
    displayName: 'IEEE P2675',
    description: 'DevOps Security Standard for secure development operations',
  },
  'Common Criteria': {
    controls: COMMON_CRITERIA_CONTROLS,
    displayName: 'Common Criteria',
    description: 'ISO 15408 Common Criteria for IT Security Evaluation',
  },
  // Financial
  'Basel III': {
    controls: BASEL_III_CONTROLS,
    displayName: 'Basel III',
    description: 'Basel Committee banking supervision and operational resilience',
  },
  'SOC 3': {
    controls: SOC3_CONTROLS,
    displayName: 'SOC 3',
    description: 'SOC 3 Trust Services Report for general use',
  },
  'SOX ITGC': {
    controls: SOX_ITGC_CONTROLS,
    displayName: 'SOX ITGC',
    description: 'Sarbanes-Oxley IT General Controls for financial systems',
  },
  'FFIEC CAT': {
    controls: FFIEC_CAT_CONTROLS,
    displayName: 'FFIEC CAT',
    description: 'FFIEC Cybersecurity Assessment Tool for financial institutions',
  },
  'SWIFT CSP': {
    controls: SWIFT_CSP_CONTROLS,
    displayName: 'SWIFT CSP',
    description: 'SWIFT Customer Security Programme for financial messaging',
  },
  'OSFI B-13': {
    controls: OSFI_B13_CONTROLS,
    displayName: 'OSFI B-13',
    description: 'Canadian Office of the Superintendent of Financial Institutions technology risk',
  },
  'APRA CPS 234': {
    controls: APRA_CPS234_CONTROLS,
    displayName: 'APRA CPS 234',
    description: 'Australian Prudential Regulation Authority information security standard',
  },
  'MAS TRM': {
    controls: MAS_TRM_CONTROLS,
    displayName: 'MAS TRM',
    description: 'Monetary Authority of Singapore Technology Risk Management guidelines',
  },
  'FCA/PRA': {
    controls: FCA_PRA_CONTROLS,
    displayName: 'FCA/PRA Operational Resilience',
    description: 'UK Financial Conduct Authority and Prudential Regulation Authority operational resilience',
  },
  // Government & Defense
  'ITAR': {
    controls: ITAR_CONTROLS,
    displayName: 'ITAR',
    description: 'International Traffic in Arms Regulations for defense articles',
  },
  'EAR': {
    controls: EAR_CONTROLS,
    displayName: 'EAR',
    description: 'Export Administration Regulations for dual-use items',
  },
  'DFARS': {
    controls: DFARS_CONTROLS,
    displayName: 'DFARS',
    description: 'Defense Federal Acquisition Regulation Supplement cybersecurity requirements',
  },
  'UK Cyber Essentials': {
    controls: UK_CYBER_ESSENTIALS_CONTROLS,
    displayName: 'UK Cyber Essentials',
    description: 'UK government-backed scheme for essential cybersecurity controls',
  },
  'Cyber Essentials Plus': {
    controls: CYBER_ESSENTIALS_PLUS_CONTROLS,
    displayName: 'Cyber Essentials Plus',
    description: 'UK Cyber Essentials with technical verification',
  },
  'IRAP': {
    controls: IRAP_CONTROLS,
    displayName: 'IRAP',
    description: 'Australian Information Security Registered Assessors Program',
  },
  'PROTECTED': {
    controls: PROTECTED_AUSTRALIA_CONTROLS,
    displayName: 'PROTECTED Australia',
    description: 'Australian Government PROTECTED classification requirements',
  },
  // Healthcare
  'EU MDR': {
    controls: EU_MDR_CONTROLS,
    displayName: 'EU MDR',
    description: 'EU Medical Device Regulation for medical device compliance',
  },
  'EU IVDR': {
    controls: EU_IVDR_CONTROLS,
    displayName: 'EU IVDR',
    description: 'EU In Vitro Diagnostic Regulation for IVD device compliance',
  },
  'ICH Guidelines': {
    controls: ICH_GUIDELINES_CONTROLS,
    displayName: 'ICH Guidelines',
    description: 'International Council for Harmonisation pharmaceutical guidelines',
  },
  'GAMP 5': {
    controls: GAMP5_CONTROLS,
    displayName: 'GAMP 5',
    description: 'Good Automated Manufacturing Practice for computerized systems',
  },
  'HL7 FHIR Security': {
    controls: HL7_FHIR_SECURITY_CONTROLS,
    displayName: 'HL7 FHIR Security',
    description: 'HL7 FHIR security implementation guidance',
  },
  'FDA 21 CFR Part 820': {
    controls: FDA_21_CFR_820_CONTROLS,
    displayName: 'FDA 21 CFR Part 820',
    description: 'FDA Quality System Regulation for medical device manufacturing',
  },
  'GxP': {
    controls: GXP_CONTROLS,
    displayName: 'GxP',
    description: 'Good Practice regulations for pharmaceutical and life sciences',
  },
  // Industrial
  'GSMA NESAS': {
    controls: GSMA_NESAS_CONTROLS,
    displayName: 'GSMA NESAS',
    description: 'GSMA Network Equipment Security Assurance Scheme',
  },
  '3GPP Security': {
    controls: THREE_GPP_SECURITY_CONTROLS,
    displayName: '3GPP Security',
    description: '3GPP mobile network security specifications',
  },
  'IEC 62351': {
    controls: IEC_62351_CONTROLS,
    displayName: 'IEC 62351',
    description: 'Power systems management and associated information exchange security',
  },
  'TSA Pipeline Security': {
    controls: TSA_PIPELINE_CONTROLS,
    displayName: 'TSA Pipeline Security',
    description: 'TSA Pipeline Security Directives for critical infrastructure',
  },
  // Automotive & IoT
  'UNECE WP.29': {
    controls: UNECE_WP29_CONTROLS,
    displayName: 'UNECE WP.29',
    description: 'UN vehicle cybersecurity and software update regulations',
  },
  'ETSI EN 303 645': {
    controls: ETSI_EN_303_645_CONTROLS,
    displayName: 'ETSI EN 303 645',
    description: 'Cyber Security for Consumer Internet of Things',
  },
  'IEC 62443-4-1': {
    controls: IEC_62443_4_1_CONTROLS,
    displayName: 'IEC 62443-4-1',
    description: 'Security for industrial automation product development requirements',
  },
  'Matter Protocol': {
    controls: MATTER_PROTOCOL_CONTROLS,
    displayName: 'Matter Protocol Security',
    description: 'Matter smart home protocol security requirements',
  },
  // Quality & Process
  'ITIL': {
    controls: ITIL_CONTROLS,
    displayName: 'ITIL 4',
    description: 'IT Infrastructure Library service management best practices',
  },
  'CMMI': {
    controls: CMMI_CONTROLS,
    displayName: 'CMMI',
    description: 'Capability Maturity Model Integration for process improvement',
  },
  // ===== 2026 framework additions =====
  // 4 new AI laws
  'TRAIGA': {
    controls: TRAIGA_CONTROLS,
    displayName: 'Texas Responsible AI Governance Act',
    description: 'Texas Responsible AI Governance Act (HB 149) — effective Jan 1, 2026. AG enforcement with 60-day cure period. Applies to businesses deploying AI in Texas.',
  },
  'Colorado AI Act': {
    controls: COLORADO_AI_ACT_CONTROLS,
    displayName: 'Colorado AI Act (SB 24-205)',
    description: 'Colorado AI Act — effective June 30, 2026 (delayed from Feb 1). High-risk AI obligations: risk management, impact assessments, consumer disclosures, AG reporting.',
  },
  'California AI Transparency Act': {
    controls: CALIFORNIA_AI_TRANSPARENCY_CONTROLS,
    displayName: 'California AI Transparency Act (SB 942)',
    description: 'California SB 942 — effective Jan 1, 2026. Generative AI content disclosure, watermarking, free public detection tool for covered providers (>1M users).',
  },
  'Korea AI Basic Act': {
    controls: KOREA_AI_BASIC_ACT_CONTROLS,
    displayName: 'Korea AI Basic Act',
    description: 'South Korea AI Basic Act — effective Jan 2026, extraterritorial. High-impact AI obligations, generative AI labeling, foundation model duties, MSIT notification.',
  },
  // 4 ISO/NIST AI standards
  'ISO 23894': {
    controls: ISO_23894_CONTROLS,
    displayName: 'ISO/IEC 23894:2023',
    description: 'AI Risk Management guidance — companion standard to ISO 42001 with detailed AI risk identification, analysis, evaluation, and treatment processes.',
  },
  'ISO 5338': {
    controls: ISO_5338_CONTROLS,
    displayName: 'ISO/IEC 5338:2023',
    description: 'AI System Life Cycle Processes — process reference model for AI system development, deployment, operation, and maintenance.',
  },
  'ISO 38507': {
    controls: ISO_38507_CONTROLS,
    displayName: 'ISO/IEC 38507:2022',
    description: 'Governance Implications of AI — board-level governance guidance for organizations using AI.',
  },
  'NIST AI 600-1': {
    controls: NIST_AI_600_1_CONTROLS,
    displayName: 'NIST AI 600-1 Generative AI Profile',
    description: 'NIST Generative AI Profile (July 2024) — companion to NIST AI RMF 1.0 addressing 12 GenAI-specific risks including hallucinations, data leakage, and misuse.',
  },
  // 4 amendments
  'ISO 27001 Amd 1': {
    controls: ISO_27001_AMD1_CONTROLS,
    displayName: 'ISO/IEC 27001:2022/Amd 1:2024',
    description: 'ISO 27001 Climate Action Amendment (Feb 2024) — adds climate change to Clause 4.1 context and Clause 4.2 interested-party requirements.',
  },
  'NYDFS 2nd Amendment': {
    controls: NYDFS_AMD2_CONTROLS,
    displayName: 'NYDFS 23 NYCRR 500 Second Amendment',
    description: 'NYDFS Cybersecurity Regulation Second Amendment — full enforcement Nov 1, 2025. Class A obligations, expanded MFA, asset inventory, 24/72hr ransomware reporting.',
  },
  'CMMC 2.0 Final Rule': {
    controls: CMMC_2_FINAL_CONTROLS,
    displayName: 'CMMC 2.0 Final Rule (32 CFR Part 170)',
    description: 'CMMC 2.0 Final Rule — phased DoD contract enforcement Nov 10, 2025 (Phase 1) through Nov 10, 2028 (Phase 4). Covers Level 1/2/3 assessment requirements.',
  },
  'HIPAA Security Rule NPRM': {
    controls: HIPAA_SECURITY_NPRM_CONTROLS,
    displayName: 'HIPAA Security Rule 2024 NPRM',
    description: 'HIPAA Security Rule Notice of Proposed Rulemaking (Dec 2024) — mandatory encryption/MFA/segmentation. PROPOSED — fate uncertain under regulatory freeze.',
  },
};

// Also support alternate name lookups
const FRAMEWORK_ALIASES: Record<string, string> = {
  'SOC2': 'SOC 2 Type II',
  'SOC 2': 'SOC 2 Type II',
  'soc2': 'SOC 2 Type II',
  // SOC 3 aliases — frontend uses 'AICPA SOC 3' (constants.ts:205); template map key is 'SOC 3'
  'AICPA SOC 3': 'SOC 3',
  'AICPA SOC3': 'SOC 3',
  'SOC3': 'SOC 3',
  'soc3': 'SOC 3',
  'soc 3': 'SOC 3',
  'SOC for Service Organizations': 'SOC 3',
  'SOC 3 Type II': 'SOC 3',
  'SOC 3 Trust Services Report': 'SOC 3',
  // SOC 1 alias used by frontend (constants.ts:204 uses 'AICPA SOC 1')
  'AICPA SOC 1': 'SOC 1',
  'AICPA SOC1': 'SOC 1',
  // ISO 42001 additional aliases — frontend uses 'ISO 42001' which matches the template key
  'ISO/IEC 42001': 'ISO 42001',
  'ISO/IEC 42001:2023': 'ISO 42001',
  'ISO 42001:2023': 'ISO 42001',
  'AI Management System Standard': 'ISO 42001',
  'AIMS Standard': 'ISO 42001',
  'ISO27001': 'ISO 27001',
  'ISO 27001:2022': 'ISO 27001',
  'iso27001': 'ISO 27001',
  'hipaa': 'HIPAA',
  'gdpr': 'GDPR',
  'PCI DSS v4.0': 'PCI DSS',
  'PCI-DSS': 'PCI DSS',
  'pci-dss': 'PCI DSS',
  'pci dss': 'PCI DSS',
  'NIST800-53': 'NIST 800-53',
  'NIST 800-53 Rev 5': 'NIST 800-53',
  'nist-800-53': 'NIST 800-53',
  'ccpa': 'CCPA',
  'CPRA': 'CCPA',
  'CCPA/CPRA': 'CCPA',
  'sox': 'SOX',
  'Sarbanes-Oxley': 'SOX',
  'NIST CSF 2.0': 'NIST CSF',
  'NIST Cybersecurity Framework': 'NIST CSF',
  'nist-csf': 'NIST CSF',
  'fedramp': 'FedRAMP',
  'FedRAMP Moderate': 'FedRAMP',
  'cmmc': 'CMMC',
  'CMMC 2.0': 'CMMC',
  'hitrust': 'HITRUST CSF',
  'HITRUST': 'HITRUST CSF',
  'cis': 'CIS Controls',
  'CIS Controls v8': 'CIS Controls',
  'CIS': 'CIS Controls',
  'ISO27017': 'ISO 27017',
  'ISO 27017:2015': 'ISO 27017',
  'iso27017': 'ISO 27017',
  'iso-27017': 'ISO 27017',
  // EU AI Act aliases
  'eu-ai-act': 'EU AI Act',
  'EU AI Act 2024': 'EU AI Act',
  'ai-act': 'EU AI Act',
  'AI Act': 'EU AI Act',
  'Regulation 2024/1689': 'EU AI Act',
  // NIS2 aliases
  'nis2': 'NIS2',
  'NIS 2': 'NIS2',
  'NIS2 Directive': 'NIS2',
  'Directive 2022/2555': 'NIS2',
  // DORA aliases
  'dora': 'DORA',
  'Digital Operational Resilience Act': 'DORA',
  'Regulation 2022/2554': 'DORA',
  // NIST 800-171 aliases
  'NIST800-171': 'NIST 800-171',
  'NIST 800-171 Rev 2': 'NIST 800-171',
  'nist-800-171': 'NIST 800-171',
  'NIST SP 800-171': 'NIST 800-171',
  'CUI Protection': 'NIST 800-171',
  // ISO 27701 aliases
  'ISO27701': 'ISO 27701',
  'ISO 27701:2019': 'ISO 27701',
  'iso27701': 'ISO 27701',
  'iso-27701': 'ISO 27701',
  'PIMS': 'ISO 27701',
  // CSA CCM aliases
  'csa-ccm': 'CSA CCM',
  'CSA CCM v4': 'CSA CCM',
  'CSA CCM v4.0': 'CSA CCM',
  'Cloud Controls Matrix': 'CSA CCM',
  'CCM': 'CSA CCM',
  'ccm': 'CSA CCM',
  // ISO 27018 aliases
  'ISO27018': 'ISO 27018',
  'ISO 27018:2019': 'ISO 27018',
  'iso27018': 'ISO 27018',
  'iso-27018': 'ISO 27018',
  'Cloud PII': 'ISO 27018',
  // ISO 22301 aliases
  'ISO22301': 'ISO 22301',
  'ISO 22301:2019': 'ISO 22301',
  'iso22301': 'ISO 22301',
  'iso-22301': 'ISO 22301',
  'BCMS': 'ISO 22301',
  'Business Continuity': 'ISO 22301',
  // COBIT aliases
  'cobit': 'COBIT',
  'COBIT 2019': 'COBIT',
  'COBIT2019': 'COBIT',
  'cobit-2019': 'COBIT',
  // GLBA aliases
  'glba': 'GLBA',
  'Gramm-Leach-Bliley': 'GLBA',
  'GLBA Safeguards': 'GLBA',
  'Safeguards Rule': 'GLBA',
  // SOC 1 aliases
  'SOC1': 'SOC 1',
  'soc1': 'SOC 1',
  'soc 1': 'SOC 1',
  'SOC 1 Type II': 'SOC 1',
  'SSAE 18': 'SOC 1',
  'ISAE 3402': 'SOC 1',
  // FISMA aliases
  'fisma': 'FISMA',
  'Federal Information Security': 'FISMA',
  'FISMA 2014': 'FISMA',
  // VCDPA aliases
  'vcdpa': 'VCDPA',
  'Virginia Consumer Data Protection Act': 'VCDPA',
  'Virginia Privacy': 'VCDPA',
  // CPA aliases
  'cpa': 'CPA',
  'Colorado Privacy Act': 'CPA',
  'Colorado Privacy': 'CPA',
  // CTDPA aliases
  'ctdpa': 'CTDPA',
  'Connecticut Data Privacy Act': 'CTDPA',
  'Connecticut Privacy': 'CTDPA',
  // UCPA aliases
  'ucpa': 'UCPA',
  'Utah Consumer Privacy Act': 'UCPA',
  'Utah Privacy': 'UCPA',
  // TDPSA aliases
  'tdpsa': 'TDPSA',
  'Texas Data Privacy and Security Act': 'TDPSA',
  'Texas Privacy': 'TDPSA',
  // NIST 800-63 aliases
  'NIST800-63': 'NIST 800-63',
  'NIST 800-63-3': 'NIST 800-63',
  'nist-800-63': 'NIST 800-63',
  'NIST SP 800-63': 'NIST 800-63',
  'Digital Identity': 'NIST 800-63',
  // PIPEDA aliases
  'pipeda': 'PIPEDA',
  'Personal Information Protection': 'PIPEDA',
  'Canada Privacy': 'PIPEDA',
  // LGPD aliases
  'lgpd': 'LGPD',
  'Lei Geral de Proteção de Dados': 'LGPD',
  'Brazil Privacy': 'LGPD',
  'Brazil LGPD': 'LGPD',
  // PDPA aliases
  'pdpa': 'PDPA',
  'PDPA Singapore': 'PDPA',
  'Singapore Privacy': 'PDPA',
  'Singapore PDPA': 'PDPA',
  // HITECH aliases
  'hitech': 'HITECH',
  'HITECH Act': 'HITECH',
  'Health Information Technology': 'HITECH',
  // ISO 21434 aliases
  'ISO21434': 'ISO 21434',
  'ISO/SAE 21434': 'ISO 21434',
  'iso21434': 'ISO 21434',
  'iso-21434': 'ISO 21434',
  'Automotive Cybersecurity': 'ISO 21434',
  // IEC 62443 aliases
  'iec62443': 'IEC 62443',
  'IEC62443': 'IEC 62443',
  'iec-62443': 'IEC 62443',
  'IEC 62443-3-3': 'IEC 62443',
  'IEC 62443-4-2': 'IEC 62443',
  'Industrial Control Systems Security': 'IEC 62443',
  'ICS Security': 'IEC 62443',
  'OT Security': 'IEC 62443',
  // 42 CFR Part 2 aliases
  '42 cfr part 2': '42 CFR Part 2',
  '42CFR2': '42 CFR Part 2',
  '42-cfr-2': '42 CFR Part 2',
  'CFR Part 2': '42 CFR Part 2',
  'Part 2': '42 CFR Part 2',
  'Substance Use Disorder Records': '42 CFR Part 2',
  'SUD Records': '42 CFR Part 2',
  // NIST 800-82 aliases
  'NIST800-82': 'NIST 800-82',
  'nist-800-82': 'NIST 800-82',
  'NIST SP 800-82': 'NIST 800-82',
  'NIST OT Security': 'NIST 800-82',
  'ICS Security Guide': 'NIST 800-82',
  // FDA 21 CFR Part 11 aliases
  '21 CFR 11': 'FDA 21 CFR Part 11',
  '21CFR11': 'FDA 21 CFR Part 11',
  'CFR Part 11': 'FDA 21 CFR Part 11',
  'Part 11': 'FDA 21 CFR Part 11',
  'Electronic Records': 'FDA 21 CFR Part 11',
  'FDA Electronic Signatures': 'FDA 21 CFR Part 11',
  // POPIA aliases
  'popia': 'POPIA',
  'Protection of Personal Information Act': 'POPIA',
  'South Africa Privacy': 'POPIA',
  'South Africa POPIA': 'POPIA',
  // APPI aliases
  'appi': 'APPI',
  'Japan Privacy': 'APPI',
  'Japan APPI': 'APPI',
  'Act on Protection of Personal Information': 'APPI',
  // NIST 800-66 aliases
  'NIST800-66': 'NIST 800-66',
  'nist-800-66': 'NIST 800-66',
  'NIST SP 800-66': 'NIST 800-66',
  'HIPAA Implementation Guide': 'NIST 800-66',
  // NERC CIP aliases
  'nerc-cip': 'NERC CIP',
  'NERCCIP': 'NERC CIP',
  'Critical Infrastructure Protection': 'NERC CIP',
  'BES Cyber Security': 'NERC CIP',
  // SOC 2+ aliases
  'SOC2+': 'SOC 2+',
  'soc2+': 'SOC 2+',
  'SOC 2 Plus': 'SOC 2+',
  'SOC2 Plus': 'SOC 2+',
  'SOC 2 with Additional Criteria': 'SOC 2+',
  // ISO 27799 aliases
  'ISO27799': 'ISO 27799',
  'iso27799': 'ISO 27799',
  'ISO 27799:2016': 'ISO 27799',
  'Health Informatics Security': 'ISO 27799',
  'Healthcare Information Security': 'ISO 27799',
  // TISAX aliases
  'tisax': 'TISAX',
  'VDA ISA': 'TISAX',
  'Automotive Security': 'TISAX',
  'Trusted Information Security Assessment': 'TISAX',
  // OCPA aliases
  'ocpa': 'OCPA',
  'Oregon Consumer Privacy Act': 'OCPA',
  'Oregon Privacy': 'OCPA',
  // MCDPA aliases
  'mcdpa': 'MCDPA',
  'Montana Consumer Data Privacy Act': 'MCDPA',
  'Montana Privacy': 'MCDPA',
  // DPDPA aliases
  'dpdpa': 'DPDPA',
  'Delaware Personal Data Privacy Act': 'DPDPA',
  'Delaware Privacy': 'DPDPA',
  // ICDPA aliases
  'icdpa': 'ICDPA',
  'Iowa Consumer Data Protection Act': 'ICDPA',
  'Iowa Privacy': 'ICDPA',
  // NJDPA aliases
  'njdpa': 'NJDPA',
  'New Jersey Data Privacy Act': 'NJDPA',
  'New Jersey Privacy': 'NJDPA',
  'NJ Privacy': 'NJDPA',
  // PCI DSS v4.0 aliases
  'PCI DSS 4': 'PCI DSS v4.0',
  'PCI DSS 4.0': 'PCI DSS v4.0',
  'PCI DSS v4.0.1': 'PCI DSS v4.0',
  'PCI-DSS v4': 'PCI DSS v4.0',
  'PCI v4': 'PCI DSS v4.0',
  // ISO 13485 aliases
  'ISO13485': 'ISO 13485',
  'iso13485': 'ISO 13485',
  'ISO 13485:2016': 'ISO 13485',
  'Medical Devices QMS': 'ISO 13485',
  'Medical Device Quality': 'ISO 13485',
  // DMA aliases
  'dma': 'DMA',
  'Digital Markets Act': 'DMA',
  'Regulation 2022/1925': 'DMA',
  // DSA aliases
  'dsa': 'DSA',
  'Digital Services Act': 'DSA',
  'Regulation 2022/2065': 'DSA',
  // EU CRA aliases
  'eu-cra': 'EU CRA',
  'Cyber Resilience Act': 'EU CRA',
  'CRA': 'EU CRA',
  // CSRD aliases
  'csrd': 'CSRD',
  'Corporate Sustainability': 'CSRD',
  'ESG Reporting': 'CSRD',
  // ESPR aliases
  'espr': 'ESPR',
  'Ecodesign': 'ESPR',
  'Sustainable Products': 'ESPR',
  // Data Act aliases
  'data-act': 'Data Act',
  'EU Data Act': 'Data Act',
  // DGA aliases
  'dga': 'DGA',
  'Data Governance Act': 'DGA',
  // EU Whistleblower aliases
  'eu-whistleblower': 'EU Whistleblower Directive',
  'Whistleblower Directive': 'EU Whistleblower Directive',
  // EU Product Liability aliases
  'product-liability': 'EU Product Liability Directive',
  'EU PLD': 'EU Product Liability Directive',
  // Machinery Regulation aliases
  'machinery': 'Machinery Regulation',
  'EU Machinery': 'Machinery Regulation',
  // ePrivacy aliases
  'eprivacy': 'ePrivacy',
  'ePrivacy Directive': 'ePrivacy',
  // MiFID II aliases
  'mifid': 'MiFID II',
  'mifid-ii': 'MiFID II',
  // PSD2 aliases
  'psd2': 'PSD2',
  'Payment Services Directive': 'PSD2',
  // ENISA aliases
  'enisa': 'ENISA',
  'ENISA Guidelines': 'ENISA',
  // Adequacy Decision aliases
  'adequacy': 'Adequacy Decision',
  'EU Adequacy': 'Adequacy Decision',
  // ISO 9001 aliases
  'ISO9001': 'ISO 9001',
  'iso9001': 'ISO 9001',
  'ISO 9001:2015': 'ISO 9001',
  'Quality Management': 'ISO 9001',
  // ISO 14001 aliases
  'ISO14001': 'ISO 14001',
  'iso14001': 'ISO 14001',
  'ISO 14001:2015': 'ISO 14001',
  'Environmental Management': 'ISO 14001',
  // ISO 45001 aliases
  'ISO45001': 'ISO 45001',
  'iso45001': 'ISO 45001',
  'ISO 45001:2018': 'ISO 45001',
  'OHSMS': 'ISO 45001',
  // ISO 27002:2022 aliases
  'ISO27002': 'ISO 27002:2022',
  'iso27002': 'ISO 27002:2022',
  'ISO 27002': 'ISO 27002:2022',
  // ISO 27005 aliases
  'ISO27005': 'ISO 27005',
  'iso27005': 'ISO 27005',
  'ISO 27005:2022': 'ISO 27005',
  // ISO 31000 aliases
  'ISO31000': 'ISO 31000',
  'iso31000': 'ISO 31000',
  'Risk Management Standard': 'ISO 31000',
  // ISO 27035 aliases
  'ISO27035': 'ISO 27035',
  'iso27035': 'ISO 27035',
  'Incident Management': 'ISO 27035',
  // ISO 27032 aliases
  'ISO27032': 'ISO 27032',
  'iso27032': 'ISO 27032',
  'Cybersecurity Guidelines': 'ISO 27032',
  // ISO 20000-1 aliases
  'ISO20000': 'ISO 20000-1',
  'iso20000': 'ISO 20000-1',
  'IT Service Management': 'ISO 20000-1',
  // ISO 42001 aliases
  'ISO42001': 'ISO 42001',
  'iso42001': 'ISO 42001',
  'AI Management System': 'ISO 42001',
  'AIMS': 'ISO 42001',
  // NYDFS aliases
  'nydfs': 'NYDFS',
  '23 NYCRR 500': 'NYDFS',
  'DFS Cybersecurity': 'NYDFS',
  // FERPA aliases
  'ferpa': 'FERPA',
  'Educational Privacy': 'FERPA',
  // COPPA aliases
  'coppa': 'COPPA',
  'Children Privacy': 'COPPA',
  // CJIS aliases
  'cjis': 'CJIS',
  'Criminal Justice': 'CJIS',
  // State Privacy aliases
  'incdpa': 'INCDPA',
  'Indiana Privacy': 'INCDPA',
  'tipa': 'TIPA',
  'Tennessee Privacy': 'TIPA',
  'NH Privacy': 'NH SB 255',
  'Maryland Privacy': 'MODP',
  'Minnesota Privacy': 'MCDPA-MN',
  'Nebraska Privacy': 'NDPA',
  'Rhode Island Privacy': 'RI DPPA',
  'Vermont Privacy': 'VT DPA',
  'kcdpa': 'KCDPA',
  'Kentucky Privacy': 'KCDPA',
  // International Privacy aliases
  'Malaysia Privacy': 'PDPA Malaysia',
  'Malaysia PDPA': 'PDPA Malaysia',
  'pipl': 'PIPL',
  'China Privacy': 'PIPL',
  'China PIPL': 'PIPL',
  'pdpb': 'PDPB',
  'India Privacy': 'PDPB',
  'privacy-shield': 'Privacy Shield',
  'EU-US DPF': 'Privacy Shield',
  'apec-cbpr': 'APEC CBPR',
  'CBPR': 'APEC CBPR',
  // Security Standards aliases
  'nist-800-207': 'NIST 800-207',
  'Zero Trust': 'NIST 800-207',
  'ZTA': 'NIST 800-207',
  'nist-800-218': 'NIST 800-218',
  'SSDF': 'NIST 800-218',
  'nist-800-172': 'NIST 800-172',
  'fips-140-3': 'FIPS 140-3',
  'FIPS140-3': 'FIPS 140-3',
  'owasp': 'OWASP Top 10',
  'OWASP': 'OWASP Top 10',
  'owasp-samm': 'OWASP SAMM',
  'SAMM': 'OWASP SAMM',
  'asvs': 'ASVS',
  'csa-star': 'CSA STAR',
  'CSA STAR Level 1': 'CSA STAR',
  'CSA STAR Level 2': 'CSA STAR',
  'cis-ram': 'CIS RAM',
  'mitre-attack': 'MITRE ATT&CK',
  'ATT&CK': 'MITRE ATT&CK',
  'mitre-d3fend': 'MITRE D3FEND',
  'D3FEND': 'MITRE D3FEND',
  'sans': 'SANS Top 20',
  'SANS': 'SANS Top 20',
  'bsimm': 'BSIMM',
  'ieee-p2675': 'IEEE P2675',
  'DevSecOps': 'IEEE P2675',
  'common-criteria': 'Common Criteria',
  'CC': 'Common Criteria',
  'ISO 15408': 'Common Criteria',
  // Financial aliases
  'basel': 'Basel III',
  'Basel': 'Basel III',
  'sox-itgc': 'SOX ITGC',
  'ITGC': 'SOX ITGC',
  'ffiec': 'FFIEC CAT',
  'FFIEC': 'FFIEC CAT',
  'swift': 'SWIFT CSP',
  'SWIFT': 'SWIFT CSP',
  'osfi': 'OSFI B-13',
  'OSFI': 'OSFI B-13',
  'apra': 'APRA CPS 234',
  'APRA': 'APRA CPS 234',
  'CPS 234': 'APRA CPS 234',
  'mas': 'MAS TRM',
  'MAS': 'MAS TRM',
  'fca': 'FCA/PRA',
  'FCA': 'FCA/PRA',
  'PRA': 'FCA/PRA',
  // Government & Defense aliases
  'itar': 'ITAR',
  'ear': 'EAR',
  'dfars': 'DFARS',
  'DFARS 252.204-7012': 'DFARS',
  'cyber-essentials': 'UK Cyber Essentials',
  'Cyber Essentials': 'UK Cyber Essentials',
  'ce-plus': 'Cyber Essentials Plus',
  'CE Plus': 'Cyber Essentials Plus',
  'irap': 'IRAP',
  'Australian IRAP': 'IRAP',
  'protected': 'PROTECTED',
  'Protected Australia': 'PROTECTED',
  // Healthcare aliases
  'eu-mdr': 'EU MDR',
  'MDR': 'EU MDR',
  'Medical Device Regulation': 'EU MDR',
  'eu-ivdr': 'EU IVDR',
  'IVDR': 'EU IVDR',
  'ich': 'ICH Guidelines',
  'ICH': 'ICH Guidelines',
  'gamp': 'GAMP 5',
  'GAMP': 'GAMP 5',
  'GAMP5': 'GAMP 5',
  'hl7': 'HL7 FHIR Security',
  'FHIR': 'HL7 FHIR Security',
  'HL7 FHIR': 'HL7 FHIR Security',
  '21 CFR 820': 'FDA 21 CFR Part 820',
  'QSR': 'FDA 21 CFR Part 820',
  'gxp': 'GxP',
  'GLP': 'GxP',
  'GMP': 'GxP',
  'GCP': 'GxP',
  // Industrial aliases
  'gsma': 'GSMA NESAS',
  'NESAS': 'GSMA NESAS',
  '3gpp': '3GPP Security',
  '5G Security': '3GPP Security',
  'iec62351': 'IEC 62351',
  'IEC62351': 'IEC 62351',
  'tsa': 'TSA Pipeline Security',
  'Pipeline Security': 'TSA Pipeline Security',
  // Automotive & IoT aliases
  'wp29': 'UNECE WP.29',
  'WP.29': 'UNECE WP.29',
  'R155': 'UNECE WP.29',
  'R156': 'UNECE WP.29',
  'etsi': 'ETSI EN 303 645',
  'ETSI': 'ETSI EN 303 645',
  'EN 303 645': 'ETSI EN 303 645',
  'Consumer IoT': 'ETSI EN 303 645',
  'iec62443-4-1': 'IEC 62443-4-1',
  'IEC62443-4-1': 'IEC 62443-4-1',
  'matter': 'Matter Protocol',
  'Matter': 'Matter Protocol',
  // Quality & Process aliases
  'itil': 'ITIL',
  'ITIL 4': 'ITIL',
  'ITIL v4': 'ITIL',
  'cmmi-dev': 'CMMI',
  'CMMI-DEV': 'CMMI',
  'CMMI DEV': 'CMMI',
  // ===== 2026 framework aliases =====
  // TRAIGA
  'Texas TRAIGA': 'TRAIGA',
  'traiga': 'TRAIGA',
  'HB 149': 'TRAIGA',
  'Texas Responsible AI Governance Act': 'TRAIGA',
  'Texas Responsible AI': 'TRAIGA',
  // Colorado AI Act
  'colorado-ai-act': 'Colorado AI Act',
  'Colorado AI': 'Colorado AI Act',
  'CO AI': 'Colorado AI Act',
  'SB 24-205': 'Colorado AI Act',
  'Colorado SB 205': 'Colorado AI Act',
  // California AI Transparency Act
  'cal-ai-transparency': 'California AI Transparency Act',
  'CAAITA': 'California AI Transparency Act',
  'SB 942': 'California AI Transparency Act',
  'California SB 942': 'California AI Transparency Act',
  'CA AI Transparency': 'California AI Transparency Act',
  // Korea AI Basic Act
  'korea-ai-act': 'Korea AI Basic Act',
  'Korea AI Act': 'Korea AI Basic Act',
  'South Korea AI Basic Act': 'Korea AI Basic Act',
  'KR AI Basic Act': 'Korea AI Basic Act',
  // ISO 23894
  'iso23894': 'ISO 23894',
  'ISO/IEC 23894': 'ISO 23894',
  'ISO/IEC 23894:2023': 'ISO 23894',
  'ISO 23894:2023': 'ISO 23894',
  'AI Risk Management Standard': 'ISO 23894',
  // ISO 5338
  'iso5338': 'ISO 5338',
  'ISO/IEC 5338': 'ISO 5338',
  'ISO/IEC 5338:2023': 'ISO 5338',
  'ISO 5338:2023': 'ISO 5338',
  'AI System Life Cycle Processes': 'ISO 5338',
  // ISO 38507
  'iso38507': 'ISO 38507',
  'ISO/IEC 38507': 'ISO 38507',
  'ISO/IEC 38507:2022': 'ISO 38507',
  'ISO 38507:2022': 'ISO 38507',
  'AI Governance Standard': 'ISO 38507',
  // NIST AI 600-1
  'nist-ai-600-1': 'NIST AI 600-1',
  'NIST AI 600.1': 'NIST AI 600-1',
  'NIST GenAI Profile': 'NIST AI 600-1',
  'Generative AI Profile': 'NIST AI 600-1',
  // ISO 27001 Amd 1
  'ISO 27001 Amd1': 'ISO 27001 Amd 1',
  'ISO 27001:2022 Amd 1': 'ISO 27001 Amd 1',
  'ISO/IEC 27001:2022/Amd 1:2024': 'ISO 27001 Amd 1',
  'ISO 27001 Climate': 'ISO 27001 Amd 1',
  'ISO 27001 Amendment 1': 'ISO 27001 Amd 1',
  // NYDFS 2nd Amendment
  'NYDFS Amd 2': 'NYDFS 2nd Amendment',
  'NYDFS Amendment 2': 'NYDFS 2nd Amendment',
  'NYDFS Second Amendment': 'NYDFS 2nd Amendment',
  '23 NYCRR 500 Amendment 2': 'NYDFS 2nd Amendment',
  '23 NYCRR 500 Second Amendment': 'NYDFS 2nd Amendment',
  // CMMC 2.0 Final Rule
  'CMMC 2.0 Final': 'CMMC 2.0 Final Rule',
  '32 CFR Part 170': 'CMMC 2.0 Final Rule',
  'CMMC 2 Final Rule': 'CMMC 2.0 Final Rule',
  'CMMC Final Rule': 'CMMC 2.0 Final Rule',
  // HIPAA Security Rule NPRM
  'HIPAA NPRM': 'HIPAA Security Rule NPRM',
  'HIPAA Security NPRM': 'HIPAA Security Rule NPRM',
  'HIPAA 2024 NPRM': 'HIPAA Security Rule NPRM',
  'HIPAA Security Rule 2024': 'HIPAA Security Rule NPRM',
};

function resolveFrameworkKey(frameworkType: string): string | null {
  if (FRAMEWORK_TEMPLATE_MAP[frameworkType]) {
    return frameworkType;
  }
  const aliased = FRAMEWORK_ALIASES[frameworkType];
  if (aliased && FRAMEWORK_TEMPLATE_MAP[aliased]) {
    return aliased;
  }
  // Case-insensitive fallback
  const lowerInput = frameworkType.toLowerCase();
  for (const alias of Object.keys(FRAMEWORK_ALIASES)) {
    if (alias.toLowerCase() === lowerInput) {
      return FRAMEWORK_ALIASES[alias];
    }
  }
  for (const key of Object.keys(FRAMEWORK_TEMPLATE_MAP)) {
    if (key.toLowerCase() === lowerInput) {
      return key;
    }
  }
  return null;
}

export class FrameworkTemplateService {
  // In-memory cache for processed templates with TTL
  private templateCache: Map<string, { data: FrameworkControlTemplate[]; expires: number }> = new Map();
  private categoryCacheMap: Map<string, { data: any[]; expires: number }> = new Map();
  private readonly CACHE_TTL_MS = 3600000; // 1 hour cache

  /**
   * Get all control templates for a given framework type (with caching)
   */
  getTemplatesForFramework(frameworkType: string): FrameworkControlTemplate[] {
    const key = resolveFrameworkKey(frameworkType);
    if (!key) return [];

    // Check cache first
    const cached = this.templateCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Load from static map and cache
    const controls = FRAMEWORK_TEMPLATE_MAP[key].controls;
    this.templateCache.set(key, {
      data: controls,
      expires: Date.now() + this.CACHE_TTL_MS
    });

    return controls;
  }

  /**
   * Get list of all available framework templates with metadata and control counts
   */
  getAvailableTemplates(): Array<{
    frameworkType: string;
    displayName: string;
    description: string;
    controlCount: number;
    categories: string[];
  }> {
    return Object.entries(FRAMEWORK_TEMPLATE_MAP).map(([key, value]) => {
      const categories = [...new Set(value.controls.map(c => c.category))];
      return {
        frameworkType: key,
        displayName: value.displayName,
        description: value.description,
        controlCount: value.controls.length,
        categories,
      };
    });
  }

  /**
   * Warm up cache by pre-loading all framework templates
   * Call this on server startup for optimal performance
   */
  warmCache(): void {
    const frameworks = Object.keys(FRAMEWORK_TEMPLATE_MAP);
    frameworks.forEach(framework => {
      this.getTemplatesForFramework(framework);
      this.getTemplateCategories(framework);
    });
    logger.info(`Framework template cache warmed (${frameworks.length} frameworks)`);
  }

  /**
   * Clear template cache (useful for testing or cache invalidation)
   */
  clearCache(): void {
    this.templateCache.clear();
    this.categoryCacheMap.clear();
  }

  /**
   * Get categories/domains for a specific framework template (with caching)
   */
  getTemplateCategories(frameworkType: string): Array<{
    category: string;
    controlCount: number;
    controls: FrameworkControlTemplate[];
  }> {
    const key = resolveFrameworkKey(frameworkType);
    if (!key) return [];

    // Check cache first
    const cached = this.categoryCacheMap.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Compute categories and cache
    const controls = this.getTemplatesForFramework(frameworkType);
    const categoryMap = new Map<string, FrameworkControlTemplate[]>();

    for (const control of controls) {
      const existing = categoryMap.get(control.category) || [];
      existing.push(control);
      categoryMap.set(control.category, existing);
    }

    const result = Array.from(categoryMap.entries()).map(([category, ctrls]) => ({
      category,
      controlCount: ctrls.length,
      controls: ctrls,
    }));

    // Cache the result
    this.categoryCacheMap.set(key, {
      data: result,
      expires: Date.now() + this.CACHE_TTL_MS
    });

    return result;
  }

  /**
   * Apply template controls to an existing framework in the database.
   * Creates FrameworkControl records for each template control.
   */
  async applyTemplateToFramework(
    organizationId: string,
    frameworkId: string,
    frameworkType: string,
    userId?: string
  ): Promise<{ applied: number; skipped: number; total: number }> {
    const controls = this.getTemplatesForFramework(frameworkType);
    if (controls.length === 0) {
      return { applied: 0, skipped: 0, total: 0 };
    }

    // Verify framework belongs to organization
    const framework = await prisma.complianceFramework.findFirst({
      where: { id: frameworkId, organizationId },
      include: { controls: { select: { name: true } } },
    });

    if (!framework) {
      throw new AppError('Framework not found or does not belong to this organization', 404);
    }

    // Get existing control names to avoid duplicates
    const existingNames = new Set(framework.controls.map((c: { name: string }) => c.name));

    let applied = 0;
    let skipped = 0;

    // Create controls in batches for performance
    const controlsToCreate = controls
      .filter(template => {
        const fullName = `${template.controlId}: ${template.name}`;
        if (existingNames.has(fullName) || existingNames.has(template.name)) {
          skipped++;
          return false;
        }
        return true;
      })
      .map(template => ({
        name: `${template.controlId}: ${template.name}`,
        description: template.description,
        category: template.category,
        status: template.status || 'Not Started',
        evidenceRequired: true,
        frameworkId,
        mappedControls: {
          implementationGuidance: template.implementationGuidance,
          evidenceRequirements: template.evidenceRequirements,
          testProcedures: template.testProcedures,
        },
      }));

    if (controlsToCreate.length > 0) {
      await prisma.frameworkControl.createMany({
        data: controlsToCreate,
      });
      applied = controlsToCreate.length;
    }

    // Recalculate framework progress
    const allControls = await prisma.frameworkControl.findMany({
      where: { frameworkId },
      select: { status: true },
    });

    const totalControls = allControls.length;
    const completedControls = allControls.filter(
      (c: { status: string }) => c.status === 'Compliant' || c.status === 'Implemented' || c.status === 'Completed'
    ).length;
    const progress = totalControls > 0 ? Math.round((completedControls / totalControls) * 100) : 0;

    // Update framework progress using raw SQL to avoid Prisma ORM issue
    try {
      await prisma.$executeRaw`UPDATE "ComplianceFramework" SET progress = ${progress}, "updatedAt" = NOW() WHERE id = ${frameworkId}`;
    } catch (updateErr: any) {
      logger.warn('Failed to update framework progress, continuing', updateErr?.message);
    }

    // Audit log (non-blocking)
    if (userId) {
      try {
        await prisma.auditLog.create({
          data: {
            action: `Template Applied: ${frameworkType} (${applied} controls added, ${skipped} skipped)`,
            userId,
            organizationId,
            hash: `template-${frameworkId}-${Date.now()}`,
          },
        });
      } catch (auditErr: any) {
        logger.warn('Failed to create audit log, continuing', auditErr?.message);
      }
    }

    // Auto-generate control mappings with other organization frameworks
    if (applied > 0) {
      try {
        const mappingsCreated = await this.applyControlMappings(organizationId, frameworkId, frameworkType);
        logger.info(`Auto-generated ${mappingsCreated} control mappings for framework ${frameworkType}`);
      } catch (mappingError) {
        logger.warn('Failed to auto-generate control mappings, continuing without them', mappingError);
        // Don't fail the template application if mapping fails
      }
    }

    return { applied, skipped, total: controls.length };
  }

  /**
   * Check if a framework type has a pre-built template
   */
  hasTemplate(frameworkType: string): boolean {
    return resolveFrameworkKey(frameworkType) !== null;
  }

  /**
   * Get template control count for a framework type
   */
  getControlCount(frameworkType: string): number {
    return this.getTemplatesForFramework(frameworkType).length;
  }

  /**
   * Automatically apply control mappings between the newly applied framework
   * and other existing frameworks in the organization.
   * This populates the "Also Satisfies" section in the UI.
   */
  async applyControlMappings(
    organizationId: string,
    frameworkId: string,
    frameworkType: string
  ): Promise<number> {
    let mappingsCreated = 0;

    // Get all frameworks in the organization (including the new one)
    const orgFrameworks = await prisma.complianceFramework.findMany({
      where: { organizationId },
      include: {
        controls: {
          select: { id: true, name: true },
        },
      },
    });

    // Get the newly applied framework
    const sourceFramework = orgFrameworks.find(f => f.id === frameworkId);
    if (!sourceFramework || !sourceFramework.controls.length) {
      return 0;
    }

    // Get other frameworks to map against
    const otherFrameworks = orgFrameworks.filter(f => f.id !== frameworkId && f.controls.length > 0);
    if (otherFrameworks.length === 0) {
      return 0;
    }

    // For each other framework, find and create mappings
    for (const targetFramework of otherFrameworks) {
      // Get crosswalk mappings between these two framework types
      const crosswalkMappings = getMappingsBetweenFrameworks(frameworkType, targetFramework.name);

      if (crosswalkMappings.length === 0) {
        continue;
      }

      // Build lookup maps for controls by their control ID prefix
      const sourceControlMap = this.buildControlIdMap(sourceFramework.controls);
      const targetControlMap = this.buildControlIdMap(targetFramework.controls);

      // Create mappings based on crosswalk data
      for (const crosswalk of crosswalkMappings) {
        // Determine direction
        const isSourceNew = this.normalizeFrameworkName(crosswalk.sourceFramework) ===
                           this.normalizeFrameworkName(frameworkType);

        const sourceControlId = isSourceNew ? crosswalk.sourceControlId : crosswalk.targetControlId;
        const targetControlId = isSourceNew ? crosswalk.targetControlId : crosswalk.sourceControlId;
        const sourceMap = isSourceNew ? sourceControlMap : targetControlMap;
        const targetMap = isSourceNew ? targetControlMap : sourceControlMap;

        // Find matching controls in the database
        const sourceDbControlId = this.findControlByTemplateId(sourceMap, sourceControlId);
        const targetDbControlId = this.findControlByTemplateId(targetMap, targetControlId);

        if (sourceDbControlId && targetDbControlId) {
          try {
            // Check if mapping already exists
            const existingMapping = await prisma.controlMapping.findFirst({
              where: {
                OR: [
                  { sourceControlId: sourceDbControlId, targetControlId: targetDbControlId },
                  { sourceControlId: targetDbControlId, targetControlId: sourceDbControlId },
                ],
              },
            });

            if (!existingMapping) {
              await prisma.controlMapping.create({
                data: {
                  sourceControlId: sourceDbControlId,
                  targetControlId: targetDbControlId,
                  mappingType: crosswalk.mappingType,
                  confidence: crosswalk.confidence,
                },
              });
              mappingsCreated++;
            }
          } catch (createError: any) {
            // Skip duplicate key errors silently
            if (!createError.code || createError.code !== 'P2002') {
              logger.warn(`Failed to create mapping ${sourceControlId} -> ${targetControlId}:`, createError.message);
            }
          }
        }
      }
    }

    return mappingsCreated;
  }

  /**
   * Build a map of control IDs (from template) to database IDs
   */
  private buildControlIdMap(controls: { id: string; name: string }[]): Map<string, string> {
    const map = new Map<string, string>();

    for (const control of controls) {
      // Extract control ID from name (format: "CC1.1: Control Name" or "A.5.1: Control Name")
      const match = control.name.match(/^([A-Za-z0-9.-]+):/);
      if (match) {
        map.set(match[1].trim(), control.id);
      }
      // Also store by full name for fallback
      map.set(control.name, control.id);
    }

    return map;
  }

  /**
   * Find a database control ID by its template control ID
   */
  private findControlByTemplateId(controlMap: Map<string, string>, templateControlId: string): string | null {
    // Direct match
    if (controlMap.has(templateControlId)) {
      return controlMap.get(templateControlId)!;
    }

    // Try with common variations
    const variations = [
      templateControlId,
      templateControlId.replace('-', '.'),
      templateControlId.replace('.', '-'),
      templateControlId.toUpperCase(),
      templateControlId.toLowerCase(),
    ];

    for (const variant of variations) {
      if (controlMap.has(variant)) {
        return controlMap.get(variant)!;
      }
    }

    // Try partial match (control ID might be part of the name)
    for (const [key, value] of controlMap.entries()) {
      if (key.includes(templateControlId) || templateControlId.includes(key.split(':')[0])) {
        return value;
      }
    }

    return null;
  }

  /**
   * Normalize framework name for comparison
   */
  private normalizeFrameworkName(name: string): string {
    const normalized = name.toLowerCase().trim();

    const aliases: Record<string, string> = {
      'soc2': 'soc 2 type ii',
      'soc 2': 'soc 2 type ii',
      'soc 2 type 2': 'soc 2 type ii',
      'iso27001': 'iso 27001',
      'iso 27001:2022': 'iso 27001',
      'pci-dss': 'pci dss',
      'pci dss v4.0': 'pci dss',
      'nist800-53': 'nist 800-53',
      'nist 800-53 rev 5': 'nist 800-53',
      'nist-csf': 'nist csf',
      'nist csf 2.0': 'nist csf',
      'fedramp moderate': 'fedramp',
      'cmmc 2.0': 'cmmc',
      'hitrust': 'hitrust csf',
      'cis': 'cis controls',
      'cis controls v8': 'cis controls',
      'ccpa/cpra': 'ccpa',
      'eu-ai-act': 'eu ai act',
      'ai act': 'eu ai act',
      'regulation 2024/1689': 'eu ai act',
      'nis 2': 'nis2',
      'nis2 directive': 'nis2',
      'directive 2022/2555': 'nis2',
      'digital operational resilience act': 'dora',
      'regulation 2022/2554': 'dora',
      'nist800-171': 'nist 800-171',
      'nist 800-171 rev 2': 'nist 800-171',
      'nist sp 800-171': 'nist 800-171',
      'iso27701': 'iso 27701',
      'iso 27701:2019': 'iso 27701',
      'pims': 'iso 27701',
      'csa-ccm': 'csa ccm',
      'csa ccm v4': 'csa ccm',
      'csa ccm v4.0': 'csa ccm',
      'cloud controls matrix': 'csa ccm',
      'ccm': 'csa ccm',
      'iso27018': 'iso 27018',
      'iso 27018:2019': 'iso 27018',
      'cloud pii': 'iso 27018',
      'iso22301': 'iso 22301',
      'iso 22301:2019': 'iso 22301',
      'bcms': 'iso 22301',
      'business continuity': 'iso 22301',
      'cobit 2019': 'cobit',
      'cobit2019': 'cobit',
      'gramm-leach-bliley': 'glba',
      'glba safeguards': 'glba',
      'safeguards rule': 'glba',
      'soc1': 'soc 1',
      'soc 1 type ii': 'soc 1',
      'ssae 18': 'soc 1',
      'isae 3402': 'soc 1',
      'federal information security': 'fisma',
      'fisma 2014': 'fisma',
      'virginia consumer data protection act': 'vcdpa',
      'virginia privacy': 'vcdpa',
      'colorado privacy act': 'cpa',
      'colorado privacy': 'cpa',
      'connecticut data privacy act': 'ctdpa',
      'connecticut privacy': 'ctdpa',
      'utah consumer privacy act': 'ucpa',
      'utah privacy': 'ucpa',
      'texas data privacy and security act': 'tdpsa',
      'texas privacy': 'tdpsa',
      'nist800-63': 'nist 800-63',
      'nist 800-63-3': 'nist 800-63',
      'nist sp 800-63': 'nist 800-63',
      'digital identity': 'nist 800-63',
      'personal information protection': 'pipeda',
      'canada privacy': 'pipeda',
      'lei geral de proteção de dados': 'lgpd',
      'brazil privacy': 'lgpd',
      'brazil lgpd': 'lgpd',
      'pdpa singapore': 'pdpa',
      'singapore privacy': 'pdpa',
      'singapore pdpa': 'pdpa',
      'hitech act': 'hitech',
      'health information technology': 'hitech',
      'iso21434': 'iso 21434',
      'iso/sae 21434': 'iso 21434',
      'automotive cybersecurity': 'iso 21434',
      'iec62443': 'iec 62443',
      'iec-62443': 'iec 62443',
      'iec 62443-3-3': 'iec 62443',
      'iec 62443-4-2': 'iec 62443',
      'industrial control systems security': 'iec 62443',
      'ics security': 'iec 62443',
      '42 cfr part 2': '42 cfr part 2',
      '42cfr2': '42 cfr part 2',
      '42-cfr-2': '42 cfr part 2',
      'cfr part 2': '42 cfr part 2',
      'substance use disorder records': '42 cfr part 2',
      'sud records': '42 cfr part 2',
      'nist800-82': 'nist 800-82',
      'nist-800-82': 'nist 800-82',
      'nist sp 800-82': 'nist 800-82',
      'ot security': 'nist 800-82',
      'ics security guide': 'nist 800-82',
      '21 cfr 11': 'fda 21 cfr part 11',
      '21cfr11': 'fda 21 cfr part 11',
      'cfr part 11': 'fda 21 cfr part 11',
      'part 11': 'fda 21 cfr part 11',
      'electronic records': 'fda 21 cfr part 11',
      'fda electronic signatures': 'fda 21 cfr part 11',
      'protection of personal information act': 'popia',
      'south africa privacy': 'popia',
      'south africa popia': 'popia',
      'japan privacy': 'appi',
      'japan appi': 'appi',
      'act on protection of personal information': 'appi',
      'nist800-66': 'nist 800-66',
      'nist-800-66': 'nist 800-66',
      'nist sp 800-66': 'nist 800-66',
      'hipaa implementation guide': 'nist 800-66',
      'nerc-cip': 'nerc cip',
      'nerccip': 'nerc cip',
      'critical infrastructure protection': 'nerc cip',
      'bes cyber security': 'nerc cip',
      'soc2+': 'soc 2+',
      'soc 2 plus': 'soc 2+',
      'soc2 plus': 'soc 2+',
      'soc 2 with additional criteria': 'soc 2+',
      'iso27799': 'iso 27799',
      'iso 27799:2016': 'iso 27799',
      'health informatics security': 'iso 27799',
      'healthcare information security': 'iso 27799',
      'vda isa': 'tisax',
      'automotive security': 'tisax',
      'trusted information security assessment': 'tisax',
      'oregon consumer privacy act': 'ocpa',
      'oregon privacy': 'ocpa',
      'montana consumer data privacy act': 'mcdpa',
      'montana privacy': 'mcdpa',
      'delaware personal data privacy act': 'dpdpa',
      'delaware privacy': 'dpdpa',
      'iowa consumer data protection act': 'icdpa',
      'iowa privacy': 'icdpa',
      'new jersey data privacy act': 'njdpa',
      'new jersey privacy': 'njdpa',
      'nj privacy': 'njdpa',
      'pci dss 4': 'pci dss v4.0',
      'pci dss 4.0': 'pci dss v4.0',
      'pci dss v4.0.1': 'pci dss v4.0',
      'pci-dss v4': 'pci dss v4.0',
      'pci v4': 'pci dss v4.0',
      'iso13485': 'iso 13485',
      'iso 13485:2016': 'iso 13485',
      'medical devices qms': 'iso 13485',
      'medical device quality': 'iso 13485',
      // SOC 3 — frontend 'AICPA SOC 3' must collapse to canonical 'soc 3'
      'aicpa soc 3': 'soc 3',
      'aicpa soc3': 'soc 3',
      'soc3': 'soc 3',
      'soc for service organizations': 'soc 3',
      'soc 3 type ii': 'soc 3',
      'soc 3 trust services report': 'soc 3',
      // ISO 42001 — multiple official spellings collapse to canonical 'iso 42001'
      'iso/iec 42001': 'iso 42001',
      'iso/iec 42001:2023': 'iso 42001',
      'iso 42001:2023': 'iso 42001',
      'iso42001': 'iso 42001',
      'ai management system standard': 'iso 42001',
      'aims standard': 'iso 42001',
      'aims': 'iso 42001',
      'ai management system': 'iso 42001',
    };

    return aliases[normalized] || normalized;
  }

  /**
   * Manually trigger control mapping for an existing framework
   * (useful if mappings weren't created during initial template application)
   */
  async regenerateControlMappings(
    organizationId: string,
    frameworkId: string
  ): Promise<{ created: number; deleted: number }> {
    // Get the framework
    const framework = await prisma.complianceFramework.findFirst({
      where: { id: frameworkId, organizationId },
    });

    if (!framework) {
      throw new AppError('Framework not found', 404);
    }

    // Delete existing mappings for this framework's controls
    const frameworkControls = await prisma.frameworkControl.findMany({
      where: { frameworkId },
      select: { id: true },
    });

    const controlIds = frameworkControls.map(c => c.id);

    const deleteResult = await prisma.controlMapping.deleteMany({
      where: {
        OR: [
          { sourceControlId: { in: controlIds } },
          { targetControlId: { in: controlIds } },
        ],
      },
    });

    // Regenerate mappings
    const created = await this.applyControlMappings(organizationId, frameworkId, framework.name);

    return { created, deleted: deleteResult.count };
  }
}

export default new FrameworkTemplateService();
