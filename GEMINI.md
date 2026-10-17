# GEMINI.md — Studyo Codebase Guide

## 1. Project Overview & Tech Stack
- **Application**: Studyo — Hyper-optimized study tracker and Pomodoro focus engine with syllabus mapping, 365-day activity heatmaps, and trilingual support.
- **Architecture**: Client-side Progressive Web App (PWA) with zero-lag optimistic UI, 100% offline-first capabilities, and optional Supabase cloud sync.
- **Core Stack**:
  - **Runtime & Package Manager**: Node.js (`>=20`), `npm` (`package-lock.json`).
  - **Framework**: React 19 (`^19.2.8`), `react-dom` (`^19.2.8`).
  - **Build Tool & Bundler**: Vite 6 (`^6.2.0`) with `@vitejs/plugin-react` (`^4.3.4`), relative base path (`./`).
  - **Language**: TypeScript (`~6.0.2`, target: `ES2023`, JSX: `react-jsx`).
  - **State Management**: Zustand 5 (`^5.0.15`) with `persist` middleware (`localStorage` key: `studypulse_storage_v2`).
  - **Styling**: Tailwind CSS 3 (`^3.4.17`), PostCSS (`^8.5.30`), custom glassmorphism design system (`.glass-panel`, `.glass-pill`, `.glass-header`), warm monochrome/orange palette (`slate-950` / `#e9762b`), JetBrains Mono & Inter Tight typography.
  - **UI / Utilities**: `lucide-react` (`^1.56.0`), `canvas-confetti` (`^1.9.4`), `clsx` (`^2.1.1`), `tailwind-merge` (`^3.7.0`).
  - **Audio Engine**: Offline synthesized soundscapes via Web Audio API (`src/services/soundSynth.ts`, 0 network requests).
  - **Backend / Database**: Optional Supabase JS (`@supabase/supabase-js` `^2.109.0`) with PostgreSQL RLS.
  - **Linter**: Oxlint (`^1.81.0`) with `.oxlintrc.json`.

## 2. Architecture & File Structure
```
study-tracker-pwa/
├── .github/workflows/deploy.yml # GitHub Actions workflow deploying ./dist to GitHub Pages
├── public/                      # Static PWA assets (manifest.json, sw.js, favicon.svg, icons.svg)
├── docs/                        # Precompiled static distribution for GitHub Pages deployment
├── dist/                        # Vite production build output (git-ignored)
├── src/
│   ├── main.tsx                 # Application entrypoint (StrictMode, mounts App)
│   ├── App.tsx                  # Top-level view router (switches between ZenModeView & HomeScreen)
│   ├── index.css                # Global design tokens, glassmorphic utilities, custom scrollbars
│   ├── types/
│   │   └── index.ts             # Domain models (Subject, Chapter, Topic, StudySession, Task, DailyLogEntry)
│   ├── store/
│   │   └── useStudyStore.ts     # Central Zustand store (state, timers, logs, tasks, localStorage merge)
│   ├── services/
│   │   ├── soundSynth.ts        # Procedural Web Audio API sound generator (rain, brown noise, binaural, clock)
│   │   └── supabaseClient.ts    # Supabase client factory & embedded PostgreSQL schema with RLS
│   ├── lib/
│   │   └── utils.ts             # Tailwind class merging utility (cn helper)
│   ├── i18n/
│   │   └── translations.ts      # Multilingual dictionaries (en, hinglish, hi)
│   └── components/
│       ├── HomeScreen.tsx       # Primary multi-tab workspace container (timer, studylog, analysis, tasks)
│       ├── Navbar.tsx           # Top bar (streak count, daily target progress, language selector)
│       ├── Navigation.tsx       # Desktop sidebar and mobile bottom navigation dock
│       ├── DashboardScreen.tsx  # Radial progress rings, top priorities, neglected subject alerts
│       ├── StudyRoomScreen.tsx  # Focus room timer, distraction scratchpad, ambient sound selector
│       ├── DailyStudyLog.tsx    # Spreadsheet-style log table with custom dynamic columns
│       ├── StudyLogAnalysis.tsx # Habit analysis, peak circadian hours, correlation metrics
│       ├── AnalyticsHubScreen.tsx # 365-day heatmap, subject time distribution, student report export
│       ├── SyllabusMapScreen.tsx # Hierarchical syllabus tree with confidence tags (Strong/Med/Weak)
│       ├── TaskPlannerScreen.tsx # Priority task lists and exam countdown cards
│       ├── ZenModeView.tsx      # Minimalist fullscreen focus room with breathing guide
│       ├── ProfileDropdown.tsx  # User profile modal and daily study target settings
│       ├── SupabaseModal.tsx    # Supabase cloud credentials & SQL schema viewer
│       └── ui/                  # Reusable UI primitives (halftone-wordmark-footer, shiny-button)
├── components.json              # shadcn/ui configuration metadata
├── tailwind.config.js           # Theme configuration, font stacks, and animations
├── tsconfig.app.json            # App TypeScript compiler options (bundler mode, path alias @/*)
└── vite.config.ts               # Vite configuration (React plugin, @ alias, relative base)
```

