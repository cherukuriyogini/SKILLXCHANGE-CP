# Product Requirements Document (PRD) — SkillXchange

## 1. Product Overview

**Product Name:** SkillXchange
**Type:** Web Application (SPA)
**Version:** 1.0
**Date:** August 2026

### 1.1 Product Vision

SkillXchange is a peer-to-peer skill exchange platform that democratizes learning by connecting individuals who want to teach their expertise with those who want to learn. The platform enables live mentor-learner sessions, AI-powered learning tools, collaborative peer groups, and a gamified progression system — all within a secure, role-based environment.

### 1.2 Problem Statement

Traditional online learning platforms are passive and expensive. Learners often lack access to real human mentors who can teach practical, niche skills. Meanwhile, skilled individuals have no structured platform to monetize or share their expertise. SkillXchange bridges this gap through structured peer-to-peer sessions and AI augmentation.

### 1.3 Target Users

| User Type | Description |
|---|---|
| **Learners** | Individuals seeking to acquire new skills through guided mentorship |
| **Mentors** | Skilled professionals or enthusiasts willing to teach their expertise |
| **Moderators** | Platform trust & safety team managing reports and content |
| **Admins** | Platform operators managing users, system health, and analytics |

---

## 2. Goals & Success Metrics

### 2.1 Business Goals

- Establish a self-sustaining ecosystem of skill exchange
- Achieve high mentor-learner match quality
- Drive engagement through gamification and AI features
- Ensure platform safety through moderation tools

### 2.2 Key Performance Indicators (KPIs)

| Metric | Target |
|---|---|
| Session completion rate | >= 80% |
| Learner-mentor match success rate | >= 75% within first search |
| Average session rating | >= 4.0 / 5.0 |
| Daily active users (DAU) retention | >= 40% Week-2 retention |
| AI tutor engagement | >= 50% of learners use AI tutor weekly |
| Report resolution time | <= 24 hours for moderators |
| Peer group participation | >= 30% of learners join at least one group |

---

## 3. User Stories & Requirements

### 3.1 Authentication & Onboarding

| ID | User Story | Priority |
|---|---|---|
| AUTH-01 | As a new user, I can register with name, email, and password | P0 |
| AUTH-02 | As a user, I can log in securely and stay logged in via cookie | P0 |
| AUTH-03 | As a user, I can reset my password via email if forgotten | P1 |
| AUTH-04 | As a multi-role user, I can select which role to use per session | P0 |
| AUTH-05 | As a user, my account is locked after repeated failed login attempts | P1 |

---

### 3.2 Learner Features

| ID | User Story | Priority |
|---|---|---|
| LEARN-01 | As a learner, I can view my dashboard with upcoming sessions and progress stats | P0 |
| LEARN-02 | As a learner, I can browse and search for mentors by skill | P0 |
| LEARN-03 | As a learner, I can book a session with a mentor by selecting a topic and time | P0 |
| LEARN-04 | As a learner, I can join a live video session with my mentor | P0 |
| LEARN-05 | As a learner, I can chat with my mentor during a live session | P0 |
| LEARN-06 | As a learner, I can use the shared whiteboard during a session | P1 |
| LEARN-07 | As a learner, I can rate my mentor after a session (1–5 stars) | P0 |
| LEARN-08 | As a learner, I can view AI-generated summaries of my sessions | P1 |
| LEARN-09 | As a learner, I can ask the AI tutor questions at any time | P1 |
| LEARN-10 | As a learner, I can upload PDF/DOCX documents and ask questions about them | P2 |
| LEARN-11 | As a learner, I can view a personalized AI-generated learning roadmap | P1 |
| LEARN-12 | As a learner, I can join peer groups to study with others at my level | P1 |
| LEARN-13 | As a learner, I can track my XP, level, streaks, and badges | P1 |
| LEARN-14 | As a learner, I can reschedule or cancel my booked sessions | P1 |
| LEARN-15 | As a learner, I can report a mentor for inappropriate behavior | P0 |

---

### 3.3 Mentor Features

| ID | User Story | Priority |
|---|---|---|
| MENTOR-01 | As a mentor, I can view my dashboard with pending requests and earnings | P0 |
| MENTOR-02 | As a mentor, I can accept or decline session requests from learners | P0 |
| MENTOR-03 | As a mentor, I can conduct live video sessions with my learners | P0 |
| MENTOR-04 | As a mentor, I can view analytics about my sessions, ratings, and earnings | P1 |
| MENTOR-05 | As a mentor, I can list the skills I teach on my profile | P0 |
| MENTOR-06 | As a mentor, I can view feedback left by learners | P1 |
| MENTOR-07 | As a mentor, I can request to reschedule a session | P1 |
| MENTOR-08 | As a mentor, I can add session notes during or after a session | P1 |

