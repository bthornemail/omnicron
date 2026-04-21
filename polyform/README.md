# Polyform Toolbox

This directory is the polyform projection toolbox rooted in bitboard authority.

Canonical flow:

```text
bitboard -> polyform object -> geometry -> PNG witness
```

Authority rule:

- `bitboard` is authoritative input.
- `attributes/geometries/objects/transformations` are deterministic projections.
- carrier families (`aztec`, `maxi`, `beecode`, `code16k`) classify encoding style.
- `code16k` mode switching (`barcode`, `polyform`, `polygon`) changes projection only.

Folders:

- `attributes/`: normalized metadata and provenance JSON.
- `geometries/`: NDJSON polygon/rect geometry packets.
- `objects/`: normalized bitboards and PNG witness artifacts.
- `transformations/`: Lisp transform records for projection mode/state.
- `patterns/`: non-authoritative reference pattern assets.
  - generated from `.logic` rules via deterministic derivation.

Tooling:

- `node polyform/scripts/polyform_toolbox.mjs build <bitboard> <object_id> <carrier> [mode]`
- `node polyform/scripts/polyform_toolbox.mjs derive-patterns <rules.logic> <pattern_prefix>`
- `node polyform/scripts/polyform_toolbox.mjs verify <object_id>`
- `make polyform-toolbox` (sample build from `rules_golden.bitboard`)
- `make verify-polyform-toolbox`
