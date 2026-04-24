/*
 * omi_riscv_vm.c
 *
 * OMI-LISP VM for RISC-V virt.
 *
 * Four points of control over the control plane:
 *   0. BOM      0xEF        frame sync / beginning of message
 *   1. ESC      0x1B        mode shift
 *   2. BOUNDARY 0x1C..0x1F FS / GS / RS / US structure separators
 *   3. ECC      0xE0..0xEE binary error-correction witness
 *
 * The runtime keeps direct byte-level control. Every input byte is first
 * represented as a raw binary lexer mask, then projected into HEADER8,
 * dot-notation structure, ECC status, and an emission witness.
 */

#define _DEFAULT_SOURCE

#include <stdint.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/reboot.h>

#define OMI_BOM_BYTE 0xEFu

#define OMI_MASK_BOM       0x0001u
#define OMI_MASK_ESC       0x0002u
#define OMI_MASK_BOUNDARY  0x0004u
#define OMI_MASK_ECC       0x0008u
#define OMI_MASK_REF       0x0010u
#define OMI_MASK_PTR       0x0020u
#define OMI_MASK_PRINT     0x0040u
#define OMI_MASK_DOT       0x0080u
#define OMI_MASK_LPAREN    0x0100u
#define OMI_MASK_RPAREN    0x0200u
#define OMI_MASK_BRAILLE   0x0400u
#define OMI_MASK_AEGEAN    0x0800u

typedef enum {
    OMI_PLANE_ASCII = 0,
    OMI_PLANE_BRAILLE = 1,
    OMI_PLANE_AEGEAN = 2,
    OMI_PLANE_OMICRON = 3
} omi_plane_t;

typedef enum {
    OMI_CTL_DATA = 0,
    OMI_CTL_BOM = 1,
    OMI_CTL_ESC = 2,
    OMI_CTL_BOUNDARY = 3,
    OMI_CTL_ECC = 4
} omi_control_kind_t;

static omi_control_kind_t control_kind(uint8_t b);

typedef enum {
    OMI_MODE_STREAM = 0,
    OMI_MODE_DOT = 1,
    OMI_MODE_ADDER = 2
} omi_mode_t;

typedef struct {
    uint8_t synced;
    uint8_t esc_active;
    uint8_t boundary;
    uint8_t ecc_status;
    uint8_t ecc_nibble;
    omi_mode_t mode;
} omi_control_plane_t;

typedef struct {
    uint8_t raw;
    uint8_t corrected;
    uint8_t data;
    uint8_t syndrome;
    uint8_t status;
} omi_ecc_witness_t;

typedef struct {
    uint8_t bytes[8];
    uint8_t ecc_low[8];
    uint8_t ecc_high[8];
} omi_header8_t;

typedef struct {
    const char *name;
    uint16_t radix;
    uint16_t digit;
} omi_radix_witness_t;

typedef struct {
    uint8_t active;
    uint8_t index;
    uint8_t bits[9];
} omi_adder_frame_t;

typedef struct {
    uint64_t tick;
    uint8_t previous_state;
    uint8_t current_state;
    uint8_t input;
    uint8_t winner;
    uint8_t header8_current;
    uint8_t list_depth;
    uint8_t dot_pending;
    uint8_t pair_left;
    uint8_t last_atom;
    uint8_t has_last_atom;
    uint32_t digest;
    omi_control_plane_t control;
    omi_header8_t header8;
    omi_adder_frame_t adder;
} omi_state_t;

static uint8_t rotl8(uint8_t x, unsigned k) {
    k &= 7u;
    return (uint8_t)((x << k) | (x >> ((8u - k) & 7u)));
}

static uint8_t rotr8(uint8_t x, unsigned k) {
    k &= 7u;
    return (uint8_t)((x >> k) | (x << ((8u - k) & 7u)));
}

static uint32_t fnv1a32(const void *data, size_t length) {
    const uint8_t *p = (const uint8_t *)data;
    uint32_t h = UINT32_C(2166136261);
    for (size_t i = 0; i < length; ++i) {
        h ^= p[i];
        h *= UINT32_C(16777619);
    }
    return h;
}

