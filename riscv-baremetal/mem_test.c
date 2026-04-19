#include <stdint.h>

#define MEM_LOG 0x10012000

static volatile uint32_t *log_base = (volatile uint32_t *)MEM_LOG;

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
    log_base[0] = 0xDEADBEEF;
    log_base[1] = 0xCAFEBABE;
    log_base[2] = 0x0BADF00D;
    log_base[3] = 0xFEEDFACE;
    log_base[4] = 0x1C0FFEE5;
    log_base[5] = 0x2BADD11C;
    log_base[6] = 0x3A55C0DE;
    log_base[7] = 0x4700D1CE;
    
    while (1) {
        sbi_call(1, '.', 0, 0, 0, 0);
    }
}