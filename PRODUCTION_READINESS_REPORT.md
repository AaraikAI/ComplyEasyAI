# Production Readiness Report — ComplyEasyAI

**Generated:** 2026-05-31  ·  **Methodology:** findings-driven full-codebase deep scan (v21)
**Coverage:** all **1,180** hand-written source files (~567k LOC) read end-to-end by parallel subagents.
**Excluded:** `node_modules/` (vendored), `server/src/generated/` (739k-line machine-generated Prisma client), `.claude/worktrees/` (duplicate copies), `dist/`,`build/`,`coverage/`,`.archive/`.

> This report supersedes the rescinded v20.5 "PRODUCTION READY" claim and all v20.x multi-session ledger/queue/gate artifacts (retired to `.archive/audit-history/retired-v20-machinery-20260531/`). It is findings-driven — every item below is a concrete `file:line` with evidence and a fix, not a grep-coverage percentage.

---

## §1 Executive Summary

| Severity | Count |
|---|---:|
| HIGH | 55 |
| MEDIUM | 110 |
| LOW | 216 |
| INFO | 48 |
| **Total** | **429** |

**Scan provenance:** run 1 covered files 1–970 (350 findings); a gap-fill re-scan covered files 971–1180 (79 findings) after the tail batches initially failed to emit results. Merged and de-duplicated → 429 findings. 100% of the 1,180-file scope is covered.

**Top risk themes (HIGH+MEDIUM):**

| Theme | HIGH+MEDIUM count |
|---|---:|
| multi-tenant-isolation | 43 |
| test-quality | 13 |
| incomplete-implementation | 9 |
| data-integrity | 8 |
| credential-encryption | 6 |
| auth | 5 |
| incomplete-feature | 4 |
| mock-or-static-data | 3 |
| incomplete-feature-/-unwired-ui | 3 |
| partially-wired | 2 |
| data-integrity-/-fabricated | 2 |
| incomplete-implementation-/-broken-create-flow | 2 |

The dominant production blocker is **multi-tenant isolation**: many service/controller/route paths read or mutate records by bare `id` (or with `OR` scoping) without filtering by `organizationId` or verifying a parent entity's org — a cross-tenant IDOR class. The next clusters are **plaintext credential storage**, **mock/fake UI presented as live data**, and **auth/webhook** gaps (missing HMAC verification, CSRF-over-GET, revoked-key acceptance).

---

## §2 HIGH severity findings (full detail)

55 findings. These are security / data-integrity / will-break-in-production issues and should be treated as deployment blockers.

### multi-tenant-isolation (33)

- **`server/src/controllers/controlMappingsController.ts:329`** — exportMappings uses OR org-scoping, leaking cross-tenant control/framework names
  - *Evidence:* `where: { OR: [ { sourceControl: { framework: { organizationId } } }, { targetControl: { framework: { organizationId } } } ] }`
  - *Fix:* Use AND (both source AND target control frameworks must belong to organizationId), matching listAllMappings (line 104-110). With OR, any mapping where only one side belongs to the caller's org is exported, leaking the other org's framework.name and control.name into the CSV (lines 386-388).
- **`server/src/controllers/featureModulesController.ts:1051`** — updateProductRecall, ProductDecommission, LifecycleAssessment, ProductLifecycle, ProcessMap mutate by bare id
  - *Evidence:* `updateProductRecall (1051), update/deleteProductDecommission (1090/1096), update/deleteLifecycleAssessment (1134/1140), update/deleteProductLifecycle (1184/1190), update/deleteProcessMap (1228/1234) all use where: { id: req.params.id } only.`
  - *Fix:* All these models have organizationId (their get/list handlers scope by it). Add ownership verification (findFirst {id, organizationId}) before every update/delete so cross-tenant IDs cannot be mutated.
- **`server/src/controllers/featureModulesController.ts:1287`** — syncSBOMToModules/syncBreachToModules update child rows by bare id and create incidents without parent-org check
  - *Evidence:* `prisma.productLifecycle.update({ where: { id: product.id } }), prisma.productDecommission.update({ where: { id: decom.id } }); syncBreach creates surveillanceIncident with planId only.`
  - *Fix:* The driving findMany queries are org-scoped so the iterated ids are safe here; however the surveillanceIncident.create uses planId without re-confirming plan org. Confirm plan ownership to be defensive. (Lower-risk than the direct handlers above but worth hardening.)
- **`server/src/controllers/featureModulesController.ts:200`** — updateBreachIncident/deleteBreachIncident mutate by bare id without org scoping
  - *Evidence:* `updateBreachIncident: prisma.breachIncident.update({ where: { id: req.params.id }, data }); deleteBreachIncident: prisma.breachIncident.delete({ where: { id: req.params.id } });`
  - *Fix:* BreachIncident has organizationId. The update only deletes data.organizationId but never confirms the row belongs to the caller's org. Add an ownership findFirst({id, organizationId}) guard before update/delete.
- **`server/src/controllers/featureModulesController.ts:219`** — createBreachNotification/updateBreachNotification do not verify parent breach's org
  - *Evidence:* `createBreachNotification: prisma.breachNotification.create({ data: { breachId, ... } }) with no check that breachId's BreachIncident belongs to caller org; updateBreachNotification updates by bare {id}.`
  - *Fix:* Verify the breachId's parent BreachIncident.organizationId === req.user.organizationId before create; verify parent org on update.
- **`server/src/controllers/featureModulesController.ts:257`** — BreachTemplate and RegulatoryContact update/delete by bare id
  - *Evidence:* `updateBreachTemplate/deleteBreachTemplate and updateRegulatoryContact/deleteRegulatoryContact use prisma.X.update\|delete({ where: { id: req.params.id } }) with no organizationId scoping.`
  - *Fix:* Both models carry organizationId. Add ownership verification (findFirst {id, organizationId}) before mutate/delete to prevent cross-tenant modification.
- **`server/src/controllers/featureModulesController.ts:341`** — updateCEProduct/deleteCEProduct write by bare id without org scoping
  - *Evidence:* `updateCEProduct: prisma.cEProduct.update({ where: { id: req.params.id }, data }); deleteCEProduct: prisma.cEProduct.delete({ where: { id: req.params.id } });`
  - *Fix:* CEProduct has organizationId (getCEProduct correctly scopes by it). update/delete only strip data.organizationId but never confirm ownership — add a findFirst({id, organizationId}) guard.
- **`server/src/controllers/featureModulesController.ts:529`** — updateDPP/deleteDPP write by bare id without org scoping
  - *Evidence:* `updateDPP: prisma.digitalProductPassport.update({ where: { id: req.params.id }, data }); deleteDPP: prisma.digitalProductPassport.delete({ where: { id: req.params.id } });`
  - *Fix:* DigitalProductPassport has organizationId. Verify ownership before update/delete; the read handlers scope by org but mutations do not.
- **`server/src/controllers/featureModulesController.ts:54`** — updateGovernanceBody/deleteGovernanceBody write by bare id with no org scoping
  - *Evidence:* `updateGovernanceBody: prisma.governanceBody.update({ where: { id }, ... }); deleteGovernanceBody: prisma.governanceBody.delete({ where: { id: req.params.id } });`
  - *Fix:* GovernanceBody has organizationId. Verify ownership first (findFirst where {id, organizationId}) or include organizationId in the where clause so a user from another org cannot mutate/delete another tenant's body.
- **`server/src/controllers/featureModulesController.ts:676`** — updateESGMetric/deleteESGMetric and Materiality update/delete by bare id
  - *Evidence:* `updateESGMetric/deleteESGMetric and updateMaterialityAssessment/deleteMaterialityAssessment call prisma.X.update\|delete({ where: { id: req.params.id } }) with no organizationId.`
  - *Fix:* Both ESGMetric and MaterialityAssessment have organizationId. Add ownership verification before mutate/delete (the get/list handlers scope correctly, the mutations do not).
- **`server/src/controllers/featureModulesController.ts:73`** — Governance child-entity create/update/delete never verify parent body's org
  - *Evidence:* `createMeeting/updateMeeting/deleteMeeting, createDecision/updateDecision, createEscalationPath/updateEscalationPath/deleteEscalationPath operate on governanceBodyId or {id} with no check that the parent GovernanceBody belongs to the caller's org.`
  - *Fix:* Before create, verify the referenced governanceBodyId belongs to req.user.organizationId; for update/delete, join through governanceBody.organizationId to confirm ownership (parent-org chain per COV-11).
- **`server/src/controllers/featureModulesController.ts:834`** — SBOMEntry and SBOMRepository update/delete by bare id without org scoping
  - *Evidence:* `updateSBOMEntry/deleteSBOMEntry and updateSBOMRepository/deleteSBOMRepository use prisma.X.update\|delete({ where: { id: req.params.id } }) with no organizationId.`
  - *Fix:* Both models carry organizationId. Verify ownership before mutate/delete to prevent cross-tenant tampering with software bill-of-materials data.
- **`server/src/controllers/featureModulesController.ts:983`** — SurveillancePlan update/delete and SurveillanceIncident create/update miss org/parent checks
  - *Evidence:* `updateSurveillancePlan/deleteSurveillancePlan update by {id}; createSurveillanceIncident creates with planId and updateSurveillanceIncident updates by {id} with no verification that the parent SurveillancePlan belongs to the caller's org.`
  - *Fix:* SurveillancePlan has organizationId; verify it before plan mutate/delete. For SurveillanceIncident (child of plan), verify planId's plan.organizationId === caller org before create/update.
- **`server/src/routes/enterprise.ts:233`** — Questionnaire PUT update not scoped to organizationId
  - *Evidence:* `const updated = await prisma.questionnaire.update({ where: { id: req.params.id }, data: {...} }); // no organizationId filter, no preceding ownership check`
  - *Fix:* Precede the update with a findFirst({ where: { id, organizationId: req.user.organizationId } }) ownership check (or scope via updateMany with organizationId) so a user cannot modify another tenant's questionnaire by ID.
- **`server/src/routes/enterprise.ts:253`** — Questionnaire DELETE not scoped to organizationId
  - *Evidence:* `await prisma.questionnaireResponse.deleteMany({ where: { questionnaireId: req.params.id } }); ... await prisma.questionnaire.delete({ where: { id: req.params.id } });`
  - *Fix:* Verify the questionnaire belongs to req.user.organizationId before deleting it and its child responses/questions; otherwise any authenticated user can delete arbitrary tenants' questionnaires by ID.
- **`server/src/routes/enterprise.ts:532`** — move-user does not verify target org belongs to caller's workspace hierarchy
  - *Evidence:* `const result = await multiWorkspaceService.moveUserToOrganization(req.body.userId, req.body.targetOrganizationId, req.user.id); // caller's organizationId not passed for authorization`
  - *Fix:* Pass req.user.organizationId and verify both the source user and req.body.targetOrganizationId are within the caller's authorized workspace hierarchy before moving; otherwise a user could move arbitrary users into/out of unrelated organizations.
- **`server/src/routes/enterprise.ts:898`** — Issue PATCH update not scoped to organizationId
  - *Evidence:* `const issue = await prisma.issue.update({ where: { id: req.params.id }, data: {...} }); // no org check (contrast GET /:id at line 871 which filters by organizationId)`
  - *Fix:* Add an ownership findFirst on organizationId before update, matching the pattern used in the GET /:id handler at line 871.
- **`server/src/routes/enterprise.ts:942`** — Issue DELETE not scoped to organizationId
  - *Evidence:* `await prisma.issueComment.deleteMany({ where: { issueId: req.params.id } }); await prisma.issue.delete({ where: { id: req.params.id } });`
  - *Fix:* Verify the issue belongs to req.user.organizationId before deleting it and its comments; currently any authenticated user can delete any tenant's issue by ID.
- **`server/src/routes/regulatoryChanges.ts:525`** — Cross-tenant write to shared RegulatoryChangeDetection record
  - *Evidence:* `const existing = await prisma.regulatoryChangeImpact.findFirst({ where: { regulatoryChangeId: req.params.id, organizationId: orgId }}); ... prisma.regulatoryChangeDetection.update({ where: { id: req.params.id }, data: updateData })`
  - *Fix:* RegulatoryChangeDetection has no organizationId and is shared across orgs (each org links via RegulatoryChangeImpact). The PATCH /:id handler lets any org that holds an impact mutate the shared change's title/summary/sourceUrl/effectiveDate/impactAnalysis/status, affecting every other org that references it. Restrict mutation of shared fields to a system/admin role, or store per-org overrides instead of editing the shared detection row.
- **`server/src/routes/scim.ts:875`** — SCIM group member userIds added without verifying org ownership
  - *Evidence:* `const memberIds = members.map((m: any) => m.value).filter(Boolean); ... prisma.userRole.create({ data: { userId, roleId: role.id } })`
  - *Fix:* CREATE Group accepts member userId values from the IdP payload and creates UserRole rows without verifying each user belongs to the SCIM config's organization (scimOrgId). A misconfigured/malicious IdP could assign a custom role to a user in another tenant. Filter memberIds to users where organizationId === orgId before creating UserRole rows (mirror the verification in securityTraining.ts assign handler).
