# BOLT FINAL PREMIUM — 1-CLICK APPLY CHECKLIST

## Step 0 — Before You Start
- [ ] You are in the FULL Replit source tree (not the Bolt thin branch)
- [ ] You have git clean status or know how to rollback
- [ ] You have the tarball: `HMG_NEWSROOM_BOLT_FINAL_PREMIUM_EDITORIAL_HANDOFF_LOCKED.tar.gz`

## Step 1 — Copy ONLY These 4 Files
Extract the tarball and copy these exact files to these exact paths:

- [ ] `src/lib/hmg/editorial/editorialPlaybooks.ts` → CREATE (new file)
- [ ] `src/components/hmg/editorial/EditorialBrain.tsx` → OVERWRITE
- [ ] `src/components/hmg/editorial/FounderVoiceGate.tsx` → OVERWRITE
- [ ] `src/components/newsroom/QuickLaunchView.tsx` → OVERWRITE

## Step 2 — Do NOT Copy These
- [ ] Do NOT copy `package.json`
- [ ] Do NOT copy `tsconfig.json` or `tsconfig.base.json`
- [ ] Do NOT copy `vite.config.ts`
- [ ] Do NOT copy any file under `src/components/ui/`
- [ ] Do NOT copy any thin-branch stub or placeholder file
- [ ] Do NOT copy any `.bolt/` or `.env` file
- [ ] Do NOT copy any markdown/doc file into the source tree

## Step 3 — Run Full-Source Typecheck
```bash
npx tsc --noEmit
```
- [ ] No NEW errors caused by the 4 copied files
- [ ] Pre-existing errors are acceptable (they exist before this patch)

## Step 4 — Run Production Build
```bash
npm run build
```
- [ ] Build succeeds (or fails only on pre-existing issues)
- [ ] No new build errors from the 4 copied files

## Step 5 — Visual Inspection
- [ ] Open Quick Launch — verify "What are we shipping right now?" hero
- [ ] Verify Today's Command Path shows 4 tiles (Start from notes, Start from media, Resume saved work, Prepare WordPress draft)
- [ ] Verify Fast Lane strip (Notes → Draft → Visual → Clip → Social → WordPress)
- [ ] Verify status row shows Editorial Desk ready, WordPress status, saved draft count
- [ ] Open Editorial Desk — verify HMG Standard panel appears
- [ ] Select a different Haven silo — verify HMG Standard panel content changes
- [ ] Verify HMG Standard panel shows: mission, what-great-looks-like, angle guidance, source standard, headline standard, social/visual handoff, founder review triggers, publish-readiness warning
- [ ] Verify FounderVoiceGate shows 10 checks with progress bar
- [ ] Verify FounderVoiceGate unlock button is disabled until all 10 checks pass
- [ ] Double-tap a check — verify "why this matters" expands

## Step 6 — Functional Verification
- [ ] Verify FounderVoiceGate export lock blocks export until all checks pass
- [ ] Verify selecting a different Haven silo changes HMG Standard panel content
- [ ] Verify no public "ArtBot" or "CutMaster" labels were introduced (only "WebArt" and "WebEdit" should appear)
- [ ] Verify WordPress status still works (connection status shows in Quick Launch)
- [ ] Verify last-view restore still works (navigate away and back to Quick Launch)

## Step 7 — Done
If all boxes are checked, the apply is complete. If any box fails, see `BOLT_FINAL_PREMIUM_ROLLBACK.md`.
