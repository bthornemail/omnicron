# Byte to Dot Runtime

This document defines the deterministic host runtime path used during the
`omi-lisp` capability port into `omnicron`.

## Pipeline

```text
byte stream
  -> header8 runtime state update
  -> pre-header phase gate (UNARY vs STRUCTURAL)
  -> dot rewrite surface
  -> emit witness stream
```

Runtime modules:

- `logic/runtime/header8_runtime.mjs`
- `logic/runtime/dot_rewrite.mjs`

Verifier:

- `logic/verify/verify_preheader_congruence.mjs`

## Phase semantics

| Phase | Active range / trigger | Allowed interpretation |
|---|---|---|
| `UNARY` | Start of stream; remains active until first byte `> 0x2F` | Unary control units only |
| `STRUCTURAL` | Activated after boundary trigger | Structural syntax + atom/payload rewrite |

### Unary hard rule

During `UNARY` phase, structural interpretation is forbidden:

- `SP` (`0x20`)
- `.` (`0x2E`)
- `(` (`0x28`)
- `)` (`0x29`)

If a stream attempts structural interpretation in `UNARY`, verifier exits
non-zero on the first violation.

## Header8 congruence

Header8 canonical slots:

```text
[0]=0x00 [1]=0x1B [2]=0x1C [3]=0x1D [4]=0x1E [5]=0x1F [6]=input [7]=state
```

Fail-fast invariants:

1. Header commitment (`[0..5]`) must match canonical prefix.
2. Any expected per-step header must match computed runtime header.
3. First mismatch aborts verification immediately.

## CLI

```bash
node logic/verify/verify_preheader_congruence.mjs [--vectors <path>] [--parity-fixtures <path>] [--no-parity]
```

Exit codes:

- `0`: all vectors/parity fixtures passed
- non-zero: first contract violation encountered

