#!/usr/bin/env bash
set -euo pipefail

# SOURCE-OF-TRUTH NOTE
#
# STATUS: BRIDGE GENERATOR
#
# Purpose:
# - Take parser-safe logic declarations produced by polylog flow
# - Project them into deterministic bitboards for the polyform layer
# - Emit a golden board (selected rules) and a negative board (bitwise inverse)
#
# Default input is the validated extraction from run_rule_source.sh.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT_FILE="${1:-$ROOT_DIR/prolog/omnicron-rule-source.extracted.logic}"
OUT_DIR="${2:-$ROOT_DIR/polyform/bitboards}"
WIDTH_BITS=256
WORDS=8 # 8 * 32-bit words

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "ERROR: input file not found: $INPUT_FILE" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

GOLDEN_FILE="$OUT_DIR/rules_golden.bitboard"
NEGATIVE_FILE="$OUT_DIR/rules_negative.bitboard"
RULESET_FILE="$OUT_DIR/rules_selected.logic"

cp "$INPUT_FILE" "$RULESET_FILE"

declare -a words
for ((i=0; i<WORDS; i++)); do
  words[$i]=0
done

rule_count=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  [[ "$line" =~ ^% ]] && continue

  # Deterministic hash -> bit index
  idx="$(printf '%s' "$line" | cksum | awk -v w="$WIDTH_BITS" '{print $1 % w}')"
  widx=$((idx / 32))
  bidx=$((idx % 32))
  words[$widx]=$(( words[$widx] | (1 << bidx) ))
  rule_count=$((rule_count + 1))
done < "$INPUT_FILE"

emit_grid() {
  local -n arr=$1
  for ((row=0; row<16; row++)); do
    line=""
    for ((col=0; col<16; col++)); do
      bit=$((row * 16 + col))
      w=$((bit / 32))
      b=$((bit % 32))
      if (( (arr[$w] >> b) & 1 )); then
        line+="#"
      else
        line+="."
      fi
    done
    printf '%s\n' "$line"
  done
}

{
  printf '# POLYFORM GOLDEN BITBOARD\n'
  printf '# Generated from: %s\n' "$INPUT_FILE"
  printf '# Rule count: %d\n' "$rule_count"
  printf '# Width bits: %d\n' "$WIDTH_BITS"
  for ((i=0; i<WORDS; i++)); do
    printf 'WORD_%d=0x%08X\n' "$i" "${words[$i]}"
  done
  printf 'GRID_16x16:\n'
  emit_grid words
} > "$GOLDEN_FILE"

declare -a neg
for ((i=0; i<WORDS; i++)); do
  neg[$i]=$(( (~words[$i]) & 0xFFFFFFFF ))
done

{
  printf '# POLYFORM NEGATIVE BITBOARD\n'
  printf '# Generated from: %s\n' "$INPUT_FILE"
  printf '# Rule count (source): %d\n' "$rule_count"
  printf '# Width bits: %d\n' "$WIDTH_BITS"
  for ((i=0; i<WORDS; i++)); do
    printf 'WORD_%d=0x%08X\n' "$i" "${neg[$i]}"
  done
  printf 'GRID_16x16:\n'
  emit_grid neg
} > "$NEGATIVE_FILE"

echo "INFO: selected rules -> $RULESET_FILE"
echo "INFO: golden bitboard -> $GOLDEN_FILE"
echo "INFO: negative bitboard -> $NEGATIVE_FILE"
echo "INFO: rules projected: $rule_count"
