<p align="center">
  <h1 align="center">🏠 RentSpace</h1>
  <p align="center">
    A full-stack peer-to-peer rental marketplace where users can list, discover, and rent items from their community.
    <br />
    Built with React, Node.js, Express, MongoDB, and Socket.io.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-4.7-010101?logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" />
</p>

---

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Real-Time Features](#real-time-features)
- [Database Schema](#database-schema)
- [Rental Request Lifecycle](#rental-request-lifecycle)
- [Authentication Flow](#authentication-flow)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**RentSpace** is a community-driven rental marketplace that enables users to list items they own (cameras, bikes, tools, vehicles, instruments, etc.) and rent items from others in their area. It features real-time chat, a review system, wishlists, Google OAuth, and a polished dark/light mode UI with smooth animations.

---

## Features

### Core Functionality
- **Item Listings** — Create, edit, and manage rental listings with up to 5 images, pricing, tags, and location
- **Browse & Search** — Full-text search across titles/descriptions/tags, filter by category, price range, and rating, sort by newest/price/rating
- **Rental Requests** — Send, accept, reject, cancel, and complete rental requests with date-based booking and conflict detection
- **Real-Time Chat** — Private messaging between users with typing indicators, read receipts, and message history
- **Reviews & Ratings** — Rate items and users after completed rentals; ratings auto-aggregate on profiles and listings
- **Wishlists** — Save and manage favorite items

### User Experience
- **Dark / Light Theme** — Toggleable theme with CSS variable design tokens, persisted across sessions
- **Responsive Design** — Mobile-first layout with hamburger menus, collapsible sidebars, and adaptive grids
- **Page Transitions** — Smooth Framer Motion animations for page navigation, card interactions, and modals
- **Real-Time Notifications** — In-app notification bell with unread count, powered by Socket.io
- **Google OAuth** — One-click sign-in with Google alongside traditional email/password auth

### Security
- **JWT Authentication** — Short-lived access tokens (in-memory) + httpOnly refresh token cookies with rotation
- **Rate Limiting** — Global API limiter (100 req/15min), auth limiter (10 req/15min), upload limiter (20 req/hr)
- **Input Validation** — Server-side validation with express-validator on all endpoints
- **Password Hashing** — bcrypt with salt rounds
- **CORS & Helmet** — Security headers and origin restrictions
- **Refresh Token Rotation** — Detects token reuse for replay attack prevention

---

## Tech Stack

### Client

| Technology | Purpose |
|---|---|
| **React 18** | UI framework with hooks |
| **Vite 5** | Build tool & dev server |
| **React Router 6** | Client-side routing with animated transitions |
| **Zustand** | Lightweight global state (auth, theme, notifications) |
| **TanStack React Query** | Server state management, caching, and mutations |
| **Axios** | HTTP client with interceptors for auto token refresh |
| **Socket.io Client** | Real-time WebSocket communication |
| **Framer Motion** | Animations and page transitions |
| **Tailwind CSS 3** | Utility-first styling with custom design tokens |
| **React Hook Form** | Performant form handling |
| **Lucide React** | Icon library |
| **React Hot Toast** | Toast notification system |
| **date-fns** | Date formatting utilities |

### Server

| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API framework |
| **MongoDB + Mongoose** | Database with ODM, indexes, virtuals |
| **Socket.io** | WebSocket server for real-time features |
| **Passport.js** | Google OAuth 2.0 strategy |
| **JWT (jsonwebtoken)** | Access & refresh token authentication |
| **bcryptjs** | Password hashing |
| **Cloudinary** | Cloud image storage and transformation |
| **Multer** | Multipart file upload handling (in-memory) |
| **express-validator** | Request validation middleware |
| **express-rate-limit** | API rate limiting |
| **Helmet** | Security headers |
| **mongodb-memory-server** | In-memory MongoDB fallback for development |
| **Nodemailer** | Email service (configured, not yet active) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (React)                     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │  Zustand  │  │  React   │  │     Socket.io Client   │ │
│  │  Stores   │  │  Query   │  │  (chat, notifications) │ │
│  └────┬─────┘  └────┬─────┘  └──────────┬─────────────┘ │
│       │              │                   │               │
│  ┌────┴──────────────┴───────────────────┘               │
│  │            Axios (interceptors)                       │
│  └──────────────────┬────────────────────────────────────┘
│                     │
├─────────────────────┼───────────────────────────────────┤
│                     ▼                                    │
│            ┌────────────────┐                            │
│            │   Vite Proxy   │                            │
│            │  /api → :5000  │                            │
│            └────────┬───────┘                            │
│                     │                                    │
├─────────────────────┼───────────────────────────────────┤
│                     ▼          SERVER (Express)          │
│                                                         │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────┐  │
│  │  Middleware │  │   Routes   │  │   Socket.io       │  │
│  │  (auth,    │  │  (7 route  │  │   Server          │  │
│  │  validate, │  │   modules) │  │  (rooms, typing,  │  │
│  │  rateLimit)│  │            │  │   notifications)  │  │
│  └────────────┘  └──────┬─────┘  └───────────────────┘  │
│                         │                                │
│                  ┌──────┴──────┐                         │
│                  │ Controllers │                         │
│                  │ (7 modules) │                         │
│                  └──────┬──────┘                         │
│                         │                                │
│              ┌──────────┴──────────┐                     │
│              │   Mongoose Models   │                     │
│              │   (7 collections)   │                     │
│              └──────────┬──────────┘                     │
│                         │                                │
│                  ┌──────┴──────┐                         │
│                  │   MongoDB   │                         │
│                  └─────────────┘                         │
│                                                         │
│  ┌──────────────┐                                       │
│  │  Cloudinary  │  (image uploads)                      │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
RentSpace/
├── client/                          # React frontend
│   ├── index.html                   # Entry HTML with font imports
│   ├── package.json                 # Client dependencies
│   ├── vite.config.js               # Vite config (proxy, aliases)
│   ├── tailwind.config.js           # Tailwind theme customization
│   └── src/
│       ├── main.jsx                 # App bootstrap (React Query, Router, Toast)
│       ├── App.jsx                  # Route definitions with AnimatePresence
│       ├── api/                     # Axios instance + API modules
│       │   ├── axios.js             # Configured instance with 401 interceptor
│       │   ├── authApi.js           # Auth endpoints
│       │   ├── itemApi.js           # Item CRUD endpoints
│       │   ├── requestApi.js        # Rental request endpoints
│       │   ├── chatApi.js           # Chat room & message endpoints
│       │   ├── reviewApi.js         # Review endpoints
│       │   ├── userApi.js           # User profile & wishlist endpoints
│       │   └── notificationApi.js   # Notification endpoints
│       ├── hooks/                   # Custom React hooks (React Query wrappers)
│       │   ├── useAuth.js           # Login, register, logout, restore session
│       │   ├── useItems.js          # Item queries & mutations
│       │   ├── useRequests.js       # Rental request queries & mutations
│       │   ├── useChat.js           # Chat rooms & messages
│       │   ├── useReviews.js        # Review queries & mutations
│       │   ├── useWishlist.js       # Wishlist queries & toggle
│       │   ├── useNotifications.js  # Notification queries with 60s polling
│       │   └── useSocket.js         # Socket.io connection & event listeners
│       ├── store/                   # Zustand global stores
│       │   ├── authStore.js         # User & token state (persisted)
│       │   ├── themeStore.js        # Dark/light theme (persisted)
│       │   └── notificationStore.js # Unread notification count
│       ├── components/              # Reusable UI components
│       │   ├── Navbar.jsx           # Fixed header with nav, notifications, avatar
│       │   ├── Footer.jsx           # 4-column site footer
│       │   ├── ProtectedRoute.jsx   # Auth guard wrapper
│       │   └── ui/
│       │       ├── Button.jsx       # Multi-variant button with loading state
│       │       ├── Card.jsx         # Composable card with skeleton loading
│       │       └── PageLoader.jsx   # Full-screen animated loader
│       ├── layouts/
│       │   ├── MainLayout.jsx       # Navbar + content + Footer
│       │   └── AuthLayout.jsx       # Minimal auth page layout
│       ├── pages/                   # Route page components (17 pages)
│       │   ├── LandingPage.jsx      # Hero, featured items, stats, CTA
│       │   ├── BrowsePage.jsx       # Search, filter, sort items grid
│       │   ├── ItemDetailPage.jsx   # Gallery, booking widget, reviews
│       │   ├── ListItemPage.jsx     # 4-step item listing wizard
│       │   ├── Dashboard.jsx        # Tabbed dashboard (6 tabs)
│       │   ├── ChatPage.jsx         # Real-time messaging UI
│       │   ├── ProfilePage.jsx      # User profile with listings & reviews
│       │   ├── WishlistPage.jsx     # Saved items with filters
│       │   ├── CommunityPage.jsx    # Browse community members
│       │   ├── LoginPage.jsx        # Email + Google OAuth login
│       │   ├── SignupPage.jsx       # Registration with Google OAuth
│       │   ├── AuthCallbackPage.jsx # Google OAuth token handler
│       │   ├── HowItWorksPage.jsx   # Platform guide + FAQ
│       │   ├── AboutPage.jsx        # About & mission
│       │   ├── PrivacyPage.jsx      # Privacy policy
│       │   ├── TermsPage.jsx        # Terms of service
│       │   └── NotFoundPage.jsx     # 404 page
│       ├── animations/              # Framer Motion variant configs
│       │   ├── pageVariants.js      # Page transition animations
│       │   ├── cardVariants.js      # Card hover/stagger animations
│       │   └── modalVariants.js     # Modal, drawer, dropdown animations
│       ├── services/
│       │   └── socket.js            # Socket.io singleton with helpers
│       └── styles/
│           └── globals.css          # Design tokens, component styles, responsive
│
├── server/                          # Node.js + Express backend
│   ├── server.js                    # Entry: Express + Socket.io bootstrap
│   ├── package.json                 # Server dependencies
│   ├── .env.example                 # Environment variable template
│   ├── config/
│   │   ├── db.js                    # MongoDB connection with in-memory fallback
│   │   ├── passport.js              # Google OAuth 2.0 strategy
│   │   └── socket.js                # Socket.io events & room management
│   ├── models/                      # Mongoose schemas (7 collections)
│   │   ├── User.js                  # User profile, auth, ratings, wishlist
│   │   ├── Item.js                  # Rental listings with GeoJSON, booking dates
│   │   ├── Request.js               # Rental requests with lifecycle status
│   │   ├── Review.js                # Item & user reviews with auto-aggregation
│   │   ├── ChatRoom.js              # Chat rooms between 2 participants
│   │   ├── Message.js               # Chat messages with read tracking
│   │   └── Notification.js          # In-app notifications (8 types)
│   ├── controllers/                 # Route handlers (business logic)
│   │   ├── authController.js        # Register, login, logout, refresh, Google OAuth
│   │   ├── itemController.js        # CRUD items, image upload/delete, search
│   │   ├── requestController.js     # Send, accept, reject, cancel, complete requests
│   │   ├── reviewController.js      # Create & fetch reviews, rating aggregation
│   │   ├── chatController.js        # Rooms, messages, Socket.io broadcast
│   │   ├── userController.js        # Profile, avatar, wishlist, community
│   │   └── notificationController.js # List, mark read, delete notifications
│   ├── routes/                      # Express route definitions (7 modules)
│   │   ├── authRoutes.js
│   │   ├── itemRoutes.js
│   │   ├── requestRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── userRoutes.js
│   │   └── notificationRoutes.js
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect, optionalAuth, role restriction
│   │   ├── errorHandler.js          # Centralized error → JSON response mapper
│   │   ├── rateLimiter.js           # Global, auth, and upload rate limiters
│   │   ├── upload.js                # Multer config for avatar & item images
│   │   └── validate.js              # express-validator error checker
│   ├── services/
│   │   └── cloudinaryService.js     # Image upload/delete with auto-transform
│   └── utils/
│       ├── ApiError.js              # Custom error class with status codes
│       ├── generateToken.js         # JWT access/refresh token generation
│       └── pagination.js            # Reusable paginate() utility
│
└── .gitignore
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud)
- **Cloudinary** account (for image uploads — optional, falls back to placeholder in dev)
- **Google Cloud Console** project (for OAuth — optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/harshitt0418/RentSpace.git
   cd RentSpace
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cd ../server
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see [Environment Variables](#environment-variables)).

5. **Start the development servers**

   **Terminal 1 — Backend:**
   ```bash
   cd server
   npm run dev
   ```
   > Server starts on `http://localhost:5000`
   > If MongoDB Atlas is unavailable, an in-memory MongoDB instance starts automatically in dev mode.

   **Terminal 2 — Frontend:**
   ```bash
   cd client
   npm run dev
   ```
   > Client starts on `http://localhost:5174`
   > API requests are proxied to the backend via Vite.

6. **Open the app**
   Navigate to `http://localhost:5174` in your browser.

---

## Environment Variables

Create a `.env` file in the `server/` directory. See `server/.env.example` for the template.

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Server port (default: `5000`) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret key for signing refresh tokens |
| `JWT_ACCESS_EXPIRE` | Yes | Access token TTL (e.g., `30m`) |
| `JWT_REFRESH_EXPIRE` | Yes | Refresh token TTL (e.g., `7d`) |
| `CLIENT_URL` | Yes | Frontend URL for CORS (e.g., `http://localhost:5174`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth 2.0 client secret |
| `GOOGLE_CALLBACK_URL` | No | OAuth callback URL |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name (placeholder images used if missing) |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | No | Stripe secret key (payment integration placeholder) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `EMAIL_HOST` | No | SMTP host for email notifications |
| `EMAIL_PORT` | No | SMTP port |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASS` | No | SMTP password |

---

## API Reference

Base URL: `/api`

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register with email & password |
| `POST` | `/auth/login` | — | Login with email & password |
| `POST` | `/auth/logout` | ✅ | Logout and clear refresh token |
| `POST` | `/auth/refresh` | — | Rotate access & refresh tokens |
| `GET` | `/auth/me` | ✅ | Get current user profile |
| `GET` | `/auth/google` | — | Initiate Google OAuth |
| `GET` | `/auth/google/callback` | — | Google OAuth callback |

### Items

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/items` | Optional | Browse items (search, filter, sort, paginate) |
| `GET` | `/items/:id` | Optional | Get item details |
| `POST` | `/items` | ✅ | Create a new listing (multipart) |
| `PATCH` | `/items/:id` | ✅ Owner | Update listing details |
| `DELETE` | `/items/:id` | ✅ Owner | Soft-delete listing |
| `POST` | `/items/:id/images` | ✅ Owner | Upload images (max 5 total) |
| `DELETE` | `/items/:id/images` | ✅ Owner | Remove an image |

**Query Parameters for `GET /items`:**
- `q` — Full-text search
- `category` — Filter by category
- `minPrice` / `maxPrice` — Price range filter
- `sort` — `newest`, `oldest`, `price_asc`, `price_desc`, `rating`
- `page` / `limit` — Pagination

### Rental Requests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/requests` | ✅ | Send a rental request |
| `GET` | `/requests/received` | ✅ | Get requests received (as owner) |
| `GET` | `/requests/sent` | ✅ | Get requests sent (as renter) |
| `PATCH` | `/requests/:id/accept` | ✅ Owner | Accept a request |
| `PATCH` | `/requests/:id/reject` | ✅ Owner | Reject a request |
| `PATCH` | `/requests/:id/cancel` | ✅ Either | Cancel a request |
| `PATCH` | `/requests/:id/complete` | ✅ Owner | Mark rental as completed |

### Reviews

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/reviews` | ✅ | Create a review (item or user) |
| `GET` | `/reviews/item/:itemId` | — | Get reviews for an item |
| `GET` | `/reviews/user/:userId` | — | Get reviews for a user |

### Chat

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/chat/rooms` | ✅ | Get user's chat rooms |
| `POST` | `/chat/rooms` | ✅ | Create or get existing room |
| `GET` | `/chat/rooms/:roomId/messages` | ✅ | Get message history |
| `POST` | `/chat/rooms/:roomId/messages` | ✅ | Send a message |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | — | List community members |
| `GET` | `/users/:id` | — | Get public user profile |
| `PATCH` | `/users/me` | ✅ | Update own profile |
| `PATCH` | `/users/me/avatar` | ✅ | Upload avatar image |
| `GET` | `/users/me/listings` | ✅ | Get own listings |
| `GET` | `/users/me/wishlist` | ✅ | Get wishlist items |
| `GET` | `/users/me/wishlist/ids` | ✅ | Get wishlist item IDs |
| `POST` | `/users/me/wishlist/:itemId` | ✅ | Toggle item in wishlist |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications` | ✅ | Get notifications (filter: unreadOnly) |
| `PATCH` | `/notifications/:id/read` | ✅ | Mark as read |
| `PATCH` | `/notifications/read-all` | ✅ | Mark all as read |
| `DELETE` | `/notifications/:id` | ✅ | Delete a notification |

---

## Real-Time Features

RentSpace uses **Socket.io** for real-time communication:

### Events

| Event | Direction | Description |
|---|---|---|
| `register_user` | Client → Server | Register user for personal notification room |
| `join_room` | Client → Server | Join a chat room |
| `leave_room` | Client → Server | Leave a chat room |
| `typing` | Client → Server | Broadcast typing indicator |
| `stop_typing` | Client → Server | Clear typing indicator |
| `receive_message` | Server → Client | New chat message in a room |
| `user_typing` | Server → Client | Someone is typing in the room |
| `user_stop_typing` | Server → Client | Someone stopped typing |
| `notification` | Server → Client | New notification for the user |

### How It Works

1. **Connection:** When a user logs in, the client connects to Socket.io and emits `register_user` to join their personal room (`user_{userId}`).
2. **Chat:** When a user opens a chat, they `join_room`. Messages sent via the REST API are also broadcast through Socket.io to all room participants in real-time.
3. **Notifications:** When server-side events occur (request received, accepted, rejected, new message, etc.), a notification is created in the database and simultaneously emitted via Socket.io to the target user's personal room.
4. **Typing Indicators:** Managed entirely through Socket.io — no database persistence.

---

## Database Schema

```
┌──────────┐        ┌──────────┐        ┌──────────┐
│   User   │───────▶│   Item   │◀───────│  Review  │
│          │  owns  │          │  rates  │          │
│ name     │        │ title    │        │ rating   │
│ email    │        │ category │        │ comment  │
│ password │        │ price/day│        │ type     │
│ avatar   │        │ images[] │        │          │
│ rating   │        │ location │        │          │
│ wishlist │        │ tags[]   │        │          │
│ earnings │        │ booked[] │        │          │
└──────┬───┘        └──────────┘        └──────────┘
       │                                      │
       │            ┌──────────┐              │
       │            │ Request  │──────────────┘
       └───────────▶│          │    linked to
         requester  │ status   │
         or owner   │ dates    │
                    │ cost     │
                    └──────────┘
                         │
       ┌─────────────────┘
       ▼
┌──────────┐        ┌──────────┐        ┌──────────────┐
│ ChatRoom │───────▶│ Message  │        │ Notification │
│          │  has   │          │        │              │
│ users[2] │        │ content  │        │ type         │
│ lastMsg  │        │ sender   │        │ title        │
│          │        │ readBy[] │        │ message      │
└──────────┘        └──────────┘        │ isRead       │
                                        └──────────────┘
```

### Key Relationships
- A **User** can own many **Items** and send/receive many **Requests**
- A **Request** links a requester (renter) to an item owner for specific dates
- **Reviews** are created after a completed Request and can target an Item or a User
- **ChatRooms** exist between exactly 2 participants with many **Messages**
- **Notifications** are sent to individual users for various platform events

### Indexes
- **Item**: Text index on `(title, description, tags)` for search; compound index on `(category, status, pricePerDay)` for filtering; 2dsphere on `location.coordinates`
- **Request**: Compound indexes on `(requester, status)` and `(owner, status)`
- **Review**: Unique index on `(reviewer, request, type)` to prevent duplicates
- **Message**: Index on `(room, createdAt)` for chronological retrieval
- **Notification**: Index on `(user, isRead, createdAt)` for efficient queries

---

## Rental Request Lifecycle

```
  Renter sends request
         │
         ▼
    ┌─────────┐
    │ PENDING  │──────────────────────────────┐
    └────┬────┘                               │
         │                                    │
    Owner decides                        Either party
         │                               cancels
    ┌────┴────┐     ┌───────────┐        ┌────┴─────┐
    │ACCEPTED │     │ REJECTED  │        │CANCELLED │
    │         │     │           │        │          │
    │ • dates │     │ • reason  │        │ • dates  │
    │   blocked    │   saved   │        │   freed  │
    │ • earnings│  └───────────┘        └──────────┘
    │   credited│
    └────┬─────┘
         │
    Owner marks complete
         │
         ▼
    ┌───────────┐
    │ COMPLETED │
    │           │
    │ • review  │
    │   reminder│
    │   sent    │
    └───────────┘
```

---

## Authentication Flow

### Email/Password
```
Register → Hash password → Store user → Generate JWT pair → Return tokens
Login    → Find user → Compare password → Check ban status → Return tokens
Refresh  → Validate refresh cookie → Detect reuse → Rotate both tokens
Logout   → Clear refresh token on user doc → Clear httpOnly cookie
```

### Google OAuth
```
GET /auth/google → Redirect to Google consent screen
                        ↓
Google authenticates → Returns profile
                        ↓
Server: Find by googleId → or Find by email → or Create new user
                        ↓
Store refresh token → Redirect to client with access token in URL
                        ↓
Client: AuthCallbackPage extracts token → Calls /auth/me → Sets auth state
```

### Token Strategy
- **Access Token**: 30-minute lifespan, stored in memory (Zustand), sent via `Authorization: Bearer` header
- **Refresh Token**: 7-day lifespan, httpOnly secure cookie, automatically rotated on each use
- **401 Interceptor**: Axios automatically retries failed requests after refreshing the access token; queues concurrent requests during refresh

---

## Screenshots

> _Add screenshots of your application here_
>
> Suggested screenshots:
> - Landing page (dark & light mode)
> - Browse page with filters
> - Item detail with booking widget
> - Dashboard overview
> - Chat interface
> - List item wizard
> - Mobile responsive views

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/harshitt0418">Harshit Mittal</a>
</p>
