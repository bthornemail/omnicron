.section .text
.globl _start
.type _start, @function

_start:
    .cfi_startproc
    .cfi_undefined ra

    csrr t0, mhartid
    bnez t0, wait_for_hart

    la sp, _stack_end
    la tp, _tbs_start
    call main
    j .

wait_for_hart:
    wfi
    j wait_for_hart

.size _start, .-_start
.end:
    nop
    .cfi_endproc

.section .bss
.space 16384

_stack_end:
.global _tbs_start
_tbs_start:
.space 16384

_tbs_end: