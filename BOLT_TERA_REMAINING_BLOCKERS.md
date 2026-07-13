# BOLT TERA — REMAINING BLOCKERS

## Blockers for Dr. Replit
1. **Home.tsx routing**: The new WordPressPublishView and OutputHistoryView need to be wired into Home.tsx routing. This is owned by ReplitFocusQuad. The views export `({ onSelectView })` props compatible with the existing routing pattern.
2. **SiloPicker import**: SocialFactoryView imports `SiloPicker` from `./SiloPicker`. If this module doesn't exist in the full source, either create it or replace with inline brand selection.
3. **Badge import**: OutputHistoryView imports `Badge` from `@/components/ui/badge`. If this doesn't exist, replace with a styled `<span>`.
4. **Pre-existing thin-branch errors**: 446 TS errors from missing modules. These are NOT caused by this pass and will resolve when the full source tree is present.

## Non-Blockers
- The apply script (`APPLY_BOLT_TERA_EDITORIAL.sh`) is idempotent and will skip files that already exist for "NEW" actions.
- The protected files list in the apply script prevents overwriting Home, MenuOverlay, QuickLaunchView, ArtBotView, CutMasterView.
- All new files are self-contained and don't require new dependencies.
