<p align="center">
  <img src="./Image Assets/budgetopia_logo.png" alt="Budgetopia Logo" width="120" />
</p>

# Budgetopia

> A gamified personal budgeting app where managing your money builds a pixel-art island city.

Log expenses, stay under budget, and earn city points to construct and upgrade buildings on your procedurally generated island. The better you budget, the more your city grows.

---

## Features

- **Expense logging** — log expenses by category with date and note; mark transactions as Money Received to offset category spending.
- **Budget categories** — create, edit, and delete named budget categories with allocated monthly amounts.
- **City points** — earn points per expense logged; earn bonus points at recap time based on how much of your budget you saved.
- **Island city builder** — spend city points to purchase and place pixel-art buildings on an island.
- **Profile & savings tracking** — track total savings over time with monthly recap history

---

## Tech Stack

| Layer         | Technology                             |
| ------------- | -------------------------------------- |
| Framework     | React 18 + Vite 6                      |
| Routing       | React Router v6                        |
| Styling       | Tailwind CSS v3 + shadcn/ui (Radix UI) |
| State         | localStorage (no backend)              |
| Font          | Press Start 2P (Google Fonts)          |
| Animation     | Framer Motion                          |
| Icons         | Lucide React                           |
| Map rendering | Custom SVG hex grid                    |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173` by default.

### Run on local network (mobile access)

```bash
npx vite --port 4173 --host 0.0.0.0
```

Then open `http://<your-local-ip>:4173` on your phone (same WiFi required).

### Other commands

```bash
npm run build        # production build → dist/
npm run preview      # preview production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # TypeScript check (narrow scope — see AGENTS.md)
```

---

## Project Structure

```
src/
├── App.jsx                  # Root component, routing, top-level handlers
├── components/
│   ├── Layout.jsx           # Mobile-first shell (max-w-md, top bar, bottom nav)
│   ├── HexGrid.jsx          # Hex map renderer (pan, zoom, pointer events)
│   ├── HexTile.jsx          # Individual SVG hex tile (memo'd for perf)
│   ├── BuildingSprite.jsx   # Building image/SVG renderer
│   ├── CoastalDecorSprite.jsx # Tree/decor SVG renderer
│   ├── LogExpenseModal.jsx  # Log expense + money received modal
│   ├── HexInteractionModal.jsx # Build/upgrade/demolish/clear modal
│   ├── RecapModal.jsx       # Weekly/monthly recap results modal
│   ├── TopBar.jsx           # City points display
│   ├── DebugPanel.jsx       # Dev tools (reset, test recap, unlimited points)
│   └── ui/                  # shadcn/ui primitives
├── pages/
│   ├── Home.jsx             # Island map view
│   ├── Budget.jsx           # Category management + transaction history
│   └── Profile.jsx          # Stats, savings summary, recent transactions
└── lib/
    ├── gameLogic.js         # All game rules (points, recap, buildings, island)
    ├── localStorage.js      # All read/write to localStorage
    └── useGameState.js      # React hook — hydrates UI from localStorage
```

---

## Data Model

All state is stored in `localStorage` under `budgetopia_*` keys. No backend, no auth.

| Key                           | Contents                                                         |
| ----------------------------- | ---------------------------------------------------------------- |
| `budgetopia_profile`        | `{ income, budgetCadence }`                                    |
| `budgetopia_transactions`   | Array of `{ id, amount, category, date, note, type? }`         |
| `budgetopia_categories`     | Array of `{ id, name, allocatedAmount }`                       |
| `budgetopia_total_points`   | Integer                                                          |
| `budgetopia_buildings`      | Array of `{ id, buildingType, level, hexPosition }`            |
| `budgetopia_island`         | `{ seed, tiles, tileDecor, version }`                          |
| `budgetopia_monthly_recaps` | Array of `{ month, budgetedAmount, spentAmount, savedAmount }` |

Credit transactions (Money Received) use `amount: -value` and `type: 'credit'` to naturally offset spending totals.

---

## Agent Instructions

See [`AGENTS.md`](./AGENTS.md) for:

- npm commands
- Lint/typecheck scope limitations
- App wiring notes
- Manual QA hooks (DebugPanel)

---

## Topics

`react` `vite` `tailwindcss` `personal-finance` `budgeting` `gamification` `pixel-art` `city-builder`
