# High-Level Design (HLD) — SkillXchange

## 1. Overview

**SkillXchange** is a peer-to-peer skill exchange platform that connects learners with mentors for live, interactive skill-sharing sessions. The platform supports role-based dashboards, AI-assisted learning, real-time video/chat sessions, peer groups, gamification, and an admin moderation layer.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│   React 19 + Vite SPA (Tailwind CSS, Framer Motion, Recharts)        │
│   Hosted: Vercel / Netlify                                           │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ HTTPS / WebSocket (WSS)
┌─────────────────────────────▼────────────────────────────────────────┐
│                          API GATEWAY LAYER                           │
│   Express.js REST API  +  Socket.IO (Real-time)                      │
│   Helmet | CORS | Rate Limiter | JWT Auth Middleware                 │
└────────┬──────────────────────────────────────┬──────────────────────┘
         │ Mongoose ODM                          │ Google Generative AI SDK
┌────────▼───────────┐                ┌──────────▼──────────────────────┐
│   MongoDB Atlas    │                │   Google Gemini AI Service       │
│  (Primary Store)   │                │   (AI Tutor / Summaries / LLM)   │
└────────────────────┘                └─────────────────────────────────┘
         │
┌────────▼───────────┐
│   File Storage     │
│  (Multer / Local   │
│   /uploads dir)    │
└────────────────────┘
```

---

## 3. High-Level Components

### 3.1 Frontend (React SPA)

| Module | Description |
|---|---|
| **Landing Page** | Public marketing page with CTA |
| **Auth Page** | Login / Register with JWT cookie-based auth |
| **Role Selection** | Multi-role users choose active role per session |
| **Learner Dashboard** | Skill matching, upcoming sessions, progress stats |
| **Mentor Dashboard** | Session requests, earnings, ratings, analytics |
| **Moderator Dashboard** | Report management, ticket queue, user moderation |
| **Admin Dashboard** | Full platform analytics, user management, system controls |
| **Live Session Page** | WebRTC P2P video + Socket.IO chat + shared whiteboard |
| **AI Tutor Page** | Gemini-powered chat tutor with file upload support |
| **AI Summary Page** | Auto-generated session summaries |
| **Skill Matching Page** | Match learners with mentors by skill |
| **Learning Path Page** | Personalized AI-generated learning roadmap |
| **Peer Groups Page** | Join/create skill-based study groups with group chat |
| **Sessions Page** | Session history, request management, reschedule |
| **Analytics Page** | Mentor performance charts (Recharts) |
| **Profile Page** | User bio, skills, badges, reputation score |
| **Settings Page** | Notifications, theme, account preferences |

### 3.2 Backend (Node.js + Express)

| Module | Route Prefix | Responsibility |
|---|---|---|
| Auth | `/api/auth` | Register, login, logout, token refresh, password reset |
| Users | `/api/users` | Profile CRUD, skill management, avatar upload |
| Sessions | `/api/sessions` | Book, accept, cancel, rate, reschedule sessions |
| AI | `/api/ai` | Tutor chat, document Q&A, summary generation |
| Learning Path | `/api/learning-path` | AI-generated personalized learning roadmaps |
| Peer Groups | `/api/peer-groups` | Create, join, leave, chat in study groups |
| Reports | `/api/reports` | Submit and manage content/user reports |
| Notifications | `/api/notifications` | In-app notification delivery and management |
| Admin | `/api/admin` | Platform statistics, user controls, moderation tools |
| Tickets | `/api/tickets` | Support ticket submission and resolution |

### 3.3 Real-Time Layer (Socket.IO)

| Event Namespace | Purpose |
|---|---|
| Session Room | Signaling for WebRTC P2P video (offer/answer/ICE) |
| Chat | Live text messages during sessions |
| Whiteboard | Collaborative drawing canvas sync |
| Notifications | Push real-time alerts to users |
| Peer Group Chat | Real-time group messaging |

### 3.4 AI Integration (Google Gemini)

| Feature | Implementation |
|---|---|
| AI Tutor | Conversational Gemini chat with session context |
| Document Q&A | Upload PDF/DOCX → extract text → Gemini answers |
| Session Summary | Auto-generate post-session notes via Gemini |
| Learning Path | Gemini generates step-by-step skill roadmap |
| Floating AI Widget | Global AI assistant overlay available on all pages |

---

## 4. Data Flow Diagrams

### 4.1 User Authentication Flow

```
User → POST /api/auth/register → Validate → Hash Password (bcrypt)
     → Save MongoDB → Return JWT (httpOnly cookie) + Refresh Token