---

### 3.4 Moderator Features

| ID | User Story | Priority |
|---|---|---|
| MOD-01 | As a moderator, I can view all submitted user reports | P0 |
| MOD-02 | As a moderator, I can review and update report status (pending/reviewed/dismissed) | P0 |
| MOD-03 | As a moderator, I can flag or unflag user accounts | P0 |
| MOD-04 | As a moderator, I can block or unblock user accounts | P0 |
| MOD-05 | As a moderator, I can manage support tickets submitted by users | P1 |
| MOD-06 | As a moderator, I can view the moderator dashboard with summary stats | P1 |

---

### 3.5 Admin Features

| ID | User Story | Priority |
|---|---|---|
| ADMIN-01 | As an admin, I can view platform-wide statistics (users, sessions, reports) | P0 |
| ADMIN-02 | As an admin, I can manage all users (view, block, update roles) | P0 |
| ADMIN-03 | As an admin, I can access all moderator capabilities | P0 |
| ADMIN-04 | As an admin, I can create other admin accounts | P1 |
| ADMIN-05 | As an admin, I can view system health and error logs | P2 |

---

### 3.6 AI Features

| ID | User Story | Priority |
|---|---|---|
| AI-01 | As a user, I can chat with an AI tutor (Gemini) from any page via a floating widget | P1 |
| AI-02 | As a learner, I can ask the AI tutor questions in a dedicated AI Tutor page | P1 |
| AI-03 | As a learner, I can upload a study document and ask questions about its content | P2 |
| AI-04 | As a user, I can request an AI-generated summary of a completed session | P1 |
| AI-05 | As a learner, I can generate a personalized AI learning path for any skill | P1 |
| AI-06 | As an AI substitute, the system can step in when a mentor cancels last-minute | P2 |

---

### 3.7 Gamification Features

| ID | User Story | Priority |
|---|---|---|
| GAME-01 | As a user, I earn XP points for completing sessions | P1 |
| GAME-02 | As a user, I level up as I accumulate more XP | P1 |
| GAME-03 | As a user, I maintain a daily streak for consecutive days of activity | P2 |
| GAME-04 | As a user, I earn badges for reaching milestones | P2 |
| GAME-05 | As a user, I have a reputation score that reflects my community standing | P2 |

---

### 3.8 Profile & Settings

| ID | User Story | Priority |
|---|---|---|
| PROF-01 | As a user, I can view and edit my profile (bio, skills, avatar) | P0 |
| PROF-02 | As a user, I can upload a profile photo | P1 |
| PROF-03 | As a user, I can manage notification preferences | P1 |
| PROF-04 | As a user, I can toggle between light and dark themes | P2 |
| PROF-05 | As a user, I can submit a support ticket from the settings page | P1 |

---

## 4. Functional Requirements

### 4.1 Live Session (WebRTC)

- **FR-1:** Sessions must support peer-to-peer video using WebRTC (via `simple-peer`)
- **FR-2:** WebRTC signaling must be handled via Socket.IO (offer/answer/ICE exchange)
- **FR-3:** Session chat must persist messages for the duration of the session
- **FR-4:** Whiteboard strokes must sync in real-time to all session participants
- **FR-5:** Session ID (`SX-MEET-XXXXXX`) is auto-generated and unique per session
- **FR-6:** Session status transitions: `requested → accepted → completed / cancelled / no-show`

### 4.2 Skill Matching

- **FR-7:** Mentor search must filter by skill, availability, and rating
- **FR-8:** The platform should surface mentors whose `skillsTeach` intersects with learner's `skillsLearn`

### 4.3 Notifications

- **FR-9:** Notifications must be delivered in real-time via Socket.IO
- **FR-10:** Notifications must be persisted to the database for inbox display
- **FR-11:** Users can mark individual or all notifications as read

### 4.4 Peer Groups

- **FR-12:** Groups are categorized by skill and level (beginner/intermediate/advanced)
- **FR-13:** Group capacity is 3–10 members
- **FR-14:** Group chat history is embedded in the group document
- **FR-15:** Real-time group chat is delivered via Socket.IO

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Requirement | Target |
|---|---|
| API response time (p95) | < 300ms |
| Page load time (initial) | < 3 seconds on 4G |
| WebRTC connection setup | < 5 seconds |
| AI response latency | < 5 seconds per query |

