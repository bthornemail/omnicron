# OMICRON Atomic Kernel - Specification Reference

## The Six Laws (from Atomic Kernel v1.2)

### 1. Δ Law (State Evolution)
```
Δ(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
```

### 2. Mixed Radix (Coordinate Decomposition)
```radices = [7, 15, 60]```

### 3. Projection Law
```
interpret(project(v, b), b) = v
```

### 4. Structural Access (FS/GS/RS/US)
```
FS = 0x1C (Context)
GS = 0x1D (Record)
RS = 0x1E (Unit)
US = 0x1F (Separator)
```

### 5. Artifact Verification
Fingerprint based on state hash.

### 6. Three Sequencing Functions (Heartbeat)
- Phase: `(phase + 1) % 5040`
- Chiral: `(phase % 2 == 0) ? FFFE : FEFF`
- Logic: `phase % 15`

## File Map

| File | Implements |
|------|-----------|
| atomic_kernel.c | All 6 laws + stream |
| virtio.h | VirtIO structures |
| virtio_read.h | Channel interleaving |
| heartbeat_loop.S | Assembly heartbeat |
| feed_channels.py | Host-side feeder |

## Run

```bash
# Compile
riscv64-unknown-elf-gcc -fno-pic -march=rv64gc -mcmodel=medany -nostdlib -T linker.ld -o my_kernel.bin startup_simple.S atomic_kernel.c

# Run QEMU
qemu-system-riscv64 -M virt -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin -kernel my_kernel.flat -nographic
```

## Channel Mapping

| Port | Channel | Law |
|------|---------|-----|
| ch0 | Binary | Δ Law |
| ch1 | Decimal | Mixed Radix |
| ch2 | Hex | Projection |
| ch3 | Sign | Chiral/BOM |