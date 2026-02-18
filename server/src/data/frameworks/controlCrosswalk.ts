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
 * - ISO 27017: ISO27017-CLD.6.3, ISO27017-CLD.9.5, etc.
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

  // Cloud-specific access control -> ISO 27001 Access Control
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.6.3', targetFramework: 'ISO 27001', targetControlId: 'A.5.15', mappingType: 'equivalent', confidence: 0.95 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.9.5', targetFramework: 'ISO 27001', targetControlId: 'A.5.16', mappingType: 'equivalent', confidence: 0.9 },

  // Asset management
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.8.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.9', mappingType: 'equivalent', confidence: 0.9 },

  // Cryptography
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.10.1', targetFramework: 'ISO 27001', targetControlId: 'A.8.24', mappingType: 'equivalent', confidence: 0.95 },

  // Operations security
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.12.1', targetFramework: 'ISO 27001', targetControlId: 'A.8.32', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.12.4', targetFramework: 'ISO 27001', targetControlId: 'A.8.2', mappingType: 'equivalent', confidence: 0.9 },

  // Incident management
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.16.1', targetFramework: 'ISO 27001', targetControlId: 'A.5.24', mappingType: 'equivalent', confidence: 0.95 },

  // =============================================================================
  // ISO 27017 <-> SOC 2 Mappings
  // =============================================================================

  // Access control
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.6.3', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.9.5', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.2', mappingType: 'equivalent', confidence: 0.85 },

  // Cryptography
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.10.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC6.7', mappingType: 'equivalent', confidence: 0.9 },

  // Logging and monitoring
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.12.4', targetFramework: 'SOC 2 Type II', targetControlId: 'CC4.1', mappingType: 'equivalent', confidence: 0.9 },

  // Change management
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.12.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC8.1', mappingType: 'equivalent', confidence: 0.9 },

  // Incident response
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.16.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC7.3', mappingType: 'equivalent', confidence: 0.9 },

  // Business continuity
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.17.1', targetFramework: 'SOC 2 Type II', targetControlId: 'CC9.1', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // ISO 27017 <-> NIST 800-53 Mappings
  // =============================================================================

  // Access control
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.6.3', targetFramework: 'NIST 800-53', targetControlId: 'AC-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.9.5', targetFramework: 'NIST 800-53', targetControlId: 'AC-2', mappingType: 'equivalent', confidence: 0.85 },

  // Cryptography
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.10.1', targetFramework: 'NIST 800-53', targetControlId: 'SC-8', mappingType: 'equivalent', confidence: 0.9 },

  // Configuration management
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.12.1', targetFramework: 'NIST 800-53', targetControlId: 'CM-3', mappingType: 'equivalent', confidence: 0.9 },

  // Audit
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.12.4', targetFramework: 'NIST 800-53', targetControlId: 'AU-1', mappingType: 'equivalent', confidence: 0.9 },

  // Incident response
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.16.1', targetFramework: 'NIST 800-53', targetControlId: 'IR-1', mappingType: 'equivalent', confidence: 0.9 },

  // Contingency planning
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.17.1', targetFramework: 'NIST 800-53', targetControlId: 'CP-1', mappingType: 'equivalent', confidence: 0.85 },

  // =============================================================================
  // ISO 27017 <-> FedRAMP Mappings (cloud-specific)
  // =============================================================================

  // Access control
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.6.3', targetFramework: 'FedRAMP', targetControlId: 'FR-AC-1', mappingType: 'equivalent', confidence: 0.9 },
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.9.5', targetFramework: 'FedRAMP', targetControlId: 'FR-AC-2', mappingType: 'equivalent', confidence: 0.85 },

  // Cryptography
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.10.1', targetFramework: 'FedRAMP', targetControlId: 'FR-SC-8', mappingType: 'equivalent', confidence: 0.9 },

  // Incident response
  { sourceFramework: 'ISO 27017', sourceControlId: 'ISO27017-CLD.16.1', targetFramework: 'FedRAMP', targetControlId: 'FR-IR-1', mappingType: 'equivalent', confidence: 0.9 },
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
