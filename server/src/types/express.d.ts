import { Organization } from '@prisma/client';

// Override express-serve-static-core to fix ParamsDictionary
declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }
}

declare global {
  namespace Express {
    // Override User interface for passport
    interface User {
      id: string;
      email: string;
      name: string;
      role: string;
      avatar?: string | null;
      passwordHash?: string | null;
      emailVerified: boolean;
      lastLogin?: Date | null;
      employeeId?: string | null;
      department?: string | null;
      jobTitle?: string | null;
      manager?: string | null;
      startDate?: Date | null;
      endDate?: Date | null;
      active: boolean;
      twoFactorEnabled: boolean;
      twoFactorSecret?: string | null;
      twoFactorVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
      organizationId: string;
      organization?: Organization;
    }
  }
}

export {};
