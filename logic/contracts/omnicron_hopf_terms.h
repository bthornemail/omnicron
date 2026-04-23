#ifndef OMNICRON_HOPF_TERMS_H
#define OMNICRON_HOPF_TERMS_H

#include <stdint.h>

/*
 * Canonical Hopf-term nibble space.
 *
 * IMPORTANT:
 * - These are abstract canonical nibble identities (0x0..0xF).
 * - They are NOT bound to one rendering charset.
 * - ASCII/Aegean/Braille/RTL-LTR views are derived projections.
 */
typedef enum {
    HOPF_TERM_0 = 0x0,
    HOPF_TERM_1 = 0x1,
    HOPF_TERM_2 = 0x2,
    HOPF_TERM_3 = 0x3,
    HOPF_TERM_4 = 0x4,
    HOPF_TERM_5 = 0x5,
    HOPF_TERM_6 = 0x6,
    HOPF_TERM_7 = 0x7,
    HOPF_TERM_8 = 0x8,
    HOPF_TERM_9 = 0x9,
    HOPF_TERM_A = 0xA,
    HOPF_TERM_B = 0xB,
    HOPF_TERM_C = 0xC,
    HOPF_TERM_D = 0xD,
    HOPF_TERM_E = 0xE,
    HOPF_TERM_F = 0xF
} HopfTermNibble;

static inline uint8_t hopf_term_nibble(HopfTermNibble t) {
    return ((uint8_t)t) & 0x0Fu;
}

#endif /* OMNICRON_HOPF_TERMS_H */
