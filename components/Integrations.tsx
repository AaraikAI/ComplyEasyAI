import React, { useState, useEffect } from 'react';
import { Integration } from '../types';
import { CheckCircle, Power, Search, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { IntegrationModal } from './IntegrationModal';
import { useOnboardingTrigger } from '../hooks/useOnboarding';
import { useAuth } from '../contexts/AuthContext';
import { isAtLimit, getUpgradeMessage } from '../constants/tierLimits';
import { toast } from 'sonner';
import { useI18n } from '../contexts/I18nContext';

// Comprehensive list of ALL available integrations (380+)
const ALL_INTEGRATIONS: Integration[] = [
  // ============================================================
  // Cloud Providers (15)
  // ============================================================
  { id: 'aws', name: 'AWS', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'AW' },
  { id: 'azure', name: 'Microsoft Azure', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'MA' },
  { id: 'gcp', name: 'Google Cloud Platform', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'GC' },
  { id: 'oracle-cloud', name: 'Oracle Cloud', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'OC' },
  { id: 'ibm-cloud', name: 'IBM Cloud', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'IC' },
  { id: 'alibaba-cloud', name: 'Alibaba Cloud', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'AC' },
  { id: 'digitalocean', name: 'DigitalOcean', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'DO' },
  { id: 'heroku', name: 'Heroku', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'HE' },
  { id: 'linode', name: 'Linode/Akamai', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'LI' },
  { id: 'vultr', name: 'Vultr', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'VU' },
  { id: 'cloudflare', name: 'Cloudflare', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'CF' },
  { id: 'fastly', name: 'Fastly', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'FA' },
  { id: 'rackspace', name: 'Rackspace', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'RA' },
  { id: 'vmware-cloud', name: 'VMware Cloud', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'VC' },
  { id: 'openstack', name: 'OpenStack', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'OS' },

  // ============================================================
  // Identity & SSO (20)
  // ============================================================
  { id: 'okta', name: 'Okta', category: 'Identity', connected: false, lastSync: 'Never', icon: 'OK' },
  { id: 'azure-ad', name: 'Azure AD/Entra ID', category: 'Identity', connected: false, lastSync: 'Never', icon: 'AD' },
  { id: 'google-workspace', name: 'Google Workspace', category: 'Identity', connected: false, lastSync: 'Never', icon: 'GW' },
  { id: 'onelogin', name: 'OneLogin', category: 'Identity', connected: false, lastSync: 'Never', icon: 'OL' },
  { id: 'jumpcloud', name: 'JumpCloud', category: 'Identity', connected: false, lastSync: 'Never', icon: 'JC' },
  { id: 'ping-identity', name: 'Ping Identity', category: 'Identity', connected: false, lastSync: 'Never', icon: 'PI' },
  { id: 'auth0', name: 'Auth0', category: 'Identity', connected: false, lastSync: 'Never', icon: 'A0' },
  { id: 'cyberark', name: 'CyberArk', category: 'Identity', connected: false, lastSync: 'Never', icon: 'CA' },
  { id: 'forgerock', name: 'ForgeRock', category: 'Identity', connected: false, lastSync: 'Never', icon: 'FR' },
  { id: 'duo-security', name: 'Duo Security', category: 'Identity', connected: false, lastSync: 'Never', icon: 'DU' },
  { id: 'lastpass-business', name: 'LastPass Business', category: 'Identity', connected: false, lastSync: 'Never', icon: 'LP' },
  { id: '1password-business', name: '1Password Business', category: 'Identity', connected: false, lastSync: 'Never', icon: '1P' },
  { id: 'dashlane-business', name: 'Dashlane Business', category: 'Identity', connected: false, lastSync: 'Never', icon: 'DA' },
  { id: 'keeper', name: 'Keeper', category: 'Identity', connected: false, lastSync: 'Never', icon: 'KE' },
  { id: 'beyondtrust', name: 'BeyondTrust', category: 'Identity', connected: false, lastSync: 'Never', icon: 'BT' },
  { id: 'sailpoint', name: 'SailPoint', category: 'Identity', connected: false, lastSync: 'Never', icon: 'SP' },
  { id: 'saviynt', name: 'Saviynt', category: 'Identity', connected: false, lastSync: 'Never', icon: 'SV' },
  { id: 'ibm-verify', name: 'IBM Verify', category: 'Identity', connected: false, lastSync: 'Never', icon: 'IV' },
  { id: 'thales-gemalto', name: 'Thales/Gemalto', category: 'Identity', connected: false, lastSync: 'Never', icon: 'TG' },
  { id: 'rsa-securid', name: 'RSA SecurID', category: 'Identity', connected: false, lastSync: 'Never', icon: 'RS' },

  // ============================================================
  // HR & People (20)
  // ============================================================
  { id: 'bamboohr', name: 'BambooHR', category: 'HR', connected: false, lastSync: 'Never', icon: 'BH' },
  { id: 'workday', name: 'Workday', category: 'HR', connected: false, lastSync: 'Never', icon: 'WD' },
  { id: 'adp', name: 'ADP', category: 'HR', connected: false, lastSync: 'Never', icon: 'AD' },
  { id: 'gusto', name: 'Gusto', category: 'HR', connected: false, lastSync: 'Never', icon: 'GU' },
  { id: 'paylocity', name: 'Paylocity', category: 'HR', connected: false, lastSync: 'Never', icon: 'PL' },
  { id: 'paychex', name: 'Paychex', category: 'HR', connected: false, lastSync: 'Never', icon: 'PX' },
  { id: 'rippling', name: 'Rippling', category: 'HR', connected: false, lastSync: 'Never', icon: 'RI' },
  { id: 'deel', name: 'Deel', category: 'HR', connected: false, lastSync: 'Never', icon: 'DE' },
  { id: 'remote', name: 'Remote', category: 'HR', connected: false, lastSync: 'Never', icon: 'RE' },
  { id: 'justworks', name: 'Justworks', category: 'HR', connected: false, lastSync: 'Never', icon: 'JW' },
  { id: 'namely', name: 'Namely', category: 'HR', connected: false, lastSync: 'Never', icon: 'NA' },
  { id: 'ukg', name: 'UKG (Kronos)', category: 'HR', connected: false, lastSync: 'Never', icon: 'UK' },
  { id: 'paycom', name: 'Paycom', category: 'HR', connected: false, lastSync: 'Never', icon: 'PC' },
  { id: 'ceridian-dayforce', name: 'Ceridian Dayforce', category: 'HR', connected: false, lastSync: 'Never', icon: 'CD' },
  { id: 'sap-successfactors', name: 'SAP SuccessFactors', category: 'HR', connected: false, lastSync: 'Never', icon: 'SF' },
  { id: 'oracle-hcm', name: 'Oracle HCM', category: 'HR', connected: false, lastSync: 'Never', icon: 'OH' },
  { id: 'hibob', name: 'Bob (HiBob)', category: 'HR', connected: false, lastSync: 'Never', icon: 'HB' },
  { id: 'personio', name: 'Personio', category: 'HR', connected: false, lastSync: 'Never', icon: 'PE' },
  { id: 'factorial', name: 'Factorial', category: 'HR', connected: false, lastSync: 'Never', icon: 'FA' },
  { id: 'lattice', name: 'Lattice', category: 'HR', connected: false, lastSync: 'Never', icon: 'LA' },

  // ============================================================
  // Development & Code (25)
  // ============================================================
  { id: 'github', name: 'GitHub', category: 'Code', connected: false, lastSync: 'Never', icon: 'GH' },
  { id: 'gitlab', name: 'GitLab', category: 'Code', connected: false, lastSync: 'Never', icon: 'GL' },
  { id: 'bitbucket', name: 'Bitbucket', category: 'Code', connected: false, lastSync: 'Never', icon: 'BB' },
  { id: 'azure-devops', name: 'Azure DevOps', category: 'Code', connected: false, lastSync: 'Never', icon: 'AZ' },
  { id: 'aws-codecommit', name: 'AWS CodeCommit', category: 'Code', connected: false, lastSync: 'Never', icon: 'CC' },
  { id: 'codecov', name: 'Codecov', category: 'Code', connected: false, lastSync: 'Never', icon: 'CV' },
  { id: 'sonarqube', name: 'SonarQube', category: 'Code', connected: false, lastSync: 'Never', icon: 'SQ' },
  { id: 'sonarcloud', name: 'SonarCloud', category: 'Code', connected: false, lastSync: 'Never', icon: 'SC' },
  { id: 'snyk', name: 'Snyk', category: 'Code', connected: false, lastSync: 'Never', icon: 'SN' },
  { id: 'veracode', name: 'Veracode', category: 'Code', connected: false, lastSync: 'Never', icon: 'VE' },
  { id: 'checkmarx', name: 'Checkmarx', category: 'Code', connected: false, lastSync: 'Never', icon: 'CX' },
  { id: 'whitesource-mend', name: 'WhiteSource/Mend', category: 'Code', connected: false, lastSync: 'Never', icon: 'WS' },
  { id: 'black-duck', name: 'Black Duck', category: 'Code', connected: false, lastSync: 'Never', icon: 'BD' },
  { id: 'fortify', name: 'Fortify', category: 'Code', connected: false, lastSync: 'Never', icon: 'FO' },
  { id: 'semgrep', name: 'Semgrep', category: 'Code', connected: false, lastSync: 'Never', icon: 'SG' },
  { id: 'codeclimate', name: 'CodeClimate', category: 'Code', connected: false, lastSync: 'Never', icon: 'CL' },
  { id: 'coverity', name: 'Coverity', category: 'Code', connected: false, lastSync: 'Never', icon: 'CO' },
  { id: 'eslint-cloud', name: 'ESLint Cloud', category: 'Code', connected: false, lastSync: 'Never', icon: 'ES' },
  { id: 'gitguardian', name: 'GitGuardian', category: 'Code', connected: false, lastSync: 'Never', icon: 'GG' },
  { id: 'trufflehog', name: 'TruffleHog', category: 'Code', connected: false, lastSync: 'Never', icon: 'TH' },
  { id: 'gitleaks', name: 'Gitleaks', category: 'Code', connected: false, lastSync: 'Never', icon: 'GK' },
  { id: 'dependabot', name: 'Dependabot', category: 'Code', connected: false, lastSync: 'Never', icon: 'DB' },
  { id: 'renovate', name: 'Renovate', category: 'Code', connected: false, lastSync: 'Never', icon: 'RN' },
  { id: 'github-advanced-security', name: 'GitHub Advanced Security', category: 'Code', connected: false, lastSync: 'Never', icon: 'GA' },
  { id: 'stackhawk', name: 'StackHawk', category: 'Code', connected: false, lastSync: 'Never', icon: 'SH' },

  // ============================================================
  // CI/CD (15)
  // ============================================================
  { id: 'jenkins', name: 'Jenkins', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'JE' },
  { id: 'circleci', name: 'CircleCI', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'CI' },
  { id: 'travis-ci', name: 'Travis CI', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'TR' },
  { id: 'github-actions', name: 'GitHub Actions', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'GA' },
  { id: 'gitlab-ci', name: 'GitLab CI', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'GC' },
  { id: 'azure-pipelines', name: 'Azure Pipelines', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'AP' },
  { id: 'aws-codepipeline', name: 'AWS CodePipeline', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'CP' },
  { id: 'google-cloud-build', name: 'Google Cloud Build', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'GB' },
  { id: 'teamcity', name: 'TeamCity', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'TC' },
  { id: 'bamboo', name: 'Bamboo', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'BA' },
  { id: 'harness', name: 'Harness', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'HA' },
  { id: 'argo-cd', name: 'Argo CD', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'AR' },
  { id: 'fluxcd', name: 'FluxCD', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'FX' },
  { id: 'tekton', name: 'Tekton', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'TK' },
  { id: 'drone-ci', name: 'Drone CI', category: 'CI/CD', connected: false, lastSync: 'Never', icon: 'DR' },

  // ============================================================
  // Container & Orchestration (15)
  // ============================================================
  { id: 'docker-hub', name: 'Docker Hub', category: 'Container', connected: false, lastSync: 'Never', icon: 'DH' },
  { id: 'kubernetes', name: 'Kubernetes', category: 'Container', connected: false, lastSync: 'Never', icon: 'K8' },
  { id: 'amazon-eks', name: 'Amazon EKS', category: 'Container', connected: false, lastSync: 'Never', icon: 'EK' },
  { id: 'azure-aks', name: 'Azure AKS', category: 'Container', connected: false, lastSync: 'Never', icon: 'AK' },
  { id: 'google-gke', name: 'Google GKE', category: 'Container', connected: false, lastSync: 'Never', icon: 'GK' },
  { id: 'openshift', name: 'Red Hat OpenShift', category: 'Container', connected: false, lastSync: 'Never', icon: 'OS' },
  { id: 'rancher', name: 'Rancher', category: 'Container', connected: false, lastSync: 'Never', icon: 'RA' },
  { id: 'helm', name: 'Helm', category: 'Container', connected: false, lastSync: 'Never', icon: 'HE' },
  { id: 'istio', name: 'Istio', category: 'Container', connected: false, lastSync: 'Never', icon: 'IS' },
  { id: 'linkerd', name: 'Linkerd', category: 'Container', connected: false, lastSync: 'Never', icon: 'LI' },
  { id: 'aqua-security', name: 'Aqua Security', category: 'Container', connected: false, lastSync: 'Never', icon: 'AQ' },
  { id: 'twistlock-prisma', name: 'Twistlock/Prisma Cloud', category: 'Container', connected: false, lastSync: 'Never', icon: 'TW' },
  { id: 'sysdig', name: 'Sysdig', category: 'Container', connected: false, lastSync: 'Never', icon: 'SD' },
  { id: 'anchore', name: 'Anchore', category: 'Container', connected: false, lastSync: 'Never', icon: 'AN' },
  { id: 'trivy', name: 'Trivy', category: 'Container', connected: false, lastSync: 'Never', icon: 'TV' },

  // ============================================================
  // Monitoring & Observability (20)
  // ============================================================
  { id: 'datadog', name: 'Datadog', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'DD' },
  { id: 'new-relic', name: 'New Relic', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'NR' },
  { id: 'splunk', name: 'Splunk', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'SP' },
  { id: 'dynatrace', name: 'Dynatrace', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'DY' },
  { id: 'grafana-cloud', name: 'Grafana Cloud', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'GR' },
  { id: 'prometheus', name: 'Prometheus', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'PR' },
  { id: 'pagerduty', name: 'PagerDuty', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'PD' },
  { id: 'opsgenie', name: 'OpsGenie', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'OG' },
  { id: 'victorops', name: 'VictorOps/Splunk On-Call', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'VO' },
  { id: 'sumo-logic', name: 'Sumo Logic', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'SL' },
  { id: 'elastic-elk', name: 'Elastic/ELK Stack', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'EL' },
  { id: 'honeycomb', name: 'Honeycomb', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'HC' },
  { id: 'lightstep', name: 'Lightstep', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'LS' },
  { id: 'appdynamics', name: 'AppDynamics', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'AD' },
  { id: 'logicmonitor', name: 'LogicMonitor', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'LM' },
  { id: 'site24x7', name: 'Site24x7', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'S2' },
  { id: 'catchpoint', name: 'Catchpoint', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'CP' },
  { id: 'thousandeyes', name: 'ThousandEyes', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'TE' },
  { id: 'instana', name: 'Instana', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'IN' },
  { id: 'signalfx', name: 'SignalFx', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'SX' },

  // ============================================================
  // Security & Vulnerability (31)
  // ============================================================
  { id: 'crowdstrike', name: 'CrowdStrike', category: 'Security', connected: false, lastSync: 'Never', icon: 'CS' },
  { id: 'sentinelone', name: 'SentinelOne', category: 'Security', connected: false, lastSync: 'Never', icon: 'S1' },
  { id: 'carbon-black', name: 'Carbon Black', category: 'Security', connected: false, lastSync: 'Never', icon: 'CB' },
  { id: 'palo-alto-networks', name: 'Palo Alto Networks', category: 'Security', connected: false, lastSync: 'Never', icon: 'PA' },
  { id: 'fortinet', name: 'Fortinet', category: 'Security', connected: false, lastSync: 'Never', icon: 'FN' },
  { id: 'check-point', name: 'Check Point', category: 'Security', connected: false, lastSync: 'Never', icon: 'CP' },
  { id: 'sophos', name: 'Sophos', category: 'Security', connected: false, lastSync: 'Never', icon: 'SO' },
  { id: 'trend-micro', name: 'Trend Micro', category: 'Security', connected: false, lastSync: 'Never', icon: 'TM' },
  { id: 'malwarebytes', name: 'Malwarebytes', category: 'Security', connected: false, lastSync: 'Never', icon: 'MW' },
  { id: 'cylance', name: 'Cylance/BlackBerry', category: 'Security', connected: false, lastSync: 'Never', icon: 'CY' },
  { id: 'cisco-secure-endpoint', name: 'Cisco Secure Endpoint', category: 'Security', connected: false, lastSync: 'Never', icon: 'CE' },
  { id: 'microsoft-defender', name: 'Microsoft Defender', category: 'Security', connected: false, lastSync: 'Never', icon: 'MD' },
  { id: 'qualys', name: 'Qualys', category: 'Security', connected: false, lastSync: 'Never', icon: 'QA' },
  { id: 'tenable-nessus', name: 'Tenable/Nessus', category: 'Security', connected: false, lastSync: 'Never', icon: 'TN' },
  { id: 'rapid7-insightvm', name: 'Rapid7 InsightVM', category: 'Security', connected: false, lastSync: 'Never', icon: 'R7' },
  { id: 'nuclei', name: 'Nuclei', category: 'Security', connected: false, lastSync: 'Never', icon: 'NU' },
  { id: 'burpsuite', name: 'BurpSuite', category: 'Security', connected: false, lastSync: 'Never', icon: 'BS' },
  { id: 'owasp-zap', name: 'OWASP ZAP', category: 'Security', connected: false, lastSync: 'Never', icon: 'OZ' },
  { id: 'nmap', name: 'Nmap', category: 'Security', connected: false, lastSync: 'Never', icon: 'NM' },
  { id: 'metasploit', name: 'Metasploit', category: 'Security', connected: false, lastSync: 'Never', icon: 'MS' },
  { id: 'mandiant', name: 'Mandiant', category: 'Security', connected: false, lastSync: 'Never', icon: 'MA' },
  { id: 'fireeye', name: 'FireEye', category: 'Security', connected: false, lastSync: 'Never', icon: 'FE' },
  { id: 'proofpoint', name: 'Proofpoint', category: 'Security', connected: false, lastSync: 'Never', icon: 'PP' },
  { id: 'mimecast', name: 'Mimecast', category: 'Security', connected: false, lastSync: 'Never', icon: 'MC' },
  { id: 'barracuda', name: 'Barracuda', category: 'Security', connected: false, lastSync: 'Never', icon: 'BA' },
  { id: 'knowbe4', name: 'KnowBe4', category: 'Security', connected: false, lastSync: 'Never', icon: 'KB' },
  { id: 'cofense', name: 'Cofense', category: 'Security', connected: false, lastSync: 'Never', icon: 'CF' },
  { id: 'abnormal-security', name: 'Abnormal Security', category: 'Security', connected: false, lastSync: 'Never', icon: 'AS' },
  { id: 'area-1', name: 'Area 1', category: 'Security', connected: false, lastSync: 'Never', icon: 'A1' },
  { id: 'recorded-future', name: 'Recorded Future', category: 'Security', connected: false, lastSync: 'Never', icon: 'RF' },
  { id: 'threatconnect', name: 'ThreatConnect', category: 'Security', connected: false, lastSync: 'Never', icon: 'TC' },

  // ============================================================
  // SIEM & SOAR (10)
  // ============================================================
  { id: 'splunk-siem', name: 'Splunk SIEM', category: 'SIEM', connected: false, lastSync: 'Never', icon: 'SS' },
  { id: 'ibm-qradar', name: 'IBM QRadar', category: 'SIEM', connected: false, lastSync: 'Never', icon: 'QR' },
  { id: 'microsoft-sentinel', name: 'Microsoft Sentinel', category: 'SIEM', connected: false, lastSync: 'Never', icon: 'MS' },
  { id: 'google-chronicle', name: 'Google Chronicle', category: 'SIEM', connected: false, lastSync: 'Never', icon: 'GC' },
  { id: 'exabeam', name: 'Exabeam', category: 'SIEM', connected: false, lastSync: 'Never', icon: 'EX' },
  { id: 'logrhythm', name: 'LogRhythm', category: 'SIEM', connected: false, lastSync: 'Never', icon: 'LR' },
  { id: 'securonix', name: 'Securonix', category: 'SIEM', connected: false, lastSync: 'Never', icon: 'SX' },
  { id: 'devo', name: 'Devo', category: 'SIEM', connected: false, lastSync: 'Never', icon: 'DV' },
  { id: 'swimlane', name: 'Swimlane', category: 'SIEM', connected: false, lastSync: 'Never', icon: 'SW' },
  { id: 'phantom-splunk-soar', name: 'Phantom (Splunk SOAR)', category: 'SIEM', connected: false, lastSync: 'Never', icon: 'PH' },

  // ============================================================
  // MDM & Endpoint (15)
  // ============================================================
  { id: 'jamf', name: 'Jamf', category: 'MDM', connected: false, lastSync: 'Never', icon: 'JA' },
  { id: 'kandji', name: 'Kandji', category: 'MDM', connected: false, lastSync: 'Never', icon: 'KA' },
  { id: 'mosyle', name: 'Mosyle', category: 'MDM', connected: false, lastSync: 'Never', icon: 'MO' },
  { id: 'addigy', name: 'Addigy', category: 'MDM', connected: false, lastSync: 'Never', icon: 'AG' },
  { id: 'hexnode', name: 'Hexnode', category: 'MDM', connected: false, lastSync: 'Never', icon: 'HX' },
  { id: 'microsoft-intune', name: 'Microsoft Intune', category: 'MDM', connected: false, lastSync: 'Never', icon: 'MI' },
  { id: 'vmware-workspace-one', name: 'VMware Workspace ONE', category: 'MDM', connected: false, lastSync: 'Never', icon: 'WO' },
  { id: 'soti', name: 'SOTI', category: 'MDM', connected: false, lastSync: 'Never', icon: 'ST' },
  { id: 'manageengine-mdm', name: 'ManageEngine', category: 'MDM', connected: false, lastSync: 'Never', icon: 'ME' },
  { id: 'ivanti-mdm', name: 'Ivanti', category: 'MDM', connected: false, lastSync: 'Never', icon: 'IV' },
  { id: 'tanium', name: 'Tanium', category: 'MDM', connected: false, lastSync: 'Never', icon: 'TA' },
  { id: 'automox', name: 'Automox', category: 'MDM', connected: false, lastSync: 'Never', icon: 'AX' },
  { id: 'fleetdm', name: 'FleetDM', category: 'MDM', connected: false, lastSync: 'Never', icon: 'FD' },
  { id: 'osquery', name: 'osquery', category: 'MDM', connected: false, lastSync: 'Never', icon: 'OQ' },
  { id: 'kolide', name: 'Kolide', category: 'MDM', connected: false, lastSync: 'Never', icon: 'KO' },

  // ============================================================
  // ITSM & Ticketing (15)
  // ============================================================
  { id: 'jira', name: 'Jira', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'JI' },
  { id: 'servicenow', name: 'ServiceNow', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'SN' },
  { id: 'freshservice', name: 'Freshservice', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'FS' },
  { id: 'freshdesk', name: 'Freshdesk', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'FD' },
  { id: 'zendesk', name: 'Zendesk', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'ZD' },
  { id: 'connectwise', name: 'ConnectWise', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'CW' },
  { id: 'manageengine-servicedesk', name: 'ManageEngine ServiceDesk', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'MS' },
  { id: 'bmc-helix', name: 'BMC Helix', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'BH' },
  { id: 'ivanti-service-management', name: 'Ivanti Service Management', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'IS' },
  { id: 'sysaid', name: 'SysAid', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'SA' },
  { id: 'haloitsm', name: 'HaloITSM', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'HI' },
  { id: 'topdesk', name: 'TOPdesk', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'TD' },
  { id: 'spiceworks', name: 'Spiceworks', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'SW' },
  { id: 'cherwell', name: 'Cherwell', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'CH' },
  { id: 'solarwinds-service-desk', name: 'SolarWinds Service Desk', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'SD' },

  // ============================================================
  // Productivity & Collaboration (20)
  // ============================================================
  { id: 'slack', name: 'Slack', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'SL' },
  { id: 'microsoft-teams', name: 'Microsoft Teams', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'MT' },
  { id: 'discord', name: 'Discord', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'DI' },
  { id: 'zoom', name: 'Zoom', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'ZM' },
  { id: 'google-meet', name: 'Google Meet', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'GM' },
  { id: 'webex', name: 'Webex', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'WX' },
  { id: 'notion', name: 'Notion', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'NO' },
  { id: 'confluence', name: 'Confluence', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'CO' },
  { id: 'asana', name: 'Asana', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'AS' },
  { id: 'monday', name: 'Monday.com', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'MO' },
  { id: 'trello', name: 'Trello', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'TR' },
  { id: 'clickup', name: 'ClickUp', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'CU' },
  { id: 'linear', name: 'Linear', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'LN' },
  { id: 'basecamp', name: 'Basecamp', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'BC' },
  { id: 'wrike', name: 'Wrike', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'WR' },
  { id: 'smartsheet', name: 'Smartsheet', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'SS' },
  { id: 'airtable', name: 'Airtable', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'AT' },
  { id: 'coda', name: 'Coda', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'CD' },
  { id: 'miro', name: 'Miro', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'MI' },
  { id: 'figma', name: 'Figma', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'FG' },

  // ============================================================
  // CRM & Sales (10)
  // ============================================================
  { id: 'salesforce', name: 'Salesforce', category: 'CRM', connected: false, lastSync: 'Never', icon: 'SF' },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', connected: false, lastSync: 'Never', icon: 'HS' },
  { id: 'pipedrive', name: 'Pipedrive', category: 'CRM', connected: false, lastSync: 'Never', icon: 'PD' },
  { id: 'zoho-crm', name: 'Zoho CRM', category: 'CRM', connected: false, lastSync: 'Never', icon: 'ZC' },
  { id: 'freshsales', name: 'Freshsales', category: 'CRM', connected: false, lastSync: 'Never', icon: 'FS' },
  { id: 'dynamics-365', name: 'Microsoft Dynamics 365', category: 'CRM', connected: false, lastSync: 'Never', icon: 'D3' },
  { id: 'sugarcrm', name: 'SugarCRM', category: 'CRM', connected: false, lastSync: 'Never', icon: 'SU' },
  { id: 'copper', name: 'Copper', category: 'CRM', connected: false, lastSync: 'Never', icon: 'CO' },
  { id: 'close', name: 'Close', category: 'CRM', connected: false, lastSync: 'Never', icon: 'CL' },
  { id: 'insightly', name: 'Insightly', category: 'CRM', connected: false, lastSync: 'Never', icon: 'IN' },

  // ============================================================
  // Communication & Email (10)
  // ============================================================
  { id: 'sendgrid', name: 'SendGrid', category: 'Communication', connected: false, lastSync: 'Never', icon: 'SG' },
  { id: 'mailgun', name: 'Mailgun', category: 'Communication', connected: false, lastSync: 'Never', icon: 'MG' },
  { id: 'amazon-ses', name: 'Amazon SES', category: 'Communication', connected: false, lastSync: 'Never', icon: 'SE' },
  { id: 'postmark', name: 'Postmark', category: 'Communication', connected: false, lastSync: 'Never', icon: 'PM' },
  { id: 'sparkpost', name: 'SparkPost', category: 'Communication', connected: false, lastSync: 'Never', icon: 'SP' },
  { id: 'twilio', name: 'Twilio', category: 'Communication', connected: false, lastSync: 'Never', icon: 'TW' },
  { id: 'vonage', name: 'Vonage', category: 'Communication', connected: false, lastSync: 'Never', icon: 'VN' },
  { id: 'ringcentral', name: 'RingCentral', category: 'Communication', connected: false, lastSync: 'Never', icon: 'RC' },
  { id: '8x8', name: '8x8', category: 'Communication', connected: false, lastSync: 'Never', icon: '8X' },
  { id: 'dialpad', name: 'Dialpad', category: 'Communication', connected: false, lastSync: 'Never', icon: 'DP' },

  // ============================================================
  // Database & Storage (15)
  // ============================================================
  { id: 'mongodb-atlas', name: 'MongoDB Atlas', category: 'Database', connected: false, lastSync: 'Never', icon: 'MG' },
  { id: 'postgresql', name: 'PostgreSQL', category: 'Database', connected: false, lastSync: 'Never', icon: 'PG' },
  { id: 'mysql', name: 'MySQL', category: 'Database', connected: false, lastSync: 'Never', icon: 'MY' },
  { id: 'redis', name: 'Redis', category: 'Database', connected: false, lastSync: 'Never', icon: 'RD' },
  { id: 'amazon-rds', name: 'Amazon RDS', category: 'Database', connected: false, lastSync: 'Never', icon: 'RD' },
  { id: 'amazon-dynamodb', name: 'Amazon DynamoDB', category: 'Database', connected: false, lastSync: 'Never', icon: 'DY' },
  { id: 'azure-sql', name: 'Azure SQL', category: 'Database', connected: false, lastSync: 'Never', icon: 'AS' },
  { id: 'google-cloud-sql', name: 'Google Cloud SQL', category: 'Database', connected: false, lastSync: 'Never', icon: 'GS' },
  { id: 'snowflake', name: 'Snowflake', category: 'Database', connected: false, lastSync: 'Never', icon: 'SF' },
  { id: 'databricks', name: 'Databricks', category: 'Database', connected: false, lastSync: 'Never', icon: 'DB' },
  { id: 'amazon-s3', name: 'Amazon S3', category: 'Database', connected: false, lastSync: 'Never', icon: 'S3' },
  { id: 'azure-blob-storage', name: 'Azure Blob Storage', category: 'Database', connected: false, lastSync: 'Never', icon: 'AB' },
  { id: 'google-cloud-storage', name: 'Google Cloud Storage', category: 'Database', connected: false, lastSync: 'Never', icon: 'GS' },
  { id: 'minio', name: 'MinIO', category: 'Database', connected: false, lastSync: 'Never', icon: 'MN' },
  { id: 'backblaze-b2', name: 'Backblaze B2', category: 'Database', connected: false, lastSync: 'Never', icon: 'B2' },

  // ============================================================
  // Network & Infrastructure (15)
  // ============================================================
  { id: 'cloudflare-network', name: 'Cloudflare', category: 'Network', connected: false, lastSync: 'Never', icon: 'CF' },
  { id: 'akamai', name: 'Akamai', category: 'Network', connected: false, lastSync: 'Never', icon: 'AK' },
  { id: 'aws-vpc', name: 'AWS VPC', category: 'Network', connected: false, lastSync: 'Never', icon: 'VP' },
  { id: 'azure-virtual-network', name: 'Azure Virtual Network', category: 'Network', connected: false, lastSync: 'Never', icon: 'AV' },
  { id: 'palo-alto-prisma', name: 'Palo Alto Prisma', category: 'Network', connected: false, lastSync: 'Never', icon: 'PP' },
  { id: 'zscaler', name: 'Zscaler', category: 'Network', connected: false, lastSync: 'Never', icon: 'ZS' },
  { id: 'netskope', name: 'Netskope', category: 'Network', connected: false, lastSync: 'Never', icon: 'NS' },
  { id: 'cisco-umbrella', name: 'Cisco Umbrella', category: 'Network', connected: false, lastSync: 'Never', icon: 'CU' },
  { id: 'f5-networks', name: 'F5 Networks', category: 'Network', connected: false, lastSync: 'Never', icon: 'F5' },
  { id: 'fortinet-fortigate', name: 'Fortinet FortiGate', category: 'Network', connected: false, lastSync: 'Never', icon: 'FG' },
  { id: 'wireguard', name: 'WireGuard', category: 'Network', connected: false, lastSync: 'Never', icon: 'WG' },
  { id: 'openvpn', name: 'OpenVPN', category: 'Network', connected: false, lastSync: 'Never', icon: 'OV' },
  { id: 'tailscale', name: 'Tailscale', category: 'Network', connected: false, lastSync: 'Never', icon: 'TS' },
  { id: 'perimeter-81', name: 'Perimeter 81', category: 'Network', connected: false, lastSync: 'Never', icon: 'P8' },
  { id: 'nordlayer', name: 'NordLayer', category: 'Network', connected: false, lastSync: 'Never', icon: 'NL' },

  // ============================================================
  // Backup & Recovery (10)
  // ============================================================
  { id: 'veeam', name: 'Veeam', category: 'Backup', connected: false, lastSync: 'Never', icon: 'VE' },
  { id: 'acronis', name: 'Acronis', category: 'Backup', connected: false, lastSync: 'Never', icon: 'AC' },
  { id: 'druva', name: 'Druva', category: 'Backup', connected: false, lastSync: 'Never', icon: 'DR' },
  { id: 'commvault', name: 'Commvault', category: 'Backup', connected: false, lastSync: 'Never', icon: 'CV' },
  { id: 'rubrik', name: 'Rubrik', category: 'Backup', connected: false, lastSync: 'Never', icon: 'RU' },
  { id: 'cohesity', name: 'Cohesity', category: 'Backup', connected: false, lastSync: 'Never', icon: 'CO' },
  { id: 'barracuda-backup', name: 'Barracuda Backup', category: 'Backup', connected: false, lastSync: 'Never', icon: 'BB' },
  { id: 'datto', name: 'Datto', category: 'Backup', connected: false, lastSync: 'Never', icon: 'DA' },
  { id: 'carbonite', name: 'Carbonite', category: 'Backup', connected: false, lastSync: 'Never', icon: 'CB' },
  { id: 'aws-backup', name: 'AWS Backup', category: 'Backup', connected: false, lastSync: 'Never', icon: 'AB' },

  // ============================================================
  // GRC & Compliance (10)
  // ============================================================
  { id: 'onetrust', name: 'OneTrust', category: 'GRC', connected: false, lastSync: 'Never', icon: 'OT' },
  { id: 'trustarc', name: 'TrustArc', category: 'GRC', connected: false, lastSync: 'Never', icon: 'TA' },
  { id: 'bigid', name: 'BigID', category: 'GRC', connected: false, lastSync: 'Never', icon: 'BI' },
  { id: 'securiti', name: 'Securiti', category: 'GRC', connected: false, lastSync: 'Never', icon: 'SE' },
  { id: 'wirewheel', name: 'WireWheel', category: 'GRC', connected: false, lastSync: 'Never', icon: 'WW' },
  { id: 'datagrail', name: 'DataGrail', category: 'GRC', connected: false, lastSync: 'Never', icon: 'DG' },
  { id: 'transcend', name: 'Transcend', category: 'GRC', connected: false, lastSync: 'Never', icon: 'TR' },
  { id: 'osano', name: 'Osano', category: 'GRC', connected: false, lastSync: 'Never', icon: 'OS' },
  { id: 'mine', name: 'Mine', category: 'GRC', connected: false, lastSync: 'Never', icon: 'MN' },
  { id: 'ketch', name: 'Ketch', category: 'GRC', connected: false, lastSync: 'Never', icon: 'KE' },

  // ============================================================
  // Training & Awareness (10)
  // ============================================================
  { id: 'knowbe4-training', name: 'KnowBe4', category: 'Training', connected: false, lastSync: 'Never', icon: 'KB' },
  { id: 'proofpoint-awareness', name: 'Proofpoint Security Awareness', category: 'Training', connected: false, lastSync: 'Never', icon: 'PA' },
  { id: 'sans-awareness', name: 'SANS Security Awareness', category: 'Training', connected: false, lastSync: 'Never', icon: 'SA' },
  { id: 'cofense-training', name: 'Cofense', category: 'Training', connected: false, lastSync: 'Never', icon: 'CF' },
  { id: 'hoxhunt', name: 'Hoxhunt', category: 'Training', connected: false, lastSync: 'Never', icon: 'HH' },
  { id: 'ninjio', name: 'Ninjio', category: 'Training', connected: false, lastSync: 'Never', icon: 'NJ' },
  { id: 'curricula', name: 'Curricula', category: 'Training', connected: false, lastSync: 'Never', icon: 'CU' },
  { id: 'hook-security', name: 'Hook Security', category: 'Training', connected: false, lastSync: 'Never', icon: 'HS' },
  { id: 'goldphish', name: 'GoldPhish', category: 'Training', connected: false, lastSync: 'Never', icon: 'GP' },
  { id: 'terranova-security', name: 'Terranova Security', category: 'Training', connected: false, lastSync: 'Never', icon: 'TS' },

  // ============================================================
  // Finance & Billing (10)
  // ============================================================
  { id: 'stripe', name: 'Stripe', category: 'Finance', connected: false, lastSync: 'Never', icon: 'ST' },
  { id: 'square', name: 'Square', category: 'Finance', connected: false, lastSync: 'Never', icon: 'SQ' },
  { id: 'paypal', name: 'PayPal', category: 'Finance', connected: false, lastSync: 'Never', icon: 'PP' },
  { id: 'brex', name: 'Brex', category: 'Finance', connected: false, lastSync: 'Never', icon: 'BX' },
  { id: 'ramp', name: 'Ramp', category: 'Finance', connected: false, lastSync: 'Never', icon: 'RP' },
  { id: 'divvy-bill', name: 'Divvy/Bill.com', category: 'Finance', connected: false, lastSync: 'Never', icon: 'DV' },
  { id: 'navan', name: 'Navan (TripActions)', category: 'Finance', connected: false, lastSync: 'Never', icon: 'NV' },
  { id: 'expensify', name: 'Expensify', category: 'Finance', connected: false, lastSync: 'Never', icon: 'EX' },
  { id: 'sap-concur', name: 'SAP Concur', category: 'Finance', connected: false, lastSync: 'Never', icon: 'SC' },
  { id: 'coupa', name: 'Coupa', category: 'Finance', connected: false, lastSync: 'Never', icon: 'CP' },

  // ============================================================
  // Analytics & BI (10)
  // ============================================================
  { id: 'tableau', name: 'Tableau', category: 'BI', connected: false, lastSync: 'Never', icon: 'TB' },
  { id: 'power-bi', name: 'Power BI', category: 'BI', connected: false, lastSync: 'Never', icon: 'PB' },
  { id: 'looker', name: 'Looker', category: 'BI', connected: false, lastSync: 'Never', icon: 'LK' },
  { id: 'mode-analytics', name: 'Mode Analytics', category: 'BI', connected: false, lastSync: 'Never', icon: 'MA' },
  { id: 'metabase', name: 'Metabase', category: 'BI', connected: false, lastSync: 'Never', icon: 'MB' },
  { id: 'domo', name: 'Domo', category: 'BI', connected: false, lastSync: 'Never', icon: 'DO' },
  { id: 'sisense', name: 'Sisense', category: 'BI', connected: false, lastSync: 'Never', icon: 'SI' },
  { id: 'qlik', name: 'Qlik', category: 'BI', connected: false, lastSync: 'Never', icon: 'QL' },
  { id: 'thoughtspot', name: 'ThoughtSpot', category: 'BI', connected: false, lastSync: 'Never', icon: 'TS' },
  { id: 'google-analytics', name: 'Google Analytics', category: 'BI', connected: false, lastSync: 'Never', icon: 'GA' },

  // ============================================================
  // Automation (10)
  // ============================================================
  { id: 'zapier', name: 'Zapier', category: 'Automation', connected: false, lastSync: 'Never', icon: 'ZP' },
  { id: 'make', name: 'Make (Integromat)', category: 'Automation', connected: false, lastSync: 'Never', icon: 'MK' },
  { id: 'tray-io', name: 'Tray.io', category: 'Automation', connected: false, lastSync: 'Never', icon: 'TY' },
  { id: 'workato', name: 'Workato', category: 'Automation', connected: false, lastSync: 'Never', icon: 'WA' },
  { id: 'power-automate', name: 'Power Automate', category: 'Automation', connected: false, lastSync: 'Never', icon: 'PA' },
  { id: 'n8n', name: 'n8n', category: 'Automation', connected: false, lastSync: 'Never', icon: 'N8' },
  { id: 'celigo', name: 'Celigo', category: 'Automation', connected: false, lastSync: 'Never', icon: 'CG' },
  { id: 'snaplogic', name: 'SnapLogic', category: 'Automation', connected: false, lastSync: 'Never', icon: 'SL' },
  { id: 'mulesoft', name: 'MuleSoft', category: 'Automation', connected: false, lastSync: 'Never', icon: 'MS' },
  { id: 'dell-boomi', name: 'Dell Boomi', category: 'Automation', connected: false, lastSync: 'Never', icon: 'DB' },

  // ============================================================
  // Additional Cloud & Infrastructure (5)
  // ============================================================
  { id: 'render', name: 'Render', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'RN' },
  { id: 'fly-io', name: 'Fly.io', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'FI' },
  { id: 'vercel', name: 'Vercel', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'VR' },
  { id: 'netlify', name: 'Netlify', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'NE' },
  { id: 'railway', name: 'Railway', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'RW' },

  // ============================================================
  // Additional Identity & Access (5)
  // ============================================================
  { id: 'centrify', name: 'Centrify', category: 'Identity', connected: false, lastSync: 'Never', icon: 'CE' },
  { id: 'aws-iam', name: 'AWS IAM Identity Center', category: 'Identity', connected: false, lastSync: 'Never', icon: 'AI' },
  { id: 'hashicorp-vault', name: 'HashiCorp Vault', category: 'Identity', connected: false, lastSync: 'Never', icon: 'HV' },
  { id: 'delinea', name: 'Delinea', category: 'Identity', connected: false, lastSync: 'Never', icon: 'DL' },
  { id: 'aws-cognito', name: 'AWS Cognito', category: 'Identity', connected: false, lastSync: 'Never', icon: 'AC' },

  // ============================================================
  // Additional Security & Vulnerability (10)
  // ============================================================
  { id: 'wiz', name: 'Wiz', category: 'Security', connected: false, lastSync: 'Never', icon: 'WZ' },
  { id: 'orca-security', name: 'Orca Security', category: 'Security', connected: false, lastSync: 'Never', icon: 'OR' },
  { id: 'lacework', name: 'Lacework', category: 'Security', connected: false, lastSync: 'Never', icon: 'LW' },
  { id: 'snyk-security', name: 'Snyk Container', category: 'Security', connected: false, lastSync: 'Never', icon: 'SK' },
  { id: 'prisma-cloud', name: 'Prisma Cloud', category: 'Security', connected: false, lastSync: 'Never', icon: 'PC' },
  { id: 'aws-guardduty', name: 'AWS GuardDuty', category: 'Security', connected: false, lastSync: 'Never', icon: 'GD' },
  { id: 'aws-inspector', name: 'AWS Inspector', category: 'Security', connected: false, lastSync: 'Never', icon: 'AI' },
  { id: 'aws-security-hub', name: 'AWS Security Hub', category: 'Security', connected: false, lastSync: 'Never', icon: 'SH' },
  { id: 'azure-security-center', name: 'Azure Security Center', category: 'Security', connected: false, lastSync: 'Never', icon: 'AZ' },
  { id: 'google-security-command', name: 'Google Security Command Center', category: 'Security', connected: false, lastSync: 'Never', icon: 'GS' },

  // ============================================================
  // Additional Monitoring (5)
  // ============================================================
  { id: 'sentry', name: 'Sentry', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'SN' },
  { id: 'rollbar', name: 'Rollbar', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'RB' },
  { id: 'bugsnag', name: 'Bugsnag', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'BG' },
  { id: 'airbrake', name: 'Airbrake', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'AB' },
  { id: 'statuspage', name: 'Statuspage', category: 'Monitoring', connected: false, lastSync: 'Never', icon: 'SP' },

  // ============================================================
  // Additional Dev & Code Quality (5)
  // ============================================================
  { id: 'sourcegraph', name: 'Sourcegraph', category: 'Code', connected: false, lastSync: 'Never', icon: 'SG' },
  { id: 'jfrog', name: 'JFrog Artifactory', category: 'Code', connected: false, lastSync: 'Never', icon: 'JF' },
  { id: 'nexus-repository', name: 'Nexus Repository', category: 'Code', connected: false, lastSync: 'Never', icon: 'NX' },
  { id: 'harbor', name: 'Harbor', category: 'Code', connected: false, lastSync: 'Never', icon: 'HB' },
  { id: 'aws-ecr', name: 'AWS ECR', category: 'Code', connected: false, lastSync: 'Never', icon: 'EC' },

  // ============================================================
  // Additional HR & People (5)
  // ============================================================
  { id: 'greenhouse', name: 'Greenhouse', category: 'HR', connected: false, lastSync: 'Never', icon: 'GH' },
  { id: 'lever', name: 'Lever', category: 'HR', connected: false, lastSync: 'Never', icon: 'LV' },
  { id: 'ashby', name: 'Ashby', category: 'HR', connected: false, lastSync: 'Never', icon: 'AS' },
  { id: 'culture-amp', name: 'Culture Amp', category: 'HR', connected: false, lastSync: 'Never', icon: 'CA' },
  { id: '15five', name: '15Five', category: 'HR', connected: false, lastSync: 'Never', icon: '15' },

  // ============================================================
  // Additional Productivity (5)
  // ============================================================
  { id: 'google-drive', name: 'Google Drive', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'GD' },
  { id: 'dropbox-business', name: 'Dropbox Business', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'DB' },
  { id: 'box', name: 'Box', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'BX' },
  { id: 'onedrive', name: 'OneDrive for Business', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'OD' },
  { id: 'sharepoint', name: 'SharePoint', category: 'Productivity', connected: false, lastSync: 'Never', icon: 'SP' },

  // ============================================================
  // Additional Ticketing & ITSM (5)
  // ============================================================
  { id: 'pagerduty-incidents', name: 'PagerDuty Incidents', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'PD' },
  { id: 'opsgenie-incidents', name: 'OpsGenie Incidents', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'OG' },
  { id: 'statuspage-incidents', name: 'Statuspage Incidents', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'SI' },
  { id: 'firehydrant', name: 'FireHydrant', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'FH' },
  { id: 'rootly', name: 'Rootly', category: 'Ticketing', connected: false, lastSync: 'Never', icon: 'RL' },

  // ============================================================
  // Additional Network & VPN (5)
  // ============================================================
  { id: 'cloudflare-access', name: 'Cloudflare Access', category: 'Network', connected: false, lastSync: 'Never', icon: 'CA' },
  { id: 'cloudflare-warp', name: 'Cloudflare WARP', category: 'Network', connected: false, lastSync: 'Never', icon: 'CW' },
  { id: 'twingate', name: 'Twingate', category: 'Network', connected: false, lastSync: 'Never', icon: 'TG' },
  { id: 'banyan-security', name: 'Banyan Security', category: 'Network', connected: false, lastSync: 'Never', icon: 'BS' },
  { id: 'aws-transit-gateway', name: 'AWS Transit Gateway', category: 'Network', connected: false, lastSync: 'Never', icon: 'TG' },
];

// Build the providerMap dynamically from ALL_INTEGRATIONS
const PROVIDER_MAP: Record<string, string> = {};
ALL_INTEGRATIONS.forEach(int => {
  PROVIDER_MAP[int.name] = int.id;
});

interface IntegrationsProps {
  onBack?: () => void;
}

export const Integrations: React.FC<IntegrationsProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>(ALL_INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const connectedCount = integrations.filter(i => i.connected).length;
  const integrationLimitReached = isAtLimit(user?.organization?.plan, 'maxIntegrations', connectedCount);

  // Onboarding: trigger integration_setup flow on first visit (Essentials+ only)
  useOnboardingTrigger('integration_setup', true);

  // Load real integration status from API
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        setIsLoading(true);
        const connectedIntegrations = await api.integrations.list();
        
        // Ensure connectedIntegrations is an array
        const integrationsArray = Array.isArray(connectedIntegrations) ? connectedIntegrations : [];
        
        // Map connected integrations to our catalog - key by both name and provider
        const connectedMap = new Map();
        integrationsArray.forEach((int: any) => {
          const key1 = int.name?.toLowerCase() || '';
          const key2 = int.provider?.toLowerCase() || '';
          if (key1) connectedMap.set(key1, int);
          if (key2) connectedMap.set(key2, int);
        });

        setIntegrations(ALL_INTEGRATIONS.map(int => {
          // Check both name and id for matching
          const connected = connectedMap.get(int.name.toLowerCase()) || 
                           connectedMap.get(int.id.toLowerCase());
          
          // Only mark as connected if the integration exists AND is actually connected in DB
          if (connected && connected.connected === true) {
            return { 
              ...int, 
              connected: true, 
              lastSync: connected.lastSync ? new Date(connected.lastSync).toLocaleString() : 'Never' 
            };
          }
          return { ...int, connected: false, lastSync: 'Never' };
        }));
      } catch (error) {
        console.error('Failed to load integrations:', error);
        // Fallback to catalog without connection status
        setIntegrations(ALL_INTEGRATIONS);
      } finally {
        setIsLoading(false);
      }
    };

    loadIntegrations();
  }, []);

  const categories = ['All', 'Cloud', 'Identity', 'HR', 'Code', 'CI/CD', 'Container', 'Monitoring', 'Security', 'SIEM', 'MDM', 'Ticketing', 'Productivity', 'CRM', 'Communication', 'Database', 'Network', 'Backup', 'GRC', 'Training', 'Finance', 'BI', 'Automation'];
  
  const filteredIntegrations = integrations.filter(int => {
    const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || int.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleIntegrationClick = (integration: Integration) => {
    if (!integration.connected && integrationLimitReached) {
      toast.warning(getUpgradeMessage(user?.organization?.plan, 'maxIntegrations', connectedCount) || 'Integration limit reached. Upgrade in Settings → Billing.');
      return;
    }
    setSelectedIntegration(integration);
  };

  const handleConnect = async () => {
    if (!selectedIntegration) return;
    
    // Reload integrations to get updated status
    try {
      const connectedIntegrations = await api.integrations.list();
      const integrationsArray = Array.isArray(connectedIntegrations) ? connectedIntegrations : [];
      const connectedMap = new Map(
        integrationsArray.map((int: any) => [int.name?.toLowerCase() || int.provider?.toLowerCase() || '', int])
      );

      setIntegrations(ALL_INTEGRATIONS.map(int => {
        const connected = connectedMap.get(int.name.toLowerCase()) || connectedMap.get(int.id.toLowerCase());
        // Only mark as connected if the integration exists AND is actually connected in DB
        if (connected && connected.connected === true) {
          return { 
            ...int, 
            connected: true, 
            lastSync: connected.lastSync ? new Date(connected.lastSync).toLocaleString() : 'Never' 
          };
        }
        return { ...int, connected: false, lastSync: 'Never' };
      }));
    } catch (error) {
      console.error('Failed to refresh integrations:', error);
    }
    
    setSelectedIntegration(null);
  };

  const handleDisconnect = async (integration?: Integration) => {
    // Handle case where integration might be undefined (called from modal)
    if (!integration) {
      // If called from modal, selectedIntegration should be set
      if (!selectedIntegration) {
        console.error('No integration selected for disconnect');
        return;
      }
      integration = selectedIntegration;
    }

    if (!integration.name) {
      console.error('Integration name is missing');
      return;
    }

    // Confirmation is already handled in IntegrationModal, skip here to avoid double popup
    // if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
    //   return;
    // }
    
    try {
      const provider = PROVIDER_MAP[integration.name] || integration.id.toLowerCase().replace(/\s+/g, '-');

      await api.integrations.disconnect(provider);
      
      // Reload integrations to get updated status
      const connectedIntegrations = await api.integrations.list();
      const integrationsArray = Array.isArray(connectedIntegrations) ? connectedIntegrations : [];
      const connectedMap = new Map(
        integrationsArray.map((int: any) => [int.name?.toLowerCase() || int.provider?.toLowerCase() || '', int])
      );

      setIntegrations(ALL_INTEGRATIONS.map(int => {
        const connected = connectedMap.get(int.name.toLowerCase()) || connectedMap.get(int.id.toLowerCase());
        // Only mark as connected if the integration exists AND is actually connected
        return connected && connected.connected === true
          ? { ...int, connected: true, lastSync: connected.lastSync || 'Never' }
          : { ...int, connected: false, lastSync: 'Never' };
      }));
      
      setSelectedIntegration(null);
      
      // Show success message
      toast.success(`${integration.name} has been disconnected successfully.`);
    } catch (error: unknown) {
      console.error('Failed to disconnect integration:', error);
      toast.error(`Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSync = async (integration: Integration) => {
    try {
      const provider = PROVIDER_MAP[integration.name] || integration.id.toLowerCase().replace(/\s+/g, '-');

      await api.integrations.sync(provider);
      
      // Reload integrations to get updated sync timestamp
      const connectedIntegrations = await api.integrations.list();
      const integrationsArray = Array.isArray(connectedIntegrations) ? connectedIntegrations : [];
      const connectedMap = new Map(
        integrationsArray.map((int: any) => [int.name?.toLowerCase() || int.provider?.toLowerCase() || '', int])
      );

      setIntegrations(ALL_INTEGRATIONS.map(int => {
        const connected = connectedMap.get(int.name.toLowerCase()) || connectedMap.get(int.id.toLowerCase());
        // Only mark as connected if the integration exists AND is actually connected in DB
        if (connected && connected.connected === true) {
          return { 
            ...int, 
            connected: true, 
            lastSync: connected.lastSync ? new Date(connected.lastSync).toLocaleString() : 'Just now' 
          };
        }
        return { ...int, connected: false, lastSync: 'Never' };
      }));
      
      toast.success(`${integration.name} synced successfully!`);
    } catch (error: unknown) {
      console.error('Failed to sync integration:', error);
      toast.error(`Failed to sync: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const totalCount = integrations.length;

  return (
    <div className="p-6 space-y-6 animate-fadeIn" data-onboarding="integrations-page">
      {integrationLimitReached && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
          {getUpgradeMessage(user?.organization?.plan, 'maxIntegrations', connectedCount)} <a href="/settings?tab=billing" className="font-medium underline">Upgrade</a>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('integrations.title')}</h1>
          <p className="text-gray-500 mt-1">
            Connect your tools to automate compliance collection. {connectedCount} of {totalCount} connected.
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
            <span>Close</span>
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (cat === 'All' && !selectedCategory) || selectedCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredIntegrations.map(int => (
          <div
            key={int.id}
            className={`p-5 border rounded-xl bg-white hover:shadow-md transition-all ${
              int.connected ? 'border-brand-200 bg-brand-50' : 'border-gray-200 hover:border-brand-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 border border-gray-100 flex-shrink-0">
                {/* Icon placeholder - in production, use actual icons */}
                <div className="font-bold text-sm">
                  {int.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="flex gap-2">
                {int.connected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSync(int);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center"
                    title="Sync Integration"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    {t('integrations.syncNow')}
                  </button>
                )}
                <button
                  onClick={() => handleIntegrationClick(int)}
                  disabled={!int.connected && integrationLimitReached}
                  title={!int.connected && integrationLimitReached ? getUpgradeMessage(user?.organization?.plan, 'maxIntegrations', connectedCount) : undefined}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    int.connected
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : integrationLimitReached
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {int.connected ? t('integrations.configure') : t('integrations.connect')}
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{int.name}</h3>
              <div className="flex items-center space-x-2 text-sm mb-2">
                <span className="text-gray-500">{int.category}</span>
                {int.connected && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle size={12} className="mr-1" />
                      {t('integrations.connected')}
                    </span>
                  </>
                )}
              </div>
              {int.connected && (
                <p className="text-xs text-gray-500">{t('integrations.lastSync')}: {int.lastSync}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{t('common.noResults')}</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
            className="mt-4 text-brand-600 hover:text-brand-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {selectedIntegration && (
        <IntegrationModal
          integration={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  );
};

