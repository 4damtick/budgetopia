More specifically, you are asked to present in a video:

1. What the main features are.
2. How the main functionality is implemented architecture-wise and how it maps your
   conceptual innovation into code. In the case of a GUI, how it facilitates the UX.
3. Explain how your software has to be deployed and used (a product demo).
4. Be investor oriented.
5. At the end: what coding agent(s) used (e.g. Cursor, Claude Code, Copilot) is your
   software based on and why these were a good choice for you. Also how you orchestrate
   your agents.
   Additionally, you might want to point out other aspects of your MVP implementation:
6. Crucial prerequisites to scale the software out and technological risks related to your
   specific implementation.
7. Challenges in operations and maintenance and how these could be tackled.
8. What security risks do you see for the operator and the users

---

## Budgetopia — Presentation Answers

### 1. Investor Pitch

**Problem:** Budgeting apps are abandoned within weeks because they offer no reward loop — tracking feels like punishment.

**Solution:** Budgetopia converts financial discipline into visible city growth. Every euro saved is a building placed. The city is a live visualisation of your financial health — sunny weather when under budget, gloomy when over.

**Differentiation:**

- No subscription, no backend, no data harvesting — privacy-first
- Gamification is intrinsic (saving = building), not cosmetic (badges for logging in)

**Growth path:**

- Multiplayer islands (shared household budget → shared city)
- Backend sync for cross-device + social comparison
- Premium building packs / themes (cosmetic monetisation)
- Financial institution partnerships (auto-import transactions)

**Market:** 1.8B people globally lack effective personal budgeting tools. Fintech + gamification is a proven wedge (see: Duolingo for language, Habitica for habits).

### **Demo flow:**

* Onboarding — set monthly income + create budget categories
* Log expenses → city points accumulate in top bar
* Budget tab → see per-category spend bars, flip Week/Month, edit/delete transactions
* Home map → tap a tile → buy a building → watch it appear on island
* Debug panel → Test Recap → recap modal shows savings % + points earned
* Profile → total saved since tracking started

### 1. Main Features

- **Expense logging** — log spending by category, date, note. Mark as "Money Received" to offset category spending (credit transaction, not budget increase)
- **Budget categories** — create/edit/delete categories with monthly allocations. Week/Month toggle shows projected weekly budget (÷4)
- **City Points reward system** — earn 1 point per expense logged. Weekly/monthly recap calculates `savedPercent × 10 × multiplier` (monthly = ×2, weekly = ×1) as bonus points
- **Recovery mission** — when over budget, log 3 small expenses (≤€10) to earn a 50pt comeback bonus
- **Hex-grid island city builder** — spend points to buy/place/upgrade 8 building types on a procedurally generated island. Clear coconut trees or grass trees from tiles first
- **Profile & savings history** — monthly recap records saved amount; cumulative savings tracked over time
- **Mobile-first UI** — constrained to max-w-md, pixelated gaming font (Press Start 2P), pan/pinch-zoom map

---

### 2. Architecture & Implementation

**Local-first state model**
All data lives in `localStorage` under `budgetopia_*` keys — no backend, no auth. `src/lib/localStorage.js` owns all reads/writes. `src/lib/useGameState.js` hydrates React state from storage and exposes a `refresh()` callback used by every mutation.

**Game logic separation**
`src/lib/gameLogic.js` is the single source of truth for all rules — point formulas, budget limits, period calculations, island generation, building costs. UI components never compute game state themselves; they call gameLogic functions and pass results to localStorage.

**Credit transaction model**
Money Received records `{ amount: -value, type: 'credit' }`. This negative amount naturally offsets all spending totals (`getTotalPeriodSpending`, `getCategorySpending`) without touching `allocatedAmount` — no special-case code needed anywhere downstream.

**Hex map rendering**
`HexGrid.jsx` computes a sorted render list (`renderItems`) via `useMemo` — tiles, decor, buildings ordered by Y for correct isometric depth. Each `HexTile` is an Scalable Vector Graphic with per-tile gradient defs. The entire map is a CSS-transformed div; pan/zoom only updates a single `{ scale, x, y }` state. `React.memo` + `useCallback` on tile click handlers means panning never re-renders individual tiles — only the transform updates.

**Island generation**
Seeded PRNG (`createSeededRandom`) ensures the same seed always produces the same island. Tiles grow from origin via constrained random walk, then terrain (grass/sand) is assigned based on coast edge count.

**UX facilitation**

- Bottom nav keeps all 3 pages one tap away
- Log Expense modal is the primary action — always accessible from home
- Inline error display (no toast spam) keeps focus in the form
- Pixelated font + coin icons reinforce the game aesthetic without sacrificing readability

---

### 3. Deployment & Demo

**Local dev:**

```bash
npm install
npm run dev        # → localhost:5173
```

**Mobile (same WiFi):**

```bash
npx vite --port 4173 --host 0.0.0.0
# open http://<local-ip>:4173 on phone
```

**Production build:**

```bash
npm run build      # outputs dist/
```

---

---

### 5. Coding Agents Used

**Claude Code (Anthropic)** — primary agent throughout the entire build.

Why it was a good choice:

- Understands full codebase context across multiple files simultaneously — critical for a local-first app where game logic, localStorage, and UI are tightly coupled
- Handles multi-step refactors (e.g. React.memo + useCallback propagation across HexGrid/HexTile) in one pass
- Catches self-introduced bugs immediately (e.g. duplicate `CoastalDecorLayer` definition, missing `useMemo` import)
- Reads and writes binary assets (PNG background removal via Python/Pillow) within the same session

**Agent orchestration:**
Single Claude Code session. All changes implemented directly in the working directory with Vite hot-reload providing instant visual verification. No separate planning agents — architecture decisions made inline with implementation.

---

### 6. Prerequisites to Scale & Tech Risks

**To scale:**

- Add user auth (no login currently — all data is device-local)
- More assets

**Tech risks:**

- SVG hex grid rendering is CPU-bound at scale; 110+ tiles with per-tile gradient defs creates a large DOM; canvas rendering needed for larger maps

### 7. Security Risks

**For the operator:**

- No backend = no server attack surface.
- If monetised (in-app purchases), client-side point balance is trivially manipulable — all purchases must be validated server-side

**For the user:**

- All financial data stored unencrypted in `localStorage` — accessible to any JS running on the same origin (XSS risk)
- No data export or backup — data loss is permanent if browser storage is cleared
- No input sanitisation on category names/notes beyond `trim()`
- Third-party dependencies (80+ npm packages) expand the supply chain attack surface; `npm audit` should be part of CI
