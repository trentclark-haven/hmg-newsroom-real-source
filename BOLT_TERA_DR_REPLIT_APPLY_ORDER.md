# BOLT TERA — DR. REPLIT APPLY ORDER

## Step 1: Run the apply script
```bash
chmod +x APPLY_BOLT_TERA_EDITORIAL.sh
./APPLY_BOLT_TERA_EDITORIAL.sh src
```

## Step 2: Verify no protected files were touched
```bash
git diff --name-only | grep -E "Home\.tsx|MenuOverlay|QuickLaunch|ArtBot|CutMaster" || echo "PROTECTED FILES OK"
```

## Step 3: Run typecheck
```bash
npx tsc --noEmit
```
Expected: No NEW errors beyond pre-existing thin-branch issues.

## Step 4: Run production build
```bash
npm run build
```

## Step 5: Wire new views into routing (ReplitFocusQuad owns this)
- Add `WordPressPublishView` import to Home.tsx
- Add `OutputHistoryView` import to Home.tsx
- Add route cases for the new views
- The views accept `{ onSelectView }` prop compatible with existing pattern

## Step 6: Visual inspection
- [ ] Editorial Desk: verify 6 stages (Notes, Angle, Sources, Draft, Package, Publish)
- [ ] Editorial Desk: verify readiness rail shows 7 indicators
- [ ] Social Factory: verify compact source tray with 4 source types
- [ ] Social Factory: verify campaign composer and platform previews
- [ ] WordPress Publish: verify honest blocked state when not connected
- [ ] WordPress Publish: verify readiness checklist at bottom
- [ ] Output History: verify brand and content type filters
- [ ] Output History: verify continue-in-X actions work

## Step 7: Forbidden string sweep
```bash
grep -rn "CutMaster\|ArtBot" src/components/newsroom/SocialFactoryView.tsx src/components/newsroom/WordPressPublishView.tsx src/components/newsroom/OutputHistoryView.tsx src/lib/hmg/editorial/editorialPlaybooks.ts src/lib/hmg/editorial/editorialStages.ts src/components/hmg/editorial/EditorialBrain.tsx
# Expected: no matches in public-facing strings
```

## Rollback if needed
```bash
git checkout -- src/lib/hmg/editorial/editorialPlaybooks.ts src/lib/hmg/editorial/index.ts src/components/hmg/editorial/EditorialBrain.tsx src/components/hmg/editorial/FounderVoiceGate.tsx src/components/newsroom/SocialFactoryView.tsx
rm src/lib/hmg/editorial/editorialStages.ts src/components/newsroom/WordPressPublishView.tsx src/components/newsroom/OutputHistoryView.tsx
```
