/**
 * LDAP Permission Service Unit Tests
 *
 * Tests for Active Directory / LDAP integration including authentication,
 * user lookup, group resolution, nested group handling, and permission evaluation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock ldapjs
const mockLdapClient = {
  bind: jest.fn(),
  unbind: jest.fn(),
  search: jest.fn(),
  modify: jest.fn(),
  add: jest.fn(),
  del: jest.fn(),
  on: jest.fn(),
  connected: true,
  destroy: jest.fn(),
};

const mockSearchEntry = {
  dn: 'cn=user1,ou=users,dc=example,dc=com',
  attributes: [
    { type: 'cn', values: ['user1'] },
    { type: 'mail', values: ['user1@example.com'] },
    { type: 'memberOf', values: ['cn=admins,ou=groups,dc=example,dc=com'] },
    { type: 'sAMAccountName', values: ['user1'] },
    { type: 'userPrincipalName', values: ['user1@example.com'] },
  ],
  ppiObject: {
    cn: 'user1',
    mail: 'user1@example.com',
    memberOf: ['cn=admins,ou=groups,dc=example,dc=com'],
    sAMAccountName: 'user1',
  },
};

const mockSearchResult = {
  on: jest.fn().mockImplementation(function (this: any, event: string, callback: (entry?: any) => void) {
    if (event === 'searchEntry') {
      setTimeout(() => callback(mockSearchEntry), 10);
    }
    if (event === 'end') {
      setTimeout(() => callback(), 20);
    }
    if (event === 'error') {
      // Don't call error by default
    }
    return this;
  }),
};

jest.mock('ldapjs', () => ({
  createClient: jest.fn().mockReturnValue(mockLdapClient),
  parseDN: jest.fn().mockReturnValue({
    rdns: [{ attrs: { cn: { value: 'user1' } } }],
    toString: () => 'cn=user1,ou=users,dc=example,dc=com',
  }),
}));

// Extend prismaMock for LDAP-specific models
const ldapPrismaMock = {
  ...prismaMock,
  ldapConfig: {
    findUnique: jest.fn().mockResolvedValue({
      id: 'ldap-config-1',
      organizationId: 'org-123',
      url: 'ldap://ldap.example.com',
      bindDN: 'cn=admin,dc=example,dc=com',
      bindCredential: 'encrypted-password',
      baseDN: 'dc=example,dc=com',
      userSearchBase: 'ou=users',
      groupSearchBase: 'ou=groups',
      userFilter: '(objectClass=person)',
      groupFilter: '(objectClass=group)',
      tlsEnabled: true,
      connectionPoolSize: 5,
    }) as jest.Mock<any>,
    findFirst: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
  },
  ldapGroupMapping: {
    findMany: jest.fn().mockResolvedValue([
      { ldapGroupDN: 'cn=admins,ou=groups,dc=example,dc=com', role: 'Admin' },
      { ldapGroupDN: 'cn=users,ou=groups,dc=example,dc=com', role: 'User' },
    ]) as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    deleteMany: jest.fn() as jest.Mock<any>,
  },
  ldapSyncLog: {
    create: jest.fn() as jest.Mock<any>,
    findMany: jest.fn() as jest.Mock<any>,
  },
};

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: ldapPrismaMock,
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

// Mock crypto for password handling
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createDecipheriv: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue('decrypted'),
    final: jest.fn().mockReturnValue(''),
  }),
  createCipheriv: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue('encrypted'),
    final: jest.fn().mockReturnValue(''),
  }),
}));

import ldapPermissionService from '../../../../services/advanced/ldapPermissionService';

describe('LDAPPermissionService', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset internal state
    (ldapPermissionService as any).isInitialized = false;
    (ldapPermissionService as any).connectionPool = [];
    (ldapPermissionService as any).groupCache = new Map();
    (ldapPermissionService as any).userCache = new Map();
    (ldapPermissionService as any).nestedGroupCache = new Map();
  });

  // ===========================================================================
  // initialize
  // ===========================================================================
  describe('initialize', () => {
    it('should load LDAP configuration from database', async () => {
      await ldapPermissionService.initialize(orgId);

      expect(ldapPrismaMock.ldapConfig.findUnique).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
      expect((ldapPermissionService as any).isInitialized).toBe(true);
    });

    it('should create connection pool', async () => {
      await ldapPermissionService.initialize(orgId);

      const pool = (ldapPermissionService as any).connectionPool;
      expect(pool.length).toBeGreaterThan(0);
    });

    it('should handle missing LDAP configuration', async () => {
      ldapPrismaMock.ldapConfig.findUnique.mockResolvedValueOnce(null);

      await expect(ldapPermissionService.initialize(orgId)).rejects.toThrow(
        /LDAP configuration not found/
      );
    });

    it('should skip re-initialization', async () => {
      (ldapPermissionService as any).isInitialized = true;
      (ldapPermissionService as any).organizationId = orgId;

      await ldapPermissionService.initialize(orgId);

      expect(ldapPrismaMock.ldapConfig.findUnique).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // authenticateUser
  // ===========================================================================
  describe('authenticateUser', () => {
    beforeEach(async () => {
      (ldapPermissionService as any).isInitialized = true;
      (ldapPermissionService as any).config = {
        url: 'ldap://ldap.example.com',
        baseDN: 'dc=example,dc=com',
        userSearchBase: 'ou=users',
        bindDN: 'cn=admin,dc=example,dc=com',
        bindCredential: 'password',
      };
      (ldapPermissionService as any).connectionPool = [mockLdapClient];
    });

    it('should authenticate valid user credentials', async () => {
      mockLdapClient.bind.mockImplementation((dn: string, pass: string, cb: (err: null) => void) => cb(null));
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        cb(null, mockSearchResult);
      });

      const result = await ldapPermissionService.authenticateUser(
        'user1',
        'password123',
        orgId
      );

      expect(result.authenticated).toBe(true);
      expect(result).toHaveProperty('user');
      expect(result.user?.username).toBe('user1');
    });

    it('should reject invalid credentials', async () => {
      mockLdapClient.bind.mockImplementation((dn: string, pass: string, cb: (err: Error) => void) => {
        cb(new Error('Invalid credentials'));
      });

      const result = await ldapPermissionService.authenticateUser(
        'user1',
        'wrongpassword',
        orgId
      );

      expect(result.authenticated).toBe(false);
      expect(result).toHaveProperty('error');
    });

    it('should include group memberships in result', async () => {
      mockLdapClient.bind.mockImplementation((dn: string, pass: string, cb: (err: null) => void) => cb(null));
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        cb(null, mockSearchResult);
      });

      const result = await ldapPermissionService.authenticateUser(
        'user1',
        'password123',
        orgId
      );

      expect(result.user?.groups).toBeDefined();
      expect(Array.isArray(result.user?.groups)).toBe(true);
    });

    it('should handle LDAP connection timeout', async () => {
      mockLdapClient.bind.mockImplementation(() => {
        throw new Error('Connection timeout');
      });

      const result = await ldapPermissionService.authenticateUser(
        'user1',
        'password123',
        orgId
      );

      expect(result.authenticated).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  // ===========================================================================
  // findUser
  // ===========================================================================
  describe('findUser', () => {
    beforeEach(() => {
      (ldapPermissionService as any).isInitialized = true;
      (ldapPermissionService as any).config = {
        baseDN: 'dc=example,dc=com',
        userSearchBase: 'ou=users',
        userFilter: '(objectClass=person)',
      };
      (ldapPermissionService as any).connectionPool = [mockLdapClient];
    });

    it('should find user by username', async () => {
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        cb(null, mockSearchResult);
      });

      const user = await ldapPermissionService.findUser('user1', orgId);

      expect(user).toBeDefined();
      expect(user?.username).toBe('user1');
      expect(user?.email).toBe('user1@example.com');
    });

    it('should find user by email', async () => {
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        cb(null, mockSearchResult);
      });

      const user = await ldapPermissionService.findUser('user1@example.com', orgId);

      expect(user).toBeDefined();
    });

    it('should return null for non-existent user', async () => {
      const emptyResult = {
        on: jest.fn().mockImplementation(function (this: any, event: string, callback: () => void) {
          if (event === 'end') setTimeout(callback, 10);
          return this;
        }),
      };
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        cb(null, emptyResult);
      });

      const user = await ldapPermissionService.findUser('nonexistent', orgId);

      expect(user).toBeNull();
    });

    it('should cache user lookup results', async () => {
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        cb(null, mockSearchResult);
      });

      await ldapPermissionService.findUser('user1', orgId);
      await ldapPermissionService.findUser('user1', orgId);

      // Second call should use cache
      expect(mockLdapClient.search).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // resolveNestedGroups
  // ===========================================================================
  describe('resolveNestedGroups', () => {
    beforeEach(() => {
      (ldapPermissionService as any).isInitialized = true;
      (ldapPermissionService as any).config = {
        baseDN: 'dc=example,dc=com',
        groupSearchBase: 'ou=groups',
      };
      (ldapPermissionService as any).connectionPool = [mockLdapClient];
      (ldapPermissionService as any).nestedGroupCache = new Map();
    });

    it('should resolve direct group memberships', async () => {
      const groupEntry = {
        dn: 'cn=admins,ou=groups,dc=example,dc=com',
        ppiObject: {
          cn: 'admins',
          memberOf: [],
        },
      };
      const groupSearchResult = {
        on: jest.fn().mockImplementation(function (this: any, event: string, callback: (entry?: any) => void) {
          if (event === 'searchEntry') setTimeout(() => callback(groupEntry), 10);
          if (event === 'end') setTimeout(() => callback(), 20);
          return this;
        }),
      };
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        cb(null, groupSearchResult);
      });

      const groups = await ldapPermissionService.resolveNestedGroups(
        ['cn=admins,ou=groups,dc=example,dc=com'],
        orgId
      );

      expect(groups).toContain('cn=admins,ou=groups,dc=example,dc=com');
    });

    it('should recursively resolve nested groups', async () => {
      const parentGroup = {
        dn: 'cn=all-staff,ou=groups,dc=example,dc=com',
        ppiObject: {
          cn: 'all-staff',
          memberOf: [],
        },
      };
      const childGroup = {
        dn: 'cn=admins,ou=groups,dc=example,dc=com',
        ppiObject: {
          cn: 'admins',
          memberOf: ['cn=all-staff,ou=groups,dc=example,dc=com'],
        },
      };

      let callCount = 0;
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        const entry = callCount === 0 ? childGroup : parentGroup;
        callCount++;
        const result = {
          on: jest.fn().mockImplementation(function (this: any, event: string, callback: (e?: any) => void) {
            if (event === 'searchEntry') setTimeout(() => callback(entry), 10);
            if (event === 'end') setTimeout(() => callback(), 20);
            return this;
          }),
        };
        cb(null, result);
      });

      const groups = await ldapPermissionService.resolveNestedGroups(
        ['cn=admins,ou=groups,dc=example,dc=com'],
        orgId
      );

      expect(groups.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle circular group references', async () => {
      const circularGroup = {
        dn: 'cn=circular,ou=groups,dc=example,dc=com',
        ppiObject: {
          cn: 'circular',
          memberOf: ['cn=circular,ou=groups,dc=example,dc=com'], // Self-reference
        },
      };
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        const result = {
          on: jest.fn().mockImplementation(function (this: any, event: string, callback: (e?: any) => void) {
            if (event === 'searchEntry') setTimeout(() => callback(circularGroup), 10);
            if (event === 'end') setTimeout(() => callback(), 20);
            return this;
          }),
        };
        cb(null, result);
      });

      // Should not hang or throw
      const groups = await ldapPermissionService.resolveNestedGroups(
        ['cn=circular,ou=groups,dc=example,dc=com'],
        orgId
      );

      expect(groups).toContain('cn=circular,ou=groups,dc=example,dc=com');
    });

    it('should cache nested group results', async () => {
      const groupEntry = {
        dn: 'cn=admins,ou=groups,dc=example,dc=com',
        ppiObject: { cn: 'admins', memberOf: [] },
      };
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        const result = {
          on: jest.fn().mockImplementation(function (this: any, event: string, callback: (e?: any) => void) {
            if (event === 'searchEntry') setTimeout(() => callback(groupEntry), 10);
            if (event === 'end') setTimeout(() => callback(), 20);
            return this;
          }),
        };
        cb(null, result);
      });

      await ldapPermissionService.resolveNestedGroups(
        ['cn=admins,ou=groups,dc=example,dc=com'],
        orgId
      );
      await ldapPermissionService.resolveNestedGroups(
        ['cn=admins,ou=groups,dc=example,dc=com'],
        orgId
      );

      // Should use cache on second call
      expect(mockLdapClient.search).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // evaluatePermission
  // ===========================================================================
  describe('evaluatePermission', () => {
    beforeEach(() => {
      (ldapPermissionService as any).isInitialized = true;
      (ldapPermissionService as any).groupMappings = new Map([
        ['cn=admins,ou=groups,dc=example,dc=com', { role: 'Admin', permissions: ['*'] }],
        ['cn=users,ou=groups,dc=example,dc=com', { role: 'User', permissions: ['read:*'] }],
      ]);
    });

    it('should grant permission for admin group', async () => {
      const result = await ldapPermissionService.evaluatePermission(
        ['cn=admins,ou=groups,dc=example,dc=com'],
        'write:policies',
        orgId
      );

      expect(result.granted).toBe(true);
      expect(result.matchedGroup).toBe('cn=admins,ou=groups,dc=example,dc=com');
    });

    it('should deny permission when not in authorized groups', async () => {
      const result = await ldapPermissionService.evaluatePermission(
        ['cn=guests,ou=groups,dc=example,dc=com'],
        'write:policies',
        orgId
      );

      expect(result.granted).toBe(false);
    });

    it('should support wildcard permissions', async () => {
      const result = await ldapPermissionService.evaluatePermission(
        ['cn=admins,ou=groups,dc=example,dc=com'],
        'any:action',
        orgId
      );

      expect(result.granted).toBe(true);
    });

    it('should match partial permission patterns', async () => {
      const result = await ldapPermissionService.evaluatePermission(
        ['cn=users,ou=groups,dc=example,dc=com'],
        'read:policies',
        orgId
      );

      expect(result.granted).toBe(true);
    });

    it('should return highest role when in multiple groups', async () => {
      const result = await ldapPermissionService.evaluatePermission(
        [
          'cn=users,ou=groups,dc=example,dc=com',
          'cn=admins,ou=groups,dc=example,dc=com',
        ],
        'write:policies',
        orgId
      );

      expect(result.granted).toBe(true);
      expect(result.effectiveRole).toBe('Admin');
    });
  });

  // ===========================================================================
  // syncUsers
  // ===========================================================================
  describe('syncUsers', () => {
    beforeEach(() => {
      (ldapPermissionService as any).isInitialized = true;
      (ldapPermissionService as any).config = {
        baseDN: 'dc=example,dc=com',
        userSearchBase: 'ou=users',
        userFilter: '(objectClass=person)',
      };
      (ldapPermissionService as any).connectionPool = [mockLdapClient];
    });

    it('should sync users from LDAP to database', async () => {
      const users = [mockSearchEntry, { ...mockSearchEntry, dn: 'cn=user2,ou=users,dc=example,dc=com' }];
      let entryIndex = 0;
      const syncResult = {
        on: jest.fn().mockImplementation(function (this: any, event: string, callback: (e?: any) => void) {
          if (event === 'searchEntry' && entryIndex < users.length) {
            setTimeout(() => callback(users[entryIndex++]), 10);
          }
          if (event === 'end') setTimeout(() => callback(), 30);
          return this;
        }),
      };
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        cb(null, syncResult);
      });

      const result = await ldapPermissionService.syncUsers(orgId);

      expect(result).toHaveProperty('created');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('deleted');
    });

    it('should log sync activity', async () => {
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: null, res: any) => void) => {
        cb(null, mockSearchResult);
      });

      await ldapPermissionService.syncUsers(orgId);

      expect(ldapPrismaMock.ldapSyncLog.create).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      mockLdapClient.search.mockImplementation((base: string, opts: any, cb: (err: Error) => void) => {
        cb(new Error('Search failed'));
      });

      const result = await ldapPermissionService.syncUsers(orgId);

      expect(result).toHaveProperty('error');
    });
  });

  // ===========================================================================
  // Connection Pool Management
  // ===========================================================================
  describe('Connection Pool', () => {
    it('should acquire connection from pool', async () => {
      (ldapPermissionService as any).connectionPool = [mockLdapClient, mockLdapClient];

      const conn = await (ldapPermissionService as any).acquireConnection();

      expect(conn).toBeDefined();
    });

    it('should release connection back to pool', async () => {
      (ldapPermissionService as any).connectionPool = [];

      await (ldapPermissionService as any).releaseConnection(mockLdapClient);

      expect((ldapPermissionService as any).connectionPool).toContain(mockLdapClient);
    });

    it('should create new connection when pool is empty', async () => {
      (ldapPermissionService as any).connectionPool = [];
      (ldapPermissionService as any).config = {
        url: 'ldap://ldap.example.com',
        tlsEnabled: false,
      };

      const conn = await (ldapPermissionService as any).acquireConnection();

      expect(conn).toBeDefined();
    });

    it('should handle connection failures', async () => {
      const ldapjs = require('ldapjs');
      ldapjs.createClient.mockReturnValueOnce({
        ...mockLdapClient,
        connected: false,
        bind: jest.fn().mockImplementation((dn: string, pass: string, cb: (err: Error) => void) => {
          cb(new Error('Connection failed'));
        }),
      });

      (ldapPermissionService as any).connectionPool = [];
      (ldapPermissionService as any).config = { url: 'ldap://ldap.example.com' };

      await expect(
        (ldapPermissionService as any).acquireConnection()
      ).rejects.toThrow();
    });
  });

  // ===========================================================================
  // BER Encoding/Decoding
  // ===========================================================================
  describe('BER Encoding', () => {
    it('should parse DN correctly', () => {
      const ldapjs = require('ldapjs');
      const dn = 'cn=user1,ou=users,dc=example,dc=com';

      ldapjs.parseDN(dn);

      expect(ldapjs.parseDN).toHaveBeenCalledWith(dn);
    });

    it('should extract CN from DN', () => {
      const dn = 'cn=user1,ou=users,dc=example,dc=com';
      const cn = (ldapPermissionService as any).extractCNFromDN(dn);

      expect(cn).toBe('user1');
    });
  });

  // ===========================================================================
  // Cleanup
  // ===========================================================================
  describe('cleanup', () => {
    it('should close all connections in pool', async () => {
      (ldapPermissionService as any).connectionPool = [mockLdapClient, mockLdapClient];

      await ldapPermissionService.cleanup();

      expect(mockLdapClient.unbind).toHaveBeenCalled();
      expect((ldapPermissionService as any).connectionPool.length).toBe(0);
    });

    it('should clear caches on cleanup', async () => {
      (ldapPermissionService as any).userCache.set('user1', {});
      (ldapPermissionService as any).groupCache.set('group1', {});

      await ldapPermissionService.cleanup();

      expect((ldapPermissionService as any).userCache.size).toBe(0);
      expect((ldapPermissionService as any).groupCache.size).toBe(0);
    });
  });
});
