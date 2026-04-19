#include <stdint.h>

typedef struct {
    uint64_t regs[64];
    uint8_t current_channel;
    uint8_t current_pos;
    uint8_t escaping;
    uint16_t chirality;
    uint8_t depth;
    uint32_t fas;
} OmicronState;

static OmicronState g_state;

void __attribute__((section(".text"))) puthex(uint64_t val) {
    for (int i = 60; i >= 0; i -= 4) {
        char c = "0123456789ABCDEF"[(val >> i) & 0xF];
        volatile char *uart = (volatile char *)0x10000000;
        *uart = c;
        for (volatile int d = 0; d < 1000; d++);
    }
}

void __attribute__((section(".text"))) puts(const char *s) {
    while (*s) {
        volatile char *uart = (volatile char *)0x10000000;
        *uart = *s++;
        for (volatile int d = 0; d < 1000; d++);
    }
}

void __attribute__((section(".text"))) putc(char c) {
    volatile char *uart = (volatile char *)0x10000000;
    *uart = c;
    for (volatile int d = 0; d < 1000; d++);
}

void __attribute__((section(".text"))) apply_chiral_payload(OmicronState *s, uint8_t byte) {
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
    g_state.current_channel = 0;
    g_state.current_pos = 0;
    g_state.escaping = 0;
    g_state.chirality = 0xFFFE;
    g_state.depth = 0;
    g_state.fas = 0;

    puts("\r\n=== OMICRON STREAM INTERPOLATOR ===\r\n");
    puts("BOM: FFFE\r\n");

    for (int i = 0; i < 8; i++) {
        interpolate_stream(&g_state, 0xAA);
    }

    puts("Ch0 payload: 0xAAAAAAAA\r\n");

    g_state.chirality = 0xFEFF;
    puts("BOM: FEFF (toggled)\r\n");

    dump_state(&g_state);

    while (1) { }
}