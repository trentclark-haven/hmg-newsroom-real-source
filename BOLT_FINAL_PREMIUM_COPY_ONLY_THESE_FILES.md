# BOLT FINAL PREMIUM — COPY ONLY THESE FILES

## The ONLY 4 source files to copy into the full Replit source tree:

```
src/lib/hmg/editorial/editorialPlaybooks.ts       → CREATE (new file)
src/components/hmg/editorial/EditorialBrain.tsx   → OVERWRITE
src/components/hmg/editorial/FounderVoiceGate.tsx  → OVERWRITE
src/components/newsroom/QuickLaunchView.tsx        → OVERWRITE
```

## That is the complete list. Nothing else from this package goes into the source tree.

## How to copy:
```bash
# Extract the tarball
tar xzf HMG_NEWSROOM_BOLT_FINAL_PREMIUM_EDITORIAL_HANDOFF_LOCKED.tar.gz

# Copy the 4 source files (adjust paths as needed)
cp artifacts/hmg-newsroom/src/lib/hmg/editorial/editorialPlaybooks.ts \
   src/lib/hmg/editorial/editorialPlaybooks.ts

cp artifacts/hmg-newsroom/src/components/hmg/editorial/EditorialBrain.tsx \
   src/components/hmg/editorial/EditorialBrain.tsx

cp artifacts/hmg-newsroom/src/components/hmg/editorial/FounderVoiceGate.tsx \
   src/components/hmg/editorial/FounderVoiceGate.tsx

cp artifacts/hmg-newsroom/src/components/newsroom/QuickLaunchView.tsx \
   src/components/newsroom/QuickLaunchView.tsx
```

## After copying:
- Run `npx tsc --noEmit` — expect no NEW errors
- Run `npm run build` — expect no NEW errors
- Visually inspect Quick Launch, Editorial Desk, and Founder Voice Gate

## If you copy ANYTHING else, you risk breaking the full source tree.