static uint8_t hamming84_encode(uint8_t nibble) {
    uint8_t d0 = (uint8_t)((nibble >> 0) & 1u);
    uint8_t d1 = (uint8_t)((nibble >> 1) & 1u);
    uint8_t d2 = (uint8_t)((nibble >> 2) & 1u);
    uint8_t d3 = (uint8_t)((nibble >> 3) & 1u);
    uint8_t p1 = (uint8_t)(d0 ^ d1 ^ d3);
    uint8_t p2 = (uint8_t)(d0 ^ d2 ^ d3);
    uint8_t p4 = (uint8_t)(d1 ^ d2 ^ d3);
    uint8_t code = 0;

    code |= (uint8_t)(p1 << 0);
    code |= (uint8_t)(p2 << 1);
    code |= (uint8_t)(d0 << 2);
    code |= (uint8_t)(p4 << 3);
    code |= (uint8_t)(d1 << 4);
    code |= (uint8_t)(d2 << 5);
    code |= (uint8_t)(d3 << 6);
    code |= (uint8_t)((p1 ^ p2 ^ d0 ^ p4 ^ d1 ^ d2 ^ d3) << 7);
    return code;
}

static omi_ecc_witness_t hamming84_decode(uint8_t code) {
    omi_ecc_witness_t w;
    uint8_t b1 = (uint8_t)((code >> 0) & 1u);
    uint8_t b2 = (uint8_t)((code >> 1) & 1u);
    uint8_t b3 = (uint8_t)((code >> 2) & 1u);
    uint8_t b4 = (uint8_t)((code >> 3) & 1u);
    uint8_t b5 = (uint8_t)((code >> 4) & 1u);
    uint8_t b6 = (uint8_t)((code >> 5) & 1u);
    uint8_t b7 = (uint8_t)((code >> 6) & 1u);
    uint8_t b8 = (uint8_t)((code >> 7) & 1u);
    uint8_t s1 = (uint8_t)(b1 ^ b3 ^ b5 ^ b7);
    uint8_t s2 = (uint8_t)(b2 ^ b3 ^ b6 ^ b7);
    uint8_t s4 = (uint8_t)(b4 ^ b5 ^ b6 ^ b7);
    uint8_t syndrome = (uint8_t)(s1 | (s2 << 1) | (s4 << 2));
    uint8_t parity = (uint8_t)(b1 ^ b2 ^ b3 ^ b4 ^ b5 ^ b6 ^ b7 ^ b8);
    uint8_t corrected = code;
    uint8_t status = 0;

    if (syndrome != 0u && parity != 0u) {
        corrected ^= (uint8_t)(1u << (syndrome - 1u));
        status = 1u;
    } else if (syndrome == 0u && parity != 0u) {
        corrected ^= 0x80u;
        status = 1u;
    } else if (syndrome != 0u && parity == 0u) {
        status = 2u;
    }

    w.raw = code;
    w.corrected = corrected;
    w.syndrome = syndrome;
    w.status = status;
    w.data = (uint8_t)((((corrected >> 6) & 1u) << 3) |
                       (((corrected >> 5) & 1u) << 2) |
                       (((corrected >> 4) & 1u) << 1) |
                       (((corrected >> 2) & 1u) << 0));
    return w;
}

static omi_plane_t plane_of_byte(uint8_t b) {
    if (control_kind(b) != OMI_CTL_DATA) return OMI_PLANE_OMICRON;
    if (b >= 0xC0u) return OMI_PLANE_AEGEAN;
    if (b >= 0x80u) return OMI_PLANE_BRAILLE;
    return OMI_PLANE_ASCII;
}

static const char *plane_name(omi_plane_t plane) {
    switch (plane) {
        case OMI_PLANE_ASCII: return "ASCII";
        case OMI_PLANE_BRAILLE: return "BRAILLE";
        case OMI_PLANE_AEGEAN: return "AEGEAN";
        case OMI_PLANE_OMICRON: return "OMICRON";
    }
    return "UNKNOWN";
}

