# HMG Newsroom — Max Black Money Brain / Founder OS Supreme Intelligence Pass

**Date:** 2026-06-07
**Pass:** Maximillion Black Money Brain / Founder OS Supreme Intelligence
**North Star:** Max should feel less like a dashboard and more like Trent's sharp CRO companion — a Black media money strategist, Founder OS buddy, and practical executive who tells the Founder what is money, what is noise, what to package, what to ignore, and what to do next.

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/hmg/haven-ai/maxVoiceEngine.ts` | Max voice modes, copy helpers, sports analogies, verdict phrases |
| `src/lib/hmg/haven-ai/maxFounderContext.ts` | Founder DNA model, localStorage persistence, context quality scoring, `useFounderContext` hook |
| `src/lib/hmg/haven-ai/maxJudgmentEngine.ts` | Executive judgment engine — money type, effort, timing, decision, deal lawyer lens, Buffett filter, Max questions generator, Founder Commands dispatcher |
| `src/lib/hmg/haven-ai/maxContentToMoney.ts` | Content-to-money translator for 6 content input types |

## Files Edited

| File | What Changed |
|------|-------------|
| `src/components/newsroom/MaxCROInboxView.tsx` | Complete rewrite — 12 tabs, new intelligence panels, all new features |
| `src/lib/useOutputHistory.ts` | Added 6 new output kinds |
| `src/components/newsroom/OutputHistory.tsx` | Added KIND_ICON and KIND_LABEL for 6 new kinds |
| `src/components/newsroom/CommandCenterView.tsx` | Upgraded MaxRevenueCard with context quality, money/noise read, Founder next action |
| `src/components/newsroom/HavenAIEngineView.tsx` | Improved MaxRevenueBrainSection with founder-facing language and capability bullets |

---

## Engine Details

### Max Voice Engine (`maxVoiceEngine.ts`)
- 8 voice modes: `executive-calm`, `black-money-brain`, `sports-desk`, `founder-reality`, `deal-lawyer`, `buffett-patience`, `street-smart-media`, `quick-mobile`
- Copy helpers: `getMaxOpener`, `getMaxChasePhrase`, `getMaxWatchPhrase`, `getMaxPackagePhrase`, `getMaxIgnorePhrase`, `getMaxRiskPhrase`, `getMaxRelationshipPhrase`
- Sports reads: 12 analogies (layup, fast break, bunt, red zone, scouting report, film room, franchise player, role player, punt, trap game, home run, full-court press)
- `getMaxSportsRead()` — probabilistic (1-in-3) to avoid forcing sports analogies where they don't fit
- `getMaxVerdict()` — one-line verdict in Max voice per decision

### Founder Context Model (`maxFounderContext.ts`)
- Storage key: `hmg-newsroom-max-founder-context-v1`
- Seeded from safe public career record: TMZ Hip Hop Head, HipHopDX Editor-in-Chief, HipHopWired Senior Editor, The Smoking Section Managing Editor
- Fields: founderName, careerHighlights, editorialStrengths, businessPriorities, verticalPriorities, noGoCategories, preferredSponsorCategories, relationshipNotes, pricingNotes, pastWins, ignoredCategories, voicePreferences
- `scoreFounderContext()` — scores 7 fields (0–90 points): sponsor categories (20), no-go (15), verticals (15), pricing (15), relationship notes (15), business priorities (10), past wins (10)
- Quality labels: Empty / Basic / Useful / Strong
- `useFounderContext()` hook — loads, updates, addToList, removeFromList, reset

### Judgment Engine (`maxJudgmentEngine.ts`)
- `classifyMoneyType()` — 7 types: Sponsor Play, Relationship Play, Audience Growth Play, Authority Play, Package Play, Offline Money Play, Ignore
- `classifyFounderEffort()` — 5 levels: 5-Minute Move, 30-Minute Move, Half-Day Move, Needs Team, Not Worth Founder Time
- `classifyTiming()` — 5 reads: Act Now, Watch It, Save for Package, Relationship First, Ignore
- `makeDecision()` — 5 decisions: Chase, Watch, Package, Delegate, Ignore
- `runJudgment()` — returns full MaxJudgment object with voice-native copy
- `runFounderCommand()` — executes 10 Founder Commands against a judgment
- `runDealLawyerLens()` — business risk review (rights, overpromise, bad optics, sponsor mismatch, offline terms, exclusivity)
- `runBuffettFilter()` — checks durable, repeatable, buildsEquity, compoundsRelationships, isNoise
- `generateMaxQuestions()` — 8 targeted questions by category (relationship, package, sponsor, timing, audience, founder)

### Content-to-Money Translator (`maxContentToMoney.ts`)
- 6 input types: article, source-note, social-post, video-clip, interview, event
- Output: whatTheContentIs, whoTheAudienceIs, whatSponsorWouldBuy, whatFounderShouldPackage, whatAssetToCreate, whatToAvoid, followUpAngle, possibleVerticals, oneLinePitchStarter
- `buildContentToMoneyText()` — formats for clipboard copy
- `detectVerticals()` — auto-detects HipHopHaven, MusicHaven, HavenSports, HavenLA, LocalHaven from keyword signals

---

## MaxCROInboxView — 12 Tabs

| Tab | Contents |
|-----|---------|
| **Quick Read** | All items as compact QuickReadCards — decision, money type, effort, timing, one-tap actions. Mobile-first. |
| **Source Intake** | Paste source text, select brand/silo, add Founder note. Revenue signal preview. Memory status panel. |
| **Inbox** | All items with full CROItemCard. Daily Executive Money Brief at top. |
| **Priority** | Score ≥ 50 or Max Review Drafted / Founder Review Required. |
| **Founder Cmds** | 10 Founder Commands dispatched against top-scored or selected source. |
| **Content → $** | Content-to-Money Translator — paste any content idea, get revenue translation. |
| **Follow-Ups** | Add Follow-Up form + needsFollowUp tracker + Inbox follow-up items. |
| **Sponsors** | Sponsor Category Browser matched to current inbox text. |
| **Offline Plays** | Items with offline money play signals. |
| **Ignore** | Items marked Ignore / No Money Move. |
| **Founder Review** | Items flagged for Founder decision. |
| **Founder Context** | Context Quality panel + full Founder Context editor. |

---

## CROItemCard — Intelligence Panels

Each reviewed item card has 5 expandable intelligence panels (toggle buttons):

| Panel | Contents |
|-------|---------|
| **CRO Review** | 8-section Max review (sponsor, relationship, content-to-revenue, brand partnership, offline play, what to ignore, Founder next move, risk note) |
| **Judgment** | Money type, effort, timing, decision, why, Founder next move, what Max would not do, sports read |
| **Max Asks** | 8 targeted strategy questions by category — tap to mark answered |
| **Deal Lens** | Business risk review — risk level, flags, clean path, what to protect |
| **Buffett** | Durable/Repeatable/Builds Equity/Compounds Relationships/Is Noise checklist + verdict |

---

## Features by Task

### T2 — Max Voice Engine
All copy in judgment, commands, and panels uses deterministic voice phrases. No generic dashboard language. 8 voice modes. Max sounds like a sharp Black media money executive.

### T3 — Founder Context Model
Local-first localStorage model (`hmg-newsroom-max-founder-context-v1`). Seeded with safe public career record. Founder configures: sponsor prefs, no-go categories, vertical priorities, pricing notes, relationship notes, past wins, voice preferences. Editable in Founder Context tab.

### T4 — Judgment Engine
`runJudgment()` — classifies money type, effort, timing, decision. Produces voice-native copy for why, next move, and what Max would not do. Sports read added probabilistically (1-in-3) to keep it sharp without being forced.

### T5 — Max Questions Panel
`generateMaxQuestions()` — 8 targeted questions by category based on money type and judgment. Tap to mark answered. Copy or Save to Output History (`max-strategy-questions`).

### T6 — Content-to-Money Translator
`translateContentToMoney()` — takes text + content type, returns structured revenue translation. Available in dedicated "Content → $" tab. Copy and Save to Output History (`max-content-to-money`).

### T7 — Deal Lawyer Lens
`runDealLawyerLens()` — checks rights language, overpromise, bad optics, sponsor mismatch, offline terms, exclusivity scope. Returns risk level (Low/Medium/High/Flag), flags, clean path, what to protect. Honest: "Business risk review — not legal advice." Copy and Save to Output History (`max-risk-review`).

### T8 — Buffett Filter
`runBuffettFilter()` — checks durability, repeatability, equity building, relationship compounding, noise level. Returns verdict in Buffett-patient voice. Copy and Save to Output History (`max-buffett-filter`).

### T9 — Sports Money Lens
`getMaxSportsRead()` in maxVoiceEngine.ts + maxJudgmentEngine.ts. 12 sports analogies. Appears in Judgment Panel when applicable (1-in-3 probabilistic). Includes analogy, meaning, and Founder action.

### T10 — Quick Read Mode
New "Quick Read" tab at front of War Room. QuickReadCard: decision badge, 3-column grid (money type, effort, timing), Max verdict copy, one-tap actions (Send to Max, Copy Read, Mark Ignore, Founder Review).

### T11 — Founder Commands
New "Founder Cmds" tab. 10 commands:
1. Is this money or noise?
2. What's the sponsor angle?
3. What should I ignore?
4. What's the relationship play?
5. Turn this into a package
6. Give me the quick read
7. What would Max do?
8. What would Max not do?
9. Give me the Buffett read
10. Give me the deal-lawyer read

Each command runs `runFounderCommand()` against the top-scored or selected reviewed source.

### T12 — Daily Executive Money Brief
`DailyExecutiveBriefPanel` — upgraded to "Max Daily Executive Money Brief". Generates on-demand. Shows counts + 7 sections (best sponsor angle, relationship play, content-to-revenue, offline play, what to ignore, Founder next move, risk/reputation warning). Copy and Save to Output History (`max-executive-money-brief`).

### T13 — Memory Health / Context Quality
`ContextQualityPanel` in Founder Context tab. Shows quality label (Empty/Basic/Useful/Strong), score (0–90), what Max knows, what Max still needs, and how missing pieces hurt recommendations. Uses founder-facing language — no nerd jargon.

### T14 — Command Center Max Upgrade
`MaxRevenueCard` upgraded with: money/noise read, context quality indicator (Empty/Basic/Useful/Strong), best current money move, Founder next action, truth labels. No pipeline board. Open Max War Room button retained.

### T15 — Haven AI Engine Max Clarity
`MaxRevenueBrainSection` now shows:
- "Max can review content for revenue angles — sponsor, relationship, package, or offline play."
- "Max can help decide what to chase, package, ignore, or follow up on."
- "Max does not send emails or contact sponsors. All output is for Founder review."
- "Max is local intelligence until Old Soldier / Ollama is wired."
- "Founder Context" label instead of "Max Memory". Updated truth labels ("Future Old Soldier / Ollama Hook Pending").

### T16 — Output History Expansion
New output kinds added to `useOutputHistory.ts` and `OutputHistory.tsx`:
- `max-strategy-questions` — Max Asks (HelpCircle icon, "Strategy Q" label)
- `max-risk-review` — Deal Lawyer Lens (ShieldAlert icon, "Risk Review" label)
- `max-buffett-filter` — Buffett Filter (TrendingUp icon, "Buffett" label)
- `max-executive-money-brief` — Daily Executive Brief (Star icon, "Exec Brief" label)
- `max-content-to-money` — Content → $ (FileText icon, "Content → $" label)
- `max-judgment` — Judgment Panel (Zap icon, "Judgment" label)

### T17 — Max Chat Surface
No existing Max chat/avatar/voice surface found. Skipped as instructed. Quick Read tab + Founder Commands tab serve the mobile-first, low-friction interaction pattern intended by this task.

---

## Fake-Claim Sweep

All new panels and engines carry honest truth labels:

| Label | Applied Where |
|-------|--------------|
| Local Max Intelligence | All CRO panels, Judgment, Buffett, Deal Lawyer, Content→$ |
| Founder Review Required | Source Intake, Priority, Founder Review tab |
| No Outreach Sent | Follow-Ups tab, all follow-up cards |
| No CRM Connected | MaxRevenueCard, HavenAI section, Follow-Ups |
| No Fake Deal Status | Judgment panel, CROItemCard |
| No Email Sent | Follow-up cards |
| Business risk review — not legal advice | Deal Lawyer Lens panel (inline) |
| Future Old Soldier / Ollama Hook Pending | HavenAI Engine section |
| Local Storage Only | Founder Context tab |
| No Cloud Sync | Founder Context tab |
| No Real Contacts | Sponsor Category Browser |

No fake AI responses. No fake model calls. No fake CRM data. No fake outreach sent confirmations.

---

## What Is Real Now

- Deterministic revenue signal detection from text (keyword + count weighting)
- Deterministic money type classification (7 types)
- Deterministic founder effort classification (5 levels)
- Deterministic timing classification (5 reads)
- Deterministic decision engine (Chase/Watch/Package/Delegate/Ignore)
- Voice-native copy for all judgment outputs (8 voice modes, phrase pools)
- Sports analogies keyed to decision + effort (12 analogies, probabilistic application)
- Deal lawyer business risk review (5 risk categories, flag-based)
- Buffett filter (5 investment quality checks)
- 10 Founder Commands (dispatched against judgment output)
- Content-to-money translation (6 content types)
- Founder Context model (7 scored fields, localStorage)
- Context quality scoring (Empty/Basic/Useful/Strong, 0–90 points)
- 8 targeted Max strategy questions per source
- Quick Read mode (mobile-first compact cards)
- Daily Executive Money Brief generation
- Output History integration (6 new output kinds)
- Command Center and Haven AI Engine updated with founder-facing language

---

## What Is Future (Old Soldier / Ollama Hooks)

- Live model responses to Founder Commands
- Ollama local model integration for Max voice
- Real-time contextual suggestions from conversation history
- Live relationship database (contacts, warmth, status)
- Live CRM integration
- Live email / outreach dispatch
- Live sponsor database (real contacts, real brands)

All future hooks are clearly labeled "Future Old Soldier/Ollama Hook Pending" in the UI.

---

## Typecheck + Build

- TypeScript typecheck: **PASS** — zero errors
- Production build: `pnpm --filter @workspace/hmg-newsroom run build` — **PASS**
- Output: `artifacts/hmg-newsroom/dist/public/`

## Archives

| Archive | Contents |
|---------|---------|
| `hmg-newsroom-max-before-black-money-brain-2026-06-06.tar.gz` | Checkpoint before this pass (1MB) |
| `hmg-newsroom-max-black-money-brain-pass-2026-06-06.tar.gz` | Final archive after this pass |
