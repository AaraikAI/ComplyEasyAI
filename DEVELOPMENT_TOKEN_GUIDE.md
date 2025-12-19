# Development Token Guide

## How to Get Real Tokens for Testing

In development mode, the backend now returns the magic link token directly in the API response. This allows you to test authentication without checking emails.

### Automatic Token Retrieval

When you request a magic link (either login or registration), the backend will:
1. Generate a real token and store it in the database
2. Send the email (if SendGrid is configured)
3. **Return the token in the response** (development mode only)

The frontend automatically uses this token when you click "Simulate Clicking Link from Email".

### Manual Token Retrieval from Database

If you need to get a token manually:

```bash
# Connect to your Supabase database
# Or use Prisma Studio
cd server
npx prisma studio
```

Then:
1. Open Prisma Studio (runs on http://localhost:5555)
2. Navigate to `MagicLink` table
3. Find the token for your email
4. Copy the token value
5. Use it in the frontend to verify

### Using the Token

Once you have a token:

1. **Via Frontend UI:**
   - The token is automatically set when you request a magic link
   - Click "Simulate Clicking Link from Email"
   - It will use the real token from the backend

2. **Via API:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/verify \
     -H "Content-Type: application/json" \
     -d '{"token":"your-token-here"}'
   ```

### Important Notes

- **Development Only:** Tokens are only returned in development mode (`NODE_ENV=development`)
- **Production:** In production, tokens are only sent via email for security
- **Token Expiry:** Tokens expire after 15 minutes
- **One-Time Use:** Each token can only be used once

### Troubleshooting

**Token not working?**
- Check if token is expired (15 minutes)
- Verify token exists in database
- Check backend logs for errors
- Ensure database connection is working

**Not receiving devToken?**
- Verify `NODE_ENV=development` in `server/.env`
- Check backend is running in development mode
- Look at browser console for the response

