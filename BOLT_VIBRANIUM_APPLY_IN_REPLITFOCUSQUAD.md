# How To Apply This Patch in ReplitFocusQuad

## Quick Apply (Under 10 Minutes)

This patch is a Bolt reinforcement pass. It upgrades UI/editorial components only. No backend, no database, no API changes.

## Files To Copy

```
src/components/newsroom/QuickLaunchView.tsx       → overwrite
src/components/hmg/editorial/EditorialBrain.tsx   → overwrite
src/components/hmg/editorial/FounderVoiceGate.tsx  → overwrite
src/components/newsroom/MenuOverlay.tsx            → overwrite
src/pages/Home.tsx                                 → overwrite
```

## What This Patch Does NOT Touch

- WebEdit/CutMaster source files
- WebArt/ArtBot source files
- Backend API server
- Database schema
- RLS policies
- Edge functions
- lib/ stub packages
- package.json (preinstall guard restored)
- FounderVoiceCheck.tsx (still used by SocialFactoryView)

## Verification Commands

```bash
# Typecheck
pnpm run typecheck

# Build
pnpm run build

# Grep for forbidden visible strings (should return nothing in visible UI text)
grep -rn "provider\|endpoint\|packet\|fallback\|API diagnostics\|backend status\|fake connector\|local-only" \
  src/components/newsroom/QuickLaunchView.tsx \
  src/components/hmg/editorial/EditorialBrain.tsx \
  src/components/hmg/editorial/FounderVoiceGate.tsx \
  src/components/newsroom/MenuOverlay.tsx \
  src/pages/Home.tsx \
  | grep -v "import\|const\|//\|type \|interface\|Packet\|fallback=" | head -20
```

Note: The grep will show some matches for code identifiers (function names like `formatBrandVoicePacket`, React props like `fallback=`). These are NOT visible user-facing strings. Only visible text in JSX children or aria-labels matters.

## What Changed And Why

1. **QuickLaunchView**: Added hero line, Fast Lane strip, 6 honest statuses, helper text on every tile. Makes the front door feel intentional and tells the operator exactly what each action does and what it needs.

2. **EditorialBrain**: Added Editorial DNA panel (brand-aware guidance per Haven silo), source discipline fields (5 verification fields), quality meter (5 metrics with visual bars), handoff destinations grid, "Founder Review Needed" state. Bakes institutional knowledge into the workflow.

3. **FounderVoiceGate**: Expanded to 8 checks with expandable "why this matters" explanations, progress bar, "Ready for Founder Review" confirmation state. Makes the quality gate feel premium, not bureaucratic.

4. **MenuOverlay**: Renamed groups to Ship Now / Create Assets / Intelligence / Operations. More intuitive for a newsroom operator.

5. **Home.tsx**: Added Zap icon for QuickLaunch header. Minor polish.

## Route/Naming Compatibility

- All View IDs unchanged
- All route paths unchanged
- No new routes added
- No hooks violated
- Quick Launch cold-open preserved
- Last-view restore preserved
