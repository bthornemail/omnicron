#include <stdint.h>

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: DEMO
 *
 * Console-heavy 4-channel demo.
 *
 * This file is a readable standalone demonstration of the 4-channel idea:
 * it prints banners, pushes fixed payloads through `interpolate`, toggles BOM,
 * then dumps state. It is not the active runtime path behind `my_kernel.flat`.
 */

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

void putchar(long c) { sbi_call(1, c, 0, 0, 0, 0); }
void puts(const char *s) { while (*s) putchar(*s++); }

void puthex(long val) {
    for (int i = 28; i >= 0; i -= 4) {
        putchar("0123456789ABCDEF"[(val >> i) & 0xF]);
    }
}

typedef struct {
    uint64_t regs[64];
    uint8_t channel;
    uint8_t pos;
    uint8_t esc;
    uint16_t bom;
    uint32_t cycles;
} omicron_t;

static omicron_t om;

void interpolate(omicron_t *o, uint8_t b) {
    if (o->esc) {
        o->channel = (b >> 6) & 3;
        o->pos = b & 0x3F;
        o->esc = 0;
    } else if (b == 0x1B) {
        o->esc = 1;
    } else {
        if (o->pos < 64) {
            if (o->bom == 0xFE) {
                o->regs[o->pos] = (o->regs[o->pos] << 8) | b;
            } else {
                o->regs[o->pos] = (o->regs[o->pos] >> 8) | ((uint64_t)b << 56);
            }
        }
        o->pos = (o->pos + 1) & 0x3F;
    }
    o->cycles++;
}

void dump_state(omicron_t *o) {
    puts("\r\n=== OMICRON STATE ===\r\n");
    puts("Ch:"); putchar('0' + o->channel);
    puts(" Pos:"); puthex(o->pos);
    puts(" BOM:"); puthex(o->bom);
    puts(" Cycles:"); puthex(o->cycles);
    puts("\r\nReg[0-3]:");
    puthex(o->regs[0]); putchar(' ');
    puthex(o->regs[1]); putchar(' ');
    puthex(o->regs[2]); putchar(' ');
    puthex(o->regs[3]); putchar('\r'); putchar('\n');
}

void main(void) {
    om.channel = 0;
    om.pos = 0;
    om.esc = 0;
    om.bom = 0xFFFE;
    om.cycles = 0;

    puts("\r\n=== OMICRON 4-CHAN INTERPOLATOR ===\r\n");
    puts("Ch0:2-4-8-16-256 (Binary)\r\n");
    puts("Ch1:7-15-60 (Decimal)\r\n");
    puts("Ch2:240-256 (Hex)\r\n");
    puts("Ch3:BOM-Chiral (Sign)\r\n");
    puts("MASTER:5040\r\n");

    for (int i = 0; i < 8; i++) {
        interpolate(&om, 0xAA);
    }
    puts("\r\nBinary payload: ");
    puthex(om.regs[0]);

    om.bom = 0xFEFF;
    for (int i = 0; i < 8; i++) {
        interpolate(&om, 0x55);
    }
    puts("\r\nSign payload (FEFF): ");
    puthex(om.regs[0]);

    dump_state(&om);

    while (1) { }
}
