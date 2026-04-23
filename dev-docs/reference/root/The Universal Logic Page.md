# The Universal Logic Page

## 1. Primitive Law

```c
rotl(x,1) ^ rotl(x,3) ^ rotr(x,2) ^ C
```

This is the atomic kernel.

It contains the only primitive choices:

* rotation
* XOR
* constant injection
* bounded width

That is the whole engine.

Everything else is derived.

---

## 2. What the System Is

The system is a meta-circular slide rule.

It has:

* a function
* a sequence
* a bounded state
* a readout surface

It does not require semantic invention at each layer.
It only requires lawful projection.

---

## 3. First Derivations

From the primitive law come the first numerical witnesses:

* period
* orbit
* residue
* offset
* reconciliation
* closure

For the current 16-bit study:

* period = 8
* prime = 73
* block = [0,1,3,6,9,8,6,3]
* weight = 36
* offset recovery = `divmod(position, 36)`

These are discovered, not chosen.

---

## 4. Structural Orders

The kernel unfolds into four structural orders:

### CH0 — Possibility

Binary field.

### CH1 — Incidence

7!, 15 depth, 60 surface.

### CH2 — Projection

240-frame address, 256 observer window.

### CH3 — Sign

Chirality / BOM polarity.

### Closure

`MASTER_PERIOD = 5040`

These are the machine body.

---

## 5. Symbol Substrates

There are only three constitutional symbol substrates:

### ASCII (1977/1986)

> Control, transport, ordering, separators.


