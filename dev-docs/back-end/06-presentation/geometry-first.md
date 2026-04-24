# GEOMETRY-FIRST: Understanding Your Octuple Precision

## You Already Know This

You understand geometry. Let me show you how your floating-point system is just geometry you already know.

---

## Part 1: The Shapes

### What is a "bit"?

A bit is just a yes/no answer. Like asking:
- "Is this corner here?" YES = 1, NO = 0

### What is a "byte"?

8 bits together = 1 byte. Think of it as 8 corners of a cube.

```
    ┌───────8───────┐
   /│             /│
  1 ─┼────── 2   4
  /  /            / 
 /─┼───────────/─ 16
40 ───────────── 32
```

### 256 bits = 256 yes/no questions = 256 corners

This is your "octuple" - 256 bits.

---

## Part 2: Where to Put the Exponent and Significand

### IEEE 754 Standard (what everyone else uses)

```
┌──────────────────────────────────┐
│ 1 bit sign  │ 19 bits exponent │ 236 bits significand │
└──────────────────────────────────┘
   ↑             ↑                  ↑
  positive    "how big"           "the detail"
  or negative
```

### Your OMI-Lisp Version

```
┌──────────────────────────────────────────────────────┐
│ BOM     │ Control    │ Exponent    │     Significand        │
│ (0x00) │ (4×16)   │ (19 bits)  │ (236 bits)          │
├────────┼──────────┼────────────┼─────────────────────┤
│ NULL   │ channel  │ Aegean    │ Braille           │
│ or DEL │ 4×4=16  │ (0xC0-0xFF│ (0x80-0xBF)    │
│ (+/-)  │          │ = 64 vals)│ (= 64 vals)      │
└────────┴──────────┴───────────┴──────────────────────┘
```

---

## Part 3: Your Three Character Planes

### The Braille Plane (0x80-0xBF)

Think of this as a 8×8 grid = 64 points:

```
  0x80 ┌──┬──┬──┬──┬──┬──┬──┬──┐
       │ 0│ 1│ 2│ 3│ 4│ 5│ 6│ 7│
  0x87 ├──┼──┼──┼──┼──┼──┼──┼──┤
       │ 8│ 9│10│11│12│13│14│15│
  0x8F ├──┼──┼──┼──┼──┼──┼──┼──┤
       │16│17│18│19│20│21│22│23│
  0x97 ├──┼──┼──┼──┼──┼──┼──┼──┤
       │24│25│26│27│28│29│30│31│
  0x9F ├──┼──┼──┼──┼──┼──┼──┼──┤
       │32│33│34│35│36│37│38│39│
  0xA7 ├──┼──┼──┼──┼──┼──┼──┼──┤
       │40│41│42│43│44│45│46│47│
  0xAF ├──┼──┼──┼──┼──┼──┼──┼──┤
       │48│49│50│51│52│53│54│55│
  0xB7 ├──┼──┼──┼──┼──┼──┼──┼──┤
       │56│57│58│59│60│61│62│63│
       └──┴──┴──┴──┴──┴──┴──┴──┘
```

Each point gives you 6 bits of information (0-63).

### The Aegean Plane (0xC0-0xFF)

Same grid, 64 points. This is your exponent plane.

### The BOM (NULL 0x00 or DEL 0x7F)

Two special points: 0x00 = NULL (nothing = positive), 0x7F = DEL (everything = negative)

These are your SIGN BIT.

---

## Part 4: Your Four Channels × 16-bit

```
Channel 0:  0x0000 ──► 0xFFFF  (65,536 values = 2^16)
Channel 1:  0x0000 ──► 0xFFFF  
Channel 2:  0x0000 ──► 0xFFFF  
Channel 3:  0x0000 ──► 0xFFFF  

Total: 4 × 65,536 = 262,144 possible frame control values
```

Think of this as 4 faces of a shape, each face has 2^16 grid points.

---

## Part 5: The Complete Shape

