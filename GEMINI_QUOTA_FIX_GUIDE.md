# Gemini API Quota Exceeded - Fix Guide

## 🔴 Current Issue
**Error:** `AI service quota exceeded. Please check your Google AI Studio quota or upgrade your plan.`

**Status:** ✅ Error handling is working correctly - this is the actual issue from Google's API.

---

## 🔍 What This Means

The Google Gemini API has rate limits and quotas:
- **Free Tier:** Limited requests per minute/day
- **Paid Tier:** Higher limits based on billing plan
- **Quota Reset:** Usually resets daily or monthly

---

## ✅ Solutions

### Solution 1: Check Your Quota Status (Recommended)

1. **Go to Google AI Studio:**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Check API Usage:**
   - Look for "Usage" or "Quota" section
   - Check current usage vs. limits
   - See when quota resets

3. **Check Billing:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "Billing" → "APIs & Services" → "Quotas"
   - Search for "Generative Language API"
   - Check quota limits and usage

### Solution 2: Enable Billing (For Higher Limits)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with the same Google account

2. **Enable Billing:**
   - Go to "Billing" → "Link a billing account"
   - Add a payment method
   - This enables higher quota limits

3. **Check Quota Limits:**
   - After enabling billing, quotas increase significantly
   - Free tier: ~15 requests/minute
   - Paid tier: Much higher limits

### Solution 3: Wait for Quota Reset

- **Free Tier:** Quota usually resets daily
- **Check Reset Time:** In Google AI Studio dashboard
- **Temporary Workaround:** Wait until quota resets

### Solution 4: Use a Different API Key

If you have multiple Google accounts:
1. Create a new API key from a different account
2. Update `GEMINI_API_KEY` in `server/.env`
3. Restart the backend server

---

## 🔧 Step-by-Step Fix

### Step 1: Check Current Quota

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in
3. Click on your API key
4. Check "Usage" or "Quota" section
5. Note current usage and limits

### Step 2: Enable Billing (Recommended for Production)

1. Go to: https://console.cloud.google.com/
2. Select your project (or create one)
3. Go to "Billing" → "Link a billing account"
4. Add payment method
5. Wait a few minutes for quotas to update

### Step 3: Update API Key (If Needed)

1. If you need a new key:
   - Go to Google AI Studio
   - Create new API key
   - Copy the key

2. Update `server/.env`:
   ```bash
   GEMINI_API_KEY=your-new-api-key-here
   ```

3. Restart backend:
   ```bash
   cd server
   npm run dev
   ```

### Step 4: Verify Fix

1. Test the chatbot again
2. Check if error is resolved
3. Monitor quota usage

---

## 📊 Understanding Gemini API Quotas

### Free Tier Limits
- **Requests per minute:** ~15 requests/minute
- **Daily quota:** Varies (usually 1,500-2,000 requests/day)
- **Monthly quota:** Varies

### Paid Tier Limits (After Enabling Billing)
- **Requests per minute:** Much higher (60+ requests/minute)
- **Daily quota:** Significantly higher
- **Cost:** Pay-as-you-go pricing

### Rate Limits
- **Per-minute limit:** Prevents burst traffic
- **Daily limit:** Total requests per day
- **Monthly limit:** Total requests per month

---

## 🛠️ Temporary Workarounds

### Option 1: Reduce Request Frequency
- Wait between AI requests
- Don't spam the chatbot
- Space out requests

### Option 2: Use Caching
- Cache common AI responses
- Reduce API calls for similar queries

### Option 3: Implement Retry Logic
- Add exponential backoff
- Retry after quota reset

---

## 🔍 Debugging Commands

### Check API Key Status
```bash
# Test API key directly
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

### Check Backend Logs
```bash
# Look for quota errors in backend logs
# Should see: "AI service quota exceeded"
```

### Check Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Navigate to: APIs & Services → Quotas
3. Search: "Generative Language API"
4. Check quota usage and limits

---

## 📝 Quick Checklist

- [ ] **Check Google AI Studio quota status**
  - Visit: https://makersuite.google.com/app/apikey
  - Check usage vs. limits

- [ ] **Enable billing (for higher limits)**
  - Go to Google Cloud Console
  - Link billing account
  - Add payment method

- [ ] **Wait for quota reset (if free tier)**
  - Check reset time in dashboard
  - Usually resets daily

- [ ] **Use different API key (if available)**
  - Create new key from different account
  - Update `server/.env`

- [ ] **Restart backend after changes**
  ```bash
  cd server
  npm run dev
  ```

---

## 🎯 Recommended Action

**For Development:**
1. Enable billing in Google Cloud Console
2. This gives you much higher quotas
3. Free tier has very low limits

**For Production:**
1. Set up proper billing
2. Monitor quota usage
3. Implement rate limiting on your side
4. Add caching to reduce API calls

---

## 💡 Prevention Tips

1. **Monitor Quota Usage:**
   - Check Google AI Studio dashboard regularly
   - Set up alerts if possible

2. **Implement Caching:**
   - Cache common AI responses
   - Reduce redundant API calls

3. **Rate Limiting:**
   - Already implemented in code (60 requests/minute per user)
   - Consider reducing if hitting limits

4. **Error Handling:**
   - Show user-friendly messages
   - Suggest waiting or upgrading

---

## 📞 Support Resources

- **Google AI Studio:** https://makersuite.google.com/
- **Google Cloud Console:** https://console.cloud.google.com/
- **Gemini API Docs:** https://ai.google.dev/docs
- **Quota Documentation:** https://ai.google.dev/pricing

---

## ✅ After Fixing

1. **Test the chatbot:**
   - Try sending a message
   - Should work if quota is available

2. **Monitor usage:**
   - Check Google AI Studio dashboard
   - Watch for quota warnings

3. **Set up alerts:**
   - Configure quota alerts in Google Cloud
   - Get notified before hitting limits

---

**Note:** The error message is now working correctly and showing you the real issue. Once you fix the quota problem, the AI features will work again!

