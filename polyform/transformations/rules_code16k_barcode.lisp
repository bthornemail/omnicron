;; projection-only transform record
(polyform-transform
  (id rules_code16k_barcode)
  (carrier code16k)
  (code16k-mode barcode)
  (authority bitboard)
  (source-bitboard "/root/omnicron/polyform/bitboards/rules_selected.logic")
  (source-bitboard-sha256 "6f8dc3380487073c0695090913b9f81fa2c2f6fa3aebdaa641241e6711857be5")
  (geometry-sha256 "9f2104023d3a6bfe10c13c81831ae3dbd596e3ccd777caccfd4f8b405580ccb9")
  (active-cell-count 256)
  (pipeline (bitboard canonical geometry render-packet projection)))
