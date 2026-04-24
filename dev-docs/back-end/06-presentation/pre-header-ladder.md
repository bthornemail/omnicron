# Pre-Header Ladder: Pascal Pyramid of Canonical Instructions

## The Virtual LUT

The third is a Pascal pyramid of canonical instructions - an algorithmic virtual LUT created by rolling.

The POINTERS set:

```
(DLE DC1 DC2 DC3 DC4 NAK SYN ETB CAN EM SUB ESC FS GS RS US)
```

This is not stored - it is computed. The runtime creates it by exponentiating the subdiagonal matrix (the same way Pascal matrices are constructed).

## Pascal Pyramid

The LUT is a Pascal pyramid - binomial coefficients arranged in a triangle:

```
         1
        1 1
       1 2 1
      1 3 3 1
     1 4 6 4 1
    1 5 10 10 5 1
   1 6 15 20 15 6 1
```

Each entry is a canonical instruction. The runtime computes them, not stores them.

## The Three

| Delimiter | Type | Set |
|-----------|------|-----|
| NULL | non-printing control | (NUL) |
| ESC | non-printing control | (ESC) |
| POINTERS | non-printing controls as LUT | (DLE DC1 DC2 DC3 DC4 NAK SYN ETB CAN EM SUB ESC FS GS RS US) |

All three are non-printing control codes.