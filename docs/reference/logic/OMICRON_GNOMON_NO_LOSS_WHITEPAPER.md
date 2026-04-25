# Omicron-Gnomon No-Loss Calculus (Working White Paper)

## Author

- Brian Thorne
- bthornemail@gmail.com

## Status

This document is a **normative engineering white paper** for implementation
alignment. It intentionally separates:

- **Normative claims** (must hold in code/contracts/tests)
- **Exploratory claims** (useful research hypotheses, not merge gates)

---

## 1. Core Thesis

The canonical machine should be expressed as:

```text
one structural primitive (pair / dot)
+ one closure law (delta transform)
+ one bounded register width
+ projection layers that do not mutate authority
```

No projection surface (ASCII, Aegean glyphs, Braille, SVG/WebGL, barcode) is
authoritative by itself.

---

## 2. Normative Kernel

### 2.1 Primitive

- Primitive structure: dotted pair `(a . b)`
- Lists, trees, frames, records are all derived from repeated pairing.

### 2.2 Closure Law

For fixed width `w`:

```text
Δ(x) = rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C
```

Requirements:

- rotations only (no information drop from shifts)
- XOR composition
- explicit constant `C`
- width mask after each step

### 2.3 Reduction Question

The governing design question is:

```text
What structure can be removed while the same canonical unfold, replay, and
projection still results?
```

This is the quotient question of the system. A symbol, rendering, table, or
notation is foundational only if removing it changes canonical unfold/replay/
projection. Otherwise it is a projection convenience or derived witness.

The minimal design that currently survives this reduction is:

```text
pair/dot structure
+ delta law
+ bounded width
+ explicit frame metadata
+ projection witnesses
```

Everything else should be tested as removable unless a verifier proves that it
is required for the same canonical output.

### 2.4 Register Semantics

- Register width is explicit and bounded per stage (`8/16/32/64/128/256/512`).
- State transitions are deterministic for fixed `(x, C, w)`.

### 2.5 Period-8 Witness

The design contains one deliberate step law:

```text
rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C
```

The choices inside the law are exactly:

- rotations instead of shifts, so no bits are dropped
- XOR, which is reversible as a local operation
- an explicit constant, so the zero fixed point can be broken
- a width mask, so the state remains bounded

For the current 16-bit witness path, the observed period-8 behavior gives the
following derived reference:

```text
period 8 -> smallest prime with decimal repetend period 8 is 73
1/73     -> 0.01369863 repeating
B        -> [0, 1, 3, 6, 9, 8, 6, 3]
W        -> sum(B) = 36
offset   -> divmod(position, 36)
```

`73` is not chosen as a constant. It is a derived witness attached to the
period-8 orbit.

The nearby sexagesimal boundary is useful as a contrast:

```text
1/59 -> long repetend period in decimal
1/60 -> sexagesimal boundary; decimal reduces to 1/(2^2 * 3 * 5)
```

That contrast is part of why frame boundaries matter. Neighboring denominators
can have very different replay behavior depending on the frame in which the
quotient is read.

---

## 3. No-Loss Numeric Policy

### 3.1 Canonical Numeric Forms

Canonical numeric payloads are exact symbolic forms:

- `INT`
- `RATIO`
- `BCD`
- `FACTORADIC`

`FLOAT` is permitted as a **projection lane** only.

### 3.2 No-Loss Rule

Canonical identity must not depend on floating-point rounding.

```text
canonical_identity != float_render
```

Example:

- canonical: `1/3`
- projection: `0.3333...`

---

## 4. Nibble Authority (0x0..0xF)

### 4.1 Canonical Term Space

The first stable symbolic term space is nibble-valued:

```text
0x0 .. 0xF
```

These are **abstract terms**, not tied to one rendering charset.

### 4.2 Projection Mapping

Any concrete surface mapping is derived:

- ASCII control aliases
- Aegean glyph aliases
- Braille aliases
- barcode module patterns

Orientation (LTR/RTL) and BOM alter rendering/interpretation order, but must not
change canonical nibble identity.

---

## 5. Omicron/Gnomon Separation

Use this operational split:

- **Omicron**: active framing selector (context/orientation/boundary mode)
- **Gnomon**: invariant residual witness under chosen frame

This must be represented as metadata around canonical state, not as mutable
redefinition of canonical state itself.

---

## 6. Surface Contract

All authoring surfaces lower to canonical dotted-pair form before equivalence:

```text
surface text
-> parsed AST
-> normalized dotted pair
-> canonical hash
```

Surface equivalence is hash equality of normalized dotted-pair witnesses.

---

## 7. Geometry Pointer Map Policy

Geometry pointers are allowed for rendering/debugging pipelines, but:

- pointer tables are **derived contracts**
- geometry selection is projection behavior
- canonical state cannot depend on renderer decisions

In short:

```text
transformer = authority
renderer = witness
```

---

## 8. Suggested Proof Obligations

To keep this implementable, enforce these checks:

1. **Delta determinism**: fixed `(x,C,w)` always yields fixed next state.
2. **BOM/orientation invariance**: canonical hash unchanged by LTR/RTL/BOM
   rendering choice.
3. **Exact numeric invariance**: INT/RATIO/BCD/FACTORADIC canonical identity
   unchanged by float projection.
4. **Surface equivalence**: all available surface forms lower to same pair hash
   for the same object id.
5. **Projection non-authority**: rendering artifacts must carry provenance to
   canonical source hash.

---

## 9. Exploratory (Non-Gating) Claims

The following are valid research directions but are not merge gates until
formalized in verifier contracts:

- Hopf-fibration/S^15 interpretations of state manifolds
- polytope-specific pointer semantics
- deep numerology-style correspondences (e.g., prime emergence narratives)

These can guide experimentation, but must be isolated from normative checks.

---

## 10. Minimal Implementation Target

A sufficient implementation target is:

1. canonical pair runtime + delta closure
2. exact numeric payload support
3. nibble-term contract (`0x0..0xF`)
4. lowering/equivalence verifier
5. projection renderers fed only by canonical artifacts

If all five hold, the machine is operationally no-loss and auditable.

---

## Attribution

This white paper captures the Omicron/Gnomon no-loss framing and reduction
direction authored by Brian Thorne, with this document maintained as the
canonical engineering reference in `docs/`.
