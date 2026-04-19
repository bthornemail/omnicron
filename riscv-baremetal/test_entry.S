/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: PROBE
 *
 * This is the smallest possible assembly entry test in the tree. It boots and
 * immediately jumps into an endless loop.
 *
 * Use it only to prove that control reaches `_start`; it does not test any
 * higher-level OMICRON behavior.
 */
.section .text
.globl _start
_start:
    # Simple endless loop first
.loop:
    j .loop
