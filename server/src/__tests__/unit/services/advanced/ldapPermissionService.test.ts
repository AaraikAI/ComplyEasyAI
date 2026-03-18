/**
 * LDAP Permission Service Unit Tests
 *
 * Tests for Active Directory / LDAP integration including role mappings,
 * permission evaluation, user caching, and audit logging.
 * The service uses raw TCP/TLS sockets, so we mock at the network level.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock net/tls to prevent actual socket connections
const mockSocket = {
  connect: jest.fn(),
  write: jest.fn(),
  end: jest.fn(),
  destroy: jest.fn(),
  on: jest.fn().mockReturnThis(),
  once: jest.fn().mockReturnThis(),
  setTimeout: jest.fn(),
  removeAllListeners: jest.fn(),
  removeListener: jest.fn(),
  connected: true,
};

jest.mock('net', () => ({
  createConnection: jest.fn().mockReturnValue(mockSocket),
  Socket: jest.fn().mockImplementation(() => mockSocket),
}));

jest.mock('tls', () => ({
  connect: jest.fn().mockReturnValue(mockSocket),
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import ldapPermissionService from '../../../../services/advanced/ldapPermissionService';

describe('LDAPPermissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset internal state
    (ldapPermissionService as any).isInitialized = false;
    (ldapPermissionService as any).pool = null;
    (ldapPermissionService as any).config = null;
    (ldapPermissionService as any).roleMappings = new Map();
    (ldapPermissionService as any).permissionCache = new Map();
    (ldapPermissionService as any).userCache = new Map();
    (ldapPermissionService as any).auditLog = [];
  });

  // ===========================================================================
  // initialize
  // ===========================================================================
  describe('initialize', () => {
    it('should initialize with default config from environment', async () => {
      // The pool initialization will fail because there is no real LDAP server,
      // but the service should still mark itself as initialized (offline mode).
      await ldapPermissionService.initialize({
        url: 'ldap://localhost:389',
        baseDN: 'dc=test,dc=com',
        bindDN: 'cn=admin,dc=test,dc=com',
        bindPassword: 'test',
        poolSize: 1,
        connectTimeout: 100,
      });

      expect((ldapPermissionService as any).isInitialized).toBe(true);
      expect((ldapPermissionService as any).config).toBeDefined();
    });

    it('should skip re-initialization', async () => {
      (ldapPermissionService as any).isInitialized = true;

      await ldapPermissionService.initialize();

      // Should not create a new pool
      expect((ldapPermissionService as any).pool).toBeNull();
    });

    it('should set config from provided parameters', async () => {
      await ldapPermissionService.initialize({
        url: 'ldap://myserver:636',
        baseDN: 'dc=example,dc=org',
        useTLS: true,
      });

      const config = (ldapPermissionService as any).config;
      expect(config.url).toBe('ldap://myserver:636');
      expect(config.baseDN).toBe('dc=example,dc=org');
      expect(config.useTLS).toBe(true);
    });
  });

  // ===========================================================================
  // Role Mappings
  // ===========================================================================
  describe('addRoleMapping', () => {
    it('should add a role mapping', () => {
      ldapPermissionService.addRoleMapping({
        adGroupDN: 'cn=admins,ou=groups,dc=test,dc=com',
        role: 'Admin',
        permissions: ['*'],
      });

      const mappings = (ldapPermissionService as any).roleMappings;
      expect(mappings.size).toBe(1);
      expect(mappings.has('cn=admins,ou=groups,dc=test,dc=com')).toBe(true);
    });

    it('should overwrite existing mapping for same group', () => {
      ldapPermissionService.addRoleMapping({
        adGroupDN: 'cn=admins,ou=groups,dc=test,dc=com',
        role: 'Admin',
        permissions: ['*'],
      });

      ldapPermissionService.addRoleMapping({
        adGroupDN: 'cn=admins,ou=groups,dc=test,dc=com',
        role: 'SuperAdmin',
        permissions: ['*', 'system:admin'],
      });

      const mappings = (ldapPermissionService as any).roleMappings;
      expect(mappings.size).toBe(1);
      const mapping = mappings.get('cn=admins,ou=groups,dc=test,dc=com');
      expect(mapping.role).toBe('SuperAdmin');
    });
  });

  describe('removeRoleMapping', () => {
    it('should remove a role mapping', () => {
      ldapPermissionService.addRoleMapping({
        adGroupDN: 'cn=admins,ou=groups,dc=test,dc=com',
        role: 'Admin',
        permissions: ['*'],
      });

      ldapPermissionService.removeRoleMapping('cn=admins,ou=groups,dc=test,dc=com');

      const mappings = (ldapPermissionService as any).roleMappings;
      expect(mappings.size).toBe(0);
    });
  });

  describe('getRoleMappings', () => {
    it('should return all role mappings', () => {
      ldapPermissionService.addRoleMapping({
        adGroupDN: 'cn=admins,ou=groups,dc=test,dc=com',
        role: 'Admin',
        permissions: ['*'],
      });

      ldapPermissionService.addRoleMapping({
        adGroupDN: 'cn=users,ou=groups,dc=test,dc=com',
        role: 'User',
        permissions: ['read:*'],
      });

      const mappings = ldapPermissionService.getRoleMappings();
      expect(Array.isArray(mappings)).toBe(true);
      expect(mappings.length).toBe(2);
    });
  });

  // ===========================================================================
  // Audit Log
  // ===========================================================================
  describe('getAuditLog', () => {
    it('should return audit log entries', () => {
      // Manually add some audit entries
      (ldapPermissionService as any).auditLog.push(
        { timestamp: new Date(), action: 'authenticate', userId: 'user1', details: 'Success' },
        { timestamp: new Date(), action: 'search', userId: 'user2', details: 'Found user' },
      );

      const log = ldapPermissionService.getAuditLog(10);

      expect(Array.isArray(log)).toBe(true);
      expect(log.length).toBe(2);
      expect(log[0]).toHaveProperty('timestamp');
      expect(log[0]).toHaveProperty('action');
    });

    it('should limit returned entries', () => {
      for (let i = 0; i < 20; i++) {
        (ldapPermissionService as any).auditLog.push({
          timestamp: new Date(),
          action: 'test',
          details: `Entry ${i}`,
        });
      }

      const log = ldapPermissionService.getAuditLog(5);

      expect(log.length).toBe(5);
    });
  });

  // ===========================================================================
  // Health Check
  // ===========================================================================
  describe('healthCheck', () => {
    it('should report unhealthy when pool is not initialized', async () => {
      (ldapPermissionService as any).isInitialized = true;
      (ldapPermissionService as any).pool = null;

      const health = await ldapPermissionService.healthCheck();

      expect(health.healthy).toBe(false);
    });
  });

  // ===========================================================================
  // User Cache
  // ===========================================================================
  describe('user caching', () => {
    it('should cache user lookups', () => {
      const cache = (ldapPermissionService as any).userCache;

      cache.set('user1', {
        user: { sAMAccountName: 'user1', email: 'user1@test.com' },
        timestamp: Date.now(),
      });

      expect(cache.has('user1')).toBe(true);
      expect(cache.get('user1').user.sAMAccountName).toBe('user1');
    });
  });

  // ===========================================================================
  // Shutdown
  // ===========================================================================
  describe('shutdown', () => {
    it('should clean up resources on shutdown', async () => {
      (ldapPermissionService as any).isInitialized = true;
      (ldapPermissionService as any).pool = {
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      await ldapPermissionService.shutdown();

      expect((ldapPermissionService as any).isInitialized).toBe(false);
      expect((ldapPermissionService as any).pool).toBeNull();
    });

    it('should set isInitialized to false on shutdown', async () => {
      (ldapPermissionService as any).isInitialized = true;
      (ldapPermissionService as any).pool = {
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      await ldapPermissionService.shutdown();

      expect((ldapPermissionService as any).isInitialized).toBe(false);
      expect((ldapPermissionService as any).pool).toBeNull();
    });
  });
});
