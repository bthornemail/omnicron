# QEMU Internals: How They Connect

## Overview: What QEMU Does

QEMU does ONE thing: runs code for one CPU on another CPU.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Your code written for RISC-V                              │
│  (in omi_riscv_vm.c)                                       │
│         │                                                   │
│         ↓                                                   │
│  Decodetree reads instruction bits                        │
│         │                                                   │
│         ↓                                                   │
│  Translator converts to TCG ops                           │
│         │                                                   │
│         ↓                                                   │
│  TCG optimizes and generates x86_64 code                  │
│         │                                                   │
│         ↓                                                   │
│  Your x86_64 CPU runs it                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## How the Parts Connect

```
┌─────────────────────────────────────────────────────────────────────┐
│  Decodetree                                                            │
│  - Reads raw bits from memory                                         │
│  - Matches against patterns (fixedbits + fixedmask)                   │
│  - Extracts fields (rd, rs1, rs2, immediate)                          │
│         │                                                               │
│         ↓                                                               │
│  Translator (your code in QEMU)                                        │
│  - For each instruction pattern, generate TCG ops                      │
│  - add → tcg_gen_add()                                                 │
│  - ld → tcg_gen_ld()                                                   │
│         │                                                               │
│         ↓                                                               │
│  TCG IR (intermediate representation)                                  │
│  - ops like "add_i32 tmp0, a0, a1"                                     │
│  - independent of source and target CPU                                │
│         │                                                               │
│         ↓                                                               │
│  TCG Optimization                                                      │
│  - peephole optimization                                               │
│  - dead code elimination                                               │
│         │                                                               │
│         ↓                                                               │
│  Code Generator                                                        │
│  - converts TCG ops to host machine code                               │
│  - x86_64: add rax, rbx                                                │
│  - ARM: add r0, r0, r1                                                  │
│         │                                                               │
│         ↓                                                               │
│  Translation Block (TB)                                                │
│  - chunk of compiled code                                              │
│  - linked list of TBs for lookup                                       │
│  - TB chaining for speed                                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Decodetree: Reading Instructions

### The Problem

CPUs understand instructions as raw bits. You need to figure out which instruction it is.

RISC-V add instruction:
```
31      25 24 20 19 15 14 12 11     7 6      0
 0000000   rs2   rs1   rd   000   00000   0110011
```

RISC-V sub instruction:
```
31      25 24 20 19 15 14 12 11     7 6      0
 0100000   rs2   rs1   rd   000   00000   0110011
```

Only bit 30 differs!

### The Solution: fixedbits + fixedmask

```c
// Pattern for add and sub
fixedbits = 0......0......00000....0110011  // common bits
fixedmask = 1111111000000000000000001111111

// Test:
// (instruction & fixedmask) == fixedbits
// If true, this is an add or sub

// Then check bit 30:
// bit30 = 0 → add
// bit30 = 1 → sub
```

### Decodetree in QEMU

```python
# Simplified decodetree syntax
(add:   rd, rs1, rs2  [funct7=0000000, funct3=000, opcode=0110011])
(sub:   rd, rs1, rs2  [funct7=0100000, funct3=000, opcode=0110011])
(xori:  rd, rs1, imm  [funct3=100, opcode=0010011])
(lw:    rd, offset(rs1) [funct3=010, opcode=0000011])
(sw:    rs2, offset(rs1) [funct3=010, opcode=0100011])
```

QEMU compiles these into fast lookup tables.

## TCG: Translation

### What TCG Does

TCG converts instructions to a CPU-independent format:

```
RISC-V add a0, a1, a2
        ↓
TCG: add_i32 a0, a1, a2
        ↓
x86_64: add rax, rbx
        ↓
