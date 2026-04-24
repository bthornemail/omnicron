# QEMU Security, Hardware Features, and System Management

## SPDM (Security Protocols and Data Models)

### What is SPDM?

SPDM is a security protocol for managing secure boot, attestation, and firmware updates:

```
┌─────────────────────────────────────────────────────────────┐
│  SPDM Purpose                                               │
│                                                             │
│  1. Attestation: Prove VM is authentic                      │
│  2. Measured Boot: Verify software hasn't been tampered       │
│  3. Firmware Update: Securely update VM firmware            │
│  4. Key Exchange: Establish secure channels                │
│                                                             │
│  SPDM = Security Protocols and Data Models                  │
│  (DMTF standard, like IPMI but secure)                    │
└─────────────────────────────────────────────────────────────┘
```

### Why SPDM Matters

Traditional IPMI has no security. SPDM adds:

- **Authentication**: Prove who you are
- **Integrity**: Prove software hasn't changed
- **Confidentiality**: Encrypted communication
- **Non-repudiation**: Can't deny actions

### Setting Up SPDM Server

```sh
# Start SPDM server (requires authentication)
qemu-system-riscv64 \
  -spdm-firmware os.bin \
  -spdm-firmware-version 1.0 \
  -spdm-key-pair id:spdm_rsa2048,file=key.pem \
  -object spdm-key,id=sk0,file=private.key \
  -device spdm-device
```

### SPDM NVMe Device

Secure NVMe with SPDM:

```sh
# NVMe with SPDM
qemu-system-riscv64 \
  -drive file=secure_disk.qcow2,if=none,id=disk0 \
  -device spdm-nvme,drive=disk0 \
  -device nvme,drive=disk0,spdm=on
```

### SPDM Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  SPDM Session                                               │
│                                                             │
│  ┌──────────┐                      ┌──────────┐         │
│  │  Guest   │ ◄───────────────────► │  SPDM    │         │
│  │  (VM)   │   Challenge/Response │  Server  │         │
│  └──────────┘                      └──────────┘         │
│       │                                    │                │
│       │  1. Challenge sent              │                │
│       │  2. Signed response           │                │
│       │  3. Verify signature         │                │
│       │  4. Establish session       │                │
└─────────────────────────────────────────────────────────────┘
```

## Standard VGA

### What's in Standard VGA

```sh
# Standard VGA
qemu-system-riscv64 \
  -vga std \
  -display gtk
```

VGA provides:
- 256-color palette
- 640x480 to 1920x1080 resolutions
- Text mode console
- VESA BIOS extensions

### VGA Memory Layout

```
VGA Memory Map:
0xA0000 - 0xBFFFF (128KB): Video RAM
  - 0xA0000 - 0xAFFFF: Graphics mode (64KB)
  - 0xB0000 - 0xB7FFF: Monochrome text (32KB)
  - 0xB8000 - 0xBFFFF: Color text (32KB)
0xC0000 - 0xCFFFF: VGA BIOS
0xE0000 - 0xFFFFF: System BIOS
```

### VGA Registers

```c
// VGA register access
outb(0x3C0, index);  // Select register
outb(0x3C0, value); // Write value

// Key ports:
// 0x3C0 - 0x3C1: CRT index/data
// 0x3B4 - 0x3B5: Monochrome CRT
// 0x3D4 - 0x3D5: Color CRT
// 0x3DA: Status register
// 0x3CC: Miscellaneous output
```

## Virtual System Controller

### What is VSC?

VSC = Virtual System Controller - manages VM lifecycle:

```
┌─────────────────────────────────────────────────────────────┐
│  Virtual System Controller (VSC)                               │
│                                                             │
│  Functions:                                                │
│  - Power on/off/reset                                        │
│  - Boot control                                            │
│  - Watchdog                                               │
│  - Sensor data (temperature, voltage)                     │
│  - SEL (System Event Log)                                   │
│  - FRU (Field Replaceable Unit) info                     │
│                                                             │
│  Like IPMI but virtual                                      │
└─────────────────────────────────────────────────────────────┘
```

### Adding VSC to QEMU

```sh
qemu-system-riscv64 \
  -device vsc \
  -device vsc-sensor,temperature=45.0 \
  -device vsc-fru,serial=SN123,model="VM-001"
