/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: SUPPORT FILE / PROTOTYPE BOOT SHAPE
 *
 * This startup file preloads a handful of registers with OMICRON-flavored
 * state before jumping to `main`. It is still only boot glue: the actual
 * behavior lives in C after the jump.
 *
 * The values placed in s0-s6 are a boot-time sketch of phase, BOM, logic
 * window, and a few constitutional constants.
 */
.section .text
.globl _start
.type _start, @function

# OMICRON Foundational Rotation Loop
# Initializes the Three Sequencing Functions before any code runs

_start:
    # Disable interrupts first
    csrci mstatus, 3

    # Check hart ID - only hart 0 runs
    csrr t0, mhartid
    bnez t0, wait_for_hart

    # Initialize stack pointer
    la sp, _stack_top

    # Initialize OMICRON state in s0
    # Phase = 0 (7! cycle position)
    # BOM = 0xFFFE (starting chirality)
    # Logic window = 0
    # These saved registers are acting as a very small boot-time state sketch.
    li s0, 0           # phase = 0
    li s1, 0xFFFE      # bomMode = FFFE (Little Endian default)
    li s2, 0          # logic_window = 0

    # Initialize FANO state (7 points)
    li s3, 7          # fano_points = 7
    li s4, 15          # lane_depth = 15
    li s5, 60         # slot_surface = 60

    # Master period = 5040 (7! * 60 * 12)
    # The comment is historical/intended language; the literal runtime fact is
    # simply that s6 receives the constant 5040.
    li t0, 5040
    mv s6, t0         # master_period

    # Now jump to main
    j main

wait_for_hart:
    wfi
    j wait_for_hart

.size _start, .-_start

# External C functions
.global main
.global interpolate_stream
.global apply_chiral_payload

# BSS section for stack
.section .bss
.align 4
_stack_top:
.skip 16384
