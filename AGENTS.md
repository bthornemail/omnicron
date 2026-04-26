# AGENTS

This file provides quick operational guidance for contributors and coding agents.

## Carrier Architecture Doctrine

The Omi-Lisp system is a **carrier architecture** — meaning is canonical, glyph planes are transport surfaces.

### Three Carrier Layers

| Layer   | Range              | Role                              | Authority         |
| ------- | ------------------ | --------------------------------- | ------------------ |
| ASCII   | `0x00..0x7F`      | Bootstrap, syntax, control         | Law / Boot        |
| Aegean  | `U+10100..U+1013F`| Precision, exponent, numeric     | Measure / Magnitude|
| Braille | `U+2800..U+28FF`  | Dense payload, witness carrier   | Topology / Witness|

### Unified Packet Format

```text
[ASCII header][Aegean precision][Braille payload]
     ↓              ↓                  ↓
   control        measure           witness
```

### Carrier Independence Principle

> Meaning is canonical.
> Glyph planes are transport surfaces.
> No carrier is sovereign over truth.

- ASCII is not the truth — it is the boot surface, the law that starts the system
- Aegean is the measure layer — precision, exponent, magnitude
- Braille is the topology layer — dense structures, witnesses, fingerprints

### Geometry Witnesses

- **Braille cells** → encode adjacency, occupancy, graph structure
- **Aegean tiles** → encode metric class, exponent, magnitude
- **ASCII controls** → encode transitions, boundaries, mode shifts

### Self-Hosted Omi-Lisp Source

Omi-Lisp programs can be authored across all three planes:
- ASCII tokens = syntax, control
- Aegean numeric literals = precision
- Braille structural constants = topology

## Canonical Runtime/Test Entry

- Build host tools: `make`
- Core tests: `make test test-pair-machine test-polylog`
- WordNet synset graph test: `make test-wordnet-synset-graph`
- Multi-emulator smoke gate: `make verify-multi-emulator-smoke`
- Strict multi-emulator gate: `make verify-multi-emulator-smoke-strict`
- OMI-Lisp substrate surface test (ASCII S/F/M + Y/Z check): `make test-omi-lisp-surface`
- ASCII substrate lexer gate (`0x00..0x1F` unary, then `0x20/0x30` rows): `make verify-ascii-substrate-lexer`
- GED -> ASCII substrate configuration tree gate: `make verify-ged-ascii-substrate`
- Pre-header congruence gate: `make verify-preheader-congruence`
- Endian compatibility gate: `make verify-endian-compatibility`
- Mixed-base render PoC: `make poc-mixedbase-render`
- Header8-gated mixed-base render PoC: `make poc-mixedbase-header8-render`
- Federated logic packet replay: `make verify-logic-packet-replay`
- Remote decentralized gate (quick): `make remote-node-check`
- Remote decentralized gate (full): `make remote-node-check-full`

## Declarative Dev Environment (Guix)

- Pull channels: `guix pull -C guix/channels.scm`
- Core shell: `guix shell -m guix/manifest-core.scm`
- Core + editor shell: `guix shell -m guix/manifest-core.scm -m guix/manifest-editors.scm`
- Core + rendering shell: `guix shell -m guix/manifest-core.scm -m guix/manifest-rendering.scm`
- Full shell: `guix shell -m guix/manifest-core.scm -m guix/manifest-rendering.scm -m guix/manifest-editors.scm`
- Rendering environment gate: `make verify-rendering-env`

## Bootstrap Parsing Rule (Required)

- Do not conflate `pre-header` and `header8`.
- `pre-header` is unary bootstrap (pre-Lisp); `header8` is a runtime typecaster.
- While consuming `0x00..0x2F` during pre-header, treat tokens as unary control units only.
- In this phase, `SP` (`0x20`) and `.` (`0x2E`) are not structural syntax.
- Enable structural syntax only after pre-header completion.

## WordNet Synset Graph Path

The `test-wordnet-synset-graph` target runs this flow:

1. `polylog --prolog logic/sources/wordnet_synset_test.pl`
2. `node logic/tools/wordnet_prolog_to_synset_graph.mjs logic/sources/wordnet_synset_test.pl logic/generated/wordnet_synset_graph.ndjson`
3. Verifies graph type and hypernym relations in output NDJSON.

Artifacts:

- Source facts: `logic/sources/wordnet_synset_test.pl`
- Tool: `logic/tools/wordnet_prolog_to_synset_graph.mjs`
- Output: `logic/generated/wordnet_synset_graph.ndjson`

## Notes

- Keep generated artifacts under `logic/generated/`.
- Keep executable logic sources under `logic/sources/`.
- Stable reference docs live under `docs/reference/`.
- Pinned upstream semantic references live under `third_party/omi-lisp/` (read-only).
