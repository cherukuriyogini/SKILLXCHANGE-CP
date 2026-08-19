# Low-Level Design (LLD) — SkillXchange

## 1. Overview

This document provides the detailed technical design for the SkillXchange platform, covering database schemas, API contracts, component-level design, state management, real-time event specifications, and file/folder structure.

---

## 2. Database Schema (MongoDB / Mongoose)

### 2.1 User Collection

**Collection:** `users`

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `name` | String | Yes | Full name |
| `email` | String | Yes, Unique | Email address |
| `password` | String | Yes | bcrypt hashed (minlength: 6, select: false) |
| `roles` | [String] | Yes | Enum: `learner`, `mentor`, `moderator`, `admin` |
| `skillsTeach` | [String] | No | Skills the user can teach |
| `skillsLearn` | [String] | No | Skills the user wants to learn |
| `bio` | String | No | User biography |
| `avatar` | String | No | Avatar image URL |
| `badges` | [String] | No | Earned badge names |
| `reputationScore` | Number | No | Default: 0 |
| `verifiedSkills` | [String] | No | Moderator-verified skills |
| `isBlocked` | Boolean | No | Default: false |
| `isFlagged` | Boolean | No | Default: false |
| `lastLogin` | Date | No | Last login timestamp |
| `refreshToken` | String | No | JWT refresh token (select: false) |
| `status` | String | No | Enum: `online`, `offline` |
| `totalSessions` | Number | No | Default: 0 |
| `averageRating` | Number | No | Default: 0 |
| `xp` | Number | No | Experience points, Default: 0 |
| `level` | Number | No | Current level, Default: 1 |
| `currentStreak` | Number | No | Daily streak count |
| `longestStreak` | Number | No | All-time longest streak |
| `lastActiveDate` | Date | No | For streak calculation |
| `achievements` | [{title, date}] | No | Achievement history |
| `totalEarnings` | Number | No | Default: 0 |
| `resetPasswordToken` | String | No | SHA-256 hashed reset token (select: false) |
| `resetPasswordExpire` | Date | No | Token expiry (10 min window) |
| `isEmailVerified` | Boolean | No | Default: false |
| `emailVerificationToken` | String | No | Email verify token (select: false) |
| `loginAttempts` | Number | No | Failed login count (lockout) |
| `lockUntil` | Date | No | Account lock expiry |
| `settings.emailNotifications` | Boolean | No | Default: true |
| `settings.pushNotifications` | Boolean | No | Default: false |
| `settings.twoFactorEnabled` | Boolean | No | Default: false |
| `settings.marketingEmails` | Boolean | No | Default: false |
| `settings.theme` | String | No | Default: `light` |
| `createdAt` | Date | Auto | Creation timestamp |

**Indexes:** `email` (unique)
**Methods:** `matchPassword(password)`, `getResetPasswordToken()`
**Hooks:** `pre('save')` — bcrypt password hashing

---

### 2.2 Session Collection

**Collection:** `sessions`

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `learnerId` | ObjectId (ref: User) | Yes | Learner participant |
| `mentorId` | ObjectId (ref: User) | Yes | Mentor participant |
| `topic` | String | Yes | Session subject |
| `scheduledTime` | Date | Yes | When session is scheduled |
| `duration` | Number | No | Minutes, Default: 60 |
| `status` | String | No | Enum: `requested`, `accepted`, `completed`, `cancelled`, `no-show`, `ai-substitute` |
| `notes` | String | No | Session notes |
| `feedback` | String | No | Post-session feedback text |
| `aiSummary` | String | No | Gemini-generated summary |
| `reschedulePending` | Boolean | No | Default: false |
| `rescheduleTime` | Date | No | Proposed new time |
| `rescheduleRequestedBy` | ObjectId (ref: User) | No | Who requested reschedule |
| `rating` | Number | No | 1–5 star rating |
| `sessionId` | String | Unique | Auto-generated `SX-MEET-XXXXXX` |
| `xpAwarded` | Number | No | Default: 0 |
| `createdAt` | Date | Auto | Creation timestamp |

**Hooks:** `pre('save')` — generates `sessionId` if absent

---

### 2.3 PeerGroup Collection

