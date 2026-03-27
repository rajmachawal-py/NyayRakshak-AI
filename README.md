# NyayRakshak AI

> **AI-powered contract review platform with enterprise-grade privacy controls, multilingual support, and intelligent clause analysis.**

**Demo Video:** https://drive.google.com/file/d/14pA7aNNbAYKzVQhalNoLLpMxBpr44QSh/view?usp=sharing

**Live Deployment:** https://nyayrakshak-ai.onrender.com/

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#license)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Component Reference](#component-reference)
- [Privacy Mode](#privacy-mode)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Team](#team)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

NyayRakshak AI empowers legal professionals, businesses, and individuals to analyze contracts intelligently — without compromising on data privacy. The platform combines a performant React/Vite frontend with a robust Node/Express backend, offering seamless switching between cloud AI and fully local on-device processing.

Whether you need rapid clause extraction, risk classification, or plain-language simplification, NyayRakshak AI delivers enterprise-level contract intelligence with a consumer-friendly interface.

---

## Key Features

| Feature | Description |
|---|---|
| **Contract Upload & OCR** | Upload PDF contracts or paste raw text for instant analysis |
| **AI-Powered Clause Analysis** | Deep analysis of legal clauses, obligations, and risk factors via cloud AI (Gemini/Groq) |
| **Privacy Mode** | Toggle on-device-only processing — zero data leaves your machine |
| **Smart AI Fallback** | Automatic fallback from cloud AI → local API → browser-side heuristics |
| **Authentication System** | Full sign-up/sign-in flow with JWT-secured sessions |
| **Guest Mode** | Quick evaluation without requiring account creation |
| **Export & Save** | Download analysis reports or save them to your account |
| **Multilingual UI** | Interface text supports multiple languages via translation config |
| **Chat Interface** | Conversational Q&A about analyzed contracts |

---

## Architecture

NyayRakshak AI follows a two-tier client-server architecture with a privacy-first decision layer that governs how and where contract data is processed.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│                                                             │
│   ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│   │  Auth Layer │    │ Contract UI  │    │ Settings Panel│  │
│   │ AuthScreen  │    │  App.tsx     │    │ Privacy Toggle│  │
│   └──────┬──────┘    └──────┬───────┘    └───────┬───────┘  │
│          │                  │                     │         │
│          └──────────────────┴─────────────────────┘         │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │ Privacy Mode?   │                      │
│                    └────────┬────────┘                      │
│                   YES       │        NO                     │
│              ┌──────────────┤  ┌─────────────────┐          │
│              │              │  │  gemini.ts       │         │
│   ┌──────────▼───────┐      │  │  Cloud AI Client │         │
│   │   localLLM.ts    │      │  └────────┬────────┘          │
│   │ Local Heuristics │      │           │                   │
│   └──────────────────┘      └───────────┘                   │
└─────────────────────────────────│───────────────────────────┘
                                  │  HTTP (REST)
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Node/Express)                   │
│                         server.ts                           │
│                                                             │
│  POST /api/analyze   POST /api/chat   POST /api/login       │
│  POST /api/signup    GET  /api/me     GET  /api/export      │
│                                                             │
│   ┌───────────────────────────────────────────────────────┐ │
│   │              Analysis Decision Engine                 │ │
│   │   privacy_mode=true → local rule engine               │ │
│   │   privacy_mode=false → Gemini / Groq API              │ │
│   └───────────────────────────────────────────────────────┘ │
│                                                             │
│   ┌──────────────────┐       ┌────────────────────────────┐ │
│   │  JWT Auth Layer  │       │  Optional: PostgreSQL DB   │ │
│   │  Sessions, Tokens│       │  Users, Analyses, History  │ │
│   └──────────────────┘       └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                  │
                          ┌───────┴────────┐
                          │  External APIs │
                          │  Gemini / Groq │
                          └────────────────┘
