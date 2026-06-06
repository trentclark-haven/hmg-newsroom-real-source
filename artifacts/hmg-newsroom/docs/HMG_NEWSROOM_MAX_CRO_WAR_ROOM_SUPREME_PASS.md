# HMG Newsroom — Max CRO War Room Supreme Pass

**Session:** REPLITFOCUSQUAD — Maximillion CRO War Room Supreme Build Pass  
**Date:** 2026-06-06  
**Status:** Complete — typecheck passes, build passes

---

## Files Created

| File | Purpose |
|---|---|
| `src/lib/hmg/haven-ai/maxRevenueScoring.ts` | 7-dimension revenue scoring engine (0–100), 5 score labels |
| `src/lib/hmg/haven-ai/maxSponsorCategories.ts` | 20 sponsor category definitions with pitch angle, risk notes, what not to say |
| `src/lib/hmg/haven-ai/maxContentPackages.ts` | 10 content package types — generator, text builder, pitch starter copy |
| `src/lib/hmg/haven-ai/maxDailyBrief.ts` | Daily Money Brief generator — 7-section deterministic summary |
| `src/lib/useMaxFollowUpTracker.ts` | Relationship follow-up tracker — localStorage key `hmg-newsroom-max-followup-tracker-v1` |

## Files Edited

| File | Change |
|---|---|
| `src/lib/hmg/haven-ai/maxCROEngine.ts` | Added `score: RevenueScore \| null` and `generatedPackage: ContentPackage \| null` to MaxCROBrief interface |
| `src/lib/useMaxCROInbox.ts` | Added `computeRevenueScore` call in `sendToMax()` — score now computed alongside review |
| `src/lib/useOutputHistory.ts` | Added 3 new kinds: `max-daily-money-brief`, `max-follow-up`, `max-revenue-package` |
| `src/components/newsroom/OutputHistory.tsx` | Added KIND_ICON + KIND_LABEL entries for all 3 new Max kinds |
| `src/components/newsroom/MaxCROInboxView.tsx` | **Complete War Room rewrite** — 8 tabs, score display, package builder, follow-up tracker, sponsor browser, daily brief, memory status |
| `src/components/newsroom/CommandCenterView.tsx` | Added `MaxRevenueCard` component — live stats card with 5-metric grid, top money move, Open War Room button |
| `src/components/newsroom/HavenAIEngineView.tsx` | Added `MaxRevenueBrainSection` — live CRO stats, memory status, truth labels, Open War Room button |

---

## T2 — Max Revenue Score System

**File:** `maxRevenueScoring.ts`

7 scoring dimensions (0–10 each):

| Dimension | What it measures |
|---|---|
| Audience Fit | Does content fit an HMG vertical audience? |
| Sponsor Fit | Does it suggest a brand/category that could sponsor? |
| Relationship Value | Does it involve someone worth following up with? |
| Urgency | Is this time-sensitive? |
| Repeatable Package | Can this become a repeatable sales package? |
| Reputation Safety | Is it clean enough to pitch without risk? |
| Founder Effort | How much work from the Founder? (10 = low effort) |

**Composite Money Move Score (0–100)** with weighted formula:
- Sponsor Fit: 25%, Audience Fit: 20%, Reputation Safety: 20%, Relationship Value: 15%, Urgency: 10%, Repeatable: 5%, Founder Effort: 5%

**Score Labels:**
- 0–24: No Money Move
- 25–44: Light Opportunity
- 45–64: Real Opportunity
- 65–79: Priority Revenue Move
- 80–100: Founder-Level Deal Signal

No fake revenue numbers. No estimated dollars. Labels are editorial guidance only.

---

## T3 — Max War Room Dashboard

**File:** `MaxCROInboxView.tsx` (complete rewrite)

**8 Tabs:**

