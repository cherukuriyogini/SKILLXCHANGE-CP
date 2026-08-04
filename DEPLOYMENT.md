# SkillXChange — Production Deployment Guide

## Architecture Overview

```
┌─────────────────────┐     HTTPS      ┌──────────────────────┐
│   Frontend (React)  │ ─────────────► │  Backend (Express)   │
│   Vercel / Netlify  │                │  Render / Railway    │
└─────────────────────┘                └──────────┬───────────┘
                                                   │
                                         ┌─────────▼──────────┐
                                         │   MongoDB Atlas    │
                                         └────────────────────┘
```

---

## Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- MongoDB Atlas account (free M0 tier works)
- Cloudinary account (free tier works)
- Gmail account with App Password enabled (for email features)
- Gemini API key (Google AI Studio — free tier available)

---

## 1. MongoDB Atlas Setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user:
   - **Database Access** → Add New Database User
   - Choose "Password" authentication
   - Note your username and password
3. Whitelist all IPs (for Render/Railway):
   - **Network Access** → Add IP Address → `0.0.0.0/0`
4. Get your connection string:
   - **Clusters** → Connect → Drivers → Node.js
   - Format: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<AppName>`

---

## 2. Backend Deployment (Render.com — Recommended)

### Step 1: Prepare

Ensure `backend/package.json` has a `start` script (already added):
```json
"scripts": {
  "start": "node server.js"
}
```

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   | Field | Value |
   |-------|-------|
   | **Root Directory** | `backend` |
   | **Environment** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |

### Step 3: Set Environment Variables on Render

Navigate to **Environment** tab and add all variables from `backend/.env.example`:

```env
PORT=5008
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_ACCESS_SECRET=<64-byte-hex>
JWT_REFRESH_SECRET=<64-byte-hex>
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
JWT_SECRET=<64-byte-hex>
JWT_EXPIRE=7d
COOKIE_SECRET=<64-byte-hex>
ADMIN_EMAIL=admin@skillxchange.com
CLIENT_URL=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.5-flash
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
MAX_FILE_SIZE=52428800
```

> **⚠ IMPORTANT**: Generate new secrets for production using:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```
> Run this **4 times** for: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_SECRET`, `COOKIE_SECRET`

### Step 4: Note your backend URL

After deployment, Render gives you a URL like:
`https://skillxchange-api.onrender.com`

---

## 3. Frontend Deployment (Vercel — Recommended)

### Step 1: Build Command
```bash
cd frontend
npm install
npm run build
```

The `dist/` folder contains the production build.

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Configure:
   | Field | Value |
   |-------|-------|
   | **Root Directory** | `frontend` |
   | **Framework Preset** | `Vite` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

### Step 3: Set Environment Variables on Vercel

In **Settings** → **Environment Variables**:

```env
VITE_API_URL=https://skillxchange-api.onrender.com/api
VITE_SOCKET_URL=https://skillxchange-api.onrender.com
```

### Step 4: SPA Routing (Already Configured)

`vercel.json` is already included in `frontend/` — all routes will correctly resolve to `index.html`.

---

## 4. Alternative — Netlify (Frontend)

1. Connect repository on [netlify.com](https://netlify.com)
2. Set **Base directory** to `frontend`
3. **Build command**: `npm run build`
4. **Publish directory**: `dist`
5. Set environment variables in **Site Settings** → **Environment**

`netlify.toml` is already included for SPA routing.

---

## 5. Alternative — Nginx (Self-Hosted)

### Frontend (Static Files)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/skillxchange/dist;
    index index.html;

    # SPA routing — send all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Serve static assets with long cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Backend (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### PM2 (Process Manager for Node.js)
```bash
npm install -g pm2
cd backend
pm2 start server.js --name skillxchange-api
pm2 startup   # auto-restart on server reboot
pm2 save
```

---

## 6. Build Commands Summary

| Component | Command |
|-----------|---------|
| Install all deps | `npm run install:all` (from project root) |
| Start dev (full stack) | `npm run dev` (from project root) |
| Build frontend | `cd frontend && npm run build` |
| Start backend prod | `cd backend && npm start` |
| Seed demo data | `cd backend && npm run seed` |

---

## 7. Post-Deployment Checklist

- [ ] Backend health check returns 200: `GET https://your-api.com/api/health`
- [ ] Frontend loads and redirects to `/home`
- [ ] Login works with `learner@skillxchange.com / password123`
- [ ] Login works with `mentor@skillxchange.com / password123`
- [ ] WebSocket connects (check browser DevTools → Network → WS)
- [ ] File upload works (profile photo, session materials)
- [ ] AI Tutor responds (Gemini integration working)
- [ ] Email notifications sent (forgot password flow)
- [ ] Admin dashboard accessible at `admin@skillxchange.com / password123`
- [ ] Rate limiting: verify 429 after 100 rapid requests
- [ ] CORS: verify frontend origin is accepted
- [ ] Refresh page on `/learner-dashboard` — should NOT 404

---

## 8. Health Check Endpoint

```
GET /api/health
```

Response:
```json
{
  "success": true,
  "message": "SkillXchange API is healthy",
  "timestamp": "2026-08-04T04:00:00.000Z",
  "uptime": 3600.5,
  "env": "production"
}
```

---

## 9. Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Go to **Dashboard** → copy:
   - Cloud Name
   - API Key  
   - API Secret
3. Set these in your backend environment variables

---

## 10. Gmail App Password Setup

1. Enable 2FA on your Google account
2. Go to **Google Account** → **Security** → **App Passwords**
3. Generate a password for "Mail" + "Windows Computer"
4. Use the 16-character password as `EMAIL_PASS`

---

## 11. Environment Variables Quick Reference

### Backend (Required)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5008) |
| `NODE_ENV` | `production` or `development` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | 64-byte hex random secret |
| `JWT_REFRESH_SECRET` | 64-byte hex random secret |
| `JWT_SECRET` | 64-byte hex random secret |
| `COOKIE_SECRET` | 64-byte hex random secret |
| `ADMIN_EMAIL` | Email of the admin account |
| `CLIENT_URL` | Frontend URL (for CORS) |
| `FRONTEND_URL` | Frontend URL (for email links) |

### Backend (Optional — disables features if missing)
| Variable | Feature |
|----------|---------|
| `GEMINI_API_KEY` | AI Tutor, AI Summaries |
| `CLOUDINARY_*` | File/image uploads |
| `EMAIL_USER` / `EMAIL_PASS` | Password reset emails |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL + `/api` |
| `VITE_SOCKET_URL` | Backend WebSocket URL |

---

## 12. Security Notes

- All JWT and cookie secrets are **128+ character cryptographically random hex** values
- Secrets are stored only in environment variables — never in source code
- `.env` files are gitignored — never committed
- CORS is restricted to `CLIENT_URL` and `FRONTEND_URL` in production
- Socket.IO uses the same origin whitelist as Express CORS
- Rate limiting: 100 requests per 10 minutes per IP
- Helmet sets secure HTTP headers on every response
- bcrypt hashes all passwords (never stored in plaintext)
