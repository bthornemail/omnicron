#include <stdint.h>

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: PROBE
 *
 * Raw MMIO print loop.
 *
 * This file writes `XYZ` directly to the UART MMIO address in a tight loop.
 * It is a hardware-output probe only.
 */
void main(void) {
    volatile long *delay = (volatile long *)0x10000000;
    while (1) {
        *delay = 'X';
        *delay = 'Y';
        *delay = 'Z';
    }
}
