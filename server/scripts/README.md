# Server Scripts

This directory contains utility scripts for server setup and maintenance.

## Available Scripts

### OAuth Setup Wizard

Interactive CLI tool to guide you through creating OAuth apps for all integrated services.

```bash
npm run setup:oauth
```

**What it does:**
- Provides step-by-step instructions for creating OAuth apps
- Guides you through Google, GitHub, Slack, and Jira OAuth setup
- Automatically updates your `.env` file with OAuth credentials
- Validates callback URLs

**When to use:**
- First-time setup of OAuth integrations
- Adding new OAuth providers
- Updating OAuth credentials

### Environment Validation

Validates all required environment variables and OAuth credentials.

```bash
npm run validate:env
```

**What it does:**
- Checks all required environment variables
- Validates format of URLs, emails, and API keys
- Identifies missing or invalid credentials
- Provides recommendations for fixing issues

**When to use:**
- Before starting the server for the first time
- After updating environment variables
- Troubleshooting configuration issues
- CI/CD pipeline validation

## Usage Examples

### First-Time Setup

```bash
# 1. Copy example environment file
cp .env.example .env

# 2. Run OAuth setup wizard
npm run setup:oauth

# 3. Edit .env to add other required credentials
nano .env

# 4. Validate environment
npm run validate:env

# 5. Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# 6. Start the server
npm run dev
```

### Production Deployment

```bash
# Validate before deployment
npm run validate:env

# Should exit with code 0 if all OK
# Exit code 1 means configuration issues
```

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Validate Environment
  run: npm run validate:env
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    # ... other secrets
```

## Script Details

### setupOAuth.ts

**Features:**
- Color-coded terminal output
- Interactive prompts
- Automatic `.env` file updates
- Preserves existing environment variables
- Provides next steps after setup

**Requirements:**
- Node.js with TypeScript support
- `inquirer` and `chalk` packages
- Write access to `.env` file

### validateEnv.ts

**Validation Rules:**
- **URLs**: Must be valid HTTP/HTTPS URLs
- **Emails**: Must be valid email format
- **JWT Secrets**: Must be at least 32 characters
- **API Keys**: Provider-specific format validation
- **Database URL**: Must start with `postgresql://`

**Exit Codes:**
- `0`: All required variables are valid
- `1`: Missing or invalid variables detected

## Troubleshooting

### OAuth Setup Issues

**Problem**: Script can't write to `.env` file
**Solution**: Check file permissions: `chmod 644 .env`

**Problem**: OAuth apps not working after setup
**Solution**: Verify callback URLs match exactly in provider console

### Environment Validation Issues

**Problem**: Validation fails but variables are set
**Solution**: Check for:
- Trailing/leading whitespace
- Quotes in `.env` file (shouldn't be quoted)
- Special characters not properly escaped

**Problem**: "Cannot find module" error
**Solution**: Run `npm install` to install dependencies

## Security Notes

- **Never commit `.env` files** to version control
- **Rotate secrets regularly** in production
- **Use different secrets** for each environment
- **Encrypt secrets** in CI/CD pipelines
- **Limit access** to production credentials

## Development Notes

These scripts use:
- **TypeScript**: Run with `ts-node`
- **Chalk**: Terminal string styling
- **Inquirer**: Interactive prompts
- **Dotenv**: Environment variable loading

To modify scripts:
1. Edit the `.ts` files in this directory
2. Test changes: `npx ts-node scripts/scriptName.ts`
3. No compilation needed - scripts run directly

## Additional Resources

- [OAuth 2.0 Guide](../DEPLOYMENT.md#oauth-integrations)
- [Environment Setup](../README.md#environment-setup)
- [Production Checklist](../DEPLOYMENT.md#production-checklist)
