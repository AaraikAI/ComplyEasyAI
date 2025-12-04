# ComplyEasy AI Backend Server

Production-ready backend API for ComplyEasy AI compliance automation platform.

## Features Implemented

✅ **Authentication & Security**
- Magic link passwordless authentication
- JWT access tokens with refresh token support
- Role-based access control (admin/editor/viewer)
- Rate limiting and DDoS protection
- Helmet.js security headers
- CORS configuration

✅ **Database & Persistence**
- PostgreSQL with Prisma ORM
- Comprehensive data models for all entities
- Database migrations support
- Connection pooling

✅ **AI Integration**
- Gemini AI backend proxy (secure API key management)
- PII redaction (AI Air Gap)
- Rate limiting for AI endpoints
- All 8 AI tools implemented

✅ **Payment Processing**
- Stripe integration for subscriptions
- Webhook handling for payment events
- Customer portal support
- Plan management (Basic/Pro/Enterprise)

✅ **Email Service**
- SendGrid integration
- Magic link emails
- Welcome emails
- Password reset emails

✅ **File Management**
- AWS S3 file uploads
- File validation and virus scanning placeholder
- Secure file access with signed URLs
- File type restrictions

✅ **API Endpoints**
- RESTful API design
- Comprehensive error handling
- Request/response logging
- Health check endpoint

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **AI**: Google Gemini AI
- **Payments**: Stripe
- **Email**: SendGrid
- **Storage**: AWS S3
- **Security**: Helmet, CORS, bcrypt, rate-limit-express

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Gemini API key
- SendGrid API key (for emails)
- Stripe account (for payments)
- AWS account (for file uploads)

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/complyeasy_db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_BASIC_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

### 4. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/magic-link` - Request magic link
- `POST /api/auth/verify` - Verify magic link token
- `POST /api/auth/register` - Register new user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Risks
- `GET /api/risks` - List all risks
- `GET /api/risks/:id` - Get risk by ID
- `POST /api/risks` - Create new risk
- `PATCH /api/risks/:id` - Update risk
- `DELETE /api/risks/:id` - Delete risk
- `POST /api/risks/prioritize` - AI risk prioritization
- `POST /api/risks/:id/remediation` - Generate remediation plan
- `POST /api/risks/scan` - Run automated risk scan

### Frameworks
- `GET /api/frameworks` - List frameworks
- `GET /api/frameworks/:id` - Get framework details
- `POST /api/frameworks` - Create framework
- `PATCH /api/frameworks/:id` - Update framework
- `DELETE /api/frameworks/:id` - Delete framework

### AI Tools
- `POST /api/ai/report` - Generate compliance report
- `POST /api/ai/policy` - Generate policy document
- `POST /api/ai/contract` - Analyze contract
- `POST /api/ai/gap-analysis` - Perform gap analysis
- `POST /api/ai/rfp` - Generate RFP response
- `POST /api/ai/phishing` - Generate phishing simulation
- `POST /api/ai/vendor-score` - Score vendor risk
- `POST /api/ai/data-map` - Generate GDPR data map
- `POST /api/ai/bcp` - Generate business continuity plan
- `POST /api/ai/chat` - Chat with compliance bot

### Billing
- `POST /api/billing/checkout` - Create Stripe checkout session
- `POST /api/billing/portal` - Create billing portal session
- `GET /api/billing/subscription` - Get subscription status
- `POST /api/billing/webhook` - Stripe webhook handler (public)

### Integrations
- `GET /api/integrations` - List all integrations
- `GET /api/integrations/:provider` - Get integration status

#### Google Workspace
- `GET /api/integrations/google/authorize` - Start OAuth flow
- `GET /api/integrations/google/callback` - OAuth callback (public)
- `POST /api/integrations/google/sync` - Sync data (users/groups/audit/drive)
- `DELETE /api/integrations/google` - Disconnect integration

#### GitHub
- `GET /api/integrations/github/authorize` - Start OAuth flow
- `GET /api/integrations/github/callback` - OAuth callback (public)
- `POST /api/integrations/github/sync` - Sync data (repositories/commits/security/compliance)
- `DELETE /api/integrations/github` - Disconnect integration

#### Slack
- `GET /api/integrations/slack/authorize` - Start OAuth flow
- `GET /api/integrations/slack/callback` - OAuth callback (public)
- `POST /api/integrations/slack/sync` - Sync data (channels/users/history)
- `POST /api/integrations/slack/message` - Post message to channel
- `DELETE /api/integrations/slack` - Disconnect integration

