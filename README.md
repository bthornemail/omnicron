# OMICRON Repository

Canonical project reference lives at:

- [docs/reference/root/README.repo.md](/root/omnicron/docs/reference/root/README.repo.md)

## WordNet Synset Graph Test (Prolog)

Run:

```bash
make test-wordnet-synset-graph
```

This will:

1. Load Prolog test facts from `logic/sources/wordnet_synset_test.pl` using `polylog`.
2. Build a synset graph via `logic/tools/wordnet_prolog_to_synset_graph.mjs`.
3. Write `logic/generated/wordnet_synset_graph.ndjson`.

The generated graph object includes:

- `type: "wordnet_synset_graph"`
- synset `nodes`
- `hypernym` `edges`

## OMI-Lisp Surface Test

Run:

```bash
make test-omi-lisp-surface
```

This checks:

- S-expression lambda surface + Y combinator form acceptance
- F-expression surface (`lambda(x)->...`, function-call form)
- M-expression surface (current parser form)
- Z-combinator recursion behavior (currently marked as a known runtime gap unless it evaluates to `120`)

ASCII substrate lexer gate:

```bash
make verify-ascii-substrate-lexer
```

This verifies the substrate profile:

- `0x00..0x1F` unary control units
- `0x20..0x2F` dot-notation/system structural lane
- `0x30..0x3F` logic glyph lane (`0..9 : ; < = > ?`)

GED event selector to substrate tree gate:

```bash
make verify-ged-ascii-substrate
```

This verifies deterministic mapping from GED 32-bit event mask (`bits 0..3`) to
an ASCII substrate configuration tree and checks fail-fast behavior for reserved
bits (`4..31`).

## Pre-Header vs Header8 (Critical Rule)

- `pre-header` is the unary bootstrap phase (pre-Lisp).
- `header8` is the runtime typecaster/query surface (post-boot).

Unary bootstrap rule:

- While consuming the first three ASCII rows (`0x00..0x2F`), tokens are treated as unary control points only.
- In this phase, `SP` (`0x20`) and `.` (`0x2E`) are **not** structural syntax.
- Only after the pre-header consumption boundary is reached may `SP`, `.`, and other structural characters be interpreted as Lisp syntax.

Fail-fast verifier:

```bash
make verify-preheader-congruence
```

Endian/cross-target verifier:

```bash
make verify-endian-compatibility
```

Multi-emulator smoke matrix (RISC-V runtime + x86_64/aarch64 init + optional big-endian init):

```bash
make verify-multi-emulator-smoke
```

This emits `logic/generated/multi_emulator_smoke.ndjson` and includes
additional lanes (`riscv32`, `arm`, `microblaze`, `esp32-s3` probe via xtensa).
If a binary or machine type is unavailable on the current host, the lane is
recorded as deterministic `SKIP` in the report.

Strict mode (every lane required):

```bash
make verify-multi-emulator-smoke-strict
```

Custom required lane policy (declarative CI/node profile):

```bash
OMI_REQUIRED_LANES="substrate_gates,qemu_binaries,qemu_riscv64_runtime,qemu_esp32s3_init" \
  ./logic/verify/verify_multi_emulator_smoke.sh
```

Decentralized node congruence gate:

```bash
make remote-node-check
```

Mixed-base render proof-of-concept (Aegean header + Braille payload):

```bash
make poc-mixedbase-render
```

Header8-gated mixed-base render PoC (unary pre-header consumed first):

```bash
make poc-mixedbase-header8-render
```

Boot-to-presentation integration reference:

- [docs/reference/logic/OMI_LISP_BOOT_TO_PRESENTATION.md](/root/omnicron/docs/reference/logic/OMI_LISP_BOOT_TO_PRESENTATION.md)

## Federated Logic Delivery Packet

Generate and verify the first reconstructive packet:

```bash
make logic-packet-v0
make verify-logic-packet-replay
```

This creates a small packet that rebuilds an artifact from a seed, LUT entries,
rewrite steps, and a pre-header witness instead of sending the finished artifact
as the source of authority.

Reference:

- [docs/reference/logic/FEDERATED_LOGIC_DELIVERY.md](/root/omnicron/docs/reference/logic/FEDERATED_LOGIC_DELIVERY.md)

## Declarative Guix Dev Environment

Use the new declarations under `guix/`:

```bash
guix pull -C guix/channels.scm
guix shell -m guix/manifest-core.scm
```

Optional editor layer:

```bash
guix shell -m guix/manifest-core.scm -m guix/manifest-editors.scm
```

Rendering / logic-CAD layer with OpenGL, OpenGL ES/WebGL-adjacent tooling, and
polyform projection support:

```bash
guix shell -m guix/manifest-core.scm -m guix/manifest-rendering.scm
make verify-rendering-env
```

Reference guide:

- [dev-docs/back-end/99-build/guix-declarative-dev-environment.md](/root/omnicron/dev-docs/back-end/99-build/guix-declarative-dev-environment.md)
- [docs/reference/polyform/LOGIC_CAD_RENDERING_ENV.md](/root/omnicron/docs/reference/polyform/LOGIC_CAD_RENDERING_ENV.md)
