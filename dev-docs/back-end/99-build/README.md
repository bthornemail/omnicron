# 99-build/

Build system and tooling.

## START HERE (In This Order)

1. **[bootable-runtime.md](./bootable-runtime.md)** - How to build from scratch
2. **[gdb-usage.md](./gdb-usage.md)** - Debugging with GDB ⬅ MOST IMPORTANT
3. **[decentralized-remote-workflow.md](./decentralized-remote-workflow.md)** - Remote editing/build/debug with shared fail-fast gates
4. **[qmp-storage-daemon.md](./qmp-storage-daemon.md)** - QMP, QOM, storage daemon

## Quick Reference

```sh
# 1. Enter Guix dev environment
guix shell --manifest=../omi-dev-manifest.scm

# 2. Cross-compile RISC-V kernel
riscv64-linux-gnu-gcc -std=c99 -O2 -static ../omi_riscv_vm.c -o init

# 3. Build VM image
./build_omi_riscv.sh

# 4. Run QEMU with QMP
qemu-system-riscv64 -qmp unix:/tmp/qemu.sock,server,nowait -kernel vmlinuz -initrd initramfs.cpio

# 5. Connect QMP (in another terminal)
nc -U /tmp/qemu.sock
{"execute": "qmp_capabilities"}
{"execute": "query-status"}

# 6. Or use GDB
qemu-system-riscv64 -gdb tcp::1234 -S -kernel vmlinuz -initrd initramfs.cpio

# 7. Connect GDB
riscv64-linux-gnu-gdb vmlinuz
(gdb) target remote localhost:1234
```

## QMP Quick Reference

| Action | QMP Command |
|--------|-------------|
| Stop VM | `{"execute": "stop"}` |
| Resume | `{"execute": "cont"}` |
| Query devices | `{"execute": "query-block"}` |
| Backup | `{"execute": "drive-backup", "arguments": {"device": "hd0", "target": "backup.qcow2"}}` |

## Lookup Tables

Your octuple precision lookup tables:

- `omi-braille-table.lisp` - Braille (0x80-0xBF) → significand
- `omi-aegean-table.lisp` - Aegean (0xC0-0xFF) → exponent  
- `omi-bom-table.lisp` - BOM (NULL/DEL) → sign + 4×16-bit channels
