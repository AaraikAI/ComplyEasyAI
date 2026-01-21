# 🛡️ WEB APPLICATION FIREWALL (WAF) SETUP GUIDE

**Purpose:** Protect the application from common web attacks and malicious traffic.

---

## 📊 OVERVIEW

A WAF sits between your application and the internet, filtering and blocking malicious requests before they reach your servers.

---

## 🎯 RECOMMENDED WAF SOLUTIONS

### 1. Cloudflare WAF (Recommended)

**Pros:**
- ✅ Free tier available
- ✅ Easy setup
- ✅ DDoS protection included
- ✅ Global CDN
- ✅ Bot management

**Pricing:**
- Free: Basic protection
- Pro: $20/month - Advanced WAF rules
- Business: $200/month - Custom rules
- Enterprise: Custom pricing

**Setup Steps:**

1. **Sign up for Cloudflare**
   - Go to https://cloudflare.com
   - Add your domain
   - Update DNS nameservers

2. **Enable WAF**
   - Dashboard → Security → WAF
   - Enable "Managed Rules"
   - Enable "OWASP Core Rule Set"

3. **Configure Rules**

   **Recommended Rules:**
   ```
   - Block SQL injection attempts
   - Block XSS attempts
   - Block command injection
   - Block SSRF attempts
   - Rate limit by IP
   - Block known bad bots
   ```

4. **Custom Rules (Pro/Business)**

   ```javascript
   // Block suspicious user agents
   (http.user_agent contains "sqlmap" or 
    http.user_agent contains "nikto" or
    http.user_agent contains "nmap")

   // Block common attack patterns
   (http.request.uri.path contains "../" or
    http.request.uri.path contains "cmd=" or
    http.request.uri.path contains "exec=")
   ```

---

### 2. AWS WAF

**Pros:**
- ✅ Native AWS integration
- ✅ Pay-per-use pricing
- ✅ Highly customizable

**Cons:**
- ❌ Requires AWS infrastructure
- ❌ More complex setup

**Setup Steps:**

1. **Create WAF Web ACL**
   ```bash
   aws wafv2 create-web-acl \
     --name complyeasy-waf \
     --scope REGIONAL \
     --default-action Allow={} \
     --rules file://waf-rules.json
   ```

2. **Attach to Application Load Balancer**
   ```bash
   aws wafv2 associate-web-acl \
     --web-acl-arn arn:aws:wafv2:... \
     --resource-arn arn:aws:elasticloadbalancing:...
   ```

3. **Recommended Rules:**
   - AWS Managed Rules - Core Rule Set
   - AWS Managed Rules - Known Bad Inputs
   - AWS Managed Rules - Linux Operating System
   - Rate-based rules (1000 requests/5 minutes)

---

### 3. ModSecurity (Self-Hosted)

**Pros:**
- ✅ Free and open source
- ✅ Highly customizable
- ✅ Full control

**Cons:**
- ❌ Requires technical expertise
- ❌ Self-maintenance required

**Setup Steps:**

1. **Install ModSecurity**
   ```bash
   # Ubuntu/Debian
   apt-get install libapache2-mod-security2
   
   # Enable module
   a2enmod security2
   ```

2. **Configure Rules**
   ```bash
   # Download OWASP Core Rule Set
   cd /etc/modsecurity
   git clone https://github.com/coreruleset/coreruleset.git
   
   # Configure modsecurity.conf
   SecRuleEngine On
   SecRequestBodyAccess On
   SecResponseBodyAccess On
   ```

---

## 🚀 RECOMMENDED: CLOUDFLARE WAF SETUP

### Step 1: Add Domain to Cloudflare

1. Sign up at https://dash.cloudflare.com
2. Add your domain (e.g., `complyeasyai.com`)
3. Cloudflare will scan your DNS records
4. Update your domain's nameservers to Cloudflare's

### Step 2: Enable WAF

1. Go to **Security** → **WAF**
2. Enable **Managed Rules**
3. Enable **OWASP Core Rule Set**
4. Set action to **Block** for high severity

### Step 3: Configure Rate Limiting

1. Go to **Security** → **Rate Limiting**
2. Create rule:
   - **Rule name:** API Rate Limit
   - **Match:** URI path starts with `/api/`
   - **Threshold:** 100 requests per minute
   - **Action:** Block for 1 hour

### Step 4: Bot Management (Business/Enterprise)

1. Go to **Security** → **Bots**
2. Enable **Bot Fight Mode** (Free tier)
3. Or **Super Bot Fight Mode** (Pro+)

### Step 5: Custom Firewall Rules

**Example Rules:**

```javascript
// Block SQL injection attempts
(http.request.uri.query contains "union select" or
 http.request.uri.query contains "drop table" or
 http.request.uri.query contains "exec(")

// Block XSS attempts
(http.request.uri.query contains "<script" or
 http.request.uri.query contains "javascript:" or
 http.request.body contains "<script")

// Block command injection
(http.request.uri.query contains "; rm -rf" or
 http.request.uri.query contains "| cat /etc/passwd" or
 http.request.uri.query contains "&& wget")

// Block SSRF attempts
(http.request.uri.query contains "169.254.169.254" or
 http.request.uri.query contains "localhost" or
 http.request.uri.query contains "127.0.0.1")
```

