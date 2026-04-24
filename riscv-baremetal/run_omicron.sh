#!/bin/bash
# OMICRON Stream Interpolator - QEMU Launch Script
# 4-Channel VirtIO + Shared Memory "Logic Mirror"

# SOURCE-OF-TRUTH NOTE
#
# STATUS: HOST TOOL
#
# This script only launches QEMU with a particular device layout:
# - one guest kernel image
# - four Unix-domain socket-backed virtio serial ports
# - one ivshmem file backing `/dev/shm/omicron_mirror`
#
# Important limitation:
# launching QEMU this way does not prove the guest kernel actually consumes the
# virtio channels or writes to the mirror. Those are guest-side responsibilities.

QEMU=qemu-system-riscv64
BIOS=/usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin
MEM_PATH=/dev/shm/omicron_mirror
RUNTIME_DIR=/root/omnicron/riscv-baremetal

# Prefer canonical flat image, but support existing alternates in this repo.
if [[ -f "$RUNTIME_DIR/my_kernel.flat" ]]; then
  KERNEL="$RUNTIME_DIR/my_kernel.flat"
elif [[ -f "$RUNTIME_DIR/my_kernel.flat2" ]]; then
  KERNEL="$RUNTIME_DIR/my_kernel.flat2"
elif [[ -f "$RUNTIME_DIR/my_kernel.bin" ]]; then
  KERNEL="$RUNTIME_DIR/my_kernel.bin"
else
  echo "ERROR: no kernel artifact found in $RUNTIME_DIR (expected my_kernel.flat|my_kernel.flat2|my_kernel.bin)" >&2
  exit 2
fi

# Clean up from previous runs
# Remove old socket paths and mirror files so QEMU can recreate them cleanly.
rm -f /tmp/omicron_ch{0,1,2,3}
rm -f "$MEM_PATH"

# Launch QEMU with 4 VirtIO Serial + Shared Memory
# `exec` replaces this shell with the QEMU process.
exec $QEMU -M virt -m 256M \
  -bios "$BIOS" \
  -kernel "$KERNEL" \
  -nographic \
  -object memory-backend-file,size=1M,share=on,mem-path="$MEM_PATH",id=mem1 \
  -device ivshmem-plain,memdev=mem1 \
  -chardev socket,path=/tmp/omicron_ch0,server=on,wait=off,id=ch0 \
  -chardev socket,path=/tmp/omicron_ch1,server=on,wait=off,id=ch1 \
  -chardev socket,path=/tmp/omicron_ch2,server=on,wait=off,id=ch2 \
  -chardev socket,path=/tmp/omicron_ch3,server=on,wait=off,id=ch3 \
  -device virtio-serial-pci \
  -device virtserialport,chardev=ch0,name=ch0_binary \
  -device virtserialport,chardev=ch1,name=ch1_decimal \
  -device virtserialport,chardev=ch2,name=ch2_hex \
  -device virtserialport,chardev=ch3,name=ch3_sign \
  "$@"

# After QEMU exits:
# Watch the logic mirror from host:
#   watch -n 0.1 xxd /dev/shm/omicron_mirror
