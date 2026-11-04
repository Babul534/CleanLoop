# CleanLoop — Smart Waste Management System

> **A cleaner city. One report at a time.**  
> A modern, full-stack civic-technology application connecting citizens directly with municipal sanitation departments for verified, auditable waste cleanup.

---

## 1. Project Overview

**CleanLoop** is an end-to-end civic-tech platform engineered to replace disorderly municipal waste grievance handling with a transparent, three-step closed-loop lifecycle:
1. **Report the Problem** — Citizens capture photo evidence with automated GPS coordinate verification.
2. **Get It Assigned** — Municipal administrators review reports and dispatch field teams based on geographic proximity.
3. **Track the Cleanup** — Sanitation crews submit photographic proof of completed work, closing the audit trail.

This repository covers **Phase 1: Frontend Design System & Landing Page** and **Phase 2: Backend Architecture & MongoDB Database Design**.

---

## 2. Technology Stack

### Frontend (`client/`)
- **React.js (v18)** — Modern declarative UI library
- **Vite** — Next-generation frontend build tool and dev server
- **JavaScript (ES Modules)** — Modern standard syntax
- **React Router (v6)** — Client-side declarative routing
- **Lucide React** — Consistent, lightweight civic and interface icons
- **Plain CSS3 & Custom Design Tokens** — Zero external CSS frameworks or Tailwind; custom architectural styles

### Backend (`server/`)
- **Node.js (v20+)** — Server runtime
- **Express.js (v4)** — Fast, unopinionated HTTP web framework
- **MongoDB Atlas** — Cloud NoSQL primary database
- **Mongoose (v8)** — Schema modeling, validation, and strict typing
- **CORS** — Cross-Origin Resource Sharing middleware
- **Dotenv** — Environment variable management

### Development Tools
- **Concurrently** — Orchestrates frontend and backend simultaneously in development
- **Nodemon** — Automatic server reload on file modifications

---

## 3. Project Structure

```text
smart-waste-management/
│
├── client/                               # Frontend React + Vite application
│   ├── public/
│   │   ├── assets/
│   │   └── favicon.svg                  # Custom vector emblem favicon
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── BrandMark.jsx        # Custom SVG emblem & typography
│   │   │   │   ├── Button.jsx           # Primary, secondary, outline, text variants
│   │   │   │   ├── Container.jsx        # Responsive max-width container
│   │   │   │   ├── HeroIllustration.jsx # Illustrative civic workflow diagram
│   │   │   │   ├── RevealSection.jsx    # IntersectionObserver reveal wrapper
│   │   │   │   └── SectionLabel.jsx     # Editorial taxonomy kicker
│   │   │   └── layout/
│   │   │       ├── Navbar.jsx           # Responsive header with mobile drawer
│   │   │       └── Footer.jsx           # Architectural footer & project metadata
│   │   │
│   │   ├── pages/
│   │   │   ├── HomePage.jsx             # 7-section premium landing page
│   │   │   └── NotFoundPage.jsx         # 404 unmapped sector view
│   │   │
│   │   ├── hooks/
│   │   │   ├── useScrollHeader.js       # Dynamic header elevation on scroll
│   │   │   └── useScrollReveal.js       # Viewport-triggered animations
│   │   │
│   │   ├── services/
│   │   │   └── api.js                   # Centralized API service & health check
│   │   │
│   │   ├── styles/
│   │   │   ├── tokens.css               # Exact civic color palette & tokens
│   │   │   ├── global.css               # Universal reset, base fonts, selection
│   │   │   ├── components.css           # UI primitive styles & navigation
│   │   │   └── home.css                 # Landing page editorial layout
│   │   │
│   │   ├── App.jsx                      # App root with client router
│   │   └── main.jsx                     # Vite React entrypoint
│   │
│   ├── .env.example                     # Client environment template
│   ├── .env                             # Client environment variables
│   ├── index.html                       # HTML5 template with Google Fonts
│   ├── package.json                     # Client dependencies
│   └── vite.config.js                   # Vite configuration
│
├── server/                               # Backend Express API & Database
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                    # MongoDB Atlas connection manager & events
│   │   ├── controllers/
│   │   │   └── healthController.js      # API & Database health endpoints
│   │   ├── middleware/
│   │   │   └── errorHandler.js          # 404 & centralized error handlers
│   │   ├── models/
│   │   │   ├── User.js                  # Citizen, admin, and collector accounts
│   │   │   ├── Complaint.js             # Incidents with GeoJSON 2dsphere indexing
│   │   │   ├── Assignment.js            # Historical & active collector dispatch
│   │   │   ├── Notification.js          # In-app alerts & updates
│   │   │   ├── Feedback.js              # 1-5 star ratings with unique compound index
│   │   │   ├── PointsTransaction.js     # Immutable Green Points ledger
│   │   │   ├── ActivityLog.js           # Auditable system and security action log
│   │   │   └── index.js                 # Unified models export hub
│   │   ├── routes/
│   │   │   ├── api.routes.js            # Main router hub
│   │   │   └── health.routes.js         # /api/health and /api/health/db
│   │   ├── services/                    # Reserved for Phase 3 business logic
│   │   ├── utils/
│   │   │   ├── dbCheck.js               # MongoDB connectivity verification tool
│   │   │   └── validateSchemas.js       # In-memory Mongoose schema test suite
│   │   ├── app.js                       # Express app configuration & middleware
│   │   └── server.js                    # HTTP listener & process handlers
│   │
│   ├── .env.example                     # Server environment template
│   ├── .env                             # Server environment variables
│   └── package.json                     # Server dependencies
│
├── .gitignore
├── package.json                          # Root scripts & orchestration
└── README.md                             # Documentation
```

