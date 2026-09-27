/**
 * Control Crosswalk Data
 *
 * Defines mappings between controls across different compliance frameworks.
 * These mappings are used to automatically populate the "Also Satisfies" section
 * when template controls are applied to frameworks.
 *
 * IMPORTANT: Control IDs must match the actual controlId values in the template files:
 * - SOC 2: CC1.1, CC2.1, CC6.1, etc.
 * - ISO 27001: A.5.1, A.5.2, A.7.1, etc.
 * - HIPAA: HIPAA-ADM-1.1, HIPAA-ADM-2, HIPAA-PHY-1, HIPAA-TECH-1, etc.
 * - GDPR: GDPR-5.1a, GDPR-6, GDPR-32, etc.
 * - PCI DSS: PCI-1.1, PCI-7.1, PCI-8.1, etc.
 * - NIST 800-53: AC-1, AC-2, AU-1, etc.
 * - NIST CSF: GV.OC-01, ID.AM-01, PR.AC-01, etc.
 * - CCPA: CCPA-1798.100, etc.
 * - SOX: SOX-ITGC-1, etc.
 * - FedRAMP: FR-AC-1, etc.
 * - CMMC: CMMC-AC-L1-001, etc.
 * - HITRUST: HITRUST-01.a, etc.
 * - CIS Controls: CIS-1, CIS-2, etc.
 * - ISO 27017 (2015 edition, withdrawn): ISO27017-5.1.1, ISO27017-9.1.1, ISO27017-12.4.1, etc.
 *   (ISO/IEC 27002:2013 clause numbers)
 * - ISO 27017:2026: ISO27017-2026-5.1 ... ISO27017-2026-8.36 (ISO/IEC 27002:2022 numbering;
 *   5.38, 5.39, 8.35 and 8.36 are the cloud-specific controls)
 */

export interface ControlCrosswalkMapping {
  sourceFramework: string;
  sourceControlId: string;
  targetFramework: string;
  targetControlId: string;
  mappingType: 'equivalent' | 'partial' | 'related';
  confidence: number; // 0.0 to 1.0
}

/**
 * Comprehensive control crosswalk mappings between major compliance frameworks.
 * Based on official crosswalk documents and industry standards.
 */
