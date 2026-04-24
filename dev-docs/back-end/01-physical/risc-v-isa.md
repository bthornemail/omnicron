# RISC-V ISA: Complete Reference

## What is RISC-V?

RISC-V = Reduced Instruction Set Computer, Version 5:

```
┌─────────────────────────────────────────────────────────────┐
│  RISC-V = RISC, Version 5                           │
│                                                             │
│  - Open, free ISA (no licensing fees)                   │
│  - Modular (base + extensions)                          │
│  - Load-store architecture                           │
│  - 32-bit, 64-bit, or 128-bit                     │
│  - Designed for all scale: embedded → warehouse    │
│  - Used in QEMU virt machine                        │
└─────────────────────────────────────────────────────────────┘
```

## The Base ISA

### RV32I (32-bit Integer)

The foundation - can run a full operating system:

```
RV32I Instructions (40 total):
┌────────────────────────────────────────────────┐
│ Arithmetic:                                    │
│   add    add immediate (addi)                  │
│   subtract (sub)                            │
│   compare (slt, slti, sltu, sltiu)        │
├────────────────────────────────────────────────┤
│ Logical:                                      │
│   and, or, xor (and/or/xor with immediates) │
│   not (xor with -1)                       │
├────────────────────────────────────────────────┤
│ Shift:                                       │
│   shift left (sll, slli)                    │
│   shift right logical (srl, srli)          │
│   shift right arithmetic (sra, srai)         │
├────────────────────────────────────────────────┤
│ Memory:                                      │
│   load (lb, lh, lw, lbu, lhu, lwu)    │
│   store (sb, sh, sw)                     │
├────────────────────────────────────────────────┤
│ Branch/Jump:                                  │
│   branch (beq, bne, blt, bge, bltu, bgeu)│
│   jump (jal, jalr)                         │
│   lui (load upper immediate)               │
│   auipc (add upper immediate to PC)      │
├────────────────────────────────────────────────┤
│ Control:                                     │
│   fence (memory ordering)                  │
│   ecall (system call)                     │
│   ebreak (debug break)                   │
└────────────────────────────────────────────────┘
```

### RV64I (64-bit Integer)

Extends RV32I for 64-bit:
- New instructions: ld, sd (64-bit load/store)
- New instructions: addiw, slliw, srliw, sraiw (32-bit ops in 64-bit)
- Addresses are 64-bit
- Pointers are 64-bit

### RV32E (32-bit Embedded)

Same as RV32I but:
- Only 16 integer registers (x0-x15)
- Same instructions, fewer registers
- For ultra-small embedded systems

### RV128I (128-bit)

Not frozen - experimental:
- 128-bit addresses and integers
- For future systems

## Standard Extensions

### G = IMAFD_Zicsr_Zifencei

The "G" shorthand = everything needed for general-purpose computing:

```
G = I + M + A + F + D + Zicsr + Zifencei
  │   │   │   │  │  │      │
  │   │   │   │  │  │      └─ instruction-fetch fence
  │   │   │   │  │  └─────────── CSR instructions
  │   │   │   │  └─────────────── double-precision FP
  │   │   │   └──────────────── single-precision FP
  │   │   └─────────────────── atomic instructions
  │   └───────────────────── multiply/divide
  └─────────────────────── base integer (RV32I/RV64I)
```

### Extension: M (Multiply/Divide)

```
M Instructions:
  mul    signed multiply (low)
  mulh   signed multiply (high)
  mulhu  unsigned multiply (high)
  mulw   32-bit multiply (low, RV64)
  div    signed divide
  divu   unsigned divide
  divw   32-bit signed divide (RV64)
  rem    signed remainder
  remu   unsigned remainder
  remw   32-bit signed remainder (RV64)
```

### Extension: A (Atomic)

Memory ordering and atomic operations:

```
A Instructions:
  lr.w   load-reserve 32-bit
  sc.w   store-conditional 32-bit
  lr.d   load-reserve 64-bit (RV64)
  sc.d   store-conditional 64-bit (RV64)
  amoadd.w   atomic add
  amoand.w   atomic and
  amoor.w    atomic or
  amoxor.w   atomic xor
  amomin.w   atomic min (signed)
  amomax.w   atomic max (signed)
  amominu.w  atomic min (unsigned)
  amomaxu.w  atomic max (unsigned)
```

