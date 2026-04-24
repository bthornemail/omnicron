# Octuple Precision Floating-Point in OMI-Lisp

## Overview

You're implementing 256-bit floating-point with your custom encoding:
- **Braille (0x80-0xBF)**: Significand (236 bits stored)
- **Aegean (0xC0-0xFF)**: Exponent (19 bits)  
- **BOM (NULL 0x00 or DEL 0x7F)**: Sign bit + 4 channels × 16-bit frame control

This is Layer 6 (Presentation) - the encoding/translation layer.

## IEEE 754 binary256 Layout

```
Sign:      1 bit
Exponent: 19 bits (bias: 262143)
Significand: 236 bits (implicit leading 1)

Total: 256 bits (32 bytes)
```

## Your OMI-Lisp Encoding

```
slot 0: BOM/sign (0x00 NULL or 0x7F DEL)
slot 1: channel control (4 × 4-bit channels)
slot 2: exponent high (8 bits of 19)
slot 3: exponent low (11 bits of 19)
slot 4-7: reserved for control plane
slot 8-39: significand (236 bits = 32 bytes of Braille)
```

## Lookup Table Structure

```lisp
;; Braile (0x80-0xBF) = 64 values = 6 bits per cell
;; Aegean (0xC0-0xFF) = 64 values = 6 bits per cell
;;
;; Need full 236-bit significand = ceil(236/6) = 40 Braille cells
;; Need full 19-bit exponent = ceil(19/6) = 4 Aegean cells

(defconstant +braille-range+ (range 128 192))  ; 0x80-0xBF
(defconstant +aegean-range+  (range 192 256))  ; 0xC0-0xFF
(defconstant +bom-sign+    '(#x00 #x7F))          ; NULL or DEL
```

## Implementation Files to Create

### 1. octuple-table.lisp - Lookup tables

```lisp
;; -*- lexical-binding: t -*-
;;; Octuple precision lookup tables for OMI-lisp

;;; Braille to bits (6-bit cells)
(defconst omi-braille-to-bits
  (let ((table (make-vector 64 nil)))
    (dotimes (i 64)
      (aset table i (logior (ash (mod i 16) 0)
                           (ash (ash (mod i 16) 4) 4)
                           (ash (ash (mod i 16) 8) 8)
                           (ash (ash (mod i 16) 12) 12)
                           (ash (ash (mod i 16) 16) 16)
                           (ash (ash (mod i 16) 20) 20)
                           (ash (ash (mod i 16) 24) 24)
                           (ash (ash (mod i 16) 28) 28)
                           (ash (ash (mod i 16) 32) 32)
                           (ash (ash (mod i 16) 36) 36)
                           (ash (ash (mod i 16) 40) 40))))
    table))

;;; Aegean to exponent bits
(defconst omi-aegean-to-exp-bits
  (let ((table (make-vector 64 nil)))
    (dotimes (i 64)
      (aset table i (+ i 64)))  ; offset for exponent
    table))

;;; BOM to sign channel
(defconst omi-bom-sign
  '((#x00 . +1)   ; NULL = positive
    (#x7F . -1))) ; DEL = negative
```

### 2. octuple encode/decode

```lisp
(defun omi-encode-octuple (significand exponent sign)
  "Encode 236-bit significand + 19-bit exponent → 256-bit OMI format"
  (let ((result (make-vector 40 :fill-pointer 0)))
    ;; Slot 0: BOM sign
    (vector-push (if (plusp sign) #x00 #x7F) result)
    ;; Slot 1-3: exponent (19 bits)
    (vector-push (logand #xFF (ash exponent -11)) result)
    (vector-push (logand #xFF exponent) result)
    ;; Slot 4-39: significand as Braille cells
    (dotimes (i 40)
      (vector-push (+ #x80 (logand #x3F (ash significand (* i -6)))) result))
    result))

(defun omi-decode-octuple (omi-bytes)
  "Decode 40-byte OMI format → (significand exponent sign)"
  (let ((bom (aref omi-bytes 0))
        (exp-h (aref omi-bytes 1))
        (exp-l (aref omi-bytes 2))
        (sign (cond ((= bom #x00) +1) ((= bom #x7F) -1) (t 0))))
    (list
     (ash (logior exp-h (ash exp-l 8)) 0)  ; exponent
     sign)))
```

## Character Set Mapping

### Braille Plane (0x80-0xBF)

| Byte | Name | Binary | Use |
|------|------|--------|-----|
| 0x80 | ⠀ | 10000000 | significand bit 0 |
| 0x81 | ⠁ | 10000001 | significand bit 1 |
| ... | ... | ... | ... |
| 0xBF | ⠿ | 10111111 | significand bit 63 |

### Aegean Plane (0xC0-0xFF)

| Byte | Name | Binary | Use |
|------|------|--------|-----|
| 0xC0 | ⠈ | 11000000 | exponent bit 0 |
| 0xC1 | ⠉ | 11000001 | exponent bit 1 |
| ... | ... | ... | ... |
| 0xFF | ⠿ | 11111111 | exponent bit 63 |

## QEMU Remote Setup for Development

Since you're doing this yourself, set up remote translation:

### 1. QEMU with GDB Remote Debugging

```sh
# Start QEMU with GDB stub on port 1234
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -nographic \
  -gdb tcp::1234 \
  -S \
  -kernel vmlinuz \
  -initrd initramfs.cpio \
  -append "console=ttyS0"
```

### 2. Connect with GDB

```sh
# In another terminal
riscv64-linux-gnu-gdb vmlinuz
(gdb) target remote localhost:1234
```

### 3. Or use QEMU Monitor

```sh
# QEMU monitor socket
qemu-system-riscv64 \
  -monitor unix:/tmp/qemu-monitor.sock,server,nowait \
  ...

# Connect
socat - /tmp/qemu-monitor.sock
```

## ACPI BIOS GED Interface (Generic Event Device)

Your 4 channels × 16-bit frame control mirrors ACPI GED:

```
GED event types:
- GPIO interrupt (your channel 0)
- PCI power management (channel 1)
- USB wake (channel 2)  
- OEM specific (channel 3)

Each channel = 16 bits = 65536 possible values
4 channels × 16 bits = 64K frame control space
```

## Complete Workflow

1. **Build Environment**
```sh
guix shell --manifest=omi-dev-manifest.scm
```

2. **Create Lookup Tables** (dev-docs/06-presentation/)
- `octuple-braille-table.lisp`
- `octuple-aegean-table.lisp`  
- `octuple-bom-table.lisp`

3. **Encode in OMI-Lisp**
```lisp
(load "octuple-braille-table.lisp")
(load "octuple-aegean-table.lisp")
(load "octuple-bom-table.lisp")

(setq result (omi-encode-octuple significand exponent sign))
```

4. **Cross-compile to RISC-V**
```sh
riscv64-linux-gnu-gcc -std=c99 -O2 -static omi_riscv_vm.c -o init
```

5. **Test in QEMU**
```sh
./build_omi_riscv.sh
./build-riscv/run-omi-riscv-vm.sh
```

## Reference

- IEEE 754 binary256: https://ieeexplore.ieee.org/document/5995255
- QEMU TCG: https://www.qemu.org/docs/master/devel/tcg.html
- ACPI GED: https://uefi.org/specs/acpi-6.5