# Tracing QEMU TCG JIT

## What is JIT?

JIT = Just In Time compilation. QEMU translates RISC-V code to your host CPU (x86_64) as it runs.

```
┌─────────────────────────────────────────────────────────────┐
│  RISC-V Code          TCG               Host Code           │
│  ┌─────────┐    ┌─────────┐    ┌─────────────────┐    │
│  │ addi    │ →  │ tcg_add │ → │  ADD rax, rax  │    │
│  │ a0,a0,1│    │        │    │               │    │
│  └─────────┘    └─────────┘    └─────────────────┘    │
│                                                             │
│  This translation happens AT RUNTIME (just in time)          │
└─────────────────────────────────────────────────────────────┘
```

## How to Trace JIT in QEMU

### Option 1: QEMUMonitor

```sh
# Start QEMU with monitor
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -nographic \
  -monitor stdio \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio

# In monitor, see JIT logging:
(qemu) log inates all
(qemu) log cpu_reset
```

### Option 2: Perf Profiling

```sh
# Profile JIT code with Linux perf
perf record -k 1 -g \
  qemu-system-riscv64 \
    -machine virt \
    -m 512M \
    -nographic \
    -kernel build-riscv/boot/vmlinuz-lts \
    -initrd build-riscv/omi-riscv-initramfs.cpio

# View
perf report
perf report --stdio

# Or use perfmap
qemu-system-riscv64 \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio \
  -perfmap

perf record qemu-system-riscv64 -perfmap <other args>
perf report
```

### Option 3: QEMU Tracing

```sh
# Trace specific events
qemu-system-riscv64 \
  -trace events=/usr/share/qemu/trace-events-all \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio

# List available trace points
qemu-system-riscv64 -trace help
```

### Option 4: GDB Debugging

```sh
# Start QEMU waiting for GDB
qemu-system-riscv64 \
  -gdb tcp::1234 \
  -S \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio

# In another terminal
riscv64-linux-gnu-gdb vmlinuz
(gdb) target remote localhost:1234

# Set breakpoint in translated code
(gdb) break *0x80000000
(gdb) continue

# Look at instructions
(gdb) x/10i $pc
(gdb) info registers

# See memory
(gdb) x/20xb 0x80000000
```

## What to Look For

### TCG Translation Output

When TCG translates your code:

```
# QEMU log shows:
IN: 
0x80000000:  addi    a0, a0, 1
...
OUT: [sync]
OUT: movi_i32 tmp0, 0x1
OUT: add_i32 tmp1, a0, tmp0
OUT: mov_i32 a0, tmp1
...
Translated 1 block (10 ops)
```

### Key Events to Trace

| Event | What It Shows |
|-------|--------------|
| `tb_gen_code` | Translation block created |
| `tcg_op_opt` | TCG optimization |
| `cpu_exec` | CPU execution |
| `tcg_qemu_tb_exec` | TB execution |
| `dirty_page` | Self-modifying code |

## Build Your Own Tracing

Add to your omi-lisp kernel (omi_riscv_vm.c):

```c
// Simple trace output
void trace(const char *msg) {
    // Write to serial console
    while (*msg) {
        *(volatile char *)0x10000000 = *msg++;
    }
}

// Call it from your kernel
void boot(void) {
    trace("OMI kernel starting...\n");
    // ... your code
    trace("Boot complete.\n");
    while(1);
}
```

## See Translation Steps

```sh
# Verbose TCG output
qemu-system-riscv64 \
  -d exec \
  -d in_asm \
  -d op_opt \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio
```

Flags:
- `-d exec` - Show execution
- `-d in_asm` - Show input assembly
- `-d op_opt` - Show TCG optimization

## Summary: Your Debug Flow

```
┌─────────────────────────────────────────────────────┐
│  1. Build kernel                                    │
│     riscv64-linux-gnu-gcc -o init omi_riscv_vm.c  │
│                                                     │
│  2. Package initramfs                             │
│     cpio -ov --format=newc < files.cpio           │
│                                                     │
│  3. Run QEMU with debug                            │
│     qemu-system-riscv64 -gdb tcp::1234 -S ...      │
│                                                     │
│  4. Connect GDB                                    │
│     riscv64-linux-gnu-gdb                         │
│     (gdb) target remote localhost:1234            │
│                                                     │
│  5. Trace execution                               │
│     (gdb) x/20i $pc                               │
│     (gdb) info registers                          │
│     (gdb) x/100xb 0x80000000                      │
│                                                     │
│  6. See TCG output                                │
│     qemu-system-riscv64 -d exec -d in_asm ...     │
└─────────────────────────────────────────────────────┘
```