```

### VSC Commands

```python
# Via QMP
{"execute": "system_powerdown"}
{"execute": "system_reset"}
{"execute": "quit"}
```

### Watchdog

```sh
qemu-system-riscv64 \
  -watchdog-action inject-nmi
  # Actions: reset, poweroff, pause, shutdown, none, print
```

## VMCoreInfo Device

### What is VMCoreInfo?

VMCoreInfo provides crash dump information:

```
┌─────────────────────────────────────────────────────────────┐
│  VMCoreInfo                                               │
│                                                             │
│  When VM crashes, VMCoreInfo provides:                     │
│  - crash timestamp                                        │
│  - CPU states                                            │
│  - register values                                       │
│  - memory contents                                      │
│  - device states                                       │
│                                                             │
│  Used for debugging kernel panics                          │
└─────────────────────────────────────────────────────────────┘
```

### Using VMCoreInfo

```sh
qemu-system-riscv64 \
  -device vmcoreinfo
```

### Getting Crash Info

```python
# Via QMP after crash
{"execute": "query-vmcoreinfo"}
```

## Virtual Machine Generation ID

### What is VMGID?

VMGID = Virtual Machine Generation ID:

```
┌─────────────────────────────────────────────────────────────┐
│  VM Generation ID                                          │
│                                                             │
│  Purpose: DetectVM rollbacks and clones                    │
│                                                             │
│  When:                                                 │
│  - VM is reverted to snapshot                           │
│  - VM is cloned                                        │
│  - VM is restored from backup                          │
│                                                             │
│  The ID changes so applications know they've changed  │
└─────────────────────────────────────────────────────────────┘
```

### Adding VMGID

```sh
qemu-system-riscv64 \
  -device vmgenid,id=vmgen0
```

### Detecting Changes

```c
// In guest, read VMGID
uint64_t vm_gen_id;
read(VMGENID_DEVICE, &vm_gen_id, sizeof(vm_gen_id));

// If vm_gen_id changed, VM was reset/cloned
```

## RAPL MSR Support

### What is RAPL?

RAPL = Running Average Power Limit:

```
┌─────────────────────────────────────────────────────────────┐
│  RAPL (Running Average Power Limit)                       │
│                                                             │
│  Purpose: Monitor and limit CPU/GPU power                 │
│                                                             │
│  Domains:                                                │
│  - PKG: Entire package                                    │
│  - PP0: CPU core                                         │
│  - PP1: GPU (if present)                                 │
│  - DRAM: Memory controller                                │
│                                                             │
│  MSR = Model Specific Registers                         │
└─────────────────────────────────────────────────────────────┘
```

### MSR Registers

MSRs are special CPU registers:

```c
// Read MSR
uint64_t msr_read(uint32_t msr_id) {
    uint32_t edx, eax;
    asm volatile("rdmsr" : "=a"(eax), "=d"(edx) : "c"(msr_id));
    return (edx << 32) | eax;
}

// Write MSR
void msr_write(uint32_t msr_id, uint64_t value) {
    uint32_t eax = value & 0xFFFFFFFF;
    uint32_t edx = value >> 32;
    asm volatile("wrmsr" :: "a"(eax), "d"(edx), "c"(msr_id));
}
```

### Common MSRs

| MSR | Name | Description |
|-----|------|------------|
| 0x10 | IA32_DS_AREA | Debug Store Area |
| 0x1A0 | IA32_MISC_ENABLE | Miscellaneous Enable |
| 0xC0000100 | IA32_TSC | Time Stamp Counter |
| 0xE8 | IA32_APIC_BASE | Local APIC Base |

### RAPL in QEMU

```sh
qemu-system-riscv64 \
  -cpu host,rapl=on
```

### Power Monitoring

```python
{"execute": "query-power"}
{"return": {"pkg": 45.2, "pp0": 23.1, "dram": 8.5}}
```

## Rocker Network Switch

### What is Rocker?

Rocker = software switch emulator:

```
┌─────────────────────────────────────────────────────────────┐
│  Rocker Switch                                             │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  Guest  │───►│  Rocker  │───►│  Host    │             │
│  │  NIC 0  │    │  Switch  │    │  Network │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│       │                  │                                   │
│       │            ┌────┴────┐                             │
│       │            │Switch   │                              │
│       │            │  Ports  │                              │
│       │            │  VLANs  │                              │
│       │            │  ACLs   │                              │
│       │            └─────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

### Using Rocker

```sh
qemu-system-riscv64 \
  -device rocker,id=sw0,ports=4
```

### Switch Features

