
import { db } from './storage';
import { User, RiskItem, ComplianceFramework, AuditLog } from '../types';

// In a real app, this would be your backend URL e.g. 'https://api.complyeasy.ai'
// Since we are simulating, we keep it empty and intercept requests below.
const API_BASE_URL = ''; 
const MOCK_MODE = true;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- Auth & User ---
  auth: {
    login: async (email: string) => {
      await delay(800); // Simulate network
      const user = db.users.find(email);
      if (user) return user;
      throw new Error('User not found');
    },
    register: async (userData: User) => {
      await delay(800);
      return db.users.create(userData);
    }
  },

  // --- Risks ---
  risks: {
    list: async () => {
      await delay(300);
      return db.risks.getAll();
    },
    update: async (risk: RiskItem) => {
      await delay(400);
      return db.risks.update(risk);
    },
    create: async (risk: RiskItem) => {
      await delay(400);
      return db.risks.update(risk);
    }
  },

  // --- Frameworks ---
  frameworks: {
    list: async () => {
      await delay(300);
      return db.frameworks.getAll();
    },
    create: async (fw: ComplianceFramework) => {
      await delay(500);
      return db.frameworks.add(fw);
    }
  },

  // --- Audit ---
  audit: {
    list: async () => {
      await delay(200);
      return db.auditLogs.getAll();
    },
    log: async (action: string, user: string) => {
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        action,
        user,
        timestamp: new Date().toLocaleString(),
        hash: `0x${Math.random().toString(16).substr(2, 40)}`, // Blockchain oracle simulation
        verified: true
      };
      db.auditLogs.add(newLog);
    }
  },

  // --- Billing ---
  billing: {
    upgrade: async (plan: 'Basic' | 'Pro' | 'Enterprise') => {
      await delay(1500); // Simulate Stripe processing
      db.org.updatePlan(plan);
      return { success: true };
    }
  }
};
