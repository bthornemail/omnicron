# ASCII Constitutional Machine

## Purpose

This document defines OMICRON as a portable constitutional machine built on ASCII, POSIX, relational logic, and macro expansion.

The stack is:

```text
ASCII bytes
-> control grammar
-> deterministic replay kernel
-> relational logic layer
-> macro / transformation layer
-> human surfaces
```

The kernel remains sovereign. Higher layers consume canonical receipts, derive lawful consequences, and project human-facing views without redefining kernel truth.

## Core Thesis

OMICRON is not "Scheme plus Prolog as random languages." It is a layered machine with distinct authority boundaries:

- ASCII carries the law.
- C replays the law.
- Datalog closes the law.
- Scheme grows the law.

This separation keeps transport portable, execution deterministic, inference declarative, and surface syntax extensible without collapsing authority into presentation.

## Layer Order

### Layer 0: ASCII / bytes

ASCII is the common civil substrate.

Why ASCII:

- fixed 7-bit canonical byte semantics
- ubiquitous support across POSIX, terminals, files, FIFOs, sockets, serial links, and logs
- stable control-plane characters
- simple embedding in C, shell, awk, Scheme, Prolog, and assembly
- reproducible transport without Unicode assumptions

ASCII is therefore the canonical interlayer carrier.

### Layer 1: Kernel replay machine in C / POSIX

The kernel is the real machine.

Its job is to:

- consume bytes
- parse canonical control grammar
- replay deterministically
- maintain timing and phase
- derive digests, addresses, and receipts
- expose stable streams over stdin/stdout/stderr, FIFO, shared memory, or sockets

The kernel does not decide high-level semantic truth. It performs lawful state transition and emits canonical evidence.

Kernel vocabulary should remain close to:

- byte
- control
- frame
- address
- receipt
- digest
- replay
- phase

### Layer 2: Relational logic layer

This layer computes lawful closure downstream of kernel receipts.

Its job is to answer:

- what follows from these receipts?
- which claims support which closures?
- which addresses are related?
- what provenance path exists?
- what dependency or reachability relation is entailed?
- what closure is lawful under declared relations?

Datalog is the constitutional default when the machine needs:

- monotone closure
- portable rule evaluation
- bottom-up fixed-point inference
- simple declarative reconciliation

Prolog is the exploratory surface when the machine needs:

- richer search
- interactive querying
- unification-heavy exploration
- top-down proof search

The logic layer may derive consequences from receipts, but it does not mutate kernel truth retroactively.

### Layer 3: Scheme macro / transformation layer

Scheme is the meta-language, not the truth engine.

Its job is to:

- define syntax
- create DSLs
- generate kernel programs
- generate logic facts and rules
- orchestrate pipelines
- build inspectors and tools
- perform rewrites and transformations
- host a REPL

Scheme grows the surface area of the machine without moving sovereignty out of the kernel.

### Layer 4: Human surfaces

Human-facing outputs include:

- org files
- terminal views
- witnesses
- diagrams
- logs
- browser projections
- debug visualizations

These are projections. They are not authority.

## Constitutional Separation

The machine must not collapse its layers.

Bad separation:

- Scheme decides kernel truth
- Prolog mutates kernel state directly
- text surface becomes authority

Good separation:

- kernel emits canonical receipts
- logic consumes receipts and derives relations
- Scheme builds programs, compilers, and rewrites
- surfaces display downstream witnesses

This is the core sovereignty rule of the stack.

## ASCII Control-Plane Law

The most important ASCII region is the control block:

- `NUL` (`0x00`)
- `ESC` (`0x1B`)
- `FS` (`0x1C`)
- `GS` (`0x1D`)
- `RS` (`0x1E`)
- `US` (`0x1F`)

These are not merely text characters. They are structural separators suitable for a lawful byte grammar.

Recommended constitutional roles:

- `NUL`: reserved zero state, null point, convergence marker
- `ESC`: escape, coordinate depth, mode entry
- `FS`: context, file, or frame boundary
- `GS`: group boundary
- `RS`: record boundary
- `US`: unit boundary

## Character-Law Split

For portability and clarity, the ASCII table should be treated in four bands.

### `0x00-0x1F`: constitutional control plane

Use for:

- framing
- separation
- escaping
- mode shifts
- record boundaries
- transport signals

### `0x20-0x2F`: compact visible operator plane

