/**
 * GraphQL Type Definitions
 *
 * Defines the complete GraphQL schema for ComplyEasyAI.
 * Mirrors the REST API entities with proper type relationships,
 * pagination support, and mutation inputs.
 */

export const typeDefs = `#graphql
  # ============================================================================
  # SCALARS
  # ============================================================================

  scalar DateTime
  scalar JSON

  # ============================================================================
  # ENUMS
  # ============================================================================

  enum RiskLevel {
    Low
    Medium
    High
    Critical
  }

  enum VendorStatus {
    Active
    Inactive
    UnderReview
    Archived
  }

  enum PolicyStatus {
    Draft
    InReview
    Approved
    Published
    Deprecated
    Archived
  }

  enum IssueStatus {
    Open
    InProgress
    Resolved
    Closed
    Reopened
  }

  enum IssueSeverity {
    Low
    Medium
    High
    Critical
  }

  enum FrameworkStatus {
    Active
    Inactive
    Draft
    Archived
  }

  enum ControlStatus {
    Not_Started
    In_Progress
    Implemented
    Not_Applicable
  }

  enum MonitorStatus {
    Passing
    Failing
    Warning
    Unknown
  }

  enum SortOrder {
    asc
    desc
  }

  enum UserRole {
    admin
    manager
    auditor
    viewer
    member
  }

  # ============================================================================
  # PAGINATION
  # ============================================================================

  type PageInfo {
    page: Int!
    pageSize: Int!
    totalItems: Int!
    totalPages: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  input PaginationInput {
    page: Int
    pageSize: Int
    sortBy: String
    sortOrder: SortOrder
  }

  # ============================================================================
  # CORE TYPES
  # ============================================================================

  type Organization {
    id: ID!
    name: String!
    plan: String
    settings: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    users: [User!]
    vendors: [Vendor!]
    frameworks: [ComplianceFramework!]
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    organizationId: String!
    organization: Organization
    avatarUrl: String
    is2FAEnabled: Boolean
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # ============================================================================
  # VENDOR TYPES
  # ============================================================================

  type Vendor {
    id: ID!
    name: String!
    website: String
    contactName: String
    contactEmail: String
    category: String
    riskLevel: RiskLevel
    riskScore: Float
    status: VendorStatus!
    contractStartDate: DateTime
    contractEndDate: DateTime
    annualSpend: Float
    dataAccess: String
    organizationId: String!
    assessments: [VendorAssessment!]
    reviews: [VendorReview!]
    monitors: [VendorMonitor!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type VendorAssessment {
    id: ID!
    vendorId: String!
    type: String!
    status: String!
    overallScore: Float
    securityScore: Float
    complianceScore: Float
    privacyScore: Float
    assessedBy: String
    completedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type VendorReview {
    id: ID!
    vendorId: String!
    reviewType: String
    status: String
    reviewDate: DateTime
    nextReviewDate: DateTime
    createdAt: DateTime!
  }

  type VendorMonitor {
    id: ID!
    vendorId: String!
    type: String
    status: String
    lastChecked: DateTime
    createdAt: DateTime!
  }

  type VendorConnection {
    data: [Vendor!]!
    pagination: PageInfo!
  }

  type VendorDashboard {
    totalVendors: Int!
    highRiskCount: Int!
    activeAssessments: Int!
    overdueReviews: Int!
    averageRiskScore: Float
    byRiskLevel: JSON
    byCategory: JSON
    recentActivity: JSON
    topRiskVendors: [Vendor!]
  }

  # ============================================================================
  # FRAMEWORK TYPES
  # ============================================================================

  type ComplianceFramework {
    id: ID!
    name: String!
    notes: String
    version: Int
    region: String
    status: String!
    progress: Int
    nextAuditDate: DateTime
    organizationId: String!
    controls: [FrameworkControl!]
    controlCount: Int
    completionPercentage: Float
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type FrameworkControl {
    id: ID!
    frameworkId: String!
    controlId: String
    name: String!
    description: String
    category: String
    status: ControlStatus!
    evidenceStatus: String
    owner: String
    implementationGuidance: String
    testProcedures: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type FrameworkConnection {
    data: [ComplianceFramework!]!
    pagination: PageInfo!
  }

  type FrameworkTemplate {
    type: String!
    name: String!
    description: String
    controlCount: Int!
    region: String
  }

  # ============================================================================
  # RISK TYPES
  # ============================================================================

  type RiskItem {
    id: ID!
    title: String!
    description: String
    category: String
    likelihood: Int
    impact: Int
    riskScore: Float
    status: String!
    mitigationPlan: String
    assignedTo: String
    dueDate: DateTime
    organizationId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type RiskConnection {
    data: [RiskItem!]!
    pagination: PageInfo!
  }

  # ============================================================================
  # POLICY TYPES
  # ============================================================================

  type Policy {
    id: ID!
    title: String!
    content: String
    category: String
    status: String!
    version: String
    owner: String
    approver: String
    effectiveDate: DateTime
    reviewDate: DateTime
    organizationId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PolicyConnection {
    data: [Policy!]!
    pagination: PageInfo!
  }

  # ============================================================================
  # ISSUE TYPES
  # ============================================================================

  type Issue {
    id: ID!
    title: String!
    description: String
    issueType: String!
    priority: String!
    status: IssueStatus!
    category: String
    assignedToId: String
    assignee: User
    createdById: String!
    reporter: User
    dueDate: DateTime
    resolvedDate: DateTime
    organizationId: String!
    comments: [IssueComment!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type IssueComment {
    id: ID!
    issueId: String!
    comment: String!
    author: String!
    createdAt: DateTime!
  }

  type IssueConnection {
    data: [Issue!]!
    pagination: PageInfo!
  }

  # ============================================================================
  # MONITORING TYPES
  # ============================================================================

  type ContinuousMonitor {
    id: ID!
    name: String!
    monitorType: String!
    status: MonitorStatus!
    frequency: String
    configuration: JSON
    active: Boolean!
    lastRun: DateTime
    nextRun: DateTime
    organizationId: String!
    results: [MonitorResult!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MonitorResult {
    id: ID!
    monitorId: String!
    status: MonitorStatus!
    findings: JSON
    passedTests: Int
    failedTests: Int
    runDate: DateTime!
  }

  type MonitorConnection {
    data: [ContinuousMonitor!]!
    pagination: PageInfo!
  }

  # ============================================================================
  # QUESTIONNAIRE TYPES
  # ============================================================================

  type Questionnaire {
    id: ID!
    title: String!
    description: String
    type: String
    status: String!
    dueDate: DateTime
    organizationId: String!
    questions: [QuestionnaireQuestion!]
    responses: [QuestionnaireResponse!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type QuestionnaireQuestion {
    id: ID!
    questionnaireId: String!
    text: String!
    type: String
    required: Boolean
    order: Int
    createdAt: DateTime!
  }

  type QuestionnaireResponse {
    id: ID!
    questionId: String!
    respondentId: String!
    answer: String
    createdAt: DateTime!
  }

  # ============================================================================
  # REPORT TYPES
  # ============================================================================

  type Report {
    id: ID!
    name: String!
    type: String!
    format: String
    status: String
    config: JSON
    generatedData: JSON
    organizationId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # ============================================================================
  # AUDIT TYPES
  # ============================================================================

  type AuditLog {
    id: ID!
    action: String!
    resourceType: String
    resourceId: String
    userId: String
    user: User
    details: String
    metadata: JSON
    ipAddress: String
    organizationId: String!
    timestamp: DateTime!
  }

  type AuditLogConnection {
    data: [AuditLog!]!
    pagination: PageInfo!
  }

  # ============================================================================
  # INPUT TYPES
  # ============================================================================

  input CreateVendorInput {
    name: String!
    website: String
    contactName: String
    contactEmail: String
    category: String
    riskLevel: RiskLevel
    status: VendorStatus
  }

  input UpdateVendorInput {
    name: String
    website: String
    contactName: String
    contactEmail: String
    category: String
    riskLevel: RiskLevel
    status: VendorStatus
  }

  input CreateRiskInput {
    title: String!
    description: String
    category: String
    likelihood: Int
    impact: Int
    mitigationPlan: String
    assignedTo: String
    dueDate: DateTime
  }

  input UpdateRiskInput {
    title: String
    description: String
    category: String
    likelihood: Int
    impact: Int
    status: String
    mitigationPlan: String
    assignedTo: String
    dueDate: DateTime
  }

  input CreatePolicyInput {
    title: String!
    content: String
    category: String
    status: PolicyStatus
    version: String
  }

  input CreateIssueInput {
    title: String!
    description: String
    issueType: String
    category: String
    assignedToId: String
    dueDate: DateTime
  }

  input CreateFrameworkInput {
    name: String!
    notes: String
    region: String
    nextAuditDate: DateTime
  }

  input CreateMonitorInput {
    name: String!
    monitorType: String!
    frequency: String
    configuration: JSON
  }

  # ============================================================================
  # FILTER INPUTS
  # ============================================================================

  input VendorFilter {
    status: VendorStatus
    riskLevel: RiskLevel
    category: String
    search: String
  }

  input RiskFilter {
    status: String
    category: String
    minScore: Float
    maxScore: Float
    search: String
  }

  input PolicyFilter {
    status: PolicyStatus
    category: String
    search: String
  }

  input IssueFilter {
    status: IssueStatus
    severity: IssueSeverity
    category: String
    assigneeId: String
    search: String
  }

  input FrameworkFilter {
    status: FrameworkStatus
    type: String
    region: String
    search: String
  }

  # ============================================================================
  # QUERIES
  # ============================================================================

  type Query {
    # Vendor queries
    vendors(pagination: PaginationInput, filter: VendorFilter): VendorConnection!
    vendor(id: ID!): Vendor
    vendorDashboard: VendorDashboard!

    # Framework queries
    frameworks(pagination: PaginationInput, filter: FrameworkFilter): FrameworkConnection!
    framework(id: ID!): ComplianceFramework
    frameworkTemplates: [FrameworkTemplate!]!

    # Risk queries
    risks(pagination: PaginationInput, filter: RiskFilter): RiskConnection!
    risk(id: ID!): RiskItem

    # Policy queries
    policies(pagination: PaginationInput, filter: PolicyFilter): PolicyConnection!
    policy(id: ID!): Policy

    # Issue queries
    issues(pagination: PaginationInput, filter: IssueFilter): IssueConnection!
    issue(id: ID!): Issue

    # Monitor queries
    monitors(pagination: PaginationInput): MonitorConnection!
    monitor(id: ID!): ContinuousMonitor

    # Audit queries
    auditLogs(pagination: PaginationInput): AuditLogConnection!

    # User queries
    me: User!
    organizationUsers: [User!]!

    # Dashboard
    dashboardStats: JSON!
  }

  # ============================================================================
  # MUTATIONS
  # ============================================================================

  type Mutation {
    # Vendor mutations
    createVendor(input: CreateVendorInput!): Vendor!
    updateVendor(id: ID!, input: UpdateVendorInput!): Vendor!
    deleteVendor(id: ID!): Boolean!

    # Risk mutations
    createRisk(input: CreateRiskInput!): RiskItem!
    updateRisk(id: ID!, input: UpdateRiskInput!): RiskItem!
    deleteRisk(id: ID!): Boolean!

    # Policy mutations
    createPolicy(input: CreatePolicyInput!): Policy!
    deletePolicy(id: ID!): Boolean!

    # Issue mutations
    createIssue(input: CreateIssueInput!): Issue!
    addIssueComment(issueId: ID!, content: String!): IssueComment!

    # Framework mutations
    createFramework(input: CreateFrameworkInput!): ComplianceFramework!
    applyTemplate(frameworkId: ID!, templateType: String!): ComplianceFramework!
    deleteFramework(id: ID!): Boolean!

    # Monitor mutations
    createMonitor(input: CreateMonitorInput!): ContinuousMonitor!
    toggleMonitor(id: ID!, enabled: Boolean!): ContinuousMonitor!
    runMonitor(id: ID!): MonitorResult!
  }

  # ============================================================================
  # SUBSCRIPTIONS
  # ============================================================================

  type Subscription {
    # Real-time updates
    vendorUpdated(organizationId: ID!): Vendor!
    riskUpdated(organizationId: ID!): RiskItem!
    frameworkUpdated(organizationId: ID!): ComplianceFramework!
    issueUpdated(organizationId: ID!): Issue!
    monitorResult(organizationId: ID!): MonitorResult!
    auditLogCreated(organizationId: ID!): AuditLog!
    notificationReceived(userId: ID!): JSON!
  }
`;

export default typeDefs;
