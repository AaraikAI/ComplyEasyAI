# Frameworks and Control Templates – Complete List

This document lists all frameworks from **`constants.ts`** (AVAILABLE_FRAMEWORKS) and all frameworks with **pre-built control templates** from **`server/src/services/frameworkTemplateService.ts`** (FRAMEWORK_TEMPLATE_MAP), including their attached control template sources.

**Sources:**
- **Catalog:** `constants.ts` → `AVAILABLE_FRAMEWORKS` (146 entries)
- **Templates:** `server/src/services/frameworkTemplateService.ts` → `FRAMEWORK_TEMPLATE_MAP`
- **Control data:** `server/src/data/frameworks/*.ts` (one file per template)

---

## Summary

| Metric | Count |
|--------|-------|
| Frameworks in catalog (`constants.ts`) | 146 |
| Frameworks with pre-built control templates | 146 |
| Control template source files | `server/src/data/frameworks/*.ts` |

---

## Part 1 – Frameworks in catalog (`constants.ts`)

All 146 frameworks available in the app’s “Add framework” list, with region and description.  
**Has template** = Yes if a pre-built control template exists in `frameworkTemplateService.ts` (by name or alias).

| # | Name | Region | Description | Has template |
|---|------|--------|--------------|--------------|
| 1 | SOC 2 Type II | Global | Service Organization Control 2 - Trust services criteria | Yes |
| 2 | GDPR | EU | General Data Protection Regulation - EU data privacy | Yes |
| 3 | HIPAA | US | Health Insurance Portability and Accountability Act - Healthcare data protection | Yes |
| 4 | ISO 27001 | Global | ISO/IEC 27001 - Information security management system | Yes |
| 5 | PCI DSS | Global | Payment Card Industry Data Security Standard | Yes |
| 6 | CCPA | US-CA | California Consumer Privacy Act | Yes |
| 7 | NIST 800-53 | US | NIST 800-53 - Federal information systems security | Yes |
| 8 | EU AI Act | EU | EU AI Act (Regulation 2024/1689) - World's first comprehensive AI law | Yes |
| 9 | Digital Markets Act (DMA) | EU | Rules for gatekeeper platforms and core platform services | Yes |
| 10 | Digital Services Act (DSA) | EU | Rules for online platforms, content moderation, transparency | Yes |
| 11 | EU Cyber Resilience Act (CRA) | EU | Cybersecurity requirements for products with digital elements | Yes |
| 12 | CSRD | EU | Corporate Sustainability Reporting Directive for ESG reporting | Yes |
| 13 | Ecodesign for Sustainable Products | EU | Environmental requirements for sustainable products | Yes (ESPR) |
| 14 | NIS2 Directive | EU | Network and Information Security Directive 2 | Yes (NIS2) |
| 15 | DORA | EU | Digital Operational Resilience Act for financial sector | Yes |
| 16 | Data Act | EU | EU Data Act for fair access to and use of data | Yes |
| 17 | Data Governance Act | EU | Framework for data sharing across the EU | Yes (DGA) |
| 18 | EU Whistleblower Directive | EU | Protection for persons reporting EU law breaches | Yes |
| 19 | EU Product Liability Directive | EU | Updated product liability rules including AI and digital | Yes |
| 20 | Machinery Regulation | EU | Safety of machinery including AI components | Yes |
| 21 | ePrivacy Directive | EU | EU ePrivacy Directive - Electronic communications privacy | Yes (ePrivacy) |
| 22 | MiFID II | EU | Markets in Financial Instruments Directive II | Yes |
| 23 | PSD2 | EU | Payment Services Directive 2 | Yes |
| 24 | ENISA | EU | European Union Agency for Cybersecurity Guidelines | Yes |
| 25 | Adequacy Decision | EU | EU Adequacy Decision for data transfers | Yes |
| 26 | ISO 27017 | Global | Cloud security controls and guidelines | Yes |
| 27 | ISO 27018 | Global | Protection of PII in public clouds | Yes |
| 28 | ISO 27701 | Global | Privacy Information Management System (PIMS) | Yes |
| 29 | ISO 22301 | Global | Business Continuity Management System | Yes |
| 30 | ISO 9001 | Global | Quality Management System | Yes |
| 31 | ISO 14001 | Global | Environmental Management System | Yes |
| 32 | ISO 45001 | Global | Occupational Health and Safety Management | Yes |
| 33 | ISO 27002:2022 | Global | Information Security Controls updated 2022 | Yes |
| 34 | ISO 27005 | Global | Information Security Risk Management | Yes |
| 35 | ISO 31000 | Global | Risk Management Guidelines | Yes |
| 36 | ISO 27035 | Global | Information Security Incident Management | Yes |
| 37 | ISO 27032 | Global | Cybersecurity Guidelines | Yes |
| 38 | ISO 27799 | Global | Health informatics information security management | Yes |
| 39 | ISO 22301:2019 | Global | Business Continuity Management Systems | Yes |
| 40 | ISO 20000-1 | Global | IT Service Management | Yes |
| 41 | ISO 42001 | Global | AI Management System | Yes |
| 42 | FISMA | US | Federal Information Security Management Act | Yes |
| 43 | FedRAMP | US | Federal Risk and Authorization Management Program | Yes |
| 44 | CMMC | US | Cybersecurity Maturity Model Certification | Yes |
| 45 | NYDFS | US-NY | New York Department of Financial Services Cybersecurity Regulation | Yes |
| 46 | GLBA | US | Gramm-Leach-Bliley Act - Financial privacy | Yes |
| 47 | SOX | US | Sarbanes-Oxley Act - Financial reporting controls | Yes |
| 48 | FERPA | US | Family Educational Rights and Privacy Act | Yes |
| 49 | COPPA | US | Children's Online Privacy Protection Act | Yes |
| 50 | CJIS | US | Criminal Justice Information Services Security Policy | Yes |
| 51 | California CPRA | US-CA | California Privacy Rights Act (successor to CCPA) | Yes (CCPA) |
| 52 | Colorado CPA | US-CO | Colorado Privacy Act | Yes (CPA) |
| 53 | Connecticut CTDPA | US-CT | Connecticut Data Privacy Act | Yes (CTDPA) |
| 54 | Virginia VCDPA | US-VA | Virginia Consumer Data Protection Act | Yes (VCDPA) |
| 55 | Utah UCPA | US-UT | Utah Consumer Privacy Act | Yes (UCPA) |
| 56 | Iowa ICDPA | US-IA | Iowa Consumer Data Protection Act | Yes (ICDPA) |
| 57 | Indiana INCDPA | US-IN | Indiana Consumer Data Protection Act | Yes (INCDPA) |
| 58 | Tennessee TIPA | US-TN | Tennessee Information Protection Act | Yes (TIPA) |
| 59 | Montana MCDPA | US-MT | Montana Consumer Data Privacy Act | Yes (MCDPA) |
| 60 | Texas TDPSA | US-TX | Texas Data Privacy and Security Act | Yes (TDPSA) |
| 61 | Oregon OCPA | US-OR | Oregon Consumer Privacy Act | Yes (OCPA) |
| 62 | Delaware DPDPA | US-DE | Delaware Personal Data Privacy Act | Yes (DPDPA) |
| 63 | New Hampshire Privacy Act | US-NH | New Hampshire privacy law | Yes (NH SB 255) |
| 64 | New Jersey NJDPA | US-NJ | New Jersey Data Privacy Act | Yes (NJDPA) |
| 65 | Maryland Online Data Privacy Act | US-MD | Maryland privacy law | Yes (MODP) |
| 66 | Minnesota Consumer Data Privacy Act | US-MN | Minnesota privacy law | Yes (MCDPA-MN) |
| 67 | Nebraska Data Privacy Act | US-NE | Nebraska privacy law | Yes (NDPA) |
| 68 | Rhode Island Data Transparency Act | US-RI | Rhode Island privacy law | Yes (RI DPPA) |
| 69 | Vermont Data Privacy Act | US-VT | Vermont privacy law | Yes (VT DPA) |
| 70 | Kentucky KCDPA | US-KY | Kentucky Consumer Data Protection Act | Yes (KCDPA) |
| 71 | PIPEDA | CA | Personal Information Protection and Electronic Documents Act (Canada) | Yes |
| 72 | LGPD | BR | Lei Geral de Proteção de Dados (Brazil GDPR) | Yes |
| 73 | PDPA (Singapore) | SG | Personal Data Protection Act (Singapore) | Yes (PDPA) |
| 74 | PDPA (Malaysia) | MY | Personal Data Protection Act (Malaysia) | Yes (PDPA Malaysia) |
| 75 | PIPL (China) | CN | Personal Information Protection Law (China) | Yes (PIPL) |
| 76 | APPI | JP | Act on the Protection of Personal Information (Japan) | Yes |
| 77 | POPIA | ZA | Protection of Personal Information Act (South Africa) | Yes |
| 78 | PDPB | IN | Personal Data Protection Bill (India) | Yes |
| 79 | Privacy Shield | US-EU | EU-US Privacy Shield Framework | Yes |
| 80 | APEC CBPR | APAC | Asia-Pacific Economic Cooperation Cross-Border Privacy Rules | Yes |
| 81 | NIST CSF | US | NIST Cybersecurity Framework | Yes |
| 82 | NIST CSF 2.0 | US | Cybersecurity Framework version 2.0 | Yes (NIST CSF) |
| 83 | NIST 800-171 | US | Protecting Controlled Unclassified Information | Yes |
| 84 | NIST 800-63 | US | Digital Identity Guidelines | Yes |
| 85 | NIST SP 800-207 | US | Zero Trust Architecture | Yes (NIST 800-207) |
| 86 | NIST SP 800-218 | US | Secure Software Development Framework (SSDF) | Yes (NIST 800-218) |
| 87 | NIST SP 800-53 Rev 5 | US | Security and Privacy Controls | Yes (NIST 800-53) |
| 88 | NIST SP 800-172 | US | Enhanced security for CUI | Yes (NIST 800-172) |
| 89 | FIPS 140-3 | US | Security requirements for cryptographic modules | Yes |
| 90 | CSA CCM | Global | Cloud Security Alliance Cloud Controls Matrix | Yes |
| 91 | CSA STAR | Global | Cloud Security Alliance Security Trust Assurance Registry | Yes |
| 92 | CIS Controls | Global | Center for Internet Security Critical Security Controls | Yes |
| 93 | CIS RAM | Global | CIS Risk Assessment Method | Yes |
| 94 | OWASP Top 10 | Global | Open Web Application Security Project Top 10 Risks | Yes |
| 95 | OWASP SAMM | Global | Software Assurance Maturity Model | Yes |
| 96 | ASVS | Global | Application Security Verification Standard | Yes |
| 97 | MITRE ATT&CK | Global | Knowledge base of adversary tactics | Yes |
| 98 | MITRE D3FEND | Global | Knowledge base of cybersecurity countermeasures | Yes |
| 99 | SANS Top 20 | Global | SANS Critical Security Controls | Yes |
| 100 | BSIMM | Global | Building Security In Maturity Model | Yes |
| 101 | IEEE P2675 | Global | DevOps standard | Yes |
| 102 | Common Criteria (ISO 15408) | Global | IT security evaluation criteria | Yes (Common Criteria) |
| 103 | HITRUST CSF v11 | US | Health Information Trust Alliance latest version | Yes (HITRUST CSF) |
| 104 | HITECH | US | Health Information Technology for Economic and Clinical Health Act | Yes |
| 105 | 21 CFR Part 11 | US | FDA Electronic Records and Signatures | Yes (FDA 21 CFR Part 11) |
| 106 | FDA 21 CFR Part 820 | US | Quality System Regulation for medical devices | Yes |
| 107 | GxP | Global | Good Practice Guidelines for Life Sciences | Yes |
| 108 | EU MDR | EU | Medical Device Regulation | Yes |
| 109 | EU IVDR | EU | In Vitro Diagnostic Regulation | Yes |
| 110 | ICH Guidelines | Global | International Council for Harmonisation | Yes |
| 111 | GAMP 5 | Global | Good Automated Manufacturing Practice | Yes |
| 112 | HL7 FHIR Security | Global | Healthcare data exchange security | Yes |
| 113 | Basel III | Global | International banking regulations | Yes |
| 114 | PCI DSS v4.0 | Global | Payment Card Industry Data Security Standard v4.0 | Yes |
| 115 | AICPA SOC 1 | US | Service Organization Controls for financial reporting | Yes (SOC 1) |
| 116 | AICPA SOC 3 | US | SOC for Service Organizations Trust Services Report | Yes (SOC 3) |
| 117 | SOX ITGC | US | IT General Controls for Sarbanes-Oxley | Yes |
| 118 | FFIEC CAT | US | Cybersecurity Assessment Tool for financial institutions | Yes |
| 119 | SWIFT CSP | Global | SWIFT Customer Security Programme | Yes |
| 120 | OSFI B-13 | CA | Technology and Cyber Risk Management | Yes |
| 121 | APRA CPS 234 | AU | Information Security regulation for financial institutions | Yes |
| 122 | MAS TRM | SG | Technology Risk Management Guidelines | Yes |
| 123 | FCA/PRA | UK | Financial regulatory compliance | Yes |
| 124 | ITAR | US | International Traffic in Arms Regulations | Yes |
| 125 | EAR | US | Export Administration Regulations | Yes |
| 126 | DFARS | US | Defense Federal Acquisition Regulation Supplement | Yes |
| 127 | NATO STANAG | Global | NATO standardization agreements | No |
| 128 | UK Cyber Essentials | UK | UK government-backed cybersecurity certification | Yes |
| 129 | Cyber Essentials Plus | UK | Enhanced UK cyber certification | Yes |
| 130 | IRAP | AU | Information Security Registered Assessors Program | Yes |
| 131 | PROTECTED (Australia) | AU | Australian government security classification | Yes (PROTECTED) |
| 132 | IEC 62443 | Global | Industrial Automation and Control Systems Security | Yes |
| 133 | NERC CIP | US | North American Electric Reliability Corporation Critical Infrastructure Protection | Yes |
| 134 | NERC CIP v7 | US | Critical Infrastructure Protection latest | Yes (NERC CIP) |
| 135 | GSMA NESAS | Global | Network Equipment Security Assurance Scheme | Yes |
| 136 | 3GPP Security | Global | 3rd Generation Partnership Project security | Yes |
| 137 | IEC 62351 | Global | Power systems management security | Yes |
| 138 | TSA Pipeline Security | US | TSA cybersecurity directive for pipelines | Yes |
| 139 | ISO/SAE 21434 | Global | Automotive cybersecurity engineering | Yes (ISO 21434) |
| 140 | UNECE WP.29 | Global | Vehicle cybersecurity regulations | Yes |
| 141 | ETSI EN 303 645 | EU | IoT cybersecurity standard | Yes |
| 142 | IEC 62443-4-1 | Global | Product security development lifecycle | Yes |
| 143 | Matter Protocol | Global | Smart home connectivity standard security | Yes |
| 144 | ITIL | Global | IT Infrastructure Library - IT service management | Yes |
| 145 | COBIT | Global | Control Objectives for Information and Related Technologies | Yes |
| 146 | CMMI | Global | Capability Maturity Model Integration | Yes |

---

## Part 2 – Frameworks with pre-built control templates (FRAMEWORK_TEMPLATE_MAP)

Every framework key in **`server/src/services/frameworkTemplateService.ts`** → **`FRAMEWORK_TEMPLATE_MAP`**, with the control constant and the source file under **`server/src/data/frameworks/`**.

Control arrays are imported at the top of `frameworkTemplateService.ts` from `server/src/data/frameworks/<source>.ts`.

| Template key | Display name | Control constant | Source file |
|---------------|--------------|-------------------|-------------|
| SOC 2 Type II | SOC 2 Type II | SOC2_CONTROLS | soc2Controls.ts |
| ISO 27001 | ISO 27001:2022 | ISO27001_CONTROLS | iso27001Controls.ts |
| HIPAA | HIPAA Security Rule | HIPAA_CONTROLS | hipaaControls.ts |
| GDPR | GDPR | GDPR_CONTROLS | gdprControls.ts |
| PCI DSS | PCI DSS v4.0 | PCI_DSS_CONTROLS | pciDssControls.ts |
| NIST 800-53 | NIST 800-53 Rev 5 | NIST_800_53_CONTROLS | nist80053Controls.ts |
| CCPA | CCPA/CPRA | CCPA_CONTROLS | ccpaControls.ts |
| SOX | SOX (Sarbanes-Oxley) | SOX_CONTROLS | soxControls.ts |
| NIST CSF | NIST CSF 2.0 | NIST_CSF_CONTROLS | nistCsfControls.ts |
| FedRAMP | FedRAMP Moderate | FEDRAMP_CONTROLS | fedRampControls.ts |
| CMMC | CMMC 2.0 | CMMC_CONTROLS | cmmcControls.ts |
| HITRUST CSF | HITRUST CSF | HITRUST_CONTROLS | hitrustControls.ts |
| CIS Controls | CIS Controls v8 | CIS_CONTROLS | cisControls.ts |
| ISO 27017 | ISO 27017:2015 | ISO27017_CONTROLS | iso27017Controls.ts |
| EU AI Act | EU AI Act (2024/1689) | EU_AI_ACT_CONTROLS | euAiActControls.ts |
| NIS2 | NIS2 Directive (2022/2555) | NIS2_CONTROLS | nis2Controls.ts |
| DORA | DORA (2022/2554) | DORA_CONTROLS | doraControls.ts |
| NIST 800-171 | NIST SP 800-171 Rev 2 | NIST800171_CONTROLS | nist800171Controls.ts |
| ISO 27701 | ISO 27701:2019 | ISO27701_CONTROLS | iso27701Controls.ts |
| CSA CCM | CSA CCM v4.0 | CSA_CCM_CONTROLS | csaCcmControls.ts |
| ISO 27018 | ISO 27018:2019 | ISO27018_CONTROLS | iso27018Controls.ts |
| ISO 22301 | ISO 22301:2019 | ISO22301_CONTROLS | iso22301Controls.ts |
| COBIT | COBIT 2019 | COBIT_CONTROLS | cobitControls.ts |
| GLBA | GLBA Safeguards Rule | GLBA_CONTROLS | glbaControls.ts |
| SOC 1 | SOC 1 Type II | SOC1_CONTROLS | soc1Controls.ts |
| FISMA | FISMA | FISMA_CONTROLS | fismaControls.ts |
| VCDPA | VCDPA | VCDPA_CONTROLS | statePrivacyControls.ts |
| CPA | Colorado Privacy Act | CPA_CONTROLS | statePrivacyControls.ts |
| CTDPA | CTDPA | CTDPA_CONTROLS | statePrivacyControls.ts |
| UCPA | UCPA | UCPA_CONTROLS | statePrivacyControls.ts |
| TDPSA | TDPSA | TDPSA_CONTROLS | statePrivacyControls.ts |
| NIST 800-63 | NIST SP 800-63-3 | NIST80063_CONTROLS | nist80063Controls.ts |
| PIPEDA | PIPEDA | PIPEDA_CONTROLS | pipedaControls.ts |
| LGPD | LGPD | LGPD_CONTROLS | lgpdControls.ts |
| PDPA | PDPA Singapore | PDPA_CONTROLS | pdpaControls.ts |
| HITECH | HITECH Act | HITECH_CONTROLS | hitechControls.ts |
| ISO 21434 | ISO/SAE 21434:2021 | ISO21434_CONTROLS | iso21434Controls.ts |
| IEC 62443 | IEC 62443 | IEC62443_CONTROLS | iec62443Controls.ts |
| 42 CFR Part 2 | 42 CFR Part 2 | CFR42PART2_CONTROLS | cfr42Part2Controls.ts |
| NIST 800-82 | NIST SP 800-82 Rev 3 | NIST80082_CONTROLS | nist80082Controls.ts |
| FDA 21 CFR Part 11 | FDA 21 CFR Part 11 | FDA21CFR11_CONTROLS | fda21cfrPart11Controls.ts |
| POPIA | POPIA | POPIA_CONTROLS | popiaControls.ts |
| APPI | APPI | APPI_CONTROLS | appiControls.ts |
| NIST 800-66 | NIST SP 800-66 Rev 2 | NIST80066_CONTROLS | nist80066Controls.ts |
| NERC CIP | NERC CIP | NERC_CIP_CONTROLS | nerc_cipControls.ts |
| SOC 2+ | SOC 2+ | SOC2_PLUS_CONTROLS | soc2PlusControls.ts |
| ISO 27799 | ISO 27799:2016 | ISO27799_CONTROLS | iso27799Controls.ts |
| TISAX | TISAX | TISAX_CONTROLS | tisaxControls.ts |
| OCPA | OCPA | OCPA_CONTROLS | moreStatePrivacyControls.ts |
| MCDPA | MCDPA | MCDPA_CONTROLS | moreStatePrivacyControls.ts |
| DPDPA | DPDPA | DPDPA_CONTROLS | moreStatePrivacyControls.ts |
| ICDPA | ICDPA | ICDPA_CONTROLS | moreStatePrivacyControls.ts |
| NJDPA | NJDPA | NJDPA_CONTROLS | moreStatePrivacyControls.ts |
| PCI DSS v4.0 | PCI DSS v4.0.1 | PCI_DSS4_CONTROLS | pcidss4Controls.ts |
| ISO 13485 | ISO 13485:2016 | ISO13485_CONTROLS | iso13485Controls.ts |
| DMA | Digital Markets Act | DMA_CONTROLS | dmaControls.ts |
| DSA | Digital Services Act | DSA_CONTROLS | dsaControls.ts |
| EU CRA | EU Cyber Resilience Act | EU_CRA_CONTROLS | euCraControls.ts |
| CSRD | Corporate Sustainability Reporting Directive | CSRD_CONTROLS | csrdControls.ts |
| ESPR | Ecodesign for Sustainable Products | ECODESIGN_CONTROLS | ecodesignControls.ts |
| Data Act | EU Data Act | DATA_ACT_CONTROLS | dataActControls.ts |
| DGA | Data Governance Act | DATA_GOVERNANCE_ACT_CONTROLS | dataGovernanceActControls.ts |
| EU Whistleblower Directive | EU Whistleblower Directive | EU_WHISTLEBLOWER_CONTROLS | euRegulationsControls.ts |
| EU Product Liability Directive | EU Product Liability Directive | EU_PRODUCT_LIABILITY_CONTROLS | euRegulationsControls.ts |
| Machinery Regulation | EU Machinery Regulation | MACHINERY_REGULATION_CONTROLS | euRegulationsControls.ts |
| ePrivacy | ePrivacy Directive | EPRIVACY_CONTROLS | euRegulationsControls.ts |
| MiFID II | MiFID II | MIFID_II_CONTROLS | euRegulationsControls.ts |
| PSD2 | PSD2 | PSD2_CONTROLS | euRegulationsControls.ts |
| ENISA | ENISA Guidelines | ENISA_CONTROLS | euRegulationsControls.ts |
| Adequacy Decision | Adequacy Decision Framework | ADEQUACY_DECISION_CONTROLS | euRegulationsControls.ts |
| ISO 9001 | ISO 9001:2015 | ISO9001_CONTROLS | iso9001Controls.ts |
| ISO 14001 | ISO 14001:2015 | ISO14001_CONTROLS | iso14001Controls.ts |
| ISO 45001 | ISO 45001:2018 | ISO45001_CONTROLS | iso45001Controls.ts |
| ISO 27002:2022 | ISO 27002:2022 | ISO_27002_2022_CONTROLS | isoAdditionalControls.ts |
| ISO 27005 | ISO 27005:2022 | ISO_27005_CONTROLS | isoAdditionalControls.ts |
| ISO 31000 | ISO 31000:2018 | ISO_31000_CONTROLS | isoAdditionalControls.ts |
| ISO 27035 | ISO 27035 | ISO_27035_CONTROLS | isoAdditionalControls.ts |
| ISO 27032 | ISO 27032:2012 | ISO_27032_CONTROLS | isoAdditionalControls.ts |
| ISO 20000-1 | ISO 20000-1:2018 | ISO_20000_1_CONTROLS | isoAdditionalControls.ts |
| ISO 42001 | ISO 42001:2023 | ISO_42001_CONTROLS | isoAdditionalControls.ts |
| NYDFS | NYDFS 23 NYCRR 500 | NYDFS_CONTROLS | nydfsControls.ts |
| FERPA | FERPA | FERPA_CONTROLS | ferpaControls.ts |
| COPPA | COPPA | COPPA_CONTROLS | coppaControls.ts |
| CJIS | CJIS Security Policy | CJIS_CONTROLS | cjisControls.ts |
| INCDPA | Indiana Consumer Data Protection Act | INCDPA_CONTROLS | additionalStatePrivacyControls.ts |
| TIPA | Tennessee Information Protection Act | TIPA_CONTROLS | additionalStatePrivacyControls.ts |
| NH SB 255 | New Hampshire SB 255 | NH_CONTROLS | additionalStatePrivacyControls.ts |
| MODP | Maryland Online Data Privacy Act | MD_CONTROLS | additionalStatePrivacyControls.ts |
| MCDPA-MN | Minnesota Consumer Data Privacy Act | MN_CONTROLS | additionalStatePrivacyControls.ts |
| NDPA | Nebraska Data Privacy Act | NE_CONTROLS | additionalStatePrivacyControls.ts |
| RI DPPA | Rhode Island Data Privacy Protection Act | RI_CONTROLS | additionalStatePrivacyControls.ts |
| VT DPA | Vermont Data Privacy Act | VT_CONTROLS | additionalStatePrivacyControls.ts |
| KCDPA | Kentucky Consumer Data Protection Act | KCDPA_CONTROLS | additionalStatePrivacyControls.ts |
| PDPA Malaysia | PDPA Malaysia | PDPA_MALAYSIA_CONTROLS | internationalPrivacyControls.ts |
| PIPL | PIPL China | PIPL_CONTROLS | internationalPrivacyControls.ts |
| PDPB | PDPB India | PDPB_CONTROLS | internationalPrivacyControls.ts |
| Privacy Shield | EU-US Data Privacy Framework | PRIVACY_SHIELD_CONTROLS | internationalPrivacyControls.ts |
| APEC CBPR | APEC CBPR | APEC_CBPR_CONTROLS | internationalPrivacyControls.ts |
| NIST 800-207 | NIST SP 800-207 | NIST_800_207_CONTROLS | nistSecurityControls.ts |
| NIST 800-218 | NIST SP 800-218 | NIST_800_218_CONTROLS | nistSecurityControls.ts |
| NIST 800-172 | NIST SP 800-172 | NIST_800_172_CONTROLS | nistSecurityControls.ts |
| FIPS 140-3 | FIPS 140-3 | FIPS_140_3_CONTROLS | nistSecurityControls.ts |
| OWASP Top 10 | OWASP Top 10 2021 | OWASP_TOP10_CONTROLS | owaspControls.ts |
| OWASP SAMM | OWASP SAMM | OWASP_SAMM_CONTROLS | owaspControls.ts |
| ASVS | OWASP ASVS | ASVS_CONTROLS | owaspControls.ts |
| CSA STAR | CSA STAR | CSA_STAR_CONTROLS | cloudTechControls.ts |
| CIS RAM | CIS RAM | CIS_RAM_CONTROLS | cloudTechControls.ts |
| MITRE ATT&CK | MITRE ATT&CK | MITRE_ATTACK_CONTROLS | cloudTechControls.ts |
| MITRE D3FEND | MITRE D3FEND | MITRE_D3FEND_CONTROLS | cloudTechControls.ts |
| SANS Top 20 | SANS CIS Controls | SANS_TOP_20_CONTROLS | cloudTechControls.ts |
| BSIMM | BSIMM | BSIMM_CONTROLS | cloudTechControls.ts |
| IEEE P2675 | IEEE P2675 | IEEE_P2675_CONTROLS | cloudTechControls.ts |
| Common Criteria | Common Criteria | COMMON_CRITERIA_CONTROLS | cloudTechControls.ts |
| Basel III | Basel III | BASEL_III_CONTROLS | financialControls.ts |
| SOC 3 | SOC 3 | SOC3_CONTROLS | financialControls.ts |
| SOX ITGC | SOX ITGC | SOX_ITGC_CONTROLS | financialControls.ts |
| FFIEC CAT | FFIEC CAT | FFIEC_CAT_CONTROLS | financialControls.ts |
| SWIFT CSP | SWIFT CSP | SWIFT_CSP_CONTROLS | financialControls.ts |
| OSFI B-13 | OSFI B-13 | OSFI_B13_CONTROLS | financialControls.ts |
| APRA CPS 234 | APRA CPS 234 | APRA_CPS234_CONTROLS | financialControls.ts |
| MAS TRM | MAS TRM | MAS_TRM_CONTROLS | financialControls.ts |
| FCA/PRA | FCA/PRA Operational Resilience | FCA_PRA_CONTROLS | financialControls.ts |
| ITAR | ITAR | ITAR_CONTROLS | governmentDefenseControls.ts |
| EAR | EAR | EAR_CONTROLS | governmentDefenseControls.ts |
| DFARS | DFARS | DFARS_CONTROLS | governmentDefenseControls.ts |
| UK Cyber Essentials | UK Cyber Essentials | UK_CYBER_ESSENTIALS_CONTROLS | governmentDefenseControls.ts |
| Cyber Essentials Plus | Cyber Essentials Plus | CYBER_ESSENTIALS_PLUS_CONTROLS | governmentDefenseControls.ts |
| IRAP | IRAP | IRAP_CONTROLS | governmentDefenseControls.ts |
| PROTECTED | PROTECTED Australia | PROTECTED_AUSTRALIA_CONTROLS | governmentDefenseControls.ts |
| EU MDR | EU MDR | EU_MDR_CONTROLS | healthcareControls.ts |
| EU IVDR | EU IVDR | EU_IVDR_CONTROLS | healthcareControls.ts |
| ICH Guidelines | ICH Guidelines | ICH_GUIDELINES_CONTROLS | healthcareControls.ts |
| GAMP 5 | GAMP 5 | GAMP5_CONTROLS | healthcareControls.ts |
| HL7 FHIR Security | HL7 FHIR Security | HL7_FHIR_SECURITY_CONTROLS | healthcareControls.ts |
| FDA 21 CFR Part 820 | FDA 21 CFR Part 820 | FDA_21_CFR_820_CONTROLS | healthcareControls.ts |
| GxP | GxP | GXP_CONTROLS | healthcareControls.ts |
| GSMA NESAS | GSMA NESAS | GSMA_NESAS_CONTROLS | industrialControls.ts |
| 3GPP Security | 3GPP Security | THREE_GPP_SECURITY_CONTROLS | industrialControls.ts |
| IEC 62351 | IEC 62351 | IEC_62351_CONTROLS | industrialControls.ts |
| TSA Pipeline Security | TSA Pipeline Security | TSA_PIPELINE_CONTROLS | industrialControls.ts |
| UNECE WP.29 | UNECE WP.29 | UNECE_WP29_CONTROLS | automotiveIoTControls.ts |
| ETSI EN 303 645 | ETSI EN 303 645 | ETSI_EN_303_645_CONTROLS | automotiveIoTControls.ts |
| IEC 62443-4-1 | IEC 62443-4-1 | IEC_62443_4_1_CONTROLS | automotiveIoTControls.ts |
| Matter Protocol | Matter Protocol Security | MATTER_PROTOCOL_CONTROLS | automotiveIoTControls.ts |
| ITIL | ITIL 4 | ITIL_CONTROLS | qualityFrameworkControls.ts |
| CMMI | CMMI | CMMI_CONTROLS | qualityFrameworkControls.ts |

