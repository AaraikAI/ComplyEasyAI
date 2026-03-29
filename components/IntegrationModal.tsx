import React, { useState, useEffect } from 'react';
import { X, ExternalLink, CheckCircle, AlertCircle, Loader, Key, User, Lock, FileText, Globe } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../contexts/I18nContext';

interface IntegrationModalProps {
  integration: {
    id: string;
    name: string;
    category: string;
    connected: boolean;
    lastSync: string;
  };
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

type AuthType = 'oauth' | 'api-key' | 'api-key-secret' | 'username-password' | 'iam' | 'service-account' | 'pat' | 'api-key-url';

export const IntegrationModal: React.FC<IntegrationModalProps> = ({
  integration,
  onClose,
  onConnect,
  onDisconnect,
}) => {
  const { t } = useI18n();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [authType, setAuthType] = useState<AuthType>('oauth');
  
  // Form state for different auth types
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [region, setRegion] = useState('');
  
  // AWS/Azure/GCP IAM
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');
  
  // Service Account JSON
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  
  // Personal Access Token
  const [pat, setPat] = useState('');
  const [patUrl, setPatUrl] = useState('');

  // Determine auth type based on integration
  useEffect(() => {
    const provider = getProviderId();
    const authTypeMap: Record<string, AuthType> = {
      // OAuth integrations (services with proper OAuth support)
      'google': 'oauth',
      'github': 'oauth',
      'slack': 'oauth',
      'jira': 'oauth',

      // IAM Credentials
      'aws': 'iam',
      'azure': 'iam',
      'gcp': 'service-account',

      // API Key + Secret (Client ID + Client Secret style)
      'datadog': 'api-key-secret',
      'newrelic': 'api-key-secret',
      'sentry': 'api-key-secret',
      'pagerduty': 'api-key-secret',
      'twilio': 'api-key-secret',
      'sendgrid': 'api-key-secret',
      'auth0': 'api-key-secret',       // Auth0 Management API uses Client ID + Client Secret
      'onelogin': 'api-key-secret',    // OneLogin uses Client ID + Client Secret
      'salesforce': 'api-key-secret',  // Salesforce Connected App uses Consumer Key + Secret
      'hubspot': 'api-key-secret',     // HubSpot Private App uses Access Token + optional secret
      'paypal': 'api-key-secret',      // PayPal uses Client ID + Client Secret
      'stripe': 'api-key-secret',      // Stripe uses API Key + optional webhook secret
      'trello': 'api-key-secret',      // Trello uses API Key + Token
      'microsoft-teams': 'api-key-secret', // MS Teams uses App ID + App Secret + Tenant ID

      // API Key only
      'qualys': 'api-key',
      'tenable': 'api-key',
      'crowdstrike': 'api-key',
      'paloalto': 'api-key',
      'rapid7': 'api-key',
      'okta': 'api-key',               // Okta uses API tokens
      'zendesk': 'api-key',            // Zendesk uses email/token authentication

      // Username + Password + API Key
      'jenkins': 'username-password',
      'splunk': 'username-password',
      'bamboohr': 'api-key-url',
      'workday': 'api-key-url',
      'adp': 'api-key-url',

      // Personal Access Token
      'gitlab': 'pat',
      'bitbucket': 'pat',
      'circleci': 'pat',
      'travis': 'pat',
      'docker': 'pat',
      'heroku': 'pat',
      'digitalocean': 'pat',
      'confluence': 'pat',             // Confluence uses API tokens (email + API token)
      'asana': 'pat',                  // Asana uses Personal Access Tokens
      'monday': 'pat',                 // Monday.com uses API tokens
      'discord': 'pat',                // Discord uses Bot tokens

      // API Key + URL
      'mongodb': 'api-key-url',
      'postgresql': 'api-key-url',
      'mysql': 'api-key-url',
      'redis': 'api-key-url',
      'elasticsearch': 'api-key-url',
      'kubernetes': 'api-key-url',
    };

    setAuthType(authTypeMap[provider] || 'api-key');

    // Set default URLs for some integrations
    if (provider === 'jenkins') setBaseUrl('https://your-jenkins-instance.com');
    if (provider === 'splunk') setBaseUrl('https://your-splunk-instance.com');
    if (provider === 'gitlab') setPatUrl('https://gitlab.com');
    if (provider === 'bitbucket') setPatUrl('https://bitbucket.org');
    if (provider === 'confluence') setPatUrl('https://your-domain.atlassian.net');
    if (provider === 'asana') setPatUrl('https://app.asana.com');
    if (provider === 'monday') setPatUrl('https://api.monday.com');
    if (provider === 'discord') setPatUrl('');
  }, [integration]);

  // Check URL params for OAuth callback status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const integrationParam = params.get('integration');
    const statusParam = params.get('status');

    if (integrationParam && integrationParam.toLowerCase() === integration.name.toLowerCase().replace(/\s+/g, '-')) {
      if (statusParam === 'success') {
        setStatus('success');
        setTimeout(() => {
          onConnect();
          onClose();
          window.history.replaceState({}, '', window.location.pathname);
        }, 2000);
      } else if (statusParam === 'error') {
        setStatus('error');
        setError('Failed to connect integration. Please try again.');
      }
    }
  }, [integration.name, onClose, onConnect]);

  // Map integration names to provider IDs
  const getProviderId = (): string => {
    const providerMap: Record<string, string> = {
      'AWS': 'aws',
      'Google Workspace': 'google',
      'GitHub': 'github',
      'Slack': 'slack',
      'Jira': 'jira',
      'Microsoft Azure': 'azure',
      'Google Cloud Platform': 'gcp',
      'GitLab': 'gitlab',
      'Bitbucket': 'bitbucket',
      'Microsoft Teams': 'microsoft-teams',
      'Okta': 'okta',
      'Auth0': 'auth0',
      'OneLogin': 'onelogin',
      'Heroku': 'heroku',
      'DigitalOcean': 'digitalocean',
      'Jenkins': 'jenkins',
      'CircleCI': 'circleci',
      'Travis CI': 'travis',
      'Docker Hub': 'docker',
      'Kubernetes': 'kubernetes',
      'Confluence': 'confluence',
      'Trello': 'trello',
      'Asana': 'asana',
      'Monday.com': 'monday',
      'Discord': 'discord',
      'BambooHR': 'bamboohr',
      'Workday': 'workday',
      'ADP': 'adp',
      'Splunk': 'splunk',
      'Datadog': 'datadog',
      'New Relic': 'newrelic',
      'Sentry': 'sentry',
      'PagerDuty': 'pagerduty',
      'Qualys': 'qualys',
      'Tenable': 'tenable',
      'CrowdStrike': 'crowdstrike',
      'Palo Alto': 'paloalto',
      'Rapid7': 'rapid7',
      'MongoDB Atlas': 'mongodb',
      'PostgreSQL': 'postgresql',
      'MySQL': 'mysql',
      'Redis': 'redis',
      'Elasticsearch': 'elasticsearch',
      'Salesforce': 'salesforce',
      'HubSpot': 'hubspot',
      'Zendesk': 'zendesk',
      'Stripe': 'stripe',
      'PayPal': 'paypal',
      'Twilio': 'twilio',
      'SendGrid': 'sendgrid',
    };
    return providerMap[integration.name] || integration.id.toLowerCase().replace(/\s+/g, '-');
  };

  const handleOAuthConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setStatus('connecting');

    try {
      const provider = getProviderId();
      const response: any = await api.integrations.authorize(provider);
      
      if (response.comingSoon || response.error?.includes('coming soon')) {
        // If provider doesn't support OAuth, suggest using PAT/API key instead
        if (response.useConnect || response.supportedAuthTypes) {
          setError(`${integration.name} does not support OAuth. Please use ${response.supportedAuthTypes?.join(' or ') || 'API key or PAT'} connection instead.`);
          // Automatically switch to PAT connection if available
          if (response.supportedAuthTypes?.includes('pat')) {
            setAuthType('pat');
          } else if (response.supportedAuthTypes?.includes('api-key')) {
            setAuthType('api-key');
          }
        } else {
          setError(response.error || `${integration.name} integration is coming soon.`);
        }
        setIsConnecting(false);
        setStatus('idle');
        return;
      }
      
      if (response.authUrl) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          response.authUrl,
          `${integration.name} OAuth`,
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        const pollTimer = setInterval(() => {
          if (popup?.closed) {
            clearInterval(pollTimer);
            setIsConnecting(false);
            const params = new URLSearchParams(window.location.search);
            if (params.get('status') !== 'success') {
              setStatus('idle');
            }
          }
        }, 500);
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (err: any) {
      if (err.message?.includes('coming soon') || err.status === 501 || err.status === 400) {
        // Check if error suggests using connect instead
        const errorResponse = err.response?.data || err;
        if (errorResponse.useConnect || errorResponse.supportedAuthTypes) {
          setError(`${integration.name} does not support OAuth. Please use ${errorResponse.supportedAuthTypes?.join(' or ') || 'API key or PAT'} connection instead.`);
          // Automatically switch to appropriate auth type
          if (errorResponse.supportedAuthTypes?.includes('pat')) {
            setAuthType('pat');
          } else if (errorResponse.supportedAuthTypes?.includes('api-key')) {
            setAuthType('api-key');
          }
        } else {
          setError(`${integration.name} integration is coming soon. Please check back later.`);
        }
      } else {
        setError(err.message || 'Failed to initiate connection');
      }
      setIsConnecting(false);
      setStatus('error');
    }
  };

  // Validation helpers
  const validateApiKey = (key: string): string | null => {
    if (!key || key.trim().length === 0) {
      return 'API key is required';
    }
    if (key.length < 10) {
      return 'API key appears to be too short';
    }
    return null;
  };

  const validateAwsCredentials = (accessKey: string, secretKey: string): string | null => {
    if (!accessKey || !secretKey) {
      return 'Access Key ID and Secret Access Key are required';
    }
    // AWS Access Key ID format: AKIA followed by 16 alphanumeric characters
    if (!/^AKIA[0-9A-Z]{16}$/.test(accessKey)) {
      return 'Invalid AWS Access Key ID format. Should start with AKIA and be 20 characters long.';
    }
    // AWS Secret Access Key is typically 40 characters
    if (secretKey.length < 20) {
      return 'Secret Access Key appears to be invalid';
    }
    return null;
  };

  const validateAzureCredentials = (tenantId: string, clientId: string, clientSecret: string, subscriptionId: string): string | null => {
    if (!tenantId || !clientId || !clientSecret || !subscriptionId) {
      return 'All Azure credentials are required (Tenant ID, Client ID, Client Secret, Subscription ID)';
    }
    // Azure Tenant ID and Client ID are GUIDs
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidPattern.test(tenantId)) {
      return 'Invalid Tenant ID format. Should be a GUID (e.g., 12345678-1234-1234-1234-123456789012)';
    }
    if (!guidPattern.test(clientId)) {
      return 'Invalid Client ID format. Should be a GUID';
    }
    if (clientSecret.length < 10) {
      return 'Client Secret appears to be invalid';
    }
    if (subscriptionId.length < 10) {
      return 'Subscription ID appears to be invalid';
    }
    return null;
  };

  const validateGcpServiceAccount = (jsonString: string): string | null => {
    if (!jsonString || jsonString.trim().length === 0) {
      return 'Service Account JSON is required';
    }
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 'Invalid JSON format. Please provide a valid service account JSON.';
    }
    // Check for required fields in GCP service account
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !parsed[field]);
    if (missingFields.length > 0) {
      return `Missing required fields in service account JSON: ${missingFields.join(', ')}`;
    }
    if (parsed.type !== 'service_account') {
      return 'Invalid service account type. Expected "service_account".';
    }
    return null;
  };

  const handleApiKeyConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate API key
    const validationError = validateApiKey(apiKey);
    if (validationError) {
      setError(validationError);
      setStatus('error');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setStatus('connecting');

    try {
      const provider = getProviderId();
      await api.integrations.connectWithApiKey(provider, {
        apiKey,
        baseUrl: baseUrl || undefined,
      });
      
      setStatus('success');
      setTimeout(() => {
        onConnect();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to connect. Please check your API key and try again.');
      setIsConnecting(false);
      setStatus('error');
    }
  };

  const handleApiKeySecretConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate API key and secret
    const keyError = validateApiKey(apiKey);
    if (keyError) {
      setError(keyError);
      setStatus('error');
      return;
    }
    if (!apiSecret || apiSecret.trim().length === 0) {
      setError('API Secret is required');
      setStatus('error');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setStatus('connecting');

    try {
      const provider = getProviderId();
      await api.integrations.connectWithApiKeySecret(provider, {
        apiKey,
        apiSecret,
        baseUrl: baseUrl || undefined,
      });
      
      setStatus('success');
      setTimeout(() => {
        onConnect();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to connect. Please check your API key and secret.');
      setIsConnecting(false);
      setStatus('error');
    }
  };

  const handleUsernamePasswordConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username and password
    if (!username || username.trim().length === 0) {
      setError('Username is required');
      setStatus('error');
      return;
    }
    if (!password || password.trim().length === 0) {
      setError('Password is required');
      setStatus('error');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setStatus('connecting');

    try {
      const provider = getProviderId();
      await api.integrations.connectWithUsernamePassword(provider, {
        username,
        password,
        baseUrl: baseUrl || undefined,
        apiKey: apiKey || undefined,
      });
      
      setStatus('success');
      setTimeout(() => {
        onConnect();
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect';
      if (errorMsg.includes('unreachable') || errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED')) {
        setError('Cannot reach the service. Please check the base URL and network connection.');
      } else if (errorMsg.includes('certificate') || errorMsg.includes('SSL')) {
        setError('SSL certificate error. If using a self-signed certificate, please contact support.');
      } else {
        setError(errorMsg);
      }
      setIsConnecting(false);
      setStatus('error');
    }
  };

  const handleIamConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const provider = getProviderId();
    let validationError: string | null = null;

    if (provider === 'aws') {
      validationError = validateAwsCredentials(accessKeyId, secretAccessKey);
      if (!region || region.trim().length === 0) {
        validationError = 'AWS region is required';
      }
    } else if (provider === 'azure') {
      validationError = validateAzureCredentials(username, accessKeyId, secretAccessKey, subscriptionId);
    }

    if (validationError) {
      setError(validationError);
      setStatus('error');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setStatus('connecting');

    try {
      if (provider === 'aws') {
        await api.integrations.connectAWS({
          accessKeyId,
          secretAccessKey,
          region: region || 'us-east-1',
        });
      } else if (provider === 'azure') {
        await api.integrations.connectAzure({
          subscriptionId,
          clientId: accessKeyId,
          clientSecret: secretAccessKey,
          tenantId: username,
        });
      }
      
      setStatus('success');
      setTimeout(() => {
        onConnect();
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect';
      if (errorMsg.includes('Invalid') || errorMsg.includes('invalid')) {
        setError('Invalid credentials. Please check your Access Key ID, Secret Access Key, and region.');
      } else if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
        setError('Insufficient permissions. Please ensure your IAM user has the required permissions.');
      } else if (errorMsg.includes('expired')) {
        setError('Credentials have expired. Please update your credentials.');
      } else {
        setError(errorMsg);
      }
      setIsConnecting(false);
      setStatus('error');
    }
  };

  const handleServiceAccountConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate service account JSON
    const validationError = validateGcpServiceAccount(serviceAccountJson);
    if (validationError) {
      setError(validationError);
      setStatus('error');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setStatus('connecting');

    try {
      let parsedJson;
      try {
        parsedJson = JSON.parse(serviceAccountJson);
      } catch {
        throw new Error('Invalid JSON format. Please provide a valid service account JSON.');
      }

      const provider = getProviderId();
      await api.integrations.connectWithServiceAccount(provider, {
        serviceAccountJson: parsedJson,
      });
      
      setStatus('success');
      setTimeout(() => {
        onConnect();
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect';
      if (errorMsg.includes('expired') || errorMsg.includes('invalid_grant')) {
        setError('Service account credentials have expired. Please generate a new service account key.');
      } else if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
        setError('Service account does not have required permissions. Please check IAM roles.');
      } else {
        setError(errorMsg);
      }
      setError(err.message || 'Failed to connect. Please check your service account JSON.');
      setIsConnecting(false);
      setStatus('error');
    }
  };

  const validatePat = (token: string): string | null => {
    if (!token || token.trim().length === 0) {
      return 'Personal Access Token is required';
    }
    if (token.length < 10) {
      return 'Token appears to be too short';
    }
    return null;
  };

  const handlePatConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate PAT
    const validationError = validatePat(pat);
    if (validationError) {
      setError(validationError);
      setStatus('error');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setStatus('connecting');

    try {
      const provider = getProviderId();
      await api.integrations.connectWithPat(provider, {
        token: pat,
        baseUrl: patUrl || undefined,
      });
      
      setStatus('success');
      setTimeout(() => {
        onConnect();
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect';
      if (errorMsg.includes('Invalid') || errorMsg.includes('invalid') || errorMsg.includes('401') || errorMsg.includes('403')) {
        setError('Invalid token or insufficient permissions. Please check your Personal Access Token and its scopes.');
      } else if (errorMsg.includes('unreachable') || errorMsg.includes('network')) {
        setError('Cannot reach the service. Please check the base URL (for self-hosted instances) and network connection.');
      } else {
        setError(errorMsg);
      }
      setIsConnecting(false);
      setStatus('error');
    }
  };

  const handleDisconnect = async () => {
    if (!integration || !integration.name) {
      setError('Integration information is missing');
      return;
    }

    if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = getProviderId();
      await api.integrations.disconnect(provider);
      
      // Call onDisconnect callback to refresh parent
      if (onDisconnect) {
        onDisconnect();
      }
      onClose();
      
      // Don't reload the entire page - let the parent component handle the refresh
      // The onDisconnect callback should trigger a reload of the integrations list
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect integration');
      setIsConnecting(false);
    }
  };

  const renderAuthForm = () => {
    if (status === 'success') {
      return (
        <div className="text-center py-8">
          <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
          <p className="text-green-800 font-medium text-lg">Successfully connected!</p>
        </div>
      );
    }

    if (integration.connected) {
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle size={18} />
            <span className="font-medium">{t('integrations.connected')}</span>
          </div>
          <p className="text-sm text-gray-600">
            {t('integrations.lastSync')}: {integration.lastSync}
          </p>
          <button
            onClick={handleDisconnect}
            disabled={isConnecting}
            className="w-full py-2.5 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? t('common.loading') : t('integrations.disconnect')}
          </button>
        </div>
      );
    }

    switch (authType) {
      case 'oauth':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Connect your {integration.name} account using OAuth 2.0. You'll be redirected to authorize access.
            </p>
            <button
              onClick={handleOAuthConnect}
              disabled={isConnecting || status === 'connecting'}
              className="w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isConnecting || status === 'connecting' ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <ExternalLink size={18} />
                  <span>{t('integrations.connect')} {integration.name}</span>
                </>
              )}
            </button>
          </div>
        );

      case 'api-key': {
        const apiKeyProvider = getProviderId();
        const apiKeyLabels: Record<string, { keyLabel: string; keyPlaceholder: string; urlLabel: string; urlPlaceholder: string; urlRequired: boolean; instructions: string }> = {
          'okta': {
            keyLabel: 'API Token',
            keyPlaceholder: 'Enter your Okta API token',
            urlLabel: 'Okta Domain',
            urlPlaceholder: 'https://your-domain.okta.com',
            urlRequired: true,
            instructions: 'Create an API token: Security → API → Tokens → Create Token'
          },
          'zendesk': {
            keyLabel: 'API Token',
            keyPlaceholder: 'Enter your Zendesk API token',
            urlLabel: 'Zendesk Subdomain',
            urlPlaceholder: 'https://your-company.zendesk.com',
            urlRequired: true,
            instructions: 'Create a token: Admin Center → Apps and Integrations → APIs → Zendesk API'
          },
          'qualys': {
            keyLabel: 'API Token',
            keyPlaceholder: 'Enter your Qualys API token',
            urlLabel: 'Qualys API URL',
            urlPlaceholder: 'https://qualysapi.qualys.com',
            urlRequired: true,
            instructions: 'Get your API credentials from Qualys administration'
          },
          'tenable': {
            keyLabel: 'API Key',
            keyPlaceholder: 'Enter your Tenable API key',
            urlLabel: 'API URL (optional)',
            urlPlaceholder: 'https://cloud.tenable.com',
            urlRequired: false,
            instructions: 'Generate API keys: Settings → My Account → API Keys'
          },
          'crowdstrike': {
            keyLabel: 'API Client ID',
            keyPlaceholder: 'Enter your CrowdStrike Client ID',
            urlLabel: 'Base URL',
            urlPlaceholder: 'https://api.crowdstrike.com',
            urlRequired: true,
            instructions: 'Create API credentials: Support → API Clients and Keys'
          },
          'rapid7': {
            keyLabel: 'API Key',
            keyPlaceholder: 'Enter your Rapid7 API key',
            urlLabel: 'API URL',
            urlPlaceholder: 'https://us.api.insight.rapid7.com',
            urlRequired: true,
            instructions: 'Create an API key in your Rapid7 InsightVM settings'
          },
        };
        const apiKeyConfig = apiKeyLabels[apiKeyProvider] || {
          keyLabel: 'API Key',
          keyPlaceholder: 'Enter your API key',
          urlLabel: 'Base URL (optional)',
          urlPlaceholder: 'https://api.example.com',
          urlRequired: false,
          instructions: `Enter your ${integration.name} API key`
        };

        return (
          <form onSubmit={handleApiKeyConnect} className="space-y-4">
            {apiKeyConfig.urlRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {apiKeyConfig.urlLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder={apiKeyConfig.urlPlaceholder}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {apiKeyConfig.keyLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder={apiKeyConfig.keyPlaceholder}
                required
              />
            </div>
            {!apiKeyConfig.urlRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {apiKeyConfig.urlLabel}
                </label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder={apiKeyConfig.urlPlaceholder}
                />
              </div>
            )}
            <p className="text-xs text-gray-500">
              {apiKeyConfig.instructions}
            </p>
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Key size={18} />
                  <span>Connect</span>
                </>
              )}
            </button>
          </form>
        );
      }

      case 'api-key-secret': {
        const secretProvider = getProviderId();
        const secretLabels: Record<string, { keyLabel: string; keyPlaceholder: string; secretLabel: string; secretPlaceholder: string; urlLabel?: string; urlPlaceholder?: string; instructions: string }> = {
          'trello': {
            keyLabel: 'API Key',
            keyPlaceholder: 'Enter your Trello API key',
            secretLabel: 'API Token',
            secretPlaceholder: 'Enter your Trello API token',
            instructions: 'Get your API key and token at: trello.com/power-ups/admin → New → Generate API Key'
          },
          'auth0': {
            keyLabel: 'Client ID',
            keyPlaceholder: 'Enter your Auth0 Client ID',
            secretLabel: 'Client Secret',
            secretPlaceholder: 'Enter your Auth0 Client Secret',
            urlLabel: 'Auth0 Domain',
            urlPlaceholder: 'https://your-tenant.auth0.com',
            instructions: 'Create a Machine-to-Machine application in Auth0 Dashboard → Applications'
          },
          'onelogin': {
            keyLabel: 'Client ID',
            keyPlaceholder: 'Enter your OneLogin Client ID',
            secretLabel: 'Client Secret',
            secretPlaceholder: 'Enter your OneLogin Client Secret',
            urlLabel: 'OneLogin Subdomain',
            urlPlaceholder: 'https://your-company.onelogin.com',
            instructions: 'Create API credentials: Administration → Developers → API Credentials'
          },
          'salesforce': {
            keyLabel: 'Consumer Key',
            keyPlaceholder: 'Enter your Connected App Consumer Key',
            secretLabel: 'Consumer Secret',
            secretPlaceholder: 'Enter your Connected App Consumer Secret',
            urlLabel: 'Instance URL',
            urlPlaceholder: 'https://your-instance.salesforce.com',
            instructions: 'Create a Connected App: Setup → App Manager → New Connected App'
          },
          'hubspot': {
            keyLabel: 'Access Token',
            keyPlaceholder: 'Enter your HubSpot Private App access token',
            secretLabel: 'App ID (optional)',
            secretPlaceholder: 'Enter your HubSpot App ID',
            instructions: 'Create a Private App: Settings → Integrations → Private Apps → Create'
          },
          'paypal': {
            keyLabel: 'Client ID',
            keyPlaceholder: 'Enter your PayPal Client ID',
            secretLabel: 'Client Secret',
            secretPlaceholder: 'Enter your PayPal Client Secret',
            urlLabel: 'Environment',
            urlPlaceholder: 'https://api.paypal.com (or sandbox)',
            instructions: 'Get credentials from PayPal Developer Dashboard → My Apps & Credentials'
          },
          'stripe': {
            keyLabel: 'API Key (Secret)',
            keyPlaceholder: 'sk_live_... or sk_test_...',
            secretLabel: 'Webhook Secret (optional)',
            secretPlaceholder: 'whsec_...',
            instructions: 'Get your API keys from Stripe Dashboard → Developers → API keys'
          },
          'microsoft-teams': {
            keyLabel: 'Application (client) ID',
            keyPlaceholder: 'Enter your Azure AD App ID',
            secretLabel: 'Client Secret',
            secretPlaceholder: 'Enter your Azure AD Client Secret',
            urlLabel: 'Tenant ID',
            urlPlaceholder: 'Enter your Azure AD Tenant ID',
            instructions: 'Register an app in Azure Portal → App registrations → New registration'
          },
          'datadog': {
            keyLabel: 'API Key',
            keyPlaceholder: 'Enter your Datadog API key',
            secretLabel: 'Application Key',
            secretPlaceholder: 'Enter your Datadog Application key',
            instructions: 'Get keys from Organization Settings → API Keys & Application Keys'
          },
          'newrelic': {
            keyLabel: 'API Key',
            keyPlaceholder: 'Enter your New Relic API key',
            secretLabel: 'Account ID',
            secretPlaceholder: 'Enter your New Relic Account ID',
            instructions: 'Get your API key from Account Settings → API Keys'
          },
          'twilio': {
            keyLabel: 'Account SID',
            keyPlaceholder: 'Enter your Twilio Account SID',
            secretLabel: 'Auth Token',
            secretPlaceholder: 'Enter your Twilio Auth Token',
            instructions: 'Find credentials in Twilio Console → Account → API Keys'
          },
          'sendgrid': {
            keyLabel: 'API Key',
            keyPlaceholder: 'Enter your SendGrid API key',
            secretLabel: 'API Key ID (optional)',
            secretPlaceholder: 'Enter API Key ID if available',
            instructions: 'Create an API key: Settings → API Keys → Create API Key'
          },
          'sentry': {
            keyLabel: 'Auth Token',
            keyPlaceholder: 'Enter your Sentry Auth Token',
            secretLabel: 'Organization Slug',
            secretPlaceholder: 'Enter your organization slug',
            instructions: 'Create an auth token: User Settings → Auth Tokens → Create New Token'
          },
          'pagerduty': {
            keyLabel: 'API Key',
            keyPlaceholder: 'Enter your PagerDuty API key',
            secretLabel: 'API Key ID (optional)',
            secretPlaceholder: 'Optional API Key ID',
            instructions: 'Create an API key: Integrations → API Access Keys → Create New API Key'
          },
        };
        const secretConfig = secretLabels[secretProvider] || {
          keyLabel: 'API Key',
          keyPlaceholder: 'Enter your API key',
          secretLabel: 'API Secret',
          secretPlaceholder: 'Enter your API secret',
          instructions: `Enter your ${integration.name} API credentials`
        };

        return (
          <form onSubmit={handleApiKeySecretConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {secretConfig.keyLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder={secretConfig.keyPlaceholder}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {secretConfig.secretLabel} {!secretConfig.secretLabel.includes('optional') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder={secretConfig.secretPlaceholder}
                required={!secretConfig.secretLabel.includes('optional')}
              />
            </div>
            {secretConfig.urlLabel && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {secretConfig.urlLabel} {secretConfig.urlLabel.includes('optional') ? '' : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder={secretConfig.urlPlaceholder || 'https://api.example.com'}
                  required={!secretConfig.urlLabel?.includes('optional')}
                />
              </div>
            )}
            <p className="text-xs text-gray-500">
              {secretConfig.instructions}
            </p>
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Key size={18} />
                  <span>Connect</span>
                </>
              )}
            </button>
          </form>
        );
      }

      case 'username-password':
        return (
          <form onSubmit={handleUsernamePasswordConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="https://your-instance.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password / API Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="Enter your password or API token"
                required
              />
            </div>
            {getProviderId() === 'jenkins' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Token (optional)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="Jenkins API token (optional)"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <User size={18} />
                  <span>Connect</span>
                </>
              )}
            </button>
          </form>
        );

      case 'iam': {
        const provider = getProviderId();
        if (provider === 'aws') {
          return (
            <form onSubmit={handleIamConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Access Key ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Secret Access Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Region <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="us-east-1"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Key size={18} />
                    <span>Connect AWS</span>
                  </>
                )}
              </button>
            </form>
          );
        } else if (provider === 'azure') {
          return (
            <form onSubmit={handleIamConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenant ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="Enter your Azure Tenant ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="Enter your Azure Client ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="Enter your Azure Client Secret"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subscriptionId}
                  onChange={(e) => setSubscriptionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="Enter your Azure Subscription ID"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Key size={18} />
                    <span>Connect Azure</span>
                  </>
                )}
              </button>
            </form>
          );
        }
        return null;
      }

      case 'service-account':
        return (
          <form onSubmit={handleServiceAccountConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Account JSON <span className="text-red-500">*</span>
              </label>
              <textarea
                value={serviceAccountJson}
                onChange={(e) => setServiceAccountJson(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono text-sm"
                placeholder="Paste your service account JSON key here"
                rows={8}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste your Google Cloud service account JSON key file
              </p>
            </div>
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <FileText size={18} />
                  <span>Connect GCP</span>
                </>
              )}
            </button>
          </form>
        );

      case 'pat': {
        const patProvider = getProviderId();
        const patLabels: Record<string, { urlLabel: string; urlPlaceholder: string; tokenLabel: string; tokenPlaceholder: string; instructions: string }> = {
          'confluence': {
            urlLabel: 'Atlassian Site URL',
            urlPlaceholder: 'https://your-domain.atlassian.net',
            tokenLabel: 'API Token',
            tokenPlaceholder: 'Enter your Atlassian API token',
            instructions: 'Generate an API token at: Atlassian Account → Security → API tokens'
          },
          'asana': {
            urlLabel: 'Asana URL (optional)',
            urlPlaceholder: 'https://app.asana.com',
            tokenLabel: 'Personal Access Token',
            tokenPlaceholder: 'Enter your Asana PAT',
            instructions: 'Generate a PAT in Asana: My Settings → Apps → Personal Access Tokens'
          },
          'monday': {
            urlLabel: 'Monday.com URL (optional)',
            urlPlaceholder: 'https://api.monday.com',
            tokenLabel: 'API Token',
            tokenPlaceholder: 'Enter your Monday.com API token',
            instructions: 'Find your API token: Avatar → Admin → API'
          },
          'discord': {
            urlLabel: '',
            urlPlaceholder: '',
            tokenLabel: 'Bot Token',
            tokenPlaceholder: 'Enter your Discord bot token',
            instructions: 'Get your bot token from Discord Developer Portal → Your App → Bot → Token'
          },
          'gitlab': {
            urlLabel: 'GitLab Instance URL',
            urlPlaceholder: 'https://gitlab.com or https://your-gitlab.com',
            tokenLabel: 'Personal Access Token',
            tokenPlaceholder: 'Enter your GitLab PAT',
            instructions: 'Create a PAT: User Settings → Access Tokens (scopes: api, read_user)'
          },
          'bitbucket': {
            urlLabel: 'Bitbucket URL (optional)',
            urlPlaceholder: 'https://bitbucket.org',
            tokenLabel: 'App Password',
            tokenPlaceholder: 'Enter your Bitbucket app password',
            instructions: 'Create an app password: Personal Settings → App passwords'
          },
          'heroku': {
            urlLabel: '',
            urlPlaceholder: '',
            tokenLabel: 'API Key',
            tokenPlaceholder: 'Enter your Heroku API key',
            instructions: 'Find your API key: Account Settings → API Key'
          },
          'digitalocean': {
            urlLabel: '',
            urlPlaceholder: '',
            tokenLabel: 'Personal Access Token',
            tokenPlaceholder: 'Enter your DigitalOcean PAT',
            instructions: 'Generate a token: API → Tokens/Keys → Generate New Token'
          },
          'circleci': {
            urlLabel: '',
            urlPlaceholder: '',
            tokenLabel: 'Personal API Token',
            tokenPlaceholder: 'Enter your CircleCI token',
            instructions: 'Create a token: User Settings → Personal API Tokens'
          },
          'travis': {
            urlLabel: '',
            urlPlaceholder: '',
            tokenLabel: 'API Access Token',
            tokenPlaceholder: 'Enter your Travis CI token',
            instructions: 'Get your token from Travis CI Settings page'
          },
          'docker': {
            urlLabel: '',
            urlPlaceholder: '',
            tokenLabel: 'Access Token',
            tokenPlaceholder: 'Enter your Docker Hub access token',
            instructions: 'Create a token: Docker Hub → Account Settings → Security → Access Tokens'
          },
        };
        const patConfig = patLabels[patProvider] || {
          urlLabel: 'Instance URL (optional)',
          urlPlaceholder: 'https://your-instance.com',
          tokenLabel: 'Personal Access Token',
          tokenPlaceholder: 'Enter your personal access token',
          instructions: `Create a token with appropriate scopes in your ${integration.name} settings`
        };

        return (
          <form onSubmit={handlePatConnect} className="space-y-4">
            {patConfig.urlLabel && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {patConfig.urlLabel}
                </label>
                <input
                  type="url"
                  value={patUrl}
                  onChange={(e) => setPatUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder={patConfig.urlPlaceholder}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {patConfig.tokenLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder={patConfig.tokenPlaceholder}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {patConfig.instructions}
              </p>
            </div>
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Key size={18} />
                  <span>Connect</span>
                </>
              )}
            </button>
          </form>
        );
      }

      case 'api-key-url':
        return (
          <form onSubmit={handleApiKeyConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="Enter your API key"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base URL / Connection String <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="mongodb://... or https://api.example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Globe size={18} />
                  <span>Connect</span>
                </>
              )}
            </button>
          </form>
        );

      default:
        return (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              {integration.name} integration is coming soon.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-scaleIn max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">{integration.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Category:</span> {integration.category}
            </p>
            {integration.connected && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Last Sync:</span> {integration.lastSync}
              </p>
            )}
          </div>

          {renderAuthForm()}
        </div>
      </div>
    </div>
  );
};
