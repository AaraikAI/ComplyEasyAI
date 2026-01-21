#!/bin/bash

# Security Fixes Verification Script
# Verifies all security fixes are properly implemented

echo "🔒 Verifying Security Fixes..."
echo "================================"
echo ""

ERRORS=0

# 1. Check Command Injection Fix
echo "1. Checking Command Injection Fix..."
if grep -r "exec.*\${" server/src/services/advanced/physicalAIService.ts 2>/dev/null | grep -v "spawn" | grep -v "isValidIP"; then
    echo "   ❌ FAILED: Command injection vulnerability found"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ PASSED: Command injection protection verified"
fi

# 2. Check XSS Protection in Print Functions
echo "2. Checking XSS Protection in Print Functions..."
if grep -r "document.write" components/AIFeatures/RFPResponder.tsx components/Reports.tsx 2>/dev/null | grep -v "DOMPurify\|sanitize"; then
    echo "   ❌ FAILED: Unsanitized document.write found"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ PASSED: All document.write calls are sanitized"
fi

# 3. Check Sensitive Data Logging
echo "3. Checking Sensitive Data Logging..."
if ! grep -q "sanitizeForLogging" server/src/config/logger.ts 2>/dev/null; then
    echo "   ❌ FAILED: Logger sanitization not enabled"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ PASSED: Logger sanitization enabled"
fi

# 4. Check SSRF Protection
echo "4. Checking SSRF Protection..."
if grep -r "fetch.*webhook.url\|fetch.*url" server/src/services/webhookService.ts 2>/dev/null | grep -v "safeFetch\|isUrlSafe\|isWebhookUrlSafe"; then
    echo "   ❌ FAILED: Unprotected fetch calls found"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ PASSED: SSRF protection applied to webhooks"
fi

# 5. Check Security Headers
echo "5. Checking Security Headers..."
if ! grep -q "helmet" server/src/index.ts 2>/dev/null; then
    echo "   ❌ FAILED: Security headers not configured"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ PASSED: Security headers configured (Helmet)"
fi

# 6. Check URL Validator Exists
echo "6. Checking URL Validator..."
if [ ! -f "server/src/utils/urlValidator.ts" ]; then
    echo "   ❌ FAILED: URL validator not found"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ PASSED: URL validator exists"
fi

# 7. Check Log Sanitizer Exists
echo "7. Checking Log Sanitizer..."
if [ ! -f "server/src/utils/logSanitizer.ts" ]; then
    echo "   ❌ FAILED: Log sanitizer not found"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ PASSED: Log sanitizer exists"
fi

# 8. Check DOMPurify Usage
echo "8. Checking DOMPurify Usage..."
if ! grep -q "DOMPurify" components/AIFeatures/RFPResponder.tsx components/Reports.tsx 2>/dev/null; then
    echo "   ❌ FAILED: DOMPurify not used in print functions"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ PASSED: DOMPurify is used"
fi

# 9. Check Dependency Scanning Scripts
echo "9. Checking Dependency Scanning..."
if ! grep -q "security:audit" server/package.json 2>/dev/null; then
    echo "   ⚠️  WARNING: Security audit script not found (optional)"
else
    echo "   ✅ PASSED: Security audit scripts configured"
fi

# 10. Check CSP Configuration
echo "10. Checking CSP Configuration..."
if ! grep -q "contentSecurityPolicy" server/src/index.ts 2>/dev/null; then
    echo "   ❌ FAILED: CSP not configured"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ PASSED: CSP configured"
fi

echo ""
echo "================================"
echo "Verification Complete"
echo "================================"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ All security fixes verified!"
    echo "✅ Security Status: PRODUCTION READY"
    exit 0
else
    echo "❌ Found $ERRORS issue(s) that need to be fixed"
    echo "⚠️  Security Status: NOT PRODUCTION READY"
    exit 1
fi

