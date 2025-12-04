#!/usr/bin/env ts-node
/**
 * Environment Validation Tool
 * Validates all required environment variables and OAuth credentials
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import chalk from 'chalk';

dotenv.config({ path: path.join(__dirname, '../.env') });

interface ValidationResult {
  variable: string;
  status: 'ok' | 'missing' | 'invalid';
  message?: string;
}

const results: ValidationResult[] = [];

function validate(variable: string, required: boolean = true, validator?: (value: string) => boolean): void {
  const value = process.env[variable];

  if (!value || value.trim() === '') {
    results.push({
      variable,
      status: required ? 'missing' : 'ok',
      message: required ? 'Required but not set' : 'Optional, not set',
    });
    return;
  }

  if (validator && !validator(value)) {
    results.push({
      variable,
      status: 'invalid',
      message: 'Invalid format or value',
    });
    return;
  }

  results.push({
    variable,
    status: 'ok',
    message: '✓',
  });
}

function printHeader(title: string) {
  console.log('\n' + chalk.cyan('═'.repeat(60)));
  console.log(chalk.cyan.bold(`  ${title}`));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');
}

function printSection(title: string) {
  console.log('\n' + chalk.yellow(`▶ ${title}`) + '\n');
}

function printResults() {
  const okCount = results.filter((r) => r.status === 'ok').length;
  const missingCount = results.filter((r) => r.status === 'missing').length;
  const invalidCount = results.filter((r) => r.status === 'invalid').length;

  console.log(chalk.white('Variable Name'.padEnd(40)) + chalk.white('Status'));
  console.log('─'.repeat(60));

  for (const result of results) {
    const varName = result.variable.padEnd(40);

    if (result.status === 'ok') {
      console.log(chalk.white(varName) + chalk.green('✓ OK'));
    } else if (result.status === 'missing') {
      console.log(chalk.white(varName) + chalk.red('✗ MISSING'));
    } else {
      console.log(chalk.white(varName) + chalk.yellow('⚠ INVALID'));
    }

    if (result.message && result.status !== 'ok') {
      console.log(chalk.gray(`  ${result.message}`));
    }
  }

  console.log('─'.repeat(60));
  console.log(chalk.green(`${okCount} OK`) + chalk.gray(' | ') + chalk.red(`${missingCount} MISSING`) + chalk.gray(' | ') + chalk.yellow(`${invalidCount} INVALID`));
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function main() {
  console.clear();
  printHeader('ComplyEasy AI - Environment Validation');

  printSection('Core Configuration');
  validate('NODE_ENV', false);
  validate('PORT', false);
  validate('API_URL', false, isValidUrl);
  validate('CLIENT_URL', true, isValidUrl);

  printSection('Database');
  validate('DATABASE_URL', true, (v) => v.startsWith('postgresql://'));

  printSection('JWT Authentication');
  validate('JWT_SECRET', true, (v) => v.length >= 32);
  validate('JWT_EXPIRES_IN', false);
  validate('JWT_REFRESH_SECRET', true, (v) => v.length >= 32);
  validate('JWT_REFRESH_EXPIRES_IN', false);

  printSection('2FA Encryption');
  validate('ENCRYPTION_KEY', true, (v) => v.length >= 16);

  printSection('AI Services');
  validate('GEMINI_API_KEY', true);

  printSection('Email Service');
  validate('SENDGRID_API_KEY', true);
  validate('SENDGRID_FROM_EMAIL', true, isValidEmail);
  validate('SENDGRID_FROM_NAME', false);

  printSection('Payment Processing');
  validate('STRIPE_SECRET_KEY', true, (v) => v.startsWith('sk_'));
  validate('STRIPE_PUBLISHABLE_KEY', false, (v) => v.startsWith('pk_'));
  validate('STRIPE_WEBHOOK_SECRET', true, (v) => v.startsWith('whsec_'));
  validate('STRIPE_BASIC_PRICE_ID', false);
  validate('STRIPE_PRO_PRICE_ID', false);
  validate('STRIPE_ENTERPRISE_PRICE_ID', false);

  printSection('AWS Services');
  validate('AWS_ACCESS_KEY_ID', true);
  validate('AWS_SECRET_ACCESS_KEY', true);
  validate('AWS_REGION', false);
  validate('AWS_S3_BUCKET', true);

  printSection('OAuth Integrations - Google');
  validate('GOOGLE_CLIENT_ID', false);
  validate('GOOGLE_CLIENT_SECRET', false);
  validate('GOOGLE_CALLBACK_URL', false, isValidUrl);

  printSection('OAuth Integrations - GitHub');
  validate('GITHUB_CLIENT_ID', false);
  validate('GITHUB_CLIENT_SECRET', false);
  validate('GITHUB_CALLBACK_URL', false, isValidUrl);

  printSection('OAuth Integrations - Slack');
  validate('SLACK_CLIENT_ID', false);
  validate('SLACK_CLIENT_SECRET', false);
  validate('SLACK_CALLBACK_URL', false, isValidUrl);

  printSection('OAuth Integrations - Jira');
  validate('JIRA_CLIENT_ID', false);
  validate('JIRA_CLIENT_SECRET', false);
  validate('JIRA_CALLBACK_URL', false, isValidUrl);

  printSection('Security');
  validate('RATE_LIMIT_WINDOW_MS', false);
  validate('RATE_LIMIT_MAX_REQUESTS', false);
  validate('CORS_ORIGIN', true);

  printSection('Logging');
  validate('LOG_LEVEL', false);

  console.log('');
  printResults();

  const missingCount = results.filter((r) => r.status === 'missing').length;
  const invalidCount = results.filter((r) => r.status === 'invalid').length;

  if (missingCount > 0 || invalidCount > 0) {
    console.log('');
    console.log(chalk.yellow('⚠ Warning: Some environment variables need attention'));

    if (missingCount > 0) {
      console.log(chalk.red(`\n  ${missingCount} required variable(s) are missing`));
    }

    if (invalidCount > 0) {
      console.log(chalk.yellow(`\n  ${invalidCount} variable(s) have invalid values`));
    }

    console.log(chalk.gray('\nRecommendations:'));
    console.log('  • Copy .env.example to .env if not already done');
    console.log('  • Run ' + chalk.cyan('npm run setup:oauth') + ' to configure OAuth integrations');
    console.log('  • Check DEPLOYMENT.md for detailed setup instructions\n');

    process.exit(1);
  } else {
    console.log('');
    console.log(chalk.green('✓ All required environment variables are properly configured!'));
    console.log(chalk.gray('\nYour environment is ready for development.\n'));
    process.exit(0);
  }
}

main();
