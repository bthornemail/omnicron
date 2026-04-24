#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT="$ROOT_DIR/logic/generated/multi_emulator_smoke.ndjson"
STRICT_MODE=0
REQUIRED_LANES_CSV="${OMI_REQUIRED_LANES:-substrate_gates,qemu_binaries,qemu_riscv64_runtime}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --report)
      REPORT="${2:-}"
      shift 2
      ;;
    --strict)
      STRICT_MODE=1
      shift
      ;;
    --required)
      REQUIRED_LANES_CSV="${2:-}"
      shift 2
      ;;
    *)
      # Backward compatible single positional report path.
      REPORT="$1"
      shift
      ;;
  esac
done

if [[ -z "${REPORT:-}" ]]; then
  echo "Usage: $0 [--report <path>] [--strict] [--required <csv_lane_ids>]" >&2
  exit 64
fi

mkdir -p "$(dirname "$REPORT")"

is_required_lane() {
  local id="$1"
  if [[ $STRICT_MODE -eq 1 ]]; then
    return 0
  fi
  IFS=',' read -r -a reqs <<< "$REQUIRED_LANES_CSV"
  for r in "${reqs[@]}"; do
    if [[ "$r" == "$id" ]]; then
      return 0
    fi
  done
  return 1
}

pass() {
  local id="$1"
  local detail="$2"
  printf '{"type":"multi_emulator_smoke","id":"%s","status":"PASS","detail":"%s"}\n' "$id" "$detail" >> "$REPORT"
  echo "PASS: $id"
}

skip() {
  local id="$1"
  local detail="$2"
  printf '{"type":"multi_emulator_smoke","id":"%s","status":"SKIP","detail":"%s"}\n' "$id" "$detail" >> "$REPORT"
  if is_required_lane "$id"; then
    echo "FAIL: $id :: required lane skipped ($detail)" >&2
    exit 2
  fi
  echo "SKIP: $id ($detail)"
}

fail() {
  local id="$1"
  local detail="$2"
  printf '{"type":"multi_emulator_smoke","id":"%s","status":"FAIL","detail":"%s"}\n' "$id" "$detail" >> "$REPORT"
  echo "FAIL: $id :: $detail" >&2
  exit 2
}

run_timeout_smoke() {
  local id="$1"
  local cmd="$2"
  local expect="$3"
  local out
  out="$(mktemp)"
  set +e
  timeout 8s bash -lc "$cmd" >"$out" 2>&1
  local rc=$?
  set -e

  # For long-running emulators, timeout(124) is expected if startup succeeded.
  if [[ $rc -ne 0 && $rc -ne 124 ]]; then
    local tail_out
    tail_out="$(tail -n 20 "$out" | tr '\n' ' ' | sed 's/"/\\"/g')"
    rm -f "$out"
    fail "$id" "rc=$rc tail=$tail_out"
  fi

  if [[ -n "$expect" ]]; then
    if ! grep -q "$expect" "$out"; then
      local tail_out
      tail_out="$(tail -n 30 "$out" | tr '\n' ' ' | sed 's/"/\\"/g')"
      rm -f "$out"
      fail "$id" "missing expected marker '$expect' tail=$tail_out"
    fi
  fi

  rm -f "$out"
  pass "$id" "startup smoke ok"
}

run_quiet_timeout_smoke() {
  local id="$1"
  local cmd="$2"
  local out
  out="$(mktemp)"
  set +e
  timeout 3s bash -lc "$cmd" >"$out" 2>&1
  local rc=$?
  set -e
  if [[ $rc -ne 0 && $rc -ne 124 ]]; then
    local tail_out
    tail_out="$(tail -n 20 "$out" | tr '\n' ' ' | sed 's/"/\\"/g')"
    rm -f "$out"
    fail "$id" "rc=$rc tail=$tail_out"
  fi
  rm -f "$out"
  pass "$id" "startup smoke ok"
}

