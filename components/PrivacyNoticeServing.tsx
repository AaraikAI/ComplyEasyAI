/**
 * Privacy Notice Serving Component
 *
 * Comprehensive privacy notice management for GRC/compliance platforms:
 * - Create, edit, publish, and archive privacy notices
 * - Pre-built templates for GDPR, CCPA, Children's Privacy, Employee Privacy
 * - Analytics: view/acceptance statistics, consent rates, version history
 * - Multi-type support: Website, App, Email, Cookie notices
 * - Full CRUD backed by the privacy API. Live consent/notice data comes from the
 *   server; bundled fixtures are only used as an explicitly-labeled sample
 *   fallback when the server returns no records, never as live KPIs.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import {
  ArrowLeft,
  Shield,
  FileText,
  Plus,
  X,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Globe,
  Smartphone,
  Mail,
  Cookie,
  Copy,
  Download,
  Filter,
  ChevronRight,
  TrendingUp,
  Users,
  Calendar,
  Archive,
  Send,
  History,
  Layout,
  RefreshCw,
  BookOpen,
  Layers,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type TabId = 'notices' | 'templates' | 'analytics';

type NoticeType = 'Website' | 'App' | 'Email' | 'Cookie';

type NoticeStatus = 'Draft' | 'Published' | 'Archived' | 'PendingReview';

interface PrivacyNotice {
  id: string;
  title: string;
  type: NoticeType;
  status: NoticeStatus;
  version: string;
  content: string;
  effectiveDate: string;
  lastUpdated: string;
  createdAt: string;
  createdBy: string;
  versionNotes: string;
  language: string;
  jurisdiction: string;
  viewCount: number;
  acceptanceCount: number;
  acceptanceRate: number;
}

interface NoticeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: NoticeType;
  content: string;
  jurisdiction: string;
  tags: string[];
  lastUpdated: string;
}

interface VersionHistoryEntry {
  id: string;
  noticeId: string;
  noticeTitle: string;
  version: string;
  changedBy: string;
  changedAt: string;
  changeDescription: string;
  status: NoticeStatus;
}

interface ConsentAnalytics {
  noticeType: NoticeType;
  totalViews: number;
  totalAcceptances: number;
  consentRate: number;
  averageTimeToAccept: string;
  declineRate: number;
}

interface NoticeFormData {
  title: string;
  type: NoticeType;
  status: NoticeStatus;
  content: string;
  effectiveDate: string;
  versionNotes: string;
  language: string;
  jurisdiction: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const noticeTypeConfig: Record<NoticeType, { color: string; icon: React.ReactNode; label: string }> = {
  Website: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Globe className="w-3.5 h-3.5" />, label: 'Website' },
  App: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <Smartphone className="w-3.5 h-3.5" />, label: 'Application' },
  Email: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: <Mail className="w-3.5 h-3.5" />, label: 'Email' },
  Cookie: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <Cookie className="w-3.5 h-3.5" />, label: 'Cookie' },
};

const noticeStatusConfig: Record<NoticeStatus, { color: string; icon: React.ReactNode; label: string }> = {
  Draft: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: <Edit className="w-3.5 h-3.5" />, label: 'Draft' },
  Published: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Published' },
  Archived: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Archive className="w-3.5 h-3.5" />, label: 'Archived' },
  PendingReview: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending Review' },
};

const JURISDICTIONS = [
  'Global', 'EU/EEA (GDPR)', 'United States (CCPA/CPRA)', 'United Kingdom (UK GDPR)',
  'Canada (PIPEDA)', 'Australia (Privacy Act)', 'Brazil (LGPD)', 'Japan (APPI)',
  'India (DPDP Act)', 'South Korea (PIPA)', 'Singapore (PDPA)',
];

const LANGUAGES = [
  'English', 'French', 'German', 'Spanish', 'Portuguese', 'Italian',
  'Dutch', 'Japanese', 'Korean', 'Chinese (Simplified)',
];

// ── Sample Data (rendered ONLY behind an explicit "sample data" banner when the
//    server returns no records — never presented as live consent-rate KPIs) ────

const initialNotices: PrivacyNotice[] = [
  {
    id: 'PN-001',
    title: 'Website Privacy Policy',
    type: 'Website',
    status: 'Published',
    version: '3.2',
    content: `Privacy Policy\n\nEffective Date: January 15, 2026\n\n1. Introduction\nThis Privacy Policy describes how ComplyEasyAI ("we," "us," or "our") collects, uses, and shares personal information when you visit our website and use our services.\n\n2. Information We Collect\n- Account Information: name, email address, organization, job title\n- Usage Data: pages visited, features used, session duration, IP address\n- Device Information: browser type, operating system, device identifiers\n- Cookies and Tracking Technologies: see our Cookie Policy for details\n\n3. How We Use Your Information\nWe use the information we collect to:\n- Provide, maintain, and improve our services\n- Send you technical notices and support messages\n- Respond to your comments, questions, and customer service requests\n- Monitor and analyze trends, usage, and activities\n- Detect, investigate, and prevent fraudulent or unauthorized activities\n\n4. Legal Basis for Processing (GDPR)\n- Performance of contract (Art. 6(1)(b))\n- Legitimate interests (Art. 6(1)(f))\n- Consent (Art. 6(1)(a)) for marketing communications\n- Legal obligation (Art. 6(1)(c)) for regulatory compliance\n\n5. Data Retention\nWe retain personal data for as long as necessary to fulfill the purposes described in this policy, unless a longer retention period is required by law.\n\n6. Your Rights\nDepending on your jurisdiction, you may have the right to:\n- Access your personal data\n- Rectify inaccurate data\n- Request deletion of your data\n- Object to processing\n- Data portability\n- Withdraw consent\n\n7. Contact Us\nData Protection Officer: dpo@complyeasyai.com`,
    effectiveDate: '2026-01-15',
    lastUpdated: '2026-01-10',
    createdAt: '2024-03-01',
    createdBy: 'Sarah Chen',
    versionNotes: 'Updated data retention section and added DPDP Act references',
    language: 'English',
    jurisdiction: 'Global',
    viewCount: 45230,
    acceptanceCount: 42180,
    acceptanceRate: 93.2,
  },
  {
    id: 'PN-002',
    title: 'Mobile Application Privacy Notice',
    type: 'App',
    status: 'Published',
    version: '2.1',
    content: `Mobile Application Privacy Notice\n\nLast Updated: December 1, 2025\n\n1. Scope\nThis notice applies to personal data collected through the ComplyEasyAI mobile application available on iOS and Android platforms.\n\n2. Data Collection\n- Account credentials and profile information\n- Push notification tokens\n- Device identifiers (IDFA/GAID)\n- Location data (with explicit consent)\n- Camera and photo library (for document scanning)\n- Biometric data (for authentication, processed locally)\n\n3. Permissions\nThe app requests the following device permissions:\n- Camera: Document scanning and OCR\n- Storage: Offline document access\n- Notifications: Compliance alerts and reminders\n- Biometrics: Secure authentication\n\n4. Third-Party SDKs\n- Firebase Analytics (Google)\n- Sentry (error reporting)\n- Stripe (payment processing)\n\n5. Data Security\nAll data is encrypted in transit (TLS 1.3) and at rest (AES-256). Biometric templates never leave the device.\n\n6. Children's Privacy\nOur app is not directed at children under 16. We do not knowingly collect personal information from children.\n\n7. Contact\nPrivacy Team: privacy@complyeasyai.com`,
    effectiveDate: '2025-12-01',
    lastUpdated: '2025-11-28',
    createdAt: '2024-06-15',
    createdBy: 'James Wilson',
    versionNotes: 'Added biometric data handling and SDK disclosure',
    language: 'English',
    jurisdiction: 'Global',
    viewCount: 18450,
    acceptanceCount: 17120,
    acceptanceRate: 92.8,
  },
  {
    id: 'PN-003',
    title: 'Cookie Notice - EU Region',
    type: 'Cookie',
    status: 'Published',
    version: '4.0',
    content: `Cookie Notice\n\nLast Updated: February 1, 2026\n\n1. What Are Cookies?\nCookies are small text files stored on your device when you visit our website. They help us provide a better user experience.\n\n2. Categories of Cookies\n\na) Strictly Necessary Cookies\n- Session management\n- Security tokens (CSRF)\n- Load balancing\nThese cannot be disabled.\n\nb) Functional Cookies\n- Language preferences\n- Theme settings\n- Recently viewed items\n\nc) Analytics Cookies\n- Google Analytics 4\n- Mixpanel\n- Hotjar (session recording)\n\nd) Marketing Cookies\n- LinkedIn Insight Tag\n- Google Ads remarketing\n- Facebook Pixel\n\n3. Cookie Consent\nWe use a consent management platform (CMP) compliant with IAB TCF v2.2. You can manage your preferences at any time via the cookie settings icon.\n\n4. Duration\n- Session cookies: deleted when browser closes\n- Persistent cookies: maximum 13 months (per ePrivacy Directive)\n\n5. Third-Party Cookies\nSee our full cookie inventory at complyeasyai.com/cookies for a complete list of third-party cookies and their purposes.\n\n6. Updates\nWe review this notice quarterly and after any changes to our cookie practices.`,
    effectiveDate: '2026-02-01',
    lastUpdated: '2026-01-28',
    createdAt: '2024-01-10',
    createdBy: 'Legal Team',
    versionNotes: 'TCF v2.2 update and cookie inventory refresh',
    language: 'English',
    jurisdiction: 'EU/EEA (GDPR)',
    viewCount: 125800,
    acceptanceCount: 98700,
    acceptanceRate: 78.5,
  },
  {
    id: 'PN-004',
    title: 'Email Communication Privacy Notice',
    type: 'Email',
    status: 'PendingReview',
    version: '1.3',
    content: `Email Communication Privacy Notice\n\n1. Purpose\nThis notice explains how we handle personal data in our email communications, including marketing emails, transactional messages, and newsletters.\n\n2. Data Collected via Email\n- Email address and name\n- Open and click tracking data\n- Device and email client information\n- Unsubscribe and preference data\n\n3. Email Categories\na) Transactional: Account verification, password resets, billing\nb) Service: Product updates, security alerts, compliance notifications\nc) Marketing: Newsletters, promotions, webinar invitations\nd) Regulatory: Compliance updates, policy changes, audit notifications\n\n4. Legal Basis\n- Transactional: Performance of contract\n- Service: Legitimate interest\n- Marketing: Consent (opt-in)\n- Regulatory: Legal obligation\n\n5. Your Choices\n- Unsubscribe from marketing at any time via email footer link\n- Manage preferences in your account settings\n- Transactional emails cannot be unsubscribed while account is active\n\n6. Email Service Providers\nWe use SendGrid (Twilio) for email delivery. Data is processed in the US under EU-US Data Privacy Framework.\n\n7. Retention\nEmail engagement data is retained for 24 months. Unsubscribe records are retained indefinitely for suppression list compliance.`,
    effectiveDate: '2026-03-01',
    lastUpdated: '2026-02-15',
    createdAt: '2025-08-20',
    createdBy: 'Marketing Team',
    versionNotes: 'Added regulatory email category and DPF references',
    language: 'English',
    jurisdiction: 'Global',
    viewCount: 8900,
    acceptanceCount: 7650,
    acceptanceRate: 86.0,
  },
  {
    id: 'PN-005',
    title: 'CCPA Privacy Notice - California',
    type: 'Website',
    status: 'Published',
    version: '2.0',
    content: `California Privacy Notice\n\nEffective: January 1, 2026\n\nThis notice supplements our general Privacy Policy and applies to California residents pursuant to the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA).\n\n1. Categories of Personal Information Collected\n- Identifiers (name, email, IP address)\n- Commercial information (transaction history, subscription data)\n- Internet activity (browsing history, search queries, interactions)\n- Professional information (job title, employer)\n- Geolocation data (approximate, based on IP)\n- Inferences drawn from the above\n\n2. Business Purposes\n- Providing and maintaining our services\n- Security and fraud prevention\n- Debugging and error resolution\n- Quality assurance and service improvement\n- Compliance with legal obligations\n\n3. Your California Rights\n- Right to Know: Request disclosure of collected PI\n- Right to Delete: Request deletion of your PI\n- Right to Correct: Request correction of inaccurate PI\n- Right to Opt-Out: Opt out of sale/sharing of PI\n- Right to Limit Use of Sensitive PI\n- Non-discrimination for exercising rights\n\n4. Do Not Sell or Share\nWe do not sell personal information. We share data with service providers under contractual restrictions.\n\n5. Verification\nWe verify requests through email confirmation and, for sensitive requests, government-issued ID.\n\n6. Authorized Agents\nYou may designate an authorized agent to submit requests on your behalf with written permission.\n\n7. Contact\nCCPA requests: privacy@complyeasyai.com\nToll-free: 1-800-555-0199`,
    effectiveDate: '2026-01-01',
    lastUpdated: '2025-12-20',
    createdAt: '2024-11-01',
    createdBy: 'Sarah Chen',
    versionNotes: 'CPRA amendments and sensitive PI provisions',
    language: 'English',
    jurisdiction: 'United States (CCPA/CPRA)',
    viewCount: 12400,
    acceptanceCount: 11900,
    acceptanceRate: 96.0,
  },
  {
    id: 'PN-006',
    title: 'Cookie Notice - Draft v2',
    type: 'Cookie',
    status: 'Draft',
    version: '0.1',
    content: `[DRAFT] Updated Cookie Notice\n\nThis is a draft version incorporating feedback from the Q1 2026 privacy review.\n\nChanges planned:\n- Add consent analytics reporting\n- Update third-party cookie inventory\n- Implement granular consent categories\n- Add cookie wall justification per CJEU guidance`,
    effectiveDate: '',
    lastUpdated: '2026-03-01',
    createdAt: '2026-03-01',
    createdBy: 'Privacy Team',
    versionNotes: 'Initial draft for Q2 2026 cookie notice update',
    language: 'English',
    jurisdiction: 'EU/EEA (GDPR)',
    viewCount: 0,
    acceptanceCount: 0,
    acceptanceRate: 0,
  },
  {
    id: 'PN-007',
    title: 'Datenschutzerklarung (German Privacy Notice)',
    type: 'Website',
    status: 'Published',
    version: '1.5',
    content: `Datenschutzerklarung\n\nStand: 15. Januar 2026\n\n1. Verantwortlicher\nComplyEasyAI GmbH\nMusterstrasse 1, 10115 Berlin\nDatenschutzbeauftragter: dpo@complyeasyai.com\n\n2. Erhobene Daten\n- Bestandsdaten (Name, E-Mail-Adresse)\n- Nutzungsdaten (besuchte Seiten, Zugriffszeiten)\n- Kommunikationsdaten (IP-Adresse, Geratedaten)\n\n3. Rechtsgrundlagen\n- Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)\n- Art. 6 Abs. 1 lit. b DSGVO (Vertragserfullung)\n- Art. 6 Abs. 1 lit. f DSGVO (Berechtigte Interessen)\n\n4. Ihre Rechte\nSie haben das Recht auf Auskunft, Berichtigung, Loschung, Einschrankung der Verarbeitung, Datenubertragbarkeit und Widerspruch.\n\n5. Beschwerderecht\nSie haben das Recht, sich bei einer Aufsichtsbehorde zu beschweren.\n\n6. Datensicherheit\nWir verwenden SSL/TLS-Verschlusselung und folgen dem Stand der Technik gemas Art. 32 DSGVO.`,
    effectiveDate: '2026-01-15',
    lastUpdated: '2026-01-12',
    createdAt: '2025-06-01',
    createdBy: 'Legal Team',
    versionNotes: 'Updated for DSGVO compliance review',
    language: 'German',
    jurisdiction: 'EU/EEA (GDPR)',
    viewCount: 6300,
    acceptanceCount: 5800,
    acceptanceRate: 92.1,
  },
  {
    id: 'PN-008',
    title: 'Employee Data Privacy Notice',
    type: 'App',
    status: 'Archived',
    version: '1.0',
    content: `Employee Data Privacy Notice\n\nEffective: March 1, 2025\n\n[ARCHIVED - Replaced by PN-009]\n\nThis notice informed employees about how their personal data was collected and processed in the course of their employment.`,
    effectiveDate: '2025-03-01',
    lastUpdated: '2025-12-15',
    createdAt: '2025-02-01',
    createdBy: 'HR Department',
    versionNotes: 'Archived - replaced by updated employee notice',
    language: 'English',
    jurisdiction: 'Global',
    viewCount: 3200,
    acceptanceCount: 3100,
    acceptanceRate: 96.9,
  },
];

const initialTemplates: NoticeTemplate[] = [
  {
    id: 'TPL-001',
    name: 'GDPR Privacy Notice',
    description: 'Comprehensive privacy notice template compliant with EU General Data Protection Regulation (GDPR) Article 13/14 requirements. Covers all mandatory disclosure elements.',
    category: 'GDPR',
    type: 'Website',
    content: `Privacy Notice (GDPR Compliant)\n\nEffective Date: [DATE]\n\n1. Identity and Contact Details of the Controller\n[Organization Name]\n[Address]\nData Protection Officer: [DPO Email]\n\n2. Purposes and Legal Basis for Processing\nWe process your personal data for the following purposes:\n- [Purpose 1]: Legal basis - [Art. 6(1)(a)/(b)/(c)/(f) GDPR]\n- [Purpose 2]: Legal basis - [Art. 6(1)(a)/(b)/(c)/(f) GDPR]\n\n3. Categories of Personal Data\n- Identity data: name, date of birth, government ID\n- Contact data: email, phone, address\n- Technical data: IP address, browser type, device information\n- Usage data: interaction with our services\n- Financial data: payment and billing information\n\n4. Recipients of Personal Data\n- Service providers (data processors) under DPA\n- Regulatory authorities (when required by law)\n- Professional advisors (legal, audit)\n\n5. International Transfers\nWhere we transfer data outside the EEA, we ensure appropriate safeguards:\n- EU-US Data Privacy Framework\n- Standard Contractual Clauses (SCCs)\n- Binding Corporate Rules (BCRs)\n\n6. Retention Period\nWe retain your data for [X] years after [triggering event], unless longer retention is required by law.\n\n7. Your Rights Under GDPR\n- Right of access (Art. 15)\n- Right to rectification (Art. 16)\n- Right to erasure (Art. 17)\n- Right to restriction (Art. 18)\n- Right to data portability (Art. 20)\n- Right to object (Art. 21)\n- Right not to be subject to automated decision-making (Art. 22)\n\n8. Right to Withdraw Consent\nWhere processing is based on consent, you may withdraw at any time without affecting the lawfulness of prior processing.\n\n9. Right to Lodge a Complaint\nYou have the right to lodge a complaint with a supervisory authority, in particular in the Member State of your habitual residence.\n\n10. Automated Decision-Making\n[Describe any automated decision-making, including profiling, and the logic involved]\n\n11. Updates to This Notice\nWe review this notice annually or when there are significant changes to our data processing activities.`,
    jurisdiction: 'EU/EEA (GDPR)',
    tags: ['GDPR', 'EU', 'Article 13', 'Article 14', 'Data Protection'],
    lastUpdated: '2026-01-15',
  },
  {
    id: 'TPL-002',
    name: 'CCPA/CPRA Privacy Notice',
    description: 'California Consumer Privacy Act and California Privacy Rights Act compliant notice template. Includes all required disclosures for California residents.',
    category: 'CCPA',
    type: 'Website',
    content: `California Privacy Notice\n\nEffective Date: [DATE]\n\nThis notice is provided pursuant to the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA).\n\n1. Categories of Personal Information Collected\n| Category | Examples | Collected |\n|----------|----------|----------|\n| Identifiers | Name, email, IP address | Yes |\n| Commercial Info | Transaction history, subscriptions | Yes |\n| Internet Activity | Browsing history, search queries | Yes |\n| Geolocation | Approximate location from IP | Yes |\n| Professional Info | Job title, employer | Yes |\n| Sensitive PI | [List if applicable] | [Yes/No] |\n\n2. Sources of Personal Information\n- Directly from you\n- Automatically through our services\n- Third-party business partners\n\n3. Business or Commercial Purposes\n- Providing and improving services\n- Security and fraud prevention\n- Marketing and advertising\n- Legal compliance\n\n4. Categories of Third Parties\n- Service providers\n- Business partners\n- Analytics providers\n\n5. Sale or Sharing of PI\n[We do / do not] sell personal information.\n[We do / do not] share personal information for cross-context behavioral advertising.\n\n6. Your CCPA/CPRA Rights\n- Right to Know\n- Right to Delete\n- Right to Correct\n- Right to Opt-Out of Sale/Sharing\n- Right to Limit Use of Sensitive PI\n- Right to Non-Discrimination\n\n7. How to Exercise Your Rights\nSubmit a request via:\n- Online: [URL]\n- Email: [privacy email]\n- Phone: [toll-free number]\n\n8. Verification Process\nWe will verify your identity before fulfilling requests.\n\n9. Retention\nWe retain PI as long as necessary for the stated purposes.\n\n10. Updates\nWe update this notice annually as required by CCPA Section 1798.130(a)(5).`,
    jurisdiction: 'United States (CCPA/CPRA)',
    tags: ['CCPA', 'CPRA', 'California', 'US Privacy'],
    lastUpdated: '2026-01-10',
  },
  {
    id: 'TPL-003',
    name: 'General Privacy Policy',
    description: 'Universal privacy policy template suitable for organizations operating in multiple jurisdictions. Covers fundamental privacy principles and data subject rights.',
    category: 'General',
    type: 'Website',
    content: `Privacy Policy\n\nEffective Date: [DATE]\n\n1. About This Policy\nThis Privacy Policy explains how [Organization Name] collects, uses, stores, and protects your personal information.\n\n2. Who We Are\n[Organization Name]\n[Address]\nContact: [Email]\n\n3. Information We Collect\na) Information you provide:\n- Registration and account information\n- Communication preferences\n- Feedback and survey responses\n\nb) Information collected automatically:\n- Usage and analytics data\n- Device and browser information\n- Cookies and similar technologies\n\n4. How We Use Your Information\n- To provide and improve our services\n- To communicate with you\n- To ensure security and prevent fraud\n- To comply with legal obligations\n\n5. How We Share Your Information\nWe may share your information with:\n- Service providers who assist our operations\n- Regulatory authorities when required by law\n- Business partners with your consent\n\n6. Data Security\nWe implement appropriate technical and organizational measures to protect your personal information.\n\n7. Data Retention\nWe retain your data only as long as necessary for the purposes described in this policy.\n\n8. Your Rights\nDepending on your location, you may have the right to:\n- Access your data\n- Correct inaccuracies\n- Delete your data\n- Object to processing\n- Port your data\n\n9. Children's Privacy\nOur services are not directed at individuals under [13/16] years of age.\n\n10. Changes to This Policy\nWe may update this policy from time to time. We will notify you of material changes.\n\n11. Contact Us\n[Contact information]`,
    jurisdiction: 'Global',
    tags: ['General', 'Multi-Jurisdiction', 'Privacy Policy'],
    lastUpdated: '2026-02-01',
  },
  {
    id: 'TPL-004',
    name: "Children's Privacy Notice (COPPA)",
    description: "Specialized privacy notice for services that may collect data from children under 13, compliant with the Children's Online Privacy Protection Act (COPPA).",
    category: "Children's Privacy",
    type: 'App',
    content: `Children's Privacy Notice\n\nEffective Date: [DATE]\n\nThis notice describes our practices regarding information collected from children under 13 years of age in compliance with the Children's Online Privacy Protection Act (COPPA).\n\n1. Operator Information\n[Organization Name]\n[Address]\n[Phone]\n[Email]\n\n2. Information We Collect from Children\n- Username (not real name)\n- Parent/guardian email address\n- Age range (not exact date of birth)\n- Game progress and preferences\n- Device identifiers (for internal operations only)\n\n3. How We Use Children's Information\n- To provide the requested service\n- To maintain and improve the service\n- For internal operations only\n\n4. We DO NOT:\n- Require children to provide more information than necessary\n- Share children's personal information with third parties for marketing\n- Use behavioral advertising targeted at children\n- Create publicly accessible profiles for children\n\n5. Parental Consent\nWe obtain verifiable parental consent before:\n- Collecting personal information from children\n- Disclosing personal information to third parties\n- Enabling children to make personal information publicly available\n\n6. Parental Rights\nParents/guardians may:\n- Review their child's personal information\n- Request deletion of their child's information\n- Refuse further collection of their child's information\n- Revoke consent at any time\n\n7. Data Security\nWe implement reasonable security measures to protect children's information.\n\n8. Contact for Parental Requests\n[Contact information for parental inquiries]`,
    jurisdiction: 'United States (CCPA/CPRA)',
    tags: ['COPPA', 'Children', 'Minors', 'Parental Consent'],
    lastUpdated: '2025-11-20',
  },
  {
    id: 'TPL-005',
    name: 'Employee Privacy Notice',
    description: 'Privacy notice template for employee personal data processing. Covers HR data, monitoring, and employee rights in the employment context.',
    category: 'Employee Privacy',
    type: 'Email',
    content: `Employee Privacy Notice\n\nEffective Date: [DATE]\n\n1. Purpose\nThis notice describes how [Organization Name] processes personal data of its employees, contractors, and job applicants.\n\n2. Categories of Employee Data Processed\n- Identity: name, date of birth, national ID, photo\n- Contact: home address, personal email, phone\n- Employment: job title, department, employment history, performance reviews\n- Financial: bank details, salary, tax information, benefits\n- IT Systems: login credentials, access logs, email communications\n- Health: sick leave records, disability accommodations, occupational health\n- Monitoring: building access, CCTV, IT usage monitoring\n\n3. Purposes of Processing\n- Employment administration and payroll\n- Performance management and training\n- Health and safety compliance\n- IT security and acceptable use enforcement\n- Legal and regulatory compliance\n- Business continuity planning\n\n4. Legal Basis\n- Performance of the employment contract\n- Legal obligations (tax, labor law, health and safety)\n- Legitimate interests (IT security, business operations)\n- Consent (optional benefits, surveys)\n- Vital interests (emergency situations)\n\n5. Workplace Monitoring\nWe may monitor:\n- Email and internet usage (for security and acceptable use)\n- Building access (for security)\n- CCTV in common areas (for safety)\nMonitoring is proportionate and employees are informed.\n\n6. Data Sharing\n- Payroll providers\n- Benefits administrators\n- Government agencies (tax, social security)\n- Legal advisors\n- Regulators (when required)\n\n7. International Transfers\n[Describe any international transfers and safeguards]\n\n8. Retention\n- Active employment: duration of employment\n- Post-employment: [X] years (per legal requirements)\n- Recruitment data (unsuccessful): [6-12] months\n\n9. Employee Rights\nYou have the right to access, rectify, and in certain circumstances erase your personal data. Contact HR or the DPO.\n\n10. Contact\nHR Department: [email]\nData Protection Officer: [email]`,
    jurisdiction: 'Global',
    tags: ['Employee', 'HR', 'Workplace', 'Employment'],
    lastUpdated: '2025-12-05',
  },
  {
    id: 'TPL-006',
    name: 'Cookie Consent Notice (ePrivacy)',
    description: 'Cookie and tracking technology notice compliant with ePrivacy Directive and GDPR requirements. Includes category-based consent framework.',
    category: 'GDPR',
    type: 'Cookie',
    content: `Cookie Notice\n\nEffective Date: [DATE]\n\n1. What Are Cookies?\nCookies are small text files placed on your device when you visit our website.\n\n2. Cookie Categories\n\na) Strictly Necessary (Always Active)\nRequired for the website to function. Cannot be disabled.\n- Session cookies\n- Authentication tokens\n- CSRF protection\n- Load balancing\n\nb) Functional\nEnable enhanced functionality and personalization.\n- Language preferences\n- Region/currency settings\n- Accessibility preferences\n\nc) Analytics\nHelp us understand how visitors interact with our website.\n- [Analytics provider 1]\n- [Analytics provider 2]\n\nd) Marketing\nUsed to deliver relevant advertisements.\n- [Marketing provider 1]\n- [Marketing provider 2]\n\n3. Consent Management\nWe obtain your consent before placing non-essential cookies. You can change your preferences at any time using our consent management tool.\n\n4. Cookie Duration\n- Session cookies: expire when browser closes\n- Persistent cookies: maximum [12/13] months\n\n5. Third-Party Cookies\n[List third-party cookies with provider, purpose, and duration]\n\n6. How to Control Cookies\n- Through our consent management tool\n- Through your browser settings\n- Through device settings\n\n7. Impact of Disabling Cookies\nDisabling certain cookies may affect website functionality.\n\n8. Updates\nThis notice is reviewed [quarterly/annually] and updated as needed.`,
    jurisdiction: 'EU/EEA (GDPR)',
    tags: ['Cookies', 'ePrivacy', 'Consent', 'TCF'],
    lastUpdated: '2026-01-25',
  },
];

const initialVersionHistory: VersionHistoryEntry[] = [
  { id: 'VH-001', noticeId: 'PN-001', noticeTitle: 'Website Privacy Policy', version: '3.2', changedBy: 'Sarah Chen', changedAt: '2026-01-10', changeDescription: 'Updated data retention section and added DPDP Act references', status: 'Published' },
  { id: 'VH-002', noticeId: 'PN-001', noticeTitle: 'Website Privacy Policy', version: '3.1', changedBy: 'Sarah Chen', changedAt: '2025-09-15', changeDescription: 'Added AI processing disclosure per EU AI Act requirements', status: 'Archived' },
  { id: 'VH-003', noticeId: 'PN-001', noticeTitle: 'Website Privacy Policy', version: '3.0', changedBy: 'James Wilson', changedAt: '2025-06-01', changeDescription: 'Major overhaul for CPRA amendments and DPF certification', status: 'Archived' },
  { id: 'VH-004', noticeId: 'PN-003', noticeTitle: 'Cookie Notice - EU Region', version: '4.0', changedBy: 'Legal Team', changedAt: '2026-01-28', changeDescription: 'TCF v2.2 update and cookie inventory refresh', status: 'Published' },
  { id: 'VH-005', noticeId: 'PN-003', noticeTitle: 'Cookie Notice - EU Region', version: '3.5', changedBy: 'Legal Team', changedAt: '2025-10-01', changeDescription: 'Added Google Consent Mode v2 integration', status: 'Archived' },
  { id: 'VH-006', noticeId: 'PN-002', noticeTitle: 'Mobile Application Privacy Notice', version: '2.1', changedBy: 'James Wilson', changedAt: '2025-11-28', changeDescription: 'Added biometric data handling and SDK disclosure', status: 'Published' },
  { id: 'VH-007', noticeId: 'PN-002', noticeTitle: 'Mobile Application Privacy Notice', version: '2.0', changedBy: 'James Wilson', changedAt: '2025-07-15', changeDescription: 'Restructured for iOS App Tracking Transparency compliance', status: 'Archived' },
  { id: 'VH-008', noticeId: 'PN-005', noticeTitle: 'CCPA Privacy Notice - California', version: '2.0', changedBy: 'Sarah Chen', changedAt: '2025-12-20', changeDescription: 'CPRA amendments and sensitive PI provisions', status: 'Published' },
  { id: 'VH-009', noticeId: 'PN-005', noticeTitle: 'CCPA Privacy Notice - California', version: '1.0', changedBy: 'Legal Team', changedAt: '2024-11-01', changeDescription: 'Initial CCPA notice creation', status: 'Archived' },
  { id: 'VH-010', noticeId: 'PN-004', noticeTitle: 'Email Communication Privacy Notice', version: '1.3', changedBy: 'Marketing Team', changedAt: '2026-02-15', changeDescription: 'Added regulatory email category and DPF references', status: 'PendingReview' },
  { id: 'VH-011', noticeId: 'PN-007', noticeTitle: 'Datenschutzerklarung (German Privacy Notice)', version: '1.5', changedBy: 'Legal Team', changedAt: '2026-01-12', changeDescription: 'Updated for DSGVO compliance review', status: 'Published' },
  { id: 'VH-012', noticeId: 'PN-008', noticeTitle: 'Employee Data Privacy Notice', version: '1.0', changedBy: 'HR Department', changedAt: '2025-12-15', changeDescription: 'Archived - replaced by updated employee notice', status: 'Archived' },
];

const initialConsentAnalytics: ConsentAnalytics[] = [
  { noticeType: 'Website', totalViews: 57930, totalAcceptances: 54080, consentRate: 93.4, averageTimeToAccept: '4.2s', declineRate: 2.1 },
  { noticeType: 'App', totalViews: 21650, totalAcceptances: 20220, consentRate: 93.4, averageTimeToAccept: '6.8s', declineRate: 1.8 },
  { noticeType: 'Cookie', totalViews: 125800, totalAcceptances: 98700, consentRate: 78.5, averageTimeToAccept: '8.1s', declineRate: 12.3 },
  { noticeType: 'Email', totalViews: 8900, totalAcceptances: 7650, consentRate: 86.0, averageTimeToAccept: '3.5s', declineRate: 5.2 },
];

// ── Helper Components ───────────────────────────────────────────────────────

const Badge: React.FC<{ text: string; className: string; icon?: React.ReactNode }> = ({ text, className, icon }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
    {icon}
    {text}
  </span>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string }> = ({ label, value, icon, color, subtitle }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 hover:border-slate-600/50 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
    </div>
    <div className="text-2xl font-bold">{value}</div>
    {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
  </div>
);

const emptyFormData = (): NoticeFormData => ({
  title: '',
  type: 'Website',
  status: 'Draft',
  content: '',
  effectiveDate: '',
  versionNotes: '',
  language: 'English',
  jurisdiction: 'Global',
});

// ── Main Component ──────────────────────────────────────────────────────────

const PrivacyNoticeServing: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<TabId>('notices');
  // Live data starts empty so fabricated fixtures are never shown as real KPIs.
  const [notices, setNotices] = useState<PrivacyNotice[]>([]);
  // Templates are a static catalog of starting points (not live metrics), so they
  // are seeded immediately; they are clearly labeled as reusable templates.
  const [templates, setTemplates] = useState<NoticeTemplate[]>(initialTemplates);
  const [versionHistory, setVersionHistory] = useState<VersionHistoryEntry[]>([]);
  const [consentAnalytics, setConsentAnalytics] = useState<ConsentAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // True when bundled sample records are being shown because the server has none.
  const [usingSampleData, setUsingSampleData] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NoticeType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<NoticeStatus | 'All'>('All');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<PrivacyNotice | null>(null);
  const [viewingNotice, setViewingNotice] = useState<PrivacyNotice | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<NoticeFormData>(emptyFormData());

  // ── API Data Loading ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [noticesRes, consentStats, templatesRes, versionsRes] = await Promise.all([
          api.privacy.listNotices(),
          api.privacy.getConsentStats(),
          api.privacy.listNoticeTemplates().catch(() => null),
          api.privacy.listNoticeVersionHistory().catch(() => null),
        ]);
        if (cancelled) return;
        const hasServerNotices = !!(noticesRes?.notices && noticesRes.notices.length > 0);
        const hasServerConsent = !!(consentStats && Array.isArray(consentStats) && consentStats.length > 0);
        if (hasServerNotices) {
          setNotices(noticesRes.notices);
        }
        if (hasServerConsent) {
          setConsentAnalytics(consentStats);
        }
        if (templatesRes && Array.isArray(templatesRes) && templatesRes.length > 0) {
          setTemplates(templatesRes);
        }
        if (versionsRes && Array.isArray(versionsRes) && versionsRes.length > 0) {
          setVersionHistory(versionsRes);
        }
        // When the org has no real records yet, fall back to bundled sample data
        // ONLY behind an explicit banner — never as silent "live" metrics.
        if (!hasServerNotices && !hasServerConsent) {
          setNotices(initialNotices);
          setConsentAnalytics(initialConsentAnalytics);
          setVersionHistory(initialVersionHistory);
          setUsingSampleData(true);
        }
        setLoadError(null);
      } catch (err: unknown) {
        if (!cancelled) {
          // Server unreachable: show sample data, clearly flagged as such.
          setNotices(initialNotices);
          setConsentAnalytics(initialConsentAnalytics);
          setVersionHistory(initialVersionHistory);
          setUsingSampleData(true);
          setLoadError('Unable to connect to server. Showing sample data only.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Tabs configuration
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'notices', label: 'Notices', icon: <FileText className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <Layout className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // ── Computed Values ─────────────────────────────────────────────────────────

  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      const matchSearch = searchQuery === '' ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'All' || n.type === typeFilter;
      const matchStatus = statusFilter === 'All' || n.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [notices, searchQuery, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = notices.length;
    const published = notices.filter(n => n.status === 'Published').length;
    const pendingReview = notices.filter(n => n.status === 'PendingReview').length;
    const drafts = notices.filter(n => n.status === 'Draft').length;
    const archived = notices.filter(n => n.status === 'Archived').length;
    const avgUpdateFrequencyDays = notices.length > 0
      ? Math.round(notices.reduce((acc, n) => {
          const created = new Date(n.createdAt).getTime();
          const updated = new Date(n.lastUpdated).getTime();
          const diffDays = Math.max(1, Math.ceil((updated - created) / (1000 * 60 * 60 * 24)));
          const versionNum = parseFloat(n.version) || 1;
          return acc + (diffDays / versionNum);
        }, 0) / notices.length)
      : 0;
    return { total, published, pendingReview, drafts, archived, avgUpdateFrequencyDays };
  }, [notices]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateNotice = useCallback(async () => {
    const now = new Date().toISOString().split('T')[0];
    const newNotice: PrivacyNotice = {
      id: `PN-${String(notices.length + 1).padStart(3, '0')}`,
      title: formData.title,
      type: formData.type,
      status: formData.status,
      version: '1.0',
      content: formData.content,
      effectiveDate: formData.effectiveDate || now,
      lastUpdated: now,
      createdAt: now,
      createdBy: user?.name || user?.email || 'Current User',
      versionNotes: formData.versionNotes,
      language: formData.language,
      jurisdiction: formData.jurisdiction,
      viewCount: 0,
      acceptanceCount: 0,
      acceptanceRate: 0,
    };
    try {
      const created = await api.privacy.createNotice({
        name: formData.title,
        triggerContext: formData.type,
        noticeContent: formData.content,
        status: formData.status === 'Published' ? 'active' : 'draft',
        language: formData.language,
        version: '1.0',
      });
      if (created?.id) {
        newNotice.id = created.id;
        // A real record now exists; we are no longer showing only sample data.
        setUsingSampleData(false);
      }
    } catch (err: unknown) {
      setLoadError('Failed to save notice to server. Changes saved locally.');
    }
    setNotices(prev => [newNotice, ...prev]);
    const historyEntry: VersionHistoryEntry = {
      id: `VH-${String(versionHistory.length + 1).padStart(3, '0')}`,
      noticeId: newNotice.id,
      noticeTitle: newNotice.title,
      version: '1.0',
      changedBy: newNotice.createdBy,
      changedAt: now,
      changeDescription: formData.versionNotes || 'Initial creation',
      status: newNotice.status,
    };
    setVersionHistory(prev => [historyEntry, ...prev]);
    setFormData(emptyFormData());
    setShowCreateModal(false);
  }, [formData, notices.length, user, versionHistory.length]);

  const handleUpdateNotice = useCallback(async () => {
    if (!editingNotice) return;
    const now = new Date().toISOString().split('T')[0];
    const currentVersion = parseFloat(editingNotice.version) || 1.0;
    const newVersion = (currentVersion + 0.1).toFixed(1);
    try {
      await api.privacy.updateNotice(editingNotice.id, {
        name: formData.title,
        triggerContext: formData.type,
        noticeContent: formData.content,
        status: formData.status === 'Published' ? 'active' : 'draft',
        language: formData.language,
        version: newVersion,
      });
    } catch (err: unknown) {
      setLoadError('Failed to update notice on server. Changes saved locally.');
    }
    setNotices(prev => prev.map(n => {
      if (n.id !== editingNotice.id) return n;
      return {
        ...n,
        title: formData.title,
        type: formData.type,
        status: formData.status,
        content: formData.content,
        effectiveDate: formData.effectiveDate || n.effectiveDate,
        lastUpdated: now,
        versionNotes: formData.versionNotes,
        version: newVersion,
        language: formData.language,
        jurisdiction: formData.jurisdiction,
      };
    }));
    const historyEntry: VersionHistoryEntry = {
      id: `VH-${String(versionHistory.length + 1).padStart(3, '0')}`,
      noticeId: editingNotice.id,
      noticeTitle: formData.title,
      version: newVersion,
      changedBy: user?.name || user?.email || 'Current User',
      changedAt: now,
      changeDescription: formData.versionNotes || 'Notice updated',
      status: formData.status,
    };
    setVersionHistory(prev => [historyEntry, ...prev]);
    setEditingNotice(null);
    setFormData(emptyFormData());
    setShowCreateModal(false);
  }, [editingNotice, formData, user, versionHistory.length]);

  const handleDeleteNotice = useCallback(async (id: string) => {
    try {
      await api.privacy.deleteNotice(id);
    } catch (err: unknown) {
      setLoadError('Failed to delete notice on server. Removed locally.');
    }
    setNotices(prev => prev.filter(n => n.id !== id));
    setShowDeleteConfirm(null);
  }, []);

  const handleEditClick = useCallback((notice: PrivacyNotice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      type: notice.type,
      status: notice.status,
      content: notice.content,
      effectiveDate: notice.effectiveDate,
      versionNotes: '',
      language: notice.language,
      jurisdiction: notice.jurisdiction,
    });
    setShowCreateModal(true);
  }, []);

  const handleViewClick = useCallback((notice: PrivacyNotice) => {
    setViewingNotice(notice);
    setShowViewModal(true);
  }, []);

  const handleUseTemplate = useCallback((template: NoticeTemplate) => {
    setEditingNotice(null);
    setFormData({
      title: template.name,
      type: template.type,
      status: 'Draft',
      content: template.content,
      effectiveDate: '',
      versionNotes: `Created from template: ${template.name}`,
      language: 'English',
      jurisdiction: template.jurisdiction,
    });
    setShowCreateModal(true);
    setActiveTab('notices');
  }, []);

  const handleDuplicateNotice = useCallback((notice: PrivacyNotice) => {
    setEditingNotice(null);
    setFormData({
      title: `${notice.title} (Copy)`,
      type: notice.type,
      status: 'Draft',
      content: notice.content,
      effectiveDate: '',
      versionNotes: `Duplicated from ${notice.title} v${notice.version}`,
      language: notice.language,
      jurisdiction: notice.jurisdiction,
    });
    setShowCreateModal(true);
  }, []);

  const handlePublishNotice = useCallback(async (id: string) => {
    try {
      await api.privacy.updateNotice(id, { status: 'active' });
    } catch (err: unknown) {
      setLoadError('Failed to publish notice on server. Updated locally.');
    }
    const now = new Date().toISOString().split('T')[0];
    setNotices(prev => prev.map(n => {
      if (n.id !== id) return n;
      return { ...n, status: 'Published' as NoticeStatus, lastUpdated: now };
    }));
  }, []);

  const handleArchiveNotice = useCallback(async (id: string) => {
    try {
      await api.privacy.updateNotice(id, { status: 'archived' });
    } catch (err: unknown) {
      setLoadError('Failed to archive notice on server. Updated locally.');
    }
    const now = new Date().toISOString().split('T')[0];
    setNotices(prev => prev.map(n => {
      if (n.id !== id) return n;
      return { ...n, status: 'Archived' as NoticeStatus, lastUpdated: now };
    }));
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setEditingNotice(null);
    setFormData(emptyFormData());
  }, []);

  // ── Render: Create/Edit Modal ───────────────────────────────────────────────

  const renderCreateEditModal = () => {
    if (!showCreateModal) return null;
    const isEditing = editingNotice !== null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeCreateModal}>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                {isEditing ? <Edit className="w-5 h-5 text-teal-400" /> : <Plus className="w-5 h-5 text-teal-400" />}
              </div>
              <h2 className="text-lg font-semibold">{isEditing ? `${t('common.edit')} Privacy Notice` : `${t('common.create')} Privacy Notice`}</h2>
            </div>
            <button onClick={closeCreateModal} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Website Privacy Policy - EU Region"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Notice Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as NoticeType }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Website">Website</option>
                  <option value="App">Application</option>
                  <option value="Email">Email</option>
                  <option value="Cookie">Cookie</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('common.status')}</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as NoticeStatus }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="PendingReview">Pending Review</option>
                  <option value="Published">Published</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Language</label>
                <select
                  value={formData.language}
                  onChange={e => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Jurisdiction</label>
                <select
                  value={formData.jurisdiction}
                  onChange={e => setFormData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Effective Date</label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={e => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Content <span className="text-red-400">*</span></label>
              <textarea
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the full privacy notice content..."
                rows={14}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono text-sm leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Version Notes</label>
              <textarea
                value={formData.versionNotes}
                onChange={e => setFormData(prev => ({ ...prev, versionNotes: e.target.value }))}
                placeholder="Describe the changes made in this version..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700 sticky bottom-0 bg-slate-800 rounded-b-2xl">
            <button onClick={closeCreateModal} className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium">
              {t('common.cancel')}
            </button>
            <button
              onClick={isEditing ? handleUpdateNotice : handleCreateNotice}
              disabled={!formData.title.trim() || !formData.content.trim()}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {isEditing ? t('common.save') : t('common.create')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render: View Modal ──────────────────────────────────────────────────────

  const renderViewModal = () => {
    if (!showViewModal || !viewingNotice) return null;
    const typeConf = noticeTypeConfig[viewingNotice.type];
    const statusConf = noticeStatusConfig[viewingNotice.status];
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowViewModal(false)}>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{viewingNotice.title}</h2>
                <p className="text-slate-400 text-sm">Version {viewingNotice.version} | {viewingNotice.id}</p>
              </div>
            </div>
            <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <Badge text={typeConf.label} className={typeConf.color} icon={typeConf.icon} />
              <Badge text={statusConf.label} className={statusConf.color} icon={statusConf.icon} />
              <Badge text={viewingNotice.language} className="bg-slate-500/20 text-slate-400 border-slate-500/30" />
              <Badge text={viewingNotice.jurisdiction} className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30" icon={<Globe className="w-3 h-3" />} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <span className="text-slate-500 text-xs">Effective Date</span>
                <div className="text-sm font-medium mt-0.5">{viewingNotice.effectiveDate || 'Not set'}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <span className="text-slate-500 text-xs">Last Updated</span>
                <div className="text-sm font-medium mt-0.5">{viewingNotice.lastUpdated}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <span className="text-slate-500 text-xs">Total Views</span>
                <div className="text-sm font-medium mt-0.5">{viewingNotice.viewCount.toLocaleString()}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <span className="text-slate-500 text-xs">Acceptance Rate</span>
                <div className="text-sm font-medium mt-0.5">{viewingNotice.acceptanceRate}%</div>
              </div>
            </div>
            {viewingNotice.versionNotes && (
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mb-6">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Version Notes</span>
                <p className="text-slate-300 text-sm mt-1">{viewingNotice.versionNotes}</p>
              </div>
            )}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Notice Content</span>
                <button
                  onClick={() => navigator.clipboard.writeText(viewingNotice.content)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed font-mono">
                {viewingNotice.content}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-6 border-t border-slate-700 sticky bottom-0 bg-slate-800 rounded-b-2xl">
            <div className="text-sm text-slate-500">
              Created by {viewingNotice.createdBy} on {viewingNotice.createdAt}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(viewingNotice);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {t('common.edit')}
              </button>
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Delete Confirmation ─────────────────────────────────────────────

  const renderDeleteConfirm = () => {
    if (!showDeleteConfirm) return null;
    const notice = notices.find(n => n.id === showDeleteConfirm);
    if (!notice) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold">{t('common.delete')} Privacy Notice</h3>
            </div>
            <p className="text-slate-300 mb-2">
              Are you sure you want to delete <span className="font-semibold text-white">{notice.title}</span>?
            </p>
            <p className="text-slate-500 text-sm">
              This action cannot be undone. All version history associated with this notice will be preserved for audit purposes.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
            <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium">
              {t('common.cancel')}
            </button>
            <button
              onClick={() => handleDeleteNotice(showDeleteConfirm)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Notices Tab ─────────────────────────────────────────────────────

  const renderNoticesTab = () => (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Notices"
          value={stats.total}
          icon={<FileText className="w-4 h-4" />}
          color="bg-slate-500/20"
          subtitle={`${stats.drafts} drafts`}
        />
        <StatCard
          label="Published"
          value={stats.published}
          icon={<CheckCircle className="w-4 h-4 text-green-400" />}
          color="bg-green-500/20"
          subtitle="Currently live"
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingReview}
          icon={<Clock className="w-4 h-4 text-blue-400" />}
          color="bg-blue-500/20"
          subtitle="Awaiting approval"
        />
        <StatCard
          label="Avg Update Cycle"
          value={`${stats.avgUpdateFrequencyDays}d`}
          icon={<RefreshCw className="w-4 h-4 text-purple-400" />}
          color="bg-purple-500/20"
          subtitle="Per version"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`${t('common.search')} notices...`}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-700 rounded">
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as NoticeType | 'All')}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
          >
            <option value="All">All Types</option>
            <option value="Website">Website</option>
            <option value="App">Application</option>
            <option value="Email">Email</option>
            <option value="Cookie">Cookie</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as NoticeStatus | 'All')}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="PendingReview">Pending Review</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
          <button
            onClick={() => {
              setEditingNotice(null);
              setFormData(emptyFormData());
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {t('common.create')}
          </button>
        </div>
      </div>

      {/* Notices Table */}
      {filteredNotices.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-400 mb-1">{t('common.noResults')}</h3>
          <p className="text-slate-500 text-sm">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">{t('common.status')}</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Version</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Last Updated</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Jurisdiction</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredNotices.map(notice => {
                  const typeConf = noticeTypeConfig[notice.type];
                  const statusConf = noticeStatusConfig[notice.status];
                  return (
                    <tr key={notice.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <div>
                          <button onClick={() => handleViewClick(notice)} className="text-sm font-medium text-white hover:text-teal-400 transition-colors text-left">
                            {notice.title}
                          </button>
                          <div className="text-xs text-slate-500 mt-0.5">{notice.id} | {notice.language}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge text={typeConf.label} className={typeConf.color} icon={typeConf.icon} />
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge text={statusConf.label} className={statusConf.color} icon={statusConf.icon} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-300">v{notice.version}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-400">{notice.lastUpdated}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-400">{notice.jurisdiction}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleViewClick(notice)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4 text-slate-400 hover:text-blue-400" />
                          </button>
                          <button onClick={() => handleEditClick(notice)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors" title={t('common.edit')}>
                            <Edit className="w-4 h-4 text-slate-400 hover:text-teal-400" />
                          </button>
                          <button onClick={() => handleDuplicateNotice(notice)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors" title="Duplicate">
                            <Copy className="w-4 h-4 text-slate-400 hover:text-purple-400" />
                          </button>
                          {notice.status === 'Draft' && (
                            <button onClick={() => handlePublishNotice(notice.id)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors" title="Publish">
                              <Send className="w-4 h-4 text-slate-400 hover:text-green-400" />
                            </button>
                          )}
                          {notice.status === 'Published' && (
                            <button onClick={() => handleArchiveNotice(notice.id)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors" title="Archive">
                              <Archive className="w-4 h-4 text-slate-400 hover:text-yellow-400" />
                            </button>
                          )}
                          <button onClick={() => setShowDeleteConfirm(notice.id)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors" title={t('common.delete')}>
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing {filteredNotices.length} of {notices.length} notices
            </span>
            <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <Download className="w-4 h-4" />
              {t('common.export')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Render: Templates Tab ───────────────────────────────────────────────────

  const renderTemplatesTab = () => {
    const templateCategories = Array.from(new Set(templates.map(t => t.category)));
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-1">Privacy Notice Templates</h2>
          <p className="text-slate-400 text-sm">
            Pre-built templates for common privacy notice requirements. Select a template to customize and deploy.
          </p>
        </div>

        {templateCategories.map(category => {
          const categoryTemplates = templates.filter(t => t.category === category);
          return (
            <div key={category} className="mb-8">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {category}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoryTemplates.map(template => (
                  <div key={template.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5 hover:border-slate-600/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${noticeTypeConfig[template.type].color}`}>
                          {noticeTypeConfig[template.type].icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{template.name}</h4>
                          <span className="text-xs text-slate-500">{template.id} | Updated {template.lastUpdated}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed">{template.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {template.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs rounded-full border border-slate-600/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        text={template.jurisdiction}
                        className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                        icon={<Globe className="w-3 h-3" />}
                      />
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600/20 hover:bg-teal-600/40 text-teal-400 rounded-lg transition-colors text-sm font-medium border border-teal-500/30"
                      >
                        <Layers className="w-4 h-4" />
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Render: Analytics Tab ───────────────────────────────────────────────────

  const renderAnalyticsTab = () => {
    if (consentAnalytics.length === 0) {
      return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-400 mb-1">No consent analytics yet</h3>
          <p className="text-slate-500 text-sm">
            Consent and acceptance metrics will appear here once your published notices start
            collecting views.
          </p>
        </div>
      );
    }
    const totalViews = consentAnalytics.reduce((sum, a) => sum + a.totalViews, 0);
    const totalAcceptances = consentAnalytics.reduce((sum, a) => sum + a.totalAcceptances, 0);
    const overallConsentRate = totalViews > 0 ? ((totalAcceptances / totalViews) * 100).toFixed(1) : '0';
    const avgDeclineRate = consentAnalytics.length > 0
      ? (consentAnalytics.reduce((sum, a) => sum + a.declineRate, 0) / consentAnalytics.length).toFixed(1)
      : '0';

    return (
      <div>
        {/* Analytics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Views"
            value={totalViews.toLocaleString()}
            icon={<Eye className="w-4 h-4 text-blue-400" />}
            color="bg-blue-500/20"
            subtitle="All notice types"
          />
          <StatCard
            label="Total Acceptances"
            value={totalAcceptances.toLocaleString()}
            icon={<CheckCircle className="w-4 h-4 text-green-400" />}
            color="bg-green-500/20"
            subtitle="Consent granted"
          />
          <StatCard
            label="Overall Consent Rate"
            value={`${overallConsentRate}%`}
            icon={<TrendingUp className="w-4 h-4 text-teal-400" />}
            color="bg-teal-500/20"
            subtitle="Acceptance / views"
          />
          <StatCard
            label="Avg Decline Rate"
            value={`${avgDeclineRate}%`}
            icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
            color="bg-orange-500/20"
            subtitle="Explicit declines"
          />
        </div>

        {/* Consent Rates by Notice Type */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            Consent Rates by Notice Type
          </h3>
          <div className="space-y-4">
            {consentAnalytics.map(analytics => {
              const typeConf = noticeTypeConfig[analytics.noticeType];
              return (
                <div key={analytics.noticeType} className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge text={typeConf.label} className={typeConf.color} icon={typeConf.icon} />
                      <span className="text-sm text-slate-300">{analytics.totalViews.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400 font-medium">{analytics.consentRate}% consent</span>
                      <span className="text-red-400">{analytics.declineRate}% decline</span>
                      <span className="text-slate-500">Avg time: {analytics.averageTimeToAccept}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div className="flex h-full">
                      <div
                        className="bg-green-500 h-full transition-all duration-500"
                        style={{ width: `${analytics.consentRate}%` }}
                      />
                      <div
                        className="bg-red-500 h-full transition-all duration-500"
                        style={{ width: `${analytics.declineRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>{analytics.totalAcceptances.toLocaleString()} accepted</span>
                    <span>{(analytics.totalViews - analytics.totalAcceptances - Math.round(analytics.totalViews * analytics.declineRate / 100)).toLocaleString()} pending/abandoned</span>
                    <span>{Math.round(analytics.totalViews * analytics.declineRate / 100).toLocaleString()} declined</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notice Performance Breakdown */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Individual Notice Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">Notice</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">Views</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">Acceptances</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">Rate</th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {notices
                  .filter(n => n.viewCount > 0)
                  .sort((a, b) => b.viewCount - a.viewCount)
                  .map(notice => {
                    const statusConf = noticeStatusConfig[notice.status];
                    return (
                      <tr key={notice.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="text-sm font-medium text-white">{notice.title}</div>
                          <div className="text-xs text-slate-500">v{notice.version} | {notice.type}</div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm text-slate-300">
                          {notice.viewCount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm text-slate-300">
                          {notice.acceptanceCount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`text-sm font-medium ${notice.acceptanceRate >= 90 ? 'text-green-400' : notice.acceptanceRate >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {notice.acceptanceRate}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge text={statusConf.label} className={statusConf.color} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Version History Timeline */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            Version History Timeline
          </h3>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-700/50" />
            <div className="space-y-4">
              {versionHistory.map((entry, index) => {
                const statusConf = noticeStatusConfig[entry.status];
                return (
                  <div key={entry.id} className="relative flex items-start gap-4 pl-2">
                    <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      index === 0 ? 'bg-teal-500/30 border-2 border-teal-400' :
                      entry.status === 'Published' ? 'bg-green-500/20 border border-green-500/40' :
                      entry.status === 'Archived' ? 'bg-yellow-500/20 border border-yellow-500/40' :
                      'bg-slate-600/30 border border-slate-600/50'
                    }`}>
                      {entry.status === 'Published' ? (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      ) : entry.status === 'Archived' ? (
                        <Archive className="w-3 h-3 text-yellow-400" />
                      ) : entry.status === 'PendingReview' ? (
                        <Clock className="w-3 h-3 text-blue-400" />
                      ) : (
                        <Edit className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{entry.noticeTitle}</span>
                          <span className="text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">v{entry.version}</span>
                          <Badge text={statusConf.label} className={statusConf.color} />
                        </div>
                        <span className="text-xs text-slate-500">{entry.changedAt}</span>
                      </div>
                      <p className="text-sm text-slate-400">{entry.changeDescription}</p>
                      <span className="text-xs text-slate-600 mt-1 block">by {entry.changedBy}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('privacy.title')}</h1>
            <p className="text-slate-400 text-sm">Manage, publish, and monitor privacy notices across all channels and jurisdictions</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 mb-4 text-slate-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading privacy notices...</span>
        </div>
      )}

      {/* Sample Data Banner — shown whenever bundled fixtures stand in for real records */}
      {usingSampleData && !isLoading && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm text-blue-300">
            Sample data shown for demonstration. These notices and consent metrics are illustrative
            examples, not your organization&apos;s live data. Create a notice to get started.
          </span>
        </div>
      )}

      {/* Error Banner */}
      {loadError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-300">{loadError}</span>
          <button onClick={() => setLoadError(null)} className="ml-auto text-amber-400 hover:text-amber-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 bg-slate-800/50 backdrop-blur-sm rounded-xl p-1 w-fit border border-slate-700/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'notices' && renderNoticesTab()}
      {activeTab === 'templates' && renderTemplatesTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}

      {/* Modals */}
      {renderCreateEditModal()}
      {renderViewModal()}
      {renderDeleteConfirm()}
    </div>
  );
};

export default PrivacyNoticeServing;
