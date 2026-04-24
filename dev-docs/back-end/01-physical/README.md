# 01-physical/

Hardware and hypervisor layer.

## Start Here

1. Start with [how-it-connects.md](../06-presentation/how-it-connects.md)

## What belongs here

- CPU architecture specs (RISC-V)
- QEMU machine types (virt for RISC-V)
- Memory layout, device tree
- Boot protocols
- Storage and block devices
- Graphics, VNC, emulated devices
- Security (SPDM), hardware features

## Files

- `risc-v-isa.md` - RISC-V ISA complete reference
- `rv128-scaling.md` - RV128I and scaling 32→64→128→256-bit
- `storage-block-devices.md` - NBD, storage daemon, block devices
- `graphics-opengl-devices.md` - OpenGL, emulated devices
- `hw-features-security.md` - SPDM, VSC, VMGenID, RAPL, RISC-V IOMMU/AIA
- `vnc-display.md` - VNC, LED state pseudo-encoding

## Walkthrough

1. Install Guix: `guix shell --manifest=omi-dev-manifest.scm`
2. Cross-compile: `riscv64-linux-gnu-gcc -std=c99 -O2 -static omi_riscv_vm.c -o init`
3. Package initramfs: `cpio -ov --format=newc < initramfs.cpio`
4. Run in QEMU: `qemu-system-riscv64 -machine virt -m 512M ...`

## Key resources

- QEMU RISC-V virt: https://www.qemu.org/docs/master/system/target-riscv.html
- RISC-V spec: https://github.com/riscv/riscv-isa-manual