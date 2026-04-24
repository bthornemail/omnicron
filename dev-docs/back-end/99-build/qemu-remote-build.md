# Step-by-Step: Build RISC-V VM with QEMU Remote

## What You're Building

```
omi-lisp model → (guix declarative) → RISC-V kernel
                                           ↓
                              QEMU virt machine
                                           ↓
                                 remote debug (GDB)
```

---

## Step 1: Install Guix

### Option A: Binary Install (Recommended)

```sh
# Download
wget https://ftp.gnu.org/gnu/guix/guix-binary-1.4.0.x86_64-linux.tar.xz

# Extract to ~/.guix
mkdir -p ~/.guix
tar -xf guix-binary-1.4.0.x86_64-linux.tar.xz -C ~/.guix

# Add to PATH (add to ~/.bashrc)
export PATH="$HOME/.guix/bin:$PATH"

# Verify
guix --version
```

### Option B: From Source

```sh
# Install dependencies (Debian/Ubuntu)
sudo apt install git make m4 gcc texinfo libgcrypt20-dev 
sudo apt install guile-3.0 gnutls28 libsqlite3 libssl3

# Clone
git clone https://git.savannah.gnu.org/git/guix.git
cd guix

# Build
./bootstrap
./configure --prefix=$HOME/guix
make -j$(nproc)
make check
./guix build --version
```

---

## Step 2: Enter Your Dev Environment

```sh
# Using your manifest (riscv64-gcc + guile only)
guix shell --manifest=omi-dev-manifest.scm
```

What this does:
- Launches a shell with riscv64-linux-gnu-gcc available
- Launches a shell with guile available
- These are your ONLY two tools

Verify:
```sh
which riscv64-linux-gnu-gcc   # Should show path
which guile                  # Should show path
risv64-linux-gnu-gcc --version
guile --version
```

---

## Step 3: Cross-Compile Your Kernel

Inside Guix shell:

```sh
# Compile omi_riscv_vm.c to RISC-V binary
riscv64-linux-gnu-gcc \
  -std=c99 \
  -O2 \
  -static \
  omi_riscv_vm.c \
  -o init

# Verify it's RISC-V
file init
# Should show: init: ELF 64-bit LSB executable, UCB RISC-V
```

---

## Step 4: Build initramfs

```sh
# Create directory
mkdir -p initramfs

# Copy init binary
cp init initramfs/

# Create cpio archive
cd initramfs
printf 'init\0' | cpio --null -ov --format=newc > ../build-riscv/omi-riscv-initramfs.cpio
cd ..
```

---

## Step 5: Get Kernel (Only Once)

```sh
# Download Alpine kernel (if not exists)
cd build-riscv
mkdir -p boot
curl -L -o boot/vmlinuz-lts \
  https://dl-cdn.alpinelinux.org/alpine/v3.22/releases/riscv64/netboot/vmlinuz-lts
```

---

## Step 6: Run QEMU with GDB Remote

### Terminal 1: Start QEMU (waiting for debugger)

```sh
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -nographic \
  -gdb tcp::1234 \
  -S \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio \
  -append "console=ttyS0 rdinit=/init panic=1"
```

Flags:
- `-gdb tcp::1234` = listen for GDB on port 1234
- `-S` = freeze CPU at start (wait for continue from debugger)

### Terminal 2: Connect GDB

```sh
# In another terminal, inside Guix shell:
riscv64-linux-gnu-gdb build-riscv/boot/vmlinuz-lts

# Connect to QEMU
(gdb) target remote localhost:1234

# Now you can debug!
(gdb) break main
(gdb) continue
(gdb) info registers
(gdb) x/20i $pc
```

---

## Step 7: Using GDB While Debugging

Useful commands:

```gdb
# See memory
x/10xb 0x80000000        # 10 bytes hex
x/10xw 0x80000000       # 10 words hex  
x/s 0x80000000           # as string

# See registers
info registers
print $a0
print $pc

# See instructions at PC
x/20i $pc

# See stack
backtrace
info frame

# See breakpoints
info breakpoints

# Step by step
ni   # next instruction (don't enter calls)
si   # step instruction (enter calls)
c    # continue
```

---

## Step 8: Full Build Script (for when you modify code)

```sh
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD="$ROOT/build-riscv"

# 1. Cross-compile
echo "Compiling..."
riscv64-linux-gnu-gcc \
  -std=c99 \
  -O2 \
  -static \
  "$ROOT/omi_riscv_vm.c" \
  -o "$BUILD/initramfs/init"

# 2. Create initramfs
echo "Creating initramfs..."
mkdir -p "$BUILD/initramfs"
cp "$BUILD/initramfs/init" "$BUILD/initramfs/"
cd "$BUILD/initramfs"
printf 'init\0' | cpio --null -ov --format=newc > "$BUILD/omi-riscv-initramfs.cpio"

echo "Done. Run with:"
echo "  ./build-riscv/run-omi-riscv-vm.sh"
echo ""
echo "For remote debug:"
echo "  qemu-system-riscv64 -gdb tcp::1234 -S ..."
echo "  riscv64-linux-gnu-gdb -ex 'target remote localhost:1234' vmlinuz"
```

---

## What You Need to Remember

| Command | Purpose |
|---------|--------|
| `guix shell --manifest=omi-dev-manifest.scm` | Enter dev env |
| `riscv64-linux-gnu-gcc -c99 -O2 -static` | Cross-compile to RISC-V |
| `qemu-system-riscv64 -gdb tcp::1234 -S` | Start QEMU waiting for GDB |
| `target remote localhost:1234` | Connect GDB |
| `x/10xb address` | Examine memory |

---

## Reference

- QEMU GDB: https://www.qemu.org/docs/master/system/invocation.html
- GDB remote: https://sourceware.org/gdb/onlinedocs/gdb/Connecting.html
- RISC-V GCC: https://github.com/riscv-collab/riscv-gnu-toolchain