**Collection:** `peergroups`

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `name` | String | Yes | Group display name |
| `skill` | String | Yes | Primary skill topic |
| `level` | String | No | Enum: `beginner`, `intermediate`, `advanced` |
| `members` | [{userId, role, joinedAt}] | No | Member list |
| `members.userId` | ObjectId (ref: User) | Yes | Member reference |
| `members.role` | String | No | Enum: `leader`, `member` |
| `members.joinedAt` | Date | Auto | Join timestamp |
| `maxMembers` | Number | No | 3–10, Default: 6 |
| `isActive` | Boolean | No | Default: true |
| `chatMessages` | [{userId, message, timestamp}] | No | Embedded chat history |
| `createdBy` | ObjectId (ref: User) | Yes | Group creator |
| `createdAt` | Date | Auto | Creation timestamp |

---

### 2.4 Notification Collection

**Collection:** `notifications`

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId (ref: User) | Recipient |
| `type` | String | Notification category |
| `message` | String | Notification text |
| `isRead` | Boolean | Default: false |
| `createdAt` | Date | Timestamp |

---

### 2.5 Report Collection

**Collection:** `reports`

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `reportedBy` | ObjectId (ref: User) | Reporter |
| `reportedUser` | ObjectId (ref: User) | Reported user |
| `reason` | String | Report reason |
| `status` | String | Enum: `pending`, `reviewed`, `dismissed` |
| `createdAt` | Date | Timestamp |

---

### 2.6 Ticket Collection

**Collection:** `tickets`

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId (ref: User) | Submitter |
| `subject` | String | Ticket subject |
| `description` | String | Detailed description |
| `status` | String | Enum: `open`, `in-progress`, `resolved` |
| `priority` | String | Enum: `low`, `medium`, `high` |
| `createdAt` | Date | Timestamp |

---

### 2.7 LearningPath Collection

**Collection:** `learningpaths`

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId (ref: User) | Owner |
| `skill` | String | Target skill |
| `path` | [Object] | AI-generated steps/milestones |
| `createdAt` | Date | Timestamp |

---

## 3. API Endpoint Specifications

### 3.1 Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Request Body | Response |
|---|---|---|---|---|
| POST | `/register` | Public | `{name, email, password}` | `{success, token, user}` |
| POST | `/login` | Public | `{email, password}` | `{success, token, user}` |
| POST | `/logout` | JWT | — | `{success, message}` |
| POST | `/refresh` | Cookie | — | `{success, token}` |
| POST | `/forgot-password` | Public | `{email}` | `{success, message}` |
| PUT | `/reset-password/:token` | Public | `{password}` | `{success, token}` |

---

### 3.2 User Routes (`/api/users`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/me` | JWT | Get current user profile |
| PUT | `/me` | JWT | Update name, bio, skills, settings |
| POST | `/me/avatar` | JWT | Upload avatar (multipart/form-data) |
| GET | `/mentors` | JWT | List mentors with skill filter |
| GET | `/:id` | JWT | Get public profile by ID |

---

### 3.3 Session Routes (`/api/sessions`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List user's sessions (with filters) |
| POST | `/` | JWT (learner) | Book a new session |
| PUT | `/:id/accept` | JWT (mentor) | Accept session request |
| PUT | `/:id/cancel` | JWT | Cancel a session |
| PUT | `/:id/complete` | JWT | Mark session completed + award XP |
| PUT | `/:id/rate` | JWT (learner) | Submit rating (1–5) |
| PUT | `/:id/reschedule` | JWT | Request or confirm reschedule |
| POST | `/:id/summary` | JWT | Trigger Gemini summary generation |

---

### 3.4 AI Routes (`/api/ai`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/chat` | JWT | Send message to AI Tutor |
| POST | `/upload` | JWT | Upload PDF/DOCX for document Q&A |
| POST | `/summary` | JWT | Generate session summary |

---

### 3.5 Peer Group Routes (`/api/peer-groups`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List all active peer groups |
| POST | `/` | JWT | Create new peer group |
| POST | `/:id/join` | JWT | Join a peer group |
| POST | `/:id/leave` | JWT | Leave a peer group |
| GET | `/:id/messages` | JWT | Get group chat history |
| POST | `/:id/messages` | JWT | Send message to group |

---

### 3.6 Notification Routes (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | Get all notifications for user |
| PUT | `/:id/read` | JWT | Mark notification as read |
| PUT | `/read-all` | JWT | Mark all as read |

---

### 3.7 Report Routes (`/api/reports`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Submit a report |
| GET | `/` | JWT (mod/admin) | List all reports |
| PUT | `/:id` | JWT (mod/admin) | Update report status |

---

### 3.8 Admin Routes (`/api/admin`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/stats` | JWT (admin) | Platform-wide statistics |
| GET | `/users` | JWT (admin) | List all users with filters |
| PUT | `/users/:id/block` | JWT (admin/mod) | Block/unblock user |
| PUT | `/users/:id/flag` | JWT (admin/mod) | Flag/unflag user |
| PUT | `/users/:id/roles` | JWT (admin) | Update user roles |

