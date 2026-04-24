# Declarative Build Environment

## The Problem

Building for RISC-V requires cross-compiler. Different machines have different compilers. You'll get different results.

## The Solution: Guix

Guix provides reproducible builds. Same compiler, same libraries, everywhere.

---

## 1. Enter Guix Shell

```bash
cd /root/omi-lisp
guix shell --manifest=oi-dev-manifest.scm
```

This gives you:
- riscv64-linux-gnu-gcc
- riscv64-linux-gnu-gdb
- Other RISC-V tools

You're now in a container with all tools.

---

## 2. Compile Without Guix (if you have native tools)

```bash
# Your machine likely has this
riscv64-unknown-elf-gcc -std=c99 -O2 -static omi_riscv_vm.c -o init
```

But results vary by machine.

---

## 3. Full Build with Guix

```bash
# Enter shell
guix shell --manifest=omi-dev-manifest.scm

# Compile
riscv64-linux-gnu-gcc -std=c99 -O2 -static omi_riscv_vm.c -o init

# Package
echo init | cpio -o -H newc > initramfs

# Run in QEMU
qemu-system-riscv64 -M virt -kernel vmlinuz -initrd initramfs -nographic
```

---

## 4. Why Declarative Matters

| Without Guix | With Guix |
|--------------|----------|
| Compiler version varies | Same version |
| Libraries vary | Same libraries |
| Build fails | Reproducible |

---

## 5. Install Guix (if needed)

```bash
# On Debian/Ubuntu:
sudo apt-get install guix

# Or see https://guix.gnu.org/install/
```

---

## 6. Development with Atom + Electron

### Option A: Use existing tools

```bash
# Start RISC-V VM with GDB
qemu-system-riscv64 ... -gdb tcp::1234 -S

# In another terminal, run GDB
riscv64-unknown-elf-gdb kernel.elf
(target remote localhost:1234)
```

### Option B: Build simpler

Just use terminal + SBCL for now:

```bash
sbcl --noinform --non-interactive --load omi_vm_loader.lisp
```

This runs your code on host (x86), not RISC-V.

---

## Summary

| Task | Command |
|------|----------|
| Enter Guix | `guix shell --manifest=omi-dev-manifest.scm` |
| Compile | `riscv64-linux-gnu-gcc -c99 -O2 omi_riscv_vm.c -o init` |
| Build | `./build_omi_riscv.sh` |
| Run | `./build-riscv/run-omi-riscv-vm.sh` |
| Host test | `sbcl --load omi_vm_loader.lisp` |

---

## Next: Focus on Host First

For now, test in SBCL (host). Later worry about RISC-V.

1. Edit `omi_vm_loader.lisp`
2. Run `sbcl --load omi_vm_loader.lisp`
3. See output
4. Later: add C code, cross-compile, run in QEMU