### Extension: F (Single-Precision Float)

F = 32-bit floating-point:

```
F Registers: 32 floating-point registers (f0-f31)

F Instructions:
  flw     load float
  fsw     store float
  fadd.s  add
  fsub.s  subtract
  fmul.s  multiply
  fdiv.s  divide
  fsqrt.s square root
  fmin.s  minimum
  fmax.s  maximum
  fcvt.s.w  int to float
  fcvt.w.s  float to int
  feq.s   compare equal
  flt.s   compare less than
  fle.s   compare less or equal
```

### Extension: D (Double-Precision Float)

D = 64-bit floating-point:

```
D Notes:
  - Requires F extension
  - f registers are 64-bit
  - flw → fld, fsw → fsd
```

### Extension: C (Compressed)

16-bit compressed instructions:

```
C Extension:
  ┌──────────────────────────────────────────────┐
  │  32-bit instruction → 16-bit encoding  │
  │                                        │
  │  addi sp, sp, -16  →  c.addi sp, -16│
  │  lw   sp, 0(s0)  →  c.lw   sp, 0│
  │  jal  ra, target →  c.jal target   │
  │  jalr ra, 0     →  c.jr    ra   │
  └──────────────────────────────────────────────┘
  
  Savings: ~25% code size reduction
```

### Extension: V (Vector)

V = Vector operations (1.0 ratified):

```
V Extension:
  - Up to 32 vector registers (v0-v31)
  - Variable-length vectors (vsetvli sets length)
  - 187 instructions total
  - For SIMD, ML, DSP workloads
```

### Extension: B (Bit Manipulation)

B = Bit manipulation (1.0 ratified):

```
B Instructions:
  clz    count leading zeros
  ctz    count trailing zeros
  cpop   count population (1 bits)
  rev8   reverse byte order
  andn   and with negate
  orn    or with negate
  xnor   exclusive nor
  rol    rotate left
  ror    rotate right
  bset   set bit
  bclr   clear bit
  bext   extract bit
  binv   invert bit
```

### Extension: S (Supervisor)

S = Supervisor mode (OS support):

```
S Instructions:
  sret    return from supervisor trap
  sfence.vma  fence virtual memory
  satp   set address translation register
```

### Extension: H (Hypervisor)

H = Hypervisor (virtualization):

```
H Instructions (15):
  hypervisor traps, virtualization
```

### Extension: Zk (Cryptography)

Zk = Scalar cryptography (1.0.1):

```
Zk Instructions (49):
  aes32enc   AES encryption
  aes32dec   AES decryption
  sha256sig  SHA-256 signature
  ...
```

## Register Set

### Integer Registers (32)

| Register | Name | Description | Saved by |
|----------|------|------------|---------|
| x0 | zero | Always zero | - |
| x1 | ra | Return address | Caller |
| x2 | sp | Stack pointer | Callee |
| x3 | gp | Global pointer | - |
| x4 | tp | Thread pointer | - |
| x5-x7 | t0-t2 | Temporaries | Caller |
| x8 | s0/fp | Saved / Frame pointer | Callee |
| x9 | s1 | Saved | Callee |
| x10-x11 | a0-a1 | Args / Return | Caller |
| x12-x17 | a2-a7 | Args | Caller |
| x18-x27 | s2-s11 | Saved | Callee |
| x28-x31 | t3-t6 | Temporaries | Caller |

### Floating-Point Registers (32, with F/D)

| Register | Name | Description | Saved by |
|----------|------|------------|---------|
| f0-f7 | ft0-ft7 | Temp | Caller |
| f8-f9 | fs0-fs1 | Saved | Callee |
| f10-f11 | fa0-fa1 | Arg/Return | Caller |
| f12-f17 | fa2-fa7 | Args | Caller |
| f18-f27 | fs2-fs11 | Saved | Callee |
| f28-f31 | ft8-ft11 | Temp | Caller |

## Instruction Formats

RISC-V has 6 formats:

```
Format      | 31        25 |  20     15 |    10     0
─────────────────────────────────────────────────────
R           |  funct7    |  rs2 rs1  |  funct3 rd |  opcode
I           |    imm[11:0]  | rs1    | funct3 rd | opcode
S           |  imm[11:5] | rs2 rs1 | funct3 imm[4:0] | opcode
B           | [12] imm[10:5] | [11] imm[4:0] |  | (branch)
U           |     imm[31:12]       | rd   | opcode
J           | [20] imm[10:1] |[11] imm[19:12] | rd   | opcode
```

### Opcode Map

| Opcode (7 bits) | Meaning |
|----------------|---------|
| 0000011 | Load |
| 0100011 | Store |
| 1100011 | Branch |
| 1100111 | Jump (JALR) |
| 1101111 | JAL |
| 0010011 | OP-IMM (op with immediate) |
| 0110011 | OP (register-register) |
| 1111011 | M (misaligned atoms) |
| 1110011 | System |

## Privileged Modes

RISC-V has 3 privilege levels + hypervisor:

```
┌─────────────────────────────────────────────────────────────┐
│  Privilege Levels                                    │
├─────────────────────────────────────────────────────────────┤
│  3 (Machine)     - Firmware, boot, M-mode     │
│  2 (Hypervisor)  - Virtualization, H-mode       │
│  1 (Supervisor) - OS kernel, S-mode       │
│  0 (User)       - User programs, U-mode      │
└─────────────────────────────────────────────────────────────┘
```

### Control Registers (CSR)

```
┌─────────────────────────────────────────────┐
│  Machine CSRs (mstatus, mie, mip, etc.)    │
│  Hypervisor CSRs (hstatus, hie, hip)        │
│  Supervisor CSRs (sstatus, sie, sip, satp) │
│  User CSRs (fflags, frm, fcsr)          │
└─────────────────────────────────────────────┘
```

## Memory and Addressing

### Address Space

```
RV32I:  4GB (0x00000000 - 0xFFFFFFFF)
RV64I:  16EB (0 - 0xFFFFFFFFFFFFFFFF)
RV128I: 256YB (experimental)
```

### Memory Organization

```
Typical RV64 virtual memory:
  0x0000000000000000 - 0x00007FFFFFFFFFFF  (user)
  0x0000800000000000 - 0xFFFFFFFFFFFFFFFF  (kernel)
```

### Virtual Memory (SV39)

```
SV39 page tables:
  4KB pages
  2MB superpages
  1GB gigapages
  3-level page table
```

## QEMU and RISC-V

### QEMU Virt Machine

```sh
qemu-system-riscv64 \
  -machine virt \
  -smp 4 \
  -m 512M
```

### RISC-V in QEMU

```
┌─────────────────────────────────────────────────────────────┐
│  QEMU RISC-V Support                                 │
├─────────────────────────────────────────────────────────────┤
│  CPUs:     rv64gc (RV64IMAFDCZicsr_Zifencei)          │
│  Machine: virt                                       │
│  Memory: up to 255GB virtual                        │
│  Devices: UART, RTC, Ethernet, VirtIO                 │
│  Debug:  0x0 RISC-V debug interface                │
└─────────────────────────────────────────────────────────────┘
```

### Common QEMU RISC-V Commands

```sh
# Boot from kernel
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -kernel vmlinuz \
  -initrd initramfs.cpio \
  -append "console=ttyS0"

# With GDB
qemu-system-riscv64 \
  -machine virt \
  -gdb tcp::1234 \
  -S \
  -kernel vmlinuz \
  -initrd initramfs.cpio

# With DTB
qemu-system-riscv64 \
  -machine virt \
  -kernel vmlinuz \
  -initrd initramfs.cpio \
  -dtb virt.dtb
```

### RISC-V Registers in GDB

```gdb
(gdb) info registers
       zero           0x0        x0
          ra           0x0        x1 (return address)
          sp           0x0        x2 (stack pointer)
          gp           0x0        x3 (global pointer)
          tp           0x0        x4 (thread pointer)
          t0           0x0        x5
          t1           0x0        x6
          t2           0x0        x7
          s0           0x0        x8
          s1           0x0        x9
          a0           0x0        x10
          a1           0x0        x11
          a2           0x0        x12
          a3           0x0        x13
          a4           0x0        x14
          a5           0x0        x15
          a6           0x0        x16
          a7           0x0        x17
          s2           0x0        x18
          s3           0x0        x19
          s4           0x0        x20
          s5           0x0        x21
          s6           0x0        x22
          s7           0x0        x23
          s8           0x0        x24
          s9           0x0        x25
          s10          0x0        x26
          s11          0x0        x27
          t3           0x0        x28
          t4           0x0        x29
          t5           0x0        x30
          t6           0x0        x31
          pc           0x0        (program counter)
```

