#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_LOG_TMP="/tmp/verify_bridge_fact_equivalence.run.log"
CANONICAL_TMP="/tmp/omnicron-rule-source.canonical.ndjson"
EXTRACTED="$ROOT_DIR/prolog/omnicron-rule-source.extracted.logic"

cd "$ROOT_DIR"

./prolog/run_rule_source.sh >"$RUN_LOG_TMP" 2>&1

grep -q 'extraction mode -> bridge canonical artifacts' "$RUN_LOG_TMP"

grep -Fqx 'barcode_trinity_mapping(maxicode, texture_object).' "$EXTRACTED"
grep -Fqx 'barcode_trinity_mapping(aztec_code, vertex_object).' "$EXTRACTED"
grep -Fqx 'barcode_trinity_mapping(beecode, query_object).' "$EXTRACTED"

if [[ ! -s "$CANONICAL_TMP" ]]; then
  echo "ERROR: missing canonical bridge artifact: $CANONICAL_TMP" >&2
  exit 2
fi

grep -q '"type":"canonical_artifact"' "$CANONICAL_TMP"
grep -q 'barcode_trinity_mapping(maxicode, texture_object)' "$CANONICAL_TMP"
grep -q 'barcode_trinity_mapping(aztec_code, vertex_object)' "$CANONICAL_TMP"
grep -q 'barcode_trinity_mapping(beecode, query_object)' "$CANONICAL_TMP"

echo "OK: bridge replay fact equivalence verified"
