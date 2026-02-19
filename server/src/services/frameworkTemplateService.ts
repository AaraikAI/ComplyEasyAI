/**
 * Framework Template Service
 *
 * Loads pre-built compliance control templates for major frameworks
 * and applies them to organization frameworks in the database.
 */
import prisma from '../config/database';
import logger from '../config/logger';
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
import { CONTROL_CROSSWALK, findMappedControls, getMappingsBetweenFrameworks } from '../data/frameworks/controlCrosswalk';
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
};

// Also support alternate name lookups
const FRAMEWORK_ALIASES: Record<string, string> = {
  'SOC2': 'SOC 2 Type II',
  'SOC 2': 'SOC 2 Type II',
  'soc2': 'SOC 2 Type II',
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
      throw new Error('Framework not found or does not belong to this organization');
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
      const match = control.name.match(/^([A-Za-z0-9.\-]+):/);
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
      throw new Error('Framework not found');
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
