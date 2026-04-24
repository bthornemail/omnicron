# Endian Compatibility Matrix

This verifier exists because endianness is a first-class feature in this
runtime, not an implementation accident.

## Purpose

Validate deterministic behavior across byte-order types used by the
multi-channel interpreter:

- `u16` (BOM/control windows)
- `u32` (state words)
- `u64` (lane/runtime words)

## Contract

Vectors are defined in:

- `logic/sources/endian_compatibility_vectors.ndjson`

Schema:

- `logic/contracts/endian_compatibility.schema.json`

Verifier:

- `logic/verify/verify_endian_compatibility.mjs`

CLI:

```bash
node logic/verify/verify_endian_compatibility.mjs [--vectors <path>]
```

Make target:

```bash
make verify-endian-compatibility
```

## Invariants

For each vector:

1. Value encodes to exact expected byte sequence in declared order (`BE`/`LE`).
2. Decode with same order must roundtrip exactly.
3. Byte-swap result must match expected swapped hex when provided.
4. Opposite-endian decode must differ when `expect_cross_decode_unequal=true`.

These checks are fail-fast and deterministic.
