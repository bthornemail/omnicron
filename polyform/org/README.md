# tree-sitter-org

Org grammar for tree-sitter. Here, the goal is to implement a grammar that can
usefully parse org files to be used in any library that uses tree-sitter
parsers. It is not meant to implement emacs' orgmode parser exactly, which is
inherently more dynamic than tree-sitter easily allows.

## Overview

This section is meant to be a quick reference, not a thorough description.
Refer to the tests in `corpus` for examples.

- Top level node: `(document)`
- Document contains: `(directive)* (body)? (section)*`
- Section contains: `(headline) (plan)? (property_drawer)? (body)?`
- headline contains: `((stars), (item)?, (tag_list)?)`
- body contains: `(element)+`
- element contains: `(directive)* choose(paragraph, drawer, comment, footnote def, list, block, dynamic block, table)` or a bare `(directive)`
- paragraph contains: `(expr)+`
- expr contains: anonymous nodes for 'str', 'num', 'sym', and any ascii symbol that is not letters or numbers. (See top of grammar.js and queries for details)

Like in many regex systems, `*/+` is read as "0/1 or more", and `?` is 0 or 1.

## Example

```org
#+TITLE: Example

Some *marked up* words

* TODO Title
<2020-06-07 Sun>

  - list a
  - [-] list a
    - [ ] list b
    - [x] list b
  - list a

** Subsection :tag:

Text
```

Parses as:

```
(document [0, 0] - [16, 0]
  body: (body [0, 0] - [4, 0]
    directive: (directive [0, 0] - [1, 0]
      name: (expr [0, 2] - [0, 7])
      value: (value [0, 9] - [0, 16]
        (expr [0, 9] - [0, 16])))
    (paragraph [2, 0] - [3, 0]
      (expr [2, 0] - [2, 4])
      (expr [2, 5] - [2, 12])
      (expr [2, 13] - [2, 16])
      (expr [2, 17] - [2, 22])))
  subsection: (section [4, 0] - [16, 0]
    headline: (headline [4, 0] - [5, 0]
      stars: (stars [4, 0] - [4, 1])
      item: (item [4, 2] - [4, 12]
        (expr [4, 2] - [4, 6])
        (expr [4, 7] - [4, 12])))
    plan: (plan [5, 0] - [6, 0]
      (entry [5, 0] - [5, 16]
        timestamp: (timestamp [5, 0] - [5, 16]
          date: (date [5, 1] - [5, 11])
          day: (day [5, 12] - [5, 15]))))
    body: (body [6, 0] - [13, 0]
      (list [7, 0] - [12, 0]
        (listitem [7, 2] - [8, 0]
          bullet: (bullet [7, 2] - [7, 3])
          contents: (paragraph [7, 4] - [8, 0]
            (expr [7, 4] - [7, 8])
            (expr [7, 9] - [7, 10])))
        (listitem [8, 2] - [11, 0]
          bullet: (bullet [8, 2] - [8, 3])
          checkbox: (checkbox [8, 4] - [8, 7]
            status: (expr [8, 5] - [8, 6]))
          contents: (paragraph [8, 8] - [9, 0]
            (expr [8, 8] - [8, 12])
            (expr [8, 13] - [8, 14]))
          contents: (list [9, 0] - [11, 0]
            (listitem [9, 4] - [10, 0]
              bullet: (bullet [9, 4] - [9, 5])
              checkbox: (checkbox [9, 6] - [9, 9])
              contents: (paragraph [9, 10] - [10, 0]
                (expr [9, 10] - [9, 14])
                (expr [9, 15] - [9, 16])))
            (listitem [10, 4] - [11, 0]
              bullet: (bullet [10, 4] - [10, 5])
              checkbox: (checkbox [10, 6] - [10, 9]
                status: (expr [10, 7] - [10, 8]))
              contents: (paragraph [10, 10] - [11, 0]
                (expr [10, 10] - [10, 14])
                (expr [10, 15] - [10, 16])))))
        (listitem [11, 2] - [12, 0]
          bullet: (bullet [11, 2] - [11, 3])
          contents: (paragraph [11, 4] - [12, 0]
            (expr [11, 4] - [11, 8])
            (expr [11, 9] - [11, 10])))))
    subsection: (section [13, 0] - [16, 0]
      headline: (headline [13, 0] - [14, 0]
        stars: (stars [13, 0] - [13, 2])
        item: (item [13, 3] - [13, 13]
          (expr [13, 3] - [13, 13]))
        tags: (tag_list [13, 14] - [13, 19]
          tag: (tag [13, 15] - [13, 18])))
      body: (body [14, 0] - [16, 0]
        (paragraph [15, 0] - [16, 0]
          (expr [15, 0] - [15, 4]))))))
```