---

## 4. Frontend Component Architecture

### 4.1 Directory Structure

```
frontend/src/
├── App.jsx                  # Root component, routing, error boundary
├── main.jsx                 # React DOM render entry
├── index.css                # Global Tailwind base styles
├── assets/                  # Static images/icons
├── context/
│   └── AuthContext.jsx      # Auth state: user, activeRole, login, logout
├── lib/
│   └── api.js               # Axios instance with base URL + interceptors
├── components/
│   ├── Layout.jsx           # Shell: Navbar + Sidebar + Outlet
│   ├── Navbar.jsx           # Top navigation bar
│   ├── Sidebar.jsx          # Role-aware side navigation
│   ├── FloatingAITutor.jsx  # Global AI chat widget (overlay)
│   ├── Toast.jsx            # Toast notification system + provider
│   ├── LoadingSpinner.jsx   # Spinner UI
│   ├── SkeletonLoader.jsx   # Content placeholder skeleton
│   ├── EmptyState.jsx       # Empty list placeholder
│   ├── ErrorState.jsx       # Error display component
│   ├── Whiteboard.jsx       # Canvas-based shared whiteboard
│   ├── ReportModal.jsx      # Report submission modal
│   ├── SupportTicketModal.jsx # Support ticket form modal
│   └── TicketList.jsx       # Ticket list with status display
└── pages/
    ├── LandingPage.jsx      # Public home / marketing
    ├── AuthPage.jsx         # Login / Register
    ├── RoleSelectionPage.jsx # Role picker for multi-role users
    ├── LearnerDashboard.jsx # Learner home
    ├── MentorDashboard.jsx  # Mentor home
    ├── ModeratorDashboard.jsx # Moderation tools
    ├── AdminDashboard.jsx   # Admin control panel
    ├── LiveSessionPage.jsx  # WebRTC + chat + whiteboard
    ├── AITutorPage.jsx      # AI chat with file upload
    ├── AISummaryPage.jsx    # View AI session summaries
    ├── SkillMatchingPage.jsx # Browse and match with mentors
    ├── LearningPathPage.jsx # AI-generated learning roadmap
    ├── PeerGroupsPage.jsx   # Peer group discovery + chat
    ├── SessionsPage.jsx     # Session list and management
    ├── AnalyticsPage.jsx    # Mentor analytics charts
    ├── ProfilePage.jsx      # User profile view/edit
    └── SettingsPage.jsx     # User account settings
```

---

### 4.2 AuthContext State Shape

```javascript
{
  user: {
    _id, name, email, roles, skillsTeach, skillsLearn,
    bio, avatar, badges, reputationScore, xp, level,
    currentStreak, totalSessions, averageRating, settings
  } | null,
  activeRole: 'learner' | 'mentor' | 'moderator' | 'admin' | null,
  loading: Boolean,
  login(email, password): Promise,
  register(name, email, password): Promise,
  logout(): void,
  setActiveRole(role): void,
  updateUser(data): void
}
```

---

### 4.3 Route Protection Logic

```
Route → ProtectedRoute wrapper
  1. If loading → show LoadingSplash
  2. If no user → redirect to /auth
  3. If multi-role user with no activeRole → redirect to /role-selection
  4. Derive checkRole = activeRole || single role
  5. Validate checkRole is in user.roles (DB-verified) → else redirect /
  6. Validate allowedRoles includes checkRole → else redirect /
  7. Render children
```

---

## 5. Real-Time Events (Socket.IO)

### 5.1 Connection Lifecycle

```
Client connects → sends { userId } → server stores socket-to-user mapping
User status → 'online' set in DB on connect, 'offline' on disconnect
```

### 5.2 Session Events

| Event (Client → Server) | Payload | Description |
|---|---|---|
| `join-session` | `{ sessionId }` | Join session room |
| `leave-session` | `{ sessionId }` | Leave session room |
| `send-message` | `{ sessionId, message, sender }` | Send chat message |
| `webrtc-offer` | `{ sessionId, offer, to }` | WebRTC SDP offer |
| `webrtc-answer` | `{ sessionId, answer, to }` | WebRTC SDP answer |
| `webrtc-ice-candidate` | `{ sessionId, candidate, to }` | ICE candidate |
| `whiteboard-draw` | `{ sessionId, data }` | Canvas draw event |

