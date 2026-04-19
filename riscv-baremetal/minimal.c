#include <stdint.h>

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: PROBE
 *
 * Minimal SBI console proof-of-life.
 *
 * It prints `OK` once and then spins forever. This is a tiny sanity-check
 * kernel used to confirm that the SBI console path works at all.
 */

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

void main(void) {
    putchar('O');
    putchar('K');
    putchar('\r');
    putchar('\n');
    while (1);
}
