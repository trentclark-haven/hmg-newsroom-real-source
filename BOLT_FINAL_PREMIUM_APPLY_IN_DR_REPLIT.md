# BOLT FINAL PREMIUM EDITORIAL — APPLY IN DR. REPLIT

## Quick Apply (5 minutes)

### Step 1: Create the new file
```
src/lib/hmg/editorial/editorialPlaybooks.ts
```
Copy the entire file from the package. No dependencies needed — it is self-contained.

### Step 2: Patch EditorialBrain.tsx
Open `src/components/hmg/editorial/EditorialBrain.tsx`.

Add this import after existing imports:
```typescript
import { getPlaybook, getAngleGuidance, type AngleType } from "@/lib/hmg/editorial/editorialPlaybooks";
```

Add these icons to the existing `lucide-react` import:
```
ChevronDown, BookOpen, AlertOctagon, FileSearch, Hash, Palette, Scissors, Globe as GlobeIcon, Eye
```

Find the `{/* Editorial DNA panel */}` comment block and replace the entire `<div>` with:
```tsx
<HmgStandardPanel
  brandId={brandId}
  brandName={brand?.name ?? "HMG"}
  accent={accent}
  mode={mode}
  articleType={articleType}
  strength={strength}
  hasOutput={hasOutput}
  voiceGatePassed={voiceGatePassed}
/>
```

Add the `HmgStandardPanel` function component right before `export function EditorialBrain`.

### Step 3: Replace FounderVoiceGate.tsx
Full file replacement. Same props, backward compatible.

### Step 4: Replace QuickLaunchView.tsx
Full file replacement. Same props, backward compatible.

### Step 5: Verify
```bash
npx tsc --noEmit
```
Expect: pre-existing errors only (missing modules from thin branch). No NEW errors from these 4 files.

## What NOT to Apply
- Do not copy any `src/components/ui/*` files
- Do not copy `package.json`, `tsconfig.json`, or `vite.config.ts`
- Do not copy any file not listed in Steps 1-4

## Rollback
```bash
git checkout -- src/components/hmg/editorial/EditorialBrain.tsx
git checkout -- src/components/hmg/editorial/FounderVoiceGate.tsx
git checkout -- src/components/newsroom/QuickLaunchView.tsx
rm src/lib/hmg/editorial/editorialPlaybooks.ts
```
