# HMG Newsroom

A local-first production newsroom app for Haven Media Group (HMG) — 7 brand verticals, full editorial workflow, social content factory, video editing studio, founder knowledge base, and operator readiness tracking. All data lives in the browser's localStorage. No fake AI claims. No live publish. Export/copy everything for manual publish.

## Run & Operate

- `pnpm --filter @workspace/hmg-newsroom run dev` — run the HMG Newsroom frontend (port via $PORT env var, proxied at the root path)
- `pnpm --filter @workspace/api-server run dev` — run the backend API server (port 5000)
- `pnpm --filter @workspace/hmg-newsroom run typecheck` — TypeScript check for the newsroom (must pass before any release)
- `pnpm --filter @workspace/hmg-newsroom run build` — production build to `artifacts/hmg-newsroom/dist/public/`
- `pnpm --filter @workspace/hmg-newsroom run test` — run Haven AI unit tests

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + Wouter (routing) + Tailwind CSS v4
- UI: Radix UI + shadcn/ui + Framer Motion + lucide-react
- State: localStorage (all persistence is local-first)
- API: Express 5 (api-server) at `/api/*`
- Validation: Zod v4

## Where things live

- `artifacts/hmg-newsroom/src/components/newsroom/` — all major view components (one file per panel)
- `artifacts/hmg-newsroom/src/lib/` — all shared hooks, utilities, and domain logic
- `artifacts/hmg-newsroom/src/lib/hmg/memory/` — Founder Knowledge Base / memory store
- `artifacts/hmg-newsroom/src/lib/hmg/haven-ai/` — Haven AI Engine logic (local, no model calls)
- `artifacts/hmg-newsroom/src/lib/hmg/webedit/` — WebEdit / CutMaster (Hook Finder, timeline)
- `artifacts/hmg-newsroom/src/components/newsroom/data/` — WP proof packages (manual publish drafts)
- `artifacts/hmg-newsroom/src/pages/Home.tsx` — root router; lazy-imports all views
- `artifacts/hmg-newsroom/src/components/newsroom/MenuOverlay.tsx` — View union type, MENU_ITEMS, MENU_SECTIONS

### Adding a new view
1. Create `artifacts/hmg-newsroom/src/components/newsroom/YourView.tsx`
2. Add `"yourview"` to the `View` union in `MenuOverlay.tsx`
3. Add an entry to `MENU_ITEMS` and `MENU_SECTIONS` in `MenuOverlay.tsx`
4. Add a `lazy(() => import("./YourView"))` in `Home.tsx`
5. Add a `case "yourview": return <YourView />` render case in `Home.tsx`

## Architecture decisions

- **Local-first only** — all data lives in localStorage. No cloud sync, no user accounts. Operators use export/import JSON to back up and move data.
- **No fake AI** — Haven AI Engine is a set of deterministic local algorithms. No model API calls happen in the frontend. Any future AI hooks are clearly labeled "pending" or "requires backend."
- **No live publish** — WordPress and social channel integrations are display-only or export-only. No REST publish buttons fire real posts. Manual copy/paste is the intended workflow until backend credentials are configured.
- **Storage key convention** — all localStorage keys follow `hmg-newsroom-<feature>-v<N>` (e.g. `hmg-newsroom-output-history-v2`). Increment the version suffix when the schema changes to avoid loading stale data.
- **View navigation** — all navigation uses the `onNavigate(view: View)` prop pattern, not browser history. The `View` union in `MenuOverlay.tsx` is the single source of truth for valid screen names.

## Product

HMG Newsroom is a 7-brand media production hub for solo operators and small editorial teams:

- **Command Center** — production signal dashboard, brand selector, readiness scores, job ledger
- **Haven AI Engine** — local intelligence system status, quick-nav to all panels, local brain health
- **Editorial Desk (ARTBOT)** — article drafting, SEO, gossip / source checking
- **Social Factory** — multi-platform caption and post assembly, Output History bridge
- **WebEdit / CutMaster** — video clip planning, hook finder, transcript timeline, caption export
- **WebArt / ArtBot** — image concept planner, brand frames, social sizing guide
- **Founder Knowledge Base** — memory store for founder voice, brand rules, WP rules, Max notes
- **Operator Readiness** — 9-role readiness checklist with lane/risk/backend details tab
- **Mobile App Readiness** — browser-signal PWA score (10 real checks, no fake approvals)
- **Backend Status** — live API route health with auto-refresh (30s/60s/2min intervals)
- **Output History** — searchable receipt log with JSON export
- **Recovery Center** — localStorage snapshots, backup reminder, dev handoff export
- **WP Connections** — WordPress credential management (local, never logged)
- **WP Diagnostics** — 6-site connection diagnostics via server-side API routes
- **Manual Publish Kit** — 6 brand-ready WordPress draft packages for copy-paste publish

## Operator #6 Production Power Pass — completed upgrades

- T1: HavenAIEngineView — 9-button Quick Nav section
- T2: CommandCenterView — fixed output-history-v2 storage key bug in HavenPowerGrid
- T3: MobileAppReadinessView — new panel, 10 browser signal checks, PWA score
- T4: OperatorReadinessView — Role Detail tab (9 roles × lanes/risks/backend/notes)
- T5: FounderKnowledgeBaseView — storage health already instrumented (estimateUsage)
- T6: OutputHistory — search filter now applies to WP Drafts tab (filteredWpDrafts)
- T7: SocialFactoryView — "From Output History" button bridges latest article output
- T8: CutMasterView — WebEdit already uses honest TruthChip labels; no fake claims
- T9: BackendStatusView — auto-refresh toggle (30s/60s/2min setInterval)
- T10: lib/perfUtils.ts — safe localStorage helpers, debounce, estimateLocalStorageUsage
- T11: fake-claim sweep — confirmed all views use honest status labels only
- T12: replit.md — this file updated
- T13: typecheck — passes clean (zero errors after creating data/wpProofPackages.ts + data/wpProofImages.ts)
- T14: workflow — HMG Newsroom workflow configured

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **pnpm install required** after fresh clone before typecheck/dev will work in `artifacts/hmg-newsroom/`
- **localStorage only** — clearing browser data wipes all operator work. Always export JSON before clearing storage.
- **WP data files** — `data/wpProofPackages.ts` and `data/wpProofImages.ts` must exist; ManualPublishPanel and WPDiagnosticsPanel both import from them.
- **Output history key** is `hmg-newsroom-output-history-v2` as a plain array (not `v1` wrapped in `{entries}`). Any component reading it must use the v2 key and parse as `unknown[]`.
- **View type** lives in `MenuOverlay.tsx`. All new views require 5 registration points (union, MENU_ITEMS, MENU_SECTIONS, lazy import, render case).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
