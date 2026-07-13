# BOLT TERA — API ASSUMPTIONS

## No New API Dependencies
This pass introduces zero new API calls. All functionality is local-first.

## Existing APIs Referenced (not modified)
| API | Used By | Status |
|-----|---------|--------|
| `useOutputHistory()` | SocialFactoryView, OutputHistoryView, EditorialBrain | EXISTING — localStorage-backed |
| `useWPSettings(silo)` | WordPressPublishView, WPConnectionsView | EXISTING — localStorage-backed |
| `useDraft(key, initial)` | SocialFactoryView, WordPressPublishView, EditorialBrain | EXISTING — localStorage-backed |
| `useSafeMode()` | SocialFactoryView, WordPressPublishView | EXISTING — context-based |
| `recordOutput(entry)` | SocialFactoryView, WordPressPublishView | EXISTING — localStorage |
| `recordSafeModeBlock(action)` | SocialFactoryView, WordPressPublishView | EXISTING — audit log |

## Server-Side APIs (NOT called by this pass)
| API | Used By (existing) | This Pass |
|-----|---------------------|-----------|
| `/api/social-factory/pack` | Old SocialFactoryView | NOT CALLED — replaced with local builder |
| `/api/wordpress/test` | WPConnectionsView, WPSettingsModal | NOT CALLED |
| `/api/wordpress/media` | PublishPanel | NOT CALLED |
| `/api/approvals/*` | PublishPanel | NOT CALLED |
| `/api/wp-diagnostics/*` | WPDiagnosticsPanel | NOT CALLED |

## Import Dependencies
All imports use existing project modules. No new npm packages required.

| Import | Source | Status |
|--------|--------|--------|
| `verticals` | `@/lib/mock-data` | EXISTING |
| `useOutputHistory` | `@/lib/useOutputHistory` | EXISTING |
| `useWPSettings` | `@/lib/useWPSettings` | EXISTING |
| `useDraft` | `@/lib/useDraft` | EXISTING |
| `useSafeMode` | `@/lib/safeMode` | EXISTING |
| `recordOutput` | `@/lib/useOutputHistory` | EXISTING |
| `recordSafeModeBlock` | `@/lib/safeMode` | EXISTING |
| `CopyButton` | `@/components/hmg/CopyButton` | EXISTING |
| `Button` | `@/components/ui/button` | EXISTING |
| `SiloPicker` | `./SiloPicker` | EXISTING |
| `toast` | `sonner` | EXISTING |
| `framer-motion` | npm | EXISTING |
| `lucide-react` | npm | EXISTING |
| `getPlaybook` | `@/lib/hmg/editorial/editorialPlaybooks` | NEW (self-contained) |
| `getAngleGuidance` | `@/lib/hmg/editorial/editorialPlaybooks` | NEW (self-contained) |
| `EDITORIAL_STAGES` | `@/lib/hmg/editorial/editorialStages` | NEW (self-contained) |
