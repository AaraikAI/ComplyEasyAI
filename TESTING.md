# ComplyEasy AI - Testing Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Local Testing](#local-testing)
5. [Feature Testing](#feature-testing)
6. [Integration Testing](#integration-testing)

---

## Prerequisites

Before testing, ensure you have:

- **Node.js** 22+ and npm installed
- **PostgreSQL** database (local or cloud)
- **Git** installed
- **API Keys** for testing:
  - Google Gemini API key
  - SendGrid API key (for email)
  - OAuth provider credentials (optional for OAuth testing)
  - Stripe API key (optional for billing testing)

---

## Environment Setup

### Step 1: Clone and Install Dependencies

```bash
# Navigate to server directory
cd /home/user/ComplyEasyAI/server

# Install dependencies
npm install

# Verify installation (should show 586 packages, 0 vulnerabilities)
npm list --depth=0
```

### Step 2: Create Environment File

Create `.env` file in `/home/user/ComplyEasyAI/server/`:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/complyeasy?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Encryption (for 2FA secrets)
ENCRYPTION_KEY="your-32-byte-hex-encryption-key-12345678901234567890123456789012"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Email (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@complyeasy.ai"

# AWS S3 (optional)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="complyeasy-uploads"

# Stripe (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Server
PORT=3001
NODE_ENV="development"

# OAuth Providers (optional - for testing OAuth)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/integrations/google/callback"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_REDIRECT_URI="http://localhost:3001/api/integrations/github/callback"

# Advanced Features (optional - for testing advanced features)
# Blockchain
ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/your-api-key"
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/your-api-key"
BLOCKCHAIN_PRIVATE_KEY="your-private-key-for-signing-transactions"
COMPLIANCE_CONTRACT_ADDRESS="0x..."

# BYOK
AWS_KMS_KEY_ID="your-kms-key-id"
AZURE_KEY_VAULT_URL="https://your-vault.vault.azure.net/"

# OPA
OPA_ENDPOINT="http://localhost:8181"
```

### Step 3: Generate Encryption Key

```bash
# Generate a secure encryption key for 2FA
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and set it as ENCRYPTION_KEY in .env
```

---

## Database Setup

### Step 1: Ensure PostgreSQL is Running

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Create database
psql -U postgres -c "CREATE DATABASE complyeasy;"

# Create a least-privilege application role (no SUPERUSER / no BYPASSRLS).
# Set the password interactively so it is never recorded in shell history or argv:
psql -U postgres -c "CREATE ROLE complyuser WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;"
psql -U postgres -c "\password complyuser"

# Grant only what the app needs (connect + schema usage + table CRUD), not GRANT ALL:
psql -U postgres -d complyeasy -c "GRANT CONNECT ON DATABASE complyeasy TO complyuser;"
psql -U postgres -d complyeasy -c "GRANT USAGE, CREATE ON SCHEMA public TO complyuser;"
psql -U postgres -d complyeasy -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO complyuser;"
psql -U postgres -d complyeasy -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO complyuser;"
psql -U postgres -d complyeasy -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO complyuser;"
psql -U postgres -d complyeasy -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO complyuser;"
```

### Step 2: Run Prisma Migrations

```bash
cd /home/user/ComplyEasyAI/server

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db push

# (Optional) Open Prisma Studio to view database
npx prisma studio
# Opens at http://localhost:5555
```

### Step 3: Verify Database Schema

```bash
# Check that all tables exist
npx prisma db pull

# Expected tables (matching the Prisma model names in server/prisma/schema.prisma):
# - User
# - Organization
# - ComplianceFramework
# - FrameworkControl
# - RiskItem
# - EvidenceAnalysis
# - AuditLog
# - Integration
# - SubscriptionHistory
# - TwoFactorBackupCode
```

---

## Local Testing

### Step 1: Start Backend Server

```bash
cd /home/user/ComplyEasyAI/server

# Start in development mode with hot reload
npm run dev

# Server should start on http://localhost:3001
```

**Expected output:**
```
╔══════════════════════════════════════════╗
║   ComplyEasy AI - Backend Server        ║
║   Environment: development               ║
║   Port: 3001                             ║
║   Database: Connected ✓                  ║
║   WebSocket: Enabled (/ws)              ║
╚══════════════════════════════════════════╝

Server listening on http://localhost:3001
```

### Step 2: Test Health Endpoint

```bash
# Test server is running
curl http://localhost:3001/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-12-04T...",
  "uptime": 1.234,
  "environment": "development",
  "database": "connected",
  "websocket": "connected"
}
```

### Step 3: Start Frontend (in new terminal)

```bash
cd /home/user/ComplyEasyAI

# Install frontend dependencies
npm install

# Start frontend
npm run dev

# Frontend should start on http://localhost:5173
```

---

## Feature Testing

### 1. Authentication Testing

#### Test User Registration

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "organizationName": "Test Org"
  }'

# Expected: 201 Created with user object and JWT token
```

#### Test User Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Expected: 200 OK with token
# Save the token for subsequent requests
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Two-Factor Authentication (2FA) Testing

#### Enable 2FA

```bash
curl -X POST http://localhost:3001/api/2fa/enable \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"

# Expected: QR code data URL and backup codes
# Response:
{
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": [
    "12345678",
    "87654321",
    ...
  ]
}
```

#### Verify 2FA Setup

Use Google Authenticator or similar app to scan QR code, then:

```bash
curl -X POST http://localhost:3001/api/2fa/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "token": "123456"
  }'

