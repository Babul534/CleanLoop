# CleanLoop — Smart Waste Management System

> **A cleaner city. One report at a time.**  
> A modern, full-stack civic-technology application connecting citizens directly with municipal sanitation departments for verified, auditable waste cleanup.

---

## 1. Project Overview

**CleanLoop** is an end-to-end civic-tech platform engineered to replace disorderly municipal waste grievance handling with a transparent, three-step closed-loop lifecycle:
1. **Report the Problem** — Citizens capture photo evidence with automated GPS coordinate verification.
2. **Get It Assigned** — Municipal administrators review reports and dispatch field teams based on geographic proximity.
3. **Track the Cleanup** — Sanitation crews submit photographic proof of completed work, closing the audit trail.

This repository represents **Phase 1: Project Foundation, Brand Identity & Premium UI Design System**.

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
│   │   │   │   ├── HeroIllustration.jsx # Original vector civic workflow diagram
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
├── server/                               # Backend Express API
│   ├── src/
│   │   ├── config/                      # Database & service configurations
│   │   ├── controllers/
│   │   │   └── healthController.js      # Health status controller
│   │   ├── middleware/
│   │   │   └── errorHandler.js          # 404 & centralized error handlers
│   │   ├── models/                      # Reserved for Phase 2 data models
│   │   ├── routes/
│   │   │   ├── api.routes.js            # Main router hub
│   │   │   └── health.routes.js         # /api/health route
│   │   ├── services/                    # Business logic services
│   │   ├── utils/                       # Shared server helpers
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

## 4. Design System & Brand Identity

### Color Tokens

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--color-forest` | `#193A2E` | Primary brand authority, headers, dark surfaces |
| `--color-forest-light`| `#285744` | Hover states, secondary accents |
| `--color-lime` | `#D9F36A` | High-visibility accent, active badges, primary CTA punch |
| `--color-paper` | `#F5F4EE` | Editorial backdrop, body background |
| `--color-white` | `#FFFFFF` | Card surfaces, clean containers |
| `--color-ink` | `#25312B` | High-contrast readable body text |
| `--color-muted` | `#77847B` | Secondary captions, metadata, borders |
| `--color-border` | `#DFE4DC` | Subtle architectural container outlines |
| `--color-alert` | `#E7895C` | Urgent statuses, warning badges |
| `--color-sage` | `#9CCDB8` | Supporting nature accents, map indicators |

### Typography
- **Headings**: `Space Grotesk` (weights: 500, 600, 700)
- **Body & Interface**: `DM Sans` (weights: 400, 500, 600)

---

## 5. Prerequisites

- **Node.js**: `v18.0.0` or later (tested on `v24.14.0`)
- **npm**: `v9.0.0` or later (tested on `11.9.0`)
- **Shell**: Windows PowerShell, Command Prompt, or bash

---

## 6. Installation

Clone or open the project directory in your terminal:

```powershell
cd d:\Desktop\smart-waste-management
```

Install all dependencies across root, server, and client in one command:

```powershell
npm run install:all
```

Alternatively, install them individually:

```powershell
# Root dependencies (concurrently)
npm install

# Server dependencies (Express, CORS, Dotenv, Nodemon)
cd server
npm install
cd ..

# Client dependencies (React, Vite, Lucide React, React Router)
cd client
npm install
cd ..
```

---

## 7. Running the Application

### Option A: Run Both Frontend & Backend Concurrently (Recommended)

From the root directory:

```powershell
npm run dev
```

This starts:
- **Express Backend** at `http://localhost:5000`
- **Vite React Client** at `http://localhost:5173`

### Option B: Run Individually

**Terminal 1 — Backend:**
```powershell
npm run server:dev
# Or: cd server && npm run dev
```

**Terminal 2 — Frontend:**
```powershell
npm run client:dev
# Or: cd client && npm run dev
```

---

## 8. Verifying the API Health Endpoint

With the server running, send a `GET` request to `/api/health`:

### Using PowerShell:
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health
```

### Using cURL:
```bash
curl http://localhost:5000/api/health
```

### Expected Response:
```json
{
  "success": true,
  "message": "CleanLoop API is running",
  "timestamp": "2026-11-04T13:00:01.158Z",
  "service": "cleanloop-api",
  "version": "1.0.0"
}
```

You can also run the built-in npm test command from the root directory:
```powershell
npm run test:health
```

---

## 9. Quality Verification Completed in Phase 1

1. **Dependency Installation**: Root, client, and server dependencies installed with zero errors.
2. **Production Build**: `npm --prefix client run build` compiles without warnings or errors.
3. **Backend Health Check**: Confirmed via `GET http://localhost:5000/api/health`.
4. **404 Route Protection**: Tested and verified fallback handling.
5. **Brand Identity**: Custom SVG emblem implemented, avoiding generic recycling emojis.
6. **Responsive Design**: Tested across mobile (<=480px), tablet (<=768px), laptop (<=1024px), and desktop.
7. **Accessibility**: Visible keyboard focus rings (`:focus-visible`), ARIA attributes on modal navigation, and `prefers-reduced-motion` respected.

---

## 10. Next Steps

Phase 1 is complete. Ready for **Phase 2 — Database Modeling, Authentication & Role-Based Access Control**.
