# Guix Declarative Dev Environment (QEMU + Electron/Atom)

This repo now supports a declarative Guix setup focused on:

- portable host/runtime tooling
- QEMU + RISC-V workflow
- optional desktop editor layer (Electron/Atom/Pulsar)
- optional rendering/polyform layer (OpenGL, OpenGL ES/WebGL-adjacent tooling)

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

## 4. Add Rendering / Logic-CAD Layer

```bash
guix shell -m guix/manifest-core.scm -m guix/manifest-rendering.scm
```

This layer is for the presentation laboratory:

- native OpenGL viewer work through Mesa + GLFW
- OpenGL ES/WebGL-adjacent experiments through Mesa and Node
- polyform render packet generation
- optional CAD tools such as OpenSCAD, FreeCAD, Blender, and Emscripten when
  available in the selected Guix channel

Validate the host rendering surface:

```bash
make verify-rendering-env
make poc-mixedbase-header8-render
make verify-render-contract
make omnicron-viewer
```

For a full shell with editors and rendering:

```bash
guix shell -m guix/manifest-core.scm \
  -m guix/manifest-rendering.scm \
  -m guix/manifest-editors.scm
```

## 5. Validate Repo Runtime Gates

Inside the Guix shell:

```bash
make test test-pair-machine test-polylog
make test-wordnet-synset-graph
make verify-preheader-congruence
```

## 6. Pre-Header Rule (Critical)

During unary bootstrap (`0x00..0x2F`), bytes are unary control units only.
Do not interpret `SP`, `.`, `(`, `)` as structural syntax in this phase.
Structural dot parsing starts only after pre-header completion.

This is enforced by the fail-fast verifier.

## 7. Why This Is Declarative CAD

The rendering layer is not just “graphics packages.”  It is the reproducible
environment for proving that a logic stream can declare a geometry:

```text
pre-header
-> header8
-> dot/pair rewrite
-> polyform cells
-> render packet
-> SVG / OpenGL / OpenGL ES / WebGL / CAD projection
```

The CAD-like object is the replayable logic form.  OpenGL, WebGL, SVG, and CAD
tools are projection surfaces that let different machines inspect the same
canonical geometry.
