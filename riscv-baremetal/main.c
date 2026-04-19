#include <stdint.h>

extern void _putc(char c);
extern void _puts(const char *s);
extern void _puthex(uint64_t val);

void main(void) {
    _puts("OMICRON BOOT\r\n");
    
    volatile uint64_t *led = (volatile uint64_t *)0x10012000;
    *led = 1;
    
    _puts("LED ON\r\n");
    
    for (volatile int i = 0; i < 1000000; i++);
    
    *led = 0;
    _puts("LED OFF\r\n");
    
    while (1);
}