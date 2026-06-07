# HMG Newsroom — Max Final Overdrive Pass
**Date:** 2026-06-07
**Pass:** REPLITFOCUSQUAD Final Maximillion Founder OS / Black Money Brain Overdrive Pass
**Tasks:** T1–T18 (18 tasks complete)
**Archive:** `hmg-newsroom-max-final-overdrive-pass-2026-06-07.tar.gz`

---

## What This Pass Did

This pass deepened, hardened, and polished all Max Revenue Brain systems already built in prior passes.
No new fake AI. No pipelines. No leaderboards. Pure Max intelligence — honest, local, founder-native.

---

## Engine Upgrades (T2–T8)

### maxVoiceEngine.ts
- 12 voice modes (executive-calm, chase-mode, founder-reality, money-serious, package-builder, relationship-advisor, sports-money-brain, ignore-advisor, black-money-brain, pattern-recognition, time-protector, moolah-scout)
- 18 sports categories with curated analogy pools
- Phrase pools for every mode: openers, chase phrases, ignore phrases, revenue phrases, package phrases, relationship phrases, moolah phrases, package names

### maxFounderContext.ts
- 17+ FounderContext fields (moneyPhilosophy, pricingNotes, relationshipNotes, reputationRules, timeProtectionRules, repeatedWorkToAvoid, founderReviewStyle, voicePreferences, preferredSponsorCategories, noGoCategories, verticalPriorities, contentFranchiseIdeas, packagePreferences, relationshipWarmLanes, pastWins, ignoredCategories, editorialStrengths + canon fields)
- 12 context quality areas (each with weight, whatMaxNeeds, whyItMatters, howToImprove, copyFillPrompt, whatMaxKnows)
- 5 context quality labels: Empty → Basic → Useful → Strong → Sharp
- Context quality score (0-100) computed from 12 areas
- `careerHighlights` declaration merge removed to fix TypeScript narrowing

### maxJudgmentEngine.ts
- 9 MoneyTypes (Sponsor Play, Relationship Play, Audience Growth Play, Authority Play, Package Play, Offline Money Play, Brand Equity Play, Franchise Content Play, Ignore)
- 7 JudgmentDecisions (Chase, Watch, Package, Relationship First, Delegate, Save for Later, Ignore)
- 6 FounderEffort levels (5-Minute Move, 15-Minute Move, 30-Minute Block, Half-Day Block, Full-Day Build, Ongoing Work)
- 7 Timing categories
- Confidence score (0-100)
- Full upside/downside/whatWouldMakeItBetter/whatWouldMakeItNotWorthIt/founderShouldOnlyTouchIf fields
- 15 DealFlag types as full objects (type, severity, whyItMatters, howToMakeSafer, founderReviewNote)
- 4 risk levels on DealLawyerReview (Low, Medium, High, Flag)
- cleanerVersion / saferPitchAngle / doNotSayThis / humanReviewIf on DealLawyerReview
- Buffett filter: 10 checks (compoundsEquity, isRepeatable, isSimpleEnoughToSell, buildsRelationshipMoat, isLowDrama, createsFutureDealFlow, protectsFounderTime, isJustHype, stillMatterIn30Days, canBecomeDurablePackage)
- BuffettVerdict: Compound | Package | Wait | Avoid | Noise
- Full MoolahPath (fastestMonetization, cleanestPackagePath, relationshipMoatPath, longTermBrandEquityPath, reasonNotToChase)
- 18 FounderCommands
- Sports read with 5 fields: analogy, category, meaning, moneyLesson, founderAction, whatToAvoid

### maxContentToMoney.ts
- 13 content types: breaking-story, gossip-report, event-coverage, artist-interview, sports-angle, sponsor-integration, editorial-column, social-post, podcast-clip, video-short, newsletter-piece, franchise-piece, listicle
- All new fields: clipSocialAngle, wpNewsletterAngle, relationshipAngle, riskNote, whatNotToSell, primaryVertical, secondaryVertical, warningFlags

---

## UI Upgrades (T9–T15)

### MaxCROInboxView.tsx — Full Final Rewrite
**Quick Read Tab:**
- QuickReadCard: decision, money type, effort, timing, risk, confidence pill, what not to do, Copy Read + Save Read buttons, smart status buttons (Into Package, Add Follow-Up, Mark Ignore, Founder Review based on decision)

**Inbox Tab:**
- DailyExecutiveBriefPanel: Max opening read (local voice), one move before lunch, one move before EOD, sports read if applicable, 10-section brief with all new fields

**Priority Tab:**
- Filtered to score ≥ 50 or flagged priority items

**Max Commands Tab (18 commands):**
1. Is this money or noise?
2. What's the sponsor angle?
3. What should I ignore?
4. What's the relationship play?
5. Turn this into a package.
6. Give me the quick read.
7. What would Max do?
8. What would Max not do?
9. Give me the Buffett read.
10. Give me the deal-lawyer read.
11. Protect my time.
12. Make this mobile-simple.
13. Turn this into a weekly franchise.
14. What's the cleanest moolah path?
15. What goes to WebEdit?
16. What goes to Social Factory?
17. What should become a WordPress article?
18. What should Max save for later?

