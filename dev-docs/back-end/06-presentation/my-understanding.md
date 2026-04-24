# My Understanding

## One Law

```c
next = rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C
```

This is the entire design.

## Ladder Structure

NULL → ESC → CONTROL → SIGNAL → REFERENCES → POINTERS → NON-PRINTING → PRINTING → ASCII → UNICODE → BRAILLE → AEGEAN

The ladder has 7 rungs + closure.

## What The Law Does

Each rotation outputs different bits:
- rotl(x,1) = one pattern
- rotl(x,3) = another pattern
- rotr(x,2) = another pattern
- XOR all with C = next state

The period is 8. This is computed, not chosen.

## Computed Values

- Period 8 comes from the law on 16-bit space
- Prime 73 is smallest prime with period 8
- Digits of 1/73 = [0,1,3,6,9,8,6,3]
- W = 36 = sum of digits
- Recovery = divmod

The law computes everything. We don't choose.

## Meta-Circular

The Y combinator makes it self-referential:
Y(δ) = δ(Y(δ))

The interpreter defines itself.

## OMI

- byte stream
- ladder inversions
- delta law
- self-referential via Y

No eval. No apply. Control lattice before computation.