export const CONTROL_CROSSWALK: ControlCrosswalkMapping[] = [
  // =============================================================================
  // SOC 2 <-> ISO 27001 Mappings
  // =============================================================================

  // CC1: Control Environment -> ISO 27001 Organizational Controls
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC1.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC1.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC1.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC1.4', targetFramework: 'ISO 27001', targetControlId: 'A.6.1', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC1.5', targetFramework: 'ISO 27001', targetControlId: 'A.6.2', mappingType: 'partial', confidence: 0.8 },

  // CC2: Communication and Information
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC2.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.4', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC2.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.5', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC2.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.6', mappingType: 'equivalent', confidence: 0.85 },

  // CC3: Risk Assessment
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC3.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.7', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC3.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.8', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC3.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.9', mappingType: 'partial', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC3.4', targetFramework: 'ISO 27001', targetControlId: 'A.5.10', mappingType: 'partial', confidence: 0.8 },

  // CC4: Monitoring Activities
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC4.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.35', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC4.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.36', mappingType: 'equivalent', confidence: 0.85 },

  // CC5: Control Activities
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC5.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.15', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC5.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.16', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC5.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.17', mappingType: 'equivalent', confidence: 0.85 },

  // CC6: Logical and Physical Access Controls
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.15', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.16', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.17', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.4', targetFramework: 'ISO 27001', targetControlId: 'A.5.18', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.5', targetFramework: 'ISO 27001', targetControlId: 'A.7.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.6', targetFramework: 'ISO 27001', targetControlId: 'A.7.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.7', targetFramework: 'ISO 27001', targetControlId: 'A.7.3', mappingType: 'partial', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.8', targetFramework: 'ISO 27001', targetControlId: 'A.7.4', mappingType: 'equivalent', confidence: 0.9 },

  // CC7: System Operations
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.1', targetFramework: 'ISO 27001', targetControlId: 'A.8.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.2', targetFramework: 'ISO 27001', targetControlId: 'A.8.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.3', targetFramework: 'ISO 27001', targetControlId: 'A.8.7', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.4', targetFramework: 'ISO 27001', targetControlId: 'A.8.8', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.5', targetFramework: 'ISO 27001', targetControlId: 'A.5.24', mappingType: 'equivalent', confidence: 0.9 },

  // CC8: Change Management
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC8.1', targetFramework: 'ISO 27001', targetControlId: 'A.8.32', mappingType: 'equivalent', confidence: 0.95 },

  // CC9: Risk Mitigation
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC9.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.19', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC9.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.20', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // SOC 2 <-> HIPAA Mappings (using exact HIPAA template control IDs)
  // =============================================================================

  // Access Control mappings - Technical Safeguards
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-1.5', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.2', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-1.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.3', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-4.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.4', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-1.7', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.6', targetFramework: 'HIPAA', targetControlId: 'HIPAA-PHY-1.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.7', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-5.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.8', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-8.1', mappingType: 'equivalent', confidence: 0.9 },

  // Audit Controls
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC4.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-2.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC4.2', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-2.3', mappingType: 'equivalent', confidence: 0.85 },

  // Integrity Controls
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.2', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-3.1', mappingType: 'equivalent', confidence: 0.9 },

  // Administrative Safeguards - Risk Management
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC1.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-1.1', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC3.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-1.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC3.2', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-1.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC1.4', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC2.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-5.5', mappingType: 'equivalent', confidence: 0.85 },

  // Incident Response
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.3', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-6.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.4', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-6.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.5', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-6.3', mappingType: 'equivalent', confidence: 0.85 },

  // Contingency Planning
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC9.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-7.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC9.2', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-7.2', mappingType: 'equivalent', confidence: 0.85 },

  // Information System Activity Review
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-1.4', mappingType: 'equivalent', confidence: 0.9 },

  // Evaluation
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC5.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-8.1', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // SOC 2 <-> GDPR Mappings (using actual GDPR template control IDs)
  // =============================================================================

  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC1.1', targetFramework: 'GDPR', targetControlId: 'GDPR-5.1a', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC3.1', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'partial', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.1', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.2', targetFramework: 'GDPR', targetControlId: 'GDPR-33', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.5', targetFramework: 'GDPR', targetControlId: 'GDPR-34', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC2.2', targetFramework: 'GDPR', targetControlId: 'GDPR-12', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // SOC 2 <-> PCI DSS Mappings (using actual PCI template control IDs)
  // =============================================================================

  // Network Security
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.6', targetFramework: 'PCI DSS', targetControlId: 'PCI-1.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.7', targetFramework: 'PCI DSS', targetControlId: 'PCI-1.2', mappingType: 'equivalent', confidence: 0.85 },

  // Access Control
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-7.1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.2', targetFramework: 'PCI DSS', targetControlId: 'PCI-7.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.3', targetFramework: 'PCI DSS', targetControlId: 'PCI-8.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.4', targetFramework: 'PCI DSS', targetControlId: 'PCI-8.2', mappingType: 'equivalent', confidence: 0.85 },

  // Encryption
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.7', targetFramework: 'PCI DSS', targetControlId: 'PCI-4.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.8', targetFramework: 'PCI DSS', targetControlId: 'PCI-3.4', mappingType: 'equivalent', confidence: 0.85 },

  // Monitoring
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC4.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-10.1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC4.2', targetFramework: 'PCI DSS', targetControlId: 'PCI-10.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-10.5', mappingType: 'equivalent', confidence: 0.85 },

  // Change Management
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC8.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-6.4', mappingType: 'equivalent', confidence: 0.9 },

  // Vulnerability Management
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-5.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.2', targetFramework: 'PCI DSS', targetControlId: 'PCI-6.1', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // SOC 2 <-> NIST 800-53 Mappings
  // =============================================================================

  // Access Control
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.1', targetFramework: 'NIST 800-53', targetControlId: 'AC-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.2', targetFramework: 'NIST 800-53', targetControlId: 'AC-2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.3', targetFramework: 'NIST 800-53', targetControlId: 'AC-3', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.4', targetFramework: 'NIST 800-53', targetControlId: 'AC-6', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.5', targetFramework: 'NIST 800-53', targetControlId: 'PE-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC6.6', targetFramework: 'NIST 800-53', targetControlId: 'PE-2', mappingType: 'equivalent', confidence: 0.9 },

  // Audit and Accountability
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC4.1', targetFramework: 'NIST 800-53', targetControlId: 'AU-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC4.2', targetFramework: 'NIST 800-53', targetControlId: 'AU-2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.1', targetFramework: 'NIST 800-53', targetControlId: 'AU-6', mappingType: 'equivalent', confidence: 0.9 },

  // Risk Assessment
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC3.1', targetFramework: 'NIST 800-53', targetControlId: 'RA-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC3.2', targetFramework: 'NIST 800-53', targetControlId: 'RA-2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC3.3', targetFramework: 'NIST 800-53', targetControlId: 'RA-3', mappingType: 'equivalent', confidence: 0.9 },

  // Configuration Management
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC8.1', targetFramework: 'NIST 800-53', targetControlId: 'CM-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC8.1', targetFramework: 'NIST 800-53', targetControlId: 'CM-3', mappingType: 'equivalent', confidence: 0.9 },

  // Incident Response
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.3', targetFramework: 'NIST 800-53', targetControlId: 'IR-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.4', targetFramework: 'NIST 800-53', targetControlId: 'IR-4', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC7.5', targetFramework: 'NIST 800-53', targetControlId: 'IR-6', mappingType: 'equivalent', confidence: 0.9 },

  // Contingency Planning
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC9.1', targetFramework: 'NIST 800-53', targetControlId: 'CP-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 2 Type II', sourceControlId: 'CC9.2', targetFramework: 'NIST 800-53', targetControlId: 'CP-2', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // ISO 27001 <-> HIPAA Mappings (using exact control IDs)
  // =============================================================================

  // Access Controls
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.15', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-1.5', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.16', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-1.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.17', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-4.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.18', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-1.7', mappingType: 'equivalent', confidence: 0.85 },

  // Physical Security
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.7.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-PHY-1.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.7.2', targetFramework: 'HIPAA', targetControlId: 'HIPAA-PHY-1.3', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.7.3', targetFramework: 'HIPAA', targetControlId: 'HIPAA-PHY-1.6', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.7.4', targetFramework: 'HIPAA', targetControlId: 'HIPAA-PHY-1.5', mappingType: 'equivalent', confidence: 0.85 },

  // Audit and Monitoring
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.2', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-2.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.15', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-2.3', mappingType: 'equivalent', confidence: 0.85 },

  // Encryption
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.24', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-5.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.12', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-8.1', mappingType: 'equivalent', confidence: 0.9 },

  // Incident Management
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.24', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-6.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.25', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-6.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.26', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-6.4', mappingType: 'equivalent', confidence: 0.85 },

  // Risk Assessment
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.7', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-1.1', mappingType: 'equivalent', confidence: 0.9 },

  // Business Continuity
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.29', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-7.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.30', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-7.2', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // ISO 27001 <-> GDPR Mappings
  // =============================================================================

  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.1', targetFramework: 'GDPR', targetControlId: 'GDPR-5.1a', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.7', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.15', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.24', targetFramework: 'GDPR', targetControlId: 'GDPR-33', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.34', targetFramework: 'GDPR', targetControlId: 'GDPR-35', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.24', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // ISO 27001 <-> PCI DSS Mappings
  // =============================================================================

  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.15', targetFramework: 'PCI DSS', targetControlId: 'PCI-7.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.16', targetFramework: 'PCI DSS', targetControlId: 'PCI-7.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.17', targetFramework: 'PCI DSS', targetControlId: 'PCI-8.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.2', targetFramework: 'PCI DSS', targetControlId: 'PCI-10.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.24', targetFramework: 'PCI DSS', targetControlId: 'PCI-4.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.32', targetFramework: 'PCI DSS', targetControlId: 'PCI-6.4', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.7.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-9.1', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // ISO 27001 <-> NIST 800-53 Mappings
  // =============================================================================

  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.1', targetFramework: 'NIST 800-53', targetControlId: 'PL-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.7', targetFramework: 'NIST 800-53', targetControlId: 'RA-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.15', targetFramework: 'NIST 800-53', targetControlId: 'AC-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.16', targetFramework: 'NIST 800-53', targetControlId: 'AC-2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.17', targetFramework: 'NIST 800-53', targetControlId: 'IA-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.5.24', targetFramework: 'NIST 800-53', targetControlId: 'IR-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.7.1', targetFramework: 'NIST 800-53', targetControlId: 'PE-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.2', targetFramework: 'NIST 800-53', targetControlId: 'AU-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.24', targetFramework: 'NIST 800-53', targetControlId: 'SC-8', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27001', sourceControlId: 'A.8.32', targetFramework: 'NIST 800-53', targetControlId: 'CM-3', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // HIPAA <-> GDPR Mappings (using exact control IDs)
  // =============================================================================

  // Risk Management
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-1.1', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'equivalent', confidence: 0.85 },

  // Access Controls
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-1.5', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-1.1', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'partial', confidence: 0.85 },

  // Encryption
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-5.2', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-8.1', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'equivalent', confidence: 0.9 },

  // Breach Notification
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-6.1', targetFramework: 'GDPR', targetControlId: 'GDPR-33', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-6.2', targetFramework: 'GDPR', targetControlId: 'GDPR-34', mappingType: 'equivalent', confidence: 0.85 },

  // Integrity
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-3.1', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'partial', confidence: 0.8 },

  // =============================================================================
  // HIPAA <-> PCI DSS Mappings (using exact control IDs)
  // =============================================================================

  // Access Controls
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-1.5', targetFramework: 'PCI DSS', targetControlId: 'PCI-7.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-1.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-8.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-1.7', targetFramework: 'PCI DSS', targetControlId: 'PCI-7.2', mappingType: 'equivalent', confidence: 0.85 },

  // Authentication
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-4.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-8.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-4.2', targetFramework: 'PCI DSS', targetControlId: 'PCI-8.3', mappingType: 'equivalent', confidence: 0.9 },

  // Audit and Logging
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-2.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-10.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-2.3', targetFramework: 'PCI DSS', targetControlId: 'PCI-10.2', mappingType: 'equivalent', confidence: 0.9 },

  // Encryption
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-5.2', targetFramework: 'PCI DSS', targetControlId: 'PCI-4.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-8.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-3.4', mappingType: 'equivalent', confidence: 0.9 },

  // Physical Security
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-PHY-1.2', targetFramework: 'PCI DSS', targetControlId: 'PCI-9.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-PHY-1.3', targetFramework: 'PCI DSS', targetControlId: 'PCI-9.2', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // HIPAA <-> NIST 800-53 Mappings (using exact control IDs)
  // =============================================================================

  // Risk Assessment
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-1.1', targetFramework: 'NIST 800-53', targetControlId: 'RA-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-1.2', targetFramework: 'NIST 800-53', targetControlId: 'RA-3', mappingType: 'equivalent', confidence: 0.9 },

  // Access Control
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-1.5', targetFramework: 'NIST 800-53', targetControlId: 'AC-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-1.1', targetFramework: 'NIST 800-53', targetControlId: 'AC-2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-1.7', targetFramework: 'NIST 800-53', targetControlId: 'AC-6', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-1.3', targetFramework: 'NIST 800-53', targetControlId: 'AC-11', mappingType: 'equivalent', confidence: 0.9 },

  // Audit
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-2.1', targetFramework: 'NIST 800-53', targetControlId: 'AU-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-2.3', targetFramework: 'NIST 800-53', targetControlId: 'AU-6', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-2.2', targetFramework: 'NIST 800-53', targetControlId: 'AU-11', mappingType: 'equivalent', confidence: 0.9 },

  // Identification and Authentication
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-4.1', targetFramework: 'NIST 800-53', targetControlId: 'IA-2', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-4.2', targetFramework: 'NIST 800-53', targetControlId: 'IA-2', mappingType: 'equivalent', confidence: 0.9 },

  // Incident Response
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-6.1', targetFramework: 'NIST 800-53', targetControlId: 'IR-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-6.2', targetFramework: 'NIST 800-53', targetControlId: 'IR-4', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-6.4', targetFramework: 'NIST 800-53', targetControlId: 'IR-5', mappingType: 'equivalent', confidence: 0.9 },

  // Contingency Planning
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-7.1', targetFramework: 'NIST 800-53', targetControlId: 'CP-9', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-7.2', targetFramework: 'NIST 800-53', targetControlId: 'CP-10', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-ADM-7.3', targetFramework: 'NIST 800-53', targetControlId: 'CP-2', mappingType: 'equivalent', confidence: 0.9 },

  // System and Communications Protection
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-5.2', targetFramework: 'NIST 800-53', targetControlId: 'SC-8', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-TECH-8.1', targetFramework: 'NIST 800-53', targetControlId: 'SC-28', mappingType: 'equivalent', confidence: 0.9 },

  // Physical and Environmental Protection
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-PHY-1.2', targetFramework: 'NIST 800-53', targetControlId: 'PE-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'HIPAA', sourceControlId: 'HIPAA-PHY-1.3', targetFramework: 'NIST 800-53', targetControlId: 'PE-3', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // GDPR <-> PCI DSS Mappings
  // =============================================================================

  { sourceFramework: 'GDPR', sourceControlId: 'GDPR-32', targetFramework: 'PCI DSS', targetControlId: 'PCI-3.4', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'GDPR', sourceControlId: 'GDPR-32', targetFramework: 'PCI DSS', targetControlId: 'PCI-4.1', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'GDPR', sourceControlId: 'GDPR-32', targetFramework: 'PCI DSS', targetControlId: 'PCI-7.1', mappingType: 'partial', confidence: 0.8 },

  // =============================================================================
  // GDPR <-> NIST 800-53 Mappings
  // =============================================================================

  { sourceFramework: 'GDPR', sourceControlId: 'GDPR-5.1a', targetFramework: 'NIST 800-53', targetControlId: 'PL-1', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'GDPR', sourceControlId: 'GDPR-32', targetFramework: 'NIST 800-53', targetControlId: 'SC-8', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'GDPR', sourceControlId: 'GDPR-32', targetFramework: 'NIST 800-53', targetControlId: 'AC-1', mappingType: 'partial', confidence: 0.85 },
  { sourceFramework: 'GDPR', sourceControlId: 'GDPR-33', targetFramework: 'NIST 800-53', targetControlId: 'IR-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'GDPR', sourceControlId: 'GDPR-33', targetFramework: 'NIST 800-53', targetControlId: 'IR-6', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'GDPR', sourceControlId: 'GDPR-35', targetFramework: 'NIST 800-53', targetControlId: 'RA-3', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // PCI DSS <-> NIST 800-53 Mappings
  // =============================================================================

  { sourceFramework: 'PCI DSS', sourceControlId: 'PCI-1.1', targetFramework: 'NIST 800-53', targetControlId: 'SC-7', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'PCI DSS', sourceControlId: 'PCI-7.1', targetFramework: 'NIST 800-53', targetControlId: 'AC-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'PCI DSS', sourceControlId: 'PCI-7.2', targetFramework: 'NIST 800-53', targetControlId: 'AC-3', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'PCI DSS', sourceControlId: 'PCI-8.1', targetFramework: 'NIST 800-53', targetControlId: 'IA-2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'PCI DSS', sourceControlId: 'PCI-8.2', targetFramework: 'NIST 800-53', targetControlId: 'IA-5', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'PCI DSS', sourceControlId: 'PCI-10.1', targetFramework: 'NIST 800-53', targetControlId: 'AU-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'PCI DSS', sourceControlId: 'PCI-10.2', targetFramework: 'NIST 800-53', targetControlId: 'AU-2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'PCI DSS', sourceControlId: 'PCI-4.1', targetFramework: 'NIST 800-53', targetControlId: 'SC-8', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'PCI DSS', sourceControlId: 'PCI-6.4', targetFramework: 'NIST 800-53', targetControlId: 'CM-3', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'PCI DSS', sourceControlId: 'PCI-9.1', targetFramework: 'NIST 800-53', targetControlId: 'PE-1', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // ISO 27017 <-> ISO 27001 Mappings (ISO 27017 extends ISO 27001 for cloud)
  // =============================================================================
  //
  // These rows cover the 2015 edition (registry key 'ISO 27017'), which ISO withdrew when
  // ISO/IEC 27017:2026 was published; they stay for organizations still assessed against it.
  // The 2026 edition has its own section below ("ISO 27017:2026 (second edition) Mappings").
  //
  // ISO 27017 ids follow iso27017Controls.ts: "ISO27017-" + the ISO/IEC 27002:2013 clause
  // number the cloud guidance extends (9.1.1, 12.4.1, ...). Earlier revisions labelled these
  // rows "ISO27017-CLD.x.y", ids no template defines, so every ISO 27017 row produced a dead
  // "Also Satisfies" link. Each id now points at the template control whose subject matches
  // the row: 9.1.1 access-control policy, 9.2.1 user registration, 8.1.1 asset inventory,
  // 10.1.1 cryptography policy, 12.1.2 change management, 12.4.1 event logging, 16.1.1
  // incident responsibilities, 17.1.1 continuity planning. The Annex A cloud-only controls
  // (CLD.6.3.1, CLD.8.1.5, CLD.9.5.1, CLD.9.5.2, CLD.12.1.5, CLD.12.4.5, CLD.13.1.4) are not
  // in the 2015 template and have no rows here; their subjects are covered by the 2026 template.

  // Cloud-specific access control -> ISO 27001 Access Control
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.1.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.15', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.2.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.16', mappingType: 'equivalent', confidence: 0.9 },

  // Asset management
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-8.1.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.9', mappingType: 'equivalent', confidence: 0.9 },

  // Cryptography
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-10.1.1', targetFramework: 'ISO 27001', targetControlId: 'A.8.24', mappingType: 'equivalent', confidence: 0.95 },

  // Operations security
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.1.2', targetFramework: 'ISO 27001', targetControlId: 'A.8.32', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.4.1', targetFramework: 'ISO 27001', targetControlId: 'A.8.15', mappingType: 'equivalent', confidence: 0.9 },

  // Incident management
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-16.1.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.24', mappingType: 'equivalent', confidence: 0.95 },

  // =============================================================================
  // ISO 27017 <-> SOC 2 Mappings
  // =============================================================================

  // Access control
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.1.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.2.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.2', mappingType: 'equivalent', confidence: 0.85 },

  // Cryptography
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-10.1.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.7', mappingType: 'equivalent', confidence: 0.9 },

  // Logging and monitoring
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.4.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC4.1', mappingType: 'equivalent', confidence: 0.9 },

  // Change management
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.1.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC8.1', mappingType: 'equivalent', confidence: 0.9 },

  // Incident response
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-16.1.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.3', mappingType: 'equivalent', confidence: 0.9 },

  // Business continuity
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-17.1.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC9.1', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // ISO 27017 <-> NIST 800-53 Mappings
  // =============================================================================

  // Access control
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.1.1', targetFramework: 'NIST 800-53', targetControlId: 'AC-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.2.1', targetFramework: 'NIST 800-53', targetControlId: 'AC-2', mappingType: 'equivalent', confidence: 0.85 },

  // Cryptography
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-10.1.1', targetFramework: 'NIST 800-53', targetControlId: 'SC-8', mappingType: 'equivalent', confidence: 0.9 },

  // Configuration management
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.1.2', targetFramework: 'NIST 800-53', targetControlId: 'CM-3', mappingType: 'equivalent', confidence: 0.9 },

  // Audit
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.4.1', targetFramework: 'NIST 800-53', targetControlId: 'AU-1', mappingType: 'equivalent', confidence: 0.9 },

  // Incident response
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-16.1.1', targetFramework: 'NIST 800-53', targetControlId: 'IR-1', mappingType: 'equivalent', confidence: 0.9 },

  // Contingency planning
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-17.1.1', targetFramework: 'NIST 800-53', targetControlId: 'CP-1', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // ISO 27017 <-> FedRAMP Mappings (cloud-specific)
  // =============================================================================

  // Access control
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.1.1', targetFramework: 'FedRAMP', targetControlId: 'FR-AC-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.2.1', targetFramework: 'FedRAMP', targetControlId: 'FR-AC-2', mappingType: 'equivalent', confidence: 0.85 },

  // Cryptography
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-10.1.1', targetFramework: 'FedRAMP', targetControlId: 'FR-SC-8', mappingType: 'equivalent', confidence: 0.9 },

  // Incident response
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-16.1.1', targetFramework: 'FedRAMP', targetControlId: 'FR-IR-1', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // ISO 27017:2026 (second edition) Mappings
  // =============================================================================
  //
  // Source ids follow iso27017_2026Controls.ts: "ISO27017-2026-" + the ISO/IEC 27002:2022
  // control number (5.1 ... 8.34), plus the four cloud-specific controls 5.38, 5.39, 8.35 and
  // 8.36. NIST 800-53 and FedRAMP targets are base control ids (no enhancements such as
  // SC-7(21)), because stored control ids are matched up to the first colon with no parentheses.

  // ISO 27017:2026 <-> ISO 27001: each of the 93 sections adds cloud guidance to the ISO/IEC
  // 27002:2022 control with the same number, which is ISO 27001:2022 Annex A control A.<n>.
  // Organizational controls
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.2', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.3', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.4', targetFramework: 'ISO 27001', targetControlId: 'A.5.4', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.5', targetFramework: 'ISO 27001', targetControlId: 'A.5.5', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.6', targetFramework: 'ISO 27001', targetControlId: 'A.5.6', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.7', targetFramework: 'ISO 27001', targetControlId: 'A.5.7', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.8', targetFramework: 'ISO 27001', targetControlId: 'A.5.8', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.9', targetFramework: 'ISO 27001', targetControlId: 'A.5.9', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.10', targetFramework: 'ISO 27001', targetControlId: 'A.5.10', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.11', targetFramework: 'ISO 27001', targetControlId: 'A.5.11', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.12', targetFramework: 'ISO 27001', targetControlId: 'A.5.12', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.13', targetFramework: 'ISO 27001', targetControlId: 'A.5.13', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.14', targetFramework: 'ISO 27001', targetControlId: 'A.5.14', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.15', targetFramework: 'ISO 27001', targetControlId: 'A.5.15', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.16', targetFramework: 'ISO 27001', targetControlId: 'A.5.16', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.17', targetFramework: 'ISO 27001', targetControlId: 'A.5.17', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.18', targetFramework: 'ISO 27001', targetControlId: 'A.5.18', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.19', targetFramework: 'ISO 27001', targetControlId: 'A.5.19', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.20', targetFramework: 'ISO 27001', targetControlId: 'A.5.20', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.21', targetFramework: 'ISO 27001', targetControlId: 'A.5.21', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.22', targetFramework: 'ISO 27001', targetControlId: 'A.5.22', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.23', targetFramework: 'ISO 27001', targetControlId: 'A.5.23', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.24', targetFramework: 'ISO 27001', targetControlId: 'A.5.24', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.25', targetFramework: 'ISO 27001', targetControlId: 'A.5.25', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.26', targetFramework: 'ISO 27001', targetControlId: 'A.5.26', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.27', targetFramework: 'ISO 27001', targetControlId: 'A.5.27', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.28', targetFramework: 'ISO 27001', targetControlId: 'A.5.28', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.29', targetFramework: 'ISO 27001', targetControlId: 'A.5.29', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.30', targetFramework: 'ISO 27001', targetControlId: 'A.5.30', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.31', targetFramework: 'ISO 27001', targetControlId: 'A.5.31', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.32', targetFramework: 'ISO 27001', targetControlId: 'A.5.32', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.33', targetFramework: 'ISO 27001', targetControlId: 'A.5.33', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.34', targetFramework: 'ISO 27001', targetControlId: 'A.5.34', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.35', targetFramework: 'ISO 27001', targetControlId: 'A.5.35', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.36', targetFramework: 'ISO 27001', targetControlId: 'A.5.36', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.37', targetFramework: 'ISO 27001', targetControlId: 'A.5.37', mappingType: 'equivalent', confidence: 0.95 },
  // People controls
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-6.1', targetFramework: 'ISO 27001', targetControlId: 'A.6.1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-6.2', targetFramework: 'ISO 27001', targetControlId: 'A.6.2', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-6.3', targetFramework: 'ISO 27001', targetControlId: 'A.6.3', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-6.4', targetFramework: 'ISO 27001', targetControlId: 'A.6.4', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-6.5', targetFramework: 'ISO 27001', targetControlId: 'A.6.5', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-6.6', targetFramework: 'ISO 27001', targetControlId: 'A.6.6', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-6.7', targetFramework: 'ISO 27001', targetControlId: 'A.6.7', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-6.8', targetFramework: 'ISO 27001', targetControlId: 'A.6.8', mappingType: 'equivalent', confidence: 0.95 },
  // Physical controls
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.1', targetFramework: 'ISO 27001', targetControlId: 'A.7.1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.2', targetFramework: 'ISO 27001', targetControlId: 'A.7.2', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.3', targetFramework: 'ISO 27001', targetControlId: 'A.7.3', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.4', targetFramework: 'ISO 27001', targetControlId: 'A.7.4', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.5', targetFramework: 'ISO 27001', targetControlId: 'A.7.5', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.6', targetFramework: 'ISO 27001', targetControlId: 'A.7.6', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.7', targetFramework: 'ISO 27001', targetControlId: 'A.7.7', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.8', targetFramework: 'ISO 27001', targetControlId: 'A.7.8', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.9', targetFramework: 'ISO 27001', targetControlId: 'A.7.9', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.10', targetFramework: 'ISO 27001', targetControlId: 'A.7.10', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.11', targetFramework: 'ISO 27001', targetControlId: 'A.7.11', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.12', targetFramework: 'ISO 27001', targetControlId: 'A.7.12', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.13', targetFramework: 'ISO 27001', targetControlId: 'A.7.13', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-7.14', targetFramework: 'ISO 27001', targetControlId: 'A.7.14', mappingType: 'equivalent', confidence: 0.95 },
  // Technological controls
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.1', targetFramework: 'ISO 27001', targetControlId: 'A.8.1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.2', targetFramework: 'ISO 27001', targetControlId: 'A.8.2', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.3', targetFramework: 'ISO 27001', targetControlId: 'A.8.3', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.4', targetFramework: 'ISO 27001', targetControlId: 'A.8.4', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.5', targetFramework: 'ISO 27001', targetControlId: 'A.8.5', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.6', targetFramework: 'ISO 27001', targetControlId: 'A.8.6', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.7', targetFramework: 'ISO 27001', targetControlId: 'A.8.7', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.8', targetFramework: 'ISO 27001', targetControlId: 'A.8.8', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.9', targetFramework: 'ISO 27001', targetControlId: 'A.8.9', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.10', targetFramework: 'ISO 27001', targetControlId: 'A.8.10', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.11', targetFramework: 'ISO 27001', targetControlId: 'A.8.11', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.12', targetFramework: 'ISO 27001', targetControlId: 'A.8.12', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.13', targetFramework: 'ISO 27001', targetControlId: 'A.8.13', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.14', targetFramework: 'ISO 27001', targetControlId: 'A.8.14', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.15', targetFramework: 'ISO 27001', targetControlId: 'A.8.15', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.16', targetFramework: 'ISO 27001', targetControlId: 'A.8.16', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.17', targetFramework: 'ISO 27001', targetControlId: 'A.8.17', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.18', targetFramework: 'ISO 27001', targetControlId: 'A.8.18', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.19', targetFramework: 'ISO 27001', targetControlId: 'A.8.19', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.20', targetFramework: 'ISO 27001', targetControlId: 'A.8.20', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.21', targetFramework: 'ISO 27001', targetControlId: 'A.8.21', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.22', targetFramework: 'ISO 27001', targetControlId: 'A.8.22', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.23', targetFramework: 'ISO 27001', targetControlId: 'A.8.23', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.24', targetFramework: 'ISO 27001', targetControlId: 'A.8.24', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.25', targetFramework: 'ISO 27001', targetControlId: 'A.8.25', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.26', targetFramework: 'ISO 27001', targetControlId: 'A.8.26', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.27', targetFramework: 'ISO 27001', targetControlId: 'A.8.27', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.28', targetFramework: 'ISO 27001', targetControlId: 'A.8.28', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.29', targetFramework: 'ISO 27001', targetControlId: 'A.8.29', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.30', targetFramework: 'ISO 27001', targetControlId: 'A.8.30', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.31', targetFramework: 'ISO 27001', targetControlId: 'A.8.31', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.32', targetFramework: 'ISO 27001', targetControlId: 'A.8.32', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.33', targetFramework: 'ISO 27001', targetControlId: 'A.8.33', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.34', targetFramework: 'ISO 27001', targetControlId: 'A.8.34', mappingType: 'equivalent', confidence: 0.95 },

  // ISO 27017:2026 <-> SOC 2 / NIST 800-53 / FedRAMP: the subjects the 2015-edition rows above
  // cover (access control, identity, cryptography, logging, change, incidents, continuity).
  // SOC 2 Type II
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.15', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.16', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.24', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.7', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.15', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.2', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.32', targetFramework: 'SOC 2 Type II', targetControlId: 'CC8.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.24', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.3', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.30', targetFramework: 'SOC 2 Type II', targetControlId: 'CC9.1', mappingType: 'partial', confidence: 0.8 },
  // NIST 800-53
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.15', targetFramework: 'NIST 800-53', targetControlId: 'AC-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.16', targetFramework: 'NIST 800-53', targetControlId: 'AC-2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.24', targetFramework: 'NIST 800-53', targetControlId: 'SC-13', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.32', targetFramework: 'NIST 800-53', targetControlId: 'CM-3', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.15', targetFramework: 'NIST 800-53', targetControlId: 'AU-2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.24', targetFramework: 'NIST 800-53', targetControlId: 'IR-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.30', targetFramework: 'NIST 800-53', targetControlId: 'CP-2', mappingType: 'partial', confidence: 0.8 },
  // FedRAMP
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.15', targetFramework: 'FedRAMP', targetControlId: 'FR-AC-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.16', targetFramework: 'FedRAMP', targetControlId: 'FR-AC-2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.24', targetFramework: 'FedRAMP', targetControlId: 'FR-SC-13', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.24', targetFramework: 'FedRAMP', targetControlId: 'FR-IR-1', mappingType: 'equivalent', confidence: 0.9 },

  // Cloud-specific controls. None has a one-to-one counterpart elsewhere, so rows are partial or
  // related only.
  // 5.38 Shared roles and responsibilities within a cloud computing environment
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.38', targetFramework: 'ISO 27001', targetControlId: 'A.5.23', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.38', targetFramework: 'ISO 27001', targetControlId: 'A.5.2', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.38', targetFramework: 'SOC 2 Type II', targetControlId: 'CC9.2', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.38', targetFramework: 'SOC 2 Type II', targetControlId: 'CC2.3', mappingType: 'related', confidence: 0.65 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.38', targetFramework: 'NIST 800-53', targetControlId: 'SA-9', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.38', targetFramework: 'FedRAMP', targetControlId: 'FR-SA-9', mappingType: 'partial', confidence: 0.8 },
  // 5.39 Cloud service partner roles and responsibilities
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.39', targetFramework: 'ISO 27001', targetControlId: 'A.5.20', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.39', targetFramework: 'ISO 27001', targetControlId: 'A.5.19', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.39', targetFramework: 'SOC 2 Type II', targetControlId: 'CC9.2', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.39', targetFramework: 'NIST 800-53', targetControlId: 'SA-9', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.39', targetFramework: 'NIST 800-53', targetControlId: 'PS-7', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.39', targetFramework: 'NIST 800-53', targetControlId: 'SA-4', mappingType: 'related', confidence: 0.65 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.39', targetFramework: 'FedRAMP', targetControlId: 'FR-SA-9', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-5.39', targetFramework: 'FedRAMP', targetControlId: 'FR-PS-7', mappingType: 'related', confidence: 0.7 },
  // 8.35 Segregation in virtual computing environments
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.35', targetFramework: 'ISO 27001', targetControlId: 'A.8.22', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.35', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.1', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.35', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.6', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.35', targetFramework: 'NIST 800-53', targetControlId: 'SC-4', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.35', targetFramework: 'NIST 800-53', targetControlId: 'SC-39', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.35', targetFramework: 'NIST 800-53', targetControlId: 'SC-32', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.35', targetFramework: 'NIST 800-53', targetControlId: 'SC-7', mappingType: 'related', confidence: 0.65 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.35', targetFramework: 'FedRAMP', targetControlId: 'FR-SC-4', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.35', targetFramework: 'FedRAMP', targetControlId: 'FR-SC-39', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.35', targetFramework: 'FedRAMP', targetControlId: 'FR-SC-32', mappingType: 'related', confidence: 0.7 },
  // 8.36 Detection and prevention of unauthorized use of cloud services
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'ISO 27001', targetControlId: 'A.5.23', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'ISO 27001', targetControlId: 'A.8.16', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'ISO 27001', targetControlId: 'A.5.9', mappingType: 'related', confidence: 0.65 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.2', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.8', mappingType: 'related', confidence: 0.65 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'NIST 800-53', targetControlId: 'CM-8', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'NIST 800-53', targetControlId: 'SI-4', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'NIST 800-53', targetControlId: 'CM-10', mappingType: 'related', confidence: 0.65 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'NIST 800-53', targetControlId: 'SA-9', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'NIST 800-53', targetControlId: 'AC-20', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'FedRAMP', targetControlId: 'FR-CM-8', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'FedRAMP', targetControlId: 'FR-SI-4', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017:2026', sourceControlId: 'ISO27017-2026-8.36', targetFramework: 'FedRAMP', targetControlId: 'FR-CM-10', mappingType: 'related', confidence: 0.65 },

  // ISO 27017 (2015) -> ISO 27017:2026 edition transition. Each 2015 control is linked to the 2026
  // control covering the same subject, so an organization holding both editions sees "Also
  // Satisfies" between them. Derived from the public ISO/IEC 27002:2013 -> 2022 control
  // correspondence and each control's subject; this is not Annex A of ISO/IEC 27017:2026. Where
  // the 2015 name and clause number disagree, the name wins (ISO27017-9.4.1 "Cloud Service
  // Authentication" -> 8.5 Secure Authentication).
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-5.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-5.1.2', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-6.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-6.1.2', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-6.1.3', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.5', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-7.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-6.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-7.2.2', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-6.3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-8.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.9', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-8.2.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.12', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-8.2.2', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.13', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.15', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.2.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.16', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.2.3', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.4.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.5', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-9.4.4', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.18', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-10.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.24', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-10.1.2', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.24', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-11.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-7.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-11.2.7', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-7.14', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.1.2', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.32', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.1.3', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.6', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.2.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.7', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.3.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.13', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.4.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.15', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.4.3', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.15', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-12.6.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.8', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-13.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.20', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-13.1.3', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.22', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-13.2.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.14', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-14.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.26', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-14.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.8', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-14.2.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.25', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-14.2.5', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.27', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-15.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.19', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-15.2.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.22', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-16.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.24', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-16.1.2', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-6.8', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-16.1.5', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.26', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-17.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.29', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-17.1.2', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.29', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-17.2.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-8.14', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-18.1.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.31', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-18.1.3', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.33', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-18.1.5', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.31', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-18.2.1', targetFramework: 'ISO 27017:2026', targetControlId: 'ISO27017-2026-5.35', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // SOC 3 <-> SOC 2 Mappings (IDENTICAL Trust Services Criteria — 1:1 equivalent)
  // SOC 3 uses the same AICPA 2017 TSC (with 2022 revisions) as SOC 2.
  // Difference is only the report deliverable (general-use seal vs detailed Type 1/2).
  // =============================================================================

  // CC1: Control Environment
  { sourceFramework: 'SOC 3', sourceControlId: 'CC1.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC1.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC1.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC1.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC1.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC1.3', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC1.4', targetFramework: 'SOC 2 Type II', targetControlId: 'CC1.4', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC1.5', targetFramework: 'SOC 2 Type II', targetControlId: 'CC1.5', mappingType: 'equivalent', confidence: 1.0 },
  // CC2: Communication and Information
  { sourceFramework: 'SOC 3', sourceControlId: 'CC2.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC2.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC2.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC2.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC2.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC2.3', mappingType: 'equivalent', confidence: 1.0 },
  // CC3: Risk Assessment
  { sourceFramework: 'SOC 3', sourceControlId: 'CC3.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC3.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC3.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC3.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC3.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC3.3', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC3.4', targetFramework: 'SOC 2 Type II', targetControlId: 'CC3.4', mappingType: 'equivalent', confidence: 1.0 },
  // CC4: Monitoring Activities
  { sourceFramework: 'SOC 3', sourceControlId: 'CC4.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC4.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC4.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC4.2', mappingType: 'equivalent', confidence: 1.0 },
  // CC5: Control Activities
  { sourceFramework: 'SOC 3', sourceControlId: 'CC5.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC5.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC5.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC5.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC5.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC5.3', mappingType: 'equivalent', confidence: 1.0 },
  // CC6: Logical and Physical Access Controls
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.3', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.4', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.4', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.5', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.5', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.6', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.6', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.7', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.7', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.8', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.8', mappingType: 'equivalent', confidence: 1.0 },
  // CC7: System Operations
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.3', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.4', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.4', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.5', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.5', mappingType: 'equivalent', confidence: 1.0 },
  // CC8: Change Management
  { sourceFramework: 'SOC 3', sourceControlId: 'CC8.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC8.1', mappingType: 'equivalent', confidence: 1.0 },
  // CC9: Risk Mitigation
  { sourceFramework: 'SOC 3', sourceControlId: 'CC9.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC9.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC9.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC9.2', mappingType: 'equivalent', confidence: 1.0 },
  // A1: Availability
  { sourceFramework: 'SOC 3', sourceControlId: 'A1.1', targetFramework: 'SOC 2 Type II', targetControlId: 'A1.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'A1.2', targetFramework: 'SOC 2 Type II', targetControlId: 'A1.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'A1.3', targetFramework: 'SOC 2 Type II', targetControlId: 'A1.3', mappingType: 'equivalent', confidence: 1.0 },
  // PI1: Processing Integrity
  { sourceFramework: 'SOC 3', sourceControlId: 'PI1.1', targetFramework: 'SOC 2 Type II', targetControlId: 'PI1.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'PI1.2', targetFramework: 'SOC 2 Type II', targetControlId: 'PI1.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'PI1.3', targetFramework: 'SOC 2 Type II', targetControlId: 'PI1.3', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'PI1.4', targetFramework: 'SOC 2 Type II', targetControlId: 'PI1.4', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'PI1.5', targetFramework: 'SOC 2 Type II', targetControlId: 'PI1.5', mappingType: 'equivalent', confidence: 1.0 },
  // C1: Confidentiality
  { sourceFramework: 'SOC 3', sourceControlId: 'C1.1', targetFramework: 'SOC 2 Type II', targetControlId: 'C1.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'C1.2', targetFramework: 'SOC 2 Type II', targetControlId: 'C1.2', mappingType: 'equivalent', confidence: 1.0 },
  // P1-P8: Privacy
  { sourceFramework: 'SOC 3', sourceControlId: 'P1.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P1.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P2.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P2.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P3.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P3.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P3.2', targetFramework: 'SOC 2 Type II', targetControlId: 'P3.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P4.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P4.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P4.2', targetFramework: 'SOC 2 Type II', targetControlId: 'P4.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P4.3', targetFramework: 'SOC 2 Type II', targetControlId: 'P4.3', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P5.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P5.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P5.2', targetFramework: 'SOC 2 Type II', targetControlId: 'P5.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P6.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P6.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P6.2', targetFramework: 'SOC 2 Type II', targetControlId: 'P6.2', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P6.3', targetFramework: 'SOC 2 Type II', targetControlId: 'P6.3', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P6.4', targetFramework: 'SOC 2 Type II', targetControlId: 'P6.4', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P6.5', targetFramework: 'SOC 2 Type II', targetControlId: 'P6.5', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P6.6', targetFramework: 'SOC 2 Type II', targetControlId: 'P6.6', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P6.7', targetFramework: 'SOC 2 Type II', targetControlId: 'P6.7', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P7.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P7.1', mappingType: 'equivalent', confidence: 1.0 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P8.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P8.1', mappingType: 'equivalent', confidence: 1.0 },

  // =============================================================================
  // SOC 3 <-> ISO 27001 Mappings (inherited via SOC 2 TSCs)
  // =============================================================================
  { sourceFramework: 'SOC 3', sourceControlId: 'CC1.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC3.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.7', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.15', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.16', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.17', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.7', targetFramework: 'ISO 27001', targetControlId: 'A.8.24', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.2', targetFramework: 'ISO 27001', targetControlId: 'A.8.16', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.24', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC8.1', targetFramework: 'ISO 27001', targetControlId: 'A.8.32', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC9.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.29', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC9.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.19', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'A1.1', targetFramework: 'ISO 27001', targetControlId: 'A.8.6', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 3', sourceControlId: 'A1.2', targetFramework: 'ISO 27001', targetControlId: 'A.8.13', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 3', sourceControlId: 'A1.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.30', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 3', sourceControlId: 'C1.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.12', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'C1.2', targetFramework: 'ISO 27001', targetControlId: 'A.7.14', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P1.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.34', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // SOC 3 <-> HIPAA Mappings (inherited via SOC 2 TSCs)
  // =============================================================================
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-1.5', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.2', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-1.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.7', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-5.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.3', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-6.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC9.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-ADM-7.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC4.1', targetFramework: 'HIPAA', targetControlId: 'HIPAA-TECH-2.1', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // SOC 3 <-> GDPR Mappings (inherited via SOC 2 TSCs)
  // =============================================================================
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.1', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.3', targetFramework: 'GDPR', targetControlId: 'GDPR-33', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.5', targetFramework: 'GDPR', targetControlId: 'GDPR-34', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P1.1', targetFramework: 'GDPR', targetControlId: 'GDPR-12', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P2.1', targetFramework: 'GDPR', targetControlId: 'GDPR-6', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P5.1', targetFramework: 'GDPR', targetControlId: 'GDPR-15', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P5.2', targetFramework: 'GDPR', targetControlId: 'GDPR-16', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'P4.3', targetFramework: 'GDPR', targetControlId: 'GDPR-17', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // SOC 3 <-> PCI DSS Mappings (inherited via SOC 2 TSCs)
  // =============================================================================
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-7.1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.2', targetFramework: 'PCI DSS', targetControlId: 'PCI-8.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.7', targetFramework: 'PCI DSS', targetControlId: 'PCI-4.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC4.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-10.1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC8.1', targetFramework: 'PCI DSS', targetControlId: 'PCI-6.4', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // SOC 3 <-> NIST 800-53 Mappings (inherited via SOC 2 TSCs)
  // =============================================================================
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.1', targetFramework: 'NIST 800-53', targetControlId: 'AC-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC6.2', targetFramework: 'NIST 800-53', targetControlId: 'AC-2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC4.1', targetFramework: 'NIST 800-53', targetControlId: 'AU-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC3.1', targetFramework: 'NIST 800-53', targetControlId: 'RA-1', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC8.1', targetFramework: 'NIST 800-53', targetControlId: 'CM-3', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'SOC 3', sourceControlId: 'CC7.3', targetFramework: 'NIST 800-53', targetControlId: 'IR-1', mappingType: 'equivalent', confidence: 0.95 },

  // =============================================================================
  // ISO 42001 <-> ISO 27001 Mappings
  // Per Annex A integration guidance: AIMS leverages ISMS where appropriate.
  // =============================================================================

  // Management system clauses overlap (Annex SL alignment)
  { sourceFramework: 'ISO 42001', sourceControlId: '4.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.1', mappingType: 'related', confidence: 0.8 },
  { sourceFramework: 'ISO 42001', sourceControlId: '5.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: '5.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: '6.1.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.7', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'ISO 42001', sourceControlId: '7.2', targetFramework: 'ISO 27001', targetControlId: 'A.6.3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: '7.3', targetFramework: 'ISO 27001', targetControlId: 'A.6.3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: '7.5', targetFramework: 'ISO 27001', targetControlId: 'A.5.33', mappingType: 'related', confidence: 0.8 },
  { sourceFramework: 'ISO 42001', sourceControlId: '9.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.35', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: '9.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.36', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: '10.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.27', mappingType: 'equivalent', confidence: 0.85 },

  // Annex A controls
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.2.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.1', mappingType: 'related', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.2.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.1', mappingType: 'related', confidence: 0.8 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.3.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.3.3', targetFramework: 'ISO 27001', targetControlId: 'A.6.8', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.4.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.12', mappingType: 'related', confidence: 0.8 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.6.2.7', targetFramework: 'ISO 27001', targetControlId: 'A.5.33', mappingType: 'related', confidence: 0.8 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.6.2.8', targetFramework: 'ISO 27001', targetControlId: 'A.8.15', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.7.4', targetFramework: 'ISO 27001', targetControlId: 'A.5.12', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.10.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.19', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.10.4', targetFramework: 'ISO 27001', targetControlId: 'A.5.20', mappingType: 'related', confidence: 0.8 },

  // =============================================================================
  // ISO 42001 <-> SOC 2 Mappings (governance and operational overlap)
  // =============================================================================
  { sourceFramework: 'ISO 42001', sourceControlId: '5.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC1.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: '5.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC1.5', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: '5.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC1.3', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: '6.1.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC3.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: '7.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC1.4', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: '7.4', targetFramework: 'SOC 2 Type II', targetControlId: 'CC2.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: '8.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC5.1', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'ISO 42001', sourceControlId: '9.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC4.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: '9.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC4.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: '10.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC4.2', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // ISO 42001 <-> EU AI Act Mappings
  // Direct overlap on AI governance, risk, transparency, oversight requirements.
  // =============================================================================
  // Quality Management System (EU AI Act Article 17 ↔ ISO 42001 management system)
  { sourceFramework: 'ISO 42001', sourceControlId: '4.4', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.9', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.2.2', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.9', mappingType: 'equivalent', confidence: 0.9 },
  // Risk management (EU AI Act Article 9 ↔ ISO 42001 risk processes)
  { sourceFramework: 'ISO 42001', sourceControlId: '6.1.2', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: '8.2', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.1', mappingType: 'equivalent', confidence: 0.85 },
  // Data and data governance (EU AI Act Article 10 ↔ ISO 42001 A.7 controls)
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.7.4', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.7.5', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.7.6', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.2', mappingType: 'related', confidence: 0.8 },
  // Technical documentation (EU AI Act Article 11 ↔ ISO 42001 A.6.2.3, A.6.2.7)
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.6.2.3', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.3', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.6.2.7', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.3', mappingType: 'equivalent', confidence: 0.95 },
  // Record-keeping / event logs (EU AI Act Article 12 ↔ ISO 42001 A.6.2.8)
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.6.2.8', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.4', mappingType: 'equivalent', confidence: 0.95 },
  // Transparency to users (EU AI Act Article 13 ↔ ISO 42001 A.8.2)
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.8.2', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.5', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.8.5', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.5', mappingType: 'related', confidence: 0.8 },
  // Human oversight (EU AI Act Article 14 ↔ ISO 42001 A.9.2)
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.9.2', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.6', mappingType: 'equivalent', confidence: 0.9 },
  // Accuracy, robustness, cybersecurity (EU AI Act Article 15 ↔ ISO 42001 A.6.2.4)
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.6.2.4', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.7', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.6.2.6', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.7', mappingType: 'related', confidence: 0.8 },
  // Impact assessment / conformity (EU AI Act Article 27 / 43 ↔ ISO 42001 A.5)
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.5.2', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-4.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.5.4', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-4.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.5.5', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-4.3', mappingType: 'related', confidence: 0.8 },
  // Post-market monitoring (EU AI Act Article 72 ↔ ISO 42001 A.6.2.6, 9.1)
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.6.2.6', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-5.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: '9.1', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-5.2', mappingType: 'equivalent', confidence: 0.85 },
  // Incident reporting (EU AI Act Article 73 ↔ ISO 42001 A.8.4)
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.8.4', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-5.3', mappingType: 'equivalent', confidence: 0.95 },

  // =============================================================================
  // ISO 42001 <-> NIST 800-53 (general controls overlap)
  // =============================================================================
  { sourceFramework: 'ISO 42001', sourceControlId: '5.2', targetFramework: 'NIST 800-53', targetControlId: 'PL-1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: '6.1.2', targetFramework: 'NIST 800-53', targetControlId: 'RA-1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: '7.2', targetFramework: 'NIST 800-53', targetControlId: 'AT-3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.6.2.8', targetFramework: 'NIST 800-53', targetControlId: 'AU-2', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.7.4', targetFramework: 'NIST 800-53', targetControlId: 'SI-12', mappingType: 'related', confidence: 0.8 },
  { sourceFramework: 'ISO 42001', sourceControlId: 'A.10.3', targetFramework: 'NIST 800-53', targetControlId: 'SA-9', mappingType: 'equivalent', confidence: 0.9 },

  // =============================================================================
  // AIUC-1 (AI Agent Standard, July 15 2026 release) <-> ISO 42001 / ISO 27001 / SOC 2 / NIST AI 600-1 / EU AI Act
  // Re-derived 2026-09-07 for the verified requirement set in aiuc1Controls.ts
  // (AIUC1-<pillar>.<n> is the official requirement <pillar>00n; E.7 and E.14 are retired ids).
  // =============================================================================
  // A. Data & Privacy
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.1', targetFramework: 'ISO 42001', targetControlId: 'A.7.2', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.1', targetFramework: 'ISO 42001', targetControlId: 'A.10.4', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P1.4', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P4.2', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.2', targetFramework: 'ISO 42001', targetControlId: 'A.10.4', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.2', targetFramework: 'ISO 42001', targetControlId: 'A.8.5', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.2', targetFramework: 'SOC 2 Type II', targetControlId: 'P1.2', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.3', targetFramework: 'ISO 27001', targetControlId: 'A.8.3', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.15', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.3', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.4', targetFramework: 'SOC 2 Type II', targetControlId: 'C1.1', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.4', targetFramework: 'ISO 27001', targetControlId: 'A.6.6', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.4', targetFramework: 'ISO 27001', targetControlId: 'A.5.32', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.4', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MP-4.2', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.5', targetFramework: 'SOC 2 Type II', targetControlId: 'C1.8', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.5', targetFramework: 'ISO 27001', targetControlId: 'A.8.3', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.5', targetFramework: 'ISO 42001', targetControlId: 'A.10.4', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.6', targetFramework: 'ISO 27001', targetControlId: 'A.5.34', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.6', targetFramework: 'ISO 27001', targetControlId: 'A.8.12', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.6', targetFramework: 'ISO 27001', targetControlId: 'A.8.11', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.6', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.13', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.6', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MP-4.1', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.7', targetFramework: 'ISO 27001', targetControlId: 'A.5.32', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.7', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MP-4.2', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.8', targetFramework: 'ISO 27001', targetControlId: 'A.5.17', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.8', targetFramework: 'ISO 27001', targetControlId: 'A.8.12', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-A.8', targetFramework: 'ISO 27001', targetControlId: 'A.8.28', mappingType: 'partial', confidence: 0.65 },
  // B. Security
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.1', targetFramework: 'ISO 27001', targetControlId: 'A.8.29', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.1', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.4', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.1', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MS-3.4', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.2', targetFramework: 'ISO 27001', targetControlId: 'A.8.16', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.2', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.12', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.4', targetFramework: 'ISO 27001', targetControlId: 'A.8.16', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.4', targetFramework: 'ISO 27001', targetControlId: 'A.8.29', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.4', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.6', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.5', targetFramework: 'ISO 27001', targetControlId: 'A.8.16', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.6', targetFramework: 'ISO 27001', targetControlId: 'A.8.3', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.6', targetFramework: 'ISO 27001', targetControlId: 'A.8.22', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.6', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.1', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.6', targetFramework: 'ISO 42001', targetControlId: 'A.9.2', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.7', targetFramework: 'ISO 27001', targetControlId: 'A.5.15', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.7', targetFramework: 'ISO 27001', targetControlId: 'A.5.18', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.7', targetFramework: 'ISO 27001', targetControlId: 'A.8.2', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.7', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.7', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.8', targetFramework: 'ISO 27001', targetControlId: 'A.8.5', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.8', targetFramework: 'ISO 27001', targetControlId: 'A.8.24', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.8', targetFramework: 'ISO 27001', targetControlId: 'A.8.20', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.8', targetFramework: 'ISO 27001', targetControlId: 'A.8.9', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.8', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.1', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.8', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.7', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.9', targetFramework: 'ISO 27001', targetControlId: 'A.8.12', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.10', targetFramework: 'ISO 27001', targetControlId: 'A.8.28', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-B.10', targetFramework: 'ISO 27001', targetControlId: 'A.8.25', mappingType: 'partial', confidence: 0.7 },
  // C. Safety
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.1', targetFramework: 'ISO 42001', targetControlId: '6.1.2', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.1', targetFramework: 'ISO 42001', targetControlId: 'A.6.1.2', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.1', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-GV-1.2', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC3.2', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.2', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.4', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.2', targetFramework: 'ISO 27001', targetControlId: 'A.8.29', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC8.1', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.3', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MP-3.5', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.3', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MS-2.2', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.3', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MS-2.3', mappingType: 'related', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.3', targetFramework: 'ISO 42001', targetControlId: 'A.9.2', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.4', targetFramework: 'ISO 42001', targetControlId: 'A.9.4', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.4', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.2', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.5', targetFramework: 'ISO 42001', targetControlId: '8.3', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.5', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MG-1.2', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.6', targetFramework: 'ISO 27001', targetControlId: 'A.8.28', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.6', targetFramework: 'ISO 27001', targetControlId: 'A.8.26', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.7', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MG-2.4', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.7', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.7', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.7', targetFramework: 'ISO 42001', targetControlId: 'A.9.2', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.8', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.6', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.8', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MG-4.2', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.8', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-7.1', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.9', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MG-4.2', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.9', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.7', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.10', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MS-2.2', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.10', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.4', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.11', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.4', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.11', targetFramework: 'ISO 42001', targetControlId: 'A.9.4', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-C.12', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.4', mappingType: 'partial', confidence: 0.6 },
  // D. Reliability
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-D.1', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MP-3.4', mappingType: 'related', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-D.1', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MS-2.1', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-D.1', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.4', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-D.2', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MS-2.1', mappingType: 'related', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-D.3', targetFramework: 'ISO 27001', targetControlId: 'A.8.3', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-D.3', targetFramework: 'ISO 27001', targetControlId: 'A.8.15', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-D.3', targetFramework: 'ISO 42001', targetControlId: 'A.9.2', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-D.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.3', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-D.4', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.4', mappingType: 'partial', confidence: 0.6 },
  // E. Accountability (E.7 and E.14 are retired requirement ids and have no controls)
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.1', targetFramework: 'ISO 42001', targetControlId: 'A.8.4', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.24', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.26', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.28', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.4', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.5', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.1', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MG-4.1', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.2', targetFramework: 'ISO 42001', targetControlId: 'A.8.4', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.2', targetFramework: 'ISO 27001', targetControlId: 'A.5.24', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.2', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.4', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.2', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MG-4.1', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.3', targetFramework: 'ISO 42001', targetControlId: 'A.8.4', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.4', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.3', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MG-4.1', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.4', targetFramework: 'ISO 42001', targetControlId: 'A.3.2', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.4', targetFramework: 'ISO 42001', targetControlId: '6.3', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.4', targetFramework: 'ISO 27001', targetControlId: 'A.8.32', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.4', targetFramework: 'SOC 2 Type II', targetControlId: 'CC8.1', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.4', targetFramework: 'SOC 2 Type II', targetControlId: 'CC5.4', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.5', targetFramework: 'ISO 42001', targetControlId: 'A.4.5', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.5', targetFramework: 'ISO 27001', targetControlId: 'A.5.23', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.5', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.1', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.6', targetFramework: 'ISO 42001', targetControlId: 'A.10.3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.6', targetFramework: 'ISO 27001', targetControlId: 'A.5.19', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.6', targetFramework: 'ISO 27001', targetControlId: 'A.5.20', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.6', targetFramework: 'ISO 27001', targetControlId: 'A.5.21', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.6', targetFramework: 'SOC 2 Type II', targetControlId: 'CC9.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.6', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-GV-6.1', mappingType: 'related', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.8', targetFramework: 'ISO 42001', targetControlId: '9.3', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.8', targetFramework: 'ISO 42001', targetControlId: '9.1', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.8', targetFramework: 'ISO 27001', targetControlId: 'A.5.36', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.8', targetFramework: 'SOC 2 Type II', targetControlId: 'CC4.1', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.8', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MG-4.3', mappingType: 'related', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.9', targetFramework: 'ISO 27001', targetControlId: 'A.5.22', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.9', targetFramework: 'ISO 27001', targetControlId: 'A.8.15', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.9', targetFramework: 'ISO 27001', targetControlId: 'A.8.16', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.9', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.9', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.9', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.2', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.10', targetFramework: 'ISO 27001', targetControlId: 'A.5.10', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.10', targetFramework: 'ISO 42001', targetControlId: 'A.9.2', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.10', targetFramework: 'ISO 42001', targetControlId: 'A.9.3', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.11', targetFramework: 'ISO 27001', targetControlId: 'A.5.14', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.11', targetFramework: 'SOC 2 Type II', targetControlId: 'P6.6', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.11', targetFramework: 'SOC 2 Type II', targetControlId: 'P1.10', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.12', targetFramework: 'ISO 27001', targetControlId: 'A.5.31', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.12', targetFramework: 'ISO 42001', targetControlId: '4.2', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.13', targetFramework: 'ISO 42001', targetControlId: '4.4', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.13', targetFramework: 'ISO 42001', targetControlId: '10.2', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.13', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.9', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.13', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-7.1', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.15', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.8', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.15', targetFramework: 'ISO 27001', targetControlId: 'A.8.15', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.15', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.2', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.15', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.5', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.16', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-4.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.16', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-4.3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.16', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-4.5', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.16', targetFramework: 'ISO 42001', targetControlId: 'A.8.2', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.16', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MG-3.1', mappingType: 'related', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.17', targetFramework: 'ISO 42001', targetControlId: 'A.6.2.7', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.17', targetFramework: 'ISO 42001', targetControlId: 'A.8.2', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.17', targetFramework: 'ISO 42001', targetControlId: 'A.4.2', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.17', targetFramework: 'ISO 42001', targetControlId: 'A.10.2', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-E.17', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-3.4', mappingType: 'partial', confidence: 0.7 },
  // F. Society
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-F.1', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MP-5.2', mappingType: 'related', confidence: 0.8 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-F.1', targetFramework: 'ISO 42001', targetControlId: 'A.5.5', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-F.2', targetFramework: 'NIST AI 600-1', targetControlId: 'GAI-MP-5.2', mappingType: 'related', confidence: 0.85 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-F.2', targetFramework: 'ISO 42001', targetControlId: 'A.5.5', mappingType: 'partial', confidence: 0.6 },
  { sourceFramework: 'AIUC-1', sourceControlId: 'AIUC1-F.2', targetFramework: 'EU AI Act', targetControlId: 'EU-AI-ACT-5.3', mappingType: 'partial', confidence: 0.6 },

  // =============================================================================
  // India DPDPA (Act 2023) <-> GDPR / ISO 27701 / SOC 2 privacy criteria / ISO 27001
  // =============================================================================
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-1.3', targetFramework: 'GDPR', targetControlId: 'GDPR-30', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-1.5', targetFramework: 'GDPR', targetControlId: 'GDPR-24', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-1.5', targetFramework: 'GDPR', targetControlId: 'GDPR-5.2', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.1', targetFramework: 'GDPR', targetControlId: 'GDPR-6', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.3', targetFramework: 'GDPR', targetControlId: 'GDPR-13', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.3', targetFramework: 'GDPR', targetControlId: 'GDPR-12', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.6', targetFramework: 'GDPR', targetControlId: 'GDPR-7', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.7', targetFramework: 'GDPR', targetControlId: 'GDPR-7', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.8', targetFramework: 'GDPR', targetControlId: 'GDPR-7', mappingType: 'partial', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.1', targetFramework: 'GDPR', targetControlId: 'GDPR-28', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.2', targetFramework: 'GDPR', targetControlId: 'GDPR-5.1d', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.3', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.4', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.5', targetFramework: 'GDPR', targetControlId: 'GDPR-32', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.6', targetFramework: 'GDPR', targetControlId: 'GDPR-33', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.6', targetFramework: 'GDPR', targetControlId: 'GDPR-34', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.7', targetFramework: 'GDPR', targetControlId: 'GDPR-17', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.7', targetFramework: 'GDPR', targetControlId: 'GDPR-5.1e', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.8', targetFramework: 'GDPR', targetControlId: 'GDPR-5.1e', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.9', targetFramework: 'GDPR', targetControlId: 'GDPR-37', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.9', targetFramework: 'GDPR', targetControlId: 'GDPR-13', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.10', targetFramework: 'GDPR', targetControlId: 'GDPR-12', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-4.1', targetFramework: 'GDPR', targetControlId: 'GDPR-8', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-4.2', targetFramework: 'GDPR', targetControlId: 'GDPR-22', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-5.2', targetFramework: 'GDPR', targetControlId: 'GDPR-37', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-5.2', targetFramework: 'GDPR', targetControlId: 'GDPR-38', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-5.2', targetFramework: 'GDPR', targetControlId: 'GDPR-39', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-5.3', targetFramework: 'GDPR', targetControlId: 'GDPR-24', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-5.4', targetFramework: 'GDPR', targetControlId: 'GDPR-35', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-5.5', targetFramework: 'GDPR', targetControlId: 'GDPR-22', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.1', targetFramework: 'GDPR', targetControlId: 'GDPR-15', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.2', targetFramework: 'GDPR', targetControlId: 'GDPR-16', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.2', targetFramework: 'GDPR', targetControlId: 'GDPR-17', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.3', targetFramework: 'GDPR', targetControlId: 'GDPR-12', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.5', targetFramework: 'GDPR', targetControlId: 'GDPR-77', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-7.1', targetFramework: 'GDPR', targetControlId: 'GDPR-44', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-7.1', targetFramework: 'GDPR', targetControlId: 'GDPR-45', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-7.2', targetFramework: 'GDPR', targetControlId: 'GDPR-46', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-8.1', targetFramework: 'GDPR', targetControlId: 'GDPR-83', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-1.3', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.2.8', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.1', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.2.2', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.3', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.3.2', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.3', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.3.3', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.6', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.2.3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.7', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.3.4', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.8', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.2.4', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.1', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.2.6', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.2', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.4.3', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.5', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-6.9.3.1', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.7', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.4.7', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.7', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.4.8', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.8', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.4.7', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-5.2', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-6.3.1.1', mappingType: 'related', confidence: 0.6 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-5.4', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.2.5', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.1', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.3.6', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.1', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.3.8', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.2', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.3.6', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.3', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.3.9', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-7.1', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.5.1', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-7.1', targetFramework: 'ISO 27701', targetControlId: 'ISO27701-7.5.2', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.3', targetFramework: 'SOC 2 Type II', targetControlId: 'P1.1', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.6', targetFramework: 'SOC 2 Type II', targetControlId: 'P2.1', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-2.2', targetFramework: 'SOC 2 Type II', targetControlId: 'P3.1', mappingType: 'partial', confidence: 0.65 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.7', targetFramework: 'SOC 2 Type II', targetControlId: 'P4.3', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.8', targetFramework: 'SOC 2 Type II', targetControlId: 'P4.2', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P5.1', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-6.2', targetFramework: 'SOC 2 Type II', targetControlId: 'P5.2', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.1', targetFramework: 'SOC 2 Type II', targetControlId: 'P6.1', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.6', targetFramework: 'SOC 2 Type II', targetControlId: 'P6.6', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.2', targetFramework: 'SOC 2 Type II', targetControlId: 'P7.1', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.10', targetFramework: 'SOC 2 Type II', targetControlId: 'P8.1', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.19', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.20', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.34', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.15', mappingType: 'partial', confidence: 0.75 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.3', targetFramework: 'ISO 27001', targetControlId: 'A.8.11', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.3', targetFramework: 'ISO 27001', targetControlId: 'A.8.24', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.4', targetFramework: 'ISO 27001', targetControlId: 'A.8.15', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.4', targetFramework: 'ISO 27001', targetControlId: 'A.8.16', mappingType: 'equivalent', confidence: 0.8 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.5', targetFramework: 'ISO 27001', targetControlId: 'A.8.13', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.5', targetFramework: 'ISO 27001', targetControlId: 'A.5.30', mappingType: 'partial', confidence: 0.7 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.6', targetFramework: 'ISO 27001', targetControlId: 'A.5.24', mappingType: 'equivalent', confidence: 0.85 },
  { sourceFramework: 'India DPDPA', sourceControlId: 'IN-DPDPA-3.6', targetFramework: 'ISO 27001', targetControlId: 'A.5.26', mappingType: 'partial', confidence: 0.75 },
];

