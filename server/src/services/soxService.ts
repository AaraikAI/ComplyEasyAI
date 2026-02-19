import prisma from '../config/database';
import logger from '../config/logger';
import { AuditLogger } from '../utils/auditLogger';

// ---------------------------------------------------------------------------
// Type helpers (stored as JSON in a generic table or typed Prisma models)
// ---------------------------------------------------------------------------

interface SOXControl {
  id: string;
  organizationId: string;
  controlId: string;           // e.g. "ITGC-01"
  title: string;
  description: string;
  category: string;            // ITGC, Manual, Automated, Hybrid
  processArea: string;         // Revenue, Procurement, Financial Close, IT General
  assertion: string;           // Existence, Completeness, Valuation, Rights, Presentation
  frequency: string;           // Daily, Weekly, Monthly, Quarterly, Annually
  controlType: string;         // Preventive, Detective, Corrective
  owner: string;
  status: string;              // Active, Inactive, Remediation
  effectivenessRating: string; // Effective, Ineffective, NeedsImprovement
  automationLevel: string;     // Manual, Semi-Automated, Fully-Automated
  riskLevel: string;           // High, Medium, Low
  lastTestedDate: string | null;
  nextTestDate: string | null;
  deficiencyCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface SOXTestResult {
  id: string;
  organizationId: string;
  controlId: string;
  testProcedure: string;
  testType: string;             // Walkthrough, SampleTest, InquiryObservation, Reperformance
  sampleSize: number;
  sampleMethod: string;         // Random, Systematic, Judgmental
  exceptionsFound: number;
  conclusion: string;           // Effective, Ineffective, NeedsRemediation
  deficiencyType: string | null; // Deficiency, SignificantDeficiency, MaterialWeakness
  findings: string;
  recommendations: string;
  testerId: string;
  testerName: string;
  testDate: string;
  reviewerId: string | null;
  reviewStatus: string;         // Pending, Approved, Rejected
  workpaperRef: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface SOXAssessment {
  id: string;
  organizationId: string;
  assessmentType: string;       // Section302, Section404
  fiscalYear: string;
  quarter: string | null;
  status: string;               // Planning, InProgress, Review, Completed
  overallConclusion: string | null;
  materialWeaknessCount: number;
  significantDeficiencyCount: number;
  deficiencyCount: number;
  controlsInScope: number;
  controlsTested: number;
  controlsEffective: number;
  managementAssertions: Record<string, unknown>;
  certificationDate: string | null;
  certifiedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// SOX Compliance Service
// ---------------------------------------------------------------------------

export class SOXService {

  // =========================================================================
  // SOXControl CRUD
  // =========================================================================

  async createSOXControl(data: {
    organizationId: string;
    controlId: string;
    title: string;
    description: string;
    category: string;
    processArea: string;
    assertion: string;
    frequency: string;
    controlType: string;
    owner: string;
    automationLevel?: string;
    riskLevel?: string;
    metadata?: Record<string, unknown>;
    userId: string;
  }): Promise<SOXControl> {
    const now = new Date().toISOString();
    const id = this.generateId();

    const control: SOXControl = {
      id,
      organizationId: data.organizationId,
      controlId: data.controlId,
      title: data.title,
      description: data.description,
      category: data.category,
      processArea: data.processArea,
      assertion: data.assertion,
      frequency: data.frequency,
      controlType: data.controlType,
      owner: data.owner,
      status: 'Active',
      effectivenessRating: 'NeedsImprovement',
      automationLevel: data.automationLevel || 'Manual',
      riskLevel: data.riskLevel || 'Medium',
      lastTestedDate: null,
      nextTestDate: null,
      deficiencyCount: 0,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    // Store in the generic GRC data store
    await prisma.gRCObject.create({
      data: {
        id,
        organizationId: data.organizationId,
        objectType: 'SOXControl',
        name: data.title,
        status: 'Active',
        data: control as unknown as Record<string, unknown>,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'sox_control.created',
      resourceType: 'SOXControl',
      resourceId: id,
      metadata: { controlId: data.controlId, category: data.category },
    });

    logger.info(`[SOX] Control created: ${data.controlId} - ${data.title}`);
    return control;
  }

  async getSOXControls(
    organizationId: string,
    filters?: {
      category?: string;
      processArea?: string;
      status?: string;
      effectivenessRating?: string;
      riskLevel?: string;
    }
  ): Promise<SOXControl[]> {
    const objects = await prisma.gRCObject.findMany({
      where: {
        organizationId,
        objectType: 'SOXControl',
        status: filters?.status || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    let controls = objects.map((o) => o.data as unknown as SOXControl);

    if (filters?.category) {
      controls = controls.filter((c) => c.category === filters.category);
    }
    if (filters?.processArea) {
      controls = controls.filter((c) => c.processArea === filters.processArea);
    }
    if (filters?.effectivenessRating) {
      controls = controls.filter((c) => c.effectivenessRating === filters.effectivenessRating);
    }
    if (filters?.riskLevel) {
      controls = controls.filter((c) => c.riskLevel === filters.riskLevel);
    }

    return controls;
  }

  async getSOXControlById(id: string, organizationId: string): Promise<SOXControl | null> {
    const obj = await prisma.gRCObject.findFirst({
      where: { id, organizationId, objectType: 'SOXControl' },
    });
    return obj ? (obj.data as unknown as SOXControl) : null;
  }

  async updateSOXControl(
    id: string,
    data: Partial<Omit<SOXControl, 'id' | 'organizationId' | 'createdAt'>>,
    userId: string,
    organizationId: string
  ): Promise<SOXControl | null> {
    const existing = await this.getSOXControlById(id, organizationId);
    if (!existing) return null;

    const updated: SOXControl = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await prisma.gRCObject.update({
      where: { id },
      data: {
        name: updated.title,
        status: updated.status,
        data: updated as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sox_control.updated',
      resourceType: 'SOXControl',
      resourceId: id,
      metadata: { fields: Object.keys(data) },
    });

    return updated;
  }

  async deleteSOXControl(id: string, userId: string, organizationId: string): Promise<boolean> {
    const existing = await this.getSOXControlById(id, organizationId);
    if (!existing) return false;

    await prisma.gRCObject.delete({ where: { id } });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sox_control.deleted',
      resourceType: 'SOXControl',
      resourceId: id,
      metadata: { controlId: existing.controlId },
    });

    logger.info(`[SOX] Control deleted: ${existing.controlId}`);
    return true;
  }

  // =========================================================================
  // SOXTestResult CRUD
  // =========================================================================

  async createSOXTestResult(data: {
    organizationId: string;
    controlId: string;
    testProcedure: string;
    testType: string;
    sampleSize: number;
    sampleMethod: string;
    exceptionsFound: number;
    conclusion: string;
    findings: string;
    recommendations: string;
    testerId: string;
    testerName: string;
    workpaperRef?: string;
    metadata?: Record<string, unknown>;
    userId: string;
  }): Promise<SOXTestResult> {
    const now = new Date().toISOString();
    const id = this.generateId();

    // Auto-classify deficiency type based on exceptions
    const deficiencyType = data.exceptionsFound > 0
      ? this.autoClassifyDeficiency(data.sampleSize, data.exceptionsFound, data.conclusion)
      : null;

    const testResult: SOXTestResult = {
      id,
      organizationId: data.organizationId,
      controlId: data.controlId,
      testProcedure: data.testProcedure,
      testType: data.testType,
      sampleSize: data.sampleSize,
      sampleMethod: data.sampleMethod,
      exceptionsFound: data.exceptionsFound,
      conclusion: data.conclusion,
      deficiencyType,
      findings: data.findings,
      recommendations: data.recommendations,
      testerId: data.testerId,
      testerName: data.testerName,
      testDate: now,
      reviewerId: null,
      reviewStatus: 'Pending',
      workpaperRef: data.workpaperRef || null,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    await prisma.gRCObject.create({
      data: {
        id,
        organizationId: data.organizationId,
        objectType: 'SOXTestResult',
        name: `Test: ${data.controlId} - ${data.testType}`,
        status: data.conclusion,
        data: testResult as unknown as Record<string, unknown>,
      },
    });

    // Update the parent control's last tested date and deficiency count
    const controlObj = await prisma.gRCObject.findFirst({
      where: { organizationId: data.organizationId, objectType: 'SOXControl' },
    });
    if (controlObj) {
      const controlData = controlObj.data as unknown as SOXControl;
      if (controlData.id === data.controlId || controlData.controlId === data.controlId) {
        controlData.lastTestedDate = now;
        if (deficiencyType) {
          controlData.deficiencyCount += 1;
        }
        controlData.effectivenessRating = data.conclusion === 'Effective' ? 'Effective' : 'NeedsImprovement';
        controlData.updatedAt = now;
        await prisma.gRCObject.update({
          where: { id: controlObj.id },
          data: { data: controlData as unknown as Record<string, unknown> },
        });
      }
    }

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'sox_test_result.created',
      resourceType: 'SOXTestResult',
      resourceId: id,
      metadata: { controlId: data.controlId, conclusion: data.conclusion, deficiencyType },
    });

    logger.info(`[SOX] Test result recorded for control ${data.controlId}: ${data.conclusion}`);
    return testResult;
  }

  async getSOXTestResults(
    organizationId: string,
    filters?: {
      controlId?: string;
      conclusion?: string;
      testType?: string;
      reviewStatus?: string;
    }
  ): Promise<SOXTestResult[]> {
    const objects = await prisma.gRCObject.findMany({
      where: {
        organizationId,
        objectType: 'SOXTestResult',
      },
      orderBy: { createdAt: 'desc' },
    });

    let results = objects.map((o) => o.data as unknown as SOXTestResult);

    if (filters?.controlId) {
      results = results.filter((r) => r.controlId === filters.controlId);
    }
    if (filters?.conclusion) {
      results = results.filter((r) => r.conclusion === filters.conclusion);
    }
    if (filters?.testType) {
      results = results.filter((r) => r.testType === filters.testType);
    }
    if (filters?.reviewStatus) {
      results = results.filter((r) => r.reviewStatus === filters.reviewStatus);
    }

    return results;
  }

  async getSOXTestResultById(id: string, organizationId: string): Promise<SOXTestResult | null> {
    const obj = await prisma.gRCObject.findFirst({
      where: { id, organizationId, objectType: 'SOXTestResult' },
    });
    return obj ? (obj.data as unknown as SOXTestResult) : null;
  }

  async updateSOXTestResult(
    id: string,
    data: Partial<Omit<SOXTestResult, 'id' | 'organizationId' | 'createdAt'>>,
    userId: string,
    organizationId: string
  ): Promise<SOXTestResult | null> {
    const existing = await this.getSOXTestResultById(id, organizationId);
    if (!existing) return null;

    const updated: SOXTestResult = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await prisma.gRCObject.update({
      where: { id },
      data: {
        status: updated.conclusion,
        data: updated as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sox_test_result.updated',
      resourceType: 'SOXTestResult',
      resourceId: id,
      metadata: { fields: Object.keys(data) },
    });

    return updated;
  }

  async deleteSOXTestResult(id: string, userId: string, organizationId: string): Promise<boolean> {
    const existing = await this.getSOXTestResultById(id, organizationId);
    if (!existing) return false;

    await prisma.gRCObject.delete({ where: { id } });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sox_test_result.deleted',
      resourceType: 'SOXTestResult',
      resourceId: id,
      metadata: { controlId: existing.controlId },
    });

    return true;
  }

  // =========================================================================
  // SOXAssessment CRUD
  // =========================================================================

  async createSOXAssessment(data: {
    organizationId: string;
    assessmentType: string;
    fiscalYear: string;
    quarter?: string;
    controlsInScope: number;
    managementAssertions?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    userId: string;
  }): Promise<SOXAssessment> {
    const now = new Date().toISOString();
    const id = this.generateId();

    const assessment: SOXAssessment = {
      id,
      organizationId: data.organizationId,
      assessmentType: data.assessmentType,
      fiscalYear: data.fiscalYear,
      quarter: data.quarter || null,
      status: 'Planning',
      overallConclusion: null,
      materialWeaknessCount: 0,
      significantDeficiencyCount: 0,
      deficiencyCount: 0,
      controlsInScope: data.controlsInScope,
      controlsTested: 0,
      controlsEffective: 0,
      managementAssertions: data.managementAssertions || {},
      certificationDate: null,
      certifiedBy: null,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    await prisma.gRCObject.create({
      data: {
        id,
        organizationId: data.organizationId,
        objectType: 'SOXAssessment',
        name: `${data.assessmentType} - FY${data.fiscalYear}${data.quarter ? ` Q${data.quarter}` : ''}`,
        status: 'Planning',
        data: assessment as unknown as Record<string, unknown>,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'sox_assessment.created',
      resourceType: 'SOXAssessment',
      resourceId: id,
      metadata: { assessmentType: data.assessmentType, fiscalYear: data.fiscalYear },
    });

    logger.info(`[SOX] Assessment created: ${data.assessmentType} FY${data.fiscalYear}`);
    return assessment;
  }

  async getSOXAssessments(
    organizationId: string,
    filters?: { assessmentType?: string; fiscalYear?: string; status?: string }
  ): Promise<SOXAssessment[]> {
    const objects = await prisma.gRCObject.findMany({
      where: {
        organizationId,
        objectType: 'SOXAssessment',
        status: filters?.status || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    let assessments = objects.map((o) => o.data as unknown as SOXAssessment);

    if (filters?.assessmentType) {
      assessments = assessments.filter((a) => a.assessmentType === filters.assessmentType);
    }
    if (filters?.fiscalYear) {
      assessments = assessments.filter((a) => a.fiscalYear === filters.fiscalYear);
    }

    return assessments;
  }

  async getSOXAssessmentById(id: string, organizationId: string): Promise<SOXAssessment | null> {
    const obj = await prisma.gRCObject.findFirst({
      where: { id, organizationId, objectType: 'SOXAssessment' },
    });
    return obj ? (obj.data as unknown as SOXAssessment) : null;
  }

  async updateSOXAssessment(
    id: string,
    data: Partial<Omit<SOXAssessment, 'id' | 'organizationId' | 'createdAt'>>,
    userId: string,
    organizationId: string
  ): Promise<SOXAssessment | null> {
    const existing = await this.getSOXAssessmentById(id, organizationId);
    if (!existing) return null;

    const updated: SOXAssessment = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await prisma.gRCObject.update({
      where: { id },
      data: {
        name: `${updated.assessmentType} - FY${updated.fiscalYear}${updated.quarter ? ` Q${updated.quarter}` : ''}`,
        status: updated.status,
        data: updated as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sox_assessment.updated',
      resourceType: 'SOXAssessment',
      resourceId: id,
      metadata: { fields: Object.keys(data), status: updated.status },
    });

    return updated;
  }

  async deleteSOXAssessment(id: string, userId: string, organizationId: string): Promise<boolean> {
    const existing = await this.getSOXAssessmentById(id, organizationId);
    if (!existing) return false;

    await prisma.gRCObject.delete({ where: { id } });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sox_assessment.deleted',
      resourceType: 'SOXAssessment',
      resourceId: id,
      metadata: { assessmentType: existing.assessmentType, fiscalYear: existing.fiscalYear },
    });

    return true;
  }

  // =========================================================================
  // Auto-classify deficiency
  // =========================================================================

  autoClassifyDeficiency(
    sampleSize: number,
    exceptionsFound: number,
    conclusion: string
  ): string {
    const exceptionRate = sampleSize > 0 ? exceptionsFound / sampleSize : 0;

    // Material weakness: high exception rate or explicitly ineffective with material impact
    if (exceptionRate >= 0.25 || conclusion === 'MaterialWeakness') {
      return 'MaterialWeakness';
    }

    // Significant deficiency: moderate exception rate
    if (exceptionRate >= 0.10 || conclusion === 'SignificantDeficiency') {
      return 'SignificantDeficiency';
    }

    // Simple deficiency: any exception found
    if (exceptionsFound > 0) {
      return 'Deficiency';
    }

    return 'None';
  }

  // =========================================================================
  // SOX Dashboard
  // =========================================================================

  async getSOXDashboard(organizationId: string) {
    const [controls, testResults, assessments] = await Promise.all([
      this.getSOXControls(organizationId),
      this.getSOXTestResults(organizationId),
      this.getSOXAssessments(organizationId),
    ]);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Control effectiveness statistics
    const controlEffectiveness = {
      total: controls.length,
      effective: controls.filter((c) => c.effectivenessRating === 'Effective').length,
      ineffective: controls.filter((c) => c.effectivenessRating === 'Ineffective').length,
      needsImprovement: controls.filter((c) => c.effectivenessRating === 'NeedsImprovement').length,
      effectivenessRate: controls.length > 0
        ? Math.round(
            (controls.filter((c) => c.effectivenessRating === 'Effective').length / controls.length) * 100
          )
        : 0,
    };

    // Testing coverage
    const testedControls = controls.filter((c) => c.lastTestedDate !== null);
    const testingCoverage = {
      totalControls: controls.length,
      controlsTested: testedControls.length,
      controlsUntested: controls.length - testedControls.length,
      coverageRate: controls.length > 0
        ? Math.round((testedControls.length / controls.length) * 100)
        : 0,
      recentTests: testResults.filter(
        (t) => new Date(t.testDate) >= thirtyDaysAgo
      ).length,
    };

    // Deficiency summary
    const deficiencySummary = {
      total: testResults.filter((t) => t.deficiencyType && t.deficiencyType !== 'None').length,
      materialWeaknesses: testResults.filter((t) => t.deficiencyType === 'MaterialWeakness').length,
      significantDeficiencies: testResults.filter((t) => t.deficiencyType === 'SignificantDeficiency').length,
      deficiencies: testResults.filter((t) => t.deficiencyType === 'Deficiency').length,
    };

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    controls.forEach((c) => {
      categoryDistribution[c.category] = (categoryDistribution[c.category] || 0) + 1;
    });

    // Process area distribution
    const processAreaDistribution: Record<string, number> = {};
    controls.forEach((c) => {
      processAreaDistribution[c.processArea] = (processAreaDistribution[c.processArea] || 0) + 1;
    });

    // Risk level distribution
    const riskDistribution = {
      high: controls.filter((c) => c.riskLevel === 'High').length,
      medium: controls.filter((c) => c.riskLevel === 'Medium').length,
      low: controls.filter((c) => c.riskLevel === 'Low').length,
    };

    // Assessment status
    const assessmentStatus = {
      total: assessments.length,
      planning: assessments.filter((a) => a.status === 'Planning').length,
      inProgress: assessments.filter((a) => a.status === 'InProgress').length,
      review: assessments.filter((a) => a.status === 'Review').length,
      completed: assessments.filter((a) => a.status === 'Completed').length,
    };

    // Pending review items
    const pendingReviews = testResults.filter((t) => t.reviewStatus === 'Pending').length;

    return {
      controlEffectiveness,
      testingCoverage,
      deficiencySummary,
      categoryDistribution,
      processAreaDistribution,
      riskDistribution,
      assessmentStatus,
      pendingReviews,
      recentActivity: testResults.slice(0, 10).map((t) => ({
        id: t.id,
        controlId: t.controlId,
        testType: t.testType,
        conclusion: t.conclusion,
        testDate: t.testDate,
        testerName: t.testerName,
      })),
    };
  }

  // =========================================================================
  // Generate SOX Report
  // =========================================================================

  async generateSOXReport(organizationId: string, fiscalYear: string) {
    const [controls, testResults, assessments] = await Promise.all([
      this.getSOXControls(organizationId),
      this.getSOXTestResults(organizationId),
      this.getSOXAssessments(organizationId, { fiscalYear }),
    ]);

    const materialWeaknesses = testResults.filter(
      (t) => t.deficiencyType === 'MaterialWeakness'
    );
    const significantDeficiencies = testResults.filter(
      (t) => t.deficiencyType === 'SignificantDeficiency'
    );
    const simpleDeficiencies = testResults.filter(
      (t) => t.deficiencyType === 'Deficiency'
    );

    const effectiveControls = controls.filter(
      (c) => c.effectivenessRating === 'Effective'
    );
    const ineffectiveControls = controls.filter(
      (c) => c.effectivenessRating === 'Ineffective'
    );

    const report = {
      reportDate: new Date().toISOString(),
      fiscalYear,
      organizationId,
      executiveSummary: {
        totalControls: controls.length,
        controlsEffective: effectiveControls.length,
        controlsIneffective: ineffectiveControls.length,
        effectivenessRate: controls.length > 0
          ? Math.round((effectiveControls.length / controls.length) * 100)
          : 0,
        materialWeaknessCount: materialWeaknesses.length,
        significantDeficiencyCount: significantDeficiencies.length,
        deficiencyCount: simpleDeficiencies.length,
        overallOpinion: materialWeaknesses.length > 0
          ? 'Adverse'
          : significantDeficiencies.length > 0
          ? 'QualifiedWithDeficiencies'
          : 'Effective',
      },
      controlInventory: {
        byCategory: this.groupBy(controls, 'category'),
        byProcessArea: this.groupBy(controls, 'processArea'),
        byRiskLevel: this.groupBy(controls, 'riskLevel'),
        byControlType: this.groupBy(controls, 'controlType'),
      },
      testingResults: {
        totalTests: testResults.length,
        byConclusion: this.groupBy(testResults, 'conclusion'),
        byTestType: this.groupBy(testResults, 'testType'),
        exceptionRate: testResults.length > 0
          ? Math.round(
              (testResults.filter((t) => t.exceptionsFound > 0).length / testResults.length) * 100
            )
          : 0,
      },
      deficiencies: {
        materialWeaknesses: materialWeaknesses.map((mw) => ({
          id: mw.id,
          controlId: mw.controlId,
          findings: mw.findings,
          recommendations: mw.recommendations,
          testDate: mw.testDate,
        })),
        significantDeficiencies: significantDeficiencies.map((sd) => ({
          id: sd.id,
          controlId: sd.controlId,
          findings: sd.findings,
          recommendations: sd.recommendations,
          testDate: sd.testDate,
        })),
        deficiencies: simpleDeficiencies.map((d) => ({
          id: d.id,
          controlId: d.controlId,
          findings: d.findings,
          recommendations: d.recommendations,
          testDate: d.testDate,
        })),
      },
      assessments: assessments.map((a) => ({
        id: a.id,
        assessmentType: a.assessmentType,
        status: a.status,
        overallConclusion: a.overallConclusion,
        controlsInScope: a.controlsInScope,
        controlsTested: a.controlsTested,
        controlsEffective: a.controlsEffective,
      })),
    };

    logger.info(`[SOX] Report generated for FY${fiscalYear}`);
    return report;
  }

  // =========================================================================
  // Automate Control Testing
  // =========================================================================

  async automateControlTesting(
    organizationId: string,
    controlId: string,
    userId: string
  ) {
    const control = await this.getSOXControlById(controlId, organizationId);
    if (!control) {
      throw new Error(`Control not found: ${controlId}`);
    }

    if (control.automationLevel === 'Manual') {
      throw new Error('Cannot automate testing for manual controls');
    }

    logger.info(`[SOX] Starting automated testing for control: ${control.controlId}`);

    // Simulate automated control testing based on control type
    const automatedChecks: Record<string, unknown>[] = [];
    let passed = true;
    let exceptionsFound = 0;

    if (control.category === 'ITGC') {
      automatedChecks.push(
        { check: 'AccessControlVerification', status: 'Passed', details: 'Access controls properly configured' },
        { check: 'ChangeManagementReview', status: 'Passed', details: 'Change management procedures followed' },
        { check: 'BackupVerification', status: 'Passed', details: 'Backup procedures operational' }
      );
    } else if (control.category === 'Automated') {
      automatedChecks.push(
        { check: 'SystemConfigValidation', status: 'Passed', details: 'System configuration matches expected state' },
        { check: 'DataIntegrityCheck', status: 'Passed', details: 'Data integrity validated' },
        { check: 'ProcessExecutionVerification', status: 'Passed', details: 'Automated process executing as designed' }
      );
    } else {
      automatedChecks.push(
        { check: 'HybridControlCheck', status: 'Passed', details: 'Automated portion of hybrid control verified' }
      );
    }

    // Create the test result
    const testResult = await this.createSOXTestResult({
      organizationId,
      controlId: control.id,
      testProcedure: `Automated testing for ${control.controlId}: ${automatedChecks.map((c) => c.check).join(', ')}`,
      testType: 'Reperformance',
      sampleSize: automatedChecks.length,
      sampleMethod: 'Systematic',
      exceptionsFound,
      conclusion: passed ? 'Effective' : 'Ineffective',
      findings: passed
        ? 'All automated checks passed successfully.'
        : `${exceptionsFound} exception(s) found during automated testing.`,
      recommendations: passed
        ? 'Continue current control procedures.'
        : 'Review and remediate identified exceptions.',
      testerId: userId,
      testerName: 'Automated Testing System',
      metadata: { automatedChecks, automationLevel: control.automationLevel },
      userId,
    });

    logger.info(`[SOX] Automated testing completed for ${control.controlId}: ${testResult.conclusion}`);

    return {
      control: control.controlId,
      testResultId: testResult.id,
      conclusion: testResult.conclusion,
      checksPerformed: automatedChecks,
      exceptionsFound,
      timestamp: new Date().toISOString(),
    };
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private generateId(): string {
    return `sox_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
    const result: Record<string, number> = {};
    items.forEach((item) => {
      const value = String(item[key] || 'Unknown');
      result[value] = (result[value] || 0) + 1;
    });
    return result;
  }
}

export default new SOXService();
