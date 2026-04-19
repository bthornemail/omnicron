#ifndef SEXAGESIMAL_H
#define SEXAGESIMAL_H

#include <stdint.h>

// ============================================================
// CONSTITUTIONAL LAW: SEXAGESIMAL FRACTIONS
// Pure type layer for sexagesimal values (U+2150–U+218B)
// ============================================================

// ============================================================
// 1. SEXAGESIMAL POSITIONS (Wallis Accents)
// 
// Position    Power    Unicode     Name
// --------- -------- ---------- -------
// °         60^0    U+00B0    Degree (unit)
// ′         60^-1   U+2032    Prime
// ″         60^-2   U+2033    Second  
// ‴         60^-3   U+2034    Third
// ⁗         60^-4   U+2057    Fourth
// ============================================================

#define POS_DEGREE   0   // 60^0 = 1
#define POS_PRIME   1   // 60^-1 = 1/60
#define POS_SECOND  2   // 60^-2 = 1/3600
#define POS_THIRD  3   // 60^-3 = 1/216000
#define POS_FOURTH 4   // 60^-4 = 1/12960000

// Branch direction (left = lower, right = upper in Wallis notation)
#define BRANCH_LEFT  0
#define BRANCH_RIGHT 1

// ============================================================
// 2. SEXAGESIMAL DIGIT
// A digit at a position carries a coefficient (0-59)
// ============================================================

typedef struct {
    uint8_t position;    // POS_DEGREE through POS_FOURTH
    uint8_t branch;     // BRANCH_LEFT or BRANCH_RIGHT
    uint8_t coefficient; // 0-59
} sexagesimal_digit_t;

// ============================================================
// 3. CONVERGENCE CLASS
// Describes the expansion type
// ============================================================

#define CONV_FINITE       0  // Exact regular fraction (denom = 2^a * 3^b * 5^c)
#define CONV_REPEATING   1  // Non-regular denominator (repeats)
#define CONV_IRRATIONAL   2  // No exact rational representation

// ============================================================
// 4. FRACTION TERM
// Rooted term: numerator / denominator with expansion digits
// ============================================================

#define MAX_DIGITS 8

typedef struct {
    uint32_t numerator;
    uint32_t denominator;
    uint8_t convergence;       // CONV_* constant
    uint8_t digit_count;      // Number of expansion digits
    sexagesimal_digit_t digits[MAX_DIGITS];
    uint8_t repeating_start; // Index where repeat begins (0 if none)
} sexagesimal_fraction_t;

// ============================================================
// 5. STARS-AND-BARS ENCODING
// Bridge between numeric and surface grammar
// stars = coefficient (unary count)
// bars = position boundary depth
// ============================================================

typedef struct {
    uint8_t stars;    // coefficient value
    uint8_t bars;     // position depth
    uint8_t digit_index; // source digit index
} stars_bars_coefficient_t;

// ============================================================
// 6. IRRATIONAL CONSTANTS
// ============================================================

#define IRR_SQRT2   0
#define IRR_PI     1
#define IRR_PHI    2  // Golden ratio

typedef struct {
    uint8_t constant;
    uint8_t precision; // number of digits
    uint8_t digits[MAX_DIGITS];
} irrational_approximant_t;

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

// Create a sexagesimal digit
static inline sexagesimal_digit_t mk_digit(uint8_t pos, uint8_t branch, uint8_t coeff) {
    sexagesimal_digit_t d;
    d.position = pos;
    d.branch = branch;
    d.coefficient = coeff < 60 ? coeff : 0;
    return d;
}

// Position depth (for stars-bars encoding)
static inline uint8_t sexagesimal_position_depth(uint8_t pos) {
    return pos;  // degree=0, prime=1, second=2, third=3, fourth=4
}

// Create a finite fraction from numerator/denominator
static inline void finite_fraction(sexagesimal_fraction_t *f, uint32_t num, uint32_t denom) {
    f->numerator = num;
    f->denominator = denom;
    f->convergence = CONV_FINITE;
    f->digit_count = 0;
    f->repeating_start = 0;
}

// Encode coefficient as stars-bars
static inline stars_bars_coefficient_t encode_stars_bars(sexagesimal_digit_t *d) {
    stars_bars_coefficient_t sb;
    sb.stars = d->coefficient;
    sb.bars = sexagesimal_position_depth(d->position);
    sb.digit_index = 0;
    return sb;
}

