# ComplyEasy AI - Setup Guides

## 1. SendGrid Email Setup (Magic Link)

### Step-by-Step Instructions

1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up for a free account (100 emails/day free tier)
   - Verify your email address

2. **Create API Key**
   - Log in to SendGrid dashboard
   - Navigate to **Settings** → **API Keys**
   - Click **Create API Key**
   - Name: "ComplyEasy AI Production"
   - Permissions: Select **Full Access** (or at minimum: **Mail Send**)
   - Click **Create & View**
   - **IMPORTANT**: Copy the API key immediately (you won't see it again)
   - Save it securely

3. **Verify Sender Identity**
   - Navigate to **Settings** → **Sender Authentication**
   - Choose one:
     - **Single Sender Verification** (for testing):
       - Click **Create New Sender**
       - Fill in your details:
         - From Name: "ComplyEasy AI"
         - From Email: your-email@yourdomain.com
         - Reply To: your-email@yourdomain.com
       - Verify the email sent to your inbox
     - **Domain Authentication** (for production):
       - Click **Authenticate Your Domain**
       - Follow DNS setup instructions
       - Add CNAME records to your domain DNS

4. **Add API Key to Environment**
   - Open `server/.env` file
   - Add or update:
     ```
     SENDGRID_API_KEY=SG.your_api_key_here
     ```
   - Replace `your_api_key_here` with the API key you copied
   - Save the file

5. **Restart Backend Server**
   - Stop the backend server (Ctrl+C)
   - Restart: `cd server && npm run dev`

6. **Test Magic Link**
   - Go to landing page
   - Enter your email
   - Click "Send Magic Link"
   - Check your email inbox (and spam folder)
   - Click the magic link to verify it works

### Troubleshooting

- **Email not received**: Check spam folder, verify sender identity
- **API Key Invalid**: Ensure no extra spaces in `.env` file
- **Rate Limit**: Free tier allows 100 emails/day
- **Domain Issues**: Use Single Sender Verification for quick testing

---

## 2. AWS S3 Setup (File Uploads)

### Step-by-Step Instructions

1. **Create AWS Account**
   - Go to https://aws.amazon.com
   - Sign up for AWS account (free tier available)
   - Complete account verification

2. **Create S3 Bucket**
   - Log in to AWS Console
   - Navigate to **S3** service
   - Click **Create bucket**
   - Bucket name: `complyeasy-ai-uploads` (must be globally unique)
   - Region: Choose closest to your users (e.g., `us-east-1`)
   - **Block Public Access**: Uncheck (or configure CORS properly)
   - Click **Create bucket**

3. **Configure CORS**
   - Select your bucket
   - Go to **Permissions** tab
   - Scroll to **Cross-origin resource sharing (CORS)**
   - Click **Edit**
   - Add this configuration:
     ```json
     [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
         "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
         "ExposeHeaders": ["ETag"],
         "MaxAgeSeconds": 3000
       }
     ]
     ```
   - Replace `yourdomain.com` with your production domain
   - Click **Save changes**

4. **Create IAM User for S3 Access**
   - Navigate to **IAM** service
   - Click **Users** → **Create user**
   - Username: `complyeasy-s3-user`
   - Click **Next**

5. **Attach S3 Policy**
   - Select **Attach policies directly**
   - Search for and select: **AmazonS3FullAccess** (or create custom policy with only your bucket)
   - Click **Next** → **Create user**

6. **Create Access Keys**
   - Click on the user you just created
   - Go to **Security credentials** tab
   - Scroll to **Access keys**
   - Click **Create access key**
   - Select **Application running outside AWS**
   - Click **Next**
   - Add description: "ComplyEasy AI S3 Access"
   - Click **Create access key**
   - **IMPORTANT**: Copy both:
     - **Access key ID**
     - **Secret access key** (click "Show" to reveal)
   - Save these securely

7. **Add to Environment**
   - Open `server/.env` file
   - Add:
     ```
     AWS_ACCESS_KEY_ID=your_access_key_id_here
     AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
     AWS_REGION=us-east-1
     AWS_S3_BUCKET=complyeasy-ai-uploads
     ```
   - Replace values with your actual credentials
   - Save the file

8. **Restart Backend Server**
   - Stop the backend server
   - Restart: `cd server && npm run dev`

9. **Test File Upload**
   - Go to Framework Details
   - Click "Upload Evidence" on a control
   - Select a file
   - Verify upload succeeds

### Troubleshooting

- **Access Denied**: Check IAM user permissions
- **CORS Error**: Verify CORS configuration matches your domain
- **Bucket Not Found**: Ensure bucket name is correct in `.env`
- **Region Mismatch**: Ensure AWS_REGION matches bucket region

---

## 3. Google Workspace OAuth Setup

### Step-by-Step Instructions

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Click **Select a project** → **New Project**
   - Project name: "ComplyEasy AI"
   - Click **Create**

2. **Enable Google Workspace API**
   - In Google Cloud Console, go to **APIs & Services** → **Library**
   - Search for "Google Workspace API" or "Admin SDK API"
   - Click on **Admin SDK API**
   - Click **Enable**

3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - If prompted, configure OAuth consent screen first:
     - User Type: **External** (or Internal if using Google Workspace)
     - App name: "ComplyEasy AI"
     - User support email: your email
     - Developer contact: your email
     - Click **Save and Continue**
     - Scopes: Add `https://www.googleapis.com/auth/admin.directory.user.readonly`
     - Click **Save and Continue**
     - Test users: Add your email
     - Click **Save and Continue**

4. **Create OAuth Client**
   - Application type: **Web application**
   - Name: "ComplyEasy AI Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/integrations/google/callback` (development)
     - `https://yourdomain.com/api/integrations/google/callback` (production)
   - Click **Create**
   - **IMPORTANT**: Copy:
     - **Client ID**
     - **Client Secret**
   - Save these securely

5. **Add to Environment**
   - Open `server/.env` file
   - Add:
     ```
     GOOGLE_CLIENT_ID=your_client_id_here
     GOOGLE_CLIENT_SECRET=your_client_secret_here
     GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
     ```
   - Replace with your actual values
   - For production, update `GOOGLE_REDIRECT_URI` to your production URL
   - Save the file

6. **Update Backend Code** (if needed)
   - Ensure `server/src/services/integrations/googleService.ts` uses these env vars
   - Verify callback route is configured in `server/src/routes/integrations.ts`

7. **Restart Backend Server**
   - Stop the backend server
   - Restart: `cd server && npm run dev`

8. **Test OAuth Flow**
   - Go to Integrations page
   - Click on "Google Workspace"
   - Click "Connect"
   - Should redirect to Google OAuth
   - Authorize the application
   - Should redirect back and show "Connected"

### Troubleshooting

- **Error 401: invalid_client**: 
  - Check Client ID and Secret are correct
  - Ensure no extra spaces in `.env` file
  - Verify redirect URI matches exactly (including http vs https)
- **Redirect URI Mismatch**: 
  - Ensure redirect URI in Google Console matches exactly
  - Check for trailing slashes
  - Verify protocol (http vs https)
- **Access Denied**: 
  - Add your email as a test user in OAuth consent screen
  - Verify scopes are correct

---

## 4. Database Setup (PostgreSQL/Supabase)

### Using Supabase (Recommended)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Sign up for free account
   - Click **New Project**
   - Project name: "ComplyEasy AI"
   - Database password: Create a strong password (save it!)
   - Region: Choose closest to you
   - Click **Create new project**

2. **Get Connection String**
   - Wait for project to finish setting up (~2 minutes)
   - Go to **Settings** → **Database**
   - Scroll to **Connection string**
   - Select **URI** tab
   - Copy the connection string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with your actual password

3. **Add to Environment**
   - Open `server/.env` file
   - Add:
     ```
     DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
     ```
   - Replace with your actual connection string
   - Save the file

4. **Run Migrations**
   - In `server` directory:
     ```bash
     npx prisma migrate dev
     ```
   - This creates all database tables

5. **Verify Connection**
   - Restart backend server
   - Check logs for "Database connection established"

### Troubleshooting

- **Connection Timeout**: Check firewall, verify IP allowlisting in Supabase
- **Authentication Failed**: Verify password in connection string
- **SSL Required**: Add `?sslmode=require` to connection string

---

## Environment Variables Summary

Add all these to `server/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@host:5432/database

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# AWS S3
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=complyeasy-ai-uploads

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

---

## 5. Session Management & Token Refresh

### How It Works

The application uses JWT tokens for authentication with automatic refresh:

- **Access Token**: Valid for 7 days (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token**: Valid for 30 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Automatic Refresh**: Tokens are automatically refreshed when they expire
- **Periodic Refresh**: Tokens are refreshed every 6 hours in the background

### Configuration

Add to `server/.env`:

```env
# JWT Token Expiration (optional - defaults shown)
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### Behavior

1. **On Login**: Both access and refresh tokens are stored in localStorage
2. **On API Call**: If access token expires (401 error), the app automatically:
   - Uses refresh token to get new access token
   - Retries the original request
   - If refresh fails, redirects to login
3. **Background Refresh**: Every 6 hours, the app proactively refreshes the token
4. **On Logout**: All tokens are cleared from localStorage

### Troubleshooting

- **Session Expired Errors**: Check that `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- **Frequent Logouts**: Increase `JWT_EXPIRES_IN` value
- **Refresh Token Invalid**: User must log in again (refresh token expired after 30 days)

---

## Next Steps

After completing all setups:
1. Restart backend server
2. Test each integration:
   - Magic link email
   - File upload to S3
   - Google OAuth connection
   - Token refresh (wait 7 days or manually expire token)
3. Verify all features work correctly
4. Run risk scan to test framework compliance scanning

