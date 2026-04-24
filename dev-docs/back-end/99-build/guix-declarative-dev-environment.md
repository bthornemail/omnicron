# Guix Declarative Dev Environment (QEMU + Electron/Atom)

This repo now supports a declarative Guix setup focused on:

- portable host/runtime tooling
- QEMU + RISC-V workflow
- optional desktop editor layer (Electron/Atom/Pulsar)

The goal is to keep `omnicron` as the single trunk while making the dev
environment reproducible and shareable.

## 1. Pull Guix Channels

```bash
guix pull -C guix/channels.scm
```

## 2. Enter Core Environment

```bash
guix shell -m guix/manifest-core.scm
```

Includes:

- `qemu`
- `riscv64-linux-gnu-gcc`
- `gdb`
- `node`
- `guile`
- `sbcl`
- build essentials (`gcc-toolchain`, `make`, `git`)

## 3. Add Optional Editor Layer

```bash
guix shell -m guix/manifest-core.scm -m guix/manifest-editors.scm
```

`manifest-editors.scm` attempts to include:

- `electron`
- `atom`
- `pulsar`

If one is unavailable in your current Guix channel revision, it is skipped.

## 4. Validate Repo Runtime Gates

Inside the Guix shell:

```bash
make test test-pair-machine test-polylog
make test-wordnet-synset-graph
make verify-preheader-congruence
```

## 5. Pre-Header Rule (Critical)

During unary bootstrap (`0x00..0x2F`), bytes are unary control units only.
Do not interpret `SP`, `.`, `(`, `)` as structural syntax in this phase.
Structural dot parsing starts only after pre-header completion.

This is enforced by the fail-fast verifier.
