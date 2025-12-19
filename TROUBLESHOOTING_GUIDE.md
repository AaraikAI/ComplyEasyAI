# ComplyEasy AI - Troubleshooting Guide

This guide helps diagnose and resolve common issues with ComplyEasy AI.

---

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Authentication Issues](#authentication-issues)
3. [Database Issues](#database-issues)
4. [API Issues](#api-issues)
5. [Performance Issues](#performance-issues)
6. [Integration Issues](#integration-issues)
7. [Deployment Issues](#deployment-issues)
8. [Error Codes Reference](#error-codes-reference)

---

## Quick Diagnosis

### Health Check

```bash
# Check application health
curl http://localhost:3001/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-12-18T00:00:00Z",
  "uptime": 3600,
  "environment": "development",
  "websocket": "connected"
}
```

### Common Commands

```bash
# Check logs
cd server
npm run dev  # Development logs

# Check database connection
npx prisma studio  # Opens Prisma Studio

# Validate environment
npm run validate:env

# Check for errors
grep -r "ERROR" logs/
```

---

## Authentication Issues

### Issue: "Authentication required" Error

**Symptoms:**
- 401 Unauthorized errors
- Token validation failures

**Diagnosis:**
```bash
# Check if token is being sent
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/risks

# Verify token format
echo $TOKEN | cut -d. -f1 | base64 -d  # Should show header
```

**Solutions:**

1. **Token Not Sent**
   ```javascript
   // Ensure Authorization header is included
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

2. **Token Expired**
   ```bash
   # Refresh token
   curl -X POST http://localhost:3001/api/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken": "your-refresh-token"}'
   ```

3. **Invalid Token**
   - Verify JWT_SECRET matches between environments
   - Check token hasn't been tampered with
   - Ensure token is from correct environment

### Issue: Magic Link Not Working

**Symptoms:**
- Magic link email not received
- Token verification fails
- "Invalid token" error

**Diagnosis:**
```bash
# Check email service configuration
npm run validate:env | grep SENDGRID

# Check email logs
grep "sendMagicLink" logs/

# In development, check for devToken in response
curl -X POST http://localhost:3001/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Solutions:**

1. **Email Not Sending**
   - Verify SENDGRID_API_KEY is set
   - Check SendGrid account status
   - Verify sender email is verified in SendGrid
   - Check spam folder

2. **Token Expired**
   - Magic link tokens expire after 1 hour
   - Request a new magic link

3. **Development Testing**
   - Use `devToken` from API response
   - Or check database for token:
     ```sql
     SELECT * FROM "MagicLinkToken" WHERE email = 'test@example.com' ORDER BY expiresAt DESC;
     ```

### Issue: 2FA Not Working

**Symptoms:**
- QR code not displaying
- Token verification fails
- Backup codes not working

**Diagnosis:**
```bash
# Check 2FA status
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/2fa/status

# Verify encryption key
echo $ENCRYPTION_KEY | wc -c  # Should be >= 16 characters
```

**Solutions:**

1. **QR Code Not Displaying**
   - Check ENCRYPTION_KEY is set
   - Verify QR code library is installed
   - Check browser console for errors

2. **Token Verification Fails**
   - Ensure time is synchronized (NTP)
   - Check token is entered correctly
   - Verify 2FA secret is correct

3. **Backup Codes Not Working**
   - Codes are single-use
   - Regenerate if needed:
     ```bash
     curl -X POST http://localhost:3001/api/2fa/regenerate-codes \
       -H "Authorization: Bearer $TOKEN"
     ```

---

## Database Issues

### Issue: Database Connection Failed

**Symptoms:**
- "Connection refused" errors
- "Authentication failed" errors
- Health check shows database as unhealthy

**Diagnosis:**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection string format
echo $DATABASE_URL | grep -E "^postgresql://"

# Check Prisma connection
npx prisma db pull
```

**Solutions:**

1. **Connection String Issues**
   - Verify DATABASE_URL format: `postgresql://user:password@host:port/database?sslmode=require`
   - URL-encode special characters in password
   - Check SSL mode requirements

2. **Network Issues**
   - Verify database is accessible
   - Check firewall rules
   - Test with `telnet` or `nc`:
     ```bash
     telnet db-host 5432
     ```

3. **Authentication Issues**
   - Verify database credentials
   - Check user permissions
   - Ensure database exists

### Issue: Migration Errors

**Symptoms:**
- Migration fails
- Schema out of sync
- Prisma errors

**Diagnosis:**
```bash
# Check migration status
npx prisma migrate status

# Check for pending migrations
npx prisma migrate diff --from-schema-datamodel --to-schema-datasource
```

**Solutions:**

1. **Migration Conflicts**
   ```bash
   # Reset database (development only!)
   npx prisma migrate reset
   
   # Or resolve manually
   npx prisma migrate resolve --applied <migration-name>
   ```

2. **Schema Drift**
   ```bash
   # Pull current schema
   npx prisma db pull
   
   # Generate Prisma Client
   npx prisma generate
   
   # Create migration
   npx prisma migrate dev --name fix-schema
   ```

3. **Production Migration**
   ```bash
   # Always backup first!
   pg_dump $DATABASE_URL > backup.sql
   
   # Apply migrations
   npx prisma migrate deploy
   ```

### Issue: Slow Queries

**Symptoms:**
- API responses slow
- Database CPU high
- Timeout errors

**Diagnosis:**
```bash
# Profile queries
npm run performance:profile

# Check slow query log (PostgreSQL)
# Enable in postgresql.conf:
# log_min_duration_statement = 100
```

**Solutions:**

1. **Add Indexes**
   ```sql
   -- Example: Add index for frequently queried field
   CREATE INDEX idx_risk_severity ON "RiskItem"("severity");
   CREATE INDEX idx_risk_organization ON "RiskItem"("organizationId");
   ```

2. **Optimize Queries**
   - Use `select()` to limit fields
   - Implement pagination
   - Avoid N+1 queries
   - Use `include` judiciously

3. **Connection Pooling**
   - Adjust Prisma connection pool size
   - Monitor pool usage
   - Scale database if needed

---

## API Issues

### Issue: 404 Not Found

**Symptoms:**
- Endpoint not found
- Route not matching

**Diagnosis:**
```bash
# Check route registration
grep -r "router.use('/api/risks" server/src/

# Verify base URL
curl http://localhost:3001/api/risks  # Should work
curl http://localhost:3001/risks      # Should 404
```

**Solutions:**

1. **Wrong Base URL**
   - Use `/api` prefix: `http://localhost:3001/api/risks`
   - Check API_BASE_URL in frontend

2. **Route Not Registered**
   - Verify route is imported in `server/src/index.ts`
   - Check route file exists
   - Restart server after adding routes

### Issue: 400 Bad Request

**Symptoms:**
- Validation errors
- Invalid request data

**Diagnosis:**
```bash
# Check request body
curl -X POST http://localhost:3001/api/risks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Test"}' \
  -v
```

**Solutions:**

1. **Missing Required Fields**
   - Check API documentation for required fields
   - Verify request body matches schema
   - Check validation error messages

2. **Invalid Data Types**
   - Verify data types match schema
   - Check enum values
   - Validate date formats

### Issue: 429 Too Many Requests

**Symptoms:**
- Rate limit exceeded
- "Too many requests" error

**Diagnosis:**
```bash
# Check rate limit headers
curl -I http://localhost:3001/api/risks \
  -H "Authorization: Bearer $TOKEN"
```

**Solutions:**

1. **Wait for Rate Limit Reset**
   - Check `X-RateLimit-Reset` header
   - Wait until reset time

2. **Adjust Rate Limits**
   - Modify rate limit configuration
   - Contact support for limit increase
   - Use API key for higher limits

### Issue: 500 Internal Server Error

**Symptoms:**
- Server errors
- Unexpected failures

**Diagnosis:**
```bash
# Check server logs
tail -f logs/error.log

# Check application logs
kubectl logs -f deployment/complyeasy-api

# Check for unhandled errors
grep "ERROR" logs/ | tail -20
```

**Solutions:**

1. **Check Logs**
   - Review error messages
   - Check stack traces
   - Identify failing component

2. **Common Causes**
   - Database connection issues
   - Missing environment variables
   - External API failures
   - Memory issues

3. **Temporary Fixes**
   - Restart application
   - Scale up resources
   - Check external dependencies

---

## Performance Issues

### Issue: Slow Response Times

**Symptoms:**
- API responses > 1 second
- Timeout errors
- User complaints

**Diagnosis:**
```bash
# Profile database queries
npm run performance:profile

# Check response times
curl -w "@curl-format.txt" http://localhost:3001/api/risks

# Load test
npm run performance:load
```

**Solutions:**

1. **Database Optimization**
   - Add missing indexes
   - Optimize slow queries
   - Enable query caching
   - Scale database

2. **Application Optimization**
   - Enable response caching
   - Optimize API endpoints
   - Reduce payload sizes
   - Implement pagination

3. **Infrastructure**
   - Scale application instances
   - Increase memory/CPU
   - Use CDN for static assets
   - Enable compression

### Issue: High Memory Usage

**Symptoms:**
- Application crashes
- Out of memory errors
- Slow performance

**Diagnosis:**
```bash
# Check memory usage
kubectl top pods

# Check for memory leaks
node --inspect server/dist/index.js
# Use Chrome DevTools to profile
```

**Solutions:**

1. **Identify Memory Leaks**
   - Profile with Node.js inspector
   - Check for unclosed connections
   - Review event listeners
   - Check for circular references

2. **Optimize Memory Usage**
   - Limit result set sizes
   - Clear caches periodically
   - Close database connections properly
   - Use streaming for large data

3. **Scale Resources**
   - Increase memory limits
   - Scale horizontally
   - Use memory-efficient algorithms

---

## Integration Issues

### Issue: OAuth Integration Fails

**Symptoms:**
- OAuth flow doesn't start
- Callback fails
- Token exchange errors

**Diagnosis:**
```bash
# Check OAuth configuration
npm run validate:env | grep -E "GOOGLE|GITHUB|SLACK|JIRA"

# Check callback URL
echo $GOOGLE_CALLBACK_URL
# Should match OAuth app configuration
```

**Solutions:**

1. **Callback URL Mismatch**
   - Verify callback URL in OAuth app matches environment variable
   - Check for trailing slashes
   - Verify protocol (http vs https)

2. **Invalid Credentials**
   - Verify CLIENT_ID and CLIENT_SECRET
   - Check credentials are for correct environment
   - Ensure credentials haven't expired

3. **Network Issues**
   - Check firewall rules
   - Verify OAuth provider is accessible
   - Check for proxy issues

### Issue: Webhook Not Receiving Events

**Symptoms:**
- Webhook endpoint not called
- Events not processed
- 404 errors in webhook logs

**Diagnosis:**
```bash
# Check webhook endpoint
curl -X POST http://localhost:3001/api/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'

# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET
```

**Solutions:**

1. **Webhook URL Not Configured**
   - Verify webhook URL in provider dashboard
   - Check URL is publicly accessible
   - Verify SSL certificate

2. **Webhook Secret Mismatch**
   - Verify webhook secret matches
   - Check secret is for correct environment
   - Regenerate if needed

3. **Webhook Not Verified**
   - Check webhook signature verification
   - Verify request body is raw (not parsed)
   - Check middleware configuration

---

## Deployment Issues

### Issue: Deployment Fails

**Symptoms:**
- Pods not starting
- Health checks failing
- Deployment timeout

**Diagnosis:**
```bash
# Check pod status
kubectl get pods

# Check pod logs
kubectl logs <pod-name>

# Check pod events
kubectl describe pod <pod-name>
```

**Solutions:**

1. **Environment Variables Missing**
   - Verify all required variables are set
   - Run `npm run validate:env`
   - Check secret configuration

2. **Resource Limits**
   - Check CPU/memory limits
   - Verify resource requests
   - Scale resources if needed

3. **Image Issues**
   - Verify Docker image builds successfully
   - Check image is pushed to registry
   - Verify image tag is correct

### Issue: Can't Connect After Deployment

**Symptoms:**
- Service not accessible
- Connection refused
- DNS resolution fails

**Diagnosis:**
```bash
# Check service status
kubectl get services

# Check ingress
kubectl get ingress

# Test connectivity
curl -v https://api.complyeasy.ai/health
```

**Solutions:**

1. **Service Not Exposed**
   - Verify service is created
   - Check service type (ClusterIP vs LoadBalancer)
   - Verify port mapping

2. **Ingress Issues**
   - Check ingress configuration
   - Verify DNS records
   - Check SSL certificate

3. **Network Policies**
   - Check network policy rules
   - Verify pod-to-pod communication
   - Check firewall rules

---

## Error Codes Reference

### Authentication Errors

| Code | Message | Solution |
|------|---------|----------|
| `AUTH_REQUIRED` | Authentication required | Include Authorization header |
| `TOKEN_EXPIRED` | Token expired | Refresh token |
| `TOKEN_INVALID` | Invalid token | Request new token |
| `2FA_REQUIRED` | 2FA verification required | Complete 2FA flow |

### Validation Errors

| Code | Message | Solution |
|------|---------|----------|
| `VALIDATION_ERROR` | Validation failed | Check request body |
| `MISSING_FIELD` | Required field missing | Include required field |
| `INVALID_FORMAT` | Invalid data format | Check data type/format |

### Database Errors

| Code | Message | Solution |
|------|---------|----------|
| `DB_CONNECTION_FAILED` | Database connection failed | Check DATABASE_URL |
| `DB_QUERY_FAILED` | Query execution failed | Check query syntax |
| `DB_MIGRATION_FAILED` | Migration failed | Check migration status |

### Rate Limiting

| Code | Message | Solution |
|------|---------|----------|
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait for rate limit reset |

---

## Getting Help

### Logs Location

- **Application Logs:** `logs/app.log`
- **Error Logs:** `logs/error.log`
- **Access Logs:** `logs/access.log`

### Support Channels

- **Documentation:** Check relevant guides
- **GitHub Issues:** Report bugs
- **Support Email:** support@complyeasy.ai
- **Status Page:** https://status.complyeasy.ai

### Information to Provide

When reporting issues, include:
1. Error message and code
2. Steps to reproduce
3. Environment (dev/staging/prod)
4. Relevant logs
5. Request/response examples

---

**Last Updated:** December 18, 2024

