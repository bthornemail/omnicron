# GED to ASCII Substrate Mapping

This contract maps the QEMU GED 32-bit selector field to an ASCII-first
substrate configuration stream.

## Input

GED selector (`uint32`), with active bits:

- bit `0`: memory hotplug
- bit `1`: system powerdown
- bit `2`: NVDIMM hotplug
- bit `3`: CPU hotplug

Reserved bits:

- bits `4..31` must be zero (fail-fast otherwise)

## Mapping

The generated stream is deterministic and row-aware:

1. `0x00..0x1F` unary pre-header control window
2. `0x20` (`SP`) structural activation marker
3. event tokens mapped in `0x20` row:
   - bit `0` -> `(` (`0x28`)
   - bit `1` -> `)` (`0x29`)
   - bit `2` -> `.` (`0x2E`)
   - bit `3` -> `/` (`0x2F`)
4. `0x30` row logic markers:
   - `0x30 + popcount(low4)` (ASCII event count digit)
   - `:` (`0x3A`)
   - `?` (`0x3F`)

This yields a minimal substrate tree spanning the first four ASCII rows.

## Runtime verification

Run:

```bash
make verify-ged-ascii-substrate
```

Checks:

- GED mask validation (including reserved bits fail-fast)
- deterministic stream build
- unary phase consumption (`0x00..0x1F`)
- transition into structural phase at index `32`
- required emit tokens for each vector
