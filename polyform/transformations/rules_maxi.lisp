;; projection-only transform record
(polyform-transform
  (id rules_maxi)
  (carrier maxi)
  (code16k-mode barcode)
  (authority bitboard)
  (source-bitboard "/root/omnicron/polyform/bitboards/rules_selected.logic")
  (source-bitboard-sha256 "6f8dc3380487073c0695090913b9f81fa2c2f6fa3aebdaa641241e6711857be5")
  (geometry-sha256 "b375ec6ec0eb58bfd9a7178ebd51d2cb8090908a62ce5a54b8164302596410dc")
  (active-cell-count 256)
  (pipeline (bitboard canonical geometry render-packet projection)))