# Expected: 200 OK - 2FA enabled
```

#### Test 2FA Login Flow

```bash
# Step 1: Login (will return twoFactorRequired: true)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Response: { "twoFactorRequired": true, "userId": "..." }

# Step 2: Complete 2FA
curl -X POST http://localhost:3001/api/auth/2fa/complete \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-from-step-1",
    "token": "123456"
  }'

# Expected: Full JWT token
```

### 3. WebSocket Real-Time Testing

#### Test WebSocket Connection

```javascript
// Open browser console at http://localhost:5173
// Or use this Node.js script:

const io = require('socket.io-client');

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('✓ WebSocket connected:', socket.id);

  // Join organization room
  socket.emit('join-organization', { organizationId: 'your-org-id' });
});

socket.on('risk:updated', (data) => {
  console.log('✓ Received risk update:', data);
});

socket.on('framework:updated', (data) => {
  console.log('✓ Received framework update:', data);
});

socket.on('disconnect', () => {
  console.log('WebSocket disconnected');
});
```

### 4. OAuth Integration Testing

#### Test Google OAuth Flow

```bash
# Step 1: Get authorization URL
curl -X GET "http://localhost:3001/api/integrations/google/authorize?organizationId=your-org-id" \
  -H "Authorization: Bearer $TOKEN"

# Response: { "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..." }

# Step 2: Open authUrl in browser, authorize
# Step 3: You'll be redirected to callback URL
# Step 4: Check integration status

curl -X GET "http://localhost:3001/api/integrations/google" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Integration details with connected: true
```

#### Run OAuth Setup Wizard

```bash
cd /home/user/ComplyEasyAI/server

# Run interactive setup
npm run setup:oauth

# Follow prompts to configure all 5 OAuth providers
```

### 5. AI Features Testing

#### Test Gemini AI Risk Analysis

```bash
curl -X POST http://localhost:3001/api/ai/analyze-risk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "organizationId": "your-org-id",
    "description": "We store customer payment data in our database",
    "category": "data_security"
  }'

# Expected: AI-generated risk assessment
```

### 6. Advanced Features Testing

#### Test Zero-Knowledge Proofs (Simulated)

```bash
# Note: Advanced features require additional setup
# Create a test script: test-advanced.js

const zeroKnowledgeService = require('./src/services/advanced/zeroKnowledgeService').default;

