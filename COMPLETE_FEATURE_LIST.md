# ComplyEasyAI – Complete Feature & Functionality List

This document lists every feature and functionality in the application as implemented on the main branch (backend APIs, frontend views, services, and capabilities).

---

## 1. Authentication & User Management

### 1.1 Auth (API: `/api/auth`)
- **Magic link login** – Request magic link (POST `/magic-link`), verify token (POST `/verify`)
- **Email/password login** – POST `/login`, token refresh POST `/refresh`, POST `/logout`
- **Registration** – POST `/register` (name, email, organization, password, industry, company size, compliance goal, how did you hear)
- **Two-factor completion** – POST `/2fa/complete` (complete 2FA flow after login)
- **Profile** – PATCH `/profile`, POST `/profile/avatar` (avatar upload), PATCH `/password`
- **Frontend:** Landing page (login/sign-in), Signup page (`/signup`), AuthContext (token, user, refresh)

### 1.2 Two-Factor Authentication (API: `/api/2fa`)
- **Setup** – POST `/setup`, POST `/verify-and-enable` (with token), POST `/disable`
- **Backup codes** – POST `/regenerate-codes`, GET `/status`
- **Frontend:** Gated by Settings / security flows

### 1.3 Organization (API: `/api/organization`)
- **Get organization** – GET `/:id` or current
- **Update organization** – PATCH (name, plan, settings)
- **Frontend:** Settings, billing context

---

## 2. Core Compliance & Governance

### 2.1 Dashboard
- **Main dashboard** – Frameworks summary, risks summary, quick actions, tier-based limits
- **View state:** `dashboard` (default after login)
- **Data:** `api.frameworks.list()`, `api.risks.list()`; tier: `getLimit`, `isAtLimit`, `canAccessView`

### 2.2 Compliance Frameworks (API: `/api/frameworks`)
- **List/create/update/delete frameworks** – GET `/`, POST `/` (enforceLimit maxFrameworks), PATCH `/:id`, DELETE `/:id`
- **Templates** – GET `/templates`, GET `/templates/:frameworkType` (control sets by type)
- **Apply template** – POST `/:id/apply-template` (create controls from template)
- **Controls** – GET `/:frameworkId/controls/:controlId/export`, POST `/:frameworkId/controls`, PATCH `/:frameworkId/controls/:controlId`, POST `/:frameworkId/controls/bulk-update`, DELETE control
- **Evidence** – POST control evidence upload, GET evidence URL, POST smart-upload (AI-assisted)
- **Suggestions** – GET `/:frameworkId/suggestions`, POST accept/reject suggestion
- **Supported framework types (data):** SOC2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST 800-53, CCPA, SOX, NIST CSF, FedRAMP, CMMC, HITRUST, CIS
- **Frontend:** Frameworks list, Framework details (controls, evidence, status), tier limit on max frameworks

### 2.3 Risk Management (API: `/api/risks`)
- **List/create/update/delete risks** – GET `/`, POST `/`, PATCH `/:id`, DELETE `/:id`
- **Prioritize** – POST prioritize
- **Remediation** – POST generate-remediation
- **Scan** – POST scan (risk scan)
- **Frontend:** Risk Management view, Dashboard risks widget, My Tasks (assigned risks)

### 2.4 Audit Trail (API: `/api/audit`)
- **List audit logs** – GET `/` (query params)
- **Log action** – POST `/log` (action, user, details)
- **Frontend:** Audit Trail view (audit log table)

### 2.5 Reports (API: `/api/ai` + enterprise reports)
- **AI report generation** – POST `/api/ai/report`
- **Enterprise reports** – Enterprise sub-router `/reports`: create report, get executive summary, get compliance report (with/without frameworkId)
- **Frontend:** Reports view, AI Report Generator

---

## 3. Enterprise Modules (API: `/api/enterprise/*`)

### 3.1 Risk Assessments
- **Create/list** risk assessments (organization-scoped)
- **Frontend:** Used in risk and questionnaire flows

### 3.2 Questionnaires
- **Create, create from template, update** – Joi-validated
- **Questions** – Add questions, submit response
- **AI generate, complete**
- **Frontend:** Questionnaire Management (list, create, from template, respond, AI generate)

### 3.3 Policy Management
- **Create, bulk import, update** – Joi-validated
- **Frontend:** Policy Management (list, create, bulk import, edit)

### 3.4 Trust Center
- **Certificates** – Create, generate certificate (Joi-validated)
- **Frontend:** Trust center / compliance certificates (if exposed in UI)