ARM:   add r0, r0, r1
```

### Common TCG Ops

| TCG Op | What It Means |
|--------|--------------|
| `movi T, N` | Put constant N into temporary T |
| `mov T1, T2` | Copy value from T2 to T1 |
| `add T, A, B` | T = A + B |
| `sub T, A, B` | T = A - B |
| `and T, A, B` | T = A & B |
| `or T, A, B` | T = A \| B |
| `ld T, A, OFFSET` | T = memory[A + OFFSET] |
| `st T, A, OFFSET` | memory[A + OFFSET] = T |
| `br LABEL` | Branch to LABEL |
| `jmp T` | Jump to address in T |
| `exit_tb N` | Exit TB, return N |

### Types in TCG

- `i8`, `i16`, `i32`, `i64` - integers
- `ptr` - pointer (same as i64 on 64-bit)
- `f32`, `f64` - floating point

### Example Translation

Your RISC-V code:
```c
// omi_riscv_vm.c
int add_one(int x) {
    return x + 1;
}
```

RISC-V assembly:
```
addi a0, a0, 1
ret
```

TCG ops generated:
```
movi_i32 tmp0, 1
add_i32 tmp1, a0, tmp0
mov_i32 a0, tmp1
ret
```

x86_64 output:
```
mov eax, edi
inc eax
ret
```

## Translation Blocks (TB)

### What is a TB?

A TB is a sequence of translated instructions:

```
┌─────────────────────────────────────────────────────────────┐
│  Translation Block                                          │
│                                                             │
│  Input: Guest PC = 0x80000000                              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Translated code:                                     │ │
│  │                                                        │ │
│  │  IN: addi a0, a0, 1                                   │ │
│  │  OUT: inc eax                                          │ │
│  │                                                        │ │
│  │  IN: bne a0, zero, loop                               │ │
│  │  OUT: cmp eax, 0; jne .Lloop                          │ │
│  │                                                        │ │
│  │  IN: ret                                              │ │
│  │  OUT: ret                                             │ │
│  │                                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Output: Jumps to next TB or returns to main loop          │
└─────────────────────────────────────────────────────────────┘
```

### Why TBs?

- Translating ONE instruction at a time is slow
- Translating MANY instructions at once is fast
- But if PC changes unpredictably (jump), stop translating

### TB Chaining (Speed Optimization)

First time:
```
TB1 at 0x80000000
  add eax, 1
  jmp TB1_next_slot
  exit_tb TB1_address, 0   ← returns to main loop

Main loop:
  Finds TB2 at 0x80000010
  Patches TB1_next_slot → TB2 entry

Second time:
TB1 at 0x80000000
  add eax, 1
  jmp TB2_entry    ← directly jumps, no exit
```

This is called "chaining" and makes QEMU fast.

## QOM: Object Model

### What QOM Does

QOM is QEMU's way of organizing devices:

```
Type System
    │
    ├── TYPE_OBJECT (base)
    │     │
    │     ├── TYPE_DEVICE
    │     │     ├── TYPE_CPU
    │     │     │     └── TYPE_RISCV_CPU
    │     │     ├── TYPE_VIRTIO_NET
    │     │     ├── TYPE_UART
    │     │     └── ...
    │     │
    │     ├── TYPE_MEMORY_REGION
    │     │     └── TYPE_RAM
    │     │
    │     └── TYPE_BUS
```

### Properties

Objects have properties you can read/write:

```c
// Define property
DeviceClass *dc = DEVICE_CLASS(class);
object_class_property_add_uint32(class, "num-spi",
    offsetof(MyState, num_spi),
    NULL);

// Use from command line
qemu-system-riscv64 -device my-device,num-spi=4
```

### Why You Need to Know QOM

When your kernel runs in QEMU:

1. QEMU creates devices (UART, virtio, RAM)
2. These are QOM objects
3. Your kernel accesses them through memory mapping
4. Understanding QOM helps you understand HOW devices work

## Clocks

### What Clocks Do

Real hardware has clocks - oscillators that generate regular pulses:

```
Clock signal:
┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐
│ │ │ │ │ │ │ │ │ │ │ │ │
└─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘
100MHz = 100 million pulses per second
```

### Clocks in QEMU

QEMU models clock distribution:

```
CPU ──► Clock ──► Timer ──► Interrupt ──► CPU
  ↑                              │
  └──────────────────────────────┘
         (timer interrupt)
```

### Why Clocks Matter for You

Your kernel runs with:
- CPU clock (how fast instructions execute)
- Timer interrupts (for scheduling)
- Device clocks (UART baud rate, etc.)

Understanding clocks helps you:
- Handle timer interrupts
- Implement scheduling
- Debug timing issues

## Atomics

### The Problem

CPUs execute instructions out of order for speed:

```
CPU 1                    CPU 2
─────────────────────    ─────────────────────
write A = 1        →    
                  →     read A (gets 1)
                  →     write B = 1
read B            →     (B might be 1 already!)
```

Without synchronization, results are unpredictable.

### The Solution: Atomics

```c
// Atomic read-modify-write
atomic_fetch_add(&counter, 1);  // Increment safely

// Compare and swap
bool swapped = atomic_compare_exchange(&counter, &old, new);

// Memory barriers
smp_mb();  // "Before this point, all writes are visible to other CPUs"
```

### Why You Need Atomics

When your kernel has multiple processes/threads:
- Shared memory access must be synchronized
- Atomics are faster than mutexes for simple operations
- Essential for lock-free data structures

## Memory

### Memory Regions

QEMU organizes memory into regions:

```
Address Space:
0x00000000 ──► Device Tree (ROM)
                    │