static const char *mode_name(omi_mode_t mode) {
    switch (mode) {
        case OMI_MODE_STREAM: return "STREAM";
        case OMI_MODE_DOT: return "DOT";
        case OMI_MODE_ADDER: return "ADDER";
    }
    return "UNKNOWN";
}

static uint8_t omicron_digit(omi_control_kind_t kind) {
    switch (kind) {
        case OMI_CTL_BOM: return 0u;
        case OMI_CTL_ESC: return 1u;
        case OMI_CTL_BOUNDARY: return 2u;
        case OMI_CTL_ECC: return 3u;
        case OMI_CTL_DATA:
        default: return 0u;
    }
}

static omi_radix_witness_t notation_witness(uint8_t b) {
    omi_control_kind_t kind = control_kind(b);
    omi_plane_t plane = plane_of_byte(b);
    omi_radix_witness_t w;

    if (kind != OMI_CTL_DATA) {
        w.name = "OMICRON";
        w.radix = 4u;
        w.digit = omicron_digit(kind);
        return w;
    }

    if (plane == OMI_PLANE_BRAILLE) {
        w.name = "BRAILLE";
        w.radix = 256u;
        w.digit = b;
        return w;
    }

    if (plane == OMI_PLANE_AEGEAN) {
        w.name = "AEGEAN";
        w.radix = 64u;
        w.digit = (uint16_t)(b & 0x3Fu);
        return w;
    }

    w.name = "HEXADECIMAL";
    w.radix = 16u;
    w.digit = (uint16_t)(b & 0x0Fu);
    return w;
}

static uint16_t lexer_mask(uint8_t b) {
    uint16_t m = 0;
    if (b == OMI_BOM_BYTE) m |= OMI_MASK_BOM;
    if (b == 0x1Bu) m |= OMI_MASK_ESC;
    if (b >= 0x1Cu && b <= 0x1Fu) m |= OMI_MASK_BOUNDARY;
    if (b >= 0xE0u && b <= 0xEEu) m |= OMI_MASK_ECC;
    if (b <= 0x0Fu) m |= OMI_MASK_REF;
    if (b >= 0x10u && b <= 0x1Fu) m |= OMI_MASK_PTR;
    if (b >= 0x40u) m |= OMI_MASK_PRINT;
    if (b == 0x2Eu) m |= OMI_MASK_DOT;
    if (b == 0x28u) m |= OMI_MASK_LPAREN;
    if (b == 0x29u) m |= OMI_MASK_RPAREN;
    if (b >= 0x80u && b < 0xC0u) m |= OMI_MASK_BRAILLE;
    if (b >= 0xC0u) m |= OMI_MASK_AEGEAN;
    return m;
}

static omi_control_kind_t control_kind(uint8_t b) {
    if (b == OMI_BOM_BYTE) return OMI_CTL_BOM;
    if (b == 0x1Bu) return OMI_CTL_ESC;
    if (b >= 0x1Cu && b <= 0x1Fu) return OMI_CTL_BOUNDARY;
    if (b >= 0xE0u && b <= 0xEEu) return OMI_CTL_ECC;
    return OMI_CTL_DATA;
}

static uint8_t omi_delta(uint8_t x, uint8_t ecc) {
    return (uint8_t)(rotl8(x, 1u) ^ rotl8(x, 3u) ^ rotr8(x, 2u) ^ ecc);
}

static uint8_t pick_winner(uint8_t prev, uint8_t input, uint64_t tick, uint8_t ecc) {
    uint8_t mixed = (uint8_t)((prev * 17u) ^ (input * 29u) ^ (uint8_t)tick ^ ecc);
    return (uint8_t)(mixed % 7u);
}

static uint8_t next_state(uint8_t prev, uint8_t input, uint8_t winner, uint8_t ecc) {
    uint8_t d = omi_delta((uint8_t)(prev ^ input), ecc);
    return (uint8_t)((prev + input + winner + d) & 0x3Fu);
}