### 3.5 Workspace (Multi-Workspace)
- **Child organizations** – Create child, move user, clone framework (Joi-validated)
- **Frontend:** Workspace Management (list workspaces, create child, move users, clone framework)

### 3.6 Monitoring (Continuous Monitoring)
- **Create/update/toggle monitors** – Joi-validated
- **List, get results** – Monitors and run results (gated by ENABLE_REAL_MONITORING: demo vs real)
- **Frontend:** Monitoring Dashboard (list monitors, results, toggle, create)

### 3.7 Issue Management
- **Create, assign, comments, update, status** – Joi-validated
- **Frontend:** Issue Management (list, create, assign, comment, status)

### 3.8 Visionary AI (Enterprise AI Co-Pilot)
- **Predict risks** – POST predict-risks (time horizon, etc.)
- **Autopilot** – POST autopilot/run (options)
- **Frontend:** Used in dashboard / risk prediction and autopilot flows

---

## 4. Vendors (API: `/api/vendors`)
- **CRUD** – POST `/` (enforceLimit maxVendors), GET `/`, GET `/:id`, PUT `/:id`, DELETE `/:id`
- **Assessments** – POST `/:id/assessments`, POST `/assessments/:id/complete` (Joi-validated)
- **Dashboard** – GET `/dashboard` (vendor risk dashboard: totals, distribution, top risk vendors)
- **Scorecard** – GET `/:id/scorecard`
- **Frontend:** Vendor Management (list, create, edit, assessments, scorecard, dashboard)

---

## 5. Team & Personnel

### 5.1 Team (API: `/api/team`)
- **List team members** – GET
- **Invite** – POST invite, POST bulk-invite
- **Update role** – PATCH
- **Remove** – DELETE
- **Frontend:** Settings / Team (admin), Integrations context

### 5.2 Personnel (API: `/api/personnel`)
- **Personnel records** – Onboarding/offboarding status, access reviews (used by ACOS/enterprise)
- **Frontend:** Gated by personnelManagement tier (Growth+)

---

## 6. AI Features (API: `/api/ai`)

All require authentication and use AI rate limiter; backed by Gemini/OpenAI-style services.

- **Report generation** – POST `/report`
- **Policy generation** – POST `/policy`
- **Contract analysis** – POST `/contract`
- **Gap analysis** – POST `/gap-analysis`
- **RFP response** – POST `/rfp`
- **Phishing (simulation) generation** – POST `/phishing`
- **Vendor scoring** – POST `/vendor-score`
- **Data map (e.g. GDPR)** – POST `/data-map`
- **BCP generation** – POST `/bcp`
- **Compliance chat** – POST `/chat` (message, optional fileContext)

**Frontend (AI Tools – tier-gated):**
- Policy Generator (`ai-policy`)
- Contract Analyzer (`ai-contract`)
- Gap Analysis (`ai-gap`)
- RFP Responder (`ai-rfp`)
- Phishing Simulator (`ai-phishing`)
- Vendor Scorer (`ai-vendor`)
- GDPR/Data Mapper (`ai-data-map`)
- BCP Generator (`ai-bcp`)

---

## 7. NIST AI RMF (API: `/api/ai-rmf`)
- **Systems** – POST/GET/PATCH/DELETE systems; PATCH core function, category, subcategory
- **Trustworthiness** – PATCH trustworthiness characteristic, lifecycle stage
- **Actors** – POST add actor, DELETE actor
- **Assessments** – POST create assessment, GET assessments, DELETE assessment
- **Profiles** – POST create profile
- **Risk activities** – POST create, PATCH update
- **Trustworthiness score** – POST calculate-trustworthiness
- **Dashboard** – GET dashboard data
- **Frontend:** NIST AI RMF dashboard, AI System list, AI System create, AI System details, AI RMF Assessments

---

## 8. EU Regulations (API: `/api/eu-regulations`)

### 8.1 EU AI Act
- **Systems** – POST/GET/PATCH/DELETE AI systems
- **Assessments** – GET assessments, latest, POST conduct risk assessment
- **Transparency reports** – POST generate, GET list
- **Frontend:** EU AI Act Dashboard

### 8.2 DMA (Digital Markets Act)
- **Gatekeepers** – Register, CRUD, obligations, compliance reports (generate, get latest)
- **Frontend:** DMA Gatekeeper Management

### 8.3 DSA (Digital Services Act)
- **Platforms** – Register, CRUD
- **Content moderation** – Get history, record moderation, report illegal content, process report
- **Ad repository** – Add, get ads
- **Transparency reports** – Get, generate DSA transparency report
- **Risk assessments** – Conduct, get, latest, update
- **Non-personalized feed** – Configure, get, update status
- **Frontend:** DSA Platform Management

