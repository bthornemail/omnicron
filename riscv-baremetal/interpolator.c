#include <stdint.h>

typedef struct {
    uint64_t regs[64];
    uint8_t current_channel;
    uint8_t current_pos;
    uint8_t escaping;
    uint16_t chirality;
    uint8_t depth;
    uint32_t fas;
    uint64_t addr240;
} OmicronState;

static OmicronState g_state;

static volatile long sbi_call(long arg0, long arg1, long arg2, long arg3, long arg4, long arg5) {
    register long a0 asm("a0") = arg0;
    register long a1 asm("a1") = arg1;
    register long a2 asm("a2") = arg2;
    register long a3 asm("a3") = arg3;
    register long a4 asm("a4") = arg4;
    register long a5 asm("a5") = arg5;
    asm volatile ("ecall" : "=r"(a0) : "r"(a0), "r"(a1), "r"(a2), "r"(a3), "r"(a4), "r"(a5));
    return a0;
}

void putchar(long c) { sbi_call(1, c, 0, 0, 0, 0); }
void puts(const char *s) { while (*s) putchar(*s++); }

void puthex64(uint64_t val) {
    for (int i = 60; i >= 0; i -= 4) {
        putchar("0123456789ABCDEF"[(val >> i) & 0xF]);
    }
}

void puthex16(uint16_t val) {
    for (int i = 12; i >= 0; i -= 4) {
        putchar("0123456789ABCDEF"[(val >> i) & 0xF]);
    }
}

void apply_chiral_payload(OmicronState *s, uint8_t byte) {
    uint8_t idx = s->current_pos;
    if (idx < 64) {
        if (s->chirality == 0xFE) {
            s->regs[idx] = (s->regs[idx] << 8) | byte;
        } else {
            s->regs[idx] = (s->regs[idx] >> 8) | ((uint64_t)byte << 56);
        }
    }
}

void interpolate_stream(OmicronState *s, uint8_t byte) {
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

void render_bitboard(OmicronState *s) {
    puts("BB:");
    puthex64(s->regs[0]); putchar(' ');
    puthex64(s->regs[1]); putchar(' ');
    puthex64(s->regs[2]); putchar(' ');
    puthex64(s->regs[3]); putchar('\r'); putchar('\n');
}

void main(void) {
    g_state.current_channel = 0;
    g_state.current_pos = 0;
    g_state.escaping = 0;
    g_state.chirality = 0xFFFE;
    g_state.depth = 0;
    g_state.fas = 0;
    g_state.addr240 = 0;

    puts("\r\n=== OMICRON STREAM INTERPOLATOR ===\r\n");
    puts("BOM:FFFE Ch0:Binary\r\n");

    for (int i = 0; i < 8; i++) interpolate_stream(&g_state, 0xAA);
    render_bitboard(&g_state);

    g_state.chirality = 0xFEFF;
    puts("BOM:FEFF Ch3:Sign\r\n");
    for (int i = 0; i < 8; i++) interpolate_stream(&g_state, 0x55);
    render_bitboard(&g_state);

    g_state.current_pos = 0;
    interpolate_stream(&g_state, 0x1B);
    interpolate_stream(&g_state, 0x40);
    interpolate_stream(&g_state, 0x00);
    interpolate_stream(&g_state, 0x00);
    interpolate_stream(&g_state, 0x00);
    interpolate_stream(&g_state, 0x00);
    interpolate_stream(&g_state, 0x00);
    interpolate_stream(&g_state, 0x01);

    puts("FAS:0001 Pos:00\r\n");
    render_bitboard(&g_state);

    puts("=== MASTER_PERIOD:5040 ===\r\n");
    puts("CH:"); putchar('0' + g_state.current_channel); putchar(' ');
    puts("PS:"); puthex16(g_state.current_pos); putchar(' ');
    puts("DP:"); puthex16(g_state.depth); putchar('\r'); putchar('\n');

    while (1) { }
}
