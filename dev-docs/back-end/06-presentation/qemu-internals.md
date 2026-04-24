# QEMU Internals: Decodetree, TCG, and Object Model

## Decodetree

Decodetree is how QEMU reads instructions. It matches patterns:

```
Pattern:
  fixedbits + fixedmask = what makes this instruction unique

Example for RISC-V add:
  fixedbits = 0b0000000_00000_00000_000_00000_0110011
  fixedmask = 0b1111111_00000_00000_000_00000_1111111
  
  If (instruction & fixedmask) == fixedbits
  Then this is an add instruction
```

### How Decodetree Works

```python
# Pseudo-code for decodetree
def decode_instruction(bits):
    for pattern in patterns:
        if (bits & pattern.mask) == pattern.bits:
            fields = extract_fields(bits, pattern.fields)
            return translate(pattern, fields)
```

### Fields in Instructions

Instructions have fields extracted and passed to translator:

```c
// Example: R-type RISC-V instruction
// 31      25 24 20 19 15 14 12 11     7 6      0
//  rs2     rs1  rd  funct3  shamt   opcode
// imm[11:0] rs1  rd  funct3  imm[11:0] opcode

// Extract these fields and pass to translator
translate_rd_rs1_rs2(rd, rs1, rs2)
```

### Decodetree Example

```python
# Simple decodetree pattern
(add:    rs1, rs2  [opcode=0110011, funct3=000, funct7=0000000])
(sub:    rs1, rs2  [opcode=0110011, funct3=000, funct7=0100000])
(xori:   rs1, imm  [opcode=0010011, funct3=100])
(lw:     rd, offset(rs1)  [opcode=0000011, funct3=010])
```

## TCG (Tiny Code Generator)

TCG is QEMU's JIT compiler. It translates guest code to host code.

### TCG Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Guest Code (RISC-V)                                          │
│  ┌─────────────┐                                            │
│  │ add  a0,a0,1│                                            │
│  └─────────────┘                                            │
│           ↓                                                  │
│  Decodetree extracts fields                                  │
│           ↓                                                  │
│  Translator converts to TCG ops                              │
│           ↓                                                  │
│  ┌─────────────────────────────────────────────┐            │
│  │  TCG Intermediate Representation (IR)       │            │
│  │                                             │            │
│  │  movi_i32 tmp0, 1                          │            │
│  │  add_i32 tmp1, a0, tmp0                    │            │
│  │  mov_i32 a0, tmp1                          │            │
│  └─────────────────────────────────────────────┘            │
│           ↓                                                  │
│  TCG Optimization                                            │
│           ↓                                                  │
│  ┌─────────────────────────────────────────────┐            │
│  │  Optimized TCG ops                          │            │
│  │                                             │            │
│  │  add_i32 a0, a0, 1                         │            │
│  └─────────────────────────────────────────────┘            │
│           ↓                                                  │
│  Code Generation (to host x86_64)                           │
│           ↓                                                  │
│  ┌─────────────────────────────────────────────┐            │
│  │  Host Machine Code                          │            │
│  │                                             │            │
│  │  add  rax, rax, 1                          │            │
│  └─────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### TCG Ops (Operations)

Common TCG ops:

| Op | Meaning | Example |
|----|---------|---------|
| `movi` | Move immediate | `movi_i32 tmp0, 5` |
| `mov` | Move register | `mov_i32 a0, tmp0` |
| `add` | Add | `add_i32 tmp0, a0, tmp1` |
| `sub` | Subtract | `sub_i32 tmp0, a0, tmp1` |
| `ld` | Load | `ld_i32 tmp0, a0, 0` |
| `st` | Store | `st_i32 tmp0, a0, 0` |
| `br` | Branch | `br label_123` |
| `jmp` | Jump | `jmp tmp0` |
| `call` | Call function | `call helper_func` |
| `exit_tb` | Exit translation block | `exit_tb 0` |

### TCG Types

- `i8`, `i16`, `i32`, `i64` - integers
- `i128` - 128-bit (for some operations)
- `ptr` - pointer (same as i64)
- `f32`, `f64` - floating point

### Translation Block (TB)

A Translation Block is a chunk of translated code:

```
┌──────────────────────────────────────────────────────────────┐
│  Translation Block (TB)                                      │
│                                                              │
│  Input: Guest PC at start of block                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Translated instructions...                             │ │
│  │                                                         │ │
│  │  IN:  add a0, a0, 1                                    │ │
│  │  IN:  bne a0, zero, loop                              │ │
│  │  IN:  ret                                             │ │
│  │                                                         │ │
│  │  OUT: add rax, rax, 1                                  │ │
│  │  OUT: cmp rax, 0                                       │ │
│  │  OUT: jne .Lloop                                       │ │
│  │  OUT: ret                                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  TB Epilogue: jumps to next TB or returns to main loop      │
└──────────────────────────────────────────────────────────────┘
```

### TB Chaining

Instead of returning to main loop, TBs can chain directly:

```
┌─────────────────────────────────────────────┐
│  TB1 (at 0x80000000)                        │
│  ...                                        │
│  add rax, rax, 1                            │
│  jmp .Lentry_TB2   ──────────────────────┐  │
└─────────────────────────────────────────────┘  │
                                               │
┌─────────────────────────────────────────────│─┘
│  TB2 (at 0x80000010)                        │
│  ...                                        │
│  cmp rax, 10                                │
│  jmp .Lentry_TB3                            │
└─────────────────────────────────────────────┘
```

First time: jumps to next TB, then patches jump slot.
Next time: directly jumps (fast!).

## QEMU Object Model (QOM)

QOM is QEMU's type system for devices.

### Key Concepts

- **Type**: A class of object (like a C++ class)
- **Object**: An instance of a type
- **Property**: Fields on an object
- **Interface**: Multiple inheritance for stateless interfaces

### Object Hierarchy

```
TYPE_OBJECT (root)
    │
    ├── TYPE_DEVICE
    │     ├── TYPE_CPU
    │     ├── TYPE_RISCV_CPU
    │     ├── TYPE_VIRTIO_DEVICE
    │     └── ...
    │
    ├── TYPE_MEMORY_REGION
    │     ├── TYPE_RAM_DEVICE
    │     └── ...
    │
    └── TYPE_BUS
```

### Creating a Device

```c
// Define type
static const TypeInfo my_device_type = {
    .name = "my-device",
    .parent = TYPE_DEVICE,
    .instance_size = sizeof(MyDeviceState),
    .instance_init = my_device_init,
    .class_init = my_device_class_init,
};

// Register
type_register(&my_device_type);
```

## Clock Tree

QEMU models hardware clocks as QOM objects.

### Clock Object

```c
// Create clock
Clock *clk = qemu_clock_new(DEVICE(obj), "my-clock");

// Set frequency
clock_set_hz(clk, 100000000);  // 100 MHz

// Get frequency
uint64_t hz = clock_get_hz(clk);

// Connect clocks
qdev_connect_clock_in(cpu, "clk", dev_clk);
```

### Why Clocks Matter

- Models real hardware clock distribution
- Detects PLL misconfiguration
- Handles clock domain crossing

## Memory

### Memory Regions

```c
// Create RAM
MemoryRegion *ram = g_malloc(sizeof(MemoryRegion));
memory_region_init_ram(ram, NULL, "my-ram", size, &error_fatal);

// Map into address space
memory_region_add_subregion(get_system_memory(), 0x80000000, ram);

// Read/write
memory_region_dispatch_read(ram, offset, &val, size, MEMTXATTRS_UNSPECIFIED);
memory_region_dispatch_write(ram, offset, val, size, MEMTXATTRS_UNSPECIFIED);
```

### Address Space

```
┌────────────────────────────────────────────────────────────┐
│  QEMU Address Space                                         │
│                                                            │
│  0x00000000 ┌────────────────┐                            │
│             │ Device Tree    │                            │
│  0x0xxxxxxx ├────────────────┤                            │
│             │                │                            │
│  0x80000000 │ RAM           │                            │
│             │                │                            │
│  0xC0000000 ├───────────────���┤                            │
│             │ PCI MMIO       │                            │
│  0x10000000 │ UART           │                            │
│             │                │                            │
│             │ virtio         │                            │
└─────────────┴────────────────┴────────────────────────────┘
```

## Atomics

For CPU-CPU communication:

```c
// Atomic operations
volatile uint32_t *counter;

uint32_t old = atomic_fetch_add(&counter, 1);  // Returns old value
bool swapped = atomic_compare_exchange(&counter, &old, new);

// Memory barriers
smp_mb();   // Full memory barrier
smp_wmb();  // Write barrier
smp_rmb();  // Read barrier

// Ordered stores
atomic_store_seq_cst(&ptr, new_ptr);  // Guarantees ordering
```

## Record/Replay

Record non-deterministic events for replay:

```c
// Recording
 replay_checkpoint(CHECKPOINT_CLOCK虚拟机));

// In QEMU:
// -record /path/to/log

// Replay
// -replay /path/to/log
```

## QMP (QEMU Machine Protocol)

Control QEMU from outside:

```json
// Connect to QEMU
{ "execute": "qmp_capabilities" }

{ "execute": "query-status" }
{ "return": { "running": true, "singlestep": false } }

{ "execute": "stop" }
{ "return": {} }

{ "execute": "cont" }
{ "return": {} }
```

## Summary

| Component | Purpose |
|-----------|---------|
| Decodetree | Parse instruction bit patterns |
| TCG | JIT compile guest code to host |
| TB | Translation block of compiled code |
| TB Chaining | Fast jump between TBs |
| QOM | Object system for devices |
| Clock | Model hardware clock distribution |
| Memory Regions | Map RAM/devices into address space |
| Atomics | Safe multithreaded access |
| Record/Replay | Deterministic replay |
| QMP | External control protocol |