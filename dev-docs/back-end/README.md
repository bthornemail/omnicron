# Back-End Documentation

This section documents runtime execution, system behavior, and build/debug paths.

## Scope

Back-end docs answer:

- How does the machine boot and run?
- How does control/signaling move through layers?
- How do we build, debug, and verify behavior?

## Directory map

- [INDEX.md](/root/omnicron/dev-docs/back-end/INDEX.md) - layered navigation
- [00-shared/](/root/omnicron/dev-docs/back-end/00-shared) - templates and shared rules
- [99-build/](/root/omnicron/dev-docs/back-end/99-build) - reproducible commands first

## Suggested reading order

1. [99-build/bootable-runtime.md](/root/omnicron/dev-docs/back-end/99-build/bootable-runtime.md)
2. [99-build/decentralized-remote-workflow.md](/root/omnicron/dev-docs/back-end/99-build/decentralized-remote-workflow.md)
3. [06-presentation/how-it-connects.md](/root/omnicron/dev-docs/back-end/06-presentation/how-it-connects.md)
4. [01-physical/qemu-execution-guide.md](/root/omnicron/dev-docs/back-end/01-physical/qemu-execution-guide.md)
5. [99-build/gdb-usage.md](/root/omnicron/dev-docs/back-end/99-build/gdb-usage.md)

## Writing requirement

Every new back-end doc should include:

- invariant rules,
- byte/phase data path,
- runnable commands,
- fail-fast conditions.
