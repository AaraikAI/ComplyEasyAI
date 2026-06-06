# Database Migration Guide: Supabase → AWS RDS PostgreSQL

Complete step-by-step guide to migrate your ComplyEasyAI database from Supabase to AWS RDS PostgreSQL.

**Estimated Time:** 30-60 minutes
**Downtime Required:** 5-15 minutes (for data export/import)

---

## 📋 Pre-Migration Checklist

- [ ] AWS Account with permissions to create RDS instances
- [ ] Supabase project with active database
- [ ] PostgreSQL client installed (`psql` or `pgAdmin`)
- [ ] Backup of current `.env` files
- [ ] Access to Supabase dashboard

---

## PART 1: Create AWS RDS PostgreSQL Instance

### Step 1.1: Create RDS Instance via AWS Console

1. **Log in to AWS Console**
   - Navigate to: https://console.aws.amazon.com/rds/

2. **Create Database**
   - Click **"Create database"**
   - Select **"Standard create"**

3. **Engine Configuration**
   - **Engine type:** PostgreSQL
   - **Engine version:** PostgreSQL 15.x or 14.x (recommended)
   - **Templates:** Choose based on use case:
     - Production: Production
     - Development/Testing: Dev/Test
     - Free tier available: Free tier (limited resources)

4. **Settings**
   ```
   DB instance identifier: complyeasyai-db
   Master username: complyeasy_admin
   Master password: [Generate strong password]
   Confirm password: [Same as above]
   ```

   ⚠️ **IMPORTANT:** Save these credentials securely!

5. **DB Instance Size**
   - **Instance class:**
     - Production: `db.t3.medium` or larger
     - Development: `db.t3.micro` or `db.t3.small`
     - Free tier: `db.t3.micro` (20GB storage)

6. **Storage**
   ```
   Storage type: General Purpose SSD (gp3)
   Allocated storage: 20 GB (minimum) to 100 GB (recommended)
   Storage autoscaling: Enable (recommended)
   Maximum storage threshold: 1000 GB
   ```

7. **Connectivity**
   - **Compute resource:** Connect to the application EC2 instance (or attach the DB to the same VPC)
   - **Network type:** IPv4
   - **VPC:** Same VPC as the application, using **private subnets**
   - **Public access:** **No** — place RDS in private subnets reachable only from the
     app/EC2 security group. If you must run migrations from a workstation, do it over an
     SSH bastion or AWS SSM port-forward rather than exposing the DB publicly.
   - **VPC security group:** Create new
     - Name: `complyeasyai-db-sg`
   - **Availability Zone:** No preference

8. **Database Authentication**
   - Select: **Password authentication**

9. **Additional Configuration**
   - **Initial database name:** `complyeasy`
   - **DB parameter group:** default.postgres15
   - **Backup retention:** 7 days (recommended)
   - **Encryption:** Enable encryption (recommended)
   - **Enhanced monitoring:** Enable (optional)
   - **Auto minor version upgrade:** Enable

10. **Create Database**
    - Review all settings
    - Click **"Create database"**
    - Wait 5-10 minutes for creation

### Step 1.2: Configure Security Group

1. **Go to EC2 Dashboard**
   - Navigate to: Security Groups
   - Find: `complyeasyai-db-sg`

2. **Edit Inbound Rules**
   - Click **"Edit inbound rules"**
   - Add rule:
     ```
     Type: PostgreSQL
     Protocol: TCP
     Port: 5432
     Source:
       - The application/EC2 security group ID (sg-xxxxx) — preferred
       - For one-off admin access: a bastion host security group, or your IP /32
       - Never use 0.0.0.0/0 (do not open the database to the internet)
     Description: ComplyEasy AI Database Access
     ```
   - Click **"Save rules"**

3. **Get RDS Endpoint**
   - Go back to RDS Dashboard
   - Click on your database: `complyeasyai-db`
   - Copy **"Endpoint"** (looks like: `complyeasyai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com`)
   - Copy **"Port"** (default: `5432`)

---

## PART 2: Export Data from Supabase

### Step 2.1: Get Supabase Connection String

1. **Log in to Supabase Dashboard**
   - Navigate to: https://app.supabase.com/

2. **Get Connection String**
   - Select your project
   - Go to: **Settings** → **Database**
   - Scroll to **"Connection string"** section
   - Copy the **"URI"** connection string
   - Example: `postgresql://postgres:[PASSWORD]@db.xxxxxxxxx.supabase.co:5432/postgres`

### Step 2.2: Export Database Schema and Data

**Option A: Using pg_dump (Recommended)**

