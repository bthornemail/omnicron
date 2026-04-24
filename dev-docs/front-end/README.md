# Front-End Documentation

This section is for conceptual and representational material:

- mathematical framing,
- symbolic notation,
- diagrams and references,
- archive material.

Canonical production docs still live under `docs/`.

## Domain folders

- `barcodes/`
- `polyforms/`
- `logic/`
- `math/`
- `hardware/`
- `reference/`
- `archive/`

## Policy

- `dev-docs/` is mutable research space.
- Promote stable docs to `docs/reference/`.
- Keep executable source files outside docs folders.
- `make verify-doc-layout` must pass.

## How this connects to back-end docs

- Front-end answers “what it means.”
- Back-end answers “how it executes.”

Use both when writing a canonical document: meaning + runtime proof.
