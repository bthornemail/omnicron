#include <stdint.h>

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: DEMO
 *
 * Heartbeat demo kernel.
 *
 * This file isolates the three sequencing functions:
 * - phase rotation
 * - BOM/chirality toggling
 * - logic-window rotation
 *
 * It also demonstrates local byte interpolation, but it is still a self-driven
 * demo and not the live `my_kernel.flat` guest path.
 */

#define MASTER_PERIOD 5040
#define FANO_POINTS 7
#define LANE_DEPTH 15
#define SLOT_SURFACE 60

typedef struct {
    uint64_t regs[64];
    uint32_t phase;
    uint16_t bom_mode;
    uint8_t logic_window;
    uint8_t channel;
    uint8_t pos;
    uint8_t escaping;
} omicron_state_t;

static omicron_state_t g_omicron;

// ============================================================
// THE THREE SEQUENCING FUNCTIONS (Heartbeat)
// ============================================================

// 1. Phase Rotation: 7! cycle position
static void rotate_phase(omicron_state_t *s) {
    s->phase = (s->phase + 1) % MASTER_PERIOD;
}

// 2. Chiral Bit Flip: BOM oscillation  
static void rotate_chiral(omicron_state_t *s) {
    // Even phase: FFFE (LE), Odd phase: FEFF (BE)
    s->bom_mode = (s->phase % 2 == 0) ? 0xFFFE : 0xFEFF;
}

// 3. Logic Window: 15/16 sliding window
static void rotate_logic(omicron_state_t *s) {
    // Slides the 16-bit window across the 240-bit resolution
    s->logic_window = s->phase % LANE_DEPTH;
}

// One heartbeat cycle
static void heartbeat(omicron_state_t *s) {
    rotate_phase(s);
    rotate_chiral(s);
    rotate_logic(s);
}

// ============================================================
// STREAM INTERPOLATOR
// ============================================================

static void apply_chiral_payload(omicron_state_t *s, uint8_t byte) {
    uint8_t idx = s->pos;
    if (idx < 64) {
        if (s->bom_mode == 0xFE) {
            s->regs[idx] = (s->regs[idx] << 8) | byte;
        } else {
            s->regs[idx] = (s->regs[idx] >> 8) | ((uint64_t)byte << 56);
        }
    }
}

static void interpolate_stream(omicron_state_t *s, uint8_t byte) {
    if (s->escaping) {
        s->channel = (byte >> 6) & 0x03;
        s->pos = byte & 0x3F;
        s->escaping = 0;
    } else if (byte == 0x1B) {
        s->escaping = 1;
    } else {
        apply_chiral_payload(s, byte);
    }
}

// ============================================================
// SBI CONSOLE
// ============================================================

static volatile long sbi_call(long a0, long a1, long a2, long a3, long a4, long a5) {
    register long r0 asm("a0") = a0;
    register long r1 asm("a1") = a1;
    register long r2 asm("a2") = a2;
    register long r3 asm("a3") = a3;
    register long r4 asm("a4") = a4;
    register long r5 asm("a5") = a5;
    asm volatile ("ecall" : "+r"(r0) : "r"(r1), "r"(r2), "r"(r3), "r"(r4), "r"(r5));
    return r0;
}

static void putchar(long c) { sbi_call(1, c, 0, 0, 0, 0); }
static void puts(const char *s) { while (*s) putchar(*s++); }

static void puthex32(uint32_t val) {
    for (int i = 28; i >= 0; i -= 4) {
        putchar("0123456789ABCDEF"[(val >> i) & 0xF]);
    }
}

static void puthex16(uint16_t val) {
    for (int i = 12; i >= 0; i -= 4) {
        putchar("0123456789ABCDEF"[(val >> i) & 0xF]);
    }
}

// ============================================================
// PRINT STATE
// ============================================================

static void dump_state(omicron_state_t *s) {
    puts("\r\n=== OMICRON STATE ===\r\n");
    puts("Ph:"); puthex32(s->phase); putchar(' ');
    puts("BOM:"); puthex16(s->bom_mode); putchar(' ');
    puts("Win:"); puthex16(s->logic_window); putchar(' ');
    puts("Ch:"); putchar('0' + s->channel); putchar(' ');
    puts("Ps:"); puthex16(s->pos); putchar('\r'); putchar('\n');
}

// ============================================================
// MAIN
// ============================================================

void main(void) {
    /* Demo path: run a bounded heartbeat sample, then print the resulting state. */
    // Initialize state
    g_omicron.phase = 0;
    g_omicron.bom_mode = 0xFFFE;
    g_omicron.logic_window = 0;
    g_omicron.channel = 0;
    g_omicron.pos = 0;
    g_omicron.escaping = 0;

    puts("\r\n=== OMICRON HEARTBEAT ===\r\n");
    puts("3-Function Rotation\r\n");
    puts("5040 MASTER PERIOD\r\n");

    for (int i = 0; i < MASTER_PERIOD && i < 100; i++) {
        heartbeat(&g_omicron);
    }

    dump_state(&g_omicron);

    puts("\r\nPayload: ");
    for (int i = 0; i < 8; i++) {
        interpolate_stream(&g_omicron, 0xAA);
    }
    puthex32((uint32_t)g_omicron.regs[0]);

    puts("\r\nBOM Toggle: ");
    g_omicron.bom_mode = 0xFEFF;
    for (int i = 0; i < 8; i++) {
        interpolate_stream(&g_omicron, 0x55);
    }
    puthex32((uint32_t)g_omicron.regs[0]);

    puts("\r\n=== COMPLETE ===\r\n");
    while (1) { }
}