### 5.2 Security

| Requirement | Implementation |
|---|---|
| Authentication | JWT in httpOnly cookies (XSS-proof) |
| Password storage | bcrypt (10 salt rounds) |
| Rate limiting | 100 req/10min (production) |
| Input validation | express-validator on all POST/PUT routes |
| Account protection | Login lockout after repeated failures |
| Security headers | Helmet middleware |
| CORS | Whitelist-only from environment variables |

### 5.3 Scalability

- Stateless REST API — horizontally scalable
- MongoDB Atlas — auto-scaling cluster support
- Socket.IO — supports Redis adapter for multi-instance deployments

### 5.4 Reliability

- Global error handler middleware returns consistent JSON error responses
- React Error Boundary prevents full app crashes on component errors
- Lazy loading of all pages reduces initial bundle size

### 5.5 Accessibility

- WCAG 2.1 AA color contrast on all UI components
- Keyboard-navigable interactive elements
- Screen-reader-compatible ARIA labels on icons and buttons

---

## 6. User Interface Requirements

### 6.1 Design Principles

- **Clean & Modern:** Tailwind CSS utility-first styling with rounded cards and soft shadows
- **Responsive:** Mobile-first layout; works on desktop, tablet, and mobile
- **Animated:** Framer Motion transitions for page changes and modals
- **Role-Aware:** Sidebar and navbar adapt based on active role
- **Consistent:** Shared Toast notification system; skeleton loaders for async content

### 6.2 Key UI Components

| Component | Description |
|---|---|
| Sidebar | Role-aware left nav with page links |
| Navbar | Top bar with user avatar, notifications, and logout |
| Toast | Non-blocking success/error/info notifications |
| LoadingSpinner | Circular loader for async operations |
| SkeletonLoader | Grey shimmer placeholder while content loads |
| EmptyState | Friendly illustration + message for empty lists |
| ErrorState | Error display with retry option |
| FloatingAITutor | Persistent AI chat bubble (bottom-right) |
| Whiteboard | Canvas-based shared drawing tool |
| ReportModal | User/content report submission form |
| SupportTicketModal | In-app support ticket form |

---

## 7. Constraints & Assumptions

### 7.1 Constraints

- WebRTC P2P video requires both users to have camera/microphone permissions
- AI features require a valid Google Gemini API key configured in backend `.env`
- File uploads (PDF/DOCX) are limited to 10MB and stored locally in `/uploads/`
- Email features (password reset) require a valid SMTP configuration
- Production environment requires `NODE_ENV=production` to enforce strict CORS and rate limits

### 7.2 Assumptions

- All users register with valid email addresses
- Mentors self-declare their skills; verification is moderator-driven
- Sessions are 1-on-1 (one learner, one mentor)
- The platform is English-language only in v1.0
- Payment/monetization features are out of scope for v1.0

---

## 8. Out of Scope (v1.0)

- Payment processing or subscription billing
- Mobile native apps (iOS / Android)
- Multi-language / internationalization (i18n)
- Video recording and playback of sessions
- External calendar integration (Google Calendar, Outlook)
- Public leaderboards
- Mentor availability scheduling system

---

## 9. Release Milestones

| Milestone | Features | Target |
|---|---|---|
| **Alpha** | Auth, Learner/Mentor Dashboards, Session booking, Live video | Sprint 1–2 |
| **Beta** | AI Tutor, Skill Matching, Peer Groups, Notifications, Admin | Sprint 3–4 |
| **v1.0 GA** | Moderator tools, Gamification, Analytics, Settings, Tickets | Sprint 5–6 |

---

## 10. Dependencies

| Dependency | Purpose |
|---|---|
| MongoDB Atlas | Cloud database with indexed schemas |
| Redis | In-memory cache for fast read response times |
| node-cron | Automated background task scheduling |
| Docker & Compose | Containerized application orchestration |
| Google Gemini API | AI tutor, summaries, learning paths |
| WebRTC (simple-peer) | P2P video in live sessions |
| Socket.IO | Real-time events (chat, video signaling, notifications) |
| SMTP Service | Password reset and email verification |
| Vercel / Netlify | Frontend hosting |
| Render / Railway | Backend hosting |

---

*Document version: 1.1 | Project: SkillXchange | Date: August 2026*
