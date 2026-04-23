# Dev Docs Policy

`dev-docs/` is mutable research space.
Canonical project documentation lives under `docs/`.

Classification rule:

- `code` stays in place:
  - files executed or parsed by build/runtime (`.c`, `.h`, `.mjs`, `.js`, `.pl`, `.logic`, runtime-loaded `.lisp`)
  - `.org` files used as pipeline inputs (for example `logic/omnicron-rule-source.org`)
- `docs` should be copied/promoted to `docs/` when canonicalized:
  - `.md`, `.pdf`, `.svg`, `.txt`, `.rst`
  - non-executable design notes, references, specifications

Domain folders:

- `barcodes/`
- `polyforms/`
- `logic/`
- `math/`
- `hardware/`
- `reference/`
- `archive/`

Enforcement:

- `make verify-doc-layout` must pass.
- `docs/reference/` must exist and remain the canonical documentation root.
- `temp-docs/` is deprecated and must not contain active documentation.