Use for:

- visible surface operators
- compact ASCII-only syntax
- operator glyphs in logs, DSLs, and witnesses

### `0x30-0x39`: numeric glyph plane

Use for:

- human-readable numeric projection
- digits in textual witnesses

### `0x41-0x5A` and `0x61-0x7A`: identifier plane

Use for:

- mnemonics
- predicate names
- variables
- surface identifiers

This preserves a strict distinction between byte control, visible operators, numeric display, and symbolic naming.

## Canonical Wire Style

A portable kernel stream should remain ASCII-safe and separator-driven.

Illustrative form:

```text
ESC frame FS channel GS address RS payload US receipt
```

This is a style law, not a frozen final syntax. The key invariant is that structural boundaries are carried by canonical control bytes, not by parser-specific conventions.

Because the grammar is ASCII-based, every layer can read it:

- shell
- awk
- sed
- grep
- C
- Scheme
- Prolog or Datalog parsers
- FIFOs
- sockets
- terminal logs

## Existing OMICRON Mapping

This document refines and clarifies the existing implementation split already visible in the repository:

- `riscv-baremetal/atomic_kernel.c`: deterministic kernel substrate
- `riscv-baremetal/ATOMIC_KERNEL_SPEC.md`: six kernel laws and FS/GS/RS/US structural access
- `logic/constitutional_stack.pl`: logical stack, receipts, and surfaces
- `CONSTITUTION.md`: numerical constitution and non-equivalence laws

The intended authority chain is:

```text
ASCII
-> kernel execution
-> canonical receipt
-> relational closure
-> macro expansion and tooling
-> witness projection
```

## Kernel Law

The kernel SHALL:

- accept and emit canonical ASCII byte streams
- preserve deterministic replay
- assign phase, address, and receipt structure
- expose canonical receipts for downstream consumption

The kernel SHALL NOT:

- rely on rich text assumptions
- allow presentation layers to redefine canonical state
- embed exploratory logic as authority

## Logic Law

Relational closure SHALL be computed in a declarative logic layer downstream of canonical receipts.

The logic layer MAY:

- derive support, conflict, provenance, reachability, and closure
- reconcile claims and proposals
- emit derived witnesses

The logic layer SHALL NOT:

- redefine kernel history
- mutate kernel truth outside the receipt protocol

## Macro Law

Surface languages and operator grammars MAY be generated by a Scheme layer, but Scheme SHALL NOT redefine kernel truth.

Scheme is responsible for:

- syntax growth
- DSL construction
- compiler and transpiler surfaces
- fact and rule generation
- operator tooling

## Projection Law

Human-readable forms are derived witnesses only.

Surfaces MAY:

- display receipts
- render diagrams
- show provenance and closure
- support debugging and navigation

Surfaces SHALL NOT become the source of truth.

## End-to-End Pipeline

One lawful pipeline is:

1. A program or operator emits ASCII-framed input.
2. The C/POSIX kernel parses and replays it deterministically.
3. The kernel emits canonical receipts and digests.
4. The relational layer derives support, conflict, reachability, or closure.
5. Scheme tools generate follow-on programs, queries, or surface rewrites.
6. Human surfaces project witnesses, logs, and diagrams downstream.

This preserves a clean proof burden:

- the kernel proves replay and receipt emission
- the logic layer proves closure and relation
- the macro layer proves construction and transformation
- the surface layer proves only projection fidelity

## Practical Implementation Path

### First

Keep the kernel in C with:

- stdin/stdout
- FIFO
- optional sockets or shared memory
- canonical ASCII framing

### Second

Bind a relational layer to kernel receipts.

Near-term options:

- keep the existing Prolog layer as the exploratory surface
- add a constrained Datalog subset for monotone constitutional closure
- later embed a smaller portable fixed-point engine if needed

### Third

Add a small Scheme surface for:

- REPL use
- macro expansion
- DSL generation
- compiling surface forms to kernel streams
- generating logic facts and rules

### Fourth

Keep org, terminal, and witness surfaces downstream of receipts and logical closure.

## Design Summary

OMICRON should be understood as:

- a byte machine
- with a deterministic replay kernel
- with a declarative closure layer
- with a macro and transformation layer
- with human witnesses downstream

In short:

```text
ASCII carries the law,
C replays the law,
Datalog closes the law,
Scheme grows the law.
```
