# How To Apply This Patch in Dr. Replit

## Prerequisites

1. Full Replit source tree present (not the Bolt thin branch)
2. `pnpm` available
3. No uncommitted changes to the files below

## Files To Copy (5 files)

```
src/components/newsroom/QuickLaunchView.tsx       → overwrite
src/components/hmg/editorial/EditorialBrain.tsx   → overwrite
src/components/hmg/editorial/FounderVoiceGate.tsx  → overwrite (already exists from Task 02)
src/components/newsroom/MenuOverlay.tsx            → overwrite
src/pages/Home.tsx                                 → overwrite
```

## Files NOT To Copy

```
lib/api-client-react/    → Bolt-only stub, ignore
lib/db/                  → Bolt-only stub, ignore
lib/api-zod/             → Bolt-only stub, ignore
src/components/newsroom/FounderVoiceCheck.tsx  → NOT modified, leave as-is
package.json             → preinstall guard restored, do not copy
```

## Steps

1. **Backup current files**:
   ```bash
   git stash push -- src/components/newsroom/QuickLaunchView.tsx \
     src/components/hmg/editorial/EditorialBrain.tsx \
     src/components/hmg/editorial/FounderVoiceGate.tsx \
     src/components/newsroom/MenuOverlay.tsx \
     src/pages/Home.tsx
   ```

2. **Copy patch files** into the Replit source tree.

3. **Verify imports resolve** (all should exist in full Replit source):
   - `@/lib/useDraft` — must exist
   - `@/lib/mock-data` — must exist (exports `verticals`)
   - `@/lib/hmg/brandVoiceProfiles` — must exist (exports `getBrandVoiceProfile`)
   - `@/lib/hmg/intelligence` — must exist (exports `chooseBlueprint`, `formatArticleQualityReceipt`, `formatBrandVoicePacket`, `formatFounderVoicePacket`, `generateSeoPacket`, `getBrandVoiceProfile`, `scoreArticleDraft`, `BrandVoiceProfile`, `QualityScoreResult`, `SeoPacket`)
   - `@/components/hmg/CopyButton` — must exist
   - `@/components/ui/button` — must exist
   - `@/lib/safeMode` — must exist
   - `@/lib/role` — must exist

4. **Run typecheck**:
   ```bash
   pnpm run typecheck
   ```

5. **Verify in browser** (under 10 minutes):
   - Quick Launch shows "What are we shipping right now?" hero
   - Quick Launch shows Fast Lane strip (Notes → Draft → Visual → Clip → Social → WordPress)
   - Quick Launch tiles show status badges and helper text
   - Editorial Desk shows Editorial DNA panel with brand-specific guidance
   - Editorial Desk Step 3 shows Source Discipline fields
   - Editorial Desk Step 4 shows Quality Meter
   - Editorial Desk Step 6 shows handoff destinations and "Founder Review Needed" state
   - FounderVoiceGate shows 8 checks with expandable why-this-matters
   - Menu groups show Ship Now / Create Assets / Intelligence / Operations

6. **Commit**:
   ```bash
   git add -A
   git commit -m "Bolt Vibranium UI + Editorial: Editorial DNA, source discipline, quality meter, 8-check voice gate, Fast Lane strip, menu regrouping"
   ```

## Rollback

```bash
git stash pop
```

## Expected Conflicts

- **EditorialBrain.tsx**: If Replit source has diverged, the DNA panel insertion point (after step progress bar) and quality meter insertion point (before output panel) may need manual placement.
- **Home.tsx**: If header structure changed, the Zap icon addition may need manual merge.
- **MenuOverlay.tsx**: If MENU_SECTIONS was modified, the group rename may need manual merge.

## Route/Naming Compatibility

- All View IDs unchanged — zero route breaks
- All component prop interfaces unchanged (except FounderVoiceGate which now accepts `siloName` and `qualityScore` as optional props)
- FounderVoiceCheck.tsx still exists and is used by SocialFactoryView — not affected
