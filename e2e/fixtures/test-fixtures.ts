/**
 * Comprehensive Test Fixtures
 * Provides database helpers, test data factories, and common utilities
 */

import { test as base, expect, Page, APIRequestContext } from '@playwright/test';

// Conditional import for Supabase
let createClient: any;
let SupabaseClient: any;

try {
  const supabaseModule = require('@supabase/supabase-js');
  createClient = supabaseModule.createClient;
} catch (e) {
  createClient = null;
}

// Environment configuration
const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Types
export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  organizationId: string;
}

export interface TestFramework {
  id: string;
  name: string;
  type: string;
  region?: string;
  status: string;
  progress: number;
}

export interface TestVendor {
  id: string;
  name: string;
  website?: string;
  contactEmail?: string;
  category?: string;
  riskScore?: number;
}

export interface TestRisk {
  id: string;
  title: string;
  description?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
}

export interface TestPolicy {
  id: string;
  title: string;
  content: string;
  category: string;
  status: 'Draft' | 'In Review' | 'Approved';
}

// Database Helper Class
export class DatabaseHelper {
  private supabase: any = null;

  constructor() {
    if (SUPABASE_URL && SUPABASE_KEY && createClient) {
      try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      } catch (e) {
        console.log('Supabase initialization failed:', e);
        this.supabase = null;
      }
    }
  }

  get client(): any {
    return this.supabase;
  }

  // User operations
  async getUser(email: string): Promise<TestUser | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) return null;
    return data;
  }

  async createTestUser(user: Partial<TestUser>): Promise<TestUser | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTestUser(id: string): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.from('users').delete().eq('id', id);
  }

  // Framework operations
  async getFramework(id: string): Promise<TestFramework | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('frameworks')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async getFrameworks(organizationId: string): Promise<TestFramework[]> {
    if (!this.supabase) return [];
    const { data, error } = await this.supabase
      .from('frameworks')
      .select('*')
      .eq('organization_id', organizationId);
    if (error) return [];
    return data || [];
  }

  async createTestFramework(framework: Partial<TestFramework>): Promise<TestFramework | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('frameworks')
      .insert(framework)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTestFramework(id: string): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.from('frameworks').delete().eq('id', id);
  }

  // Vendor operations
  async getVendor(id: string): Promise<TestVendor | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async createTestVendor(vendor: Partial<TestVendor>): Promise<TestVendor | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('vendors')
      .insert(vendor)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTestVendor(id: string): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.from('vendors').delete().eq('id', id);
  }

  // Risk operations
  async getRisk(id: string): Promise<TestRisk | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('risks')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async createTestRisk(risk: Partial<TestRisk>): Promise<TestRisk | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('risks')
      .insert(risk)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTestRisk(id: string): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.from('risks').delete().eq('id', id);
  }

  // Policy operations
  async getPolicy(id: string): Promise<TestPolicy | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('policies')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async createTestPolicy(policy: Partial<TestPolicy>): Promise<TestPolicy | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('policies')
      .insert(policy)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTestPolicy(id: string): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.from('policies').delete().eq('id', id);
  }

  // Audit log verification
  async getAuditLogs(entityId: string, entityType: string): Promise<any[]> {
    if (!this.supabase) return [];
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  }

  // Cleanup test data
  async cleanupTestData(prefix: string = 'TEST_'): Promise<void> {
    if (!this.supabase) return;

    // Delete test frameworks
    await this.supabase.from('frameworks').delete().like('name', `${prefix}%`);
    // Delete test vendors
    await this.supabase.from('vendors').delete().like('name', `${prefix}%`);
    // Delete test risks
    await this.supabase.from('risks').delete().like('title', `${prefix}%`);
    // Delete test policies
    await this.supabase.from('policies').delete().like('title', `${prefix}%`);
  }
}

// Test Data Factory
export class TestDataFactory {
  private counter = 0;

  uniqueId(): string {
    return `TEST_${Date.now()}_${++this.counter}`;
  }

  createFrameworkData(overrides: Partial<TestFramework> = {}): Partial<TestFramework> {
    return {
      name: `TEST_Framework_${this.uniqueId()}`,
      type: 'SOC2',
      region: 'US',
      status: 'In Progress',
      progress: 0,
      ...overrides,
    };
  }

  createVendorData(overrides: Partial<TestVendor> = {}): Partial<TestVendor> {
    const id = this.uniqueId();
    return {
      name: `TEST_Vendor_${id}`,
      website: `https://test-vendor-${id}.example.com`,
      contactEmail: `contact-${id}@example.com`,
      category: 'Technology',
      riskScore: 50,
      ...overrides,
    };
  }

  createRiskData(overrides: Partial<TestRisk> = {}): Partial<TestRisk> {
    return {
      title: `TEST_Risk_${this.uniqueId()}`,
      description: 'Test risk description for E2E testing',
      severity: 'Medium',
      status: 'Open',
      ...overrides,
    };
  }

  createPolicyData(overrides: Partial<TestPolicy> = {}): Partial<TestPolicy> {
    return {
      title: `TEST_Policy_${this.uniqueId()}`,
      content: 'This is test policy content for E2E testing purposes.',
      category: 'Security',
      status: 'Draft',
      ...overrides,
    };
  }

  createUserData(overrides: Partial<TestUser> = {}): Partial<TestUser> {
    const id = this.uniqueId();
    return {
      email: `test-${id}@example.com`,
      name: `Test User ${id}`,
      role: 'editor',
      ...overrides,
    };
  }
}

// API Helper Class
export class APIHelper {
  private request: APIRequestContext;
  private authToken: string | null = null;
  private csrfToken: string | null = null;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async authenticate(email: string, password: string): Promise<string> {
    const response = await this.request.post(`${API_BASE}/api/auth/login`, {
      data: { email, password },
    });

    if (response.ok()) {
      const body = await response.json();
      this.authToken = body.accessToken;
      return this.authToken;
    }

    throw new Error(`Authentication failed: ${response.status()}`);
  }

  async getCsrfToken(): Promise<string> {
    const response = await this.request.get(`${API_BASE}/api/csrf-token`);
    const body = await response.json();
    this.csrfToken = body.csrfToken;
    return this.csrfToken;
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    return headers;
  }

  async get(path: string): Promise<any> {
    const response = await this.request.get(`${API_BASE}${path}`, {
      headers: this.getHeaders(),
    });
    return response;
  }

  async post(path: string, data: any): Promise<any> {
    const response = await this.request.post(`${API_BASE}${path}`, {
      headers: this.getHeaders(),
      data,
    });
    return response;
  }

  async put(path: string, data: any): Promise<any> {
    const response = await this.request.put(`${API_BASE}${path}`, {
      headers: this.getHeaders(),
      data,
    });
    return response;
  }

  async patch(path: string, data: any): Promise<any> {
    const response = await this.request.patch(`${API_BASE}${path}`, {
      headers: this.getHeaders(),
      data,
    });
    return response;
  }

  async delete(path: string): Promise<any> {
    const response = await this.request.delete(`${API_BASE}${path}`, {
      headers: this.getHeaders(),
    });
    return response;
  }
}

// Extended test fixture type
type TestFixtures = {
  db: DatabaseHelper;
  factory: TestDataFactory;
  api: APIHelper;
};

// Create extended test with fixtures
export const test = base.extend<TestFixtures>({
  db: async ({}, use) => {
    const db = new DatabaseHelper();
    await use(db);
  },

  factory: async ({}, use) => {
    const factory = new TestDataFactory();
    await use(factory);
  },

  api: async ({ request }, use) => {
    const api = new APIHelper(request);
    await use(api);
  },
});

export { expect };
