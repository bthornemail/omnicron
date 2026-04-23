# OMICRON Constitutional Engine

## Quick Start

```bash
cd /root/omnicron/riscv-baremetal

# Option 1: Run with VirtIO + Shared Memory
./run_omicron.sh

# Option 2: Quick test with GDB
qemu-system-riscv64 -M virt \
  -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin \
  -kernel my_kernel.flat \
  -gdb tcp::1234 -S
# In another terminal:
gdb-multiarch -ex "target remote localhost:1234" \
  -ex "set \$pc=0x80200000" -ex "continue"
```

## File Structure

```
dev-docs/reference/root/ASCII_CONSTITUTIONAL_MACHINE.md  # Portable ASCII/C/Datalog/Scheme machine model
dev-docs/reference/root/CONSTITUTION.md                  # Numerical constitution reference

riscv-baremetal/
├── atomic_kernel.c       # Core kernel (6 Laws + Witness + Stars&Bars)
├── omicron_heartbeat.c  # Three Sequencing Functions
├── run_omicron.sh       # QEMU launcher with 4 VirtIO + Ivshmem
├── feed_channels.py     # Host → QEMU channel feeder
├── view_mirror.py      # Host-side mirror viewer
└── virtio.h / virtio_read.h

logic/
└── constitutional_stack.pl  # Prolog 7-layer logical stack

polyform/
└── src/Unified.hs       # Haskell polyform library
```

## Design Documents

- `dev-docs/reference/root/ASCII_CONSTITUTIONAL_MACHINE.md`: defines the portable constitutional stack as ASCII bytes -> kernel replay -> relational closure -> Scheme transformation -> human surfaces
- `dev-docs/reference/root/CONSTITUTION.md`: maps constitutional numbers and non-equivalence laws to the implementation
- `dev-docs/reference/riscv/ATOMIC_KERNEL_SPEC.md`: defines the six kernel laws and structural control-plane roles

## Numerical Constitution Mapping

| Order | Numbers | Implementation |
|-------|---------|---------------|
| Possibility | 2→4→8→16→256 | `WIDTH=16`, `MASK`, delta() |
| Incidence | 7→15→60→120 | `FANO=7`, `LANE=15`, `SLOT=60` |
| Closure | 240→256→360→420→5040 | Mirror, phase, 420-sync, 5040-master |

## Constitutional Numbers

- **2**: Bit distinction
- **4**: FS/GS/RS/US planes
- **7**: FANO points (selector)
- **15**: Lane depth (incidence)
- **60**: Slot surface (sexagesimal)
- **240**: Addr240 (projective frame)
- **256**: Total byte space
- **360**: Euclidean turn
- **420**: Interference cadence (lcm 7×60)
- **5040**: Master period (7! total closure)

## Verification Commands

```bash
# Verify heartbeat cycling
gdb> print om.phase           # Should increment each heartbeat
gdb> print om.bom            # Toggles 0xFFFE/0xFEFF on phase%2
gdb> print om.logic_window   # = phase % 15

# Verify mirror (from host)
xxd /dev/shm/omicron_mirror

# Watch mirror live
python3 view_mirror.py
```

## Canonicality Attestation

One-shot proof command:

```bash
make rebuild-all
```

Machine-readable attestation output:

- `logic/canonicality_attestation.ndjson`
- schema: `logic/canonicality_attestation.schema.json`

Canonicality verdict rule:

```text
canonicality = pass(rebuild-all) && deterministic_outputs && provenance_complete
```

CI merge gate:

- GitHub Actions workflow: `canonicality-rebuild-all`
- Required status check name: `rebuild-all`
- Required status check name: `verify-render-contract`
- CI publishes `logic/canonicality_attestation.ndjson` as a build artifact.

## Architecture

1. **Layer NULL**: Algebraic sanity (operator symmetry)
2. **Layer 0**: Root predicates (term/slot/root)
3. **Layer 1**: Claims (disjunctive datalog)
4. **Layer 2**: Proposals (ASP stable models)
5. **Layer 3**: Closure (CHR reduction)
6. **Layer 4**: Receipts (Prolog lowering)
7. **Layer 5**: Surfaces (Stars/Braille/Hexagram)

## The 6 Laws

1. **Δ Law**: rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
2. **Mixed Radix**: [7, 15, 60] coordinate space
3. **Projection**: interpret(project(v,b),b) = v
4. **Structural**: FS/GS/RS/US plane access
5. **Artifact**: Hash-based fingerprint verification
6. **Heartbeat**: Phase → Chiral → Logic rotation

---

*The machine witnesses by law.*
