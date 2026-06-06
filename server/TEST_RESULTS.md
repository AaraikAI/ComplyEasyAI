# Test Results Report

**Generated:** 2026-02-26
**Project:** ComplyEasyAI Server

> **Status note (added 2026-06-06):** This is a **point-in-time snapshot from 2026-02-26**, not a current
> production-readiness gate. The failures recorded below are dominated by test-code rot — mocks and
> assertions lagging legitimate source hardening, plus Supabase connection-pool exhaustion under
> parallel jest workers — rather than production defects (see `.claude/CLAUDE.md`, "Real production bugs
> surfaced by the full server test suite"). The handful of genuine production bugs this run masked were
> subsequently identified and fixed. Do **not** treat the metrics in this snapshot as the live suite
> health; regenerate this report once the suite is brought green so it cannot mask a real regression.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Test Suites** | 177 |
| **Passed Suites** | 121 ✅ |
| **Failed Suites** | 56 ❌ |
| **Suite Pass Rate** | 68.36% |
| **Total Tests** | 5124 |
| **Passed Tests** | 4383 ✅ |
| **Failed Tests** | 741 ❌ |
| **Test Pass Rate** | **85.54%** |
| **Total Duration** | ~20 minutes |

---

## Results by Category

### Unit Tests

| Metric | Value |
|--------|-------|
| Test Suites | 131 (117 passed, 14 failed) |
| Tests Passed | 2650 |
| Tests Failed | 193 |
| Pass Rate | 93.2% |

<details>
<summary>📋 View all 131 test suites</summary>

| Suite | Status | Passed | Failed | Duration |
|-------|:------:|-------:|-------:|---------:|
| unit/services/advanced/blockchainService.test.ts | ✅ | 8 | 0 | 0.06s |
| unit/services/visionaryAIService.test.ts | ✅ | 3 | 0 | 0.50s |
| unit/services/advanced/byokService.test.ts | ✅ | 28 | 0 | 0.14s |
| unit/services/issueManagementService.test.ts | ✅ | 12 | 0 | 0.06s |
| unit/services/twoFactorService.test.ts | ✅ | 13 | 0 | 0.25s |
| unit/services/stripeService.test.ts | ❌ | 45 | 5 | 0.21s |
| unit/services/geminiService.test.ts | ✅ | 13 | 0 | 0.07s |
| unit/services/vendorRiskService.test.ts | ✅ | 16 | 0 | 0.07s |
| unit/services/advanced/homomorphicAIService.test.ts | ✅ | 8 | 0 | 0.04s |
| unit/controllers/frameworksController.test.ts | ❌ | 35 | 6 | 0.14s |
| unit/services/advanced/complianceAsCodeService.test.ts | ✅ | 28 | 0 | 0.09s |
| unit/services/s3Service.test.ts | ✅ | 8 | 0 | 0.05s |
| unit/services/integrations/slackService.test.ts | ✅ | 2 | 0 | 0.03s |
| unit/services/advanced/jitAccessService.test.ts | ✅ | 7 | 0 | 0.05s |
| unit/services/emailService.test.ts | ✅ | 10 | 0 | 0.04s |
| unit/controllers/risksController.test.ts | ❌ | 38 | 1 | 0.10s |
| unit/controllers/integrationsController.test.ts | ✅ | 4 | 0 | 0.84s |
| unit/services/multiWorkspaceService.test.ts | ✅ | 4 | 0 | 0.04s |
| unit/services/personnelService.test.ts | ✅ | 6 | 0 | 0.04s |
| unit/services/reportingService.test.ts | ✅ | 3 | 0 | 0.03s |
| unit/services/riskManagementService.test.ts | ✅ | 11 | 0 | 0.04s |
| unit/services/integrations/githubService.test.ts | ✅ | 1 | 0 | 0.05s |
| unit/controllers/aiController.test.ts | ✅ | 6 | 0 | 0.05s |
| unit/services/websocketService.test.ts | ✅ | 3 | 0 | 0.03s |
| unit/services/policyLibraryService.test.ts | ✅ | 4 | 0 | 0.03s |
| unit/services/integrations/googleService.test.ts | ✅ | 1 | 0 | 0.04s |
| unit/controllers/authController.test.ts | ❌ | 73 | 13 | 0.21s |
| unit/services/monitoringService.test.ts | ✅ | 9 | 0 | 0.35s |
| unit/services/integrations/jiraService.test.ts | ✅ | 4 | 0 | 0.04s |
| unit/services/integrations/awsService.test.ts | ✅ | 3 | 0 | 0.04s |
| unit/services/trustCenterService.test.ts | ✅ | 3 | 0 | 0.03s |
| unit/services/doraService.test.ts | ❌ | 51 | 4 | 0.16s |
| unit/services/mdmService.test.ts | ✅ | 74 | 0 | 0.17s |
| unit/services/aiRmfService.test.ts | ✅ | 53 | 0 | 0.15s |
| unit/services/sodService.test.ts | ❌ | 6 | 48 | 0.27s |
| unit/services/auditorService.test.ts | ❌ | 56 | 1 | 0.28s |
| unit/services/soxService.test.ts | ❌ | 6 | 44 | 0.32s |
| unit/services/tierService.test.ts | ✅ | 48 | 0 | 0.20s |
| unit/controllers/aiRmfController.test.ts | ✅ | 62 | 0 | 0.19s |
| unit/services/advanced/physicalAIService.test.ts | ✅ | 68 | 0 | 0.31s |
| unit/middleware/tierMiddleware.test.ts | ✅ | 51 | 0 | 0.17s |
| unit/config/tiers.test.ts | ✅ | 105 | 0 | 0.55s |
| unit/controllers/demoController.test.ts | ✅ | 41 | 0 | 0.58s |
| unit/config/index.test.ts | ❌ | 60 | 1 | 0.60s |
| unit/controllers/onboardingController.test.ts | ✅ | 38 | 0 | 0.11s |
| unit/services/euRegulations/dsaService.test.ts | ❌ | 40 | 1 | 0.12s |
| unit/services/advanced/webrtcSignalingService.test.ts | ❌ | 4 | 47 | 0.33s |
| unit/services/euRegulations/euAiActService.test.ts | ✅ | 39 | 0 | 0.09s |
| unit/utils/logSanitizer.test.ts | ✅ | 83 | 0 | 0.17s |
| unit/controllers/euRegulationsController.test.ts | ✅ | 45 | 0 | 0.14s |
| unit/services/advanced/ldapPermissionService.test.ts | ✅ | 0 | 0 | 0.00s |
| unit/services/advanced/regulatoryIntelligenceFabricService.test.ts | ✅ | 37 | 0 | 0.15s |
| unit/services/advanced/livenessDetectionService.test.ts | ✅ | 0 | 0 | 0.00s |
| unit/services/advanced/graphNeuralNetworkService.test.ts | ❌ | 13 | 19 | 0.16s |
| unit/services/advanced/zeroTrustService.test.ts | ✅ | 27 | 0 | 0.14s |
| unit/controllers/acosController.test.ts | ✅ | 28 | 0 | 0.09s |
| unit/config/features.test.ts | ✅ | 53 | 0 | 0.09s |
| unit/services/euRegulations/dmaService.test.ts | ✅ | 28 | 0 | 0.07s |
| unit/middleware/monitoring.test.ts | ✅ | 31 | 0 | 0.06s |
| unit/controllers/controlMappingsController.test.ts | ✅ | 24 | 0 | 0.07s |
| unit/services/integrations/patValidationService.test.ts | ✅ | 42 | 0 | 0.07s |
| unit/services/featureService.test.ts | ✅ | 26 | 0 | 0.06s |
| unit/controllers/evidenceVersioningController.test.ts | ✅ | 22 | 0 | 0.06s |
| unit/services/secureChatService.test.ts | ✅ | 23 | 0 | 0.07s |
| unit/middleware/auth.test.ts | ✅ | 24 | 0 | 0.10s |
| unit/services/advanced/deepfakeDetectionService.test.ts | ✅ | 0 | 0 | 0.00s |
| unit/services/advanced/vrCollaborativeReviewService.test.ts | ✅ | 28 | 0 | 0.18s |
| unit/services/webhookService.test.ts | ✅ | 29 | 0 | 0.08s |
| unit/services/integrations/azureService.test.ts | ✅ | 20 | 0 | 0.06s |
| unit/services/advanced/multimodalIntakeService.test.ts | ✅ | 25 | 0 | 0.35s |
| unit/services/sessionManagementService.test.ts | ✅ | 24 | 0 | 0.12s |
| unit/services/advanced/federatedSwarmService.test.ts | ✅ | 33 | 0 | 0.13s |
| unit/services/frameworkTemplateService.test.ts | ❌ | 29 | 2 | 0.24s |
| unit/services/advanced/complianceDigitalTwinService.test.ts | ✅ | 30 | 0 | 0.14s |
| unit/config/performanceMonitoring.test.ts | ✅ | 22 | 0 | 0.10s |
| unit/controllers/auditController.test.ts | ✅ | 19 | 0 | 0.06s |
| unit/services/advanced/neuroSymbolicAIService.test.ts | ✅ | 23 | 0 | 0.09s |
| unit/controllers/organizationController.test.ts | ✅ | 21 | 0 | 0.05s |
| unit/config/monitoring.test.ts | ✅ | 27 | 0 | 0.05s |
| unit/services/advanced/temporalGraphNetworkService.test.ts | ✅ | 14 | 0 | 0.17s |
| unit/services/advanced/agenticAIService.test.ts | ✅ | 13 | 0 | 0.06s |
| unit/services/notificationService.test.ts | ✅ | 12 | 0 | 0.04s |
| unit/middleware/errorHandler.test.ts | ✅ | 20 | 0 | 0.04s |
| unit/services/advanced/acosService.test.ts | ✅ | 18 | 0 | 0.07s |
| unit/middleware/rateLimiter.test.ts | ✅ | 0 | 0 | 0.00s |
| unit/services/advanced/mlModelsService.test.ts | ✅ | 10 | 0 | 0.16s |
| unit/config/logger.test.ts | ✅ | 17 | 0 | 0.05s |
| unit/services/advanced/swarmTaskAllocationService.test.ts | ✅ | 18 | 0 | 0.06s |
| unit/services/advanced/whisperService.test.ts | ✅ | 14 | 0 | 0.06s |
| unit/services/advanced/redTeamService.test.ts | ✅ | 14 | 0 | 0.21s |
| unit/services/advanced/evidenceTruthLayerService.test.ts | ✅ | 12 | 0 | 82.03s |
| unit/routes/acos.test.ts | ✅ | 7 | 0 | 1.72s |
| unit/services/euRegulations/controlTemplatesService.test.ts | ✅ | 26 | 0 | 0.13s |
| unit/config/database.test.ts | ❌ | 13 | 1 | 5.14s |
| unit/services/advanced/mqttService.test.ts | ✅ | 13 | 0 | 0.07s |
| unit/services/euRegulations/euAiDatabaseClient.test.ts | ✅ | 11 | 0 | 0.30s |
| unit/data/nistAiRmfData.test.ts | ✅ | 19 | 0 | 0.08s |
| unit/examples/newPagesExamples.test.ts | ✅ | 17 | 0 | 0.04s |
| unit/utils/urlValidator.test.ts | ✅ | 25 | 0 | 0.25s |
| unit/config/elasticsearch.test.ts | ✅ | 6 | 0 | 1.15s |
| unit/routes/enterprise.test.ts | ✅ | 3 | 0 | 1.21s |
| unit/routes/integrations.test.ts | ✅ | 9 | 0 | 0.06s |
| unit/routes/webhooks.test.ts | ✅ | 7 | 0 | 0.04s |
| unit/utils/piiRedaction.test.ts | ✅ | 17 | 0 | 0.04s |
| unit/scripts/optimize-endpoints.test.ts | ✅ | 11 | 0 | 0.03s |
| unit/routes/billing.test.ts | ✅ | 0 | 0 | 0.00s |
| unit/routes/security.test.ts | ✅ | 6 | 0 | 0.47s |
| unit/routes/aiRmf.test.ts | ✅ | 8 | 0 | 0.33s |
| unit/routes/team.test.ts | ✅ | 7 | 0 | 0.04s |
| unit/routes/euRegulations.test.ts | ✅ | 5 | 0 | 0.24s |
| unit/routes/onboarding.test.ts | ✅ | 9 | 0 | 0.06s |
| unit/routes/vendors.test.ts | ✅ | 8 | 0 | 0.43s |
| unit/routes/twoFactor.test.ts | ✅ | 10 | 0 | 0.04s |
| unit/data/questionnaireTemplates.test.ts | ✅ | 10 | 0 | 0.06s |
| unit/routes/personnel.test.ts | ✅ | 7 | 0 | 0.33s |
| unit/routes/demo.test.ts | ✅ | 6 | 0 | 0.08s |
| unit/routes/controlMappings.test.ts | ✅ | 0 | 0 | 0.00s |
| unit/routes/evidenceVersions.test.ts | ✅ | 0 | 0 | 0.00s |
| unit/zkp/test-zk-service.test.ts | ✅ | 3 | 0 | 0.02s |
| unit/routes/ai.test.ts | ✅ | 0 | 0 | 0.00s |
| unit/routes/organization.test.ts | ✅ | 5 | 0 | 0.04s |
| unit/routes/audit.test.ts | ✅ | 0 | 0 | 0.00s |
| unit/scripts/performance-test.test.ts | ✅ | 3 | 0 | 0.02s |
| unit/config/swagger.test.ts | ✅ | 5 | 0 | 0.03s |
| unit/services/questionnaireService.test.ts | ✅ | 3 | 0 | 0.07s |
| unit/services/advanced/zeroKnowledgeService.test.ts | ✅ | 6 | 0 | 0.03s |
| unit/controllers/billingController.test.ts | ✅ | 40 | 0 | 0.09s |
| unit/controllers/securityController.test.ts | ✅ | 33 | 0 | 0.10s |
| unit/controllers/webhookController.test.ts | ✅ | 29 | 0 | 0.07s |
| unit/utils/auditLogger.test.ts | ✅ | 18 | 0 | 0.04s |
| unit/controllers/twoFactorController.test.ts | ✅ | 36 | 0 | 0.06s |

</details>

### Integration Tests

| Metric | Value |
|--------|-------|
| Test Suites | 22 (7 passed, 15 failed) |
| Tests Passed | 1656 |
| Tests Failed | 319 |
| Pass Rate | 83.8% |

<details>
<summary>📋 View all 22 test suites</summary>

| Suite | Status | Passed | Failed | Duration |
|-------|:------:|-------:|-------:|---------:|
| integration/api/endpoints.test.ts | ✅ | 11 | 0 | 1.22s |
| integration/api/auth.test.ts | ❌ | 18 | 2 | 1.19s |
| integration/api/acos.test.ts | ❌ | 6 | 68 | 0.46s |
| integration/api/risks.test.ts | ✅ | 15 | 0 | 0.19s |
| integration/api/frameworks.test.ts | ❌ | 8 | 10 | 0.38s |
| integration/api/advanced.test.ts | ✅ | 12 | 0 | 0.06s |
| integration/api/enterprise.test.ts | ✅ | 0 | 0 | 0.00s |
| integration/api/privacy.test.ts | ❌ | 0 | 39 | 0.34s |
| integration/api/security.test.ts | ❌ | 1 | 31 | 0.17s |
| integration/api/workflow.test.ts | ❌ | 0 | 19 | 0.14s |
| integration/api/mdm.test.ts | ❌ | 0 | 18 | 0.11s |
| integration/api/export.test.ts | ❌ | 0 | 15 | 0.14s |
| integration/integrationRegistry.test.ts | ✅ | 1554 | 0 | 3.07s |
| integration/api/vendors.test.ts | ❌ | 1 | 12 | 0.12s |
| integration/api/onboarding.test.ts | ❌ | 0 | 10 | 0.07s |
| integration/api/compliance.test.ts | ❌ | 0 | 8 | 0.23s |
| integration/api/billing.test.ts | ❌ | 0 | 4 | 0.24s |
| integration/api/team.test.ts | ✅ | 22 | 0 | 0.14s |
| integration/api/organization.test.ts | ✅ | 5 | 0 | 0.07s |
| integration/api/webhooks.test.ts | ❌ | 1 | 17 | 390.54s |
| integration/api/aiRmf.test.ts | ❌ | 1 | 27 | 810.58s |
| integration/api/euRegulations.test.ts | ❌ | 1 | 39 | 1171.04s |

</details>

### E2E Tests

| Metric | Value |
|--------|-------|
| Test Suites | 20 (7 passed, 13 failed) |
| Tests Passed | 45 |
| Tests Failed | 220 |
| Pass Rate | 17.0% |

<details>
<summary>📋 View all 20 test suites</summary>

| Suite | Status | Passed | Failed | Duration |
|-------|:------:|-------:|-------:|---------:|
| e2e/risk-management-flow.test.ts | ✅ | 2 | 0 | 0.75s |
| e2e/auth-flow.test.ts | ✅ | 3 | 0 | 2.01s |
| e2e/enterprise-features-flow.test.ts | ✅ | 0 | 0 | 0.00s |
| e2e/compliance-regulations-flow.test.ts | ❌ | 0 | 22 | 0.32s |
| e2e/eu-regulations-flow.test.ts | ✅ | 0 | 0 | 0.00s |
| e2e/privacy-compliance-flow.test.ts | ❌ | 0 | 15 | 0.31s |
| e2e/audit-evidence-flow.test.ts | ❌ | 0 | 15 | 2.09s |
| e2e/webhook-integration-flow.test.ts | ❌ | 1 | 22 | 2.11s |
| e2e/security-settings-flow.test.ts | ❌ | 0 | 21 | 1.21s |
| e2e/workflow-automation-flow.test.ts | ❌ | 0 | 18 | 0.09s |
| e2e/onboarding-flow.test.ts | ❌ | 0 | 19 | 0.10s |
| e2e/graphql-flow.test.ts | ✅ | 15 | 0 | 0.24s |
| e2e/marketplace-flow.test.ts | ✅ | 14 | 0 | 0.08s |
| e2e/ai-features-flow.test.ts | ❌ | 0 | 17 | 0.10s |
| e2e/team-organization-flow.test.ts | ❌ | 0 | 17 | 0.10s |
| e2e/websocket-flow.test.ts | ✅ | 10 | 0 | 0.26s |
| e2e/export-import-flow.test.ts | ❌ | 0 | 20 | 0.14s |
| e2e/billing-subscription-flow.test.ts | ❌ | 0 | 16 | 1.57s |
| e2e/vendor-management-flow.test.ts | ❌ | 0 | 9 | 0.61s |
| e2e/framework-compliance-flow.test.ts | ❌ | 0 | 9 | 0.45s |

</details>

### Performance Tests

| Metric | Value |
|--------|-------|
| Test Suites | 1 (0 passed, 1 failed) |
| Tests Passed | 11 |
| Tests Failed | 1 |
| Pass Rate | 91.7% |

<details>
<summary>📋 View all 1 test suites</summary>

| Suite | Status | Passed | Failed | Duration |
|-------|:------:|-------:|-------:|---------:|
| performance/endpoint-scenarios.test.ts | ❌ | 11 | 1 | 6.76s |

</details>

### Chaos Tests

| Metric | Value |
|--------|-------|
| Test Suites | 1 (0 passed, 1 failed) |
| Tests Passed | 1 |
| Tests Failed | 8 |
| Pass Rate | 11.1% |

<details>
<summary>📋 View all 1 test suites</summary>

| Suite | Status | Passed | Failed | Duration |
|-------|:------:|-------:|-------:|---------:|
| chaos/resilienceTests.spec.ts | ❌ | 1 | 8 | 250.71s |

</details>

### Other Tests

| Metric | Value |
|--------|-------|
| Test Suites | 2 (2 passed, 0 failed) |
| Tests Passed | 20 |
| Tests Failed | 0 |
| Pass Rate | 100.0% |

<details>
<summary>📋 View all 2 test suites</summary>

| Suite | Status | Passed | Failed | Duration |
|-------|:------:|-------:|-------:|---------:|
| utils/auditLogger.test.ts | ✅ | 8 | 0 | 0.04s |
| services/tokenBlacklistService.test.ts | ✅ | 12 | 0 | 0.07s |

</details>

---

## Failed Test Suites (44)

| Suite | Failed | Passed | Primary Issue |
|-------|-------:|-------:|---------------|
| integration/api/auth.test.ts | 2 | 18 | Test failures |
| integration/api/acos.test.ts | 68 | 6 | Test failures |
| integration/api/frameworks.test.ts | 10 | 8 | Mock config |
| unit/services/stripeService.test.ts | 5 | 45 | Test failures |
| unit/controllers/frameworksController.test.ts | 6 | 35 | Mock config |
| unit/controllers/risksController.test.ts | 1 | 38 | Test failures |
| unit/controllers/authController.test.ts | 13 | 73 | Test failures |
| unit/services/doraService.test.ts | 4 | 51 | Test failures |
| unit/services/sodService.test.ts | 48 | 6 | Mock config |
| unit/services/auditorService.test.ts | 1 | 56 | Test failures |
| unit/services/soxService.test.ts | 44 | 6 | Mock config |
| unit/config/index.test.ts | 1 | 60 | Test failures |
| unit/services/euRegulations/dsaService.test.ts | 1 | 40 | Mock config |
| unit/services/advanced/webrtcSignalingService.test.ts | 47 | 4 | Mock config |
| integration/api/privacy.test.ts | 39 | 0 | Mock config |
| unit/services/advanced/graphNeuralNetworkService.test.ts | 19 | 13 | Mock config |
| integration/api/security.test.ts | 31 | 1 | Test failures |
| performance/endpoint-scenarios.test.ts | 1 | 11 | Test failures |
| e2e/compliance-regulations-flow.test.ts | 22 | 0 | Mock config |
| unit/services/frameworkTemplateService.test.ts | 2 | 29 | Test failures |
| e2e/privacy-compliance-flow.test.ts | 15 | 0 | Mock config |
| e2e/audit-evidence-flow.test.ts | 15 | 0 | Mock config |
| integration/api/workflow.test.ts | 19 | 0 | Mock config |
| e2e/webhook-integration-flow.test.ts | 22 | 1 | Mock config |
| e2e/security-settings-flow.test.ts | 21 | 0 | Mock config |
| e2e/workflow-automation-flow.test.ts | 18 | 0 | Mock config |
| e2e/onboarding-flow.test.ts | 19 | 0 | Mock config |
| integration/api/mdm.test.ts | 18 | 0 | Test failures |
| e2e/ai-features-flow.test.ts | 17 | 0 | Mock config |
| e2e/team-organization-flow.test.ts | 17 | 0 | Mock config |

*... and 14 more failed suites*

---

## Common Failure Patterns

Based on analysis of the test failures:

### 1. Timeout Issues
- Several integration and E2E tests exceeded the default 30s timeout
- Affected tests: `webhooks.test.ts`, `euRegulations.test.ts`, `aiRmf.test.ts`
- **Fix:** Add `jest.setTimeout(60000)` for long-running tests

### 2. Mock Configuration Issues
- Some Prisma mock methods are undefined (e.g., `findUnique`, `groupBy`)
- **Fix:** Ensure all required Prisma methods are added to `prismaMock`

### 3. Route Import Errors
- Some route files have circular dependency or export issues
- **Fix:** Review route module exports and imports

---

## Recommendations

### Immediate Actions
1. ⏱️ **Increase test timeouts** for integration tests
2. 🔧 **Fix Prisma mock setup** - add missing methods
3. 📦 **Resolve import issues** in route tests

### Future Improvements
1. Add retry logic for flaky tests
2. Implement test isolation for database tests
3. Add parallel test execution configuration
4. Set up CI test reporting dashboard

---

## Test Coverage Summary

| Category | Test Files | Status |
|----------|:----------:|:------:|
| Services (Advanced) | 25+ | ✅ |
| Services (Core) | 15+ | ✅ |
| Services (Integrations) | 5+ | ✅ |
| Controllers | 12+ | ✅ |
| Routes (Unit) | 15+ | ✅ |
| Routes (Integration) | 10+ | ⚠️ |
| E2E Flows | 20 | ⚠️ |
| Middleware | 5+ | ✅ |
| Config | 8+ | ✅ |

---

*Report generated by Jest Test Runner*
*ComplyEasyAI Server Test Suite v2.0.0*

