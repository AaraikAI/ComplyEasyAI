/**
 * PAT Validation Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ---------- Mocks ----------
const mockAxiosGet = jest.fn() as jest.Mock<any>;
const mockAxiosPost = jest.fn() as jest.Mock<any>;

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: mockAxiosGet,
    post: mockAxiosPost,
  },
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// ---------- Import after mocks ----------
import patValidationService from '../../../../services/integrations/patValidationService';

describe('PATValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------
  // GitHub
  // -------------------------------------------------------------------
  describe('validateToken() - GitHub', () => {
    it('should validate a valid GitHub token', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { login: 'octocat', id: 1, email: 'octocat@github.com' },
      });

      const result = await patValidationService.validateToken('github', 'ghp_testtoken123');
      expect(result.valid).toBe(true);
      expect(result.userInfo?.username).toBe('octocat');
    });

    it('should return invalid for 401 response', async () => {
      const error: any = new Error('Unauthorized');
      error.response = { status: 401 };
      mockAxiosGet.mockRejectedValue(error);

      const result = await patValidationService.validateToken('github', 'bad-token');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid or expired GitHub token');
    });

    it('should return invalid for 403 response', async () => {
      const error: any = new Error('Forbidden');
      error.response = { status: 403 };
      mockAxiosGet.mockRejectedValue(error);

      const result = await patValidationService.validateToken('github', 'limited-token');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lacks required permissions');
    });
  });

  // -------------------------------------------------------------------
  // GitLab
  // -------------------------------------------------------------------
  describe('validateToken() - GitLab', () => {
    it('should validate a valid GitLab token', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { username: 'gitlabuser', id: 2, email: 'user@gitlab.com' },
      });

      const result = await patValidationService.validateToken('gitlab', 'glpat_testtoken');
      expect(result.valid).toBe(true);
      expect(result.userInfo?.username).toBe('gitlabuser');
    });

    it('should use custom base URL when provided', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { username: 'selfhosted', id: 3 },
      });

      await patValidationService.validateToken('gitlab', 'token', 'https://git.mycompany.com');
      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://git.mycompany.com/api/v4/user',
        expect.any(Object),
      );
    });
  });

  // -------------------------------------------------------------------
  // Bitbucket
  // -------------------------------------------------------------------
  describe('validateToken() - Bitbucket', () => {
    it('should validate a valid Bitbucket token', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { username: 'bbuser', uuid: '{uuid}' },
      });

      const result = await patValidationService.validateToken('bitbucket', 'user:app_password');
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // Stripe
  // -------------------------------------------------------------------
  describe('validateToken() - Stripe', () => {
    it('should reject tokens not starting with sk_ or pk_', async () => {
      const result = await patValidationService.validateToken('stripe', 'invalid_key');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid Stripe API key format');
    });

    it('should validate a valid Stripe key', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { id: 'acct_123', type: 'standard', email: 'test@stripe.com' },
      });

      const result = await patValidationService.validateToken('stripe', 'sk_test_abcdefgh');
      expect(result.valid).toBe(true);
      expect(result.userInfo?.accountId).toBe('acct_123');
    });
  });

  // -------------------------------------------------------------------
  // Jenkins
  // -------------------------------------------------------------------
  describe('validateToken() - Jenkins', () => {
    it('should require base URL', async () => {
      const result = await patValidationService.validateToken('jenkins', 'user:token');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Jenkins base URL is required');
    });

    it('should validate with base URL', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { id: 'admin', fullName: 'Admin User' },
      });

      const result = await patValidationService.validateToken(
        'jenkins',
        'admin:token',
        'https://jenkins.example.com',
      );
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // CircleCI
  // -------------------------------------------------------------------
  describe('validateToken() - CircleCI', () => {
    it('should validate a valid CircleCI token', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { login: 'circleuser', id: '123' },
      });

      const result = await patValidationService.validateToken('circleci', 'circle-token');
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // Travis CI
  // -------------------------------------------------------------------
  describe('validateToken() - Travis CI', () => {
    it('should validate a valid Travis CI token', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { login: 'travisuser', id: 10, email: 't@test.com' },
      });

      const result = await patValidationService.validateToken('travis', 'travis-token');
      expect(result.valid).toBe(true);
      expect(result.userInfo?.login).toBe('travisuser');
    });

    it('should handle ENOTFOUND errors', async () => {
      const error: any = new Error('ENOTFOUND');
      error.code = 'ENOTFOUND';
      mockAxiosGet.mockRejectedValue(error);

      const result = await patValidationService.validateToken('travis-ci', 'bad-token');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot reach Travis CI API');
    });
  });

  // -------------------------------------------------------------------
  // SendGrid
  // -------------------------------------------------------------------
  describe('validateToken() - SendGrid', () => {
    it('should reject short tokens', async () => {
      const result = await patValidationService.validateToken('sendgrid', 'short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too short');
    });

    it('should validate a valid SendGrid key', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { username: 'sguser', email: 'sg@test.com' },
      });

      const result = await patValidationService.validateToken(
        'sendgrid',
        'SG.a_very_long_sendgrid_api_key_here',
      );
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // DigitalOcean
  // -------------------------------------------------------------------
  describe('validateToken() - DigitalOcean', () => {
    it('should validate a valid DO token', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { account: { email: 'do@test.com', uuid: 'uuid-123', status: 'active' } },
      });

      const result = await patValidationService.validateToken('digitalocean', 'do-token');
      expect(result.valid).toBe(true);
      expect(result.userInfo?.email).toBe('do@test.com');
    });
  });

  // -------------------------------------------------------------------
  // Docker Hub
  // -------------------------------------------------------------------
  describe('validateToken() - Docker Hub', () => {
    it('should validate a valid Docker Hub token', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { username: 'dockeruser', email: 'docker@test.com' },
      });

      const result = await patValidationService.validateToken('docker', 'docker-token');
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // Kubernetes
  // -------------------------------------------------------------------
  describe('validateToken() - Kubernetes', () => {
    it('should require base URL', async () => {
      const result = await patValidationService.validateToken('kubernetes', 'token');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Kubernetes API server URL is required');
    });

    it('should accept 403 as valid (token works but lacks permissions)', async () => {
      mockAxiosGet.mockResolvedValue({ status: 403 });

      const result = await patValidationService.validateToken(
        'k8s',
        'token',
        'https://k8s.example.com',
      );
      expect(result.valid).toBe(true);
      expect(result.userInfo?.hasPermissions).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // Okta
  // -------------------------------------------------------------------
  describe('validateToken() - Okta', () => {
    it('should require base URL', async () => {
      const result = await patValidationService.validateToken('okta', 'token');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('base URL is required');
    });

    it('should validate a valid Okta token', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: {
          id: 'okta-user-1',
          profile: { email: 'user@okta.com', login: 'user@okta.com' },
        },
      });

      const result = await patValidationService.validateToken(
        'okta',
        'okta-token',
        'https://dev-123.okta.com',
      );
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // Microsoft Teams / Microsoft
  // -------------------------------------------------------------------
  describe('validateToken() - Microsoft Teams', () => {
    it('should validate via Graph API', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { id: 'ms-1', displayName: 'MS User', mail: 'ms@test.com' },
      });

      const result = await patValidationService.validateToken('microsoft-teams', 'ms-token');
      expect(result.valid).toBe(true);
    });

    it('should also work with "microsoft" provider alias', async () => {
      mockAxiosGet.mockResolvedValue({
        status: 200,
        data: { id: 'ms-2', displayName: 'User' },
      });

      const result = await patValidationService.validateToken('microsoft', 'ms-token');
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // PostgreSQL
  // -------------------------------------------------------------------
  describe('validateToken() - PostgreSQL', () => {
    it('should reject non-postgres connection strings', async () => {
      const result = await patValidationService.validateToken('postgresql', 'invalid-string');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must start with postgresql://');
    });

    it('should validate a valid PostgreSQL connection string', async () => {
      const result = await patValidationService.validateToken(
        'postgres',
        'postgresql://user:pass@localhost:5432/mydb',
      );
      expect(result.valid).toBe(true);
      expect(result.userInfo?.host).toBe('localhost');
      expect(result.userInfo?.database).toBe('mydb');
    });
  });

  // -------------------------------------------------------------------
  // MySQL
  // -------------------------------------------------------------------
  describe('validateToken() - MySQL', () => {
    it('should reject non-mysql connection strings', async () => {
      const result = await patValidationService.validateToken('mysql', 'invalid');
      expect(result.valid).toBe(false);
    });

    it('should validate a valid MySQL connection string', async () => {
      const result = await patValidationService.validateToken(
        'mysql',
        'mysql://user:pass@host:3306/db',
      );
      expect(result.valid).toBe(true);
      expect(result.userInfo?.host).toBe('host');
    });
  });

  // -------------------------------------------------------------------
  // Redis
  // -------------------------------------------------------------------
  describe('validateToken() - Redis', () => {
    it('should reject non-redis connection strings', async () => {
      const result = await patValidationService.validateToken('redis', 'invalid');
      expect(result.valid).toBe(false);
    });

    it('should validate a valid Redis connection string', async () => {
      const result = await patValidationService.validateToken(
        'redis',
        'redis://password@host:6379',
      );
      expect(result.valid).toBe(true);
      expect(result.userInfo?.host).toBe('host');
    });
  });

  // -------------------------------------------------------------------
  // Workday
  // -------------------------------------------------------------------
  describe('validateToken() - Workday', () => {
    it('should require base URL', async () => {
      const result = await patValidationService.validateToken('workday', 'token');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Workday base URL is required');
    });

    it('should reject short tokens', async () => {
      const result = await patValidationService.validateToken(
        'workday',
        'short',
        'https://wd.example.com',
      );
      expect(result.valid).toBe(false);
    });

    it('should accept valid workday token', async () => {
      const result = await patValidationService.validateToken(
        'workday',
        'a_valid_workday_token_at_least_20_chars',
        'https://wd.example.com',
      );
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // Tenable
  // -------------------------------------------------------------------
  describe('validateToken() - Tenable', () => {
    it('should require accessKey:secretKey format', async () => {
      const result = await patValidationService.validateToken('tenable', 'only-access-key');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('accessKey:secretKey');
    });

    it('should validate with correct format', async () => {
      mockAxiosGet.mockResolvedValue({ status: 200 });
      const result = await patValidationService.validateToken('tenableio', 'accessKey:secretKey');
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // CrowdStrike
  // -------------------------------------------------------------------
  describe('validateToken() - CrowdStrike', () => {
    it('should require clientId:clientSecret format', async () => {
      const result = await patValidationService.validateToken('crowdstrike', 'only-client-id');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('clientId:clientSecret');
    });

    it('should validate by getting OAuth token', async () => {
      mockAxiosPost.mockResolvedValue({
        status: 200,
        data: { access_token: 'bearer-token' },
      });
      mockAxiosGet.mockResolvedValue({ status: 200 });

      const result = await patValidationService.validateToken(
        'crowdstrike',
        'clientId:clientSecret',
      );
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // Generic / Unknown provider
  // -------------------------------------------------------------------
  describe('validateToken() - Generic / Unknown provider', () => {
    it('should reject empty tokens', async () => {
      const result = await patValidationService.validateToken('unknown_provider', '');
      expect(result.valid).toBe(false);
    });

    it('should reject short tokens', async () => {
      const result = await patValidationService.validateToken('unknown_provider', 'short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too short');
    });

    it('should reject tokens with invalid characters', async () => {
      const result = await patValidationService.validateToken(
        'unknown_provider',
        'token with spaces!!',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject valid-looking tokens from unknown providers', async () => {
      const result = await patValidationService.validateToken(
        'unknown_provider',
        'abcdefghij1234567890',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not available for this provider');
    });
  });

  // -------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------
  describe('error handling', () => {
    it('should return valid: false for unexpected errors', async () => {
      mockAxiosGet.mockRejectedValue(new Error('Unexpected error'));

      const result = await patValidationService.validateToken('github', 'token');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unexpected error');
    });

    it('should extract error message from response data', async () => {
      const error: any = new Error();
      error.message = '';
      error.response = { data: { message: 'Rate limited' }, status: 429, statusText: 'Too Many Requests' };
      mockAxiosGet.mockRejectedValue(error);

      const result = await patValidationService.validateToken('github', 'token');
      expect(result.valid).toBe(false);
    });
  });
});
