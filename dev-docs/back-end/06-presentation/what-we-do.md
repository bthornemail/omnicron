# What We Are Doing

## The Basics

1. Start with NULL and ESC (non-printing control codes)
2. Each rung of the ladder rolls into the next
3. The dot (.) is meta-circular - interpretation changes
4. NOT defined - derived

## The Rotations

rotl(x,1), rotl(x,3), rotr(x,2), xor C

These are the CPU clock ticks:

- tick 1: rotl(x,1)
- tick 2: rotl(x,3)
- tick 3: rotr(x,2)
- tick 4: xor C

At each tick, the same byte is heard differently. That's the meta-circular interpreter.

At each tick, the same byte is heard differently. That's the meta-circular interpreter.

## The Three

NULL and ESC are the first two non-printing control codes.

The third is POINTERS - the set of control codes that roll into the next LUT.