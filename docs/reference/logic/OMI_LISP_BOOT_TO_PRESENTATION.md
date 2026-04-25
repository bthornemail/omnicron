# OMI-Lisp From Boot To Presentation

This document explains how `omi-lisp` can be integrated from the boot substrate
to the declaration of rendering surfaces without collapsing the layers together.

The short answer is: yes, this is possible. The key rule is that each layer has
different authority.

```text
pre-header -> header8 -> dot/pair rewrite -> relation graph -> render declaration
```

The runtime may carry one continuous framed stream, but the meaning of that
stream changes only after the previous frame has been earned and verified.

## Core Claim

`omi-lisp` is not just a user-space language. It is a staged representation
path:

```text
control stream
  -> pair structure
  -> facts/rules/clauses
  -> symbolic surfaces
  -> physical or visual witnesses
```

That means facts, rules, and clauses can be represented as linked-list dot
notation while preserving the same frame discipline from runtime substrate to
presentation output.

This is different from ordinary parsing. In an ordinary system, bytes are parsed
into a language and then rendered. In this system, each stage is a contract that
frames the next stage.

## The Four Frame Components

These four components form the current full frame:

| Component | Role | Authority |
|---|---|---|
| `pre-header` | Boot congruence gate | Decides whether the stream may mean anything yet |
| `header8` | Runtime typecaster | Casts the current token into a runtime context |
| `Unicode` | Symbolic stream contract | Provides named symbolic address surfaces |
| `barcode` | Physicalized stream contract | Provides scan/render/witness framing |

Polyforms sit at the intersections of these components. A polyform is not just
a picture; it is a finite rule surface describing how one frame projects into
another.

```text
polyform = finite rule geometry for frame intersections
```

Example intersection:

```text
boot token + header8 state + Unicode plane + barcode module
  -> one deterministic render cell
```

## Phase Order

The most important implementation rule is phase order.

### 1. Pre-header phase

The first three ASCII rows (`0x00..0x2F`) are consumed as unary control units.

During this phase:

- `SP` (`0x20`) is a unary control point, not whitespace syntax.
- `.` (`0x2E`) is a unary control point, not dotted-pair syntax.
- `(` and `)` are unary control points, not list syntax.
- No renderer may reinterpret these bytes as presentation commands.

If a stream tries to interpret structural syntax during this phase, the runtime
must fail fast.

Verifier:

```bash
make verify-preheader-congruence
```

### 2. Header8 phase

After pre-header congruence succeeds, `header8` becomes available as the runtime
typecaster.

Canonical slots:

```text
[0]=NUL [1]=ESC [2]=FS [3]=GS [4]=RS [5]=US [6]=input [7]=state
```

`header8` does not boot the language. It casts the active token after the boot
gate has made interpretation legal.

### 3. Dot/pair phase

Only after the pre-header boundary has been consumed may structural characters
be interpreted as syntax.

At this stage:

- `.` becomes the pair operator.
- `SP` can separate tokens.
- parentheses can describe list surfaces.
- facts, rules, and clauses can be encoded as linked structures.

Example:

```lisp
(fact . (parent . (john . (mary . nil))))
```

The important property is that this is still only pairs. A Datalog-style fact is
not a special external object; it is a framed pair structure.

### 4. Relation graph phase

Facts, rules, and clauses become traversable pair graphs.

| Logic idea | Pair-machine role |
|---|---|
| fact | ground pair/list |
| rule | rewrite pair/list |
| clause | framed relation |
| query | graph traversal |
| proof | replayable witness path |

This is the point where a system-level lexer can support Datalog-like behavior
without requiring full Prolog symbols at boot.

### 5. Presentation declaration phase

Rendering begins only after the logic structure exists.

The renderer receives declarations derived from canonical pair structures:

```text
pair graph -> render packet -> viewer/backend
```

Presentation surfaces may include:

- Unicode symbolic labels
- Braille dense payload cells
- Aegean header/governance markers
- barcode frames
- polyform geometry
- OpenGL/OpenGL ES surfaces
- SVG/PNG/STL/OBJ export

These surfaces are downstream projections. They must not rewrite boot authority.

### Binary256-scale rendering resolution

The Aegean/Braille rendering path can be treated as a symbolic software
adaptation of an octuple-precision carrier:

```text
HEADER8/BOM -> sign/chirality/type context
Aegean      -> header/exponent/governance plane
Braille     -> significand/payload plane
```

The simplest exact payload rule is:

```text
32 Braille cells * 8 bits = 256 bits
```

That lets a renderer consume a 256-bit payload without requiring native
octuple-precision hardware. If the stream wants IEEE-like field separation,
Aegean can carry the exponent/header role and Braille can carry the significand
role, with `HEADER8` or BOM supplying the sign/chirality context.

This is a software framing model, not a claim that the CPU is executing native
`binary256` instructions. The value remains exact because it is represented as
symbolic cells and pair/LUT rewrites rather than rounded through hardware
floating point.

## Why This Can Reach Low-Level Runtime

The model is close to low-level execution because it begins before user-space
syntax:

```text
ASCII control substrate
  -> strict unary gate
  -> runtime typecaster
  -> pair machine
  -> relation machine
  -> presentation declarations
```

At the hardware or emulator level, this gives a stable testing path:

- QEMU and ESP32 lanes test whether the same frame rules survive platform
  changes.
- Endian compatibility tests confirm that byte order is explicit behavior, not
  hidden accident.
- Render packets verify that projection is deterministic and replayable.

## How This Relates To Random Number Generators

This system uses a step law in a way that resembles random number generator
machinery:

```text
state -> deterministic step -> next state
```

The difference is that the origin and frame are preserved.

Typical RNG use often hides the seed once output begins. Here, the stream keeps:

- origin
- separator
- phase
- frame
- witness

That turns the orbit into an address path for deterministic federated lookup
tables.

## Compatibility With Polytron

`polytron` should remain useful as the presentation and device sibling.

Recommended split:

```text
omnicron owns the contracts.
polytron renders the intersections.
```

That means:

- `omnicron` defines pre-header, header8, pair rewrite, and verification.
- `polytron` consumes verified streams and renders polyforms, barcode frames,
  GPU surfaces, PNG/STL/OBJ output, and ESP32/device projections.

This keeps the boot substrate strict while allowing the visual/consumer-facing
system to stay expressive.

## Invariants

1. Pre-header runs before syntax.
2. Header8 is post-boot typecasting, not the boot sequence.
3. Dot notation is legal only after the unary phase completes.
4. Facts, rules, and clauses are pair structures.
5. Render surfaces are derived witnesses, not sources of authority.
6. Any header/stream incongruence fails immediately.

## Verification Commands

```bash
make verify-preheader-congruence
make test-pair-machine
make test-omi-lisp-surface
make verify-render-contract
make poc-mixedbase-header8-render
make verify-multi-emulator-smoke
```

Together, these checks test the path from boot framing to runtime structure to
renderable declarations.