---

## 9. Billing & Subscription (API: `/api/billing`)
- **Webhook** – POST `/webhook` (Stripe)
- **Subscription** – GET subscription, history; POST checkout, portal session
- **Tier** – GET tiers, POST preview-change, change-tier, cancel, reactivate
- **Add-ons** – POST addons, DELETE addons
- **Quote** – POST quote
- **Features** – GET features, GET features/subscriptions, POST subscribe, DELETE unsubscribe, GET access
- **Bundles** – GET bundles, POST subscribe
- **Frontend:** Settings → Billing, upgrade prompts, tier cards, feature marketplace

---

## 10. Integrations (API: `/api/integrations`)
- **List, status** – GET list, GET status per provider
- **OAuth** – Google, GitHub, Slack, Jira: authorize (GET auth URL), callback, sync, disconnect
- **AWS** – POST connect (credentials)
- **Azure** – POST connect (credentials)
- **Connect by API key / PAT / API key+secret / username+password / service account**
- **Frontend:** Integrations view (connect/disconnect providers, status)

---

## 11. Webhooks & API Keys (API: `/api/webhooks`, `/api/organization` or billing)
- **Webhooks** – List, create, get, update, delete, test, regenerate secret; get events
- **API keys** – List, create, revoke
- **Frontend:** Settings (admin) for webhooks and API keys

---

## 12. Frameworks – Control Mappings & Evidence Versions
- **Control mappings** (API: `/api/control-mappings`) – Get mappings, create, delete; export CSV
- **Evidence versions** (API: `/api/evidence-versions`) – Get versions, restore, delete
- **Frontend:** Framework details (controls, evidence, versions, mappings)

---

## 13. Export (API: `/api/export`)
- **CSV export** – GET `/vendors`, `/policies`, `/issues`, `/risks`, `/frameworks`, `/audit-logs`, `/monitors` (authenticated, validateExportData maxRows)
- **Frontend:** Used from list views / export buttons

---

## 14. Onboarding (API: `/api/onboarding`)
- **Progress** – GET progress, PUT update, POST track-event, complete-milestone, PUT preferences, POST skip-flow, reset
- **Checklist** – GET checklist, PUT update
- **Frontend:** Onboarding overlay, checklist widget, progress, modal, tooltips, celebration

---

## 15. Security Features (API: `/api/security`)

### 15.1 Zero Trust
- **Verify device** – POST verify-device
- **Evaluate access** – POST evaluate-access
- **Policies** – POST create, PATCH update, DELETE
- **Network segments** – POST create
- **Continuous verify** – POST continuous-verify

### 15.2 ZKP (Zero-Knowledge Proofs)
- **Compliance proof** – POST generate, verify
- **Credential proof** – POST generate, verify
- **Ownership proof** – POST generate, verify

### 15.3 BYOK (Bring Your Own Key)
- **Keys** – POST generate, import; POST rotate, DELETE
- **Encrypt/decrypt** – POST encrypt, decrypt
- **Config** – POST config

### 15.4 Compliance as Code
- **Policies** – POST create, GET list/detail, PATCH, DELETE; POST evaluate, evaluate-batch
- **Reports** – POST generate, GET report
- **CI/CD** – POST webhook, POST integrations, DELETE integration
- **Drift** – POST detect

- **Frontend:** Security Features view (Visionary tier: zero trust, ZKP, BYOK, compliance-as-code)

---

## 16. aCOS – Advanced Compliance Operating System (API: `/api/acos`)

All below require authentication; many require admin/editor.

### 16.1 Goals & Control Loops
- **Goals** – Create, get, list, update, delete, restore
- **Control loops** – Create, get, history, execute, pause, resume, update, delete

### 16.2 Agentic AI
- **Blast radius** – POST estimate-blast-radius
- **Execute/rollback** – POST execute-action, rollback, rollback-multiple

### 16.3 Evidence Truth Layer
- **Analyze** – POST analyze, reanalyze; GET analysis, history; POST bulk-analyze; GET export
- **Verify hash** – POST verify-hash
- **Sign/verify** – POST sign, verify-signature
- **Timestamp** – POST timestamp
- **Chain of custody** – POST chain-of-custody
- **Multi-party attestation** – POST multi-party-attestation

### 16.4 Regulatory Intelligence Fabric (RIF)
- **Ingest** – POST ingest-regulation
- **Detect changes** – POST detect-changes; GET changes
- **Auto-update** – POST auto-update, rollback, batch; POST monitor-feeds
- **Conflicts** – POST bulk-analysis, resolve; GET history
- **Feeds** – POST add, DELETE remove; GET dashboard

