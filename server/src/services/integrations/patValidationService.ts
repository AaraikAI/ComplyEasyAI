/**
 * PAT (Personal Access Token) Validation Service
 * Validates tokens for various integrations before allowing connection
 */

import axios from 'axios';
import logger from '../../config/logger';

interface ValidationResult {
  valid: boolean;
  error?: string;
  userInfo?: any;
}

class PATValidationService {
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
        default:
          // For unknown providers, do basic format validation
          return this.validateGenericToken(token);
      }
    } catch (error: any) {
      logger.error(`PAT validation error for ${provider}:`, error);
      return {
        valid: false,
        error: error.message || 'Token validation failed',
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
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(token)) {
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

