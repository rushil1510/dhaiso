# 🎯 Quick Deployment Reference

## TL;DR - Deploy in 5 Minutes

### 1️⃣ Deploy Backend (Render)
1. Go to [render.com](https://render.com) → New Web Service
2. Connect GitHub repo
3. Settings:
   - Root: `server`
   - Build: `npm install && npm run build`
   - Start: `npm start`
4. Copy URL: `https://YOUR-APP.onrender.com`

### 2️⃣ Update Frontend Config
```bash
# Edit client/.env.production
VITE_BACKEND_URL=https://YOUR-APP.onrender.com
```

### 3️⃣ Deploy Frontend (Vercel)
```bash
cd client
npm install -g vercel
vercel login
vercel --prod
```

### 4️⃣ Update Backend CORS
In Render dashboard, add environment variable:
- `FRONTEND_URL` = `https://YOUR-APP.vercel.app`

### 5️⃣ Done! 🎉
Open `https://YOUR-APP.vercel.app` and play!

---

## Important URLs

| What | Where |
|------|-------|
| Render Dashboard | [dashboard.render.com](https://dashboard.render.com) |
| Vercel Dashboard | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Full Guide | [DEPLOYMENT.md](./DEPLOYMENT.md) |

---

## Common Issues

**"Connection failed"**
→ Check backend URL in `.env.production`
→ Wait 30s for Render to wake up (free tier)

**"CORS error"**
→ Add `FRONTEND_URL` to Render environment variables

**"Build failed"**
→ Check Render/Vercel logs in dashboard
