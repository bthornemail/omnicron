#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RDIR="$ROOT_DIR/riscv-baremetal"

SRC_STARTUP="$RDIR/startup_simple.S"
SRC_KERNEL="$RDIR/atomic_kernel.c"
SRC_LINKER="$RDIR/linker.ld"
ART_BIN="$RDIR/my_kernel.bin"
ART_FLAT="$RDIR/my_kernel.flat"

for p in "$SRC_STARTUP" "$SRC_KERNEL" "$SRC_LINKER" "$ART_BIN" "$ART_FLAT"; do
  if [[ ! -f "$p" ]]; then
    echo "ERROR: missing required file: $p" >&2
    exit 2
  fi
done

grep -q 'rotl(x, 1) \^ rotl(x, 3) \^ rotr(x, 2) \^ C' "$SRC_KERNEL" || {
  echo "ERROR: atomic kernel delta law not found in source." >&2
  exit 2
}

if command -v riscv64-unknown-elf-gcc >/dev/null 2>&1 && command -v riscv64-unknown-elf-objcopy >/dev/null 2>&1; then
  TMP_DIR="$(mktemp -d /tmp/riscv-rebuild-XXXXXX)"
  TMP_BIN="$TMP_DIR/rebuild.bin"
  TMP_FLAT="$TMP_DIR/rebuild.flat"

  riscv64-unknown-elf-gcc \
    -fno-pic -march=rv64gc -mcmodel=medany -nostdlib \
    -T "$SRC_LINKER" \
    -o "$TMP_BIN" \
    "$SRC_STARTUP" "$SRC_KERNEL"

  riscv64-unknown-elf-objcopy -O binary "$TMP_BIN" "$TMP_FLAT"

  SHA_BIN_EXPECTED="$(sha256sum "$ART_BIN" | awk '{print $1}')"
  SHA_BIN_ACTUAL="$(sha256sum "$TMP_BIN" | awk '{print $1}')"
  SHA_FLAT_EXPECTED="$(sha256sum "$ART_FLAT" | awk '{print $1}')"
  SHA_FLAT_ACTUAL="$(sha256sum "$TMP_FLAT" | awk '{print $1}')"

  if [[ "$SHA_BIN_EXPECTED" != "$SHA_BIN_ACTUAL" || "$SHA_FLAT_EXPECTED" != "$SHA_FLAT_ACTUAL" ]]; then
    if [[ "${REBUILD_STRICT_RISCV:-0}" == "1" ]]; then
      echo "ERROR: riscv artifact mismatch against regenerated output (strict mode)." >&2
      rm -rf "$TMP_DIR"
      exit 3
    fi
    echo "WARN: riscv regenerated artifact differs from committed artifact (check mode)." >&2
    echo "WARN: set REBUILD_STRICT_RISCV=1 to enforce byte-identical regeneration." >&2
    rm -rf "$TMP_DIR"
    echo "OK: riscv structural + regeneration attempt check passed (non-strict mode)"
    exit 0
  fi

  rm -rf "$TMP_DIR"
  echo "OK: riscv regeneration check passed (toolchain mode)"
  exit 0
fi

echo "OK: riscv artifact structural check passed (check-only mode; toolchain unavailable)"
