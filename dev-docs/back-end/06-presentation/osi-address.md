# OSI Addressing via Rotations

## The Rotations Address Into OSI Layers

rotl(x,1) → addresses Layer 1-2 (Physical + Data Link)
rotl(x,3) → addresses Layer 3-4 (Network + Transport)
rotr(x,2) → addresses Layer 5-6 (Session + Presentation)
xor C    → selects specific entry in that layer's LUT

## In Code

```c
// Address into OSI LUTs
uint32_t osi_address(uint32_t x) {
    uint32_t l1 = rotl(x, 1);  // Physical + Data Link
    uint32_t l2 = rotl(x, 3);  // Network + Transport  
    uint32_t l3 = rotr(x, 2);  // Session + Presentation
    return l1 ^ l2 ^ l3 ^ C;  // Full OSI address
}
```

## Layer Mapping

| Rotation | OSI Layers |
|----------|----------|
| rotl(x,1) | L1 Physical, L2 Data Link |
| rotl(x,3) | L3 Network, L4 Transport |
| rotr(x,2) | L5 Session, L6 Presentation |

Each rotation selects bits that address into that layer's LUT.