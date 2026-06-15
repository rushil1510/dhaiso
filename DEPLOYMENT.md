# Deployment Guide

This guide details the steps to deploy the Dhaiso application to production. The recommended strategy is to host the frontend on Vercel and the backend on Render (or any platform supporting persistent WebSocket connections).

---

## Architecture Overview

```
┌──────────────────┐               WebSocket (CORS)                ┌──────────────────┐
│  Vite Frontend   │ ◄───────────────────────────────────────────► │  Node.js Server  │
│  (Hosted: Vercel)│                                               │ (Hosted: Render) │
└──────────────────┘                                               └──────────────────┘
```

---

## 1. Backend Deployment (Render)

Deploy the backend to Render as a **Web Service**.

### Configuration Parameters
Configure the Web Service with the following details:

- **Root Directory**: `server`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: Free (or higher)

### Environment Variables
Configure these variables in the Render environment settings:

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations. |
| `FRONTEND_URL` | `https://your-app.vercel.app` | The URL of your deployed frontend (update after Vercel deployment). |
| `PORT` | `3000` | Port for the Express server (injected automatically by Render). |

*Note: On Render's Free tier, the service spins down after 15 minutes of inactivity. The first request after a spin-down will take approximately 30 seconds to wake up.*

---

## 2. Frontend Deployment (Vercel)

Deploy the frontend to Vercel via the Vercel Dashboard.

### Configuration Parameters
1. Import your GitHub repository into Vercel.
2. Configure the following project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Environment Variables
Add the following key-value pair under Environment Variables:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | `https://your-backend.onrender.com` | The URL of your deployed Render service. |

---

## 3. Post-Deployment Verification

### CORS Configuration
Ensure that the client and server URLs match. If you encounter handshake failures:
1. Open the browser developer console (F12) and inspect the network requests.
2. Confirm the server's `FRONTEND_URL` environment variable matches your Vercel deployment URL exactly (without a trailing slash).
3. Confirm the client's `VITE_BACKEND_URL` environment variable matches your Render URL exactly.
