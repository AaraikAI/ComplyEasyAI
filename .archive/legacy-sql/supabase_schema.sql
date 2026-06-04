-- ============================================================================
-- ComplyEasy AI — Complete Supabase SQL Schema
-- All tables for: AI Features, Framework Controls, Process Mapper,
-- OAuth Integrations, EU Regulations, Inter-Module Data Sync
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE: Organizations & Users
-- ============================================================================

CREATE TYPE plan_type AS ENUM ('Foundation', 'Essentials', 'Growth', 'Visionary');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'paused');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'annual');
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  plan plan_type NOT NULL DEFAULT 'Foundation',
  stripe_customer_id TEXT UNIQUE,
  subscription_status subscription_status NOT NULL DEFAULT 'trialing',
  parent_organization_id TEXT REFERENCES organizations(id),
  is_parent BOOLEAN NOT NULL DEFAULT false,
  stripe_subscription_id TEXT UNIQUE,
  billing_cycle billing_cycle NOT NULL DEFAULT 'annual',
  trial_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  active_add_ons TEXT[] DEFAULT '{}',
  usage_metrics JSONB,
  industry TEXT,
  company_size TEXT,
  primary_compliance_goal TEXT,
  how_did_you_hear TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_stripe ON organizations(stripe_customer_id);
CREATE INDEX idx_organizations_parent ON organizations(parent_organization_id);

CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  avatar TEXT,
  password_hash TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMPTZ,
  employee_id TEXT UNIQUE,
  department TEXT,
  job_title TEXT,
  manager TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  two_factor_verified BOOLEAN NOT NULL DEFAULT false,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_employee ON users(employee_id);

-- ============================================================================
-- AI FEATURES: Cross-Framework Mapping Sessions
-- ============================================================================

CREATE TYPE mapping_status AS ENUM ('Draft', 'In Progress', 'Completed', 'Reviewed');
CREATE TYPE mapping_type AS ENUM ('Full', 'Partial', 'Semantic');
CREATE TYPE control_mapping_status AS ENUM ('AI Suggested', 'Confirmed', 'Rejected', 'Manual');

CREATE TABLE ai_mapping_sessions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_framework_id TEXT NOT NULL,
  source_framework_name TEXT NOT NULL,
  target_framework_id TEXT NOT NULL,
  target_framework_name TEXT NOT NULL,
  status mapping_status NOT NULL DEFAULT 'Draft',
  coverage_percent INTEGER NOT NULL DEFAULT 0,
  avg_confidence INTEGER NOT NULL DEFAULT 0,
  ai_model_version TEXT DEFAULT 'gemini-2.0-flash',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_mapping_sessions_org ON ai_mapping_sessions(organization_id);
CREATE INDEX idx_ai_mapping_sessions_source ON ai_mapping_sessions(source_framework_id);
CREATE INDEX idx_ai_mapping_sessions_target ON ai_mapping_sessions(target_framework_id);

