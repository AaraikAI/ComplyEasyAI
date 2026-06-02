#!/usr/bin/env node
/**
 * Security Audit Script
 * Performs comprehensive security checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Security Audit...\n');

const auditResults = {
  dependencyVulnerabilities: [],
  securityHeaders: [],
  environmentSecurity: [],
  recommendations: [],
};

// 1. Dependency Vulnerability Scan
console.log('1. Scanning dependencies for vulnerabilities...');
try {
  const auditOutput = execSync('npm audit --json', { encoding: 'utf-8' });
  const auditData = JSON.parse(auditOutput);
  
  if (auditData.vulnerabilities) {
    // npm audit v7+ keys `vulnerabilities` by package name, so its length is the
    // count of affected packages. The true vulnerability total lives under
    // metadata.vulnerabilities.total.
    const totals = (auditData.metadata && auditData.metadata.vulnerabilities) || {};
    const vulnCount = totals.total != null
      ? totals.total
      : Object.keys(auditData.vulnerabilities).length;
    const affectedPackages = Object.keys(auditData.vulnerabilities).length;
    console.log(`   Found ${vulnCount} vulnerabilities across ${affectedPackages} packages`);

    Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
      if (vuln.severity === 'high' || vuln.severity === 'critical') {
        // In v7+ advisory detail (title/url) lives on the `via` entries, which
        // are either advisory objects or plain dependency-name strings.
        const advisory = Array.isArray(vuln.via)
          ? vuln.via.find((v) => v && typeof v === 'object')
          : null;
        const title = advisory ? advisory.title : `Vulnerable dependency: ${pkg}`;
        // fixAvailable may be a boolean or an object describing the fixing version.
        let patched;
        if (vuln.fixAvailable && typeof vuln.fixAvailable === 'object') {
          patched = `${vuln.fixAvailable.name}@${vuln.fixAvailable.version}`;
        } else if (vuln.fixAvailable === true) {
          patched = 'run `npm audit fix`';
        }

        auditResults.dependencyVulnerabilities.push({
          package: pkg,
          severity: vuln.severity,
          title,
          patched,
        });
      }
    });
  } else {
    console.log('   ✅ No vulnerabilities found');
  }
} catch (error) {
  console.log('   ⚠️  Could not run npm audit');
}

// 2. Security Headers Check
console.log('\n2. Checking security headers configuration...');
const indexFile = path.join(__dirname, '../src/index.ts');
if (fs.existsSync(indexFile)) {
  const content = fs.readFileSync(indexFile, 'utf-8');
  
  const checks = [
    { name: 'Helmet.js', pattern: /helmet/i, found: false },
    { name: 'CORS', pattern: /cors/i, found: false },
    { name: 'Rate Limiting', pattern: /rateLimit|rate-limit/i, found: false },
  ];

  checks.forEach(check => {
    check.found = check.pattern.test(content);
    if (check.found) {
      console.log(`   ✅ ${check.name} configured`);
    } else {
      console.log(`   ⚠️  ${check.name} not found`);
      auditResults.recommendations.push(`Configure ${check.name}`);
    }
  });
}

// 3. Environment Variable Security
console.log('\n3. Checking environment variable security...');
const envExample = path.join(__dirname, '../.env.example');
const gitignore = path.join(__dirname, '../../.gitignore');

if (fs.existsSync(envExample)) {
  console.log('   ✅ .env.example exists');
} else {
  console.log('   ⚠️  .env.example not found');
  auditResults.recommendations.push('Create .env.example file');
}

if (fs.existsSync(gitignore)) {
  const gitignoreContent = fs.readFileSync(gitignore, 'utf-8');
  if (gitignoreContent.includes('.env')) {
    console.log('   ✅ .env files are in .gitignore');
  } else {
    console.log('   ⚠️  .env files not in .gitignore');
    auditResults.recommendations.push('Add .env to .gitignore');
  }
}

// 4. Generate Report
console.log('\n📊 Security Audit Report');
console.log('='.repeat(60));

if (auditResults.dependencyVulnerabilities.length > 0) {
  console.log('\n⚠️  High/Critical Vulnerabilities:');
  auditResults.dependencyVulnerabilities.forEach((vuln, i) => {
    console.log(`\n${i + 1}. ${vuln.package}`);
    console.log(`   Severity: ${vuln.severity}`);
    console.log(`   Issue: ${vuln.title}`);
    if (vuln.patched) {
      console.log(`   Fix: Update to ${vuln.patched}`);
    }
  });
} else {
  console.log('\n✅ No high/critical vulnerabilities found');
}

if (auditResults.recommendations.length > 0) {
  console.log('\n💡 Recommendations:');
  auditResults.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });
}

console.log('\n✅ Security audit complete!');
console.log('\nNext steps:');
console.log('1. Run: npm audit fix (for auto-fixable issues)');
console.log('2. Review and update vulnerable packages manually');
console.log('3. Review security headers configuration');
console.log('4. Ensure all secrets are in .env (not committed)');

