OUTPUT_ARCH(riscv)
OUTPUT_FORMAT("elf64-littleriscv")

ENTRY(_start)

MEMORY {
    ram (rwx) : ORIGIN = 0x80200000, LENGTH = 16M
}

SECTIONS {
    .text : {
        *(.text)
    } >ram

    .rodata : {
        *(.rodata)
    } >ram

    .data : {
        *(.data)
    } >ram

    .bss : {
        *(.bss)
        *(COMMON)
    } >ram
}