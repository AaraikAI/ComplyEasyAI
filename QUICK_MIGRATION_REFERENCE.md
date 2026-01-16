# Quick Migration Reference Card

## 🎯 TL;DR - Environment Variable Update

### File Location
```
/home/user/ComplyEasyAI/server/.env
```

### What to Change

**BEFORE (Supabase):**
```env
DATABASE_URL="postgresql://postgres:your_password@db.xxxxxxxxx.supabase.co:5432/postgres?schema=public"
```

**AFTER (AWS RDS):**
```env
DATABASE_URL="postgresql://complyeasy_admin:YOUR_RDS_PASSWORD@complyeasyai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/complyeasy?schema=public&sslmode=require"
```

### Connection String Components

```
postgresql://[USERNAME]:[PASSWORD]@[ENDPOINT]:[PORT]/[DATABASE]?schema=public&sslmode=require

Replace:
├── USERNAME ──────► complyeasy_admin (RDS master username)
├── PASSWORD ──────► Your RDS master password
├── ENDPOINT ──────► complyeasyai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
├── PORT ──────────► 5432
└── DATABASE ──────► complyeasy
```

---

## ⚡ Quick Migration Commands

### 1. Export from Supabase
```bash
pg_dump "postgresql://postgres:SUPABASE_PASSWORD@db.XXXX.supabase.co:5432/postgres" \
  --schema=public --no-owner --no-privileges \
  -f ~/complyeasy_backup.sql
```

### 2. Import to AWS RDS
```bash
psql "postgresql://complyeasy_admin:RDS_PASSWORD@complyeasyai-db.XXX.rds.amazonaws.com:5432/complyeasy" \
  -f ~/complyeasy_backup.sql
```

### 3. Update .env
```bash
nano /home/user/ComplyEasyAI/server/.env
# Update DATABASE_URL
# Save: Ctrl+X, Y, Enter
```

### 4. Test Connection
```bash
cd /home/user/ComplyEasyAI/server
npx prisma db pull
npm run dev
```

---

## 🔍 Verification Checklist

```bash
# 1. Test database connection
psql "postgresql://[YOUR_NEW_URL]"

# 2. Check tables exist
\dt

# 3. Verify data
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Organization";

# 4. Test application
npm run dev

# 5. Check health endpoint
curl http://localhost:5000/health
```

---

## 🆘 Emergency Rollback

If something goes wrong:

```bash
# 1. Restore original .env
cp /home/user/ComplyEasyAI/server/.env.backup-* /home/user/ComplyEasyAI/server/.env

# 2. Regenerate Prisma
cd /home/user/ComplyEasyAI/server
npx prisma generate

# 3. Restart server
npm run dev
```

---

## 📍 Key File Locations

```
Configuration Files:
├── /home/user/ComplyEasyAI/server/.env ────────────► Primary config (UPDATE THIS)
├── /home/user/ComplyEasyAI/server/prisma/schema.prisma ──► Database schema
└── /home/user/ComplyEasyAI/server/.env.example ────► Template

Backup Locations:
├── ~/complyeasy_backup.sql ──────────────────────► Database export
└── /home/user/ComplyEasyAI/server/.env.backup* ──► Config backup
```

---

## 🔐 AWS RDS Security Group Settings

**Must Allow:**
```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: Your IP Address/32 (or 0.0.0.0/0 for open access)
```

**Find Security Group:**
1. AWS Console → EC2 → Security Groups
2. Search: `complyeasyai-db-sg`
3. Edit inbound rules → Add PostgreSQL rule

---

## 📊 Expected Values After Migration

| Item | Value |
|------|-------|
| **RDS Endpoint** | `complyeasyai-db.xxxxxxxxx.[region].rds.amazonaws.com` |
| **Port** | `5432` |
| **Database Name** | `complyeasy` |
| **Master Username** | `complyeasy_admin` |
| **Schema** | `public` |
| **Total Tables** | 82 models (from Prisma schema) |

---

## ⚠️ Common Errors & Quick Fixes

| Error | Fix |
|-------|-----|
| **"Connection refused"** | Check security group allows port 5432 |
| **"Authentication failed"** | Verify username/password in DATABASE_URL |
| **"Database does not exist"** | Create database: `CREATE DATABASE complyeasy;` |
| **"Table does not exist"** | Re-run import: `psql [URL] -f backup.sql` |
| **Prisma errors** | Regenerate: `npx prisma generate` |

---

## 🚀 Production Deployment Update

**Vercel:**
1. Go to: https://vercel.com/dashboard
2. Select project → Settings → Environment Variables
3. Edit `DATABASE_URL`
4. Add AWS RDS connection string
5. Redeploy

**Other Platforms:**
Update `.env` on server and restart application.

---

## 📞 Need Help?

**Test Connection:**
```bash
telnet complyeasyai-db.xxxxxxxxx.rds.amazonaws.com 5432
```

**Check Logs:**
```bash
# Application logs
tail -f /home/user/ComplyEasyAI/server/logs/error.log

# RDS logs
AWS Console → RDS → Your DB → Logs & events
```

**Verify .env is correct:**
```bash
cat /home/user/ComplyEasyAI/server/.env | grep DATABASE_URL
```

---

**Full Documentation:** `DATABASE_MIGRATION_SUPABASE_TO_AWS_RDS.md`
