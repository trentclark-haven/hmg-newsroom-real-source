# BOLT TERA — ROLLBACK INSTRUCTIONS

## Method 1: Git Rollback (preferred)
```bash
git checkout -- src/lib/hmg/editorial/editorialPlaybooks.ts
git checkout -- src/lib/hmg/editorial/index.ts
git checkout -- src/components/hmg/editorial/EditorialBrain.tsx
git checkout -- src/components/hmg/editorial/FounderVoiceGate.tsx
git checkout -- src/components/newsroom/SocialFactoryView.tsx
rm src/lib/hmg/editorial/editorialStages.ts
rm src/components/newsroom/WordPressPublishView.tsx
rm src/components/newsroom/OutputHistoryView.tsx
```

## Method 2: Manual Rollback
Restore each file from backup or git history. Delete the 3 new files.

## Rollback Risk: NONE
- No database migrations
- No config changes
- No dependency changes
- No environment variable changes
- All data is localStorage-based (untouched by rollback)
