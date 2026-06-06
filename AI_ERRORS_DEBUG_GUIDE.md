# AI Features Error Debugging Guide

## 🔍 Current Issue
**Error:** `Failed to get chat response` when interacting with AI features (chatbot, report generator, policy generator)

## ✅ Fixes Applied

### 1. Improved Error Handling in AI Controller
**File:** `server/src/controllers/aiController.ts`
- Preserves original error messages from Gemini service
- Better logging with user context
- More specific error messages passed to frontend

### 2. Enhanced Frontend Error Messages
**File:** `services/geminiService.ts`
- Checks for authentication token before making API calls
- Provides specific error messages for different failure scenarios
- Better debugging information in development mode

### 3. Better API Error Handling
**File:** `services/api.ts`
- Already improved in previous fixes
- Network error detection
- Detailed error logging

---

## 🐛 Most Likely Causes

### 1. **Not Authenticated** (Most Common)
**Symptoms:**
- Error: "Failed to get chat response"
- No active auth session

**Solution:**
1. Open browser DevTools (F12)
2. Check if you're logged in. The JWT is stored in an **httpOnly cookie**, so it
   is not readable from JavaScript/`localStorage`. Verify the session instead:
   - **Application tab → Cookies**: confirm the auth cookie (e.g. `accessToken`)
     is present and not expired.
   - **Network tab**: confirm requests are sent with `credentials: 'include'` and
     that `/api/auth/me` returns 200.
3. If there is no auth cookie, you need to log in:
   - Request a magic link
   - Verify the magic link token
   - The auth cookie will be set automatically

### 2. **Invalid/Expired Token**
**Symptoms:**
- Error: "Invalid token" or "Authentication required"
- Token exists but is expired or invalid

**Solution:**
1. Log out and log in again. Logging out clears the auth cookie server-side; then
   refresh the page and log in again to obtain a fresh session.
2. Or check token expiration in backend logs

### 3. **Backend Not Running**
**Symptoms:**
- Error: "Cannot connect to backend server"
- Network errors in console

**Solution:**
1. Check if backend is running:
   ```bash
   curl http://localhost:3001/health
   ```
2. Should return: `{"status":"healthy",...}`
3. If not, start backend:
   ```bash
   cd server
   npm run dev
   ```

### 4. **Gemini API Issues**
**Symptoms:**
- Error: "AI service quota exceeded" or "AI API authentication failed"
- Backend logs show Gemini API errors

