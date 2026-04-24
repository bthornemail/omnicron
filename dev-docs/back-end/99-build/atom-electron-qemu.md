# How Atom/Electron Works with QEMU Remote

## The Problem

You're building your own OS. You need to edit files ON YOUR RISC-V VM running inside QEMU from your host machine.

## Solution: Atom Remote Editing

Atom has a built-in remote editing feature. Here's how it works:

```
┌─────────────────────┐      SSH/TCP       ┌─────────────────────┐
│  Host Machine       │ ◄───────────────► │  QEMU RISC-V VM   │
│                   │                   │                  │
│  Atom + Remote     │                   │  omi-lisp kernel │
│  (your editor)    │                   │  (your code)     │
└─────────────────────┘                   └─────────────────────┘
```

## Setup Steps

### Step 1: Install Atom on Host

```sh
# Option A: From atom.io
# Download from https://atom.io

# Option B: Via package manager
# Debian/Ubuntu:
wget -qO - https://packagecloud.io/AtomEditor/atom/gpgkey | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://packagecloud.io/AtomEditor/atom/any any"
sudo apt update
sudo apt install atom
```

### Step 2: Install SSH Server on QEMU VM

The initramfs needs an SSH server. Add to your C code:

```c
// omi_riscv_vm.c - add SSH daemon stub

#include <netinet/in.h>
#include <unistd.h>

void start_sshd(void) {
    // Minimal SSH placeholder
    // In your omi-lisp kernel, this would be the session layer
}
```

### Step 3: Start QEMU with Network

```sh
# Start QEMU with network so VM is accessible from host
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -nographic \
  -net nic -net user,hostfwd=tcp::2222-:22 \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio \
  -append "console=ttyS0 rdinit=/init panic=1"
```

### Step 4: Connect Atom Remote

```sh
# In Atom, use remote FTP/sFTP:
# 1. Install package: remote-ftp
# 2. Edit > Remote FTP > Connect
# 3. Enter: sftp://user@localhost:2222

# Or use SSH directly:
ssh -p 2222 user@localhost
```

## Alternative: Virtual Network

If network doesn't work, use QEMU monitor:

```sh
# QEMU monitor socket
qemu-system-riscv64 \
  -monitor unix:/tmp/qemu-monitor.sock,server,nowait \
  ...

# Connect to monitor
socat - /tmp/qemu-monitor.sock
```

## Atom Configuration for Remote Editing

```cson
# ~/.atom/config.cson
"*":
  core:
    themes: [
      "one-dark"
      "atom-dark-syntax"
    ]
  "remote-ftp":
    profiles:
      name: "omi-riscv"
      host: "localhost"
      port: 2222
      user: "root"
      password: ""
      privatekey: "/home/user/.ssh/id_rsa"
      passphrase: ""
      remote: "/"
      local: "~/omi-lisp"
      tabWidth: 8
      useSystemThreading: true
```