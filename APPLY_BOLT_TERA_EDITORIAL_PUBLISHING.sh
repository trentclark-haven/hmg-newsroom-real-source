#!/bin/bash
# APPLY_BOLT_TERA_EDITORIAL_PUBLISHING.sh
# Idempotent apply script for the Bolt Tera Editorial and Publishing Build.
# Never overwrites WebArt, WebEdit, Quick Launch, Home shell, or navigation files.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_BASE="${SCRIPT_DIR}/artifacts/hmg-newsroom/src"
TARGET_BASE="${1:-src}"
BACKUP_DIR="${SCRIPT_DIR}/.bolt-tera-backups/$(date -u +%Y%m%dT%H%M%S)"

# --- Guard: refuse to run when artifacts/hmg-newsroom is missing ---
if [ ! -d "${SCRIPT_DIR}/artifacts/hmg-newsroom" ]; then
  echo "ERROR: artifacts/hmg-newsroom/ not found. Run from the repository root."
  exit 1
fi

# --- Guard: refuse to run when target is missing ---
if [ ! -d "${TARGET_BASE}" ]; then
  echo "ERROR: Target directory '${TARGET_BASE}' does not exist."
  echo "Usage: $0 <target-src-dir>"
  exit 1
fi

echo "=== Bolt Tera Editorial and Publishing Build ==="
echo "Source: ${SOURCE_BASE}"
echo "Target: ${TARGET_BASE}"
echo "Backup: ${BACKUP_DIR}"
echo ""

# --- PROTECTED FILES (never touch) ---
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
  if [ -f "${TARGET_BASE}/${f}" ]; then
    echo "PROTECTED: ${f} (will not be touched)"
  fi
done
echo ""

# --- FILES TO COPY ---
declare -A FILES
FILES=(
  ["lib/hmg/editorial/editorialStages.ts"]="CREATE"
  ["lib/hmg/editorial/editorialPlaybooks.ts"]="OVERWRITE"
  ["lib/hmg/editorial/index.ts"]="OVERWRITE"
  ["components/hmg/editorial/EditorialBrain.tsx"]="OVERWRITE"
  ["components/hmg/editorial/FounderVoiceGate.tsx"]="OVERWRITE"
  ["components/newsroom/SocialFactoryView.tsx"]="OVERWRITE"
  ["components/newsroom/WordPressPublishView.tsx"]="CREATE"
  ["components/newsroom/OutputHistoryView.tsx"]="CREATE"
)

mkdir -p "${BACKUP_DIR}"

echo "Applying ${#FILES[@]} files..."
echo ""

ALL_OK=true
for file in "${!FILES[@]}"; do
  action="${FILES[$file]}"
  src="${SOURCE_BASE}/${file}"
  dst="${TARGET_BASE}/${file}"

  if [ ! -f "${src}" ]; then
    echo "SKIP: ${file} (source not found in package)"
    ALL_OK=false
    continue
  fi

  # Create parent directories
  mkdir -p "$(dirname "${dst}")"

  # Backup existing file before overwrite
  if [ "${action}" = "OVERWRITE" ] && [ -f "${dst}" ]; then
    mkdir -p "$(dirname "${BACKUP_DIR}/${file}")"
    cp "${dst}" "${BACKUP_DIR}/${file}"
    echo "BACKUP: ${file} -> ${BACKUP_DIR}/${file}"
  fi

  # Skip if CREATE and file already exists
  if [ "${action}" = "CREATE" ] && [ -f "${dst}" ]; then
    echo "EXISTS: ${file} (already present — skipping to preserve existing)"
    continue
  fi

  cp "${src}" "${dst}"

  # Verify SHA-256
  src_hash=$(sha256sum "${src}" | awk '{print $1}')
  dst_hash=$(sha256sum "${dst}" | awk '{print $1}')

  if [ "${src_hash}" = "${dst_hash}" ]; then
    echo "COPY OK: ${file} (${action}) sha256=${src_hash:0:16}..."
  else
    echo "COPY FAIL: ${file} (hash mismatch)"
    ALL_OK=false
  fi
done

echo ""
if [ "${ALL_OK}" = "true" ]; then
  echo "=== Apply complete — all files verified ==="
else
  echo "=== Apply completed with warnings ==="
fi
echo ""
echo "Next steps:"
echo "  1. Run: npx tsc --noEmit"
echo "  2. Run: npm run build"
echo "  3. Wire new views into Home.tsx routing (see BOLT_TERA_ROUTE_INTEGRATION.md)"
echo "  4. Visually inspect Editorial Desk, Social Factory, WordPress Publish, Output History"
echo ""
echo "Rollback: ./ROLLBACK_BOLT_TERA_EDITORIAL_PUBLISHING.sh"