- **`server/src/routes/workflow.ts:382`** — GET /runs/:runId reads execution runs with no org ownership check
  - *Evidence:* `prisma.workflowExecution.findUnique({ where: { id: req.params.runId }, include: { workflow: true } }) — no organizationId filter on the parent workflow; any authenticated user can read another org's execution run by ID.`
  - *Fix:* Use findFirst and filter via the parent workflow: where: { id: runId, workflow: { organizationId: req.user.organizationId } }, returning 404 if not owned.
- **`server/src/routes/workflow.ts:398`** — POST /runs/:runId/retry retries cross-tenant execution runs
  - *Evidence:* `original = findUnique({ where: { id: req.params.runId } }) with no org check, then creates a new workflowExecution and increments runCount on original.workflowId — a user can retry/mutate another org's workflow.`
  - *Fix:* Load the run scoped to the caller's org (where: { id: runId, workflow: { organizationId } }) and 404 if not owned before creating the retry execution.
- **`server/src/services/advanced/acosService.ts:1061`** — analyzePolicyChangeImpact fetches policy by id with no org scoping
  - *Evidence:* `policy = prisma.policy.findUnique({ where: { id: policyId } }) — forecastChangeImpact(changeType:'policy') reads a policy with no organizationId filter, leaking another org's policy title/category and creating a cross-tenant impact record.`
  - *Fix:* Use findFirst({ where: { id: policyId, organizationId } }) and 404 if not found before analyzing impact.
- **`server/src/services/advanced/acosService.ts:1130`** — analyzeFrameworkUpdateImpact fetches framework by id with no org scoping
  - *Evidence:* `framework = prisma.complianceFramework.findUnique({ where: { id: frameworkId }, include: { controls: true } }) — forecastChangeImpact(changeType:'framework') reads another org's framework and all its controls without an org check.`
  - *Fix:* Use findFirst({ where: { id: frameworkId, organizationId } }) and 404 if not found before computing impact.
- **`server/src/services/advanced/acosService.ts:222`** — createControlLoop does not verify control's framework belongs to org
  - *Evidence:* `control = prisma.frameworkControl.findUnique({ where: { id: controlId } }) — fetched by id only; a user can create a control loop (and audit log) referencing a frameworkControl owned by another organization.`
  - *Fix:* Scope the lookup to the org via the parent framework: prisma.frameworkControl.findFirst({ where: { id: controlId, framework: { organizationId } } }) and 404 if not found.
- **`server/src/services/advanced/acosService.ts:973`** — analyzeControlChangeImpact fetches control by id with no org scoping
  - *Evidence:* `prisma.frameworkControl.findUnique({ where: { id: controlId }, include: { framework: { include: { controls: true } } } }) — forecastChangeImpact(changeType:'control') exposes another org's control/framework detail and writes a changeImpact record referencing it.`
  - *Fix:* Scope via framework: findFirst({ where: { id: controlId, framework: { organizationId } } }) and throw 404 if not owned before building the impact analysis.
- **`server/src/services/advanced/complianceAsCodeService.ts:1061`** — getPolicy / evaluatePolicy / testPolicy / benchmarkPolicy look up policy by ID without organizationId scoping
  - *Evidence:* `const dbPolicy = await prisma.compliancePolicy.findUnique({ where: { id: policyId } }); ... return { id, name, framework, rego, severity, tags };`
  - *Fix:* getPolicy(policyId) returns a policy (including its Rego source) with no organizationId filter, and evaluatePolicy(policyId, input)/testPolicy/benchmarkPolicy accept only a policyId with no org parameter. A caller in org A can pass org B's policyId and read/evaluate it. Add organizationId to these signatures and use prisma.compliancePolicy.findFirst({ where: { id: policyId, organizationId } }) (matching the pattern already used in updatePolicy/deletePolicy/rollbackPolicy).
- **`server/src/services/advanced/complianceAsCodeService.ts:1061`** — getPolicy() fetches any compliance policy by ID with no organizationId filter (cross-tenant IDOR)
  - *Evidence:* `async getPolicy(policyId): prisma.compliancePolicy.findUnique({ where: { id: policyId } }) — no organizationId. Controller securityController.ts:1057 getCompliancePolicy calls it with only req.params.policyId, exposing another org's Rego policy code to any authenticated user.`
  - *Fix:* Add organizationId param to getPolicy and use findFirst({ where: { id: policyId, organizationId } }); pass authReq.user.organizationId from getCompliancePolicy. Same pattern for testPolicy/benchmarkPolicy which call getPolicy unscoped.
- **`server/src/services/advanced/jitAccessService.ts:1088`** — getAccessRequest performs cross-tenant read of JIT requests
  - *Evidence:* `prisma.auditLog.findMany filters only by action prefix and details:{contains:requestId} with NO organizationId filter, then returns the request including its org. Any caller with a requestId can read another org's JIT request details.`
  - *Fix:* Add organizationId to the where clause and require callers to pass the caller's org; reject if the matched log's organizationId differs.
- **`server/src/services/advanced/jitAccessService.ts:216`** — JIT access approval not scoped to approver's organization
  - *Evidence:* `approveAccess(requestId, approverId, organizationId) takes organizationId but never uses it; getAccessRequest() searches auditLog with no org filter, and approver check is only role==='admin'. An admin in org A can approve a privilege-escalation request belonging to org B.`
  - *Fix:* In approveAccess/denyAccess, verify request.organizationId === organizationId AND that the approver belongs to that org before approving. Pass organizationId into getAccessRequest and filter the auditLog query by it.
- **`server/src/services/advanced/temporalGraphNetworkService.ts:719`** — predictComplianceTrajectory fetches complianceFramework by id only (no organizationId)
  - *Evidence:* `prisma.complianceFramework.findUnique({ where: { id: frameworkId }, include: { controls: true } }) — frameworkId is a caller parameter; a user can pass another org's frameworkId and read its progress + controls. Same gap in getHistoricalScores (1429), performSensitivityAnalysis (1540), recalculateTr`
  - *Fix:* Use findFirst({ where: { id: frameworkId, organizationId } }) and 404 if not owned, in predictComplianceTrajectory/getHistoricalScores/performSensitivityAnalysis.
- **`server/src/services/multiWorkspaceService.ts:305`** — cloneFrameworkToChildren does not verify target orgs are children of source org
  - *Evidence:* `targetOrganizationIds is trusted directly; creates frameworks+controls into any org ID passed. Unlike moveUserToOrganization (line 271-278) which validates the target is a child, this method has no parentOrganizationId check.`
  - *Fix:* Before the Promise.all, query organization.findMany where id in targetOrganizationIds AND parentOrganizationId = sourceOrganizationId, and reject any target that is not an actual child of the source org.
- **`server/src/services/websocketService.ts:190`** — WebSocket 'subscribe' lets a client join any resource room without org ownership check
  - *Evidence:* `socket.on('subscribe', (data) => { const room = `${data.resource}:${data.id}`; socket.join(room); }) — no verification that resource id belongs to socket.organizationId. broadcastToResource emits to that same room.`
  - *Fix:* Before socket.join, look up the resource and confirm its organizationId === socket.organizationId; reject otherwise. Otherwise a tenant can subscribe to another org's resource:id room and receive its real-time broadcasts.

### credential-encryption (4)

- **`server/src/routes/marketplace/marketplaceRoutes.ts:524`** — Marketplace install stores integration secrets in plaintext (no encryptField)
  - *Evidence:* `const installed = await prisma.integration.create({ data: { ... config: config, organizationId: user.organizationId } });`
  - *Fix:* Encrypt secret config fields (secretAccessKey, clientSecret, apiToken, password, personalAccessToken, token, apiKey, etc.) with encryptField() before the create, mirroring integrationsController.ts:1640 which builds encryptedConfig[k] = encryptField(v). Storing cloud/SIEM/ticketing credentials in plaintext exposes them on any DB read.
- **`server/src/routes/marketplace/marketplaceRoutes.ts:557`** — Marketplace configure overwrites integration config in plaintext (no encryptField)
  - *Evidence:* `const updated = await prisma.integration.update({ where: { id: installed.id }, data: { config: req.body.config \|\| {} } });`
  - *Fix:* Apply encryptField() to secret fields in req.body.config before update, consistent with the encryptConfigSecrets pattern used in integration services (e.g. azureDevOpsService.ts:142). Currently a reconfigure writes provider passwords/tokens to the DB unencrypted.
- **`server/src/routes/ticketing.ts:199`** — Jira basic-auth API token stored in plaintext in integration.config
  - *Evidence:* `config: { instanceUrl, authType: 'basic', username: config.username, apiToken: config.password, ... } via prisma.integration.upsert — no encryptField()`
  - *Fix:* Encrypt the API token with encryptField(config.password) before storing in integration.config, mirroring jiraService.saveIntegration which encrypts OAuth access/refresh tokens, and the webhookSecret which is read via decryptField().
- **`server/src/routes/ticketing.ts:803`** — Duplicate plaintext Jira API token storage in POST /connections
  - *Evidence:* `config: { ..., username: config.username, apiToken: config.password, ... } in prisma.integration.upsert — same unencrypted credential write as POST /config`
  - *Fix:* Apply encryptField() to the API token here too; consolidate both /config and /connections write paths through jiraService.saveIntegration so encryption is enforced in one place.

### incomplete-implementation-/-broken-create-flow (2)

- **`components/SOXComplianceDashboard.tsx:481`** — Add SOX Control modal discards all user input — sends only { status: 'Active' }
  - *Evidence:* `onClick={async () => { try { await api.sox.createControl({ status: 'Active' }); setShowCreateControl(false); loadData(); } catch ...`
  - *Fix:* The Control ID, Title, Description, Category, Process Area, Control Type, Risk Level, and Owner inputs are uncontrolled and never read. Convert them to controlled state and pass the collected values to api.sox.createControl(); otherwise every created control is an empty 'Active' record.
- **`components/SOXComplianceDashboard.tsx:593`** — Create Test Record modal discards all user input — sends api.sox.createTestResult({})
  - *Evidence:* `onClick={async () => { try { await api.sox.createTestResult({}); setShowCreateTest(false); loadData(); } catch ...`
  - *Fix:* The Control, Methodology, Sample Size, and Findings inputs are uncontrolled and never collected. Wire them to controlled state and pass the payload to createTestResult({...}); the current call always creates an empty test result.

### credential-encryption-at-rest (2)

- **`server/src/services/advanced/physicalAIService.ts:242`** — IoT device authentication credentials stored unencrypted in ioTDevice.sensorData JSON
  - *Evidence:* `registerDevice writes device.authentication (type+credentials, e.g. api_key/oauth) and device.certificates into sensorData JSON without encryptField(); persisted plaintext via prisma.ioTDevice.create.`
  - *Fix:* encryptField() the authentication.credentials (and any secret material) before writing to sensorData; decrypt on read.
- **`server/src/services/advanced/regulatoryIntelligenceFabricService.ts:2781`** — Regulatory feed API keys / OAuth tokens / basic-auth passwords stored unencrypted in regulatoryFeed.metadata
  - *Evidence:* `addFeed stores feed.authentication (api_key apiKey, oauth accessToken, basic username/password) into metadata.authentication JSON without encryptField(); later read and sent as Bearer/X-API-Key/Basic headers (lines 2402, 2557, 2559, 2561).`
  - *Fix:* encryptField() the credentials before persisting to metadata; decrypt only when building outbound request headers.

### runtime-error-/-module-system (1)

- **`App.tsx:208`** — CommonJS require() used inside Vite/ESM frontend component will throw at runtime
  - *Evidence:* `const handleNavigate = (view: string) => { const { viewToPath } = require('./routes/routeConfig'); navigate(viewToPath(view)); };`
  - *Fix:* require is not defined in the browser ESM bundle produced by Vite; any component that calls handleNavigate (e.g. OnboardingProvider onNavigate, ACOSDashboard onNavigate) will throw 'require is not defined'. Import viewToPath statically at the top alongside ROUTES (line 17) and call it directly.

### static-data-/-not-wired (1)

- **`components/ProductLifecycleTracker.tsx:427`** — Component fetches product data from API but discards it and always renders hardcoded constants
  - *Evidence:* `const data = await api.modules.productLifecycle.listProducts(); // Only update if we got real data — demo data is used as fallback  setLoadError(null);`
  - *Fix:* The fetched `data` is never stored in state; the entire UI (PRODUCTS, STAGE_REQUIREMENTS, MILESTONES, DOCUMENTS, REGULATORY_REQUIREMENTS, EOL_POLICIES, ENVIRONMENTAL_METRICS) always renders from static module constants. This compliance/lifecycle tracker presents fabricated reference data as the user's real product portfolio. Wire all render paths to React state populated from the API response (or clearly mark as a demo/catalog screen).

### frontend-backend-contract (1)

- **`mobile/src/services/api.ts:274`** — Token refresh hits unversioned /api/auth/refresh while all other calls use /api/v2
  - *Evidence:* `const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, { ... })  // vs fetchApi url = `${API_BASE_URL}/api/${API_VERSION}${endpoint}``
  - *Fix:* Use the same versioned base path (`/api/${API_VERSION}/auth/refresh`) as the rest of the client, or confirm the backend actually exposes an unversioned refresh route. A path mismatch silently breaks token refresh, logging every user out on access-token expiry.