```
Your 256-bit octuple:

┌─────────────────────────────────────────────────────────────────────┐
│  SIGN │ CHANNELS      │ EXPONENT (19-bit) │ SIGNIFICAND (236-bit)        │
│ 1-bit │ 4×16=64bit  │ 0xC0-0xFF     │ 0x80-0xBF               │
├───────┼──────────────┼─────────────────┼─────────────────────────┤
│ NULL=+│ channel 0    │                │ ████████████████████████ │
│ DEL=- │ channel 1    │  Aegean grid    │ ████████████████████████ │
│       │ channel 2    │   (64 points)  │ ████████████████████████ │
│       │ channel 3    │              │ ████████████████████████ │
└───────┴──────────────┴─────────────────┴─────────────────────────┘

Exponent bias = 262,143 (because IEEE 754 says so)
Emin = -262,142  
Emax = +262,143
```

---

## Part 6: How to Encode a Number

### Step 1: Get your number

Say you want to encode: 1.0

### Step 2: Find the exponent

1.0 in binary is easy: exponent = 0 (because 1.0 = 2^0 × 1.0)

### Step 3: Encode exponent in Aegean

Exponent 0 + bias 262,143 = 262,143
262,143 in binary = 1111111111111111111 (19 bits)

In your Aegean grid, you need 4 cells (because 19/6 = 3.17, round up = 4)

### Step 4: Encode significand in Braille

1.0 in binary is: 1.0 exactly (no fraction!)

Your significand = all zeros after the leading 1

In Braille: 40 cells × 6 bits = 240 bits, but you only need 236.

### Step 5: Set BOM

1.0 is positive → use NULL (0x00)

---

## Part 7: Setting Up Your Development Environment

### What You Need to Install

1. **Guix** - your package manager (declarative = you say what you want, it builds it)
2. **RISC-V GCC** - cross-compiler (builds for RISC-V CPU)
3. **QEMU** - emulator (runs your RISC-V code)

### Installing Guix (one time)

```sh
# Download Guix
wget https://ftp.gnu.org/gnu/guix/guix-binary-1.4.0.x86_64-linux.tar.xz

# Extract
tar -xf guix-binary-1.4.0.x86_64-linux.tar.xz

# Set up (as root)
# ./guix build
```

### Enter Your Dev Environment

```sh
# This enters Guix with your packages
guix shell --manifest=omi-dev-manifest.scm
```

### Build Your Kernel

```sh
# Inside Guix shell, build RISC-V kernel
riscv64-linux-gnu-gcc \
  -std=c99 \
  -O2 \
  -static \
  omi_riscv_vm.c \
  -o init
```

### Build VM Image

```sh
# Run the build script
chmod +x build_omi_riscv.sh
./build_omi_riscv.sh
```

### Run in QEMU

```sh
# Start QEMU with debug
./build-riscv/run-omi-riscv-vm.sh

# Or with GDB remote
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -nographic \
  -gdb tcp::1234 \
  -S \
  -kernel build-riscv/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio
```

Then in another terminal:
```sh
riscv64-linux-gnu-gdb build-riscv/vmlinuz-lts
(gdb) target remote localhost:1234
(gdb) continue
```

---

## Part 8: Your Complete File List

```
omi-lisp/
├── omi_riscv_vm.c          # Your RISC-V kernel (C code)
├── omi-dev-manifest.scm    # Your Guix declaration  
├── dev-docs/
│   └── 06-presentation/
│       └── octuple-precision.md
├── build_omi_riscv.sh     # Build script
└── build-riscv/
    ├── init/              # Compiled kernel
    ├── omi-riscv-vm.qcow2  # VM disk
    └── omi-riscv-initramfs.cpio
```

---

## Summary

You have:
- **Braille (0x80-0xBF)** = 64 points for significand grid = 236 bits
- **Aegean (0xC0-0xFF)** = 64 points for exponent grid = 19 bits  
- **BOM (0x00/0x7F)** = sign + 4 channels × 16-bit

This is your octuple precision floating-point.