#### Jira
- `GET /api/integrations/jira/authorize` - Start OAuth flow
- `GET /api/integrations/jira/callback` - OAuth callback (public)
- `POST /api/integrations/jira/sync` - Sync data (projects/issues/compliance/audit)
- `POST /api/integrations/jira/issue` - Create issue
- `DELETE /api/integrations/jira` - Disconnect integration

#### AWS
- `POST /api/integrations/aws/connect` - Connect with IAM credentials
- `POST /api/integrations/aws/sync` - Sync data (cloudtrail/s3/iam/config/security-hub/compliance-scan)
- `DELETE /api/integrations/aws` - Disconnect integration

### Two-Factor Authentication
- `POST /api/2fa/setup` - Generate 2FA secret and QR code (authenticated)
- `POST /api/2fa/verify-enable` - Verify token and enable 2FA (authenticated)
- `POST /api/2fa/verify` - Verify 2FA token during login (public)
- `POST /api/2fa/verify-backup` - Verify backup code during login (public)
- `POST /api/2fa/disable` - Disable 2FA (authenticated)
- `POST /api/2fa/regenerate-codes` - Regenerate backup codes (authenticated)
- `GET /api/2fa/status` - Get 2FA status (authenticated)

### Real-Time WebSocket
- WebSocket endpoint: `ws://localhost:5000/ws`
- Authentication: Pass JWT token in `auth.token` during connection
- Events: `risk:updated`, `framework:updated`, `ai:task:status`, `integration:sync`, `audit:log`, `notification`

### Health
- `GET /health` - Health check endpoint (includes WebSocket status)

## Security Features

### Implemented
1. **JWT Authentication** - Secure token-based auth
2. **Rate Limiting** - Prevent abuse (100 req/15min general, 10 req/min AI)
3. **CORS** - Configurable cross-origin resource sharing
4. **Helmet.js** - Security headers
5. **PII Redaction** - AI Air Gap for sensitive data
6. **Password Hashing** - bcrypt with salt rounds
7. **SQL Injection Protection** - Prisma ORM parameterized queries
8. **Input Validation** - Request validation middleware
9. **Error Handling** - Sanitized error messages in production

### Not Yet Implemented
- OAuth 2.0 for integrations (AWS, GitHub, Google)
- Two-factor authentication
- IP whitelisting
- Advanced DDoS protection

## Deployment

### Option 1: Docker

```bash
# Build image
docker build -t complyeasy-api .

# Run container
docker run -p 5000:5000 --env-file .env complyeasy-api
```

### Option 2: PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start dist/index.js --name complyeasy-api

# Monitor
pm2 monit

# Logs
pm2 logs complyeasy-api
```

### Option 3: Cloud Platforms

**Heroku:**
```bash
heroku create complyeasy-api
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

**AWS (Elastic Beanstalk):**
```bash
eb init -p node.js complyeasy-api
eb create complyeasy-production
eb deploy
```

**Vercel/Railway:**
- Connect GitHub repository
- Set environment variables in dashboard
- Deploy automatically on push

## Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name description_of_changes

# Apply migrations to production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Monitoring & Logs

Logs are written to:
- Console (all logs)
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)

Consider integrating:
- **Sentry** - Error tracking
- **DataDog** - Application performance monitoring
- **LogRocket** - Session replay
- **CloudWatch** - AWS logging

## Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres

# Test connection string
npx prisma db pull
```

### Stripe Webhook Failures
```bash
# Use Stripe CLI for local testing
stripe listen --forward-to localhost:5000/api/billing/webhook
```

### Email Not Sending
- Verify SendGrid API key
- Check sender verification in SendGrid dashboard
- Review SendGrid activity logs

## Production Checklist

- [ ] Set strong JWT secrets (min 32 characters)
- [ ] Configure production database
- [ ] Set up database backups
- [ ] Enable HTTPS/SSL
- [ ] Configure production CORS origins
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure log rotation
- [ ] Set up CI/CD pipeline
- [ ] Enable database connection pooling
- [ ] Configure CDN for static assets
- [ ] Set up rate limiting
- [ ] Enable database query logging
- [ ] Configure Stripe webhook endpoint
- [ ] Set up email domain authentication (SPF/DKIM)
- [ ] Enable AWS S3 bucket encryption
- [ ] Configure backup strategy
- [ ] Set up staging environment
- [ ] Load testing
- [ ] Security audit

## Support

For issues or questions:
- Open an issue on GitHub
- Email: support@complyeasy.ai
- Documentation: https://docs.complyeasy.ai

## License

Proprietary - All rights reserved