**Solution:**
1. Check `server/.env` has valid `GEMINI_API_KEY`
2. Verify API key in [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Check quota limits

---

## 🔧 Step-by-Step Debugging

### Step 1: Check Authentication
The JWT lives in an httpOnly cookie and is not exposed to JavaScript. Verify the
session via DevTools rather than `localStorage`:

- **Application tab → Cookies → your app origin**: confirm the auth cookie is
  present and unexpired.
- **Network tab**: issue any authenticated request and confirm the auth cookie is
  attached (requests use `credentials: 'include'`) and `/api/auth/me` returns 200
  with your `id`, `email`, and `name`.

**Expected:**
- The auth cookie is present (httpOnly, so it shows in DevTools but not in JS).
- `/api/auth/me` returns 200 with the user object.

**If Missing:**
- You need to log in first
- Request a magic link
- Verify the token from email (or use devToken in development)

### Step 2: Test API Endpoint Directly
The browser uses the httpOnly auth cookie automatically. For manual `curl` testing,
either replay the cookie jar from a login response or supply a Bearer token captured
from the login API response body.

```bash
# Option A: reuse the auth cookie from a login round-trip
curl -X POST http://localhost:3001/api/auth/verify-magic-link \
  -H "Content-Type: application/json" \
  -d '{"token":"<magic-link-token>"}' -c cookies.txt

curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"message":"test"}'

# Option B: Bearer token taken from the login API response body
TOKEN="<jwt-from-login-response>"
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"test"}'
```

**Expected Response:**
```json
{"response":"AI response text here..."}
```

**If 401 Unauthorized:**
- Token is invalid or expired
- Need to log in again

**If 500 Error:**
- Check backend logs for detailed error
- Likely Gemini API issue

### Step 3: Check Backend Logs
```bash
# Backend logs will show detailed errors
# Look for:
# - "Chat error" - AI controller errors
# - "Gemini API Error" - Gemini service errors
# - "Invalid token" - Authentication errors
```

### Step 4: Check Frontend Console
Open browser DevTools (F12) → Console tab
- Look for detailed error logs
- Check "API Error:" logs for endpoint, status, and error message
- Check network tab for failed requests

---

## 🎯 Quick Fix Checklist

- [ ] **Are you logged in?**
  - In DevTools → Application → Cookies, confirm the httpOnly auth cookie is present
  - If absent, log in first

- [ ] **Is backend running?**
  - Check `http://localhost:3001/health`
  - Should return healthy status

- [ ] **Is token valid?**
  - Try logging out and back in
  - Logging out clears the auth cookie; then refresh and log in again

- [ ] **Check browser console**
  - Look for detailed error messages
  - Check network tab for API calls

- [ ] **Check backend logs**
  - Look for "Chat error" or "Gemini API Error"
  - Verify Gemini API key is configured

---

## 📋 Common Error Messages & Solutions

### "Failed to get chat response"
**Cause:** Generic error - check backend logs for actual error

**Solution:**
1. Check browser console for detailed error
2. Check backend logs
3. Verify authentication token

### "Authentication required. Please log in again."
**Cause:** No token or invalid token

**Solution:**
1. Log in again
2. Request new magic link
3. Verify token

### "Cannot connect to backend server"
**Cause:** Backend not running or wrong URL

**Solution:**
1. Check backend is running: `curl http://localhost:3001/health`
2. Verify `VITE_API_URL` in `.env.local` is `http://localhost:3001/api`
3. Restart backend if needed

### "AI service quota exceeded"
**Cause:** Gemini API quota limit reached

**Solution:**
1. Check [Google AI Studio](https://makersuite.google.com/app/apikey) for quota
2. Wait for quota reset or upgrade plan
3. Verify API key is valid

### "AI API authentication failed"
**Cause:** Invalid Gemini API key

**Solution:**
1. Check `GEMINI_API_KEY` in `server/.env`
2. Verify key in Google AI Studio
3. Restart backend after updating

---

## 🧪 Testing After Fixes

1. **Test Authentication:**
   ```bash
   # Request magic link
   curl -X POST http://localhost:3001/api/auth/magic-link \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

2. **Test Chat with Valid Token:**
   ```bash
   # Use token from magic link verification
   curl -X POST http://localhost:3001/api/ai/chat \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"message":"Hello"}'
   ```

3. **Test in Frontend:**
   - Log in through UI
   - Try chatbot
   - Check console for errors
   - Verify error messages are helpful

---

## 📝 Next Steps

1. **Check if you're logged in:**
   - Open DevTools → Application → Cookies
   - Confirm the httpOnly auth cookie is present (it is not visible to JS/`localStorage`)
   - If absent, log in first

2. **If logged in but still getting errors:**
   - Check browser console for detailed error
   - Check backend terminal for logs
   - Verify Gemini API key is configured

3. **If still having issues:**
   - Share the exact error message from browser console
   - Share backend logs
   - Verify all environment variables are set

---

## 🔍 Debugging Commands

```bash
# Check backend health
curl http://localhost:3001/health

# Check if backend is running
lsof -ti:3001

# Check backend logs (in terminal where backend is running)
# Look for error messages

# Test authentication
curl -X POST http://localhost:3001/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'

# Test AI endpoint (replace TOKEN with actual token)
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message":"test"}'
```

---

**Note:** The most common issue is **not being authenticated**. Make sure you're logged in before using AI features. The improved error messages will now tell you exactly what's wrong!