## RISC-V ISA Naming

### Naming Convention

```
RV[bits][base][extensions]

RV64IMAFDCZicsr_Zifencei
 │  │ │││││ │
 │  │ ││││││ └─ instruction fetch fence
 │  │ │││││└─── CSR instructions
 │  │ ││││└──── compressed (C)
 │  │ │││└───── double float (D)
 │  │ ││└────── single float (F)
 │  │ │└─────── atomic (A)
 │  │ └─────── multiply (M)
 │  └────────── base integer (I)
 └──────────── 64-bit

Examples:
  RV32I     - 32-bit minimal
  RV32E     - 32-bit embedded (16 regs)
  RV64I     - 64-bit general
  RV64GC    - 64-bit with G + C
  RV64IMAFDCZicsr_Zifencei - full general
```

## Your Kernel on RISC-V

### How Your Code Runs on RISC-V

```
┌─────────────────────────────────────────────────────────────┐
│  Your omi_riscv_vm.c compiles to RISC-V binary          │
│                                                             │
│  1. GCC (riscv64-linux-gnu-gcc) compiles C → RISC-V  │
│  2. QEMU loads at 0x80000000                         │
│  3. RISC-V CPU executes RISC-V instructions          │
│  4. QEMU's TCG translates to host (x86_64)        │
│                                                             │
│  RISC-V instruction execution:                      │
│                                                             │
│  addi a0, a0, 1    →  addi rd, rs1, imm          │
│  lw   a0, 0(a1)     →  lw   rd, offset(rs1)         │
│  beq  a0, a1, label  →  branch if eq                   │
│  jalr ra, 0(a0)    →  jump register-indirect        │
└─────────────────────────────────────────────────────────────┘
```

### Key RISC-V Instructions for Your Kernel

```c
// Your boot code (omi_riscv_vm.c entry point)
void _start(void) {
    // This becomes:
    // auipc sp, 0        (set stack pointer)
    // addi sp, sp, -16    (allocate stack)
    // call boot          (jal boot)
    
    boot();
    while(1);
}

// Load address
void *addr = 0x80000000;
// Becomes: lui a0, 0x80000; addi a0, a0, 0

// Store to UART
*(volatile char *)0x10000000 = 'x';
// Becomes: lui a0, 0x10000; sb a0, 0(a0)
```

## Summary Table

### Extensions Summary

| Extension | Name | Instructions | Purpose |
|-----------|------|--------------|---------|
| I | Base Integer | 40 | Minimal CPU |
| E | Embedded | 40 | Tiny embedded |
| M | Multiply/Divide | 8-13 | Integer math |
| A | Atomics | 11-22 | Lock-free |
| F | Single Float | 26-30 | FP |
| D | Double Float | 26-32 | More precise |
| C | Compressed | 40 | Smaller code |
| B | Bit manip | 29-41 | Crypto |
| V | Vector | 187 | SIMD |
| S | Supervisor | 4 | OS |
| H | Hypervisor | 15 | Virtualization |
| Zk | Crypto | 49 | Crypto |
| G | IMAFD+Zicsr+Zifencei | ~100 | General purpose |

### Key Points

1. **RV64I** = 64-bit base (for QEMU virt)
2. **G** = everything needed for general OS
3. **C** = compressed (smaller code, recommended)
4. **QEMU uses rv64gc** = RV64I + M + A + F + D + C + Zicsr + Zifencei
5. **16 registers** = fast (x0-x15 in embedded)
6. **No branch delay slot** = simpler CPU
7. **Load-store** = all memory via load/store

## How This Relates to Your Work

```
Your Kernel Flow:
  omi_riscv_vm.c (C code)
    ↓ riscv64-gcc
  RISC-V binary (.o file)
    ↓ QEMU
  TCG translates
    ↓ host execution
  Your code runs in QEMU virt

What's needed:
  - RV64I base instructions
  - M for math
  - A for locks (if multithreaded)
  - C for smaller kernel
  - Zicsr/Zifencei for traps
```