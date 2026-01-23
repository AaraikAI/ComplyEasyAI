# ComplyEasyAI Tutorials & Getting Started Guide

## Table of Contents

### Quick Start
- [Getting Started in 30 Minutes](#getting-started-in-30-minutes)
- [Your First Framework Setup](#your-first-framework-setup)
- [Connecting Your First Integration](#connecting-your-first-integration)

### Core Workflows
- [Automated Evidence Collection](#automated-evidence-collection)
- [Risk Assessment & Management](#risk-assessment--management)
- [Control Monitoring](#control-monitoring)
- [Audit Preparation](#audit-preparation)

### Advanced Tutorials
- [Setting Up aCOS (Autonomous Compliance)](#setting-up-acos-autonomous-compliance)
- [Using AI Red Team](#using-ai-red-team)
- [Creating Custom Frameworks](#creating-custom-frameworks)
- [Building Custom Integrations](#building-custom-integrations)

### Compliance Framework Guides
- [SOC 2 Certification Guide](#soc-2-certification-guide)
- [ISO 27001 Implementation](#iso-27001-implementation)
- [GDPR Compliance Setup](#gdpr-compliance-setup)
- [EU AI Act Compliance](#eu-ai-act-compliance)

### Team & Organization
- [User Management & Roles](#user-management--roles)
- [Multi-Framework Management](#multi-framework-management)
- [Reporting & Dashboards](#reporting--dashboards)

---

# Getting Started in 30 Minutes

**Goal**: Set up your account, configure your first framework, and collect initial evidence.

**Time**: 30 minutes
**Tier**: Foundation or trial
**Prerequisites**: None

## Step 1: Create Your Account (5 minutes)

### Sign Up

1. Visit [app.complyeasy.ai/signup](https://app.complyeasy.ai/signup)
2. Enter your business email (we'll verify this)
3. Choose a strong password (12+ characters, mixed case, numbers, symbols)
4. Click **"Start Free Trial"**

### Verify Your Email

1. Check your inbox for verification email
2. Click the verification link
3. You'll be redirected to the onboarding wizard

### Complete Organization Profile

Fill in your organization details:
- **Organization Name**: Your company's legal name
- **Industry**: Select from dropdown (FinTech, HealthTech, SaaS, etc.)
- **Company Size**: Number of employees
- **Primary Goal**: What you're trying to achieve (SOC 2, ISO 27001, etc.)

**Pro Tip**: Accurate organization details help our AI provide better recommendations.

## Step 2: Choose Your First Framework (5 minutes)

### Framework Selection Wizard

The onboarding wizard will recommend frameworks based on your industry and goals:

**Common starting points**:
- **SaaS companies**: SOC 2 Type II
- **Healthcare tech**: HIPAA + SOC 2
- **FinTech**: SOC 2 + PCI DSS
- **AI companies**: EU AI Act + ISO 42001

**For this tutorial, we'll use SOC 2 Type II** (most common).

### SOC 2 Setup

1. Select **"SOC 2 Type II"** from framework list
2. Choose Trust Service Categories (TSC):
   - ✅ **Security** (required, always included)
   - ✅ **Availability** (recommended for SaaS)
   - ✅ **Confidentiality** (recommended if you handle sensitive data)
   - ⬜ Processing Integrity (optional, for data processing accuracy)
   - ⬜ Privacy (select if you process EU personal data - or choose GDPR separately)

3. Set observation period start date:
   - **Today's date** = start monitoring now
   - **Future date** = if you want to remediate gaps first

4. Click **"Create Framework"**

### What Just Happened?

Our AI just:
- Created 64 SOC 2 controls in your account
- Mapped controls to evidence requirements
- Generated a compliance roadmap
- Scheduled automated evidence collection

## Step 3: Connect Integrations (10 minutes)

Evidence collection is automated through integrations. Let's connect your first few.

### AWS Integration (most common)

1. Navigate to **Settings → Integrations**
2. Click **"Connect AWS"**
3. Choose connection method:
   - **CloudFormation Stack** (recommended, easiest)
   - **IAM Role** (manual setup)

#### CloudFormation Method:

1. Click **"Launch CloudFormation Stack"**
2. You'll be redirected to AWS Console
3. Check the box "I acknowledge that AWS CloudFormation might create IAM resources"
4. Click **"Create Stack"**
5. Wait 2-3 minutes for stack creation
6. Return to ComplyEasyAI and click **"Verify Connection"**

**What we collect**:
- CloudTrail logs (access monitoring)
- IAM policies (access controls)
- Security groups (network controls)
- VPC configurations (network segmentation)
- S3 bucket policies (data protection)

**Permissions**: Read-only (we never modify your infrastructure)

### GitHub Integration

1. Click **"Connect GitHub"**
2. Click **"Authorize with GitHub"**
3. Select repositories to monitor:
   - **All repositories** (recommended for complete coverage)
   - **Selected repositories** (if you want to exclude some)
4. Click **"Install & Authorize"**

**What we collect**:
- Branch protection rules (code review controls)
- Commit history (change management)
- Pull request approvals (segregation of duties)
- Repository access logs (access monitoring)

### Slack Integration

1. Click **"Connect Slack"**
2. Click **"Add to Slack"**
3. Select your workspace
4. Click **"Allow"**

**What we collect**:
- Security incident channels (incident response evidence)
- Change notification channels (change management)
- Access request channels (access control workflows)

**Privacy**: We only read public channels and channels you explicitly add us to.

### More Integrations

**Recommended first integrations**:
- ✅ **AWS/Azure/GCP**: Infrastructure evidence
- ✅ **GitHub/GitLab**: Code security evidence
- ✅ **Slack/Teams**: Communication and incident response
- ✅ **Okta/Google Workspace**: Identity and access management
- ⬜ **Jira/Linear**: Task and issue tracking
- ⬜ **Datadog/New Relic**: Monitoring and alerting

You can add more integrations anytime. Start with 3-5 core tools.

## Step 4: Review Your Dashboard (5 minutes)

### Navigate to Compliance Dashboard

After connecting integrations, give our AI 10-15 minutes to collect initial evidence. Then:

1. Go to **Dashboard** (sidebar)
2. You'll see:
   - **Compliance Score**: Overall SOC 2 readiness (starts at ~40-60%)
   - **Control Status**: Passing, failing, and in-progress controls
   - **Evidence Collected**: Number of evidence items mapped
   - **Risk Level**: High, medium, low risks identified

### Understanding Your Compliance Score

**Score breakdown**:
- **0-40%**: Early stage (many gaps, 6-12 months to audit)
- **40-70%**: In progress (some controls passing, 3-6 months to audit)
- **70-85%**: Near ready (minor gaps, 1-3 months to audit)
- **85-95%**: Audit ready (can schedule audit)
- **95-100%**: Excellent (continuous compliance maintained)

**Don't panic if your score is low!** Most organizations start at 45-55%. Our AI will guide you through remediation.

### Review Failing Controls

1. Click **"View Failing Controls"**
2. You'll see a list like:
   - ❌ **CC6.1**: Logical access controls not documented
   - ❌ **CC6.6**: No MFA enforced on cloud accounts
   - ❌ **CC7.2**: No automated security monitoring

3. Click on any control to see:
   - **What's required**: Plain-English explanation
   - **Why it's failing**: Gap identified by AI
   - **How to fix**: Step-by-step remediation plan
   - **Evidence needed**: What auditors will ask for

### Generate Your First Report

1. Click **"Reports"** in sidebar
2. Click **"Generate Executive Report"**
3. Select:
   - **Framework**: SOC 2
   - **Audience**: Executive Summary
   - **Format**: PDF
4. Click **"Generate"**

**Your report includes**:
- Compliance score and trend
- Control status breakdown
- Top risks requiring attention
- Recommended remediation priorities
- Estimated time to audit-ready

**Share this with your leadership team** to show progress and get buy-in.

## Step 5: Set Up Your Team (5 minutes)

### Invite Team Members

1. Navigate to **Settings → Team**
2. Click **"Invite Member"**
3. Enter email addresses (one per line or comma-separated)
4. Assign roles:
   - **Admin**: Full access (for compliance leads)
   - **Editor**: Can modify controls and evidence (for compliance team)
   - **Viewer**: Read-only access (for leadership, auditors)
   - **Auditor**: Special view for external auditors
5. Click **"Send Invitations"**

### Set Up Notifications

1. Go to **Settings → Notifications**
2. Configure alerts:
   - ✅ **Control failures**: Immediate email (critical)
   - ✅ **Risk level changes**: Daily digest
   - ✅ **Evidence collection errors**: Immediate Slack notification
   - ⬜ **Weekly compliance summary**: Every Monday
   - ⬜ **Monthly executive report**: First of month

### Configure Slack Notifications (optional)

1. In **Settings → Notifications**, click **"Connect Slack Channel"**
2. Choose channel (e.g., `#compliance-alerts`)
3. Select notification types to send to Slack
4. Click **"Save"**

Now your team gets real-time alerts in Slack!

---

**Congratulations! You're set up.** 🎉

**What happens next**:
- Evidence collection runs automatically (daily)
- Controls are monitored continuously
- AI assesses risks and updates your score
- You'll receive alerts for critical issues

**Recommended next steps**:
1. Review and remediate failing controls (start with high-risk)
2. Connect additional integrations
3. Schedule weekly compliance reviews with your team
4. Set a target audit date (3-6 months out)

---

# Your First Framework Setup

This tutorial goes deeper into framework configuration beyond the basics.

**Goal**: Fully configure a compliance framework with custom controls, policies, and evidence mappings.
**Time**: 1-2 hours
**Tier**: Essentials or higher (for customization)
**Prerequisites**: Account created, initial integrations connected

## Choosing the Right Framework

### Framework Decision Tree

**"I'm a SaaS company selling to enterprises"**
→ Start with **SOC 2 Type II** (required by most enterprise buyers)
→ Add **ISO 27001** (international recognition)
→ Consider **GDPR** (if EU customers)

**"I'm in healthcare"**
→ **HIPAA** (required for PHI)
→ Add **HITRUST** (if you work with health insurers)
→ Add **SOC 2** (for non-healthcare customers)

**"I'm building AI/ML products"**
→ **EU AI Act** (if you have EU users)
→ **ISO 42001** (AI management system)
→ **SOC 2** (general security)

**"I process payments"**
→ **PCI DSS** (required for card data)
→ Add **SOC 2** (broader security)

**"I'm a government contractor"**
→ **FedRAMP** (federal)
→ **StateRAMP** (state/local)
→ **NIST 800-53** (defense)

### Multi-Framework Strategy

If you're pursuing multiple frameworks, order matters:

**Recommended sequence**:
1. **SOC 2** (broadest coverage, fastest to achieve)
2. **ISO 27001** (70% overlap with SOC 2)
3. **Industry-specific** (HIPAA, PCI DSS, etc.)
4. **Regional** (GDPR, LGPD, etc.)

**Why this order**: Each framework builds on the previous one, maximizing control reuse.

## Framework Configuration Deep-Dive

### SOC 2 Type II Configuration

Let's fully configure SOC 2 as an example (applies to other frameworks too).

#### Step 1: Define Scope

1. Navigate to **Frameworks → SOC 2**
2. Click **"Edit Framework Scope"**

**System Boundaries**:
- What's included: Your production infrastructure, data processing systems
- What's excluded: Internal corporate IT, development/staging (unless relevant)

**Example scope statement**:
> This SOC 2 report covers Acme Inc's SaaS platform ("Acme Cloud"), including:
> - Production AWS infrastructure (us-east-1, us-west-2)
> - Customer data processing systems
> - API and web application
> - Database and storage systems
> - Employee access to production systems
>
> Excluded from scope:
> - Corporate IT systems (laptops, internal tools)
> - Development and staging environments
> - Marketing website (separate infrastructure)

**Why scope matters**: Auditors only examine in-scope systems. Clear scope prevents surprises.

#### Step 2: Select Trust Service Categories

SOC 2 has 5 categories. You must include Security; others are optional.

**Security (CC) - Required**:
- Access controls (CC6)
- System operations (CC7)
- Change management (CC8)
- Risk mitigation (CC9)

**Availability (A) - For SaaS**:
- Uptime commitments
- Disaster recovery
- System monitoring
- Incident response

**Confidentiality (C) - For sensitive data**:
- Data encryption
- Confidentiality agreements
- Data disposal
- Access restrictions

**Processing Integrity (PI) - For data processing**:
- Data accuracy
- Processing errors
- Quality monitoring
- Authorization workflows

**Privacy (P) - For personal data**:
- Privacy notices
- Data collection/use
- Data retention
- Data subject rights

**Recommendation**: SaaS companies typically choose **Security + Availability + Confidentiality**.

#### Step 3: Customize Controls (Growth Tier+)

You can add custom controls or modify existing ones:

1. Click **"Controls"** tab
2. Select a control (e.g., CC6.1)
3. Click **"Customize"**

**What you can customize**:
- **Control description**: Tailor to your implementation
- **Evidence requirements**: Add company-specific evidence
- **Testing procedures**: Define how you'll test the control
- **Responsible parties**: Assign owners

**Example customization** (CC6.1 - Logical Access):

**Standard description**:
> The entity has implemented logical access security measures to protect information and systems from unauthorized access.

**Customized for Acme Inc**:
> Acme Inc enforces logical access controls on production AWS infrastructure and application layer:
> - SSO via Okta with MFA required
> - AWS IAM policies based on least privilege
> - Annual access reviews and quarterly de-provisioning audits
> - Application-layer RBAC (Role-Based Access Control)

**Added evidence**:
- Okta access logs (auto-collected)
- AWS IAM policy exports (auto-collected)
- Quarterly access review spreadsheets (manual upload)
- RBAC configuration documentation (manual upload)

#### Step 4: Map Evidence Sources

1. For each control, click **"Evidence Mapping"**
2. You'll see:
   - **Auto-collected evidence**: From integrations
   - **Manual evidence**: Uploaded documents
   - **Missing evidence**: Gaps to fill

**Example: CC6.1 Evidence Mapping**

**Auto-collected** (via integrations):
- ✅ AWS IAM policies (AWS integration)
- ✅ Okta user access logs (Okta integration)
- ✅ GitHub branch protection rules (GitHub integration)
- ✅ Slack access logs (Slack integration)

**Manual uploads needed**:
- ⬜ Access control policy document
- ⬜ Quarterly access review spreadsheet
- ⬜ Terminated employee de-provisioning records

**Click "Upload Evidence"** to add manual evidence:
1. Drag and drop files (PDF, DOCX, XLSX, CSV)
2. Tag with control IDs (CC6.1)
3. Add description and date
4. Click "Upload"

Our AI automatically:
- Extracts relevant information
- Maps to control requirements
- Detects duplicates
- Validates completeness

#### Step 5: Set Control Testing Frequency

1. Click **"Testing Schedule"**
2. For each control, set frequency:
   - **Continuous**: Automated testing (AWS, cloud tools)
   - **Daily**: Critical security controls
   - **Weekly**: Access logs, monitoring alerts
   - **Monthly**: Policy reviews, access audits
   - **Quarterly**: Management reviews
   - **Annual**: Major assessments, penetration tests

**Recommendation**: Use continuous/daily for everything you can automate. Manual testing is expensive and error-prone.

#### Step 6: Assign Control Owners

1. Go to **Controls** tab
2. For each control, click **"Assign Owner"**
3. Select team member responsible for:
   - Implementing the control
   - Collecting evidence
   - Responding to findings
   - Maintaining documentation

**Example ownership**:
- **CC6.x** (Access controls): Security Engineer
- **CC7.x** (Operations): DevOps Lead
- **CC8.x** (Change management): Engineering Manager
- **CC9.x** (Risk management): CISO/Compliance Lead
- **A1.x** (Availability): SRE Lead

**Pro tip**: Control owners get automatic notifications when their controls fail or need attention.

## Policy & Procedure Documentation

### Required Policies for SOC 2

SOC 2 requires written policies. ComplyEasyAI includes templates:

1. Navigate to **Policies** tab
2. Click **"Generate Policies from Template"**
3. Select policies needed:
   - ✅ Information Security Policy
   - ✅ Access Control Policy
   - ✅ Change Management Policy
   - ✅ Incident Response Policy
   - ✅ Risk Management Policy
   - ✅ Vendor Management Policy
   - ✅ Business Continuity/Disaster Recovery Policy
   - ✅ Acceptable Use Policy
   - ✅ Data Classification Policy

4. Our AI will:
   - Generate policies customized to your organization
   - Pre-fill with your company name, scope, roles
   - Include industry best practices
   - Map policies to controls

5. Review and customize:
   - Edit sections to match your actual practices
   - Add company-specific requirements
   - Get legal review if needed

6. Click **"Approve & Publish"**

**What happens next**:
- Policies are version-controlled
- Team members are notified to review
- Acknowledgment tracking begins
- Policies are linked to evidence for controls

### Policy Approval Workflow

1. Draft policy created (AI-generated or manual)
2. Assigned reviewers notified (Security, Legal, Management)
3. Reviewers provide feedback (tracked in comments)
4. Policy owner makes revisions
5. Final approval by CISO or designated approver
6. Policy published and distributed to team
7. Team members acknowledge reading (tracked)
8. Annual review scheduled automatically

**Audit trail**: Every change, review, and acknowledgment is logged for auditors.

---

# Automated Evidence Collection

**Goal**: Set up fully automated evidence collection for 80%+ of controls.
**Time**: 2-3 hours
**Tier**: All tiers
**Prerequisites**: Integrations connected

## Understanding Evidence Types

### Automated Evidence (80%)

**Infrastructure Evidence**:
- Cloud configuration (IAM, security groups, encryption)
- Access logs (who accessed what, when)
- Network traffic logs
- Backup logs and test results
- Monitoring and alerting configs

**Application Evidence**:
- Code repositories (commits, reviews, branch protection)
- CI/CD pipelines (build logs, deployment records)
- Dependency scans (vulnerabilities)
- Application logs (errors, access)

**Identity & Access**:
- User provisioning/de-provisioning
- MFA enrollment
- Access reviews
- SSO logs

**Security Tools**:
- Vulnerability scans
- Penetration test reports
- Security monitoring alerts
- Threat intelligence

### Manual Evidence (20%)

**Management Evidence**:
- Board meeting minutes
- Security training records
- Policy acknowledgments
- Vendor assessments

**Operational Evidence**:
- Incident response reports
- Change advisory board meeting notes
- Business continuity test results
- Physical security documentation

**Contractual Evidence**:
- Employee NDAs
- Vendor contracts
- Customer DPAs (Data Processing Agreements)
- Insurance policies (cyber liability)

## Setting Up Evidence Collection

### AWS Evidence Automation

**What we collect automatically from AWS**:

**Access Controls** (CC6.x):
- IAM users, roles, groups
- IAM policies and permissions
- MFA status for all users
- Access keys age and usage
- Root account access logs

**System Operations** (CC7.x):
- CloudWatch logs and alarms
- GuardDuty findings
- Security Hub compliance status
- Config rules compliance
- VPC Flow Logs

**Monitoring** (CC7.2, CC7.3):
- CloudWatch metrics and dashboards
- SNS/SES alert configurations
- Lambda function logs
- API Gateway logs

**Data Protection** (C1.x):
- S3 bucket encryption status
- S3 bucket policies (public access blocking)
- RDS encryption status
- EBS volume encryption
- KMS key configurations

**Network Security** (CC6.6, CC6.7):
- Security group rules
- Network ACLs
- VPC configurations
- PrivateLink endpoints
- WAF rules

**Collection frequency**: Daily at 2 AM UTC (configurable)

**Configuration**:
1. Go to **Integrations → AWS → Configure**
2. Select evidence types to collect (all recommended)
3. Choose collection frequency
4. Set retention period (7 years default for compliance)
5. Click **"Save & Sync Now"**

### GitHub Evidence Automation

**What we collect from GitHub**:

**Change Management** (CC8.x):
- All commits with author, timestamp, message
- Pull request approvals and reviewers
- Branch protection rules
- Merge restrictions
- Code owner requirements

**Security** (CC9.x):
- Dependabot alerts
- Code scanning results
- Secret scanning findings
- Security advisories

**Access Controls** (CC6.x):
- Organization member list
- Repository access levels
- Two-factor authentication status
- SSO enforcement

**Example evidence**:

```json
{
  "type": "github_branch_protection",
  "repository": "acme-app",
  "branch": "main",
  "protection_rules": {
    "required_approvals": 2,
    "dismiss_stale_reviews": true,
    "require_code_owner_review": true,
    "required_status_checks": ["tests", "lint", "security-scan"],
    "enforce_admins": true
  },
  "collected_at": "2025-01-15T02:00:00Z"
}
```

**Maps to controls**: CC8.1 (change management)

### Slack Evidence Automation

**What we collect from Slack**:

**Incident Response** (CC7.5):
- Messages in #security-incidents channel
- Incident timeline and resolution
- Participant list
- Escalation workflows

**Change Notifications** (CC8.1):
- Deployment notifications in #deploys channel
- Change approval messages
- Rollback communications

**Security Alerts** (CC7.2):
- Alerts from monitoring tools
- Security tool notifications
- Compliance alerts

**Privacy**: We only read channels you explicitly add us to. We never access DMs or private channels unless invited.

**Setup**:
1. In Slack, invite @ComplyEasyAI bot to relevant channels:
   - `/invite @ComplyEasyAI` in #security-incidents
   - `/invite @ComplyEasyAI` in #deploys
   - `/invite @ComplyEasyAI` in #security-alerts

2. In ComplyEasyAI, go to **Integrations → Slack → Configure**
3. Map channels to evidence types:
   - #security-incidents → Incident Response (CC7.5)
   - #deploys → Change Management (CC8.1)
   - #security-alerts → Monitoring (CC7.2)

### Okta Evidence Automation

**What we collect from Okta**:

**Identity & Access** (CC6.x):
- User provisioning/de-provisioning events
- MFA enrollment and authentication
- SSO login events
- Failed login attempts
- Application assignments

**Example: User Onboarding Evidence**

When HR adds a new employee to Okta:
1. User created event (timestamp, creator, user details)
2. Group assignments (role-based access)
3. Application access granted (which apps)
4. MFA enrollment (date, method)

Our AI automatically:
- Collects all events
- Maps to CC6.1 (access provisioning)
- Verifies MFA requirement (CC6.1)
- Checks for approval workflow (CC6.2)

**Example: User Offboarding Evidence**

When employee leaves:
1. User deactivated event
2. Application access revoked
3. Group memberships removed
4. SSO sessions terminated

Maps to: CC6.3 (access revocation)

## Evidence Validation & Quality

### AI Evidence Validation

Our AI automatically validates evidence for:

**Completeness**:
- ✅ All required fields present
- ✅ Timestamps within expected range
- ✅ No missing critical data

**Accuracy**:
- ✅ Data formats correct
- ✅ Values within expected ranges
- ✅ No obvious errors or anomalies

**Relevance**:
- ✅ Evidence matches control requirement
- ✅ Timeframe matches audit period
- ✅ Scope matches framework boundaries

**Sufficiency**:
- ✅ Enough evidence samples
- ✅ Coverage of full audit period
- ✅ Multiple evidence sources for critical controls

### Evidence Quality Score

Each piece of evidence gets a quality score (0-100):

**90-100**: Excellent
- Complete, accurate, directly relevant
- Automatically accepted

**70-89**: Good
- Minor issues, mostly complete
- Reviewed by AI, may need human confirmation

**50-69**: Acceptable with Issues
- Missing some fields or partial data
- Requires human review

**< 50**: Insufficient
- Critical data missing or incorrect
- Needs replacement or supplementation

### Evidence Sampling

Auditors don't review ALL evidence—they sample. Our AI prepares samples:

**Sampling strategies**:
- **Random**: Unbiased selection across time period
- **Risk-based**: Focus on high-risk periods or events
- **Edge cases**: Unusual events, exceptions, failures
- **Complete population**: For small populations (< 25 items)

**Example: Access Review Sampling**

Control: CC6.1 (Quarterly access reviews)
Population: 4 access reviews (Q1, Q2, Q3, Q4)
Sample size: 100% (small population)

Our AI:
1. Retrieves all 4 access review documents
2. Validates each review:
   - ✅ Complete user list reviewed
   - ✅ Approvals from managers
   - ✅ De-provisioning actions for termed users
   - ✅ Quarterly cadence maintained
3. Packages for auditor

**Example: CloudTrail Logging Sampling**

Control: CC6.1 (Monitor privileged access)
Population: 2.5 million CloudTrail events
Sample size: 25 events (per AICPA guidance)

Our AI:
1. Samples 25 random admin-level events
2. Validates each event logged correctly
3. Checks for appropriate access (no unauthorized activity)
4. Packages with statistical extrapolation

---

# Control Monitoring

**Goal**: Set up continuous control monitoring with automated alerts.
**Time**: 1 hour
**Tier**: Essentials or higher (for automated monitoring)
**Prerequisites**: Evidence collection working

## Understanding Control States

### Control Lifecycle

**Design** → **Implementation** → **Operating** → **Tested** → **Effective**

**Designed**: Control is documented (policy written)
**Implemented**: Control is deployed (technical controls in place)
**Operating**: Control is running (evidence being collected)
**Tested**: Control effectiveness verified (AI or human testing)
**Effective**: Control passes all tests consistently

### Control Status Indicators

**Passing (Green) ✅**:
- Control is operating effectively
- Evidence is sufficient and valid
- No failures in testing period
- Meets audit requirements

**Warning (Yellow) ⚠️**:
- Minor issues detected
- Evidence quality concerns
- Approaching failure threshold
- Needs attention soon

**Failing (Red) ❌**:
- Control not operating effectively
- Evidence missing or invalid
- Test failures detected
- Immediate remediation needed

**Not Tested (Gray) ⭕**:
- Control designed but not yet tested
- Insufficient evidence collected
- Too early in observation period

## Setting Up Continuous Monitoring

### Automated Control Testing

1. Navigate to **Controls → Monitoring**
2. Click **"Enable Continuous Monitoring"**
3. Configure testing rules:

**Example: CC6.1 (Logical Access Controls)**

**Automated tests**:
- ✅ All AWS IAM users have MFA enabled
- ✅ No root account access in last 30 days
- ✅ Access keys rotated every 90 days
- ✅ No wildcard (*) permissions in production
- ✅ All users assigned to appropriate groups

**Test frequency**: Daily
**Alert threshold**: Any failure
**Auto-remediation**: Optionally revoke non-compliant access (aCOS only)

**Example: CC7.2 (System Monitoring)**

**Automated tests**:
- ✅ CloudWatch alarms configured for critical metrics
- ✅ Alarms triggered alerts in last 30 days (verify alerting works)
- ✅ All alarms have SNS subscriptions
- ✅ GuardDuty enabled in all regions
- ✅ Security Hub compliance > 90%

**Test frequency**: Daily
**Alert threshold**: < 90% compliance

### Setting Alert Thresholds

**Conservative (recommended for audit preparation)**:
- Any control failure → Immediate alert
- Evidence quality < 70 → Daily digest
- Compliance score drops > 5% → Immediate alert

**Balanced (for ongoing operations)**:
- High/critical control failures → Immediate alert
- Medium control failures → Daily digest
- Low control failures → Weekly summary

**Relaxed (mature compliance programs)**:
- Only critical control failures → Immediate alert
- All other failures → Weekly summary

Configure at: **Settings → Monitoring → Alert Thresholds**

### Compliance Drift Detection

**What is compliance drift?**

Your infrastructure changes constantly (deployments, config changes, new users). Compliance drift happens when changes violate controls.

**Example drift scenarios**:

**Scenario 1: Security Group Change**
- Engineer adds `0.0.0.0/0` (internet) access to production database security group
- **Drift detected**: Violates CC6.7 (network segmentation)
- **Alert sent**: Immediate Slack notification to Security team
- **aCOS action** (if enabled): Automatically revoke rule and notify engineer

**Scenario 2: Terminated Employee Access**
- Employee terminated in HR system (BambooHR)
- But Okta account not deactivated (manual oversight)
- **Drift detected**: Violates CC6.3 (access revocation)
- **Alert sent**: Email to IT manager
- **aCOS action**: Automatically deactivate Okta account after 4-hour grace period

**Scenario 3: Encryption Disabled**
- S3 bucket created without encryption
- **Drift detected**: Violates C1.1 (data encryption)
- **Alert sent**: Immediate email to DevOps
- **aCOS action**: Enable default encryption on bucket

### Drift Detection Configuration

1. Go to **Controls → Drift Detection**
2. For each control, configure:
   - **Detection frequency**: Continuous, hourly, daily
   - **Sensitivity**: Strict, balanced, permissive
   - **Alert routing**: Who gets notified
   - **Auto-remediation**: Enable/disable aCOS healing

**Recommended settings**:
- **Security controls** (CC6.x, CC9.x): Continuous, strict, auto-remediate
- **Operational controls** (CC7.x): Hourly, balanced, alert only
- **Change controls** (CC8.x): Daily, balanced, alert only

---

# Risk Assessment & Management

**Goal**: Set up AI-powered risk assessment with predictive analytics.
**Time**: 1-2 hours
**Tier**: All tiers (AI Risk Analyzer), Growth+ for advanced features
**Prerequisites**: Framework configured, evidence collecting

## AI Risk Analyzer Setup

### Initial Risk Assessment

1. Navigate to **Risk → Assessment**
2. Click **"Run AI Risk Assessment"**

The AI will analyze:
- Control failures and weaknesses
- Industry-specific threats
- Your infrastructure vulnerabilities
- Historical incident data
- Compliance gaps

**Assessment takes**: 5-15 minutes depending on data volume

### Understanding Risk Scores

**Risk Calculation**:
```
Risk Score = (Likelihood × Impact × Velocity) / Control Effectiveness
```

**Likelihood** (1-5): How likely is this risk to occur?
- 1 = Rare (< 5% annual probability)
- 3 = Possible (20-50% probability)
- 5 = Highly likely (> 80% probability)

**Impact** (1-5): What's the damage if it occurs?
- 1 = Minimal (< $10K)
- 3 = Moderate ($100K-$1M)
- 5 = Catastrophic (> $10M or existential threat)

**Velocity** (1-5): How fast does this risk materialize?
- 1 = Slow (months of warning)
- 3 = Moderate (weeks)
- 5 = Rapid (hours or days)

**Control Effectiveness** (0-100%): How well are you mitigating this?

**Example Risk Calculation**:

**Risk**: Ransomware attack

- **Likelihood**: 4 (common threat)
- **Impact**: 5 (could cripple business)
- **Velocity**: 5 (spreads in hours)
- **Control Effectiveness**: 60% (some controls, some gaps)

**Risk Score**: (4 × 5 × 5) / 0.6 = **166.7** (Critical)

### Risk Categories

**Security Risks**:
- Unauthorized access
- Data breaches
- Malware/ransomware
- Insider threats
- DDoS attacks

**Compliance Risks**:
- Audit failures
- Regulatory violations
- Certification loss
- Fines and penalties

**Operational Risks**:
- System outages
- Data loss
- Service disruptions
- Vendor failures

**Strategic Risks**:
- Technology obsolescence
- Competitive disadvantage
- Reputation damage
- Market changes

### Risk Treatment Options

For each identified risk, choose a treatment:

**Mitigate** (most common):
- Implement controls to reduce likelihood or impact
- Example: Add MFA to reduce unauthorized access risk

**Accept**:
- Risk is below appetite threshold
- Cost of mitigation exceeds benefit
- Document acceptance and rationale

**Transfer**:
- Shift risk to third party
- Example: Cyber insurance, vendor contracts
- Risk remains, financial impact transferred

**Avoid**:
- Eliminate the risky activity
- Example: Stop processing credit cards → no PCI DSS risk
- Often not feasible

## Predictive Risk Modeling (Growth Tier+)

### 30-90 Day Risk Forecasting

Our AI predicts future risks based on:
- Current control trends
- Infrastructure change patterns
- Industry threat intelligence
- Seasonal risk patterns (e.g., holiday security risks)

**Example forecast**:

> **Predicted Risk (30 days): Access Control Drift**
>
> - **Current risk score**: 45 (Medium)
> - **Predicted risk score**: 78 (High)
> - **Confidence**: 87%
>
> **Why**: Your engineering team is growing 20% per month. Access provisioning manual steps are failing to keep pace. Without process automation, we predict:
> - 15% of new hires will have excessive permissions
> - 5-8 terminated employees will retain access > 24 hours
> - Control CC6.1 will fail by February 15, 2025
>
> **Recommended actions**:
> 1. Implement automated onboarding via Okta workflows (high impact)
> 2. Enable aCOS auto-deprovisioning (high impact)
> 3. Increase access review frequency to monthly (medium impact)

### Risk Trend Analysis

1. Go to **Risk → Trends**
2. View risk over time:
   - Overall risk score trend
   - Risk by category
   - Risk by framework
   - Risk velocity (rate of change)

**Healthy trend**: Decreasing or stable risk as you remediate
**Concerning trend**: Increasing risk (growth, new threats, control degradation)

### Risk Heat Map

Visual matrix showing risks by likelihood and impact:

```
Impact ↑
  5 │ [2 risks]  [5 risks]  [8 risks]  [12 risks] [15 risks]
  4 │ [1 risk]   [3 risks]  [6 risks]  [9 risks]  [11 risks]
  3 │ [0 risks]  [2 risks]  [4 risks]  [7 risks]  [10 risks]
  2 │ [0 risks]  [1 risk]   [2 risks]  [4 risks]  [5 risks]
  1 │ [0 risks]  [0 risks]  [1 risk]   [1 risk]   [2 risks]
    └──────────────────────────────────────────────────────→
      1          2          3          4          5    Likelihood
```

**Priority**: Focus on top-right quadrant (high likelihood + high impact).

## Risk Register Management

### Creating Risk Register

1. Go to **Risk → Register**
2. Your AI-identified risks are auto-populated
3. You can add manual risks:
   - Click **"Add Risk"**
   - Enter risk details:
     - Title and description
     - Category (security, compliance, operational)
     - Likelihood, impact, velocity ratings
     - Affected controls
     - Treatment plan

### Risk Ownership

1. Assign each risk to an owner (accountable person)
2. Set review frequency (monthly/quarterly)
3. Risk owner responsibilities:
   - Monitor risk status
   - Execute treatment plan
   - Update risk register
   - Report to management

### Board-Level Risk Reporting

Generate executive risk reports for board meetings:

1. Go to **Risk → Reports**
2. Click **"Generate Board Report"**
3. Select:
   - Time period (current quarter)
   - Risk threshold (only high/critical)
   - Format (PDF, PowerPoint)

**Report includes**:
- Executive summary (1 page)
- Top 10 risks
- Risk trends and changes
- Mitigation progress
- Budget and resources needed
- Comparison to industry benchmarks

---

# SOC 2 Certification Guide

**Goal**: Complete end-to-end SOC 2 Type II certification.
**Time**: 6-12 months
**Tier**: Essentials or higher recommended
**Prerequisites**: None (we'll guide you from zero)

## SOC 2 Overview

### What is SOC 2?

**SOC 2** (Service Organization Control 2) is an auditing procedure that ensures service providers securely manage customer data.

**Who needs it**: Any SaaS company selling to enterprises

**Why customers require it**: Proves you have effective security controls to protect their data

**Types**:
- **Type I**: Point-in-time (controls designed appropriately)
- **Type II**: Over time (controls operate effectively for 3-12 months)

**Most companies need**: Type II

### SOC 2 Timeline

**Phase 1: Preparation** (2-4 months)
- Gap assessment
- Control design and implementation
- Policy documentation
- Evidence automation setup

**Phase 2: Observation** (3-6 months)
- Minimum 3 months, typically 6 or 12
- Controls must operate continuously
- Evidence collected automatically
- Issues remediated as found

**Phase 3: Audit** (4-8 weeks)
- Auditor engagement
- Evidence review
- Testing and sampling
- Report issuance

**Total**: 9-14 months typical
**With ComplyEasyAI**: 6-9 months

## Month-by-Month Roadmap

### Month 1-2: Foundation

**Week 1-2: Setup**
- ✅ Sign up for ComplyEasyAI
- ✅ Complete SOC 2 framework setup
- ✅ Connect core integrations (AWS, GitHub, Okta, Slack)
- ✅ Invite team members
- ✅ Run initial gap assessment

**Week 3-4: Gap Analysis**
- ✅ Review AI-generated gap assessment
- ✅ Prioritize critical gaps (security controls first)
- ✅ Create remediation plan
- ✅ Assign control owners
- ✅ Set target observation start date

**Week 5-6: Quick Wins**
- ✅ Enable MFA on all accounts
- ✅ Configure AWS CloudTrail and GuardDuty
- ✅ Set up GitHub branch protection
- ✅ Enable Okta system logs
- ✅ Configure monitoring and alerting

**Week 7-8: Policy Documentation**
- ✅ Generate policies from templates
- ✅ Customize policies for your organization
- ✅ Legal/management review
- ✅ Publish and distribute
- ✅ Track employee acknowledgments

**Milestone**: 40-60% compliance score, major gaps identified

### Month 3-4: Implementation

**Focus**: Implement missing controls

**Access Controls (CC6.x)**:
- ✅ Implement RBAC in production systems
- ✅ Set up quarterly access reviews
- ✅ Document onboarding/offboarding procedures
- ✅ Enable session timeout and screen lock
- ✅ Configure password requirements (complexity, rotation)

**System Operations (CC7.x)**:
- ✅ Implement centralized logging (CloudWatch, Splunk, Datadog)
- ✅ Configure security monitoring and alerting
- ✅ Set up incident response runbooks
- ✅ Create change management process
- ✅ Document system architecture and data flows

**Change Management (CC8.x)**:
- ✅ Implement code review requirements (PRs, approvals)
- ✅ Set up CI/CD with automated testing
- ✅ Create change approval workflow for production
- ✅ Document rollback procedures
- ✅ Set up deployment notifications

**Risk Management (CC9.x)**:
- ✅ Complete risk assessment (use AI Risk Analyzer)
- ✅ Document risk treatment plans
- ✅ Implement risk mitigation controls
- ✅ Set up vulnerability scanning
- ✅ Schedule annual penetration testing

**Milestone**: 70-80% compliance score, observation-ready

### Month 5-10: Observation Period

**What happens during observation**:
- Controls operate continuously
- Evidence auto-collected daily
- Any failures remediated immediately
- Compliance score maintained > 85%

**Your responsibilities**:
- Weekly compliance review meetings
- Monitor control failures and remediate
- Conduct quarterly access reviews
- Complete security training
- Maintain documentation

**Common issues during observation**:

**Issue 1: Control Failures**
- **Example**: Terminated employee access not revoked within 24 hours
- **Fix**: Enable aCOS auto-deprovisioning
- **Prevention**: Automated workflows

**Issue 2: Evidence Gaps**
- **Example**: Quarterly access review not documented
- **Fix**: Upload review spreadsheet manually
- **Prevention**: Set calendar reminders, use templates

**Issue 3: Policy Violations**
- **Example**: Production change without approval
- **Fix**: Document exception, add to change log
- **Prevention**: Enforce branch protection, require PR approvals

**Monthly checklist**:
- [ ] Review compliance dashboard
- [ ] Check for control failures (remediate within 48 hours)
- [ ] Verify evidence collection working
- [ ] Complete any manual evidence uploads
- [ ] Update risk register
- [ ] Review security alerts and incidents
- [ ] Board/management reporting

**Milestone**: 6 months of clean operation, 90%+ compliance score

### Month 11-12: Audit Preparation

**Week 1-2: Auditor Selection**
- ✅ Research SOC 2 auditors (Big 4 or reputable regional firms)
- ✅ Get quotes (typical: $25K-$75K for Type II)
- ✅ Check auditor's AICPA registration
- ✅ Review sample reports
- ✅ Negotiate scope and pricing

**Week 3-4: Pre-Audit**
- ✅ Run AI Red Team to find gaps auditors might catch
- ✅ Remediate any issues found
- ✅ Package evidence (ComplyEasyAI does this automatically)
- ✅ Prepare team for auditor interviews
- ✅ Schedule kickoff call

**Week 5-8: Audit**

**Kickoff** (Week 5):
- Auditor reviews scope
- Requests documentation
- Schedules interviews

**Evidence Review** (Week 6-7):
- Auditor tests controls
- Reviews evidence samples
- Requests clarifications
- Issues preliminary findings

**Interviews** (Week 7):
- Auditor interviews control owners
- Verifies implementation
- Asks follow-up questions

**Findings & Remediation** (Week 8):
- Auditor issues findings report
- You remediate any issues
- Auditor re-tests
- Final report drafted

**Week 9-10: Report Issuance**
- ✅ Auditor issues SOC 2 Type II report
- ✅ Review report for accuracy
- ✅ Request corrections if needed
- ✅ Receive final report
- ✅ Distribute to customers

**Milestone**: SOC 2 Type II certified! 🎉

## Post-Certification: Continuous Compliance

**SOC 2 isn't one-and-done**. You need to:

**Maintain controls** (continuous):
- aCOS monitors and auto-heals 24/7
- You review exceptions and critical alerts

**Re-audit annually** (12 months):
- Update observation period (rolling 12 months)
- Re-engage auditor
- Repeat audit process

**Expand scope** (as you grow):
- Add Trust Service Categories (Availability, Confidentiality)
- Include new systems/services
- Update system description

**Leverage for other frameworks**:
- ISO 27001 (70% overlap)
- HIPAA (if healthcare)
- PCI DSS (if payments)

---

# Using AI Red Team

**Goal**: Simulate adversarial attacks on your compliance program to find gaps before auditors do.
**Time**: 30 minutes to run, 1-2 hours to remediate findings
**Tier**: Growth or higher
**Prerequisites**: At least one framework configured with evidence

## What is AI Red Team?

**Traditional Red Team**: Security experts simulate attacks on your infrastructure to find vulnerabilities.

**AI Red Team**: AI simulates *compliance* attacks—how an auditor or adversary would challenge your compliance program to find gaps.

**Use cases**:
- Pre-audit preparation (find issues before auditor)
- Continuous validation (quarterly red team exercises)
- Board presentations (demonstrate compliance rigor)
- Training (teach team to think like auditors)

## Running Your First Red Team Exercise

### Step 1: Configure Exercise

1. Navigate to **AI Tools → Red Team**
2. Click **"New Red Team Exercise"**
3. Configure parameters:

**Framework**: SOC 2 Type II
**Focus areas** (select one or more):
- ✅ Access Controls (CC6)
- ✅ Security Monitoring (CC7)
- ⬜ Change Management (CC8)
- ⬜ Risk Management (CC9)

**Attack vectors**:
- ✅ Control design flaws
- ✅ Evidence gaps
- ✅ Policy violations
- ✅ Implementation weaknesses
- ✅ Sampling failures

**Aggression level**:
- **Conservative**: Finds obvious gaps (good for first run)
- **Balanced**: Standard audit rigor
- **Aggressive**: Adversarial auditor (finds every possible issue)

**Recommendation**: Start with Conservative, graduate to Aggressive as you mature.

4. Click **"Launch Red Team Exercise"**

### Step 2: Review Findings

**Exercise takes**: 10-30 minutes depending on data volume

**Output**: Red Team Report with findings categorized by severity

**Example findings**:

**CRITICAL Finding 1: MFA Not Enforced for All Admin Users**

- **Control**: CC6.1 (Logical Access Controls)
- **Evidence reviewed**: Okta user list, AWS IAM policies
- **Gap identified**: 3 out of 47 admin users do not have MFA enabled
- **Risk**: Adversary could compromise admin account with stolen password
- **Auditor perspective**: "Why do these 3 users not have MFA?"
- **Remediation**: Enforce MFA for all users, no exceptions
- **Estimated fix time**: 30 minutes

**HIGH Finding 2: Incomplete Access Review Documentation**

- **Control**: CC6.1 (User Access Reviews)
- **Evidence reviewed**: Q4 2024 access review spreadsheet
- **Gap identified**: 15% of users not included in review (oversight)
- **Risk**: Terminated employees or users with excessive permissions missed
- **Auditor perspective**: "How do you ensure ALL users are reviewed?"
- **Remediation**: Re-run Q4 review with complete user list
- **Estimated fix time**: 2 hours

**MEDIUM Finding 3: Security Monitoring Alert Response Time Not Documented**

- **Control**: CC7.2 (System Monitoring)
- **Evidence reviewed**: CloudWatch alarms, incident response logs
- **Gap identified**: Alarms are configured and triggering, but response SLAs not documented
- **Risk**: Auditor cannot verify timely response to security events
- **Auditor perspective**: "What's your SLA for responding to critical alerts?"
- **Remediation**: Document SLA in Incident Response Policy, add to runbooks
- **Estimated fix time**: 1 hour

**LOW Finding 4: Backup Test Documentation Informal**

- **Control**: A1.2 (Availability - Backup)
- **Evidence reviewed**: Backup test results
- **Gap identified**: Tests performed but documentation is informal (Slack messages)
- **Risk**: Minor presentation issue, control is operating
- **Auditor perspective**: "Can you provide formal documentation of backup tests?"
- **Remediation**: Create backup test report template, formalize process
- **Estimated fix time**: 30 minutes

### Step 3: Prioritize Remediation

1. Review findings by severity
2. Create remediation plan:
   - **Critical/High**: Fix immediately (within 48 hours)
   - **Medium**: Fix this week
   - **Low**: Fix before audit (can be backlog)

3. Assign findings to owners
4. Track remediation in **Tasks** module

### Step 4: Re-Run Red Team

After remediation:
1. Click **"Re-Run Red Team"** on same exercise
2. AI re-tests the same controls
3. Verify findings resolved
4. Generate comparison report (before/after)

**Goal**: Zero critical/high findings before audit

## Advanced Red Team Scenarios

### Scenario 1: Adversarial Auditor

**Simulation**: Aggressive auditor who questions everything

**AI will**:
- Challenge policy language ("too vague")
- Question evidence sufficiency ("only 2 samples?")
- Find edge cases ("what about contractors?")
- Test exception handling ("who approves violations?")

**Example finding**:

> **Your access control policy states**: "Access is granted based on job role."
>
> **Adversarial auditor asks**: "How do you define job roles? Who approves role definitions? How often are roles reviewed? What if someone needs access outside their role? Who approves exceptions? How do you track temporary access?"
>
> **Your current evidence**: Doesn't address any of these questions.
>
> **Remediation**: Update policy with:
> - Role definition process (HR defines, CISO approves)
> - Annual role review cadence
> - Exception approval workflow (manager + security approval)
> - Temporary access tracking (max 30 days, logged in Okta)

### Scenario 2: Sampling Attack

**Simulation**: AI tests if your evidence would survive statistical sampling

Auditors sample evidence (e.g., 25 out of 10,000 items). If your sample fails, your control fails.

**AI will**:
- Randomly sample your evidence
- Check for gaps, inconsistencies, errors
- Calculate failure rate
- Extrapolate to full population

**Example finding**:

> **Control**: CC8.1 (All production changes require approval)
>
> **Population**: 487 production deployments in observation period
>
> **AI sample**: 25 random deployments
>
> **Failures**: 2 deployments lack approval evidence (8% failure rate)
>
> **Statistical extrapolation**: ~39 out of 487 deployments may lack approval
>
> **Auditor conclusion**: Control NOT operating effectively (> 5% failure)
>
> **Remediation**:
> 1. Investigate 2 failures (were they actually approved but not logged?)
> 2. Enforce GitHub branch protection (prevent merge without approval)
> 3. Backfill approval evidence for any missing items

### Scenario 3: Cross-Control Analysis

**Simulation**: AI looks for contradictions across related controls

Controls should be consistent. Contradictions suggest gaps.

**Example finding**:

> **Control CC6.1** says: "Access reviews are performed quarterly."
>
> **Control CC6.3** says: "Terminated employees are de-provisioned within 24 hours."
>
> **Evidence for CC6.1**: Shows 4 quarterly access reviews with terminated employees identified and removed.
>
> **Evidence for CC6.3**: Shows de-provisioning happens within 24 hours of HR notification.
>
> **Contradiction detected**: If de-provisioning is automatic within 24 hours, why are terminated employees found in quarterly reviews (up to 90 days later)?
>
> **Actual issue**: Manual accounts (e.g., VPN, database) not integrated with auto-deprovisioning.
>
> **Remediation**: Integrate all access systems with Okta SSO or auto-deprovisioning workflow.

---

# Troubleshooting Guide

See the separate **TROUBLESHOOTING_GUIDE.md** for comprehensive troubleshooting information.

---

# Additional Resources

## Video Tutorials

- **Getting Started**: 15-minute platform walkthrough
- **Evidence Automation**: 20-minute deep dive on integrations
- **AI Features**: 30-minute guide to AI Risk Analyzer, Red Team, Digital Twin
- **Audit Preparation**: 45-minute webinar on passing your first audit

**Access**: learn.complyeasy.ai

## Live Training

- **Weekly Office Hours**: Every Tuesday 10am PT (open Q&A)
- **Monthly Webinars**: Deep-dives on specific topics
- **Custom Training**: On-site or virtual for Growth/Visionary customers

**Register**: training.complyeasy.ai

## Documentation

- **Knowledge Base**: docs.complyeasy.ai
- **API Documentation**: developers.complyeasy.ai
- **Integration Guides**: docs.complyeasy.ai/integrations

## Community

- **Community Forum**: community.complyeasy.ai
- **Slack Community**: Join #complyeasyai-users (3,000+ members)
- **LinkedIn Group**: ComplyEasyAI Practitioners

## Support

- **Email**: support@complyeasy.ai
- **Chat**: In-app chat (bottom-right corner)
- **Phone** (Growth/Visionary): +1 (555) 123-4567

---

*Last Updated: January 2025*
*Version: 2.0*
