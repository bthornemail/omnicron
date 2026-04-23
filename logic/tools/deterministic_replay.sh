#!/usr/bin/env bash
set -euo pipefail

# SOURCE-OF-TRUTH NOTE
#
# STATUS: DETERMINISTIC REPLAY LOCK
#
# Purpose:
# - Rebuild rule-derived artifacts from omnicron-rule-source.org
# - Emit stable checksums for replay/security drift detection
# - Keep process minimal and deterministic (no extra orchestration)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
UPDATE="${1:-}"

cd "$ROOT_DIR"

./logic/tools/run_rule_source.sh >/dev/null
./logic/tools/export_polyform_bitboards.sh >/dev/null
./logic/tools/export_control_graph_bitboards.sh >/dev/null

OUT_FILE="logic/locks/deterministic_replay.sha256"
TMP_FILE="/tmp/deterministic_replay.sha256.tmp"

# Stable artifact set (ordered intentionally).
sha256sum \
  logic/sources/omnicron-rule-source.org \
  logic/generated/omnicron-rule-source.extracted.candidates.logic \
  logic/generated/omnicron-rule-source.extracted.logic \
  logic/generated/omnicron-rule-source.run.validation.log \
  logic/generated/omnicron-rule-source.run.log \
  logic/sources/omnitron_declarations.lx \
  polyform/bitboards/rules_selected.logic \
  polyform/bitboards/rules_golden.bitboard \
  polyform/bitboards/rules_negative.bitboard \
  polyform/bitboards/control_graph_golden.bitboard \
  polyform/bitboards/control_graph_negative.bitboard \
  polyform/bitboards/control_graph_overlay_aegean.bitboard > "$TMP_FILE"

if [[ "$UPDATE" == "--update" || ! -f "$OUT_FILE" ]]; then
  mv "$TMP_FILE" "$OUT_FILE"
  echo "OK: deterministic baseline written -> $OUT_FILE"
  exit 0
fi

if cmp -s "$TMP_FILE" "$OUT_FILE"; then
  rm -f "$TMP_FILE"
  echo "OK: deterministic replay matches baseline."
  exit 0
fi

echo "ERROR: deterministic replay drift detected."
echo "Diff:"
diff -u "$OUT_FILE" "$TMP_FILE" || true
rm -f "$TMP_FILE"
exit 2