| Event (Server → Client) | Payload | Description |
|---|---|---|
| `new-message` | `{ message, sender, timestamp }` | Incoming chat |
| `webrtc-offer` | `{ offer, from }` | Incoming WebRTC offer |
| `webrtc-answer` | `{ answer, from }` | Incoming WebRTC answer |
| `webrtc-ice-candidate` | `{ candidate, from }` | Incoming ICE candidate |
| `whiteboard-draw` | `{ data }` | Incoming canvas draw |
| `user-joined` | `{ userId }` | Peer joined session |
| `user-left` | `{ userId }` | Peer left session |

### 5.3 Notification Events

| Event | Direction | Payload |
|---|---|---|
| `notification` | Server → Client | `{ type, message, data }` |
| `session-request` | Server → Mentor | `{ session }` |
| `session-accepted` | Server → Learner | `{ session }` |

---

## 6. AI Integration Detail

### 6.1 AI Tutor (`/api/ai/chat`)

```
Request:
  POST /api/ai/chat
  Body: { message: String, history: [{role, content}] }

Processing:
  1. Append user message to history
  2. Initialize GoogleGenerativeAI with GEMINI_API_KEY
  3. model.startChat({ history }) → sendMessage(message)
  4. Return streaming response text

Response:
  { success: true, reply: String }
```

### 6.2 Document Q&A (`/api/ai/upload`)

```
Request:
  POST /api/ai/upload (multipart/form-data)
  File: PDF or DOCX (max 10MB via Multer)

Processing:
  1. Multer saves file to /uploads/
  2. pdf-parse (PDF) or mammoth (DOCX) extracts raw text
  3. Text + user question sent to Gemini
  4. Response returned

Response:
  { success: true, answer: String }
```

### 6.3 Session Summary (`/api/ai/summary`)

```
Request:
  POST /api/ai/summary
  Body: { sessionId: String, topic: String, notes: String }

Processing:
  1. Fetch session from DB (validate ownership)
  2. Prompt Gemini: "Summarize this learning session on [topic]..."
  3. Save aiSummary to session document
  4. Return summary

Response:
  { success: true, summary: String }
```

---

## 7. Middleware Stack

```
Request → Helmet (security headers)
        → Rate Limiter (express-rate-limit)
        → CORS validation
        → Body Parser (express.json)
        → Cookie Parser
        → Route Handler
          → Auth Middleware (JWT verify from cookie)
          → Role Middleware (check allowedRoles)
          → Controller
            → Mongoose queries
            → Response
        → Global Error Handler
```

### JWT Auth Middleware Logic

```javascript
1. Extract token from req.cookies.token OR Authorization header
2. jwt.verify(token, JWT_SECRET)
3. Fetch user from DB by decoded.id (exclude password)
4. If user.isBlocked → return 403
5. If user.lockUntil > Date.now() → return 423 (account locked)
6. Attach req.user = user
7. Call next()
```

---

## 8. Gamification Logic

### XP Award (on session complete)

```javascript
BASE_XP = 50 (per completed session)
BONUS_XP = rating >= 4 ? 25 : 0
totalXP = BASE_XP + BONUS_XP

user.xp += totalXP
user.level = Math.floor(user.xp / 200) + 1
user.totalSessions += 1
user.xpAwarded = totalXP (on session document)
```

### Streak Calculation (on daily login)

```javascript
today = startOfDay(new Date())
lastActive = startOfDay(user.lastActiveDate)

if (today - lastActive === 1 day):
    user.currentStreak += 1
elif (today - lastActive > 1 day):
    user.currentStreak = 1

user.longestStreak = max(user.longestStreak, user.currentStreak)
user.lastActiveDate = today
```

---

## 9. File Upload Specification

| Config | Value |
|---|---|
| Library | Multer |
| Storage | `/backend/uploads/` (local disk) |
| Max file size | 10 MB |
| Allowed types | PDF, DOCX, images (avatar) |
| File naming | `{userId}-{timestamp}.{ext}` |
| Served via | `GET /uploads/:filename` (express.static) |

---

## 10. Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRE` | JWT expiry (e.g., `7d`) |
| `REFRESH_TOKEN_SECRET` | Refresh token secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CLIENT_URL` | Frontend URL (CORS) |
| `FRONTEND_URL` | Alternative frontend URL (CORS) |
| `NODE_ENV` | `development` or `production` |
| `EMAIL_HOST` | SMTP host (password reset emails) |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP user |
| `EMAIL_PASS` | SMTP password |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.IO server URL |

---

*Document version: 1.0 | Project: SkillXchange | Date: August 2026*
