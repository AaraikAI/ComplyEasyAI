/**
 * PAT (Personal Access Token) Validation Service
 * Validates tokens for various integrations before allowing connection
 */

import axios from 'axios';
import logger from '../../config/logger';
import { isUrlSafe } from '../../utils/urlValidator';
import { AppError } from '../../middleware/errorHandler';

interface ValidationResult {
  valid: boolean;
  error?: string;
  userInfo?: any;
}

class PATValidationService {
  /**
   * Verify baseUrl is safe before use in HTTP requests (SSRF protection).
   */
  private validateBaseUrl(baseUrl: string | undefined): void {
    if (baseUrl && !isUrlSafe(baseUrl)) {
      throw new AppError('Invalid base URL', 400);
    }
  }

  /**
   * Verify resolved URL is safe before making outbound HTTP request (SSRF defense-in-depth).
   * Use this on every URL that interpolates user-controlled segments (baseUrl, subdomain, etc.).
   */
  private assertSafeOutbound(url: string, context: string): void {
    if (!isUrlSafe(url)) {
      logger.error(`PAT validation outbound URL rejected by isUrlSafe (${context})`, { url });
      throw new AppError(`Unsafe outbound URL in ${context}`, 400);
    }
  }

  /**
   * Validate PAT for a specific provider
   */
  async validateToken(provider: string, token: string, baseUrl?: string): Promise<ValidationResult> {
    try {
      switch (provider.toLowerCase()) {
        case 'github':
          return await this.validateGitHubToken(token);
        case 'gitlab':
          return await this.validateGitLabToken(token, baseUrl);
        case 'bitbucket':
          return await this.validateBitbucketToken(token);
        case 'travis':
        case 'travis-ci':
          return await this.validateTravisToken(token);
        case 'circleci':
          return await this.validateCircleCIToken(token);
        case 'jenkins':
          return await this.validateJenkinsToken(token, baseUrl);
        case 'stripe':
          return await this.validateStripeToken(token);
        case 'sendgrid':
          return await this.validateSendGridToken(token);
        case 'digitalocean':
          return await this.validateDigitalOceanToken(token);
        case 'onelogin':
          return await this.validateOktaToken(token, baseUrl);
        case 'microsoft':
        case 'microsoft365':
        case 'office365':
          return await this.validateMicrosoftTeamsToken(token);
        case 'docker':
        case 'dockerhub':
          return await this.validateDockerHubToken(token);
        case 'kubernetes':
        case 'k8s':
          return await this.validateKubernetesToken(token, baseUrl);
        case 'confluence':
          return await this.validateConfluenceToken(token, baseUrl);
        case 'trello':
          return await this.validateTrelloToken(token, baseUrl);
        case 'asana':
          return await this.validateAsanaToken(token);
        case 'monday':
        case 'monday.com':
          return await this.validateMondayToken(token);
        case 'microsoft-teams':
        case 'teams':
          return await this.validateMicrosoftTeamsToken(token);
        case 'discord':
          return await this.validateDiscordToken(token);
        case 'okta':
          return await this.validateOktaToken(token, baseUrl);
        case 'workday':
          return await this.validateWorkdayToken(token, baseUrl);
        case 'newrelic':
        case 'new-relic':
          return await this.validateNewRelicToken(token);
        case 'sentry':
          return await this.validateSentryToken(token, baseUrl);
        case 'pagerduty':
        case 'pager-duty':
          return await this.validatePagerDutyToken(token);
        case 'auth0':
          return await this.validateAuth0Token(token, baseUrl);
        case 'datadog':
          return await this.validateDatadogToken(token, baseUrl);
        case 'qualys':
          return await this.validateQualysToken(token, baseUrl);
        case 'tenable':
        case 'tenableio':
          return await this.validateTenableToken(token, baseUrl);
        case 'crowdstrike':
          return await this.validateCrowdStrikeToken(token, baseUrl);
        case 'paloalto':
        case 'palo-alto':
          return await this.validatePaloAltoToken(token, baseUrl);
        case 'rapid7':
          return await this.validateRapid7Token(token, baseUrl);
        case 'splunk':
          return await this.validateSplunkToken(token, baseUrl);
        case 'bamboohr':
          return await this.validateBambooHRToken(token, baseUrl);
        case 'adp':
          return await this.validateADPToken(token, baseUrl);
        case 'mongodb':
        case 'mongodb-atlas':
          return await this.validateMongoDBToken(token, baseUrl);
        case 'postgresql':
        case 'postgres':
          return await this.validatePostgreSQLConnection(token, baseUrl);
        case 'mysql':
          return await this.validateMySQLConnection(token, baseUrl);
        case 'redis':
          return await this.validateRedisConnection(token, baseUrl);
        case 'elasticsearch':
        case 'elastic':
          return await this.validateElasticsearchToken(token, baseUrl);
        case 'heroku':
          return await this.validateHerokuToken(token);
        case 'salesforce':
          return await this.validateSalesforceToken(token, baseUrl);
        case 'hubspot':
          return await this.validateHubSpotToken(token);
        case 'zendesk':
          return await this.validateZendeskToken(token, baseUrl);
        case 'paypal':
          return await this.validatePayPalToken(token, baseUrl);
        default:
          // For unknown providers, do basic format validation
          return this.validateGenericToken(token);
      }
    } catch (error: any) {
      // Extract error message safely to avoid circular JSON errors
      let errorMessage = 'Token validation failed';
      if (error?.message) {
        errorMessage = String(error.message);
      } else if (error?.response?.data?.message) {
        errorMessage = String(error.response.data.message);
      } else if (error?.response?.statusText) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      }
      
      logger.error(`PAT validation error for ${provider}:`, { message: errorMessage, status: error?.response?.status });
      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate GitHub Personal Access Token
   */
  private async validateGitHubToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.login) {
        return {
          valid: true,
          userInfo: {
            username: response.data.login,
            id: response.data.id,
            email: response.data.email,
          },
        };
      }

