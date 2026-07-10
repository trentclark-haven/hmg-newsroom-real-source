# BOLT FINAL PREMIUM EDITORIAL — RISK REGISTER

## Risk Levels: LOW / MEDIUM / HIGH

| # | Risk | Level | Mitigation |
|---|------|-------|------------|
| 1 | editorialPlaybooks.ts import path mismatch | LOW | Uses `@/lib/hmg/editorial/editorialPlaybooks` which matches existing `@/lib/hmg/editorial/*` convention. If alias differs, adjust import. |
| 2 | EditorialBrain.tsx HmgStandardPanel replaces EDITORIAL_DNA | MEDIUM | Old EDITORIAL_DNA constant can remain as dead code or be removed. HmgStandardPanel subsumes all its functionality. If full source has additional uses of EDITORIAL_DNA, keep the constant. |
| 3 | FounderVoiceGate.tsx full rewrite | LOW | Props interface is backward compatible. If full source passes additional props, add them to the interface. |
| 4 | QuickLaunchView.tsx full rewrite | LOW | Props interface unchanged. Dependencies (mock-data, useOutputHistory, useWPSettings) are only imported, not modified. |
| 5 | framer-motion dependency in QuickLaunchView | LOW | Already used by existing QuickLaunchView. If not installed in full source, install `framer-motion`. |
| 6 | New lucide-react icons not in full source | LOW | All icons (ChevronDown, BookOpen, AlertOctagon, FileSearch, Palette, Scissors, Eye, etc.) are standard lucide-react exports. |
| 7 | localStorage access in FounderVoiceGate | LOW | Guarded with try/catch and typeof window check. Safe for SSR. |
| 8 | TypeScript strict mode errors | LOW | All new code is fully typed. No `any` types introduced. AngleType and GateStatus are exported types. |
| 9 | Forbidden string leakage | LOW | No external brand names used in any public UI strings, comments, or identifiers. All language is HMG-owned. |
| 10 | Performance impact of playbook lookups | LOW | getPlaybook() is a simple object lookup. useMemo prevents unnecessary re-computation. |

## Pre-Existing Risks (NOT caused by this pass)
- 108+ missing source files in thin-branch Bolt environment
- TS2307/TS7006/TS2322 errors from missing modules
- These are environment limitations, not code defects
