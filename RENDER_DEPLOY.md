# Render Deployment Guide

## Quick Deploy to Render.com (Recommended)

Render.com is better suited for Express apps with database connections.

### Step 1: Create Account

Go to https://render.com and sign up (free tier available)

### Step 2: New Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `PuuGoo/note-vocabulary-v2`
3. Configure:
   - **Name**: vocapro
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Step 3: Add Environment Variables

Add these in Render dashboard:

```
DATABASE_URL=your-azure-sql-connection-string
SESSION_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
RAPIDAPI_KEY=your-rapidapi-key
NODE_ENV=production
```

### Step 4: Update Google OAuth

Update redirect URI to:

```
https://vocapro.onrender.com/auth/google/callback
```

### Step 5: Deploy

Click "Create Web Service" and Render will auto-deploy!

## Advantages over Vercel

- ✅ Better for long-running Node.js apps
- ✅ Persistent filesystem (for logs)
- ✅ No cold starts after 15 minutes
- ✅ Native WebSocket support
- ✅ Free SSL certificate
- ✅ Automatic deploys from GitHub

## Free Tier Limits

- 750 hours/month (always on)
- Spins down after 15 min of inactivity
- First request may take 30s to wake up
