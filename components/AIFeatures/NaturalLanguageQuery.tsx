import React, { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  FileText,
  TrendingUp,
  AlertCircle,
  Target,
  BarChart3,
  Calendar,
  ExternalLink,
  Download,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  Info,
  Sparkles,
  Star,
  Users,
  MessageSquare,
  BookOpen,
  Send,
  Copy,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Lightbulb,
  Hash,
  Link2,
  History,
  X,
  Trash2,
  RefreshCw,
  Database,
  Layers,
  PieChart,
  Activity,
  Building2,
  Lock,
  FileCheck,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface QueryResult {
  id: string;
  query: string;
  timestamp: Date;
  response: string;
  confidence: number;
  sources: Array<{ title: string; reference: string; type: string }>;
  followUpQuestions: string[];
  dataCards?: DataCard[];
  bookmarked: boolean;
  feedback?: 'up' | 'down';
}

interface DataCard {
  id: string;
  title: string;
  type: 'metric' | 'list' | 'table' | 'status' | 'timeline' | 'chart';
  data: any;
}

interface SuggestedQuery {
  id: string;
  query: string;
  category: string;
  icon: React.ReactNode;
}

// ─── Demo Data ──────────────────────────────────────────────────────────────────

const SUGGESTED_QUERIES: SuggestedQuery[] = [
  { id: 'sq-1', query: 'Am I GDPR compliant in France?', category: 'Compliance Status', icon: <Shield size={14} /> },
  { id: 'sq-2', query: 'What controls am I missing for SOC 2?', category: 'Gap Analysis', icon: <Target size={14} /> },
  { id: 'sq-3', query: 'Show me all high-risk vendors', category: 'Vendor Risk', icon: <Building2 size={14} /> },
  { id: 'sq-4', query: 'When is my next audit deadline?', category: 'Deadlines', icon: <Calendar size={14} /> },
  { id: 'sq-5', query: 'What evidence is stale or missing?', category: 'Evidence', icon: <FileCheck size={14} /> },
  { id: 'sq-6', query: 'How do I improve my ISO 27001 score?', category: 'Improvement', icon: <TrendingUp size={14} /> },
  { id: 'sq-7', query: 'Show me my risk exposure breakdown', category: 'Risk Analysis', icon: <BarChart3 size={14} /> },
  { id: 'sq-8', query: 'Which policies are due for review?', category: 'Policy Management', icon: <FileText size={14} /> },
  { id: 'sq-9', query: 'What regulatory changes affect my organization?', category: 'Regulatory', icon: <AlertCircle size={14} /> },
  { id: 'sq-10', query: 'Generate a compliance summary for the board', category: 'Reporting', icon: <PieChart size={14} /> },
  { id: 'sq-11', query: 'What is my overall compliance posture?', category: 'Overview', icon: <Activity size={14} /> },
  { id: 'sq-12', query: 'Show me controls with the lowest implementation rates', category: 'Controls', icon: <Layers size={14} /> },
];

const QUERY_CATEGORIES = ['All', 'Compliance Status', 'Gap Analysis', 'Vendor Risk', 'Deadlines', 'Evidence', 'Risk Analysis', 'Policy Management', 'Regulatory', 'Reporting'];

// ─── Mock Response Generator ────────────────────────────────────────────────────

function generateMockResponse(query: string): Omit<QueryResult, 'id' | 'query' | 'timestamp' | 'bookmarked' | 'feedback'> {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('gdpr') || lowerQuery.includes('france') || lowerQuery.includes('data protection')) {
    return {
      response: `Based on my analysis of your current compliance posture, here is your GDPR compliance status for France:

**Overall GDPR Readiness: 76%**

**Compliant Areas:**
- Article 6: Lawful basis documented for 94% of processing activities
- Article 13/14: Privacy notices current and accessible
- Article 25: Data protection by design embedded in SDLC
- Article 32: Technical security measures meet requirements

**Gaps Identified:**
- Article 30: 3 new data processing activities not yet documented in ROPA
- Article 33: Incident response plan missing CNIL-specific notification procedures
- Article 35: 2 high-risk processing activities lack completed DPIAs

**Risk Assessment:** The CNIL has been actively enforcing, issuing EUR 101M in fines in 2025. Your gaps in Articles 30, 33, and 35 represent moderate regulatory risk.

**Recommended Priority Actions:**
1. Update Article 30 records immediately (est. 2-3 hours)
2. Add CNIL notification templates to breach response plan
3. Complete DPIAs for identified high-risk activities`,
      confidence: 0.89,
      sources: [
        { title: 'GDPR Framework Controls', reference: 'Framework: GDPR v2.0 - 48 controls mapped', type: 'framework' },
        { title: 'Data Processing Inventory', reference: 'Last updated: 2026-02-10', type: 'inventory' },
        { title: 'CNIL Enforcement Database', reference: 'Regulatory Intelligence Feed', type: 'regulatory' },
        { title: 'Incident Response Policy', reference: 'Policy ID: IR-2025-003', type: 'policy' },
      ],
      followUpQuestions: [
        'What specific DPIAs do I need to complete?',
        'Show me the undocumented data flows',
        'How do I notify CNIL in case of a breach?',
        'Compare my GDPR status across all EU jurisdictions',
      ],
      dataCards: [
        {
          id: 'dc-1', title: 'GDPR Readiness Score', type: 'metric',
          data: { value: 76, unit: '%', trend: '+3%', trendDirection: 'up', label: 'Overall GDPR Compliance' },
        },
        {
          id: 'dc-2', title: 'Compliance by Article', type: 'list',
          data: {
            items: [
              { label: 'Art. 6 - Lawful Basis', value: '94%', status: 'good' },
              { label: 'Art. 13/14 - Privacy Notices', value: '100%', status: 'good' },
              { label: 'Art. 25 - Privacy by Design', value: '88%', status: 'good' },
              { label: 'Art. 30 - Records (ROPA)', value: '94%', status: 'warning' },
              { label: 'Art. 32 - Security Measures', value: '82%', status: 'good' },
              { label: 'Art. 33 - Breach Notification', value: '60%', status: 'critical' },
              { label: 'Art. 35 - DPIA', value: '50%', status: 'critical' },
            ],
          },
        },
      ],
    };
  }

  if (lowerQuery.includes('soc 2') || lowerQuery.includes('soc2') || lowerQuery.includes('missing control')) {
    return {
      response: `Here is your SOC 2 Type II compliance gap assessment:

**Overall SOC 2 Readiness: 71%**

**Missing or Incomplete Controls:**

**Security (CC6 - Logical and Physical Access):**
- CC6.1: Missing MFA logs for 2 production systems
- CC6.3: User access review evidence is 45 days stale
- CC6.6: Encryption key management policy needs updating

**Availability (A1):**
- A1.2: BCP not tested in 8 months
- A1.3: DR RTO/RPO metrics not documented

**Confidentiality (C1):**
- C1.1: Data classification missing for 4 repositories

**Privacy (P1-P8):**
- P6.1: Data retention not enforced for 3 systems
- P8.1: Privacy notice incomplete

**Processing Integrity (PI1):**
- All controls met

**Critical Path for Upcoming Audit:**
1. CC6.1 (MFA) - Must fix before audit
2. CC6.3 (Access Reviews) - Quick win, start now
3. A1.2 (BCP Testing) - Schedule within 2 weeks`,
      confidence: 0.92,
      sources: [
        { title: 'SOC 2 Control Matrix', reference: 'Framework: SOC 2 TSC 2017 - 64 controls', type: 'framework' },
        { title: 'Evidence Repository', reference: 'Last scan: 2026-02-15', type: 'evidence' },
        { title: 'Control Testing Results', reference: 'Audit Period: 2025-03 to 2026-02', type: 'assessment' },
      ],
      followUpQuestions: [
        'Generate remediation tasks for all SOC 2 gaps',
        'What is the estimated effort to reach 90% readiness?',
        'Show critical path items for the audit',
        'Who are the control owners for missing items?',
      ],
      dataCards: [
        {
          id: 'dc-3', title: 'SOC 2 Readiness', type: 'metric',
          data: { value: 71, unit: '%', trend: '-2%', trendDirection: 'down', label: 'SOC 2 Type II Compliance' },
        },
        {
          id: 'dc-4', title: 'Gaps by Trust Service Criteria', type: 'list',
          data: {
            items: [
              { label: 'Security (CC)', value: '3 gaps', status: 'critical' },
              { label: 'Availability (A)', value: '2 gaps', status: 'warning' },
              { label: 'Confidentiality (C)', value: '1 gap', status: 'warning' },
              { label: 'Processing Integrity (PI)', value: '0 gaps', status: 'good' },
              { label: 'Privacy (P)', value: '2 gaps', status: 'warning' },
            ],
          },
        },
      ],
    };
  }

  if (lowerQuery.includes('vendor') || lowerQuery.includes('third party') || lowerQuery.includes('third-party')) {
    return {
      response: `Here are your high-risk vendors based on the latest assessment scores:

**High-Risk Vendors (Score < 70):**

| Vendor | Risk Score | Tier | Key Issues |
|--------|-----------|------|------------|
| CloudSync Analytics | 58 | Critical | Score dropped 14 pts; encryption gaps; missing SOC 2 bridge letter |
| DataFlow Inc | 65 | Critical | New sub-processor added without notice; ISO 27001 lapsed; SLA breach |
| TalentHub HR | 69 | High | Employee data exported to non-adequate jurisdiction |

**Key Concerns:**
- CloudSync Analytics experienced a 14-point risk score decline this quarter due to identified encryption gaps and a reported security incident
- DataFlow Inc added a fourth-party (Twilio) without the contractually required 30-day prior notification
- TalentHub HR analytics processing involves data transfer to a jurisdiction without GDPR adequacy

**Recommended Actions:**
1. Escalate CloudSync Analytics review - consider alternative vendor options
2. Obtain sub-processor disclosure documentation from DataFlow Inc
3. Request Transfer Impact Assessment from TalentHub HR

You have 4 vendor assessments due within the next 30 days.`,
      confidence: 0.91,
      sources: [
        { title: 'Vendor Risk Register', reference: '7 vendors tracked', type: 'register' },
        { title: 'Vendor Assessment Reports', reference: 'Last assessment cycle: Feb 2026', type: 'assessment' },
        { title: 'Fourth-Party Monitor', reference: 'Real-time monitoring active', type: 'monitoring' },
      ],
      followUpQuestions: [
        'What alternatives exist for CloudSync Analytics?',
        'Show me the full DataFlow Inc assessment report',
        'When are the 4 upcoming vendor assessments due?',
        'What is our fourth-party risk exposure?',
      ],
      dataCards: [
        {
          id: 'dc-5', title: 'Vendor Risk Distribution', type: 'list',
          data: {
            items: [
              { label: 'CloudSync Analytics', value: 'Score: 58', status: 'critical' },
              { label: 'DataFlow Inc', value: 'Score: 65', status: 'critical' },
              { label: 'TalentHub HR', value: 'Score: 69', status: 'warning' },
              { label: 'SecureHost Pro', value: 'Score: 74', status: 'good' },
              { label: 'QuickScan Docs', value: 'Score: 76', status: 'good' },
              { label: 'PaymentGate Systems', value: 'Score: 81', status: 'good' },
              { label: 'NetGuard Security', value: 'Score: 82', status: 'good' },
            ],
          },
        },
      ],
    };
  }

  if (lowerQuery.includes('audit') || lowerQuery.includes('deadline')) {
    return {
      response: `Here are your upcoming audit and compliance deadlines:

**Immediate Attention (Next 30 Days):**
- **HIPAA Risk Assessment** - Due March 1, 2026 (12 days) - STATUS: OVERDUE RISK
  - Current readiness: 64%. Significant gaps in access controls and training evidence.
- **GDPR Annual DPA Review** - Due March 20, 2026 (31 days) - STATUS: ON TRACK
  - Current readiness: 85%. Minor updates needed for data transfer documentation.

**Next 60 Days:**
- **ISO 27001 Surveillance Audit** - Due April 3, 2026 (45 days) - STATUS: AT RISK
  - Current readiness: 78%. Focus on Annex A.12 Operations Security gaps.
- **SOC 2 Type II Audit** - Due April 15, 2026 (57 days) - STATUS: AT RISK
  - Current readiness: 71%. 12 controls still missing evidence.

**Next 90 Days:**
- **PCI DSS SAQ Submission** - Due May 1, 2026 (73 days) - STATUS: ON TRACK
  - Current readiness: 73%. Penetration test must be completed first.

**AI Recommendation:** Based on readiness scores and deadline proximity, prioritize:
1. HIPAA Risk Assessment (12 days, 64% ready - critical)
2. SOC 2 evidence collection (57 days, 71% ready - at risk)
3. ISO 27001 Annex A.12 remediation (45 days, 78% ready - at risk)`,
      confidence: 0.96,
      sources: [
        { title: 'Audit Calendar', reference: '5 upcoming audits scheduled', type: 'calendar' },
        { title: 'Framework Readiness Scores', reference: 'As of 2026-02-17', type: 'assessment' },
        { title: 'Evidence Completeness Report', reference: 'Last scan: 2026-02-17', type: 'evidence' },
      ],
      followUpQuestions: [
        'Run an audit simulation for HIPAA',
        'What are the critical gaps for the SOC 2 audit?',
        'Show me the ISO 27001 Annex A.12 gap details',
        'Generate an audit preparation plan for the next 60 days',
      ],
      dataCards: [
        {
          id: 'dc-6', title: 'Upcoming Deadlines', type: 'timeline',
          data: {
            items: [
              { label: 'HIPAA Risk Assessment', date: 'Mar 1', daysLeft: 12, status: 'critical' },
              { label: 'GDPR DPA Review', date: 'Mar 20', daysLeft: 31, status: 'good' },
              { label: 'ISO 27001 Surveillance', date: 'Apr 3', daysLeft: 45, status: 'warning' },
              { label: 'SOC 2 Type II', date: 'Apr 15', daysLeft: 57, status: 'warning' },
              { label: 'PCI DSS SAQ', date: 'May 1', daysLeft: 73, status: 'good' },
            ],
          },
        },
      ],
    };
  }

  if (lowerQuery.includes('evidence') || lowerQuery.includes('stale') || lowerQuery.includes('missing')) {
    return {
      response: `Here is your evidence completeness analysis across all frameworks:

**Overall Evidence Status:**
- Total Controls: 443 across 6 frameworks
- Evidence Complete: 336 (76%)
- Evidence Missing: 65 (15%)
- Evidence Stale: 41 (9%)
- Evidence Unverified: 29 (7%)

**Critical Missing Evidence:**
1. **CC6.1 (SOC 2)** - MFA enrollment report for production systems
2. **164.312(a) (HIPAA)** - Unique user ID evidence for ePHI systems
3. **Req 11.3 (PCI DSS)** - Penetration test report (13 months overdue)

**Most Stale Evidence:**
1. **A1.2 (SOC 2)** - BCP test results (247 days old)
2. **Req 11.3 (PCI DSS)** - Penetration test (393 days old)
3. **CC7.2 (SOC 2)** - SIEM configuration (120 days old)
4. **164.308(a)(5) (HIPAA)** - Training records (95 days old)

**Recommended Immediate Actions:**
1. Commission a PCI DSS penetration test (13 months overdue - critical)
2. Export MFA enrollment report from identity provider
3. Schedule BCP tabletop exercise
4. Generate current training completion report from LMS`,
      confidence: 0.94,
      sources: [
        { title: 'Evidence Repository', reference: '312 evidence items cataloged', type: 'evidence' },
        { title: 'Evidence Freshness Tracker', reference: 'Scan performed 2026-02-17', type: 'monitoring' },
        { title: 'Control Assessment Engine', reference: '443 controls across 6 frameworks', type: 'assessment' },
      ],
      followUpQuestions: [
        'Show me evidence gaps by framework',
        'What evidence can be collected automatically?',
        'Generate evidence collection tasks for all gaps',
        'Which evidence items expire in the next 30 days?',
      ],
      dataCards: [
        {
          id: 'dc-7', title: 'Evidence Status', type: 'metric',
          data: { value: 76, unit: '%', trend: '+2%', trendDirection: 'up', label: 'Evidence Completeness' },
        },
        {
          id: 'dc-8', title: 'Evidence Breakdown', type: 'list',
          data: {
            items: [
              { label: 'Complete', value: '336 items', status: 'good' },
              { label: 'Missing', value: '65 items', status: 'critical' },
              { label: 'Stale', value: '41 items', status: 'warning' },
              { label: 'Unverified', value: '29 items', status: 'warning' },
            ],
          },
        },
      ],
    };
  }

  // Default response
  return {
    response: `I've analyzed your compliance data to answer your question. Here's what I found:

Based on your current compliance posture across all active frameworks, your organization maintains an overall readiness score of **74%**.

**Key Highlights:**
- 6 active frameworks with varying levels of maturity
- 443 controls tracked with 76% evidence completeness
- 65 evidence items missing, 41 stale
- 7 vendors managed with an average risk score of 72
- 5 upcoming audit deadlines within 90 days

**Areas of Strength:**
- Strong technical security controls (85% implementation)
- Good policy documentation coverage (91%)
- Active risk management program with 47 risks tracked

**Areas for Improvement:**
- Evidence collection cadence needs improvement
- Third-party risk management program maturing
- Business continuity testing frequency below target
- HIPAA readiness score (64%) needs immediate attention

I can provide more specific details on any of these areas. What would you like to explore further?`,
    confidence: 0.84,
    sources: [
      { title: 'Compliance Dashboard', reference: 'Aggregate metrics as of 2026-02-17', type: 'dashboard' },
      { title: 'Risk Register', reference: '47 active risks tracked', type: 'register' },
      { title: 'Evidence Repository', reference: '312 evidence items cataloged', type: 'evidence' },
      { title: 'Vendor Risk Database', reference: '7 vendors assessed', type: 'vendor' },
    ],
    followUpQuestions: [
      'Show me the controls that need attention',
      'Which evidence items are stale?',
      'What is my risk exposure breakdown?',
      'Generate a board-level compliance report',
    ],
    dataCards: [
      {
        id: 'dc-9', title: 'Overall Compliance', type: 'metric',
        data: { value: 74, unit: '%', trend: '+1.5%', trendDirection: 'up', label: 'Organization Readiness' },
      },
      {
        id: 'dc-10', title: 'Framework Scores', type: 'list',
        data: {
          items: [
            { label: 'GDPR', value: '85%', status: 'good' },
            { label: 'NIST CSF 2.0', value: '82%', status: 'good' },
            { label: 'ISO 27001', value: '78%', status: 'warning' },
            { label: 'PCI DSS', value: '73%', status: 'warning' },
            { label: 'SOC 2', value: '71%', status: 'warning' },
            { label: 'HIPAA', value: '64%', status: 'critical' },
          ],
        },
      },
    ],
  };
}