| Feature | Description |
|--------|------------|
| VLAN | Virtual LANs |
| STP | Spanning Tree |
| ACLs | Access Control Lists |
| Mirror | Port mirroring |
| Rate Limit | Bandwidth limits |

### Rocker Switch Programming

```c
// Example: Add port to VLAN
struct rocker_cmd cmd = {
    .cmd = ROCKER_CMD_PORT_VLAN_ADD,
    .port = 0,
    .vlan = 10,
    .vlan_mode = VLAN_TAGGED
};
rocker_send_cmd(&cmd);
```

## RISC-V IOMMU

### What is IOMMU?

IOMMU = Input-Output Memory Management Unit:

```
┌─────────────────────────────────────────────────────────────┐
│  IOMMU (Input-Output MMU)                                 │
│                                                             │
│  Without IOMMU:         │  With IOMMU:                     │
│  ┌──────────┐         │  ┌──────────┐                    │
│  │  Guest  │ DMA     │  │  Guest  │                    │
│  │  sees  │ ──────►│  │  only   │                    │
│  │  real  │         │  │  sees   │                    │
│  │  addrs │         │  │  IOVA   │                    │
│  └──────────┘         │  └──────────┘                    │
│                       │  ┌──────────┐                    │
│                       │  │  IOMMU   │                    │
│                       │  │  maps   │                    │
│                       │  │  IOVA → │                    │
│                       │  │  phys  │                    │
│                       │  └──────────┘                    │
│                       │  ┌──────────┐                    │
│                       │  │  Host   │                    │
│                       │  │  memory │                    │
│                       │  └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### IOMMU Functions

1. **Address Translation**: IOVA → Physical
2. **DMA Protection**: Block unauthorized access
3. **Interrupt Remapping**: Remap IRQ to guest
4. **ATS**: Address Translation Services (for PCI)

### RISC-V IOMMU

```sh
qemu-system-riscv64 \
  -device riscv-iommu,pci-addr=04.0
```

### IOMMU in Your Kernel

```c
// Setup DMA
void *dma_alloc(size_t size) {
    void *iovaddr;
    posix_memalign(&iovaddr, 4096, size);
    // Map via IOMMU
    return iovaddr;
}

void dma_sync(void *addr) {
    // Sync for DMA
    msync(addr, size, MS_SYNC);
}
```

## RISC-V AIA

### What is AIA?

AIA = Advanced Interrupt Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  RISC-V AIA (Advanced Interrupt Architecture)             │
│                                                             │
│  Features:                                                  │
│  - MSI (Message Signaled Interrupts)                      │
│  - APIC (Advanced PIC)                                    │
│  - ITS (Interrupt Translation Service)                  │
│  - Virtual Interrupts                                     │
│  - Priority/Subpriority                                  │
│                                                             │
│  For RISC-V:                                              │
│  - ACLINT (Advanced Core Local INTerruptor)              │
│  - PLIC (Platform Level Interrupt Controller)             │
│  - IMSIC (Incoming MSI Signal Capability)                 │
└─────────────────────────────────────────────────────────────┘
```

### AIA Components

```
┌─────────────────────────────────────────────────────────────┐
│  RISC-V Interrupt Stack                                    │
│                                                             │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐         │
│  │  CPU    │────►│  ACLINT  │────►│  PLIC    │──────► │
│  │ (HART) │     │  local   │     │  global  │  I/O   │
│  └──────────┘     └──────────┘     └──────────┘  devices│
│       │                  │                                │
│       │            ┌─────┴─────┐                         │
│       │            │  IMSIC   │◄── MSI                     │
│       │            │ for     │   (Message                 │
│       │            │ PCIe    │    Signaled               │
│       │            │ devices │    Interrupt)            │
│       │            └─────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### ACLINT (Advanced Core Local INTerruptor)

Per-HART local interrupt controller:

```
ACLINT registers:
- mip: Interrupt Pending
- mie: Interrupt Enable  
- mtimecmp: Timer Compare
- msip: Software Interrupt
```

### PLIC (Platform Level Interrupt Controller)

Global interrupt controller:

```
PLIC:
- Priority per interrupt (0-7)
- Threshold for HART
- Claim/Complete for handling
- Supports 127+ interrupt sources
```

### IMSIC (Incoming MSI Signal Capability)

For MSI-based devices (PCIe):

```sh
qemu-system-riscv64 \
  -device rv-imsic
```

### AIA in QEMU

```sh
qemu-system-riscv64 \
  -machine virt,aia=aplic
  # aia options: none, aplic, iam, aplic-n1
```

## ASPEED Interrupt Controller

### What is ASPEED?

ASPEED = Aspeed BMC controller (AST2600):

```
┌─────────────────────────────────────────────────────────────┐
│  ASPEED AST2600 BMC                                         │
│                                                             │
│  A BMC (Baseboard Management Controller) that handles:    │
│  - IPMI                                                       │
│  - KVM over IP                                              │
│  - Virtual media                                           │
│  - RTC                                                        │
│  - GPIO                                                     │
│  - Interrupt Controller                                    │
│                                                             │
│  Used in servers for out-of-band management                  │
└─────────────────────────────────────────────────────────────┘
```

### ASPEED in QEMU

```sh
qemu-system-riscv64 \
  -machine ast2600-evb \
  -device aspeed-scu,version=ast2600 \
  -device aspeed-wdt \
  -device aspeed-gpio
```

### ASPEED Features

| Feature | Description |
|---------|------------|
| SCU | System Control Unit (clock, reset) |
| WDT | Watchdog Timer |
| GPIO | General Purpose I/O |
| KCS | Keyboard Controller Style (IPMI) |
| MCT | MCTP Transport |

### BMC Firmware

```sh
# Load BMC firmware
qemu-system-riscv64 \
  -drive file=ast2600-bmc.fd,if=mtd,index=1
```

## IOMMU Test Device

### What is iommu-testdev?

A test device for IOMMU development:

```
┌─────────────────────────────────────────────────────────────┐
│  iommu-testdev                                            │
│                                                             │
│  Purpose: Test IOMMU functionality without real hardware   │
│                                                             │
│  Tests:                                                  │
│  - Address translation                                    │
│  - DMA from device                                       │
│  - Interrupt remapping                                   │
│  - ATS (Address Translation Services)                   │
└─────────────────────────────────────────────────────────────┘
```

### Using iommu-testdev

```sh
qemu-system-riscv64 \
  -device iommu-testdev
```

### Test Cases

```c
// Test 1: Simple DMA
iommu_test_dma(buffer, size, iova);

// Test 2: Bounce buffer
iommu_test_bounce(buffer, size, iova);

// Test 3: PASID (Process Address Space ID)
iommu_test_pasid(buffer, size, iova, pasid);
```

### Test Commands

```python
# Via QMP
{"execute": "iommu-testdev-test",
 "arguments": {"test": "translate"}}

{"execute": "iommu-testdev-test",
 "arguments": {"test": "dma"}}

{"execute": "iommu-testdev-test",
 "arguments": {"test": "intr-remap"}}
```

## Summary: How Everything Fits

### Your Kernel Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Your OMI-Lisp Kernel                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Virtual System Controller (VSC)                   │ │
│  │  - Power management                                │ │
│  │  - Watchdog                                       │ │
│  │  - Sensors                                       │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  RISC-V IOMMU                                     │ │
│  │  - DMA protection                                 │ │
│  │  - Address translation                           │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  RISC-V AIA                                       │ │
│  │  - ACLINT (timer, software)                      │ │
│  │  - PLIC (external interrupts)                    │ │
│  │  - IMSIC (MSI for PCIe)                         │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  VMCoreInfo (crash dumps)                        │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  VM Generation ID                               │ │
│  │  - Snapshot detection                         │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### QEMU Device Commands

| Device | Option | Purpose |
|--------|--------|---------|
| SPDM | `-device spdm-*` | Security |
| VGA | `-vga std` | Graphics |
| VSC | `-device vsc` | System control |
| VMGenID | `-device vmgenid` | VM generation |
| RAPL | `-cpu host,rapl=on` | Power monitoring |
| Rocker | `-device rocker` | Network switch |
| IOMMU | `-device riscv-iommu` | IOMMU |
| AIA | `-machine virt,aia=aplic` | Interrupts |
| ASPEED | `-machine ast2600-evb` | BMC |
| iommu-testdev | `-device iommu-testdev` | IOMMU testing |

### Why These Matter for You

1. **IOMMU** - Your kernel needs DMA protection
2. **AIA** - Your kernel needs interrupt handling
3. **VSC** - Your kernel needs power/wdt management
4. **SPDM** - Your kernel can be attested
5. **VMGID** - Your kernel knows when restored
6. **VMCoreInfo** - Crash dumps for debugging