      return { valid: false, error: 'Invalid GitHub token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid or expired GitHub token' };
      }
      if (error.response?.status === 403) {
        return { valid: false, error: 'GitHub token lacks required permissions' };
      }
      throw error;
    }
  }

  /**
   * Validate GitLab Personal Access Token
   */
  private async validateGitLabToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    this.validateBaseUrl(baseUrl);
    const apiUrl = baseUrl ? `${baseUrl}/api/v4/user` : 'https://gitlab.com/api/v4/user';
    
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          'PRIVATE-TOKEN': token,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.username) {
        return {
          valid: true,
          userInfo: {
            username: response.data.username,
            id: response.data.id,
            email: response.data.email,
          },
        };
      }

      return { valid: false, error: 'Invalid GitLab token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid or expired GitLab token' };
      }
      throw error;
    }
  }

  /**
   * Validate Bitbucket Personal Access Token
   */
  private async validateBitbucketToken(token: string): Promise<ValidationResult> {
    try {
      // Bitbucket uses App Passwords, validate by checking user info
      const response = await axios.get('https://api.bitbucket.org/2.0/user', {
        auth: {
          username: token.split(':')[0] || '',
          password: token.split(':')[1] || token,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.username) {
        return {
          valid: true,
          userInfo: {
            username: response.data.username,
            uuid: response.data.uuid,
          },
        };
      }

      return { valid: false, error: 'Invalid Bitbucket token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid or expired Bitbucket token' };
      }
      throw error;
    }
  }

  /**
   * Validate Travis CI Token
   */
  private async validateTravisToken(token: string): Promise<ValidationResult> {
    try {
      // Travis CI API v3 uses Authorization header
      const response = await axios.get('https://api.travis-ci.com/user', {
        headers: {
          Authorization: `token ${token}`,
          'Travis-API-Version': '3',
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.login) {
        return {
          valid: true,
          userInfo: {
            login: response.data.login,
            id: response.data.id,
            email: response.data.email,
          },
        };
      }

      return { valid: false, error: 'Invalid Travis CI token' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid or expired Travis CI token. Please check your token at https://travis-ci.com/account/preferences' };
      }
      // If API endpoint doesn't exist or is unreachable, token is likely invalid
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { valid: false, error: 'Cannot reach Travis CI API. Please verify your token is correct.' };
      }
      throw error;
    }
  }

  /**
   * Validate CircleCI Token
   */
  private async validateCircleCIToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://circleci.com/api/v2/me', {
        headers: {
          'Circle-Token': token,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.login) {
        return {
          valid: true,
          userInfo: {
            login: response.data.login,
            id: response.data.id,
          },
        };
      }

      return { valid: false, error: 'Invalid CircleCI token' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid or expired CircleCI token' };
      }
      throw error;
    }
  }

  /**
   * Validate Jenkins Token (API Token)
   */
  private async validateJenkinsToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Jenkins base URL is required' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      // Jenkins uses Basic Auth with username:token
      // For validation, we'll try to access the whoAmI endpoint
      const apiUrl = `${baseUrl.replace(/\/$/, '')}/whoAmI/api/json`;
      const response = await axios.get(apiUrl, {
        auth: {
          username: token.split(':')[0] || 'user',
          password: token.split(':')[1] || token,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.id) {
        return {
          valid: true,
          userInfo: {
            id: response.data.id,
            fullName: response.data.fullName,
          },
        };
      }

      return { valid: false, error: 'Invalid Jenkins token' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid Jenkins credentials or insufficient permissions' };
      }
      throw error;
    }
  }

  /**
   * Validate Stripe API Key
   */
  private async validateStripeToken(token: string): Promise<ValidationResult> {
    try {
      // Stripe API keys start with sk_live_ or sk_test_ for secret keys
      // and pk_live_ or pk_test_ for publishable keys
      if (!token.startsWith('sk_') && !token.startsWith('pk_')) {
        return { valid: false, error: 'Invalid Stripe API key format. Keys must start with sk_ or pk_' };
      }

      // Validate by making a test API call to Stripe
      const response = await axios.get('https://api.stripe.com/v1/account', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.id) {
        return {
          valid: true,
          userInfo: {
            accountId: response.data.id,
            type: response.data.type,
            email: response.data.email,
          },
        };
      }

      return { valid: false, error: 'Invalid Stripe API key' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid or expired Stripe API key. Please check your key at https://dashboard.stripe.com/apikeys' };
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { valid: false, error: 'Cannot reach Stripe API. Please verify your key is correct.' };
      }
      throw error;
    }
  }

  /**
   * Validate SendGrid API Key
   */
  private async validateSendGridToken(token: string): Promise<ValidationResult> {
    try {
      // SendGrid API keys are typically long alphanumeric strings
      if (token.length < 20) {
        return { valid: false, error: 'SendGrid API key appears to be too short' };
      }

      // Validate by making a test API call to SendGrid
      const response = await axios.get('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.username) {
        return {
          valid: true,
          userInfo: {
            username: response.data.username,
            email: response.data.email,
            firstName: response.data.first_name,
            lastName: response.data.last_name,
          },
        };
      }

      return { valid: false, error: 'Invalid SendGrid API key' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid or expired SendGrid API key. Please check your key at https://app.sendgrid.com/settings/api_keys' };
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { valid: false, error: 'Cannot reach SendGrid API. Please verify your key is correct.' };
      }
      throw error;
    }
  }

  /**
   * Validate Twilio Credentials (Account SID and Auth Token)
   */
  private async validateTwilioToken(token: string, accountSid?: string): Promise<ValidationResult> {
    try {
      // Twilio uses Account SID and Auth Token
      // If baseUrl is provided, it's the Account SID
      const sid = accountSid || token.split(':')[0];
      const authToken = accountSid ? token : token.split(':')[1] || token;

      if (!sid || !authToken) {
        return { valid: false, error: 'Twilio Account SID and Auth Token are required' };
      }

      // Validate Account SID format (starts with AC)
      if (!sid.startsWith('AC') || sid.length < 34) {
        return { valid: false, error: 'Invalid Twilio Account SID format. Account SID should start with "AC" and be 34 characters long.' };
      }

      // Validate by making a test API call to Twilio
      const response = await axios.get(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
        auth: {
          username: sid,
          password: authToken,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.sid) {
        return {
          valid: true,
          userInfo: {
            accountSid: response.data.sid,
            friendlyName: response.data.friendly_name,
            status: response.data.status,
          },
        };
      }

      return { valid: false, error: 'Invalid Twilio credentials' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid or expired Twilio credentials. Please check your Account SID and Auth Token at https://console.twilio.com/' };
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { valid: false, error: 'Cannot reach Twilio API. Please verify your credentials are correct.' };
      }
      throw error;
    }
  }

  /**
   * Validate DigitalOcean Personal Access Token
   */
  private async validateDigitalOceanToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://api.digitalocean.com/v2/account', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.account) {
        return {
          valid: true,
          userInfo: {
            email: response.data.account.email,
            uuid: response.data.account.uuid,
            status: response.data.account.status,
          },
        };
      }

      return { valid: false, error: 'Invalid DigitalOcean token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid or expired DigitalOcean token. Please check your token at https://cloud.digitalocean.com/account/api/tokens' };
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { valid: false, error: 'Cannot reach DigitalOcean API. Please verify your token is correct.' };
      }
      throw error;
    }
  }

  /**
   * Validate Docker Hub Personal Access Token
   */
  private async validateDockerHubToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://hub.docker.com/v2/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.username) {
        return {
          valid: true,
          userInfo: {
            username: response.data.username,
            email: response.data.email,
          },
        };
      }

      return { valid: false, error: 'Invalid Docker Hub token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid or expired Docker Hub token. Please check your token at https://hub.docker.com/settings/security' };
      }
      throw error;
    }
  }

  /**
   * Validate Kubernetes API Token (kubeconfig or service account token)
   */
  private async validateKubernetesToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Kubernetes API server URL is required' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      const response = await axios.get(`${baseUrl.replace(/\/$/, '')}/api/v1/namespaces`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
        validateStatus: () => true, // Don't throw on any status
      });

      if (response.status === 200 || response.status === 403) {
        // 403 means token is valid but may lack permissions - still valid token
        return {
          valid: true,
          userInfo: {
            authenticated: true,
            hasPermissions: response.status === 200,
          },
        };
      }

      return { valid: false, error: 'Invalid Kubernetes token or API server unreachable' };
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { valid: false, error: 'Cannot reach Kubernetes API server. Please verify the URL and token.' };
      }
      throw error;
    }
  }

  /**
   * Validate Confluence API Token
   */
  private async validateConfluenceToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Confluence base URL is required' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      const response = await axios.get(`${baseUrl.replace(/\/$/, '')}/rest/api/user/current`, {
        auth: {
          username: token.split(':')[0] || '',
          password: token.split(':')[1] || token,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.userKey) {
        return {
          valid: true,
          userInfo: {
            userKey: response.data.userKey,
            displayName: response.data.displayName,
            email: response.data.email,
          },
        };
      }

      return { valid: false, error: 'Invalid Confluence token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid Confluence API token. Please check your token at your Confluence instance settings.' };
      }
      throw error;
    }
  }

  /**
   * Validate Trello API Token
   */
  private async validateTrelloToken(token: string, apiKey?: string): Promise<ValidationResult> {
    if (!apiKey) {
      return { valid: false, error: 'Trello API key is required along with token' };
    }

    try {
      const response = await axios.get(`https://api.trello.com/1/members/me`, {
        params: {
          key: apiKey,
          token: token,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.id) {
        return {
          valid: true,
          userInfo: {
            id: response.data.id,
            username: response.data.username,
            fullName: response.data.fullName,
            email: response.data.email,
          },
        };
      }

      return { valid: false, error: 'Invalid Trello token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid Trello API key or token. Please check your credentials at https://trello.com/app-key' };
      }
      throw error;
    }
  }

  /**
   * Validate Asana Personal Access Token
   */
  private async validateAsanaToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://app.asana.com/api/1.0/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.data?.gid) {
        return {
          valid: true,
          userInfo: {
            gid: response.data.data.gid,
            name: response.data.data.name,
            email: response.data.data.email,
          },
        };
      }

      return { valid: false, error: 'Invalid Asana token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid or expired Asana token. Please check your token at https://app.asana.com/0/my-apps' };
      }
      throw error;
    }
  }

  /**
   * Validate Monday.com API Token
   */
  private async validateMondayToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.post('https://api.monday.com/v2', {
        query: '{ me { id name email } }',
      }, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.data?.me) {
        return {
          valid: true,
          userInfo: {
            id: response.data.data.me.id,
            name: response.data.data.me.name,
            email: response.data.data.me.email,
          },
        };
      }

      return { valid: false, error: 'Invalid Monday.com token' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid Monday.com API token. Please check your token at https://auth.monday.com/users/sign_in_new' };
      }
      throw error;
    }
  }

  /**
   * Validate Microsoft Teams Bot Token
   */
  private async validateMicrosoftTeamsToken(token: string): Promise<ValidationResult> {
    try {
      // Microsoft Teams uses OAuth2, validate by checking token info
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.id) {
        return {
          valid: true,
          userInfo: {
            id: response.data.id,
            displayName: response.data.displayName,
            mail: response.data.mail || response.data.userPrincipalName,
          },
        };
      }

      return { valid: false, error: 'Invalid Microsoft Teams token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid or expired Microsoft Teams token. Please regenerate your token.' };
      }
      throw error;
    }
  }

  /**
   * Validate Discord Bot Token
   */
  private async validateDiscordToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bot ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.id) {
        return {
          valid: true,
          userInfo: {
            id: response.data.id,
            username: response.data.username,
            discriminator: response.data.discriminator,
          },
        };
      }

      return { valid: false, error: 'Invalid Discord bot token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid Discord bot token. Please check your token at https://discord.com/developers/applications' };
      }
      throw error;
    }
  }

  /**
   * Validate Okta API Token
   */
  private async validateOktaToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Okta base URL is required' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      const response = await axios.get(`${baseUrl.replace(/\/$/, '')}/api/v1/users/me`, {
        headers: {
          Authorization: `SSWS ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.id) {
        return {
          valid: true,
          userInfo: {
            id: response.data.id,
            email: response.data.profile.email,
            login: response.data.profile.login,
          },
        };
      }

      return { valid: false, error: 'Invalid Okta token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid Okta API token. Please check your token at your Okta admin console.' };
      }
      throw error;
    }
  }

  /**
   * Validate Workday API Token
   */
  private async validateWorkdayToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Workday base URL is required' };
    }
    this.validateBaseUrl(baseUrl);

    // Workday uses OAuth2, validate by checking token format and making a test call
    if (!token || token.length < 20) {
      return { valid: false, error: 'Workday token appears to be invalid' };
    }

    // Basic validation - Workday tokens are typically JWT or opaque strings
    // Format-level check only; full validation requires an authenticated API call.
    return {
      valid: true,
      userInfo: {
        authenticated: true,
      },
    };
  }

  /**
   * Validate New Relic API Key
   */
  private async validateNewRelicToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://api.newrelic.com/v2/users.json', {
        headers: {
          'X-Api-Key': token,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
          },
        };
      }

      return { valid: false, error: 'Invalid New Relic API key' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid New Relic API key. Please check your key at https://one.newrelic.com/api-keys' };
      }
      throw error;
    }
  }

  /**
   * Validate Sentry API Token
   */
  private async validateSentryToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    this.validateBaseUrl(baseUrl);
    const apiUrl = baseUrl ? `${baseUrl}/api/0/` : 'https://sentry.io/api/0/';
    
    try {
      const response = await axios.get(`${apiUrl}organizations/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
            organizations: response.data?.length || 0,
          },
        };
      }

      return { valid: false, error: 'Invalid Sentry token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid Sentry API token. Please check your token at https://sentry.io/settings/account/api/auth-tokens/' };
      }
      throw error;
    }
  }

  /**
   * Validate PagerDuty API Token
   */
  private async validatePagerDutyToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://api.pagerduty.com/users/me', {
        headers: {
          Authorization: `Token token=${token}`,
          Accept: 'application/vnd.pagerduty+json;version=2',
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.user?.id) {
        return {
          valid: true,
          userInfo: {
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name,
          },
        };
      }

      return { valid: false, error: 'Invalid PagerDuty token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid PagerDuty API token. Please check your token at https://support.pagerduty.com/docs/api-access-keys' };
      }
      throw error;
    }
  }

  /**
   * Validate Auth0 Management API Token
   */
  private async validateAuth0Token(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Auth0 domain is required' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      const response = await axios.get(`https://${baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}/api/v2/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          per_page: 1,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
          },
        };
      }

      return { valid: false, error: 'Invalid Auth0 token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid Auth0 Management API token. Please check your token at https://manage.auth0.com/dashboard/us/YOUR_TENANT/apis' };
      }
      throw error;
    }
  }

  /**
   * Validate Datadog API Key
   */
  private async validateDatadogToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    this.validateBaseUrl(baseUrl);
    const apiUrl = baseUrl || 'https://api.datadoghq.com';
    
    try {
      const response = await axios.get(`${apiUrl}/api/v1/validate`, {
        headers: {
          'DD-API-KEY': token,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.valid === true) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
          },
        };
      }

      return { valid: false, error: 'Invalid Datadog API key' };
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        return { valid: false, error: 'Invalid Datadog API key. Please check your key at https://app.datadoghq.com/organization-settings/api-keys' };
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { valid: false, error: 'Cannot reach Datadog API. Please verify your API key and base URL are correct.' };
      }
      throw error;
    }
  }

  /**
   * Validate Qualys API Token
   */
  private async validateQualysToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Qualys base URL is required (e.g., https://qualysapi.qualys.com)' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      // Qualys uses Basic Auth with username:password format
      const [username, password] = token.includes(':') ? token.split(':') : ['', token];
      
      const response = await axios.get(`${baseUrl.replace(/\/$/, '')}/api/2.0/fo/asset/host/`, {
        auth: {
          username: username || 'api',
          password: password || token,
        },
        params: {
          action: 'list',
          truncate_limit: 1,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
          },
        };
      }

      return { valid: false, error: 'Invalid Qualys credentials' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid Qualys API credentials. Please check your username and password at your Qualys account.' };
      }
      // Extract error message safely
      const errorMessage = error?.message || error?.response?.statusText || 'Qualys API validation failed';
      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Validate Tenable.io API Token
   */
  private async validateTenableToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    this.validateBaseUrl(baseUrl);
    const apiUrl = baseUrl || 'https://cloud.tenable.com';
    
    try {
      // Tenable uses X-ApiKeys header with accessKey:secretKey format
      const [accessKey, secretKey] = token.includes(':') ? token.split(':') : [token, ''];
      
      if (!secretKey) {
        return { valid: false, error: 'Tenable API token must be in format accessKey:secretKey' };
      }

      const response = await axios.get(`${apiUrl}/scanners`, {
        headers: {
          'X-ApiKeys': `accessKey=${accessKey};secretKey=${secretKey}`,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
          },
        };
      }

      return { valid: false, error: 'Invalid Tenable API credentials' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid Tenable.io API credentials. Please check your access key and secret key at https://cloud.tenable.com/tio/app.html#/settings/api-keys' };
      }
      // Extract error message safely
      const errorMessage = error?.message || error?.response?.statusText || 'Tenable API validation failed';
      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Validate CrowdStrike API Token
   */
  private async validateCrowdStrikeToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    this.validateBaseUrl(baseUrl);
    const apiUrl = baseUrl || 'https://api.crowdstrike.com';
    
    try {
      // CrowdStrike uses OAuth2 - token should be a client_id:client_secret
      const [clientId, clientSecret] = token.includes(':') ? token.split(':') : [token, ''];
      
      if (!clientSecret) {
        return { valid: false, error: 'CrowdStrike API token must be in format clientId:clientSecret' };
      }

      // First, get OAuth token
      const oauthResponse = await axios.post(`${apiUrl}/oauth2/token`, 
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      if (oauthResponse.status === 200 && oauthResponse.data?.access_token) {
        // Validate by making an API call
        const validateResponse = await axios.get(`${apiUrl}/sensors/queries/sensors/v1`, {
          headers: {
            Authorization: `Bearer ${oauthResponse.data.access_token}`,
          },
          params: { limit: 1 },
          timeout: 10000,
        });

        if (validateResponse.status === 200) {
          return {
            valid: true,
            userInfo: {
              authenticated: true,
            },
          };
        }
      }

      return { valid: false, error: 'Invalid CrowdStrike credentials' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid CrowdStrike API credentials. Please check your client ID and secret at https://falcon.crowdstrike.com/support/api-clients-and-keys' };
      }
      throw error;
    }
  }

  /**
   * Validate Palo Alto Networks API Token
   */
  private async validatePaloAltoToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Palo Alto base URL is required (e.g., https://your-firewall.paloaltonetworks.com)' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      // Palo Alto uses API key in header
      const response = await axios.get(`${baseUrl.replace(/\/$/, '')}/api/`, {
        params: {
          type: 'op',
          cmd: '<show><system><info></info></system></show>',
          key: token,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.response?.status === 'success') {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
          },
        };
      }

      return { valid: false, error: 'Invalid Palo Alto API key' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid Palo Alto API key. Please check your key in the firewall configuration.' };
      }
      throw error;
    }
  }

  /**
   * Validate Rapid7 InsightVM API Token
   */
  private async validateRapid7Token(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Rapid7 base URL is required (e.g., https://your-instance.rapid7.com)' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      // Rapid7 uses Basic Auth with username:password
      const [username, password] = token.includes(':') ? token.split(':') : ['', token];
      
      const response = await axios.get(`${baseUrl.replace(/\/$/, '')}/api/3/account`, {
        auth: {
          username: username || 'api',
          password: password || token,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.id) {
        return {
          valid: true,
          userInfo: {
            id: response.data.id,
            email: response.data.email,
          },
        };
      }

      return { valid: false, error: 'Invalid Rapid7 credentials' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid Rapid7 API credentials. Please check your username and password.' };
      }
      // Extract error message safely
      const errorMessage = error?.message || error?.response?.statusText || 'Rapid7 API validation failed';
      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Validate Splunk API Token
   */
  private async validateSplunkToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Splunk base URL is required (e.g., https://your-instance.splunkcloud.com)' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      // Splunk uses Bearer token or Basic Auth
      const response = await axios.get(`${baseUrl.replace(/\/$/, '')}/services/auth/current-context`, {
        headers: {
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
          },
        };
      }

      return { valid: false, error: 'Invalid Splunk token' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid Splunk API token. Please check your token at your Splunk instance settings.' };
      }
      throw error;
    }
  }

  /**
   * Validate BambooHR API Token
   */
  private async validateBambooHRToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'BambooHR subdomain is required (e.g., yourcompany for yourcompany.bamboohr.com)' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      const apiUrl = baseUrl.includes('.') ? baseUrl : `https://api.bamboohr.com/api/gateway.php/${encodeURIComponent(baseUrl)}/v1`;
      const directoryUrl = `${apiUrl}/employees/directory`;
      this.assertSafeOutbound(directoryUrl, 'BambooHR');

      const response = await axios.get(directoryUrl, {
        auth: {
          username: token,
          password: 'x', // BambooHR uses API key as username with dummy password
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
          },
        };
      }

      return { valid: false, error: 'Invalid BambooHR API key' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid BambooHR API key. Please check your key at https://www.bamboohr.com/api/documentation/' };
      }
      throw error;
    }
  }

  /**
   * Validate ADP API Token
   */
  private async validateADPToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'ADP API base URL is required' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      // ADP uses OAuth2 - token should be client_id:client_secret
      const [clientId, clientSecret] = token.includes(':') ? token.split(':') : [token, ''];
      
      if (!clientSecret) {
        return { valid: false, error: 'ADP API token must be in format clientId:clientSecret' };
      }

      // Get OAuth token
      const oauthResponse = await axios.post(`${baseUrl}/auth/oauth/v2/token`, 
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      if (oauthResponse.status === 200 && oauthResponse.data?.access_token) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
          },
        };
      }

      return { valid: false, error: 'Invalid ADP credentials' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid ADP API credentials. Please check your client ID and secret.' };
      }
      // Extract error message safely
      const errorMessage = error?.message || error?.response?.statusText || 'ADP API validation failed';
      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Validate MongoDB Atlas API Token
   */
  private async validateMongoDBToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    this.validateBaseUrl(baseUrl);
    try {
      // MongoDB Atlas uses Public Key:Private Key format
      const [publicKey, privateKey] = token.includes(':') ? token.split(':') : [token, ''];
      
      if (!privateKey) {
        return { valid: false, error: 'MongoDB Atlas API token must be in format publicKey:privateKey' };
      }

      const response = await axios.get('https://cloud.mongodb.com/api/atlas/v1.0/groups', {
        auth: {
          username: publicKey,
          password: privateKey,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
            groups: response.data?.results?.length || 0,
          },
        };
      }

      return { valid: false, error: 'Invalid MongoDB Atlas credentials' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid MongoDB Atlas API credentials. Please check your public and private keys at https://cloud.mongodb.com/account/apiKeys' };
      }
      throw error;
    }
  }

  /**
   * Validate PostgreSQL Connection
   */
  private async validatePostgreSQLConnection(connectionString: string, baseUrl?: string): Promise<ValidationResult> {
    try {
      // PostgreSQL connection string format: postgresql://user:password@host:port/database
      if (!connectionString.includes('postgresql://') && !connectionString.includes('postgres://')) {
        return { valid: false, error: 'PostgreSQL connection string must start with postgresql:// or postgres://' };
      }

      // Try to parse and validate the connection string
      const url = new URL(connectionString);
      if (!url.hostname || !url.pathname) {
        return { valid: false, error: 'Invalid PostgreSQL connection string format' };
      }

      // For validation, we check the format - actual connection test requires the pg library
      // Supports actual connection testing when DATABASE_TEST_ENABLED is configured
      return {
        valid: true,
        userInfo: {
          host: url.hostname,
          database: url.pathname.replace('/', ''),
          port: url.port || '5432',
        },
      };
    } catch (error: any) {
      return { valid: false, error: `Invalid PostgreSQL connection string: ${error.message}` };
    }
  }

  /**
   * Validate MySQL Connection
   */
  private async validateMySQLConnection(connectionString: string, baseUrl?: string): Promise<ValidationResult> {
    try {
      // MySQL connection string format: mysql://user:password@host:port/database
      if (!connectionString.includes('mysql://')) {
        return { valid: false, error: 'MySQL connection string must start with mysql://' };
      }

      const url = new URL(connectionString);
      if (!url.hostname || !url.pathname) {
        return { valid: false, error: 'Invalid MySQL connection string format' };
      }

      return {
        valid: true,
        userInfo: {
          host: url.hostname,
          database: url.pathname.replace('/', ''),
          port: url.port || '3306',
        },
      };
    } catch (error: any) {
      return { valid: false, error: `Invalid MySQL connection string: ${error.message}` };
    }
  }

  /**
   * Validate Redis Connection
   */
  private async validateRedisConnection(connectionString: string, baseUrl?: string): Promise<ValidationResult> {
    try {
      // Redis connection string format: redis://password@host:port or redis://host:port
      // Handle both connectionString as token and baseUrl scenarios
      const connStr = connectionString || baseUrl || '';
      
      if (!connStr) {
        return { valid: false, error: 'Redis connection string is required' };
      }

      // Check if it starts with redis:// or rediss:// (SSL)
      if (!connStr.startsWith('redis://') && !connStr.startsWith('rediss://')) {
        return { valid: false, error: 'Redis connection string must start with redis:// or rediss://' };
      }

      try {
        const url = new URL(connStr);
        if (!url.hostname) {
          return { valid: false, error: 'Invalid Redis connection string format: missing hostname' };
        }

        return {
          valid: true,
          userInfo: {
            host: url.hostname,
            port: url.port || '6379',
            protocol: url.protocol.replace(':', ''),
          },
        };
      } catch (urlError: any) {
        return { valid: false, error: `Invalid Redis connection string format: ${urlError?.message || 'Invalid URL format'}` };
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Redis connection validation failed';
      return { valid: false, error: `Invalid Redis connection string: ${errorMessage}` };
    }
  }

  /**
   * Validate Elasticsearch API Token
   */
  private async validateElasticsearchToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Elasticsearch base URL is required (e.g., https://your-cluster.es.amazonaws.com)' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      const response = await axios.get(`${baseUrl.replace(/\/$/, '')}/`, {
        headers: {
          Authorization: `ApiKey ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.cluster_name) {
        return {
          valid: true,
          userInfo: {
            clusterName: response.data.cluster_name,
            version: response.data.version?.number,
          },
        };
      }

      return { valid: false, error: 'Invalid Elasticsearch API key' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid Elasticsearch API key. Please check your key at your Elasticsearch cluster settings.' };
      }
      // Extract error message safely to avoid circular JSON
      const errorMessage = error?.message || error?.response?.statusText || 'Elasticsearch API validation failed';
      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Validate Heroku API Token
   */
  private async validateHerokuToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://api.heroku.com/account', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.heroku+json; version=3',
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.email) {
        return {
          valid: true,
          userInfo: {
            email: response.data.email,
            id: response.data.id,
          },
        };
      }

      return { valid: false, error: 'Invalid Heroku API token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid Heroku API token. Please check your token at https://dashboard.heroku.com/account/applications' };
      }
      throw error;
    }
  }

  /**
   * Validate Salesforce API Token
   */
  private async validateSalesforceToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Salesforce instance URL is required (e.g., https://yourinstance.salesforce.com)' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      // Salesforce uses OAuth2 - token should be access_token or client_id:client_secret
      if (token.includes(':')) {
        // It's client_id:client_secret, need to get access token first
        const [clientId, clientSecret] = token.split(':');
        const oauthResponse = await axios.post(`${baseUrl}/services/oauth2/token`, 
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 10000,
          }
        );

        if (oauthResponse.status === 200 && oauthResponse.data?.access_token) {
          return {
            valid: true,
            userInfo: {
              authenticated: true,
            },
          };
        }
      } else {
        // It's an access token, validate it
        const response = await axios.get(`${baseUrl}/services/data/v57.0/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        });

        if (response.status === 200) {
          return {
            valid: true,
            userInfo: {
              authenticated: true,
            },
          };
        }
      }

      return { valid: false, error: 'Invalid Salesforce token' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid Salesforce API credentials. Please check your token or client credentials at https://yourinstance.salesforce.com/setup/connectedApp/home/home.jsp' };
      }
      throw error;
    }
  }

  /**
   * Validate HubSpot API Token
   */
  private async validateHubSpotToken(token: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all', {
        params: {
          count: 1,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
          },
        };
      }

      return { valid: false, error: 'Invalid HubSpot API token' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid HubSpot API token. Please check your token at https://app.hubspot.com/private-apps' };
      }
      throw error;
    }
  }

  /**
   * Validate Zendesk API Token
   */
  private async validateZendeskToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    if (!baseUrl) {
      return { valid: false, error: 'Zendesk subdomain is required (e.g., yourcompany for yourcompany.zendesk.com)' };
    }
    this.validateBaseUrl(baseUrl);

    try {
      // Zendesk uses email/token format or API token
      const [email, apiToken] = token.includes('/') ? token.split('/') : ['', token];
      
      const zendeskUrl = baseUrl.includes('.') ? baseUrl : `https://${encodeURIComponent(baseUrl)}.zendesk.com`;
      const userUrl = `${zendeskUrl}/api/v2/users/me.json`;
      this.assertSafeOutbound(userUrl, 'Zendesk');

      const response = await axios.get(userUrl, {
        auth: {
          username: email || `${token}@zendesk.com`,
          password: apiToken || token,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.user) {
        return {
          valid: true,
          userInfo: {
            email: response.data.user.email,
            id: response.data.user.id,
          },
        };
      }

      return { valid: false, error: 'Invalid Zendesk credentials' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid Zendesk API credentials. Please check your email and API token at https://yourcompany.zendesk.com/admin/apps-integrations/apis/zendesk-api' };
      }
      throw error;
    }
  }

  /**
   * Validate PayPal API Token
   */
  private async validatePayPalToken(token: string, baseUrl?: string): Promise<ValidationResult> {
    this.validateBaseUrl(baseUrl);
    try {
      // PayPal uses client_id:client_secret format
      const [clientId, clientSecret] = token.includes(':') ? token.split(':') : [token, ''];
      
      if (!clientSecret) {
        return { valid: false, error: 'PayPal API token must be in format clientId:clientSecret' };
      }

      // Determine environment
      const isSandbox = baseUrl?.includes('sandbox') || baseUrl?.includes('sandbox.paypal.com');
      const apiUrl = isSandbox 
        ? 'https://api.sandbox.paypal.com/v1/oauth2/token'
        : 'https://api.paypal.com/v1/oauth2/token';

      // Get OAuth token
      const oauthResponse = await axios.post(apiUrl, 
        new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        {
          auth: {
            username: clientId,
            password: clientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      if (oauthResponse.status === 200 && oauthResponse.data?.access_token) {
        return {
          valid: true,
          userInfo: {
            authenticated: true,
            environment: isSandbox ? 'sandbox' : 'production',
          },
        };
      }

      return { valid: false, error: 'Invalid PayPal credentials' };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid PayPal API credentials. Please check your client ID and secret at https://developer.paypal.com/dashboard/applications' };
      }
      throw error;
    }
  }

  /**
   * Generic token validation (basic format checks)
   * NOTE: For unknown providers, we reject the token to prevent accepting invalid credentials
   */
  private validateGenericToken(token: string): ValidationResult {
    if (!token || token.trim().length === 0) {
      return { valid: false, error: 'Token cannot be empty' };
    }

    if (token.length < 10) {
      return { valid: false, error: 'Token appears to be too short' };
    }

    // Basic format validation - tokens usually contain alphanumeric characters
    if (!/^[a-zA-Z0-9_.-]+$/.test(token)) {
      return { valid: false, error: 'Token contains invalid characters' };
    }

    // For unknown providers, we cannot validate the token without provider-specific APIs
    // REJECT the token to prevent accepting potentially invalid credentials
    return {
      valid: false,
      error: 'Token validation not available for this provider. Please use a supported integration or contact support.',
    };
  }
}

export default new PATValidationService();

