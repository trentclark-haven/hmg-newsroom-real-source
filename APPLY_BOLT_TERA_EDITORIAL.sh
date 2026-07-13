#!/bin/bash
# APPLY_BOLT_TERA_EDITORIAL.sh
# Idempotent apply script for the Bolt Tera Editorial and Publishing Build.
# Never overwrites WebArt, WebEdit, Quick Launch, Home shell, or navigation files.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="${SCRIPT_DIR}/artifacts/hmg-newsroom/src"
TARGET_DIR="${1:-src}"

if [ ! -d "${TARGET_DIR}" ]; then
  echo "ERROR: Target directory '${TARGET_DIR}' does not exist."
  echo "Usage: $0 <target-src-dir>"
  echo "Example: $0 src"
  exit 1
fi

echo "=== Bolt Tera Editorial and Publishing Build ==="
echo "Source: ${SOURCE_DIR}"
echo "Target: ${TARGET_DIR}"
echo ""

# --- PROTECTED FILES (never overwrite) ---
PROTECTED=(
  "components/newsroom/QuickLaunchView.tsx"
  "components/newsroom/MenuOverlay.tsx"
  "pages/Home.tsx"
  "pages/FounderLogin.tsx"
  "components/newsroom/ArtBotView.tsx"
  "components/newsroom/CutMasterView.tsx"
  "App.tsx"
  "main.tsx"
  "index.css"
)

for f in "${PROTECTED[@]}"; do
  if [ -f "${TARGET_DIR}/${f}" ]; then
    echo "PROTECTED: ${f} (will not be touched)"
  fi
done
echo ""

# --- FILES TO COPY ---
declare -A FILES
FILES=(
  ["lib/hmg/editorial/editorialStages.ts"]="NEW"
  ["lib/hmg/editorial/editorialPlaybooks.ts"]="OVERWRITE"
  ["lib/hmg/editorial/index.ts"]="OVERWRITE"
  ["components/hmg/editorial/EditorialBrain.tsx"]="OVERWRITE"
  ["components/hmg/editorial/FounderVoiceGate.tsx"]="OVERWRITE"
  ["components/newsroom/SocialFactoryView.tsx"]="OVERWRITE"
  ["components/newsroom/WordPressPublishView.tsx"]="NEW"
  ["components/newsroom/OutputHistoryView.tsx"]="NEW"
)

echo "Applying ${#FILES[@]} files..."
echo ""

for file in "${!FILES[@]}"; do
  action="${FILES[$file]}"
  src="${SOURCE_DIR}/${file}"
  dst="${TARGET_DIR}/${file}"

  if [ ! -f "${src}" ]; then
    echo "SKIP: ${file} (source not found in package)"
    continue
  fi

  # Create parent directories
  mkdir -p "$(dirname "${dst}")"

  if [ "${action}" = "NEW" ] && [ -f "${dst}" ]; then
    echo "EXISTS: ${file} (already present — skipping to preserve existing)"
    continue
  fi

  cp "${src}" "${dst}"
  echo "COPY: ${file} (${action})"
done

echo ""
echo "=== Apply complete ==="
echo ""
echo "Next steps:"
echo "  1. Run: npx tsc --noEmit"
echo "  2. Run: npm run build"
echo "  3. Visually inspect Editorial Desk, Social Factory, WordPress Publish, Output History"
echo "  4. Verify no ArtBot/CutMaster labels in public UI"
echo ""
echo "Rollback: git checkout -- <file> for each copied file"