// ============================================================
// KNOWN FRACTIONS (from Unicode Number Forms)
// ============================================================

// 1/2 = 0;30  — U+00BD
static inline void frac_1_2(sexagesimal_fraction_t *f) {
    f->numerator = 1;
    f->denominator = 2;
    f->convergence = CONV_FINITE;
    f->digit_count = 2;
    f->digits[0] = mk_digit(POS_DEGREE, BRANCH_RIGHT, 0);
    f->digits[1] = mk_digit(POS_PRIME, BRANCH_RIGHT, 30);
    f->repeating_start = 0;
}

// 1/3 = 0;20  — U+2153
static inline void frac_1_3(sexagesimal_fraction_t *f) {
    f->numerator = 1;
    f->denominator = 3;
    f->convergence = CONV_FINITE;
    f->digit_count = 2;
    f->digits[0] = mk_digit(POS_DEGREE, BRANCH_RIGHT, 0);
    f->digits[1] = mk_digit(POS_PRIME, BRANCH_RIGHT, 20);
    f->repeating_start = 0;
}

// 2/3 = 0;40  — U+2154
static inline void frac_2_3(sexagesimal_fraction_t *f) {
    f->numerator = 2;
    f->denominator = 3;
    f->convergence = CONV_FINITE;
    f->digit_count = 2;
    f->digits[0] = mk_digit(POS_DEGREE, BRANCH_RIGHT, 0);
    f->digits[1] = mk_digit(POS_PRIME, BRANCH_RIGHT, 40);
    f->repeating_start = 0;
}

// 1/7 = 0;8,34,17 repeating — U+2150
static inline void frac_1_7(sexagesimal_fraction_t *f) {
    f->numerator = 1;
    f->denominator = 7;
    f->convergence = CONV_REPEATING;
    f->digit_count = 1;
    f->digits[0] = mk_digit(POS_DEGREE, BRANCH_RIGHT, 0);
    f->repeating_start = 1;
}

// 1/8 = 0;7,30 — U+215B
static inline void frac_1_8(sexagesimal_fraction_t *f) {
    f->numerator = 1;
    f->denominator = 8;
    f->convergence = CONV_FINITE;
    f->digit_count = 3;
    f->digits[0] = mk_digit(POS_DEGREE, BRANCH_RIGHT, 0);
    f->digits[1] = mk_digit(POS_PRIME, BRANCH_RIGHT, 7);
    f->digits[2] = mk_digit(POS_SECOND, BRANCH_RIGHT, 30);
    f->repeating_start = 0;
}

// 1/10 = 0;6 — U+2152
static inline void frac_1_10(sexagesimal_fraction_t *f) {
    f->numerator = 1;
    f->denominator = 10;
    f->convergence = CONV_FINITE;
    f->digit_count = 2;
    f->digits[0] = mk_digit(POS_DEGREE, BRANCH_RIGHT, 0);
    f->digits[1] = mk_digit(POS_PRIME, BRANCH_RIGHT, 6);
    f->repeating_start = 0;
}

// ============================================================
// √2 APPROXIMANT (Babylonian YBC 7289)
// √2 ≈ 1;24,51,10
// ============================================================

static inline void approx_sqrt2(irrational_approximant_t *a) {
    a->constant = IRR_SQRT2;
    a->precision = 4;
    a->digits[0] = 1;
    a->digits[1] = 24;
    a->digits[2] = 51;
    a->digits[3] = 10;
}

// Ptolemy's π ≈ 3;8,30
static inline void approx_ptolemy_pi(irrational_approximant_t *a) {
    a->constant = IRR_PI;
    a->precision = 3;
    a->digits[0] = 3;
    a->digits[1] = 8;
    a->digits[2] = 30;
}

// ============================================================
// RENDERING (S-Expression form)
// ============================================================

static const char* position_name(uint8_t pos) {
    switch (pos) {
        case POS_DEGREE:   return "degree";
        case POS_PRIME:   return "prime";
        case POS_SECOND:  return "second";
        case POS_THIRD:   return "third";
        case POS_FOURTH: return "fourth";
        default:        return "unknown";
    }
}

static const char* convergence_name(uint8_t conv) {
    switch (conv) {
        case CONV_FINITE:     return "finite";
        case CONV_REPEATING:  return "repeating";
        case CONV_IRRATIONAL: return "irrational";
        default:            return "unknown";
    }
}

#endif // SEXAGESIMAL_H