0x10000000 ──► MMIO
                    │ UART @ 0x10000000
                    │ virtio @ 0x10001000
                    │
0x80000000 ──► RAM (your kernel loads here)
                    │
0xC0000000 ──► PCI MMIO
```

### How Your Kernel Uses Memory

```c
// Your kernel (omi_riscv_vm.c)
#define UART0 ((volatile uint32_t *)0x10000000)

void uart_putc(char c) {
    *UART0 = c;  // Write to UART address
}
```

QEMU intercepts this write and passes data to host's terminal.

## Record/Replay

### What It Does

Record non-deterministic events, replay exactly:

```
Recording:
  1. Run VM
  2. Record: mouse movements, key presses, interrupts
  3. Save to log file

Replaying:
  1. Run VM again
  2. Read from log file
  3. Same execution, bit-for-bit identical
```

### Why It Matters

- Debug flaky bugs (reproduce exactly)
- Testing (deterministic execution)
- Reverse execution debugging

## QMP (QEMU Machine Protocol)

### What It Is

QMP = control QEMU from outside:

```python
import socket

# Connect to QEMU
s = socket.socket()
s.connect(('localhost', 4444))

# Send QMP command
s.send(b'{"execute": "qmp_capabilities"}\n')

# Read response
response = s.recv(1024)

# Run VM
s.send(b'{"execute": "cont"}\n')
```

### HMP (Human Monitor Protocol)

Text interface to QMP:

```
(qemu) info registers
(qemu) info memory
(qemu) stop
(qemu) cont
```

## How YOU Use These

### Daily Workflow

```
1. Write code (omi_riscv_vm.c)
       ↓
2. Cross-compile (riscv64-gcc)
       ↓
3. Build initramfs (cpio)
       ↓
4. Run QEMU
       ↓
5. GDB connects to debug
       ↓
6. See what went wrong
       ↓
7. Fix code, repeat
```

### When to Use Each Tool

| Situation | What to Use |
|-----------|------------|
| Debug crash at specific address | GDB `break *address` |
| Trace TCG translation | `qemu -d exec -d in_asm` |
| Profile performance | `perf record -k 1 qemu ...` |
| Reproduce bug | Record/replay |
| Check device state | QEMU monitor |
| Control from script | QMP |
| Look at memory | GDB `x/100xb address` |
| Step instruction | GDB `si` |

### Debug Your Kernel

```sh
# Terminal 1: QEMU waiting for GDB
qemu-system-riscv64 \
  -gdb tcp::1234 \
  -S \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio

# Terminal 2: GDB
riscv64-linux-gnu-gdb vmlinuz
(gdb) target remote localhost:1234
(gdb) break boot
(gdb) continue
(gdb) info registers
(gdb) x/20i $pc
(gdb) step
```

## Summary: How Everything Fits

```
┌─────────────────────────────────────────────────────────────────────┐
│  Your code (omi_riscv_vm.c)                                          │
│         │                                                             │
│         ↓                                                             │
│  riscv64-gcc                                                          │
│         │                                                             │
│         ↓                                                             │
│  Binary in memory                                                     │
│         │                                                             │
│         ↓                                                             │
│  Decodetree (QEMU)                                                   │
│  - reads instruction bits                                            │
│  - extracts fields                                                    │
│         │                                                             │
│         ↓                                                             │
│  Translator (QEMU)                                                   │
│  - generates TCG ops                                                 │
│         │                                                             │
│         ↓                                                             │
│  TCG optimization                                                     │
│         │                                                             │
│         ↓                                                             │
│  Code generator (QEMU)                                               │
│  - x86_64 machine code                                                │
│         │                                                             │
│         ↓                                                             │
│  Translation Block (TB)                                             │
│  - compiled code chunk                                                │
│  - TB chaining for speed                                             │
│         │                                                             │
│         ↓                                                             │
│  Execution                                                            │
│  - CPU runs translated code                                          │
│  - Clocks tick                                                       │
│  - Interrupts fire                                                   │
│  - Memory accessed via QOM                                            │
│         │                                                             │
│         ↓                                                             │
│  GDB debugs (via gdbstub)                                            │
└─────────────────────────────────────────────────────────────────────┘
```

## Next Steps

1. Read [osi-model-why.md](./osi-model-why.md)
2. Run QEMU with GDB: `qemu-system-riscv64 -gdb tcp::1234 -S ...`
3. Connect GDB: `riscv64-linux-gnu-gdb vmlinuz`
4. Try `info registers`, `x/10i $pc`
5. Read [jit-tracing.md](./jit-tracing.md)