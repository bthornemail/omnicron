# The Whole Code Base

## How It All Connects

The delta law walks the ladder. The ladder creates the OSI model. Each layer has implementation:

| OSI Layer | Implementation | Files |
|----------|-------------|-------|
| L1 Physical | RISC-V VM via QEMU | omi_riscv_vm.c |
| L2 Data Link | MAC frames | - |
| L3 Network | IP | - |
| L4 Transport | TCP/UDP | - |
| L5 Session | Auth | - |
| L6 Presentation | Braille/Aegean/BOM encoding | omi-braille-table.lisp, omi-aegean-table.lisp, omi-bom-table.lisp |
| L7 Application | omi-lisp kernel | omi_vm_loader.lisp |

## Octuple Encoding (Layer 6)

256-bit = Braille (significand) + Aegean (exponent) + BOM (sign + channels)

```
slot 0: BOM (0x00 NULL or 0x7F DEL)
slots 1-3: exponent
slots 4-7: channels
slots 8-39: significand (Braille cells)
```

## The Three BOM Delimiters

NULL (0x00), ESC (0x1B), POINTERS set

All from REFERENCES/POINTERS inversion.

## The Walk

byte → ladder rung → delta law → next state → OSI layer → implementation

## QEMU Runs The Physical

riscv64-linux-gnu-gcc compiles omi_riscv_vm.c → QEMU runs it → layers above connect