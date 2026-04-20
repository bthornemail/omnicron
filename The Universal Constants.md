# The Universal Constants

## Atomic Kernel - Numerical Constitution
``` c
rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C
```
This is the primitive law.

- rotations (not shifts): no bit loss
- XOR: reversible composition
- constant `C`: breaks the zero fixed point
- width mask: bounded state space

Everything downstream is derived, not declared:

- Period = 8 (for this law on 16-bit space)
- Prime 73 = smallest prime with decimal period 8
- `B = [0,1,3,6,9,8,6,3]` = digits of `1/73`
- `W = 36` = `sum(B)`
- orbit/offset recovery = `divmod(position, 36)`

Nobody selected 73 by preference; it is discovered by the law.

## Constitutional Derivation Order

```text
primitive_law -> canonical_terms -> addressing -> coreform -> witness_surfaces
```

Normative rule:

- Coreform authority MUST come from canonical terms.
- NDJSON/SVG/render packets/WebGL/OpenGL are witness/projection surfaces only.
- Serialization MUST NOT define structure.


## Derived Constants (from Atomic Kernel)

### Possibility Order
- CH0_BINARY: channels 0-15 → 2·4·8·16·256 bit field

### Incidence Order  
- CH1_DECIMAL: 7! cycle position, 15 lane depth, 60 slot surface

### Projection Order
- CH2_HEX: 240-frame address, 256 observer window
- CH3_SIGN: BOM chirality (FFFE/FEFF)

### Closure
- MASTER_PERIOD = 5040 (LCM of 7 and 60)


---

## Symbolic Substrates (Only 3 Unicode Blocks)

Foundational symbolic substrates:

- ASCII
- Braille Patterns
- Aegean Numbers

Everything else is syntactic sugar layered above these substrates.

### ASCII (1977/1986)
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

---

### Braille Patterns
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

## Aegean Numbers
> Official Unicode Consortium code chart (PDF)

 	0	1	2	3	4	5	6	7	8	9	A	B	C	D	E	F
U+1010x	𐄀	𐄁	𐄂					𐄇	𐄈	𐄉	𐄊	𐄋	𐄌	𐄍	𐄎	𐄏
U+1011x	𐄐	𐄑	𐄒	𐄓	𐄔	𐄕	𐄖	𐄗	𐄘	𐄙	𐄚	𐄛	𐄜	𐄝	𐄞	𐄟
U+1012x	𐄠	𐄡	𐄢	𐄣	𐄤	𐄥	𐄦	𐄧	𐄨	𐄩	𐄪	𐄫	𐄬	𐄭	𐄮	𐄯
U+1013x	𐄰	𐄱	𐄲	𐄳				
> Notes
> 1.^ As of Unicode version 17.0
> 2.^ Grey areas indicate non-assigned code points
