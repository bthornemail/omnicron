#include <stdint.h>

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: PROBE
 *
 * Lowest-risk idle kernel.
 *
 * This does nothing except wait-for-interrupt forever. Use it as a baseline
 * "guest can boot and stay alive" image, not as an OMICRON behavior test.
 */

void main(void) {
    while (1) { __asm__("wfi"); }
}
