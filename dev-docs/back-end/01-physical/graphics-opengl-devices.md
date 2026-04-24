# QEMU Graphics, OpenGL, and Emulated Devices

## Graphics in QEMU

### Display Options

```sh
# Standard console (text only)
-display none

# GTK (recommended for Linux)
-display gtk

# SDL
-display sdl

# VNC
-display vnc :0

# SPICE (rich, includes copy/paste)
-display spice

# Cocoa (macOS only)
-display cocoa
```

### VGA Options

| VGA Type | Description | Use Case |
|----------|-------------|----------|
| `std` | Standard VGA | Simple, works everywhere |
| `cirrus` | Cirrus GD5446 | Old, compatible |
| `virtio` | VirtIO GPU | Fast, modern |
| `qxl` | QXL paravirtual | For SPICE |
| `vmware` | VMware SVGA | For VMware drivers |
| `none` | No framebuffer | Headless |

### VirtIO GPU (Fastest)

```sh
qemu-system-riscv64 \
  -device virtio-gpu-pci \
  -display gtk
```

Features:
- 3D acceleration via VirGL
- Multiple displays
- Cursor passthrough

## OpenGL in QEMU

### What is OpenGL?

OpenGL = Open Graphics Library - API for 2D/3D rendering:

```
┌─────────────────────────────────────────────────────────────┐
│  Your Program (OpenGL calls)                                 │
│         ↓                                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  OpenGL Driver (NVIDIA, AMD, Intel, Mesa)           │    │
│  └─────────────────────────────────────────────────────┘    │
│         ↓                                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  GPU Hardware                                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

OpenGL is the API. The driver talks to GPU.

### OpenGL ES

OpenGL ES = OpenGL for Embedded Systems:

```
┌─────────────────────────────────────────────────────────────┐
│  OpenGL (desktop)           vs    OpenGL ES (embedded)       │
├─────────────────────────────────────────────────────────────┤
│  Full features             │    Subset of OpenGL             │
│  Complex shaders         │    Simpler shaders              │
│  Many extensions        │    Few extensions               │
│  Desktop GPUs          │    Mobile GPUs                  │
├─────────────────────────────────────────────────────────────┤
│  Use: Games, CAD         │    Use: Phone, TV, WebGL        │
└─────────────────────────────────────────────────────────────┘
```

### WebGL

WebGL = OpenGL ES in JavaScript:

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  JavaScript                                           │  │
│  │    canvas.getContext('webgl')                        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  WebGL API                                           │  │
│  │    (subset of OpenGL ES 2.0)                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  OpenGL ES 2.0                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  GPU Driver / Mesa                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### How QEMU Supports OpenGL

```sh
# Enable OpenGL in QEMU
qemu-system-riscv64 \
  -display gtk,gl=on \
  -device virtio-gpu-pci,edid=on,renderer=glx
```

What's happening:

```
┌─────────────────────────────────────────────────────────────┐
│  Guest VM                                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  OpenGL calls from guest                            │  │
│  └─────────────────────────────────────────────────────┘  │
│         ↓                                                   │
│  QEMU grabs OpenGL calls                                     │
│         ↓                                                   │
│  Passes to VirGL (virtual GPU)                              │
│         ↓                                                   │
│  Mesa on host processes                                    │
│         ↓                                                   │
│  Host GPU renders                                        │
└─────────────────────────────────────────────────────────────┘
```

### VirGL (Virtual GPU)

VirGL gives VMs a virtual 3D GPU:

```sh
qemu-system-riscv64 \
  -device virtio-gpu-pci,edid=on,renderer=virgl \
  -display gtk,gl=es
```

## Mesa (Open Source Drivers)

### What is Mesa?

Mesa is the open-source OpenGL/Vulkan driver:

```
┌─────────────────────────────────────────────────────────────┐
│  Programs                                                  │
│         ↓                                                     │
│  libGL.so (OpenGL entry points)                            │
│         ↓                                                     │
│  Mesa core (compiler, state tracker)                       │
│         ↓                                                     │
│  Driver (i965, radeonsi, llvmpipe, swrast,...)            │
│         ↓                                                     │
│  GPU Hardware                                            │
└─────────────────────────────────────────────────────────────┘
```

Mesa drivers:
- `i965` - Intel Gen 8+
- `radeonsi` - AMD GCN+
- `llvmpipe` - Fast software rendering
- `swrast` - Slow software rendering
- `etnaviv` - Vivante GPUs
- `iris` - Intel Gen 8+ (new)

### Why Mesa Matters for You

When you use QEMU with GL, Guest → QEMU → Mesa → Host GPU

## Emulated Devices in QEMU

### Full Device List

QEMU emulates many devices:

| Category | Devices |
|----------|--------|
| CPU | riscv64, x86_64, arm, aarch64, ppc... |
| Storage | virtio-blk, SCSI, IDE, NVMe, eMMC |
| Network | virtio-net, e1000, RTL8139, vmxnet3 |
| Graphics | virtio-gpu, cirrus, std, qxl |
| Input | virtio-input, usb-kbd, usb-mouse |
| Audio | hda, ac97, sb16 |
| Serial | serial, parallel |
| USB | xHCI, OHCI, EHCI |
| Smart Card | ccid, u2f |
| CAN | can-ctrl, can-bus |
| CXL | cxl-host |

### Adding Devices

```sh
qemu-system-riscv64 \
  -device virtio-gpu-pci \
  -device virtio-net-pci,netdev=net0 \
  -device virtio-blk-pci,drive=hd0 \
  -device virtio-input-keyboard-pci \
  -device virtio-input-mouse-pci \
  -device qemu-xhci