1. **Install PostgreSQL Client Tools** (if not installed)
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install postgresql-client

   # macOS
   brew install postgresql

   # Windows
   # Download from: https://www.postgresql.org/download/windows/
   ```

2. **Export Full Database**
   ```bash
   # Create export directory
   mkdir -p ~/complyeasy-migration
   cd ~/complyeasy-migration

   # Export schema and data
   pg_dump "postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@db.xxxxxxxxx.supabase.co:5432/postgres" \
     --schema=public \
     --no-owner \
     --no-privileges \
     --format=custom \
     --file=complyeasy_backup.dump
   ```

   **Alternative: Plain SQL format**
   ```bash
   pg_dump "postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@db.xxxxxxxxx.supabase.co:5432/postgres" \
     --schema=public \
     --no-owner \
     --no-privileges \
     --file=complyeasy_backup.sql
   ```

3. **Verify Export**
   ```bash
   # Check file size (should be > 0 bytes)
   ls -lh complyeasy_backup.dump

   # Check content (for .sql file)
   head -20 complyeasy_backup.sql
   ```

**Option B: Using Supabase Dashboard (Smaller databases)**

1. **Export via Dashboard**
   - In Supabase Dashboard: **Database** → **Backups**
   - Click **"Download backup"**
   - Save file locally

---

## PART 3: Import Data to AWS RDS

### Step 3.1: Test Connection to AWS RDS

```bash
# Test connection
psql "postgresql://complyeasy_admin:[YOUR_RDS_PASSWORD]@complyeasyai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/complyeasy"

# If successful, you'll see:
# psql (15.x)
# Type "help" for help.
# complyeasy=>

# Type \q to quit
\q
```

### Step 3.2: Import Database

**If you used .dump format (custom format):**

```bash
pg_restore \
  --host=complyeasyai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com \
  --port=5432 \
  --username=complyeasy_admin \
  --dbname=complyeasy \
  --no-owner \
  --no-privileges \
  --verbose \
  complyeasy_backup.dump

# Enter password when prompted
```

**If you used .sql format (plain SQL):**

```bash
psql \
  --host=complyeasyai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com \
  --port=5432 \
  --username=complyeasy_admin \
  --dbname=complyeasy \
  --file=complyeasy_backup.sql

# Enter password when prompted
```

### Step 3.3: Verify Import

```bash
# Connect to RDS
psql "postgresql://complyeasy_admin:[YOUR_RDS_PASSWORD]@complyeasyai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/complyeasy"

# List all tables
\dt

# Count rows in key tables (example)
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Organization";
SELECT COUNT(*) FROM "ComplianceFramework";
SELECT COUNT(*) FROM "Risk";

# Verify specific data
SELECT id, email, name FROM "User" LIMIT 5;

# Exit
\q
```

---

## PART 4: Update Environment Variables

### Step 4.1: Backup Current .env Files

```bash
cd /home/user/ComplyEasyAI

# Backup server .env
cp server/.env server/.env.backup-$(date +%Y%m%d-%H%M%S)

# Backup root .env if exists
cp .env .env.backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
```

### Step 4.2: Update DATABASE_URL

**File Location:** `/home/user/ComplyEasyAI/server/.env`

1. **Open the file:**
   ```bash
   nano /home/user/ComplyEasyAI/server/.env
   # or
   vim /home/user/ComplyEasyAI/server/.env
   ```

2. **Find the DATABASE_URL line:**
   ```env
   # OLD (Supabase):
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxxxxxx.supabase.co:5432/postgres?schema=public"
   ```

3. **Replace with AWS RDS URL:**
   ```env
   # NEW (AWS RDS):
   DATABASE_URL="postgresql://complyeasy_admin:[YOUR_RDS_PASSWORD]@complyeasyai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/complyeasy?schema=public"
   ```

   **URL Format Breakdown:**
   ```
   postgresql://[USERNAME]:[PASSWORD]@[ENDPOINT]:[PORT]/[DATABASE_NAME]?schema=public

   Where:
   - USERNAME: complyeasy_admin (master username from Step 1.1)
   - PASSWORD: Your RDS master password
   - ENDPOINT: RDS endpoint (from Step 1.2)
   - PORT: 5432 (default PostgreSQL port)
   - DATABASE_NAME: complyeasy (from Step 1.1)
   - schema=public: Prisma schema parameter
   ```

4. **Save the file:**
   - nano: `Ctrl+X`, then `Y`, then `Enter`
   - vim: `:wq` and `Enter`

### Step 4.3: Update Additional Database Settings (Optional)

If you have additional database settings, update them as well:

```env
# Database connection pool settings (optional)
DB_CONNECTION_LIMIT=10
DB_CONNECTION_TIMEOUT=20000

# SSL mode (recommended for production)
DATABASE_URL="postgresql://complyeasy_admin:[PASSWORD]@[ENDPOINT]:5432/complyeasy?schema=public&sslmode=require"
```

---

## PART 5: Test Migration

### Step 5.1: Regenerate Prisma Client

```bash
cd /home/user/ComplyEasyAI/server

