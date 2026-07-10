# How To Apply This Patch in Dr. Replit / ReplitFocusQuad

## Prerequisites

1. The full Replit source tree must be present (not the Bolt thin branch)
2. `pnpm` must be available
3. No uncommitted changes to the files listed below

## Files To Copy

Copy these files from the Bolt patch into the corresponding paths in the Replit source:

```
src/components/newsroom/QuickLaunchView.tsx     → overwrite
src/components/hmg/editorial/EditorialBrain.tsx → overwrite
src/components/hmg/editorial/FounderVoiceGate.tsx → new file
src/components/hmg/editorial/index.ts           → overwrite (or add the FounderVoiceGate export line)
src/components/newsroom/MenuOverlay.tsx         → overwrite
src/pages/Home.tsx                               → overwrite
```

## Steps

1. **Backup current files** (optional but recommended):
   ```bash
   git stash push -- src/components/newsroom/QuickLaunchView.tsx \
     src/components/hmg/editorial/EditorialBrain.tsx \
     src/components/newsroom/MenuOverlay.tsx \
     src/pages/Home.tsx
   ```

2. **Copy patch files** into the Replit source tree at the paths above.

3. **If `src/components/hmg/editorial/index.ts` already exists**, just add this line:
   ```ts
   export * from "./FounderVoiceGate";
   ```

4. **Verify imports**: The following imports must resolve in the full Replit source:
   - `@/lib/useDraft` — should already exist
   - `@/lib/mock-data` — should already exist
   - `@/lib/hmg/brandVoiceProfiles` — should already exist
   - `@/lib/hmg/intelligence` — should already exist
   - `@/components/hmg/CopyButton` — should already exist
   - `@/components/ui/button` — should already exist

5. **Run typecheck**:
   ```bash
   pnpm run typecheck
   ```

6. **Run dev server** and verify:
   - Quick Launch shows status badges on tiles
   - Editorial Desk shows save/recover draft bar
   - Editorial Desk shows flow indicator (Notes → Angle → Sources → Draft → Social → Export)
   - Menu descriptions are in plain English
   - Stats button is hidden on Quick Launch view

7. **Commit**:
   ```bash
   git add -A
   git commit -m "Bolt UI + Editorial reinforcement: QuickLaunch status badges, Editorial Desk save/recover draft, flow indicator, FounderVoiceGate, app-wide copy cleanup"
   ```

## Rollback

If anything breaks:
```bash
git stash pop
```
or
```bash
git checkout -- src/components/newsroom/QuickLaunchView.tsx \
  src/components/hmg/editorial/EditorialBrain.tsx \
  src/components/newsroom/MenuOverlay.tsx \
  src/pages/Home.tsx
```

And remove `src/components/hmg/editorial/FounderVoiceGate.tsx` and its export line from `index.ts`.
