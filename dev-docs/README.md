# Dev Documentation System

This directory is your working documentation lab.  
Canonical, stable docs live in `docs/`.

## Structure

`dev-docs` is split into two major views:

- `front-end/`: conceptual, mathematical, reference, visual, and archive material.
- `back-end/`: executable/runtime-oriented material, organized by OSI-style layers.

## How to use this split

- Put evolving research notes, experiments, and rough design in `dev-docs/`.
- Promote mature docs to `docs/reference/` when they become project truth.
- Keep executable sources in code directories (`logic/`, `riscv-baremetal/`, etc.), not in docs.

## Start Here

1. Read [DOC_WRITING_PLAYBOOK.md](/root/omnicron/dev-docs/DOC_WRITING_PLAYBOOK.md).
2. Keep front-end narratives in [front-end/README.md](/root/omnicron/dev-docs/front-end/README.md).
3. Keep runtime/build/system docs in [back-end/README.md](/root/omnicron/dev-docs/back-end/README.md).
4. Use [DOC_TEMPLATE.md](/root/omnicron/dev-docs/back-end/00-shared/DOC_TEMPLATE.md) for new technical docs.

## Documentation goal

Your docs should make a new contributor able to answer:

- What is the system?
- What are the hard invariants?
- How does one byte move through the runtime?
- How do I run and verify it?
- What fails fast, and why?

