# ComplyEasyAI Troubleshooting Guide

## Table of Contents

### Platform Issues
- [Login & Authentication](#login--authentication)
- [Performance & Loading](#performance--loading)
- [Data Sync Issues](#data-sync-issues)

### Integration Problems
- [AWS Integration](#aws-integration)
- [GitHub Integration](#github-integration)
- [Slack Integration](#slack-integration)
- [Okta Integration](#okta-integration)
- [Generic Integration Issues](#generic-integration-issues)

### Evidence Collection
- [Missing Evidence](#missing-evidence)
- [Evidence Quality Issues](#evidence-quality-issues)
- [Evidence Mapping Problems](#evidence-mapping-problems)

### Controls & Compliance
- [Control Failures](#control-failures)
- [Compliance Score Issues](#compliance-score-issues)
- [Framework Configuration](#framework-configuration)

### AI Features
- [AI Risk Analyzer](#ai-risk-analyzer-issues)
- [AI Red Team](#ai-red-team-issues)
- [AI Chatbot](#ai-chatbot-issues)
- [aCOS (Autonomous Compliance)](#acos-issues)

### Reporting & Export
- [Report Generation](#report-generation)
- [Data Export](#data-export)

### Billing & Account
- [Billing Issues](#billing-issues)
- [Account Access](#account-access)
- [Tier Limitations](#tier-limitations)

---

# Login & Authentication

## Issue: Cannot Login / "Invalid Credentials" Error

### Symptoms
- Login fails with "Invalid email or password" message
- Password reset email not received
- 2FA code not working

### Solutions

**1. Verify email and password**
- Ensure email is exactly as registered (case-sensitive for password, not email)
- Check for extra spaces before/after email
- Try copying password from password manager (avoid typos)

**2. Reset password**
1. Click **"Forgot Password"** on login page
2. Enter registered email
3. Check inbox (and spam folder) for reset email
4. Email arrives within 2-5 minutes
5. Click reset link (valid for 1 hour)
6. Create new password (12+ chars, mixed case, numbers, symbols)

**3. 2FA issues**
- Ensure device clock is synced (TOTP codes are time-based)
- Try generating new code (codes expire every 30 seconds)
- Use backup codes if saved during 2FA setup
- Contact support to disable 2FA temporarily: support@complyeasy.ai

**4. Account lockout**
- After 5 failed login attempts, account locks for 15 minutes
- Wait 15 minutes and try again
- Or contact support to unlock immediately

**Still stuck?**
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Try different browser
- Contact support with screenshot of error

---

## Issue: SSO Login Not Working

### Symptoms
- SSO button redirects but doesn't log in
- "SSO not configured" error
- "Domain mismatch" error

### Solutions

**1. Verify SSO is enabled**
- Only available with Essentials tier and above
- Check **Settings → Authentication → SSO**
- Ensure your domain is verified

**2. Domain verification**
1. Go to **Settings → Authentication → Domains**
2. Add your company domain (e.g., acme.com)
3. Add DNS TXT record to verify ownership:
   ```
   complyeasy-verification=abc123xyz
   ```
4. Click **"Verify Domain"** (takes 5-60 mins for DNS propagation)

**3. Okta SSO configuration**
- **ACS URL**: https://app.complyeasy.ai/auth/saml/callback
- **Entity ID**: https://app.complyeasy.ai
- **Name ID format**: EmailAddress
- **Attributes**: email, firstName, lastName

**4. Azure AD SSO configuration**
- **Reply URL**: https://app.complyeasy.ai/auth/saml/callback
- **Identifier**: https://app.complyeasy.ai
- **User attributes**: email, given_name, surname

**5. Google Workspace SSO configuration**
- **ACS URL**: https://app.complyeasy.ai/auth/saml/callback
- **Entity ID**: https://app.complyeasy.ai
- **Start URL**: https://app.complyeasy.ai/login
- **Name ID**: Basic Information > Primary email

**Testing SSO**:
1. Use **"Test SSO Connection"** button in Settings
2. Verify SAML assertion attributes are correct
3. Check error logs for specific issues

**Common errors**:

**"Invalid SAML response"**
- SAML certificate expired (renew in your IdP)
- Clock skew (sync clocks on both systems)
- Incorrect signing algorithm (use SHA-256)

**"User not found"**
- Email in SAML assertion doesn't match user in ComplyEasyAI
- Create user first, then SSO will work
- Or enable JIT (Just-In-Time) provisioning in Settings

**"Access denied"**
- User exists but is deactivated
- User's role doesn't allow login
- Domain not verified

---

# Performance & Loading

## Issue: Dashboard Loading Slowly

### Symptoms
- Dashboard takes > 10 seconds to load
- "Loading..." spinner indefinitely
- Browser tab becomes unresponsive

### Solutions

**1. Check browser performance**
- Close unnecessary browser tabs (each tab uses memory)
- Disable browser extensions (especially ad blockers, can interfere)
- Try incognito/private mode (isolates issue)
- Update browser to latest version

**2. Check internet connection**
- Run speed test: fast.com or speedtest.net
- Minimum recommended: 5 Mbps download
- High latency (> 200ms) can cause slowness
- Try different network (mobile hotspot, different WiFi)

**3. Clear browser cache**

**Chrome**:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached images and files"
3. Time range: "All time"
4. Click "Clear data"

**Firefox**:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cache"
3. Time range: "Everything"
4. Click "Clear Now"

**Safari**:
1. Safari → Preferences → Advanced
2. Check "Show Develop menu"
3. Develop → Empty Caches

**4. Check for large datasets**
- Organizations with 100+ frameworks or 1M+ evidence items may load slower
- Use filters to reduce data displayed
- Request database optimization from support

**5. Check system status**
- Visit status.complyeasy.ai
- Check for ongoing incidents or degraded performance
- Subscribe to status updates

**Workarounds**:
- Use filters to reduce data loaded (e.g., one framework at a time)
- Use direct links to specific pages (skip dashboard)
- Contact support for database optimization (for large accounts)

---

## Issue: "500 Internal Server Error"

### Symptoms
- Error message: "500 Internal Server Error" or "Something went wrong"
- Page fails to load
- Actions (clicking buttons) result in errors

### Solutions

**1. Refresh the page**
- Press `F5` or `Ctrl+R` (Windows) or `Cmd+R` (Mac)
- Try hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

**2. Check status page**
- Visit status.complyeasy.ai
- If incident in progress, error is likely platform-wide
- Subscribe to updates

**3. Clear browser cache**
- See instructions in "Dashboard Loading Slowly" section above

**4. Try different action**
- If one specific action fails (e.g., "Generate Report"), try different action
- Navigate to different page
- Log out and log back in

**5. Report to support**
If error persists:
1. Take screenshot of error
2. Note exact steps to reproduce
3. Open browser console (F12 → Console tab)
4. Copy any error messages
5. Send to support@complyeasy.ai with details

**Include**:
- Date/time of error
- Your organization name
- What you were trying to do
- Browser and version
- Screenshot and console errors

---

# AWS Integration

## Issue: AWS Integration Fails to Connect

### Symptoms
- "Unable to connect to AWS" error
- "Invalid credentials" or "Access denied"
- CloudFormation stack creation fails

### Solutions

**1. Verify IAM permissions**

Required permissions for ComplyEasyAI IAM role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudtrail:LookupEvents",
        "cloudtrail:GetTrailStatus",
        "iam:GetUser",
        "iam:ListUsers",
        "iam:GetUserPolicy",
        "iam:ListUserPolicies",
        "iam:GetAccountPasswordPolicy",
        "iam:GetAccountSummary",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeInstances",
        "ec2:DescribeSnapshots",
        "ec2:DescribeVolumes",
        "s3:GetBucketPolicy",
        "s3:GetBucketEncryption",
        "s3:GetBucketVersioning",
        "s3:ListAllMyBuckets",
        "kms:ListKeys",
        "kms:DescribeKey",
        "guardduty:ListDetectors",
        "guardduty:GetFindings",
        "config:DescribeConfigurationRecorders",
        "config:DescribeComplianceByConfigRule"
      ],
      "Resource": "*"
    }
  ]
}
```

**2. Check trust relationship**

The IAM role must trust ComplyEasyAI's AWS account:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "your-external-id-from-complyeasy"
        }
      }
    }
  ]
}
```

**Replace**:
- `123456789012` with ComplyEasyAI's AWS account ID (provided in integration setup)
- `your-external-id-from-complyeasy` with your unique external ID (displayed during setup)

**3. CloudFormation stack troubleshooting**

If CloudFormation stack creation fails:

1. Go to AWS Console → CloudFormation
2. Find the failed stack (name: `ComplyEasyAI-Integration`)
3. Click on stack → Events tab
4. Look for error message (usually last event with "CREATE_FAILED")

**Common CloudFormation errors**:

**"Insufficient permissions to create IAM role"**
- Your AWS user lacks IAM permissions
- Need `iam:CreateRole`, `iam:PutRolePolicy`, `iam:AttachRolePolicy`
- Ask AWS admin to launch CloudFormation stack

**"Resource limit exceeded"**
- AWS account has reached IAM role limit (default 1,000)
- Delete unused roles or request limit increase

**"Template format error"**
- CloudFormation template version mismatch
- Re-download latest template from ComplyEasyAI integration page

**4. Manual IAM role setup**

If CloudFormation doesn't work, create IAM role manually:

1. Go to AWS Console → IAM → Roles
2. Click **"Create role"**
3. Select **"Another AWS account"**
4. Enter:
   - **Account ID**: (ComplyEasyAI's account ID from integration page)
   - **External ID**: (your external ID from integration page)
   - ✅ Check "Require external ID"
5. Click **"Next: Permissions"**
6. Create inline policy with JSON from Solution #1 above
7. Click **"Next: Tags"** (optional, add tags if desired)
8. Click **"Next: Review"**
9. **Role name**: `ComplyEasyAI-ReadOnly`
10. Click **"Create role"**
11. Copy the Role ARN (e.g., `arn:aws:iam::987654321098:role/ComplyEasyAI-ReadOnly`)
12. Paste Role ARN into ComplyEasyAI integration setup

**5. Test connection**

After setup:
1. Click **"Test Connection"** in ComplyEasyAI
2. Should show "Connected successfully"
3. If fails, check error message:

**"Access denied: AssumeRole failed"**
- Trust relationship incorrect (check Solution #2)
- External ID mismatch (must match exactly)

**"Access denied: Insufficient permissions"**
- IAM policy missing required permissions (check Solution #1)

**"Timeout"**
- Network issue or AWS API throttling
- Wait 5 minutes and try again

---

## Issue: AWS Evidence Not Collecting

### Symptoms
- AWS integration shows "Connected"
- But no evidence appears in dashboard
- Evidence collection status shows "No new evidence"

### Solutions

**1. Check collection schedule**
- Default: Daily at 2 AM UTC
- May take 24 hours for first collection
- Go to **Integrations → AWS → Collection Schedule**
- Click **"Sync Now"** to force immediate collection

**2. Verify AWS resources exist**

ComplyEasyAI collects evidence from:
- CloudTrail (access logs)
- IAM (users, roles, policies)
- EC2 (instances, security groups)
- S3 (buckets, encryption)
- KMS (encryption keys)
- GuardDuty (security findings)
- Config (compliance rules)

If you don't have these resources in AWS, no evidence will be collected.

**Example**: If you have no S3 buckets, no S3 evidence appears (expected).

**3. Check AWS region**

- ComplyEasyAI collects from all enabled AWS regions
- If resources are in specific region, verify that region is enabled
- Go to **Integrations → AWS → Regions**
- Check all regions you use
- Click **"Sync Now"**

**4. Verify CloudTrail is enabled**

CloudTrail must be enabled for access log evidence:

1. Go to AWS Console → CloudTrail
2. Check if trail exists and is logging
3. If no trail:
   - Click **"Create trail"**
   - Name: `complyeasy-audit-trail`
   - Apply to all regions: ✅
   - Log file validation: ✅ (recommended)
   - Click **"Create"**

**5. Check evidence filters**

You may have filters hiding evidence:

1. Go to **Evidence** page
2. Check filter settings (top of page):
   - Framework: "All" or specific framework
   - Date range: Expand to last 30 days
   - Evidence type: "All"
   - Source: Include "AWS"
3. Clear all filters and check again

**6. Check for errors**

1. Go to **Integrations → AWS → Logs**
2. Look for error messages in collection logs
3. Common errors:

**"Rate limit exceeded"**
- AWS API throttling (temporary)
- Collections automatically retry after delay
- If persistent, contact support to adjust collection frequency

**"Access denied: GetUser"**
- IAM policy missing permission (add `iam:GetUser`)

**"No CloudTrail events found"**
- CloudTrail not enabled or not logging
- Enable CloudTrail (see Solution #4 above)

---

# GitHub Integration

## Issue: GitHub Integration Not Connecting

### Symptoms
- "Failed to authorize GitHub" error
- GitHub OAuth redirect fails
- "App not installed" error

### Solutions

**1. Verify GitHub permissions**

During OAuth:
- Must have **admin access** to organization or repositories
- If you're not an org admin, ask admin to install integration
- Personal accounts: You have admin access to your own repos

**2. Re-authorize GitHub App**

1. Go to GitHub → Settings → Applications
2. Find "ComplyEasyAI" in Authorized OAuth Apps
3. Click **"Revoke"** to remove
4. Return to ComplyEasyAI
5. Click **"Connect GitHub"** again
6. Re-authorize with all permissions

**3. Check GitHub App installation**

If using GitHub App (not OAuth):

1. Go to GitHub → Settings → Installed GitHub Apps
2. Find "ComplyEasyAI"
3. Click **"Configure"**
4. Verify:
   - Repository access: "All repositories" or specific repos selected
   - Permissions: Read access to code, pull requests, workflows
5. Click **"Save"**

**4. Firewall / network issues**

- Ensure your network allows:
  - `api.github.com` (GitHub API)
  - `github.com` (OAuth redirects)
  - `app.complyeasy.ai` (OAuth callback)
- Corporate firewalls may block OAuth redirects
- Try from different network or contact IT

**5. Browser issues**

- Clear cookies for `github.com` and `complyeasy.ai`
- Disable browser extensions (especially privacy/ad blockers)
- Try incognito/private mode
- Try different browser

**6. Organization SSO enforcement**

If GitHub organization uses SSO:

1. After authorizing app, GitHub shows "Authorize SSO" button
2. Click **"Authorize"** next to your organization name
3. Complete SSO authentication
4. App will now have access

**Without SSO authorization**, app can't access org repos.

---

## Issue: GitHub Evidence Missing Commits or PRs

### Symptoms
- Some commits not appearing in evidence
- Pull request approvals not showing
- Branch protection evidence incomplete

### Solutions

**1. Check repository access**

1. Go to **Integrations → GitHub → Repositories**
2. Verify repository is in "Monitored Repositories" list
3. If missing:
   - Click **"Configure Repository Access"**
   - Add repository
   - Click **"Save"**

**2. Check branch filters**

By default, only `main`/`master` branch evidence collected:

1. Go to **Integrations → GitHub → Settings**
2. Under **"Branches to Monitor"**:
   - Default: `main,master`
   - Add other branches if needed: `main,master,production,develop`
3. Click **"Save & Sync"**

**3. Check date range**

- GitHub evidence collection starts from integration connection date
- Historical commits before connection are not collected by default
- To backfill historical data:
  1. Go to **Integrations → GitHub → Historical Import**
  2. Select date range (max 1 year back)
  3. Click **"Import Historical Data"** (takes 1-24 hours)

**4. Verify branch protection enabled**

Branch protection evidence only exists if protection is enabled:

1. Go to GitHub → Repository → Settings → Branches
2. Check if branch protection rules exist for monitored branches
3. If not:
   - Click **"Add rule"**
   - Branch name pattern: `main`
   - Enable:
     - ✅ Require pull request reviews before merging (2 approvals recommended)
     - ✅ Require status checks to pass
     - ✅ Require conversation resolution before merging
     - ✅ Include administrators
   - Click **"Create"**

**5. Check for fork/mirror repositories**

- Forked repositories may not sync commits (GitHub API limitation)
- Mirror repositories may require separate integration
- Solution: Integrate with source repository instead

**6. Force re-sync**

1. Go to **Integrations → GitHub**
2. Click **"Sync Now"** to force immediate collection
3. Wait 5-15 minutes
4. Check evidence again

---

# Slack Integration

## Issue: Slack Integration Not Receiving Messages

### Symptoms
- Slack connected successfully
- But bot not reading messages from channels
- Missing incident response evidence

### Solutions

**1. Verify bot is in channel**

ComplyEasyAI bot must be invited to channels:

1. Go to Slack channel (e.g., `#security-incidents`)
2. Type: `/invite @ComplyEasyAI`
3. Or click channel name → Integrations → Add apps → ComplyEasyAI
4. Repeat for all relevant channels

**Channels to add bot**:
- `#security-incidents` (incident response evidence)
- `#deploys` (change management evidence)
- `#security-alerts` (monitoring evidence)
- Any other compliance-relevant channels

**2. Check channel mapping**

1. Go to **Integrations → Slack → Channel Mapping**
2. Ensure channels are mapped to evidence types:
   - `#security-incidents` → Incident Response (CC7.5)
   - `#deploys` → Change Management (CC8.1)
   - `#security-alerts` → Monitoring (CC7.2)
3. If not mapped:
   - Click **"Add Channel Mapping"**
   - Select channel and evidence type
   - Click **"Save"**

**3. Verify bot permissions**

1. Go to Slack → Apps → ComplyEasyAI → Permissions
2. Check bot has:
   - ✅ `channels:history` (read public channel messages)
   - ✅ `channels:read` (view channel metadata)
   - ✅ `chat:write` (send messages - for notifications)
3. If permissions missing:
   - Click **"Reinstall to Workspace"**
   - Re-authorize with all permissions

**4. Check message date range**

- Slack evidence collection starts from bot invite date
- Historical messages before invite are not collected
- To collect historical messages:
  1. Go to **Integrations → Slack → Historical Import**
  2. Select channels and date range (max 90 days for free Slack, unlimited for paid)
  3. Click **"Import"**

**5. Private channels**

- Bot cannot read private channels unless explicitly invited
- For private channels:
  1. Go to private channel in Slack
  2. Type: `/invite @ComplyEasyAI`
  3. Bot will now read messages

**6. Message filters**

Check if message filters are excluding relevant messages:

1. Go to **Integrations → Slack → Filters**
2. Default filters:
   - Exclude bot messages (to avoid noise)
   - Exclude deleted messages
   - Include only channels with mappings
3. Adjust filters if needed

---

# Missing Evidence

## Issue: Evidence Not Collected for Specific Control

### Symptoms
- Control shows "No evidence" or "Insufficient evidence"
- Integrations connected and working
- Other controls have evidence

### Solutions

**1. Check evidence requirements**

1. Click on the control (e.g., CC6.1)
2. Go to **"Evidence Requirements"** tab
3. Review what evidence is needed:
   - **Auto-collected**: From integrations
   - **Manual upload**: Documents you must provide
   - **Generated**: Reports or exports

**2. Verify integration coverage**

Not all evidence can be auto-collected. Check what's needed:

**Example: CC6.1 (Logical Access Controls)**

**Auto-collected** (if integrations connected):
- ✅ AWS IAM policies (AWS integration)
- ✅ Okta user logs (Okta integration)
- ✅ GitHub access controls (GitHub integration)

**Manual upload needed**:
- ⬜ Access control policy document (upload PDF)
- ⬜ Quarterly access review spreadsheet (upload XLSX)
- ⬜ Onboarding/offboarding procedures (upload DOCX)

**Action**: Upload missing manual evidence.

**3. Upload manual evidence**

1. Click **"Upload Evidence"** button on control
2. Drag and drop files (PDF, DOCX, XLSX, PNG, JPG)
3. Fill in:
   - **Evidence name**: Descriptive title
   - **Evidence date**: When evidence was created/captured
   - **Description**: What this evidence proves
   - **Tags**: Control IDs (e.g., CC6.1, CC6.2)
4. Click **"Upload"**

**Best practices**:
- Use descriptive filenames: `Access_Control_Policy_v2.3_2025-01-15.pdf`
- Include dates in filename or metadata
- Tag evidence with all relevant control IDs
- Add clear descriptions (auditors will read these)

**4. Check evidence date range**

- Evidence must fall within audit observation period
- Example: If observation period is July-Dec 2024, evidence from Jan 2024 won't count
- Solution: Generate new evidence within observation period

**5. Re-map evidence to control**

Sometimes evidence exists but isn't mapped:

1. Go to **Evidence** page
2. Search for relevant evidence
3. Click on evidence item
4. Check **"Mapped Controls"** section
5. If control is missing:
   - Click **"Add Control Mapping"**
   - Select control (e.g., CC6.1)
   - Click **"Save"**

**6. Trigger evidence collection manually**

For auto-collected evidence:

1. Go to **Integrations** page
2. Find relevant integration (AWS, GitHub, etc.)
3. Click **"Sync Now"** to force immediate collection
4. Wait 5-15 minutes
5. Check control again

---

# Control Failures

## Issue: Control Marked as "Failing" but I Believe It Should Pass

### Symptoms
- Control status shows ❌ Failing (red)
- You have evidence and controls in place
- AI Risk Analyzer flags control as non-compliant

### Solutions

**1. Review failure reason**

1. Click on failing control
2. Go to **"Status"** tab
3. Read failure reason provided by AI:

**Example failure reasons**:

**"MFA not enforced for all users"**
- AI detected users without MFA
- Reason: AWS IAM shows 3/47 users without MFA
- Evidence: AWS IAM user export

**"Access review not completed in Q4 2024"**
- Expected evidence: Q4 access review document
- Missing: No document uploaded for Q4
- Evidence: Only Q1, Q2, Q3 reviews found

**"Incident response policy not updated in 12 months"**
- Policy requirement: Annual review
- Last update: January 2024
- Current: January 2025 (12 months passed)

**2. Investigate root cause**

**Is the AI correct?**

**Scenario A: AI is correct** (control actually failing)
- Example: 3 users don't have MFA
- Action: Fix the issue (enable MFA for those 3 users)
- Then re-test control

**Scenario B: Control is passing, evidence is missing**
- Example: You DID complete Q4 access review, just forgot to upload
- Action: Upload evidence
- Control will automatically re-evaluate

**Scenario C: Control is passing, AI misinterpreted evidence**
- Example: AI thinks user "service_account" needs MFA, but it's a service account (exception)
- Action: Document exception (see Solution #3)

**3. Document exceptions**

If control has legitimate exceptions:

1. Click on failing control
2. Click **"Add Exception"**
3. Fill in:
   - **Exception type**: Service account, emergency access, etc.
   - **Rationale**: Why this exception is acceptable
   - **Approval**: Who approved exception (CISO, CTO, etc.)
   - **Expiration**: When exception should be reviewed/removed
   - **Affected resources**: Specific users, systems, etc.
4. Click **"Save Exception"**

**Example exception**:

> **Control**: CC6.1 (MFA required)
> **Exception**: Service account `github_actions_deployer` does not have MFA
> **Rationale**: Service accounts use API keys with IP restrictions and secret rotation instead of MFA
> **Approved by**: CISO John Doe
> **Review date**: Annually on Jan 1
> **Compensating controls**: API keys rotated every 90 days, IP-restricted to CI/CD servers only

AI will accept documented exceptions.

**4. Provide additional evidence**

If control is passing but AI doesn't have enough evidence:

1. Click **"Add Evidence"**
2. Upload supporting documentation:
   - Policies and procedures
   - Screenshots of configurations
   - Audit logs
   - Attestation letters
3. AI will re-evaluate with new evidence

**5. Request human review**

If you disagree with AI assessment:

1. Click **"Request Review"** on control
2. Explain why you believe control passes
3. ComplyEasyAI compliance experts will review (24-48 hours)
4. You'll receive explanation and recommendation

**6. Adjust control definition** (Growth tier+)

If control definition doesn't match your implementation:

1. Click **"Customize Control"**
2. Modify:
   - **Control description**: Tailor to your environment
   - **Evidence requirements**: Adjust what's needed
   - **Testing criteria**: Define pass/fail criteria
3. Click **"Save"**
4. Control will re-evaluate against new definition

**Example**:

**Standard control**: "MFA required for all users"

**Customized for your org**: "MFA required for all human users; service accounts use API keys with IP restrictions and 90-day rotation"

---

# AI Risk Analyzer Issues

## Issue: AI Risk Assessment Shows Unrealistic Risks

### Symptoms
- Risk score seems too high or too low
- Risks identified don't apply to your organization
- Missing obvious risks

### Solutions

**1. Review risk assumptions**

AI risk assessment is based on:
- Your industry (set during onboarding)
- Company size
- Frameworks you're pursuing
- Current control state
- Industry threat intelligence

**Check your organization profile**:
1. Go to **Settings → Organization**
2. Verify:
   - ✅ Industry is correct (e.g., "FinTech" not generic "Technology")
   - ✅ Company size is accurate
   - ✅ Geography is set (affects regional risks)
3. Update if incorrect
4. Click **"Re-run Risk Assessment"**

**2. Adjust risk appetite**

Your organization's risk appetite affects risk scoring:

1. Go to **Risk → Settings → Risk Appetite**
2. Configure:
   - **Risk appetite**: Conservative, Balanced, Aggressive
   - **Impact thresholds**: Financial impact of risks ($ amounts)
   - **Likelihood calibration**: Adjust based on your threat landscape

**Example**:

**Conservative** (default):
- Treats all potential risks seriously
- Suitable for: Healthcare, financial services, enterprises
- May flag more risks as "High"

**Balanced**:
- Industry-standard risk tolerance
- Suitable for: Most SaaS companies

**Aggressive**:
- Accepts higher risk
- Suitable for: Early-stage startups, non-sensitive data

**3. Provide context to AI**

AI doesn't know your compensating controls unless you tell it:

**Example**:

**AI flags**: "High risk: Customer data not encrypted at rest"

**Reality**: You use AWS RDS with encryption enabled, but AI didn't detect it (not in AWS integration scope)

**Action**:
1. Click on risk
2. Click **"Add Compensating Control"**
3. Describe: "Customer data is in AWS RDS PostgreSQL with encryption at rest enabled via AWS KMS"
4. Upload evidence: Screenshot of RDS encryption settings
5. AI will recalculate risk (likely downgrade to Low)

**4. Review third-party risks**

If risk assessment shows vendor risks you've already addressed:

1. Go to **Risk → Third-Party Risks**
2. For each vendor:
   - Upload vendor SOC 2 report
   - Document due diligence performed
   - Mark risk treatment
3. AI will factor in vendor controls

**5. Train AI with historical data**

AI improves with more data:

**If you're new**:
- Risk assessment may be generic
- As you use platform, AI learns your environment
- Reassess risks monthly to see improvement

**If you migrated from another tool**:
- Import historical risk data
- Go to **Risk → Import**
- Upload CSV of previous risk assessments
- AI will calibrate to your patterns

**6. Request custom risk model** (Visionary tier)

For unique industries or highly customized needs:

- Contact success@complyeasy.ai
- Request custom risk model
- Our team will:
  - Interview your team
  - Understand unique risk factors
  - Build custom risk scoring model
  - Train AI on your specific context

---

# Report Generation

## Issue: Report Generation Fails or Times Out

### Symptoms
- "Report generation failed" error
- Report generation spinner runs indefinitely
- Report downloads as empty or corrupted PDF

### Solutions

**1. Check report size**

Large reports (> 500 pages) may timeout:

**Reduce report scope**:
1. Click **"Generate Report"** → **"Advanced Options"**
2. Reduce scope:
   - Single framework (not all frameworks)
   - Specific controls (not all controls)
   - Shorter date range
3. Generate multiple smaller reports instead

**2. Try different format**

If PDF fails:
- Try **DOCX** (Word) format
- Try **XLSX** (Excel) for data-heavy reports
- Try **CSV** for evidence exports

**3. Check browser**

Report generation may fail in some browsers:

- **Recommended**: Chrome, Firefox, Edge (latest versions)
- **May have issues**: Safari, older browsers
- Try different browser if generation fails

**4. Disable browser extensions**

Some browser extensions interfere with downloads:

1. Disable ad blockers, privacy extensions
2. Try incognito/private mode (extensions usually disabled)
3. Generate report again

**5. Check for missing data**

Report generation may fail if required data is missing:

**Error: "Unable to generate executive summary - no frameworks configured"**
- **Issue**: No frameworks in your account
- **Fix**: Add at least one framework

**Error: "No evidence found for selected filters"**
- **Issue**: Filters too restrictive
- **Fix**: Expand date range, remove filters, try again

**6. Try alternative: Scheduled reports**

If on-demand generation fails:

1. Go to **Reports → Scheduled Reports**
2. Click **"Create Scheduled Report"**
3. Configure:
   - **Report type**: Executive summary, control status, etc.
   - **Frequency**: One-time, daily, weekly, monthly
   - **Delivery**: Email or download link
4. Click **"Schedule"**

Report will generate in background and email you when ready.

**7. Contact support**

If generation consistently fails:

1. Note exact error message
2. Specify report type and parameters
3. Check browser console (F12) for errors
4. Email support@complyeasy.ai with details

Our team can generate report server-side and send to you.

---

# Billing Issues

## Issue: Payment Failed or Declined

### Symptoms
- "Payment failed" error during checkout
- Credit card declined
- Account suspended due to payment failure

### Solutions

**1. Verify card details**

Common errors:
- ✅ Card number correct (no spaces, 16 digits)
- ✅ Expiration date not passed
- ✅ CVV correct (3-4 digits on back/front)
- ✅ Billing zip code matches card

**2. Check card restrictions**

- Some cards don't allow international charges (we bill from US)
- Business cards may require company approval
- Prepaid cards may not have sufficient balance
- Virtual cards may have spending limits

**Call your bank** to:
- Authorize international transaction
- Increase credit limit if needed
- Unblock ComplyEasyAI charges

**3. Try different payment method**

If card continues to fail:

1. Go to **Settings → Billing → Payment Methods**
2. Click **"Add Payment Method"**
3. Try:
   - Different credit card
   - Debit card
   - ACH bank transfer (US only, Essentials tier+)
   - Wire transfer (Enterprise, contact sales)

**4. Invoice billing** (Growth tier+)

If automatic payments don't work for your organization:

1. Contact billing@complyeasy.ai
2. Request invoice billing
3. We'll send invoice (NET 30 terms)
4. Pay via:
   - Check
   - ACH transfer
   - Wire transfer
   - Purchase order

**5. Check account status**

If payment fails multiple times, account may be suspended:

1. Go to **Settings → Billing → Account Status**
2. If suspended:
   - Update payment method
   - Click **"Retry Payment"**
   - Account reactivates within 1 hour

**Or contact billing@complyeasy.ai** to:
- Extend payment deadline
- Set up payment plan
- Discuss billing options

---

## Issue: Charged Wrong Amount

### Symptoms
- Invoice amount doesn't match expected price
- Unexpected charges on credit card
- Proration charges unclear

### Solutions

**1. Review invoice details**

1. Go to **Settings → Billing → Invoices**
2. Click on invoice to view line items:
   - Base tier price
   - User count and multiplier
   - Add-ons
   - Discounts
   - Prorations (for mid-cycle changes)
   - Taxes (if applicable)

**2. Understand pricing formula**

**Tier-based pricing**:
```
Total = (Base Price × User Multiplier) + Add-ons - Discounts + Tax
```

**Example**:

**Essentials tier**:
- Base price: $5,100/year
- User multiplier: 1.5× (for 100 users)
- Add-on: Custom Framework ($660)
- Discount: 16% (annual payment)
- Tax: 8% (CA sales tax)

**Calculation**:
```
Base: $5,100 × 1.5 = $7,650
Add-on: $660
Subtotal: $8,310
Discount: $8,310 × 0.16 = $1,330
After discount: $8,310 - $1,330 = $6,980
Tax: $6,980 × 0.08 = $558
Total: $7,538/year
```

**3. Understand prorations**

If you upgrade/downgrade mid-cycle:

**Upgrade example** (Foundation → Essentials):
- You paid: $4,250 for Foundation (annual)
- Used: 3 months
- Unused: 9 months × ($4,250 / 12) = $3,187.50 credit
- New plan: $5,100/year Essentials = $3,825 for 9 months
- You pay: $3,825 - $3,187.50 = **$637.50** prorated charge

**Downgrade example** (Essentials → Foundation):
- Downgrade takes effect at next billing cycle
- No refund for current period
- Next invoice will be lower tier price

**4. Check for usage-based charges**

Some features may incur usage charges:

- **API calls**: Over rate limit (rare, soft limits)
- **Storage**: Over tier limit (we'll notify before charging)
- **Professional services**: If you purchased consulting

Check: **Settings → Billing → Usage**

**5. Verify discounts applied**

If you have discount codes:

1. Go to **Settings → Billing → Discounts**
2. Verify discount is active:
   - Education: 40% off
   - Nonprofit: 50% off
   - Startup program: 75% off (first year)
3. If missing:
   - Click **"Apply Discount Code"**
   - Enter code
   - Click **"Apply"**
   - Next invoice will reflect discount

**6. Request invoice review**

If charges still unclear:

1. Email billing@complyeasy.ai
2. Include:
   - Invoice number
   - Expected amount vs. actual amount
   - Your understanding of pricing
3. Our billing team will:
   - Review invoice line-by-line
   - Explain each charge
   - Correct errors if any
   - Issue credit if overcharged

---

# Tier Limitations

## Issue: Feature Not Available in Current Tier

### Symptoms
- "Upgrade required" message when trying to use feature
- Feature grayed out or locked
- "Contact sales" message

### Solutions

**1. Check tier requirements**

Each feature has minimum tier requirement:

| **Feature** | **Minimum Tier** |
|-------------|------------------|
| Core compliance (1 framework) | Foundation |
| Multiple frameworks (3+) | Essentials |
| aCOS (Autonomous Compliance) | Essentials |
| AI Risk Analyzer | All tiers |
| AI Red Team | Growth |
| Digital Twin | Growth |
| Custom Frameworks | Growth |
| On-Premise Deployment | Visionary + Add-on |
| Federated Learning | Visionary |
| Custom Integrations (SDK) | Visionary |

Full comparison: [Pricing Guide](PRICING_GUIDE.md)

**2. Compare your current tier**

1. Go to **Settings → Account → Subscription**
2. View current tier and limits:
   - Frameworks: 1 (Foundation), 3 (Essentials), 10 (Growth), Unlimited (Visionary)
   - Users: 10, 100, 1,000, Unlimited
   - Features: List of available features
3. Click **"View All Tiers"** to compare

**3. Upgrade tier**

If you need features from higher tier:

1. Go to **Settings → Account → Upgrade**
2. Select desired tier
3. Review pricing (prorated for current billing period)
4. Click **"Upgrade Now"**
5. Features activate immediately

**No sales call required** for self-service tiers (Foundation → Growth).

**Visionary tier**: Requires sales consultation
- Click **"Contact Sales"** or email sales@complyeasy.ai
- Schedule demo and pricing discussion

**4. Alternative: Add-ons**

Some features available as add-ons without full upgrade:

**Available add-ons**:
- **Custom Frameworks**: $660/framework/year (if your tier limit reached)
- **On-Premise Deployment**: $3,200/year (Visionary tier required)
- **Custom AI Training**: $1,920/year
- **Professional Services**: Starting at $5,000

Purchase add-ons:
1. Go to **Settings → Account → Add-Ons**
2. Select add-on
3. Click **"Purchase"**

**5. Request trial access**

If you want to test feature before upgrading:

1. Email support@complyeasy.ai
2. Request: "Trial access to [feature name]"
3. We can enable feature for 14-day trial
4. No commitment, no credit card required

**6. Workarounds for common limits**

**Framework limit reached**:
- **Option A**: Upgrade tier
- **Option B**: Purchase Custom Framework add-on
- **Option C**: Remove unused framework to add new one

**User limit reached**:
- **Option A**: Upgrade tier (higher user multiplier or unlimited)
- **Option B**: Remove inactive users
- **Option C**: Use role-based access (fewer users, more shared access)

**Storage limit reached**:
- **Option A**: Upgrade tier (higher storage)
- **Option B**: Delete old evidence (keep only audit period + 1 year)
- **Option C**: Export and archive old evidence externally

---

# Additional Support

## When to Contact Support

**Contact support if**:
- Error persists after troubleshooting
- Data loss or corruption
- Security concern
- Billing dispute
- Feature request
- Integration not listed in troubleshooting guide

## How to Contact Support

### Email
- **Address**: support@complyeasy.ai
- **Response time**:
  - Foundation: 48 hours
  - Essentials: 24 hours
  - Growth: 8 hours
  - Visionary: 4 hours (24/7 for critical)

### In-App Chat
1. Click chat icon (bottom-right corner)
2. Describe issue
3. Support agent responds in real-time (business hours)

### Phone (Growth/Visionary only)
- **Number**: +1 (555) 123-4567
- **Hours**: 6am-6pm PT weekdays
- **24/7 emergency**: Visionary tier only

### Community Forum
- **URL**: community.complyeasy.ai
- **Best for**: General questions, best practices, feature discussions
- **Response**: Community members + ComplyEasyAI team

### Status Page
- **URL**: status.complyeasy.ai
- **Check for**: Platform outages, degraded performance, maintenance windows
- **Subscribe**: Get email/SMS alerts for incidents

## Information to Include in Support Requests

**Help us help you faster**:

✅ **Include**:
- What you were trying to do
- Exact error message or screenshot
- Steps to reproduce
- Your organization name
- Date/time of issue
- Browser and version (if relevant)
- Integration (if integration-related)

❌ **Don't include**:
- Passwords or API keys (we'll never ask for these)
- Full database dumps (just sample data)

**Example good support request**:

> **Subject**: AWS integration failing with "Access Denied" error
>
> **Description**:
> Hi, I'm trying to connect our AWS account to ComplyEasyAI, but getting "Access Denied" error.
>
> **Steps I took**:
> 1. Clicked "Connect AWS" in Integrations page
> 2. Launched CloudFormation stack (stack ID: arn:aws:cloudformation:us-east-1:123456789:stack/ComplyEasyAI/abc123)
> 3. Stack created successfully
> 4. Copied Role ARN: arn:aws:iam::987654321:role/ComplyEasyAI-ReadOnly
> 5. Pasted into integration setup
> 6. Clicked "Test Connection"
> 7. Error: "Access Denied: AssumeRole failed"
>
> **Screenshot**: [attached]
>
> **Organization**: Acme Inc
> **Date/time**: Jan 15, 2025, 10:30 AM PT
>
> I verified the trust relationship and external ID match. Not sure what else to check.

**This gives us**:
- Exact error
- Reproduction steps
- Context (organization, time)
- What you've already tried

**We can respond with**: Specific solution (likely trust relationship issue or external ID mismatch)

---

## Self-Service Resources

Before contacting support, try:

**Knowledge Base**: docs.complyeasy.ai
- Searchable documentation
- Step-by-step guides
- Video tutorials

**Community Forum**: community.complyeasy.ai
- Search previous questions (likely already answered)
- Ask community (response within hours)

**Status Page**: status.complyeasy.ai
- Check if issue is platform-wide

**This Troubleshooting Guide**: You're here!
- Search (Ctrl+F) for error message or symptom

---

*Last Updated: January 2025*
*Version: 1.0*
