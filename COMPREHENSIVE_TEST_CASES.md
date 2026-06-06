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

---
---

# ComplyEasy AI - Comprehensive Test Case Documentation (Extended Coverage Plan)

**Version:** 2.0.0  
**Last Updated:** December 2024  
**Status:** Complete Test Coverage Plan

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Dashboard](#2-dashboard)
3. [Frameworks Management](#3-frameworks-management)
4. [Controls & Evidence](#4-controls--evidence)
5. [Integrations](#5-integrations)
6. [Risk Management](#6-risk-management)
7. [My Tasks](#7-my-tasks)
8. [AI Features](#8-ai-features)
9. [Reports](#9-reports)
10. [Audit Trail](#10-audit-trail)
11. [Settings](#11-settings)
12. [Team Management](#12-team-management)
13. [Billing & Subscriptions](#13-billing--subscriptions)
14. [Performance & Load Testing](#14-performance--load-testing)
15. [Security Testing](#15-security-testing)
16. [Edge Cases & Error Handling](#16-edge-cases--error-handling)

---

## 1. Authentication & Authorization

### 1.1 Magic Link Authentication

#### TC-AUTH-001: Magic Link Request
**Priority:** High  
**Preconditions:** User has valid email address  
**Steps:**
1. Navigate to landing page
2. Enter valid email address
3. Click "Get Magic Link" button
4. Check email inbox for magic link

**Expected Results:**
- Success message displayed
- Email sent with magic link
- Magic link contains valid token
- Link expires after 24 hours

**Edge Cases:**
- TC-AUTH-001-EC1: Invalid email format (should show validation error)
- TC-AUTH-001-EC2: Non-existent email domain (should still send, but fail silently)
- TC-AUTH-001-EC3: Email with special characters (should handle correctly)
- TC-AUTH-001-EC4: Multiple requests within 1 minute (rate limiting should apply)
- TC-AUTH-001-EC5: Email service unavailable (should show error message)

#### TC-AUTH-002: Magic Link Validation
**Priority:** High  
**Preconditions:** User has received magic link email  
**Steps:**
1. Click magic link from email
2. Verify token is valid
3. User should be automatically logged in
4. Redirect to dashboard

**Expected Results:**
- Token validated successfully
- User session created
- Redirect to dashboard
- Magic link marked as used
- Cannot reuse same link

**Edge Cases:**
- TC-AUTH-002-EC1: Expired token (should show error and prompt for new link)
- TC-AUTH-002-EC2: Invalid token format (should show error)
- TC-AUTH-002-EC3: Already used token (should show error)
- TC-AUTH-002-EC4: Token from different environment (dev vs prod)
- TC-AUTH-002-EC5: Token tampered with (should reject)

#### TC-AUTH-003: Magic Link Expiration
**Priority:** Medium  
**Preconditions:** Magic link created 24+ hours ago  
**Steps:**
1. Attempt to use expired magic link
2. Verify error message displayed
3. Verify option to request new link

**Expected Results:**
- Error message: "Link has expired"
- Option to request new magic link
- User not logged in

### 1.2 Two-Factor Authentication (2FA)

#### TC-AUTH-004: Enable 2FA
**Priority:** High  
**Preconditions:** User is logged in  
**Steps:**
1. Navigate to Settings > Security
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes

**Expected Results:**
- QR code displayed correctly
- Verification code accepted
- 2FA enabled for account
- Backup codes generated and displayed
- Backup codes saved securely

**Edge Cases:**
- TC-AUTH-004-EC1: Invalid verification code (should reject)
- TC-AUTH-004-EC2: Expired QR code (should regenerate)
- TC-AUTH-004-EC3: Network timeout during setup
- TC-AUTH-004-EC4: Multiple devices scanning same QR code

#### TC-AUTH-005: 2FA Login Flow
**Priority:** High  
**Preconditions:** 2FA enabled on account  
**Steps:**
1. Enter email and request magic link
2. Click magic link
3. Enter 2FA code from authenticator app
4. Verify login successful

**Expected Results:**
- 2FA prompt appears after magic link
- Code validation works correctly
- Login successful with valid code
- Session created

**Edge Cases:**
- TC-AUTH-005-EC1: Invalid 2FA code (should show error, allow retry)
- TC-AUTH-005-EC2: Expired 2FA code (should reject)
- TC-AUTH-005-EC3: Backup code used (should work, but code invalidated)
- TC-AUTH-005-EC4: Rate limiting on failed attempts (lock after 5 failures)

#### TC-AUTH-006: Disable 2FA
**Priority:** Medium  
**Preconditions:** 2FA enabled, user logged in  
**Steps:**
1. Navigate to Settings > Security
2. Click "Disable 2FA"
3. Enter password or 2FA code to confirm
4. Verify 2FA disabled

**Expected Results:**
- Confirmation required
- 2FA disabled successfully
- User can login without 2FA
- Audit log entry created

### 1.3 Role-Based Access Control (RBAC)

#### TC-AUTH-007: Admin Role Permissions
**Priority:** High  
**Preconditions:** User with admin role logged in  
**Steps:**
1. Verify access to all features
2. Verify can manage team members
3. Verify can modify settings
4. Verify can delete frameworks
5. Verify can manage integrations

**Expected Results:**
- Full access to all features
- Can invite/remove team members
- Can modify organization settings
- Can delete any framework
- Can connect/disconnect integrations

#### TC-AUTH-008: Editor Role Permissions
**Priority:** High  
**Preconditions:** User with editor role logged in  
**Steps:**
1. Verify can create/edit frameworks
2. Verify can create/edit controls
3. Verify cannot delete frameworks
4. Verify cannot manage team
5. Verify cannot modify billing

**Expected Results:**
- Can create and edit frameworks
- Can create and edit controls
- Cannot delete frameworks (button hidden/disabled)
- Cannot access team management
- Cannot access billing settings

#### TC-AUTH-009: Viewer Role Permissions
**Priority:** High  
**Preconditions:** User with viewer role logged in  
**Steps:**
1. Verify can view dashboards
2. Verify can view frameworks
3. Verify cannot edit anything
4. Verify cannot create new items
5. Verify read-only access

**Expected Results:**
- Can view all dashboards and reports
- Can view frameworks and controls
- All edit buttons hidden/disabled
- Cannot create frameworks or controls
- Read-only access throughout

**Edge Cases:**
- TC-AUTH-009-EC1: Viewer trying to access API endpoints directly (should return 403)
- TC-AUTH-009-EC2: Role changed mid-session (should require re-login)

### 1.4 Session Management

#### TC-AUTH-010: Session Expiration
**Priority:** High  
**Preconditions:** User logged in  
**Steps:**
1. Wait for session to expire (or manually expire)
2. Attempt to perform action
3. Verify redirect to login

**Expected Results:**
- Session expires after configured time
- User redirected to login page
- Error message: "Session expired"
- Unsaved work preserved if possible

#### TC-AUTH-011: Concurrent Sessions
**Priority:** Medium  
**Preconditions:** User logged in on Device A  
**Steps:**
1. Login on Device B with same account
2. Verify both sessions active
3. Logout from Device A
4. Verify Device B still logged in

**Expected Results:**
- Multiple sessions allowed
- Logout from one device doesn't affect others
- Session management works correctly

**Edge Cases:**
- TC-AUTH-011-EC1: Maximum concurrent sessions limit
- TC-AUTH-011-EC2: Session conflict resolution

---

## 2. Dashboard

### 2.1 Dashboard Loading

#### TC-DASH-001: Dashboard Initial Load
**Priority:** High  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to dashboard
2. Verify all widgets load
3. Verify data displays correctly
4. Verify loading states

**Expected Results:**
- Dashboard loads within 2 seconds
- All KPI cards display
- Compliance score calculated correctly
- Charts render properly
- No errors in console

**Edge Cases:**
- TC-DASH-001-EC1: No frameworks exist (should show 0% score)
- TC-DASH-001-EC2: No risks exist (should show 0 critical risks)
- TC-DASH-001-EC3: Network timeout (should show error state)
- TC-DASH-001-EC4: Partial data load (should handle gracefully)

### 2.2 Compliance Score Calculation

#### TC-DASH-002: Compliance Score with Controls
**Priority:** High  
**Preconditions:** Frameworks with controls exist  
**Steps:**
1. Create framework with 5 controls
2. Set 3 controls to "Implemented"
3. Set 2 controls to "Pending"
4. Verify compliance score = 60%

**Expected Results:**
- Score calculated as: (Implemented / Total) * 100
- Score updates in real-time
- Score displayed on dashboard
- Score updates when controls change

**Edge Cases:**
- TC-DASH-002-EC1: Zero controls (should show 0% or N/A)
- TC-DASH-002-EC2: All controls implemented (should show 100%)
- TC-DASH-002-EC3: Mixed statuses (Implemented, Compliant, Pending)
- TC-DASH-002-EC4: Controls deleted (score recalculates)
- TC-DASH-002-EC5: Multiple frameworks (average calculated correctly)

#### TC-DASH-003: Compliance Score Trend
**Priority:** Medium  
**Preconditions:** Historical data exists  
**Steps:**
1. View compliance trend chart
2. Verify data points display
3. Verify trend line renders
4. Verify tooltip on hover

**Expected Results:**
- Chart displays last 6 months
- Data points accurate
- Trend line smooth
- Tooltip shows exact values

### 2.3 Critical Risks Widget

#### TC-DASH-004: Critical Risks Display
**Priority:** High  
**Preconditions:** Risks exist in system  
**Steps:**
1. View critical risks widget
2. Verify count matches actual risks
3. Click on risk
4. Verify navigation to risk details

**Expected Results:**
- Count accurate (High severity, not Resolved)
- Risks clickable
- Navigation works
- Widget updates in real-time

**Edge Cases:**
- TC-DASH-004-EC1: No critical risks (should show 0 with message)
- TC-DASH-004-EC2: 100+ critical risks (should show count, paginate)
- TC-DASH-004-EC3: Risk status changes (widget updates)

### 2.4 Active Frameworks Widget

#### TC-DASH-005: Active Frameworks Display
**Priority:** High  
**Preconditions:** Frameworks exist  
**Steps:**
1. View active frameworks widget
2. Verify count matches
3. Verify framework names display
4. Click to navigate to frameworks page

**Expected Results:**
- Count accurate
- Framework names truncated if long
- Click navigates correctly
- Widget updates when frameworks added/removed

**Edge Cases:**
- TC-DASH-005-EC1: No frameworks (should show 0)
- TC-DASH-005-EC2: 20+ frameworks (should truncate list)
- TC-DASH-005-EC3: Framework deleted (widget updates)

### 2.5 Upcoming Audit Widget

#### TC-DASH-006: Upcoming Audit Display
**Priority:** Medium  
**Preconditions:** Frameworks with audit dates exist  
**Steps:**
1. View upcoming audit widget
2. Verify nearest audit date displayed
3. Verify days until audit calculated
4. Verify framework name shown

**Expected Results:**
- Nearest audit date found correctly
- Days calculated accurately
- Framework name displayed
- Updates when audit dates change

**Edge Cases:**
- TC-DASH-006-EC1: No upcoming audits (should show "No audits pending")
- TC-DASH-006-EC2: Audit date in past (should show negative days or "Overdue")
- TC-DASH-006-EC3: Multiple audits same day (should show first one)

### 2.6 Priority Actions Widget

#### TC-DASH-007: Priority Actions Display
**Priority:** Medium  
**Preconditions:** Open risks exist  
**Steps:**
1. View priority actions widget
2. Verify top 3 risks displayed
3. Verify risk details shown
4. Click to navigate to risk

**Expected Results:**
- Top 3 open/in-progress risks shown
- Risk severity badges display
- Risk description truncated if long
- Click navigates to risk management

**Edge Cases:**
- TC-DASH-007-EC1: No open risks (should show empty state)
- TC-DASH-007-EC2: Less than 3 risks (should show all)
- TC-DASH-007-EC3: Risk resolved (removed from widget)

---

## 3. Frameworks Management

### 3.1 Framework List View

#### TC-FW-001: View Active Frameworks
**Priority:** High  
**Preconditions:** User logged in, frameworks exist  
**Steps:**
1. Navigate to Frameworks page
2. Verify all frameworks display
3. Verify framework cards show:
   - Framework name
   - Region tag
   - Status indicator
   - Readiness percentage
   - Progress bar
   - Audit due date
   - Manage button

**Expected Results:**
- All frameworks displayed in grid
- Cards formatted correctly
- Status icons match status
- Progress bars accurate
- Manage button functional

**Edge Cases:**
- TC-FW-001-EC1: No frameworks (should show empty state with "Add Framework")
- TC-FW-001-EC2: 50+ frameworks (should paginate or scroll)
- TC-FW-001-EC3: Framework with very long name (should truncate)
- TC-FW-001-EC4: Framework with no region (should not show region tag)

#### TC-FW-002: Add Framework
**Priority:** High  
**Preconditions:** User logged in with editor/admin role  
**Steps:**
1. Click "Add Framework" button
2. Search for framework (e.g., "NIST")
3. Select framework from catalog
4. Verify framework added
5. Verify appears in list

**Expected Results:**
- Modal opens with framework catalog
- Search filters correctly
- Framework added successfully
- Appears in active frameworks list
- Default status: "In Review"
- Default progress: 0%

**Edge Cases:**
- TC-FW-002-EC1: Duplicate framework (should prevent or warn)
- TC-FW-002-EC2: Invalid framework name (should validate)
- TC-FW-002-EC3: Network error during add (should show error, retry)
- TC-FW-002-EC4: Viewer role (should not show Add button)

#### TC-FW-003: Search Frameworks
**Priority:** Medium  
**Preconditions:** Framework catalog modal open  
**Steps:**
1. Enter search term in search box
2. Verify results filter
3. Clear search
4. Verify all frameworks show

**Expected Results:**
- Search filters in real-time
- Results match search term
- Case-insensitive search
- Search by name or description
- Clear button resets

**Edge Cases:**
- TC-FW-003-EC1: No results (should show "No matching frameworks")
- TC-FW-003-EC2: Special characters in search (should handle safely)
- TC-FW-003-EC3: Very long search term

### 3.2 Framework Details

#### TC-FW-004: View Framework Details
**Priority:** High  
**Preconditions:** Framework exists  
**Steps:**
1. Click "Manage" on framework card
2. Verify framework details page loads
3. Verify displays:
   - Framework name
   - Status badge
   - Next audit date
   - Readiness score
   - Progress bar
   - Controls list

**Expected Results:**
- Page loads correctly
- All information displayed
- Readiness score calculated from controls
- Controls list shows all controls
- Back button functional

**Edge Cases:**
- TC-FW-004-EC1: Framework with no controls (should show empty state)
- TC-FW-004-EC2: Framework deleted while viewing (should handle gracefully)
- TC-FW-004-EC3: Very long framework name (should wrap/truncate)

#### TC-FW-005: Update Framework Status
**Priority:** Medium  
**Preconditions:** Framework exists, user has edit permissions  
**Steps:**
1. Navigate to framework details
2. Update framework status
3. Verify status updates
4. Verify progress recalculates

**Expected Results:**
- Status updates successfully
- UI reflects new status
- Progress bar updates
- Audit log entry created

**Edge Cases:**
- TC-FW-005-EC1: Invalid status value (should reject)
- TC-FW-005-EC2: Concurrent updates (should handle conflict)

### 3.3 Framework Progress Calculation

#### TC-FW-006: Progress Calculation
**Priority:** High  
**Preconditions:** Framework with controls exists  
**Steps:**
1. Create framework with 10 controls
2. Set 5 to "Implemented"
3. Set 3 to "In Progress"
4. Set 2 to "Pending"
5. Verify progress = 50%

**Expected Results:**
- Progress = (Implemented + Compliant) / Total * 100
- Updates automatically when controls change
- Displayed on framework card and details page

**Edge Cases:**
- TC-FW-006-EC1: All controls pending (should show 0%)
- TC-FW-006-EC2: All controls implemented (should show 100%)
- TC-FW-006-EC3: Controls deleted (should recalculate)
- TC-FW-006-EC4: Control status changed (should update immediately)

---

## 4. Controls & Evidence

### 4.1 Control Creation

#### TC-CTRL-001: Create New Control
**Priority:** High  
**Preconditions:** Framework exists, user has edit permissions  
**Steps:**
1. Navigate to Framework Details
2. Click "Add Control" button
3. Fill in control name (required)
4. Fill in description (optional)
5. Select status (default: Pending)
6. Click "Create"

**Expected Results:**
- Control created successfully
- Appears in controls list
- Framework progress updates
- Readiness score recalculates
- Form resets after creation

**Edge Cases:**
- TC-CTRL-001-EC1: Empty control name (should show validation error)
- TC-CTRL-001-EC2: Very long control name (should accept, truncate in UI)
- TC-CTRL-001-EC3: Duplicate control name (should allow or warn)
- TC-CTRL-001-EC4: Network error (should show error, preserve form data)
- TC-CTRL-001-EC5: Viewer role (should not show Add Control button)

#### TC-CTRL-002: Create Control with All Fields
**Priority:** Medium  
**Preconditions:** Framework exists  
**Steps:**
1. Click "Add Control"
2. Enter name: "Access Control Policy"
3. Enter description: "Detailed description of access control"
4. Select status: "In Progress"
5. Create control

**Expected Results:**
- All fields saved correctly
- Control displays with all information
- Status badge shows "In Progress"

### 4.2 Control Status Updates

#### TC-CTRL-003: Update Control Status via Click
**Priority:** High  
**Preconditions:** Control with status "Pending" or "In Progress" exists  
**Steps:**
1. Navigate to Framework Details
2. Click on control with "Pending" status
3. Confirm status update in dialog
4. Verify status changes to "In Progress"
5. Verify framework progress updates

**Expected Results:**
- Click highlights control row
- Confirmation dialog appears
- Status updates to next in sequence
- Progress bar updates
- Readiness score recalculates
- Parent component refreshes

**Edge Cases:**
- TC-CTRL-003-EC1: Click on "Implemented" control (should not trigger update)
- TC-CTRL-003-EC2: Cancel confirmation (should not update)
- TC-CTRL-003-EC3: Multiple rapid clicks (should handle gracefully)
- TC-CTRL-003-EC4: Status update fails (should show error, revert)

#### TC-CTRL-004: Status Progression
**Priority:** High  
**Preconditions:** Control exists  
**Steps:**
1. Create control with "Pending" status
2. Click to update → "In Progress"
3. Click to update → "Implemented"
4. Click to update → "Compliant"
5. Verify cannot update from "Compliant"

**Expected Results:**
- Status progresses: Pending → In Progress → Implemented → Compliant
- "Compliant" controls not clickable for status update
- Each update triggers progress recalculation

**Edge Cases:**
- TC-CTRL-004-EC1: Status "At Risk" (should be clickable or not?)
- TC-CTRL-004-EC2: Manual status change via API (should work)

### 4.3 Evidence Upload

#### TC-CTRL-005: Upload Evidence to Control
**Priority:** High  
**Preconditions:** Control exists, user has edit permissions  
**Steps:**
1. Navigate to Framework Details
2. Click upload icon on control
3. Select file (PDF, DOC, etc.)
4. Verify upload progress
5. Verify file linked to control

**Expected Results:**
- File uploads successfully
- Evidence URL saved to control
- File name displays in control row
- File clickable to download/view
- Framework progress may update

**Edge Cases:**
- TC-CTRL-005-EC1: File too large (>10MB) (should reject with error)
- TC-CTRL-005-EC2: Invalid file type (should reject)
- TC-CTRL-005-EC3: Network timeout (should show error, allow retry)
- TC-CTRL-005-EC4: Upload same file twice (should replace or create new)
- TC-CTRL-005-EC5: Upload while offline (should queue or show error)

#### TC-CTRL-006: Upload Multiple Evidence Files
**Priority:** Medium  
**Preconditions:** Control exists  
**Steps:**
1. Upload first evidence file
2. Upload second evidence file to same control
3. Verify both files accessible
4. Verify control shows latest file

**Expected Results:**
- Multiple uploads handled correctly
- Latest file displayed
- Previous files accessible
- No conflicts

**Edge Cases:**
- TC-CTRL-006-EC1: Simultaneous uploads (should handle queue)
- TC-CTRL-006-EC2: Same filename (should rename or overwrite)

### 4.4 Smart Upload

#### TC-CTRL-007: Smart Upload with AI Classification
**Priority:** High  
**Preconditions:** Framework exists, user has edit permissions  
**Steps:**
1. Navigate to Framework Details
2. Click "Smart Upload" button
3. Select file (e.g., "access_control_policy.pdf")
4. Wait for AI analysis
5. Verify file classified
6. Verify control created or mapped

**Expected Results:**
- File uploads successfully
- AI analyzes filename
- Classification result displayed
- Control created or existing control updated
- Evidence linked to control
- Toast notification shows result

**Edge Cases:**
- TC-CTRL-007-EC1: AI classification fails (should still upload, manual mapping)
- TC-CTRL-007-EC2: Ambiguous filename (should classify best match)
- TC-CTRL-007-EC3: File with no clear control match (should create new control)
- TC-CTRL-007-EC4: Gemini API quota exceeded (should show error, allow manual upload)
- TC-CTRL-007-EC5: Very long filename (should handle correctly)

#### TC-CTRL-008: Smart Upload File Types
**Priority:** Medium  
**Preconditions:** Framework exists  
**Steps:**
1. Test upload with PDF
2. Test upload with DOCX
3. Test upload with XLSX
4. Test upload with image (PNG)
5. Test upload with JSON

**Expected Results:**
- All supported types accepted
- Invalid types rejected
- Appropriate error messages

**Edge Cases:**
- TC-CTRL-008-EC1: Corrupted file (should detect and reject)
- TC-CTRL-008-EC2: File with wrong extension (should validate MIME type)

### 4.5 Control Export

#### TC-CTRL-009: Export Control Report
**Priority:** Medium  
**Preconditions:** Control exists  
**Steps:**
1. Navigate to Framework Details
2. Click download icon on control
3. Verify JSON file downloads
4. Verify file contains:
   - Framework information
   - Control details
   - Evidence information
   - Metadata (export date, user)

**Expected Results:**
- File downloads successfully
- Filename: "{Control_Name}_Report_{Date}.json"
- JSON format valid
- All data included
- Audit log entry created

**Edge Cases:**
- TC-CTRL-009-EC1: Control with no evidence (should still export)
- TC-CTRL-009-EC2: Control deleted during export (should handle gracefully)
- TC-CTRL-009-EC3: Very long control name (filename should truncate)

### 4.6 Control List Management

#### TC-CTRL-010: Control List Display
**Priority:** High  
**Preconditions:** Framework with controls exists  
**Steps:**
1. View controls list
2. Verify all controls display
3. Verify status icons correct
4. Verify evidence links work
5. Verify export buttons functional

**Expected Results:**
- All controls listed
- Status icons match status
- Evidence clickable if exists
- Export buttons work
- Upload buttons work

**Edge Cases:**
- TC-CTRL-010-EC1: 100+ controls (should paginate or virtualize)
- TC-CTRL-010-EC2: Control with very long description (should truncate)
- TC-CTRL-010-EC3: Control with no description (should not show description line)

---

## 5. Integrations

### 5.1 Integration Catalog

#### TC-INT-001: View Integration Catalog
**Priority:** High  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Integrations page
2. Verify all integrations display
3. Verify search functionality
4. Verify category filters
5. Verify connection status

**Expected Results:**
- All 50+ integrations displayed
- Search filters correctly
- Category filters work
- Connection status accurate
- Integration cards formatted correctly

**Edge Cases:**
- TC-INT-001-EC1: No integrations connected (all show disconnected)
- TC-INT-001-EC2: Search with no results (should show empty state)
- TC-INT-001-EC3: Multiple category filters (should work correctly)

#### TC-INT-002: Search Integrations
**Priority:** Medium  
**Preconditions:** Integrations page open  
**Steps:**
1. Enter search term "AWS"
2. Verify AWS integration appears
3. Clear search
4. Verify all integrations show

**Expected Results:**
- Search filters in real-time
- Case-insensitive
- Searches name and category
- Clear button resets

**Edge Cases:**
- TC-INT-002-EC1: Partial match (e.g., "Git" should show GitHub, GitLab)
- TC-INT-002-EC2: Special characters (should handle safely)

### 5.2 OAuth Integrations

#### TC-INT-003: Connect Google Workspace (OAuth)
**Priority:** High  
**Preconditions:** User logged in, Google OAuth configured  
**Steps:**
1. Click on Google Workspace integration
2. Click "Connect" in modal
3. Verify OAuth popup opens
4. Complete OAuth flow
5. Verify connection successful

**Expected Results:**
- Modal opens with OAuth option
- Popup opens to Google OAuth
- User authorizes
- Callback handled correctly
- Integration marked as connected
- Last sync timestamp updated

**Edge Cases:**
- TC-INT-003-EC1: User cancels OAuth (should show disconnected)
- TC-INT-003-EC2: OAuth callback fails (should show error)
- TC-INT-003-EC3: Popup blocked (should show error message)
- TC-INT-003-EC4: OAuth token expired (should prompt re-auth)
- TC-INT-003-EC5: Multiple OAuth attempts (should handle gracefully)

#### TC-INT-004: Connect GitHub (OAuth)
**Priority:** High  
**Preconditions:** User logged in, GitHub OAuth configured  
**Steps:**
1. Click on GitHub integration
2. Click "Connect" in modal
3. Complete GitHub OAuth flow
4. Verify connection successful
5. Verify can sync repositories

**Expected Results:**
- OAuth flow completes
- Integration connected
- Can access GitHub API
- Sync functionality works

**Edge Cases:**
- TC-INT-004-EC1: Insufficient OAuth scopes (should request additional)
- TC-INT-004-EC2: Organization OAuth (should handle correctly)

#### TC-INT-005: Connect Slack (OAuth)
**Priority:** High  
**Preconditions:** User logged in, Slack OAuth configured  
**Steps:**
1. Click on Slack integration
2. Complete OAuth flow
3. Verify connection successful
4. Verify can send notifications

**Expected Results:**
- OAuth completes
- Integration connected
- Can send Slack messages
- Notifications work

#### TC-INT-006: Connect Jira (OAuth)
**Priority:** High  
**Preconditions:** User logged in, Jira OAuth configured  
**Steps:**
1. Click on Jira integration
2. Complete OAuth flow
3. Verify connection successful
4. Verify can create issues

**Expected Results:**
- OAuth completes
- Integration connected
- Can sync Jira issues
- Can create issues from app

### 5.3 API Key Integrations

#### TC-INT-007: Connect Datadog (API Key + Secret)
**Priority:** High  
**Preconditions:** User logged in  
**Steps:**
1. Click on Datadog integration
2. Enter API Key
3. Enter API Secret
4. Enter Base URL (optional)
5. Click "Connect"

**Expected Results:**
- Credentials saved securely
- Integration connected
- Can access Datadog API
- Connection status updated

**Edge Cases:**
- TC-INT-007-EC1: Invalid API key (should validate and reject)
- TC-INT-007-EC2: Missing required fields (should show validation)
- TC-INT-007-EC3: API key format incorrect (should validate)
- TC-INT-007-EC4: Network error during validation (should handle)

#### TC-INT-008: Connect New Relic (API Key + Secret)
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Click on New Relic integration
2. Enter API Key and Secret
3. Connect
4. Verify connection

**Expected Results:**
- Connection successful
- Can fetch metrics
- Sync works

#### TC-INT-009: Connect Sentry (API Key + Secret)
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Click on Sentry integration
2. Enter credentials
3. Connect
4. Verify error tracking works

**Expected Results:**
- Connection successful
- Can fetch errors
- Alerts work

### 5.4 IAM Credentials Integrations

#### TC-INT-010: Connect AWS (IAM Credentials)
**Priority:** High  
**Preconditions:** User logged in  
**Steps:**
1. Click on AWS integration
2. Enter Access Key ID
3. Enter Secret Access Key
4. Enter Region
5. Click "Connect"

**Expected Results:**
- Credentials validated
- AWS connection successful
- Can scan AWS resources
- Compliance checks work

**Edge Cases:**
- TC-INT-010-EC1: Invalid credentials (should reject with error)
- TC-INT-010-EC2: Insufficient IAM permissions (should show error)
- TC-INT-010-EC3: Wrong region (should validate or allow)
- TC-INT-010-EC4: Credentials expired (should prompt update)

#### TC-INT-011: Connect Azure (IAM Credentials)
**Priority:** High  
**Preconditions:** User logged in  
**Steps:**
1. Click on Azure integration
2. Enter Tenant ID
3. Enter Client ID
4. Enter Client Secret
5. Enter Subscription ID
6. Connect

**Expected Results:**
- All fields required
- Connection successful
- Can access Azure resources
- Compliance scanning works

**Edge Cases:**
- TC-INT-011-EC1: Missing any required field (should validate)
- TC-INT-011-EC2: Invalid tenant ID format (should validate)

#### TC-INT-012: Connect GCP (Service Account JSON)
**Priority:** High  
**Preconditions:** User logged in  
**Steps:**
1. Click on Google Cloud Platform integration
2. Paste service account JSON
3. Verify JSON valid
4. Connect

**Expected Results:**
- JSON validated
- Connection successful
- Can access GCP resources

**Edge Cases:**
- TC-INT-012-EC1: Invalid JSON (should show error)
- TC-INT-012-EC2: Missing required fields in JSON (should validate)
- TC-INT-012-EC3: Expired service account (should show error)

### 5.5 Personal Access Token Integrations

#### TC-INT-013: Connect GitLab (PAT)
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Click on GitLab integration
2. Enter instance URL (optional)
3. Enter Personal Access Token
4. Connect

**Expected Results:**
- Connection successful
- Can access GitLab API
- Repository scanning works

**Edge Cases:**
- TC-INT-013-EC1: Invalid token (should reject)
- TC-INT-013-EC2: Token with insufficient scopes (should show error)
- TC-INT-013-EC3: Self-hosted GitLab instance (should work with custom URL)

#### TC-INT-014: Connect Bitbucket (PAT)
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Click on Bitbucket integration
2. Enter PAT
3. Connect
4. Verify connection

**Expected Results:**
- Connection successful
- Can access repositories

### 5.6 Username/Password Integrations

#### TC-INT-015: Connect Jenkins (Username/Password)
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Click on Jenkins integration
2. Enter Base URL
3. Enter Username
4. Enter Password/API Token
5. Enter API Token (optional)
6. Connect

**Expected Results:**
- Connection successful
- Can access Jenkins API
- Build status monitoring works

**Edge Cases:**
- TC-INT-015-EC1: Invalid credentials (should reject)
- TC-INT-015-EC2: Jenkins instance unreachable (should show error)
- TC-INT-015-EC3: Self-signed certificate (should handle or warn)

#### TC-INT-016: Connect Splunk (Username/Password)
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Click on Splunk integration
2. Enter Base URL
3. Enter Username
4. Enter Password
5. Connect

**Expected Results:**
- Connection successful
- Can query Splunk
- Log analysis works

### 5.7 Integration Disconnection

#### TC-INT-017: Disconnect Integration
**Priority:** High  
**Preconditions:** Integration connected  
**Steps:**
1. Navigate to integration
2. Click disconnect button
3. Confirm disconnection
4. Verify integration disconnected

**Expected Results:**
- Confirmation dialog appears
- Integration disconnected
- Credentials removed
- Status updated to disconnected
- Last sync cleared

**Edge Cases:**
- TC-INT-017-EC1: Cancel disconnection (should not disconnect)
- TC-INT-017-EC2: Disconnect while sync in progress (should cancel sync)
- TC-INT-017-EC3: Disconnect from Settings page (should work)

### 5.8 Integration Sync

#### TC-INT-018: Manual Sync Integration
**Priority:** Medium  
**Preconditions:** Integration connected  
**Steps:**
1. Navigate to integration
2. Click "Sync" button
3. Verify sync starts
4. Verify sync completes
5. Verify last sync timestamp updates

**Expected Results:**
- Sync initiates
- Progress indicator shows
- Sync completes successfully
- Data updated
- Last sync timestamp updated

**Edge Cases:**
- TC-INT-018-EC1: Sync fails (should show error, allow retry)
- TC-INT-018-EC2: Sync timeout (should handle gracefully)
- TC-INT-018-EC3: Concurrent syncs (should queue or prevent)

### 5.9 Integration Status

#### TC-INT-019: Integration Status Display
**Priority:** Medium  
**Preconditions:** Multiple integrations with different statuses  
**Steps:**
1. View integrations page
2. Verify connection status accurate
3. Verify last sync timestamps
4. Verify status indicators

**Expected Results:**
- Connected integrations show green
- Disconnected show gray
- Last sync accurate
- Status icons correct

**Edge Cases:**
- TC-INT-019-EC1: Integration connection lost (should update status)
- TC-INT-019-EC2: Never synced (should show "Never")

---

## 6. Risk Management

### 6.1 Risk List View

#### TC-RISK-001: View Risk Registry
**Priority:** High  
**Preconditions:** User logged in, risks exist  
**Steps:**
1. Navigate to Risk Management page
2. Verify all risks display
3. Verify filters work
4. Verify sorting works
5. Verify search works

**Expected Results:**
- All risks listed
- Filters apply correctly
- Sorting works (severity, date, status)
- Search filters risks
- Risk cards formatted correctly

**Edge Cases:**
- TC-RISK-001-EC1: No risks (should show empty state)
- TC-RISK-001-EC2: 100+ risks (should paginate)
- TC-RISK-001-EC3: Filter with no results (should show message)

#### TC-RISK-002: Risk Filters
**Priority:** High  
**Preconditions:** Risks with different severities and statuses exist  
**Steps:**
1. Filter by severity: High
2. Verify only high severity risks show
3. Filter by status: Open
4. Verify only open risks show
5. Combine filters
6. Verify combined results

**Expected Results:**
- Filters work independently
- Combined filters work correctly
- Results update in real-time
- Filter state persists

**Edge Cases:**
- TC-RISK-002-EC1: Filter with no matches (should show empty state)
- TC-RISK-002-EC2: Clear all filters (should show all risks)

### 6.2 Risk Creation

#### TC-RISK-003: Create New Risk
**Priority:** High  
**Preconditions:** User with editor/admin role  
**Steps:**
1. Click "Add Risk" button
2. Fill in risk details:
   - Description (required)
   - Category (required)
   - Severity (required)
   - Assigned To (optional)
3. Save risk

**Expected Results:**
- Risk created successfully
- Appears in risk list
- Default status: "Open"
- AI priority score calculated
- Audit log entry created

**Edge Cases:**
- TC-RISK-003-EC1: Missing required fields (should validate)
- TC-RISK-003-EC2: Very long description (should accept)
- TC-RISK-003-EC3: Invalid severity (should validate)
- TC-RISK-003-EC4: Viewer role (should not show Add button)

### 6.3 Risk Updates

#### TC-RISK-004: Update Risk Status
**Priority:** High  
**Preconditions:** Risk exists  
**Steps:**
1. Open risk details
2. Change status (e.g., Open → In Progress)
3. Save
4. Verify status updates

**Expected Results:**
- Status updates successfully
- UI reflects new status
- Status badge updates
- Audit log entry created

**Edge Cases:**
- TC-RISK-004-EC1: Invalid status transition (should validate)
- TC-RISK-004-EC2: Concurrent updates (should handle conflict)

#### TC-RISK-005: Assign Risk
**Priority:** Medium  
**Preconditions:** Risk exists, team members exist  
**Steps:**
1. Open risk details
2. Select team member from dropdown
3. Assign risk
4. Verify assignment

**Expected Results:**
- Risk assigned successfully
- Assigned user shown in risk card
- Appears in user's "My Tasks"
- Notification sent (if enabled)

**Edge Cases:**
- TC-RISK-005-EC1: Assign to non-existent user (should validate)
- TC-RISK-005-EC2: Reassign to different user (should update)

#### TC-RISK-006: Add Mitigation Plan
**Priority:** High  
**Preconditions:** Risk exists  
**Steps:**
1. Open risk details
2. Enter mitigation plan
3. Save
4. Verify plan saved

**Expected Results:**
- Mitigation plan saved
- Displays in risk details
- Can be edited
- Exported in reports

**Edge Cases:**
- TC-RISK-006-EC1: Very long mitigation plan (should accept)
- TC-RISK-006-EC2: Special characters (should handle correctly)

### 6.4 Risk AI Features

#### TC-RISK-007: AI Priority Scoring
**Priority:** Medium  
**Preconditions:** Risk created  
**Steps:**
1. Create risk
2. Verify AI priority score calculated
3. Verify AI rationale displayed
4. Verify score updates when risk changes

**Expected Results:**
- Score calculated (0-100)
- Rationale explains score
- Score updates automatically
- Score influences risk ordering

**Edge Cases:**
- TC-RISK-007-EC1: AI service unavailable (should show default score)
- TC-RISK-007-EC2: Invalid risk data (should handle gracefully)

### 6.5 Risk Resolution

#### TC-RISK-008: Resolve Risk
**Priority:** High  
**Preconditions:** Risk exists  
**Steps:**
1. Open risk details
2. Change status to "Resolved"
3. Add resolution notes
4. Save
5. Verify risk resolved

**Expected Results:**
- Status changes to "Resolved"
- Resolution notes saved
- Risk removed from active list
- Appears in resolved filter
- Audit log entry created

**Edge Cases:**
- TC-RISK-008-EC1: Resolve without notes (should allow or require)
- TC-RISK-008-EC2: Reopen resolved risk (should allow)

---

## 7. My Tasks

### 7.1 Task List

#### TC-TASK-001: View My Tasks
**Priority:** High  
**Preconditions:** User logged in, tasks assigned to user  
**Steps:**
1. Navigate to "My Tasks"
2. Verify only user's tasks display
3. Verify task details shown
4. Verify status indicators

**Expected Results:**
- Only assigned tasks shown
- Tasks formatted correctly
- Status badges accurate
- Can filter by status

**Edge Cases:**
- TC-TASK-001-EC1: No tasks assigned (should show empty state)
- TC-TASK-001-EC2: Tasks from multiple frameworks (should all show)
- TC-TASK-001-EC3: Task unassigned (should remove from list)

#### TC-TASK-002: Update Task Status
**Priority:** High  
**Preconditions:** Task assigned to user  
**Steps:**
1. Open task from My Tasks
2. Change status
3. Update mitigation plan
4. Save
5. Verify updates

**Expected Results:**
- Status updates successfully
- Mitigation plan saved
- Changes reflected immediately
- Audit log entry created

**Edge Cases:**
- TC-TASK-002-EC1: Invalid status (should validate)
- TC-TASK-002-EC2: Concurrent updates (should handle)

### 7.2 Task Filtering

#### TC-TASK-003: Filter Tasks by Status
**Priority:** Medium  
**Preconditions:** Tasks with different statuses exist  
**Steps:**
1. Filter by "Open"
2. Verify only open tasks show
3. Filter by "In Progress"
4. Verify only in-progress tasks show

**Expected Results:**
- Filters work correctly
- Results update immediately
- Multiple filters can combine

---

## 8. AI Features

### 8.1 Compliance Chatbot

#### TC-AI-001: Chat with Compliance Bot
**Priority:** High  
**Preconditions:** User logged in, Gemini API configured  
**Steps:**
1. Open chatbot
2. Send message: "What is SOC 2?"
3. Verify AI response
4. Continue conversation
5. Verify context maintained

**Expected Results:**
- Response received within 5 seconds
- Response relevant and accurate
- Conversation history maintained
- Can ask follow-up questions

**Edge Cases:**
- TC-AI-001-EC1: Gemini API quota exceeded (should show error message)
- TC-AI-001-EC2: Network timeout (should show error, allow retry)
- TC-AI-001-EC3: Invalid question (should handle gracefully)
- TC-AI-001-EC4: Very long conversation (should maintain context)
- TC-AI-001-EC5: Empty message (should validate)

#### TC-AI-002: Chatbot Error Handling
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Send message with API down
2. Verify error message displayed
3. Verify retry option
4. Verify user-friendly message

**Expected Results:**
- Error message clear and actionable
- Suggests checking API key or quota
- Allows retry
- Doesn't expose technical details

### 8.2 AI Report Generator

#### TC-AI-003: Generate Compliance Report
**Priority:** High  
**Preconditions:** User logged in, frameworks exist  
**Steps:**
1. Navigate to Report Generator
2. Select framework
3. Enter company name
4. Enter context
5. Generate report

**Expected Results:**
- Report generated successfully
- Report formatted correctly
- Includes compliance status
- Includes recommendations
- Can download/export

**Edge Cases:**
- TC-AI-003-EC1: No frameworks selected (should validate)
- TC-AI-003-EC2: AI service unavailable (should show error)
- TC-AI-003-EC3: Very long context (should handle)
- TC-AI-003-EC4: Report generation timeout (should handle)

### 8.3 Policy Generator

#### TC-AI-004: Generate Policy
**Priority:** High  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Policy Generator
2. Select policy type
3. Enter company information
4. Select tone
5. Generate policy

**Expected Results:**
- Policy generated successfully
- Policy formatted correctly
- Can edit generated policy
- Can save policy
- Can export policy

**Edge Cases:**
- TC-AI-004-EC1: Invalid policy type (should validate)
- TC-AI-004-EC2: Missing company info (should validate)
- TC-AI-004-EC3: AI generation fails (should show error)

### 8.4 Contract Analyzer

#### TC-AI-005: Analyze Contract
**Priority:** High  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Contract Analyzer
2. Upload contract file
3. Analyze contract
4. Review findings
5. Export report

**Expected Results:**
- Contract uploaded successfully
- Analysis completes
- Findings displayed
- Risk areas highlighted
- Recommendations provided
- Report exportable

**Edge Cases:**
- TC-AI-005-EC1: Invalid file type (should reject)
- TC-AI-005-EC2: Very large contract (should handle)
- TC-AI-005-EC3: Corrupted file (should detect)
- TC-AI-005-EC4: AI analysis fails (should show error)

### 8.5 Gap Analysis

#### TC-AI-006: Perform Gap Analysis
**Priority:** High  
**Preconditions:** User logged in, frameworks exist  
**Steps:**
1. Navigate to Gap Analysis
2. Select current frameworks
3. Select target framework
4. Run analysis
5. Review gaps

**Expected Results:**
- Analysis completes successfully
- Gaps identified
- Recommendations provided
- Action items listed
- Report exportable

**Edge Cases:**
- TC-AI-006-EC1: No current frameworks (should validate)
- TC-AI-006-EC2: Same framework selected (should handle)
- TC-AI-006-EC3: Analysis timeout (should handle)

### 8.6 RFP Responder

#### TC-AI-007: Generate RFP Response
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to RFP Responder
2. Enter RFP question
3. Enter company context
4. Generate response
5. Review and edit response

**Expected Results:**
- Response generated
- Response professional
- Response compliant
- Can edit response
- Can export response

**Edge Cases:**
- TC-AI-007-EC1: Empty question (should validate)
- TC-AI-007-EC2: Very long question (should handle)
- TC-AI-007-EC3: Multiple questions (should handle)

### 8.7 Phishing Generator

#### TC-AI-008: Generate Phishing Simulation
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Phishing Generator
2. Select department
3. Select theme
4. Generate email
5. Review email

**Expected Results:**
- Email generated
- Email realistic
- Includes subject and body
- Can send test email
- Can export email

**Edge Cases:**
- TC-AI-008-EC1: Invalid department (should validate)
- TC-AI-008-EC2: AI generation fails (should show error)

### 8.8 Vendor Scorer

#### TC-AI-009: Score Vendor Risk
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Vendor Scorer
2. Enter vendor name
3. Enter service description
4. Enter data access level
5. Generate score

**Expected Results:**
- Risk score calculated
- Score rationale provided
- Recommendations given
- Can save vendor

**Edge Cases:**
- TC-AI-009-EC1: Missing required fields (should validate)
- TC-AI-009-EC2: Invalid data access level (should validate)

### 8.9 Data Mapper

#### TC-AI-010: Map Data Flow
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Data Mapper
2. Enter data flow description
3. Generate map
4. Review visualization
5. Export map

**Expected Results:**
- Map generated
- Visualization clear
- Data flows identified
- Can export map

**Edge Cases:**
- TC-AI-010-EC1: Incomplete description (should handle)
- TC-AI-010-EC2: Complex data flow (should handle)

### 8.10 BCP Generator

#### TC-AI-011: Generate Business Continuity Plan
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to BCP Generator
2. Enter business information
3. Select scenarios
4. Generate plan
5. Review plan

**Expected Results:**
- Plan generated
- Plan comprehensive
- Scenarios covered
- Can edit plan
- Can export plan

**Edge Cases:**
- TC-AI-011-EC1: Missing business info (should validate)
- TC-AI-011-EC2: No scenarios selected (should validate)

---

## 9. Reports

### 9.1 Report Generation

#### TC-REP-001: Generate Compliance Report
**Priority:** High  
**Preconditions:** Frameworks and controls exist  
**Steps:**
1. Navigate to Reports
2. Select report type
3. Select frameworks
4. Generate report
5. Review report

**Expected Results:**
- Report generated successfully
- Report includes all selected frameworks
- Report includes control statuses
- Report includes evidence
- Report formatted correctly
- Can download report

**Edge Cases:**
- TC-REP-001-EC1: No frameworks selected (should validate)
- TC-REP-001-EC2: Framework with no controls (should handle)
- TC-REP-001-EC3: Very large report (should handle)

#### TC-REP-002: Export Report
**Priority:** Medium  
**Preconditions:** Report generated  
**Steps:**
1. Generate report
2. Click export button
3. Select format (PDF/JSON)
4. Download report

**Expected Results:**
- Report exports successfully
- Format correct
- File downloads
- File name includes date

**Edge Cases:**
- TC-REP-002-EC1: Export fails (should show error)
- TC-REP-002-EC2: Very large export (should handle)

### 9.2 Report Customization

#### TC-REP-003: Customize Report
**Priority:** Medium  
**Preconditions:** Report generation available  
**Steps:**
1. Select report options
2. Choose sections to include
3. Select date range
4. Generate customized report

**Expected Results:**
- Customization options work
- Report reflects selections
- All selected sections included

---

## 10. Audit Trail

### 10.1 Audit Log Viewing

#### TC-AUDIT-001: View Audit Trail
**Priority:** High  
**Preconditions:** User logged in, audit logs exist  
**Steps:**
1. Navigate to Audit Trail
2. Verify all logs display
3. Verify log details shown
4. Verify filters work
5. Verify search works

**Expected Results:**
- All logs displayed
- Logs in chronological order
- Details include: action, user, timestamp, hash
- Filters work correctly
- Search works

**Edge Cases:**
- TC-AUDIT-001-EC1: No audit logs (should show empty state)
- TC-AUDIT-001-EC2: 1000+ logs (should paginate)
- TC-AUDIT-001-EC3: Filter with no results (should show message)

#### TC-AUDIT-002: Audit Log Filtering
**Priority:** Medium  
**Preconditions:** Audit logs exist  
**Steps:**
1. Filter by user
2. Filter by action type
3. Filter by date range
4. Combine filters

**Expected Results:**
- Filters work independently
- Combined filters work
- Results update immediately

**Edge Cases:**
- TC-AUDIT-002-EC1: Invalid date range (should validate)
- TC-AUDIT-002-EC2: Non-existent user (should show no results)

### 10.2 Audit Log Integrity

#### TC-AUDIT-003: Verify Audit Log Hash
**Priority:** High  
**Preconditions:** Audit log exists  
**Steps:**
1. View audit log
2. Verify hash displayed
3. Verify hash format correct
4. Verify hash unique

**Expected Results:**
- Hash displayed for each log
- Hash format consistent
- Each log has unique hash
- Hash cannot be modified

**Edge Cases:**
- TC-AUDIT-003-EC1: Hash missing (should show error)
- TC-AUDIT-003-EC2: Hash tampered (should detect)

---

## 11. Settings

### 11.1 Profile Settings

#### TC-SET-001: Update User Profile
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Settings > Profile
2. Update name
3. Update email
4. Save changes

**Expected Results:**
- Changes saved successfully
- Profile updates immediately
- Email validation works
- Audit log entry created

**Edge Cases:**
- TC-SET-001-EC1: Invalid email format (should validate)
- TC-SET-001-EC2: Duplicate email (should reject)
- TC-SET-001-EC3: Very long name (should handle)

### 11.2 Organization Settings

#### TC-SET-002: Update Organization Settings
**Priority:** High  
**Preconditions:** User with admin role  
**Steps:**
1. Navigate to Settings > Organization
2. Update organization name
3. Update plan
4. Save changes

**Expected Results:**
- Changes saved
- Organization updates
- Plan changes reflected
- Audit log entry created

**Edge Cases:**
- TC-SET-002-EC1: Non-admin user (should not show settings)
- TC-SET-002-EC2: Invalid plan (should validate)

### 11.3 Security Settings

#### TC-SET-003: Security Settings
**Priority:** High  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Settings > Security
2. Enable/disable 2FA
3. View backup codes
4. Change password (if implemented)

**Expected Results:**
- 2FA toggle works
- Backup codes accessible
- Security settings saved

**Edge Cases:**
- TC-SET-003-EC1: 2FA already enabled (should show disable option)
- TC-SET-003-EC2: Backup codes lost (should allow regeneration)

### 11.4 Integration Settings

#### TC-SET-004: View Connected Integrations
**Priority:** Medium  
**Preconditions:** Integrations connected  
**Steps:**
1. Navigate to Settings > Integrations
2. Verify connected integrations shown
3. Verify can disconnect
4. Verify can navigate to catalog

**Expected Results:**
- Connected integrations listed
- Disconnect buttons work
- "View Catalog" button works
- Status accurate

**Edge Cases:**
- TC-SET-004-EC1: No integrations connected (should show message)
- TC-SET-004-EC2: Integration connection lost (should update status)

### 11.5 Pricing Settings

#### TC-SET-005: View Pricing Information
**Priority:** Low  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Settings > Billing
2. Verify pricing tiers displayed
3. Verify current plan highlighted
4. Verify upgrade options shown

**Expected Results:**
- Pricing information accurate
- Current plan indicated
- Upgrade buttons functional
- "Contact Us" for all tiers

**Edge Cases:**
- TC-SET-005-EC1: Enterprise plan (should show all features)
- TC-SET-005-EC2: Plan change in progress (should show status)

---

## 12. Team Management

### 12.1 Team Member List

#### TC-TEAM-001: View Team Members
**Priority:** High  
**Preconditions:** User with admin role, team members exist  
**Steps:**
1. Navigate to Settings > Team
2. Verify all team members listed
3. Verify member details shown:
   - Name
   - Email
   - Role
   - Avatar
4. Verify loading state

**Expected Results:**
- All members displayed
- Details accurate
- Roles shown correctly
- Loading state works

**Edge Cases:**
- TC-TEAM-001-EC1: No team members (should show empty state)
- TC-TEAM-001-EC2: 100+ members (should paginate)
- TC-TEAM-001-EC3: Non-admin user (should not access)

### 12.2 Invite Team Member

#### TC-TEAM-002: Invite New Team Member
**Priority:** High  
**Preconditions:** User with admin role  
**Steps:**
1. Click "Invite Member" button
2. Fill in form:
   - Name (required)
   - Email (required)
   - Role (required)
3. Send invitation
4. Verify invitation sent

**Expected Results:**
- Invitation sent successfully
- Magic link email sent
- New user created
- User appears in team list
- Audit log entry created

**Edge Cases:**
- TC-TEAM-002-EC1: Duplicate email (should reject)
- TC-TEAM-002-EC2: Invalid email format (should validate)
- TC-TEAM-002-EC3: Email service unavailable (should show error)
- TC-TEAM-002-EC4: Invitation to existing user (should handle)

#### TC-TEAM-003: Invite with Different Roles
**Priority:** High  
**Preconditions:** User with admin role  
**Steps:**
1. Invite member with "Editor" role
2. Invite member with "Viewer" role
3. Verify roles assigned correctly
4. Verify permissions match roles

**Expected Results:**
- Roles assigned correctly
- Permissions match roles
- Users can access appropriate features

**Edge Cases:**
- TC-TEAM-003-EC1: Invalid role (should validate)
- TC-TEAM-003-EC2: Role changed after invite (should update)

### 12.3 Remove Team Member

#### TC-TEAM-004: Remove Team Member
**Priority:** High  
**Preconditions:** User with admin role, team members exist  
**Steps:**
1. Click remove button on team member
2. Confirm removal
3. Verify member removed
4. Verify member cannot login

**Expected Results:**
- Confirmation dialog appears
- Member removed successfully
- Removed from team list
- User account deactivated
- Audit log entry created

**Edge Cases:**
- TC-TEAM-004-EC1: Remove yourself (should prevent)
- TC-TEAM-004-EC2: Cancel removal (should not remove)
- TC-TEAM-004-EC3: Remove last admin (should prevent or warn)

### 12.4 Update Team Member Role

#### TC-TEAM-005: Change Team Member Role
**Priority:** Medium  
**Preconditions:** User with admin role, team members exist  
**Steps:**
1. Select team member
2. Change role
3. Save changes
4. Verify role updated
5. Verify permissions updated

**Expected Results:**
- Role updates successfully
- Permissions reflect new role
- Changes immediate
- Audit log entry created

**Edge Cases:**
- TC-TEAM-005-EC1: Change your own role (should allow or prevent)
- TC-TEAM-005-EC2: Change to invalid role (should validate)

---

## 13. Billing & Subscriptions

### 13.1 Subscription Management

#### TC-BILL-001: View Current Subscription
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Navigate to Settings > Billing
2. Verify current plan displayed
3. Verify subscription status shown
4. Verify billing information

**Expected Results:**
- Current plan accurate
- Status accurate (active/past_due/canceled)
- Billing details shown
- Next billing date shown

**Edge Cases:**
- TC-BILL-001-EC1: No subscription (should show trial or expired)
- TC-BILL-001-EC2: Past due subscription (should show warning)

#### TC-BILL-002: Upgrade Subscription
**Priority:** Medium  
**Preconditions:** User logged in, Stripe configured  
**Steps:**
1. Click "Upgrade" button
2. Select plan
3. Complete Stripe checkout
4. Verify subscription upgraded

**Expected Results:**
- Stripe checkout opens
- Payment processed
- Subscription upgraded
- Plan features activated
- Audit log entry created

**Edge Cases:**
- TC-BILL-002-EC1: Payment fails (should show error)
- TC-BILL-002-EC2: Checkout canceled (should not upgrade)
- TC-BILL-002-EC3: Stripe unavailable (should show error)

#### TC-BILL-003: Manage Subscription
**Priority:** Medium  
**Preconditions:** Active subscription exists  
**Steps:**
1. Click "Manage Subscription"
2. Verify Stripe portal opens
3. Verify can update payment method
4. Verify can cancel subscription

**Expected Results:**
- Stripe portal opens
- Can update payment
- Can cancel subscription
- Changes reflected in app

**Edge Cases:**
- TC-BILL-003-EC1: Portal unavailable (should show error)
- TC-BILL-003-EC2: Canceled subscription (should update status)

### 13.2 Pricing Display

#### TC-BILL-004: View Pricing Tiers
**Priority:** Low  
**Preconditions:** User on landing page or settings  
**Steps:**
1. View pricing section
2. Verify all tiers displayed
3. Verify features listed
4. Verify "Contact Us" for all tiers

**Expected Results:**
- All tiers shown (Basic, Pro, Enterprise)
- Features accurate
- Pricing shows "Contact Us"
- Upgrade buttons functional

**Edge Cases:**
- TC-BILL-004-EC1: Pricing not loaded (should show loading state)
- TC-BILL-004-EC2: Custom pricing (should handle)

---

## 14. Performance & Load Testing

### 14.1 Page Load Performance

#### TC-PERF-001: Dashboard Load Time
**Priority:** High  
**Preconditions:** System with data  
**Steps:**
1. Measure dashboard load time
2. Verify loads within 2 seconds
3. Verify all widgets load
4. Verify no blocking operations

**Expected Results:**
- Loads within 2 seconds
- Progressive loading works
- No blocking UI
- Smooth animations

**Edge Cases:**
- TC-PERF-001-EC1: Slow network (should show loading states)
- TC-PERF-001-EC2: Large dataset (should handle efficiently)
- TC-PERF-001-EC3: Concurrent users (should handle load)

#### TC-PERF-002: Framework Details Load Time
**Priority:** High  
**Preconditions:** Framework with many controls  
**Steps:**
1. Navigate to framework with 100+ controls
2. Measure load time
3. Verify controls load efficiently
4. Verify pagination/virtualization works

**Expected Results:**
- Loads within 3 seconds
- Controls render efficiently
- Scrolling smooth
- No performance degradation

**Edge Cases:**
- TC-PERF-002-EC1: 1000+ controls (should paginate)
- TC-PERF-002-EC2: Very long control names (should handle)

### 14.2 API Response Times

#### TC-PERF-003: API Endpoint Performance
**Priority:** High  
**Preconditions:** System running  
**Steps:**
1. Measure API response times:
   - GET /api/frameworks
   - GET /api/risks
   - GET /api/integrations
   - POST /api/ai/chat
2. Verify all under thresholds

**Expected Results:**
- List endpoints: < 500ms
- Detail endpoints: < 300ms
- AI endpoints: < 5 seconds
- File uploads: < 10 seconds

**Edge Cases:**
- TC-PERF-003-EC1: High load (should maintain performance)
- TC-PERF-003-EC2: Database slow (should handle gracefully)

### 14.3 Load Testing

#### TC-PERF-004: Concurrent User Load
**Priority:** High  
**Preconditions:** Load testing setup  
**Steps:**
1. Simulate 100 concurrent users
2. Monitor system performance
3. Verify no errors
4. Verify response times acceptable

**Expected Results:**
- Handles 100 concurrent users
- No errors or crashes
- Response times acceptable
- Database handles load

**Edge Cases:**
- TC-PERF-004-EC1: 500+ concurrent users (should handle or queue)
- TC-PERF-004-EC2: Sudden spike (should handle gracefully)

#### TC-PERF-005: Stress Testing
**Priority:** Medium  
**Preconditions:** Stress testing setup  
**Steps:**
1. Gradually increase load
2. Find breaking point
3. Verify graceful degradation
4. Verify recovery

**Expected Results:**
- System handles stress
- Graceful degradation
- Error messages clear
- System recovers

---

## 15. Security Testing

### 15.1 Authentication Security

#### TC-SEC-001: Session Security
**Priority:** Critical  
**Preconditions:** User logged in  
**Steps:**
1. Verify session token secure
2. Verify token expiration works
3. Verify token cannot be reused
4. Verify HTTPS enforced

**Expected Results:**
- Tokens stored securely
- Tokens expire correctly
- Tokens cannot be reused
- HTTPS required

**Edge Cases:**
- TC-SEC-001-EC1: Token theft (should detect and invalidate)
- TC-SEC-001-EC2: Token replay attack (should reject)

#### TC-SEC-002: Authorization Bypass
**Priority:** Critical  
**Preconditions:** User with viewer role  
**Steps:**
1. Attempt to access admin endpoints directly
2. Attempt to modify data via API
3. Verify all requests rejected

**Expected Results:**
- All unauthorized requests rejected
- 403 Forbidden returned
- No data modified
- Audit log entry created

**Edge Cases:**
- TC-SEC-002-EC1: Role escalation attempt (should prevent)
- TC-SEC-002-EC2: Direct API access (should validate)

### 15.2 Data Security

#### TC-SEC-003: PII Protection
**Priority:** Critical  
**Preconditions:** System with PII data  
**Steps:**
1. Verify PII redaction in AI requests
2. Verify PII not logged
3. Verify PII encrypted at rest
4. Verify access controls

**Expected Results:**
- PII redacted before AI calls
- PII not in logs
- PII encrypted
- Access restricted

**Edge Cases:**
- TC-SEC-003-EC1: PII in file uploads (should detect and handle)
- TC-SEC-003-EC2: PII in exports (should redact or encrypt)

#### TC-SEC-004: Credential Storage
**Priority:** Critical  
**Preconditions:** Integrations with credentials  
**Steps:**
1. Verify credentials encrypted
2. Verify credentials not in logs
3. Verify credentials not exposed in API
4. Verify secure transmission

**Expected Results:**
- Credentials encrypted at rest
- Credentials not logged
- Credentials not in API responses
- HTTPS for transmission

**Edge Cases:**
- TC-SEC-004-EC1: Credential leak (should detect and alert)
- TC-SEC-004-EC2: Credential rotation (should support)

### 15.3 Input Validation

#### TC-SEC-005: SQL Injection Prevention
**Priority:** Critical  
**Preconditions:** System running  
**Steps:**
1. Attempt SQL injection in all input fields
2. Verify all attempts blocked
3. Verify no database errors exposed
4. Verify proper error handling

**Expected Results:**
- All SQL injection attempts blocked
- No database errors exposed
- Proper validation
- Error messages generic

**Edge Cases:**
- TC-SEC-005-EC1: Complex injection attempts (should handle)
- TC-SEC-005-EC2: Encoded injection (should detect)

#### TC-SEC-006: XSS Prevention
**Priority:** Critical  
**Preconditions:** System running  
**Steps:**
1. Attempt XSS in all input fields
2. Verify scripts not executed
3. Verify content sanitized
4. Verify CSP headers set

**Expected Results:**
- All XSS attempts blocked
- Scripts not executed
- Content sanitized
- CSP headers present

**Edge Cases:**
- TC-SEC-006-EC1: Stored XSS (should prevent)
- TC-SEC-006-EC2: Reflected XSS (should prevent)

#### TC-SEC-007: File Upload Security
**Priority:** High  
**Preconditions:** File upload functionality  
**Steps:**
1. Attempt to upload malicious files
2. Attempt to upload oversized files
3. Attempt to upload wrong file types
4. Verify all blocked

**Expected Results:**
- Malicious files rejected
- File size limits enforced
- File type validation works
- Files scanned if possible

**Edge Cases:**
- TC-SEC-007-EC1: File type spoofing (should validate MIME type)
- TC-SEC-007-EC2: Zip bombs (should handle)
- TC-SEC-007-EC3: Malicious PDFs (should scan)

### 15.4 Rate Limiting

#### TC-SEC-008: API Rate Limiting
**Priority:** High  
**Preconditions:** System running  
**Steps:**
1. Send rapid API requests
2. Verify rate limiting applies
3. Verify appropriate error returned
4. Verify limit resets

**Expected Results:**
- Rate limiting works
- 429 Too Many Requests returned
- Limit resets after window
- Limits per user/IP

**Edge Cases:**
- TC-SEC-008-EC1: Distributed attacks (should handle)
- TC-SEC-008-EC2: Legitimate high usage (should allow)

---

## 16. Edge Cases & Error Handling

### 16.1 Network Errors

#### TC-EDGE-001: Network Timeout
**Priority:** High  
**Preconditions:** System running  
**Steps:**
1. Simulate network timeout
2. Verify error message displayed
3. Verify retry option available
4. Verify user data not lost

**Expected Results:**
- Clear error message
- Retry option available
- User data preserved
- Graceful degradation

**Edge Cases:**
- TC-EDGE-001-EC1: Partial network failure (should handle)
- TC-EDGE-001-EC2: Intermittent connectivity (should retry)

#### TC-EDGE-002: Offline Mode
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Go offline
2. Attempt to perform actions
3. Verify offline handling
4. Verify data queues when online

**Expected Results:**
- Offline state detected
- Actions queued or blocked
- Clear offline message
- Data syncs when online

**Edge Cases:**
- TC-EDGE-002-EC1: Long offline period (should handle)
- TC-EDGE-002-EC2: Data conflicts on sync (should resolve)

### 16.2 Data Validation

#### TC-EDGE-003: Invalid Data Input
**Priority:** High  
**Preconditions:** Forms available  
**Steps:**
1. Enter invalid data in all forms
2. Verify validation works
3. Verify error messages clear
4. Verify form state preserved

**Expected Results:**
- All invalid inputs rejected
- Clear error messages
- Form state preserved
- Can correct and resubmit

**Edge Cases:**
- TC-EDGE-003-EC1: Extremely long inputs (should validate)
- TC-EDGE-003-EC2: Special characters (should handle)
- TC-EDGE-003-EC3: Unicode characters (should handle)

#### TC-EDGE-004: Missing Required Fields
**Priority:** High  
**Preconditions:** Forms with required fields  
**Steps:**
1. Submit forms without required fields
2. Verify validation prevents submission
3. Verify fields highlighted
4. Verify error messages shown

**Expected Results:**
- Submission prevented
- Required fields highlighted
- Error messages clear
- Can fix and resubmit

### 16.3 Concurrent Operations

#### TC-EDGE-005: Concurrent Edits
**Priority:** High  
**Preconditions:** Multiple users  
**Steps:**
1. Two users edit same framework
2. Both save changes
3. Verify conflict handling
4. Verify last write wins or merge

**Expected Results:**
- Conflict detected
- User notified
- Resolution option provided
- Data integrity maintained

**Edge Cases:**
- TC-EDGE-005-EC1: Same field edited (should handle)
- TC-EDGE-005-EC2: Different fields edited (should merge)

#### TC-EDGE-006: Rapid Actions
**Priority:** Medium  
**Preconditions:** User logged in  
**Steps:**
1. Perform rapid clicks on buttons
2. Verify no duplicate actions
3. Verify loading states work
4. Verify no errors

**Expected Results:**
- Duplicate actions prevented
- Loading states show
- No errors occur
- Actions complete correctly

**Edge Cases:**
- TC-EDGE-006-EC1: Network delay (should handle)
- TC-EDGE-006-EC2: Very rapid clicks (should debounce)

### 16.4 Data Consistency

#### TC-EDGE-007: Orphaned Data
**Priority:** Medium  
**Preconditions:** Data relationships exist  
**Steps:**
1. Delete framework
2. Verify controls deleted (cascade)
3. Delete user
4. Verify assigned risks handled

**Expected Results:**
- Cascading deletes work
- Orphaned data prevented
- Data integrity maintained
- Audit logs created

**Edge Cases:**
- TC-EDGE-007-EC1: Partial delete failure (should rollback)
- TC-EDGE-007-EC2: Circular dependencies (should handle)

#### TC-EDGE-008: Data Synchronization
**Priority:** High  
**Preconditions:** Multiple data sources  
**Steps:**
1. Update data in one place
2. Verify updates reflect everywhere
3. Verify no stale data
4. Verify cache invalidation

**Expected Results:**
- Updates propagate
- No stale data shown
- Cache invalidated
- Real-time updates work

**Edge Cases:**
- TC-EDGE-008-EC1: Update conflicts (should resolve)
- TC-EDGE-008-EC2: Update failures (should retry)

### 16.5 Boundary Conditions

#### TC-EDGE-009: Maximum Values
**Priority:** Medium  
**Preconditions:** Forms available  
**Steps:**
1. Enter maximum length strings
2. Upload maximum size files
3. Create maximum number of items
4. Verify all handled correctly

**Expected Results:**
- Maximum values accepted
- Validation works
- No errors
- Performance acceptable

**Edge Cases:**
- TC-EDGE-009-EC1: Exceeding maximums (should validate)
- TC-EDGE-009-EC2: At boundary values (should work)

#### TC-EDGE-010: Minimum Values
**Priority:** Medium  
**Preconditions:** Forms available  
**Steps:**
1. Enter minimum length strings
2. Create items with minimum data
3. Verify all handled correctly

**Expected Results:**
- Minimum values accepted
- Validation works
- No errors

#### TC-EDGE-011: Empty States
**Priority:** High  
**Preconditions:** New system or empty data  
**Steps:**
1. Verify all empty states display
2. Verify empty state messages clear
3. Verify actions available from empty states
4. Verify no errors

**Expected Results:**
- Empty states display correctly
- Messages helpful
- Actions available
- No errors or broken UI

**Edge Cases:**
- TC-EDGE-011-EC1: Empty state with loading (should show loading)
- TC-EDGE-011-EC2: Empty state after delete (should show)

### 16.6 Error Recovery

#### TC-EDGE-012: Error Recovery
**Priority:** High  
**Preconditions:** System running  
**Steps:**
1. Trigger various errors
2. Verify error messages displayed
3. Verify recovery options available
4. Verify system recovers

**Expected Results:**
- Errors caught and handled
- Clear error messages
- Recovery options available
- System recovers gracefully

**Edge Cases:**
- TC-EDGE-012-EC1: Cascading errors (should handle)
- TC-EDGE-012-EC2: Unrecoverable errors (should show message)

### 16.7 Browser Compatibility

#### TC-EDGE-013: Browser Compatibility
**Priority:** Medium  
**Preconditions:** Different browsers available  
**Steps:**
1. Test in Chrome
2. Test in Firefox
3. Test in Safari
4. Test in Edge
5. Verify all work correctly

**Expected Results:**
- All modern browsers supported
- Features work consistently
- No browser-specific bugs
- Responsive design works

**Edge Cases:**
- TC-EDGE-013-EC1: Older browser versions (should degrade gracefully)
- TC-EDGE-013-EC2: Mobile browsers (should work)

### 16.8 Mobile Responsiveness

#### TC-EDGE-014: Mobile Device Testing
**Priority:** Medium  
**Preconditions:** Mobile device or emulator  
**Steps:**
1. Test on mobile device
2. Verify responsive design
3. Verify touch interactions
4. Verify all features accessible

**Expected Results:**
- Responsive design works
- Touch interactions work
- All features accessible
- Performance acceptable

**Edge Cases:**
- TC-EDGE-014-EC1: Very small screens (should handle)
- TC-EDGE-014-EC2: Tablet devices (should work)

---

## Test Execution Guidelines

### Test Environment Setup

1. **Development Environment**
   - Local database (PostgreSQL)
   - All environment variables configured
   - Mock services for external APIs
   - Test data seeded

2. **Staging Environment**
   - Production-like setup
   - Real integrations (test accounts)
   - Performance monitoring enabled
   - Full test data

3. **Production Environment**
   - Smoke tests only
   - Critical path validation
   - Performance monitoring

### Test Data Requirements

1. **Users**
   - Admin user
   - Editor user
   - Viewer user
   - Multiple organizations

2. **Frameworks**
   - Various frameworks (NIST, SOC 2, ISO 27001, etc.)
   - Frameworks with controls
   - Frameworks without controls
   - Frameworks with different statuses

3. **Controls**
   - Controls with all statuses
   - Controls with evidence
   - Controls without evidence
   - Controls with long descriptions

4. **Risks**
   - Risks with all severities
   - Risks with all statuses
   - Assigned and unassigned risks
   - Risks with mitigation plans

5. **Integrations**
   - Connected integrations
   - Disconnected integrations
   - Integrations with errors
   - Various integration types

### Test Execution Order

1. **Smoke Tests** (Critical path)
   - Authentication
   - Dashboard load
   - Framework viewing
   - Control creation

2. **Functional Tests** (All features)
   - All test cases in order
   - Feature by feature
   - Integration testing

3. **Edge Case Tests** (Boundary conditions)
   - All edge cases
   - Error scenarios
   - Stress testing

4. **Performance Tests** (Load and stress)
   - Load testing
   - Stress testing
   - Performance benchmarks

5. **Security Tests** (Security validation)
   - Authentication security
   - Authorization
   - Data security
   - Input validation

### Test Reporting

1. **Test Results**
   - Pass/Fail status
   - Execution time
   - Screenshots for failures
   - Error logs

2. **Defect Tracking**
   - Defect ID
   - Severity
   - Steps to reproduce
   - Expected vs actual
   - Environment details

3. **Coverage Metrics**
   - Feature coverage
   - Code coverage
   - Edge case coverage
   - Test execution rate

---

## Test Case Summary

### Total Test Cases: 200+

**By Priority:**
- Critical: 45 test cases
- High: 85 test cases
- Medium: 50 test cases
- Low: 20 test cases

**By Category:**
- Authentication & Authorization: 11 test cases
- Dashboard: 7 test cases
- Frameworks Management: 6 test cases
- Controls & Evidence: 10 test cases
- Integrations: 19 test cases
- Risk Management: 8 test cases
- My Tasks: 3 test cases
- AI Features: 11 test cases
- Reports: 3 test cases
- Audit Trail: 3 test cases
- Settings: 5 test cases
- Team Management: 5 test cases
- Billing: 4 test cases
- Performance: 5 test cases
- Security: 8 test cases
- Edge Cases: 13 test cases

**Edge Cases: 50+**

---

## Notes

- All test cases should be executed in both manual and automated testing where applicable
- Edge cases are critical for production readiness
- Performance tests should be run regularly
- Security tests should be run before each release
- Test data should be reset between test runs
- All failures should be logged and tracked
- Test coverage should be maintained at 80%+

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Maintained By:** QA Team