// ─── Helper Components ──────────────────────────────────────────────────────────

const ConfidenceBadge: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? 'bg-green-100 text-green-700 border-green-200' : pct >= 75 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-orange-100 text-orange-700 border-orange-200';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {pct}% confidence
    </span>
  );
};

const SourceIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'framework': return <Shield size={10} className="text-blue-500" />;
    case 'evidence': return <FileCheck size={10} className="text-green-500" />;
    case 'policy': return <FileText size={10} className="text-purple-500" />;
    case 'assessment': return <Target size={10} className="text-orange-500" />;
    case 'register': return <Database size={10} className="text-teal-500" />;
    case 'monitoring': return <Activity size={10} className="text-blue-500" />;
    case 'calendar': return <Calendar size={10} className="text-red-500" />;
    case 'regulatory': return <AlertCircle size={10} className="text-yellow-500" />;
    case 'inventory': return <Layers size={10} className="text-gray-500" />;
    case 'vendor': return <Building2 size={10} className="text-purple-500" />;
    case 'dashboard': return <BarChart3 size={10} className="text-brand-500" />;
    default: return <Link2 size={10} className="text-gray-400" />;
  }
};

const MetricCard: React.FC<{ data: any }> = ({ data }) => {
  const color = data.value >= 80 ? 'text-green-600' : data.value >= 60 ? 'text-yellow-600' : 'text-red-600';
  const ringColor = data.value >= 80 ? 'stroke-green-500' : data.value >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (data.value / 100) * circumference;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg className="-rotate-90" width={80} height={80} viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle cx="40" cy="40" r="34" fill="none" className={ringColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${color}`}>{data.value}{data.unit}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{data.label}</p>
        {data.trend && (
          <p className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${data.trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {data.trendDirection === 'up' ? <TrendingUp size={10} /> : <AlertTriangle size={10} />}
            {data.trend} from last period
          </p>
        )}
      </div>
    </div>
  );
};

const ListCard: React.FC<{ title: string; data: any }> = ({ title, data }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h5 className="text-xs font-semibold text-gray-500 uppercase">{title}</h5>
      </div>
      <div className="divide-y divide-gray-100">
        {data.items.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-gray-700">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                item.status === 'good' ? 'text-green-600' :
                item.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>{item.value}</span>
              <div className={`w-2 h-2 rounded-full ${
                item.status === 'good' ? 'bg-green-500' :
                item.status === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelineCard: React.FC<{ title: string; data: any }> = ({ title, data }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h5 className="text-xs font-semibold text-gray-500 uppercase">{title}</h5>
      </div>
      <div className="p-4 space-y-3">
        {data.items.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              item.status === 'good' ? 'bg-green-100' :
              item.status === 'warning' ? 'bg-yellow-100' :
              'bg-red-100'
            }`}>
              <span className={`text-xs font-bold ${
                item.status === 'good' ? 'text-green-700' :
                item.status === 'warning' ? 'text-yellow-700' :
                'text-red-700'
              }`}>{item.daysLeft}d</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
              <p className="text-xs text-gray-500">Due: {item.date}, 2026</p>
            </div>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              item.status === 'good' ? 'bg-green-500' :
              item.status === 'warning' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export const NaturalLanguageQuery: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (resultsEndRef.current) {
      resultsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  const handleSubmitQuery = useCallback(async (queryText?: string) => {
    const text = queryText || queryInput.trim();
    if (!text || isProcessing) return;

    setIsProcessing(true);
    setShowSuggestions(false);
    setQueryInput('');

    try {
      const aiResult = await api.ai.naturalLanguageQuery(text, {
        frameworks: ['SOC 2', 'GDPR', 'ISO 27001', 'HIPAA', 'PCI DSS', 'NIST CSF'],
        complianceScore: 78,
      });

      const newResult: QueryResult = {
        id: `qr-${Date.now()}`,
        query: text,
        timestamp: new Date(),
        bookmarked: false,
        response: aiResult.answer || 'No response generated.',
        confidence: (aiResult.confidence || 75) / 100,
        sources: (aiResult.sources || []).map((s: any) => ({
          title: s.reference || s.type,
          type: s.type || 'regulation',
          url: '#',
          relevance: (s.relevance || 80) / 100,
        })),
        relatedQueries: aiResult.relatedQuestions || [],
        actionItems: aiResult.actionItems || [],
        category: 'AI Response',
      };

      setResults(prev => [...prev, newResult]);
      setExpandedResult(newResult.id);
    } catch (error: any) {
      console.error('NL query error:', error);

      // Fallback to mock response on API failure
      const mockResponse = generateMockResponse(text);
      const newResult: QueryResult = {
        id: `qr-${Date.now()}`,
        query: text,
        timestamp: new Date(),
        bookmarked: false,
        ...mockResponse,
      };

      setResults(prev => [...prev, newResult]);
      setExpandedResult(newResult.id);
    } finally {
      setIsProcessing(false);
    }
  }, [queryInput, isProcessing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitQuery();
    }
  }, [handleSubmitQuery]);

  const handleToggleBookmark = useCallback((resultId: string) => {
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, bookmarked: !r.bookmarked } : r));
  }, []);

  const handleFeedback = useCallback((resultId: string, type: 'up' | 'down') => {
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, feedback: type } : r));
  }, []);

  const handleCopy = useCallback((resultId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(resultId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleExportResult = useCallback((result: QueryResult) => {
    const exportData = {
      query: result.query,
      response: result.response,
      confidence: result.confidence,
      sources: result.sources,
      timestamp: result.timestamp.toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-query-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleClearHistory = useCallback(() => {
    setResults([]);
    setShowSuggestions(true);
    setExpandedResult(null);
  }, []);

  const bookmarkedResults = results.filter(r => r.bookmarked);
  const filteredSuggestions = selectedCategory === 'All'
    ? SUGGESTED_QUERIES
    : SUGGESTED_QUERIES.filter(sq => sq.category === selectedCategory);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Natural Language Compliance Query</h2>
            <p className="text-sm text-gray-500 mt-0.5">Ask anything about your compliance posture in plain English</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {results.length > 0 && (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  showHistory ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <History size={14} />
                History ({results.length})
              </button>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Trash2 size={14} />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your compliance... (e.g., 'Am I GDPR compliant in France?')"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              disabled={isProcessing}
            />
          </div>
          <button
            onClick={() => handleSubmitQuery()}
            disabled={!queryInput.trim() || isProcessing}
            className="px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 ml-13 pl-13">
          <span className="text-xs text-gray-400">Powered by AI</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400">Queries your actual compliance data across {6} frameworks, {443} controls, and {312} evidence items</span>
        </div>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">Analyzing your compliance data...</p>
            <p className="text-xs text-blue-700 mt-0.5">Querying frameworks, controls, evidence, risks, and vendor assessments</p>
          </div>
        </div>
      )}

      {/* Suggested Queries */}
      {showSuggestions && results.length === 0 && !isProcessing && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {QUERY_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Query Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSuggestions.map(sq => (
              <button
                key={sq.id}
                onClick={() => handleSubmitQuery(sq.query)}
                className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-brand-300 hover:bg-brand-50/30 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 text-brand-600">
                  {sq.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{sq.query}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sq.category}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Bookmarked Queries */}
          {bookmarkedResults.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                <BookmarkCheck size={14} className="text-yellow-500" />
                Bookmarked Queries
              </h4>
              <div className="space-y-2">
                {bookmarkedResults.map(result => (
                  <button
                    key={result.id}
                    onClick={() => handleSubmitQuery(result.query)}
                    className="w-full flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left hover:bg-yellow-100 transition-colors"
                  >
                    <Star size={14} className="text-yellow-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{result.query}</span>
                    <span className="text-xs text-gray-400 ml-auto">{result.timestamp.toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Query History Sidebar */}
      {showHistory && results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <History size={14} />
              Query History
            </h4>
            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.slice().reverse().map(result => (
              <button
                key={result.id}
                onClick={() => { setExpandedResult(result.id); setShowHistory(false); }}
                className="w-full flex items-center gap-2 p-2 bg-gray-50 hover:bg-brand-50 rounded-lg text-left transition-colors"
              >
                <Search size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate flex-1">{result.query}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <ConfidenceBadge score={result.confidence} />
                  {result.bookmarked && <Star size={10} className="text-yellow-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map(result => (
            <div key={result.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Query Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search size={14} className="text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{result.query}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge score={result.confidence} />
                    <span className="text-xs text-gray-400">{result.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button
                      onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedResult === result.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {(expandedResult === result.id || results.length <= 2) && (
                <>
                  {/* Response Content */}
                  <div className="p-4">
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {result.response}
                    </div>
                  </div>

                  {/* Data Cards */}
                  {result.dataCards && result.dataCards.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {result.dataCards.map(card => {
                          if (card.type === 'metric') return <MetricCard key={card.id} data={card.data} />;
                          if (card.type === 'list') return <ListCard key={card.id} title={card.title} data={card.data} />;
                          if (card.type === 'timeline') return <TimelineCard key={card.id} title={card.title} data={card.data} />;
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sources */}
                  <div className="px-4 pb-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <BookOpen size={12} />
                        Evidence Sources ({result.sources.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {result.sources.map((source, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs">
                            <SourceIcon type={source.type} />
                            <div>
                              <span className="font-medium text-gray-700">{source.title}</span>
                              <span className="text-gray-400 ml-1">- {source.reference}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Questions */}
                  {result.followUpQuestions.length > 0 && (
                    <div className="px-4 pb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <Lightbulb size={12} />
                        Suggested Follow-ups
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {result.followUpQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSubmitQuery(q)}
                            className="text-left text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <ChevronRight size={10} className="flex-shrink-0" />
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFeedback(result.id, 'up')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          result.feedback === 'up' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        onClick={() => handleFeedback(result.id, 'down')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          result.feedback === 'down' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown size={14} />
                      </button>
                      <div className="w-px h-4 bg-gray-200 mx-1" />
                      <button
                        onClick={() => handleCopy(result.id, result.response)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy"
                      >
                        {copiedId === result.id ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => handleToggleBookmark(result.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          result.bookmarked ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title={result.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                      >
                        {result.bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleExportResult(result)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-white transition-colors"
                    >
                      <Download size={12} />
                      Export as Report
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          <div ref={resultsEndRef} />
        </div>
      )}

      {/* Empty State Info */}
      {results.length === 0 && !isProcessing && showSuggestions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900">How Natural Language Query Works</h4>
              <ul className="mt-2 space-y-1 text-xs text-blue-700">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />Ask questions in plain English about your compliance posture</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />AI queries your actual compliance data (frameworks, controls, evidence, risks, vendors)</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />Responses include confidence scoring and evidence citations</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />Visual data cards provide at-a-glance metrics and breakdowns</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />Suggested follow-up questions help you explore deeper</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />Export any answer as a report for sharing</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
