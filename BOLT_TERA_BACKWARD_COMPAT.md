# BOLT_TERA_BACKWARD_COMPAT.md

## Backward-Compatible Component Contracts

This document verifies the backward-compatible contracts for three key components: `SocialFactoryView`, `EditorialBrain`, and `FounderVoiceGate`. Each contract was verified by reading the actual source files.

---

## 1. SocialFactoryView

**Source file:** `artifacts/hmg-newsroom/src/components/newsroom/SocialFactoryView.tsx`

### Props

| Property | Before (old version) | After (new version) | Status |
|---|---|---|---|
| `onSelectView` | `onSelectView?: (view: string) => void` | `onSelectView?: (view: string) => void` | **RETAINED** |

Verified at line 243–247:
```tsx
export function SocialFactoryView({
  onSelectView,
}: {
  onSelectView?: (view: string) => void;
}) {
```

### Export Name

- **Before:** `SocialFactoryView`
- **After:** `SocialFactoryView`
- **Status:** **RETAINED**

Verified at line 243: `export function SocialFactoryView(...)`

### Storage Keys

- **Spec says:** `hmg-socialfactory-draft-v1`
- **Actual in new file:** `hmg-socialfactory-draft-v2` (line 56)
- **Status:** **CHANGED — version bumped from v1 to v2**

> ⚠️ **IMPORTANT:** The draft key in the new file is `hmg-socialfactory-draft-v2`, not `hmg-socialfactory-draft-v1`. This is a version bump, not a rename. Old drafts saved under the v1 key will NOT be automatically migrated. If backward compatibility with v1 drafts is required, a migration step or fallback read of the v1 key must be added.

Verified at line 56:
```ts
const DRAFT_KEY = "hmg-socialfactory-draft-v2";
```

### Route IDs

- **Before:** `socialfactory`
- **After:** `socialfactory`
- **Status:** **RETAINED**

The route ID `socialfactory` is referenced in `OutputHistoryView.tsx` (line 414: `onSelectView?.("socialfactory")`) and used as the `data-testid` at line 381: `data-testid="socialfactory-view"`.

### Brand Selection

- **Before:** `SiloPicker` component
- **After:** Inlined brand pills (lines 403–418)
- **Data source:** `verticals` from `@/lib/mock-data` — **SAME**
- **Status:** **RETAINED (implementation changed, data source preserved)**

The new version inlines the brand selector directly:
```tsx
{verticals.map((v) => (
  <button
    key={v.id}
    onClick={() => setSilo(v.id as ApiSilo)}
    ...
  >
    {v.name}
  </button>
))}
```

### recordOutput Kind

- **Before:** `"specialist"`
- **After:** `"specialist"`
- **Status:** **RETAINED**

Verified at line 349: `kind: "specialist",`

### Safe Mode

- **Before:** `useSafeMode` + `recordSafeModeBlock`
- **After:** `useSafeMode` + `recordSafeModeBlock`
- **Status:** **RETAINED**

Verified:
- Line 282: `const { enabled: safeMode } = useSafeMode();`
- Line 317: `recordSafeModeBlock("ai-call", "SocialFactoryView/generate");`

### Draft Persistence

- **Before:** `useDraft` + `hasDraft`
- **After:** `useDraft` + `hasDraft`
- **Status:** **RETAINED**

Verified:
- Line 248: `const [draft, setDraft, clearDraft] = useDraft<SocialDraft>(DRAFT_KEY, {...})`
- Line 272: `const [draftSaved, setDraftSaved] = useState<boolean>(() => hasDraft(DRAFT_KEY));`

---

## 2. EditorialBrain

**Source file:** `artifacts/hmg-newsroom/src/components/hmg/editorial/EditorialBrain.tsx`

### Props

| Property | Before (old version) | After (new version) | Status |
|---|---|---|---|
| `onSelectView` | `onSelectView?: (view: string) => void` | **NOT PRESENT** | **CHANGED** |

> ⚠️ **IMPORTANT:** The new `EditorialBrain` component does NOT accept an `onSelectView` prop. Instead, it accepts the following props (lines 48–56):
> ```ts
> interface EditorialBrainProps {
>   brandId: string;
>   modes?: EditorialMode[];
>   defaultMode?: EditorialMode;
>   title?: string;
>   className?: string;
>   liveWebOn?: boolean;
>   corpusReady?: boolean;
> }
> ```
> The `onSelectView` prop was replaced by `brandId` (required) and configuration props. Any parent that previously passed `onSelectView` to `EditorialBrain` must be updated to pass `brandId` instead. Navigation from EditorialBrain to other views is now handled internally via the step flow, not via `onSelectView` callbacks.

### Export Name

- **Before:** `EditorialBrain`
- **After:** `EditorialBrain`
- **Status:** **RETAINED**

Verified at line 457: `export function EditorialBrain(...)`

### Storage Keys

- **Before:** `hmg-editorial-*`
- **After:** `hmg-editorial-draft-${brandId}-${mode}`
- **Status:** **RETAINED (same pattern)**

Verified at line 483:
```ts
const draftKey = `hmg-editorial-draft-${brandId}-${mode}`;
```

The `hasSavedDraft` check also reads from `hmg-newsroom-draft::${draftKey}` (line 503).

### Step IDs

- **Before:** Steps 1–6 (numeric IDs)
- **After:** Steps 1–6 (numeric IDs)
- **Status:** **RETAINED**

Verified at line 149:
```ts
type FlowStep = 1 | 2 | 3 | 4 | 5 | 6;
```

