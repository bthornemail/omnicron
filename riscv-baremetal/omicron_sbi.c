#include <stdint.h>

#define SBI_CONSOLE_PUTCHAR 1

static volatile long sbi_call(long arg0, long arg1, long arg2, long arg3, long arg4, long arg5) {
    register long a0 asm("a0") = arg0;
    register long a1 asm("a1") = arg1;
    register long a2 asm("a2") = arg2;
    register long a3 asm("a3") = arg3;
    register long a4 asm("a4") = arg4;
    register long a5 asm("a5") = arg5;
    register long ra asm("ra");
    
    asm volatile ("ecall" 
        : "=r"(a0), "=r"(ra)
        : "r"(a0), "r"(a1), "r"(a2), "r"(a3), "r"(a4), "r"(a5)
        : "memory");
    return a0;
}

void putchar(long c) {
    sbi_call(SBI_CONSOLE_PUTCHAR, c, 0, 0, 0, 0);
}

void puts(const char *s) {
    while (*s) {
        putchar(*s++);
    }
}

void main(void) {
    puts("OMICRON BOOT\r\n");
    
    while (1) {
        putchar('.');
        for (volatile int i = 0; i < 1000000; i++);
    }
}