User → POST /api/auth/login → Verify → Return JWT + Refresh Token
Client → All protected API calls include JWT cookie → Middleware validates
```

### 4.2 Session Booking Flow

```
Learner → Selects Mentor from Skill Match → POST /api/sessions
        → Session created (status: requested) → Mentor notified (Socket.IO)
Mentor  → Accepts → status: accepted → Learner notified
Both    → Navigate to /live/:sessionId → WebRTC handshake via Socket.IO
        → Post-session → Rating submitted → XP awarded → Gemini summary generated
```

### 4.3 AI Tutor Flow

```
User → Types question OR uploads PDF/DOCX
     → Backend extracts text (pdf-parse / mammoth)
     → Sends to Google Generative AI SDK
     → Streams Gemini response back to client
```

---

## 5. Role & Access Control

| Role | Access Level |
|---|---|
| **Learner** | Dashboard, sessions, AI tutor, peer groups, skill match, learning path |
| **Mentor** | All learner access + analytics, session management, earnings |
| **Moderator** | Report queue, ticket management, user flag/block |
| **Admin** | Full platform access including user management and system stats |

- Users may hold **multiple roles** simultaneously
- On login, multi-role users must select their **active role** per session
- Role tampering prevention: active role is cross-validated against DB roles on every protected route

---

## 6. Gamification System

| Element | Description |
|---|---|
| XP Points | Awarded per completed session |
| Level | Derived from total XP (level-up milestones) |
| Streaks | Daily activity streaks (current + longest tracked) |
| Badges | Earned through achievements (e.g., "First Session", "10 Sessions") |
| Reputation Score | Calculated from session ratings and peer feedback |

---

## 7. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion, Recharts |
| Routing | React Router DOM v7 |
| State Management | React Context API |
| HTTP Client | Axios |
| Real-Time | Socket.IO Client + Server |
| Video | WebRTC (simple-peer) |
| Backend | Node.js, Express.js v5 |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (httpOnly cookies) + bcryptjs |
| AI | Google Gemini API (@google/generative-ai) |
| File Upload | Multer |
| Document Parsing | pdf-parse, mammoth |
| Security | Helmet, express-rate-limit, express-validator |
| Frontend Hosting | Vercel / Netlify |
| Backend Hosting | Cloud VM / Railway / Render |

---

## 8. Security Architecture

- **JWT in httpOnly cookies** — prevents XSS token theft
- **Refresh token rotation** — stored in DB, invalidated on logout
- **bcrypt password hashing** (salt rounds: 10)
- **Account lockout** — loginAttempts + lockUntil fields on User model
- **Rate limiting** — 100 req/10min (prod), 500 req/10min (dev)
- **Helmet** — security headers (CSP, XSS protection, etc.)
- **CORS** — origin whitelist from environment variables only
- **Role validation** — double-checked on every protected route

---

## 9. Deployment Architecture

```
                  ┌─────────────────┐
  User Browser ──►│  Vercel/Netlify │  (React SPA)
                  └────────┬────────┘
                           │ HTTPS API calls
                  ┌────────▼────────┐
                  │  Backend Server │  (Node.js + Socket.IO)
                  │  (Render/Cloud) │
                  └────────┬────────┘
                           │ Mongoose
                  ┌────────▼────────┐
                  │  MongoDB Atlas  │
                  └─────────────────┘
```

---

*Document version: 1.0 | Project: SkillXchange | Date: August 2026*
