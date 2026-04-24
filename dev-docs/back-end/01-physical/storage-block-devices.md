# QEMU Storage: NBD, Storage Daemon, and Block Devices

## NBD (Network Block Device)

### What It Does

NBD lets you share a disk image over the network:

```
┌─────────────────────────────────────────────────────────────┐
│  Traditional: Disk inside QEMU                                │
│                                                             │
│  ┌─────────────┐    ┌─────────────────┐                     │
│  │   QEMU VM  │ ◄─ │  disk image     │                     │
│  │           │    │  (qcow2 locally) │                     │
│  └─────────────┘    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  With NBD: Disk over network                               │
│                                                             │
│  ┌─────────────┐                    ┌─────────────────┐        │
│  │   QEMU VM  │ ◄── network ────► │  qemu-nbd    │        │
│  │           │    (TCP/NBD)     │  server       │        │
│  └─────────────┘                    │  has disk     │        │
│                                  │  image       │        │
│                                  └─────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Why Use NBD

1. **Separate QEMU from disk storage** - Run QEMU on one machine, disk on another
2. **Share one disk among multiple VMs** - NFS-style block access
3. **Live migration with shared storage** - Move VM, disk stays
4. **Disk image on NAS/SAN** - Storage area network

### Starting NBD Server

```sh
# Serve disk image on port 10809 (default NBD port)
qemu-nbd \
  --持久 \
  --fork \
  --socket=/tmp/nbd.sock \
  --format=qcow2 \
  omi-vm.qcow2

# Or with TCP
qemu-nbd \
  --持久 \
  --bind=0.0.0.0 \
  --port=10809 \
  --format=qcow2 \
  omi-vm.qcow2
```

### Connecting to NBD

```sh
# From another QEMU instance
qemu-system-riscv64 \
  -drive file=nbd://localhost:10809 \
  -drive file=nbd://192.168.1.100:/export-name
```

### Linux NBD Client

```sh
# On Linux, you can use /dev/nbd/X directly
modprobe nbd

# Connect to remote NBD server
nbd-client hostname port /dev/nbd0

# Now /dev/nbd0 is your remote disk
mount /dev/nbd0p1 /mnt

# Disconnect
nbd-client -d /dev/nbd0
```

### NBD Commands

```sh
# List exports from server (no auth needed)
qemu-nbd -L -c hostname

# Get info about export
qemu-nbd --info hostname port export-name

# Unpublish (disconnect) device
qemu-nbd -d /dev/nbd0
```

## QEMU Storage Daemon

### What It Does

qemu-storage-daemon is a long-running process that provides disk functionality WITHOUT running a full VM:

```
┌──────────────────────────────���──────────────────────────────┐
│  qemu-system-riscv64 (full VM)                              │
│                                                             │
│  - Emulates CPU, devices, memory                           │
│  - Runs your kernel                                        │
│  - Heavyweight (uses lots of resources)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  qemu-storage-daemon (disk services only)                 │
│                                                             │
│  - Export images over NBD                                 │
│  - Run block jobs (mirror, backup)                       │
│  - Export via QMP (not full VM)                          │
│  - Lightweight                                          │
└─────────────────────────────────────────────────────────────┘
```

### Starting Storage Daemon

```sh
# Export disk image via NBD
qemu-storage-daemon \
  --object secret,id=sec0,file=/path/to/key \
  --dry-run \
  --chardev socket,id=chardev0,server=on,wait=off,tcp=0.0.0.0:10810 \
  --nbd-server,chardev=chardev0 \
  --blockdev driver=file,filename=disk.qcow2,node-name=hd0 \
  --export nbd,node-name=hd0,name=my-export
```

### Then Connect

```sh
# Connect as NBD client
qemu-system-riscv64 \
  -drive file=nbd://localhost:10810/my-export
```

### What You Can Do

| Command | What It Does |
|---------|-------------|
| `block-export-add` | Add new export |
| `block-stream` | Stream blocks (fill from backing) |
| `block-commit` | Commit changes to backing |
| `backup` | Backup to another image |
| `mirror` | Mirror to another device |

### Example: Live Backup

```json
// Connect to QMP
{"execute": "qmp_capabilities"}

