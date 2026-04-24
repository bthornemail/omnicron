# VNC and LED State in QEMU

## What is VNC?

VNC = Virtual Network Computing - remote desktop protocol:

```
┌─────────────────────────────────────────────────────────────┐
│  VNC (Virtual Network Computing)                        │
│                                                             │
│  ┌───────────┐           ┌────────────┐                 │
│  │  VNC      │ ◄───────► │  VNC       │                 │
│  │  Server   │   RFB    │  Client   │                 │
│  │  (QEMU)  │ Protocol │  (viewer) │                 │
│  └───────────┘           └────────────┘                 │
│                                                             │
│  - Screen sharing                                          │
│  - Keyboard/mouse input                                   │
│  - Copy/paste (sometimes)                                 │
│  - LED state sync (via pseudo-encoding)                  │
└─────────────────────────────────────────────────────────────┘
```

## VNC in QEMU

### Starting VNC Server

```sh
# Basic VNC
qemu-system-riscv64 \
  -vnc :0

# With password
qemu-system-riscv64 \
  -vnc :0,password

# On specific address/port
qemu-system-riscv64 \
  -vnc localhost:5900

# With TLS
qemu-system-riscv64 \
  -vnc :0,tls,x509-cacert=ca.pem
```

### Connecting

```sh
# Using VNC viewer
vncviewer localhost:5900

# Using TigerVNC
tigervnc localhost:5900

# Using remmina
remmina -c vnc://localhost:5900
```

## VNC Protocol (RFB)

### What is RFB?

RFB = Remote Framebuffer - the VNC protocol:

```
┌─────────────────────────────────────────────────────────────┐
│  RFB Protocol Flow                                        │
│                                                             │
│  1. Handshake:                                            │
│     Client → Server: "RFB 003.008\n"                      │
│     Server → Client: "RFB 003.008\n"                       │
│                                                             │
│  2. Authentication:                                       │
│     Server → Client: auth type (1=none, 2=password,...)   │
│     Client → Server: response                              │
│                                                             │
│  3. Init:                                               │
│     Server → Client: framebuffer dimensions, pixels, etc.     │
│     Client → Client: share/don't share                     │
│                                                             │
│  4. Loop:                                                │
│     Client ↔ Server: framebuffer updates                  │
│     Client → Server: keyboard/mouse events               │
└─────────────────────────────────────────────────────────────┘
```

### Framebuffer

The screen is a grid of pixels:

```
Framebuffer:
┌─────────────────────────────────────┐
│  w pixels × h pixels                  │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┐             │
│  │R│G│B│R│G│B│R│G│B│ ...        │
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┘             │
│  Each pixel = R, G, B (usually 8 bits each)│
└─────────────────────────────────────┘
```

## LED State Pseudo-Encoding

### What is LED State?

LED state = keyboard LED status:

```
┌─────────────────────────────────────────────────────────────┐
│  LED State (3 bits)                                        │
│                                                             │
│  Bit 2 (left):  Caps Lock    (1=ON, 0=OFF)                │
│  Bit 1 (middle): Num Lock    (1=ON, 0=OFF)                │
│  Bit 0 (right): Scroll Lock (1=ON, 0=OFF)               │
│                                                             │
│  Examples:                                               │
│  100 = Caps Lock ON                                      │
│  010 = Num Lock ON                                       │
│  001 = Scroll Lock ON                                  │
│  111 = All three ON                                     │
│  000 = All OFF                                        │
└─────────────────────────────────────────────────────────────┘
```

### The Problem

When using VNC:

```
┌─────────────────────────────────────────────────────────────┐
│  LED Mismatch Problem                                      │
│                                                             │
│  ┌────────────────┐     ┌────────────────┐                  │
│  │   Your PC      │     │   QEMU VM     │                  │
│  │  _________    │ VNC │  ________   │                  │
│  │ |CAPS: off|   │ ◄──►│ |CAPS: on ||   │                  │
│  │ |NUM:  on |   │     │ |NUM:  on ||   │                  │
│  │ |SCR: off|   │     │ |SCR: off||   │                  │
│  │  ‾‾‾‾‾‾‾   │     │  ‾‾‾‾‾‾‾   │                  │
│  └────────────────┘     └────────────────┘                  │
│                                                             │
│  Problem: Client sees CAPS off, but VM has CAPS on          │
│  Solution: LED state pseudo-encoding syncs them          │
└─────────────────────────────────────────────────────────────┘
```

