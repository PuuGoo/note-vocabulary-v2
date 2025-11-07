# Vercel Deployment Guide

## Quick Deploy

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Configure Environment Variables

After deployment, add these environment variables in Vercel dashboard:

```
DATABASE_URL=sqlserver://...
SESSION_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
RAPIDAPI_KEY=your-rapidapi-key
```

## Update Google OAuth Redirect

Go to Google Cloud Console and add:

```
https://your-project-name.vercel.app/auth/google/callback
```

## Auto-Deploy

Every push to `main` branch will automatically deploy to Vercel.
