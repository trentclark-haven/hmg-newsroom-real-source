# BOLT FINAL PREMIUM — FULL SOURCE TEST COMMANDS

## Run these in the FULL Replit source tree AFTER copying the 4 files.

## 1. Typecheck
```bash
npx tsc --noEmit
```
**Expected**: No NEW errors caused by the 4 copied files.
Pre-existing errors (if any) are acceptable.

### How to verify no new errors:
```bash
# Before copying: save baseline error count
npx tsc --noEmit 2>&1 | grep -c "error TS" > /tmp/before.txt

# After copying: compare
npx tsc --noEmit 2>&1 | grep -c "error TS" > /tmp/after.txt

# If after.txt > before.txt, investigate the new errors
diff /tmp/before.txt /tmp/after.txt
```

## 2. Production Build
```bash
npm run build
```
**Expected**: Build succeeds or fails only on pre-existing issues.

## 3. Forbidden String Sweep
```bash
# Verify no forbidden public labels were introduced
grep -rn "CutMaster\|ArtBot" \
  src/components/hmg/editorial/EditorialBrain.tsx \
  src/components/hmg/editorial/FounderVoiceGate.tsx \
  src/components/newsroom/QuickLaunchView.tsx \
  src/lib/hmg/editorial/editorialPlaybooks.ts
# Expected: no matches in public-facing strings
# Note: "cutmaster" and "artbot" as route IDs in onSelectView() calls are acceptable

grep -rn "provider\|endpoint\|fallback\|API diagnostics\|backend status\|fake connector\|local-only" \
  src/components/hmg/editorial/EditorialBrain.tsx \
  src/components/hmg/editorial/FounderVoiceGate.tsx \
  src/components/newsroom/QuickLaunchView.tsx \
  src/lib/hmg/editorial/editorialPlaybooks.ts
# Expected: no matches
```

## 4. Import Verification
```bash
# Verify the new file is importable
node -e "require('./src/lib/hmg/editorial/editorialPlaybooks.ts')" 2>&1 || \
  echo "Note: direct require may fail on .ts — use tsc instead"

# Verify no circular imports
npx tsc --noEmit --traceResolution 2>&1 | grep -i "circular" || echo "No circular imports"
```

## 5. Visual Inspection Checklist
```
[ ] Quick Launch loads with "What are we shipping right now?" hero
[ ] Today's Command Path shows 4 command tiles
[ ] Fast Lane strip shows 6-step publishing path
[ ] Status row shows Editorial Desk, WordPress, and draft count
[ ] Editorial Desk loads with HMG Standard panel
[ ] Switching Haven silo changes HMG Standard panel content
[ ] FounderVoiceGate shows 10 checks with progress bar
[ ] FounderVoiceGate unlock disabled until all 10 pass
[ ] Double-tap a check shows "why this matters"
[ ] No "ArtBot" or "CutMaster" labels visible in UI
[ ] WordPress connection status works
[ ] Last-view restore works (navigate away and back)
```

## 6. Smoke Test
```bash
# Start dev server and verify no runtime crashes
npm run dev
# Open browser, navigate to Quick Launch, click through each tile
# Check browser console for errors
```
