/**
 * Signal redesign — per-tab header copy and table framing for the app's
 * secondary views, from the design handoff (App prototype _generic map).
 * Only structural copy is kept (subtitle, KPI labels, column names, action
 * label); the prototype's demo values/rows are intentionally omitted — real
 * views bind live data.
 */

export interface SignalTabContent {
  id: string;
  label: string;
  section: string;
  subtitle: string;
  kpiLabels: string[];
  columns: string[];
  actionLabel: string;
}

export const SIGNAL_APP_TABS: Record<string, SignalTabContent> = {
  "dashboard": {
    "id": "dashboard",
    "label": "Dashboard",
    "section": "Platform",
    "subtitle": "Manage dashboard for your organization.",
    "kpiLabels": [
      "Items",
      "Active",
      "Open",
      "Owner"
    ],
    "columns": [
      "Item",
      "Owner",
      "Status",
      "Updated"
    ],
    "actionLabel": "+ New"
  },
  "frameworks": {
    "id": "frameworks",
    "label": "Frameworks",
    "section": "Platform",
    "subtitle": "Manage frameworks for your organization.",
    "kpiLabels": [
      "Items",
      "Active",
      "Open",
      "Owner"
    ],
    "columns": [
      "Item",
      "Owner",
      "Status",
      "Updated"
    ],
    "actionLabel": "+ New"
  },
  "risks": {
    "id": "risks",
    "label": "Risks",
    "section": "Platform",
    "subtitle": "Manage risks for your organization.",
    "kpiLabels": [
      "Items",
      "Active",
      "Open",
      "Owner"
    ],
    "columns": [
      "Item",
      "Owner",
      "Status",
      "Updated"
    ],
    "actionLabel": "+ New"
  },
  "issues": {
    "id": "issues",
    "label": "Issues & Incidents",
    "section": "Platform",
    "subtitle": "Track and resolve compliance issues and security incidents.",
    "kpiLabels": [
      "Open",
      "Incidents 30d",
      "Avg close",
      "SLA breaches"
    ],
    "columns": [
      "Issue",
      "Severity",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ New issue"
  },
  "vendors": {
    "id": "vendors",
    "label": "Vendors",
    "section": "Platform",
    "subtitle": "Manage vendors for your organization.",
    "kpiLabels": [
      "Items",
      "Active",
      "Open",
      "Owner"
    ],
    "columns": [
      "Item",
      "Owner",
      "Status",
      "Updated"
    ],
    "actionLabel": "+ New"
  },
  "policies": {
    "id": "policies",
    "label": "Policies",
    "section": "Platform",
    "subtitle": "Author, approve and version compliance policies.",
    "kpiLabels": [
      "Published",
      "In review",
      "Overdue",
      "Acknowledged"
    ],
    "columns": [
      "Policy",
      "Version",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ New policy"
  },
  "integrations": {
    "id": "integrations",
    "label": "Integrations",
    "section": "Platform",
    "subtitle": "Manage integrations for your organization.",
    "kpiLabels": [
      "Items",
      "Active",
      "Open",
      "Owner"
    ],
    "columns": [
      "Item",
      "Owner",
      "Status",
      "Updated"
    ],
    "actionLabel": "+ New"
  },
  "eu-ai-act": {
    "id": "eu-ai-act",
    "label": "EU AI Act",
    "section": "Regulatory",
    "subtitle": "Classify AI systems by risk and manage EU AI Act obligations.",
    "kpiLabels": [
      "AI systems",
      "High-risk",
      "Docs complete",
      "Open actions"
    ],
    "columns": [
      "AI system",
      "Risk tier",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Register AI system"
  },
  "nist-ai-rmf": {
    "id": "nist-ai-rmf",
    "label": "NIST AI RMF",
    "section": "Regulatory",
    "subtitle": "Manage AI risk across Govern, Map, Measure and Manage.",
    "kpiLabels": [
      "Coverage",
      "Risks mapped",
      "Measured",
      "Actions open"
    ],
    "columns": [
      "Function",
      "Activities",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add activity"
  },
  "dora": {
    "id": "dora",
    "label": "DORA",
    "section": "Regulatory",
    "subtitle": "ICT risk, incident reporting and resilience testing for finance.",
    "kpiLabels": [
      "ICT risks",
      "Major incidents",
      "Tests passed",
      "3rd-party ICT"
    ],
    "columns": [
      "Requirement",
      "Area",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Log item"
  },
  "nis2": {
    "id": "nis2",
    "label": "NIS2",
    "section": "Regulatory",
    "subtitle": "Network and information security for essential entities.",
    "kpiLabels": [
      "Measures",
      "Gaps",
      "Incidents",
      "Board briefed"
    ],
    "columns": [
      "Measure",
      "Area",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add measure"
  },
  "dma": {
    "id": "dma",
    "label": "DMA",
    "section": "Regulatory",
    "subtitle": "Gatekeeper obligations for core platform services.",
    "kpiLabels": [
      "Services",
      "Obligations",
      "Met",
      "Reporting due"
    ],
    "columns": [
      "Obligation",
      "Service",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add obligation"
  },
  "dsa": {
    "id": "dsa",
    "label": "DSA",
    "section": "Regulatory",
    "subtitle": "Content moderation, transparency and user-protection duties.",
    "kpiLabels": [
      "Notices 30d",
      "Actioned",
      "Appeals",
      "Report due"
    ],
    "columns": [
      "Duty",
      "Area",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add record"
  },
  "eu-cra": {
    "id": "eu-cra",
    "label": "EU CRA",
    "section": "Regulatory",
    "subtitle": "Cyber Resilience Act product-security obligations.",
    "kpiLabels": [
      "Products",
      "SBOMs",
      "Vulns open",
      "CE-ready"
    ],
    "columns": [
      "Product",
      "Requirement",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add product"
  },
  "csrd": {
    "id": "csrd",
    "label": "CSRD / ESG",
    "section": "Regulatory",
    "subtitle": "Double-materiality sustainability reporting under ESRS.",
    "kpiLabels": [
      "ESRS topics",
      "Datapoints",
      "Assured",
      "Gaps"
    ],
    "columns": [
      "Disclosure",
      "Standard",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add disclosure"
  },
  "us-privacy": {
    "id": "us-privacy",
    "label": "US Privacy",
    "section": "Regulatory",
    "subtitle": "State privacy obligations across the US.",
    "kpiLabels": [
      "States",
      "DSARs 30d",
      "Avg response",
      "Overdue"
    ],
    "columns": [
      "State law",
      "Scope",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add state"
  },
  "reg-changes": {
    "id": "reg-changes",
    "label": "Regulatory Changes",
    "section": "Regulatory",
    "subtitle": "Track regulatory changes across your frameworks.",
    "kpiLabels": [
      "Tracked",
      "New 30d",
      "Impacting",
      "Actioned"
    ],
    "columns": [
      "Change",
      "Framework",
      "Impact",
      "Status"
    ],
    "actionLabel": "+ Track change"
  },
  "governance": {
    "id": "governance",
    "label": "Governance",
    "section": "Governance",
    "subtitle": "Centralized governance, roles and accountability.",
    "kpiLabels": [
      "Committees",
      "Reviews due",
      "Roles defined",
      "Sign-offs"
    ],
    "columns": [
      "Body",
      "Cadence",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add body"
  },
  "sox": {
    "id": "sox",
    "label": "SOX Compliance",
    "section": "Governance",
    "subtitle": "SOX ITGC and financial-controls compliance.",
    "kpiLabels": [
      "Controls",
      "Tested",
      "Deficiencies",
      "Sign-off"
    ],
    "columns": [
      "Control",
      "Process",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add control"
  },
  "evidence-hub": {
    "id": "evidence-hub",
    "label": "Evidence & Exceptions",
    "section": "Governance",
    "subtitle": "Central evidence library and control exceptions.",
    "kpiLabels": [
      "Artifacts",
      "Auto-collected",
      "Exceptions",
      "Stale"
    ],
    "columns": [
      "Evidence",
      "Control",
      "Source",
      "Status"
    ],
    "actionLabel": "+ Upload evidence"
  },
  "products": {
    "id": "products",
    "label": "Products Compliance",
    "section": "Products",
    "subtitle": "Product compliance across your portfolio.",
    "kpiLabels": [
      "Products",
      "Compliant",
      "In assessment",
      "Passports"
    ],
    "columns": [
      "Product",
      "Line",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add product"
  },
  "post-market": {
    "id": "post-market",
    "label": "Post-Market Surveillance",
    "section": "Products",
    "subtitle": "Post-market surveillance and product monitoring.",
    "kpiLabels": [
      "Monitored",
      "Signals 30d",
      "Investigations",
      "Recalls"
    ],
    "columns": [
      "Product",
      "Signal",
      "Severity",
      "Status"
    ],
    "actionLabel": "+ Log signal"
  },
  "monitoring": {
    "id": "monitoring",
    "label": "Analytics & Monitoring",
    "section": "Monitoring",
    "subtitle": "Real-time analytics and continuous monitoring.",
    "kpiLabels": [
      "Controls monitored",
      "Drift 24h",
      "Uptime",
      "Alerts 24h"
    ],
    "columns": [
      "Monitor",
      "Scope",
      "Signal",
      "Status"
    ],
    "actionLabel": "+ Add monitor"
  },
  "maturity": {
    "id": "maturity",
    "label": "Maturity Assessment",
    "section": "Monitoring",
    "subtitle": "Assess and improve compliance program maturity.",
    "kpiLabels": [
      "Overall",
      "Domains",
      "Improving",
      "Target"
    ],
    "columns": [
      "Domain",
      "Current",
      "Target",
      "Status"
    ],
    "actionLabel": "+ Run assessment"
  },
  "reports": {
    "id": "reports",
    "label": "Reports",
    "section": "Reports & Audit",
    "subtitle": "Generate audit-ready reports and evidence packages.",
    "kpiLabels": [
      "Templates",
      "Generated 30d",
      "Scheduled",
      "Shared"
    ],
    "columns": [
      "Report",
      "Framework",
      "Format",
      "Status"
    ],
    "actionLabel": "+ New report"
  },
  "audit": {
    "id": "audit",
    "label": "Audit Center",
    "section": "Reports & Audit",
    "subtitle": "Immutable audit trail and auditor workspace.",
    "kpiLabels": [
      "Events 30d",
      "Auditors",
      "Requests open",
      "Integrity"
    ],
    "columns": [
      "Event",
      "Actor",
      "Object",
      "Time"
    ],
    "actionLabel": "+ Invite auditor"
  },
  "executive": {
    "id": "executive",
    "label": "Executive Dashboard",
    "section": "Reports & Audit",
    "subtitle": "Board-ready executive compliance view.",
    "kpiLabels": [
      "Posture",
      "Frameworks",
      "Critical risks",
      "Est. savings"
    ],
    "columns": [
      "Metric",
      "This quarter",
      "Trend",
      "Status"
    ],
    "actionLabel": "↧ Export brief"
  },
  "privacy": {
    "id": "privacy",
    "label": "Privacy Platform",
    "section": "Privacy",
    "subtitle": "Unified privacy program management.",
    "kpiLabels": [
      "Data flows",
      "DSARs open",
      "Consents",
      "Vendors w/ DPA"
    ],
    "columns": [
      "Program",
      "Scope",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add program"
  },
  "dpia": {
    "id": "dpia",
    "label": "DPIA",
    "section": "Privacy",
    "subtitle": "Data protection impact assessments.",
    "kpiLabels": [
      "Total",
      "High-risk",
      "Approved",
      "Overdue"
    ],
    "columns": [
      "Assessment",
      "Processing",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ New DPIA"
  },
  "ropa": {
    "id": "ropa",
    "label": "RoPA",
    "section": "Privacy",
    "subtitle": "Records of processing activities.",
    "kpiLabels": [
      "Activities",
      "Controllers",
      "Processors",
      "Reviewed"
    ],
    "columns": [
      "Activity",
      "Purpose",
      "Legal basis",
      "Status"
    ],
    "actionLabel": "+ Add activity"
  },
  "privacy-notices": {
    "id": "privacy-notices",
    "label": "Privacy Notices",
    "section": "Privacy",
    "subtitle": "Serve and version privacy notices.",
    "kpiLabels": [
      "Notices",
      "Languages",
      "Views 30d",
      "Pending"
    ],
    "columns": [
      "Notice",
      "Surface",
      "Version",
      "Status"
    ],
    "actionLabel": "+ New notice"
  },
  "data-deletion": {
    "id": "data-deletion",
    "label": "Data Deletion",
    "section": "Privacy",
    "subtitle": "Data subject deletion and retention workflows.",
    "kpiLabels": [
      "Requests 30d",
      "Completed",
      "Avg time",
      "Overdue"
    ],
    "columns": [
      "Request",
      "Type",
      "Source",
      "Status"
    ],
    "actionLabel": "+ New request"
  },
  "workspaces": {
    "id": "workspaces",
    "label": "Workspaces",
    "section": "Enterprise",
    "subtitle": "Multi-workspace organization management.",
    "kpiLabels": [
      "Workspaces",
      "Members",
      "Frameworks",
      "Avg score"
    ],
    "columns": [
      "Workspace",
      "Unit",
      "Frameworks",
      "Score"
    ],
    "actionLabel": "+ New workspace"
  },
  "it-security-ops": {
    "id": "it-security-ops",
    "label": "IT & Security Ops",
    "section": "Enterprise",
    "subtitle": "IT and security operations controls.",
    "kpiLabels": [
      "Assets",
      "Endpoints",
      "Patched",
      "Open tickets"
    ],
    "columns": [
      "Control",
      "Area",
      "Owner",
      "Status"
    ],
    "actionLabel": "+ Add control"
  },
  "questionnaires": {
    "id": "questionnaires",
    "label": "Questionnaires",
    "section": "Enterprise",
    "subtitle": "Security questionnaires and RFP responses.",
    "kpiLabels": [
      "Open",
      "Completed 30d",
      "Avg turnaround",
      "Answer library"
    ],
    "columns": [
      "Questionnaire",
      "Requester",
      "Due",
      "Status"
    ],
    "actionLabel": "+ New questionnaire"
  },
  "acos": {
    "id": "acos",
    "label": "aCOS",
    "section": "Enterprise",
    "subtitle": "Manage acos for your organization.",
    "kpiLabels": [
      "Items",
      "Active",
      "Open",
      "Owner"
    ],
    "columns": [
      "Item",
      "Owner",
      "Status",
      "Updated"
    ],
    "actionLabel": "+ New"
  },
  "calendar": {
    "id": "calendar",
    "label": "Calendar",
    "section": "Enterprise",
    "subtitle": "Compliance calendar and deadlines.",
    "kpiLabels": [
      "This month",
      "Overdue",
      "Audits",
      "Reviews"
    ],
    "columns": [
      "Event",
      "Type",
      "Owner",
      "Due"
    ],
    "actionLabel": "+ Add event"
  },
  "ai-compliance-tools": {
    "id": "ai-compliance-tools",
    "label": "AI Compliance Tools",
    "section": "Enterprise",
    "subtitle": "AI copilots for mapping, policy and analysis.",
    "kpiLabels": [
      "Tools",
      "Runs 30d",
      "Time saved",
      "Accuracy"
    ],
    "columns": [
      "Tool",
      "Use",
      "Runs",
      "Status"
    ],
    "actionLabel": "+ Run a tool"
  },
  "settings": {
    "id": "settings",
    "label": "Settings",
    "section": "Account",
    "subtitle": "Workspace, team, security and billing settings.",
    "kpiLabels": [
      "Members",
      "Roles",
      "SSO",
      "Plan"
    ],
    "columns": [
      "Setting",
      "Scope",
      "Value",
      "Status"
    ],
    "actionLabel": "+ Invite member"
  }
};