## 3. Coding Standards & Conventions
- **Path Aliasing**: Always import application code via `@/` (e.g. `@/components/...`, `@/store/...`, `@/types`).
- **Typing & Strictness**:
  - Keep domain types centralized in `src/types/index.ts`.
  - Avoid raw `any`; type extensible records with `Record<string, unknown>` or explicit generics.
  - Component props must be explicitly typed using interfaces (e.g., `interface NavbarProps`).
- **State Management**:
  - Access state via `useStudyStore()`.
  - Implement optimistic updates in store actions before any optional remote sync.
  - When modifying store state fields, update `partialize` and `merge` in `useStudyStore.ts` to preserve persistence integrity.
- **Styling & Design System**:
  - Rely on Tailwind utility classes and existing glassmorphism tokens (`glass-panel`, `glass-pill`, `glass-input`, `glass-modal`, `glass-header`).
  - Dark mode is mandatory (`html.dark`, black `#000000` canvas).
  - Use semantic color accents: `#e9762b` (focus/work), `#10b981` (break), `#f59e0b` (stopwatch).
  - Numeric metrics and timers must use `.font-mono-numbers` (`JetBrains Mono` with tabular/slashed figures).
- **Internationalization (i18n)**:
  - Never hardcode user-facing strings in UI components.
  - Add text keys to all three locales (`en`, `hinglish`, `hi`) in `src/i18n/translations.ts`.
- **Code Integrity**:
  - Preserve existing comments, docstrings, and inline SQL schema definitions (`SUPABASE_SQL_SCHEMA`).
  - Do not introduce breaking layout regressions to the unified desktop sidebar or mobile bottom nav.

## 4. Common Commands
- **Development**:
  - `npm run dev`: Launch Vite local dev server (`http://localhost:5173/`).
- **Build**:
  - `npm run build`: Type-check and produce production bundle in `dist/` (`tsc -b && vite build`).
  - `npm run preview`: Serve local preview of the production build in `dist/`.
- **Type Checking & Linting**:
  - `npx tsc -b --noEmit`: Run full TypeScript compiler verification.
  - `npm run lint`: Run Oxlint against the codebase (`.oxlintrc.json`).
- **Deployment**:
  - Automated via GitHub Actions on push to `main` (`.github/workflows/deploy.yml`).
  - When syncing GitHub Pages manually without actions: copy `dist/*` into `docs/`.

## 5. Critical Constraints & Guardrails
- **Offline-First & Zero External Assets**:
  - Zero external media dependencies for audio: all soundscapes must be procedurally generated via Web Audio API (`src/services/soundSynth.ts`).
  - Never introduce network calls that block local UI interactions; all core features must work without internet.
- **Relative Asset Paths**:
  - `vite.config.ts` enforces `base: './'`. Never use absolute root-leading paths (e.g. `/assets/...`) in HTML/CSS/TSX that would break subpath hosting on GitHub Pages.
- **Storage & State Migrations**:
  - Store key `studypulse_storage_v2` is actively in use by users.
  - Never reset or delete user data on app launch; always merge existing `localStorage` data with defaults.
- **Protected Directories**:
  - `docs/`: Used for GitHub Pages static hosting. Do not commit broken or untested builds here.
  - `public/`: Service worker (`sw.js`) and `manifest.json` are essential for PWA installability; do not break icon references or scopes.