| Tab | Content |
|---|---|
| Source Intake | Paste form, silo selector, founder note, revenue preview, Memory Status Panel |
| Revenue Inbox | All items + Daily Money Brief generator |
| Priority Moves | Items with score ≥ 50 or Max Review status |
| Follow-Ups | Relationship follow-up tracker (Add, status, copy, save) |
| Sponsor Angles | 20-category sponsor map matched to inbox content |
| Offline Plays | Items with offline money play signals |
| Ignore | Ignored / No Money Move items |
| Founder Review | Items flagged for Founder decision |

**Each card shows:** source, brand/silo, score badge, status badge, revenue signals, copy brief, save to history, send to max, flag founder review, mark follow-up, mark ignore, delete, score breakdown toggle, CRO review panel (8 sections collapsible), Content Package Builder.

---

## T4 — Command Center Max Revenue Card

**Component:** `MaxRevenueCard` in `CommandCenterView.tsx`

- Live stats from localStorage (refreshes every 10s)
- 5-metric grid: Priority Moves, Follow-Ups, Ignored, Saved Briefs, Total Sources
- Top money move display (highest score in inbox)
- "Open War Room" button → `maxcro` view
- Truth labels: Local CRO Review, No Outreach Sent, No CRM Connected, Founder Review Required
- Does not replace MaxCROStrip (strip = quick access, card = state summary)

---

## T5 — Max Daily Money Brief

**File:** `maxDailyBrief.ts`

Generates a 7-section deterministic brief from the current inbox:
1. Best Sponsor Angle
2. Best Relationship Follow-Up
3. Best Content-to-Revenue Move
4. Best Offline Money Play
5. What to Ignore Today
6. Founder Next Move
7. Risk / Reputation Warning

Actions: Generate Brief, Copy Brief, Save to Output History (kind: `max-daily-money-brief`)

---

## T6 — Relationship Follow-Up Tracker

**File:** `useMaxFollowUpTracker.ts`  
**Storage key:** `hmg-newsroom-max-followup-tracker-v1`

Fields: person/company, relationship type (12 options), reason, related source, suggested message angle, status, notes, createdAt, updatedAt

Statuses: Needs Follow-Up, Founder Review, Follow-Up Done Manually, Waiting, Ignore

Actions: Add Follow-Up, Mark Done Manually, Mark Waiting, Mark Ignore, Copy Follow-Up Brief, Save to Output History (kind: `max-follow-up`)

Truth labels: Manual Follow-Up Only | No Email Sent | No CRM Connected

---

## T7 — Sponsor Category Map

**File:** `maxSponsorCategories.ts`

20 categories:
music-tech, headphones/audio, streetwear, sneakers, sports-apparel, cannabis, fitness/wellness, sober-lifestyle, local-restaurants, venues, festivals/events, gaming, creator-tools, camera/video-gear, auto-lifestyle, streaming/entertainment, education/workforce, veteran-owned, black-owned, local-LA

Each category includes: bestVerticals, contentFit, pitchAngle, riskNotes, whatNotToSay

`getCategoriesForText(text)` matches categories to inbox content automatically.

---

## T8 — Content Package Builder

**File:** `maxContentPackages.ts`

10 package types:
1. Sponsored Article Package
2. Social Clip Package
3. Interview Package
4. Event Coverage Package
5. Local Business Spotlight
6. Founder Commentary Package
7. Multi-Vertical Campaign
8. WebEdit + Social Factory Bundle
9. WordPress + Newsletter Bundle
10. Vertical Brand Package

Each package includes: what gets made, who it helps, why a sponsor cares, deliverables, founder work required, risk notes, copy pitch starter, what to avoid.

Actions: Generate Package From Max Review, Copy Package, Save Package to Output History (kind: `max-revenue-package`)

---

## T9 — Max Memory Hooks

**Panel:** `MemoryStatusPanel` in MaxCROInboxView

Reads from `hmg-founder-knowledge-base-v1`. Checks for revenue-relevant types:
- `revenue-max-note`, `sales-note`, `relationship-note`, `contact-csv`, `pitch-deck`, `resume-bio`