// Start backup job
{
  "execute": "drive-backup",
  "arguments": {
    "device": "hd0",
    "target": "backup.qcow2",
    "sync": "full"
  }
}
```

## QEMU Block Devices (virtio, SCSI, NVMe)

### VirtIO Block

The fast way to connect disks to QEMU:

```
┌─────────────────────────────────────────────────────────────┐
│  IDE disk (slower, emulated)                           │
│                                                             │
│  - emulated hardware                                    │
│  - software conversion                                  │
│  - slower                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  VirtIO Block (faster, paravirtualized)                  │
│                                                             │
│  - direct passthrough to host                             │
│  - uses virtqueue (shared ring buffer)                   │
│  - much faster                                          │
└───────────────────────────��─────────────────────────────────┘
```

Using VirtIO:

```sh
qemu-system-riscv64 \
  -drive file=disk.qcow2,if=virtio \
  -device virtio-blk-pci,drive=hd0
```

### SCSI Emulation

For older OSes that need SCSI:

```sh
# SCSI disk
qemu-system-riscv64 \
  -drive file=disk.qcow2,if=scsi \
  -device lsi53c895a

# Add SCSI devices
-device scsi-hd,drive=hd0
-device scsi-cd,drive=cd0
```

### NVMe (Modern, Fast)

The newest, fastest storage interface:

```sh
# NVMe device
qemu-system-riscv64 \
  -drive file=disk.qcow2,if=nvme \
  -device nvme,drive=hd0,serial=1234
```

Parameters:
- `serial` - Serial number
- ` namespaces` - NVMe namespaces
- `max_ioq_blocks` - Max blocks per IO

### eMMC Emulation

For embedded/mobile devices:

```sh
# eMMC storage
qemu-system-riscv64 \
  -device emmc,id=emmc0,drive=sd0
```

Used for devices that boot from eMMC (phones, tablets).

## Emulated Devices

### What Are Emulated Devices?

QEMU doesn't just emulate CPU. It emulates entire hardware devices:

```
┌─────────────────────────────────────────────────────────────┐
│  Your VM sees these devices (emulated)                     │
│                                                             │
│  - UART (serial port)                                     │
│  - VirtIO network                                        │
│  - VirtIO block                                          │
│  - RTL8139 network card                                  │
│  - Intel e1000 network                                  │
│  - USB OHCI/EHCI/xHCI                                   │
│  - GPU (Cirrus, virtio-vga)                              │
│  - ...                                                  │
└─────────────────────────────────────────────────────────────┘
```

### VirtIO Devices (Best Performance)

VirtIO is paravirtualized - VM knows it's in QEMU:

```
┌─────────────────────────────────────────────────────────────┐
│  VirtIO Architecture                                     │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ Guest    │    │ VirtIO  │    │ Host     │          │
│  │ driver  │ ◄─►│ queue   │ ◄─►│ kernel   │          │
│  │         │    │ (ring)  │    │        │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                             │
│  - Faster than full emulation                              │
│  - Requires guest driver                                  │
│  - Standard in modern Linux                             │
└─────────────────────────────────────────────────────────────┘
```

VirtIO devices:

| Device | What It Does |
|--------|--------------|
| `virtio-blk` | Block storage |
| `virtio-net` | Network |
| `virtio-scsi` | SCSI |
| `virtio-gpu` | Graphics |
| `virtio-input` | Keyboard/mouse |
| `virtio-fs` | File sharing (9P) |
| `virtio-balloon` | Memory ballooning |
| `virtio-rng` | Random number generator |

### CAN Bus Emulation

CAN = Controller Area Network (industrial bus):

```sh
# Add CAN bus
qemu-system-riscv64 \
  -canbus can0

# Add CAN device
-device can-bus,bus=can0
-device can-ctrl,bus=can0
```

### USB Emulation

```sh
# xHCI (USB 3.0) - recommended
-device qemu-xhci \
  -device usb-kbd \
  -device usb-mouse

# Or OHCI (USB 1.1) - for older
-device usb-ohci \
  -device usb-kbd
```

USB devices you can add:
- `usb-kbd` - keyboard
- `usb-mouse` - mouse
- `usb-tablet` - tablet (absolute coordinates)
- `usb-storage` - mass storage device
- `usb-ccid` - smart card reader
- `usb-wacom-tablet` - Wacom tablet

### Network Emulation

```sh
# VirtIO (recommended, fastest)
-device virtio-net-pci,netdev=net0

# e1000 (Intel PRO/1000)
-device e1000,netdev=net0

# RTL8139 (old, slow)
-device rtl8139,netdev=net0
```

Network setup:
```sh
-netdev user,id=net0 \
  -net nic,netdev=net0

