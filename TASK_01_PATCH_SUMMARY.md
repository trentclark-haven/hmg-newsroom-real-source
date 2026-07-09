# Task 01 — Quick Launch Home (Patch Summary)

## Files Changed

1. **`src/components/newsroom/MenuOverlay.tsx`**
   - Added `"quicklaunch"` to the `View` union type.
   - Added `MENU_ITEMS` entry (label: "Quick Launch", icon: `Zap`, color: `#38BDF8`).
   - Imported `Zap` from lucide-react.

2. **`src/components/newsroom/QuickLaunchView.tsx`** (new)
   - Urgency-first home screen: brand selector strip + 2 primary tiles (Breaking News, Article Draft) + 4 secondary tiles (WebArt, WebEdit, Social Pack, WordPress Draft) + Resume Last Draft bar.
   - Uses `useOutputHistory()` to surface the most recent draft and route to the correct desk via `KIND_TO_VIEW` mapping.

3. **`src/pages/Home.tsx`**
   - Changed cold-open default from `"commandcenter"` to `"quicklaunch"`.
   - Added localStorage restore/persist via `HMG_LAST_VIEW_KEY` (`hmg-last-view-v1`).
   - Added `openEditorial(verticalId)` handler — sets active brand tab + navigates to newsroom.
   - Lazy-imported `QuickLaunchView` and added it to the Suspense render block.

## New Component Created

- `QuickLaunchView.tsx` — the new default landing screen.

## Default Route Behavior

1. URL `?view=` param (if valid) wins.
2. Saved last view in `localStorage` key `hmg-last-view-v1` is restored.
3. Cold open (no param, no saved state) renders `QuickLaunchView`.
4. Every `setView()` call persists to localStorage.

## Stubs Created (Bolt-only temporary scaffolding)

These stubs were created solely to unblock `pnpm install` / `tsc --build` in the Bolt environment. They are NOT part of Task 01's feature work and should be discarded when copying patches back to the full Replit source:

- `lib/api-client-react/` — minimal stub package with type exports (`Silo`, `PublishStatus`, `useGetWordpressStatus`, etc.)
- `lib/db/` — empty stub project (composite tsconfig + empty `index.ts`)
- `lib/api-zod/` — empty stub project (composite tsconfig + empty `index.ts`)

**Do not copy these stub directories back to Replit.** The full Replit workspace has the real implementations of these packages.

## Build Status

`npm run build` was run. It fails due to 108 pre-existing missing source files in the thin branch. Task 01's changes introduce zero new errors. Do not claim production build success from this thin branch.
