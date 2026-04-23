# AGENTS

This file provides quick operational guidance for contributors and coding agents.

## Canonical Runtime/Test Entry

- Build host tools: `make`
- Core tests: `make test test-pair-machine test-polylog`
- WordNet synset graph test: `make test-wordnet-synset-graph`

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
