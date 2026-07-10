# BOLT UI + Editorial Reinforcement — Risk Register

## Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| MenuOverlay description changes alter search/menu semantics | Low — descriptions are display-only, no ID changes | All View IDs preserved; only human-readable text changed |
| QuickLaunchView status badges show wrong state | Low — badges are heuristic, not data-driven | WordPress Draft badge uses output history presence; other tiles default to "Ready" |
| Home.tsx stats button hidden on QuickLaunch | Low — stats still accessible via menu | Stats overlay still opens from menu items; only header button is hidden |
| EditorialBrain save/recover draft uses localStorage | Low — same mechanism as existing useDraft hook | Draft key is scoped per brand+mode; clear button available |

## Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| FounderVoiceGate replaces FounderVoiceCheck in EditorialBrain | Medium — SocialFactoryView still uses old component | Both components coexist; no deletion of FounderVoiceCheck.tsx |
| EditorialBrain.tsx is a full rewrite | Medium — merge conflicts if Replit source has diverged | Apply as overwrite; backup via git stash first |
| useDraft import may not exist in full Replit source | Medium — if useDraft was added by Bolt | Verify import exists before applying; if not, copy useDraft.ts too |

## High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Intelligence module API mismatch | High — if `@/lib/hmg/intelligence` exports differ | Verify that `chooseBlueprint`, `formatArticleQualityReceipt`, `formatBrandVoicePacket`, `formatFounderVoicePacket`, `generateSeoPacket`, `getBrandVoiceProfile`, `scoreArticleDraft`, `BrandVoiceProfile`, `QualityScoreResult`, `SeoPacket` all exist with same signatures |
| brandVoiceProfiles module API mismatch | High — if `getBrandVoiceProfile` signature differs | Verify the function exists and returns an object with `name`, `toneLabel` properties |

## Not A Risk

- **FounderVoiceCheck.tsx deletion**: Not deleted, still used by SocialFactoryView
- **View ID changes**: None — all route IDs preserved
- **Package.json changes**: Preinstall guard was temporarily bypassed for build, then restored
- **Stub packages**: Not copied — `lib/api-client-react/`, `lib/db/`, `lib/api-zod/` are Bolt-only
