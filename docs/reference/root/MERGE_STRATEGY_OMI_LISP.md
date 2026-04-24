# Merge Strategy: OMI-Lisp into Omnicron

## Decision

`omnicron` is the single collaboration trunk.  
`omi-lisp` is imported as a pinned read-only snapshot under `third_party/omi-lisp/`.

## Authoritative Layers

1. **Contracts + verification**: `omnicron` (`logic/contracts`, `logic/verify`)
2. **Host runtime semantics**: `omnicron` (`logic/runtime`)
3. **Upstream semantic reference**: `third_party/omi-lisp/*` (read-only)

## Why selective merge (not hard merge)

- `omnicron` already has CI and deterministic verification flow.
- `omi-lisp` contributes stronger dot-notation/header8 semantics.
- Selective port reduces risk and preserves working collaboration baseline.

## Port policy

- Port behavior, not repository topology.
- New behavior must be encoded as:
  - contract schema,
  - fixture vectors,
  - fail-fast verifier,
  - CI gate.
- Any conflict resolves in favor of explicit machine-checkable contracts.

## Hard gate

`verify-preheader-congruence` is a required gate:

- Unary pre-header phase (`0x00..0x2F`) is consumed as control units.
- Structural interpretation (`SP`, `.`, `(`, `)`) is forbidden in unary phase.
- Header/stream incongruence fails immediately (non-zero exit).

