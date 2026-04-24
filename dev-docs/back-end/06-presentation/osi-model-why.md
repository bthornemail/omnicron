# OSI Model: Why It's Built This Way

## The Short Answer

Each layer only talks to the layer above and below it. This is called LAYERING.

Think of it like mail:

```
┌───────────────────────────────────────────────────────┐
│  YOU (Application Layer)                             │
│  "I want to send a message"                           │
│        ↓                                              │
│  ↓                                                ↓ │
│  PRESENTATION (Presentation Layer)                   │
│  "Put message in envelope, add stamp"                 │
│        ↓                                              │
│  ↓                                                ↓ │
│  SESSION (Session Layer)                              │
│  "Open connection, close connection"                  │
│        ↓                                              │
│  ↓                                                ↓ │
│  TRANSPORT (Transport Layer)                             │
│  "TCP vs UDP - reliable vs fast"                       │
│        ↓                                              │
│  ↓                                                ↓ │
│  NETWORK (Network Layer)                             │
│  "IP addresses - where to send"                      │
│        ↓                                              │
│  ↓                                                ↓ │
│  DATA LINK (Data Link Layer)                        │
│  "MAC addresses - which device on network"            │
│        ↓                                              │
│  ↓                                                ↓ │
│  PHYSICAL (Physical Layer)                           │
│  "Ethernet cable, wifi signal, electrical signals"    │
└───────────────────────────────────────────────────────┘
```

## Why It HAS to Be Layered

### Reason 1: You Can Replace One Layer Without Changing Others

Want to change from WiFi to Ethernet? Only the physical layer changes. Everything else stays the same.

### Reason 2: Each Layer Has ONE Job

- Application: "What the user wants"
- Presentation: "How to represent the data"
- Session: "When to start/stop talking"
- Transport: "How to get there reliably"
- Network: "Where to send it"
- Data Link: "Which device nearby"
- Physical: "Actual electrical signals"

### Reason 3: You Build From Bottom Up

You MUST build physical FIRST, then datalink, then network...

Your kernel does the same thing:

```
┌────────────────────────────────────────────────────┐
│  Layer 7: Application - YOUR omi-lisp kernel       │
│  (HTTP, monitor, whatever you write)                │
├────────────────────────────────────────────────────┤
│  Layer 6: Presentation - TCG/QEMU               │
│  (translates byte code → host code)                   │
├────────────────────────────────────────────────────┤
│  Layer 5: Session - Auth/TLS                     │
│  (authentication, state)                         │
├────────────────────────────────────────────────────┤
│  Layer 4: Transport - TCP/UDP                    │
│  (ports, reliability)                          │
├────────────────────────────────────────────────────┤
│  Layer 3: Network - IP                          │
│  (routing, addresses)                          │
├────────────────────────────────────────────────────┤
│  Layer 2: Data Link - MAC                       │
│  (frames, error detection)                     │
├────────────────────────────────────────────────────┤
│  Layer 1: Physical - RISC-V + QEMU              │
│  (actual hardware/emulation)                   │
└────────────────────────────────────────────────┘
```

## Why Each Layer Exists

### Layer 1: Physical

**What it does**: Moves actual bits.

**In your system**: QEMU emulates RISC-V CPU. The bits are electrical signals (or simulated).

**Why**: You can't do anything without a way to represent and move data.

### Layer 2: Data Link

**What it does**: Frames data with addresses (MAC), checks for errors.

**Why**: Physical layer sends bits, but they need to be grouped into frames with source/destination addresses.

### Layer 3: Network

**What it does**: IP addresses, routing.

**Why**: Data link only works on a single network segment. You need network-wide addresses to talk to OTHER networks.

### Layer 4: Transport

**What it does**: TCP (reliable) vs UDP (fast).

**Why**: Network doesn't guarantee delivery. TCP adds "did you get this?" checks.

### Layer 5: Session

**What it does**: Opens/closes connections, remembers who you are.

**Why**: Transport is stateless. Sessions add state - "this is a conversation, not random packets."

### Layer 6: Presentation

**What it does**: Encoding (your octuple precision!).

**Why**: Application sends data, but it needs to be encoded. Your Braille/Aegean encoding = presentation.

### Layer 7: Application

**What it does**: What the user actually wants (HTTP, your kernel code).

**Why**: This is the whole point!

## Your OMI-Lisp Model Structure

```
omi-lisp model (your code)
       ↓
   ┌─────────────────────────────────────────────┐
   │ Layer 7: omi-lisp kernel                     │
   │        YOUR APPLICATION CODE                 │
   ├─────────────────────────────────────────────┤
   │ Layer 6: Braille/Aegean/BOM encoding       │
   │        YOUR OCTUPLE PRECISION              │
   ├─────────────────────────────────────────────┤
   │ Layer 5: Session (auth check)               │
   ├─────────────────────────────────────────────┤
   │ Layer 4: Transport (TCP/UDP)             │
   ├─────────────────────────────────────────────┤
   │ Layer 3: Network (IP)                    │
   ├─────────────────────────────────────────────┤
   │ Layer 2: Data Link (MAC)                 │
   ├───��─────────────────────────────────────────┤
   │ Layer 1: Physical (RISC-V + QEMU)        │
   └─────────────────────────────────────────────┘
```

## The Presentation Layer (Layer 6) is YOU

Your octuple precision IS the presentation layer:

- **Braille** = how your data LOOKS (significand)
- **Aegean** = how BIG it is (exponent)
- **BOM** = positive or negative (sign)

This is encoding. That's the presentation layer's job.