### Pseudo-Encoding Number

| Number | Name |
|--------|------|
| -261 | LED state Pseudo-encoding |

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Client Requests LED State:                                 │
│                                                             │
│  1. Client sends encoding:                               │
│     ServerInit message + pseudo-encoding -261            │
│                                                             │
│  2. Server includes LED state in framebuffer update:      │
│     FramebufferUpdate with LED state                     │
│                                                             │
│  3. Client updates client-side LEDs:                   │
│     Your keyboard LEDs match VM                           │
└─────────────────────────────────────────────────────────────┘
```

### Example Frames

| Binary | Decimal | Description |
|--------|---------|-------------|
| 100 | 4 | Caps Lock ON |
| 010 | 2 | Num Lock ON |
| 001 | 1 | Scroll Lock ON |
| 111 | 7 | All three ON |
| 000 | 0 | All OFF |
| 101 | 5 | Caps + Scroll ON |
| 110 | 6 | Caps + Num ON |

### In QEMU

```sh
# VNC with LED state support
qemu-system-riscv64 \
  -vnc :0 \
  -kbd delay \
  -show-cursor

# LED state is sent by:
# - qemu sends FramebufferUpdate with LED state
# - client updates their local keyboard LEDs
```

### VNC Keyboard

```sh
# Add keyboard with LED support
qemu-system-riscv64 \
  -device qemu-xhci \
  -device usb-kbd \
  -vnc :0
```

## VNC Encodings

### Standard Encodings

| Encoding | Number | Description |
|----------|--------|-------------|
| Raw | 0 | Direct pixel data |
| RRE | 1 | Rectangle encoding |
| Hextile | 2 | Tile-based encoding |
| ZRLE | 3 | Run-length encoding |
| Tight | 4 | Compressed encoding |
| Tight PNG | 5 | Tight with PNG |

### Pseudo-Encodings

| Pseudo-Encoding | Number | Description |
|-----------------|--------|-------------|
| DesktopSize | -235 | Resize notification |
| Cursor | -239 | Cursor shape |
| LED | -261 | LED state ⬅ |
| Compression | -247 | Compression level |
| Quality | -232 | JPEG quality |
| FineQuality | -23 | Fine-grained JPEG |
| CompressLevel | -256 | Compression level |

### Using Pseudo-Encodings

Client declares supported encodings in ClientInit:

```
Client → Server:
  number-of-encodings (32 bits)
  encoding[0] = 0 (raw)
  encoding[1] = -261 (LED state)
  encoding[2] = -235 (desktop resize)
```

## VNC in QEMU Options

### Display Options

```sh
# GTK display (recommended with VNC)
-display gtk \
  -vnc :0

# VNC only (no local display)
-display vnc=:0

# SDL with VNC
-display sdl \
  -vnc :0
```

### VNC Options

```sh
# Basic
-vnc :0

# Password required
-vnc :0,password

# TLS with certificates
-vnc :0,tls,x509=/path/to/certs

# Copy password
-vnc :0,password

# Share (don't disconnect other clients)
-vnc :0,share=force

# View-only (no input)
-vnc :0,readonly

# Lossy compression
-vnc :0,lossy
```

### Keyboard Options

```sh
# Key delay (for LED sync)
-kbd delay=50

# Grab keyboard automatically
-grab-keys

# Keymap
-keymap en-us
```

## Copy/Paste

### Enabling

```sh
# Enable clipboard sharing
qemu-system-riscv64 \
  -vnc :0 \
  -enable-kvm