# Generate Prisma client with new database
npx prisma generate

# Check database connection
npx prisma db pull
```

### Step 5.2: Run Database Migrations (if needed)

```bash
# Apply any pending migrations
npx prisma migrate deploy

# Or create new migration if schema changed
npx prisma migrate dev --name aws_rds_migration
```

### Step 5.3: Start Server and Test

```bash
# Install dependencies (if needed)
npm install

# Start server
npm run dev

# In another terminal, check logs
tail -f server/logs/combined.log
```

### Step 5.4: Test API Endpoints

```bash
# Test health check
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   ...
# }

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

### Step 5.5: Test Frontend

```bash
# Start frontend
cd /home/user/ComplyEasyAI
npm run dev

# Open browser: http://localhost:3000
# Try to:
# 1. Log in
# 2. View frameworks
# 3. Create/view risks
# 4. Check all major features work
```

---

## PART 6: Post-Migration Verification

### Step 6.1: Data Integrity Check

```bash
# Connect to AWS RDS
psql "postgresql://complyeasy_admin:[PASSWORD]@[ENDPOINT]:5432/complyeasy"

# Run verification queries
SELECT
  'Users' as table_name, COUNT(*) as row_count
FROM "User"
UNION ALL
SELECT 'Organizations', COUNT(*) FROM "Organization"
UNION ALL
SELECT 'Frameworks', COUNT(*) FROM "ComplianceFramework"
UNION ALL
SELECT 'Risks', COUNT(*) FROM "Risk"
UNION ALL
SELECT 'Controls', COUNT(*) FROM "Control"
UNION ALL
SELECT 'Evidence', COUNT(*) FROM "Evidence";
```

Compare row counts with Supabase (from Step 3.3).

### Step 6.2: Performance Test

```bash
# Test query performance
\timing on

SELECT * FROM "User" LIMIT 100;
SELECT * FROM "ComplianceFramework" WHERE "organizationId" = 'some-id';
SELECT * FROM "Risk" ORDER BY "createdAt" DESC LIMIT 50;
```

### Step 6.3: Backup Verification

```bash
# Create a backup of AWS RDS to verify backup system works
pg_dump "postgresql://complyeasy_admin:[PASSWORD]@[ENDPOINT]:5432/complyeasy" \
  --schema=public \
  --no-owner \
  --no-privileges \
  --file=aws_rds_verification_backup.sql

# Check backup file
ls -lh aws_rds_verification_backup.sql
```

---

## PART 7: Production Deployment

### Step 7.1: Update Production Environment Variables

**For Vercel Deployment:**

1. **Log in to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard

2. **Select Your Project**
   - Click on: `complyeasyai`

3. **Update Environment Variables**
   - Go to: **Settings** → **Environment Variables**
   - Find: `DATABASE_URL`
   - Click **Edit**
   - Update with AWS RDS connection string:
     ```
     postgresql://complyeasy_admin:[PASSWORD]@complyeasyai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/complyeasy?schema=public&sslmode=require
     ```
   - Save changes

4. **Redeploy Application**
   - Go to: **Deployments**
   - Click: **Redeploy** on latest deployment
   - Or trigger new deployment:
     ```bash
     git push origin main
     ```

**For Other Hosting (AWS, DigitalOcean, etc.):**

Update `.env` files on the server and restart services.

### Step 7.2: SSL/TLS Configuration (Production)

For production, always use SSL:

```env
# Add SSL mode to connection string
DATABASE_URL="postgresql://complyeasy_admin:[PASSWORD]@[ENDPOINT]:5432/complyeasy?schema=public&sslmode=require"
```

---

## 🔧 Troubleshooting

### Issue 1: "Connection Refused" Error

**Cause:** Security group not configured correctly

**Fix:**
1. Go to AWS RDS Console
2. Check security group allows port 5432
3. Verify your IP is whitelisted
4. Test connection: `telnet [ENDPOINT] 5432`

### Issue 2: "Authentication Failed" Error

**Cause:** Wrong username/password

**Fix:**
1. Verify username is `complyeasy_admin` (or what you set)
2. Reset RDS password if needed:
   - AWS RDS Console → Modify → New master password
3. Update `.env` file with correct password

### Issue 3: "Database Does Not Exist" Error

**Cause:** Database name mismatch

**Fix:**
1. Verify database name is `complyeasy`
2. Create database if needed:
   ```bash
   psql "postgresql://complyeasy_admin:[PASSWORD]@[ENDPOINT]:5432/postgres"
   CREATE DATABASE complyeasy;
   \q
   ```

### Issue 4: "Table Does Not Exist" Error

**Cause:** Import failed or incomplete

**Fix:**
1. Drop and recreate database:
   ```bash
   psql "postgresql://complyeasy_admin:[PASSWORD]@[ENDPOINT]:5432/postgres"
   DROP DATABASE complyeasy;
   CREATE DATABASE complyeasy;
   \q
   ```
2. Re-run import (Step 3.2)

### Issue 5: Prisma Migration Errors

**Fix:**
```bash
# Reset Prisma
cd server
npx prisma migrate reset

# Re-apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### Issue 6: Slow Performance

**Optimization:**

1. **Enable connection pooling:**
   ```env
   DATABASE_URL="postgresql://complyeasy_admin:[PASSWORD]@[ENDPOINT]:5432/complyeasy?schema=public&connection_limit=10&pool_timeout=20"
   ```

2. **Create indexes (if needed):**
   ```sql
   CREATE INDEX idx_user_email ON "User"(email);
   CREATE INDEX idx_organization_id ON "ComplianceFramework"("organizationId");
   CREATE INDEX idx_risk_organization ON "Risk"("organizationId");
   ```

3. **Upgrade RDS instance size:**
   - AWS RDS Console → Modify
   - Choose larger instance class
   - Apply changes

---

## 📊 Migration Checklist

Use this checklist to track your progress:

- [ ] **Pre-Migration**
  - [ ] AWS RDS instance created
  - [ ] Security group configured
  - [ ] RDS endpoint and credentials saved
  - [ ] Current `.env` backed up

- [ ] **Data Export**
  - [ ] Supabase data exported (pg_dump)
  - [ ] Export file verified (size > 0)
  - [ ] Backup stored in multiple locations

- [ ] **Data Import**
  - [ ] Connection to AWS RDS tested
  - [ ] Data imported successfully
  - [ ] Row counts verified
  - [ ] Sample data checked

- [ ] **Configuration**
  - [ ] `DATABASE_URL` updated in `.env`
  - [ ] SSL mode configured (production)
  - [ ] Prisma client regenerated

- [ ] **Testing**
  - [ ] Server starts without errors
  - [ ] Health check passes
  - [ ] API endpoints work
  - [ ] Frontend works
  - [ ] User authentication works
  - [ ] CRUD operations work

- [ ] **Production Deployment**
  - [ ] Vercel environment variables updated
  - [ ] Production deployment successful
  - [ ] Production site tested
  - [ ] No errors in logs

- [ ] **Post-Migration**
  - [ ] Data integrity verified
  - [ ] Performance acceptable
  - [ ] Backups configured
  - [ ] Monitoring set up
  - [ ] Old Supabase connection removed

---

## 🚨 Important Notes

### Security Best Practices

1. **Never commit `.env` files to Git**
   ```bash
   # Verify .env is in .gitignore
   grep ".env" .gitignore
   ```

2. **Use strong passwords**
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Generate with: `openssl rand -base64 24`

3. **Rotate credentials regularly**
   - Change RDS password every 90 days
   - Update in all environments

4. **Enable SSL for production**
   - Always use `sslmode=require` in production
   - Never disable SSL checks

### Backup Strategy

1. **AWS RDS Automated Backups**
   - Enabled by default (7 days retention)
   - Configure in RDS settings

2. **Manual Backups**
   ```bash
   # Weekly backup script
   pg_dump "postgresql://[URL]" > backup_$(date +%Y%m%d).sql
   ```

3. **Store backups in S3**
   ```bash
   aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
   ```

### Cost Optimization

1. **Use Reserved Instances** (production)
   - 30-60% cost savings
   - 1-year or 3-year commitment

2. **Stop Dev/Test instances when not in use**
   - Can stop RDS instances for up to 7 days
   - Automatically restarts after 7 days

3. **Monitor storage growth**
   - Enable storage autoscaling
   - Set appropriate maximum threshold

---

## 📞 Support

If you encounter issues:

1. **Check AWS RDS Logs**
   - AWS Console → RDS → Your DB → Logs & events

2. **Check Application Logs**
   ```bash
   tail -f server/logs/error.log
   ```

3. **Test Connection Manually**
   ```bash
   psql "postgresql://[URL]"
   ```

4. **AWS RDS Documentation**
   - https://docs.aws.amazon.com/rds/

---

## ✅ Success Criteria

Migration is successful when:

- ✅ All tables exist in AWS RDS
- ✅ Row counts match Supabase
- ✅ Application starts without errors
- ✅ Users can log in
- ✅ CRUD operations work
- ✅ No data loss
- ✅ Performance is acceptable
- ✅ Backups are configured

---

**Migration Complete!** 🎉

Your database is now running on AWS RDS PostgreSQL.

**Next Steps:**
1. Monitor performance for 24-48 hours
2. Set up CloudWatch alarms
3. Configure automated backups to S3
4. Decommission Supabase after verifying everything works (keep backup for 30 days)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-16
**Author:** Claude Code
