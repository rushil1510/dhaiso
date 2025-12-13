# 🚀 Dhaiso Deployment Guide

## Deployment Strategy

- **Frontend**: Vercel (React/Vite app)
- **Backend**: Render.com (Node.js with WebSocket support)

---

## Prerequisites

1. ✅ GitHub account
2. ✅ Vercel account (sign up at [vercel.com](https://vercel.com) with GitHub)
3. ✅ Render account (sign up at [render.com](https://render.com) with GitHub)
4. ✅ Push your code to GitHub

---

## Step 1: Push to GitHub

If you haven't already:

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit - Dhaiso card game"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/dhaiso.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service

1. Go to [render.com](https://render.com) and log in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your `dhaiso` repository

### 2.2 Configure Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `dhaiso-backend` (or your preferred name) |
| **Root Directory** | `server` |
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2.3 Add Environment Variables

In the "Environment" section, add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | (leave empty for now, we'll update after deploying frontend) |

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (takes 2-3 minutes)
3. **Copy your backend URL** - it will look like: `https://dhaiso-backend.onrender.com`

> ⚠️ **Important**: Render free tier spins down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds to wake up.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Update Environment Variable

Before deploying, update `client/.env.production` with your Render backend URL:

```bash
# Edit client/.env.production
VITE_BACKEND_URL=https://dhaiso-backend.onrender.com
```

Replace `dhaiso-backend.onrender.com` with your actual Render URL from Step 2.4.

### 3.2 Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to client directory
cd client

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# ? Set up and deploy "~/Documents/VibeCoding/dhaiso/client"? [Y/n] y
# ? Which scope do you want to deploy to? [Your account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? dhaiso
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

### 3.3 Deploy to Production

After the preview deployment succeeds:

```bash
vercel --prod
```

**Copy your frontend URL** - it will look like: `https://dhaiso.vercel.app`

### 3.4 Alternative: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: `https://dhaiso-backend.onrender.com` (your Render URL)
6. Click **"Deploy"**

---

## Step 4: Update Backend CORS

Now that you have your Vercel frontend URL, update the backend:

1. Go to your Render dashboard
2. Select your `dhaiso-backend` service
3. Go to **"Environment"** tab
4. Add/Update environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://dhaiso.vercel.app` (your Vercel URL)
5. Click **"Save Changes"**
6. Service will automatically redeploy

---

## Step 5: Test Your Deployment

1. Open your Vercel URL: `https://dhaiso.vercel.app`
2. Open 5 browser tabs (or different devices)
3. Join as different players
4. Start a game!

### Troubleshooting

**If connection fails:**

1. Open browser console (F12)
2. Check for CORS errors
3. Verify backend URL in frontend is correct
4. Check Render logs for backend errors
5. Ensure backend is awake (first request takes ~30s on free tier)

**Check backend logs:**
- Go to Render dashboard → Your service → "Logs" tab

---

## Environment Variables Summary

### Frontend (Vercel)
```
VITE_BACKEND_URL=https://dhaiso-backend.onrender.com
```

### Backend (Render)
```
NODE_ENV=production
FRONTEND_URL=https://dhaiso.vercel.app
```

---

## Future Deployments

### Update Frontend
```bash
cd client
git add .
git commit -m "Update frontend"
git push

# Vercel auto-deploys on push to main branch
# Or manually: vercel --prod
```

### Update Backend
```bash
cd server
git add .
git commit -m "Update backend"
git push

# Render auto-deploys on push to main branch
```

---

## Monitoring

### Vercel Dashboard
- View deployments: [vercel.com/dashboard](https://vercel.com/dashboard)
- Check build logs
- View analytics

### Render Dashboard
- View service status: [dashboard.render.com](https://dashboard.render.com)
- Check logs
- Monitor uptime

---

## Cost Breakdown

| Service | Tier | Cost | Limitations |
|---------|------|------|-------------|
| Vercel | Free | $0 | 100GB bandwidth/month, unlimited deployments |
| Render | Free | $0 | Spins down after 15 min inactivity, 750 hours/month |

---

## Upgrading (Optional)

If you want to avoid the spin-down delay:

**Render Paid Plan**: $7/month
- No spin-down
- Always-on service
- Better performance

---

## URLs

After deployment, save these:

- **Frontend**: `https://dhaiso.vercel.app`
- **Backend**: `https://dhaiso-backend.onrender.com`

Share the frontend URL with friends to play! 🎮
