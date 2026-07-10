# BOLT FINAL PREMIUM EDITORIAL — SOURCE MAP

## File Dependency Graph

```
editorialPlaybooks.ts (NEW)
├── exports: EditorialPlaybook, AngleGuidance, AngleType, VerticalId
├── exports: EDITORIAL_PLAYBOOKS, ANGLE_GUIDANCE, SOURCE_DISCIPLINE_MICROCOPY
├── exports: getPlaybook(), getAngleGuidance(), getSourceMicrocopy()
├── no external imports (self-contained)
└── imported by: EditorialBrain.tsx

EditorialBrain.tsx (MODIFIED)
├── imports: getPlaybook, getAngleGuidance, AngleType from editorialPlaybooks
├── imports: existing editorial types (ArticleType, ArticleTone, etc.)
├── imports: existing useDraft, useOutputHistory hooks
├── new internal: HmgStandardPanel component
├── exports: EditorialBrain (unchanged)
└── consumed by: Home.tsx (existing)

FounderVoiceGate.tsx (REPLACED)
├── imports: lucide-react icons only
├── exports: FounderVoiceGate, gateStatus, GateStatus
├── props: brandColor, onAccent, siloName, storageKey, onPass, passed, qualityScore
├── uses: window.localStorage (guarded)
└── consumed by: EditorialBrain.tsx (existing)

QuickLaunchView.tsx (REPLACED)
├── imports: verticals from @/lib/mock-data
├── imports: useOutputHistory from @/lib/useOutputHistory
├── imports: useWPSettings from @/lib/useWPSettings
├── imports: View type from ./MenuOverlay
├── imports: framer-motion (motion)
├── imports: lucide-react icons
├── props: onSelectView, onOpenEditorial
└── consumed by: Home.tsx (existing)
```

## Import Safety Analysis

| Import | Risk | Notes |
|--------|------|-------|
| `@/lib/hmg/editorial/editorialPlaybooks` | NEW | Self-contained, no external deps. Path follows existing `@/lib/hmg/editorial/*` convention. |
| `@/lib/mock-data` | EXISTING | Only imported by QuickLaunchView, not modified. |
| `@/lib/useOutputHistory` | EXISTING | Only imported by QuickLaunchView, not modified. |
| `@/lib/useWPSettings` | EXISTING | Only imported by QuickLaunchView, not modified. |
| `./MenuOverlay` (View type) | EXISTING | Type-only import, not modified. |
| `framer-motion` | EXISTING | Already used by previous QuickLaunchView. |
| `lucide-react` | EXISTING | All icons are standard exports. |

## No Circular Dependencies
- editorialPlaybooks.ts has zero imports → no circular risk
- HmgStandardPanel is internal to EditorialBrain.tsx → no circular risk
- FounderVoiceGate.tsx imports only from lucide-react → no circular risk
- QuickLaunchView.tsx imports match the previous version's imports → no new circular risk
