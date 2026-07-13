# BOLT_TERA_ROUTE_INTEGRATION.md

## Routing Contract for Dr. Replit

This document specifies the routing integration contract for wiring new and existing views into `Home.tsx`.

---

## Route ID Assignments

### 1. WordPressPublishView

- **New route ID:** `wp-publish`
- **Reuses existing?** No — this is a new route ID. If an existing `wordpress` route exists in `Home.tsx`, it should be repurposed to point to `WordPressPublishView` (the preparation workspace), with `WordPressDraftHistoryView` as an internal secondary destination accessible from within `WordPressPublishView`.
- **Component path:** `@/components/newsroom/WordPressPublishView`
- **Export name:** `WordPressPublishView`
- **Props:** `onSelectView?: (view: string) => void`

> **WordPress primary destination resolution:**
> - The WordPress primary destination should resolve to `WordPressPublishView` (the preparation workspace).
> - `WordPressDraftHistoryView` is an internal secondary destination, accessible via `WordPressPublishView`'s internal navigation (e.g., via `onSelectView?.("wp-draft-history")`).
> - If `Home.tsx` previously routed `wordpress` to `WordPressDraftHistoryView` directly, that route should now route to `WordPressPublishView` instead, and `WordPressDraftHistoryView` becomes reachable only through `WordPressPublishView`'s internal navigation.

### 2. OutputHistoryView

- **New route ID:** `output-history`
- **Reuses existing?** If an existing `output-history` route already exists in `Home.tsx`, reuse it. Otherwise, add it as a new route.
- **Component path:** `@/components/newsroom/OutputHistoryView`
- **Export name:** `OutputHistoryView`
- **Props:** `onSelectView?: (view: string) => void`

### 3. SocialFactoryView

- **Existing route ID:** `socialfactory`
- **Status:** No change needed — already wired.
- **Component path:** `@/components/newsroom/SocialFactoryView`
- **Export name:** `SocialFactoryView`

### 4. EditorialBrain

- **Existing route ID:** `newsroom`
- **Status:** No change needed — already wired.
- **Component path:** `@/components/hmg/editorial/EditorialBrain`
- **Export name:** `EditorialBrain`

> **Note:** `EditorialBrain` now requires a `brandId: string` prop (not `onSelectView`). Ensure the `newsroom` route passes the currently selected brand ID. See `BOLT_TERA_BACKWARD_COMPAT.md` for details.

---

## Minimal Changes for Home.tsx

### Add these imports at the top of Home.tsx:

```tsx
// Add these imports at the top of Home.tsx:
import { WordPressPublishView } from "@/components/newsroom/WordPressPublishView";
import { OutputHistoryView } from "@/components/newsroom/OutputHistoryView";
```

### In the view routing switch (add these cases):

```tsx
// In the view routing switch (add these cases):
case "wp-publish":
  return <WordPressPublishView onSelectView={(v) => setActiveView(v)} />;
case "output-history":
  return <OutputHistoryView onSelectView={(v) => setActiveView(v)} />;
```

> **Note:** Replace `setActiveView` with whatever the actual state setter is named in `Home.tsx` (e.g., `setView`, `setCurrentView`, etc.).

---

## Old Component Imports That Become Unused After Integration

### WordPressDraftHistoryView

- **If Home.tsx previously imported `WordPressDraftHistoryView` directly**, it can now be accessed via `WordPressPublishView`'s internal navigation.
- **Action:** Remove the direct import of `WordPressDraftHistoryView` from `Home.tsx` if it was only used for the primary WordPress route. The `WordPressDraftHistoryView` remains accessible as a secondary destination through `WordPressPublishView`'s internal `onSelectView?.("wp-draft-history")` call.
- **Old import to remove:**
  ```tsx
  // Remove if previously imported directly:
  import { WordPressDraftHistoryView } from "@/components/newsroom/WordPressDraftHistoryView";
  ```
- **Old route case to remove/replace:**
  ```tsx
  // Old (remove or redirect to wp-publish):
  case "wordpress":
    return <WordPressDraftHistoryView onSelectView={(v) => setActiveView(v)} />;

  // New (replace with):
  case "wp-publish":
    return <WordPressPublishView onSelectView={(v) => setActiveView(v)} />;
  ```

### OutputHistory (old sheet panel)

- **If Home.tsx imported `OutputHistory` (the old sheet panel component)**, it can be replaced by `OutputHistoryView` (the new full-page view).
- **Action:** Remove the old `OutputHistory` import and any sheet/side-panel rendering logic. The new `OutputHistoryView` is a full-page view, not a sheet.
- **Old import to remove:**
  ```tsx
  // Remove if previously imported:
  import { OutputHistory } from "@/components/newsroom/OutputHistory";
  ```
- **Old rendering to remove:**
  ```tsx
  // Old (remove the sheet panel rendering):
  <OutputHistory open={...} onOpenChange={...} onSelectView={...} />

  // New (replace with route case):
  case "output-history":
    return <OutputHistoryView onSelectView={(v) => setActiveView(v)} />;
  ```

---

## Route Map Summary

| Route ID | Component | Status | Notes |
|---|---|---|---|
| `wp-publish` | `WordPressPublishView` | **NEW** | Primary WordPress destination (preparation workspace) |
| `output-history` | `OutputHistoryView` | **NEW** (or reuse existing) | Full-page output history |
| `socialfactory` | `SocialFactoryView` | **EXISTING** | No change needed |
| `newsroom` | `EditorialBrain` | **EXISTING** | No change needed (but verify `brandId` prop is passed) |
| `wp-draft-history` | `WordPressDraftHistoryView` | **INTERNAL** | Secondary destination, accessible from within `WordPressPublishView` |

---

## Navigation Flow

```
Home.tsx
├── wp-publish → WordPressPublishView
│   └── (internal) → wp-draft-history → WordPressDraftHistoryView
├── output-history → OutputHistoryView
│   └── (internal nav) → newsroom, artbot, cutmaster, socialfactory, wp-draft-history
├── socialfactory → SocialFactoryView (no change)
└── newsroom → EditorialBrain (no change, but verify brandId prop)
```

The `OutputHistoryView` component (lines 384–428) already wires navigation buttons to the following routes via `onSelectView`:
- `"newsroom"` → Editorial
- `"artbot"` → WebArt
- `"cutmaster"` → WebEdit
- `"socialfactory"` → Social Factory
- `"wp-draft-history"` → WordPress

Ensure all these route IDs exist in `Home.tsx`'s view switch.
