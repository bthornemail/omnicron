# AGENTS

This file provides quick operational guidance for contributors and coding agents.

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
- Remote decentralized gate (quick): `make remote-node-check`
- Remote decentralized gate (full): `make remote-node-check-full`

## Declarative Dev Environment (Guix)

- Pull channels: `guix pull -C guix/channels.scm`
- Core shell: `guix shell -m guix/manifest-core.scm`
- Core + editor shell: `guix shell -m guix/manifest-core.scm -m guix/manifest-editors.scm`

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