static void header8_set(omi_state_t *st, uint8_t input, uint8_t curr) {
    uint8_t h[8] = {0x00u, 0x1Bu, 0x1Cu, 0x1Du, 0x1Eu, 0x1Fu, input, curr};
    memcpy(st->header8.bytes, h, sizeof(h));
    for (size_t i = 0; i < sizeof(h); ++i) {
        st->header8.ecc_low[i] = hamming84_encode((uint8_t)(h[i] & 0x0Fu));
        st->header8.ecc_high[i] = hamming84_encode((uint8_t)((h[i] >> 4) & 0x0Fu));
    }
}

static uint8_t is_ascii_atom(uint8_t b) {
    if (b <= 0x20u) return 0u;
    if (b == 0x28u || b == 0x29u || b == 0x2Eu) return 0u;
    if (b >= 0x80u) return 0u;
    return 1u;
}

static const char *emit_name(uint8_t b, uint16_t mask) {
    if (mask & OMI_MASK_BOM) return "CONTROL.BOM";
    if (mask & OMI_MASK_ESC) return "CONTROL.ESC";
    if (mask & OMI_MASK_BOUNDARY) return "CONTROL.BOUNDARY";
    if (mask & OMI_MASK_ECC) return "CONTROL.ECC";
    if (mask & OMI_MASK_LPAREN) return "STRUCT.LIST-OPEN";
    if (mask & OMI_MASK_RPAREN) return "STRUCT.LIST-CLOSE";
    if (mask & OMI_MASK_DOT) return "STRUCT.DOT";
    if (mask & OMI_MASK_REF) return "TOKEN.REFERENCE";
    if (mask & OMI_MASK_PTR) return "TOKEN.POINTER";
    if (mask & OMI_MASK_AEGEAN) return "TOKEN.AEGEAN";
    if (mask & OMI_MASK_BRAILLE) return "TOKEN.BRAILLE";
    if (plane_of_byte(b) == OMI_PLANE_ASCII) return "TOKEN.ASCII";
    return "TOKEN.UNKNOWN";
}

static void print_header8(const omi_state_t *st) {
    printf(" header8=[");
    for (size_t i = 0; i < 8u; ++i) {
        printf("%s0x%02X", i == 0u ? "" : " ", st->header8.bytes[i]);
    }
    printf("]");
}

static void print_dot(omi_state_t *st, uint8_t b) {
    if (b == 0x28u) {
        if (st->list_depth != UINT8_MAX) st->list_depth += 1u;
        st->dot_pending = 0u;
        printf(" dot=STRUCT.LIST(depth=%u)", st->list_depth);
        return;
    }
    if (b == 0x29u) {
        printf(" dot=STRUCT.CLOSE(depth=%u)", st->list_depth);
        if (st->list_depth != 0u) st->list_depth -= 1u;
        st->dot_pending = 0u;
        return;
    }
    if (b == 0x2Eu) {
        if (st->has_last_atom) {
            st->pair_left = st->last_atom;
            st->dot_pending = 1u;
            printf(" dot=STRUCT.DOT(left=0x%02X)", st->pair_left);
        } else {
            st->dot_pending = 0u;
            printf(" dot=STRUCT.DOT-DANGLING");
        }
        return;
    }
    if (is_ascii_atom(b)) {
        if (st->dot_pending) {
            printf(" dot=STRUCT.PAIR(left=0x%02X,right=0x%02X)", st->pair_left, b);
            st->dot_pending = 0u;
        } else {
            printf(" dot=STRUCT.ATOM(value=0x%02X)", b);
        }
        st->last_atom = b;
        st->has_last_atom = 1u;
        return;
    }
    printf(" dot=STRUCT.NONE");
}

static uint8_t bit_and(uint8_t a, uint8_t b) {
    return (uint8_t)((a & 1u) & (b & 1u));
}

