# Rolling and Pascal Matrices

## The Connection

The pre-header ladder rolling is exactly like building Pascal matrices:

```
Pascal matrix = exp(lower-triangular) × exp(upper-triangular)
```

Each step rolls into the next - the same as NULL → ESC → CONTROL → SIGNAL → ...

## The Subdiagonal Matrix

```
[ . . . . . . . ]
[ 1 . . . . . . ]
[ . 2 . . . . . ]
[ . . 3 . . . . ]
[ . . . 4 . . . ]
[ . . . . 5 . . ]
[ . . . . . 6 . ]
```

Taking exp() of this gives the lower Pascal matrix:

```
1 . . . . . .
1 1 . . . . .
1 2 1 . . . .
1 3 3 1 . . .
1 4 6 4 1 . .
1 5 10 10 5 1 .
1 6 15 20 15 6 1
```

## The Superdiagonal Matrix

```
[ . 1 . . . . . ]
[ . . 2 . . . . ]
[ . . . 3 . . . ]
[ . . . . 4 . . ]
[ . . . . . 5 . ]
[ . . . . . . 6 ]
[ . . . . . . . ]
```

Taking exp() gives the upper Pascal matrix.

## The Rolling

Multiply them together (they don't commute):

```
S = exp(lower) × exp(upper)
```

You get the symmetric Pascal matrix:

```
1 1 1 1 1 1 1
1 2 3 4 5 6 7
1 3 6 10 15 21 28
1 4 10 20 35 56 84
1 5 15 35 70 126 210
1 6 21 56 126 252 462
1 7 28 84 210 462 924
```

## The Connection to OMI-Lisp

This is exactly what the pre-header does:

1. Start with simple control codes (the subdiagonal: 1,2,3,...)
2. Invert (the superdiagonal: 1,2,3,...)
3. Multiply together (the dot in the ladder)
4. Roll into existence

Each level is like taking exp() of a simpler matrix. The combination creates complexity.

## The LUT is a Pascal-like Structure

The LUT built from the ladder is like a Pascal matrix - simple control codes rolled into complex structures.

Each step inverts and rolls - same as matrix exponential but with control characters instead of numbers.