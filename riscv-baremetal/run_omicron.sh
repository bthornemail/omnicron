#!/bin/bash
# OMICRON Stream Interpolator - QEMU Launch Script
# 4-Channel VirtIO + Shared Memory "Logic Mirror"

QEMU=qemu-system-riscv64
BIOS=/usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin
KERNEL=/root/omnicron/riscv-baremetal/my_kernel.flat
MEM_PATH=/dev/shm/omicron_mirror

# Clean up from previous runs
rm -f /tmp/omicron_ch{0,1,2,3}
rm -f "$MEM_PATH"

# Launch QEMU with 4 VirtIO Serial + Shared Memory
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