```

### Data Flow Summary

1. **User** opens the app → authentication check (stored session or guest mode)
2. **Contract input** via file upload (PDF with OCR) or text paste
3. **Privacy check** reads `localStorage.privacy_mode`
   - **Privacy ON** → analysis handled entirely in-browser by `localLLM.ts`
   - **Privacy OFF** → request sent to `/api/analyze` on the backend
4. **Backend** selects cloud AI or local fallback based on API key availability
5. **Results** rendered in the UI; authenticated users can save or export

---

## Project Structure

```
nyayrakshak-ai/
│
├── src/
│   ├── App.tsx                  # Root component — auth, upload, analysis state
│   ├── components/
│   │   └── AuthScreen.tsx       # Sign in / sign up / guest mode
│   ├── services/
│   │   ├── gemini.ts            # Cloud AI integration (Gemini / Groq)
│   │   └── localLLM.ts         # Local fallback & heuristic analysis engine
│   ├── translations.ts          # Language strings for contract analysis labels
│   ├── uiTranslations.ts        # UI text for settings, banners, and status
│   ├── types.ts                 # Shared TypeScript interfaces & types
│   └── lib/
│       └── utils.ts             # General utility helpers
│
├── server.ts                    # Express backend API server
├── .env                         # Environment variables (never commit this)
├── vite.config.ts               # Vite build configuration
├── tsconfig.json                # TypeScript configuration
├── package.json
└── README.md
```

---

## Component Reference

### `src/App.tsx` — Root Application Component

The central orchestrator of the application. Manages:

- **Authentication state** — tracks whether the user is authenticated, a guest, or unauthenticated
- **Contract processing** — handles file upload, PDF OCR, and text submission
- **Analysis routing** — branches between `localAnalyzeContract()` and `POST /api/analyze` based on privacy mode
- **UI state** — controls the settings panel, privacy banner, and result display
- **Session persistence** — reads/writes `localStorage` for privacy mode and user preferences

Key state variables:

| Variable | Type | Purpose |
|---|---|---|
| `isPrivacyMode` | `boolean` | Persisted to `localStorage`; controls analysis routing |
| `analysisResult` | `AnalysisResult \| null` | Holds the current contract analysis output |
| `isAuthenticated` | `boolean` | Controls whether save/export features are available |
| `isGuestMode` | `boolean` | Enables limited access without an account |

---

### `src/components/AuthScreen.tsx` — Authentication UI

Renders the sign-in, sign-up, and guest mode entry flows. Calls:

- `POST /api/login` — validates credentials, returns JWT
- `POST /api/signup` — creates a new account
- Stores session token in `localStorage` for subsequent requests
- Offers a **Continue as Guest** path that bypasses authentication

---

### `src/services/gemini.ts` — Cloud AI Client

Handles all communication with the remote AI provider:

- Constructs the analysis request payload from contract text
- Invokes the Gemini or Groq API endpoint
- Parses and normalises the response into an `AnalysisResult` object
- **Only invoked when `isPrivacyMode` is `false`**

---

### `src/services/localLLM.ts` — Local Analysis Engine

Provides contract analysis without any external network calls, using a three-tier fallback:

1. **Local API endpoint** — attempts a locally running LLM server (e.g., Ollama)
2. **Browser heuristics** — rule-based clause classification if no local server is available
3. Returns a structured `AnalysisResult` using only in-browser computation

This module is the privacy guarantee: when active, no contract text ever leaves the user's device.

---

### `server.ts` — Express Backend

The backend API server exposes the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Contract analysis (cloud AI or local fallback) |
| `POST` | `/api/chat` | Conversational Q&A about the contract |
| `POST` | `/api/login` | User authentication, returns JWT |
| `POST` | `/api/signup` | New user registration |
| `GET` | `/api/me` | Verify active session |
| `GET` | `/api/export` | Download analysis as a report |

The server includes request validation, CORS configuration, JWT middleware, and an optional PostgreSQL adapter for persistent storage.

---

## Privacy Mode

Privacy Mode is a first-class architectural feature, not an afterthought.

### How It Works

```
User toggles Privacy Mode ON
         │
         ▼
localStorage.setItem('privacy_mode', 'true')
         │
         ▼