static uint8_t bit_or(uint8_t a, uint8_t b) {
    return (uint8_t)((a & 1u) | (b & 1u));
}

static uint8_t bit_xor(uint8_t a, uint8_t b) {
    return (uint8_t)((a & 1u) ^ (b & 1u));
}

static uint8_t and3(uint8_t a, uint8_t b, uint8_t c) {
    return bit_and(bit_and(a, b), c);
}

static uint8_t and4(uint8_t a, uint8_t b, uint8_t c, uint8_t d) {
    return bit_and(and3(a, b, c), d);
}

static uint8_t and5(uint8_t a, uint8_t b, uint8_t c, uint8_t d, uint8_t e) {
    return bit_and(and4(a, b, c, d), e);
}

static uint8_t or3(uint8_t a, uint8_t b, uint8_t c) {
    return bit_or(bit_or(a, b), c);
}

static uint8_t or4(uint8_t a, uint8_t b, uint8_t c, uint8_t d) {
    return bit_or(or3(a, b, c), d);
}

static uint8_t or5(uint8_t a, uint8_t b, uint8_t c, uint8_t d, uint8_t e) {
    return bit_or(or4(a, b, c, d), e);
}

static uint8_t nibble_value(uint8_t b0, uint8_t b1, uint8_t b2, uint8_t b3) {
    return (uint8_t)((b0 & 1u) | ((b1 & 1u) << 1) | ((b2 & 1u) << 2) | ((b3 & 1u) << 3));
}

static void print_adder_complete(const omi_state_t *st) {
    uint8_t a0 = st->adder.bits[0];
    uint8_t b0 = st->adder.bits[1];
    uint8_t a1 = st->adder.bits[2];
    uint8_t b1 = st->adder.bits[3];
    uint8_t a2 = st->adder.bits[4];
    uint8_t b2 = st->adder.bits[5];
    uint8_t a3 = st->adder.bits[6];
    uint8_t b3 = st->adder.bits[7];
    uint8_t c0 = st->adder.bits[8];
    uint8_t p0 = bit_xor(a0, b0);
    uint8_t p1 = bit_xor(a1, b1);
    uint8_t p2 = bit_xor(a2, b2);
    uint8_t p3 = bit_xor(a3, b3);
    uint8_t g0 = bit_and(a0, b0);
    uint8_t g1 = bit_and(a1, b1);
    uint8_t g2 = bit_and(a2, b2);
    uint8_t g3 = bit_and(a3, b3);
    uint8_t c1 = bit_or(g0, bit_and(p0, c0));
    uint8_t c2 = or3(g1, bit_and(p1, g0), and3(p1, p0, c0));
    uint8_t c3 = or4(g2, bit_and(p2, g1), and3(p2, p1, g0), and4(p2, p1, p0, c0));
    uint8_t c4 = or5(g3, bit_and(p3, g2), and3(p3, p2, g1), and4(p3, p2, p1, g0), and5(p3, p2, p1, p0, c0));
    uint8_t s0 = bit_xor(p0, c0);
    uint8_t s1 = bit_xor(p1, c1);
    uint8_t s2 = bit_xor(p2, c2);
    uint8_t s3 = bit_xor(p3, c3);
    uint8_t aval = nibble_value(a0, a1, a2, a3);
    uint8_t bval = nibble_value(b0, b1, b2, b3);
    uint8_t sval = nibble_value(s0, s1, s2, s3);
    uint8_t total = (uint8_t)(sval + (uint8_t)(16u * c4));

    printf(" adder={A=%u%u%u%u(%u) B=%u%u%u%u(%u) C0=%u P=%u%u%u%u G=%u%u%u%u C=%u%u%u%u%u S=%u%u%u%u C4=%u value=%u}",
           a3, a2, a1, a0, aval,
           b3, b2, b1, b0, bval,
           c0,
           p3, p2, p1, p0,
           g3, g2, g1, g0,
           c0, c1, c2, c3, c4,
           s3, s2, s1, s0,
           c4,
           total);
    printf(" adder-dot=(ADDER4 . ((inputs . ((A0 . %u) (B0 . %u) (A1 . %u) (B1 . %u) (A2 . %u) (B2 . %u) (A3 . %u) (B3 . %u) (C0 . %u)))",
           a0, b0, a1, b1, a2, b2, a3, b3, c0);
    printf(" (propagate . ((P0 . (XOR A0 B0 . %u)) (P1 . (XOR A1 B1 . %u)) (P2 . (XOR A2 B2 . %u)) (P3 . (XOR A3 B3 . %u))))",
           p0, p1, p2, p3);
    printf(" (generate . ((G0 . (AND A0 B0 . %u)) (G1 . (AND A1 B1 . %u)) (G2 . (AND A2 B2 . %u)) (G3 . (AND A3 B3 . %u))))",
           g0, g1, g2, g3);
    printf(" (carry . ((C1 . (OR G0 (AND P0 C0) . %u)) (C2 . (OR G1 (AND P1 G0) (AND P1 P0 C0) . %u)) (C3 . (OR G2 (AND P2 G1) (AND P2 P1 G0) (AND P2 P1 P0 C0) . %u)) (C4 . (OR G3 (AND P3 G2) (AND P3 P2 G1) (AND P3 P2 P1 G0) (AND P3 P2 P1 P0 C0) . %u))))",
           c1, c2, c3, c4);
    printf(" (sum . ((S0 . (XOR P0 C0 . %u)) (S1 . (XOR P1 C1 . %u)) (S2 . (XOR P2 C2 . %u)) (S3 . (XOR P3 C3 . %u))))",
           s0, s1, s2, s3);
    printf(" (outputs . ((S0 . %u) (S1 . %u) (S2 . %u) (S3 . %u) (C4 . %u)))))",
           s0, s1, s2, s3, c4);
}

