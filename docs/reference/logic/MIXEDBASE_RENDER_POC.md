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
