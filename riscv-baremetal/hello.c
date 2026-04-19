/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: PROBE
 *
 * Tiny UART smoke test.
 *
 * This file does one thing: write `H` repeatedly to the memory-mapped UART.
 * It is a bring-up probe, not part of the OMICRON runtime path.
 */
void main(void) {
    volatile unsigned long *uart = (volatile unsigned long *)0x10000000;
    while (1) {
        *uart = 'H';
        for (volatile int i = 0; i < 10000; i++);
    }
}
