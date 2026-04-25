# 06-presentation/

Presentation layer - encoding/translation + QEMU internals.

## START HERE (In This Order)

1. **[osi-model-why.md](./osi-model-why.md)** - why layers exist
2. **[how-it-connects.md](./how-it-connects.md)** - HOW EVERYTHING WORKS ⬅ MOST IMPORTANT
3. **[qemu-internals.md](./qemu-internals.md)** - detailed internals
4. **[hw-features-security.md](../01-physical/hw-features-security.md)** - RISC-V IOMMU/AIA, SPDM, VSC

## Your Octuple Precision (YOUR encoding!)

Your encoding IS the presentation layer:
- **Braille (0x80-0xBF)**: 236-bit significand
- **Aegean (0xC0-0xFF)**: 19-bit exponent
- **BOM (NULL/DEL)**: Sign + 4×16-bit channels

## Key Docs

- `osi-model-why.md` - why OSI is structured
- `how-it-connects.md` - HOW EVERYTHING WORKS ⬅ READ THIS FIRST
- `../../../docs/reference/logic/OMI_LISP_BOOT_TO_PRESENTATION.md` - boot substrate to rendering declaration path
- `qemu-internals.md` - detailed QEMU internals
- `jit-tracing.md` - trace TCG execution

## Related Reading

See [01-physical/hw-features-security.md](../01-physical/hw-features-security.md):
- RISC-V IOMMU - DMA protection for your kernel
- RISC-V AIA - interrupt handling
- VSC - power/wdt management
