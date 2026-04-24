# Back-End Index

Back-end documentation is organized as an OSI-style runtime stack.

## Layer map

- `00-shared/`: shared templates, cross-layer conventions.
- `01-physical/`: hardware/virtual hardware, CPU, memory, devices.
- `02-datalink/`: framing and link-level boundaries.
- `03-network/`: addressing and routing-level concerns.
- `04-transport/`: transport semantics and streams.
- `05-session/`: stateful channel/session concerns.
- `06-presentation/`: encoding/representation transformations.
- `07-application/`: application/runtime logic and APIs.
- `99-build/`: build, debug, tooling, and reproducible execution.

## Most important docs first

1. [99-build/bootable-runtime.md](/root/omnicron/dev-docs/back-end/99-build/bootable-runtime.md)
2. [99-build/decentralized-remote-workflow.md](/root/omnicron/dev-docs/back-end/99-build/decentralized-remote-workflow.md)
3. [06-presentation/how-it-connects.md](/root/omnicron/dev-docs/back-end/06-presentation/how-it-connects.md)
4. [01-physical/qemu-execution-guide.md](/root/omnicron/dev-docs/back-end/01-physical/qemu-execution-guide.md)
5. [99-build/gdb-usage.md](/root/omnicron/dev-docs/back-end/99-build/gdb-usage.md)