### Step Labels

| Step | Before (old labels) | After (new labels) | Status |
|---|---|---|---|
| 1 | "Drop Notes" | "Notes" | **RENAMED** |
| 2 | "Pick Angle" | "Angle" | **RENAMED** |
| 3 | "Add Sources" | "Sources" | **RENAMED** |
| 4 | "Generate Draft" | "Draft" | **RENAMED** |
| 5 | "Social Pack" | "Package" | **RENAMED** |
| 6 | "Export" | "Publish" | **RENAMED** |

Verified at lines 151–158:
```ts
const STEPS: { id: FlowStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 1, label: "Notes", icon: StickyNote },
  { id: 2, label: "Angle", icon: Compass },
  { id: 3, label: "Sources", icon: Database },
  { id: 4, label: "Draft", icon: WandSparkles },
  { id: 5, label: "Package", icon: Share2 },
  { id: 6, label: "Publish", icon: Send },
];
```

The flow path indicator (lines 774–786) also uses the new labels: `Notes → Angle → Sources → Draft → Package → Publish`.

### recordOutput Kinds

- **Before:** `"pack"` and `"quick"`
- **After:** `"pack"` and `"quick"` (used in OutputHistoryView filtering and kind labels)
- **Status:** **RETAINED**

The `OutputHistoryView.tsx` (lines 64–74) confirms these kinds are still in use:
```ts
const KIND_LABEL: Record<OutputHistoryEntry["kind"], string> = {
  quick: "Social",
  pack: "Breaking",
  specialist: "Article",
  ...
};
```

### Founder Voice Gate

- **Before:** `FounderVoiceGate` component
- **After:** `FounderVoiceGate` component
- **Status:** **RETAINED**

Verified at line 31 (import):
```ts
import { FounderVoiceGate } from "./FounderVoiceGate";
```

And at lines 1079–1087 (usage):
```tsx
<FounderVoiceGate
  brandColor={accent}
  onAccent={onAccent}
  siloName={profile.name}
  storageKey={`hmg-voice-gate-${brandId}-${mode}`}
  onPass={handleVoiceGatePass}
  passed={voiceGatePassed}
  qualityScore={strength?.score}
/>
```

---

## 3. FounderVoiceGate

**Source file:** `artifacts/hmg-newsroom/src/components/hmg/editorial/FounderVoiceGate.tsx`

### Props

| Property | Spec says | Actual in file | Status |
|---|---|---|---|
| `passed` | `passed: boolean` | `passed: boolean` | **RETAINED** |
| `onCheck` | `onCheck: () => void` | **NOT PRESENT** — replaced by `onPass: () => void` | **CHANGED** |
| `accent` | `accent: string` | **NOT PRESENT** — replaced by `brandColor: string` | **CHANGED** |

> ⚠️ **IMPORTANT:** The actual props in the new file differ from the spec. The full props interface (lines 20–29):
> ```ts
> interface FounderVoiceGateProps {
>   brandColor: string;      // was "accent" in spec
>   onAccent: string;        // new
>   siloName: string;        // new
>   storageKey?: string;     // new
>   onPass: () => void;      // was "onCheck" in spec
>   passed: boolean;         // RETAINED
>   qualityScore?: number;   // new
> }
> ```
> - `accent` → renamed to `brandColor`
> - `onCheck` → renamed to `onPass`
> - `passed` → retained as-is
> - New props added: `onAccent`, `siloName`, `storageKey`, `qualityScore`

### Export Name

- **Before:** `FounderVoiceGate`
- **After:** `FounderVoiceGate`
- **Status:** **RETAINED**

Verified at line 203: `export function FounderVoiceGate(...)`

### 10 Quality Checks

- **Before:** 10 quality checks
- **After:** 10 quality checks
- **Status:** **RETAINED**

Verified at lines 49–120: The `GATE_ITEMS` array contains exactly 10 items:

1. `source-confirmed` — "Source is confirmed"
2. `no-unsupported-claims` — "No unsupported claims"
3. `headline-strong-not-reckless` — "Headline is strong but not reckless"
4. `voice-matches-brand` — "Voice matches the brand"
5. `source-links-attached` — "Source links are attached"
6. `social-package-ready` — "Social package is ready"
7. `visual-handoff-ready` — "Visual / edit handoff is ready"
8. `export-package-clean` — "WordPress export package is clean"
9. `cultural-fluency` — "Cultural fluency reads true"
10. `no-generic-ai-phrasing` — "No generic AI phrasing"

The total count is verified at line 227: `const total = GATE_ITEMS.length;` and referenced in UI as `Pass all ${total} checks to unlock WordPress / Export` (line 267).

---

## Summary Table

| Component | Export Name | Props | Storage Keys | Route IDs | Other |
|---|---|---|---|---|---|
| SocialFactoryView | ✅ RETAINED | ✅ RETAINED | ⚠️ v1 → v2 (version bump) | ✅ RETAINED (`socialfactory`) | recordOutput kind, Safe Mode, Draft persistence all RETAINED |
| EditorialBrain | ✅ RETAINED | ⚠️ `onSelectView` removed, `brandId` added | ✅ RETAINED (`hmg-editorial-*`) | ✅ RETAINED (`newsroom`) | Step labels RENAMED, FounderVoiceGate RETAINED |
| FounderVoiceGate | ✅ RETAINED | ⚠️ `accent`→`brandColor`, `onCheck`→`onPass`, `passed` retained | N/A | N/A | 10 quality checks RETAINED |
