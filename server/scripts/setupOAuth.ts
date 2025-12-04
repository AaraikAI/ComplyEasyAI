#!/usr/bin/env ts-node
/**
 * OAuth Setup Wizard
 * Interactive CLI tool to guide OAuth app creation for all providers
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
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

function printSuccess(message: string) {
  console.log(chalk.green('✓ ') + message);
}

function printWarning(message: string) {
  console.log(chalk.yellow('⚠ ') + message);
}

function printError(message: string) {
  console.log(chalk.red('✗ ') + message);
}

function printInfo(message: string) {
  console.log(chalk.blue('ℹ ') + message);
}

interface OAuthConfig {
  provider: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

const oauthConfigs: OAuthConfig[] = [];

async function setupGoogleOAuth() {
  printHeader('Google Workspace OAuth Setup');

  console.log(chalk.white('Follow these steps to create a Google OAuth app:\n'));

  console.log('1. Go to: ' + chalk.underline('https://console.cloud.google.com'));
  console.log('2. Create a new project or select existing');
  console.log('3. Enable the following APIs:');
  console.log('   - Google Workspace Admin SDK');
  console.log('   - Google Drive API');
  console.log('   - Admin Reports API');
  console.log('4. Go to "Credentials" > "Create Credentials" > "OAuth client ID"');
  console.log('5. Application type: Web application');
  console.log('6. Add authorized redirect URI:\n');

  const callbackUrl = `http://localhost:5000/api/integrations/google/callback`;
  console.log(chalk.cyan(`   ${callbackUrl}\n`));

  const answer = await question(chalk.yellow('Have you completed these steps? (y/n): '));

  if (answer.toLowerCase() !== 'y') {
    printWarning('Skipping Google OAuth setup');
    return;
  }

  const clientId = await question('Enter Google Client ID: ');
  const clientSecret = await question('Enter Google Client Secret: ');

  oauthConfigs.push({
    provider: 'google',
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    callbackUrl,
  });

  printSuccess('Google OAuth configuration saved');
}

async function setupGitHubOAuth() {
  printHeader('GitHub OAuth Setup');

  console.log(chalk.white('Follow these steps to create a GitHub OAuth app:\n'));

  console.log('1. Go to: ' + chalk.underline('https://github.com/settings/developers'));
  console.log('2. Click "New OAuth App"');
  console.log('3. Fill in:');
  console.log('   - Application name: ComplyEasy AI');
  console.log('   - Homepage URL: http://localhost:3000');
  console.log('   - Authorization callback URL:\n');

  const callbackUrl = `http://localhost:5000/api/integrations/github/callback`;
  console.log(chalk.cyan(`   ${callbackUrl}\n`));

  const answer = await question(chalk.yellow('Have you completed these steps? (y/n): '));

  if (answer.toLowerCase() !== 'y') {
    printWarning('Skipping GitHub OAuth setup');
    return;
  }

  const clientId = await question('Enter GitHub Client ID: ');
  const clientSecret = await question('Enter GitHub Client Secret: ');

  oauthConfigs.push({
    provider: 'github',
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    callbackUrl,
  });

  printSuccess('GitHub OAuth configuration saved');
}

async function setupSlackOAuth() {
  printHeader('Slack OAuth Setup');

  console.log(chalk.white('Follow these steps to create a Slack OAuth app:\n'));

  console.log('1. Go to: ' + chalk.underline('https://api.slack.com/apps'));
  console.log('2. Click "Create New App" > "From scratch"');
  console.log('3. Add OAuth scopes in "OAuth & Permissions":');
  console.log('   - channels:read, channels:history, chat:write');
  console.log('   - users:read, users:read.email, team:read');
  console.log('4. Add redirect URL:\n');

  const callbackUrl = `http://localhost:5000/api/integrations/slack/callback`;
  console.log(chalk.cyan(`   ${callbackUrl}\n`));

  console.log('5. Get Client ID and Client Secret from "Basic Information"\n');

  const answer = await question(chalk.yellow('Have you completed these steps? (y/n): '));

  if (answer.toLowerCase() !== 'y') {
    printWarning('Skipping Slack OAuth setup');
    return;
  }

  const clientId = await question('Enter Slack Client ID: ');
  const clientSecret = await question('Enter Slack Client Secret: ');

  oauthConfigs.push({
    provider: 'slack',
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    callbackUrl,
  });

  printSuccess('Slack OAuth configuration saved');
}

async function setupJiraOAuth() {
  printHeader('Jira (Atlassian) OAuth Setup');

  console.log(chalk.white('Follow these steps to create a Jira OAuth app:\n'));

  console.log('1. Go to: ' + chalk.underline('https://developer.atlassian.com/console/myapps/'));
  console.log('2. Click "Create" > "OAuth 2.0 integration"');
  console.log('3. Add permissions:');
  console.log('   - Jira API: read:jira-user, read:jira-work, write:jira-work');
  console.log('4. Add callback URL:\n');

  const callbackUrl = `http://localhost:5000/api/integrations/jira/callback`;
  console.log(chalk.cyan(`   ${callbackUrl}\n`));

  const answer = await question(chalk.yellow('Have you completed these steps? (y/n): '));

  if (answer.toLowerCase() !== 'y') {
    printWarning('Skipping Jira OAuth setup');
    return;
  }

  const clientId = await question('Enter Jira Client ID: ');
  const clientSecret = await question('Enter Jira Client Secret: ');

  oauthConfigs.push({
    provider: 'jira',
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    callbackUrl,
  });

  printSuccess('Jira OAuth configuration saved');
}

function generateEnvContent(): string {
  let content = '# OAuth Integration Credentials\n';
  content += '# Generated by OAuth Setup Wizard\n\n';

  for (const config of oauthConfigs) {
    const providerUpper = config.provider.toUpperCase();
    content += `${providerUpper}_CLIENT_ID=${config.clientId}\n`;
    content += `${providerUpper}_CLIENT_SECRET=${config.clientSecret}\n`;
    content += `${providerUpper}_CALLBACK_URL=${config.callbackUrl}\n\n`;
  }

  return content;
}

async function saveToEnv() {
  printSection('Saving Configuration');

  const envPath = path.join(__dirname, '../.env');
  const envExamplePath = path.join(__dirname, '../.env.example');

  let existingEnv = '';
  if (fs.existsSync(envPath)) {
    existingEnv = fs.readFileSync(envPath, 'utf-8');
  }

  const newContent = generateEnvContent();

  // Update or append
  const lines = existingEnv.split('\n');
  const updatedLines: string[] = [];
  const addedProviders = new Set<string>();

  for (const line of lines) {
    let updated = false;
    for (const config of oauthConfigs) {
      const providerUpper = config.provider.toUpperCase();

      if (line.startsWith(`${providerUpper}_CLIENT_ID=`)) {
        updatedLines.push(`${providerUpper}_CLIENT_ID=${config.clientId}`);
        updated = true;
        addedProviders.add(`${providerUpper}_CLIENT_ID`);
      } else if (line.startsWith(`${providerUpper}_CLIENT_SECRET=`)) {
        updatedLines.push(`${providerUpper}_CLIENT_SECRET=${config.clientSecret}`);
        updated = true;
        addedProviders.add(`${providerUpper}_CLIENT_SECRET`);
      } else if (line.startsWith(`${providerUpper}_CALLBACK_URL=`)) {
        updatedLines.push(`${providerUpper}_CALLBACK_URL=${config.callbackUrl}`);
        updated = true;
        addedProviders.add(`${providerUpper}_CALLBACK_URL`);
      }
    }

    if (!updated) {
      updatedLines.push(line);
    }
  }

  // Add new providers not in existing file
  for (const config of oauthConfigs) {
    const providerUpper = config.provider.toUpperCase();

    if (!addedProviders.has(`${providerUpper}_CLIENT_ID`)) {
      updatedLines.push('');
      updatedLines.push(`# ${config.provider.charAt(0).toUpperCase() + config.provider.slice(1)} OAuth`);
      updatedLines.push(`${providerUpper}_CLIENT_ID=${config.clientId}`);
      updatedLines.push(`${providerUpper}_CLIENT_SECRET=${config.clientSecret}`);
      updatedLines.push(`${providerUpper}_CALLBACK_URL=${config.callbackUrl}`);
    }
  }

  fs.writeFileSync(envPath, updatedLines.join('\n'));

  printSuccess(`OAuth credentials saved to ${chalk.cyan('.env')}`);
  printInfo(`Updated ${oauthConfigs.length} OAuth configuration(s)`);
}

async function main() {
  console.clear();

  printHeader('ComplyEasy AI - OAuth Setup Wizard');

  console.log(chalk.white('This wizard will help you set up OAuth integrations for:'));
  console.log('  • Google Workspace');
  console.log('  • GitHub');
  console.log('  • Slack');
  console.log('  • Jira (Atlassian)\n');

  printWarning('Make sure you have admin access to create OAuth apps in each service');

  const proceed = await question(chalk.yellow('\nDo you want to proceed? (y/n): '));

  if (proceed.toLowerCase() !== 'y') {
    console.log(chalk.gray('\nSetup cancelled.'));
    rl.close();
    return;
  }

  // Run setup for each provider
  await setupGoogleOAuth();
  await setupGitHubOAuth();
  await setupSlackOAuth();
  await setupJiraOAuth();

  if (oauthConfigs.length > 0) {
    console.log('');
    await saveToEnv();

    printSection('Next Steps');
    console.log('1. Update production callback URLs when deploying');
    console.log('2. Run ' + chalk.cyan('npm run validate:env') + ' to verify all credentials');
    console.log('3. Start the server with ' + chalk.cyan('npm run dev'));
    console.log('4. Test OAuth flows from the frontend\n');
  } else {
    printWarning('No OAuth configurations were set up');
  }

  printSuccess('OAuth setup wizard completed!');

  rl.close();
}

main().catch((error) => {
  printError(`Setup failed: ${error.message}`);
  rl.close();
  process.exit(1);
});
