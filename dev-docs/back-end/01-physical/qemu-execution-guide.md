# QEMU RISC-V Execution Guide

## Your Goal

Run code in QEMU RISC-V and manipulate the VM state directly.

---

## 1. Run VM with Monitor

```bash
# Start VM with monitor on port 4444
qemu-system-riscv64 \
  -M virt \
  -m 512M \
  -nographic \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio \
  -append "console=ttyS0" \
  -monitor telnet:127.0.0.1:4444,server,nowait
```

---

## 2. Connect to Monitor

In another terminal:

```bash
# Connect to QEMU monitor
telnet 127.0.0.1 4444
```

Now you're in the QEMU monitor. You can type commands.

---

## 3. Monitor Commands - State Manipulation

### See CPU Registers

```
info registers
```

Shows all CPU registers (pc, a0-a7, sp, etc.)

### See Memory Map

```
info memory
```

Shows memory regions.

### Examine Memory (hex)

```
x/16 0x80000
```

Examine 16 bytes at address 0x80000.

### Continue Execution

```
cont
```

Resume VM execution.

### Stop Execution

```
stop
```

Pause VM.

### Quit

```
quit
```

Exit QEMU.

---

## 4. GDB Debugging (Alternative)

Start VM with GDB stub:

```bash
qemu-system-riscv64 \
  -M virt \
  -m 512M \
  -nographic \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio \
  -append "console=ttyS0" \
  -gdb tcp::1234 -S
```

In another terminal, connect GDB:

```bash
riscv64-unknown-elf-gdb your-kernel.elf
```

GDB commands:

```
(target remote localhost:1234)
(set $pc=0x80200000)
(continue)
(info registers)
(x/16 0x80000)
```

---

## 5. Your VM Already Runs

The current setup already works:

```bash
cd /root/omi-lisp/build-riscv
./run-omi-riscv-vm.sh
```

You'll see OpenSBI boot, then Linux kernel starts.

---

## 6. Adding Your Code

You have `omi_riscv_vm.c`. To add new code:

1. Edit `omi_riscv_vm.c`
2. Recompile:
   ```bash
   riscv64-unknown-elf-gcc -fno-pic -march=rv64gc -mcmodel=medany -nostdlib -T linker.ld -o your-kernel.bin startup.S omi_riscv_vm.c
   ```
3. Re-run with new binary

---

## 7. Simple Test Loop

Create a minimal test:

```c
// test.c
#include <stdint.h>

void _start() {
    volatile uint64_t *uart = (uint64_t *)0x10000000;
    *uart = 0x48;  // 'H' to UART
    while(1);
}
```

Compile and run to see 'H' output.

---

## Summary

| Action | Command |
|--------|---------|
| Run VM | `./run-omi-riscv-vm.sh` |
| Run with monitor | `qemu-system-riscv64 ... -monitor telnet:127.0.0.1:4444,server,nowait` |
| See registers | `info registers` in monitor |
| See memory | `x/16 0x80000` in monitor |
| Debug with GDB | `qemu-system-riscv64 ... -gdb tcp::1234 -S` |

---

## Next Steps

1. Run the existing VM
2. Connect to monitor
3. Examine memory
4. Add your code
5. Recompile and test