CREATE TABLE ai_control_mappings (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  session_id TEXT NOT NULL REFERENCES ai_mapping_sessions(id) ON DELETE CASCADE,
  source_control_id TEXT NOT NULL,
  source_control_title TEXT NOT NULL,
  target_control_id TEXT NOT NULL,
  target_control_title TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  status control_mapping_status NOT NULL DEFAULT 'AI Suggested',
  rationale TEXT,
  mapping_type mapping_type NOT NULL DEFAULT 'Semantic',
  confirmed_by TEXT REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_control_mappings_session ON ai_control_mappings(session_id);
CREATE INDEX idx_ai_control_mappings_source ON ai_control_mappings(source_control_id);
CREATE INDEX idx_ai_control_mappings_target ON ai_control_mappings(target_control_id);

-- ============================================================================
-- AI FEATURES: Remediation Plans
-- ============================================================================

CREATE TYPE remediation_priority AS ENUM ('Critical', 'High', 'Medium', 'Low');
CREATE TYPE remediation_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked', 'deferred');

CREATE TABLE ai_remediation_plans (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  gap_control_id TEXT NOT NULL,
  gap_title TEXT NOT NULL,
  gap_requirement TEXT,
  priority remediation_priority NOT NULL DEFAULT 'Medium',
  status remediation_status NOT NULL DEFAULT 'pending',
  effort_estimate TEXT,
  timeline TEXT,
  estimated_cost TEXT,
  automatable BOOLEAN NOT NULL DEFAULT false,
  steps JSONB NOT NULL DEFAULT '[]',
  resources JSONB NOT NULL DEFAULT '[]',
  ai_summary TEXT,
  quick_win BOOLEAN NOT NULL DEFAULT false,
  assigned_to TEXT REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_remediation_org ON ai_remediation_plans(organization_id);
CREATE INDEX idx_ai_remediation_status ON ai_remediation_plans(status);
CREATE INDEX idx_ai_remediation_priority ON ai_remediation_plans(priority);
CREATE INDEX idx_ai_remediation_framework ON ai_remediation_plans(framework);

-- ============================================================================
-- AI FEATURES: Evidence Completeness Checks
-- ============================================================================

CREATE TYPE evidence_status AS ENUM ('Complete', 'Partial', 'Missing', 'Stale');
CREATE TYPE audit_risk_level AS ENUM ('High', 'Medium', 'Low');

CREATE TABLE ai_evidence_checks (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  scan_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  overall_completeness INTEGER NOT NULL DEFAULT 0 CHECK (overall_completeness >= 0 AND overall_completeness <= 100),
  critical_gaps JSONB NOT NULL DEFAULT '[]',
  ai_summary TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_evidence_checks_org ON ai_evidence_checks(organization_id);

CREATE TABLE ai_evidence_check_results (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  check_id TEXT NOT NULL REFERENCES ai_evidence_checks(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL,
  control_title TEXT NOT NULL,
  completeness INTEGER NOT NULL DEFAULT 0 CHECK (completeness >= 0 AND completeness <= 100),
  status evidence_status NOT NULL DEFAULT 'Missing',
  audit_risk audit_risk_level NOT NULL DEFAULT 'Medium',
  missing_evidence JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  current_evidence JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_evidence_results_check ON ai_evidence_check_results(check_id);
CREATE INDEX idx_ai_evidence_results_control ON ai_evidence_check_results(control_id);

-- ============================================================================
-- AI FEATURES: Vendor Risk Assessments (Agentic)
-- ============================================================================

CREATE TYPE vendor_risk_level AS ENUM ('Critical', 'High', 'Medium', 'Low');

CREATE TABLE ai_vendor_assessments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_service TEXT,
  vendor_data_access TEXT,
  vendor_certifications JSONB DEFAULT '[]',
  vendor_sub_processors JSONB DEFAULT '[]',
  contract_terms TEXT,
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  risk_level vendor_risk_level NOT NULL DEFAULT 'Medium',
  due_diligence_items JSONB NOT NULL DEFAULT '[]',
  contract_red_flags JSONB NOT NULL DEFAULT '[]',
  ai_summary TEXT,
  assessment_scope TEXT[] DEFAULT '{}',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_vendor_assessments_org ON ai_vendor_assessments(organization_id);
CREATE INDEX idx_ai_vendor_assessments_risk ON ai_vendor_assessments(risk_level);

CREATE TABLE ai_vendor_agent_results (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  assessment_id TEXT NOT NULL REFERENCES ai_vendor_assessments(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  category TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  findings JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_vendor_agent_assessment ON ai_vendor_agent_results(assessment_id);

-- ============================================================================
-- AI FEATURES: Audit Simulations
-- ============================================================================

CREATE TYPE simulation_status AS ENUM ('draft', 'in_progress', 'completed', 'scored');

CREATE TABLE ai_audit_simulations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  control_domain TEXT NOT NULL,
  status simulation_status NOT NULL DEFAULT 'draft',
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  auditor_notes TEXT,
  next_steps JSONB DEFAULT '[]',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_audit_sims_org ON ai_audit_simulations(organization_id);
CREATE INDEX idx_ai_audit_sims_status ON ai_audit_simulations(status);

CREATE TABLE ai_audit_questions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  simulation_id TEXT NOT NULL REFERENCES ai_audit_simulations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  control_ref TEXT,
  difficulty TEXT NOT NULL DEFAULT 'Intermediate',
  expected_evidence JSONB DEFAULT '[]',
  scoring_criteria TEXT,
  user_answer TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_audit_questions_sim ON ai_audit_questions(simulation_id);

-- ============================================================================
-- AI FEATURES: Natural Language Queries
-- ============================================================================

CREATE TABLE ai_nl_queries (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 75 CHECK (confidence >= 0 AND confidence <= 100),
  sources JSONB DEFAULT '[]',
  related_questions JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  feedback TEXT CHECK (feedback IN ('up', 'down')),
  bookmarked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_nl_queries_org ON ai_nl_queries(organization_id);
CREATE INDEX idx_ai_nl_queries_user ON ai_nl_queries(user_id);
CREATE INDEX idx_ai_nl_queries_bookmarked ON ai_nl_queries(bookmarked) WHERE bookmarked = true;

-- ============================================================================
-- AI FEATURES: Copilot Conversations
-- ============================================================================

CREATE TABLE ai_copilot_conversations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT,
  context_view TEXT,
  context_framework TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_copilot_conv_org ON ai_copilot_conversations(organization_id);
CREATE INDEX idx_ai_copilot_conv_user ON ai_copilot_conversations(user_id);

CREATE TABLE ai_copilot_messages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  conversation_id TEXT NOT NULL REFERENCES ai_copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  confidence NUMERIC(3,2),
  sources JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  related_controls JSONB DEFAULT '[]',
  feedback TEXT CHECK (feedback IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_copilot_msgs_conv ON ai_copilot_messages(conversation_id);
CREATE INDEX idx_ai_copilot_msgs_role ON ai_copilot_messages(role);

-- ============================================================================
-- AI FEATURES: Compliance Score Forecasting
-- ============================================================================

CREATE TABLE ai_compliance_forecasts (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  current_score INTEGER NOT NULL CHECK (current_score >= 0 AND current_score <= 100),
  predicted_score_30d INTEGER CHECK (predicted_score_30d >= 0 AND predicted_score_30d <= 100),
  predicted_score_90d INTEGER CHECK (predicted_score_90d >= 0 AND predicted_score_90d <= 100),
  predicted_score_180d INTEGER CHECK (predicted_score_180d >= 0 AND predicted_score_180d <= 100),
  risk_factors JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  confidence INTEGER NOT NULL DEFAULT 75 CHECK (confidence >= 0 AND confidence <= 100),
  overall_trend TEXT NOT NULL DEFAULT 'Stable' CHECK (overall_trend IN ('Improving', 'Declining', 'Stable', 'At Risk')),
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_forecasts_org ON ai_compliance_forecasts(organization_id);
CREATE INDEX idx_ai_forecasts_framework ON ai_compliance_forecasts(framework);

CREATE TABLE ai_forecast_actions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  forecast_id TEXT NOT NULL REFERENCES ai_compliance_forecasts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  impact TEXT,
  urgency TEXT NOT NULL DEFAULT 'Short-term' CHECK (urgency IN ('Immediate', 'Short-term', 'Long-term')),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_forecast_actions_forecast ON ai_forecast_actions(forecast_id);

-- ============================================================================
-- FRAMEWORK CONTROL HIERARCHIES
-- ============================================================================

CREATE TABLE framework_definitions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  framework_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  regulation TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  effective_date DATE,
  categories JSONB NOT NULL DEFAULT '[]',
  total_controls INTEGER NOT NULL DEFAULT 0,
  total_articles INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_framework_defs_id ON framework_definitions(framework_id);

CREATE TABLE framework_articles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  framework_id TEXT NOT NULL REFERENCES framework_definitions(id) ON DELETE CASCADE,
  article_number TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  mandatory BOOLEAN NOT NULL DEFAULT true,
  effective_date DATE,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_framework_articles_fw ON framework_articles(framework_id);
CREATE INDEX idx_framework_articles_num ON framework_articles(article_number);

CREATE TYPE control_priority AS ENUM ('Critical', 'High', 'Medium', 'Low');
CREATE TYPE control_status_type AS ENUM ('required', 'recommended', 'guidance');

CREATE TABLE framework_controls_catalog (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  framework_id TEXT NOT NULL REFERENCES framework_definitions(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL,
  article_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority control_priority NOT NULL DEFAULT 'Medium',
  status control_status_type NOT NULL DEFAULT 'required',
  evidence_types JSONB NOT NULL DEFAULT '[]',
  implementation_guidance TEXT,
  assessment_criteria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fw_controls_catalog_fw ON framework_controls_catalog(framework_id);
CREATE INDEX idx_fw_controls_catalog_article ON framework_controls_catalog(article_ref);
CREATE INDEX idx_fw_controls_catalog_category ON framework_controls_catalog(category);
CREATE INDEX idx_fw_controls_catalog_priority ON framework_controls_catalog(priority);

-- Organization-specific control implementation tracking
CREATE TYPE control_impl_status AS ENUM ('not_started', 'in_progress', 'implemented', 'verified', 'not_applicable');

CREATE TABLE org_control_implementations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework_control_id TEXT NOT NULL REFERENCES framework_controls_catalog(id) ON DELETE CASCADE,
  status control_impl_status NOT NULL DEFAULT 'not_started',
  implementation_date TIMESTAMPTZ,
  verification_date TIMESTAMPTZ,
  evidence_ids TEXT[] DEFAULT '{}',
  notes TEXT,
  assigned_to TEXT REFERENCES users(id),
  reviewed_by TEXT REFERENCES users(id),
  risk_accepted BOOLEAN NOT NULL DEFAULT false,
  risk_acceptance_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, framework_control_id)
);

CREATE INDEX idx_org_ctrl_impl_org ON org_control_implementations(organization_id);
CREATE INDEX idx_org_ctrl_impl_status ON org_control_implementations(status);
CREATE INDEX idx_org_ctrl_impl_fw_ctrl ON org_control_implementations(framework_control_id);

-- ============================================================================
-- PROCESS MAPPER
-- ============================================================================

CREATE TYPE process_status AS ENUM ('Draft', 'In Review', 'Active', 'Deprecated');
CREATE TYPE process_category AS ENUM ('Business Operations', 'HR', 'Finance', 'IT', 'Legal', 'Compliance');
CREATE TYPE risk_level AS ENUM ('critical', 'high', 'medium', 'low', 'none');

CREATE TABLE process_maps (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category process_category NOT NULL DEFAULT 'Business Operations',
  version TEXT NOT NULL DEFAULT '1.0',
  status process_status NOT NULL DEFAULT 'Draft',
  owner TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_summary TEXT,
  last_modified TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_process_maps_org ON process_maps(organization_id);
CREATE INDEX idx_process_maps_status ON process_maps(status);

CREATE TABLE process_nodes (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  process_map_id TEXT NOT NULL REFERENCES process_maps(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('start', 'activity', 'decision', 'subprocess', 'end', 'dataStore', 'document')),
  label TEXT NOT NULL,
  description TEXT,
  x INTEGER NOT NULL DEFAULT 100,
  y INTEGER NOT NULL DEFAULT 200,
  risk_level risk_level NOT NULL DEFAULT 'none',
  compliance_tags JSONB DEFAULT '[]',
  controls JSONB DEFAULT '[]',
  data_flows JSONB DEFAULT '[]',
  owner TEXT,
  raci_r TEXT,
  raci_a TEXT,
  raci_c TEXT,
  raci_i TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_process_nodes_map ON process_nodes(process_map_id);

CREATE TABLE process_edges (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  process_map_id TEXT NOT NULL REFERENCES process_maps(id) ON DELETE CASCADE,
  from_node_id TEXT NOT NULL REFERENCES process_nodes(id) ON DELETE CASCADE,
  to_node_id TEXT NOT NULL REFERENCES process_nodes(id) ON DELETE CASCADE,
  label TEXT,
  condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_process_edges_map ON process_edges(process_map_id);
CREATE INDEX idx_process_edges_from ON process_edges(from_node_id);
CREATE INDEX idx_process_edges_to ON process_edges(to_node_id);

CREATE TABLE process_risks (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  process_map_id TEXT NOT NULL REFERENCES process_maps(id) ON DELETE CASCADE,
  node_id TEXT REFERENCES process_nodes(id) ON DELETE SET NULL,
  risk TEXT NOT NULL,
  severity risk_level NOT NULL DEFAULT 'medium',
  mitigation TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mitigated', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_process_risks_map ON process_risks(process_map_id);

-- ============================================================================
-- INTEGRATIONS (Enhanced OAuth)
-- ============================================================================

CREATE TABLE integrations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  provider TEXT NOT NULL,
  connected BOOLEAN NOT NULL DEFAULT false,
  auth_type TEXT NOT NULL DEFAULT 'api_key' CHECK (auth_type IN ('oauth2', 'api_key', 'pat', 'iam_role', 'service_account', 'username_password', 'api_key_secret')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_sync TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
  sync_error TEXT,
  config JSONB,
  scopes TEXT[] DEFAULT '{}',
  webhook_url TEXT,
  webhook_secret TEXT,
  last_health_check TIMESTAMPTZ,
  health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

CREATE INDEX idx_integrations_org ON integrations(organization_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_connected ON integrations(connected) WHERE connected = true;

CREATE TABLE integration_sync_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'error')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_sync_logs_int ON integration_sync_logs(integration_id);
CREATE INDEX idx_integration_sync_logs_date ON integration_sync_logs(created_at);

CREATE TABLE integration_credentials (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  key_id TEXT,
  rotation_due_at TIMESTAMPTZ,
  last_rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_creds_int ON integration_credentials(integration_id);

-- ============================================================================
-- EU REGULATION DASHBOARDS
-- ============================================================================

-- EU CRA Products
CREATE TYPE cra_product_class AS ENUM ('default', 'class_i', 'class_ii', 'critical');
CREATE TYPE cra_compliance_status AS ENUM ('compliant', 'in_progress', 'non_compliant', 'pending_review');

CREATE TABLE cra_products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_type TEXT,
  classification cra_product_class NOT NULL DEFAULT 'default',
  compliance_score INTEGER NOT NULL DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  compliance_status cra_compliance_status NOT NULL DEFAULT 'pending_review',
  sbom_available BOOLEAN NOT NULL DEFAULT false,
  sbom_format TEXT,
  ce_marking_applied BOOLEAN NOT NULL DEFAULT false,
  support_end_date DATE,
  last_vulnerability_scan TIMESTAMPTZ,
  vulnerability_count INTEGER NOT NULL DEFAULT 0,
  security_requirements JSONB DEFAULT '[]',
  enisa_notifications JSONB DEFAULT '[]',
  technical_documentation_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cra_products_org ON cra_products(organization_id);
CREATE INDEX idx_cra_products_class ON cra_products(classification);
CREATE INDEX idx_cra_products_status ON cra_products(compliance_status);

CREATE TABLE cra_vulnerabilities (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  product_id TEXT NOT NULL REFERENCES cra_products(id) ON DELETE CASCADE,
  cve_id TEXT,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  cvss_score NUMERIC(3,1),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'triaged', 'enisa_notified', 'patching', 'patched', 'disclosed')),
  reported_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  enisa_notified_date TIMESTAMPTZ,
  patch_released_date TIMESTAMPTZ,
  disclosure_date TIMESTAMPTZ,
  actively_exploited BOOLEAN NOT NULL DEFAULT false,
  affected_versions TEXT[] DEFAULT '{}',
  remediation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cra_vulns_product ON cra_vulnerabilities(product_id);
CREATE INDEX idx_cra_vulns_severity ON cra_vulnerabilities(severity);
CREATE INDEX idx_cra_vulns_status ON cra_vulnerabilities(status);

-- CSRD Reporting
CREATE TYPE materiality_level AS ENUM ('high', 'medium', 'low', 'not_material');

CREATE TABLE csrd_materiality_topics (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  esrs_standard TEXT NOT NULL,
  topic TEXT NOT NULL,
  financial_materiality materiality_level NOT NULL DEFAULT 'not_material',
  impact_materiality materiality_level NOT NULL DEFAULT 'not_material',
  overall_materiality materiality_level NOT NULL DEFAULT 'not_material',
  data_collection_status TEXT NOT NULL DEFAULT 'not_started' CHECK (data_collection_status IN ('not_started', 'in_progress', 'collected', 'verified')),
  description TEXT,
  stakeholder_input TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_csrd_materiality_org ON csrd_materiality_topics(organization_id);
CREATE INDEX idx_csrd_materiality_esrs ON csrd_materiality_topics(esrs_standard);

CREATE TABLE csrd_ghg_emissions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_year INTEGER NOT NULL,
  scope1_emissions NUMERIC(12,2),
  scope2_location_emissions NUMERIC(12,2),
  scope2_market_emissions NUMERIC(12,2),
  scope3_emissions NUMERIC(12,2),
  total_emissions NUMERIC(12,2),
  unit TEXT NOT NULL DEFAULT 'tCO2eq',
  baseline_year INTEGER,
  reduction_target_pct NUMERIC(5,2),
  reduction_achieved_pct NUMERIC(5,2),
  methodology TEXT,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'self_assessed', 'third_party_limited', 'third_party_reasonable')),
  verifier_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_csrd_ghg_org ON csrd_ghg_emissions(organization_id);
CREATE INDEX idx_csrd_ghg_year ON csrd_ghg_emissions(reporting_year);

-- Ecodesign Digital Product Passport
CREATE TABLE ecodesign_products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_category TEXT NOT NULL,
  gtin TEXT,
  serial_number TEXT,
  dpp_id TEXT UNIQUE,
  qr_code_url TEXT,
  manufacturer_name TEXT NOT NULL,
  manufacturing_country TEXT,
  energy_rating TEXT CHECK (energy_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  repairability_score NUMERIC(3,1) CHECK (repairability_score >= 0 AND repairability_score <= 10),
  recycled_content_pct NUMERIC(5,2) CHECK (recycled_content_pct >= 0 AND recycled_content_pct <= 100),
  expected_lifetime_years INTEGER,
  carbon_footprint_kg NUMERIC(10,2),
  water_footprint_liters NUMERIC(10,2),
  substances_of_concern JSONB DEFAULT '[]',
  lifecycle_data JSONB,
  conformity_declaration_url TEXT,
  dpp_status TEXT NOT NULL DEFAULT 'draft' CHECK (dpp_status IN ('draft', 'pending_review', 'approved', 'published', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ecodesign_products_org ON ecodesign_products(organization_id);
CREATE INDEX idx_ecodesign_products_dpp ON ecodesign_products(dpp_id);
CREATE INDEX idx_ecodesign_products_category ON ecodesign_products(product_category);

-- NIS2 Compliance
CREATE TYPE entity_classification AS ENUM ('essential', 'important');

CREATE TABLE nis2_entities (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  classification entity_classification NOT NULL DEFAULT 'important',
  member_state TEXT NOT NULL,
  competent_authority TEXT,
  registration_date TIMESTAMPTZ,
  compliance_score INTEGER NOT NULL DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nis2_entities_org ON nis2_entities(organization_id);

CREATE TABLE nis2_security_measures (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  entity_id TEXT NOT NULL REFERENCES nis2_entities(id) ON DELETE CASCADE,
  article_21_ref TEXT NOT NULL,
  measure TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'implemented', 'verified')),
  implementation_date TIMESTAMPTZ,
  evidence JSONB DEFAULT '[]',
  responsible TEXT,
  review_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nis2_measures_entity ON nis2_security_measures(entity_id);
CREATE INDEX idx_nis2_measures_status ON nis2_security_measures(status);

CREATE TABLE nis2_incidents (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  entity_id TEXT NOT NULL REFERENCES nis2_entities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description TEXT,
  detected_at TIMESTAMPTZ NOT NULL,
  early_warning_deadline TIMESTAMPTZ NOT NULL,
  early_warning_sent BOOLEAN NOT NULL DEFAULT false,
  notification_deadline TIMESTAMPTZ NOT NULL,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  final_report_deadline TIMESTAMPTZ NOT NULL,
  final_report_sent BOOLEAN NOT NULL DEFAULT false,
  cross_border BOOLEAN NOT NULL DEFAULT false,
  affected_services TEXT[] DEFAULT '{}',
  root_cause TEXT,
  remediation TEXT,
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'early_warning_sent', 'notified', 'investigating', 'contained', 'resolved', 'final_report_submitted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nis2_incidents_entity ON nis2_incidents(entity_id);
CREATE INDEX idx_nis2_incidents_status ON nis2_incidents(status);

-- ============================================================================
-- INTER-MODULE DATA SYNC
-- ============================================================================

-- SBOM feeds into decommissioning and vulnerability tracking
CREATE TABLE sbom_entries (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  component_name TEXT NOT NULL,
  component_version TEXT NOT NULL,
  component_type TEXT NOT NULL DEFAULT 'library',
  license TEXT,
  supplier TEXT,
  purl TEXT,
  cpe TEXT,
  known_vulnerabilities JSONB DEFAULT '[]',
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  last_scanned TIMESTAMPTZ,
  sbom_format TEXT DEFAULT 'CycloneDX',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sbom_entries_org ON sbom_entries(organization_id);
CREATE INDEX idx_sbom_entries_product ON sbom_entries(product_id);
CREATE INDEX idx_sbom_entries_component ON sbom_entries(component_name);

-- AI Request Logging (for billing and audit)
CREATE TABLE ai_request_log (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  feature TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_request_log_org ON ai_request_log(organization_id);
CREATE INDEX idx_ai_request_log_user ON ai_request_log(user_id);
CREATE INDEX idx_ai_request_log_feature ON ai_request_log(feature);
CREATE INDEX idx_ai_request_log_date ON ai_request_log(created_at);

-- ============================================================================
-- BREACH NOTIFICATION WIZARD
-- ============================================================================

CREATE TYPE breach_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE breach_status AS ENUM ('detected', 'assessed', 'authority_notified', 'subjects_notified', 'contained', 'resolved', 'closed');

CREATE TABLE breach_incidents (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity breach_severity NOT NULL DEFAULT 'medium',
  status breach_status NOT NULL DEFAULT 'detected',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_types_affected TEXT[] DEFAULT '{}',
  subjects_affected_count INTEGER DEFAULT 0,
  jurisdictions TEXT[] DEFAULT '{}',
  authority_notification_deadline TIMESTAMPTZ,
  authority_notified_at TIMESTAMPTZ,
  subject_notification_deadline TIMESTAMPTZ,
  subjects_notified_at TIMESTAMPTZ,
  root_cause TEXT,
  containment_actions JSONB DEFAULT '[]',
  remediation_actions JSONB DEFAULT '[]',
  lessons_learned TEXT,
  reported_by TEXT REFERENCES users(id),
  assigned_to TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_breach_incidents_org ON breach_incidents(organization_id);
CREATE INDEX idx_breach_incidents_status ON breach_incidents(status);
CREATE INDEX idx_breach_incidents_severity ON breach_incidents(severity);

-- ============================================================================
-- GOVERNANCE MANAGER
-- ============================================================================

CREATE TABLE governance_bodies (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  body_type TEXT NOT NULL CHECK (body_type IN ('board', 'committee', 'working_group', 'advisory')),
  charter TEXT,
  meeting_frequency TEXT,
  members JSONB DEFAULT '[]',
  responsibilities JSONB DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_governance_bodies_org ON governance_bodies(organization_id);

CREATE TABLE governance_roles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  role_type TEXT NOT NULL CHECK (role_type IN ('dpo', 'ciso', 'cco', 'privacy_officer', 'risk_officer', 'audit_lead', 'custom')),
  assigned_to TEXT REFERENCES users(id),
  responsibilities TEXT[] DEFAULT '{}',
  regulatory_basis TEXT,
  appointment_date TIMESTAMPTZ,
  review_date TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_governance_roles_org ON governance_roles(organization_id);
CREATE INDEX idx_governance_roles_type ON governance_roles(role_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mapping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_remediation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_evidence_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_evidence_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_vendor_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_vendor_agent_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_nl_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_compliance_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_forecast_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_controls_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_control_implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE cra_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cra_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE csrd_materiality_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE csrd_ghg_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecodesign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_security_measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbom_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE breach_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their organization's data
-- Helper function to get the current user's organization
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS TEXT AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()::text
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organization-scoped read policies
CREATE POLICY "Users can read own org" ON organizations
  FOR SELECT USING (id = auth.user_org_id());

CREATE POLICY "Users can read own org users" ON users
  FOR SELECT USING (organization_id = auth.user_org_id());

-- Generic org-scoped policy macro (applied to all feature tables)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'ai_mapping_sessions', 'ai_remediation_plans', 'ai_evidence_checks',
      'ai_vendor_assessments', 'ai_audit_simulations', 'ai_nl_queries',
      'ai_copilot_conversations', 'ai_compliance_forecasts',
      'org_control_implementations', 'process_maps',
      'integrations', 'cra_products', 'csrd_materiality_topics',
      'csrd_ghg_emissions', 'ecodesign_products', 'nis2_entities',
      'sbom_entries', 'ai_request_log', 'breach_incidents',
      'governance_bodies', 'governance_roles'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "org_read_%1$s" ON %1$s FOR SELECT USING (organization_id = auth.user_org_id())',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_insert_%1$s" ON %1$s FOR INSERT WITH CHECK (organization_id = auth.user_org_id())',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_update_%1$s" ON %1$s FOR UPDATE USING (organization_id = auth.user_org_id())',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_delete_%1$s" ON %1$s FOR DELETE USING (organization_id = auth.user_org_id())',
      tbl
    );
  END LOOP;
END
$$;

-- Framework definitions and controls catalog are public read (shared reference data)
CREATE POLICY "Anyone can read framework defs" ON framework_definitions
  FOR SELECT USING (true);
CREATE POLICY "Anyone can read framework articles" ON framework_articles
  FOR SELECT USING (true);
CREATE POLICY "Anyone can read framework controls" ON framework_controls_catalog
  FOR SELECT USING (true);

-- Child table policies (access through parent relationship)
CREATE POLICY "org_read_ai_control_mappings" ON ai_control_mappings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ai_mapping_sessions s WHERE s.id = session_id AND s.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_ai_evidence_results" ON ai_evidence_check_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ai_evidence_checks c WHERE c.id = check_id AND c.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_ai_vendor_agents" ON ai_vendor_agent_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ai_vendor_assessments a WHERE a.id = assessment_id AND a.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_audit_questions" ON ai_audit_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ai_audit_simulations s WHERE s.id = simulation_id AND s.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_copilot_messages" ON ai_copilot_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ai_copilot_conversations c WHERE c.id = conversation_id AND c.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_forecast_actions" ON ai_forecast_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ai_compliance_forecasts f WHERE f.id = forecast_id AND f.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_process_nodes" ON process_nodes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM process_maps m WHERE m.id = process_map_id AND m.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_process_edges" ON process_edges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM process_maps m WHERE m.id = process_map_id AND m.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_process_risks" ON process_risks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM process_maps m WHERE m.id = process_map_id AND m.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_integration_sync" ON integration_sync_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM integrations i WHERE i.id = integration_id AND i.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_integration_creds" ON integration_credentials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM integrations i WHERE i.id = integration_id AND i.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_cra_vulns" ON cra_vulnerabilities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cra_products p WHERE p.id = product_id AND p.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_nis2_measures" ON nis2_security_measures
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM nis2_entities e WHERE e.id = entity_id AND e.organization_id = auth.user_org_id())
  );

CREATE POLICY "org_read_nis2_incidents" ON nis2_incidents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM nis2_entities e WHERE e.id = entity_id AND e.organization_id = auth.user_org_id())
  );

-- ============================================================================
-- SEED DATA: Framework Definitions
-- ============================================================================

INSERT INTO framework_definitions (framework_id, name, regulation, jurisdiction, effective_date, total_controls, total_articles, categories)
VALUES
  ('eu-cra', 'EU Cyber Resilience Act', 'Regulation (EU) 2024/2847', 'EU', '2024-12-10', 24, 14, '["Product Security Requirements","Vulnerability Handling","Manufacturer Obligations","Conformity Assessment","Market Surveillance","Documentation & Transparency","Supply Chain Security","Incident Reporting"]'::jsonb),
  ('csrd', 'Corporate Sustainability Reporting Directive', 'Directive (EU) 2022/2464 + ESRS', 'EU', '2024-01-01', 21, 5, '["General Disclosures (ESRS 2)","Climate Change (ESRS E1)","Pollution (ESRS E2)","Water & Marine Resources (ESRS E3)","Biodiversity & Ecosystems (ESRS E4)","Resource Use & Circular Economy (ESRS E5)","Own Workforce (ESRS S1)","Workers in Value Chain (ESRS S2)","Affected Communities (ESRS S3)","Consumers & End-Users (ESRS S4)","Business Conduct (ESRS G1)","Double Materiality Assessment","Assurance & Reporting"]'::jsonb),
  ('ecodesign', 'Ecodesign for Sustainable Products', 'Regulation (EU) 2024/1781 (ESPR)', 'EU', '2024-07-18', 16, 8, '["Product Performance Requirements","Digital Product Passport (DPP)","Substance Restrictions","Durability & Repairability","Energy Efficiency","Recycled Content & End-of-Life","Environmental Footprint","Supply Chain Transparency","Conformity Assessment","Market Surveillance"]'::jsonb),
  ('nis2', 'NIS2 Directive', 'Directive (EU) 2022/2555', 'EU', '2024-10-18', 15, 6, '["Risk Management Measures (Art. 21)","Incident Reporting (Art. 23-24)","Supply Chain Security","Management Accountability (Art. 20)","Registration & Notification","Cross-Border Cooperation","Sector-Specific Requirements"]'::jsonb);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'organizations', 'users', 'ai_mapping_sessions', 'ai_remediation_plans',
      'ai_vendor_assessments', 'ai_audit_simulations', 'ai_copilot_conversations',
      'org_control_implementations', 'process_maps', 'integrations',
      'integration_credentials', 'cra_products', 'csrd_materiality_topics',
      'csrd_ghg_emissions', 'ecodesign_products', 'nis2_entities',
      'nis2_security_measures', 'nis2_incidents', 'sbom_entries',
      'breach_incidents', 'governance_bodies', 'framework_definitions',
      'framework_controls_catalog'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON %1$s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      tbl
    );
  END LOOP;
END
$$;
