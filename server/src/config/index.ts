import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  server: {
    port: number;
    env: string;
    apiUrl: string;
    clientUrl: string;
  };
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  gemini: {
    apiKey: string;
  };
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    priceIds: {
      basic: string;
      pro: string;
      enterprise: string;
    };
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3Bucket: string;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
    github: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
    slack: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
    jira: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
  };
  security: {
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    corsOrigin: string[];
  };
  logging: {
    level: string;
  };
  mqtt: {
    brokerUrl: string;
    username?: string;
    password?: string;
    clientId: string;
  };
  openai: {
    apiKey: string;
  };
  euAiDb: {
    apiBaseUrl: string;
    clientId: string;
    clientSecret: string;
    orgId: string;
  };
  encryption: {
    key: string;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || '',
    fromName: process.env.SENDGRID_FROM_NAME || 'ComplyEasy AI',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    priceIds: {
      basic: process.env.STRIPE_BASIC_PRICE_ID || 'Contact Us',
      pro: process.env.STRIPE_PRO_PRICE_ID || 'Contact Us',
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'Contact Us',
    },
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl: process.env.GITHUB_CALLBACK_URL || '',
    },
    slack: {
      clientId: process.env.SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET || '',
      callbackUrl: process.env.SLACK_CALLBACK_URL || '',
    },
    jira: {
      clientId: process.env.JIRA_CLIENT_ID || '',
      clientSecret: process.env.JIRA_CLIENT_SECRET || '',
      callbackUrl: process.env.JIRA_CALLBACK_URL || '',
    },
  },
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : [],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID || `complyeasy-${Date.now()}`,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  euAiDb: {
    apiBaseUrl: process.env.EU_AI_DB_API_BASE_URL || '',
    clientId: process.env.EU_AI_DB_CLIENT_ID || '',
    clientSecret: process.env.EU_AI_DB_CLIENT_SECRET || '',
    orgId: process.env.EU_AI_DB_ORG_ID || '',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },
};

// Validation function - Comprehensive validation matching validateEnv.ts
export const validateConfig = (): void => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Core Configuration
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  } else if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required');
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET is required');
  } else if (process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  if (!process.env.ENCRYPTION_KEY) {
    errors.push('ENCRYPTION_KEY is required');
  } else if (process.env.ENCRYPTION_KEY.length < 16) {
    errors.push('ENCRYPTION_KEY must be at least 16 characters long');
  }

  if (!process.env.GEMINI_API_KEY) {
    errors.push('GEMINI_API_KEY is required');
  }

  // Email Service (required for magic links)
  if (!process.env.SENDGRID_API_KEY) {
    errors.push('SENDGRID_API_KEY is required for email functionality');
  } else if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    errors.push('SENDGRID_API_KEY must start with "SG." - Please check your SendGrid API key');
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    errors.push('SENDGRID_FROM_EMAIL is required for email functionality');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(process.env.SENDGRID_FROM_EMAIL)) {
      errors.push('SENDGRID_FROM_EMAIL must be a valid email address');
    }
  }

  // Payment Processing (required for billing)
  if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push('STRIPE_SECRET_KEY is not set - billing features will not work');
  } else if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY must start with "sk_"');
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    warnings.push('STRIPE_WEBHOOK_SECRET is not set - webhook verification will fail');
  } else if (!process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    errors.push('STRIPE_WEBHOOK_SECRET must start with "whsec_"');
  }

  // AWS Services (required for S3 and BYOK)
  if (!process.env.AWS_ACCESS_KEY_ID) {
    warnings.push('AWS_ACCESS_KEY_ID is not set - S3 and BYOK features will not work');
  }

  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    warnings.push('AWS_SECRET_ACCESS_KEY is not set - S3 and BYOK features will not work');
  }

  if (!process.env.AWS_S3_BUCKET) {
    warnings.push('AWS_S3_BUCKET is not set - file storage will not work');
  }

  // CORS Origin
  if (!process.env.CORS_ORIGIN) {
    errors.push('CORS_ORIGIN is required for security');
  }

  // Log warnings in non-production (config loads before logger to avoid circular dependency)
  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    process.stdout.write(`⚠️  Configuration Warnings:\n${warnings.map((w: string) => `   - ${w}\n`).join('')}`);
  }

  // Throw errors for missing required variables
  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `Run 'npm run validate:env' for detailed validation or check ENVIRONMENT_VARIABLES.md for setup instructions.`
    );
  }
};

export default config;
