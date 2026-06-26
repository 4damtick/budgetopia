# AGENTS.md

## Commands

- Use `npm`; no alternate lockfile is present.
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Lint fix: `npm run lint:fix`
- Typecheck: `npm run typecheck`
- Preview: `npm run preview`

## Verification Limits

- `npm run typecheck` is narrow: `jsconfig.json` only includes `src/components/**/*.js`, `src/pages/**/*.jsx`, and `src/Layout.jsx`, and excludes `src/lib` and `src/components/ui`.
- `npm run lint` is similarly narrow: `eslint.config.js` only targets `src/components/**/*.{js,mjs,cjs,jsx}`, `src/pages/**/*.{js,mjs,cjs,jsx}`, and `src/Layout.jsx`, while ignoring `src/lib/**/*` and `src/components/ui/**/*`.
- After changing app wiring or game logic, manually inspect the touched codepaths; repo checks do not fully cover them.
- No test files or Vitest/Jest/Playwright config exist; browser QA is the only verified path here.

## App Structure

- This is a single-package Vite + React app, not a monorepo.
- Entrypoint: `src/main.jsx`.
- App shell and routing live in `src/App.jsx`.
- `@/*` resolves to `src/*` via `jsconfig.json`.
- Main Stage 1 routes in `src/App.jsx`: `/`, `/budget`, `/quests`, `/profile`.
- The app is intentionally mobile-first: `src/components/Layout.jsx` constrains the shell with `max-w-md` and owns the top bar / bottom nav frame.

## MVP Source Of Truth

- Core Stage 1 state is local-first, not backend-first.
- Persisted game data lives in `src/lib/localStorage.js` under `budgetopia_*` keys.
- Budgeting, points, city level, buildings, recovery mission, and weekly recap rules live in `src/lib/gameLogic.js`.
- `src/lib/useGameState.js` hydrates UI state from localStorage and exposes the `refresh()` flow used by `src/App.jsx`.
- `src/App.jsx` now renders directly without auth/login gating; onboarding is the first user gate for a fresh browser state.
- For MVP work, prefer editing `src/App.jsx`, `src/pages/*`, and `src/lib/{gameLogic,localStorage,useGameState}.js`.

## Local-Only Runtime

- The app should run as a plain local Vite app after `npm install`.
- `README.md` still contains Base44 export boilerplate; trust the current code/config over that file where they conflict.

## Useful Manual QA Hook

- `src/components/DebugPanel.jsx` can reset all local data and trigger the weekly recap flow, which is useful when iterating on Stage 1 mechanics.
