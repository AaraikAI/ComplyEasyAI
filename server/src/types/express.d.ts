// Note: Organization type is imported conditionally to avoid breaking the
// augmentation when the Prisma client has not been generated yet.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
type OrganizationType = import('../generated/prisma/client').Organization;

// Express 5 types ParamsDictionary as { [key: string]: string | string[] }.
// Our routes only use simple :param patterns (never wildcard *param), so params
// are always single strings. Override the interface to reflect this and avoid
// hundreds of `as string` casts throughout the codebase.
declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }

  // Express 5 query values can be string | string[] | ParsedQs | ParsedQs[].
  // For our API, query values are always single strings. Override to simplify.
  interface Query {
    [key: string]: string | undefined;
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
      organization?: OrganizationType;
    }
  }
}

export {};
