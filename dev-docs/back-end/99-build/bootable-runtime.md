# Build Bootable Kernel and Runtime from Scratch

## Why This is Complex

You need to understand WHY there are so many layers:

```
omi-lisp code (your brain)
        ↓
    You write .lisp files
        ↓
    SBCL compiles to (nothing usable on RISC-V)
        ↓
    You write C code that acts like your lisp
        ↓
    riscv64-gcc compiles to RISC-V binary
        ↓
    cpio packages into initramfs  
        ↓
    QEMU loads initramfs at boot
        ↓
    Your code runs as PID-1
```

## Why YOU Must Do It This Way

### 1. No Standard OS
You're building your own kernel. There's no Linux, no glibc, nothing.

### 2. Static Binary Only
No dynamic linker. Everything must be in one binary.

### 3. PID-1 is Special
The first process (PID-1) is special:
- It gets all orphaned processes
- It must handle SIGCHLD
- It must not exit

### 4. No Standard Libraries
You can't use printf(), malloc(), etc. unless YOU implement them.

## Complete Build Steps

### Step 1: Write Your Kernel in C

```c
/* omi_riscv_vm.c - Your OMI-Lisp Kernel */

#include <stdint.h>

/* Simple UART for output - QEMU virt uses this */
#define UART0 ((volatile uint32_t *)0x10000000)

void uart_putc(char c) {
    *UART0 = c;
}

void uart_puts(const char *s) {
    while (*s) {
        uart_putc(*s++);
    }
}

/* Your octuple encoding */
#include "omi-braille-table.h"
#include "omi-aegean-table.h" 
#include "omi-bom-table.h"

/* Boot - called by _start */
void boot(void) {
    uart_puts("OMI kernel starting...\n");
    
    /* Your code runs here */
    
    uart_puts("Boot complete.\n");
    while (1) { /* PID-1 must NOT exit */ }
}

/* Entry point */
void _start(void) {
    boot();
    while(1);
}
```

### Step 2: Write the Header Files

```c
/* omi-braille-table.h */
#ifndef OMI_BRAILLE_TABLE_H
#define OMI_BRAILLE_TABLE_H

#include <stdint.h>

/* Braille to index: 0x80-0xBF → 0-63 */
static inline uint8_t omi_braille_index(uint8_t byte) {
    return byte - 0x80;
}

/* Index to Braille: 0-63 → 0x80-0xBF */
static inline uint8_t omi_index_braille(uint8_t index) {
    return 0x80 + index;
}

/* Pack 236-bit significand into Braille cells */
void omi_pack_significand(uint32_t *cells, uint64_t significand);

/* Unpack Braille cells into 236-bit significand */
uint64_t omi_unpack_significand(uint32_t *cells);

#endif
```

```c
/* omi-aegean-table.h */
#ifndef OMI_AEGEAN_TABLE_H
#define OMI_AEGEAN_TABLE_H

#include <stdint.h>

#define EXPONENT_BIAS 262143
#define EXPONENT_MIN -262142
#define EXPONENT_MAX 262143
#define EXPONENT_WIDTH 19

/* Aegean to index: 0xC0-0xFF → 0-63 */
static inline uint8_t omi_aegean_index(uint8_t byte) {
    return byte - 0xC0;
}

/* Index to Aegean: 0-63 → 0xC0-0xFF */
static inline uint8_t omi_index_aegean(uint8_t index) {
    return 0xC0 + index;
}

/* Pack 19-bit exponent into Aegean cells */
void omi_pack_exponent(uint32_t *cells, int32_t exponent);

/* Unpack Aegean cells into exponent */
int32_t omi_unpack_exponent(uint32_t *cells);

#endif
```

```c
/* omi-bom-table.h */
#ifndef OMI_BOM_TABLE_H
#define OMI_BOM_TABLE_H

#include <stdint.h>

#define BOM_NULL 0x00   /* Positive */
#define BOM_DEL 0x7F    /* Negative */

#define NUM_CHANNELS 4
#define CHANNEL_WIDTH 16

/* Get sign from BOM */
static inline int8_t omi_bom_sign(uint8_t byte) {
    return (byte == BOM_DEL) ? -1 : 1;
}

/* Set sign to BOM */
static inline uint8_t omi_bom_set_sign(int8_t sign) {
    return (sign < 0) ? BOM_DEL : BOM_NULL;
}

/* Channel operations */
uint16_t omi_get_channel(uint64_t channels, uint8_t index);
uint64_t omi_set_channel(uint64_t channels, uint8_t index, uint16_t value);

#endif
```

