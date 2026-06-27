# Deployment Guide - Vercel

## Prerequisites
1. A Vercel account (https://vercel.com)
2. The project pushed to GitHub/GitLab/Bitbucket
3. Turso database credentials (already set up)
4. Mailtrap credentials (for email verification)
5. ZHIPU API key (for AI features)

## Step 1: Set Up Vercel Project
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm ci`

## Step 2: Add Environment Variables
Go to your Vercel project settings → Environment Variables, and add:
```env
# AI Configuration
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_API_KEY=ea105e3214d040469e9cc9d24569b0a4.JQF6Nk0GQR2yQlBb

# Mailtrap Configuration
MAILTRAP_TOKEN=your_real_mailtrap_token_here
MAILTRAP_SENDER_EMAIL=your_real_sender_email_here
MAILTRAP_SENDER_NAME=ColoBrief AI

# JWT Secret
JWT_SECRET=c52dc37daea9fdbd145b326210e8c2cf5350a1dad2ccdfa4e457f4e18a18542a

# Turso Database Configuration
TURSO_DATABASE_URL=libsql://coldbrief-ibrahimaamir27.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODI1Mzg3ODIsImlkIjoiMDE5ZjA3OTctMDkwMS03ZmU2LTlhMGYtNDdlNWEwYTc0Y2MyIiwicmlkIjoiNDBmNzgwMTktY2Q5NS00N2Q4LWExYTYtYTc4YWFhNmNjNGYxIn0.cZS5PKGbukBEmGMEmvhKrU5-_WDyYy6kZNBx1WL8wnLjXsnZog9moeHJ6tlOQMSHj5GaCB03M2sGPbNcY0uvCA

NODE_ENV=production
```

## Step 3: Deploy
Click "Deploy"! Your app will be live in a few minutes.

## Important Notes
- Remember to replace `MAILTRAP_TOKEN` and `MAILTRAP_SENDER_EMAIL` with your actual credentials
- The `vercel.json` file has optional region configuration (you can change `regions` if needed)
- Make sure your Git repository is up to date before deploying
