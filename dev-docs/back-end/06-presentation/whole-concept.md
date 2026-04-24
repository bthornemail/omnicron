# The Whole Concept

## What We Are Building

A computer that rolls itself into existence from nothing but:
- One delta law
- Non-printing control codes
- The ladder

## The Delta Law

```c
next = rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C
```

This is the CPU clock. Each tick:
1. rotl(x,1) - tick 1
2. rotl(x,3) - tick 2
3. rotr(x,2) - tick 3
4. xor C - tick 4

At each tick, the same byte is heard differently.

## The Ladder

The ladder creates the OSI model by climbing:

0. Start with !NULL (NOT NULL)
1. Invert to NULL/ESC - creates floor/ceiling
2. Invert to CONTROL/SIGNAL - creates cardinality
3. Invert to REFERENCES/POINTERS - creates ordinality
4. Invert to NON-PRINTING/PRINTING - creates modality
5. Invert to ASCII/UNICODE - creates surface
6. Invert to UNICODE/BRAILLE - creates dense payload
7. Close to AEGEAN - closure

Each inversion is computed using the delta law.

## We Don't Store

The LUT is not stored. It is computed at runtime:
- NULL, ESC come from the first inversion
- CONTROL comes from the second
- All symbols computed, none stored

## Meta-Circular

The Y combinator makes it self-referential:
Y(δ) = δ(Y(δ))

The interpreter IS the ladder. The ladder IS the interpreter.

## The Three

NULL (0x00), ESC (0x1B), POINTERS (the whole set)

These are the BOM delimiters. All non-printing control codes.