machine_supported() {
  local bin="$1"
  local machine="$2"
  local out
  out="$(mktemp)"
  set +e
  timeout 3s "$bin" -machine help >"$out" 2>&1
  local rc=$?
  set -e
  if [[ $rc -ne 0 && $rc -ne 124 ]]; then
    rm -f "$out"
    return 1
  fi
  if grep -qE "^${machine}[[:space:]]" "$out"; then
    rm -f "$out"
    return 0
  fi
  rm -f "$out"
  return 1
}

: > "$REPORT"

echo "INFO: verifying substrate gates first"
(cd "$ROOT_DIR" && make verify-preheader-congruence verify-endian-compatibility verify-ged-ascii-substrate >/dev/null)
pass "substrate_gates" "preheader+endian+ged all pass"

echo "INFO: checking emulator availability"
command -v qemu-system-riscv64 >/dev/null || fail "qemu_riscv64_bin" "missing"
command -v qemu-system-x86_64 >/dev/null || fail "qemu_x86_64_bin" "missing"
command -v qemu-system-aarch64 >/dev/null || fail "qemu_aarch64_bin" "missing"
pass "qemu_binaries" "riscv64+x86_64+aarch64 present"

echo "INFO: smoke testing riscv runtime path"
run_timeout_smoke \
  "qemu_riscv64_runtime" \
  "cd '$ROOT_DIR' && ./riscv-baremetal/run_omicron.sh" \
  "OpenSBI"

echo "INFO: smoke testing alternate emulator initializations"
run_quiet_timeout_smoke \
  "qemu_x86_64_init" \
  "qemu-system-x86_64 -machine q35,accel=tcg -nographic -nodefaults -display none -monitor none -serial none -S"

run_quiet_timeout_smoke \
  "qemu_aarch64_init" \
  "qemu-system-aarch64 -machine virt -cpu cortex-a57 -nographic -nodefaults -display none -monitor none -serial none -S"

echo "INFO: smoke testing additional variant lanes"
if command -v qemu-system-riscv32 >/dev/null; then
  run_quiet_timeout_smoke \
    "qemu_riscv32_init" \
    "qemu-system-riscv32 -machine virt -bios none -nographic -nodefaults -display none -monitor none -serial none -S"
else
  skip "qemu_riscv32_init" "binary missing"
fi

if command -v qemu-system-arm >/dev/null; then
  run_quiet_timeout_smoke \
    "qemu_arm_init" \
    "qemu-system-arm -machine virt -nographic -nodefaults -display none -monitor none -serial none -S"
else
  skip "qemu_arm_init" "binary missing"
fi

if command -v qemu-system-microblaze >/dev/null; then
  run_quiet_timeout_smoke \
    "qemu_microblaze_init" \
    "qemu-system-microblaze -machine petalogix-s3adsp1800 -nographic -nodefaults -display none -monitor none -serial none -S"
else
  skip "qemu_microblaze_init" "binary missing"
fi

echo "INFO: smoke testing ESP32-S3 lane (if machine is available in this qemu build)"
if command -v qemu-system-xtensa >/dev/null; then
  if machine_supported qemu-system-xtensa esp32s3; then
    run_quiet_timeout_smoke \
      "qemu_esp32s3_init" \
      "qemu-system-xtensa -machine esp32s3 -nographic -nodefaults -display none -monitor none -serial none -S"
  else
    skip "qemu_esp32s3_init" "qemu-system-xtensa present, esp32s3 machine missing"
  fi
else
  skip "qemu_esp32s3_init" "binary missing"
fi

echo "INFO: optional big-endian emulators"
if command -v qemu-system-ppc64 >/dev/null; then
  run_quiet_timeout_smoke \
    "qemu_ppc64_init" \
    "qemu-system-ppc64 -machine pseries,accel=tcg -nographic -nodefaults -display none -monitor none -serial none -S"
else
  skip "qemu_ppc64_init" "binary missing"
fi

if command -v qemu-system-mips >/dev/null; then
  run_quiet_timeout_smoke \
    "qemu_mips_init" \
    "qemu-system-mips -machine malta -nographic -nodefaults -display none -monitor none -serial none -S"
else
  skip "qemu_mips_init" "binary missing"
fi

echo "OK: multi-emulator smoke checks complete"
echo "report=$REPORT"
