# ComplyEasy AI - Complete Deployment Guide

This guide covers deploying both the frontend and backend to production.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Frontend      │────────▶│   Backend API    │────────▶│   PostgreSQL     │
│   (React/Vite)  │         │   (Express/TS)   │         │   Database       │
└─────────────────┘         └──────────────────┘         └──────────────────┘
         │                           │
         │                           │
         ▼                           ▼
  ┌─────────────┐           ┌──────────────┐
  │   Vercel/   │           │   Gemini AI  │
  │  Netlify    │           │   SendGrid   │
  └─────────────┘           │   Stripe     │
                            │   AWS S3     │
                            └──────────────┘
```

## Prerequisites

### Required Services
1. **PostgreSQL Database** (Supabase, Railway, or self-hosted)
2. **Gemini API Key** (https://makersuite.google.com/app/apikey)
3. **SendGrid Account** (https://sendgrid.com)
4. **Stripe Account** (https://stripe.com)
5. **AWS S3 Bucket** (https://aws.amazon.com/s3/)
6. **Hosting Platform** (Vercel, Railway, Heroku, or self-hosted)

### Optional Services
- **Sentry** - Error tracking
- **DataDog** - Application monitoring
- **CloudFlare** - CDN and DDoS protection

## Step 1: Set Up Database

### Option A: Supabase (Recommended)

1. Create account at https://supabase.com
2. Create new project
3. Get connection string from Settings > Database
4. Format: `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`

### Option B: Railway

1. Create account at https://railway.app
2. New Project > Add PostgreSQL
3. Copy `DATABASE_URL` from Variables tab

### Option C: Self-Hosted

```bash
# Install PostgreSQL
sudo apt-get install postgresql

# Create database
createdb complyeasy_db

# Create user
psql -c "CREATE USER complyeasy WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE complyeasy_db TO complyeasy;"
```

## Step 2: Configure External Services

### Gemini AI

1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy key for environment variables

### SendGrid

1. Sign up at https://sendgrid.com
2. Create API key with "Mail Send" permissions
3. Verify sender email:
   - Go to Settings > Sender Authentication
   - Add and verify your email domain
4. Copy API key

### Stripe

1. Sign up at https://stripe.com
2. Get API keys from Developers > API keys
3. Create products and prices:
   ```bash
   # Using Stripe CLI
   stripe products create --name="Basic Plan" --description="Basic features"
   stripe prices create --product=prod_xxx --unit-amount=7500 --currency=usd --recurring[interval]=month

   # Repeat for Pro ($200) and Enterprise ($500)
   ```
4. Set up webhook endpoint:
   - Developers > Webhooks > Add endpoint
   - URL: `https://your-api-domain.com/api/billing/webhook`
   - Events to listen: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
5. Copy webhook signing secret

### AWS S3

1. Create S3 bucket:
   ```bash
   aws s3 mb s3://complyeasy-uploads
   ```
2. Enable encryption:
   ```bash
   aws s3api put-bucket-encryption --bucket complyeasy-uploads \
     --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
   ```
3. Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://your-frontend-domain.com"],
       "ExposeHeaders": []
     }
   ]
   ```
4. Create IAM user with S3 access:
   - Policy: AmazonS3FullAccess (or custom restrictive policy)
   - Get Access Key ID and Secret Access Key

## Step 3: Deploy Backend

### Option A: Railway (Recommended - Easiest)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and initialize:
   ```bash
   railway login
   cd server
   railway init
   ```

3. Add PostgreSQL:
   ```bash
   railway add postgresql
   ```

4. Set environment variables:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=5000
   railway variables set JWT_SECRET=your-jwt-secret-min-32-chars
   railway variables set JWT_REFRESH_SECRET=your-refresh-secret
   railway variables set GEMINI_API_KEY=your-gemini-key
   railway variables set SENDGRID_API_KEY=your-sendgrid-key
   railway variables set SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   railway variables set STRIPE_SECRET_KEY=sk_live_xxx
   railway variables set STRIPE_WEBHOOK_SECRET=whsec_xxx
   railway variables set STRIPE_BASIC_PRICE_ID=price_xxx
   railway variables set STRIPE_PRO_PRICE_ID=price_xxx
   railway variables set STRIPE_ENTERPRISE_PRICE_ID=price_xxx
   railway variables set AWS_ACCESS_KEY_ID=your-access-key
   railway variables set AWS_SECRET_ACCESS_KEY=your-secret
   railway variables set AWS_REGION=us-east-1
   railway variables set AWS_S3_BUCKET=complyeasy-uploads
   railway variables set CORS_ORIGIN=https://your-frontend-domain.com
   ```

5. Deploy:
   ```bash
   railway up
   ```

6. Run migrations:
   ```bash
   railway run npm run prisma:migrate
   ```

7. Get your backend URL:
   ```bash
   railway domain
   ```

### Option B: Heroku

1. Create Heroku app:
   ```bash
   heroku create complyeasy-api
   heroku addons:create heroku-postgresql:hobby-dev
   ```

2. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret
   # ... set all other variables
   ```

3. Deploy:
   ```bash
   git subtree push --prefix server heroku main
   ```

4. Run migrations:
   ```bash
   heroku run npm run prisma:migrate
   ```

### Option C: Docker + Self-Hosted

1. Create Dockerfile in `/server`:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   RUN npx prisma generate
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. Build and run:
   ```bash
   docker build -t complyeasy-api .
   docker run -d -p 5000:5000 --env-file .env complyeasy-api
   ```

3. Run migrations:
   ```bash
   docker exec -it [container-id] npm run prisma:migrate
   ```

## Step 4: Deploy Frontend

### Update Frontend Configuration

1. Create `.env` file in project root:
   ```env
   VITE_API_URL=https://your-backend-domain.com/api
   ```

2. Update vite.config.ts if needed

### Option A: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variable:
   - Go to project settings
   - Add `VITE_API_URL=https://your-backend-domain.com/api`

4. Redeploy:
   ```bash
   vercel --prod
   ```

### Option B: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify init
   netlify deploy --prod
   ```

3. Set environment variables in Netlify dashboard

### Option C: Static Hosting (AWS S3 + CloudFront)

1. Build frontend:
   ```bash
   npm run build
   ```

2. Upload to S3:
   ```bash
   aws s3 sync dist/ s3://your-frontend-bucket/
   ```

3. Configure CloudFront distribution for SPA routing

## Step 5: Post-Deployment Configuration

### 1. Update Stripe Webhook URL

Update your Stripe webhook endpoint to point to your production backend:
```
https://your-backend-domain.com/api/billing/webhook
```

### 2. Configure CORS

Update backend CORS_ORIGIN to your frontend domain:
```bash
railway variables set CORS_ORIGIN=https://your-frontend-domain.com
```

### 3. Set up Custom Domain (Optional)

**Backend (Railway):**
```bash
railway domain add api.yourdomain.com
```

**Frontend (Vercel):**
- Go to project settings > Domains
- Add `yourdomain.com`
- Configure DNS as instructed

### 4. Enable HTTPS/SSL

Both Railway and Vercel provide automatic HTTPS. For self-hosted:

```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### 5. Set up Monitoring

**Sentry:**
```bash
npm install @sentry/node @sentry/tracing
```

Add to server/src/index.ts:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Step 6: Verify Deployment

### Backend Health Check
```bash
curl https://your-backend-domain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### Test Authentication Flow
1. Visit your frontend
2. Request magic link
3. Check email
4. Verify login works

### Test AI Features
1. Generate a compliance report
2. Test chat bot
3. Verify all AI tools respond

### Test Payment Flow
1. Go to Settings > Billing
2. Click upgrade plan
3. Complete test payment (use Stripe test card: 4242 4242 4242 4242)
4. Verify webhook processed

## Troubleshooting

### Frontend Can't Connect to Backend
- Verify VITE_API_URL is correct
- Check CORS configuration
- Verify backend is running: `curl [backend]/health`

### Database Connection Errors
- Verify DATABASE_URL format
- Check database is accessible
- Run migrations: `npm run prisma:migrate`

### Stripe Webhook Failures
- Verify webhook URL in Stripe dashboard
- Check webhook secret matches
- Test with Stripe CLI: `stripe listen --forward-to localhost:5000/api/billing/webhook`

### Email Not Sending
- Verify SendGrid API key
- Check sender verification
- Review SendGrid activity logs

### File Upload Failures
- Verify AWS credentials
- Check S3 bucket permissions
- Verify CORS configuration on S3

## Performance Optimization

### Backend
- Enable database connection pooling
- Implement Redis caching for frequently accessed data
- Use CDN for static assets
- Enable gzip compression

### Frontend
- Enable code splitting
- Lazy load routes
- Optimize images
- Use service workers for caching

## Security Hardening

- [ ] Rotate all secrets regularly
- [ ] Enable 2FA on all service accounts
- [ ] Set up IP whitelisting for database
- [ ] Configure rate limiting rules
- [ ] Enable WAF (Web Application Firewall)
- [ ] Set up DDoS protection
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Enable audit logging
- [ ] Configure backup strategy

## Backup Strategy

### Database Backups
```bash
# Daily automated backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20240101.sql
```

### File Backups (S3)
- Enable S3 versioning
- Set up lifecycle policies
- Configure cross-region replication

## Monitoring & Alerts

Set up alerts for:
- API response time > 2s
- Error rate > 1%
- Database CPU > 80%
- Disk space < 20%
- Payment webhook failures
- Email delivery failures

## Scaling

### Horizontal Scaling
- Use load balancer (AWS ALB, nginx)
- Deploy multiple backend instances
- Configure session affinity

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Database sharding for multi-tenancy

## Cost Optimization

### Estimated Monthly Costs (Production)
- **Backend Hosting (Railway)**: $20-50
- **Database (Supabase Pro)**: $25
- **Gemini AI**: Pay per use (~$50-200)
- **SendGrid (Essentials)**: $20
- **Stripe**: 2.9% + $0.30 per transaction
- **AWS S3**: ~$5-20 depending on usage
- **Total**: ~$140-345/month + transaction fees

### Cost Reduction Tips
- Use database connection pooling
- Implement caching to reduce AI calls
- Optimize S3 storage with lifecycle policies
- Use CDN to reduce egress costs

## Support

- Documentation: https://docs.complyeasy.ai
- Email: support@complyeasy.ai
- GitHub Issues: https://github.com/complyeasyai/issues

## Next Steps After Deployment

1. Set up monitoring dashboards
2. Configure automated backups
3. Create staging environment
4. Set up CI/CD pipeline
5. Perform load testing
6. Security audit
7. Documentation updates
8. User acceptance testing
9. Launch! 🚀
