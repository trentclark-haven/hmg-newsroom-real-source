# BOLT_TERA_SOCIAL_FACTORY_COMPATIBILITY.md

## Old vs. New SocialFactoryView Comparison

This document compares the old and new `SocialFactoryView` component, documenting preserved behaviors, removed features, and remaining limitations.

**Source file:** `artifacts/hmg-newsroom/src/components/newsroom/SocialFactoryView.tsx`

---

## Preserved Behaviors

### ✅ Article Source Intake

- **Status:** PRESERVED
- **Implementation:** Via source tray "Article" button
- **Verified:** Lines 64–70 define the `"article"` source type with label "Article" and placeholder text: "Paste the article headline, dek, summary, angle, and source notes from Editorial Desk..."
- **Test ID:** `socialfactory-source-article` (line 444)

### ✅ Visual Source Intake

- **Status:** PRESERVED
- **Implementation:** Via source tray "WebArt" button
- **Verified:** Lines 71–77 define the `"webart"` source type with label "WebArt" and placeholder text: "Paste the visual layout, headline overlay, asset credit, and alt-text notes from WebArt..."
- **Test ID:** `socialfactory-source-webart` (line 444)

### ✅ Clip Source Intake

- **Status:** PRESERVED
- **Implementation:** Via source tray "WebEdit" button
- **Verified:** Lines 78–84 define the `"webedit"` source type with label "WebEdit" and placeholder text: "Paste the hook, cut list, caption angle, thumbnail brief, and receipt notes from WebEdit..."
- **Test ID:** `socialfactory-source-webedit` (line 444)

### ✅ Output History Intake

- **Status:** PRESERVED
- **Implementation:** Via source tray "Output History" button
- **Verified:** Lines 85–92 define the `"history"` source type with label "Output History" and placeholder text: "Paste a prior Output History entry (article, WP draft, or clip package) to remix into a social pack..."
- **Test ID:** `socialfactory-source-history` (line 444)
- **Additional feature:** "Load latest" button (lines 483–489) calls `loadLatestOutputHistoryContent()` which reads from `localStorage` key `hmg-newsroom-output-history-v2` (line 219).

### ⚠️ Founder Voice Behavior

- **Status:** NOT PRESERVED — **LIMITATION**
- **Old version:** Had a `FounderVoiceCheck` import (per spec).
- **New version:** No `FounderVoiceCheck` or `FounderVoiceGate` import found in `SocialFactoryView.tsx`.
- **Impact:** The new `SocialFactoryView` does not include a Founder Voice quality gate before saving to output history. Social packs are saved directly via `recordOutput` without a voice-quality check.
- **See:** "Remaining Limitations" section below.

### ✅ Brand Selection

- **Status:** PRESERVED
- **Implementation:** Uses `verticals` from `@/lib/mock-data`, now inlined as brand pills instead of using `SiloPicker`
- **Verified:**
  - Line 3: `import { verticals } from "@/lib/mock-data";`
  - Lines 403–418: Inlined brand pills mapping over `verticals`
- **Data source:** Same `verticals` array — the underlying data is unchanged.
- **Note:** The `SiloPicker` component is no longer used; brand selection is inlined directly in the component. The `ApiSilo` type is imported from `@workspace/api-client-react` (line 4).

### ✅ Draft Persistence

- **Status:** PRESERVED
- **Implementation:** Uses `useDraft` with the same key pattern
- **Verified:**
  - Line 7: `import { hasDraft, useDraft } from "@/lib/useDraft";`
  - Line 56: `const DRAFT_KEY = "hmg-socialfactory-draft-v2";`
  - Line 248: `const [draft, setDraft, clearDraft] = useDraft<SocialDraft>(DRAFT_KEY, {...})`
  - Line 272: `const [draftSaved, setDraftSaved] = useState<boolean>(() => hasDraft(DRAFT_KEY));`
- **Note:** The draft key version was bumped from `v1` to `v2`. The `useDraft` and `hasDraft` hooks are the same, but the key changed. See "Storage Key Change" below.

### ✅ Save-to-Output

- **Status:** PRESERVED
- **Implementation:** Uses `recordOutput` with kind `"specialist"`
- **Verified:**
  - Line 6: `import { recordOutput } from "@/lib/useOutputHistory";`
  - Lines 346–362: `handleSaveToHistory()` calls `recordOutput({ silo, siloName, kind: "specialist", prompt, output })`
