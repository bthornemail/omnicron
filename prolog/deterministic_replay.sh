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

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPDATE="${1:-}"

cd "$ROOT_DIR"

./prolog/run_rule_source.sh >/dev/null
./prolog/export_polyform_bitboards.sh >/dev/null

OUT_FILE="prolog/deterministic_replay.sha256"
TMP_FILE="/tmp/deterministic_replay.sha256.tmp"

# Stable artifact set (ordered intentionally).
sha256sum \
  prolog/omnicron-rule-source.org \
  prolog/omnicron-rule-source.extracted.candidates.logic \
  prolog/omnicron-rule-source.extracted.logic \
  prolog/omnicron-rule-source.run.validation.log \
  prolog/omnicron-rule-source.run.log \
  prolog/omnitron_declarations.lx \
  polyform/bitboards/rules_selected.logic \
  polyform/bitboards/rules_golden.bitboard \
  polyform/bitboards/rules_negative.bitboard > "$TMP_FILE"

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