### disabled-test-coverage (1)

- **`server/src/__tests__/integration/api/enterprise.test.ts:186`** — Entire enterprise route test suite is skipped (describe.skip)
  - *Evidence:* `describe.skip('Enterprise Routes Integration', () => { ... }) — ~60 tests across risk-mgmt, questionnaires, policies, trust-center, workspace, reports, monitoring, issues, visionary-ai never run.`
  - *Fix:* Remove .skip and make the suite pass, or delete it. A permanently-skipped suite gives the false impression of coverage for enterprise routes while exercising none of them in CI.

### mock-hides-missing-implementation (1)

- **`server/src/__tests__/integration/api/enterprise.test.ts:54`** — Enterprise services mocked with virtual:true because 'these modules don't exist yet'
  - *Evidence:* `// Mock enterprise services (virtual: true because these modules don't exist yet) jest.mock('../../../services/advanced/riskManagementService', () => ({...}), { virtual: true });`
  - *Fix:* virtual:true forces Jest to fabricate a module that has no real implementation. Combined with describe.skip, the enterprise feature set (riskManagementService, questionnaireService, policyLibraryService, trustCenterService, multiWorkspaceService, reportingService, monitoringService, issueManagementService, visionaryAIService) appears untested AND likely unimplemented. Verify these services/routes exist before claiming the enterprise feature set is production-ready.

### webhook-hmac (1)

- **`server/src/controllers/webhookController.ts:611`** — Incoming webhook endpoint reads x-webhook-signature but never verifies HMAC
  - *Evidence:* `const signature = req.headers['x-webhook-signature'] as string; // ... 'signature' is never used; webhookService.verifyWebhookSignature() is never called`
  - *Fix:* Call webhookService.verifyWebhookSignature(payload, signature, secret) (the method already exists at webhookService.ts:575) and reject on mismatch BEFORE dispatching events. Relying solely on the API key while reading-and-discarding the signature header leaves the documented HMAC verification path unimplemented.

### auth (1)

- **`server/src/controllers/webhookController.ts:623`** — receiveIncomingWebhook authenticates with revoked/expired API keys
  - *Evidence:* `const validKey = await prisma.apiKey.findUnique({ where: { keyHash } }); if (!validKey \|\| validKey.organizationId !== organizationId) { ... }`
  - *Fix:* Reject keys where revokedAt is not null or expiresAt is in the past. As written, a revoked or expired API key still passes auth on this public incoming-webhook endpoint and can dispatch internal events (user.created, framework.updated), unlike getApiKeys which correctly filters revokedAt: null.

### csrf (1)

- **`server/src/graphql/index.ts:231`** — GraphQL mutations executable over GET request, bypassing CSRF protection
  - *Evidence:* `} else if (req.method === 'GET') { query = req.query.query as string; ... } ... const result = await graphql({ schema, source: query, rootValue: buildRootValue(context) ...`
  - *Fix:* graphql-js executes any operation (including mutations) over GET. The global csrfProtection middleware skips GET, and auth is cookie-based, so a forged GET like /api/graphql?query=mutation{deleteVendor(id:"x")} runs with the victim's cookie. Reject non-query operations on GET (parse the operation and only allow operation === 'query' for GET), or require CSRF token / disable GET mutations.

### rate-limiting-correctness (1)

- **`server/src/middleware/rateLimiter.ts:31`** — Redis rate-limit store is never attached to limiters (async init races spread)
  - *Evidence:* `initRedisStore() runs async at line 31 and sets storeConfig.store LATER, but limiters at lines 59-116 already spread `...storeConfig` synchronously at module load, capturing the empty object.`
  - *Fix:* Build limiters lazily after the Redis store resolves, or have initRedisStore attach the store to already-created limiters. As written, production always uses the in-memory store, so per-IP limits reset per replica and are not enforced cluster-wide — defeating brute-force/abuse protection across multiple instances.

### stub-/-incomplete-implementation (1)

- **`server/src/routes/controlTesting.ts:426`** — Automated control test 'run' always records PASS without executing any test
  - *Evidence:* `const result = await prisma.controlTestResult.create({ data: { testId: test.id, status: 'PASS', details: { ... message: `Test run initiated for ${test.testType}...` } } });`
  - *Fix:* This compliance-critical endpoint claims to run an automated control test but unconditionally writes status:'PASS' and performs no actual test logic (access review, config check, vuln scan, etc.). This produces fabricated compliance evidence. Either implement real test execution per testType (dispatch to a worker/integration) and record the true outcome, or mark results as 'PENDING'/'SKIPPED' until a real engine reports back. Do not hardcode PASS.

### mass-assignment-/-multi-tenant (1)

- **`server/src/routes/privacy.ts:2295`** — PATCH /notices/:id writes req.body directly with no field allowlist or validation, allowing organizationId override
  - *Evidence:* `const notice = await prisma.jITPrivacyNotice.update({ where: { id: req.params.id }, data: req.body });`
  - *Fix:* After the org-ownership findFirst, apply pick(req.body, [...allowed fields]) (as the sibling /jit-notices/:id PATCH does) so organizationId and counters (impressions/acceptances/dismissals) cannot be overwritten, and add validateBody(). Writing raw req.body lets a caller move the notice to another organizationId or tamper with metrics.

### incomplete-implementation (1)

- **`server/src/services/advanced/homomorphicAIService.ts:1039`** — performEncryptedNeuralInference computes in cleartext, defeating homomorphic privacy guarantee
  - *Evidence:* `Method advertised as encrypted inference does parseFloat(currentValues[k].value) and plain JS arithmetic (accumulator += inputVal*weight), returning String(accumulator); it never invokes SEAL. Audit log records privacy:'full' (storeInferenceMetadata) though no encryption is used.`
  - *Fix:* Route these through the genuine SEAL evaluator paths (encryptedLinearRegression/encryptedPolynomialEval) operating on ciphertext, or clearly downgrade the method and stop emitting privacy:'full' audit claims. Same issue in performEncryptedBatchClassification (line 1228).

### data-integrity (1)

- **`server/src/services/advanced/jitAccessService.ts:1026`** — JIT privilege revocation hard-resets user role to 'viewer', losing prior role
  - *Evidence:* `revokeTemporaryPrivilege always sets data:{role:'viewer'}. grantTemporaryPrivilege overwrites user.role with the elevated role and never stores the original. A user who was permanently 'admin' and used JIT will be downgraded to 'viewer' on expiry/revoke.`
  - *Fix:* Capture the user's pre-grant role at grant time (store in the session/request) and restore that exact role on revoke instead of hardcoding 'viewer'. Or model JIT grants as additive scopes rather than mutating User.role.

### credential/fail-open-secret (1)

- **`server/src/services/advanced/physicalAIService.ts:1204`** — ATTESTATION_SECRET falls back to hardcoded 'default_secret' for sensor-data HMAC
  - *Evidence:* `crypto.createHmac('sha256', process.env.ATTESTATION_SECRET \|\| 'default_secret').update(attestationHash) — sensor attestation signatures become forgeable if the env var is unset; chain-of-custody integrity defeated.`
  - *Fix:* Require ATTESTATION_SECRET at boot (throw AppError if missing); never fall back to a static secret. Same pattern as webrtc TURN secret which already throws.

---

## §3 MEDIUM severity findings

110 findings.

### test-quality (13)

