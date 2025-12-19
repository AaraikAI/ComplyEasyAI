# Quick Start - Get Application Working at 100%

## 🚀 Minimum Required API Keys (Core Functionality)

### 1. Google Gemini API Key ⚡ REQUIRED
**Get it:** https://makersuite.google.com/app/apikey
**Add to:**
- `server/.env` → `GEMINI_API_KEY=your-key`
- `.env.local` (root) → `GEMINI_API_KEY=your-key`

### 2. SendGrid API Key 📧 REQUIRED (for authentication)
**Get it:** https://signup.sendgrid.com/ (free tier available)
**Steps:**
1. Sign up and verify email
2. Settings → API Keys → Create API Key
3. Verify a sender email in Settings → Sender Authentication
**Add to `server/.env`:**
```
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=your-verified-email@example.com
SENDGRID_FROM_NAME=ComplyEasy AI
```

### 3. Generate JWT Secrets 🔐 REQUIRED
**Run these commands:**
```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Refresh Secret  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Add to `server/.env`:**
```
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
ENCRYPTION_KEY=your-generated-encryption-key-here
```

## ✅ Already Configured
- ✅ Database (Supabase PostgreSQL)
- ✅ Development token helper (backend returns tokens in dev mode)

## 🧪 Testing After Setup

1. **Restart servers:**
   ```bash
   # Stop all
   lsof -ti:3000,3001 | xargs kill -9
   
   # Start backend
   cd server && npm run dev
   
   # Start frontend (new terminal)
   cd .. && npm run dev
   ```

2. **Test authentication:**
   - Go to http://localhost:3000
   - Enter email → Request magic link
   - Backend returns token in development mode
   - Click "Simulate Clicking Link from Email"
   - Should log you in successfully!

3. **Test AI features:**
   - Log in
   - Try generating a compliance report
   - Should work if GEMINI_API_KEY is set

## 📚 Full Documentation
- See `API_KEYS_SETUP.md` for complete guide
- See `DEVELOPMENT_TOKEN_GUIDE.md` for token testing
