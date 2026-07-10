# Bolt Vibranium Reinforcement — Risk Register

## Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| MenuOverlay group names changed | Low — display-only, no ID changes | All View IDs preserved; only group labels changed |
| QuickLaunchView status badges are heuristic | Low — badges use output history presence | WordPress Draft badge uses output history; other tiles default to "Ready" |
| Home.tsx Zap icon for QuickLaunch | Low — icon-only change | Falls back to activeMenu.icon for other views |
| FounderVoiceGate expanded to 8 checks | Low — additive, same interface | New checks default to unchecked; existing 6 checks preserved |
| EditorialBrain DNA panel uses brandId lookup | Low — brandId already available | Falls back to EDITORIAL_DNA.hmg if brandId not found |

## Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| EditorialBrain.tsx full overwrite | Medium — merge conflicts if diverged | Apply as overwrite; backup via git stash first |
| FounderVoiceGate prop interface changed | Medium — now accepts siloName, qualityScore | Both are optional props; existing callers still work |
| Source discipline textarea fields are uncontrolled | Medium — values not persisted to draft | Intentional: source discipline is a checklist, not a draft field. Can be wired later. |
| Quality meter values are heuristic | Medium — not tied to real scoring | Uses filledCount and selectedFactIds.length as proxies; honest about what it measures |

## High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Intelligence module API mismatch | High — if exports differ in full Replit source | Verify all named exports exist with same signatures before applying |
| brandVoiceProfiles module API mismatch | High — if getBrandVoiceProfile signature differs | Verify function exists and returns object with name, toneLabel |

## Not A Risk

- FounderVoiceCheck.tsx deletion: NOT deleted, still used by SocialFactoryView
- View ID changes: None — all route IDs preserved
- Package.json: Preinstall guard restored to original
- Stub packages: Not copied
- Backend/API: Not touched
- Database: Not touched
- RLS policies: Not touched
