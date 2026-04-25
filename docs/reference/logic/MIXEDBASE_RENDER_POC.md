# Mixed-Base Render PoC (Aegean Header + Braille Payload)

This PoC demonstrates a higher-resolution projection path using symbolic mixed
bases:

- **Aegean (3 delimiters)** = control/header plane
- **Braille (8-dot cells)** = dense payload plane

Script:

- `polyform/org/scripts/mixedbase_stream_to_render_packet_ndjson.mjs`

Sample stream:

- `dev-docs/back-end/99-build/mixedbase_stream_sample.txt`

## Header model

The first three non-whitespace symbols must be Aegean delimiters:

- `𐄀` (`U+10100`)
- `𐄁` (`U+10101`)
- `𐄂` (`U+10102`)

PoC interpretation:

1. delimiter #1 -> chirality (`BE`/`LE`)
2. delimiter #2 -> scale multiplier (resolution step)
3. delimiter #3 -> palette selector

## Payload model

Remaining text is interpreted as Braille cells (`U+2800..U+28FF`).
Each Braille symbol expands to a **2x4 subcell block** (8-dot map), producing a
denser geometry stream than the base 16x16 bitboard surfaces.

## Binary256 software-adaptation model

This mixed-base stream can also be read as a software carrier inspired by the
IEEE 754 `binary256` interchange layout.

The goal is not to claim native hardware octuple precision. The goal is to
provide a symbolic, replayable software envelope for a 256-bit numeric or
geometric payload.

IEEE-style field analogy:

| Field | IEEE binary256 role | Mixed-base role |
|---|---:|---|
| sign | 1 bit | `HEADER8`/BOM chirality or one committed sign bit |
| exponent | 19 bits | Aegean header/exponent plane |
| significand | 236 stored bits, 237 precision with implicit lead bit | Braille dense payload plane |
| spare/check bits | format-dependent in this model | frame congruence, cohort, ECC, or render checksum |

Two useful encodings follow from this.

### Mode A: exact 256-bit Braille payload

```text
32 Braille cells x 8 bits = 256 bits
```

In this mode, the 32 Braille cells carry the complete 256-bit word. Aegean and
`HEADER8` are sideband frame metadata:

```text
HEADER8 frame + Aegean exponent/header + 32-cell Braille payload
```

This is best when the renderer needs an exact 256-bit payload and the stream
still needs external chirality, exponent, or provenance markers.

### Mode B: fielded symbolic binary256 envelope

In this mode, the sign/exponent/significand fields are split across symbolic
planes:

```text
HEADER8/BOM sign context
  + Aegean exponent/header bits
  + Braille significand bits
```

A practical field budget is:

| Carrier | Capacity | Use |
|---|---:|---|
| `HEADER8`/BOM | at least 1 committed bit | sign/chirality/context |
| 3 Aegean base-64 codepoints | 18 bits | exponent high payload |
| 1 committed frame bit | 1 bit | completes 19-bit exponent |
| 30 Braille cells | 240 bits | 236 stored significand bits + 4 spare bits |

This mode gives enough space for the binary256 field structure while leaving
four Braille bits for cohort selection, error checking, or render-plane
congruence.

The important distinction is:

- **Braille** gives dense byte-like payload capacity.
- **Aegean** gives readable header/exponent/governance structure.
- **HEADER8/BOM** gives runtime sign/chirality/type context.

That makes the stream a software substitute for unavailable native octuple
hardware support: arithmetic and comparison can be implemented with dot-notation
lists and LUT rewrites, while rendering can project the same framed value into
polyforms, barcodes, SVG, WebGL, or device surfaces.

## Run

Generate render packet NDJSON:

```bash
node polyform/org/scripts/mixedbase_stream_to_render_packet_ndjson.mjs \
  dev-docs/back-end/99-build/mixedbase_stream_sample.txt \
  /tmp/mixedbase.render_packet.ndjson
```

Render to SVG:

```bash
node polyform/org/scripts/org_render_packet_to_svg.mjs \
  /tmp/mixedbase.render_packet.ndjson \
  /tmp/mixedbase.svg
```

View in browser WebGL2 viewer:

```bash
cd polyform/org
python3 -m http.server 8080
# then open:
# http://localhost:8080/viewer/webgl2_viewer.html
# and load /tmp/mixedbase.render_packet.ndjson
```

## Header8-gated variant (closer to substrate)

This variant consumes the unary pre-header window (`0x00..0x2F`) through
`header8` runtime semantics before structural mixed-base decoding.

Script:

- `polyform/org/scripts/mixedbase_header8_stream_to_render_packet_ndjson.mjs`

Run:

```bash
make poc-mixedbase-header8-render
```

Artifacts:

- `/tmp/mixedbase_header8.render_packet.ndjson`
- `/tmp/mixedbase_header8.witness.ndjson`
- `/tmp/mixedbase_header8.svg`

The witness file records phase transition and final `header8` state so the
decode path is inspectable and replayable.

## Why this is useful

It proves the pipeline can:

- preserve deterministic projection contracts (`render_packet`)
- increase effective geometric resolution from symbolic streams
- treat endianness/chirality as active rendering control
- keep authority/projection separation intact (projection remains downstream)
- carry binary256-scale payloads as symbolic software frames without requiring
  native octuple-precision hardware