App.tsx reads privacy_mode on every analysis request
         │
         ├─ true  → localLLM.ts (100% on-device, no HTTP calls)
         └─ false → POST /api/analyze → Gemini/Groq APIs
```

### What Changes When Privacy Mode Is On

- All analysis is performed by `localLLM.ts` in the browser
- The Gemini/Groq API clients in `gemini.ts` are never invoked
- The backend `/api/analyze` endpoint is not called
- Chat simplification features use an offline fallback response
- The UI renders a persistent banner:

  > 🔒 **Privacy Mode ON** — Your contract is processed locally.
  > ⚠️ Local analysis may be less detailed than AI-based analysis.

### Toggling Privacy Mode

Navigate to **Settings** in the app and toggle the Privacy Mode switch. The preference is persisted immediately to `localStorage` and takes effect on the next analysis request.

---

## Getting Started

### Prerequisites

- **Node.js 18+** — [Download here](https://nodejs.org/)
- **npm** — bundled with Node.js
- **PostgreSQL** *(optional)* — required only for persistent user data and saved analyses

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nyayrakshak-ai.git
cd nyayrakshak-ai

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the project root:

```env
# AI Provider Keys (at least one required for cloud analysis)
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Authentication
JWT_SECRET=your_strong_random_secret_here

# Email (for account notifications — optional)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SERVICE=gmail

# Database (optional — omit to use in-memory session storage)
DATABASE_URL=postgresql://user:password@localhost:5432/nyayrakshak
```

> ⚠️ Never commit `.env` to version control. It is included in `.gitignore` by default.

### Run Locally

```bash
# Start the development server (frontend + backend)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The Express backend starts on port `3001` by default and is proxied through Vite during development.

---

## Deployment

NyayRakshak AI can be deployed on any platform that supports Node.js. Recommended options:

| Platform | Best For | Notes |
|---|---|---|
| **Render** | Full-stack apps | Easy Node + PostgreSQL setup |
| **Railway** | Node + managed DB | Great DX, automatic deploys |
| **Vercel** | Frontend-focused | Deploy frontend separately; use Vercel Serverless for API routes |
| **Azure App Service** | Enterprise | Native environment variable management, VNet support |

### Production Checklist

- [ ] Set all required environment variables on your hosting platform
- [ ] Configure `VITE_BACKEND_URL` if frontend and backend are hosted separately
- [ ] Connect a managed PostgreSQL instance for persistent storage
- [ ] Enable HTTPS (all major platforms handle this automatically)
- [ ] Rotate `JWT_SECRET` before go-live; store it securely in your secrets manager
- [ ] Review CORS configuration in `server.ts` to restrict allowed origins to your domain

---

## Team

NyayRakshak AI was designed and built by:

| Name | GitHub |
|---|---|
| **Jay Shimpi** | [@jayshimpi](https://github.com/jayshimpi) |
| **Lakshay Vig** | [@lakshayvig](https://github.com/lakshayvig) |
| **Aziz Sayyad** | [@azizsayyad](https://github.com/azizsayyad) |
| **Vedant Patil** | [@vedantpatil](https://github.com/vedantpatil) |
| **Riya Chavan** | [@riyachavan](https://github.com/riyachavan) |

> Update the GitHub handles above with each team member's actual username.

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

### Extension Points

- **Add AI providers** — extend `src/services/gemini.ts` to support additional cloud LLM APIs
- **Improve local analysis** — enhance clause classification in `src/services/localLLM.ts`
- **Database persistence** — implement the full PostgreSQL adapter in `server.ts` for production-grade storage
- **Localization** — add language entries to `src/translations.ts` and `src/uiTranslations.ts`
- **UI themes** — the component structure supports additional theme variants

### Development Workflow

```bash
# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
```

---

## License

NyayRakshak AI is provided as a proprietary application. All rights reserved. Adapt and deploy it securely according to your organization's requirements.

---

<p align="center">Built with ⚖️ for modern legal workflows by the NyayRakshak AI team</p>
