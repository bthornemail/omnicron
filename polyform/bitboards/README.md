# Polyform Rule Bitboards

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
