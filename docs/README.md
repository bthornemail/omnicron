# Docs Policy

`docs/` is the canonical home for stable project documentation.

Rules:

- Authoritative or reference docs should live under `docs/reference/`.
- `dev-docs/` is allowed for mutable research notes and in-progress ideas.
- Executable declarative sources remain code and stay in place:
  - `.org` pipeline inputs
  - `.logic`, `.pl`, `.lx`
  - runtime/tool code (`.c`, `.h`, `.mjs`, `.js`, `.sh`)

Promotion flow:

1. Draft in `dev-docs/` when exploratory.
2. Promote to `docs/` when the document becomes canonical or stable reference.
3. Update links in entry/authority docs to point at `docs/`.