0	1	2	3	4	5	6	7	8	9	A	B	C	D	E	F
0x	NUL	SOH	STX	ETX	EOT	ENQ	ACK	BEL BS HT LF VT FF CR SO  SI 
1x	DLE	DC1	DC2	DC3	DC4	NAK	SYN	ETB	CAN EM SUB ESC FS GS RS US 
2x	 SP 	!	"	#	$	%	&	'	(	)	*	+	,	-	.	/
3x	0	1	2	3	4	5	6	7	8	9	:	;	<	=	>	?
4x	@	A	B	C	D	E	F	G	H	I	J	K	L	M	N	O
5x	P	Q	R	S	T	U	V	W	X	Y	Z	[	\	]	^	_
6x	`	a	b	c	d	e	f	g	h	i	j	k	l	m	n	o
7x	p	q	r	s	t	u	v	w	x	y	z	{	|	}	~	DEL
> Changed or added in 1963 version
> Changed in both 1963 version and 1965 draft



### Braille

Dense state surface, occupancy witness, local bit visibility.

> Official Unicode Consortium code chart (PDF)

 	0	1	2	3	4	5	6	7	8	9	A	B	C	D	E	F
U+280x	⠀	⠁	⠂	⠃	⠄	⠅	⠆	⠇	⠈	⠉	⠊	⠋	⠌	⠍	⠎	⠏
U+281x	⠐	⠑	⠒	⠓	⠔	⠕	⠖	⠗	⠘	⠙	⠚	⠛	⠜	⠝	⠞	⠟
U+282x	⠠	⠡	⠢	⠣	⠤	⠥	⠦	⠧	⠨	⠩	⠪	⠫	⠬	⠭	⠮	⠯
U+283x	⠰	⠱	⠲	⠳	⠴	⠵	⠶	⠷	⠸	⠹	⠺	⠻	⠼	⠽	⠾	⠿
> (end of 6-dot cell patterns)

U+284x	⡀	⡁	⡂	⡃	⡄	⡅	⡆	⡇	⡈	⡉	⡊	⡋	⡌	⡍	⡎	⡏
U+285x	⡐	⡑	⡒	⡓	⡔	⡕	⡖	⡗	⡘	⡙	⡚	⡛	⡜	⡝	⡞	⡟
U+286x	⡠	⡡	⡢	⡣	⡤	⡥	⡦	⡧	⡨	⡩	⡪	⡫	⡬	⡭	⡮	⡯
U+287x	⡰	⡱	⡲	⡳	⡴	⡵	⡶	⡷	⡸	⡹	⡺	⡻	⡼	⡽	⡾	⡿
U+288x	⢀	⢁	⢂	⢃	⢄	⢅	⢆	⢇	⢈	⢉	⢊	⢋	⢌	⢍	⢎	⢏
U+289x	⢐	⢑	⢒	⢓	⢔	⢕	⢖	⢗	⢘	⢙	⢚	⢛	⢜	⢝	⢞	⢟
U+28Ax	⢠	⢡	⢢	⢣	⢤	⢥	⢦	⢧	⢨	⢩	⢪	⢫	⢬	⢭	⢮	⢯
U+28Bx	⢰	⢱	⢲	⢳	⢴	⢵	⢶	⢷	⢸	⢹	⢺	⢻	⢼	⢽	⢾	⢿
U+28Cx	⣀	⣁	⣂	⣃	⣄	⣅	⣆	⣇	⣈	⣉	⣊	⣋	⣌	⣍	⣎	⣏
U+28Dx	⣐	⣑	⣒	⣓	⣔	⣕	⣖	⣗	⣘	⣙	⣚	⣛	⣜	⣝	⣞	⣟
U+28Ex	⣠	⣡	⣢	⣣	⣤	⣥	⣦	⣧	⣨	⣩	⣪	⣫	⣬	⣭	⣮	⣯
U+28Fx	⣰	⣱	⣲	⣳	⣴	⣵	⣶	⣷	⣸	⣹	⣺	⣻	⣼	⣽	⣾	⣿
> Notes
> 1.^ As of Unicode version 17.0

### Aegean Numbers

Virtual address witness, ordinal symbolic indexing.

> Official Unicode Consortium code chart (PDF)

 	0	1	2	3	4	5	6	7	8	9	A	B	C	D	E	F
U+1010x	𐄀	𐄁	𐄂					𐄇	𐄈	𐄉	𐄊	𐄋	𐄌	𐄍	𐄎	𐄏
U+1011x	𐄐	𐄑	𐄒	𐄓	𐄔	𐄕	𐄖	𐄗	𐄘	𐄙	𐄚	𐄛	𐄜	𐄝	𐄞	𐄟
U+1012x	𐄠	𐄡	𐄢	𐄣	𐄤	𐄥	𐄦	𐄧	𐄨	𐄩	𐄪	𐄫	𐄬	𐄭	𐄮	𐄯
U+1013x	𐄰	𐄱	𐄲	𐄳				
> Notes
> 1.^ As of Unicode version 17.0
> 2.^ Grey areas indicate non-assigned code points


Everything else is syntactic sugar or downstream projection.

---

## 6. Constitutional Rule

If a structure cannot be derived from:

* the primitive law,
* the structural orders,
* and the three symbol substrates,

then it is not foundational.

It may be useful.
It is not constitutional.

---

## 7. Minimal Machine

The whole protocol reduces to:

* four binary streams
* one kernel function
* one initial type
* one sequence
* one bounded width
* one readout rule

Nothing else is required in principle.

Not OpenGL.
Not WebGL.
Not NDJSON.
Not SVG.
Not a computer.

Those are only conveniences for projection.

---

## 8. Human Readout Surfaces

There are only a few necessary readout surfaces:

### Truth table

Exhaustive law.

### Karnaugh torus

Adjacency and simplification law.

### Gate composition

Mechanism law.

### Propagation circuit

Scaled mechanism law.

The carry-lookahead diagram is a propagation witness; the Karnaugh torus is an adjacency witness 

These are not new semantics.
They are different readings of the same object.

---

## 9. The Full Stack

```text
function
-> sequence
-> bounded state
-> structural order
-> symbolic address
-> witness surface
-> human reading
```

Or even shorter:

```text
law
-> order
-> address
-> witness
-> reading
```

---

## 10. Final Statement

The protocol is not a pile of formats.

It is one bounded reversible law,
read through three symbol substrates,
across four binary streams,
with many possible witness surfaces.

Everything else is sugar.

---

## 11. Disk Chain Naming Law

Canonical 4-layer disk-chain naming is:

```text
[FS] <-- [GS] <-- [RS] <-- [US]
```

Rules:

- `FS` is the base image.
- `GS` and `RS` are overlay deltas over their backing images.
- `US` is the active/live write target.
- Live QEMU always points to the rightmost layer (`US`).
- Each file is a delta from its backing file, not a full point-in-time payload by itself.

Naming law:

```text
A disk-chain filename names a structural layer, not a complete point-in-time state.
The realized state at any layer is the cumulative resolution of that layer and its backing chain.
```

### Time-State Semantics

- Snapshot at `GS` creation is contained in: `FS`
- Snapshot at `RS` creation is contained in: `FS + GS`
- Snapshot at `US` creation is contained in: `FS + GS + RS`
- Live state is contained in: `FS + GS + RS + US`

Naming warning:

```text
Creation filename does not equal full state at creation time.
```

Also:

```text
FS alone is both a layer and its own realized state.
GS, RS, and US are deltas, not standalone full states unless flattened.
```

### Canonical QMP Sequence

Node/file mapping:

- `node-FS -> fs.qcow2`
- `node-GS -> gs.qcow2`
- `node-RS -> rs.qcow2`
- `node-US -> us.qcow2`

Canonical overlay chain creation:

```text
(QEMU) blockdev-snapshot-sync node-name=node-FS snapshot-file=gs.qcow2 snapshot-node-name=node-GS format=qcow2
(QEMU) blockdev-snapshot-sync node-name=node-GS snapshot-file=rs.qcow2 snapshot-node-name=node-RS format=qcow2
(QEMU) blockdev-snapshot-sync node-name=node-RS snapshot-file=us.qcow2 snapshot-node-name=node-US format=qcow2
```

### Alias Table (Explanatory Only)

| Canonical Key | Alias Label |
|---|---|
| `FS` | ~ Position (foundational/base position layer) |
| `GS` | ~ Relation (first relational delta layer) |
| `RS` | ~ Group (grouped/rewrite layer) |
| `US` | ~ Order (active update/order layer) |

Aliases are explanatory labels for human reading only.
Canonical keys remain `FS/GS/RS/US`.

### Documentation Review Checklist

Every disk-chain write-up must satisfy:

1. Uses `FS/GS/RS/US` as primary stage keys.
2. Includes cumulative-state equations (`FS + ...`) for points in time.
3. States delta semantics (overlay file is a delta over backing file).
4. Does not treat filename creation time as full-state containment.

Negative example (invalid):

```text
"State at RS creation is in rs.qcow2."
```

Why invalid: that statement ignores cumulative backing layers (`FS + GS`).

### Relation Symbols

Use these relation symbols consistently across doctrine, contracts, and examples:

- `=` means identity/equality.
- `~` means correspondence/equivalence under mapping (not identity).
- `->` means derivation/transition/forward construction.
- `<-` means backing dependency in disk chains.
