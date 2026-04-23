# Thorne Calculus — The Omicron-Gnomon Foundation (Draft)

Author: Brian Thorne  
Contact: bthornemail@gmail.com

## Position

This draft captures the full symbolic framing:

- one instruction notation: dotted pair `(a . b)`
- one closure law:
  - `rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C`
- no floating-point authority
- symbolic/no-loss representations as canonical
- rendering maps treated as derived surfaces

## Core Correction (Canonical)

Hopf terms are **pure nibble identities**:

```c
typedef enum {
    HOPF_BASE_POINT     = 0x0,
    HOPF_FIBER          = 0x1,
    HOPF_PROJECTION     = 0x2,
    HOPF_LOCAL_TRIV     = 0x3,
    HOPF_TRANSITION     = 0x4,
    HOPF_HOMOTOPY       = 0x5,
    HOPF_PRINCIPAL      = 0x6,
    HOPF_OP1            = 0x7,
    HOPF_S7_FIBER       = 0x8,
    HOPF_S15_TOTAL      = 0x9,
    HOPF_STEREO         = 0xA,
    HOPF_VILLARCEAU     = 0xB,
    HOPF_LINK           = 0xC,
    HOPF_ADAMS          = 0xD,
    HOPF_EXOTIC         = 0xE,
    HOPF_BOUNDARY       = 0xF
} hopf_term_t;
```

The value is invariant; mapping is contextual (ASCII/Aegean/Braille/BOM/RTL-LTR).

## Stream-First Meaning

The language is self-describing by stream position and control markers.

Example:

```lisp
(FS
  (𐄇 𐄈 𐄉)
  GS
  (d o g)
  RS 𐄀
  US (𐄇 𐄈)
  ETX)
```

No variable declarations are required for semantic identity; meaning is derived
from token role + position + codepoint.

## Transformer / Renderer Separation

- Transformer: authority (`dot + delta law`)
- Renderer: witness (geometry/pointer projection)

This separation is required to preserve canonical identity.

## No-Loss Policy

- canonical numeric forms are symbolic/exact
- floating-point is projection-only
- canonical identity must be invariant under encoding/view changes

## Notes

This document is an authored theory draft.  
Normative implementation gates remain in:

- `docs/reference/logic/OMICRON_GNOMON_NO_LOSS_WHITEPAPER.md`
- `logic/contracts/omnicron_hopf_terms.h`