- **Kind:** `"specialist"` — same as old version.

### ✅ Safe Mode

- **Status:** PRESERVED
- **Implementation:** Uses `useSafeMode` + `recordSafeModeBlock`
- **Verified:**
  - Line 8: `import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";`
  - Line 282: `const { enabled: safeMode } = useSafeMode();`
  - Line 317: `recordSafeModeBlock("ai-call", "SocialFactoryView/generate");`
  - Lines 588–595: Safe Mode banner displayed when `safeMode` is true.
  - Line 312: `isDisabled` includes `safeMode` check.

---

## Not Preserved

### ❌ Old API Call to `/api/social-factory/pack`

- **Status:** NOT PRESERVED — **INTENTIONAL**
- **Old behavior:** The old version made a fetch call to `/api/social-factory/pack` to generate social campaign packs.
- **New behavior:** Replaced with `buildLocalSocialPack()` — a local deterministic builder function (lines 149–205).
- **Rationale:** This is intentional. No fake API calls are made. The local builder generates deterministic content from the source material, prompt, tone, and CTA without any network request.
- **Implementation:** Lines 325–337 use `setTimeout` with a 250ms delay to simulate async behavior, then call `buildLocalSocialPack()` synchronously.
- **Comment in code:** Line 324: `// Deterministic local builder — no API calls.`

### ❌ Old `JetFirePanel` Integration

- **Status:** NOT PRESERVED
- **Old behavior:** `JetFirePanel` was part of the old import chain.
- **New behavior:** No `JetFirePanel` import or usage found in the new file.
- **Impact:** Any functionality provided by `JetFirePanel` (presumably a streaming/real-time panel) is not available in the new `SocialFactoryView`.

### ❌ Old `NextActionBar`

- **Status:** NOT PRESERVED
- **Old behavior:** `NextActionBar` component was used in the old version.
- **New behavior:** No `NextActionBar` import or usage found in the new file.
- **Impact:** The action bar is replaced by inline buttons within the component (Generate, Save to Output History, Copy all platforms, Clear draft).

### ❌ Old `buildSocialCampaignIntelligence` from `@/lib/hmg/intelligence`

- **Status:** NOT PRESERVED
- **Old behavior:** `buildSocialCampaignIntelligence` was imported from `@/lib/hmg/intelligence` and used to generate campaign intelligence.
- **New behavior:** No import of `buildSocialCampaignIntelligence` found. The new file does not import anything from `@/lib/hmg/intelligence`.
- **Impact:** Campaign intelligence scoring/analysis is not available in the new `SocialFactoryView`. The local builder produces content directly without quality scoring.

---

## Storage Key Change

| Property | Old | New | Impact |
|---|---|---|---|
| Draft key | `hmg-socialfactory-draft-v1` | `hmg-socialfactory-draft-v2` | Old v1 drafts will NOT be loaded by the new version. Users will lose in-progress drafts unless a migration is added. |

---

## Remaining Limitations

1. **Deterministic content, not AI-enhanced:** The local builder (`buildLocalSocialPack`) generates deterministic content using string templates and the `toneFlair()` function. It does not produce AI-enhanced or contextually adaptive content. The output is functional but formulaic — captions follow a fixed pattern: `${topic}\n\n${flair}\n\n${prompt}`.

2. **No Founder Voice gate:** Unlike `EditorialBrain` which integrates `FounderVoiceGate`, the new `SocialFactoryView` has no quality gate before saving to output history. Social packs are saved directly without a voice-quality check.

3. **No campaign intelligence:** The `buildSocialCampaignIntelligence` function from `@/lib/hmg/intelligence` is not used. There is no quality scoring, brand-fit analysis, or recommended next actions for social packs.

4. **No API endpoint:** When the full source has the API endpoint (`/api/social-factory/pack`), the old fetch logic can be restored. The local builder is a placeholder that produces deterministic output. The restoration point would be in the `handleGenerate()` function (lines 314–338), replacing the `setTimeout` + `buildLocalSocialPack` call with a `fetch` call.

5. **No `JetFirePanel` streaming:** Real-time streaming of generated content is not available. The generation is synchronous (wrapped in a 250ms `setTimeout` for UX purposes only).

6. **Draft key version mismatch:** The draft key was bumped from `v1` to `v2` without a migration path. Existing user drafts saved under `v1` will be orphaned.
