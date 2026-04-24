# Linear-Feedback Shift Registers & Xorshift

## LFSR Fundamentals

An LFSR is a deterministic state machine that traverses `2^n - 1` states (maximal period) using XOR feedback.

```
Fibonacci (external XOR):     Galois (internal XOR):
┌─────┐     ┌─────┐         ┌─────┐     ┌─────┐
│D   Q├────►│D   Q├────►    │D   Q├────►│D   Q├────►
│     │     │     │         │     │     │     │
└─╥───┘     └─╥───┘         └──╤┘     └─╤┘
 │            │              XOR    │    XOR
 ▼            ▼              ▼     ▼
┌─╩───┐     ┌─╩───┐         ┌─────┐     ┌─────┐
│ Tap │     │ Tap │         │ Tap │     │ Tap │
└─────┘     └─────┘         └─────┘     └─────┘
```

**Key property**: Given the polynomial and current state, the next state is **completely deterministic**.

## Xorshift Family

Xorshift = LFSR using XOR + shift operations (Marsaglia, 2003):

```c
// 32-bit xorshift - period 2^32-1
uint32_t xorshift32(uint32_t *state) {
    uint32_t x = *state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    return *state = x;
}

// 64-bit xorshift - period 2^64-1  
uint64_t xorshift64(uint64_t *state) {
    uint64_t x = *state;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    return *state = x;
}
```

### Output Scramblers (PCG-style)

| Generator | Output Transform | State Size |
|-----------|---------------|------------|
| xorshift* | multiply (invertible) | n bits |
| xorshift+ | add two consecutive | n bits |
| xoshiro256** | rotate + multiply | 256 bits |

```c
// xoshiro256** - 256-bit state, period 2^256-1
uint64_t xoshiro256ss(xoshiro256ssState *s) {
    uint64_t result = rol64(s->s[1] * 5, 7) * 9;
    uint64_t t = s->s[1] << 17;
    s->s[2] ^= s->s[0];
    s->s[3] ^= s->s[1];
    s->s[1] ^= s->s[2];
    s->s[0] ^= s->s[3];
    s->s[2] ^= t;
    s->s[3] = rol64(s->s[3], 45);
    return result;
}
```

## Connection to OMI-Lisp

### Why This Matters for Boot

The xorshift/LFSR is **exactly what you need** for HEADER8:

1. **Deterministic traversal** - given seed X₀, the sequence X₀→X₁→X₂→... is reproduceable
2. **Full period** - visits every state exactly once (for well-chosen parameters)
3. **Uniform distribution** - over full period, each state appears once
4. **Hardware-friendly** - XOR + shift are single-cycle on RISC-V

### Boot Sequence

```
Seed (from hardware entropy or fixed value)
    │
    ▼
┌─────────────────┐
│ Xorshift/LFSR   │ ────► HEADER8 state sequence
│ State Machine   │       X₀, X₁, X₂, ..., Xₘ₋₁
└─────────────────┘
    │
    ▼
Control Lattice Enumeration
```

### Parameters for OMI-Lisp

| State Size | Period | Use Case |
|------------|--------|----------|
| 64-bit | 2⁶⁴-1 | Session seed |
| 128-bit | 2¹²⁸-1 | HEADER8 primary |
| 256-bit | 2²⁵⁶-1 | Full octuple state |

### Primitive Polynomials (Maximal Period)

| Bits (n) | Polynomial | Hex |
|----------|------------|-----|
| 8 | x⁸ + x⁶ + x⁵ + x⁴ + 1 | 0xB8 |
| 16 | x¹⁶ + x¹⁵ + x¹³ + x⁴ + 1 | 0xD008 |
| 32 | x³² + x²² + x² + x + 1 | 0x8000001B |
| 64 | x⁶⁴ + x⁶¹ + x⁵⁹ + x⁶ + 1 | 0x42F0E1EBA9EA3693 |

## Tesseract Mapping

The 4D hypercube (tesseract) has **16 vertices**. This maps to HEADER8's 16-byte state space:

```
Xorshift64 (period 2⁶⁴-1)
    │
    ���  Sample every 2⁴⁶ times
16-vertex hypercube walk
    │
    ▼  Each vertex =
256-bit octuple state
```

The cyclic sieving connection: **rotations of the tesseract correspond to fixed points** at roots of unity in the state sequence.

## Galois vs Fibonacci for Boot

**Galois form** is preferred for software (xorshift):

```c
// Galois LFSR - parallel feedback
uint16_t lfsr_galois(uint16_t s) {
    unsigned lsb = s & 1;
    s >>= 1;
    if (lsb) s ^= 0xB400u;  // toggle mask for polynomial
    return s;
}
```

- **Fibonacci**: serial XOR gates (slower in software)
- **Galois**: parallel bit operations (faster)

## Boot Protocol

```
1. Hardware loads seed (or uses fixed ROM value)
2. Seed Galois LFSR with primitive polynomial
3. For each boot step:
   a. Advance LFSR → new state
   b. Map state to HEADER8 slot (0-7)
   c. Execute control word
   d. Repeat until halting condition
```

## References

- Marsaglia, G. (2003). "Xorshift RNGs". Journal of Statistical Software.
- Vigna, S. (2016). "An experimental exploration of Marsaglia's xorshift generators".
- PCG Paper: "PCG: A Family of Simple Fast Space-Efficient Statisticsally Good PRNGs"