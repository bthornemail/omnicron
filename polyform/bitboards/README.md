# Polyform Rule Bitboards

## Coreform Authority (v0.1)

Coreform construction in the bitboards lane is `.logic`-first:

- authoritative source: `coreform_chain.logic`
- mandatory chain:
  - `truth_table -> karnaugh -> gate_net -> carry_lookahead`
- linked-list form:
  - `node/2` + `next/2`

Downstream surfaces are derived witnesses only:

```text
coreform_chain.logic -> canonical_artifact (NDJSON) -> render_packet -> SVG/WebGL/OpenGL
```

`verify_coreform_chain.mjs` validates:

- single root
- strict linear chain with no skips
- deterministic ordering
- stable unique address bindings
- deterministic projection derivation

These files are generated from the parser-safe rule extraction path:

- source: `prolog/omnicron-rule-source.extracted.logic`
- generator: `prolog/export_polyform_bitboards.sh`
- command: `make bitboards`

Outputs:

- `rules_selected.logic` (the selected rule set)
- `rules_golden.bitboard` (positive/golden board)
- `rules_negative.bitboard` (bitwise inverse board)
- `control_graph_golden.bitboard` (control/substrate graph)
- `control_graph_negative.bitboard` (bitwise inverse control graph)
- `control_graph_overlay_aegean.bitboard` (Aegean + alias overlay graph)

Each board is a deterministic 256-bit projection of rule lines into 8x32-bit
words plus a 16x16 visual grid.
