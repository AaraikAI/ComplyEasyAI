
import { User, RiskItem, ComplianceFramework, AuditLog, Organization, Integration, ComplianceStatus, FrameworkType } from '../types';
import { MOCK_USERS, MOCK_RISKS, INITIAL_FRAMEWORKS, MOCK_AUDIT_LOGS, MOCK_INTEGRATIONS } from '../constants';

// --- LocalStorage Database Keys ---
const DB_KEYS = {
  USERS: 'db_users',
  ORGS: 'db_orgs',
  RISKS: 'db_risks',
  FRAMEWORKS: 'db_frameworks',
  LOGS: 'db_logs',
  INTEGRATIONS: 'db_integrations'
};

// --- Initialization Logic (Seed Data) ---
const initDB = () => {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    // Seed Users
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(MOCK_USERS));
    
    // Seed Org
    const org: Organization = {
      id: 'org1',
      name: 'Acme Corp',
      plan: 'Pro',
      subscriptionStatus: 'active'
    };
    localStorage.setItem(DB_KEYS.ORGS, JSON.stringify([org]));

    // Seed Data
    localStorage.setItem(DB_KEYS.RISKS, JSON.stringify(MOCK_RISKS));
    localStorage.setItem(DB_KEYS.FRAMEWORKS, JSON.stringify(INITIAL_FRAMEWORKS));
    localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(MOCK_AUDIT_LOGS));
    localStorage.setItem(DB_KEYS.INTEGRATIONS, JSON.stringify(MOCK_INTEGRATIONS));
  }
};

initDB();

// --- Generic DB Helpers ---
const getTable = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const saveTable = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Database Service Methods ---

export const db = {
  users: {
    find: (email: string) => getTable<User>(DB_KEYS.USERS).find(u => u.email === email),
    getAll: () => getTable<User>(DB_KEYS.USERS),
    create: (user: User) => {
      const users = getTable<User>(DB_KEYS.USERS);
      users.push(user);
      saveTable(DB_KEYS.USERS, users);
      return user;
    },
    update: (user: User) => {
      const users = getTable<User>(DB_KEYS.USERS);
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users[index] = user;
        saveTable(DB_KEYS.USERS, users);
      }
    },
    delete: (id: string) => {
      const users = getTable<User>(DB_KEYS.USERS).filter(u => u.id !== id);
      saveTable(DB_KEYS.USERS, users);
    }
  },
  risks: {
    getAll: () => getTable<RiskItem>(DB_KEYS.RISKS),
    update: (risk: RiskItem) => {
      const risks = getTable<RiskItem>(DB_KEYS.RISKS);
      const index = risks.findIndex(r => r.id === risk.id);
      if (index !== -1) {
        risks[index] = risk;
        saveTable(DB_KEYS.RISKS, risks);
      } else {
        risks.unshift(risk); // Add new risks to top
        saveTable(DB_KEYS.RISKS, risks);
      }
    }
  },
  frameworks: {
    getAll: () => getTable<ComplianceFramework>(DB_KEYS.FRAMEWORKS),
    add: (fw: ComplianceFramework) => {
      const list = getTable<ComplianceFramework>(DB_KEYS.FRAMEWORKS);
      list.push(fw);
      saveTable(DB_KEYS.FRAMEWORKS, list);
    }
  },
  auditLogs: {
    getAll: () => getTable<AuditLog>(DB_KEYS.LOGS),
    add: (log: AuditLog) => {
      const list = getTable<AuditLog>(DB_KEYS.LOGS);
      list.unshift(log);
      saveTable(DB_KEYS.LOGS, list);
    }
  },
  org: {
    get: () => getTable<Organization>(DB_KEYS.ORGS)[0], // Single tenant simulation
    updatePlan: (plan: 'Basic' | 'Pro' | 'Enterprise') => {
      const orgs = getTable<Organization>(DB_KEYS.ORGS);
      if (orgs[0]) {
        orgs[0].plan = plan;
        saveTable(DB_KEYS.ORGS, orgs);
      }
    }
  }
};