**Content → Money Tab (13 types):**
- All new fields displayed: clip/social angle, WP/newsletter angle, relationship angle, risk note, what not to sell, primary/secondary vertical, warning flags

**Judgment Panel:**
- Confidence pill, decision, money type, effort, timing grid
- Why + Founder Next Move
- Expandable: upside, downside, what would make it better/worse, Founder should only touch if, sports read (5-field)
- Copy + Save buttons (max-judgment kind)

**Deal Lawyer Panel:**
- DealFlag objects expanded (type/severity/whyItMatters/howToMakeSafer/founderReviewNote)
- SEVERITY_COLORS: Low/Medium/High/Critical
- cleanerVersion / saferPitchAngle / doNotSayThis / humanReviewIf displayed
- Copy + Save buttons (max-risk-review kind)

**Buffett + Moolah Panel:**
- 10-check grid (with invert for isJustHype)
- BuffettVerdict badge (Compound/Package/Wait/Avoid/Noise)
- Expandable Moolah Path section (5 paths)
- Copy + Save buttons (max-buffett-filter kind)

**Founder Context Tab:**
- Context quality panel with score/label, 12 expandable areas (each with what Max needs, why it matters, how to improve, copy fill-in prompt, what Max knows)
- 5 quality labels with colors: Empty/Basic/Useful/Strong/Sharp
- All list fields + text fields

### HavenAIEngineView.tsx — MaxRevenueBrainSection Upgrade
- 6-stat grid: Sources Reviewed, Priority Moves, Follow-Ups, Quick Reads Saved, Commands Saved, Context Quality
- Context quality derived from localStorage with scoring
- Context quality label shown in memory status block

### CommandCenterView.tsx — MaxRevenueCard Upgrade
- Added "Sharp" to contextQuality type and QUALITY_COLORS
- Derived from reviewed items: bestRelationshipPlay, bestPackageIdea, whatToIgnore
- All three displayed as new card rows when populated

---

## Output History Expansion (T13)

### useOutputHistory.ts
- Added kinds: `max-quick-read`, `max-founder-command`, `max-sports-read`

### OutputHistory.tsx
- Added Brain import (for max-founder-command icon)
- KIND_ICON entries: max-quick-read → Zap, max-founder-command → Brain, max-sports-read → TrendingUp
- KIND_LABEL entries: Quick Read, Max Command, Sports Read

---

## Typecheck — T16

**Zero errors after:**
1. `maxJudgmentEngine.ts` line 311/313: Removed `decision === "5-Minute Move"` and `decision === "15-Minute Move"` comparisons (wrong variable — should use `effort`)
2. `maxJudgmentEngine.ts` line 493: Replaced `moneyType === "Franchise Content Play"` in `canBecomeDurablePackage` with `compoundsEquity` (which already covers that case) to resolve TypeScript narrowing false-positive
3. `maxFounderContext.ts`: Removed `careerHighlights` from `ArrayField` type and removed stale declaration merge

---

## Truth Labels (All Views)

All Max views carry honest status labels:
- **Local Max Intelligence** — no model API calls
- **Founder Review Required** — no action without Founder sign-off
- **No Outreach Sent** — no email, no DM, no CRM push
- **No CRM Connected** — all data is localStorage only
- **No Fake Deal Status** — no fake pipeline states
- **Future Old Soldier / Ollama Hook Pending** — labeled for future upgrade

---

## Architecture Decisions Reinforced

- Local-first: all Max data in `hmg-newsroom-max-*` localStorage keys
- No fake AI: all judgment, scoring, and phrasing is deterministic local algorithms
- Output History bridge: Max results saved via `recordOutput()` to `hmg-newsroom-output-history-v2`
- Storage key convention: all Max keys use `hmg-newsroom-max-*-v1` prefix

---

## Files Modified

| File | Change |
|------|--------|
| `src/lib/hmg/haven-ai/maxVoiceEngine.ts` | 12 modes, 18 sports categories, all phrase pools |
| `src/lib/hmg/haven-ai/maxFounderContext.ts` | 17+ fields, 12 areas, 5 labels, copy prompts, TS fix |
| `src/lib/hmg/haven-ai/maxJudgmentEngine.ts` | 9 MoneyTypes, 7 decisions, 15 DealFlags, Buffett 10-check, MoolahPath, 18 commands, TS fixes |
| `src/lib/hmg/haven-ai/maxContentToMoney.ts` | 13 types, all new fields |
| `src/components/newsroom/MaxCROInboxView.tsx` | Full final rewrite — all 12 tabs, upgraded panels |
| `src/components/newsroom/HavenAIEngineView.tsx` | MaxRevenueBrainSection: 6-stat grid, context quality |
| `src/components/newsroom/CommandCenterView.tsx` | MaxRevenueCard: Sharp quality, relationship/package/ignore |
| `src/components/newsroom/OutputHistory.tsx` | Brain import, 3 new kinds |
| `src/lib/useOutputHistory.ts` | 3 new kinds added to union |

---

## Checkpoints

| Checkpoint | Description |
|-----------|-------------|
| `hmg-newsroom-max-before-final-overdrive-2026-06-07.tar.gz` | Pre-pass state (1.1MB) |
| `hmg-newsroom-max-final-overdrive-pass-2026-06-07.tar.gz` | Final state after all 18 tasks |