async function testZK() {
  // Generate compliance proof
  const proof = await zeroKnowledgeService.generateComplianceProof(
    'org-123',
    'framework-456',
    {
      controlsImplemented: 85,
      totalControls: 100,
      evidenceHash: 'abc123...'
    }
  );

  console.log('✓ Proof generated:', proof);

  // Verify proof
  const result = await zeroKnowledgeService.verifyComplianceProof(proof);
  console.log('✓ Proof valid:', result.isValid);
}

testZK();
```

#### Test Homomorphic AI (Simulated)

```bash
# test-homomorphic.js
const homomorphicService = require('./src/services/advanced/homomorphicAIService').default;

async function testHomomorphic() {
  await homomorphicService.initialize();

  // Generate encryption keys
  const keys = await homomorphicService.generateKeys('CKKS', 128);
  console.log('✓ Keys generated');

  // Encrypt data
  const data = [1.5, 2.3, 3.7, 4.2];
  const encrypted = await homomorphicService.encryptData(
    data,
    keys.publicKey,
    'CKKS'
  );
  console.log('✓ Data encrypted');

  // Perform computation on encrypted data
  const weights = [0.5, 0.3, 0.2, 0.1];
  const result = await homomorphicService.encryptedLinearRegression(
    encrypted,
    weights,
    keys.publicKey,
    keys.relinKeys
  );
  console.log('✓ Encrypted computation performed');
}

testHomomorphic();
```

---

## Integration Testing

### Full User Journey Test

```bash
#!/bin/bash
# test-user-journey.sh

API="http://localhost:3001/api"

echo "1. Register user..."
REGISTER_RESPONSE=$(curl -s -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "journey@test.com",
    "password": "Test123!",
    "name": "Journey User",
    "organizationName": "Journey Org"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
ORG_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.organizationId')

echo "✓ User registered. Token: ${TOKEN:0:20}..."

echo "2. Create risk..."
RISK_RESPONSE=$(curl -s -X POST $API/risks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"organizationId\": \"$ORG_ID\",
    \"title\": \"Data Breach Risk\",
    \"description\": \"Risk of customer data breach\",
    \"category\": \"data_security\",
    \"likelihood\": \"medium\",
    \"impact\": \"high\"
  }")

RISK_ID=$(echo $RISK_RESPONSE | jq -r '.id')
echo "✓ Risk created: $RISK_ID"

echo "3. Get AI recommendations..."
curl -s -X POST $API/ai/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"organizationId\": \"$ORG_ID\",
    \"riskId\": \"$RISK_ID\"
  }" | jq '.recommendations'

echo "✓ Journey test complete!"
```

### Run Integration Tests

```bash
chmod +x test-user-journey.sh
./test-user-journey.sh
```

---

## Testing Checklist

Before deploying to production, verify:

- [ ] Backend server starts without errors
- [ ] Database migrations applied successfully
- [ ] User registration works
- [ ] User login works
- [ ] JWT authentication works
- [ ] 2FA enrollment works
- [ ] 2FA login flow works
- [ ] WebSocket connects successfully
- [ ] WebSocket receives real-time events
- [ ] OAuth authorization URLs generated
- [ ] AI risk analysis returns results
- [ ] File upload works (if S3 configured)
- [ ] Email sending works (if SendGrid configured)
- [ ] All API endpoints return expected responses
- [ ] Error handling works (test with invalid data)
- [ ] Rate limiting works (test with many requests)

---

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull

# If fails, check DATABASE_URL in .env
# Ensure PostgreSQL is running: sudo systemctl status postgresql
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change PORT in .env
```

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### WebSocket Not Connecting

```bash
# Check CORS settings in server/src/index.ts
# Ensure frontend origin is allowed

# Test WebSocket endpoint directly
curl http://localhost:3001/socket.io/?EIO=4&transport=polling
```

---

## Next Steps

After local testing is complete and all features work:
1. Review DEPLOYMENT.md for production deployment guide
2. Set up production database
3. Configure production environment variables
4. Deploy to hosting platform