Displays loaded vs. not loaded with honest message:
> "Max memory not loaded yet. Add founder revenue notes to sharpen recommendations."

No fake memory. No invented relationships.

---

## T10 — Haven AI Engine Max Section

**Component:** `MaxRevenueBrainSection` in `HavenAIEngineView.tsx`

- Title: Max Revenue Brain
- Status: Local CRO Review Active
- Live stats: Max Reviews, Priority Moves, Follow-Ups, Saved Briefs
- Memory status indicator (loaded / not loaded)
- Open War Room button
- Truth labels: No CRM Connected, No Outreach Sent, No Fake Sponsor Contacts, Founder Review Required

---

## T11 — Output History Expansion

**New kinds added:**

| Kind | Icon | Label | Saved from |
|---|---|---|---|
| `max-daily-money-brief` | BookMarked | Daily Brief | Daily Brief generator |
| `max-follow-up` | ScrollText | Follow-Up | Follow-Up card |
| `max-revenue-package` | Megaphone | Rev Package | Package Builder |

All 4 Max kinds display in the Output History sheet with Copy, Download actions.

---

## T12 — Max Founder Copy Quality

All Max outputs use executive, founder-first voice:
- "This is worth a look."
- "Do not chase this unless…"
- "The money move is…"
- "The clean sponsor angle is…"
- "This is a relationship play, not a content play."
- "Low effort, decent upside."
- "High upside, but Founder review first."
- "Ignore the noise here."

No fake motivational language. No generic business bro copy.

---

## T13 — Fake-Claim Guardrails

**Forbidden claims (none present):** email sent, CRM connected, sponsor contacted, deal created, revenue secured, outreach completed, automatic pipeline synced, live sponsor database, AI model generated without model wiring.

**Required labels (present on all Max surfaces):**
- Local CRO Review ✓
- Founder Review Required ✓
- No Outreach Sent ✓
- No CRM Connected ✓
- Manual Follow-Up Only ✓
- Future Relationship Database Hook Pending ✓

---

## What Is Real Now

- **Revenue scoring** — deterministic 0–100 score, 7 dimensions, computed on every Max review
- **War Room dashboard** — 8 tabs, live inbox filtering, founder-ready cards
- **Daily Money Brief** — one-button daily summary, copy + save to Output History
- **Relationship follow-up tracking** — local, manual, no CRM, no email, fully honest
- **Sponsor category map** — 20 categories, auto-matched to inbox content
- **Content package builder** — 10 package types, pitch starters, founder-work estimates
- **Max memory hooks** — reads from Founder Knowledge Base, shows loaded vs. empty
- **Haven AI Engine Max section** — live stats, memory status, navigation
- **Command Center Revenue Card** — live state summary, 5 metrics, top money move

---

## What Is Future Backend

- Real relationship CRM (requires backend + database)
- Real email/DM outreach tracking (requires backend + mail integration)
- Live sponsor contact database (requires API + backend)
- Real deal pipeline (requires backend CRM)
- Relationship database hook (labeled "Future Relationship Database Hook Pending" everywhere)

---

## Typecheck Result

✅ **Passed clean** — 0 errors

---

## Build Result

✅ **Passed** — full production build complete

---

## Archives

- `hmg-newsroom-max-cro-before-war-room-2026-06-06.tar.gz` — checkpoint before War Room pass (11K)
- `hmg-newsroom-max-cro-war-room-supreme-pass-2026-06-06.tar.gz` — final War Room archive

---

## Next Handoff

Max War Room is fully operational. The next logical layer:
1. Backend CRM integration — when backend credentials are available
2. Email/DM outreach tracking hook — future backend route
3. Live sponsor contact database — future API integration
4. Max scoring tuning — refine weights based on Founder feedback
5. Cross-vertical campaign tracker — unified campaign view across all 7 brands