```

### VirtIO Devices (Recommended)

VirtIO = paravirtualized:

```
┌─────────────────────────────────────────────────────────────┐
│  Full Emulation          vs    VirtIO (Paravirtualized)   │
├─────────────────────────────────────────────────────────────┤
│  emulates hardware      │   guest knows it's virtual    │
│  slow                │   fast                  │
│  needs driver in guest│   uses virtio driver     │
│  compatible         │   requires modern OS    │
└─────────────────────────────────────────────────────────────┘
```

List of VirtIO devices:

```sh
# Block (storage)
-device virtio-blk-pci

# Network
-device virtio-net-pci

# GPU
-device virtio-gpu-pci

# Input
-device virtio-keyboard-pci
-device virtio-mouse-pci

# Serial
-device virtio-serial-pci

# Balloon (memory)
-device virtio-balloon-pci

# RNG (random)
-device virtio-rng-pci

# 9P filesystem
-device virtio-9p-pci

# SCSI
-device virtio-scsi-pci
```

### VirtIO Configuration

```sh
# With options
-device virtio-net-pci,netdev=net0,mac=52:54:00:12:34:56
-device virtio-blk-pci,drive=hd0,serial=SN123456
-device virtio-gpu-pci,edid=on,renderer=virgl
```

### User-Managed Devices

For direct access to host hardware:

```sh
# VFIO (direct GPU access)
-device vfio-pci,addr=06.0,rombar=1

# vhost-user (userspace network)
-object vhost-user-blk-pci,...)
```

## CAN Bus Emulation

### What is CAN?

CAN = Controller Area Network (industrial, automotive):
- Robust bus for machines
- Used in cars, factories
- 1Mbps max

### QEMU CAN

```sh
# Create CAN bus
qemu-system-riscv64 \
  -canbus can0

# Add CAN controller
-device can-ctrl,bus=can0

# With socketcan (host CAN)
-canbus can0=socketcan,if=can0
```

## USB Devices

```sh
# xHCI (USB 3.0, fast)
-device qemu-xhci

# EHCI (USB 2.0)
-device nec-usb-xhci

# OHCI (USB 1.1, older)
-device usb-ohci
```

### USB Devices

| Device | Description |
|--------|------------|
| `usb-kbd` | Keyboard |
| `usb-mouse` | Mouse |
| `usb-tablet` | Tablet (absolute) |
| `usb-wacom-tablet` | Wacom tablet |
| `usb-storage` | USB drive |
| `usb-ccid` | Smart card |
| `usb-serial` | Serial adapter |

```sh
# Add USB devices
qemu-system-riscv64 \
  -device qemu-xhci \
  -device usb-kbd \
  -device usb-mouse \
  -device usb-storage,id=usbstick,drive=ustick
```

## U2F (Universal 2nd Factor)

U2F = security keys (YubiKey, etc):

```sh
# Add U2F device
-device u2f-zero-touch
```

## CCID (Smart Card)

Smart card reader:

```sh
# CCID device
-device ccid-card-passthru
```

## Quick Reference: Your Setup

### Minimal QEMU with VirtIO

```sh
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -display none \
  -nographic \
  -drive file=disk.qcow2,if=virtio \
  -netdev user,id=net0 \
  -device virtio-net-pci,netdev=net0 \
  -kernel vmlinuz \
  -initrd initramfs.cpio
```

### With Graphics

```sh
qemu-system-riscv64 \
  -machine virt \
  -m 1G \
  -display gtk \
  -device virtio-gpu-pci \
  -drive file=disk.qcow2,if=virtio \
  -device qemu-xhci \
  -device usb-kbd -device usb-mouse
```

### With OpenGL

```sh
qemu-system-riscv64 \
  -machine virt \
  -m 1G \
  -display gtk,gl=on \
  -device virtio-gpu-pci,edid=on,renderer=virgl
```

## Summary

| What You Need | What to Use |
|--------------|------------|
| Basic disk | `-drive file=image.qcow2` |
| Fast disk | `-drive if=virtio` |
| Network | `-device virtio-net-pci` |
| Graphics | `-device virtio-gpu-pci` |
| OpenGL | `-display gtk,gl=on` |
| USB | `-device qemu-xhci` |
| OpenGL ES | `-display gtk,gl=es` |
| WebGL | Browser with WebGL |
| CAN bus | `-canbus can0` |
| Smart cards | `-device ccid-card-*` |