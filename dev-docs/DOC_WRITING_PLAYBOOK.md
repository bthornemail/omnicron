# Documentation Writing Playbook

This is the practical method for documenting this project in a way that others can execute.

## Core rule

Write docs from runtime truth, not from idea-first prose.

That means:

1. State the invariant.
2. Show the byte/stream path.
3. Show the command that proves it.
4. Show expected success and failure output.

## Required sections for technical docs

Use this order:

1. **Purpose**
2. **Invariants** (must/never rules)
3. **Data path** (input -> phases -> output)
4. **Commands** (copy/paste runnable)
5. **Failure modes** (fail-fast conditions and error codes)
6. **References** (2-6 links/paths max)

## Writing style that works for this project

- Prefer concrete byte ranges and symbols over abstract claims.
- Prefer deterministic examples over broad theory.
- Declare boundaries explicitly (for example: unary vs structural phase).
- Put one source of truth for each rule.

## Doc quality checklist

Before marking a doc complete:

- [ ] At least one runnable command is included.
- [ ] At least one failure case is included.
- [ ] All byte/symbol boundaries are explicit.
- [ ] No contradictory terminology (`pre-header` vs `header8`) in same file.
- [ ] File paths are valid in this repo.

## Promotion checklist (`dev-docs` -> `docs/reference`)

- [ ] Rule text is stable and verified.
- [ ] No TODO placeholders remain.
- [ ] Language is implementation-neutral where possible.
- [ ] Linked commands/checks pass in CI or local reproducible flow.

## Common mistakes to avoid

- Mixing conceptual and runtime layers in one paragraph.
- Explaining without showing commands.
- Using different names for the same phase boundary.
- Documenting desired behavior instead of current behavior.