---

## 4. Mongoose Database Schema Models (Phase 2)

| Model | Purpose | Key Fields | Indexes |
| :--- | :--- | :--- | :--- |
| **User** | User accounts (user, admin, collector) | `name`, `email`, `passwordHash`, `role`, `accountStatus`, `availability`, `serviceAreas` | `email` (unique), `role`, `role + availability` |
| **Complaint** | Incident reports | `complaintCode`, `user`, `description`, `category`, `priority`, `images` (max 5), `location` (GeoJSON `Point`), `assignedCollector`, `status`, `statusHistory`, `reopenRequest` | `complaintCode` (unique), `user + createdAt`, `status + priority + createdAt`, `assignedCollector + status`, `location` (`2dsphere`) |
| **Assignment** | Collector task history | `complaint`, `collector`, `assignedBy`, `status`, `completionImages`, `timestamps` | `complaint`, `collector + status`, `assignedBy`, `createdAt` |
| **Notification** | User notifications | `user`, `title`, `message`, `type`, `relatedComplaint`, `isRead`, `readAt` | `user + createdAt`, `user + isRead` |
| **Feedback** | Post-resolution ratings | `complaint`, `user`, `rating` (1-5 integer), `comment` | Compound unique `complaint + user` (1 rating per user per ticket) |
| **PointsTransaction**| Ledger for Green Points | `user`, `complaint`, `points` (non-zero integer), `type`, `reason`, `idempotencyKey` | `user + createdAt`, `idempotencyKey` (unique partial), `complaint + type` (unique partial for `complaint_resolved`) |
| **ActivityLog** | Auditable security & ops log | `actor` (null for system), `action`, `entityType`, `entityId`, `description`, `metadata` | `actor + createdAt`, `entityType + entityId`, `createdAt` |

---

## 5. Prerequisites

- **Node.js**: `v18.0.0` or later (tested on `v24.14.0`)
- **npm**: `v9.0.0` or later (tested on `11.9.0`)
- **MongoDB Atlas Cluster**: A free or paid cluster on [cloud.mongodb.com](https://cloud.mongodb.com)

---

## 6. Installation & Configuration

1. Clone or open the project directory in your terminal:
   ```powershell
   cd d:\Desktop\smart-waste-management
   ```

2. Install all dependencies across root, server, and client:
   ```powershell
   npm run install:all
   ```

3. Configure Environment Variables:
   - Copy `server/.env.example` to `server/.env`:
     ```powershell
     Copy-Item server/.env.example server/.env
     ```
   - Open `server/.env` and configure your credentials:
     ```env
     PORT=5000
     NODE_ENV=development
     CLIENT_URL=http://localhost:5173
     MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cleanloop
     ```
   *(Note: Ensure your MongoDB Atlas Network Access includes your current IP address)*

---

## 7. Database Verification & Schema Testing

CleanLoop provides dedicated diagnostic and test scripts:

### Test Schema Constraints (In-Memory, Zero DB Writes Required)
Verifies all 7 Mongoose schemas, enums, required fields, GeoJSON coordinates, and bounds:
```powershell
npm run test:schemas
```
*(Runs 30 unit validations across all models with full pass reporting)*

### Verify Live MongoDB Atlas Connectivity
Attempts a connection to your cluster and verifies active readyState:
```powershell
npm run db:check
```
*(Masks credentials, reports connection host and database name, and closes cleanly)*

---

## 8. Running the Application

### Option A: Run Both Frontend & Backend Concurrently (Recommended)

From the root directory:
```powershell
npm run dev
```

### Option B: Run Individually

**Terminal 1 — Backend:**
```powershell
npm run server:dev
```

**Terminal 2 — Frontend:**
```powershell
npm run client:dev
```

---

## 9. Verifying the API Health Endpoints

### 1. General System API Health
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health
```
**Response:**
```json
{
  "success": true,
  "message": "CleanLoop API is running",
  "timestamp": "2026-11-04T13:31:17.131Z",
  "service": "cleanloop-api",
  "version": "1.0.0"
}
```

### 2. Database Health Endpoint
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health/db
```
**When connected:** `200 OK`
```json
{
  "success": true,
  "database": "connected"
}
```
**When disconnected:** `503 Service Unavailable`
```json
{
  "success": false,
  "database": "disconnected",
  "message": "Database is not connected"
}
```

---

## 10. Next Steps

Phase 2 complete. Standing by for **Phase 3 — Authentication, Role-Based Access Control & User Management**.