---

## Part 3 – Control template source files

Control templates are defined in **`server/src/data/frameworks/`**. Each file exports a constant (e.g. `SOC2_CONTROLS`) that is referenced in **`frameworkTemplateService.ts`** and in the table above.

| Source file | Exported constant(s) |
|-------------|----------------------|
| soc2Controls.ts | SOC2_CONTROLS |
| iso27001Controls.ts | ISO27001_CONTROLS |
| hipaaControls.ts | HIPAA_CONTROLS |
| gdprControls.ts | GDPR_CONTROLS |
| pciDssControls.ts | PCI_DSS_CONTROLS |
| nist80053Controls.ts | NIST_800_53_CONTROLS |
| ccpaControls.ts | CCPA_CONTROLS |
| soxControls.ts | SOX_CONTROLS |
| nistCsfControls.ts | NIST_CSF_CONTROLS |
| fedRampControls.ts | FEDRAMP_CONTROLS |
| cmmcControls.ts | CMMC_CONTROLS |
| hitrustControls.ts | HITRUST_CONTROLS |
| cisControls.ts | CIS_CONTROLS |
| iso27017Controls.ts | ISO27017_CONTROLS |
| euAiActControls.ts | EU_AI_ACT_CONTROLS |
| nis2Controls.ts | NIS2_CONTROLS |
| doraControls.ts | DORA_CONTROLS |
| nist800171Controls.ts | NIST800171_CONTROLS |
| iso27701Controls.ts | ISO27701_CONTROLS |
| csaCcmControls.ts | CSA_CCM_CONTROLS |
| iso27018Controls.ts | ISO27018_CONTROLS |
| iso22301Controls.ts | ISO22301_CONTROLS |
| cobitControls.ts | COBIT_CONTROLS |
| glbaControls.ts | GLBA_CONTROLS |
| soc1Controls.ts | SOC1_CONTROLS |
| fismaControls.ts | FISMA_CONTROLS |
| statePrivacyControls.ts | VCDPA_CONTROLS, CPA_CONTROLS, CTDPA_CONTROLS, UCPA_CONTROLS, TDPSA_CONTROLS |
| nist80063Controls.ts | NIST80063_CONTROLS |
| pipedaControls.ts | PIPEDA_CONTROLS |
| lgpdControls.ts | LGPD_CONTROLS |
| pdpaControls.ts | PDPA_CONTROLS |
| hitechControls.ts | HITECH_CONTROLS |
| iso21434Controls.ts | ISO21434_CONTROLS |
| iec62443Controls.ts | IEC62443_CONTROLS |
| cfr42Part2Controls.ts | CFR42PART2_CONTROLS |
| nist80082Controls.ts | NIST80082_CONTROLS |
| fda21cfrPart11Controls.ts | FDA21CFR11_CONTROLS |
| popiaControls.ts | POPIA_CONTROLS |
| appiControls.ts | APPI_CONTROLS |
| nist80066Controls.ts | NIST80066_CONTROLS |
| nerc_cipControls.ts | NERC_CIP_CONTROLS |
| soc2PlusControls.ts | SOC2_PLUS_CONTROLS |
| iso27799Controls.ts | ISO27799_CONTROLS |
| tisaxControls.ts | TISAX_CONTROLS |
| moreStatePrivacyControls.ts | OCPA_CONTROLS, MCDPA_CONTROLS, DPDPA_CONTROLS, ICDPA_CONTROLS, NJDPA_CONTROLS |
| pcidss4Controls.ts | PCI_DSS4_CONTROLS |
| iso13485Controls.ts | ISO13485_CONTROLS |
| dmaControls.ts | DMA_CONTROLS |
| dsaControls.ts | DSA_CONTROLS |
| euCraControls.ts | EU_CRA_CONTROLS |
| csrdControls.ts | CSRD_CONTROLS |
| ecodesignControls.ts | ECODESIGN_CONTROLS |
| dataActControls.ts | DATA_ACT_CONTROLS |
| dataGovernanceActControls.ts | DATA_GOVERNANCE_ACT_CONTROLS |
| euRegulationsControls.ts | EU_WHISTLEBLOWER_CONTROLS, EU_PRODUCT_LIABILITY_CONTROLS, MACHINERY_REGULATION_CONTROLS, EPRIVACY_CONTROLS, MIFID_II_CONTROLS, PSD2_CONTROLS, ENISA_CONTROLS, ADEQUACY_DECISION_CONTROLS |
| iso9001Controls.ts | ISO9001_CONTROLS |
| iso14001Controls.ts | ISO14001_CONTROLS |
| iso45001Controls.ts | ISO45001_CONTROLS |
| isoAdditionalControls.ts | ISO_27002_2022_CONTROLS, ISO_27005_CONTROLS, ISO_31000_CONTROLS, ISO_27035_CONTROLS, ISO_27032_CONTROLS, ISO_20000_1_CONTROLS, ISO_42001_CONTROLS |
| nydfsControls.ts | NYDFS_CONTROLS |
| ferpaControls.ts | FERPA_CONTROLS |
| coppaControls.ts | COPPA_CONTROLS |
| cjisControls.ts | CJIS_CONTROLS |
| additionalStatePrivacyControls.ts | INCDPA_CONTROLS, TIPA_CONTROLS, NH_CONTROLS, MD_CONTROLS, MN_CONTROLS, NE_CONTROLS, RI_CONTROLS, VT_CONTROLS, KCDPA_CONTROLS |
| internationalPrivacyControls.ts | PDPA_MALAYSIA_CONTROLS, PIPL_CONTROLS, PDPB_CONTROLS, PRIVACY_SHIELD_CONTROLS, APEC_CBPR_CONTROLS |
| nistSecurityControls.ts | NIST_800_207_CONTROLS, NIST_800_218_CONTROLS, NIST_800_172_CONTROLS, FIPS_140_3_CONTROLS |
| owaspControls.ts | OWASP_TOP10_CONTROLS, OWASP_SAMM_CONTROLS, ASVS_CONTROLS |
| cloudTechControls.ts | CSA_STAR_CONTROLS, CIS_RAM_CONTROLS, MITRE_ATTACK_CONTROLS, MITRE_D3FEND_CONTROLS, SANS_TOP_20_CONTROLS, BSIMM_CONTROLS, IEEE_P2675_CONTROLS, COMMON_CRITERIA_CONTROLS |
| financialControls.ts | BASEL_III_CONTROLS, SOC3_CONTROLS, SOX_ITGC_CONTROLS, FFIEC_CAT_CONTROLS, SWIFT_CSP_CONTROLS, OSFI_B13_CONTROLS, APRA_CPS234_CONTROLS, MAS_TRM_CONTROLS, FCA_PRA_CONTROLS |
| governmentDefenseControls.ts | ITAR_CONTROLS, EAR_CONTROLS, DFARS_CONTROLS, UK_CYBER_ESSENTIALS_CONTROLS, CYBER_ESSENTIALS_PLUS_CONTROLS, IRAP_CONTROLS, PROTECTED_AUSTRALIA_CONTROLS |
| healthcareControls.ts | EU_MDR_CONTROLS, EU_IVDR_CONTROLS, ICH_GUIDELINES_CONTROLS, GAMP5_CONTROLS, HL7_FHIR_SECURITY_CONTROLS, FDA_21_CFR_820_CONTROLS, GXP_CONTROLS |
| industrialControls.ts | GSMA_NESAS_CONTROLS, THREE_GPP_SECURITY_CONTROLS, IEC_62351_CONTROLS, TSA_PIPELINE_CONTROLS |
| automotiveIoTControls.ts | UNECE_WP29_CONTROLS, ETSI_EN_303_645_CONTROLS, IEC_62443_4_1_CONTROLS, MATTER_PROTOCOL_CONTROLS |
| qualityFrameworkControls.ts | ITIL_CONTROLS, CMMI_CONTROLS |
| controlCrosswalk.ts | CONTROL_CROSSWALK (mappings between frameworks) |

---

*Generated from `constants.ts` and `server/src/services/frameworkTemplateService.ts`.*
