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

    await prisma.complianceFramework.update({
      where: { id: frameworkId },
      data: { progress },
    });

    // Audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          action: `Template Applied: ${frameworkType} (${applied} controls added, ${skipped} skipped)`,
          userId,
          organizationId,
          hash: `template-${frameworkId}-${Date.now()}`,
        },
      });
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
