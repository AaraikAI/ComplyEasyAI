import { describe, it, expect } from 'vitest';
import { MOCK_USERS, INITIAL_FRAMEWORKS, AVAILABLE_FRAMEWORKS, MOCK_RISKS, MOCK_AUDIT_LOGS, MOCK_INTEGRATIONS, PRICING_TIERS } from '../../constants';

describe('constants', () => {
  describe('MOCK_USERS', () => {
    it('should have 3 users', () => {
      expect(MOCK_USERS).toHaveLength(3);
    });

    it('should have required fields for each user', () => {
      MOCK_USERS.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
      });
    });

    it('should have different roles', () => {
      const roles = MOCK_USERS.map(u => u.role);
      expect(roles).toContain('admin');
    });
  });

  describe('INITIAL_FRAMEWORKS', () => {
    it('should have 2 frameworks', () => {
      expect(INITIAL_FRAMEWORKS).toHaveLength(2);
    });

    it('should include SOC 2 and GDPR', () => {
      const names = INITIAL_FRAMEWORKS.map(f => f.name);
      expect(names).toContain('SOC 2 Type II');
      expect(names).toContain('GDPR');
    });

    it('should have required fields', () => {
      INITIAL_FRAMEWORKS.forEach(fw => {
        expect(fw).toHaveProperty('id');
        expect(fw).toHaveProperty('name');
        expect(fw).toHaveProperty('status');
        expect(fw).toHaveProperty('progress');
      });
    });
  });

  describe('AVAILABLE_FRAMEWORKS', () => {
    it('should have at least 10 frameworks', () => {
      expect(AVAILABLE_FRAMEWORKS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have required fields for each', () => {
      AVAILABLE_FRAMEWORKS.forEach(fw => {
        expect(fw).toHaveProperty('name');
        expect(fw).toHaveProperty('region');
      });
    });
  });

  describe('MOCK_RISKS', () => {
    it('should have 3 risks', () => {
      expect(MOCK_RISKS).toHaveLength(3);
    });

    it('should have severity levels', () => {
      MOCK_RISKS.forEach(risk => {
        expect(risk).toHaveProperty('severity');
        expect(['High', 'Medium', 'Low', 'Critical']).toContain(risk.severity);
      });
    });
  });

  describe('MOCK_AUDIT_LOGS', () => {
    it('should have audit entries', () => {
      expect(MOCK_AUDIT_LOGS.length).toBeGreaterThan(0);
    });

    it('should have required fields', () => {
      MOCK_AUDIT_LOGS.forEach(log => {
        expect(log).toHaveProperty('action');
        expect(log).toHaveProperty('user');
        expect(log).toHaveProperty('timestamp');
      });
    });
  });

  describe('MOCK_INTEGRATIONS', () => {
    it('should include major integrations', () => {
      const names = MOCK_INTEGRATIONS.map(i => i.name);
      expect(names).toContain('AWS');
    });

    it('should have required fields', () => {
      MOCK_INTEGRATIONS.forEach(integration => {
        expect(integration).toHaveProperty('id');
        expect(integration).toHaveProperty('name');
      });
    });
  });

  describe('PRICING_TIERS', () => {
    it('should have pricing tiers', () => {
      expect(PRICING_TIERS.length).toBeGreaterThan(0);
    });

    it('should have required fields', () => {
      PRICING_TIERS.forEach(tier => {
        expect(tier).toHaveProperty('name');
      });
    });
  });
});
