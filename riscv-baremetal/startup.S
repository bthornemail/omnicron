/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: SUPPORT FILE
 *
 * This is a generic assembly entrypoint that boots the guest, lets only hart 0
 * run, sets up a stack, and calls `main`.
 *
 * It is startup glue, not OMICRON logic by itself. Its job is to get control
 * from the firmware into C safely.
 */
.section .text
.globl _start
.type _start, @function

_start:
    .cfi_startproc
    .cfi_undefined ra
    # `.cfi_*` directives are debugger/unwinder hints, not CPU instructions.

    # Read the current hart (hardware thread) ID.
    csrr t0, mhartid
    # Only hart 0 enters the C runtime. Other harts wait forever.
    bnez t0, wait_for_hart

    # Point the stack pointer at the reserved stack space in .bss.
    la sp, _stack_end
    # Set the thread-pointer register to the reserved TLS-style area.
    la tp, _tbs_start
    # Hand control to the C entrypoint.
    call main
    # If main returns, park the CPU forever.
    j .

wait_for_hart:
    # Idle non-primary harts forever.
    # `wfi` means "wait for interrupt": a low-activity sleep instruction.
    wfi
    j wait_for_hart

.size _start, .-_start
.end:
    nop
    .cfi_endproc

.section .bss
/* Reserve scratch memory for the stack and thread-pointer areas. */
.space 16384

_stack_end:
.global _tbs_start
_tbs_start:
/* A second reserved block used as thread-local / per-thread scratch space. */
.space 16384

_tbs_end:
