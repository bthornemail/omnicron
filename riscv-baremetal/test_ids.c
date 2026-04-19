#include <stdint.h>
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
void main(void) {
    sbi_call(1, '*', 0, 0, 0, 0);    // console_putchar
    sbi_call(2, '*', 0, 0, 0, 0);    // maybe console
    sbi_call(0, '*', 0, 0, 0, 0);    // 0
    sbi_call(9, '*', 0, 0, 0, 0);    // set timer
    while(1);
}
