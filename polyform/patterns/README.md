# Polyform Patterns (Derived)

This folder is derivation-only.

Rules:

- No imported reference diagrams are authoritative here.
- Pattern bitboards are generated from `.logic` facts.
- Canonical generator:
  - `node polyform/scripts/polyform_toolbox.mjs derive-patterns <logic_file> <prefix>`

Current derived artifacts include:

- `<prefix>.aztec.bitboard`
- `<prefix>.maxi.bitboard`
- `<prefix>.beecode.bitboard`
- `<prefix>.code16k.bitboard`
- `<prefix>.manifest.ndjson`