static void adder_reset(omi_state_t *st) {
    memset(&st->adder, 0, sizeof(st->adder));
}

static uint8_t adder_accept_byte(omi_state_t *st, uint8_t b) {
    if (st->control.mode != OMI_MODE_ADDER) return 0u;

    if (b != (uint8_t)'0' && b != (uint8_t)'1') {
        printf(" adder-error={index=%u byte=0x%02X reason=non-bit}", st->adder.index, b);
        return 1u;
    }

    if (st->adder.index < 9u) {
        st->adder.bits[st->adder.index] = (uint8_t)(b - (uint8_t)'0');
        printf(" adder-input={index=%u bit=%u}", st->adder.index, st->adder.bits[st->adder.index]);
        st->adder.index += 1u;
    }

    if (st->adder.index == 9u) {
        print_adder_complete(st);
        adder_reset(st);
        st->control.mode = OMI_MODE_STREAM;
        printf(" mode-transition=ADDER->STREAM");
    }

    return 1u;
}

static void process_byte(omi_state_t *st, uint8_t b) {
    uint16_t mask = lexer_mask(b);
    omi_control_kind_t kind = control_kind(b);
    omi_radix_witness_t notation = notation_witness(b);
    omi_ecc_witness_t ew = hamming84_decode(hamming84_encode((uint8_t)(b & 0x0Fu)));
    uint8_t entered_adder = 0u;
    uint8_t prev;
    uint8_t curr;
    uint8_t winner;

    if (kind == OMI_CTL_BOM) {
        memset(&st->control, 0, sizeof(st->control));
        adder_reset(st);
        st->control.synced = 1u;
    } else if (kind == OMI_CTL_ESC) {
        st->control.esc_active ^= 1u;
    } else if (kind == OMI_CTL_BOUNDARY) {
        st->control.boundary = (uint8_t)(b - 0x1Bu);
    } else if (kind == OMI_CTL_ECC) {
        ew = hamming84_decode(b);
        st->control.ecc_status = ew.status;
        st->control.ecc_nibble = ew.data;
    }

    if (kind == OMI_CTL_DATA && st->control.esc_active && b == (uint8_t)'A') {
        st->control.mode = OMI_MODE_ADDER;
        st->control.esc_active = 0u;
        adder_reset(st);
        st->adder.active = 1u;
        entered_adder = 1u;
    } else if (kind == OMI_CTL_DATA && st->control.esc_active && b == (uint8_t)'D') {
        st->control.mode = OMI_MODE_DOT;
        st->control.esc_active = 0u;
    } else if (kind == OMI_CTL_DATA && st->control.esc_active && b == (uint8_t)'S') {
        st->control.mode = OMI_MODE_STREAM;
        st->control.esc_active = 0u;
    }

    prev = st->current_state;
    winner = pick_winner(prev, b, st->tick + 1u, st->control.ecc_nibble);
    curr = next_state(prev, b, winner, st->control.ecc_nibble);
    st->tick += 1u;
    st->previous_state = prev;
    st->current_state = curr;
    st->input = b;
    st->winner = winner;
    header8_set(st, b, curr);
    st->digest = fnv1a32(st->header8.bytes, sizeof(st->header8.bytes));

    printf("tick=%llu raw=0b",
           (unsigned long long)st->tick);
    for (int bit = 7; bit >= 0; --bit) {
        printf("%u", (unsigned)((b >> bit) & 1u));
    }
    printf(" input=0x%02X mask=0x%04X cp={bom=%u esc=%u boundary=%u ecc=%u:%X mode=%s}",
           b,
           mask,
           st->control.synced,
           st->control.esc_active,
           st->control.boundary,
           st->control.ecc_status,
           st->control.ecc_nibble,
           mode_name(st->control.mode));
    printf(" plane=%s state=0x%02X winner=%u emit=%s",
           plane_name(plane_of_byte(b)),
           curr,
           winner,
           emit_name(b, mask));
    printf(" radix={binary=2 hex=16 notation=%s:%u digit=%u}",
           notation.name,
           notation.radix,
           notation.digit);
    print_header8(st);
    printf(" ecc={low=0x%02X high=0x%02X syndrome=%u status=%u}",
           st->header8.ecc_low[6],
           st->header8.ecc_high[6],
           ew.syndrome,
           ew.status);
    print_dot(st, b);
    if (entered_adder) {
        printf(" mode-transition=STREAM->ADDER adder-frame={need=9 order=A0,B0,A1,B1,A2,B2,A3,B3,C0}");
    } else if (kind != OMI_CTL_BOM) {
        (void)adder_accept_byte(st, b);
    }
    printf(" digest=0x%08X\n", st->digest);
}