### 16.5 Temporal Graph Networks
- **Predict risks** – GET predict-risks
- **Trajectory** – GET frameworks/:id/trajectory
- **Early warnings** – GET early-warnings

### 16.6 Compliance Digital Twin
- **Simulate** – POST simulate, with-constraints, compare-scenarios
- **State** – POST save-state, GET load-state, POST rollback
- **Monte Carlo** – POST monte-carlo

### 16.7 Red Teaming
- **Simulate** – POST simulate, automated-scan
- **Scans** – GET compliance-gaps, misconfigurations, policy-violations
- **Schedule** – POST schedule, export-results, compare-results, mark-false-positive

### 16.8 Federated Swarm
- **Federation** – POST join, leave, contribute; GET receive-model; POST recover; GET federation-status, participate
- **Insights** – GET insights, industry, sector, frameworks/:id; GET benchmark, trends; POST export
- **Model** – POST rollback, distribute; GET audit-trail

### 16.9 Multi-modal Intake
- **Transcribe** – POST transcribe-audio (file)
- **Analyze video** – POST analyze-video (file)

### 16.10 Physical AI / IoT
- **Devices** – POST register, bulk-register; DELETE deregister; GET list
- **Compliance check** – POST devices/:id/compliance-check
- **Health** – GET heartbeat, offline, battery, connectivity, firmware; GET health dashboard, device health history, bulk-check
- **Predictive maintenance** – GET devices/:id/predictive-maintenance

### 16.11 VR Collaborative Review
- **Sessions** – POST create, GET list, GET detail; POST join, leave, start, end
- **Health** – GET sessions/:id/health
- **Annotations** – POST add (incl. voice), PUT edit, DELETE; GET history, export
- **Chat** – POST send, GET history; POST voice-chat toggle
- **Participants** – POST mute; POST pointer; POST screen-sharing enable/disable; POST follow enable/disable; POST presenter-mode
- **Environment** – POST update, theme
- **Training** – POST create scenario, start; POST progress; GET evaluate; POST complete; GET history

### 16.12 JIT Access
- **Request** – POST request; GET pending, all; POST approve, deny, cancel
- **Sessions** – GET sessions; POST revoke

### 16.13 Swarm Task Allocation
- **Agents** – POST register; GET list, by id; PUT status; POST deactivate, reactivate; GET workload
- **Tasks** – POST submit, bulk; GET all, active, status; POST cancel; POST progress, complete
- **Metrics** – GET metrics, history, alerts; POST resolve alert; GET export, dashboard

### 16.14 Neuro-Symbolic AI
- **Hybrid reasoning** – POST hybrid-reasoning
- **Infer rules** – POST infer-rules
- **Causal reasoning** – POST causal-reasoning
- **Explainable decision** – POST explainable-decision
- **History** – GET reasoning-history; POST validate inference

### 16.15 Homomorphic AI
- **Keys** – POST generate
- **Encrypt/decrypt** – POST encrypt, decrypt
- **Linear regression** – POST linear-regression
- **Statistics** – POST statistics
- **Neural network** – POST neural-network

### 16.16 Compliance Debts & Change Impacts
- **Debts** – GET compliance-debts; POST track, calculate-from-gap, resolve; GET export
- **Change impacts** – GET change-impacts; POST forecast, resolve

- **Frontend:** ACOS Dashboard (goals, control loops, swarm, VR, JIT, homomorphic, etc.)

---

## 17. Demo (API: `/api/demo`)
- **Demo flows** – Schedule demo, mark converted, get stats (sales/demo funnel)
- **Frontend:** Demo booking form, status/analytics

---

## 18. Public & Marketing Pages (no auth required)
- **Landing** – `/` (login/sign-in when not authenticated)
- **Signup** – `/signup`
- **Learn** – `/learn`
- **Community** – `/community`
- **Status** – `/status`
- **Docs** – `/docs`, `/docs/*`

---

## 19. Tier & Limits (Enforcement)

### 19.1 Tiers
- **Foundation** – Core dashboard, risk, frameworks, audit, team, AI policy/gap, monitoring; limits on users, frameworks, vendors, etc.
- **Essentials** – Adds advanced reporting, all AI tools, personnel, vendor risk; higher limits
- **Growth** – Adds aCOS goals, higher limits
- **Visionary** – Adds NIST AI RMF, EU AI Act, DSA, DMA, zero trust; unlimited (or very high) limits

