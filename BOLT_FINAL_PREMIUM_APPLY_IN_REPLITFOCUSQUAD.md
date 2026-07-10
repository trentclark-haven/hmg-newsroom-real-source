# BOLT FINAL PREMIUM EDITORIAL — APPLY IN REPLITFOCUSQUAD

## Overview
This package upgrades HMG Newsroom's Quick Launch, Editorial Desk, Founder Voice Gate, and editorial intelligence to flagship quality. It is designed for fast application in the full Replit source tree.

## Files to Apply

### 1. NEW FILE: `src/lib/hmg/editorial/editorialPlaybooks.ts`
- **Action**: Create new file at this exact path
- **Contents**: Full editorial playbook system with 7 verticals, 11 angle types, source discipline microcopy
- **Imports needed**: None external — this is a self-contained data/utility module
- **Conflict risk**: None (new file)

### 2. MODIFY: `src/components/hmg/editorial/EditorialBrain.tsx`
- **Action**: Add import line + replace EDITORIAL_DNA panel with HmgStandardPanel
- **Import to add** (after existing imports):
  ```typescript
  import { getPlaybook, getAngleGuidance, type AngleType } from "@/lib/hmg/editorial/editorialPlaybooks";
  ```
  Also add to the existing lucide-react import:
  `ChevronDown, BookOpen, AlertOctagon, FileSearch, Hash, Palette, Scissors, Globe as GlobeIcon, Eye`
- **Replace**: The `{/* Editorial DNA panel */}` block with `<HmgStandardPanel ... />`
- **Add**: The `HmgStandardPanel` function component before `export function EditorialBrain`
- **Conflict risk**: Medium — if full source has a different panel, keep HmgStandardPanel

### 3. REPLACE: `src/components/hmg/editorial/FounderVoiceGate.tsx`
- **Action**: Full file replacement
- **Props interface**: `brandColor`, `onAccent`, `siloName`, `storageKey`, `onPass`, `passed`, `qualityScore`
- **New exports**: `gateStatus()`, `GateStatus` type
- **Conflict risk**: Low — full rewrite with backward-compatible props

### 4. REPLACE: `src/components/newsroom/QuickLaunchView.tsx`
- **Action**: Full file replacement
- **Props interface**: `onSelectView: (view: View) => void`, `onOpenEditorial: (verticalId: string) => void`
- **Dependencies**: `@/lib/mock-data` (verticals), `@/lib/useOutputHistory`, `@/lib/useWPSettings`, `./MenuOverlay` (View type), `framer-motion`
- **Conflict risk**: Low — full rewrite with same props

## Files NOT to Copy
- `src/components/ui/*` — shadcn components, managed by full source
- `src/lib/mock-data.ts` — only imported, not modified
- `src/lib/useOutputHistory.ts` — only imported, not modified
- `src/lib/useWPSettings.ts` — only imported, not modified
- `src/components/newsroom/MenuOverlay.tsx` — only imported for View type
- `package.json`, `tsconfig.json`, `vite.config.ts`

## Verification Commands
```bash
# Typecheck (expect pre-existing thin-branch errors only)
npx tsc --noEmit --project artifacts/hmg-newsroom/tsconfig.json

# Build
npm run build

# Verify no forbidden strings in touched files
grep -rn "CutMaster\|ArtBot\|provider\|endpoint\|packet\|engine\|fallback\|API diagnostics\|backend status\|fake connector\|local-only" \
  src/lib/hmg/editorial/editorialPlaybooks.ts \
  src/components/hmg/editorial/EditorialBrain.tsx \
  src/components/hmg/editorial/FounderVoiceGate.tsx \
  src/components/newsroom/QuickLaunchView.tsx
# Expected: no matches in public-facing strings
```

## Rollback Notes
- Delete `editorialPlaybooks.ts`
- Restore `EditorialBrain.tsx` from git: `git checkout -- src/components/hmg/editorial/EditorialBrain.tsx`
- Restore `FounderVoiceGate.tsx`: `git checkout -- src/components/hmg/editorial/FounderVoiceGate.tsx`
- Restore `QuickLaunchView.tsx`: `git checkout -- src/components/newsroom/QuickLaunchView.tsx`

## 10-Minute Apply Checklist
1. [ ] Copy `editorialPlaybooks.ts` to `src/lib/hmg/editorial/`
2. [ ] Add import line to `EditorialBrain.tsx`
3. [ ] Add new lucide icons to existing import in `EditorialBrain.tsx`
4. [ ] Replace EDITORIAL_DNA panel block with `<HmgStandardPanel />` in `EditorialBrain.tsx`
5. [ ] Add `HmgStandardPanel` function before `export function EditorialBrain`
6. [ ] Replace `FounderVoiceGate.tsx` entirely
7. [ ] Replace `QuickLaunchView.tsx` entirely
8. [ ] Run `npx tsc --noEmit` — confirm no NEW errors (pre-existing thin-branch errors are expected)
9. [ ] Run `npm run build` — confirm no NEW errors
10. [ ] Run forbidden string sweep — confirm clean
