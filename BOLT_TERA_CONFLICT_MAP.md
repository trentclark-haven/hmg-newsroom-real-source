# BOLT TERA — CONFLICT MAP

## Files With Conflict Risk

### 1. EditorialBrain.tsx — MEDIUM RISK
**What changed**: Renamed 6 steps, added ReadinessRail component, updated labels.
**Conflict scenario**: If the full Replit source has modified the step labels, STEPS array, or step content sections.
**Resolution**: Keep this version's step names (Notes, Angle, Sources, Draft, Package, Publish) and ReadinessRail. If the full source added new props, add them.
**Merge strategy**: Manual — copy the ReadinessRail component, the STEPS rename, and the label updates. Do not blindly overwrite if the full source has significant additions.

### 2. SocialFactoryView.tsx — MEDIUM RISK (FULL REPLACEMENT)
**What changed**: Complete rewrite from 1311 lines to ~769 lines. Removed API calls, added local builder.
**Conflict scenario**: If the full source has modified the old SocialFactoryView.
**Resolution**: This version is a clean replacement. If the full source added new props, add them to the interface.
**Merge strategy**: Full file replacement is safe.

### 3. editorialPlaybooks.ts — LOW RISK
**What changed**: Added 5 new fields to interface and all 7 vertical objects.
**Conflict scenario**: If the full source has a different version of editorialPlaybooks.ts.
**Resolution**: This version is a superset of the previous. If the full source has additional fields, merge them.
**Merge strategy**: Full file replacement is safe.

### 4. index.ts — LOW RISK
**What changed**: Added one export line.
**Conflict scenario**: If the full source has a different index.ts.
**Resolution**: Add the `editorialStages.ts` export line.
**Merge strategy**: Manual — add the export line.

### 5. WordPressPublishView.tsx — NO RISK (NEW FILE)
**Conflict scenario**: None — new file.
**Merge strategy**: Copy as-is.

### 6. OutputHistoryView.tsx — NO RISK (NEW FILE)
**Conflict scenario**: None — new file. Note: this is a NEW full-page view, not a replacement for the existing OutputHistory.tsx sheet panel. Both can coexist.
**Merge strategy**: Copy as-is.

### 7. editorialStages.ts — NO RISK (NEW FILE)
**Conflict scenario**: None — new file.
**Merge strategy**: Copy as-is.

### 8. FounderVoiceGate.tsx — LOW RISK
**What changed**: No changes in this pass (from previous pass).
**Conflict scenario**: If the full source has a different version.
**Resolution**: Use the version from the previous Bolt Final Premium pass.
**Merge strategy**: Full file replacement is safe.

## Protected Files (NEVER overwrite)
- `src/components/newsroom/QuickLaunchView.tsx` — owned by ReplitFocusQuad
- `src/components/newsroom/MenuOverlay.tsx` — owned by ReplitFocusQuad
- `src/pages/Home.tsx` — owned by ReplitFocusQuad
- `src/components/newsroom/ArtBotView.tsx` — owned by Devin
- `src/components/newsroom/CutMasterView.tsx` — owned by Devin
- `package.json`, `tsconfig.json`, `vite.config.ts` — managed by full source
