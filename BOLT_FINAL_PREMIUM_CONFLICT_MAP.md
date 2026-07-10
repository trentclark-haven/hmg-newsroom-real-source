# BOLT FINAL PREMIUM — CONFLICT MAP

## Files With Conflict Risk

### 1. EditorialBrain.tsx — MEDIUM RISK
**What changed**: Added import of `editorialPlaybooks`, added `HmgStandardPanel` component, replaced the `{/* Editorial DNA panel */}` div with `<HmgStandardPanel />`.

**Conflict scenario**: If the full Replit source has modified the EDITORIAL_DNA panel or added new props to EditorialBrain since the Bolt thin branch was cut.

**Resolution**: Keep the HmgStandardPanel version. It subsumes all EDITORIAL_DNA functionality. If the full source added new props, add them to the HmgStandardPanel props interface.

**Merge strategy**: Manual — copy the import line, the HmgStandardPanel function, and the panel replacement. Do not blindly overwrite if the full source has significant additions elsewhere in the file.

### 2. FounderVoiceGate.tsx — LOW RISK
**What changed**: Full rewrite from 3-check to 10-check gate.

**Conflict scenario**: If the full source has modified the props interface or added new behavior.

**Resolution**: This version is backward-compatible with the original props (`brandColor`, `onAccent`, `siloName`, `storageKey`, `onPass`, `passed`). Added optional `qualityScore` prop. If the full source added new required props, add them here.

**Merge strategy**: Full file replacement is safe. If the full source has a different props interface, reconcile manually.

### 3. QuickLaunchView.tsx — LOW RISK
**What changed**: Full rewrite with executive command energy layout.

**Conflict scenario**: If the full source has modified the props interface or added new tiles/views.

**Resolution**: This version uses the same props (`onSelectView`, `onOpenEditorial`). If the full source added new props, add them here.

**Merge strategy**: Full file replacement is safe. If the full source has a different props interface, reconcile manually.

### 4. editorialPlaybooks.ts — NO RISK
**What changed**: New file.

**Conflict scenario**: None — the file does not exist in the current source tree.

**Merge strategy**: Copy as-is. No merge needed.

## Import Path Conflicts
All imports use the `@/` alias which is standard in the HMG Newsroom project. No path conflicts expected.

| Import | Expected Path | Risk |
|--------|--------------|------|
| `@/lib/hmg/editorial/editorialPlaybooks` | `src/lib/hmg/editorial/editorialPlaybooks.ts` | NONE (new file) |
| `@/lib/mock-data` | `src/lib/mock-data.ts` | EXISTING (not modified) |
| `@/lib/useOutputHistory` | `src/lib/useOutputHistory.ts` | EXISTING (not modified) |
| `@/lib/useWPSettings` | `src/lib/useWPSettings.ts` | EXISTING (not modified) |
| `./MenuOverlay` | `src/components/newsroom/MenuOverlay.tsx` | EXISTING (not modified) |
| `framer-motion` | npm dependency | EXISTING (not modified) |
| `lucide-react` | npm dependency | EXISTING (not modified) |

## Props Interface Compatibility

| Component | Old Props | New Props | Breaking? |
|-----------|----------|-----------|-----------|
| EditorialBrain | brandId, modes, defaultMode, title, className, liveWebOn, corpusReady | SAME | NO |
| FounderVoiceGate | brandColor, onAccent, siloName, storageKey, onPass, passed | SAME + optional qualityScore | NO |
| QuickLaunchView | onSelectView, onOpenEditorial | SAME | NO |
