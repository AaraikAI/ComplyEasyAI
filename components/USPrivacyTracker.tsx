/**
 * US State Privacy Law Tracker
 *
 * Comprehensive tracker for all US state privacy laws:
 * - Track enacted and proposed state privacy laws
 * - Consumer rights, opt-out mechanisms, thresholds, penalties per state
 * - Interactive US state grid/map visualization
 * - Compliance gap analysis across states
 * - Multi-state compliance checklist
 * - Side-by-side comparison tool
 *
 * Covers: CA (CPRA), CO (CPA), CT (CTDPA), VA (VCDPA), UT (UCPA),
 * IA (ICDPA), IN (INCDPA), TN (TIPA), MT (MCDPA), TX (TDPSA),
 * OR (OCPA), DE (DPDPA), NH, NJ, MD, MN, NE, RI, VT, and 2025-2026 enacted states
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import {
  MapPin, Shield, CheckCircle, AlertTriangle, X, Plus, FileText,
  Clock, Search, Download, Eye, ChevronRight, BarChart3,
  Calendar, AlertCircle, Users, Scale, Filter, ArrowLeftRight,
  Building2, Gavel, Flag, Globe, Lock, ChevronDown, ChevronUp
} from 'lucide-react';

// ── Data Models ──────────────────────────────────────────────────────────

type LawStatus = 'enacted' | 'effective' | 'proposed' | 'failed';
type ComplianceLevel = 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'not_applicable';
type TabKey = 'overview' | 'map' | 'comparison' | 'gap_analysis' | 'tracker';

interface ConsumerRight {
  name: string;
  available: boolean;
  details: string;
}

interface StatePrivacyLaw {
  id: string;
  stateCode: string;
  stateName: string;
  lawName: string;
  lawAbbreviation: string;
  status: LawStatus;
  enactedDate: string;
  effectiveDate: string;
  amendedDate: string | null;
  enforcementAgency: string;
  privateRightOfAction: boolean;
  curePeriod: number | null;
  thresholds: {
    revenue: string | null;
    consumers: string | null;
    dataRevenue: string | null;
    other: string | null;
  };
  consumerRights: ConsumerRight[];
  optOutMechanisms: string[];
  penalties: {
    maxPerViolation: number;
    additionalPenalties: string;
  };
  keyProvisions: string[];
  complianceLevel: ComplianceLevel;
}

interface ComplianceGap {
  requirement: string;
  category: string;
  statesRequiring: string[];
  currentStatus: 'met' | 'partial' | 'not_met';
  priority: 'high' | 'medium' | 'low';
  effort: string;
}

interface ComplianceTask {
  id: string;
  task: string;
  category: string;
  applicableStates: string[];
  completed: boolean;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

// ── Default Data ─────────────────────────────────────────────────────────

const DEFAULT_STATE_LAWS: StatePrivacyLaw[] = [
  {
    id: 'ca', stateCode: 'CA', stateName: 'California', lawName: 'California Privacy Rights Act', lawAbbreviation: 'CPRA/CCPA',
    status: 'effective', enactedDate: '2020-11-03', effectiveDate: '2023-01-01', amendedDate: '2023-01-01',
    enforcementAgency: 'California Privacy Protection Agency (CPPA)', privateRightOfAction: true, curePeriod: null,
    thresholds: { revenue: '$25M annual gross revenue', consumers: '100,000 consumers/households', dataRevenue: '50%+ revenue from selling/sharing PI', other: null },
    consumerRights: [
      { name: 'Right to Know', available: true, details: 'Access personal information collected, used, disclosed, and sold' },
      { name: 'Right to Delete', available: true, details: 'Request deletion of personal information' },
      { name: 'Right to Correct', available: true, details: 'Request correction of inaccurate personal information' },
      { name: 'Right to Opt-Out of Sale/Sharing', available: true, details: 'Opt out of sale and sharing of personal information' },
      { name: 'Right to Limit Use of Sensitive PI', available: true, details: 'Limit use and disclosure of sensitive personal information' },
      { name: 'Right to Non-Discrimination', available: true, details: 'Not be discriminated against for exercising rights' },
      { name: 'Right to Data Portability', available: true, details: 'Obtain personal information in portable format' },
    ],
    optOutMechanisms: ['Do Not Sell or Share My Personal Information link', 'Global Privacy Control (GPC)', 'Authorized agent requests'],
    penalties: { maxPerViolation: 7500, additionalPenalties: '$2,500/unintentional violation; $7,500/intentional violation or violations involving minors. Private right of action for data breaches ($100-$750/consumer/incident).' },
    keyProvisions: ['Sensitive personal information protections', 'Automated decision-making rights', 'Risk assessments required', 'Cybersecurity audit requirements', 'Dark patterns prohibited'],
    complianceLevel: 'compliant',
  },
  {
    id: 'co', stateCode: 'CO', stateName: 'Colorado', lawName: 'Colorado Privacy Act', lawAbbreviation: 'CPA',
    status: 'effective', enactedDate: '2021-07-07', effectiveDate: '2023-07-01', amendedDate: null,
    enforcementAgency: 'Colorado Attorney General', privateRightOfAction: false, curePeriod: null,
    thresholds: { revenue: null, consumers: '100,000 consumers annually', dataRevenue: '25,000 consumers + revenue from selling PI', other: null },
    consumerRights: [
      { name: 'Right to Access', available: true, details: 'Confirm processing and access personal data' },
      { name: 'Right to Correct', available: true, details: 'Correct inaccuracies in personal data' },
      { name: 'Right to Delete', available: true, details: 'Delete personal data' },
      { name: 'Right to Data Portability', available: true, details: 'Obtain data in portable and usable format' },
      { name: 'Right to Opt-Out', available: true, details: 'Opt out of targeted advertising, sale of data, and profiling' },
    ],
    optOutMechanisms: ['Universal opt-out mechanism required (GPC)', 'Opt-out preference signals must be honored'],
    penalties: { maxPerViolation: 20000, additionalPenalties: 'Up to $20,000 per violation. AG enforcement only.' },
    keyProvisions: ['Universal opt-out mechanism required', 'Data protection assessments', 'Consent for sensitive data processing', 'No cure period (expired July 2025)'],
    complianceLevel: 'compliant',
  },
  {
    id: 'ct', stateCode: 'CT', stateName: 'Connecticut', lawName: 'Connecticut Data Privacy Act', lawAbbreviation: 'CTDPA',
    status: 'effective', enactedDate: '2022-05-10', effectiveDate: '2023-07-01', amendedDate: '2024-01-01',
    enforcementAgency: 'Connecticut Attorney General', privateRightOfAction: false, curePeriod: null,
    thresholds: { revenue: null, consumers: '100,000 consumers', dataRevenue: '25,000 consumers + revenue from selling PI', other: null },
    consumerRights: [
      { name: 'Right to Access', available: true, details: 'Confirm processing and access personal data' },
      { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' },
      { name: 'Right to Delete', available: true, details: 'Delete personal data' },
      { name: 'Right to Data Portability', available: true, details: 'Obtain data in portable format' },
      { name: 'Right to Opt-Out', available: true, details: 'Opt out of sale, targeted advertising, profiling' },
    ],
    optOutMechanisms: ['Universal opt-out mechanism (effective 1/1/2025)', 'GPC support required'],
    penalties: { maxPerViolation: 5000, additionalPenalties: 'Up to $5,000 per violation via CUTPA. AG enforcement.' },
    keyProvisions: ['Universal opt-out signal recognition', 'Consent for sensitive data', 'Data protection assessments', 'Cure period expired Jan 2025'],
    complianceLevel: 'compliant',
  },
  {
    id: 'va', stateCode: 'VA', stateName: 'Virginia', lawName: 'Virginia Consumer Data Protection Act', lawAbbreviation: 'VCDPA',
    status: 'effective', enactedDate: '2021-03-02', effectiveDate: '2023-01-01', amendedDate: null,
    enforcementAgency: 'Virginia Attorney General', privateRightOfAction: false, curePeriod: 30,
    thresholds: { revenue: null, consumers: '100,000 consumers', dataRevenue: '25,000 consumers + >50% revenue from data sales', other: null },
    consumerRights: [
      { name: 'Right to Access', available: true, details: 'Confirm processing and access personal data' },
      { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' },
      { name: 'Right to Delete', available: true, details: 'Delete personal data' },
      { name: 'Right to Data Portability', available: true, details: 'Obtain data in portable format' },
      { name: 'Right to Opt-Out', available: true, details: 'Opt out of sale, targeted advertising, profiling' },
    ],
    optOutMechanisms: ['Clear opt-out mechanism for data sales and targeted advertising'],
    penalties: { maxPerViolation: 7500, additionalPenalties: 'Up to $7,500 per violation. AG enforcement only.' },
    keyProvisions: ['30-day cure period', 'Data protection assessments', 'Consent for sensitive data', 'Processor obligations'],
    complianceLevel: 'compliant',
  },
  {
    id: 'ut', stateCode: 'UT', stateName: 'Utah', lawName: 'Utah Consumer Privacy Act', lawAbbreviation: 'UCPA',
    status: 'effective', enactedDate: '2022-03-24', effectiveDate: '2023-12-31', amendedDate: null,
    enforcementAgency: 'Utah Attorney General + Division of Consumer Protection', privateRightOfAction: false, curePeriod: 30,
    thresholds: { revenue: '$25M annual revenue', consumers: '100,000 consumers', dataRevenue: '50%+ revenue from selling PI and controlling/processing 25,000+ consumers', other: null },
    consumerRights: [
      { name: 'Right to Access', available: true, details: 'Confirm processing and access personal data' },
      { name: 'Right to Delete', available: true, details: 'Delete personal data provided by consumer' },
      { name: 'Right to Data Portability', available: true, details: 'Obtain data in portable format' },
      { name: 'Right to Opt-Out', available: true, details: 'Opt out of sale and targeted advertising' },
      { name: 'Right to Correct', available: false, details: 'Not included in UCPA' },
    ],
    optOutMechanisms: ['Opt-out for sale of personal data', 'Opt-out for targeted advertising'],
    penalties: { maxPerViolation: 7500, additionalPenalties: '$7,500 per violation. AG enforcement.' },
    keyProvisions: ['30-day cure period', 'No right to correct', 'Business-friendly thresholds', 'No data protection assessments required'],
    complianceLevel: 'compliant',
  },
  {
    id: 'tx', stateCode: 'TX', stateName: 'Texas', lawName: 'Texas Data Privacy and Security Act', lawAbbreviation: 'TDPSA',
    status: 'effective', enactedDate: '2023-06-18', effectiveDate: '2024-07-01', amendedDate: null,
    enforcementAgency: 'Texas Attorney General', privateRightOfAction: false, curePeriod: 30,
    thresholds: { revenue: null, consumers: 'Conducts business in Texas or produces products/services consumed by Texas residents', dataRevenue: 'NOT a small business as defined by SBA', other: 'No consumer number threshold' },
    consumerRights: [
      { name: 'Right to Access', available: true, details: 'Confirm processing and access personal data' },
      { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' },
      { name: 'Right to Delete', available: true, details: 'Delete personal data' },
      { name: 'Right to Data Portability', available: true, details: 'Obtain data in portable format' },
      { name: 'Right to Opt-Out', available: true, details: 'Opt out of sale, targeted advertising, profiling' },
    ],
    optOutMechanisms: ['Universal opt-out mechanism (effective 1/1/2025)', 'Must honor GPC signals'],
    penalties: { maxPerViolation: 25000, additionalPenalties: 'Up to $25,000 per violation. AG enforcement.' },
    keyProvisions: ['No consumer number threshold', 'Small business exemption', '30-day cure period', 'Universal opt-out mechanism required', 'Data protection assessments'],
    complianceLevel: 'partial',
  },
  {
    id: 'or', stateCode: 'OR', stateName: 'Oregon', lawName: 'Oregon Consumer Privacy Act', lawAbbreviation: 'OCPA',
    status: 'effective', enactedDate: '2023-07-18', effectiveDate: '2024-07-01', amendedDate: null,
    enforcementAgency: 'Oregon Attorney General', privateRightOfAction: false, curePeriod: null,
    thresholds: { revenue: null, consumers: '100,000 consumers', dataRevenue: '25,000 consumers + revenue from selling PI', other: 'Applies to nonprofits (from July 2025)' },
    consumerRights: [
      { name: 'Right to Access', available: true, details: 'Confirm processing and access personal data' },
      { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' },
      { name: 'Right to Delete', available: true, details: 'Delete personal data' },
      { name: 'Right to Data Portability', available: true, details: 'Obtain personal data in list form' },
      { name: 'Right to Opt-Out', available: true, details: 'Opt out of sale, targeted advertising, profiling' },
    ],
    optOutMechanisms: ['Opt-out mechanism required', 'GPC signal recognition'],
    penalties: { maxPerViolation: 7500, additionalPenalties: '$7,500 per violation. AG enforcement.' },
    keyProvisions: ['Covers nonprofits', 'No cure period (expired Jan 2026)', 'Data protection assessments', 'Right to obtain list of data recipients'],
    complianceLevel: 'partial',
  },
  {
    id: 'de', stateCode: 'DE', stateName: 'Delaware', lawName: 'Delaware Personal Data Privacy Act', lawAbbreviation: 'DPDPA',
    status: 'effective', enactedDate: '2023-09-11', effectiveDate: '2025-01-01', amendedDate: null,
    enforcementAgency: 'Delaware Department of Justice', privateRightOfAction: false, curePeriod: null,
    thresholds: { revenue: null, consumers: '35,000 consumers', dataRevenue: '10,000 consumers + revenue from selling PI', other: 'Lowest consumer threshold among state laws' },
    consumerRights: [
      { name: 'Right to Access', available: true, details: 'Confirm processing and access personal data' },
      { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' },
      { name: 'Right to Delete', available: true, details: 'Delete personal data' },
      { name: 'Right to Data Portability', available: true, details: 'Obtain data in portable format' },
      { name: 'Right to Opt-Out', available: true, details: 'Opt out of sale, targeted advertising, profiling' },
    ],
    optOutMechanisms: ['Opt-out mechanism for sale and targeted advertising'],
    penalties: { maxPerViolation: 10000, additionalPenalties: 'Up to $10,000 per violation.' },
    keyProvisions: ['Lowest consumer threshold (35,000)', 'No cure period (expired Jan 2026)', 'Broad definition of sale', 'Consent for sensitive data'],
    complianceLevel: 'partial',
  },
  {
    id: 'ia', stateCode: 'IA', stateName: 'Iowa', lawName: 'Iowa Consumer Data Protection Act', lawAbbreviation: 'ICDPA', status: 'effective', enactedDate: '2023-03-28', effectiveDate: '2025-01-01', amendedDate: null, enforcementAgency: 'Iowa Attorney General', privateRightOfAction: false, curePeriod: 90, thresholds: { revenue: null, consumers: '100,000 consumers', dataRevenue: '25,000 consumers + >50% revenue from data sales', other: null }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm processing and access' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Obtain in portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Opt out of sale and targeted advertising' }, { name: 'Right to Correct', available: false, details: 'Not available' }], optOutMechanisms: ['Opt-out for sale and targeted advertising'], penalties: { maxPerViolation: 7500, additionalPenalties: '$7,500 per violation. AG enforcement.' }, keyProvisions: ['90-day cure period (longest)', 'No right to correct', 'No data protection assessments', 'Business-friendly'], complianceLevel: 'compliant',
  },
  {
    id: 'in', stateCode: 'IN', stateName: 'Indiana', lawName: 'Indiana Consumer Data Protection Act', lawAbbreviation: 'INCDPA', status: 'effective', enactedDate: '2023-05-01', effectiveDate: '2026-01-01', amendedDate: null, enforcementAgency: 'Indiana Attorney General', privateRightOfAction: false, curePeriod: 30, thresholds: { revenue: null, consumers: '100,000 consumers', dataRevenue: '25,000 consumers + >50% revenue from data sales', other: null }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm and access' }, { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Sale, targeted ads, profiling' }], optOutMechanisms: ['Standard opt-out for sale and targeted advertising'], penalties: { maxPerViolation: 7500, additionalPenalties: '$7,500 per violation.' }, keyProvisions: ['30-day cure period', 'Similar to Virginia VCDPA', 'Effective Jan 2026'], complianceLevel: 'partial',
  },
  {
    id: 'tn', stateCode: 'TN', stateName: 'Tennessee', lawName: 'Tennessee Information Protection Act', lawAbbreviation: 'TIPA', status: 'effective', enactedDate: '2023-05-11', effectiveDate: '2025-07-01', amendedDate: null, enforcementAgency: 'Tennessee Attorney General', privateRightOfAction: false, curePeriod: 60, thresholds: { revenue: '$25M annual revenue', consumers: '175,000 consumers', dataRevenue: '25,000 consumers + >50% revenue from data sales', other: null }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm and access' }, { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Sale, targeted ads, profiling' }], optOutMechanisms: ['Opt-out mechanism required'], penalties: { maxPerViolation: 15000, additionalPenalties: '$7,500-$15,000 per violation.' }, keyProvisions: ['60-day cure period', 'Affirmative defense for NIST framework adherence', 'Revenue threshold ($25M)'], complianceLevel: 'not_assessed',
  },
  {
    id: 'mt', stateCode: 'MT', stateName: 'Montana', lawName: 'Montana Consumer Data Privacy Act', lawAbbreviation: 'MCDPA', status: 'effective', enactedDate: '2023-05-19', effectiveDate: '2024-10-01', amendedDate: null, enforcementAgency: 'Montana Attorney General', privateRightOfAction: false, curePeriod: null, thresholds: { revenue: null, consumers: '50,000 consumers', dataRevenue: '25,000 consumers + revenue from data sales', other: 'Lowest population state with privacy law' }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm and access' }, { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Sale, targeted ads, profiling' }], optOutMechanisms: ['Opt-out mechanism for sale and targeted advertising'], penalties: { maxPerViolation: 7500, additionalPenalties: '$7,500 per violation.' }, keyProvisions: ['Low consumer threshold (50,000)', 'No cure period (expired Apr 2026)', 'Data protection assessments required'], complianceLevel: 'partial',
  },
  {
    id: 'nh', stateCode: 'NH', stateName: 'New Hampshire', lawName: 'New Hampshire Privacy Act', lawAbbreviation: 'NHPA', status: 'effective', enactedDate: '2024-03-06', effectiveDate: '2025-01-01', amendedDate: null, enforcementAgency: 'New Hampshire Attorney General', privateRightOfAction: false, curePeriod: 60, thresholds: { revenue: null, consumers: '35,000 consumers', dataRevenue: '10,000 consumers + revenue from selling PI', other: null }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm and access' }, { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Sale, targeted ads, profiling' }], optOutMechanisms: ['Standard opt-out mechanism'], penalties: { maxPerViolation: 10000, additionalPenalties: '$10,000 per violation.' }, keyProvisions: ['60-day cure period', 'Low consumer threshold', 'Consent for sensitive data'], complianceLevel: 'partial',
  },
  {
    id: 'nj', stateCode: 'NJ', stateName: 'New Jersey', lawName: 'New Jersey Data Privacy Act', lawAbbreviation: 'NJDPA', status: 'effective', enactedDate: '2024-01-16', effectiveDate: '2025-01-15', amendedDate: null, enforcementAgency: 'New Jersey Division of Consumer Affairs', privateRightOfAction: false, curePeriod: 30, thresholds: { revenue: null, consumers: '100,000 consumers', dataRevenue: '25,000 consumers + revenue from selling PI', other: null }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm and access' }, { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Sale, targeted ads, profiling' }], optOutMechanisms: ['Opt-out mechanism required', 'Must honor universal opt-out signals'], penalties: { maxPerViolation: 10000, additionalPenalties: '$10,000 first offense; $20,000 subsequent.' }, keyProvisions: ['30-day cure period (expires Jan 2026)', 'Universal opt-out signals', 'Financial data included', 'Health data protections'], complianceLevel: 'partial',
  },
  {
    id: 'md', stateCode: 'MD', stateName: 'Maryland', lawName: 'Maryland Online Data Privacy Act', lawAbbreviation: 'MODPA', status: 'effective', enactedDate: '2024-05-09', effectiveDate: '2025-10-01', amendedDate: null, enforcementAgency: 'Maryland Attorney General', privateRightOfAction: false, curePeriod: null, thresholds: { revenue: null, consumers: '35,000 consumers', dataRevenue: '10,000 consumers + revenue from selling PI', other: null }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm and access' }, { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Sale, targeted ads, profiling' }], optOutMechanisms: ['Opt-out mechanism required'], penalties: { maxPerViolation: 10000, additionalPenalties: '$10,000 per violation; $25,000 subsequent.' }, keyProvisions: ['No cure period', 'Data minimization requirement (strongest in US)', 'No sale of sensitive data allowed', 'Prohibition on targeted ads to minors'], complianceLevel: 'not_assessed',
  },
  {
    id: 'mn', stateCode: 'MN', stateName: 'Minnesota', lawName: 'Minnesota Consumer Data Privacy Act', lawAbbreviation: 'MNCDPA', status: 'effective', enactedDate: '2024-05-24', effectiveDate: '2025-07-31', amendedDate: null, enforcementAgency: 'Minnesota Attorney General', privateRightOfAction: false, curePeriod: 30, thresholds: { revenue: null, consumers: '100,000 consumers', dataRevenue: '25,000 consumers + revenue from selling PI', other: null }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm and access' }, { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Sale, targeted ads, profiling' }, { name: 'Right to Question Profiling', available: true, details: 'Challenge profiling decisions' }], optOutMechanisms: ['Standard opt-out mechanism'], penalties: { maxPerViolation: 7500, additionalPenalties: '$7,500 per violation.' }, keyProvisions: ['Right to question profiling', '30-day cure period', 'Loyalty program protections', 'Data protection assessments'], complianceLevel: 'not_assessed',
  },
  {
    id: 'ne', stateCode: 'NE', stateName: 'Nebraska', lawName: 'Nebraska Data Privacy Act', lawAbbreviation: 'NEDPA', status: 'effective', enactedDate: '2024-04-17', effectiveDate: '2025-01-01', amendedDate: null, enforcementAgency: 'Nebraska Attorney General', privateRightOfAction: false, curePeriod: 30, thresholds: { revenue: null, consumers: 'Conducts business in Nebraska or targets Nebraska residents', dataRevenue: 'NOT a small business', other: 'No consumer number threshold (similar to Texas)' }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm and access' }, { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Sale, targeted ads, profiling' }], optOutMechanisms: ['Opt-out mechanism required'], penalties: { maxPerViolation: 7500, additionalPenalties: '$7,500 per violation.' }, keyProvisions: ['No consumer number threshold', 'Small business exemption only', '30-day cure period'], complianceLevel: 'not_assessed',
  },
  {
    id: 'ri', stateCode: 'RI', stateName: 'Rhode Island', lawName: 'Rhode Island Data Transparency and Privacy Protection Act', lawAbbreviation: 'RIDTPPA', status: 'effective', enactedDate: '2024-06-25', effectiveDate: '2026-01-01', amendedDate: null, enforcementAgency: 'Rhode Island Attorney General', privateRightOfAction: false, curePeriod: 30, thresholds: { revenue: null, consumers: '35,000 consumers', dataRevenue: '10,000 consumers + revenue from selling PI', other: null }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm and access' }, { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Sale, targeted ads, profiling' }], optOutMechanisms: ['Opt-out mechanism required'], penalties: { maxPerViolation: 10000, additionalPenalties: '$10,000 per violation.' }, keyProvisions: ['30-day cure period', 'Low consumer threshold (35,000)', 'Effective Jan 2026'], complianceLevel: 'not_assessed',
  },
  {
    id: 'vt', stateCode: 'VT', stateName: 'Vermont', lawName: 'Vermont Data Privacy Act', lawAbbreviation: 'VTDPA', status: 'enacted', enactedDate: '2024-06-20', effectiveDate: '2025-07-01', amendedDate: null, enforcementAgency: 'Vermont Attorney General', privateRightOfAction: true, curePeriod: null, thresholds: { revenue: null, consumers: '25,000 consumers', dataRevenue: 'Revenue from selling PI', other: 'Lowest threshold among all states (25,000)' }, consumerRights: [{ name: 'Right to Access', available: true, details: 'Confirm and access' }, { name: 'Right to Correct', available: true, details: 'Correct inaccuracies' }, { name: 'Right to Delete', available: true, details: 'Delete personal data' }, { name: 'Right to Data Portability', available: true, details: 'Portable format' }, { name: 'Right to Opt-Out', available: true, details: 'Sale, targeted ads, profiling' }], optOutMechanisms: ['Universal opt-out mechanism'], penalties: { maxPerViolation: 7500, additionalPenalties: '$7,500 per violation. Private right of action included.' }, keyProvisions: ['Private right of action (like CA)', 'Lowest consumer threshold (25,000)', 'No cure period', 'Data minimization requirements', 'Universal opt-out'], complianceLevel: 'not_assessed',
  },
];

const DEFAULT_GAPS: ComplianceGap[] = [
  { requirement: 'Universal opt-out mechanism (GPC) support', category: 'Opt-Out', statesRequiring: ['CA', 'CO', 'CT', 'TX', 'OR', 'NJ', 'VT'], currentStatus: 'partial', priority: 'high', effort: 'Medium - Requires technical implementation of GPC signal detection' },
  { requirement: 'Data protection impact assessments', category: 'Assessments', statesRequiring: ['CA', 'CO', 'CT', 'VA', 'OR', 'DE', 'MT', 'MN', 'MD'], currentStatus: 'met', priority: 'medium', effort: 'Low - Existing DPIA framework can be extended' },
  { requirement: 'Right to correct personal data', category: 'Consumer Rights', statesRequiring: ['CA', 'CO', 'CT', 'VA', 'TX', 'OR', 'DE', 'IN', 'MT', 'NH', 'NJ', 'MD', 'MN', 'NE', 'RI', 'VT'], currentStatus: 'met', priority: 'high', effort: 'Medium - Data correction workflows needed' },
  { requirement: 'Sensitive data consent mechanisms', category: 'Consent', statesRequiring: ['CA', 'CO', 'CT', 'VA', 'TX', 'OR', 'DE', 'NH', 'NJ', 'MD', 'MN', 'NE'], currentStatus: 'partial', priority: 'high', effort: 'High - Requires granular consent management for each data category' },
  { requirement: 'Data minimization practices', category: 'Data Governance', statesRequiring: ['MD', 'VT', 'MN'], currentStatus: 'not_met', priority: 'medium', effort: 'High - Requires review of all data collection and retention practices' },
  { requirement: 'Private right of action response procedures', category: 'Legal', statesRequiring: ['CA', 'VT'], currentStatus: 'met', priority: 'high', effort: 'Low - Existing incident response covers data breach litigation' },
  { requirement: 'Minor/children data protections', category: 'Minors', statesRequiring: ['CA', 'CT', 'MD', 'NJ'], currentStatus: 'partial', priority: 'high', effort: 'High - Age verification and opt-in for minors required' },
  { requirement: 'No sale of sensitive personal data', category: 'Data Governance', statesRequiring: ['MD'], currentStatus: 'not_met', priority: 'medium', effort: 'Medium - Requires data flow mapping and sale prohibition enforcement' },
];

const DEFAULT_TASKS: ComplianceTask[] = [
  { id: 't-001', task: 'Implement Global Privacy Control (GPC) signal detection', category: 'Technical', applicableStates: ['CA', 'CO', 'CT', 'TX', 'NJ', 'VT'], completed: false, dueDate: '2026-03-01', priority: 'high' },
  { id: 't-002', task: 'Update privacy policy for all effective state laws', category: 'Legal', applicableStates: ['CA', 'CO', 'CT', 'VA', 'UT', 'TX', 'OR', 'DE', 'IA', 'MT', 'NH', 'NJ', 'NE'], completed: true, dueDate: '2025-12-15', priority: 'high' },
  { id: 't-003', task: 'Conduct data protection impact assessments for high-risk processing', category: 'Governance', applicableStates: ['CA', 'CO', 'CT', 'VA', 'TX', 'OR', 'DE', 'MT', 'MN', 'MD'], completed: true, dueDate: '2025-11-01', priority: 'medium' },
  { id: 't-004', task: 'Implement consumer rights request portal with identity verification', category: 'Technical', applicableStates: ['All'], completed: true, dueDate: '2025-06-01', priority: 'high' },
  { id: 't-005', task: 'Map and document all data sales and sharing arrangements', category: 'Data Governance', applicableStates: ['CA', 'CO', 'CT', 'VA', 'TX', 'OR', 'DE'], completed: true, dueDate: '2025-09-01', priority: 'high' },
  { id: 't-006', task: 'Implement opt-in consent for sensitive data processing', category: 'Technical', applicableStates: ['CA', 'CO', 'CT', 'VA', 'TX', 'OR', 'DE', 'NJ', 'MD'], completed: false, dueDate: '2026-04-15', priority: 'high' },
  { id: 't-007', task: 'Review and update data minimization practices for Maryland compliance', category: 'Data Governance', applicableStates: ['MD', 'VT'], completed: false, dueDate: '2026-06-01', priority: 'medium' },
  { id: 't-008', task: 'Establish cure period response procedures per state requirements', category: 'Legal', applicableStates: ['VA', 'UT', 'IA', 'TX', 'IN', 'TN', 'NH', 'NJ', 'MN', 'NE', 'RI'], completed: true, dueDate: '2025-10-01', priority: 'medium' },
  { id: 't-009', task: 'Deploy age verification for minor data protections', category: 'Technical', applicableStates: ['CA', 'CT', 'MD', 'NJ'], completed: false, dueDate: '2026-05-01', priority: 'high' },
  { id: 't-010', task: 'Prepare for Vermont and Rhode Island effective dates', category: 'Planning', applicableStates: ['VT', 'RI', 'IN'], completed: false, dueDate: '2026-01-01', priority: 'medium' },
];

// ── State Grid Map Data ──

const STATE_GRID: { code: string; name: string; row: number; col: number }[] = [
  { code: 'AK', name: 'Alaska', row: 0, col: 0 }, { code: 'ME', name: 'Maine', row: 0, col: 10 },
  { code: 'WI', name: 'Wisconsin', row: 1, col: 5 }, { code: 'VT', name: 'Vermont', row: 1, col: 9 }, { code: 'NH', name: 'New Hampshire', row: 1, col: 10 },
  { code: 'WA', name: 'Washington', row: 2, col: 0 }, { code: 'ID', name: 'Idaho', row: 2, col: 1 }, { code: 'MT', name: 'Montana', row: 2, col: 2 }, { code: 'ND', name: 'North Dakota', row: 2, col: 3 }, { code: 'MN', name: 'Minnesota', row: 2, col: 4 }, { code: 'IL', name: 'Illinois', row: 2, col: 5 }, { code: 'MI', name: 'Michigan', row: 2, col: 6 }, { code: 'NY', name: 'New York', row: 2, col: 8 }, { code: 'MA', name: 'Massachusetts', row: 2, col: 9 }, { code: 'CT', name: 'Connecticut', row: 2, col: 10 },
  { code: 'OR', name: 'Oregon', row: 3, col: 0 }, { code: 'NV', name: 'Nevada', row: 3, col: 1 }, { code: 'WY', name: 'Wyoming', row: 3, col: 2 }, { code: 'SD', name: 'South Dakota', row: 3, col: 3 }, { code: 'IA', name: 'Iowa', row: 3, col: 4 }, { code: 'IN', name: 'Indiana', row: 3, col: 5 }, { code: 'OH', name: 'Ohio', row: 3, col: 6 }, { code: 'PA', name: 'Pennsylvania', row: 3, col: 7 }, { code: 'NJ', name: 'New Jersey', row: 3, col: 8 }, { code: 'RI', name: 'Rhode Island', row: 3, col: 9 },
  { code: 'CA', name: 'California', row: 4, col: 0 }, { code: 'UT', name: 'Utah', row: 4, col: 1 }, { code: 'CO', name: 'Colorado', row: 4, col: 2 }, { code: 'NE', name: 'Nebraska', row: 4, col: 3 }, { code: 'MO', name: 'Missouri', row: 4, col: 4 }, { code: 'KY', name: 'Kentucky', row: 4, col: 5 }, { code: 'WV', name: 'West Virginia', row: 4, col: 6 }, { code: 'VA', name: 'Virginia', row: 4, col: 7 }, { code: 'MD', name: 'Maryland', row: 4, col: 8 }, { code: 'DE', name: 'Delaware', row: 4, col: 9 },
  { code: 'AZ', name: 'Arizona', row: 5, col: 1 }, { code: 'NM', name: 'New Mexico', row: 5, col: 2 }, { code: 'KS', name: 'Kansas', row: 5, col: 3 }, { code: 'AR', name: 'Arkansas', row: 5, col: 4 }, { code: 'TN', name: 'Tennessee', row: 5, col: 5 }, { code: 'NC', name: 'North Carolina', row: 5, col: 6 }, { code: 'SC', name: 'South Carolina', row: 5, col: 7 },
  { code: 'OK', name: 'Oklahoma', row: 6, col: 3 }, { code: 'LA', name: 'Louisiana', row: 6, col: 4 }, { code: 'MS', name: 'Mississippi', row: 6, col: 5 }, { code: 'AL', name: 'Alabama', row: 6, col: 6 }, { code: 'GA', name: 'Georgia', row: 6, col: 7 },
  { code: 'HI', name: 'Hawaii', row: 7, col: 0 }, { code: 'TX', name: 'Texas', row: 7, col: 3 }, { code: 'FL', name: 'Florida', row: 7, col: 7 },
];

// ── Helper Functions ─────────────────────────────────────────────────────

const complianceColor = (l: ComplianceLevel): string => {
  switch (l) { case 'compliant': return 'bg-green-100 text-green-800'; case 'partial': return 'bg-yellow-100 text-yellow-800'; case 'non_compliant': return 'bg-red-100 text-red-800'; case 'not_assessed': return 'bg-gray-100 text-gray-600'; case 'not_applicable': return 'bg-blue-50 text-blue-600'; }
};

const stateMapColor = (stateCode: string, laws: StatePrivacyLaw[]): string => {
  const law = laws.find(l => l.stateCode === stateCode);
  if (!law) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (law.status === 'effective') return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
  if (law.status === 'enacted') return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
  if (law.status === 'proposed') return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
  return 'bg-gray-100 text-gray-500 border-gray-200';
};

const gapStatusColor = (s: string): string => {
  switch (s) { case 'met': return 'bg-green-100 text-green-800'; case 'partial': return 'bg-yellow-100 text-yellow-800'; case 'not_met': return 'bg-red-100 text-red-800'; default: return 'bg-gray-100 text-gray-600'; }
};

const formatDate = (d: string): string => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ── Component ────────────────────────────────────────────────────────────

export const USPrivacyTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [laws, setLaws] = useState<StatePrivacyLaw[]>(DEFAULT_STATE_LAWS);
  const [gaps, setGaps] = useState<ComplianceGap[]>(DEFAULT_GAPS);
  const [tasks, setTasks] = useState<ComplianceTask[]>(DEFAULT_TASKS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LawStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load data from backend, fall back to defaults for new orgs
  useEffect(() => {
    (async () => {
      try {
        const saved = await api.regulationData.getAll('us-privacy');
        if (saved && typeof saved === 'object') {
          if (saved.laws) setLaws(saved.laws);
          if (saved.gaps) setGaps(saved.gaps);
          if (saved.tasks) setTasks(saved.tasks);
        }
      } catch (err: any) {
        console.error('Failed to load US Privacy data:', err);
        setLoadError('Using default template data.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Auto-save when data changes (debounced)
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      api.regulationData.save('us-privacy', 'laws', laws).catch(() => {});
      api.regulationData.save('us-privacy', 'gaps', gaps).catch(() => {});
      api.regulationData.save('us-privacy', 'tasks', tasks).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [laws, gaps, tasks, isLoading]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedLaw, setSelectedLaw] = useState<StatePrivacyLaw | null>(null);
  const [compareStates, setCompareStates] = useState<string[]>(['CA', 'CO', 'TX']);
  const [expandedState, setExpandedState] = useState<string | null>(null);

  // ── Computed ──

  const effectiveLaws = useMemo(() => laws.filter(l => l.status === 'effective' || l.status === 'enacted'), [laws]);
  const compliantCount = useMemo(() => laws.filter(l => l.complianceLevel === 'compliant').length, [laws]);
  const overallComplianceRate = useMemo(() => {
    const assessed = laws.filter(l => l.complianceLevel !== 'not_assessed' && l.complianceLevel !== 'not_applicable');
    if (assessed.length === 0) return 0;
    return Math.round((assessed.filter(a => a.complianceLevel === 'compliant').length / assessed.length) * 100);
  }, [laws]);

  const filteredLaws = useMemo(() => {
    return laws.filter(l => {
      const matchesSearch = l.stateName.toLowerCase().includes(searchTerm.toLowerCase()) || l.lawAbbreviation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [laws, searchTerm, statusFilter]);

  const comparedLaws = useMemo(() => laws.filter(l => compareStates.includes(l.stateCode)), [laws, compareStates]);

  const handleToggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  }, []);

  const handleToggleCompare = useCallback((code: string) => {
    setCompareStates(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code].slice(0, 5));
  }, []);

  const handleDownloadReport = useCallback(() => {
    const data = {
      generatedAt: new Date().toISOString(), reportType: 'US State Privacy Compliance Report',
      summary: { totalLawsTracked: laws.length, effectiveLaws: effectiveLaws.length, compliant: compliantCount, overallRate: overallComplianceRate + '%' },
      laws: laws.map(l => ({ state: l.stateCode, law: l.lawAbbreviation, status: l.status, effectiveDate: l.effectiveDate, compliance: l.complianceLevel })),
      openGaps: gaps.filter(g => g.currentStatus !== 'met').length, pendingTasks: tasks.filter(t => !t.completed).length,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `us-privacy-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [laws, effectiveLaws, compliantCount, overallComplianceRate, gaps, tasks]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'map', label: 'State Map', icon: <MapPin className="w-4 h-4" /> },
    { key: 'comparison', label: 'Comparison', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { key: 'gap_analysis', label: 'Gap Analysis', icon: <AlertCircle className="w-4 h-4" /> },
    { key: 'tracker', label: 'Compliance Tracker', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const renderScoreBar = (score: number) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div className={`h-2.5 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
    </div>
  );

  // ── Tab: Overview ──

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">State Laws Tracked</p><p className="text-2xl font-bold text-gray-900 mt-1">{laws.length}</p></div>
            <Flag className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{effectiveLaws.length} currently effective</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Compliance Rate</p><p className="text-2xl font-bold text-gray-900 mt-1">{overallComplianceRate}%</p></div>
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2">{renderScoreBar(overallComplianceRate)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Open Gaps</p><p className="text-2xl font-bold text-gray-900 mt-1">{gaps.filter(g => g.currentStatus !== 'met').length}</p></div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{gaps.filter(g => g.priority === 'high' && g.currentStatus !== 'met').length} high priority</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Pending Tasks</p><p className="text-2xl font-bold text-gray-900 mt-1">{tasks.filter(t => !t.completed).length}</p></div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{tasks.filter(t => t.completed).length}/{tasks.length} completed</p>
        </div>
      </div>

      {/* Private Right of Action Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2"><Gavel className="w-5 h-5" /> States with Private Right of Action</h4>
        <div className="flex flex-wrap gap-2">
          {laws.filter(l => l.privateRightOfAction).map(l => (
            <span key={l.id} className="px-3 py-1 bg-white border border-red-200 rounded-full text-sm text-red-800 font-medium">{l.stateCode}: {l.lawAbbreviation}</span>
          ))}
        </div>
        <p className="text-sm text-red-700 mt-2">These states allow consumers to sue directly for violations. Heightened compliance priority recommended.</p>
      </div>

      {/* Upcoming Effective Dates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Effective Date Timeline</h3>
        <div className="space-y-2">
          {laws.sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()).map(law => {
            const isEffective = new Date(law.effectiveDate) <= new Date();
            return (
              <div key={law.id} className={`flex items-center gap-4 p-3 rounded-lg border ${isEffective ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                {isEffective ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{law.stateCode}</span>
                    <span className="text-sm text-gray-700">{law.lawAbbreviation}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${complianceColor(law.complianceLevel)}`}>{law.complianceLevel.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-600 whitespace-nowrap">{formatDate(law.effectiveDate)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Cure Periods by State</h3>
          <div className="space-y-2">
            {laws.filter(l => l.curePeriod !== null).sort((a, b) => (b.curePeriod || 0) - (a.curePeriod || 0)).map(l => (
              <div key={l.id} className="flex justify-between text-sm"><span className="text-gray-600">{l.stateCode}</span><span className="font-medium">{l.curePeriod} days</span></div>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2"><p className="text-xs text-gray-500">{laws.filter(l => l.curePeriod === null).length} states have no cure period</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Max Penalties by State</h3>
          <div className="space-y-2">
            {laws.sort((a, b) => b.penalties.maxPerViolation - a.penalties.maxPerViolation).slice(0, 8).map(l => (
              <div key={l.id} className="flex justify-between text-sm"><span className="text-gray-600">{l.stateCode}</span><span className="font-medium">${l.penalties.maxPerViolation.toLocaleString()}/violation</span></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Universal Opt-Out Required</h3>
          <div className="flex flex-wrap gap-1">
            {laws.filter(l => l.optOutMechanisms.some(m => m.toLowerCase().includes('universal') || m.toLowerCase().includes('gpc'))).map(l => (
              <span key={l.id} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">{l.stateCode}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">These states require recognition of Global Privacy Control (GPC) signals or universal opt-out mechanisms.</p>
        </div>
      </div>
    </div>
  );

  // ── Tab: State Map ──

  const renderMap = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">US State Privacy Law Map</h3>
        <p className="text-sm text-gray-600 mb-4">Click a state to view law details. Color indicates: green = effective, blue = enacted (not yet effective), gray = no comprehensive privacy law.</p>

        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-200 border border-green-400" /> Effective</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-blue-200 border border-blue-400" /> Enacted (Not Yet Effective)</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-100 border border-gray-300" /> No Comprehensive Law</span>
        </div>

        {/* State Grid */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(11, 1fr)', gridTemplateRows: 'repeat(8, 1fr)' }}>
          {Array.from({ length: 8 * 11 }).map((_, idx) => {
            const row = Math.floor(idx / 11);
            const col = idx % 11;
            const state = STATE_GRID.find(s => s.row === row && s.col === col);
            if (!state) return <div key={idx} />;
            const law = laws.find(l => l.stateCode === state.code);
            return (
              <button
                key={state.code}
                onClick={() => { if (law) { setSelectedLaw(law); setShowDetailModal(true); } }}
                className={`aspect-square rounded border text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${stateMapColor(state.code, laws)}`}
                title={`${state.name}${law ? ` - ${law.lawAbbreviation}` : ''}`}
              >
                {state.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* State List with Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search state or law..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LawStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Statuses</option>
            <option value="effective">Effective</option>
            <option value="enacted">Enacted</option>
          </select>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredLaws.map(law => (
            <div key={law.id}>
              <div className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded"
                onClick={() => setExpandedState(expandedState === law.stateCode ? null : law.stateCode)}>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 w-8">{law.stateCode}</span>
                  <div>
                    <p className="font-medium text-gray-900">{law.lawAbbreviation}</p>
                    <p className="text-xs text-gray-500">{law.stateName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${law.status === 'effective' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{law.status.toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${complianceColor(law.complianceLevel)}`}>{law.complianceLevel.replace('_', ' ').toUpperCase()}</span>
                  {law.privateRightOfAction && <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs"><Gavel className="w-3 h-3 inline" /> PRA</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{formatDate(law.effectiveDate)}</span>
                  {expandedState === law.stateCode ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              {expandedState === law.stateCode && (
                <div className="pl-11 pb-4 pr-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div><span className="text-gray-500 text-xs">Enforcement</span><p className="text-gray-900 text-xs">{law.enforcementAgency}</p></div>
                    <div><span className="text-gray-500 text-xs">Cure Period</span><p className="text-gray-900">{law.curePeriod ? `${law.curePeriod} days` : 'None'}</p></div>
                    <div><span className="text-gray-500 text-xs">Max Penalty</span><p className="text-gray-900">${law.penalties.maxPerViolation.toLocaleString()}/violation</p></div>
                    <div><span className="text-gray-500 text-xs">Private Action</span><p className="text-gray-900">{law.privateRightOfAction ? 'Yes' : 'No'}</p></div>
                  </div>
                  <div className="mb-2"><span className="text-xs text-gray-500">Consumer Rights:</span><div className="flex flex-wrap gap-1 mt-1">{law.consumerRights.filter(r => r.available).map(r => <span key={r.name} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">{r.name}</span>)}</div></div>
                  <div><span className="text-xs text-gray-500">Key Provisions:</span><div className="flex flex-wrap gap-1 mt-1">{law.keyProvisions.map((p, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{p}</span>)}</div></div>
                  <button onClick={() => { setSelectedLaw(law); setShowDetailModal(true); }} className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium">View full details</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Tab: Comparison ──

  const renderComparison = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Side-by-Side Comparison</h3>
        <p className="text-sm text-gray-600 mb-4">Select up to 5 states to compare their privacy laws.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {laws.map(l => (
            <button key={l.id} onClick={() => handleToggleCompare(l.stateCode)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${compareStates.includes(l.stateCode) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {l.stateCode}
            </button>
          ))}
        </div>
      </div>

      {comparedLaws.length >= 2 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 sticky left-0 bg-gray-50 min-w-[180px]">Feature</th>
                {comparedLaws.map(l => <th key={l.id} className="text-center text-xs font-medium text-gray-900 px-4 py-3 min-w-[150px]">{l.stateCode}<br /><span className="text-gray-500 font-normal">{l.lawAbbreviation}</span></th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-white">Effective Date</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-sm text-center">{formatDate(l.effectiveDate)}</td>)}</tr>
              <tr className="bg-gray-50"><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50">Enforcement</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-xs text-center">{l.enforcementAgency}</td>)}</tr>
              <tr><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-white">Private Right of Action</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-center">{l.privateRightOfAction ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}</td>)}</tr>
              <tr className="bg-gray-50"><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50">Cure Period</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-sm text-center">{l.curePeriod ? `${l.curePeriod} days` : 'None'}</td>)}</tr>
              <tr><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-white">Max Penalty</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-sm text-center font-medium">${l.penalties.maxPerViolation.toLocaleString()}</td>)}</tr>
              <tr className="bg-gray-50"><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50">Consumer Threshold</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-xs text-center">{l.thresholds.consumers || 'None'}</td>)}</tr>
              <tr><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-white">Revenue Threshold</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-xs text-center">{l.thresholds.revenue || 'None'}</td>)}</tr>
              <tr className="bg-gray-50"><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50">Right to Know/Access</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-center">{l.consumerRights.find(r => r.name.includes('Access') || r.name.includes('Know'))?.available ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}</td>)}</tr>
              <tr><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-white">Right to Delete</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-center">{l.consumerRights.find(r => r.name.includes('Delete'))?.available ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}</td>)}</tr>
              <tr className="bg-gray-50"><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50">Right to Correct</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-center">{l.consumerRights.find(r => r.name.includes('Correct'))?.available ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}</td>)}</tr>
              <tr><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-white">Right to Opt-Out</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-center">{l.consumerRights.find(r => r.name.includes('Opt-Out'))?.available ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}</td>)}</tr>
              <tr className="bg-gray-50"><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50">Data Portability</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-center">{l.consumerRights.find(r => r.name.includes('Portability'))?.available ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}</td>)}</tr>
              <tr><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-white">Universal Opt-Out (GPC)</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-center">{l.optOutMechanisms.some(m => m.toLowerCase().includes('universal') || m.toLowerCase().includes('gpc')) ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-gray-400 mx-auto" />}</td>)}</tr>
              <tr className="bg-gray-50"><td className="px-4 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50">Compliance Status</td>{comparedLaws.map(l => <td key={l.id} className="px-4 py-2 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${complianceColor(l.complianceLevel)}`}>{l.complianceLevel.replace('_', ' ').toUpperCase()}</span></td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ── Tab: Gap Analysis ──

  const renderGapAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{gaps.filter(g => g.currentStatus === 'met').length}</p><p className="text-sm text-gray-500">Requirements Met</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{gaps.filter(g => g.currentStatus === 'partial').length}</p><p className="text-sm text-gray-500">Partially Met</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{gaps.filter(g => g.currentStatus === 'not_met').length}</p><p className="text-sm text-gray-500">Not Met</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200"><h4 className="font-semibold text-gray-900">Multi-State Compliance Gap Analysis</h4></div>
        <div className="divide-y divide-gray-100">
          {gaps.sort((a, b) => (a.currentStatus === 'not_met' ? -1 : 0) - (b.currentStatus === 'not_met' ? -1 : 0)).map((gap, idx) => (
            <div key={idx} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${gapStatusColor(gap.currentStatus)}`}>{gap.currentStatus.replace('_', ' ').toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${gap.priority === 'high' ? 'bg-red-100 text-red-800' : gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{gap.priority.toUpperCase()}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{gap.category}</span>
                </div>
              </div>
              <p className="font-medium text-gray-900 text-sm">{gap.requirement}</p>
              <p className="text-xs text-gray-600 mt-1">{gap.effort}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-gray-500 mr-1">Required by:</span>
                {gap.statesRequiring.map(s => <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Tab: Compliance Tracker ──

  const renderTracker = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Multi-State Compliance Checklist</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{tasks.filter(t => t.completed).length}/{tasks.length} completed</span>
          <div className="w-32">{renderScoreBar(Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100))}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-100">
          {tasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const pOrder = { high: 0, medium: 1, low: 2 };
            return pOrder[a.priority] - pOrder[b.priority];
          }).map(task => (
            <div key={task.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-medium text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.task}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-800' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{task.priority.toUpperCase()}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{task.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-xs text-gray-500 mr-1">States:</span>
                    {task.applicableStates.map(s => <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{s}</span>)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {formatDate(task.dueDate)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Main Render ──

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">US State Privacy Law Tracker</h2>
          <p className="text-gray-600 mt-1">Comprehensive tracking of all US state privacy laws and multi-state compliance</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Download className="w-4 h-4" /> Export Report</button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'map' && renderMap()}
      {activeTab === 'comparison' && renderComparison()}
      {activeTab === 'gap_analysis' && renderGapAnalysis()}
      {activeTab === 'tracker' && renderTracker()}

      {/* ── State Detail Modal ── */}
      {showDetailModal && selectedLaw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedLaw.stateName} - {selectedLaw.lawAbbreviation}</h3>
                <p className="text-sm text-gray-600">{selectedLaw.lawName}</p>
              </div>
              <button onClick={() => { setShowDetailModal(false); setSelectedLaw(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><label className="font-medium text-gray-500">Status</label><p className="mt-1"><span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedLaw.status === 'effective' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{selectedLaw.status.toUpperCase()}</span></p></div>
                <div><label className="font-medium text-gray-500">Effective Date</label><p className="mt-1">{formatDate(selectedLaw.effectiveDate)}</p></div>
                <div><label className="font-medium text-gray-500">Enforcement</label><p className="mt-1 text-xs">{selectedLaw.enforcementAgency}</p></div>
                <div><label className="font-medium text-gray-500">Private Right of Action</label><p className="mt-1">{selectedLaw.privateRightOfAction ? 'Yes' : 'No'}</p></div>
                <div><label className="font-medium text-gray-500">Cure Period</label><p className="mt-1">{selectedLaw.curePeriod ? `${selectedLaw.curePeriod} days` : 'None'}</p></div>
                <div><label className="font-medium text-gray-500">Max Penalty</label><p className="mt-1">${selectedLaw.penalties.maxPerViolation.toLocaleString()}/violation</p></div>
              </div>

              <div><label className="font-medium text-gray-500 text-sm">Thresholds</label>
                <div className="mt-1 space-y-1 text-sm">
                  {selectedLaw.thresholds.revenue && <p className="text-gray-700">Revenue: {selectedLaw.thresholds.revenue}</p>}
                  {selectedLaw.thresholds.consumers && <p className="text-gray-700">Consumers: {selectedLaw.thresholds.consumers}</p>}
                  {selectedLaw.thresholds.dataRevenue && <p className="text-gray-700">Data Revenue: {selectedLaw.thresholds.dataRevenue}</p>}
                  {selectedLaw.thresholds.other && <p className="text-gray-700">Other: {selectedLaw.thresholds.other}</p>}
                </div>
              </div>

              <div><label className="font-medium text-gray-500 text-sm">Consumer Rights</label>
                <div className="mt-1 space-y-1">{selectedLaw.consumerRights.map(r => (
                  <div key={r.name} className="flex items-start gap-2 text-sm">
                    {r.available ? <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" /> : <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                    <div><span className="font-medium">{r.name}</span><span className="text-gray-500 ml-1">- {r.details}</span></div>
                  </div>
                ))}</div>
              </div>

              <div><label className="font-medium text-gray-500 text-sm">Opt-Out Mechanisms</label>
                <ul className="list-disc list-inside text-sm mt-1 text-gray-700">{selectedLaw.optOutMechanisms.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </div>

              <div><label className="font-medium text-gray-500 text-sm">Key Provisions</label>
                <div className="flex flex-wrap gap-1 mt-1">{selectedLaw.keyProvisions.map((p, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{p}</span>)}</div>
              </div>

              <div><label className="font-medium text-gray-500 text-sm">Penalties</label>
                <p className="text-sm text-gray-700 mt-1">{selectedLaw.penalties.additionalPenalties}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