### 19.2 Limit Keys (examples)
- maxUsers, maxFrameworks, maxWorkspaces, maxQuestionnairesPerMonth, maxVendors, maxPolicies, maxIntegrations, maxCustomReports, maxMonitors, maxIssues, maxRiskAssessments, maxAiRequestsPerMonth, maxStorageGB, maxApiRequestsPerDay, dataRetentionDays

### 19.3 Frontend Gating
- **canAccessView(plan, view)** – Hides nav and blocks access per tier
- **getLimit(plan, key)** – Returns limit for UI (e.g. max frameworks)
- **isAtLimit(plan, key, current)** – Used to disable “Add” or show upgrade message
- **getUpgradeMessage(...)** – Shown when limit reached

---

## 20. Infrastructure & Cross-Cutting

### 20.1 Backend
- **Health** – GET `/health` (DB, WebSocket, memory; 503 when unhealthy)
- **API docs** – GET `/api/docs`, `/api/docs.json` (Swagger/OpenAPI)
- **CSRF** – GET `/api/csrf-token`; middleware on state-changing requests
- **Rate limiting** – apiLimiter, aiLimiter, authLimiter; `/health` skipped
- **Request validation** – Joi validateBody on vendors and enterprise POST/PUT/PATCH
- **Auth** – JWT authenticate middleware; role-based authorize(roles)
- **Logging** – Winston; request IDs, error tracking (e.g. Sentry when configured)
- **Monitoring** – ENABLE_REAL_MONITORING: demo (simulated) vs real (not yet implemented, throws)

### 20.2 Frontend
- **Routing** – React Router; view-state (MainApp) + public routes
- **Auth** – AuthContext (token, refresh, user, login/logout)
- **API client** – services/api.ts (fetchAPI, CSRF, 401 refresh, timeouts)
- **Layout** – Sidebar nav (filtered by tier), AI tools menu, notifications, Compliance Chat
- **Onboarding** – Overlay, checklist, progress, tooltips, modal, celebration

---

## 21. Compliance Framework Data (Static Control Sets)

- **SOC 2** – soc2Controls.ts  
- **ISO 27001** – iso27001Controls.ts  
- **HIPAA** – hipaaControls.ts  
- **GDPR** – gdprControls.ts  
- **PCI DSS** – pciDssControls.ts  
- **NIST 800-53** – nist80053Controls.ts  
- **CCPA** – ccpaControls.ts  
- **SOX** – soxControls.ts  
- **NIST CSF** – nistCsfControls.ts  
- **FedRAMP** – fedRampControls.ts  
- **CMMC** – cmmcControls.ts  
- **HITRUST** – hitrustControls.ts  
- **CIS** – cisControls.ts  

---

## Summary Table (High Level)

| Area | Features |
|------|----------|
| **Auth** | Magic link, login, register, refresh, 2FA, profile, avatar, password |
| **Core** | Dashboard, frameworks, controls, evidence, risks, audit, reports |
| **Enterprise** | Risk assessments, questionnaires, policies, trust center, workspaces, monitoring, issues, visionary AI |
| **Vendors** | CRUD, assessments, scorecard, dashboard |
| **Team** | List, invite, bulk invite, role, remove |
| **AI** | Report, policy, contract, gap, RFP, phishing, vendor score, data map, BCP, chat |
| **NIST AI RMF** | Systems, assessments, trustworthiness, actors, dashboard |
| **EU** | AI Act (systems, assessments, transparency), DMA (gatekeepers), DSA (platforms, content, ads, risk, feed) |
| **Billing** | Subscription, tiers, add-ons, features, bundles, Stripe webhook |
| **Integrations** | Google, GitHub, Slack, Jira, AWS, Azure, API key/PAT/secret/auth |
| **Webhooks & Keys** | Webhooks CRUD/test/events; API keys list/create/revoke |
| **Export** | CSV for vendors, policies, issues, risks, frameworks, audit, monitors |
| **Onboarding** | Progress, checklist, milestones, preferences, skip, reset |
| **Security** | Zero trust, ZKP, BYOK, compliance-as-code, CI/CD, drift |
| **aCOS** | Goals, control loops, agentic AI, evidence layer, RIF, TGN, digital twin, red team, swarm, multimodal, physical AI, VR, JIT, swarm tasks, neuro-symbolic, homomorphic, compliance debts, change impacts |
| **Demo** | Schedule demo, mark converted, stats |
| **Public** | Landing, signup, learn, community, status, docs |
| **Tiers** | Foundation, Essentials, Growth, Visionary with per-tier limits and feature flags |

---

*Generated from main branch codebase. For API details see `/api/docs` and server route files.*
