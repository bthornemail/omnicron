/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: SUPPORT FILE
 *
 * This linker script tells the toolchain where to place code and data in guest
 * RAM. It does not define behavior; it defines memory layout.
 *
 * In plain English:
 * - start executing at `_start`
 * - place text, rodata, data, and bss into one RAM region beginning at
 *   0x80200000
 */
OUTPUT_ARCH(riscv)
OUTPUT_FORMAT("elf64-littleriscv")

ENTRY(_start)

MEMORY {
    /* One simple flat RAM region for the whole guest image. */
    ram (rwx) : ORIGIN = 0x80200000, LENGTH = 16M
}

SECTIONS {
    .text : {
        /* Executable code goes first. */
        *(.text)
    } >ram

    .rodata : {
        /* Read-only constants and string literals. */
        *(.rodata)
    } >ram

    .data : {
        /* Writable initialized globals. */
        *(.data)
    } >ram

    .bss : {
        /* Writable zero-initialized globals and stack-like reserved memory. */
        *(.bss)
        *(COMMON)
    } >ram
}
