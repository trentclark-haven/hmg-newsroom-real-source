#!/bin/bash
# ROLLBACK_BOLT_TERA_EDITORIAL_PUBLISHING.sh
# Restores files from the latest successful backup.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="${SCRIPT_DIR}/.bolt-tera-backups"
TARGET_BASE="${1:-src}"

if [ ! -d "${BACKUP_ROOT}" ]; then
  echo "ERROR: No backup directory found at ${BACKUP_ROOT}"
  echo "Nothing to roll back."
  exit 1
fi

# Find the latest backup
LATEST_BACKUP=$(ls -1d "${BACKUP_ROOT}"/*/ 2>/dev/null | sort | tail -1)

if [ -z "${LATEST_BACKUP}" ]; then
  echo "ERROR: No backup directories found in ${BACKUP_ROOT}"
  exit 1
fi

echo "=== Bolt Tera Rollback ==="
echo "Backup: ${LATEST_BACKUP}"
echo "Target: ${TARGET_BASE}"
echo ""

# Restore backed-up files
RESTORED=0
for backup_file in $(find "${LATEST_BACKUP}" -type f -name "*.ts" -o -name "*.tsx" 2>/dev/null); do
  rel_path="${backup_file#${LATEST_BACKUP}}"
  dst="${TARGET_BASE}/${rel_path}"
  if [ -f "${dst}" ]; then
    cp "${backup_file}" "${dst}"
    echo "RESTORED: ${rel_path}"
    RESTORED=$((RESTORED + 1))
  fi
done

# Delete files that were CREATE (not overwritten)
# These are the 3 new files that didn't exist before
NEW_FILES=(
  "lib/hmg/editorial/editorialStages.ts"
  "components/newsroom/WordPressPublishView.tsx"
  "components/newsroom/OutputHistoryView.tsx"
)

for f in "${NEW_FILES[@]}"; do
  dst="${TARGET_BASE}/${f}"
  if [ -f "${dst}" ]; then
    rm "${dst}"
    echo "REMOVED: ${f}"
  fi
done

echo ""
echo "=== Rollback complete ==="
echo "Restored ${RESTORED} file(s) from backup."
echo "Removed 3 new file(s) that were created by the apply."
