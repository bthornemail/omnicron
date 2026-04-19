# Numerical Constitution Reference
## Constitutional Numbers Implementation

This document maps the constitutional numbers to the OMNICRON system implementation.

---

## Possibility Order

| Number | Role | Implementation |
|--------|------|------------|
| 2 | Primordial distinction | `Bit`, boolean in `atomic_kernel.c` |
| 4 | Control grammar | `FS/GS/RS/US` plane in `decodeBEEtag` |
| 8 | Kernel cadence | `Word8` in `Codepoint40` |
| 16 | Operator reserve | `WIDTH=16` in `delta()` |
| 256 | Total possibility | `MASK=0xFF` in `atomic_kernel.c` |

### Implementation (atomic_kernel.c)
```c
#define WIDTH 16
#define MASK ((1 << WIDTH) - 1)  // 0xFFFF = 65535
```

---

## Incidence Order

| Number | Role | Implementation |
|--------|------|------------|
| 7 | Selector genus | `FANO_POINTS=7` in heartbeat |
| 15 | Local depth | `LANE_DEPTH=15` in logic window |
| 60 | Sexagesimal | `SLOT_SURFACE=60` in phase |
| 120 | Reconciliation | Checkpoint (future) |

### Implementation (omicron_heartbeat.c)
```c
#define FANO_POINTS 7
#define LANE_DEPTH 15  
#define SLOT_SURFACE 60
```

---

## Closure Order

| Number | Role | Implementation |
|--------|------|------------|
| 240 | Projective frame | Addr240 in `update_mirror` |
| 256 | Total state | Mirror offset `[0-63]` |
| 360 | Euclidean | Rotation (future) |
| 420 | Interference | `SYNC_INTERVAL=420` |
| 5040 | Total closure | `MASTER_PERIOD=5040` |

### Implementation (atomic_kernel.c)
```c
#define MASTER_PERIOD 5040       // 7! = 5040
#define SYNC_INTERVAL 420       // lcm(7,60)
```

---

## Non-Equivalence Laws

```c
// 240 is NOT 256 - they serve different roles
#define ADDR240_SPACE 240     // Active frames
#define TOTAL_BYTE 256       // Full possibility

// 240 is NOT 360  
#define DISCRETE_FRAMES 240   // Digital projection
#define CONTINUOUS_TURN 360  // Analog completion

// 420 is NOT 5040
#define FIRST_SYNC 420         // Local interference
#define TOTAL_CLOSURE 5040   // Universal return
```

---

## Dependency Chains

```
Possibility:  2 → 4 → 8 → 16 → 256
              ↓   ↓   ↓
            bit→nibble→byte→word

Incidence:    7 → 15 → 60 → 120
              ↓   ↓   ↓
             Fano→lane→slot→checkpoint

Closure:     (60×4)=240 → 360 → 420 → 5040
                               ↓
                      projection→turn→sync→home
```

---

## Polyform Mapping

| Polyform Type | Bits | Constitutional Match |
|-------------|------|---------------------|
| Basis (basis) | 4 | 4 (control grammar) |
| Degree | 4 | 16 ÷ 4 |
| Rank | 1 | 2 (binary) |
| Group | 4 | 16 - 12 |

---

## Usage in Kernel

```c
// Phase rotation - incidence order
state->phase = (state->phase + 1) % MASTER_PERIOD;  // 5040

// Chiral flip - possibility order  
if (phase % 2) bom = 0xFEFF; else bom = 0xFFFE;

// Logic window - incidence order
logic_window = phase % 15;  // 15 is local depth
```

---

## Verification Commands

```bash
# Verify heartbeat is cycling
gdb> print *state

# Verify mirror is updating
xxd /dev/shm/omicron_mirror

# Verify non-equivalence
python3 -c "print(240 != 256)"  # True
python3 -c "print(240 != 360)" # True  
python3 -c "print(420 != 5040)" # True
```