### Step 3: Write Implementation (.c files)

```c
/* omi-encoding.c - Implementation of lookup tables in C */

#include "omi-braille-table.h"
#include "omi-aegean-table.h"
#include "omi-bom-table.h"
#include <string.h>

void omi_pack_significand(uint32_t *cells, uint64_t significand) {
    for (int i = 0; i < 40; i++) {
        cells[i] = 0x80 + (significand & 0x3F);
        significand >>= 6;
    }
}

uint64_t omi_unpack_significand(uint32_t *cells) {
    uint64_t significand = 0;
    for (int i = 39; i >= 0; i--) {
        significand = (significand << 6) | (cells[i] & 0x3F);
    }
    return significand;
}

void omi_pack_exponent(uint32_t *cells, int32_t exponent) {
    uint32_t biased = exponent + EXPONENT_BIAS;
    for (int i = 0; i < 4; i++) {
        cells[i] = 0xC0 + (biased & 0x3F);
        biased >>= 6;
    }
}

int32_t omi_unpack_exponent(uint32_t *cells) {
    uint32_t biased = 0;
    for (int i = 3; i >= 0; i--) {
        biased = (biased << 6) | (cells[i] & 0x3F);
    }
    return biased - EXPONENT_BIAS;
}

uint16_t omi_get_channel(uint64_t channels, uint8_t index) {
    return (channels >> (index * CHANNEL_WIDTH)) & 0xFFFF;
}

uint64_t omi_set_channel(uint64_t channels, uint8_t index, uint16_t value) {
    uint64_t mask = 0xFFFFULL << (index * CHANNEL_WIDTH);
    return (channels & ~mask) | ((uint64_t)value << (index * CHANNEL_WIDTH));
}
```

### Step 4: Cross-Compile

```sh
#!/usr/bin/env bash
# build-kernel.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Compiling omi-encoding.c..."
riscv64-linux-gnu-gcc \
  -std=c99 \
  -O2 \
  -static \
  -nostdlib \
  -fno-stack-protector \
  -Wl,-e,_start \
  -o init \
  $ROOT/omi_riscv_vm.c \
  $ROOT/omi-encoding.c

echo "Verifying..."
file init
ls -la init

echo "Creating initramfs..."
mkdir -p initramfs
cp init initramfs/init
cd initramfs
printf 'init\0' | cpio --null -ov --format=newc > ../build-riscv/omi-initramfs.cpio

echo "Done."
echo "Run: qemu-system-riscv64 -kernel build-riscv/vmlinuz-lts -initrd build-riscv/omi-initramfs.cpio"
```

### Step 5: Boot in QEMU

```sh
echo "Starting QEMU..."
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -nographic \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-initramfs.cpio \
  -append "console=ttyS0 rdinit=/init panic=1"
```

## The Files You Need

```
omi-lisp/
├── omi_riscv_vm.c        # Your kernel (entry point)
├── omi-braille-table.lisp
├── omi-aegean-table.lisp
├── omi-bom-table.lisp
├── omi-encoding.h       # Headers (generated from .lisp)
│   ├── omi-braille-table.h
│   ├── omi-aegean-table.h
│   └── omi-bom-table.h
├── omi-encoding.c      # Implementation
├── build-kernel.sh    # Build script
└── build-riscv/
    ├── init              # Compiled binary
    └── omi-initramfs.cpio
```

## Summary

YOU MUST build this way because:

1. **No standard OS** - You're the OS
2. **Static only** - No dynamic libraries
3. **PID-1** - Must not exit, must handle orphans
4. **Embedded** - No printf, must write your own UART output

The layers:
- Your .lisp files → define the LOOKUP TABLES
- C files → IMPLEMENT the lookup tables
- riscv64-gcc → COMPILE to RISC-V
- cpio → PACKAGE into initramfs
- QEMU → RUN at boot