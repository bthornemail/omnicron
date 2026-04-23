# Omnitron Artifact Contract

This contract defines a minimal, deterministic interface for guest-side
software rendering and host-side dumb mirroring.

## Constitutional Split

Guest:
- computes canonical state
- derives bitboards/polyforms/frame cells
- optionally derives carrier geometry
- emits deterministic artifacts

Host:
- does not decide geometry
- does not run scene logic
- does not reinterpret semantics
- only displays/copies emitted artifacts

## Canonical Artifact Surfaces

1. Control witness: bitboard text
2. Raster witness: `PGM` (`P5`) or `PBM` (`P4`)
3. Structural witness: `SVG`
4. Proof witness: `NDJSON` receipts (one JSON object per line)
5. Binary witness: framed payload with fixed header

## C/POSIX Interface

Reference API:
- Header: `logic/omnitron_artifact_contract.h`
- Implementation: `logic/omnitron_artifact_contract.c`

Primary entrypoints:
- `omc_write_framebuffer_bin(...)`
- `omc_write_pgm_u8(...)`
- `omc_write_pbm_msb1(...)`
- `omc_svg_begin(...)` / `omc_svg_emit_cell(...)` / `omc_svg_end(...)`
- `omc_write_receipt_ndjson(...)`

## Binary Frame Header

`OMCFrameHeader` includes:
- magic/version
- artifact kind
- pixel format
- width/height/stride
- frame index
- payload length
- timestamp
- reserved fields for forward compatibility

The payload follows immediately after the header.

## Determinism Rules

- Guest owns derivation and geometry.
- Host is projection-only.
- Artifacts should be hashable and diffable.
- Replay chain:

```text
bytes -> replay -> frame_derivation -> artifact_emission -> display
```

## Canonicality Attestation

Canonicality definition:

```text
canonical_to_kernel := rebuildable end-to-end with no manual edits and deterministic outputs
```

Verifier contract:

```text
canonicality = pass(rebuild-all) && deterministic_outputs && provenance_complete
```

Render contract extension:

```text
render_contract_ok = render_packet_hash_ok && render_packet_schema_ok && render_packet_provenance_ok
```

Provenance gate:

- every canonical artifact used by render/replay must declare authoritative
  lineage (`bitboard_authority`, `coreform_logic`, or `sequence_root`)
- projection layers must not invent authority
- Canonical chain references SHALL use `FS`, `GS`, `RS`, and `US`
- aliases such as Position, Relation, Group, and Order MAY appear in
  commentary, but are non-authoritative

Backend parity policy:

- `polyform` is authority
- `render_packet` is transport witness
- `OpenGL/WebGL/SVG` are projection surfaces
- `framebuffer/readback` are witness outputs and never authority
