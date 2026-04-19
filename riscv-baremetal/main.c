#include <stdint.h>

extern void _putc(char c);
extern void _puts(const char *s);
extern void _puthex(uint64_t val);

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: PROBE
 *
 * This is a tiny hardware-output test program. It relies on external output
 * helpers and toggles a fixed MMIO location that is treated like an LED.
 *
 * It is not part of the OMICRON runtime path. It simply proves that:
 * - text output helpers can be called
 * - a known MMIO register can be written
 */

void main(void) {
    /* Print a boot banner through helper routines supplied elsewhere. */
    _puts("OMICRON BOOT\r\n");
    
    /* Point at one fixed MMIO word and toggle it like a simple LED register. */
    volatile uint64_t *led = (volatile uint64_t *)0x10012000;
    *led = 1;
    
    _puts("LED ON\r\n");
    
    for (volatile int i = 0; i < 1000000; i++);
    
    *led = 0;
    _puts("LED OFF\r\n");
    
    while (1);
}
