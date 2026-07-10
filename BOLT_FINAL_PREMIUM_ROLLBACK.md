# BOLT FINAL PREMIUM — ROLLBACK

## If the apply fails or causes issues, rollback in one of these ways:

## Method 1: Git Rollback (preferred)
If you committed or staged the 4 files, restore from git:
```bash
git checkout -- src/components/hmg/editorial/EditorialBrain.tsx
git checkout -- src/components/hmg/editorial/FounderVoiceGate.tsx
git checkout -- src/components/newsroom/QuickLaunchView.tsx
rm src/lib/hmg/editorial/editorialPlaybooks.ts
```

## Method 2: Git Stash Rollback
If you used git stash before applying:
```bash
git checkout -- .
git stash pop
```

## Method 3: Manual Rollback
If you have the original files backed up:
```bash
# Restore original files from backup
cp /path/to/backup/EditorialBrain.tsx src/components/hmg/editorial/EditorialBrain.tsx
cp /path/to/backup/FounderVoiceGate.tsx src/components/hmg/editorial/FounderVoiceGate.tsx
cp /path/to/backup/QuickLaunchView.tsx src/components/newsroom/QuickLaunchView.tsx
rm src/lib/hmg/editorial/editorialPlaybooks.ts
```

## Method 4: Fresh Clone
If the working tree is corrupted:
```bash
# Clone fresh and start over
git clone <repo-url> fresh-clone
# Copy any other in-progress work, then replace the working directory
```

## After Rollback
```bash
# Verify the rollback is clean
npx tsc --noEmit
npm run build
# Confirm no new errors
```

## What to tell the team
"The Bolt premium editorial package was rolled back. The 4 files (editorialPlaybooks.ts, EditorialBrain.tsx, FounderVoiceGate.tsx, QuickLaunchView.tsx) have been restored to their pre-apply state. The package is still available in the tarball for a future attempt."

## Rollback Risk: NONE
- The package only touches 4 files
- No database migrations
- No config changes
- No dependency changes
- No environment variable changes
- Rollback is a simple file restore
