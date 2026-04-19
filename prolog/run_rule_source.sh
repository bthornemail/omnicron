#!/usr/bin/env bash
set -euo pipefail

# SOURCE-OF-TRUTH NOTE
#
# STATUS: EXECUTION HARNESS
#
# Purpose:
# - Treat omnicron-rule-source.org as the authoring source
# - Extract parser-safe Prolog-style rules/facts for the current polylog parser
# - Execute those extracted rules through polylog in --prolog mode
#
# This does not claim semantic completeness. It confirms what is executable
# today with the current prototype interpreter.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_FILE="${1:-$ROOT_DIR/prolog/omnicron-rule-source.org}"
POLYLOG_BIN="${2:-$ROOT_DIR/polylog}"
EXTRACTED_FILE="${3:-$ROOT_DIR/prolog/omnicron-rule-source.extracted.logic}"
RUN_LOG="${4:-$ROOT_DIR/prolog/omnicron-rule-source.run.log}"
CANDIDATE_FILE="${EXTRACTED_FILE%.logic}.candidates.logic"
VALIDATION_LOG="${RUN_LOG%.log}.validation.log"

if [[ ! -f "$SRC_FILE" ]]; then
  echo "ERROR: source file not found: $SRC_FILE" >&2
  exit 1
fi

if [[ ! -x "$POLYLOG_BIN" ]]; then
  echo "INFO: building polylog binary..."
  make -C "$ROOT_DIR" polylog >/dev/null
fi

# Phase 1: extract only top-level candidate declaration lines:
# - keep % comments
# - keep lines that start at column 0 with lowercase predicate heads
# - drop directives, prose, and indented rule-body fragments
awk '
  /^[[:space:]]*%/ { print; next }
  /^[[:space:]]*$/ { next }
  /^:-/ { next }
  /^[a-z][a-zA-Z0-9_]*[[:space:]]*\(.*\)[[:space:]]*:-.*\.[[:space:]]*$/ { print; next }
  /^[a-z][a-zA-Z0-9_]*[[:space:]]*\(.*\)[[:space:]]*\.[[:space:]]*$/ { print; next }
' "$SRC_FILE" > "$CANDIDATE_FILE"

if [[ ! -s "$CANDIDATE_FILE" ]]; then
  echo "ERROR: no declaration candidates extracted from $SRC_FILE" >&2
  exit 2
fi

# Phase 2: keep only lines that polylog can assert in isolation.
rm -f "$EXTRACTED_FILE" "$VALIDATION_LOG"
while IFS= read -r line; do
  if [[ -z "$line" ]]; then
    continue
  fi
  if [[ "$line" =~ ^% ]]; then
    printf '%s\n' "$line" >> "$EXTRACTED_FILE"
    continue
  fi

  probe="$(printf ':p\n%s\n:q\n' "$line" | "$POLYLOG_BIN" 2>&1 || true)"
  printf '%s\n' "$probe" >> "$VALIDATION_LOG"
  if grep -qE 'Fact asserted\.|Clause asserted\.' <<<"$probe"; then
    printf '%s\n' "$line" >> "$EXTRACTED_FILE"
  fi
done < "$CANDIDATE_FILE"

if [[ ! -s "$EXTRACTED_FILE" ]]; then
  echo "ERROR: no parser-safe declarations extracted from $SRC_FILE" >&2
  exit 3
fi

echo "INFO: candidate declarations -> $CANDIDATE_FILE"
echo "INFO: parser-safe declarations -> $EXTRACTED_FILE"
echo "INFO: validation log -> $VALIDATION_LOG"

"$POLYLOG_BIN" --prolog "$EXTRACTED_FILE" > "$RUN_LOG" 2>&1 || true

FACTS="$(grep -c 'Fact asserted\.' "$RUN_LOG" || true)"
CLAUSES="$(grep -c 'Clause asserted\.' "$RUN_LOG" || true)"
FAILS="$(grep -c 'Parse error\|Unexpected token\|Unbound variable' "$RUN_LOG" || true)"

echo "INFO: run log -> $RUN_LOG"
echo "INFO: facts asserted: $FACTS"
echo "INFO: clauses asserted: $CLAUSES"
echo "INFO: parser/runtime errors observed: $FAILS"

if [[ "$FAILS" -gt 0 ]]; then
  echo "WARN: extraction executed with errors; inspect $RUN_LOG"
  exit 4
fi

echo "OK: extracted rule source executed without parser/runtime errors."
