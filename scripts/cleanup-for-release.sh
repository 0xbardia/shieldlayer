#!/usr/bin/env bash
# ShieldLayer — cleanup script for public release preparation
# Removes core dumps, logs, caches, and internal dev reports.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Phase 1: Cleaning up files ==="

# 1. Core dumps
echo "[1/6] Removing core dumps..."
rm -f core.1502*
echo "  Done."

# 2. Logs
echo "[2/6] Removing log files..."
rm -rf logs/
echo "  Done."

# 3. Python caches
echo "[3/6] Removing Python caches..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
rm -rf .pytest_cache
echo "  Done."

# 4. Internal dev reports
echo "[4/6] Removing internal dev reports..."
rm -f SERVER-ANALYSIS-REPORT.md
rm -f HERMES-REMEDIATION-REPORT.md
rm -f HERMES-POST-REMEDIATION-PROOF.md
rm -f FINAL-PRODUCTION-REPORT.md
rm -f FINAL-BLOCKER-RESOLUTION.md
rm -f FIX-COMPLETE-REPORT.md
rm -f FRONTEND-DIAGNOSIS.md
rm -f FULL-FIX-REPORT.md
rm -f DIAGNOSIS-PHASE1.md
rm -f REBRAND-REPORT.md
rm -f REDEPLOY-CHECKLIST.md
rm -f REDEPLOY-STEPS.md
rm -f PRODUCTION-HARDENING-COMPLETE.md
rm -f PRODUCTION-READINESS-AUDIT.md
rm -f CHAIN-MIGRATION-REPORT.md
rm -f AUDIT-REPORT.md
rm -f PROMPT.md
rm -f DEPLOYMENT-VERIFICATION.md
echo "  Done."

# 5. Build artifacts
echo "[5/6] Removing build artifacts..."
rm -rf test-results/
rm -f lighthouse-report.json
rm -f tsconfig.tsbuildinfo
echo "  Done."

# 6. Misc
echo "[6/6] Removing misc files..."
rm -rf .data/
rm -f .dev-ports.json
echo "  Done."

echo ""
echo "=== Cleanup complete ==="
echo "Remaining files:"
ls -la
