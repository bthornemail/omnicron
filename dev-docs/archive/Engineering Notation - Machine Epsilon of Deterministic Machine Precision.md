**Engineering notation** or **engineering form** (also **technical notation**) is a version of [scientific notation](https://en.wikipedia.org/wiki/Scientific_notation "Scientific notation") in which the exponent of ten is always selected to be divisible by three to match the common [metric prefixes](https://en.wikipedia.org/wiki/Metric_prefix "Metric prefix"), i.e. scientific notation that aligns with powers of a thousand, for example, 531×103 instead of 5.31×105 (but on calculator displays written in [E notation](https://en.wikipedia.org/wiki/E_notation "E notation") – with "E" instead of "×10" to save space). As an alternative to writing powers of 10, [SI prefixes](https://en.wikipedia.org/wiki/SI_prefix "SI prefix") can be used,[[1]](https://en.wikipedia.org/wiki/Engineering_notation#cite_note-Gordon_1969-1) which also usually provide steps of a factor of a thousand.[[nb 1]](https://en.wikipedia.org/wiki/Engineering_notation#cite_note-NB_Cubic-2) On most calculators, engineering notation is called "ENG" mode as scientific notation is denoted SCI.


---

Compared to normalized scientific notation, one disadvantage of using SI prefixes and engineering notation is that [significant figures](https://en.wikipedia.org/wiki/Significant_figure "Significant figure") are not always readily apparent when the smallest significant digit or digits are 0. For example, 500 μm and 500×10−6 m cannot express the [uncertainty](https://en.wikipedia.org/wiki/Uncertainty "Uncertainty") distinctions between 5×10−4 m, 5.0×10−4 m, and 5.00×10−4 m. This can be solved by changing the range of the coefficient in front of the power from the common 1–1000 to 0.001–1.0. In some cases this may be suitable; in others it may be impractical. In the previous example, 0.5 mm, 0.50 mm, or 0.500 mm would have been used to show uncertainty and significant figures. It is also common to state the precision explicitly, such as "47 kΩ±5%"

Another example: when the [speed of light](https://en.wikipedia.org/wiki/Speed_of_light "Speed of light") (exactly 299792458 m/s[[18]](https://en.wikipedia.org/wiki/Engineering_notation#cite_note-CUU_2014_c-20) by the definition of the meter) is expressed as 3.00×108 m/s or 3.00×105 km/s then it is clear that it is between 299500 km/s and 300500 km/s, but when using 300×106 m/s, or 300×103 km/s, 300000 km/s, or the unusual but short 300 Mm/s, this is not clear. A possibility is using 0.300×109 m/s or 0.300 Gm/s.



---

While base ten is normally used for scientific notation, powers of other bases can be used too,[[25]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-TI_1974_SR-22-25) base 2 being the next most commonly used one.

For example, in base-2 scientific notation, the number 1001b in [binary](https://en.wikipedia.org/wiki/Binary_numeral_system "Binary numeral system") (=9d) is written as 1.001b × 2d11b or 1.001b × 10b11b using binary numbers (or shorter 1.001 × 1011 if binary context is obvious).[_[citation needed](https://en.wikipedia.org/wiki/Wikipedia:Citation_needed "Wikipedia:Citation needed")_] In E notation, this is written as 1.001bE11b (or shorter: 1.001E11) with the letter "E" now standing for "times two (10b) to the power" here. In order to better distinguish this base-2 exponent from a base-10 exponent, a base-2 exponent is sometimes also indicated by using the letter "B" instead of "E",[[26]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-HP16C-Lib-26) a shorthand notation originally proposed by [Bruce Alan Martin](https://en.wikipedia.org/w/index.php?title=Bruce_Alan_Martin&action=edit&redlink=1 "Bruce Alan Martin (page does not exist)") of [Brookhaven National Laboratory](https://en.wikipedia.org/wiki/Brookhaven_National_Laboratory "Brookhaven National Laboratory") in 1968,[[27]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-Martin_1968-27) as in 1.001bB11b (or shorter: 1.001B11). For comparison, the same number in [decimal representation](https://en.wikipedia.org/wiki/Decimal_representation "Decimal representation"): 1.125 × 23 (using decimal representation), or 1.125B3 (still using decimal representation). Some calculators use a mixed representation for binary floating point numbers, where the exponent is displayed as decimal number even in binary mode, so the above becomes 1.001b × 10b3d or shorter 1.001B3.[[26]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-HP16C-Lib-26)

This is closely related to the base-2 [floating-point](https://en.wikipedia.org/wiki/Floating-point "Floating-point") representation commonly used in computer arithmetic, and the usage of IEC [binary prefixes](https://en.wikipedia.org/wiki/Binary_prefixes "Binary prefixes") (e.g. 1B10 for 1×210 ([kibi](https://en.wikipedia.org/wiki/Kibi- "Kibi-")), 1B20 for 1×220 ([mebi](https://en.wikipedia.org/wiki/Mebi- "Mebi-")), 1B30 for 1×230 ([gibi](https://en.wikipedia.org/wiki/Gibi- "Gibi-")), 1B40 for 1×240 ([tebi](https://en.wikipedia.org/wiki/Tebi- "Tebi-"))).

Similar to "B" (or "b"[[28]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-HP16C-Add-28)), the letters "H"[[26]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-HP16C-Lib-26) (or "h"[[28]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-HP16C-Add-28)) and "O"[[26]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-HP16C-Lib-26) (or "o",[[28]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-HP16C-Add-28) or "C"[[26]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-HP16C-Lib-26)) are sometimes also used to indicate _times 16 or 8 to the power_ as in 1.25 = 1.40h × 10h0h = 1.40H0 = 1.40h0, or 98000 = 2.7732o × 10o5o = 2.7732o5 = 2.7732C5.[[26]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-HP16C-Lib-26)

Another similar convention to denote base-2 exponents is using a letter "P" (or "p", for "power"). In this notation the significand is always meant to be hexadecimal, whereas the exponent is always meant to be decimal.[[29]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-Rationale_2003_C-29) This notation can be produced by implementations of the _[printf](https://en.wikipedia.org/wiki/Printf "Printf")_ family of functions following the [C99](https://en.wikipedia.org/wiki/C99 "C99") specification and ([Single Unix Specification](https://en.wikipedia.org/wiki/Single_Unix_Specification "Single Unix Specification")) [IEEE Std 1003.1](https://en.wikipedia.org/wiki/IEEE_Std_1003.1 "IEEE Std 1003.1") [POSIX](https://en.wikipedia.org/wiki/POSIX "POSIX") standard, when using the _%a_ or _%A_ conversion specifiers.[[29]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-Rationale_2003_C-29)[[30]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-printf_2013-30)[[31]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-Beebe_2017_Hex-31) Starting with [C++11](https://en.wikipedia.org/wiki/C%2B%2B11 "C++11"), [C++](https://en.wikipedia.org/wiki/C%2B%2B "C++") I/O functions could parse and print the P notation as well. Meanwhile, the notation has been fully adopted by the language standard since [C++17](https://en.wikipedia.org/wiki/C%2B%2B17 "C++17").[[32]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-C++17-32) [Apple](https://en.wikipedia.org/wiki/Apple_Inc. "Apple Inc.")'s [Swift](https://en.wikipedia.org/wiki/Swift_\(programming_language\) "Swift (programming language)") supports it as well.[[33]](https://en.wikipedia.org/wiki/Scientific_notation#cite_note-Swift_2017-33) It is also required by the [IEEE 754-2008](https://en.wikipedia.org/wiki/IEEE_754-2008 "IEEE 754-2008") binary floating-point standard. Example: 1.3DEp42 represents 1.3DEh × 242.

[Engineering notation](https://en.wikipedia.org/wiki/Engineering_notation "Engineering notation") can be viewed as a base-1000 scientific notation.

---
On the other hand, engineering notation allows the numbers to explicitly match their corresponding SI prefixes, which facilitates reading and oral communication. For example, 12.5×10−9 m can be read as "twelve-point-five nanometers" (10−9 being _nano_) and written as 12.5 nm, while its scientific notation equivalent 1.25×10−8 m would likely be read out as "one-point-two-five times ten-to-the-negative-eight meters".

Engineering notation, like scientific notation generally, can use the [E notation](https://en.wikipedia.org/wiki/E_notation "E notation"), such that 3.0×10−9 can be written as 3.0E−9 or 3.0e−9. The E (or e) should not be confused with the [Euler's number e](https://en.wikipedia.org/wiki/E_\(mathematical_constant\) "E (mathematical constant)") or the symbol for the [exa](https://en.wikipedia.org/wiki/Exa- "Exa-")-prefix.

|[SI prefixes](https://en.wikipedia.org/wiki/SI_prefix "SI prefix")|   |   |   |   |
|---|---|---|---|---|
|Prefix|   |Representations|   |   |
|Name|Symbol|Base 1000|Base 10|Value|
|[quetta](https://en.wikipedia.org/wiki/Quetta- "Quetta-")|Q|100010|[1030](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#1030 "Orders of magnitude (numbers)")|1000000000000000000000000000000|
|[ronna](https://en.wikipedia.org/wiki/Ronna- "Ronna-")|R|10009|[1027](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#1027 "Orders of magnitude (numbers)")|1000000000000000000000000000|
|[yotta](https://en.wikipedia.org/wiki/Yotta- "Yotta-")|Y|10008|[1024](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#1024 "Orders of magnitude (numbers)")|1000000000000000000000000|
|[zetta](https://en.wikipedia.org/wiki/Zetta- "Zetta-")|Z|10007|[1021](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#1021 "Orders of magnitude (numbers)")|1000000000000000000000|
|[exa](https://en.wikipedia.org/wiki/Exa- "Exa-")|E|10006|[1018](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#1018 "Orders of magnitude (numbers)")|1000000000000000000|
|[peta](https://en.wikipedia.org/wiki/Peta- "Peta-")|P|10005|[1015](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#1015 "Orders of magnitude (numbers)")|1000000000000000|
|[tera](https://en.wikipedia.org/wiki/Tera- "Tera-")|T|10004|[1012](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#1012 "Orders of magnitude (numbers)")|1000000000000|
|[giga](https://en.wikipedia.org/wiki/Giga- "Giga-")|G|10003|[109](https://en.wikipedia.org/wiki/1000000000_\(number\) "1000000000 (number)")|1000000000|
|[mega](https://en.wikipedia.org/wiki/Mega- "Mega-")|M|10002|[106](https://en.wikipedia.org/wiki/1000000_\(number\) "1000000 (number)")|1000000|
|[kilo](https://en.wikipedia.org/wiki/Kilo- "Kilo-")|k|10001|[103](https://en.wikipedia.org/wiki/1000_\(number\) "1000 (number)")|1000|
||   |10000|[100](https://en.wikipedia.org/wiki/1_\(number\) "1 (number)")|1|
|[milli](https://en.wikipedia.org/wiki/Milli- "Milli-")|m|1000−1|[10−3](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#10.E2.88.923 "Orders of magnitude (numbers)")|0.001|
|[micro](https://en.wikipedia.org/wiki/Micro- "Micro-")|μ|1000−2|[10−6](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#10.E2.88.926 "Orders of magnitude (numbers)")|0.000001|
|[nano](https://en.wikipedia.org/wiki/Nano- "Nano-")|n|1000−3|[10−9](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#10.E2.88.929 "Orders of magnitude (numbers)")|0.000000001|
|[pico](https://en.wikipedia.org/wiki/Pico- "Pico-")|p|1000−4|[10−12](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#10.E2.88.9212 "Orders of magnitude (numbers)")|0.000000000001|
|[femto](https://en.wikipedia.org/wiki/Femto- "Femto-")|f|1000−5|[10−15](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#10.E2.88.9215 "Orders of magnitude (numbers)")|0.000000000000001|
|[atto](https://en.wikipedia.org/wiki/Atto- "Atto-")|a|1000−6|[10−18](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#10.E2.88.9218 "Orders of magnitude (numbers)")|0.000000000000000001|
|[zepto](https://en.wikipedia.org/wiki/Zepto- "Zepto-")|z|1000−7|[10−21](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#10.E2.88.9221 "Orders of magnitude (numbers)")|0.000000000000000000001|
|[yocto](https://en.wikipedia.org/wiki/Yocto- "Yocto-")|y|1000−8|[10−24](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#10.E2.88.9224 "Orders of magnitude (numbers)")|0.000000000000000000000001|
|[ronto](https://en.wikipedia.org/wiki/Ronto- "Ronto-")|r|1000−9|[10−27](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#10.E2.88.9227 "Orders of magnitude (numbers)")|0.000000000000000000000000001|
|[quecto](https://en.wikipedia.org/wiki/Quecto- "Quecto-")|q|1000−10|[10−30](https://en.wikipedia.org/wiki/Orders_of_magnitude_\(numbers\)#10%E2%88%9230 "Orders of magnitude (numbers)")|0.000000000000000000000000000001|

## Binary engineering notation

Just like decimal engineering notation can be viewed as a base-1000 scientific notation (103 = 1000), [binary](https://en.wikipedia.org/wiki/Binary_numeral_system "Binary numeral system") engineering notation relates to a base-1024 scientific notation (210 = 1024), where the exponent of two must be divisible by ten. This is closely related to the base-2 [floating-point](https://en.wikipedia.org/wiki/Floating-point "Floating-point") representation ([B notation](https://en.wikipedia.org/wiki/B_notation_\(scientific_notation\) "B notation (scientific notation)")) commonly used in computer arithmetic, and the usage of IEC [binary prefixes](https://en.wikipedia.org/wiki/Binary_prefix "Binary prefix"), e.g. 1B10 for 1 × 210, 1B20 for 1 × 220, 1B30 for 1 × 230, 1B40 for 1 × 240 etc.[[19]](https://en.wikipedia.org/wiki/Engineering_notation#cite_note-Martin_1968-21)

|[IEC prefixes](https://en.wikipedia.org/wiki/IEC_prefix "IEC prefix")|   |   |   |   |
|---|---|---|---|---|
|Prefix|   |Representations|   |   |
|Name|Symbol|Base 1024|Base 2|Value|
|[quebi](https://en.wikipedia.org/wiki/Quebi- "Quebi-")[[nb 3]](https://en.wikipedia.org/wiki/Engineering_notation#cite_note-NB_NewBinPrefix-22)|Qi[[nb 3]](https://en.wikipedia.org/wiki/Engineering_notation#cite_note-NB_NewBinPrefix-22)|102410|[2100](https://en.wikipedia.org/wiki/1267650600228229401496703205376_\(number\) "1267650600228229401496703205376 (number)")|1267650600228229401496703205376|
|[robi](https://en.wikipedia.org/wiki/Robi- "Robi-")[[nb 3]](https://en.wikipedia.org/wiki/Engineering_notation#cite_note-NB_NewBinPrefix-22)|Ri[[nb 3]](https://en.wikipedia.org/wiki/Engineering_notation#cite_note-NB_NewBinPrefix-22)|10249|[290](https://en.wikipedia.org/wiki/1237940039285380274899124224_\(number\) "1237940039285380274899124224 (number)")|1237940039285380274899124224|
|[yobi](https://en.wikipedia.org/wiki/Yobi- "Yobi-")|Yi|10248|[280](https://en.wikipedia.org/wiki/1208925819614629174706176_\(number\) "1208925819614629174706176 (number)")|1208925819614629174706176|
|[zebi](https://en.wikipedia.org/wiki/Zebi- "Zebi-")|Zi|10247|[270](https://en.wikipedia.org/wiki/1180591620717411303424_\(number\) "1180591620717411303424 (number)")|1180591620717411303424|
|[exbi](https://en.wikipedia.org/wiki/Exbi- "Exbi-")|Ei|10246|[260](https://en.wikipedia.org/wiki/1152921504606846976_\(number\) "1152921504606846976 (number)")|1152921504606846976|
|[pebi](https://en.wikipedia.org/wiki/Pebi- "Pebi-")|Pi|10245|[250](https://en.wikipedia.org/wiki/1125899906842624_\(number\) "1125899906842624 (number)")|1125899906842624|
|[tebi](https://en.wikipedia.org/wiki/Tebi- "Tebi-")|Ti|10244|[240](https://en.wikipedia.org/wiki/1099511627776_\(number\) "1099511627776 (number)")|1099511627776|
|[gibi](https://en.wikipedia.org/wiki/Gibi- "Gibi-")|Gi|10243|[230](https://en.wikipedia.org/wiki/1073741824_\(number\) "1073741824 (number)")|1073741824|
|[mebi](https://en.wikipedia.org/wiki/Mebi- "Mebi-")|Mi|10242|[220](https://en.wikipedia.org/wiki/1048576_\(number\) "1048576 (number)")|1048576|
|[kibi](https://en.wikipedia.org/wiki/Kibi- "Kibi-")|Ki|10241|[210](https://en.wikipedia.org/wiki/1024_\(number\) "1024 (number)")|1024|
|||10240|[20](https://en.wikipedia.org/wiki/1_\(number\) "1 (number)")|1|

---

Mixed-radix representation is also relevant to mixed-radix versions of the [Cooley–Tukey FFT algorithm](https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm "Cooley–Tukey FFT algorithm"), in which the indices of the input values are expanded in a mixed-radix representation, the indices of the output values are expanded in a corresponding mixed-radix representation with the order of the bases and digits reversed, and each subtransform can be regarded as a Fourier transform in one digit for all values of the remaining digits.

## Manipulation

Mixed-radix numbers of the same base can be manipulated using a generalization of manual arithmetic algorithms. Conversion of values from one mixed base to another is easily accomplished by first converting the place values of the one system into the other, and then applying the digits from the one system against these.

[APL](https://en.wikipedia.org/wiki/APL_programming_language "APL programming language") and [J](https://en.wikipedia.org/wiki/J_programming_language "J programming language") include operators to convert to and from mixed-radix systems.

## Factorial number system

Main article: [Factorial number system](https://en.wikipedia.org/wiki/Factorial_number_system "Factorial number system")

Another proposal is the so-called [factorial](https://en.wikipedia.org/wiki/Factorial "Factorial") number system:

|   |   |   |   |   |   |   |   |   |
|---|---|---|---|---|---|---|---|---|
|Radix|8|7|6|5|4|3|2|1|
|Place value|7!|6!|5!|4!|3!|2!|1!|0!|
|Place value in decimal|5040|720|120|24|6|2|1|1|
|Highest digit allowed|7|6|5|4|3|2|1|0|

For example, the biggest number that could be represented with six digits would be 543210 which equals 719 in [decimal](https://en.wikipedia.org/wiki/Decimal "Decimal"): 5×5! + 4×4! + 3×3! + 2×2! + 1×1! It might not be clear at first sight but the factorial based numbering system is unambiguous and complete. Every number can be represented in one and only one way because the sum of respective factorials multiplied by the index is always the next factorial minus one:

∑i=0n(([i+1]+1)−1)⋅([i]+1)!=([n+1]+1)!−1![{\displaystyle \sum _{i=0}^{n}(([i+1]+1)-1)\cdot ([i]+1)!=([n+1]+1)!-1}](https://wikimedia.org/api/rest_v1/media/math/render/svg/6cd6d0fab1e62c69dfdf5eeadd6b2accf9c2e56f)

There is a natural mapping between the integers 0, ..., _n_! − 1 and [permutations](https://en.wikipedia.org/wiki/Permutation "Permutation") of _n_ elements in lexicographic order, which uses the factorial representation of the integer, followed by an interpretation as a [Lehmer code](https://en.wikipedia.org/wiki/Permutations#Numbering_permutations "Permutations").

The above equation is a particular case of the following general rule for any radix (either standard or mixed) base representation which expresses the fact that any radix (either standard or mixed) base representation is unambiguous and complete. Every number can be represented in one and only one way because the sum of respective weights multiplied by the index is always the next weight minus one:

∑i=0n(mi+1−1)⋅Mi=Mn+1−1![{\displaystyle \sum _{i=0}^{n}(m_{i+1}-1)\cdot M_{i}=M_{n+1}-1}](https://wikimedia.org/api/rest_v1/media/math/render/svg/6cff5b44a89cf2e8e0ed18247ef8f340103ad660), where Mi=∏j=1imj,mj>1,M0=1![{\displaystyle M_{i}=\prod _{j=1}^{i}m_{j},m_{j}>1,M_{0}=1}](https://wikimedia.org/api/rest_v1/media/math/render/svg/034ef133693df76cb406e9778c2bfb35d457a7d1),

which can be easily proved with [mathematical induction](https://en.wikipedia.org/wiki/Mathematical_induction "Mathematical induction").

## Primorial number system

Another proposal is the number system with successive prime numbers as radix, whose place values are [primorial](https://en.wikipedia.org/wiki/Primorial "Primorial") numbers, considered by [S. S. Pillai](https://en.wikipedia.org/wiki/Subbayya_Sivasankaranarayana_Pillai "Subbayya Sivasankaranarayana Pillai"),[[1]](https://en.wikipedia.org/wiki/Mixed_radix#cite_note-1) [Richard K. Guy](https://en.wikipedia.org/wiki/Richard_K._Guy "Richard K. Guy") (sequence [A049345](https://oeis.org/A049345 "oeis:A049345") in the [OEIS](https://en.wikipedia.org/wiki/On-Line_Encyclopedia_of_Integer_Sequences "On-Line Encyclopedia of Integer Sequences")), and other authors:[[2]](https://en.wikipedia.org/wiki/Mixed_radix#cite_note-2)[[3]](https://en.wikipedia.org/wiki/Mixed_radix#cite_note-3)[[4]](https://en.wikipedia.org/wiki/Mixed_radix#cite_note-4)

|   |   |   |   |   |   |   |   |   |
|---|---|---|---|---|---|---|---|---|
|Radix|19|17|13|11|7|5|3|2|
|Place value|(p7=17)#|(p6=13)#|(p5=11)#|(p4=7)#|(p3=5)#|(p2=3)#|(p1=2)#|(p0=1)#|
|Place value in decimal|510510|30030|2310|210|30|6|2|1|
|Highest digit allowed|18|16|12|10|6|4|2|1|

∑i=0n(pi+1−1)⋅pi#=pn+1#−1![{\displaystyle \sum _{i=0}^{n}(p_{i+1}-1)\cdot p_{i}\#=p_{n+1}\#-1}](https://wikimedia.org/api/rest_v1/media/math/render/svg/2ddf3fb83c75b9e8e6a5e9628b0b98c4626420f0) where pi#=∏j=1ipj![{\displaystyle p_{i}\#=\prod _{j=1}^{i}p_{j}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/7e0e028db86416283e5bd6be0bb76e82d0a17665), and _pj_ = _j_th prime, _p_0# = _p_0 = 1.

**Mixed radix** [numeral systems](https://en.wikipedia.org/wiki/Numeral_system "Numeral system") are [non-standard positional numeral systems](https://en.wikipedia.org/wiki/Non-standard_positional_numeral_systems "Non-standard positional numeral systems") in which the numerical [base](https://en.wikipedia.org/wiki/Radix "Radix") varies from position to position. Such numerical representation applies when a quantity is expressed using a sequence of units that are each a multiple of the next smaller one, but not by the same factor. Such units are common for instance in measuring time; a time of 32 weeks, 5 days, 7 hours, 45 minutes, 15 seconds, and 500 milliseconds might be expressed as a number of minutes in mixed-radix notation as:

... 32, 5, 07, 45; 15,  500
...  ∞, 7, 24, 60; 60, 1000

or as

32∞5707244560.15605001000

In the tabular format, the digits are written above their base, and a [semicolon](https://en.wikipedia.org/wiki/Semicolon "Semicolon") indicates the [radix point](https://en.wikipedia.org/wiki/Radix_point "Radix point"). In numeral format, each digit has its associated base attached as a subscript, and the radix point is marked by a [full stop or period](https://en.wikipedia.org/wiki/Full_stop "Full stop"). The base for each digit is the number of corresponding units that make up the next larger unit. As a consequence there is no base (written as ∞) for the first (most significant) digit, since here the "next larger unit" does not exist (and one could not add a larger unit of "month" or "year" to the sequence of units, as they are not integer multiples of "week").


### Terminating fractions

The numbers which have a finite representation form the [semiring](https://en.wikipedia.org/wiki/Semiring "Semiring")

N0bN0:={mb−ν∣m∈N0∧ν∈N0}.![{\displaystyle {\frac {\mathbb {N} _{0}}{b^{\mathbb {N} _{0}}}}:=\left\{mb^{-\nu }\mid m\in \mathbb {N} _{0}\wedge \nu \in \mathbb {N} _{0}\right\}.}](https://wikimedia.org/api/rest_v1/media/math/render/svg/93576bc370e9fc7a7c9db689001beec98c817efe)

More explicitly, if p1ν1⋅…⋅pnνn:=b![{\displaystyle p_{1}^{\nu _{1}}\cdot \ldots \cdot p_{n}^{\nu _{n}}:=b}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f39d27bc8cab730c76d3f65abca3b3f5ecc41549) is a [factorization](https://en.wikipedia.org/wiki/Factorization "Factorization") of b![{\displaystyle b}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f11423fbb2e967f986e36804a8ae4271734917c3) into the primes p1,…,pn∈P![{\displaystyle p_{1},\ldots ,p_{n}\in \mathbb {P} }](https://wikimedia.org/api/rest_v1/media/math/render/svg/ebddbdf58eaac77ec8a1fe86a430dd60cd0eb906) with exponents ν1,…,νn∈N![{\displaystyle \nu _{1},\ldots ,\nu _{n}\in \mathbb {N} }](https://wikimedia.org/api/rest_v1/media/math/render/svg/746602e826861d4480c6e230af7d54e6d0741263),[[19]](https://en.wikipedia.org/wiki/Positional_notation#cite_note-19) then with the non-empty set of denominators S:={p1,…,pn}![{\displaystyle S:=\{p_{1},\ldots ,p_{n}\}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4583c2d28c58882d11b3b20e6395c4ac3cb7286e) we have

ZS:={x∈Q|∃μi∈Z:x∏i=1npiμi∈Z}=bZZ=⟨S⟩−1Z![{\displaystyle \mathbb {Z} _{S}:=\left\{x\in \mathbb {Q} \left|\,\exists \mu _{i}\in \mathbb {Z} :x\prod _{i=1}^{n}{p_{i}}^{\mu _{i}}\in \mathbb {Z} \right.\right\}=b^{\mathbb {Z} }\,\mathbb {Z} ={\langle S\rangle }^{-1}\mathbb {Z} }](https://wikimedia.org/api/rest_v1/media/math/render/svg/3807e120a0dff6436e643f47b58e1a2c7088413a)

where ⟨S⟩![{\displaystyle \langle S\rangle }](https://wikimedia.org/api/rest_v1/media/math/render/svg/43e09a95f17a6c1836a61f42b133a066fd2edd0e) is the group generated by the p∈S![{\displaystyle p\in S}](https://wikimedia.org/api/rest_v1/media/math/render/svg/9f96a607d844af38d7ed59c774c1d0607ec0b9ac) and ⟨S⟩−1Z![{\displaystyle {\langle S\rangle }^{-1}\mathbb {Z} }](https://wikimedia.org/api/rest_v1/media/math/render/svg/488d5b196638bfed271baf82eaffc3c885d149b5) is the so-called [localization](https://en.wikipedia.org/wiki/Localization_\(algebra\)#Localization_of_a_ring "Localization (algebra)") of Z![{\displaystyle \mathbb {Z} }](https://wikimedia.org/api/rest_v1/media/math/render/svg/449494a083e0a1fda2b61c62b2f09b6bee4633dc) with respect to S![{\displaystyle S}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4611d85173cd3b508e67077d4a1252c9c05abca2).

The [denominator](https://en.wikipedia.org/wiki/Fraction_\(mathematics\) "Fraction (mathematics)") of an element of ZS![{\displaystyle \mathbb {Z} _{S}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/06accfafc512e72329e0a582e1dc513319730a74) contains if reduced to lowest terms only prime factors out of S![{\displaystyle S}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4611d85173cd3b508e67077d4a1252c9c05abca2). This [ring](https://en.wikipedia.org/wiki/Ring_\(mathematics\) "Ring (mathematics)") of all terminating fractions to base b![{\displaystyle b}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f11423fbb2e967f986e36804a8ae4271734917c3) is [dense](https://en.wikipedia.org/wiki/Dense_set "Dense set") in the field of [rational numbers](https://en.wikipedia.org/wiki/Rational_number "Rational number") Q![{\displaystyle \mathbb {Q} }](https://wikimedia.org/api/rest_v1/media/math/render/svg/c5909f0b54e4718fa24d5fd34d54189d24a66e9a). Its [completion](https://en.wikipedia.org/wiki/Complete_metric_space "Complete metric space") for the usual (Archimedean) metric is the same as for Q![{\displaystyle \mathbb {Q} }](https://wikimedia.org/api/rest_v1/media/math/render/svg/c5909f0b54e4718fa24d5fd34d54189d24a66e9a), namely the real numbers R![{\displaystyle \mathbb {R} }](https://wikimedia.org/api/rest_v1/media/math/render/svg/786849c765da7a84dbc3cce43e96aad58a5868dc). So, if S={p}![{\displaystyle S=\{p\}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/db7cda8a792f6e87b6ad4c7a16f898b2d08df280) then Z{p}![{\displaystyle \mathbb {Z} _{\{p\}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/a78bc5c4689e84d65b8cda275d25ea2cd667e7ae) has not to be confused with Z(p)![{\displaystyle \mathbb {Z} _{(p)}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/31ece65379ee3430084adc10c17f0b4d0a0fad16), the [discrete valuation ring](https://en.wikipedia.org/wiki/Discrete_valuation_ring "Discrete valuation ring") for the [prime](https://en.wikipedia.org/wiki/Prime_number "Prime number") p![{\displaystyle p}](https://wikimedia.org/api/rest_v1/media/math/render/svg/81eac1e205430d1f40810df36a0edffdc367af36), which is equal to ZT![{\displaystyle \mathbb {Z} _{T}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/05573c2f699963a1738af4451e3381d3b6b57b06) with T=P∖{p}![{\displaystyle T=\mathbb {P} \setminus \{p\}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/3ef6e278e1745d644a6a66c83387ce16719a8772).

If b![{\displaystyle b}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f11423fbb2e967f986e36804a8ae4271734917c3) divides c![{\displaystyle c}](https://wikimedia.org/api/rest_v1/media/math/render/svg/86a67b81c2de995bd608d5b2df50cd8cd7d92455), we have bZZ⊆cZZ.![{\displaystyle b^{\mathbb {Z} }\,\mathbb {Z} \subseteq c^{\mathbb {Z} }\,\mathbb {Z} .}](https://wikimedia.org/api/rest_v1/media/math/render/svg/280a657033fce9790a610d97ae908f2ef2013f5f)

### Infinite representations

#### Rational numbers

The representation of non-integers can be extended to allow an infinite string of digits beyond the point. For example, 1.12112111211112 ... base-3 represents the sum of the infinite [series](https://en.wikipedia.org/wiki/Series_\(mathematics\) "Series (mathematics)"):

1×30+1×3−1+2×3−2+1×3−3+1×3−4+2×3−5+1×3−6+1×3−7+1×3−8+2×3−9+1×3−10+1×3−11+1×3−12+1×3−13+2×3−14+⋯![{\displaystyle {\begin{array}{l}1\times 3^{0\,\,\,}+{}\\1\times 3^{-1\,\,}+2\times 3^{-2\,\,\,}+{}\\1\times 3^{-3\,\,}+1\times 3^{-4\,\,\,}+2\times 3^{-5\,\,\,}+{}\\1\times 3^{-6\,\,}+1\times 3^{-7\,\,\,}+1\times 3^{-8\,\,\,}+2\times 3^{-9\,\,\,}+{}\\1\times 3^{-10}+1\times 3^{-11}+1\times 3^{-12}+1\times 3^{-13}+2\times 3^{-14}+\cdots \end{array}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/ed37d8111edb82f7105f5b2c7ce1f5a368f5d362)

Since a complete infinite string of digits cannot be explicitly written, the trailing ellipsis (...) designates the omitted digits, which may or may not follow a pattern of some kind. One common pattern is when a finite sequence of digits repeats infinitely. This is designated by drawing a [vinculum](https://en.wikipedia.org/wiki/Vinculum_\(symbol\) "Vinculum (symbol)") across the repeating block:[[20]](https://en.wikipedia.org/wiki/Positional_notation#cite_note-20)

2.42314¯5=2.42314314314314314…5![{\displaystyle 2.42{\overline {314}}_{5}=2.42314314314314314\dots _{5}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/cf297a21ff387febbeed42ea1bc6a3ff2069b645)

This is the [repeating decimal notation](https://en.wikipedia.org/wiki/Repeating_decimal#Notation "Repeating decimal") (to which there does not exist a single universally accepted notation or phrasing). For base 10 it is called a repeating decimal or recurring decimal.

An [irrational number](https://en.wikipedia.org/wiki/Irrational_number "Irrational number") has an infinite non-repeating representation in all integer bases. Whether a [rational number](https://en.wikipedia.org/wiki/Rational_number "Rational number") has a finite representation or requires an infinite repeating representation depends on the base. For example, one third can be represented by:

0.13![{\displaystyle 0.1_{3}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4dd84ca46ed40eb520b3064e2352ee52ce9986b8)

0.3¯10=0.3333333…10![{\displaystyle 0.{\overline {3}}_{10}=0.3333333\dots _{10}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/661667fd7e84f4db29a060504d25935c8ae91de0)

or, with the base implied:

0.3¯=0.3333333…![{\displaystyle 0.{\overline {3}}=0.3333333\dots }](https://wikimedia.org/api/rest_v1/media/math/render/svg/b9254d625a10f2c80bbdc5156cb1e1a3e3d9b5a0) (see also [0.999...](https://en.wikipedia.org/wiki/0.999... "0.999..."))

0.01¯2=0.010101…2![{\displaystyle 0.{\overline {01}}_{2}=0.010101\dots _{2}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/d2715f3a61f3fc2ff76575c039c1a8f28f563037)

0.26![{\displaystyle 0.2_{6}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/c2f28ff9b3614d9edbfef94b3567a35b9b51f639)

For integers _p_ and _q_ with [_gcd_](https://en.wikipedia.org/wiki/Greatest_common_divisor "Greatest common divisor") (_p_, _q_) = 1, the [fraction](https://en.wikipedia.org/wiki/Fraction_\(mathematics\) "Fraction (mathematics)") _p_/_q_ has a finite representation in base _b_ if and only if each [prime factor](https://en.wikipedia.org/wiki/Prime_factor "Prime factor") of _q_ is also a prime factor of _b_.

For a given base, any number that can be represented by a finite number of digits (without using the bar notation) will have multiple representations, including one or two infinite representations:

1. A finite or infinite number of zeroes can be appended:
    
    3.467=3.4607=3.4600007=3.460¯7![{\displaystyle 3.46_{7}=3.460_{7}=3.460000_{7}=3.46{\overline {0}}_{7}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/eeca95a46de429e2a7ae3b43a77f212dc3f3254b)
    
2. The last non-zero digit can be reduced by one and an infinite string of digits, each corresponding to one less than the base, are appended (or replace any following zero digits):
    
    3.467=3.456¯7![{\displaystyle 3.46_{7}=3.45{\overline {6}}_{7}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/a086fed8191fbbaca78c257e53c5faeb66412083)
    
    110=0.9¯10![{\displaystyle 1_{10}=0.{\overline {9}}_{10}\qquad }](https://wikimedia.org/api/rest_v1/media/math/render/svg/d22aadb5408e0bb589e7430fc6f5dcb19921154a) (see also [0.999...](https://en.wikipedia.org/wiki/0.999... "0.999..."))
    
    2205=214.4¯5![{\displaystyle 220_{5}=214.{\overline {4}}_{5}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/242adcda6a8ed40c24a68a0b238a7af986ef0f53)
    

#### Irrational numbers

Main article: [irrational number](https://en.wikipedia.org/wiki/Irrational_number "Irrational number")

A (real) irrational number has an infinite non-repeating representation in all integer bases.[[21]](https://en.wikipedia.org/wiki/Positional_notation#cite_note-21)

Examples are the non-solvable [_n_th roots](https://en.wikipedia.org/wiki/Nth_root "Nth root")

y=xn![{\displaystyle y={\sqrt[{n}]{x}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/70c948f50917ced2d3036c8c5edc92ee14a6b43a)

with yn=x![{\displaystyle y^{n}=x}](https://wikimedia.org/api/rest_v1/media/math/render/svg/287a41964d6e61f0251e3e13a9fd032c558e8a41) and _y_ ∉ **Q**, numbers which are called [algebraic](https://en.wikipedia.org/wiki/Algebraic_number "Algebraic number"), or numbers like

π,e![{\displaystyle \pi ,e}](https://wikimedia.org/api/rest_v1/media/math/render/svg/e023bb9bc4361bfc11ab9fdfb4559f682c1ad700)

which are [transcendental](https://en.wikipedia.org/wiki/Transcendental_number "Transcendental number"). The number of transcendentals is [uncountable](https://en.wikipedia.org/wiki/Uncountable "Uncountable") and the sole way to write them down with a finite number of symbols is to give them a symbol or a finite sequence of symbols.

## Applications

### Decimal system

Main article: [Decimal representation](https://en.wikipedia.org/wiki/Decimal_representation "Decimal representation")

In the [decimal](https://en.wikipedia.org/wiki/Decimal "Decimal") (base-10) [Hindu–Arabic numeral system](https://en.wikipedia.org/wiki/Hindu%E2%80%93Arabic_numeral_system "Hindu–Arabic numeral system"), each position starting from the right is a higher power of 10. The first position represents [100](https://en.wikipedia.org/wiki/1_E0 "1 E0") (1), the second position [101](https://en.wikipedia.org/wiki/1_E1 "1 E1") (10), the third position [102](https://en.wikipedia.org/wiki/1_E2 "1 E2") (10 × 10 or 100), the fourth position [103](https://en.wikipedia.org/wiki/1000_\(number\) "1000 (number)") (10 × 10 × 10 or 1000), and so on.

[Fractional](https://en.wikipedia.org/wiki/Decimal "Decimal") values are indicated by a [separator](https://en.wikipedia.org/wiki/Decimal_separator "Decimal separator"), which can vary in different locations. Usually this separator is a period or [full stop](https://en.wikipedia.org/wiki/Full_stop "Full stop"), or a [comma](https://en.wikipedia.org/wiki/Comma_\(punctuation\) "Comma (punctuation)"). Digits to the right of it are multiplied by 10 raised to a negative power or exponent. The first position to the right of the separator indicates [10−1](https://en.wikipedia.org/wiki/1_E-1 "1 E-1") (0.1), the second position [10−2](https://en.wikipedia.org/wiki/1_E-2 "1 E-2") (0.01), and so on for each successive position.

As an example, the number 2674 in a base-10 numeral system is:

(2 × 103) + (6 × 102) + (7 × 101) + (4 × 100)

or

(2 × 1000) + (6 × 100) + (7 × 10) + (4 × 1).

### Sexagesimal system

The [sexagesimal](https://en.wikipedia.org/wiki/Sexagesimal "Sexagesimal") or base-60 system was used for the integral and fractional portions of [Babylonian numerals](https://en.wikipedia.org/wiki/Babylonian_numerals "Babylonian numerals") and other Mesopotamian systems, by [Hellenistic](https://en.wikipedia.org/wiki/Hellenistic "Hellenistic") astronomers using [Greek numerals](https://en.wikipedia.org/wiki/Greek_numerals "Greek numerals") for the fractional portion only, and is still used for modern time and angles, but only for minutes and seconds. However, not all of these uses were positional.

Modern time separates each position by a colon or a [prime symbol](https://en.wikipedia.org/wiki/Prime_\(symbol\) "Prime (symbol)"). For example, the time might be 10:25:59 (10 hours 25 minutes 59 seconds). Angles use similar notation. For example, an angle might be 10°25′59″ (10 [degrees](https://en.wikipedia.org/wiki/Degree_\(angle\) "Degree (angle)") 25 [minutes](https://en.wikipedia.org/wiki/Minute_\(angle\) "Minute (angle)") 59 [seconds](https://en.wikipedia.org/wiki/Second_\(angle\) "Second (angle)")). In both cases, only minutes and seconds use sexagesimal notation—angular degrees can be larger than 59 (one rotation around a circle is 360°, two rotations are 720°, etc.), and both time and angles use decimal fractions of a second.[_[citation needed](https://en.wikipedia.org/wiki/Wikipedia:Citation_needed "Wikipedia:Citation needed")_] This contrasts with the numbers used by Hellenistic and [Renaissance](https://en.wikipedia.org/wiki/Renaissance "Renaissance") astronomers, who used [thirds](https://en.wikipedia.org/wiki/Third_\(angle\) "Third (angle)"), [fourths](https://en.wikipedia.org/wiki/Fourth_\(angle\) "Fourth (angle)"), etc. for finer increments. Where we might write 10°25′59.392″, they would have written 10°25′59′′23′′′31′′′′12′′′′′ or 10°25i59ii23iii31iv12v.

Using a digit set of digits with upper and lowercase letters allows short notation for sexagesimal numbers, e.g. 10:25:59 becomes 'ARz' (by omitting I and O, but not i and o), which is useful for use in URLs, etc., but it is not very intelligible to humans.

In the 1930s, [Otto Neugebauer](https://en.wikipedia.org/wiki/Otto_Neugebauer "Otto Neugebauer") introduced a modern notational system for Babylonian and Hellenistic numbers that substitutes modern decimal notation from 0 to 59 in each position, while using a semicolon (;) to separate the integral and fractional portions of the number and using a comma (,) to separate the positions within each portion.[[22]](https://en.wikipedia.org/wiki/Positional_notation#cite_note-22) For example, the mean [synodic month](https://en.wikipedia.org/wiki/Synodic_month "Synodic month") used by both Babylonian and Hellenistic astronomers and still used in the [Hebrew calendar](https://en.wikipedia.org/wiki/Hebrew_calendar "Hebrew calendar") is 29;31,50,8,20 days, and the angle used in the example above would be written 10;25,59,23,31,12 degrees.

### Computing

In [computing](https://en.wikipedia.org/wiki/Computing "Computing"), the [binary](https://en.wikipedia.org/wiki/Binary_numeral_system "Binary numeral system") (base-2), octal (base-8) and [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal "Hexadecimal") (base-16) bases are most commonly used. Computers, at the most basic level, deal only with sequences of conventional zeroes and ones, thus it is easier in this sense to deal with powers of two. The hexadecimal system is used as "shorthand" for binary—every 4 binary digits (bits) relate to one and only one hexadecimal digit. In hexadecimal, the six digits after 9 are denoted by A, B, C, D, E, and F (and sometimes a, b, c, d, e, and f).

The [octal](https://en.wikipedia.org/wiki/Octal "Octal") numbering system is also used as another way to represent binary numbers. In this case the base is 8 and therefore only digits 0, 1, 2, 3, 4, 5, 6, and 7 are used. When converting from binary to octal every 3 bits relate to one and only one octal digit.

Hexadecimal, decimal, octal, and a wide variety of other bases have been used for [binary-to-text encoding](https://en.wikipedia.org/wiki/Binary-to-text_encoding "Binary-to-text encoding"), implementations of [arbitrary-precision arithmetic](https://en.wikipedia.org/wiki/Arbitrary-precision_arithmetic "Arbitrary-precision arithmetic"), and other applications.

_For a list of bases and their applications, see [list of numeral systems](https://en.wikipedia.org/wiki/List_of_numeral_systems "List of numeral systems")._

### Other bases in human language

Base-12 systems ([duodecimal](https://en.wikipedia.org/wiki/Duodecimal "Duodecimal") or dozenal) have been popular because multiplication and division are easier than in base-10, with addition and subtraction being just as easy. Twelve is a useful base because it has many [factors](https://en.wikipedia.org/wiki/Divisor "Divisor"). It is the smallest common multiple of one, two, three, four and six.

---

[The binary system](https://en.wikipedia.org/wiki/Binary_numeral_system "Binary numeral system") was used in the Egyptian Old Kingdom, 3000 BC to 2050 BC. It was cursive by rounding off rational numbers smaller than 1 to 1/2 + 1/4 + 1/8 + 1/16 + 1/32 + 1/64, with a 1/64 term thrown away (the system was called the [Eye of Horus](https://en.wikipedia.org/wiki/Eye_of_Horus#Mathematics "Eye of Horus")).

North and Central American natives used base-4 ([quaternary](https://en.wikipedia.org/wiki/Quaternary_numeral_system "Quaternary numeral system")) to represent the four cardinal directions. Mesoamericans tended to add a second base-5 system to create a modified base-20 system.

A base-5 system ([quinary](https://en.wikipedia.org/wiki/Quinary "Quinary")) has been used in many cultures for counting. Plainly it is based on the number of digits on a human hand. It may also be regarded as a sub-base of other bases, such as base-10, base-20, and base-60.

---

## Non-standard positional numeral systems

Main article: [Non-standard positional numeral systems](https://en.wikipedia.org/wiki/Non-standard_positional_numeral_systems "Non-standard positional numeral systems")

Interesting properties exist when the base is not fixed or positive and when the digit symbol sets denote negative values. There are many more variations. These systems are of practical and theoretic value to computer scientists.

[Balanced ternary](https://en.wikipedia.org/wiki/Balanced_ternary "Balanced ternary")[[26]](https://en.wikipedia.org/wiki/Positional_notation#cite_note-26) uses a base of 3 but the digit set is {1,0,1} instead of {0,1,2}. The "1" has an equivalent value of −1. The negation of a number is easily formed by switching the    on the 1s. This system can be used to solve the [balance problem](https://en.wikipedia.org/w/index.php?title=Balance_problem&action=edit&redlink=1 "Balance problem (page does not exist)"), which requires finding a minimal set of known counter-weights to determine an unknown weight. Weights of 1, 3, 9, ..., 3_n_ known units can be used to determine any unknown weight up to 1 + 3 + ... + 3_n_ units. A weight can be used on either side of the balance or not at all. Weights used on the balance pan with the unknown weight are designated with 1, with 1 if used on the empty pan, and with 0 if not used. If an unknown weight _W_ is balanced with 3 (31) on its pan and 1 and 27 (30 and 33) on the other, then its weight in decimal is 25 or 1011 in balanced base-3.

10113 = 1 × 33 + 0 × 32 − 1 × 31 + 1 × 30 = 25.

The [factorial number system](https://en.wikipedia.org/wiki/Factorial_number_system "Factorial number system") uses a varying radix, giving [factorials](https://en.wikipedia.org/wiki/Factorial "Factorial") as place values; they are related to [Chinese remainder theorem](https://en.wikipedia.org/wiki/Chinese_remainder_theorem "Chinese remainder theorem") and [residue number system](https://en.wikipedia.org/wiki/Residue_number_system "Residue number system") enumerations. This system effectively enumerates permutations. A derivative of this uses the [Towers of Hanoi](https://en.wikipedia.org/wiki/Towers_of_Hanoi "Towers of Hanoi") puzzle configuration as a counting system. The configuration of the towers can be put into 1-to-1 correspondence with the decimal count of the step at which the configuration occurs and vice versa.

|   |   |   |   |   |   |   |   |   |   |   |   |   |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
|Decimal equivalents|−3|−2|−1|0|1|2|3|4|5|6|7|8|
|Balanced base 3|10|11|1|0|1|11|10|11|111|110|111|101|
|Base −2|1101|10|11|0|1|110|111|100|101|11010|11011|11000|
|Factoroid|−110|−100|−10|0|10|100|110|200|210|1000|1010|1100|

## Non-positional positions

Each position does not need to be positional itself. [Babylonian sexagesimal numerals](https://en.wikipedia.org/wiki/Babylonian_cuneiform_numerals "Babylonian cuneiform numerals") were positional, but in each position were groups of two kinds of wedges representing ones and tens (a narrow vertical wedge | for the one and an open left pointing wedge ⟨ for the ten) — up to 5+9=14 symbols per position (i.e. 5 tens ⟨⟨⟨⟨⟨ and 9 ones ||||||||| grouped into one or two near squares containing up to three tiers of symbols, or a place holder (⑊) for the lack of a position).[[27]](https://en.wikipedia.org/wiki/Positional_notation#cite_note-27) Hellenistic astronomers used one or two alphabetic Greek numerals for each position (one chosen from 5 letters representing 10–50 and/or one chosen from 9 letters representing 1–9, or a [zero symbol](https://en.wikipedia.org/wiki/Greek_numerals#Hellenistic_zero "Greek numerals")).[[28]](https://en.wikipedia.org/wiki/Positional_notation#cite_note-28)

---

**Machine epsilon** or **machine precision** is an upper bound on the [relative approximation error](https://en.wikipedia.org/wiki/Relative_approximation_error "Relative approximation error") due to [rounding](https://en.wikipedia.org/wiki/Rounding "Rounding") in [floating point](https://en.wikipedia.org/wiki/Floating_point "Floating point") number systems. This value characterizes [computer arithmetic](https://en.wikipedia.org/wiki/Computer_arithmetic "Computer arithmetic") in the field of [numerical analysis](https://en.wikipedia.org/wiki/Numerical_analysis "Numerical analysis"), and by extension in the subject of [computational science](https://en.wikipedia.org/wiki/Computational_science "Computational science"). The quantity is also called **macheps** and it has the symbols Greek [epsilon](https://en.wikipedia.org/wiki/Epsilon "Epsilon") ε![{\displaystyle \varepsilon }](https://wikimedia.org/api/rest_v1/media/math/render/svg/a30c89172e5b88edbd45d3e2772c7f5e562e5173).

There are two prevailing definitions, denoted here as [_rounding machine epsilon_ or the _formal definition_](https://en.wikipedia.org/wiki/Machine_epsilon#Formal_definition) and [_interval machine epsilon_ or _mainstream definition_](https://en.wikipedia.org/wiki/Machine_epsilon#Mainstream_definition).

In the _mainstream definition_, machine epsilon is independent of rounding method, and is defined simply as _the difference between 1 and the next larger floating point number_.

In the _formal definition_, machine epsilon is dependent on the type of rounding used and is also called **unit roundoff**, which has the symbol bold Roman **u**.

The two terms can generally be considered to differ by simply a factor of two, with the _formal definition_ yielding an epsilon half the size of the _mainstream definition_, as summarized in the tables in the next section.

## Values for standard hardware arithmetics

The following table lists machine epsilon values for standard floating-point formats.

|IEEE 754 - 2008|Common name|C++ data type|Base b![{\displaystyle b}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f11423fbb2e967f986e36804a8ae4271734917c3)|Precision p![{\displaystyle p}](https://wikimedia.org/api/rest_v1/media/math/render/svg/81eac1e205430d1f40810df36a0edffdc367af36)|Rounding machine epsilon[[a]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-1) b−(p−1)/2![{\displaystyle b^{-(p-1)}/2}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4a675bf52649cedd81862f0b3e53a6f81f6d2c64)|Interval machine epsilon[[b]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-2) b−(p−1)![{\displaystyle b^{-(p-1)}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/e0f92457cf94ff78c9492bc4b207df9536ee45f1)|
|---|---|---|---|---|---|---|
|[binary16](https://en.wikipedia.org/wiki/Half-precision_floating-point_format "Half-precision floating-point format")|half precision|N/A|2|11 (one bit is implicit)|2−11 ≈ 4.88e-04|2−10 ≈ 9.77e-04|
|[binary32](https://en.wikipedia.org/wiki/Single-precision_floating-point_format "Single-precision floating-point format")|single precision|float|2|24 (one bit is implicit)|2−24 ≈ 5.96e-08|2−23 ≈ 1.19e-07|
|[binary64](https://en.wikipedia.org/wiki/Double-precision_floating-point_format "Double-precision floating-point format")|double precision|double|2|53 (one bit is implicit)|2−53 ≈ 1.11e-16|2−52 ≈ 2.22e-16|
||[extended precision](https://en.wikipedia.org/wiki/Extended_precision "Extended precision"), [long double](https://en.wikipedia.org/wiki/Long_double "Long double")|_float80[[1]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-xfloat-3)|2|64|2−64 ≈ 5.42e-20|2−63 ≈ 1.08e-19|
|[binary128](https://en.wikipedia.org/wiki/Quadruple-precision_floating-point_format "Quadruple-precision floating-point format")|quad(ruple) precision|_float128[[1]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-xfloat-3)|2|113 (one bit is implicit)|2−113 ≈ 9.63e-35|2−112 ≈ 1.93e-34|
|[decimal32](https://en.wikipedia.org/wiki/Decimal32_floating-point_format "Decimal32 floating-point format")|single precision decimal|_Decimal32[[2]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-decfloat-4)|10|7|5 × 10−7|10−6|
|[decimal64](https://en.wikipedia.org/wiki/Decimal64_floating-point_format "Decimal64 floating-point format")|double precision decimal|_Decimal64[[2]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-decfloat-4)|10|16|5 × 10−16|10−15|
|[decimal128](https://en.wikipedia.org/wiki/Decimal128_floating-point_format "Decimal128 floating-point format")|quad(ruple) precision decimal|_Decimal128[[2]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-decfloat-4)|10|34|5 × 10−34|10−33|

1.  According to [formal definition](https://en.wikipedia.org/wiki/Machine_epsilon#Formal_definition) — used by Prof. Demmel, [LAPACK](https://en.wikipedia.org/wiki/LAPACK "LAPACK") and [Scilab](https://en.wikipedia.org/wiki/Scilab "Scilab"). It represents the _largest relative rounding error_ in [round-to-nearest](https://en.wikipedia.org/wiki/Round-off#Roundoff_error_under_different_rounding_rules "Round-off") mode. The rationale is that the _rounding error_ is half the interval upwards to the next representable number in finite-precision. Thus, the _relative_ rounding error for number x![{\displaystyle x}](https://wikimedia.org/api/rest_v1/media/math/render/svg/87f9e315fd7e2ba406057a97300593c4802b53e4) is [interval/2]/x![{\displaystyle [interval/2]/x}](https://wikimedia.org/api/rest_v1/media/math/render/svg/25d89a189ac2cd986b83a46482911626638c6375). In this context, the _largest_ relative error occurs when x=1.0![{\displaystyle x=1.0}](https://wikimedia.org/api/rest_v1/media/math/render/svg/a21c7d49f78b7a2178b234e395f76ecb014f9857), and is equal to [ULP(1.0)/2]/1.0![{\displaystyle [ULP(1.0)/2]/1.0}](https://wikimedia.org/api/rest_v1/media/math/render/svg/2fcfa41227de034e32ceb721cb1d42fb07b01ce3), because real numbers in the lower half of the interval 1.0 ~ 1.0+ULP(1) are rounded down to 1.0, and numbers in the upper half of the interval are rounded up to 1.0+ULP(1). Here we use the definition of ULP(1) ([_Unit in Last Place_](https://en.wikipedia.org/wiki/Unit_in_the_last_place "Unit in the last place")) as the positive difference between 1.0 (which can be represented exactly in finite-precision) and the next greater number representable in finite-precision.
2.  According to the [mainstream definition](https://en.wikipedia.org/wiki/Machine_epsilon#Mainstream_definition) — used by Prof. Higham; applied in language constants in [Ada](https://en.wikipedia.org/wiki/Ada_\(programming_language\) "Ada (programming language)"), [C](https://en.wikipedia.org/wiki/C_\(programming_language\) "C (programming language)"), [C++](https://en.wikipedia.org/wiki/C%2B%2B "C++"), [Fortran](https://en.wikipedia.org/wiki/Fortran "Fortran"), [MATLAB](https://en.wikipedia.org/wiki/MATLAB "MATLAB"), [Mathematica](https://en.wikipedia.org/wiki/Mathematica "Mathematica"), [Octave](https://en.wikipedia.org/wiki/GNU_Octave "GNU Octave"), [Pascal](https://en.wikipedia.org/wiki/Pascal_\(programming_language\) "Pascal (programming language)"), [Python](https://en.wikipedia.org/wiki/Python_\(programming_language\) "Python (programming language)") and [Rust](https://en.wikipedia.org/wiki/Rust_\(programming_language\) "Rust (programming language)") etc., and defined in textbooks like «[Numerical Recipes](https://en.wikipedia.org/wiki/Numerical_Recipes "Numerical Recipes")» by Press _et al_. It represents the _largest relative interval_ between two nearest numbers in finite-precision, or the largest rounding error in [round-by-chop](https://en.wikipedia.org/wiki/Round-off#Roundoff_error_under_different_rounding_rules "Round-off") mode. The rationale is that the _relative_ interval for number x![{\displaystyle x}](https://wikimedia.org/api/rest_v1/media/math/render/svg/87f9e315fd7e2ba406057a97300593c4802b53e4) is [interval]/x![{\displaystyle [interval]/x}](https://wikimedia.org/api/rest_v1/media/math/render/svg/e8dd47e705184da337df84317af5eb896fb1ad2c) where interval![{\displaystyle interval}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f6e72e3aab5b9353959b7036e2d631dbafa25f49) is the distance to upwards the next representable number in finite-precision. In this context, the _largest_ relative interval occurs when x=1.0![{\displaystyle x=1.0}](https://wikimedia.org/api/rest_v1/media/math/render/svg/a21c7d49f78b7a2178b234e395f76ecb014f9857), and is the interval between 1.0 (which can be represented exactly in finite-precision) and the next larger representable floating-point number. This interval is equal to [ULP(1)](https://en.wikipedia.org/wiki/Unit_in_the_last_place "Unit in the last place").

## Alternative definitions for epsilon

The IEEE standard does not define the terms _machine epsilon_ and _unit roundoff_, so differing definitions of these terms are in use, which can cause some confusion.

The two terms differ by simply a factor of two. The more-widely used term (referred to as the _mainstream definition_ in this article), is used in most modern programming languages and is simply defined as _machine epsilon is the difference between 1 and the next larger floating point number_. The _formal definition_ can generally be considered to yield an epsilon half the size of the _mainstream definition_, although its definition does vary depending on the form of rounding used.

The two terms are described at length in the next two subsections.

### Formal definition (_Rounding_ machine epsilon)

The [formal definition](https://en.wikipedia.org/wiki/Machine_epsilon#Formal_definition) for _machine epsilon_ is the one used by Prof. [James Demmel](https://en.wikipedia.org/wiki/James_Demmel "James Demmel") in lecture scripts,[[3]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-5) the _LAPACK_ linear algebra package,[[4]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-6) numerics research papers[[5]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-7) and some scientific computing software.[[6]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-8) Most numerical analysts use the words _machine epsilon_ and _unit roundoff_ interchangeably with this meaning, which is explored in depth throughout this subsection.

_Rounding_ is a procedure for choosing the representation of a [real number](https://en.wikipedia.org/wiki/Real_number "Real number") in a [floating point](https://en.wikipedia.org/wiki/Floating_point "Floating point") number system. For a [number system](https://en.wikipedia.org/wiki/Number_system "Number system") and a rounding procedure, machine epsilon is the maximum [relative error](https://en.wikipedia.org/wiki/Relative_error "Relative error") of the chosen rounding procedure.

Some background is needed to determine a value from this definition. A floating point number system is characterized by a [radix](https://en.wikipedia.org/wiki/Radix "Radix") which is also called the base, b![{\displaystyle b}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f11423fbb2e967f986e36804a8ae4271734917c3), and by the [precision](https://en.wikipedia.org/wiki/Precision_\(computer_science\) "Precision (computer science)") p![{\displaystyle p}](https://wikimedia.org/api/rest_v1/media/math/render/svg/81eac1e205430d1f40810df36a0edffdc367af36), i.e. the number of radix b![{\displaystyle b}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f11423fbb2e967f986e36804a8ae4271734917c3) digits of the [significand](https://en.wikipedia.org/wiki/Significand "Significand") (including any leading implicit bit). All the numbers with the same [exponent](https://en.wikipedia.org/wiki/Exponent "Exponent"), e![{\displaystyle e}](https://wikimedia.org/api/rest_v1/media/math/render/svg/cd253103f0876afc68ebead27a5aa9867d927467), have the spacing, be−(p−1)![{\displaystyle b^{e-(p-1)}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/3d2dd61b5e4af66ed18788f8a4a6f4123c26d7ac). The spacing changes at the numbers that are perfect powers of b![{\displaystyle b}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f11423fbb2e967f986e36804a8ae4271734917c3); the spacing on the side of larger [magnitude](https://en.wikipedia.org/wiki/Magnitude_\(mathematics\) "Magnitude (mathematics)") is b![{\displaystyle b}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f11423fbb2e967f986e36804a8ae4271734917c3) times larger than the spacing on the side of smaller magnitude.

Since machine epsilon is a bound for relative error, it suffices to consider numbers with exponent e=0![{\displaystyle e=0}](https://wikimedia.org/api/rest_v1/media/math/render/svg/d9850169d70a5ab7df71c2126441a86cec93eec8). It also suffices to consider positive numbers. For the usual round-to-nearest kind of rounding, the absolute rounding error is at most half the spacing, or b−(p−1)/2![{\displaystyle b^{-(p-1)}/2}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4a675bf52649cedd81862f0b3e53a6f81f6d2c64). This value is the biggest possible numerator for the relative error. The [denominator](https://en.wikipedia.org/wiki/Denominator "Denominator") in the relative error is the number being rounded, which should be as small as possible to make the relative error large. The worst relative error therefore happens when rounding is applied to numbers of the form 1+a![{\displaystyle 1+a}](https://wikimedia.org/api/rest_v1/media/math/render/svg/998c74ac292731e915ab6f448f008194c107c4a4) where a![{\displaystyle a}](https://wikimedia.org/api/rest_v1/media/math/render/svg/ffd2487510aa438433a2579450ab2b3d557e5edc) is between 0![{\displaystyle 0}](https://wikimedia.org/api/rest_v1/media/math/render/svg/2aae8864a3c1fec9585261791a809ddec1489950) and b−(p−1)/2![{\displaystyle b^{-(p-1)}/2}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4a675bf52649cedd81862f0b3e53a6f81f6d2c64). All these numbers round to 1![{\displaystyle 1}](https://wikimedia.org/api/rest_v1/media/math/render/svg/92d98b82a3778f043108d4e20960a9193df57cbf) with relative error a/(1+a)![{\displaystyle a/(1+a)}](https://wikimedia.org/api/rest_v1/media/math/render/svg/fb6c38730128afa127c9e85ea1f678b4187a8c58). The maximum occurs when a![{\displaystyle a}](https://wikimedia.org/api/rest_v1/media/math/render/svg/ffd2487510aa438433a2579450ab2b3d557e5edc) is at the upper end of its range. The 1+a![{\displaystyle 1+a}](https://wikimedia.org/api/rest_v1/media/math/render/svg/998c74ac292731e915ab6f448f008194c107c4a4) in the denominator is negligible compared to the numerator, so it is left off for expediency, and just b−(p−1)/2![{\displaystyle b^{-(p-1)}/2}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4a675bf52649cedd81862f0b3e53a6f81f6d2c64) is taken as machine epsilon. As has been shown here, the relative error is worst for numbers that round to 1![{\displaystyle 1}](https://wikimedia.org/api/rest_v1/media/math/render/svg/92d98b82a3778f043108d4e20960a9193df57cbf), so machine epsilon also is called _unit roundoff_ meaning roughly "the maximum error that can occur when rounding to the unit value".

Thus, the maximum spacing between a normalised floating point number, x![{\displaystyle x}](https://wikimedia.org/api/rest_v1/media/math/render/svg/87f9e315fd7e2ba406057a97300593c4802b53e4), and an adjacent normalised number is 2ε|x|![{\displaystyle 2\varepsilon |x|}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f0a6e9ebedfa785b684900ff0fba5adab5967a30).[[7]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-9)

#### Arithmetic model

Numerical analysis uses machine epsilon to study the effects of rounding error. The actual errors of machine arithmetic are far too complicated to be studied directly, so instead, the following simple model is used. The IEEE arithmetic standard says all floating-point operations are done as if it were possible to perform the infinite-precision operation, and then, the result is rounded to a floating-point number. Suppose (1) x![{\displaystyle x}](https://wikimedia.org/api/rest_v1/media/math/render/svg/87f9e315fd7e2ba406057a97300593c4802b53e4), y![{\displaystyle y}](https://wikimedia.org/api/rest_v1/media/math/render/svg/b8a6208ec717213d4317e666f1ae872e00620a0d) are floating-point numbers, (2) ∙![{\displaystyle \bullet }](https://wikimedia.org/api/rest_v1/media/math/render/svg/3576c2406959ee194a6fc55c34b5ee9f6ffbb715) is an arithmetic operation on floating-point numbers such as addition or multiplication, and (3) ∘![{\displaystyle \circ }](https://wikimedia.org/api/rest_v1/media/math/render/svg/99add39d2b681e2de7ff62422c32704a05c7ec31) is the infinite precision operation. According to the standard, the computer calculates:

x∙y=round(x∘y)![{\displaystyle x\bullet y={\mbox{round}}(x\circ y)}](https://wikimedia.org/api/rest_v1/media/math/render/svg/a0d4de6aec398ab03d5f913f21d891924411c08b)

By the meaning of machine epsilon, the relative error of the rounding is at most machine epsilon in magnitude, so:

x∙y=(x∘y)(1+z)![{\displaystyle x\bullet y=(x\circ y)(1+z)}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f71574e71ca892dfac36f2ecd7bfb13cd80288a4)

where z![{\displaystyle z}](https://wikimedia.org/api/rest_v1/media/math/render/svg/bf368e72c009decd9b6686ee84a375632e11de98) in absolute magnitude is at most ε![{\displaystyle \varepsilon }](https://wikimedia.org/api/rest_v1/media/math/render/svg/a30c89172e5b88edbd45d3e2772c7f5e562e5173) or **u**. The books by Demmel and Higham in the references can be consulted to see how this model is used to analyze the errors of, say, [Gaussian elimination](https://en.wikipedia.org/wiki/Gaussian_elimination "Gaussian elimination").

### Mainstream definition (_Interval_ machine epsilon)

This alternative definition is significantly more widespread: _machine epsilon is the difference between 1 and the next larger floating point number_. This definition is used in language constants in [Ada](https://en.wikipedia.org/wiki/Ada_\(programming_language\) "Ada (programming language)"), [C](https://en.wikipedia.org/wiki/C_\(programming_language\) "C (programming language)"), [C++](https://en.wikipedia.org/wiki/C%2B%2B "C++"), [Fortran](https://en.wikipedia.org/wiki/Fortran "Fortran"), [MATLAB](https://en.wikipedia.org/wiki/MATLAB "MATLAB"), [Mathematica](https://en.wikipedia.org/wiki/Mathematica "Mathematica"), [Octave](https://en.wikipedia.org/wiki/GNU_Octave "GNU Octave"), [Pascal](https://en.wikipedia.org/wiki/Pascal_\(programming_language\) "Pascal (programming language)"), [Python](https://en.wikipedia.org/wiki/Python_\(programming_language\) "Python (programming language)") and [Rust](https://en.wikipedia.org/wiki/Rust_\(programming_language\) "Rust (programming language)") etc., and defined in textbooks like «[Numerical Recipes](https://en.wikipedia.org/wiki/Numerical_Recipes "Numerical Recipes")» by Press _et al_.

By this definition, _ε_ equals the value of the [unit in the last place](https://en.wikipedia.org/wiki/Unit_in_the_last_place "Unit in the last place") relative to 1, i.e. b−(p−1)![{\displaystyle b^{-(p-1)}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/e0f92457cf94ff78c9492bc4b207df9536ee45f1) (where b is the base of the floating point system and p is the precision) and the unit roundoff is **u** = _ε_ / 2, assuming [round-to-nearest](https://en.wikipedia.org/wiki/Round-off#Roundoff_error_under_different_rounding_rules "Round-off") mode, and **u** = _ε_, assuming [round-by-chop](https://en.wikipedia.org/wiki/Round-off#Roundoff_error_under_different_rounding_rules "Round-off").

The prevalence of this definition is rooted in its use in the ISO C Standard for constants relating to floating-point types[[8]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-10)[[9]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-11) and corresponding constants in other programming languages.[[10]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-12)[[11]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-13)[[12]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-ep-14) It is also widely used in scientific computing software[[13]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-15)[[14]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-16)[[15]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-17) and in the numerics and computing literature.[[16]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-18)[[17]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-19)[[18]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-20)[[19]](https://en.wikipedia.org/wiki/Machine_epsilon#cite_note-21)


---
# Factorial number system

In [combinatorics](https://en.wikipedia.org/wiki/Combinatorics "Combinatorics"), the **factorial number system** (also known as **factoradic**), is a [mixed radix](https://en.wikipedia.org/wiki/Mixed_radix "Mixed radix") [numeral system](https://en.wikipedia.org/wiki/Numeral_system "Numeral system") adapted to numbering [permutations](https://en.wikipedia.org/wiki/Permutation "Permutation"). It is also called **factorial base**, although [factorials](https://en.wikipedia.org/wiki/Factorial "Factorial") do not function as [base](https://en.wikipedia.org/wiki/Radix "Radix"), but as [place value](https://en.wikipedia.org/wiki/Place_value "Place value") of digits. By converting a number less than _n_! to factorial representation, one obtains a [sequence](https://en.wikipedia.org/wiki/Sequence "Sequence") of _n_ digits that can be converted to a permutation of _n_ elements in a straightforward way, either using them as [Lehmer code](https://en.wikipedia.org/wiki/Lehmer_code "Lehmer code") or as [inversion](https://en.wikipedia.org/wiki/Inversion_\(discrete_mathematics\) "Inversion (discrete mathematics)") table[[1]](https://en.wikipedia.org/wiki/Factorial_number_system#cite_note-1) representation; in the former case the resulting map from [integers](https://en.wikipedia.org/wiki/Integer "Integer") to permutations of _n_ elements lists them in [lexicographical order](https://en.wikipedia.org/wiki/Lexicographical_order "Lexicographical order"). General mixed radix systems were studied by [Georg Cantor](https://en.wikipedia.org/wiki/Georg_Cantor "Georg Cantor").[[2]](https://en.wikipedia.org/wiki/Factorial_number_system#cite_note-2)

The term "factorial number system" is used by [Knuth](https://en.wikipedia.org/wiki/Donald_Knuth "Donald Knuth"),[[3]](https://en.wikipedia.org/wiki/Factorial_number_system#cite_note-3) while the French equivalent "numération factorielle" was first used in 1888.[[4]](https://en.wikipedia.org/wiki/Factorial_number_system#cite_note-4) The term "factoradic", which is a [portmanteau](https://en.wikipedia.org/wiki/Portmanteau "Portmanteau") of factorial and mixed radix, appears to be of more recent date.[[5]](https://en.wikipedia.org/wiki/Factorial_number_system#cite_note-5)

## Definition

The factorial number system is a [mixed radix](https://en.wikipedia.org/wiki/Mixed_radix "Mixed radix") [numeral system](https://en.wikipedia.org/wiki/Numeral_system "Numeral system"): the _i_-th digit from the right has base _i_, which means that the digit must be strictly less than _i_, and that (taking into account the bases of the less significant digits) its value is to be multiplied by (_i_ − 1)! (its place value).

|   |   |   |   |   |   |   |   |   |
|---|---|---|---|---|---|---|---|---|
|Radix/Base|8|7|6|5|4|3|2|1|
|Place value|7!|6!|5!|4!|3!|2!|1!|0!|
|Place value in decimal|5040|720|120|24|6|2|1|1|
|Highest digit allowed|7|6|5|4|3|2|1|0|

From this it follows that the rightmost digit is always 0, the second can be 0 or 1, the third 0, 1 or 2, and so on (sequence [A124252](https://oeis.org/A124252 "oeis:A124252") in the [OEIS](https://en.wikipedia.org/wiki/On-Line_Encyclopedia_of_Integer_Sequences "On-Line Encyclopedia of Integer Sequences")). The factorial number system is sometimes defined with the 0! place omitted because it is always zero (sequence [A007623](https://oeis.org/A007623 "oeis:A007623") in the [OEIS](https://en.wikipedia.org/wiki/On-Line_Encyclopedia_of_Integer_Sequences "On-Line Encyclopedia of Integer Sequences")).

In this article, a factorial number representation will be flagged by a subscript "!". In addition, some examples will have digits delimited by a colon. For example, 3:4:1:0:1:0! stands for

= 3×5! + 4×4! + 1×3! + 0×2! + 1×1! + 0×0! 

= ((((3×5 + 4)×4 + 1)×3 + 0)×2 + 1)×1 + 0

=  46310.

(The place value is the factorial of one less than the radix position, which is why the equation begins with 5! for a 6-digit factoradic number.)

General properties of mixed radix number systems also apply to the factorial number system. For instance, one can convert a number into factorial representation producing digits from right to left, by repeatedly dividing the number by the radix (1, 2, 3, ...), taking the remainder as digits, and continuing with the integer [quotient](https://en.wikipedia.org/wiki/Quotient "Quotient"), until this quotient becomes 0.

For example, 46310 can be transformed into a factorial representation by these successive divisions:

|   |
|---|
|463 ÷ 1 = 463, remainder 0<br><br>463 ÷ 2 = 231, remainder 1<br><br>231 ÷ 3 = 77, remainder 0<br><br>77 ÷ 4 = 19, remainder 1<br><br>19 ÷ 5 = 3, remainder 4<br><br>3 ÷ 6 = 0, remainder 3|

The process terminates when the quotient reaches zero. Reading the remainders backward gives 3:4:1:0:1:0!.

In principle, this system may be extended to represent [rational numbers](https://en.wikipedia.org/wiki/Rational_number "Rational number"), though rather than the natural extension of place values (−1)!, (−2)!, etc., which are undefined, the symmetric choice of radix values _n_ = 0, 1, 2, 3, 4, etc. after the point may be used instead. Again, the 0 and 1 places may be omitted as these are always zero. The corresponding place values are therefore 1/1, 1/1, 1/2, 1/6, 1/24, ..., 1/_n_!, etc.

## Examples

The following sortable table shows the 24 permutations of four elements with different [inversion](https://en.wikipedia.org/wiki/Inversion_\(discrete_mathematics\) "Inversion (discrete mathematics)") related vectors. The left and right inversion counts l![{\displaystyle l}](https://wikimedia.org/api/rest_v1/media/math/render/svg/829091f745070b9eb97a80244129025440a1cfac) and r![{\displaystyle r}](https://wikimedia.org/api/rest_v1/media/math/render/svg/0d1ecb613aa2984f0576f70f86650b7c2a132538) (the latter often called [Lehmer code](https://en.wikipedia.org/wiki/Lehmer_code "Lehmer code")) are particularly eligible to be interpreted as factorial numbers. l![{\displaystyle l}](https://wikimedia.org/api/rest_v1/media/math/render/svg/829091f745070b9eb97a80244129025440a1cfac) gives the permutation's position in reverse [colexicographic](https://en.wikipedia.org/wiki/Colexicographical_order "Colexicographical order") order (the default order of this table), and the latter the position in [lexicographic](https://en.wikipedia.org/wiki/Lexicographical_order "Lexicographical order") order (both counted from 0).

Sorting by a column that has the omissible 0 on the right makes the factorial numbers in that column correspond to the index numbers in the immovable column on the left. The small columns are reflections of the columns next to them, and can be used to bring those in colexicographic order. The rightmost column shows the digit sums of the factorial numbers ([OEIS](https://en.wikipedia.org/wiki/On-Line_Encyclopedia_of_Integer_Sequences "On-Line Encyclopedia of Integer Sequences"): [A034968](https://oeis.org/A034968 "oeis:A034968") in the tables default order).

[![](https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Symmetric_group_4%3B_permutohedron_3D%3B_Lehmer_codes.svg/500px-Symmetric_group_4%3B_permutohedron_3D%3B_Lehmer_codes.svg.png)](https://en.wikipedia.org/wiki/File:Symmetric_group_4;_permutohedron_3D;_Lehmer_codes.svg)

The factorial numbers of a given length form a [permutohedron](https://en.wikipedia.org/wiki/Permutohedron "Permutohedron") when ordered by the bitwise ≤![{\displaystyle \leq }](https://wikimedia.org/api/rest_v1/media/math/render/svg/440568a09c3bfdf0e1278bfa79eb137c04e94035) relation  
  
These are the right inversion counts (aka Lehmer codes) of the permutations of four elements.

|   |   |
|---|---|
|\|<br>\|---\|<br>\|0\|<br>\|1\|<br>\|2\|<br>\|3\|<br>\|4\|<br>\|5\|<br>\|6\|<br>\|7\|<br>\|8\|<br>\|9\|<br>\|10\|<br>\|11\|<br>\|12\|<br>\|13\|<br>\|14\|<br>\|15\|<br>\|16\|<br>\|17\|<br>\|18\|<br>\|19\|<br>\|20\|<br>\|21\|<br>\|22\|<br>\|23\||\|   \|π![{\displaystyle \pi }](https://wikimedia.org/api/rest_v1/media/math/render/svg/9be4ba0bb8df3af72e90a0535fabcc17431e540a)\|v![{\displaystyle v}](https://wikimedia.org/api/rest_v1/media/math/render/svg/e07b00e7fc0847fbd16391c778d65bc25c452597)\|l![{\displaystyle l}](https://wikimedia.org/api/rest_v1/media/math/render/svg/829091f745070b9eb97a80244129025440a1cfac)\|p-b\|r![{\displaystyle r}](https://wikimedia.org/api/rest_v1/media/math/render/svg/0d1ecb613aa2984f0576f70f86650b7c2a132538)\|#\|<br>\|---\|---\|---\|---\|---\|---\|---\|---\|---\|---\|---\|---\|<br>\|0\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/4-el_perm_matrix_00.svg/40px-4-el_perm_matrix_00.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_00.svg)\|1234\|4321\|0000\|0000\|0000\|0000\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/4-el_perm_invset_00.svg/60px-4-el_perm_invset_00.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_00.svg)\|0000\|0000\|0\|<br>\|1\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/4-el_perm_matrix_01.svg/40px-4-el_perm_matrix_01.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_01.svg)\|2134\|4312\|1000\|0001\|0010\|0100\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/4-el_perm_invset_01.svg/60px-4-el_perm_invset_01.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_01.svg)\|1000\|0001\|1\|<br>\|2\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/4-el_perm_matrix_02.svg/40px-4-el_perm_matrix_02.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_02.svg)\|1324\|4231\|0100\|0010\|0100\|0010\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/4-el_perm_invset_02.svg/60px-4-el_perm_invset_02.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_02.svg)\|0100\|0010\|1\|<br>\|3\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/4-el_perm_matrix_03.svg/40px-4-el_perm_matrix_03.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_03.svg)\|3124\|4213\|1100\|0011\|0110\|0110\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/4-el_perm_invset_03.svg/60px-4-el_perm_invset_03.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_03.svg)\|2000\|0002\|2\|<br>\|4\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/4-el_perm_matrix_04.svg/40px-4-el_perm_matrix_04.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_04.svg)\|2314\|4132\|2000\|0002\|0200\|0020\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/4-el_perm_invset_04.svg/60px-4-el_perm_invset_04.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_04.svg)\|1100\|0011\|2\|<br>\|5\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/4-el_perm_matrix_05.svg/40px-4-el_perm_matrix_05.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_05.svg)\|3214\|4123\|2100\|0012\|0210\|0120\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/4-el_perm_invset_05.svg/60px-4-el_perm_invset_05.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_05.svg)\|2100\|0012\|3\|<br>\|6\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/4-el_perm_matrix_06.svg/40px-4-el_perm_matrix_06.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_06.svg)\|1243\|3421\|0010\|0100\|1000\|0001\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/4-el_perm_invset_06.svg/60px-4-el_perm_invset_06.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_06.svg)\|0010\|0100\|1\|<br>\|7\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/4-el_perm_matrix_07.svg/40px-4-el_perm_matrix_07.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_07.svg)\|2143\|3412\|1010\|0101\|1010\|0101\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/4-el_perm_invset_07.svg/60px-4-el_perm_invset_07.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_07.svg)\|1010\|0101\|2\|<br>\|8\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/4-el_perm_matrix_08.svg/40px-4-el_perm_matrix_08.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_08.svg)\|1423\|3241\|0110\|0110\|1100\|0011\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/4-el_perm_invset_08.svg/60px-4-el_perm_invset_08.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_08.svg)\|0200\|0020\|2\|<br>\|9\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/4-el_perm_matrix_09.svg/40px-4-el_perm_matrix_09.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_09.svg)\|4123\|3214\|1110\|0111\|1110\|0111\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/4-el_perm_invset_09.svg/60px-4-el_perm_invset_09.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_09.svg)\|3000\|0003\|3\|<br>\|10\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/4-el_perm_matrix_10.svg/40px-4-el_perm_matrix_10.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_10.svg)\|2413\|3142\|2010\|0102\|1200\|0021\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/4-el_perm_invset_10.svg/60px-4-el_perm_invset_10.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_10.svg)\|1200\|0021\|3\|<br>\|11\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/4-el_perm_matrix_11.svg/40px-4-el_perm_matrix_11.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_11.svg)\|4213\|3124\|2110\|0112\|1210\|0121\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/4-el_perm_invset_11.svg/60px-4-el_perm_invset_11.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_11.svg)\|3100\|0013\|4\|<br>\|12\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/4-el_perm_matrix_12.svg/40px-4-el_perm_matrix_12.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_12.svg)\|1342\|2431\|0200\|0020\|2000\|0002\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/4-el_perm_invset_12.svg/60px-4-el_perm_invset_12.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_12.svg)\|0110\|0110\|2\|<br>\|13\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/4-el_perm_matrix_13.svg/40px-4-el_perm_matrix_13.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_13.svg)\|3142\|2413\|1200\|0021\|2010\|0102\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/4-el_perm_invset_13.svg/60px-4-el_perm_invset_13.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_13.svg)\|2010\|0102\|3\|<br>\|14\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/4-el_perm_matrix_14.svg/40px-4-el_perm_matrix_14.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_14.svg)\|1432\|2341\|0210\|0120\|2100\|0012\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/4-el_perm_invset_14.svg/60px-4-el_perm_invset_14.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_14.svg)\|0210\|0120\|3\|<br>\|15\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/4-el_perm_matrix_15.svg/40px-4-el_perm_matrix_15.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_15.svg)\|4132\|2314\|1210\|0121\|2110\|0112\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/4-el_perm_invset_15.svg/60px-4-el_perm_invset_15.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_15.svg)\|3010\|0103\|4\|<br>\|16\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/4-el_perm_matrix_16.svg/40px-4-el_perm_matrix_16.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_16.svg)\|3412\|2143\|2200\|0022\|2200\|0022\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/4-el_perm_invset_16.svg/60px-4-el_perm_invset_16.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_16.svg)\|2200\|0022\|4\|<br>\|17\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/4-el_perm_matrix_17.svg/40px-4-el_perm_matrix_17.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_17.svg)\|4312\|2134\|2210\|0122\|2210\|0122\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/4-el_perm_invset_17.svg/60px-4-el_perm_invset_17.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_17.svg)\|3200\|0023\|5\|<br>\|18\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/4-el_perm_matrix_18.svg/40px-4-el_perm_matrix_18.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_18.svg)\|2341\|1432\|3000\|0003\|3000\|0003\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/4-el_perm_invset_18.svg/60px-4-el_perm_invset_18.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_18.svg)\|1110\|0111\|3\|<br>\|19\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/4-el_perm_matrix_19.svg/40px-4-el_perm_matrix_19.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_19.svg)\|3241\|1423\|3100\|0013\|3010\|0103\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/4-el_perm_invset_19.svg/60px-4-el_perm_invset_19.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_19.svg)\|2110\|0112\|4\|<br>\|20\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/4-el_perm_matrix_20.svg/40px-4-el_perm_matrix_20.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_20.svg)\|2431\|1342\|3010\|0103\|3100\|0013\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/4-el_perm_invset_20.svg/60px-4-el_perm_invset_20.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_20.svg)\|1210\|0121\|4\|<br>\|21\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/4-el_perm_matrix_21.svg/40px-4-el_perm_matrix_21.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_21.svg)\|4231\|1324\|3110\|0113\|3110\|0113\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/4-el_perm_invset_21.svg/60px-4-el_perm_invset_21.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_21.svg)\|3110\|0113\|5\|<br>\|22\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/4-el_perm_matrix_22.svg/40px-4-el_perm_matrix_22.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_22.svg)\|3421\|1243\|3200\|0023\|3200\|0023\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/4-el_perm_invset_22.svg/60px-4-el_perm_invset_22.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_22.svg)\|2210\|0122\|5\|<br>\|23\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/4-el_perm_matrix_23.svg/40px-4-el_perm_matrix_23.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_matrix_23.svg)\|4321\|1234\|3210\|0123\|3210\|0123\|[![](https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/4-el_perm_invset_23.svg/60px-4-el_perm_invset_23.svg.png)](https://en.wikipedia.org/wiki/File:4-el_perm_invset_23.svg)\|3210\|0123\|6\||

For another example, the greatest number that could be represented with six digits would be 543210! which equals 719 in [decimal](https://en.wikipedia.org/wiki/Decimal "Decimal"):

5×5! + 4×4! + 3x3! + 2×2! + 1×1! + 0×0!.

Clearly the next factorial number representation after 5:4:3:2:1:0! is 1:0:0:0:0:0:0! which designates 6! = 72010, the place value for the radix-7 digit. So the former number, and its summed out expression above, is equal to:

6! − 1.

The factorial number system provides a unique representation for each natural number, with the given restriction on the "digits" used. No number can be represented in more than one way because the sum of consecutive factorials multiplied by their index is always the next factorial minus one:

∑i=0ni⋅i!=(n+1)!−1.![{\displaystyle \sum _{i=0}^{n}{i\cdot i!}={(n+1)!}-1.}](https://wikimedia.org/api/rest_v1/media/math/render/svg/756906c5144d823dab910f3a08b238cda0dc27f6)

This can be easily [proved](https://en.wikipedia.org/wiki/Mathematical_proof "Mathematical proof") with [mathematical induction](https://en.wikipedia.org/wiki/Mathematical_induction "Mathematical induction"), or simply by noticing that ∀i,i⋅i!=(i+1−1)⋅i!=(i+1)!−i!![{\displaystyle \forall i,i\cdot i!=(i+1-1)\cdot i!=(i+1)!-i!}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4d2ed7961c8cad8e2c8e523f5931d5623a6b9e87): subsequent terms cancel each other, leaving the first and last term (see [Telescoping series](https://en.wikipedia.org/wiki/Telescoping_series "Telescoping series")).

However, when using [Arabic numerals](https://en.wikipedia.org/wiki/Arabic_numerals "Arabic numerals") to write the digits (and not including the subscripts as in the above examples), their simple concatenation becomes ambiguous for numbers having a "digit" greater than 9. The smallest such example is the number 10 × 10! = 36,288,00010, which may be written A0000000000!=10:0:0:0:0:0:0:0:0:0:0!, but not 100000000000! = 1:0:0:0:0:0:0:0:0:0:0:0! which denotes 11! = 39,916,80010. Thus using letters A–Z to denote digits 10, 11, 12, ..., 35 as in other base-_N_ make the largest representable number 36 × 36! − 1. For arbitrarily greater numbers one has to choose a base for representing individual digits, say decimal, and provide a separating mark between them (for instance by subscripting each digit by its base, also given in decimal, like 24031201, this number also can be written as 2:0:1:0!). In fact the factorial number system itself is not truly a [numeral system](https://en.wikipedia.org/wiki/Numeral_system "Numeral system") in the sense of providing a representation for all natural numbers using only a finite alphabet of symbols.

## Permutations

There is a natural [mapping](https://en.wikipedia.org/wiki/Function_\(mathematics\) "Function (mathematics)") between the integers 0, 1, ..., _n_! − 1 (or equivalently the numbers with _n_ digits in factorial representation) and [permutations](https://en.wikipedia.org/wiki/Permutation "Permutation") of _n_ elements in [lexicographical](https://en.wikipedia.org/wiki/Lexicographical "Lexicographical") order, when the integers are expressed in factoradic form. This mapping has been termed the [Lehmer code](https://en.wikipedia.org/wiki/Lehmer_code "Lehmer code") (or inversion table). For example, with _n_ = 3, such a mapping is

|decimal|factoradic|permutation|
|---|---|---|
|010|0:0:0!|(0,1,2)|
|110|0:1:0!|(0,2,1)|
|210|1:0:0!|(1,0,2)|
|310|1:1:0!|(1,2,0)|
|410|2:0:0!|(2,0,1)|
|510|2:1:0!|(2,1,0)|

In each case, calculating the permutation proceeds by using the leftmost factoradic digit (here, 0, 1, or 2) as the first permutation digit, then removing it from the list of choices (0, 1, and 2). Think of this new list of choices as zero indexed, and use each successive factoradic digit to choose from its remaining elements. If the second factoradic digit is "0" then the first element of the list is selected for the second permutation digit and is then removed from the list. Similarly, if the second factoradic digit is "1", the second is selected and then removed. The final factoradic digit is always "0", and since the list now contains only one element, it is selected as the last permutation digit.

The process may become clearer with a longer example. Let's say we want the 2982nd permutation of the numbers 0 through 6. The number 2982 is 4:0:4:1:0:0:0! in factoradic, and that number picks out digits (4,0,6,2,1,3,5) in turn, via indexing a dwindling ordered set of digits and picking out each digit from the set at each turn:

                            4:0:4:1:0:0:0!  ─►  (4,0,6,2,1,3,5)
factoradic: 4              :   0            :   4          :   1        :   0      :   0    :   0!
            ├─┬─┬─┬─┐          │                ├─┬─┬─┬─┐      ├─┐          │          │        │
sets:      (0,1,2,3,4,5,6) ─► (0,1,2,3,5,6) ─► (1,2,3,5,6) ─► (1,2,3,5) ─► (1,3,5) ─► (3,5) ─► (5)
                    │          │                        │        │          │          │        │
permutation:       (4,         0,                       6,       2,         1,         3,       5)

A natural index for the [direct product](https://en.wikipedia.org/wiki/Direct_product_of_groups "Direct product of groups") of two [permutation groups](https://en.wikipedia.org/wiki/Permutation_group "Permutation group") is the [concatenation](https://en.wikipedia.org/wiki/Concatenation "Concatenation") of two factoradic numbers, with two subscript "!"s.

           concatenated
 decimal   factoradics        permutation pair
    010     0:0:0!0:0:0!           ((0,1,2),(0,1,2))
    110     0:0:0!0:1:0!           ((0,1,2),(0,2,1))
               ...
    510     0:0:0!2:1:0!           ((0,1,2),(2,1,0))
    610     0:1:0!0:0:0!           ((0,2,1),(0,1,2))
    710     0:1:0!0:1:0!           ((0,2,1),(0,2,1))
               ...
   2210     1:1:0!2:0:0!           ((1,2,0),(2,0,1))
               ...
   3410     2:1:0!2:0:0!           ((2,1,0),(2,0,1))
   3510     2:1:0!2:1:0!           ((2,1,0),(2,1,0))

## Fractional values

Unlike single radix systems whose place values are _base__n_ for both positive and negative integral _n_, the factorial number base cannot be extended to negative place values as these would be (−1)!, (−2)! and so on, and these values are undefined (see [factorial](https://en.wikipedia.org/wiki/Factorial "Factorial")).

One possible extension is therefore to use 1/0!, 1/1!, 1/2!, 1/3!, ..., 1/_n_! etc. instead, possibly omitting the 1/0! and 1/1! places which are always zero.

With this method, all rational numbers have a terminating expansion, whose length in 'digits' is less than or equal to the denominator of the rational number represented. This may be proven by considering that there exists a factorial for any integer and therefore the denominator divides into its own factorial even if it does not divide into any smaller factorial.

By necessity, therefore, the factoradic expansion of the reciprocal of a [prime](https://en.wikipedia.org/wiki/Prime_number "Prime number") has a length of exactly that prime (less one if the 1/1! place is omitted). Other terms are given as the sequence [A046021](https://oeis.org/A046021) on the OEIS. It can also be proven that the last 'digit' or term of the representation of a rational with prime denominator is equal to the difference between the numerator and the prime denominator.

Similar to how checking the divisibility of 4 in base 10 requires looking at only the last two digits, checking the divisibility of any number in factorial number system requires looking at only a finite number of digits. That is, it has a [divisibility rule](https://en.wikipedia.org/wiki/Divisibility_rule "Divisibility rule") for each number.

There is also a non-terminating equivalent for every rational number akin to the fact that in decimal 0.24999... = 0.25 = 1/4 and [0.999... = 1](https://en.wikipedia.org/wiki/0.999... "0.999..."), etc., which can be created by reducing the final term by 1 and then filling in the remaining infinite number of terms with the highest value possible for the radix of that position.

In the following selection of examples, spaces are used to separate the place values, otherwise represented in decimal. The rational numbers on the left are also in decimal:

- 1/2=0.0 1!![{\displaystyle 1/2=0.0\ 1_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/3fa1816af7397a2171a8f1238d24571b171f05ce)
- 1/3=0.0 0 2!![{\displaystyle 1/3=0.0\ 0\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/909f49562e5a911fa8ee2821a6fa3ccf487950c5)
- 2/3=0.0 1 1!![{\displaystyle 2/3=0.0\ 1\ 1_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/b9eb4e5f1031ccbebcab00a417b2a2a1a41a1493)
- 1/4=0.0 0 1 2!![{\displaystyle 1/4=0.0\ 0\ 1\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/35dca9983eb5a30bb4391b159a8342b00a02f0a8)
- 3/4=0.0 1 1 2!![{\displaystyle 3/4=0.0\ 1\ 1\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/488f5894aec8e96a47d57eb838112434e6bfa116)
- 1/5=0.0 0 1 0 4!![{\displaystyle 1/5=0.0\ 0\ 1\ 0\ 4_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/17875a4e469b50acc93cdc78443076a14d9c4385)
- 1/6=0.0 0 1!![{\displaystyle 1/6=0.0\ 0\ 1_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/6876c839ba36b83113cf5f6686b7313d538fa140)
- 5/6=0.0 1 2!![{\displaystyle 5/6=0.0\ 1\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/710ef50c82341f7002639cdb59c9abaa8144d616)
- 1/7=0.0 0 0 3 2 0 6!![{\displaystyle 1/7=0.0\ 0\ 0\ 3\ 2\ 0\ 6_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/935fe7e736555aa5c8b1ecdb417af8e89ef81d96)
- 1/8=0.0 0 0 3!![{\displaystyle 1/8=0.0\ 0\ 0\ 3_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/d496078099cca22d7b3c9acd2343f202ed19337c)
- 1/9=0.0 0 0 2 3 2!![{\displaystyle 1/9=0.0\ 0\ 0\ 2\ 3\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/bf87a50a444c3e4844397d41e23ec896b5590286)
- 1/10=0.0 0 0 2 2!![{\displaystyle 1/10=0.0\ 0\ 0\ 2\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/1aab6e65276924395e3a9c4f743472db9d36ffc1)
- 1/11  =0.0 0 0 2 0 5 3 1 4 0 A!![{\displaystyle 1/11\ \ =0.0\ 0\ 0\ 2\ 0\ 5\ 3\ 1\ 4\ 0\ A_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/7493580fe82c5bf422ab8838e4e434ab3ee01768)
- 2/11  =0.0 0 1 0 1 4 6 2 8 1 9!![{\displaystyle 2/11\ \ =0.0\ 0\ 1\ 0\ 1\ 4\ 6\ 2\ 8\ 1\ 9_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/7a28452b79e4480f7b27a2724bbd6025d2d953f8)
- 9/11  =0.0 1 1 3 3 1 0 5 0 8 2!![{\displaystyle 9/11\ \ =0.0\ 1\ 1\ 3\ 3\ 1\ 0\ 5\ 0\ 8\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/b945c1bc578232fa6a10b5db97043c4f32e2cd3b)
- 10/11=0.0 1 2 1 4 0 3 6 4 9 1!![{\displaystyle 10/11=0.0\ 1\ 2\ 1\ 4\ 0\ 3\ 6\ 4\ 9\ 1_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/bac181a5013cdb58f63e9429cae24202006019ef)
- 1/12  =0.0 0 0 2!![{\displaystyle 1/12\ \ =0.0\ 0\ 0\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/7c877c2049c00a96d98e7ce303807df5e730a40a)
- 5/12  =0.0 0 2 2!![{\displaystyle 5/12\ \ =0.0\ 0\ 2\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/90d6136468e157736ba6cb8a2830e133d7ecffbe)
- 7/12  =0.0 1 0 2!![{\displaystyle 7/12\ \ =0.0\ 1\ 0\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/1fbbbc909234a1e5a59e795ad50be9489925221b)
- 11/12=0.0 1 2 2!![{\displaystyle 11/12=0.0\ 1\ 2\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/579c065d2588e90129c1faf7f4b24e066b78496a)
- 1/15=0.0 0 0 1 3!![{\displaystyle 1/15=0.0\ 0\ 0\ 1\ 3_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/1957287f437b2d70374d0c70526ff7382e7a8129)
- 1/16=0.0 0 0 1 2 3!![{\displaystyle 1/16=0.0\ 0\ 0\ 1\ 2\ 3_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/c99cbe1feaec40d18377d38073f3ecb0db44ca35)
- 1/18=0.0 0 0 1 1 4!![{\displaystyle 1/18=0.0\ 0\ 0\ 1\ 1\ 4_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/5912dcf1de845789c808c2b4d2a91b373d6b9548)
- 1/20=0.0 0 0 1 1!![{\displaystyle 1/20=0.0\ 0\ 0\ 1\ 1_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/8e8eadc98837f64da224abcf5db1876b0124f2dd)
- 1/24=0.0 0 0 1!![{\displaystyle 1/24=0.0\ 0\ 0\ 1_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/67d6d6d710551b1043b4410d597b47008869b92e)
- 1/30=0.0 0 0 0 4!![{\displaystyle 1/30=0.0\ 0\ 0\ 0\ 4_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/439ac2a7cd90876583e8e27ed1923dd2ea7471b1)
- 1/36=0.0 0 0 0 3 2!![{\displaystyle 1/36=0.0\ 0\ 0\ 0\ 3\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/fa3a414b24a8faea9b786c588bdf4499ea13094b)
- 1/60=0.0 0 0 0 2!![{\displaystyle 1/60=0.0\ 0\ 0\ 0\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/c9a3a152c808559a025f24febc17183c063d28a3)
- 1/72=0.0 0 0 0 1 4!![{\displaystyle 1/72=0.0\ 0\ 0\ 0\ 1\ 4_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/e07a0fcde8588fb92d0646aa7e13b01ebf89153b)
- 1/120=0.0 0 0 0 1!![{\displaystyle 1/120=0.0\ 0\ 0\ 0\ 1_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/defc33e2a88f42a34f73aa05e2b7b9c419e8c7ce)
- 1/144=0.0 0 0 0 0 5!![{\displaystyle 1/144=0.0\ 0\ 0\ 0\ 0\ 5_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/6b5b1f76819a36770881124bbb35b8c23dd73142)
- 1/240=0.0 0 0 0 0 3!![{\displaystyle 1/240=0.0\ 0\ 0\ 0\ 0\ 3_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/e5e9889d652941a3bbb912b9eb77ae7750da40b0)
- 1/360=0.0 0 0 0 0 2!![{\displaystyle 1/360=0.0\ 0\ 0\ 0\ 0\ 2_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/9c7cd337602485c846b4c413392081f085f7907e)
- 1/720=0.0 0 0 0 0 1!![{\displaystyle 1/720=0.0\ 0\ 0\ 0\ 0\ 1_{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/7f72b91478a6db9ff22bc670b111b0c2eac763f9)

There are also a small number of constants that have patterned representations with this method:

- e=1 0.0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1...!![{\displaystyle e=1\ 0.0\ 1\ 1\ 1\ 1\ 1\ 1\ 1\ 1\ 1\ 1\ 1\ 1\ 1\ 1\ 1..._{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4b60e2687d97fa2d0d39a47a5db941a9f0f8a760)
- e−1=0.0 0 2 0 4 0 6 0 8 0 A 0 C 0 E...!![{\displaystyle e^{-1}=0.0\ 0\ 2\ 0\ 4\ 0\ 6\ 0\ 8\ 0\ A\ 0\ C\ 0\ E..._{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/215da74a9870707cde09c74baa81cd21c467ffe0)
- sin⁡(1)=0.0 1 2 0 0 5 6 0 0 9 A 0 0 D E...!![{\displaystyle \sin(1)=0.0\ 1\ 2\ 0\ 0\ 5\ 6\ 0\ 0\ 9\ A\ 0\ 0\ D\ E..._{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/c548ec58a216992a460b4d481a6f83c9398d7a86)
- cos⁡(1)=0.0 1 0 0 4 5 0 0 8 9 0 0 C D 0...!![{\displaystyle \cos(1)=0.0\ 1\ 0\ 0\ 4\ 5\ 0\ 0\ 8\ 9\ 0\ 0\ C\ D\ 0..._{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/6a94198a9726a4f0f9be071263b7da12d44c17df)
- sinh⁡(1)=1.0 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0...!![{\displaystyle \sinh(1)=1.0\ 0\ 1\ 0\ 1\ 0\ 1\ 0\ 1\ 0\ 1\ 0\ 1\ 0\ 1\ 0..._{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/1ee98217a8dbf2ba7faf3244d9ea3ed14e592f2f)
- cosh⁡(1)=1.0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1...!![{\displaystyle \cosh(1)=1.0\ 1\ 0\ 1\ 0\ 1\ 0\ 1\ 0\ 1\ 0\ 1\ 0\ 1\ 0\ 1..._{!}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/56bfd2e4385f84fd646e2dc7b6bd96c38549abe3)

## See also

- [Combinatorial number system](https://en.wikipedia.org/wiki/Combinatorial_number_system "Combinatorial number system") (also called combinadics)
- [Profinite integers](https://en.wikipedia.org/wiki/Profinite_integer "Profinite integer"), which can be represented as infinite digit sequences in the factorial number system