## Install

For manual install, use `make`.

For neovim, using `nvim-treesitter/nvim-treesitter`, add to your configuration:

```lua
local parser_config = require "nvim-treesitter.parsers".get_parser_configs()
parser_config.org = {
  install_info = {
    url = 'https://github.com/milisims/tree-sitter-org',
    revision = 'main',
    files = { 'src/parser.c', 'src/scanner.c' },
  },
  filetype = 'org',
}
```

To build the parser using npm and run tests:

1. Install node.js as described in the [tree-sitter documentation](https://tree-sitter.github.io/tree-sitter/creating-parsers#dependencies)
2. Clone this repository: `git clone https://github.com/milisims/tree-sitter-org` and `cd` into it
3. Install tree-sitter using npm: `npm install`
4. Run tests: `./node_modules/.bin/tree-sitter generate && ./node_modules/.bin/tree-sitter test`

## Omnicron Profile

This repository now includes an Omnicron-oriented query and corpus profile for
using org files as a higher-level deterministic language surface.

- Query profile: `queries/omnicron.scm`
- Corpus fixture: `corpus/omnicron_profile.tst`

The profile captures:

- protocol/front-matter directives (`#+OMNITRON_MODE`, `#+BARCODE_TRINITY`, etc.)
- headline scopes + tag lists
- source blocks used as executable payload surfaces
- property drawers as deterministic key/value headers
- checkbox checkpoints for replay/status workflows

## Structural/Semantic Seam

The intended architecture is:

```text
tree-sitter-org (structural pass)
-> org semantic interpreter/tangler (semantic pass)
-> canonical artifact emission
```

Responsibilities:

- `tree-sitter-org` owns syntax and addressability:
  headlines, directives, drawers, source boundaries, spans.
- semantic interpreter owns inheritance and meaning:
  property inheritance, `:source-file:`/`:source-directory:` resolution,
  tangle ordering, compile/receipt policy.

Bridge contract:

- Human-readable spec: `ORG_BRIDGE_SCHEMA.md`
- Machine-readable schema: `schema/org_bridge.schema.json`
- Version: `bridge_contract_v0_1`
- Frozen contract note: `BRIDGE_CONTRACT_v0_1.md`
- Change discipline: `BRIDGE_CHANGE_POLICY.md`

### Adapter script (query -> structural NDJSON)

Generate `org_structural_record` NDJSON from tree-sitter query captures:

```bash
node scripts/org_query_to_structural_ndjson.mjs <input.org> [output.ndjson]
```

Example:

```bash
cp corpus/omnicron_profile.tst /tmp/omnicron_profile.org
node scripts/org_query_to_structural_ndjson.mjs \
  /tmp/omnicron_profile.org \
  /tmp/org_structural.ndjson
```

Note: capture extraction works best when input path has `.org` extension; for
fixture `.tst` files, copy/symlink to `.org` first.

If no explicit Org source blocks are captured, the adapter emits one synthetic
`logic` block from candidate top-level predicate lines. This keeps bridge-first
runtime wiring active for legacy prose-heavy `.org` sources.

### Reducer script (structural -> resolved NDJSON)

Generate `resolved_org_block` NDJSON from structural records:

```bash
node scripts/org_structural_to_resolved_ndjson.mjs <input.ndjson> [output.ndjson]
```

Example:

```bash
node scripts/org_structural_to_resolved_ndjson.mjs \
  /tmp/org_structural.ndjson \
  /tmp/org_resolved.ndjson
```

This reducer computes deterministic `step_identity`, resolves source targets,
normalizes payload, derives `address_seed` + `virtual_address` +
`balanced_address` + `receipt_anchor`, and emits semantic fingerprints.

### Lowering script (resolved -> canonical artifact NDJSON)

Generate `canonical_artifact` NDJSON from resolved blocks:

```bash
node scripts/org_resolved_to_canonical_ndjson.mjs <input.ndjson> [output.ndjson]
```

Example:

```bash
node scripts/org_resolved_to_canonical_ndjson.mjs \
  /tmp/org_resolved.ndjson \
  /tmp/org_canonical.ndjson
```

Hard law: canonical artifacts are derived from resolved blocks only (no hidden
Org semantics downstream).

### Replay materialization (canonical -> runtime input)

Materialize replay-safe logic input from canonical artifacts:

```bash
node scripts/org_canonical_to_replay_input.mjs \
  /tmp/org_canonical.ndjson \
  /tmp/replay.logic \
  /tmp/replay.candidates.logic
```

This is the bridge-to-runtime handoff surface used by the replay harness.

### Coreform bitboards lane (`.logic` authority -> canonical witness)

Coreform construction authority lives in:

- `polyform/bitboards/coreform_chain.logic`

Coreform chain law:

```text
truth_table -> karnaugh -> gate_net -> carry_lookahead
```

with explicit linked predicates:

- `coreform_root/1`
- `node/2`
- `next/2`
- `stage/2`
- `derives_from/2`
- `virtual_address/2`
- `balanced_address/2`

Materialize canonical artifact from `.logic` authority:

```bash
node ../bitboards/coreform_logic_to_canonical_ndjson.mjs \
  ../bitboards/coreform_chain.logic \
  /tmp/coreform.canonical.ndjson
```

Then project as usual:

```bash
node scripts/org_canonical_to_render_packet_ndjson.mjs \
  /tmp/coreform.canonical.ndjson \
  /tmp/coreform.render_packet.ndjson
```

### Projection adapter (canonical -> render packet -> SVG)

Projection is downstream-only: render packets are derived from canonical
artifacts and carry no authority over replay truth.

Render packet schema:

- `schema/render_packet.schema.json`

Generate projection packets:

```bash
node scripts/org_canonical_to_render_packet_ndjson.mjs \
  /tmp/org_canonical.ndjson \
  /tmp/render_packet.ndjson
```

Render first packet to SVG:

```bash
node scripts/org_render_packet_to_svg.mjs \
  /tmp/render_packet.ndjson \
  /tmp/render_packet.svg
```

This defines the minimal downstream lane:

```text
canonical_artifact -> render_packet -> SVG/WebGL/OpenGL adapters
```

Normative authority split:

- canonical artifacts are authoritative
- render packets are derived witness artifacts
- viewers are non-authoritative projection surfaces
- interaction must not mutate canonical authority

Native OpenGL backend (GLFW + OpenGL 3.3 core):

```bash
make omnicron-viewer
./omnicron_viewer /tmp/render_packet.ndjson
```

The native viewer is projection-only and consumes `render_packet` directly.

Browser WebGL2 backend:

```bash
# 1) produce a packet
node scripts/org_canonical_to_render_packet_ndjson.mjs \
  /tmp/org_canonical.ndjson \
  /tmp/render_packet.ndjson

# 2) serve from polyform/org (or repo root)
cd /root/omnicron/polyform/org
python3 -m http.server 8080

# 3) open viewer
# http://localhost:8080/viewer/webgl2_viewer.html
# or pre-load via query:
# http://localhost:8080/viewer/webgl2_viewer.html?packet=/tmp/render_packet.ndjson
```

If browser fetch to `/tmp/...` is not available from your server root, use
`Load NDJSON` file picker in the viewer or copy the packet under the served
directory.

### Invariant verification matrix

Run the bridge authority-boundary checks:

```bash
npm run verify-bridge
```

Validate frozen golden canonical hash:

```bash
npm run verify-bridge-golden
```

This validates:

1. deterministic replay at canonical stage
2. semantic-noise rejection for non-authoritative metadata
3. end-to-end upstream source-noise rejection
4. routing witness mutation changes artifact identity
5. projection hints are non-authoritative
6. receipt-policy mutation does not alter canonical truth fields
7. parser-stable whitespace normalization (trailing spaces, blank lines)
8. structural mutation sensitivity (payload/order/scope/property changes)

Coreform-chain verifier:

```bash
make verify-coreform-chain
```

This validates single-root linked-chain authority, mandatory stage order,
deterministic address bindings, and deterministic `.logic -> canonical ->
render_packet -> svg` derivation.

### Local validation

Use the local CLI binary to avoid global version mismatches:

```bash
./node_modules/.bin/tree-sitter generate
./node_modules/.bin/tree-sitter test
```

If your Node version has `node-gyp` compatibility issues during `npm install`,
you can still validate grammar/query behavior with:

```bash
npm install --ignore-scripts
./node_modules/.bin/tree-sitter generate
./node_modules/.bin/tree-sitter test
```
