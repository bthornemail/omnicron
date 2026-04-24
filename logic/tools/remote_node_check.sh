#!/usr/bin/env bash
set -euo pipefail

# SOURCE-OF-TRUTH NOTE
#
# STATUS: REMOTE NODE CONGRUENCE GATE
#
# Purpose:
# - Provide one command for decentralized node health/gate checks.
# - Enforce fail-fast behavior on the first invariant violation.
# - Emit a compact machine-readable receipt for coordination.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODE="${1:-quick}"
RECEIPT="${2:-$ROOT_DIR/logic/generated/remote_node_check.ndjson}"

if [[ "$MODE" != "quick" && "$MODE" != "full" ]]; then
  echo "Usage: $0 [quick|full] [receipt_path]" >&2
  exit 64
fi

mkdir -p "$(dirname "$RECEIPT")"

HOSTNAME_SHORT="$(hostname -s 2>/dev/null || hostname || echo unknown)"
TIMESTAMP_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
GIT_REV="$(git -C "$ROOT_DIR" rev-parse HEAD 2>/dev/null || echo unknown)"

if [[ "$MODE" == "quick" ]]; then
  STAGES=(
    "make verify-preheader-congruence"
    "make verify-endian-compatibility"
    "make test-pair-machine"
  )
else
  STAGES=(
    "make verify-preheader-congruence"
    "make verify-endian-compatibility"
    "make test-pair-machine"
    "make test test-polylog"
    "make test-wordnet-synset-graph"
  )
fi

PASS_COUNT=0
LAST_STAGE=""

run_stage() {
  local cmd="$1"
  LAST_STAGE="$cmd"
  echo "INFO: running [$cmd]"
  if (cd "$ROOT_DIR" && eval "$cmd"); then
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "ERROR: stage failed -> $cmd" >&2
    cat > "$RECEIPT" <<EOF
{"type":"remote_node_check","mode":"$MODE","timestamp_utc":"$TIMESTAMP_UTC","node":"$HOSTNAME_SHORT","git_rev":"$GIT_REV","status":"NOT_CONGRUENT","passed_stages":$PASS_COUNT,"failed_stage":"$cmd","clock_7_factorial":5040}
EOF
    echo "NOT_CONGRUENT (failed at: $cmd)"
    echo "receipt=$RECEIPT"
    exit 2
  fi
}

for cmd in "${STAGES[@]}"; do
  run_stage "$cmd"
done

cat > "$RECEIPT" <<EOF
{"type":"remote_node_check","mode":"$MODE","timestamp_utc":"$TIMESTAMP_UTC","node":"$HOSTNAME_SHORT","git_rev":"$GIT_REV","status":"CLOCK_CONGRUENT","passed_stages":$PASS_COUNT,"failed_stage":null,"clock_7_factorial":5040}
EOF

echo "CLOCK_CONGRUENT (7!=5040 gate set passed)"
echo "receipt=$RECEIPT"