---

## 🔧 APPLICATION-LEVEL WAF (Alternative)

If you can't use a cloud WAF, implement application-level protection:

**File:** `server/src/middleware/wafMiddleware.ts` (Create)

```typescript
import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../utils/securityEventLogger';

// Blocked patterns
const BLOCKED_PATTERNS = [
  /union.*select/i,
  /drop.*table/i,
  /exec\(/i,
  /<script/i,
  /javascript:/i,
  /\.\.\//g, // Path traversal
  /169\.254\.169\.254/, // AWS metadata
  /localhost/i,
  /127\.0\.0\.1/,
];

export function wafMiddleware(req: Request, res: Response, next: NextFunction) {
  const checkString = [
    req.url,
    JSON.stringify(req.query),
    JSON.stringify(req.body),
    req.headers['user-agent'] || '',
  ].join(' ');

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(checkString)) {
      // Log security event
      logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          pattern: pattern.toString(),
          url: req.url,
          method: req.method,
        },
        timestamp: new Date(),
      });

      // Block request
      return res.status(403).json({
        error: 'Request blocked by security policy',
      });
    }
  }

  next();
}
```

**Apply to Express app:**

```typescript
// server/src/index.ts
import { wafMiddleware } from './middleware/wafMiddleware';

app.use(wafMiddleware);
```

---

## 📊 WAF RULES CONFIGURATION

### OWASP Top 10 Protection

1. **Injection Attacks**
   - SQL injection
   - Command injection
   - LDAP injection

2. **Broken Authentication**
   - Brute force protection
   - Session fixation
   - Credential stuffing

3. **Sensitive Data Exposure**
   - Credit card detection
   - SSN detection
   - API key detection

4. **XML External Entities (XXE)**
   - Block XML parsing attacks

5. **Broken Access Control**
   - Path traversal
   - Insecure direct object references

6. **Security Misconfiguration**
   - Default credentials
   - Exposed debug info

7. **XSS (Cross-Site Scripting)**
   - Reflected XSS
   - Stored XSS
   - DOM-based XSS

8. **Insecure Deserialization**
   - Object injection
   - Remote code execution

9. **Using Components with Known Vulnerabilities**
   - Dependency scanning integration

10. **Insufficient Logging & Monitoring**
    - Security event logging

---

## 🚨 ALERTING

### Configure WAF Alerts

**Cloudflare:**
1. Go to **Notifications**
2. Create alert:
   - **Trigger:** WAF blocked request
   - **Threshold:** 10 blocks in 5 minutes
   - **Channel:** Email/Slack/PagerDuty

**AWS WAF:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name waf-blocked-requests \
  --metric-name BlockedRequests \
  --namespace AWS/WAFV2 \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## 📋 SETUP CHECKLIST

- [ ] Choose WAF solution (Cloudflare recommended)
- [ ] Add domain to WAF provider
- [ ] Enable managed rules (OWASP Core Rule Set)
- [ ] Configure rate limiting
- [ ] Set up custom rules
- [ ] Configure bot management
- [ ] Set up alerting
- [ ] Test WAF rules
- [ ] Monitor false positives
- [ ] Document WAF configuration

---

## 🎯 RECOMMENDED CONFIGURATION

### Cloudflare Free Tier
- ✅ Managed Rules (OWASP)
- ✅ Bot Fight Mode
- ✅ Rate Limiting (100 req/min)
- ✅ DDoS Protection

### Cloudflare Pro ($20/month)
- ✅ Everything in Free
- ✅ Custom Firewall Rules
- ✅ Advanced Rate Limiting
- ✅ Enhanced Bot Management

### Cloudflare Business ($200/month)
- ✅ Everything in Pro
- ✅ Advanced Custom Rules
- ✅ Logpush (SIEM integration)
- ✅ Priority Support

---

## 📚 RESOURCES

- **Cloudflare WAF:** https://www.cloudflare.com/waf/
- **AWS WAF:** https://aws.amazon.com/waf/
- **ModSecurity:** https://modsecurity.org/
- **OWASP Core Rule Set:** https://coreruleset.org/

---

## ✅ VERIFICATION

Test WAF is working:

```bash
# Test SQL injection (should be blocked)
curl "https://complyeasyai.com/api/users?id=1' OR '1'='1"

# Test XSS (should be blocked)
curl "https://complyeasyai.com/api/search?q=<script>alert('xss')</script>"

# Test command injection (should be blocked)
curl "https://complyeasyai.com/api/test?ip=8.8.8.8; rm -rf /"
```

All should return 403 Forbidden or be blocked.

---

**Next Steps:**
1. Sign up for Cloudflare (or chosen WAF)
2. Add domain and enable WAF
3. Configure rules
4. Test and validate
5. Monitor and tune

