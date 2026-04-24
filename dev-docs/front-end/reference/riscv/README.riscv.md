# OMICRON Stream Interpolator
# 4-Channel VirtIO-Serial Hardware Rig

## Derived Constants (from WOLOG Numerical Constitution)

### Possibility Order
- CH0_BINARY: channels 0-15 → 2·4·8·16·256 bit field

### Incidence Order  
- CH1_DECIMAL: 7! cycle position, 15 lane depth, 60 slot surface

### Projection Order
- CH2_HEX: 240-frame address, 256 observer window
- CH3_SIGN: BOM chirality (FFFE/FEFF)

### Closure
- MASTER_PERIOD = 5040 (LCM of 7 and 60)

## Files Created

### Kernel Driver
- `omicron_driver.c` - Interpolator with BOM chirality
- `virtio.h` - VirtIO structures (for future PCI driver)

### QEMU Launcher
- `run_omicron.sh` - 4-channel VirtIO rig

## Channel Mapping

| Port | Channel | Role | Constants |
|------|---------|------|----------|
| ch0 | Binary | Bitboard stream | 2→4→8→16→256 |
| ch1 | Decimal | Phase/factor | 7!·15·60 |
| ch2 | Hex | Normalize | 240, 256 |
| ch3 | Sign | BOM flip | FFFE/FFEF |

## Usage

# Start QEMU with 4 channels:
chmod +x run_omicron.sh
./run_omicron.sh

# Or manually:
qemu-system-riscv64 -M virt -m 256M \
  -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin \
  -kernel my_kernel.flat \
  -chardev socket,path=/tmp/omicron_ch0,server=on,wait=off,id=ch0 \
  -chardev socket,path=/tmp/omicron_ch1,server=on,wait=off,id=ch1 \
  -chardev socket,path=/tmp/omicron_ch2,server=on,wait=off,id=ch2 \
  -chardev socket,path=/tmp/omicron_ch3,server=on,wait=off,id=ch3 \
  -device virtio-serial-pci \
  -device virtserialport,chardev=ch0,name=ch0_binary \
  -device virtserialport,chardev=ch1,name=ch1_decimal \
  -device virtserialport,chardev=ch2,name=ch2_hex \
  -device virtserialport,chardev=ch3,name=ch3_sign \
  -nographic

# Send data to channels:
echo -n -e '\xAA\xAA\xAA\xAA\xAA\xAA\xAA\xAA' > /tmp/omicron_ch0
echo -e 'FANO' > /tmp/omicron_ch1
echo -e '0123456789ABCDEF' > /tmp/omicron_ch2
echo -e '\xFF\xFE' > /tmp/omicron_ch3

## Stream Protocol

ESC sequence → Channel switch:
  0x40-0x7F → Channel 1, pos 0-63
  0x80-0xBF → Channel 2, pos 0-63
  0xC0-0xFF → Channel 3, pos 0-63

Direct bytes → Interpolate to current channel/pos based on BOM