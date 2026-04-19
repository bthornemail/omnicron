/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: SUPPORT FILE
 *
 * This is the simplest startup stub in the tree. It skips most boot-time
 * ceremony, sets a stack, preloads a few argument registers, and jumps into
 * `main`.
 *
 * Use this as a bring-up helper when full startup logic is unnecessary.
 */
.section .text
.globl _start
.type _start, @function

# This is loaded by OpenSBI at 0x80200000
# but we need to jump past the normal startup to our main

_start:
    # Simple warm boot - just jump directly to C main
    # Skip the hart ID check since we're already in S-mode
    
    # Set up minimal stack
    la sp, _stack_top
    
    # Initialize Omicron state in a0-a3 as parameters (if needed)
    # These values only matter if the C `main` chooses to read them.
    li a0, 0    # phase = 0
    li a1, 0xFFFE # bom = FFFE
    li a2, 0    # channel = 0
    li a3, 0    # pos = 0
    
    # Call main (will never return since main loops forever)
    jal main
    
    # If we get here, something went wrong - halt
    ebreak
    j .

.size _start, .-_start

# Stack area (16KB)
.section .bss
.align 4
_stack_top:
.skip 16384
