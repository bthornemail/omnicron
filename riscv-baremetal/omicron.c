#include <stdint.h>

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: DEMO
 *
 * UART-backed interpolation demo.
 *
 * This file writes directly to the memory-mapped UART instead of using SBI.
 * Like `interpolator.c`, it demonstrates the stream model by feeding itself
 * fixed bytes. It is a demo kernel, not the current production runtime path.
 */

typedef struct {
    uint64_t regs[64];         // 64 storage slots for packed bytes.
    uint8_t current_channel;   // Which logical channel is active.
    uint8_t current_pos;       // Where the next byte lands inside the surface.
    uint8_t escaping;          // Non-zero means the next byte is control.
    uint16_t chirality;        // Current BOM / byte-order mode.
    uint8_t depth;             // Extra field reserved for future depth logic.
    uint32_t fas;              // Extra field reserved for future FAS-style use.
} OmicronState;

static OmicronState g_state;

void __attribute__((section(".text"))) puthex(uint64_t val) {
    /* Print a 64-bit value directly to the UART one nibble at a time. */
    for (int i = 60; i >= 0; i -= 4) {
        char c = "0123456789ABCDEF"[(val >> i) & 0xF];
        volatile char *uart = (volatile char *)0x10000000;
        *uart = c;
        for (volatile int d = 0; d < 1000; d++);
    }
}

void __attribute__((section(".text"))) puts(const char *s) {
    /* Print a string directly to the UART MMIO address. */
    while (*s) {
        volatile char *uart = (volatile char *)0x10000000;
        *uart = *s++;
        for (volatile int d = 0; d < 1000; d++);
    }
}

void __attribute__((section(".text"))) putc(char c) {
    /* Print one character directly to the UART MMIO address. */
    volatile char *uart = (volatile char *)0x10000000;
    *uart = c;
    for (volatile int d = 0; d < 1000; d++);
}

void __attribute__((section(".text"))) apply_chiral_payload(OmicronState *s, uint8_t byte) {
    /* Store one payload byte into the current register slot. */
    uint8_t idx = s->current_pos;
    if (idx < 64) {
        if (s->chirality == 0xFE) {
            s->regs[idx] = (s->regs[idx] << 8) | byte;
        } else {
            s->regs[idx] = (s->regs[idx] >> 8) | ((uint64_t)byte << 56);
        }
    }
}

void __attribute__((section(".text"))) interpolate_stream(OmicronState *s, uint8_t byte) {
    /* ESC means the next byte is interpreted as channel/position control. */
    if (s->escaping) {
        s->current_channel = (byte >> 6) & 0x03;
        s->current_pos = byte & 0x3F;
        s->escaping = 0;
    } else if (byte == 0x1B) {
        s->escaping = 1;
    } else {
        apply_chiral_payload(s, byte);
    }
}

void __attribute__((section(".text"))) dump_state(OmicronState *s) {
    /* Print the core fields and the first few registers for human inspection. */
    puts("\r\nOMICRON STATE\r\n");
    putc('C'); putc('h'); putc(':'); puthex(s->current_channel); putc('\r'); putc('\n');
    putc('P'); putc('o'); putc('s'); putc(':'); puthex(s->current_pos); putc('\r'); putc('\n');
    putc('B'); putc('O'); putc('M'); putc(':'); puthex(s->chirality); putc('\r'); putc('\n');
    putc('R'); putc('0'); putc('='); puthex(s->regs[0]); putc(' ');
    putc('R'); putc('1'); putc('='); puthex(s->regs[1]); putc(' ');
    putc('R'); putc('2'); putc('='); puthex(s->regs[2]); putc(' ');
    putc('R'); putc('3'); putc('='); puthex(s->regs[3]); putc('\r'); putc('\n');
}

void main(void) {
    /* Demo path: initialize blank state, feed a fixed payload, then print it. */
    g_state.current_channel = 0;
    g_state.current_pos = 0;
    g_state.escaping = 0;
    g_state.chirality = 0xFFFE;
    g_state.depth = 0;
    g_state.fas = 0;

    puts("\r\n=== OMICRON STREAM INTERPOLATOR ===\r\n");
    puts("BOM: FFFE\r\n");

    for (int i = 0; i < 8; i++) {
        /* Feed eight AA bytes into the local interpreter. */
        interpolate_stream(&g_state, 0xAA);
    }

    puts("Ch0 payload: 0xAAAAAAAA\r\n");

    g_state.chirality = 0xFEFF;
    puts("BOM: FEFF (toggled)\r\n");

    /* Print the state after the chirality change and first payload. */
    dump_state(&g_state);

    /* Stay alive forever so the UART output remains the final visible result. */
    while (1) { }
}