# Or tap (via host network)
-netdev tap,id=net0,ifname=tap0 \
  -net nic,netdev=net0
```

### VFIO-User

Direct access to GPU/PCI without kernel driver:

```sh
# VFIO user (client)
qemu-system-riscv64 \
  -device vfio-user-pci,addr=06.0,sysfsdir=/path/to/vfio
```

This is for GPU passthrough to VMs.

## Graphics and OpenGL

### QEMU Graphics Options

```sh
# Cirrus (old, simple)
-display css \
  -vga cirrus

# virtio-vga (modern, fast)
-display virtio \
  -vga virtio

# std (standard VGA)
-display std \
  -vga std

# qxl (SPICE)
-display qxl \
  -spice port=5900,disable-ticketing
```

### OpenGL in QEMU

```sh
# Enable OpenGL rendering
-display gtk,gl=on

# Or with EGL
-display sdl,gl=es
```

What happens:
1. Guest renders OpenGL
2. QEMU captures GLX calls
3. Hosts runs on real GPU
4. Returns result to guest

### OpenGL ES

OpenGL for embedded systems (phones, tablets):

```
┌─────────────────────────────────────────────────────────────┐
│  OpenGL vs OpenGL ES                                        │
├─────────────────────────────────────────────────────────────┤
│  OpenGL: Full-featured, complex                           │
│  - Everything possible                                   │
│  - Used on desktops                                     │
├─────────────────────────────────────────────────────────────┤
│  OpenGL ES: Subset, simple                              │
│  - Fixed subset of features                              │
│  - Used on phones/embedded                              │
│  - WebGL is based on OpenGL ES                           │
└─────────────────────────────────────────────────────────────┘
```

In QEMU:
```sh
# Emulate OpenGL ES
qemu-system-riscv64 \
  -device virtio-gpu-pci,edid=on,renderer=glx \
  -serial mon:stdio
```

### WebGL

WebGL runs in browser, using OpenGL ES:

```
┌─────────────────────────────────────────────────────────────┐
│  WebGL Stack                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Browser (Chrome, Firefox, etc.)                    │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  WebGL API (JavaScript)                              │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  OpenGL ES 2.0 / 3.0                             │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  GPU Driver (Mesa, NVIDIA, AMD)                    │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  GPU Hardware                                      │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

Your kernel could expose a WebGL-compatible interface!

### Mesa (Open Source Drivers)

Mesa is the open-source GPU driver stack:

```
┌─────────────────────────────────────────────────────────────┐
│  Mesa Stack                                               │
│                                                             │
│  - libGL (OpenGL)                                         │
│  - libGLES (OpenGL ES)                                    │
│  - Vulkan driver                                         │
│  - DRI (Direct Rendering Infrastructure)                 │
│  - GPU drivers (i965, radeonsi, etnaviv, etc.)            │
└─────────────────────────────────────────────────────────────┘
```

For your kernel development:
- You use Mesa drivers on host
- QEMU with OpenGL passes through

## CXL (Compute Express Link)

New high-speed CPU-to-CPU and CPU-to-device link:

```sh
# CXL support
qemu-system-riscv64 \
  -device cxl-host,cxl.pmem.0=mem0
```

CXL is for:
- High-speed CPU互联
- Memory expansion
- Accelerators

## Summary: What to Use When

| Scenario | Use |
|----------|-----|
| Simple disk image | `-drive file=image.qcow2` |
| Fast disk | VirtIO: `-drive if=virtio` |
| Share disk over network | NBD: `qemu-nbd ...` |
| Disk services without VM | `qemu-storage-daemon` |
| Old OS | SCSI: `-device lsi53c895a` |
| Modern SSD | NVMe: `-device nvme` |
| Network | VirtIO: `-device virtio-net-pci` |
| Graphics | VirtIO-GPU: `-device virtio-gpu-pci` |
| OpenGL | `-display gtk,gl=on` |
| Debug block issues | NBD + `qemu-img info` |

## Quick Commands

```sh
# Info about disk image
qemu-img info disk.qcow2

# Create disk
qemu-img create -f qcow2 disk.qcow2 10G

# Convert disk format
qemu-img convert -f raw -O qcow2 input.img output.qcow2

# Snapshot
qemu-img snapshot -c snap1 disk.qcow2
qemu-img snapshot -l disk.qcow2

# NBD share
qemu-nbd --持久 --fork -P 1 disk.qcow2
```