static void run_stream(const uint8_t *bytes, size_t length) {
    omi_state_t st;
    memset(&st, 0, sizeof(st));
    for (size_t i = 0; i < length; ++i) {
        process_byte(&st, bytes[i]);
    }
}

static void run_stdin(void) {
    omi_state_t st;
    int c;
    memset(&st, 0, sizeof(st));
    while ((c = getchar()) != EOF) {
        process_byte(&st, (uint8_t)c);
    }
}

int main(int argc, char **argv) {
    if (argc > 1 && strcmp(argv[1], "-") == 0) {
        printf("omi_riscv_vm stdin\n");
        printf("==================\n");
        run_stdin();
        return 0;
    }

    {
        const uint8_t boot_stream[] = {
            OMI_BOM_BYTE,
            0xE1u,
            0x1Bu,
            'A',
            '1',
            '1',
            '0',
            '1',
            '1',
            '0',
            '0',
            '0',
            '0',
            0x1Du,
            0x1Eu,
            0x1Fu,
            0x28u,
            0x41u,
            0x2Eu,
            0x42u,
            0x29u,
            0x80u,
            0xC0u
        };
        printf("omi_riscv_vm boot\n");
        printf("=================\n");
        run_stream(boot_stream, sizeof(boot_stream));
    }

    fflush(stdout);
    if (getpid() == 1) {
        sync();
        reboot(RB_POWER_OFF);
        for (;;) {
            pause();
        }
    }
    return 0;
}
