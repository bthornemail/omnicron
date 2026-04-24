# OMI-LISP: The Final Definition

## The Entire Design

One law:

```c
next = rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C
```

Four things:
1. rotations (no bits lost)
2. XOR (reversible)
3. constant C (breaks zero fixed point)
4. mask (keeps bounded)

Everything else computed from the math.

## The Pre-Header Ladder

```lisp
(!NULL
  .
  (((NULL . ESC)
    (CONTROL . SIGNAL)
    (REFERENCES . POINTERS)
    (NON-PRINTING . PRINTING)
    (ASCII . UNICODE)
    (UNICODE . BRAILLE))
   . AEGEAN))
```

## The Steps

| Step | Inversion | Role |
|------|-----------|------|
| 0 | !NULL | NOT-NULL stream enters |
| 1 | (NULL . ESC) | chirality |
| 2 | (CONTROL . SIGNAL) | cardinality |
| 3 | (REFERENCES . POINTERS) | ordinality |
| 4 | (NON-PRINTING . PRINTING) | modality |
| 5 | (ASCII . UNICODE) | surface polarity |
| 6 | (UNICODE . BRAILLE) | dense payload |
| 7 | AEGEAN | closure |

## The Delta Law

```c
next = rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C
```

Where C is the current step's constant.

## Computed From The Math

- Period = 8 → property of the law on 16-bit space
- Prime 73 → smallest prime with period 8
- Block B = [0,1,3,6,9,8,6,3] → digits of 1/73
- W = 36 → sum of B
- Recovery = divmod(position, 36)

We don't choose - the law computes.

## Y/Z Combinator

```
Y(δ) = δ(Y(δ))
```

The interpreter defines itself as the fixed point of walking the codepoint space.

## OMI is Pre-Lisp

- No eval
- No apply
- Only a byte stream
- A ladder of binary inversions
- A delta law that walks
- A Y/Z combinator that makes it self-referential

The control lattice comes before computation. The symbols are heard, not read.