/**
 * Get all mappings for a specific framework
 */
export function getMappingsForFramework(frameworkType: string): ControlCrosswalkMapping[] {
  const normalizedType = normalizeFrameworkName(frameworkType);
  return CONTROL_CROSSWALK.filter(
    m => normalizeFrameworkName(m.sourceFramework) === normalizedType ||
         normalizeFrameworkName(m.targetFramework) === normalizedType
  );
}

/**
 * Get mappings between two specific frameworks
 */
export function getMappingsBetweenFrameworks(
  framework1: string,
  framework2: string
): ControlCrosswalkMapping[] {
  const norm1 = normalizeFrameworkName(framework1);
  const norm2 = normalizeFrameworkName(framework2);

  return CONTROL_CROSSWALK.filter(m => {
    const sourceNorm = normalizeFrameworkName(m.sourceFramework);
    const targetNorm = normalizeFrameworkName(m.targetFramework);
    return (sourceNorm === norm1 && targetNorm === norm2) ||
           (sourceNorm === norm2 && targetNorm === norm1);
  });
}

/**
 * Normalize framework name for comparison
 */
function normalizeFrameworkName(name: string): string {
  const normalized = name.toLowerCase().trim();

  // Handle common variations
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
    'iso27017': 'iso 27017',
    'iso 27017:2015': 'iso 27017',
    'iso-27017': 'iso 27017',
    'iso/iec 27017': 'iso 27017',
    'iso/iec 27017:2015': 'iso 27017',
    'iso 27017:2015 (withdrawn)': 'iso 27017',
    // ISO 27017:2026 normalizations — never collapse a 2026 spelling onto the 2015 'iso 27017'
    'iso/iec 27017:2026': 'iso 27017:2026',
    'iso27017:2026': 'iso 27017:2026',
    'iso 27017 2026': 'iso 27017:2026',
    'iso 27017 (2026)': 'iso 27017:2026',
    'iso-27017-2026': 'iso 27017:2026',
    'iso/iec 27017 edition 2': 'iso 27017:2026',
    // SOC 3 normalizations
    'aicpa soc 3': 'soc 3',
    'aicpa soc3': 'soc 3',
    'soc3': 'soc 3',
    'soc 3 type ii': 'soc 3',
    'soc 3 trust services report': 'soc 3',
    'soc for service organizations': 'soc 3',
    // ISO 42001 normalizations
    'iso/iec 42001': 'iso 42001',
    'iso/iec 42001:2023': 'iso 42001',
    'iso 42001:2023': 'iso 42001',
    'iso42001': 'iso 42001',
    'aims': 'iso 42001',
    'ai management system': 'iso 42001',
    // India DPDPA (Act 2023) and AIUC-1 normalizations — 'dpdpa' alone stays Delaware
    'pdpb': 'india dpdpa',
    'pdpb india': 'india dpdpa',
    'india privacy': 'india dpdpa',
    'dpdp': 'india dpdpa',
    'dpdp act': 'india dpdpa',
    'dpdpa india': 'india dpdpa',
    'digital personal data protection act': 'india dpdpa',
    'aiuc1': 'aiuc-1',
    'aiuc 1': 'aiuc-1',
    'aiuc': 'aiuc-1',
  };

  return aliases[normalized] || normalized;
}

/**
 * Find matching control in target framework based on control ID pattern
 */
export function findMappedControls(
  sourceFramework: string,
  sourceControlId: string,
  targetFramework: string
): ControlCrosswalkMapping[] {
  const sourceNorm = normalizeFrameworkName(sourceFramework);
  const targetNorm = normalizeFrameworkName(targetFramework);

  return CONTROL_CROSSWALK.filter(m => {
    const mSourceNorm = normalizeFrameworkName(m.sourceFramework);
    const mTargetNorm = normalizeFrameworkName(m.targetFramework);

    // Check direct match
    if (mSourceNorm === sourceNorm && mTargetNorm === targetNorm) {
      return m.sourceControlId === sourceControlId ||
             sourceControlId.includes(m.sourceControlId) ||
             m.sourceControlId.includes(sourceControlId);
    }

    // Check reverse match
    if (mSourceNorm === targetNorm && mTargetNorm === sourceNorm) {
      return m.targetControlId === sourceControlId ||
             sourceControlId.includes(m.targetControlId) ||
             m.targetControlId.includes(sourceControlId);
    }

    return false;
  });
}

export default {
  CONTROL_CROSSWALK,
  getMappingsForFramework,
  getMappingsBetweenFrameworks,
  findMappedControls,
};