| Location | Issue | Fix |
|---|---|---|
| `components/__tests__/RoPAManagement.test.tsx:36` | Entire RoPAManagement test suite is tautological — asserts only that the DOM is non-empty | These 10 tests pass for ANY component (or even a blank div) — they never assert RoPA-specific content, table rows, stat values, or that mockGet was called. Repl |
| `e2e/billing.spec.ts:164` | CSRF protection test passes vacuously when no mutation occurs | The flag defaults to true and is only flipped if a billing/payment mutation is observed. If the upgrade button isn't found (common in headless/unauth runs) no r |
| `e2e/dora-compliance.spec.ts:189` | DORA CSRF mutation test passes vacuously | Same vacuous-pass pattern: with no mutating request the boolean stays true. Track a counter of observed mutating requests and assert it is > 0 before asserting  |
| `e2e/governance.spec.ts:238` | Governance CSRF mutation test passes vacuously | Identical default-true-then-maybe-flip anti-pattern. Require an observed mutating request before asserting; otherwise the security guarantee is never exercised. |
| `e2e/security/auth-security.spec.ts:93` | Rate-limit test only checks absence of 500s, never asserts a 429 occurs | rateLimited is computed but never asserted. Assert rateLimited.length > 0 (tune attempts to the configured window) so login brute-force protection is actually v |
| `e2e/settings.spec.ts:101` | Empty-name validation test asserts expect(true).toBeTruthy() and cannot fail | Assert on hasError (or that the save request was rejected). As written the test passes even if empty names are silently accepted, giving false confidence in val |
| `e2e/settings.spec.ts:243` | CSRF-on-mutation assertion is skipped when no mutation fires, so a missing-CSRF regression passes | Assert mutations.length > 0 before the loop (or fail if the save produced no POST/PUT/PATCH). If the save sends no request the loop never runs and the test pass |
| `e2e/team-management.spec.ts:105` | Invite CSRF assertion guarded by its own condition, never fails on missing token | Remove the guard and assert invitePostCsrf is true unconditionally (after confirming a POST was sent). As written, missing CSRF leaves invitePostCsrf false, the |
| `server/src/__tests__/contracts/routes/search.contract.test.ts:82` | Re-index test mocks non-existent Prisma models (risk/control/evidence) | Per the project schema the models are riskItem, frameworkControl, evidenceAnalysis (no risk/control/evidence model exists). These mocks do not intercept the rea |
| `server/src/__tests__/e2e/websocket-flow.test.ts:66` | WebSocket E2E test re-implements production logic instead of importing it | Import and exercise the actual websocketService.ts (auth middleware + connection handler). As written, the production WebSocket code is never executed, so regre |
| `server/src/__tests__/security/auth-bypass.contract.test.ts:69` | Auth-bypass 'contract' test mocks out the real authenticate/authorize middleware | The test replaces production middleware/auth with a simplified inline reimplementation, so it validates the mock rather than the real auth path (token blacklist |
| `server/src/__tests__/security/authorization-matrix.contract.test.ts:69` | Authorization-matrix 'contract' test mocks the real auth middleware, so RBAC matrix is asserted against a stub | The role-check logic under test is defined in the mock, not in production code; the real authorize() in middleware/auth.ts is never executed. Expected-status ar |
| `server/src/__tests__/unit/services/stripeService.test.ts:1178` | Stripe webhook idempotency / duplicate-event replay is untested | Webhook handlers create/update a stripeEvent record for idempotency, but no test verifies that re-delivering the same event id is a no-op (Stripe retries delive |

### multi-tenant-isolation (10)

| Location | Issue | Fix |
|---|---|---|
| `server/src/controllers/acosController.ts:2287` | Swarm task/agent reads accept no organizationId, enabling cross-tenant access by ID | getSwarmTaskStatus (2287), getSwarmAgentById (2486) and getSwarmAgentWorkload (2550) look up tasks/agents purely by ID with no organizationId argument, unlike s |
| `server/src/controllers/controlMappingsController.ts:46` | createMapping duplicate-existence check is not organization-scoped | The bidirectional duplicate check queries controlMapping globally without filtering by framework.organizationId. While the create itself is gated by the precedi |
| `server/src/routes/bia.ts:445` | Process dependency stores dependsOn target without verifying it belongs to the caller's org | dependsOn is a client-supplied process ID that is never verified to belong to the caller's organizationId. A user could link a dependency to another tenant's pr |
| `server/src/services/advanced/complianceDigitalTwinService.ts:327` | Simulation control/framework lookups by ID never verify parent organization ownership | Use findFirst with framework.organizationId / organizationId constraints (e.g. where:{id:controlId, framework:{organizationId}}) so cross-org IDs return null in |
| `server/src/services/advanced/complianceDigitalTwinService.ts:327` | Simulation methods read frameworkControl/complianceFramework by ID without verifying organizationId ownership | simulateControlChange (L327), simulateAuditScenario (complianceFramework.findUnique L590), simulateControlRemoval (L690), and simulateControlModification (L757) |
| `server/src/services/advanced/graphNeuralNetworkService.ts:1118` | GNN model weights and TGN node memory are a global singleton shared across tenants | Namespace model weights, checkpoints, and TGN memory per organizationId (separate weight sets / per-org model dir / org-prefixed memory keys), or document that  |
| `server/src/services/advanced/neuroSymbolicAIService.ts:963` | performCausalReasoning loads frameworkControl by id only without verifying parent org | Filter by framework: { organizationId } (control has no direct orgId) or verify control.framework.organizationId === organizationId before use. |
| `server/src/services/advanced/regulatoryIntelligenceFabricService.ts:1494` | findContradictions queries complianceFramework by id-set without organizationId | Add organizationId to the where clause; the caller already has organizationId in scope. |
| `server/src/services/advanced/zeroTrustService.ts:500` | checkIPReputation reads DeviceTrust across all tenants (no organizationId scope) | Scope the cached-reputation lookup by organizationId, or store IP reputation in a dedicated org-agnostic cache (Redis) rather than reusing another tenant's Devi |
| `server/src/services/questionnaireService.ts:592` | exportQuestionnaire fetches by id with no organizationId scoping | Add an organizationId parameter and use findFirst({ where: { id: questionnaireId, organizationId } }) so a caller cannot export another tenant's questionnaire.  |

### incomplete-implementation (8)

| Location | Issue | Fix |
|---|---|---|
| `components/AIRMFAssessments.tsx:70` | Assessment delete only mutates local state, never persists to backend | Wire handleDelete to a real backend call. The sibling component AISystemDetails.tsx already uses api.aiRmf.deleteAssessment(assessment.id) (line 863) — call tha |
| `components/__tests__/PrivacyNoticeServing.test.tsx:73` | Test confirms PrivacyNoticeServing component ships with built-in mock data | Verify the PrivacyNoticeServing component renders live API data rather than hardcoded mock notices in production. If it uses inline mock data, wire it to the pr |
| `server/src/controllers/webhookController.ts:614` | Incoming webhook config storage not implemented (uses API key fallback) | Implement the documented per-organization incoming-webhook configuration model (with stored per-source HMAC secret) instead of the API-key fallback, so each inc |
| `server/src/graphql/schemas/typeDefs.ts:666` | Subscription type declared in schema but no resolvers implemented | The schema advertises 7 GraphQL subscriptions, but resolvers/index.ts contains only Query, Mutation, and field resolvers, and the HTTP-only graphqlMiddleware ca |
| `server/src/routes/anonymization.ts:29` | DSAR export anonymization endpoint is a stub that performs no work | This GDPR Recital 26 endpoint claims an anonymization job started but never loads the DSAR record, enqueues a job, or calls dataAnonymizationService. Wire it to |
| `server/src/services/advanced/livenessDetectionService.ts:186` | Anti-spoof liveness model silently uses random weights when weights file is missing | Ship/verify the weights file at startup and fail closed (or fall back to documented heuristics only) when absent; surface a health-check warning rather than inf |
| `server/src/services/advanced/mlModelsService.ts:1174` | evaluateModel never loads the trained model; returns KNN-on-test-set metrics with fabricated AUC | Persist and reload the actual tf model weights and run model.predict on the test set; compute real ROC-AUC from predicted probabilities, or remove the misleadin |
| `server/src/services/advanced/mlModelsService.ts:807` | Deepfake detection features are byte-hash pseudo-random values, not real media features | Extract real frame/audio features (e.g. via sharp/ffmpeg DCT/FFT) and ship/load trained weights, or gate this control behind a configured model and fail closed  |

### data-integrity (7)

| Location | Issue | Fix |
|---|---|---|
| `server/src/controllers/securityController.ts:170` | deleteZeroTrustPolicy / updateZeroTrustPolicy do not mutate the actual policy store | The handler returns success but the policy remains active in zeroTrustService's per-org store, so access decisions keep using the 'deleted' policy. Implement re |
| `server/src/controllers/securityController.ts:255` | Network segments and Zero Trust policies persisted only as auditLog rows (not a real table) | Using the immutable audit log as a mutable data store means 'updates' and 'deletes' never actually change the underlying object (getNetworkSegments returns ever |
| `server/src/routes/team.ts:84` | User and magic-link creation + audit log not wrapped in a transaction | Wrap the user.create + magicLink.create in prisma.$transaction() so an orphaned user without a valid invite token cannot be left behind. |
| `server/src/services/integrations/azureDevOpsService.ts:1088` | Work-item sync lookup uses substring `contains` on numeric work item id | Match the work-item id against a dedicated exact-match field (e.g. the `hash` column already stores it) instead of substring `contains` on the JSON `details` st |
| `server/src/services/integrations/jiraService.ts:721` | Webhook/sync record lookup uses substring `contains` on issue key, risking wrong-issue updates | Store the external key/id in a dedicated indexed column and match exactly, or serialize details so the key is delimited and match a delimited token, rather than |
| `server/src/utils/auditLogger.ts:11` | Audit-log integrity hash is non-deterministic (uses Date.now()+Math.random()) | Compute the hash deterministically over canonical log fields and chain it to the previous entry's hash (prevHash). Store enough to allow later verification; dro |
| `server/src/utils/auditLogger.ts:314` | CSV export uses naive row.join(',') with no quoting/escaping or formula-injection guard | Quote/escape each field (RFC 4180: wrap in double quotes, double internal quotes) and prefix values starting with =,+,-,@ with a single quote or tab to neutrali |

### incomplete-feature (4)

| Location | Issue | Fix |
|---|---|---|
| `components/EnvironmentalLifecycle.tsx:962` | Report action buttons (Download PDF / Preview / Export CSV) are non-functional | Wire each LCA report button to a real backend export endpoint (PDF/CSV generation) or a preview view. As-is, clicking them does nothing, presenting a broken fea |
| `components/ExecutiveDashboard.tsx:125` | Period comparison 'previous' values are always zero — comparison feature non-functional | The Quarterly/Annual period toggle re-fetches the same endpoint but no prior-period data is ever populated, so all 'vs last period' deltas render against zero ( |
| `mobile/src/screens/LoginScreen.tsx:185` | "Forgot your password?" button is non-functional (no onPress handler) | Wire the TouchableOpacity to a password-reset flow (navigate to a ForgotPassword screen or call the forgot-password API). As-is the control renders but does not |
| `mobile/src/screens/SettingsScreen.tsx:103` | Account/privacy actions are no-op handlers (Edit Profile, Change Password, 2FA, Data Export) | Multiple actionable settings rows have empty onPress handlers, so tapping them does nothing. Wire them to real navigation/flows or remove the rows; shipping sec |

### auth (4)

| Location | Issue | Fix |
|---|---|---|
| `server/src/controllers/securityController.ts:1208` | handleCICDWebhook has no auth guard and HMAC verification is delegated/optional | Confirm complianceAsCodeService.handleCIWebhook rejects on missing/invalid HMAC before any side effect; if the webhook route is unauthenticated (typical for CI  |
| `server/src/routes/sso.ts:170` | SAML claims extracted independently of the signed element (XML Signature Wrapping risk) | After checkSignature passes, confirm the signature's referenced element is the same Assertion node from which NameID/attributes are read (validate the URI refer |
| `server/src/routes/sso.ts:174` | SSO config selected by attacker-controlled Issuer with no fallback constraint | Require a non-null issuer match; reject (401) when issuer is missing rather than selecting an arbitrary enabled config, otherwise a SAMLResponse without an Issu |
| `server/src/services/advanced/zeroTrustService.ts:462` | Zero Trust location/IP/CIDR checks fail OPEN on error | In a Zero Trust posture these should fail closed (low/zero trust) or be configurable; default-deny on evaluation errors per the service's own stated 'Default: d |

### mock-or-static-data (3)

| Location | Issue | Fix |
|---|---|---|
| `components/AIComplianceCopilot.tsx:89` | Copilot Suggestions, Deadlines, and quick-action data are hardcoded constants presented as live compliance intelligence | The Suggestions tab and Deadlines tab render hardcoded org-specific data (specific control IDs, vendor names like 'CloudSync Analytics', risk scores, audit date |
| `components/AIFeatures/AgenticVendorRisk.tsx:1190` | 'Recently Generated Reports' list and report generation are hardcoded placeholders downloading fake files | Report cards' Generate buttons only flip local state after a 2s timer and 'Recently Generated Reports' are static fake entries that download a placeholder text  |
| `components/AIFeatures/AuditSimulator.tsx:121` | Simulation runs, findings, and dashboard stats are hardcoded constants presented as the org's real audit history | Only the New-Simulation flow and Mock Interview are wired to api.ai.auditSimulation. The Active/Results tabs, summary cards (Avg Readiness, Total Findings), and |

### incomplete-feature-/-unwired-ui (3)

| Location | Issue | Fix |
|---|---|---|
| `components/AccountDeletionWorkflow.tsx:114` | Execution tab systemDeletions state is never populated from any API | Wire systemDeletions to a backend endpoint (e.g. api.privacy.getDeletionExecution(requestId)) inside loadData or per-request, or remove the Execution tab until  |
| `components/AuditorHub.tsx:689` | Write actions in AuditorHub are non-functional stubs (Create Engagement, Upload Evidence, Request Proposal, New Workpaper, Submit/Approve) | Wire each mutating action to the corresponding /api/auditor/* endpoint, or disable/hide the buttons until backend support exists. The list views fetch live data |
| `components/CEMarkingWorkflow.tsx:1331` | Multiple CE workflow actions are non-functional stubs (Generate DoC, Download SVG/QR, document Download, Upload, Send Inquiry) | Implement these actions against the CE marking API (DoC generation, label/QR export, document download/upload, notified-body engagement) or disable the controls |

### partially-wired (2)

| Location | Issue | Fix |
|---|---|---|
| `components/DORADashboard.tsx:919` | DORA 'Add ICT Risk' modal submit does not persist — only closes modal | Wire the Add Risk submit to an api.dora.createAssessment/createRisk call with controlled form state, then reload risks. Currently the read path is API-backed bu |
| `components/DORADashboard.tsx:962` | DORA 'Report ICT Incident' modal submit does not persist — only closes modal | Bind the incident form to state and POST to the DORA incidents endpoint on submit, then reload. DORA Article 17-23 incident reporting is a primary feature of th |

### data-integrity-/-fabricated (2)

| Location | Issue | Fix |
|---|---|---|
| `components/RiskHeatMap.tsx:78` | Risk likelihood and impact randomized when backend omits them, mis-placing risks on the matrix | The 5x5 risk matrix cell placement, risk score (likelihood*impact), and level classification all depend on these values. Randomizing them produces a heat map an |
| `components/RiskHeatMap.tsx:83` | Risk trend is always random, driving a fabricated 'Trending Up' KPI | trend is never sourced from the backend; it is randomized for every risk on every fetch. The 'Trending Up' stat card and per-risk trend arrows are therefore mea |

### deployment (2)

| Location | Issue | Fix |
|---|---|---|
| `e2e/api-integration.spec.ts:90` | Test asserts GraphQL playground is publicly accessible (returns 200 HTML) | An exposed GraphQL playground/introspection UI is an information-disclosure surface if reachable in production. Confirm the playground is gated to development o |
| `infrastructure/lib/backend-stack.ts:143` | Production ECS task pins mutable ':latest' ECR image tag | Pass an immutable image tag (e.g. git SHA / semver) via stack prop or CDK context instead of the mutable 'latest' tag. With 'latest', deployments are non-determ |

### security (2)

| Location | Issue | Fix |
|---|---|---|
| `mobile/src/services/api.ts:53` | Certificate pinning is a no-op stub despite 'prevents MITM' claim | validateCertificatePin only verifies the configured pin strings are base64-shaped; it never compares against the server's actual cert (that requires react-nativ |
| `public/service-worker.js:170` | Authenticated API responses cached in Cache Storage without auth/no-store check | networkFirstStrategy caches all successful GET /api/ responses (which include org-scoped, authenticated data) into a persistent Cache Storage shared by the orig |

### security-tooling-/-false-assurance (2)

| Location | Issue | Fix |
|---|---|---|
| `server/src/__tests__/security/runPenetrationTest.ts:1391` | SSRF 'Internal Network Access Prevention' check always returns pass and ignores its own detection logic | The computed hasIpValidation/hasUrlValidation values are never used; the test hardcodes pass. Make the verdict depend on the detection result (fail/warn when no |
| `server/src/__tests__/security/runPenetrationTest.ts:1430` | SSRF 'DNS Rebinding Protection' check unconditionally returns pass with no analysis | This test performs no static or dynamic inspection and always passes. Either implement real verification (scan for user-controlled hostname resolution / outboun |

### auth/jwt-algorithm-pin (2)

| Location | Issue | Fix |
|---|---|---|
| `server/src/__tests__/unit/middleware/auth.test.ts:372` | Test confirms authenticate middleware calls jwt.verify with no algorithms pin | Verify the production middleware/auth.ts authenticate() passes { algorithms: ['HS256'] } to jwt.verify to prevent alg-downgrade/none attacks (COV-9). If source  |
| `server/src/__tests__/unit/middleware/auth.test.ts:543` | Test confirms verifyRefreshToken calls jwt.verify with no algorithms pin | Pin algorithms on the refresh-token jwt.verify call in middleware/auth.ts and update this assertion to include the options object. |

### credential-encryption (2)

| Location | Issue | Fix |
|---|---|---|
| `server/src/config/database.ts:37` | Transparent credential encryption only wraps the `integration` model; other credential-bearing models are not covered | encryptData/decryptRecord are only registered for the `integration` model. SSO config secrets, SCIM tokens, OAuth tokens, webhook secrets, and SMTP creds stored |
| `server/src/routes/ticketing.ts:228` | ServiceNow/Azure DevOps credentials forwarded to service from plaintext request body without verified at-rest encryption | Verify servicenowService/azureDevOpsService.saveIntegration call encryptField() on password/clientSecret/accessToken/refreshToken/pat before the Prisma write; i |

### crypto-weakness (2)

| Location | Issue | Fix |
|---|---|---|
| `server/src/services/advanced/evidenceTruthLayerService.ts:759` | Evidence signing falls back to an ephemeral keypair in non-production, producing unverifiable signatures | Always persist the generated keypair (encrypted) before returning, and fail the operation if persistence fails in all environments where signatures are retained |
| `server/src/services/advanced/federatedSwarmService.ts:407` | Differential-privacy Laplace/Gaussian noise generated with Math.random() | Draw noise from a CSPRNG (e.g. crypto.randomBytes-seeded uniforms, as already done in secureAggregation's boxMullerVector). Reuse that helper for all DP noise. |

### data-integrity-/-audit (2)

| Location | Issue | Fix |
|---|---|---|
| `server/src/services/advanced/vrCollaborativeReviewService.ts:1560` | completeTraining derives organizationId from sessionId.split('_')[0] — always the literal 'training' | Store organizationId on the TrainingProgress/VRTrainingSession record at start and read it back; do not parse it out of the synthetic sessionId. |
| `server/src/services/advanced/webrtcSignalingService.ts:1732` | WebRTC audit-log raw SQL inserts target non-existent AuditLog columns | Use prisma.auditLog.create with the real schema (action/details/userId/organizationId/hash/timestamp) instead of hand-written raw SQL referencing the wrong colu |

### in-memory-state (2)

| Location | Issue | Fix |
|---|---|---|
| `server/src/services/geminiService.ts:17` | AI rate limiter uses per-process in-memory Map, not shared store | Back the per-user Gemini rate limit with Redis (e.g. cacheService) so the 60/min cap holds across all server instances; the current Map resets on restart and is |
| `server/src/services/notificationService.ts:86` | User notification preferences cached in-process and never invalidated | Back the preference cache with Redis/cacheService with a short TTL, or invalidate the entry whenever notificationPreference is updated. At minimum, do not cache |

### ssrf (2)

| Location | Issue | Fix |
|---|---|---|
| `server/src/services/integrations/providers/providerFactory.ts:192` | Provider HTTP client builds outbound URLs from user-controllable credential fields without isUrlSafe() check | Before dispatching, resolve the final absolute URL and pass it through isUrlSafe()/isWebhookUrlSafe() (as servicenowService.ts and slackService.ts do), rejectin |
| `server/src/utils/urlValidator.ts:37` | SSRF allowlist bypassable via DNS rebinding and alternate IP encodings | Resolve the hostname (dns.lookup) and validate the resolved IP against private ranges before fetching; normalize/reject non-dotted-decimal IP literals. Pin the  |

### simulated-fake-work (1)

| Location | Issue | Fix |
|---|---|---|
| `components/AIFeatures/AgenticVendorRisk.tsx:826` | Per-vendor 'Run AI Assessment' button fakes completion with setTimeout and never calls the backend | The button shows 'Running...' then 'Assessment Complete' purely via a 2s timer; no api.ai.agenticVendorRisk or assessment API is invoked, misleading users into  |

### data-integrity-/-hardcoded-input (1)

| Location | Issue | Fix |
|---|---|---|
| `components/AIFeatures/NaturalLanguageQuery.tsx:266` | AI compliance query sends hardcoded frameworks + complianceScore instead of the org's real data | Fetch the organization's actual configured frameworks and current compliance score (e.g. via api.frameworks.list() / a dashboard/score endpoint) and pass those  |

### error-handling (1)

| Location | Issue | Fix |
|---|---|---|
| `components/AIFeatures/VendorScorer.tsx:13` | handleScore has no try/catch — error leaves spinner stuck and is swallowed | Wrap the await in try/catch/finally: set an error state on failure, always reset setLoading(false) in finally so a rejected scoreVendorRisk() does not permanent |

### access-control-/-data-exposure (1)

| Location | Issue | Fix |
|---|---|---|
| `components/AuditTrail.tsx:127` | Audit-log access restriction is enforced only client-side | Confirm the backend api.audit.list() filters by organizationId and (for non-admins) by userId server-side. Client-side filtering must not be the only control ov |

### security-/-misleading-credential (1)

| Location | Issue | Fix |
|---|---|---|
| `components/CICDGateSettings.tsx:412` | Webhook auth token is generated client-side and never persisted to the server | The UI presents this value as the 'Authentication Token' the operator must add as a GitHub webhook secret, but rotateToken only sets local React state and never |

### correctness-/-stale-data (1)

| Location | Issue | Fix |
|---|---|---|
| `components/ComplianceScoreForecasting.tsx:364` | overallProjected90 useMemo has empty dependency array but reads projections state | Add `projections` to the dependency array (matching overallCurrentScore at line 359 and overallProjected180 at line 369). As written it computes once against th |

### hardcoded-data (1)

| Location | Issue | Fix |
|---|---|---|
| `components/EvidenceCollectionRules.tsx:96` | Integration source connection status is hardcoded, not fetched from backend | Fetch real integration connection state from the integrations API. The static connected:true/false flags misrepresent which integrations are actually connected  |

### partially-wired-/-hardcoded-data (1)

| Location | Issue | Fix |
|---|---|---|
| `components/MDMDashboard.tsx:352` | MDM 'Recent Alerts' panel renders hardcoded fake alerts as live operational data | The Recent Alerts list (lines 352-368) is a static array with fabricated device/user names and relative timestamps, displayed in the Overview tab as if it were  |

### react-stale-closure (1)

| Location | Issue | Fix |
|---|---|---|
| `components/PrivacyManagementPlatform.tsx:298` | filteredSuppression useMemo omits `suppression` from dependency array | Add `suppression` to the dependency array. As written, when the suppression list loads from api.privacy.getSuppressionList() the memo does not recompute, so the |

### non-functional-ui (1)

| Location | Issue | Fix |
|---|---|---|
| `components/PrivacyManagementPlatform.tsx:543` | DSAR / retention / transfer action buttons have no onClick handlers | Wire these privacy-operations controls (verify identity, assign, mark complete, run purge, add transfer) to their api.privacy.* endpoints or remove them. As shi |

### non-functional-control (1)

| Location | Issue | Fix |
|---|---|---|
| `components/ProductLifecycleTracker.tsx:1324` | Primary action buttons (New Product, Export, Edit, ExternalLink, Download) have no handlers | New Product (1324), Export (1321), Edit (696), ExternalLink (699), and document View/Download buttons (1274-1279) render with no onClick. They are dead UI in a  |

### data-integrity-/-fabricated-trend (1)

| Location | Issue | Fix |
|---|---|---|
| `components/RealTimeAnalytics.tsx:436` | Compliance and control trend charts fabricate day-to-day variation with Math.random() | The 'Compliance Score Trend', export trend (line 331), and 'Control Status Over Time' growth/reduction factors (lines 525,548) invent historical data points by  |

### static-data-/-mock (1)

| Location | Issue | Fix |
|---|---|---|
| `components/RealTimeAnalytics.tsx:714` | "Real-time Activity" feed renders entirely hardcoded fake events | The ActivityFeed in a dashboard labeled "Real-time Analytics" / "Real-time Activity" shows 5 fabricated events with fixed relative timestamps. This misrepresent |

### mock-/-stub (1)

| Location | Issue | Fix |
|---|---|---|
| `components/RiskCanvas.tsx:277` | 'AI Copilot' chat is a simulated stub with hardcoded keyword responses, not a real AI call | The left-panel chat presents 'AI Copilot · Active' with a pulsing indicator but never calls any AI/backend endpoint; it returns canned branches via setTimeout.  |

### security/encryption (1)

| Location | Issue | Fix |
|---|---|---|
| `infrastructure/lib/cache-stack.ts:49` | ElastiCache Redis has no in-transit/at-rest encryption or AUTH token | Enable transitEncryptionEnabled (TLS) and atRestEncryptionEnabled, and set an authToken (from Secrets Manager) so session/job-queue data is encrypted and the ca |

### security/cors (1)

| Location | Issue | Fix |
|---|---|---|
| `infrastructure/lib/frontend-stack.ts:72` | Uploads S3 bucket CORS falls open to any origin when domainName is unset | Never fall back to '*' for a write-capable (PUT/POST) uploads bucket. Require domainName (or an explicit allowed-origins list) and fail the synth if unset, so p |

### frontend-backend-contract (1)

| Location | Issue | Fix |
|---|---|---|
| `mobile/src/services/api.ts:282` | Refresh response shape parsed inconsistently with login response | The login path reads result.data.token/result.data.refreshToken (envelope), while refresh reads data.accessToken/data.token at the root. Align both to the same  |

### bug (1)

| Location | Issue | Fix |
|---|---|---|
| `server/scripts/profile-queries.js:7` | path used before require — script throws ReferenceError on startup | Move `const path = require('path');` above the dotenv.config() call. As written, `path` is referenced on line 7 but only declared on line 9, so the script crash |

### weak-security-validation (1)

| Location | Issue | Fix |
|---|---|---|
| `server/scripts/validateEnv.ts:120` | ENCRYPTION_KEY validated at >=16 chars but AES-256 requires 32 bytes | AES-256 (used for 2FA secret / credential encryption) requires a 32-byte key. A 16-char key passes validation but is too short for the algorithm, causing silent |

### test-documents-auth-role-bug (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/__tests__/integration/api/acos.test.ts:1168` | JIT admin checks accept 200/403/500 due to known role case mismatch ('admin' vs 'Admin') | The test comment reveals the JIT controller compares role against lowercase 'admin' while the rest of the app uses 'Admin' (capitalized). This means privileged  |

### weak-assertion-masks-failures (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/__tests__/integration/api/acos.test.ts:537` | expectRouteExists accepts any non-404 status (including 500) as success | A route returning 500 (unhandled server error) passes these tests. Used across goals/control-loop/evidence/tgn/red-team/swarm/homomorphic cases (e.g. lines 557, |

### vacuous-test-(fully-mocked-controller) (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/__tests__/integration/api/aiRmf.test.ts:57` | Entire aiRmfController is mocked, so route tests assert nothing about real logic | Every test only verifies that the mock returns the literal object the mock was configured with (e.g. status:'Active', overallScore:78). The real controller, val |

### missing-input-validation (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/__tests__/integration/api/auth.test.ts:133` | Register endpoint does not validate email format (test confirms 400-or-500) | COV-5/T19: the register controller accepts a malformed email ('invalid-email') and only fails downstream at the DB layer (500). Add explicit email-format valida |

### tls/configuration (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/config/elasticsearch.ts:64` | Elasticsearch client TLS option key wrong for v9 client (ssl vs tls) — rejectUnauthorized silently ignored | @elastic/elasticsearch v9 expects the `tls` option, not `ssl`, for TLS/cert settings. Rename to `tls: config.ssl`. As written, ELASTICSEARCH_SSL_REJECT_UNAUTHOR |

### authorization (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/routes/enterprise.ts:228` | Questionnaire/issue mutating routes lack role authorization | Apply authorize('admin','editor') to PUT/DELETE questionnaire and PATCH/DELETE issue routes for consistency with the rest of the codebase where mutations are ro |

### stub-incomplete (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/routes/marketplace/marketplaceRoutes.ts:616` | Marketplace connection test does not actually test the connection | The comment claims 'Perform actual connection test' but the handler only reads the stored connected boolean and reports a near-zero latency from a no-op. Either |

### input-validation-/-mass-assignment (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/routes/privacy.ts:2275` | POST /notices spreads req.body directly into create with no validateBody and no field allowlist | Add validateBody() with a schema and use an explicit field allowlist (as the /jit-notices POST handler does). organizationId is forced correctly here so it is n |

### tier-enforcement (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/routes/team.ts:147` | Bulk invite bypasses maxUsers tier limit enforced on single invite | Add enforceLimit('maxUsers') to /bulk-invite, or check current user count against the tier limit inside the handler before creating users. |

### input-validation (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/routes/v2/batchRoutes.ts:308` | POST /api/v2/batch/frameworks has no validateBody schema | Add a batchFrameworksSchema with Joi field validation and apply validateBody before the handler, consistent with the other three batch routes. |

### webhook-hmac (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/routes/webhooks.ts:154` | Incoming webhook HMAC computed over JSON.stringify(req.body), not raw body | Verify the HMAC against the actual raw request body captured via express.raw()/verify buffer, not a re-serialization of the parsed JSON. |

### credential-exposure (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/services/advanced/ldapPermissionService.ts:836` | LDAP simple-bind sends bind password in cleartext when TLS defaults off | Default useTLS to true (LDAPS) or enforce StartTLS before bind; refuse to bind with a non-empty password over a non-TLS socket. Reject an empty bind password in |

### background-job-/-in-memory-state (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/services/advanced/regulatoryIntelligenceFabricService.ts:2352` | Regulatory feed retry uses in-memory setTimeout, lost on restart | Enqueue the retry on the durable jobQueue (BullMQ) with bounded attempts + backoff instead of setTimeout. |

### concurrency/correctness (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/services/integrations/googleService.ts:27` | Shared OAuth2Client instance mutated per-request causes credential cross-talk | Construct a fresh `new google.auth.OAuth2(...)` per request (or per org) inside each method rather than mutating a shared instance, so concurrent multi-tenant c |

### incomplete-validation (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/services/integrations/patValidationService.ts:879` | Several PAT validators return valid:true on format check only without verifying the credential | Either perform an actual authenticated probe (gated by isUrlSafe) for these providers, or have them return a distinct 'unverified/format-only' status so a malfo |

### data-integrity/injection (1)

| Location | Issue | Fix |
|---|---|---|
| `server/src/utils/csvExport.ts:277` | streamToCsv bypasses cell escaping used by convertToCSV | Reuse the formatCell escaping logic (quote-wrap and double internal quotes) in the streaming path so streamed exports are valid CSV. |

### data-privacy (1)

| Location | Issue | Fix |
|---|---|---|
| `services/piiService.ts:22` | PII 'air gap' redaction misses many PII types and has weak regex coverage | Document the limited scope explicitly, or expand detection (named-entity detection, more formats) and add Luhn validation for CC. Do not rely on this alone as a |

---

## §4 LOW severity findings

216 findings (code quality, hygiene, maintainability).

| Category | Count |
|---|---:|
| test-quality | 81 |
| data-integrity | 8 |
| error-handling | 6 |
| multi-tenant-isolation | 6 |
| logging | 5 |
| incomplete-feature | 4 |
| partially-wired | 4 |
| dead-code | 4 |
| static/placeholder-display-data | 4 |
| hardcoded-ui-data | 3 |
| hardcoded-data | 3 |
| input-validation | 3 |
| non-functional-control | 3 |
| correctness | 3 |
| input-integrity-/-multi-tenant | 3 |
| maintainability | 2 |
| fake/simulated-behavior | 2 |
| quality | 2 |
| incomplete-implementation | 2 |
| test-quality-/-conditional-assertion | 2 |
| test-quality-/-vacuous-assertion | 2 |
| deployment | 2 |
| reliability | 2 |
| configuration | 2 |
| injection | 2 |
| deployment-config | 2 |
| crypto-correctness | 2 |
| ssrf | 2 |
| ui-state-correctness | 1 |
| dead-code-/-mock-reference | 1 |
| simulated-fake-work | 1 |
| state-management-anti-pattern | 1 |
| non-functional-ui | 1 |
| swallowed-error-/-incomplete-input | 1 |
| data-integrity-/-optimistic-ui | 1 |
| misleading-security-indicator | 1 |
| dev-fallback-data | 1 |
| incomplete-feature-/-unwired-ui | 1 |
| dead-ui-/-incomplete-wiring | 1 |
| stub-/-placeholder-behavior | 1 |
| mock-data | 1 |
| logic-/-race-condition | 1 |
| partially-wired-/-hardcoded-data | 1 |
| incomplete-ui | 1 |
| accessibility | 1 |
| robustness | 1 |
| swallowed-error | 1 |
| local-only-state | 1 |
| static-data | 1 |
| resource-/-spurious-writes | 1 |
| dead-state-/-tier-bypass | 1 |
| non-functional-control-/-misleading-ui | 1 |
| hardcoded-secret-literal | 1 |
| display-bug | 1 |
| logging/error-handling | 1 |
| code-quality | 1 |
| reliability/config | 1 |
| config | 1 |
| bug | 1 |
| env-validation-coverage | 1 |
| contract-mismatch | 1 |
| weak-assertion | 1 |
| weak-assertion-masks-failures | 1 |
| conditional-assertion-can-no-op | 1 |
| webhook-handler-not-exercised | 1 |
| test-maintainability | 1 |
| security-tooling-/-metrics-integrity | 1 |
| tls/configuration | 1 |
| security | 1 |
| performance | 1 |
| pii-in-logs | 1 |
| xss | 1 |
| error-handling-/-observability | 1 |
| migration | 1 |
| background-job | 1 |
| incomplete-impl | 1 |
| background-jobs | 1 |
| in-memory-state | 1 |

<details><summary>Expand full LOW finding list</summary>

| Location | Issue |
|---|---|
| `components/Onboarding/OnboardingModal.tsx:30` | Comment claims focus trap but only sets initial focus; Tab can escape the modal |
| `server/src/services/advanced/redTeamService.ts:1355` | Scheduled red-team scan job has attempts but no backoff or dead-letter |
| `server/src/services/webhookService.ts:486` | Webhook retry scheduled via in-memory setTimeout — lost on process restart |
| `server/scripts/security-audit.js:27` | Vulnerability count uses wrong npm audit JSON field |
| `components/hubs/ReportingCenter.tsx:1` | Unused imports useState and Suspense |
| `server/src/__tests__/integration/api/auth.test.ts:457` | 'should require 2FA for enabled accounts' only asserts inside an if(status===200) block |
| `server/prisma.config.ts:10` | Fail-open default DATABASE_URL masks a missing env var |
| `server/src/config/index.ts:143` | Default Gemini model name 'gemini-3.5-pro' may not be a valid model identifier |
| `server/src/services/advanced/blockchainService.ts:214` | Ethereum provider falls back to a placeholder Alchemy RPC URL containing 'your-api-key' |
| `server/src/__tests__/contracts/routes/ticketing.contract.test.ts:246` | Webhook route path appears malformed (webhook:provider, no slash) and test asserts on it |
| `server/src/blockchain/scripts/contractInteraction.ts:421` | verifyCertificate sends a real state-changing tx then re-fetches via staticCall, double-executing |
| `server/src/services/advanced/zeroKnowledgeService.ts:325` | snarkjs.groth16.fullProve called with base64 strings instead of file path/buffer |
| `server/src/services/advanced/zeroTrustService.ts:1093` | loadPolicies JSON.parse(policy.rules) but createPolicy stores rules as JSON.stringify(array); evaluation expects array |
| `server/src/services/advanced/blockchainService.ts:454` | Hyperledger ECDSA signer comment claims IEEE P1363 but produces DER signature |
| `server/src/services/advanced/blockchainService.ts:457` | Hyperledger signer comment states IEEE P1363 raw signature but actually returns DER-encoded signature |
| `components/IncidentManagement.tsx:395` | deleteIncident removes from local state even when server DELETE fails |
| `components/StatusPage.tsx:329` | Overall uptime and service count derived from static array, not from live /api/health data |
| `mobile/src/screens/IssuesScreen.tsx:313` | Comment optimistically appended to local state without using server response |
| `server/src/routes/regulatoryChanges.ts:447` | Regulatory change CREATE always inserts a placeholder impact with controlId 'pending-review' |
| `server/src/services/advanced/complianceDigitalTwinService.ts:199` | Simulation falls back to a synthetic temp scenario ID when DB persistence fails, returning a result tied to no real record |
| `server/src/services/advanced/dp/budgetLedger.ts:68` | checkBudget()/commitSpend() are non-atomic — concurrent DP rounds can both pass the budget gate |
| `server/src/services/integrations/jiraService.ts:748` | Pulled Jira issues created with createdById:'system' (non-existent user reference) |
| `server/src/services/visionaryAIService.ts:73` | Compliance-rate computation divides by controls.length without zero guard (NaN) |
| `components/AssetManagement.tsx:288` | deleteAsset removes the asset from local state even when the API DELETE fails |
| `components/Onboarding/OnboardingCelebration.tsx:2` | Unused Share2 import |
| `components/PaymentModal.tsx:22` | Unused card-input state (cardNumber/expiry/cvc) and formatCard helper |
| `server/src/routes/dpia.ts:74` | Dead computation with self-documenting confusion comment |
| `server/src/services/advanced/federatedSwarmService.ts:829` | federatedAveraging fabricates model weights from hardcoded constants and is unused |
| `components/AIComplianceCopilot.tsx:527` | getMockFallbackResponse / MOCK_RESPONSES defined but no longer used in the fallback path |
| `components/Reports.tsx:94` | savedReportsCount never updated, so report tier limit never enforced |
| `components/ComplianceScoreForecasting.tsx:1487` | Header 'Refresh Forecast' button has no onClick; handleRefreshForecast is never invoked |
| `infrastructure/lib/backend-stack.ts:135` | CloudWatch log group uses RemovalPolicy.DESTROY |
| `infrastructure/lib/backend-stack.ts:188` | Internet-facing ALB serves plaintext HTTP when no ACM certificate is provided |
| `server/src/services/advanced/blockchainService.ts:214` | Placeholder Ethereum RPC URL fallback default |
| `services/storage.ts:10` | Production detection relies solely on hostname heuristic |
| `components/AuditorHub.tsx:121` | Large hardcoded demo arrays render when the API returns empty/errors |
| `components/Settings.tsx:899` | Profile Role field hardcoded to 'Administrator' |
| `server/scripts/validateEnv.ts:108` | validateEnv omits security-critical vars required elsewhere |
| `e2e/fixtures/test-fixtures.ts:76` | console.log used for error reporting in shared fixture |
| `mobile/src/contexts/AuthContext.tsx:226` | refreshUser silently swallows errors with empty catch |
| `server/src/controllers/featureModulesController.ts:312` | List handlers swallow errors and return [] masking real failures |
| `server/src/routes/branding.ts:236` | S3 upload failure silently falls back to inline base64 data URI |
| `server/src/routes/sod.ts:33` | Dashboard/list catch blocks swallow errors and return empty success payloads |
| `server/src/routes/sox.ts:33` | Dashboard/list catch blocks swallow errors and return empty default payloads |
| `server/src/routes/mdm.ts:33` | MDM read endpoints swallow errors and return empty/zeroed fallback data |
| `components/AccountDeletionWorkflow.tsx:1009` | Refresh button simulates loading with setTimeout instead of reloading data |
| `components/BreachNotificationWizard.tsx:548` | Submission reference number is randomly generated client-side rather than returned by the regulator/API |
| `components/AIFeatures/RegulatoryAutoRemediation.tsx:1086` | RIF status banner shows hardcoded '47 sources / 12 jurisdictions' instead of live counts |
| `components/ESGReportingModule.tsx:444` | ESG overall/category scores are hardcoded despite metrics being API-driven |
| `components/EnvironmentalLifecycle.tsx:977` | Comparative LCA section shows fully hardcoded comparison values |
| `components/SecurityFeatures.tsx:654` | ZK credential/ownership proof generation passes literal 'user-secret-key' |
| `components/AIFeatures/EvidenceCompletenessChecker.tsx:594` | "AI-Recommended Priority Actions" list is hardcoded while the rest of the component is API-backed |
| `components/AIFeatures/NaturalLanguageQuery.tsx:433` | Hardcoded counts displayed as if reflecting live org data |
| `components/AIFeatures/TimelineCard.tsx:216` | Timeline card hardcodes year 2026 in due-date label (NaturalLanguageQuery.tsx) |
| `server/src/services/workflowEngine.ts:138` | Per-org workflow action rate limiter is in-memory (Map), not Redis-backed |
| `components/AIFeatures/RegulatoryAutoRemediation.tsx:800` | Start Task / Edit / Reassign actions only mutate local component state, never persist to backend |
| `components/ExecutiveDashboard.tsx:136` | Incident Trends chart labeled '6 Months' renders only a single 'Current' bucket |
| `mobile/src/screens/SettingsScreen.tsx:129` | Notification and biometric toggles are local-only and not persisted |
| `mobile/src/screens/VendorsScreen.tsx:226` | 'Add Vendor' empty-state action is a no-op |
| `components/BreachNotificationWizard.tsx:1325` | Template/contact creation and letter copy/download/edit buttons are non-functional |
| `server/src/services/questionnaireService.ts:695` | DOCX export reads q.question/q.options/q.answer fields that do not exist on QuestionnaireQuestion |
| `components/SignupPage.tsx:224` | 'Resend verification email' button has no handler |
| `server/src/services/monitoringService.ts:218` | Auto-remediation reports actions as Applied/triggered but performs no actual remediation |
| `components/NotificationCenter.tsx:296` | Notification 'preferences' footer button is non-functional |
| `server/src/controllers/demoController.ts:551` | Unescaped user input interpolated into HTML notification email |
| `server/src/utils/csvExport.ts:57` | CSV formula injection not mitigated in any export path |
| `server/src/routes/controlEffectiveness.ts:418` | Create effectiveness assessment does not verify body-supplied controlId belongs to the org |
| `server/src/routes/controlTesting.ts:300` | Create control test does not verify body-supplied controlId belongs to the org |
| `server/src/routes/controlTesting.ts:352` | PATCH control test allows reassigning controlId to an arbitrary/foreign control without org verification |
| `components/ComplianceCalendar.tsx:160` | Calendar deadline create/edit sends raw form to API with no client-side validation beyond title/dueDate presence |
| `server/src/routes/sod.ts:77` | GET routes read req.params.id without validateQuery/param validation |
| `server/src/validators/aiRmfSchemas.ts:19` | updateAISystemSchema forces name as required on PATCH/PUT |
| `components/ProductLifecycleTracker.tsx:469` | Uploaded documents are stored only in local component state, never persisted |
| `components/ACOSDashboard.tsx:2361` | console.warn used in VR session health-check path despite logger being imported |
| `components/AIFeatures/BCPGenerator.tsx:116` | console.warn used despite logger being imported |
| `components/AIFeatures/ContractAnalyzer.tsx:84` | console.warn used in frontend component instead of logger |
| `contexts/WebSocketContext.tsx:65` | console.warn used in frontend WebSocket error handler |
| `infrastructure/secrets/rotation-lambda/index.ts:54` | Rotation Lambda logs secret identifier and rotation step via console.log |
| `components/SoDAnalysisDashboard.tsx:404` | console.warn used in frontend catch blocks instead of logger; mutation failures silently swallowed in UI |
| `components/IssueManagement.tsx:262` | Newly created issue is assigned by re-listing and picking index [0] as 'newest' |
| `components/AIFeatures/RegulatoryAutoRemediation.tsx:1101` | Globe icon re-implemented inline instead of imported from lucide-react |
| `server/src/data/frameworks/iso27001Controls.ts:1` | Duplicate FrameworkControlTemplate interface definition |
| `server/src/routes/securityTraining.ts:268` | List training modules silently returns empty data when the table is missing |
| `components/AuditTrail.tsx:87` | verifyHash performs format/recompute that cannot actually verify server hashes |
| `components/Dashboard.tsx:350` | Dashboard compliance-score trend indicator is hardcoded '+4%' |
| `server/src/routes/bia.ts:182` | Reverse-dependency lookup not org-scoped |
| `server/src/services/advanced/acosService.ts:1932` | updateControlLoopMetrics updates by id after org-scoped existence check |
| `server/src/services/advanced/physicalAIService.ts:1267` | detectAnomalies / measureNetworkLatency / measureSignalStrength / checkFirmwareVersion look up ioTDevice by deviceId only |
| `server/src/services/advanced/vrCollaborativeReviewService.ts:1165` | VR content mutators (addAnnotation/editAnnotation/deleteAnnotation/sendChatMessage/addVoiceAnnotation/enableScreenSharing/joinVoiceChat) take userId but not organizationId |
| `server/src/services/multiWorkspaceService.ts:126` | getConsolidatedMetrics/getOrganizationHierarchy lack explicit caller-org assertion |
| `server/src/services/riskManagementService.ts:74` | addRiskToAssessment links risk to assessmentId without verifying parent assessment's org |
| `components/ProductDecommissioning.tsx:800` | 'Create Notification' button has no handler |
| `components/SOXComplianceDashboard.tsx:275` | Control row Edit button has no handler |
| `components/SSOSettings.tsx:561` | Metadata URL 'Fetch' button has no handler |
| `components/RiskHeatMap.tsx:199` | 'Target View' toggle only changes a heading, shows identical current data |
| `components/AIReportGenerator.tsx:144` | Report Refresh and Export/Download buttons have no onClick handlers |
| `components/DORADashboard.tsx:463` | DORA risk/incident/provider/test Edit and Delete buttons are inert |
| `components/DORADashboard.tsx:672` | DORA 'Add Provider', 'Schedule Test', 'Export Report' buttons have no handlers |
| `components/DPIAWorkflow.tsx:481` | DPIA overview row 'Edit' button has no handler |
| `components/DigitalProductPassport.tsx:1293` | DPP QR code 'Download PNG'/'Download SVG' buttons are non-functional |
| `components/NIS2Dashboard.tsx:792` | NIS2 compliance checklist items have hardcoded done states not derived from data |
| `server/src/middleware/csrf.ts:92` | RedisTokenStore opens and tears down a new Redis connection on every CSRF operation |
| `server/src/middleware/monitoring.ts:59` | Request path logged at info level for every request includes full path (may contain IDs) |
| `components/IntegrationModal.tsx:582` | Generic setError overwrites the specific GCP error message in handleServiceAccountConnect |
| `server/scripts/load-test.js:35` | Load test uses a hardcoded fake bearer token |
| `mobile/src/services/api.ts:314` | setTokens promise not awaited inside login |
| `server/src/jobs/azureSyncJob.ts:51` | Scheduled Azure sync uses in-memory setInterval with no DLQ or bounded retry |
| `infrastructure/secrets/rotation-lambda/index.ts:331` | DB rotation falls back to hardcoded admin/app usernames when env/secret values are missing |
| `components/RealTimeAnalytics.tsx:80` | 5-second polling writes metrics to backend on every tick |
| `components/Onboarding/OnboardingTierBadge.tsx:42` | Tier badge dereferences config without guarding against unknown tier value |
| `server/src/controllers/securityController.ts:641` | BYOK Vault key creation falls back to process.env.VAULT_TOKEN when caller omits token |
| `server/src/__tests__/security/runPenetrationTest.ts:2239` | Pass-rate scorecard is inflated by hardcoded-pass checks |
| `components/AIFeatures/AuditSimulator.tsx:413` | Pause/Stop/Resume/Re-run and remediation controls only mutate local Sets, never persisting or affecting a real simulation |
| `server/src/services/integrations/patValidationService.ts:214` | A few validators build outbound URL from user baseUrl validated only at host level, no final-URL assertSafeOutbound |
| `server/src/utils/urlValidator.ts:108` | safeFetch validates redirect target but only one hop |
| `components/AIFeatures/CrossFrameworkMapper.tsx:211` | Module-scope mutable arrays used as data store, mutated inside a component effect |
| `components/RealTimeAnalytics.tsx:536` | Control 'Failed' trend falls back to hardcoded [50,45,40,23] when no framework data |
| `components/SBOMManager.tsx:1047` | SBOM comparison panel shows hardcoded diff (+12 / -3 / 8) |
| `components/SBOMManager.tsx:535` | CRA compliance banner shows hardcoded '67% Ready' progress |
| `components/SOXComplianceDashboard.tsx:219` | Hardcoded 'Upcoming Deadlines' in SOX overview |
| `components/SOXComplianceDashboard.tsx:429` | Quarterly Certification Readiness and Available Reports are static; Export buttons inert |
| `components/ComplianceScoreForecasting.tsx:440` | Export Report button only toggles a spinner for 2s and produces no output |
| `components/ProcessMapper.tsx:403` | saveToBackend swallows save failures with no logging or user feedback |
| `components/AccountDeletionWorkflow.tsx:392` | Create deletion request submits only a status and silently swallows errors |
| `server/src/__tests__/integration/api/childConsent.test.ts:53` | childConsent test uses a hand-rolled local prismaMock instead of the shared mock |
| `App.test.tsx:62` | App smoke test only asserts the component is a function; it never renders the app |
| `components/Onboarding/__tests__/OnboardingHint.test.tsx:12` | Conditional assertion may silently pass without testing |
| `components/Onboarding/__tests__/OnboardingModal.test.tsx:12` | onClose assertion guarded by if, can pass without exercising close |
| `components/Onboarding/__tests__/OnboardingTooltip.test.tsx:127` | fireEvent and assertions placed inside waitFor callback |
| `components/__tests__/AccessibilitySettings.test.tsx:40` | Toggle tests have no assertions and silently pass when element absent |
| `components/__tests__/AccessibilitySettings.test.tsx:76` | 'persists settings to localStorage' test asserts nothing |
| `components/__tests__/AccessibilitySettings.test.tsx:87` | 'loads saved settings from localStorage' test has no assertion |
| `components/__tests__/AccountDeletionWorkflow.test.tsx:34` | Multiple tests assert only that document.body is non-empty |
| `components/__tests__/AccountDeletionWorkflow.test.tsx:45` | onBack test only asserts inside a conditional that may never run |
| `components/__tests__/AuditPrepAssistant.test.tsx:57` | onBack test assertion is conditional and can be skipped |
| `components/__tests__/ComplianceScoreForecasting.test.tsx:32` | Tests rely on built-in mock/static data and assert only truthiness |
| `components/__tests__/DMAGatekeeperManagement.test.tsx:11` | Tautological assertions provide no real coverage |
| `components/__tests__/DORADashboard.test.tsx:60` | Most assertions only check non-empty body content |
| `components/__tests__/DPIAWorkflow.test.tsx:74` | Smoke-only assertions do not validate DPIA workflow |
| `components/__tests__/DSAPlatformManagement.test.tsx:12` | Tautological assertions provide no real coverage |
| `components/__tests__/ExceptionManagement.test.tsx:81` | Multiple tests pass vacuously when target element is absent |
| `components/__tests__/GlobalSearch.test.tsx:46` | Input-driven tests skip assertions when input is null |
| `components/__tests__/GovernanceManager.test.tsx:53` | Tabs/search/detail tests assert nothing on the null branch |
| `components/__tests__/IncidentManagement.test.tsx:86` | Filter/tab/delete tests have no assertion when control not found |
| `components/__tests__/MDMDashboard.test.tsx:51` | Conditional-guard tests pass even when target elements never render |
| `components/__tests__/MaturityAssessment.test.tsx:40` | Vacuous tests assert nothing meaningful and silently no-op when UI is absent |
| `components/__tests__/NIS2Dashboard.test.tsx:70` | Tests assert only that DOM is non-empty, not actual behavior |
| `components/__tests__/PostMarketSurveillance.test.tsx:49` | Conditional interactions make several tests no-ops when elements are absent |
| `components/__tests__/PrivacyManagementPlatform.test.tsx:83` | API-error test does not await async rendering or assert error handling |
| `components/__tests__/PrivacyNoticeServing.test.tsx:16` | PrivacyNoticeServing test does not mock the API service, so data wiring is unverified |
| `components/__tests__/ProductLifecycleTracker.test.tsx:48` | Multiple ProductLifecycleTracker tests have assertions guarded by if() with no else, making them no-ops |
| `components/__tests__/QuestionnaireManagement.test.tsx:93` | QuestionnaireManagement suite has only 3 shallow render tests asserting generic text |
| `components/__tests__/RegulatoryChangeTracker.test.tsx:106` | RegulatoryChangeTracker detail-view assertions are skipped when no clickable row exists |
| `components/__tests__/ReportBuilder.test.tsx:80` | ReportBuilder section/export tests use toBeGreaterThanOrEqual(0) which can never fail |
| `components/__tests__/RoPAManagement.test.tsx:47` | onBack test is a no-op when back button is absent |
| `components/__tests__/RoleManager.test.tsx:46` | Conditional-click tests assert nothing and always pass |
| `components/__tests__/RoleManager.test.tsx:64` | toBeGreaterThanOrEqual(0) assertion can never fail |
| `components/__tests__/SBOMManager.test.tsx:55` | Tab-switch and detail-view tests have no assertions |
| `components/__tests__/SCIMSettings.test.tsx:35` | fetch mock cast to any without spying may rely on global fetch being pre-stubbed |
| `components/__tests__/SecurityTrainingDashboard.test.tsx:45` | Several training-dashboard tests fire events without verifying outcome |
| `components/__tests__/SoDAnalysisDashboard.test.tsx:38` | onBack click test silently passes if back button is absent |
| `components/__tests__/SoDAnalysisDashboard.test.tsx:57` | Assertions only check document.body.textContent is truthy |
| `components/__tests__/USPrivacyTracker.test.tsx:70` | API-error test asserts only that the DOM is non-empty |
| `components/__tests__/WorkflowAutomationRules.test.tsx:52` | Conditional/no-op test assertions provide no regression coverage |
| `components/__tests__/WorkflowBuilder.test.tsx:45` | Tab/builder tests interact conditionally with no assertions |
| `components/__tests__/hubs/EvidenceHub.test.tsx:13` | Evidence Detail tab is mocked and label-asserted but never exercised by a switch test |
| `e2e/accessibility.spec.ts:17` | Tautological accessibility assertion always passes |
| `e2e/accessibility.spec.ts:46` | Button accessible-name check capped at 10 and conditional on visibility |
| `e2e/ai-features.spec.ts:104` | CSRF presence captured but never asserted in AI form submission test |
| `e2e/api-database-verification.spec.ts:134` | Only DELETE test has an unconditional assertion; others can no-op |
| `e2e/api-database-verification.spec.ts:37` | Database-verification assertions gated behind if(response.ok()) — silently skip on 401 |
| `e2e/asset-management.spec.ts:216` | CSRF assertion passes trivially when no mutation fires |
| `e2e/asset-management.spec.ts:36` | CRUD tests no-op when controls are absent (no failure on missing UI) |
| `e2e/audit-prep.spec.ts:230` | Authentication test asserts nothing meaningful about auth |
| `e2e/comprehensive-e2e.spec.ts:32` | Hardcoded fallback test credentials in spec |
| `e2e/comprehensive-e2e.spec.ts:81` | DB verification branch silently skipped when client unavailable |
| `e2e/incident-management.spec.ts:109` | Conditional assertion can silently pass without exercising the path |
| `e2e/issue-questionnaire.spec.ts:36` | Test body fully wrapped in isVisible guard yields vacuous pass |
| `e2e/security/comprehensive-security.spec.ts:209` | Clickjacking test uses expect(protected_ \|\| true) which can never fail |
| `e2e/security/comprehensive-security.spec.ts:21` | Security header tests are no-ops when the header is absent (if-guarded assertions) |
| `e2e/security/security-compliance.spec.ts:108` | Tier-gating test asserts a tautology, never validates blocking |
| `e2e/security/security-compliance.spec.ts:124` | RBAC admin-function test never asserts the access decision |
| `e2e/team-management.spec.ts:236` | Viewer-role RBAC test asserts expect(true).toBeTruthy() and verifies nothing |
| `e2e/workspace-management.spec.ts:170` | Workspace isolation test asserts a constant, never verifies scoping |
| `e2e/workspace-management.spec.ts:91` | CSRF-on-POST test only asserts when the header already exists |
| `server/src/__tests__/contracts/routes/assets.contract.test.ts:100` | Contract tests do not assert multi-tenant (organizationId) scoping |
| `server/src/__tests__/contracts/routes/auditor.contract.test.ts:12` | Auditor contract test mocks DB as empty object and stubs entire service, so org-scoping/data behavior is never exercised |
| `server/src/__tests__/contracts/routes/bia.contract.test.ts:211` | Dependency create test does not assert the dependsOn process belongs to caller org |
| `server/src/__tests__/contracts/routes/controlEffectiveness.contract.test.ts:146` | Create-assessment test does not verify parent control (controlId) org ownership |
| `server/src/__tests__/contracts/routes/controlTesting.contract.test.ts:22` | Mocked authorize middleware does not enforce roles, so RBAC is never exercised |
| `server/src/__tests__/contracts/routes/costs.contract.test.ts:22` | Mocked authorize stub bypasses role checks; mutating cost endpoints not verified for RBAC |
| `server/src/__tests__/contracts/routes/dashboards.contract.test.ts:21` | Mocked authorize ignores roles; dashboard ownership/role enforcement not exercised |
| `server/src/__tests__/contracts/routes/evidenceCollection.contract.test.ts:22` | Mocked authorize does not check roles; no 403 coverage for write endpoints |
| `server/src/__tests__/contracts/routes/marketplace.contract.test.ts:16` | Placeholder contract test always passes (no real coverage) |
| `server/src/__tests__/contracts/validators/billingSchemas.contract.test.ts:168` | Tautological assertion makes 'reject non-boolean immediate' test vacuous |
| `server/src/__tests__/e2e/graphql-flow.test.ts:98` | Weak assertion comment acknowledges ambiguous status handling for unknown fields |
| `server/src/__tests__/e2e/risk-management-flow.test.ts:177` | Test tolerates HTTP 500 as a passing outcome, masking real server errors |
| `server/src/__tests__/security/input-validation-security.contract.test.ts:75` | Input-validation security test mocks auth and uses permissive assertions (status != 500) |
| `server/src/__tests__/security/owasp-top10.contract.test.ts:87` | OWASP A08/A09 tests assert only that a mock is defined, not that audit/security logging occurs |
| `server/src/__tests__/security/rate-limiting.contract.test.ts:65` | Rate-limiting 'contract' test exercises freshly-built inline limiters, not the imported production limiters |
| `server/src/__tests__/unit/routes/billing.test.ts:4` | Router unit tests mock auth/validation, so they assert route shape only — not security behavior |
| `server/src/__tests__/unit/services/advanced/complianceAsCodeService.test.ts:167` | process.env.NODE_ENV mutated without try/finally — leaks on assertion failure |
| `server/src/__tests__/unit/services/advanced/swarmTaskAllocationService.test.ts:156` | Test 'should reject self-dependent tasks' does not test self-dependency |
| `server/src/__tests__/unit/services/soxService.test.ts:429` | createSOXTestResult tested without organizationId on a child-entity write |
| `server/src/__tests__/unit/services/stripeService.test.ts:1199` | "Concurrent tier changes" test cannot detect a race condition |
| `server/src/__tests__/unit/services/twoFactorService.test.ts:142` | 2FA secret decryption tests monkey-patch crypto and never exercise GCM auth-tag integrity |
| `e2e/privacy-management.spec.ts:113` | DPIA CSRF check only asserts when POST already carried token |
| `e2e/questionnaire.spec.ts:117` | CSRF-on-POST check is skipped when no POST fires |
| `e2e/privacy-management.spec.ts:208` | Cookie banner test always passes regardless of behavior |
| `e2e/questionnaire.spec.ts:224` | Reviewer approve/reject test asserts nothing meaningful |
| `server/src/config/database.ts:93` | DB TLS rejectUnauthorized=true in production with no CA configured will fail against self-signed certs |
| `App.tsx:200` | Optimistic framework add uses placeholder id 'temp' before server create |
| `server/src/__tests__/contracts/routes/ticketing.contract.test.ts:249` | Webhook test accepts error statuses, masking handler failures |
| `server/src/__tests__/integration/api/auth.test.ts:286` | Refresh-token test accepts 200/401/403/500 — only verifies route is mounted |
| `server/src/__tests__/integration/api/billing.test.ts:28` | Stripe webhook handler is mocked and never tested for HMAC signature verification |
| `server/src/routes/branding.ts:29` | Branding upload allows image/svg+xml which can embed scripts and is stored unsanitized |

</details>

---

## §5 INFO notes

48 informational notes (no action required for production).

<details><summary>Expand INFO list</summary>

| Location | Note |
|---|---|
| `components/AIFeatures/DataMapper.tsx:2` | Unused geminiService import (mapGDPRData) |
| `components/AIFeatures/GapAnalysis.tsx:2` | Unused geminiService import (performGapAnalysis) |
| `components/AIFeatures/PhishingGenerator.tsx:2` | Unused geminiService import (generatePhishingSim) |
| `components/AIFeatures/RFPResponder.tsx:2` | Unused geminiService import (generateRFPResponse) |
| `components/PrivacyManagementPlatform.tsx:253` | Hardcoded avgResponseDays and 'Last sync: 3 min ago' |
| `components/SecurityTrainingDashboard.tsx:337` | Employee view 'My Trainings' shows all assignments without client-side user filter |
| `components/StatusPage.tsx:144` | 90-day uptime history is randomly generated client-side |
| `components/WorkflowBuilder.tsx:658` | Builder tab Preview/Test Run buttons and node editing are local-state only with no persistence |
| `components/WorkflowBuilder.tsx:838` | Automation Rules 'New Rule', Edit, and Delete buttons have no handlers |
| `components/__tests__/CookieConsentBanner.test.tsx:49` | Conditional clicks make several tests no-op when buttons are absent |
| `components/__tests__/ExecutiveDashboard.test.tsx:78` | Assertion only checks document body is non-empty |
| `components/__tests__/PaymentModal.test.tsx:62` | Test hardcodes 'annual' billing cycle expectation for createCheckout |
| `constants.ts:4` | MOCK_* seed constants feed only the deprecated offline storage module |
| `contexts/AuthContext.tsx:122` | Hardcoded organizationId fallback 'org1' in registration partial user |
| `contexts/WebSocketContext.tsx:57` | organizationId sent client-side for socket room join — server must re-verify |
| `contexts/__tests__/AuthContext.test.tsx:50` | AuthContext login-flow test only asserts initial 'No User' state |
| `e2e/auth.setup.ts:35` | Auth tokens stored in localStorage in test fixture, contradicting documented httpOnly-cookie design |
| `e2e/comprehensive-e2e.spec.ts:82` | getFrameworks called with empty organizationId |
| `e2e/onboarding.spec.ts:189` | Placeholder assertion expect(true).toBeTruthy() does not verify behavior |
| `e2e/performance/performance.spec.ts:257` | Strict zero-JS-error assertion likely flaky across environments |
| `e2e/policy-management.spec.ts:37` | Policy creation test body fully gated on optional button visibility |
| `e2e/reporting.spec.ts:104` | Report generation API test never asserts apiCalled |
| `e2e/vendor-management.spec.ts:102` | Vendor details assertion swallowed by .catch() fallback |
| `e2e/visual/visual-regression.spec.ts:65` | Visual regression tests are no-ops when the target element is not visible |
| `e2e/workspace-management.spec.ts:63` | Workspace CRUD tests are fully conditional and assert nothing on the happy path |
| `server/src/__tests__/contracts/routes/cookieConsent.contract.test.ts:39` | Mocked authorize does not enforce roles in cookie consent contract tests |
| `server/src/__tests__/contracts/services/aiRmfService.contract.test.ts:16` | Logger mock targets config/logger while production logger is utils/logger |
| `server/src/__tests__/integration/api/export.test.ts:118` | Export route silently ignores query-param filters (status/category/severity) |
| `server/src/__tests__/performance/query-profiler.ts:184` | Query profiler uses deprecated Prisma $use middleware signature |
| `server/src/__tests__/unit/controllers/featureModulesController.contract.test.ts:158` | Contract test encodes update/delete keyed on id only, no organizationId scoping |
| `server/src/__tests__/unit/routes/security.test.ts:78` | Route tests assert shape only, not that auth/authorize middleware is attached |
| `server/src/blockchain/scripts/contractInteraction.ts:271` | console.log used for retry/back-off logging in blockchain helper |
| `server/src/config/index.ts:198` | MQTT broker URL silently empty in production when unset (warning, not error) |
| `server/src/config/multiRegionConfig.ts:556` | Outbound health-check HTTP to env-overridable region API URLs without isUrlSafe gate |
| `server/src/config/swagger.ts:211` | OpenAPI LoginRequest/RegisterRequest schemas omit password field |
| `server/src/controllers/webhookController.ts:412` | revokeApiKey relies on non-unique organizationId in update where clause |
| `server/src/middleware/standardResponse.ts:174` | Two parallel error handlers exist (errorHandler.ts AppError vs standardResponse.ts ApiError) |
| `server/src/middleware/tierMiddleware.ts:58` | Tier-gating middleware sends res.status().json() directly, bypassing global error handler |
| `server/src/scripts/optimize-endpoints.ts:163` | console.log used in CLI reporting script |
| `server/src/scripts/performance-test.ts:148` | console.log used in CLI performance-test script |
| `server/src/services/integrations/providers/providerFactory.ts:90` | ConfiguredProvider reads plaintext credentials into Authorization headers; relies on caller to have decrypted at-rest values |
| `server/src/services/monitoring/metrics.ts:6` | GET /metrics Prometheus exporter is unauthenticated by design |
| `server/src/services/secureChatService.ts:1839` | ChatResponse reports encrypted:true though processQueryLocally is rule-based string matching |
| `server/src/services/sessionManagementService.ts:340` | Session timeout-warning path is dead code |
| `server/src/utils/credentialEncryption.ts:31` | Fixed PBKDF2 salt for key derivation |
| `server/src/validators/aiSchemas.ts:7` | AI prompt schemas default to unknown(true) |
| `server/src/validators/coreModulesSchemas.ts:1051` | Ticketing config schema accepts plaintext secret fields (encryption is downstream responsibility) |
| `services/storage.ts:138` | Deprecated mock DB is single-tenant by design |

</details>

---

## §6 Prioritized remediation plan

1. **Multi-tenant isolation sweep (P0).** Audit every Prisma `findUnique`/`update`/`delete` by bare `id` in `controllers/featureModulesController.ts`, `routes/enterprise.ts`, `routes/workflow.ts`, `services/advanced/acosService.ts`, `services/advanced/complianceAsCodeService.ts`, `controllers/controlMappingsController.ts`, `routes/scim.ts`, `routes/regulatoryChanges.ts`. Convert to `findFirst`/`updateMany` scoped by `organizationId` (or the parent entity's org), returning 404 on miss.
2. **Credential encryption (P0).** Wrap integration secrets/API tokens in `encryptField()` before persistence in `routes/marketplace/marketplaceRoutes.ts` and `routes/ticketing.ts`.
3. **Auth/webhook integrity (P0).** Verify HMAC over the raw body in `controllers/webhookController.ts` and `routes/webhooks.ts`; reject revoked/expired API keys; block GraphQL mutations over GET (`graphql/index.ts`); attach the Redis store to rate limiters (`middleware/rateLimiter.ts`).
4. **Frontend runtime blocker (P0).** Replace the CommonJS `require()` in `App.tsx:208` with a static import (throws in the Vite/ESM bundle).
5. **Remove fake/simulated UX (P1).** Wire or clearly label the mock data and `setTimeout`-faked actions in the AIFeatures components and SOX modals; fix `controlTesting.ts` always recording PASS.
6. **Input validation & error handling (P1).** Add field allowlists/validation to mutating routes that write `req.body` directly; route manual `res.status().json()` errors through the global handler.
7. **Test integrity (P2).** Un-skip the enterprise integration suite and replace virtual mocks of non-existent modules; strengthen smoke tests that only assert a component is a function.

---

## §7 Coverage & limitations

- **Files scanned:** 1,180 / 1,180 (100%). Each file read end-to-end by a subagent.
- **What this scan does NOT cover:** runtime/dynamic behavior, `npm audit` (tracked separately — see known-unfixable list in `.claude/CLAUDE.md`), `tsc --noEmit`, and load/perf testing. Findings are static-analysis-grade and should be confirmed against the cited lines before fixing.
- **Severity is reviewer-assigned per finding**, not a formula. No single security score is claimed — that metric was part of the retired v20.x apparatus and produced misleading 0%/100% swings.
- **Raw findings JSON:** `.claude/deep-scan/results/findings_all.json` (machine-readable, 429 entries).
