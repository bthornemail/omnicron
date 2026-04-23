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
