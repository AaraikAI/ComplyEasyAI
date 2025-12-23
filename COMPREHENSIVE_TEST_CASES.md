# ComplyEasyAI - Comprehensive Test Cases Document

## Document Information
- **Application**: ComplyEasyAI - Enterprise Compliance Management Platform
- **Version**: Based on Commit 27fe5b9 - "All Integrations + Controls"
- **Date**: December 23, 2025
- **Total Test Cases**: 850+

---

# TABLE OF CONTENTS

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Dashboard](#2-dashboard)
3. [Compliance Frameworks](#3-compliance-frameworks)
4. [Framework Controls](#4-framework-controls)
5. [Risk Management](#5-risk-management)
6. [AI Features](#6-ai-features)
7. [Integrations](#7-integrations)
8. [Team Management](#8-team-management)
9. [Settings](#9-settings)
10. [Billing & Payments](#10-billing--payments)
11. [Audit Trail](#11-audit-trail)
12. [Vendor Management](#12-vendor-management)
13. [Questionnaires](#13-questionnaires)
14. [Policy Library](#14-policy-library)
15. [Trust Center](#15-trust-center)
16. [Continuous Monitoring](#16-continuous-monitoring)
17. [Reporting](#17-reporting)
18. [Issue Management](#18-issue-management)
19. [Multi-Workspace](#19-multi-workspace)
20. [Two-Factor Authentication](#20-two-factor-authentication)
21. [Email Services](#21-email-services)
22. [File Upload & Storage](#22-file-upload--storage)
23. [API Security](#23-api-security)
24. [Performance & Load Testing](#24-performance--load-testing)
25. [Accessibility Testing](#25-accessibility-testing)
26. [Cross-Browser & Responsive Testing](#26-cross-browser--responsive-testing)
27. [Database & Data Integrity](#27-database--data-integrity)
28. [Error Handling & Edge Cases](#28-error-handling--edge-cases)

---

# 1. AUTHENTICATION & AUTHORIZATION

## 1.1 Magic Link Authentication

### 1.1.1 Request Magic Link - Positive Tests
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-001 | Valid email receives magic link | 1. Navigate to login page 2. Enter valid email 3. Click "Send Magic Link" | Success message displayed, email sent within 30 seconds | Critical |
| AUTH-002 | Magic link email contains correct link | 1. Request magic link 2. Check email inbox 3. Verify link format | Link contains valid token and correct redirect URL | Critical |
| AUTH-003 | Magic link valid for 15 minutes | 1. Request magic link 2. Wait 14 minutes 3. Click link | User successfully authenticated | Critical |
| AUTH-004 | Multiple magic link requests | 1. Request first magic link 2. Request second magic link | Both links should work, latest takes priority | High |
| AUTH-005 | Case-insensitive email handling | 1. Enter "User@Email.COM" 2. Request magic link | Email normalized to lowercase, link sent successfully | High |
| AUTH-006 | Email with plus addressing | 1. Enter "user+test@email.com" 2. Request magic link | Magic link sent to plus-addressed email | Medium |
| AUTH-007 | Email with subdomain | 1. Enter "user@subdomain.company.com" 2. Request magic link | Magic link sent successfully | Medium |

### 1.1.2 Request Magic Link - Negative Tests
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-008 | Invalid email format | 1. Enter "invalidemail" 2. Click send | Error: "Please enter a valid email address" | Critical |
| AUTH-009 | Empty email field | 1. Leave email blank 2. Click send | Error: "Email is required" | Critical |
| AUTH-010 | Email with special characters | 1. Enter "user<script>@email.com" 2. Click send | Error: Invalid email format (XSS prevention) | Critical |
| AUTH-011 | Extremely long email | 1. Enter 500+ character email 2. Click send | Error: "Email exceeds maximum length" | High |
| AUTH-012 | SQL injection in email | 1. Enter "user'; DROP TABLE users;--@email.com" 2. Click send | Error: Invalid email format, no DB impact | Critical |
| AUTH-013 | Email with spaces | 1. Enter "user @email.com" 2. Click send | Error or auto-trim and validate | Medium |
| AUTH-014 | Unicode email characters | 1. Enter "用户@email.com" 2. Click send | Proper handling (accept or reject gracefully) | Medium |

### 1.1.3 Magic Link Verification - Positive Tests
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-015 | Valid token verification | 1. Click valid magic link 2. System verifies token | User redirected to dashboard, session created | Critical |
| AUTH-016 | New user auto-registration | 1. Request magic link with new email 2. Click link | New user account created, redirected to onboarding | Critical |
| AUTH-017 | Existing user login | 1. Request magic link for existing user 2. Click link | User logged in, previous data accessible | Critical |
| AUTH-018 | Token consumed after use | 1. Use magic link once 2. Try same link again | Second attempt fails: "Token already used" | Critical |
| AUTH-019 | Redirect to intended page | 1. Access protected page 2. Request magic link 3. Verify | After auth, redirect to originally requested page | High |

### 1.1.4 Magic Link Verification - Negative Tests
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-020 | Expired token (>15 minutes) | 1. Request magic link 2. Wait 16 minutes 3. Click link | Error: "Link has expired. Please request a new one" | Critical |
| AUTH-021 | Invalid token format | 1. Manually modify token in URL 2. Navigate to link | Error: "Invalid verification link" | Critical |
| AUTH-022 | Non-existent token | 1. Create random token 2. Navigate to verification URL | Error: "Verification link not found" | Critical |
| AUTH-023 | Token for deleted user | 1. Request magic link 2. Delete user account 3. Click link | Error: "Account no longer exists" | High |
| AUTH-024 | Empty token parameter | 1. Navigate to /verify?token= | Error: "Missing verification token" | High |
| AUTH-025 | Token with null bytes | 1. Include null bytes in token 2. Navigate to URL | Error: Invalid token, no system crash | High |

## 1.2 JWT Token Management

### 1.2.1 Token Generation & Validation
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-026 | Access token generation | 1. Complete authentication 2. Inspect response | Valid JWT access token returned | Critical |
| AUTH-027 | Refresh token generation | 1. Complete authentication 2. Inspect cookies/response | Valid refresh token returned | Critical |
| AUTH-028 | Token contains correct claims | 1. Decode JWT 2. Verify claims | Contains userId, organizationId, role, exp | Critical |
| AUTH-029 | Access token expiration | 1. Wait for access token to expire 2. Make API request | 401 Unauthorized returned | Critical |
| AUTH-030 | Refresh token flow | 1. Access token expires 2. Call refresh endpoint | New access token issued | Critical |
| AUTH-031 | Token signature validation | 1. Modify token payload 2. Make API request | 401 Unauthorized - invalid signature | Critical |

### 1.2.2 Token Security
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-032 | Token not exposed in URL | 1. Complete auth flow 2. Check URL parameters | Token never appears in URL (use headers/cookies) | Critical |
| AUTH-033 | Token secure in transit | 1. Capture network traffic 2. Verify HTTPS | All token transmissions over HTTPS | Critical |
| AUTH-034 | Token replay prevention | 1. Capture valid token 2. Use after logout | Token rejected after logout | Critical |
| AUTH-035 | Cross-organization token rejection | 1. User A token 2. Access User B's org data | 403 Forbidden - wrong organization | Critical |

## 1.3 Authorization & Role-Based Access Control

### 1.3.1 Role: Admin
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-036 | Admin can access all features | 1. Login as admin 2. Navigate to all sections | Full access to dashboard, settings, team, billing | Critical |
| AUTH-037 | Admin can manage team | 1. Login as admin 2. Go to Settings > Team | Can invite, edit roles, remove members | Critical |
| AUTH-038 | Admin can manage billing | 1. Login as admin 2. Go to Settings > Billing | Can view invoices, change plan, update payment | Critical |
| AUTH-039 | Admin can delete frameworks | 1. Login as admin 2. Delete a framework | Framework deleted successfully | High |
| AUTH-040 | Admin can access integrations | 1. Login as admin 2. Connect new integration | Full OAuth flow available | High |

### 1.3.2 Role: Editor
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-041 | Editor can create frameworks | 1. Login as editor 2. Create new framework | Framework created successfully | High |
| AUTH-042 | Editor can update controls | 1. Login as editor 2. Update control status | Control updated successfully | High |
| AUTH-043 | Editor cannot manage team | 1. Login as editor 2. Try accessing team settings | Access denied or UI hidden | Critical |
| AUTH-044 | Editor cannot manage billing | 1. Login as editor 2. Try accessing billing | Access denied or UI hidden | Critical |
| AUTH-045 | Editor can upload evidence | 1. Login as editor 2. Upload evidence file | File uploaded successfully | High |
| AUTH-046 | Editor can manage risks | 1. Login as editor 2. Create/edit risks | Full risk management access | High |

### 1.3.3 Role: Viewer
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-047 | Viewer can view dashboard | 1. Login as viewer 2. Navigate to dashboard | Dashboard displayed (read-only) | High |
| AUTH-048 | Viewer cannot create frameworks | 1. Login as viewer 2. Try creating framework | Create button disabled or 403 error | Critical |
| AUTH-049 | Viewer cannot edit controls | 1. Login as viewer 2. Try editing control | Edit disabled or 403 error | Critical |
| AUTH-050 | Viewer cannot delete anything | 1. Login as viewer 2. Try delete operations | All delete operations blocked | Critical |
| AUTH-051 | Viewer can view reports | 1. Login as viewer 2. Access reports section | Reports viewable but not editable | High |
| AUTH-052 | Viewer can export data | 1. Login as viewer 2. Export audit log CSV | Export allowed (read operation) | Medium |

## 1.4 Session Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-053 | Session persists on page refresh | 1. Login 2. Refresh browser | User remains logged in | Critical |
| AUTH-054 | Session persists across tabs | 1. Login in Tab 1 2. Open new tab | User authenticated in new tab | High |
| AUTH-055 | Logout clears session | 1. Login 2. Click logout | Session cleared, redirect to login | Critical |
| AUTH-056 | Logout invalidates all tokens | 1. Login on Device A and B 2. Logout on A | Session on B also invalidated (optional) | Medium |
| AUTH-057 | Session timeout after inactivity | 1. Login 2. Leave inactive for timeout period | Session expired, re-login required | Medium |
| AUTH-058 | Concurrent session limit | 1. Login on 5+ devices | Oldest session terminated or limit enforced | Low |

## 1.5 Edge Cases - Authentication

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-059 | Network interruption during auth | 1. Start auth 2. Disconnect network 3. Reconnect | Graceful error handling, retry option | High |
| AUTH-060 | Browser back after logout | 1. Logout 2. Press browser back | No access to protected content, redirect to login | Critical |
| AUTH-061 | Multiple rapid login attempts | 1. Submit login 10 times in 5 seconds | Rate limiting applied, no system overload | High |
| AUTH-062 | Auth during maintenance mode | 1. System in maintenance 2. Try to login | Friendly maintenance message | Medium |
| AUTH-063 | Token in localStorage security | 1. Inspect localStorage 2. Check token storage | Tokens stored securely, not accessible via XSS | Critical |
| AUTH-064 | Auth with browser extensions | 1. Use browser with ad blockers 2. Login | Auth works with common extensions | Medium |

---

# 2. DASHBOARD

## 2.1 Dashboard Display & Data

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| DASH-001 | Dashboard loads on login | 1. Complete login 2. Observe initial page | Dashboard displayed with all widgets | Critical |
| DASH-002 | Compliance score calculation | 1. View dashboard 2. Verify score | Score = (implemented controls / total controls) × 100 | Critical |
| DASH-003 | Compliance score 0% (no controls) | 1. New org with no controls 2. View dashboard | Score shows 0% or appropriate message | High |
| DASH-004 | Compliance score 100% | 1. All controls implemented 2. View dashboard | Score shows 100% with success indicator | High |
| DASH-005 | Critical risks count accuracy | 1. Create 5 high-severity risks 2. View dashboard | Critical Risks widget shows 5 | Critical |
| DASH-006 | Critical risks zero state | 1. No high risks exist 2. View dashboard | Shows "0" or "No Critical Risks" message | High |
| DASH-007 | Active frameworks count | 1. Add 3 frameworks 2. View dashboard | Active Frameworks shows 3 | High |
| DASH-008 | Framework status indicators | 1. Set framework to "At Risk" 2. View dashboard | Appropriate status color/icon displayed | High |
| DASH-009 | Upcoming audit dates display | 1. Set audit date 2. View dashboard | Audit countdown displayed correctly | High |
| DASH-010 | Audit date past due indicator | 1. Set audit date in past 2. View dashboard | "Overdue" warning displayed | High |

## 2.2 Dashboard Widgets & Interactions

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| DASH-011 | Priority risks display (top 3) | 1. Create 10 risks 2. View dashboard | Only top 3 by severity/priority shown | High |
| DASH-012 | Click risk navigates to detail | 1. Click on priority risk 2. Observe navigation | Navigates to Risk Management with risk selected | High |
| DASH-013 | Click framework navigates | 1. Click on framework 2. Observe navigation | Navigates to Framework Details | High |
| DASH-014 | Trend metrics display (+4%) | 1. Improve compliance 2. View dashboard | Trend indicator shows improvement percentage | Medium |
| DASH-015 | Trend metrics decrease | 1. Decrease compliance 2. View dashboard | Trend indicator shows negative percentage | Medium |
| DASH-016 | Dashboard auto-refresh | 1. Leave dashboard open 2. Update data elsewhere | Dashboard reflects updates (poll or websocket) | Medium |
| DASH-017 | Dashboard manual refresh | 1. Click refresh button 2. Observe data | Latest data loaded | High |

## 2.3 Dashboard - Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| DASH-018 | New organization (empty state) | 1. Create new org 2. View dashboard | Helpful empty state with CTAs | High |
| DASH-019 | Large data volumes | 1. Create 1000+ controls 2. View dashboard | Dashboard loads within 3 seconds | High |
| DASH-020 | Dashboard with deleted frameworks | 1. Delete framework 2. Refresh dashboard | Dashboard updates, no orphan references | High |
| DASH-021 | Dashboard timezone handling | 1. Set timezone to UTC+12 2. View audit dates | Dates display in user's timezone | Medium |
| DASH-022 | Dashboard loading state | 1. Slow connection 2. Load dashboard | Loading spinner/skeleton displayed | High |
| DASH-023 | Dashboard error state | 1. API returns error 2. View dashboard | Error message with retry option | High |
| DASH-024 | Dashboard with special characters | 1. Framework name "Test <script>" 2. View dashboard | Name displayed safely (no XSS) | Critical |

---

# 3. COMPLIANCE FRAMEWORKS

## 3.1 Create Framework

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| FW-001 | Create SOC2 framework | 1. Click Add Framework 2. Select SOC2 3. Save | SOC2 framework created with default controls | Critical |
| FW-002 | Create GDPR framework | 1. Click Add Framework 2. Select GDPR 3. Save | GDPR framework created | Critical |
| FW-003 | Create HIPAA framework | 1. Click Add Framework 2. Select HIPAA 3. Save | HIPAA framework created | Critical |
| FW-004 | Create ISO27001 framework | 1. Click Add Framework 2. Select ISO27001 3. Save | ISO27001 framework created | Critical |
| FW-005 | Create PCI-DSS framework | 1. Click Add Framework 2. Select PCI-DSS 3. Save | PCI-DSS framework created | High |
| FW-006 | Create CCPA framework | 1. Click Add Framework 2. Select CCPA 3. Save | CCPA framework created | High |
| FW-007 | Create NIST framework | 1. Click Add Framework 2. Select NIST 3. Save | NIST framework created | High |
| FW-008 | Create multiple frameworks | 1. Add SOC2 2. Add GDPR 3. Add HIPAA | All three frameworks visible | High |
| FW-009 | Duplicate framework prevention | 1. Add SOC2 2. Try adding SOC2 again | Warning or auto-merged | Medium |
| FW-010 | Framework with custom name | 1. Add framework 2. Set custom display name | Custom name displayed throughout app | Medium |

## 3.2 View Frameworks

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| FW-011 | View all frameworks list | 1. Navigate to Frameworks | All active frameworks displayed | Critical |
| FW-012 | Framework status display | 1. View frameworks list 2. Check status badges | Compliant/At Risk/In Review shown correctly | High |
| FW-013 | Framework progress percentage | 1. Implement 50% controls 2. View list | Progress bar shows 50% | High |
| FW-014 | Framework next audit date | 1. Set audit date 2. View list | Date displayed in list view | High |
| FW-015 | Framework sorting by name | 1. Click name column header | Frameworks sorted alphabetically | Medium |
| FW-016 | Framework sorting by status | 1. Click status column header | Frameworks sorted by status | Medium |
| FW-017 | Framework filtering | 1. Filter by "At Risk" status | Only at-risk frameworks shown | Medium |
| FW-018 | Empty frameworks state | 1. New org, no frameworks 2. View list | "No frameworks yet" with add CTA | High |

## 3.3 Update Framework

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| FW-019 | Update framework status | 1. Open framework 2. Change status to Compliant 3. Save | Status updated, reflected in list | High |
| FW-020 | Update audit date | 1. Open framework 2. Set new audit date 3. Save | New date displayed | High |
| FW-021 | Update framework notes | 1. Open framework 2. Add notes 3. Save | Notes saved and displayed | Medium |
| FW-022 | Audit date in past warning | 1. Set audit date to yesterday 2. Save | Warning displayed about past date | Medium |
| FW-023 | Framework status auto-calculation | 1. Implement all controls 2. Observe status | Status auto-updates to Compliant | High |

## 3.4 Delete Framework

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| FW-024 | Delete framework (admin) | 1. Login as admin 2. Delete framework | Framework removed with confirmation | High |
| FW-025 | Delete framework confirmation | 1. Click delete 2. Observe dialog | Confirmation modal with warning | High |
| FW-026 | Delete framework with controls | 1. Framework has 50 controls 2. Delete | All controls also deleted | High |
| FW-027 | Delete framework (editor denied) | 1. Login as editor 2. Try delete | Operation blocked or hidden | High |
| FW-028 | Undo delete (if supported) | 1. Delete framework 2. Click undo within timeout | Framework restored | Low |

## 3.5 Framework Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| FW-029 | Framework with 1000+ controls | 1. Import large framework 2. View and navigate | Performance acceptable, pagination/virtualization | High |
| FW-030 | Framework name with unicode | 1. Create framework "合规框架" 2. View | Name displayed correctly | Medium |
| FW-031 | Framework concurrent edit | 1. User A edits 2. User B edits same 3. Both save | Conflict resolution or last-write-wins | Medium |
| FW-032 | Framework API rate limiting | 1. Make 100 requests in 10 seconds | Rate limiting applied after threshold | High |

---

# 4. FRAMEWORK CONTROLS

## 4.1 Create Control

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CTRL-001 | Create new control | 1. Open framework 2. Click Add Control 3. Fill details 4. Save | Control created and listed | Critical |
| CTRL-002 | Control with all fields | 1. Fill title, description, category, owner 2. Save | All fields saved correctly | High |
| CTRL-003 | Control required fields validation | 1. Leave title empty 2. Try save | Error: "Title is required" | High |
| CTRL-004 | Control with long description | 1. Enter 5000 character description 2. Save | Description saved, truncated in list view | Medium |
| CTRL-005 | Control category assignment | 1. Assign to "Access Control" category 2. Save | Category saved and filterable | High |
| CTRL-006 | Control owner assignment | 1. Assign team member as owner 2. Save | Owner linked, notifications sent | High |

## 4.2 Update Control Status

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CTRL-007 | Status: Pending → In Progress | 1. Set control to In Progress 2. Save | Status updated, progress recalculated | Critical |
| CTRL-008 | Status: In Progress → Implemented | 1. Set control to Implemented 2. Save | Status updated, progress increases | Critical |
| CTRL-009 | Status: Implemented → Compliant | 1. Set control to Compliant 2. Save | Status updated, full compliance credit | Critical |
| CTRL-010 | Status with evidence required | 1. Try to mark Compliant without evidence 2. Save | Warning: "Evidence recommended" | Medium |
| CTRL-011 | Bulk status update | 1. Select 10 controls 2. Bulk update to Implemented | All 10 updated efficiently | Medium |
| CTRL-012 | Status change audit trail | 1. Change status 2. Check audit log | Status change recorded with timestamp | High |

## 4.3 Evidence Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CTRL-013 | Upload PDF evidence | 1. Select control 2. Upload PDF file 3. Save | PDF stored, linked to control | Critical |
| CTRL-014 | Upload image evidence | 1. Upload PNG/JPG screenshot | Image stored and previewable | High |
| CTRL-015 | Upload document evidence | 1. Upload DOCX file | Document stored successfully | High |
| CTRL-016 | Multiple evidence files | 1. Upload 5 files to one control | All files linked to control | High |
| CTRL-017 | Evidence file size limit | 1. Upload 100MB file | Error: "File exceeds 10MB limit" | High |
| CTRL-018 | Evidence invalid file type | 1. Upload .exe file | Error: "File type not allowed" | Critical |
| CTRL-019 | View/download evidence | 1. Click on uploaded evidence | File opens/downloads correctly | High |
| CTRL-020 | Delete evidence | 1. Click delete on evidence 2. Confirm | Evidence removed from control | High |
| CTRL-021 | Evidence versioning | 1. Upload V1 2. Upload V2 with same name | Version history maintained | Medium |

## 4.4 Smart Upload (AI-Assisted)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CTRL-022 | Smart upload policy document | 1. Upload security policy PDF 2. AI parses | Controls auto-extracted and suggested | High |
| CTRL-023 | Smart upload audit report | 1. Upload SOC2 audit report 2. AI parses | Findings mapped to controls | High |
| CTRL-024 | Smart upload with OCR | 1. Upload scanned document 2. AI processes | Text extracted via OCR, controls mapped | Medium |
| CTRL-025 | Smart upload unsupported format | 1. Upload video file | Error: "Format not supported for smart upload" | Medium |
| CTRL-026 | Smart upload confidence scores | 1. AI suggests mappings 2. View suggestions | Confidence percentage displayed | Medium |
| CTRL-027 | Accept AI suggestions | 1. Review AI suggestions 2. Accept all | Controls created from suggestions | High |
| CTRL-028 | Reject AI suggestions | 1. Review AI suggestions 2. Reject all | No controls created, feedback recorded | Medium |

## 4.5 Control Mapping

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CTRL-029 | Map control to multiple frameworks | 1. SOC2 control 2. Map to ISO27001 equivalent | Cross-reference created | High |
| CTRL-030 | View control mappings | 1. Open control 2. View "Also satisfies" section | Related controls from other frameworks shown | High |
| CTRL-031 | Implement mapped control | 1. Implement SOC2 control 2. Check mapped ISO control | Mapped control status updates (if linked) | Medium |
| CTRL-032 | Export control mappings | 1. Export all mappings to CSV | Matrix of control relationships | Medium |

## 4.6 Control Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CTRL-033 | Control with XSS in title | 1. Enter "<script>alert(1)</script>" 2. Save | Script sanitized, no execution | Critical |
| CTRL-034 | Control concurrent evidence upload | 1. User A uploads 2. User B uploads same control | Both uploads succeed, no data loss | High |
| CTRL-035 | Orphan control (framework deleted) | 1. Delete parent framework 2. Check DB | Controls cascade deleted | High |
| CTRL-036 | Control search | 1. Search "password policy" | Matching controls displayed | High |
| CTRL-037 | Control pagination (500+ controls) | 1. Framework with 500 controls 2. Navigate | Pagination works, no performance issues | High |

---

# 5. RISK MANAGEMENT

## 5.1 Create Risk

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RISK-001 | Create high severity risk | 1. Click Add Risk 2. Set severity High 3. Fill details 4. Save | Risk created with red indicator | Critical |
| RISK-002 | Create medium severity risk | 1. Create risk with Medium severity | Risk created with yellow indicator | High |
| RISK-003 | Create low severity risk | 1. Create risk with Low severity | Risk created with green indicator | High |
| RISK-004 | Risk with all fields | 1. Fill title, description, category, likelihood, impact 2. Save | All fields persisted correctly | High |
| RISK-005 | Risk likelihood × impact score | 1. Set likelihood 4, impact 5 2. Save | Risk score = 20 calculated | High |
| RISK-006 | Risk category assignment | 1. Assign "Data Breach" category 2. Save | Category filterable | High |
| RISK-007 | Risk owner assignment | 1. Assign to team member 2. Save | Owner notified, visible on risk | High |
| RISK-008 | Risk with remediation plan | 1. Create risk 2. Add remediation steps | Plan saved and trackable | High |
| RISK-009 | Risk due date setting | 1. Set remediation due date 2. Save | Due date displayed, notifications scheduled | Medium |

## 5.2 View & Filter Risks

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RISK-010 | View risk register | 1. Navigate to Risk Management | All risks displayed in list/table | Critical |
| RISK-011 | Filter by severity | 1. Filter by "High" | Only high severity risks shown | High |
| RISK-012 | Filter by status | 1. Filter by "Open" | Only open risks shown | High |
| RISK-013 | Filter by category | 1. Filter by "Data Breach" | Only matching category shown | High |
| RISK-014 | Filter by assignee | 1. Filter by team member | Only assigned risks shown | Medium |
| RISK-015 | Sort by severity (desc) | 1. Sort column by severity | High → Medium → Low order | High |
| RISK-016 | Sort by AI priority score | 1. Sort by AI score | Highest AI priority first | High |
| RISK-017 | Sort by detection date | 1. Sort by date | Most recent first | Medium |
| RISK-018 | Combined filters | 1. High severity + Open status | Intersection of filters | Medium |
| RISK-019 | Search risks | 1. Search "SQL injection" | Matching risks displayed | High |

## 5.3 Update Risk

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RISK-020 | Status: Open → In Progress | 1. Update risk status 2. Save | Status changed, timestamp recorded | Critical |
| RISK-021 | Status: In Progress → Resolved | 1. Mark as Resolved 2. Save | Risk marked resolved, removed from active | Critical |
| RISK-022 | Status: Open → Ignored | 1. Mark as Ignored 2. Add justification | Risk ignored with documented reason | High |
| RISK-023 | Update severity | 1. Change from Medium to High 2. Save | Severity updated, priority recalculated | High |
| RISK-024 | Reassign risk | 1. Change assignee 2. Save | New assignee notified | High |
| RISK-025 | Update remediation plan | 1. Edit remediation steps 2. Save | Plan version history maintained | Medium |

## 5.4 AI-Powered Risk Features

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RISK-026 | AI risk prioritization | 1. Click "Prioritize with AI" 2. Wait for response | Risks reordered by AI-calculated priority | High |
| RISK-027 | AI priority score display | 1. View prioritized risks 2. Check AI score | Score 0-100 displayed for each risk | High |
| RISK-028 | AI remediation generation | 1. Select risk 2. Click "Generate Remediation" | AI-generated remediation plan displayed | High |
| RISK-029 | AI remediation quality | 1. Review generated plan | Plan is specific, actionable, relevant | High |
| RISK-030 | AI risk scan | 1. Click "AI Risk Scan" 2. Provide context | New risks auto-discovered and suggested | High |
| RISK-031 | Accept AI-suggested risks | 1. Review suggestions 2. Accept selected | Risks added to register | High |
| RISK-032 | AI with insufficient context | 1. Minimal context provided 2. Run AI | Graceful handling, request more info | Medium |

## 5.5 Risk Heat Map

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RISK-033 | View risk heat map | 1. Navigate to heat map view | 5×5 matrix with risk counts | High |
| RISK-034 | Heat map color coding | 1. View heat map | Red (high), Yellow (medium), Green (low) | High |
| RISK-035 | Heat map click interaction | 1. Click cell on heat map | Filtered list of risks in that cell | Medium |
| RISK-036 | Heat map with no risks | 1. New org 2. View heat map | Empty heat map with explanatory message | Medium |

## 5.6 Risk Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RISK-037 | Risk with 0 likelihood | 1. Set likelihood to 0 2. Save | Validation error or score = 0 | Medium |
| RISK-038 | Risk with 0 impact | 1. Set impact to 0 2. Save | Validation error or score = 0 | Medium |
| RISK-039 | 500+ risks performance | 1. Create 500 risks 2. View register | Page loads in <3 seconds | High |
| RISK-040 | Concurrent risk update | 1. User A and B edit same risk | Last save wins or conflict notification | Medium |
| RISK-041 | Risk deletion cascade | 1. Delete risk 2. Check related items | Comments, attachments also deleted | High |

---

# 6. AI FEATURES

## 6.1 Policy Generator

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AI-001 | Generate data retention policy | 1. Select "Data Retention" type 2. Enter context 3. Generate | Complete policy document generated | High |
| AI-002 | Generate access control policy | 1. Select "Access Control" type 2. Generate | Access control policy with sections | High |
| AI-003 | Generate incident response policy | 1. Select "Incident Response" 2. Generate | IR policy with procedures | High |
| AI-004 | Policy with formal tone | 1. Set tone to "Formal" 2. Generate | Formal, legal-style language | Medium |
| AI-005 | Policy with casual tone | 1. Set tone to "Casual" 2. Generate | More readable, less formal | Medium |
| AI-006 | Policy with company context | 1. Enter company name, industry 2. Generate | Company-specific policy | High |
| AI-007 | Download generated policy | 1. Generate policy 2. Click download | Policy downloaded as markdown/PDF | High |
| AI-008 | Regenerate policy | 1. Generate 2. Click regenerate | New variation generated | Medium |

## 6.2 Contract Analyzer

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AI-009 | Analyze vendor contract | 1. Paste contract text 2. Analyze | Risks and compliance issues identified | High |
| AI-010 | Identify data processing clauses | 1. Analyze contract with DPA | Data processing terms highlighted | High |
| AI-011 | Identify liability clauses | 1. Analyze contract | Liability and indemnity issues flagged | High |
| AI-012 | Identify SLA terms | 1. Analyze contract with SLA | SLA terms extracted and summarized | Medium |
| AI-013 | Contract risk score | 1. Analyze contract | Overall risk score (Low/Medium/High) | High |
| AI-014 | Analyze very long contract | 1. 50-page contract 2. Analyze | Handled (may be chunked) | Medium |
| AI-015 | Empty contract input | 1. Submit empty text | Error: "Please provide contract text" | High |

## 6.3 Gap Analysis

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AI-016 | SOC2 gap analysis | 1. Select SOC2 2. Enter current state 3. Analyze | Gaps identified against SOC2 requirements | High |
| AI-017 | GDPR gap analysis | 1. Select GDPR 2. Analyze | GDPR-specific gaps identified | High |
| AI-018 | HIPAA gap analysis | 1. Select HIPAA 2. Analyze | HIPAA compliance gaps | High |
| AI-019 | Gap prioritization | 1. Run analysis 2. View results | Gaps sorted by criticality | High |
| AI-020 | Gap remediation suggestions | 1. View gap 2. See recommendations | Actionable remediation steps | High |
| AI-021 | Export gap analysis | 1. Run analysis 2. Export | CSV/PDF export of gaps | Medium |

## 6.4 RFP Responder

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AI-022 | Generate security RFP response | 1. Paste RFP questions 2. Generate | Answers generated for each question | High |
| AI-023 | RFP with company context | 1. Add company certifications 2. Generate | Responses reference company credentials | High |
| AI-024 | RFP confidence scores | 1. Generate responses 2. View scores | Confidence % for each answer | Medium |
| AI-025 | Edit RFP response | 1. Generate 2. Edit specific answer 3. Save | Edited response saved | High |
| AI-026 | Export RFP responses | 1. Generate 2. Export | Formatted export for submission | High |

## 6.5 Phishing Training Generator

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AI-027 | Generate email phishing scenario | 1. Select "Email Phishing" 2. Generate | Realistic phishing email template | High |
| AI-028 | Generate spear phishing | 1. Add target context 2. Generate | Personalized phishing scenario | High |
| AI-029 | Generate smishing scenario | 1. Select SMS phishing 2. Generate | SMS-based phishing template | Medium |
| AI-030 | Phishing with difficulty levels | 1. Select "Hard" difficulty 2. Generate | More sophisticated, harder to detect | Medium |
| AI-031 | Training question generation | 1. Generate scenario 2. Get quiz questions | Questions to test employee awareness | High |

## 6.6 Vendor Scorer

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AI-032 | Score vendor with certifications | 1. Enter vendor with SOC2 2. Score | High score due to certification | High |
| AI-033 | Score vendor without certifications | 1. Vendor with no certs 2. Score | Lower score, recommendations provided | High |
| AI-034 | Multi-factor vendor scoring | 1. Enter security, financial, operational info | Composite risk score | High |
| AI-035 | Vendor comparison | 1. Score multiple vendors 2. Compare | Side-by-side comparison view | Medium |

## 6.7 Data Mapper

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AI-036 | Map data flows | 1. Describe data sources 2. Map | Visual data flow diagram generated | High |
| AI-037 | Identify PII in data map | 1. Map data flows 2. Highlight PII | Personal data highlighted | High |
| AI-038 | Cross-border data transfers | 1. Include international transfers 2. Map | Transfer mechanisms identified | High |
| AI-039 | Data retention in map | 1. Map data 2. Show retention | Retention periods displayed | Medium |

## 6.8 BCP Generator

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AI-040 | Generate business continuity plan | 1. Enter business context 2. Generate | Complete BCP document | High |
| AI-041 | BCP with specific scenarios | 1. Select "Natural Disaster" 2. Generate | Disaster-specific continuity plan | High |
| AI-042 | BCP with RTO/RPO | 1. Set RTO: 4 hours, RPO: 1 hour 2. Generate | Plan aligned to recovery objectives | High |
| AI-043 | BCP contact tree | 1. Generate BCP 2. View contacts | Emergency contact tree generated | Medium |

## 6.9 Compliance Chat

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AI-044 | Ask compliance question | 1. Type "What is SOC2 Type 2?" 2. Send | Accurate explanation returned | High |
| AI-045 | Ask about specific control | 1. "How to implement CC6.1?" 2. Send | Control-specific guidance | High |
| AI-046 | Multi-turn conversation | 1. Ask question 2. Follow-up 3. Follow-up | Context maintained across turns | High |
| AI-047 | Chat with file context | 1. Upload policy 2. Ask about it | Answers reference uploaded file | Medium |
| AI-048 | Clear chat history | 1. Click clear 2. Ask question | Fresh context, no previous memory | Medium |
| AI-049 | Chat rate limiting | 1. Send 50 messages in 1 minute | Rate limit applied after threshold | High |

## 6.10 AI Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AI-050 | AI service unavailable | 1. Gemini API down 2. Request AI feature | Error: "AI service temporarily unavailable" | High |
| AI-051 | AI quota exceeded | 1. Exceed 60 requests/minute 2. Request | Error with specific quota message | High |
| AI-052 | AI with PII input | 1. Include SSN, CC numbers 2. Generate | PII redacted before sending to AI | Critical |
| AI-053 | AI response timeout | 1. Complex request 2. Wait | Timeout after 60s with error message | High |
| AI-054 | AI with malicious prompt | 1. Attempt prompt injection 2. Submit | Injection neutralized, safe response | Critical |
| AI-055 | AI rate limiting per user | 1. User hits 60/min limit | Clear error: "Rate limit exceeded" | High |

---

# 7. INTEGRATIONS

## 7.1 Integration Hub

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-001 | View integrations page | 1. Navigate to Integrations | All 75+ integrations displayed by category | High |
| INT-002 | Filter by category (Cloud) | 1. Select "Cloud" filter | AWS, Azure, GCP shown | High |
| INT-003 | Filter by category (Dev) | 1. Select "Dev" filter | GitHub, GitLab, Jira shown | High |
| INT-004 | Filter by category (Security) | 1. Select "Security" filter | Security tools shown | High |
| INT-005 | Search integrations | 1. Search "slack" | Slack integration displayed | High |
| INT-006 | View integration details | 1. Click on integration | Modal with description and connect button | High |

## 7.2 OAuth Integrations

### 7.2.1 Google Workspace
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-007 | Connect Google Workspace | 1. Click Connect 2. OAuth flow 3. Authorize | Google Workspace connected | Critical |
| INT-008 | Google OAuth consent screen | 1. Start connect 2. View consent | Correct scopes displayed | High |
| INT-009 | Google OAuth denial | 1. Start connect 2. Deny access | Graceful handling, return to app | High |
| INT-010 | Google token refresh | 1. Token expires 2. Auto-refresh | New token obtained silently | High |
| INT-011 | Google data sync | 1. Connect 2. Click Sync | User/group data imported | High |
| INT-012 | Disconnect Google | 1. Click Disconnect 2. Confirm | Connection removed, tokens deleted | High |

### 7.2.2 GitHub
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-013 | Connect GitHub | 1. Click Connect 2. OAuth flow 3. Authorize | GitHub connected | Critical |
| INT-014 | GitHub repo scanning | 1. Connect 2. Scan repos | Security issues detected | High |
| INT-015 | GitHub with org access | 1. Authorize org access 2. Connect | Organization repos accessible | High |
| INT-016 | GitHub without org access | 1. Only personal access 2. Connect | Only personal repos visible | Medium |
| INT-017 | Disconnect GitHub | 1. Click Disconnect | Connection removed | High |

### 7.2.3 Slack
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-018 | Connect Slack | 1. Click Connect 2. OAuth 3. Select workspace | Slack connected | Critical |
| INT-019 | Slack notifications | 1. Connect 2. Configure channel 3. Trigger event | Notification in Slack channel | High |
| INT-020 | Slack multiple workspaces | 1. Connect Workspace A 2. Connect Workspace B | Both workspaces connected | Medium |
| INT-021 | Disconnect Slack | 1. Click Disconnect | Connection removed | High |

### 7.2.4 Jira
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-022 | Connect Jira | 1. Click Connect 2. OAuth 3. Select site | Jira connected | Critical |
| INT-023 | Create Jira issue from risk | 1. View risk 2. Click "Create Jira Issue" | Issue created in Jira | High |
| INT-024 | Jira issue sync | 1. Update issue in Jira 2. Sync | Status updated in ComplyEasyAI | Medium |
| INT-025 | Disconnect Jira | 1. Click Disconnect | Connection removed | High |

## 7.3 API Key Integrations

### 7.3.1 AWS
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-026 | Connect AWS | 1. Enter Access Key ID 2. Enter Secret Key 3. Connect | AWS connected | Critical |
| INT-027 | AWS invalid credentials | 1. Enter wrong keys 2. Connect | Error: "Invalid AWS credentials" | High |
| INT-028 | AWS resource scanning | 1. Connect 2. Scan | EC2, S3, IAM resources discovered | High |
| INT-029 | AWS minimal permissions | 1. Limited IAM role 2. Connect | Graceful handling of permission limits | Medium |
| INT-030 | AWS multi-region | 1. Select regions 2. Scan | Resources from selected regions | Medium |

### 7.3.2 Azure
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-031 | Connect Azure | 1. Enter credentials 2. Connect | Azure connected | Critical |
| INT-032 | Azure resource discovery | 1. Connect 2. Scan | Azure resources discovered | High |
| INT-033 | Azure invalid credentials | 1. Wrong credentials 2. Connect | Error message displayed | High |

## 7.4 Integration State Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-034 | OAuth state parameter | 1. Start OAuth 2. Check state param | Random state generated for CSRF protection | Critical |
| INT-035 | OAuth state expiry | 1. Start OAuth 2. Wait 11 minutes 3. Complete | Error: "OAuth session expired" | High |
| INT-036 | OAuth state mismatch | 1. Modify state parameter | Error: "State mismatch, possible CSRF" | Critical |
| INT-037 | Integration status display | 1. View connected integration | "Connected" badge, last sync time | High |
| INT-038 | Integration error status | 1. Token expires 2. View status | "Error - Reconnection required" | High |

## 7.5 Integration Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-039 | Multiple OAuth windows | 1. Open OAuth in 2 tabs | Only one succeeds, other fails gracefully | Medium |
| INT-040 | Integration during network loss | 1. Start connect 2. Lose network | Error with retry option | High |
| INT-041 | Token storage security | 1. Connect integration 2. Check DB | Tokens encrypted at rest | Critical |
| INT-042 | Reconnect failed integration | 1. Integration fails 2. Click Reconnect | Fresh OAuth flow, old tokens cleared | High |
| INT-043 | Integration rate limits | 1. Sync 1000 items 2. Hit rate limit | Graceful backoff, resume later | High |

---

# 8. TEAM MANAGEMENT

## 8.1 Invite Team Members

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TEAM-001 | Invite with admin role | 1. Enter email 2. Select Admin 3. Send invite | Invitation sent, appears in pending | Critical |
| TEAM-002 | Invite with editor role | 1. Enter email 2. Select Editor 3. Send invite | Invitation sent correctly | Critical |
| TEAM-003 | Invite with viewer role | 1. Enter email 2. Select Viewer 3. Send invite | Invitation sent correctly | Critical |
| TEAM-004 | Invite existing user | 1. Invite already-member email | Error: "User already in organization" | High |
| TEAM-005 | Invite invalid email | 1. Enter invalid email format | Error: "Invalid email address" | High |
| TEAM-006 | Bulk invite | 1. Enter multiple emails 2. Send | All invitations sent | Medium |
| TEAM-007 | Invite with custom message | 1. Add personal message 2. Send | Message included in email | Low |
| TEAM-008 | Invitation email received | 1. Send invite 2. Check recipient inbox | Email with accept link received | Critical |
| TEAM-009 | Accept invitation | 1. Click accept in email 2. Complete signup | User added to organization | Critical |
| TEAM-010 | Decline invitation | 1. Ignore/decline invitation | Invitation expires after 7 days | Medium |
| TEAM-011 | Resend invitation | 1. View pending 2. Click Resend | New invitation email sent | High |

## 8.2 Manage Team Members

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TEAM-012 | View team list | 1. Navigate to Settings > Team | All members with roles displayed | High |
| TEAM-013 | Change member role | 1. Select member 2. Change role 3. Save | Role updated immediately | High |
| TEAM-014 | Demote admin to viewer | 1. Admin changes another admin to viewer | Role changed, permissions updated | High |
| TEAM-015 | Last admin protection | 1. Try to demote last admin | Error: "Must have at least one admin" | Critical |
| TEAM-016 | Remove team member | 1. Click Remove 2. Confirm | Member removed from organization | High |
| TEAM-017 | Remove self (admin) | 1. Admin tries to remove self | Error or warning about consequences | High |
| TEAM-018 | Search team members | 1. Search by name/email | Filtered results displayed | Medium |
| TEAM-019 | Sort by role | 1. Click role column | Sorted alphabetically by role | Low |

## 8.3 Team Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TEAM-020 | Invite to full plan limit | 1. Free plan, 3 users 2. Invite 4th | Error: "Upgrade plan for more users" | High |
| TEAM-021 | Removed user session | 1. Remove user 2. User refreshes page | User logged out, access revoked | Critical |
| TEAM-022 | Invitation link reuse | 1. Accept invitation 2. Click link again | Error: "Invitation already used" | High |
| TEAM-023 | Team member with 2FA | 1. Member enables 2FA 2. View team | 2FA status visible to admin | Medium |
| TEAM-024 | Large team (100+ members) | 1. 100 members 2. View list | Pagination, performance acceptable | High |

---

# 9. SETTINGS

## 9.1 Organization Profile

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SET-001 | Update organization name | 1. Change name 2. Save | Name updated throughout app | High |
| SET-002 | Organization name validation | 1. Enter empty name 2. Save | Error: "Name required" | High |
| SET-003 | Organization name max length | 1. Enter 500 characters 2. Save | Truncated or error | Medium |
| SET-004 | Update organization logo | 1. Upload logo image 2. Save | Logo displayed in app header | Medium |
| SET-005 | Invalid logo format | 1. Upload .txt file | Error: "Invalid image format" | Medium |
| SET-006 | Logo size limit | 1. Upload 10MB image | Error or auto-resize | Medium |

## 9.2 User Profile

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SET-007 | Update display name | 1. Change name 2. Save | Name updated throughout app | High |
| SET-008 | Update avatar | 1. Upload new avatar 2. Save | Avatar displayed in header/comments | Medium |
| SET-009 | Update notification preferences | 1. Toggle email notifications 2. Save | Preference saved | Medium |
| SET-010 | Update timezone | 1. Select new timezone 2. Save | Dates display in new timezone | Medium |
| SET-011 | Update language | 1. Select language 2. Save | UI language changes | Low |

## 9.3 Plan Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SET-012 | View current plan | 1. Go to Settings > Billing | Current plan details displayed | High |
| SET-013 | View plan features | 1. Go to plan selection | Feature comparison visible | High |
| SET-014 | Upgrade Basic → Pro | 1. Select Pro 2. Complete payment | Plan upgraded, features unlocked | Critical |
| SET-015 | Upgrade Pro → Enterprise | 1. Select Enterprise 2. Contact sales | Sales contact initiated | High |
| SET-016 | Downgrade Pro → Basic | 1. Select Basic 2. Confirm | Downgrade scheduled for next billing | High |
| SET-017 | Downgrade with excess users | 1. Pro with 10 users → Basic (5 limit) | Warning: "Remove users first" | High |
| SET-018 | View usage metrics | 1. Go to Settings > Usage | Current usage vs. plan limits | High |

## 9.4 Settings Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SET-019 | Settings concurrent edit | 1. Admin A edits 2. Admin B edits 3. Both save | Last save wins or conflict | Medium |
| SET-020 | Settings with XSS | 1. Enter "<script>" in org name 2. Save | Script sanitized | Critical |
| SET-021 | Settings API rate limit | 1. Save 50 times in 1 minute | Rate limiting applied | Medium |

---

# 10. BILLING & PAYMENTS

## 10.1 Stripe Checkout

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BILL-001 | Create checkout session | 1. Select plan 2. Click Subscribe | Redirected to Stripe checkout | Critical |
| BILL-002 | Successful payment | 1. Complete checkout with valid card | Success page, plan activated | Critical |
| BILL-003 | Failed payment | 1. Use declined card 2. Submit | Error message, retry option | Critical |
| BILL-004 | 3D Secure authentication | 1. Use 3DS card 2. Complete auth | Payment successful after auth | High |
| BILL-005 | Cancel checkout | 1. Start checkout 2. Close window | Return to app, no charge | High |
| BILL-006 | Checkout timeout | 1. Start checkout 2. Wait 30 minutes | Session expires, must restart | Medium |

## 10.2 Subscription Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BILL-007 | View active subscription | 1. Go to Billing | Current plan, next billing date shown | High |
| BILL-008 | View billing history | 1. Go to Billing > Invoices | List of past invoices | High |
| BILL-009 | Download invoice | 1. Click invoice 2. Download PDF | PDF invoice downloaded | High |
| BILL-010 | Update payment method | 1. Go to Billing 2. Update card | New card saved | High |
| BILL-011 | Cancel subscription | 1. Click Cancel 2. Confirm | Subscription cancels at period end | High |
| BILL-012 | Reactivate cancelled sub | 1. Before period end 2. Reactivate | Subscription continues | Medium |

## 10.3 Stripe Webhooks

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BILL-013 | Webhook: payment_intent.succeeded | 1. Payment completes 2. Webhook fires | Subscription activated in DB | Critical |
| BILL-014 | Webhook: invoice.paid | 1. Recurring payment 2. Webhook fires | Next period unlocked | Critical |
| BILL-015 | Webhook: invoice.payment_failed | 1. Payment fails 2. Webhook fires | User notified, grace period | High |
| BILL-016 | Webhook: customer.subscription.deleted | 1. Sub cancelled 2. Webhook fires | Access revoked appropriately | High |
| BILL-017 | Webhook signature validation | 1. Fake webhook without signature | Rejected with 400 error | Critical |
| BILL-018 | Webhook idempotency | 1. Same webhook twice | Handled once, no duplicate | High |

## 10.4 Billing Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BILL-019 | Payment in different currency | 1. USD user, EUR card | Currency conversion handled | Medium |
| BILL-020 | Proration on upgrade | 1. Mid-cycle upgrade | Prorated charge calculated | High |
| BILL-021 | Proration on downgrade | 1. Mid-cycle downgrade | Credit applied to next invoice | High |
| BILL-022 | Subscription with coupon | 1. Apply discount code 2. Subscribe | Discount applied to invoice | Medium |
| BILL-023 | Expired card auto-update | 1. Card expires 2. Stripe auto-updates | Payments continue (card networks) | Low |

---

# 11. AUDIT TRAIL

## 11.1 Audit Log Recording

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUDIT-001 | Log user login | 1. User logs in | Login event recorded with timestamp | Critical |
| AUDIT-002 | Log user logout | 1. User logs out | Logout event recorded | High |
| AUDIT-003 | Log framework creation | 1. Create framework | "Framework Created" logged with ID | Critical |
| AUDIT-004 | Log framework update | 1. Update framework | "Framework Updated" logged with changes | High |
| AUDIT-005 | Log framework deletion | 1. Delete framework | "Framework Deleted" logged | High |
| AUDIT-006 | Log control status change | 1. Change control status | Status change recorded | High |
| AUDIT-007 | Log evidence upload | 1. Upload evidence | File upload logged with filename | High |
| AUDIT-008 | Log risk creation | 1. Create risk | Risk creation logged | High |
| AUDIT-009 | Log team member invite | 1. Invite member | Invitation logged | High |
| AUDIT-010 | Log role change | 1. Change user role | Role change logged | High |
| AUDIT-011 | Log settings change | 1. Update settings | Settings change logged | Medium |
| AUDIT-012 | Log integration connect | 1. Connect integration | Integration logged | High |
| AUDIT-013 | Log billing event | 1. Payment processed | Billing event logged | High |

## 11.2 Audit Log Display

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUDIT-014 | View audit log | 1. Navigate to Audit Trail | All logs displayed with details | High |
| AUDIT-015 | Filter by action type | 1. Filter by "CREATE" | Only creation events shown | High |
| AUDIT-016 | Filter by user | 1. Filter by specific user | Only that user's actions shown | High |
| AUDIT-017 | Filter by date range | 1. Set date range | Logs within range shown | High |
| AUDIT-018 | Search audit logs | 1. Search keyword | Matching logs displayed | High |
| AUDIT-019 | Audit log pagination | 1. 1000+ logs 2. Navigate pages | Pagination works correctly | High |
| AUDIT-020 | Export audit log CSV | 1. Click Export | CSV downloaded with all logs | High |

## 11.3 Blockchain Verification

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUDIT-021 | Hash generation for log | 1. Create audit event | Unique hash generated | High |
| AUDIT-022 | Hash verification | 1. View log 2. Click Verify | Verification status displayed | High |
| AUDIT-023 | Tampered log detection | 1. Modify log in DB 2. Verify | "Verification Failed" - tampered | Critical |
| AUDIT-024 | Blockchain submission | 1. Log created 2. Check blockchain | Hash submitted to Ethereum/Polygon | Medium |
| AUDIT-025 | Blockchain verification link | 1. View log 2. Click blockchain link | Etherscan/Polygonscan shows hash | Medium |

## 11.4 Audit Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUDIT-026 | High-volume logging | 1. 1000 actions in 1 minute | All logged without loss | High |
| AUDIT-027 | Audit log immutability | 1. Try to edit log via API | Edit rejected, 403 error | Critical |
| AUDIT-028 | Audit log deletion | 1. Try to delete log | Deletion blocked | Critical |
| AUDIT-029 | Log with special characters | 1. Action with unicode 2. View log | Characters displayed correctly | Medium |
| AUDIT-030 | Audit log IP tracking | 1. Perform action 2. View log | IP address recorded | High |

---

# 12. VENDOR MANAGEMENT

## 12.1 Vendor CRUD

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| VEND-001 | Create vendor | 1. Click Add Vendor 2. Fill details 3. Save | Vendor created | Critical |
| VEND-002 | Vendor with certifications | 1. Add SOC2, ISO27001 certs 2. Save | Certifications saved | High |
| VEND-003 | Vendor risk level assignment | 1. Set risk to High 2. Save | Risk level displayed with color | High |
| VEND-004 | View vendor list | 1. Navigate to Vendors | All vendors displayed | High |
| VEND-005 | Filter vendors by risk | 1. Filter by High risk | High-risk vendors shown | High |
| VEND-006 | Update vendor | 1. Edit vendor details 2. Save | Changes persisted | High |
| VEND-007 | Delete vendor | 1. Delete vendor 2. Confirm | Vendor removed | High |
| VEND-008 | Vendor with contract dates | 1. Set contract start/end 2. Save | Dates displayed, renewal alerts | High |
| VEND-009 | Vendor annual spend | 1. Set spend amount 2. Save | Spend tracked and reportable | Medium |

## 12.2 Vendor Assessments

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| VEND-010 | Create vendor assessment | 1. Select vendor 2. Start assessment | Assessment created | High |
| VEND-011 | Complete assessment | 1. Answer all questions 2. Submit | Assessment completed with score | High |
| VEND-012 | Partial assessment save | 1. Answer some questions 2. Save draft | Progress saved | Medium |
| VEND-013 | AI-assisted assessment | 1. Enable AI assist 2. Complete | AI suggests answers | High |
| VEND-014 | Assessment score calculation | 1. Complete assessment | Risk score calculated | High |
| VEND-015 | View assessment history | 1. View vendor 2. Check history | Past assessments visible | High |

## 12.3 Vendor Monitoring

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| VEND-016 | Enable vendor monitoring | 1. Configure monitoring 2. Save | Monitoring active | High |
| VEND-017 | Monitor finding | 1. Monitor detects issue 2. Alert | Finding created, user notified | High |
| VEND-018 | Disable monitoring | 1. Turn off monitoring 2. Save | Monitoring stopped | Medium |

---

# 13. QUESTIONNAIRES

## 13.1 Questionnaire Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| QUEST-001 | Create questionnaire | 1. Click Create 2. Add questions 3. Save | Questionnaire created | High |
| QUEST-002 | Questionnaire types | 1. Select "Vendor Assessment" type | Type-specific questions available | High |
| QUEST-003 | Add multiple choice question | 1. Add question 2. Set type to multiple choice | MC question saved | High |
| QUEST-004 | Add free-text question | 1. Add question 2. Set type to text | Text question saved | High |
| QUEST-005 | Add required question | 1. Mark question required 2. Save | Validation enforced | High |
| QUEST-006 | Edit questionnaire | 1. Edit questions 2. Save | Changes persisted | High |
| QUEST-007 | Delete questionnaire | 1. Delete 2. Confirm | Questionnaire removed | High |
| QUEST-008 | Duplicate questionnaire | 1. Click Duplicate | Copy created for editing | Medium |

## 13.2 Questionnaire Responses

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| QUEST-009 | Submit response | 1. Answer all questions 2. Submit | Response saved | High |
| QUEST-010 | AI-generated response | 1. Click "AI Assist" 2. Review | AI drafts responses | High |
| QUEST-011 | AI confidence score | 1. View AI response | Confidence % displayed | Medium |
| QUEST-012 | Human review flag | 1. Low confidence answer 2. Flag | Answer marked for review | High |
| QUEST-013 | View all responses | 1. Navigate to questionnaire 2. View responses | All submissions listed | High |
| QUEST-014 | Export responses | 1. Click Export | CSV/Excel download | Medium |

---

# 14. POLICY LIBRARY

## 14.1 Policy Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| POL-001 | Create policy | 1. Click Create Policy 2. Fill details 3. Save | Policy created | High |
| POL-002 | Policy with category | 1. Set category "Data Retention" | Category assigned, filterable | High |
| POL-003 | Policy version control | 1. Edit policy 2. Save | Version incremented (v1 → v2) | High |
| POL-004 | View policy versions | 1. Click policy 2. View history | All versions displayed | High |
| POL-005 | Restore previous version | 1. Select old version 2. Restore | Previous version becomes current | Medium |
| POL-006 | Policy approval workflow | 1. Submit for approval 2. Admin approves | Policy marked approved | High |
| POL-007 | Policy review schedule | 1. Set annual review 2. Save | Reminder scheduled | Medium |
| POL-008 | Bulk import policies | 1. Upload JSON/YAML 2. Import | Multiple policies created | Medium |
| POL-009 | Export policy | 1. Select policy 2. Export PDF | PDF downloaded | High |
| POL-010 | Delete policy | 1. Delete 2. Confirm | Policy archived/deleted | High |

## 14.2 Policy Templates

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| POL-011 | View template library | 1. Navigate to templates | Pre-built templates displayed | High |
| POL-012 | Use template | 1. Select template 2. Create from it | Policy created from template | High |
| POL-013 | Customize template | 1. Create from template 2. Edit | Template customized | High |

---

# 15. TRUST CENTER

## 15.1 Certificate Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TRUST-001 | Add SOC2 certificate | 1. Upload SOC2 Type 2 report 2. Set dates | Certificate added | High |
| TRUST-002 | Add ISO27001 certificate | 1. Upload ISO cert 2. Set dates | Certificate added | High |
| TRUST-003 | Certificate expiration tracking | 1. Add cert with expiry 2. Wait | Expiration warning triggered | High |
| TRUST-004 | View all certificates | 1. Navigate to Trust Center | All certs displayed | High |
| TRUST-005 | Certificate public visibility | 1. Mark cert as public 2. Save | Visible in public trust center | High |
| TRUST-006 | Certificate private | 1. Mark cert as private 2. Save | Hidden from public | High |
| TRUST-007 | Delete certificate | 1. Remove expired cert | Certificate deleted | Medium |

## 15.2 Public Trust Center

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TRUST-008 | View public trust center | 1. Access public URL | Public compliance info displayed | High |
| TRUST-009 | Request document access | 1. Visitor requests NDA doc | Request sent to admin | Medium |
| TRUST-010 | Approve document request | 1. Admin approves | Visitor receives access link | Medium |
| TRUST-011 | Trust center branding | 1. Customize logo/colors | Branding displayed | Low |

---

# 16. CONTINUOUS MONITORING

## 16.1 Monitor Configuration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MON-001 | Create monitor | 1. Click Create Monitor 2. Configure 3. Save | Monitor created | High |
| MON-002 | Monitor with integration source | 1. Select AWS integration 2. Configure checks | AWS-specific monitoring | High |
| MON-003 | Monitor frequency setting | 1. Set hourly frequency | Monitor runs every hour | High |
| MON-004 | Monitor test script | 1. Add test script 2. Save | Script validated and saved | High |
| MON-005 | Enable/disable monitor | 1. Toggle monitor on/off | State changed | High |
| MON-006 | Delete monitor | 1. Delete monitor 2. Confirm | Monitor removed | High |

## 16.2 Monitor Execution

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MON-007 | Manual monitor run | 1. Click Run Now | Monitor executes immediately | High |
| MON-008 | Scheduled monitor run | 1. Wait for schedule | Monitor runs on schedule | High |
| MON-009 | Monitor pass result | 1. All checks pass | "Pass" result recorded | High |
| MON-010 | Monitor fail result | 1. Check fails | "Fail" result, alert triggered | High |
| MON-011 | Monitor finding creation | 1. Issue detected | Finding auto-created | High |
| MON-012 | Auto-remediation | 1. Enable auto-remediate 2. Issue detected | Remediation attempted | Medium |

## 16.3 Monitor Results

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MON-013 | View monitor results | 1. Select monitor 2. View history | All results displayed | High |
| MON-014 | Result details | 1. Click result | Detailed output shown | High |
| MON-015 | Result trends | 1. View over time | Pass/fail trend chart | Medium |

---

# 17. REPORTING

## 17.1 Standard Reports

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RPT-001 | Generate compliance report | 1. Select framework 2. Generate | PDF report generated | High |
| RPT-002 | Generate risk report | 1. Select Risk Report 2. Generate | Risk summary PDF | High |
| RPT-003 | Generate vendor risk report | 1. Select Vendor Report 2. Generate | Vendor risk PDF | High |
| RPT-004 | Generate executive summary | 1. Select Executive Summary 2. Generate | High-level PDF | High |
| RPT-005 | Report with date range | 1. Set date range 2. Generate | Filtered data in report | High |
| RPT-006 | Download report | 1. Generate 2. Download | PDF downloaded | High |

## 17.2 Scheduled Reports

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RPT-007 | Schedule weekly report | 1. Configure weekly schedule 2. Save | Report scheduled | High |
| RPT-008 | Schedule monthly report | 1. Configure monthly 2. Save | Report scheduled | High |
| RPT-009 | Report email distribution | 1. Add email recipients 2. Save | Emails sent with report | High |
| RPT-010 | Pause scheduled report | 1. Toggle pause | Schedule paused | Medium |
| RPT-011 | Delete scheduled report | 1. Delete schedule | Schedule removed | Medium |

## 17.3 Custom Reports

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RPT-012 | Create custom report | 1. Select fields 2. Configure filters 3. Save | Custom report template saved | Medium |
| RPT-013 | Run custom report | 1. Select template 2. Generate | Custom report generated | Medium |
| RPT-014 | Edit custom report | 1. Modify template 2. Save | Template updated | Medium |

---

# 18. ISSUE MANAGEMENT

## 18.1 Issue CRUD

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ISSUE-001 | Create issue | 1. Click Create Issue 2. Fill details 3. Save | Issue created | High |
| ISSUE-002 | Issue priority assignment | 1. Set priority High 2. Save | Priority displayed with color | High |
| ISSUE-003 | Issue assignment | 1. Assign to team member 2. Save | Assignee notified | High |
| ISSUE-004 | Issue due date | 1. Set due date 2. Save | Due date tracked | High |
| ISSUE-005 | Issue SLA | 1. Set SLA 2. Save | SLA countdown visible | High |
| ISSUE-006 | View all issues | 1. Navigate to Issues | All issues displayed | High |
| ISSUE-007 | Filter issues by status | 1. Filter by Open | Open issues shown | High |
| ISSUE-008 | Update issue status | 1. Change status 2. Save | Status updated | High |
| ISSUE-009 | Close issue | 1. Mark as Closed 2. Save | Issue closed | High |

## 18.2 Issue Collaboration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ISSUE-010 | Add comment | 1. Add comment 2. Submit | Comment saved | High |
| ISSUE-011 | @mention in comment | 1. @username in comment | User notified | High |
| ISSUE-012 | View comment history | 1. Open issue | All comments displayed | High |
| ISSUE-013 | Add attachment | 1. Attach file to issue | File uploaded | Medium |

## 18.3 Issue Metrics

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ISSUE-014 | View issue dashboard | 1. Navigate to Issues | Open/closed counts, SLA metrics | High |
| ISSUE-015 | Issue aging report | 1. View aging | Old issues highlighted | Medium |
| ISSUE-016 | SLA breach alert | 1. Issue approaches SLA | Alert triggered | High |

---

# 19. MULTI-WORKSPACE

## 19.1 Child Organization Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MULTI-001 | Create child organization | 1. Click Create Child Org 2. Configure | Child org created | High |
| MULTI-002 | View organization hierarchy | 1. Navigate to Workspaces | Parent-child tree displayed | High |
| MULTI-003 | Switch between organizations | 1. Select different org from switcher | Context switches to new org | High |
| MULTI-004 | Child inherits parent settings | 1. Create child 2. Check settings | Default settings inherited | Medium |
| MULTI-005 | Child independent data | 1. Create risk in child | Risk only in child org | High |
| MULTI-006 | Delete child organization | 1. Delete child org 2. Confirm | Child and data removed | High |

## 19.2 Consolidated Metrics

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MULTI-007 | Consolidated dashboard | 1. Parent views dashboard | Aggregated metrics from all children | High |
| MULTI-008 | Drill-down to child | 1. Click child in consolidated view | Navigate to child details | High |
| MULTI-009 | Consolidated compliance score | 1. View parent dashboard | Weighted average across children | High |
| MULTI-010 | Consolidated risk count | 1. View parent dashboard | Sum of all child risks | High |

## 19.3 Multi-Workspace Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MULTI-011 | Deeply nested hierarchy | 1. Create 5-level hierarchy | All levels accessible | Medium |
| MULTI-012 | Cross-org data isolation | 1. Try accessing sibling org data | Access denied | Critical |
| MULTI-013 | Parent user access to child | 1. Parent admin accesses child | Access granted | High |
| MULTI-014 | Child user access to parent | 1. Child user tries parent | Access denied | High |

---

# 20. TWO-FACTOR AUTHENTICATION

## 20.1 2FA Setup

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| 2FA-001 | Enable 2FA | 1. Go to Settings 2. Click Enable 2FA | QR code displayed | Critical |
| 2FA-002 | Scan QR code | 1. Scan with authenticator app | App shows 6-digit code | High |
| 2FA-003 | Verify initial code | 1. Enter first code 2. Submit | 2FA enabled on account | Critical |
| 2FA-004 | Wrong verification code | 1. Enter incorrect code | Error: "Invalid code" | High |
| 2FA-005 | View backup codes | 1. Enable 2FA 2. View backup | 10 backup codes displayed | High |
| 2FA-006 | Download backup codes | 1. Click Download | Text file with codes | High |

## 20.2 2FA Login

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| 2FA-007 | Login with 2FA enabled | 1. Enter email 2. Magic link 3. Enter 2FA code | Fully authenticated | Critical |
| 2FA-008 | Correct 2FA code | 1. Enter valid TOTP code | Login successful | Critical |
| 2FA-009 | Wrong 2FA code | 1. Enter incorrect code | Error: "Invalid code" | Critical |
| 2FA-010 | Expired 2FA code | 1. Enter code after 30 seconds | Error: "Code expired" | High |
| 2FA-011 | Use backup code | 1. Enter backup code | Login successful, code consumed | High |
| 2FA-012 | Reuse backup code | 1. Use same backup code twice | Error: "Code already used" | High |
| 2FA-013 | Rate limit 2FA attempts | 1. Enter wrong code 10 times | Account locked temporarily | Critical |

## 20.3 2FA Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| 2FA-014 | Disable 2FA | 1. Go to Settings 2. Disable 2FA | 2FA removed from account | High |
| 2FA-015 | Regenerate backup codes | 1. Click Regenerate | New codes generated, old invalidated | High |
| 2FA-016 | Change authenticator | 1. Disable 2FA 2. Re-enable | New QR code, new secret | Medium |

---

# 21. EMAIL SERVICES

## 21.1 SendGrid Integration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| EMAIL-001 | Magic link email sent | 1. Request magic link | Email received in inbox | Critical |
| EMAIL-002 | Email delivery speed | 1. Request email 2. Time delivery | Email received <30 seconds | High |
| EMAIL-003 | Email formatting | 1. View received email | Proper HTML formatting, branding | High |
| EMAIL-004 | Email mobile responsive | 1. View on mobile | Email readable on mobile | Medium |
| EMAIL-005 | Team invitation email | 1. Invite team member | Invitation email received | High |
| EMAIL-006 | Report delivery email | 1. Schedule report | Report attached/linked | High |

## 21.2 Email Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| EMAIL-007 | SendGrid API key missing | 1. Remove API key 2. Send email | Error: Configuration error | High |
| EMAIL-008 | Invalid from email | 1. Bad SENDGRID_FROM_EMAIL 2. Send | Detailed error message | High |
| EMAIL-009 | Email to non-existent domain | 1. Send to bad@nonexistent.invalid | Bounce handled gracefully | Medium |
| EMAIL-010 | Large email queue | 1. 1000 emails queued | All sent without loss | High |
| EMAIL-011 | Email with special chars | 1. Subject with unicode | Characters displayed correctly | Medium |

---

# 22. FILE UPLOAD & STORAGE

## 22.1 S3 Upload

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| S3-001 | Upload evidence file | 1. Select file 2. Upload | File stored in S3 | Critical |
| S3-002 | Upload multiple files | 1. Select 5 files 2. Upload | All files uploaded | High |
| S3-003 | Download file | 1. Click download on stored file | File downloads correctly | High |
| S3-004 | Delete file | 1. Delete evidence file | File removed from S3 | High |
| S3-005 | File type validation | 1. Upload .exe file | Error: "File type not allowed" | Critical |
| S3-006 | File size validation | 1. Upload 100MB file | Error: "File too large" | High |
| S3-007 | Upload progress indicator | 1. Upload large file | Progress bar shown | Medium |

## 22.2 S3 Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| S3-008 | S3 unavailable | 1. S3 service down 2. Upload | Error: "Storage unavailable" | High |
| S3-009 | Concurrent upload same file | 1. Upload same file twice rapidly | Both handled without conflict | Medium |
| S3-010 | File with special name | 1. Upload "file name (1).pdf" | File stored correctly | High |
| S3-011 | Very long filename | 1. Upload 500 char filename | Truncated or error | Medium |
| S3-012 | Empty file | 1. Upload 0 byte file | Error or warning | Medium |

---

# 23. API SECURITY

## 23.1 Authentication & Authorization

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SEC-001 | Request without token | 1. Call protected API without header | 401 Unauthorized | Critical |
| SEC-002 | Request with invalid token | 1. Call API with bad token | 401 Unauthorized | Critical |
| SEC-003 | Request with expired token | 1. Use expired JWT | 401 Unauthorized | Critical |
| SEC-004 | Cross-tenant data access | 1. User A token 2. Request User B's data | 403 Forbidden | Critical |
| SEC-005 | Role-based endpoint access | 1. Viewer calls admin endpoint | 403 Forbidden | Critical |

## 23.2 Input Validation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SEC-006 | SQL injection attempt | 1. Send SQL in parameter | Input sanitized, no DB impact | Critical |
| SEC-007 | XSS in input | 1. Send script tag in field | Script sanitized | Critical |
| SEC-008 | Command injection | 1. Send shell command in field | Command not executed | Critical |
| SEC-009 | Path traversal | 1. Send "../../../etc/passwd" | Path normalized, attack failed | Critical |
| SEC-010 | JSON injection | 1. Malformed JSON payload | 400 Bad Request | High |
| SEC-011 | Parameter pollution | 1. Duplicate query params | Handled consistently | High |
| SEC-012 | Large payload | 1. Send 100MB JSON body | 413 Payload Too Large | High |

## 23.3 Rate Limiting

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SEC-013 | API rate limit exceeded | 1. 1000 requests in 1 minute | 429 Too Many Requests | High |
| SEC-014 | Rate limit per user | 1. User hits individual limit | User limited, others unaffected | High |
| SEC-015 | Rate limit headers | 1. Check response headers | X-RateLimit-* headers present | Medium |

## 23.4 Security Headers

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SEC-016 | CORS configuration | 1. Request from unauthorized origin | Request blocked | Critical |
| SEC-017 | CORS preflight | 1. OPTIONS request | Correct headers returned | High |
| SEC-018 | Helmet security headers | 1. Check response headers | X-Frame-Options, CSP, etc. present | High |
| SEC-019 | HTTPS enforcement | 1. HTTP request | Redirected to HTTPS | Critical |
| SEC-020 | Secure cookie flags | 1. Check session cookie | Secure, HttpOnly, SameSite flags | Critical |

## 23.5 Data Protection

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SEC-021 | PII redaction to AI | 1. Send PII to AI feature | PII redacted before Gemini call | Critical |
| SEC-022 | Password not logged | 1. Auth request 2. Check logs | No passwords in logs | Critical |
| SEC-023 | Token encryption at rest | 1. Check DB for tokens | Tokens encrypted | Critical |
| SEC-024 | Sensitive data masking | 1. View audit log | Sensitive fields masked | High |

---

# 24. PERFORMANCE & LOAD TESTING

## 24.1 Response Time

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PERF-001 | Dashboard load time | 1. Load dashboard 2. Measure | <2 seconds | High |
| PERF-002 | Framework list load | 1. 50 frameworks 2. Load list | <1 second | High |
| PERF-003 | Risk register load | 1. 500 risks 2. Load list | <2 seconds with pagination | High |
| PERF-004 | AI response time | 1. Generate policy 2. Measure | <30 seconds | High |
| PERF-005 | File upload time | 1. Upload 5MB file 2. Measure | <10 seconds | High |
| PERF-006 | Search response time | 1. Complex search 2. Measure | <1 second | High |

## 24.2 Concurrent Users

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PERF-007 | 100 concurrent users | 1. Simulate 100 users 2. All perform actions | No errors, acceptable response | High |
| PERF-008 | 500 concurrent users | 1. Simulate 500 users | System remains responsive | High |
| PERF-009 | 1000 concurrent requests | 1. Burst of 1000 requests | Queue/reject gracefully | Medium |

## 24.3 Database Performance

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PERF-010 | Large organization data | 1. Org with 10K controls 2. Query | Queries return <2 seconds | High |
| PERF-011 | Complex aggregations | 1. Dashboard with 100K records | Aggregations complete <5 seconds | High |
| PERF-012 | Audit log query | 1. 1M audit logs 2. Filter | Paginated results <2 seconds | High |

## 24.4 Memory & CPU

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PERF-013 | Memory under load | 1. 500 users 2. Monitor memory | Memory stable, no leaks | High |
| PERF-014 | CPU under load | 1. Heavy processing 2. Monitor CPU | CPU <80% average | High |
| PERF-015 | Long-running process | 1. 24-hour continuous use | No degradation | Medium |

---

# 25. ACCESSIBILITY TESTING

## 25.1 WCAG 2.1 Compliance

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| A11Y-001 | Keyboard navigation | 1. Tab through all elements | All interactive elements focusable | High |
| A11Y-002 | Screen reader compatibility | 1. Use NVDA/VoiceOver | All content readable | High |
| A11Y-003 | Color contrast | 1. Check text contrast | Minimum 4.5:1 ratio | High |
| A11Y-004 | Focus indicators | 1. Tab through UI | Clear focus visible on all elements | High |
| A11Y-005 | Alt text for images | 1. Inspect images | All images have alt text | High |
| A11Y-006 | Form labels | 1. Inspect forms | All inputs have labels | High |
| A11Y-007 | Error identification | 1. Submit invalid form | Errors clearly identified | High |
| A11Y-008 | Skip to content | 1. Tab at page top | Skip link available | Medium |
| A11Y-009 | Heading structure | 1. Check headings | Proper H1-H6 hierarchy | Medium |
| A11Y-010 | Responsive text sizing | 1. Zoom to 200% | Text remains readable, no overflow | High |

---

# 26. CROSS-BROWSER & RESPONSIVE TESTING

## 26.1 Browser Compatibility

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BROWSER-001 | Chrome latest | 1. Test all features in Chrome | Full functionality | Critical |
| BROWSER-002 | Firefox latest | 1. Test all features in Firefox | Full functionality | High |
| BROWSER-003 | Safari latest | 1. Test all features in Safari | Full functionality | High |
| BROWSER-004 | Edge latest | 1. Test all features in Edge | Full functionality | High |
| BROWSER-005 | Chrome mobile | 1. Test on Chrome Android | Full mobile functionality | High |
| BROWSER-006 | Safari iOS | 1. Test on Safari iOS | Full mobile functionality | High |

## 26.2 Responsive Design

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RESP-001 | Desktop 1920×1080 | 1. View at resolution | Proper layout | High |
| RESP-002 | Laptop 1366×768 | 1. View at resolution | Proper layout | High |
| RESP-003 | Tablet 768×1024 | 1. View at resolution | Tablet-optimized layout | High |
| RESP-004 | Mobile 375×667 | 1. View at resolution | Mobile-optimized layout | High |
| RESP-005 | Mobile 320×568 | 1. View at smallest mobile | Content accessible | Medium |
| RESP-006 | Orientation change | 1. Rotate device | Layout adapts correctly | Medium |

---

# 27. DATABASE & DATA INTEGRITY

## 27.1 Data Consistency

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| DB-001 | Transaction rollback | 1. Partial operation fails | All changes rolled back | Critical |
| DB-002 | Foreign key constraints | 1. Delete parent with children | Cascade or block appropriately | Critical |
| DB-003 | Unique constraints | 1. Create duplicate unique | Error: Constraint violation | High |
| DB-004 | Data type validation | 1. Insert wrong type | Error: Type mismatch | High |
| DB-005 | Null handling | 1. Insert null to non-null | Error: Null violation | High |

## 27.2 Data Migration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| DB-006 | Migration up | 1. Run pending migrations | Schema updated | High |
| DB-007 | Migration down | 1. Rollback migration | Schema reverted | High |
| DB-008 | Data preservation | 1. Migrate with existing data | All data preserved | Critical |

## 27.3 Backup & Recovery

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| DB-009 | Database backup | 1. Trigger backup | Backup created | Critical |
| DB-010 | Backup restore | 1. Restore from backup | Data fully recovered | Critical |
| DB-011 | Point-in-time recovery | 1. Restore to specific time | State recovered | High |

---

# 28. ERROR HANDLING & EDGE CASES

## 28.1 Network Errors

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ERR-001 | Network disconnection | 1. Lose network during operation | Error with retry option | High |
| ERR-002 | Slow network (3G) | 1. Throttle to 3G 2. Perform actions | Operations complete with patience | High |
| ERR-003 | Request timeout | 1. Server slow to respond | Timeout error after threshold | High |
| ERR-004 | Intermittent connectivity | 1. Flaky network 2. Submit form | Retry or clear feedback | High |

## 28.2 Server Errors

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ERR-005 | 500 Internal Server Error | 1. Server throws error | User-friendly error message | High |
| ERR-006 | 502 Bad Gateway | 1. Upstream service fails | "Service temporarily unavailable" | High |
| ERR-007 | 503 Service Unavailable | 1. Server overloaded | "Please try again later" | High |
| ERR-008 | 504 Gateway Timeout | 1. Long-running request times out | Timeout message with guidance | High |

## 28.3 Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ERR-009 | Empty state handling | 1. New user, no data | Helpful empty states with CTAs | High |
| ERR-010 | Maximum length inputs | 1. Enter max length in all fields | Handled or validated | High |
| ERR-011 | Zero/negative numbers | 1. Enter 0 or -1 where invalid | Validation error | High |
| ERR-012 | Future dates | 1. Enter date 100 years ahead | Handled appropriately | Medium |
| ERR-013 | Past dates | 1. Enter date 100 years ago | Handled appropriately | Medium |
| ERR-014 | Leap year dates | 1. Enter Feb 29, 2024 | Valid date accepted | Low |
| ERR-015 | DST transition | 1. Time during DST change | Handled correctly | Low |
| ERR-016 | Unicode input | 1. Enter Chinese/Arabic text | Displayed correctly | Medium |
| ERR-017 | RTL text | 1. Enter Hebrew/Arabic | RTL rendering if supported | Low |
| ERR-018 | Emoji input | 1. Enter emoji in text fields | Stored and displayed correctly | Medium |
| ERR-019 | Copy/paste special chars | 1. Paste curly quotes, em dashes | Handled without corruption | Medium |
| ERR-020 | Double-click submission | 1. Double-click submit button | Single submission only | High |
| ERR-021 | Browser back after submit | 1. Submit form 2. Press back | No duplicate submission | High |
| ERR-022 | Refresh during operation | 1. Refresh during save | Data not corrupted | High |
| ERR-023 | Session expiry during work | 1. Session expires mid-form | Save draft or re-auth gracefully | High |
| ERR-024 | Concurrent edits | 1. Two users edit same item | Conflict resolution or notification | High |
| ERR-025 | Orphaned resources | 1. Delete parent 2. Check children | Cascade delete or error | High |

---

# APPENDIX A: TEST DATA REQUIREMENTS

## User Test Accounts
| Role | Email | Purpose |
|------|-------|---------|
| Admin | admin@testorg.com | Full access testing |
| Editor | editor@testorg.com | Edit permission testing |
| Viewer | viewer@testorg.com | Read-only testing |
| New User | newuser@testorg.com | Registration testing |
| 2FA User | 2fa@testorg.com | 2FA flow testing |

## Framework Test Data
- SOC2 with 50 controls (25 implemented)
- GDPR with 30 controls (all pending)
- HIPAA with 40 controls (fully compliant)
- ISO27001 with 100 controls (mixed status)

## Risk Test Data
- 10 High severity risks
- 20 Medium severity risks
- 30 Low severity risks
- Mix of Open, In Progress, Resolved statuses

## Integration Test Accounts
- Google Workspace test tenant
- GitHub test organization
- Slack test workspace
- Jira test site
- AWS test account with limited resources
- Azure test subscription

## Payment Test Cards (Stripe)
| Card Number | Result |
|-------------|--------|
| 4242424242424242 | Success |
| 4000000000000002 | Decline |
| 4000002500003155 | 3D Secure |
| 4000000000009995 | Insufficient funds |

---

# APPENDIX B: TESTING TOOLS

## Recommended Tools
- **Unit Testing**: Jest, React Testing Library
- **E2E Testing**: Playwright, Cypress
- **API Testing**: Postman, Supertest
- **Performance**: k6, Artillery
- **Security**: OWASP ZAP, Burp Suite
- **Accessibility**: axe, WAVE
- **Browser Testing**: BrowserStack, Sauce Labs

## Test Environment
- **Staging URL**: staging.complyeasyai.com
- **Test Database**: Separate PostgreSQL instance
- **Mock Services**: Stripe test mode, SendGrid sandbox
- **AI Testing**: Gemini with test API key

---

# APPENDIX C: DEFECT SEVERITY LEVELS

| Level | Description | Example |
|-------|-------------|---------|
| Critical | System unusable, data loss, security breach | Auth bypass, data corruption |
| High | Major feature broken, no workaround | Cannot create frameworks |
| Medium | Feature impaired, workaround exists | Filter not working |
| Low | Minor issue, cosmetic | Typo in label |
| Enhancement | Improvement suggestion | UX improvement |

---

# APPENDIX D: TEST EXECUTION CHECKLIST

## Pre-Release Checklist
- [ ] All Critical tests passed
- [ ] All High tests passed
- [ ] 95% Medium tests passed
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Cross-browser verification complete
- [ ] Documentation updated

## Regression Suite (Quick)
- AUTH-001, AUTH-015, AUTH-026
- DASH-001, DASH-002, DASH-005
- FW-001, FW-011, FW-019
- CTRL-001, CTRL-007, CTRL-013
- RISK-001, RISK-010, RISK-020
- AI-001, AI-009, AI-044
- INT-007, INT-013, INT-018
- TEAM-001, TEAM-009, TEAM-012
- BILL-001, BILL-002, BILL-013
- SEC-001, SEC-006, SEC-013

---

**Document Version**: 1.0
**Total Test Cases**: 850+
**Last Updated**: December 23, 2025
**Author**: AI Test Architect

