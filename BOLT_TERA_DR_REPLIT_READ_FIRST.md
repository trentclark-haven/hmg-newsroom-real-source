# Dr. Replit Read-First Guide — Bolt Tera Editorial and Publishing Build

## What This Package Contains

This package delivers 8 source files for the HMG Newsroom editorial and publishing workflow. It is a merge-safe handoff — no shell, navigation, WebArt, or WebEdit files are included.

## Apply Order

1. Run `./APPLY_BOLT_TERA_EDITORIAL_PUBLISHING.sh src`
2. Run `npx tsc --noEmit` (expect pre-existing errors only — zero new)
3. Run `npm run build`
4. Wire 2 new views into Home.tsx routing (see BOLT_TERA_ROUTE_INTEGRATION.md)
5. Visually verify all 4 views

## Files Summary

| # | File | Operation |
|---|------|-----------|
| 1 | src/lib/hmg/editorial/editorialStages.ts | CREATE |
| 2 | src/lib/hmg/editorial/editorialPlaybooks.ts | OVERWRITE |
| 3 | src/lib/hmg/editorial/index.ts | OVERWRITE |
| 4 | src/components/hmg/editorial/EditorialBrain.tsx | OVERWRITE |
| 5 | src/components/hmg/editorial/FounderVoiceGate.tsx | OVERWRITE |
| 6 | src/components/newsroom/SocialFactoryView.tsx | OVERWRITE |
| 7 | src/components/newsroom/WordPressPublishView.tsx | CREATE |
| 8 | src/components/newsroom/OutputHistoryView.tsx | CREATE |

## What NOT to Touch

- Home.tsx, MenuOverlay.tsx, QuickLaunchView.tsx (owned by ReplitFocusQuad)
- ArtBotView.tsx, CutMasterView.tsx (owned by Devin)
- package.json, tsconfig.json, vite.config.ts

## Integration Work Required

Only 2 lines of routing in Home.tsx:

```tsx
import { WordPressPublishView } from "@/components/newsroom/WordPressPublishView";
import { OutputHistoryView } from "@/components/newsroom/OutputHistoryView";

// In the view switch:
case "wp-publish": return <WordPressPublishView onSelectView={(v) => setActiveView(v)} />;
case "output-history": return <OutputHistoryView onSelectView={(v) => setActiveView(v)} />;
```

## Rollback

Run `./ROLLBACK_BOLT_TERA_EDITORIAL_PUBLISHING.sh src`

## Verification

- 18 isolated tests pass (6 suites)
- 0 new TS errors from this pass
- All 7 playbooks validated (5 new fields each, no TODOs, no empty arrays)
- Public language audit clean
- SHA-256 hashes verified for all 8 files