# For copy/paste through VNC
# Requires clipboard manager on host
```

### Limitations

```
┌─────────────────────────────────────────────────────────────┐
│  VNC Copy/Paste Limitations                                 │
│                                                             │
│  - Raw VNC: NO clipboard                                  │
│  - VEEnet (TigerVNC): Basic copy/paste                    │
│  - Full clipboard: Requires special driver              │
│  - Best with: qemu-vdagent on Windows guests               │
└─────────────────────────────────────────────────────────────┘
```

## TigerVNC

### What is TigerVNC?

TigerVNC = High-performance VNC implementation:

```sh
# Install
apt install tigervnc-viewer

# Connect
tigervncviewer localhost:5900

# With options
tigervncviewer -depth 24 -geometry 1024x768 localhost:5900
```

### TigerVNC Features

- Faster encoding (Tight)
- Clipboard better handling
- Scaling
- Multiple monitors

## VNC Alternatives

### SPICE (Better than VNC)

```sh
# SPICE instead of VNC
-display spice \
  -spice port=5901,disable-ticketing

# Connect with remote-viewer
remote-viewer spice://localhost:5901
```

### Why SPICE > VNC

| Feature | VNC | SPICE |
|--------|-----|-------|
| Performance | Good | Better |
| Audio | No | Yes |
| Clipboard | Limited | Full |
| Video | No | Yes (VA-API) |
| Encryption | Optional | TLS |
| Multi-monitor | Hard | Easy |

## VNC Security

### Password

```sh
# Set password
qemu-system-riscv64 \
  -vnc :0,password \
  -monitor telnet:4444,server,nowait

# Then in monitor:
(qemu) set_password vnc mypassword
```

### TLS

```sh
# Generate certificates
openssl genrsa -out server-key.pem 2048
openssl req -new -key server-key.pem -out server.csr
openssl x509 -req -days 365 -in server.csr -signkey server-key.pem -out server-cert.pem

# Use TLS
qemu-system-riscv64 \
  -vnc :0,tls,x509-key=server-key.pem,x509-cert=server-cert.pem
```

## VNC Troubleshooting

### Connection Refused

```sh
# Check QEMU is running with VNC
ss -tlnp | grep 590

# Check firewall
iptables -L -n | grep 590
```

### Slow Connection

```sh
# Use better encoding
tigervncviewer -Encoding ZRLE localhost:5900

# Reduce color depth
tigervncviewer -depth 16 localhost:5900
```

### No Keyboard

```sh
# Add keyboard
qemu-system-riscv64 \
  -device qemu-xhci \
  -device usb-kbd \
  -vnc :0
```

## VNC and Your Kernel

### For Console Access

VNC lets you see your kernel's console:

```
┌─────────────────────────────────────────────────────────────┐
│  Access Options                                           │
│                                                             │
│  1. Serial console (text only)                         │
│     -serial mon:stdio                                  │
│                                                             │
│  2. VNC (graphics)                                    │
│     -vnc :0                                          │
│     -vga std                                         │
│                                                             │
│  3. SPICE (better graphics)                           │
│     -spice port=5901                                 │
│     -device qxl                                         │
└─────────────────────────────────────────────────────────────┘
```

### Debugging with VNC

```sh
# VNC + GDB
qemu-system-riscv64 \
  -vnc :0 \
  -gdb tcp::1234 \
  -S \
  -kernel vmlinuz \
  -initrd initramfs.cpio
```

## Summary

### VNC Quick Commands

```sh
# Start QEMU with VNC
qemu-system-riscv64 \
  -vnc :0 \
  -kernel vmlinuz \
  -initrd initramfs.cpio

# Connect from another terminal
vncviewer localhost:5900
```

### LED State Values

| Value | Led Status |
|-------|-----------|
| 4 | Caps Lock ON |
| 2 | Num Lock ON |
| 1 | Scroll Lock ON |
| 7 | All ON |
| 0 | All OFF |

### Key Points

1. **LED state -261** = sync Caps/Num/Scroll lock
2. **Problem**: Client LEDs don't match VM
3. **Solution**: Pseudo-encoding syncs them
4. **VNC**: Screen sharing for console
5. **Alternatives**: SPICE (better)