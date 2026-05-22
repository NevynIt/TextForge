# Graphviz DOT examples — 04 Automata, programs, and data structures

Finite-state machines, grammars, tries, program/data-flow examples, Unix graph examples, and larger structural test graphs.

## Documentation links

- [DOT language](https://graphviz.org/doc/info/lang.html)
- [Attributes](https://graphviz.org/docs/attrs/)
- [Node shapes](https://graphviz.org/doc/info/shapes.html)
- [Arrow shapes](https://graphviz.org/doc/info/arrows.html)
- [HTML-like labels](https://graphviz.org/doc/info/shapes.html#html)
- [Command-line tools/layout engines](https://graphviz.org/docs/layouts/)

## Examples

### 1. `dfa.gv`
Source: [graphs/directed/dfa.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/dfa.gv)

```dot
digraph g {
"start" [ label = "MWGC-" ];
"n1" [ label = "WC-MG" ];
"n2" [ label = "MWC-G" ];
"n3" [ label = "C-MWG" ];
"n4" [ label = "W-MGC" ];
"n5" [ label = "MGC-W" ];
"n6" [ label = "MWG-C" ];
"n7" [ label = "G-MWC" ];
"n8" [ label = "MG-WC" ];
"n9" [ label = "-MWGC" ];
"start" -> "n1" [ label = "g" ];
"n1" -> "start" [ label = "g" ];
subgraph l { rank = same; "n3" "n4" }
subgraph r { rank = same; "n5" "n6" }
"n1" -> "n2" [ label = "m" ];
"n2" -> "n1" [ label = "m" ];
"n2" -> "n3" [ label = "w" ];
"n3" -> "n2" [ label = "w" ];
"n2" -> "n4" [ label = "c" ];
"n4" -> "n2" [ label = "c" ];
"n3" -> "n5" [ label = "g" ];
"n5" -> "n3" [ label = "g" ];
"n4" -> "n6" [ label = "g" ];
"n6" -> "n4" [ label = "g" ];
"n5" -> "n7" [ label = "c" ];
"n7" -> "n5" [ label = "c" ];
"n6" -> "n7" [ label = "w" ];
"n7" -> "n6" [ label = "w" ];
"n7" -> "n8" [ label = "m" ];
"n8" -> "n7" [ label = "m" ];
"n8" -> "n9" [ label = "g" ];
"n9" -> "n8" [ label = "g" ];
}
```

### 2. `fsm.gv`
Source: [graphs/directed/fsm.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/fsm.gv)

```dot
digraph finite_state_machine {

	node [shape = doublecircle]; LR_0 LR_3 LR_4 LR_8;
	node [shape = circle];
	rankdir=LR;
	LR_0 -> LR_2 [ label = "SS(B)" ];
	LR_0 -> LR_1 [ label = "SS(S)" ];
	LR_1 -> LR_3 [ label = "S($end)" ];
	LR_2 -> LR_6 [ label = "SS(b)" ];
	LR_2 -> LR_5 [ label = "SS(a)" ];
	LR_2 -> LR_4 [ label = "S(A)" ];
	LR_5 -> LR_7 [ label = "S(b)" ];
	LR_5 -> LR_5 [ label = "S(a)" ];
	LR_6 -> LR_6 [ label = "S(b)" ];
	LR_6 -> LR_5 [ label = "S(a)" ];
	LR_7 -> LR_8 [ label = "S(b)" ];
	LR_7 -> LR_5 [ label = "S(a)" ];
	LR_8 -> LR_6 [ label = "S(b)" ];
	LR_8 -> LR_5 [ label = "S(a)" ];
}
```

### 3. `grammar.gv`
Source: [graphs/directed/grammar.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/grammar.gv)

```dot
digraph L0 {
	size = "8,8";
	ordering=out;
	node [shape = box];

	n0 [label="E"];
	n1 [label="T"];
	n2 [label="F"];
	n3 [label="IDENT : a "];
	n4 [label="+"];
	n5 [label="T"];
	n6 [label="F"];
	n7 [label="("];
	n8 [label="E"];
	n9 [label="T"];
	n10 [label="F"];
	n11 [label="IDENT : b "];
	n12 [label="*"];
	n13 [label="F"];
	n14 [label="IDENT : c "];
	n15 [label=")"];
	n16 [label="*"];
	n17 [label="F"];
	n18 [label="("];
	n19 [label="E"];
	n20 [label="T"];
	n21 [label="F"];
	n22 [label="IDENT : d "];
	n23 [label="*"];
	n24 [label="F"];
	n25 [label="IDENT : e "];
	n26 [label="+"];
	n27 [label="T"];
	n28 [label="F"];
	n29 [label="("];
	n30 [label="E"];
	n31 [label="T"];
	n32 [label="F"];
	n33 [label="IDENT : a "];
	n34 [label="*"];
	n35 [label="F"];
	n36 [label="IDENT : b "];
	n37 [label=")"];
	n38 [label=")"];
	n39 [label="+"];
	n40 [label="T"];
	n41 [label="F"];
	n42 [label="IDENT : q "];
	n0 ->	{ n1 n4 n5 n39 n40 };
	n1 ->	n2 ;
	n2 ->	n3 ;
	n5 ->	{ n6 n16 n17 };
	n6 ->	{ n7 n8 n15 };
	n8 ->	n9 ;
	n9 ->	{ n10 n12 n13 };
	n10 ->	n11 ;
	n13 ->	n14 ;
	n17 ->	{ n18 n19 n38 };
	n19 ->	{ n20 n26 n27 };
	n20 ->	{ n21 n23 n24 };
	n21 ->	n22 ;
	n24 ->	n25 ;
	n27 ->	n28 ;
	n28 ->	{ n29 n30 n37 };
	n30 ->	n31 ;
	n31 ->	{ n32 n34 n35 };
	n32 ->	n33 ;
	n35 ->	n36 ;
	n40 ->	n41 ;
	n41 ->	n42 ;
}
```

### 4. `jcctree.gv`
Source: [graphs/directed/jcctree.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/jcctree.gv)

```dot
digraph "tree" {
// The problem disappeared when I removed the "ELEM3 -> ID5;" line!
//size="4,5";
ordering=out;
node [shape=plaintext];
SPEC -> DEF2;
SPEC -> DEF1;
DEF1 -> ID1;
DEF1 -> SET1;
DEF1 -> SC1;
DEF2 -> ID2;
DEF2 -> SET2;
DEF2 -> SC2;
SET1 -> OPEN1;
SET1 -> ELEM1;
SET1 -> SC3;
SET1 -> ELEM2;
SET1 -> CLOSE1;
ELEM1 -> ID3;
SET2 -> OPEN2;
SET2 -> ELEM3;
SET2 -> CLOSE2;
ELEM2 -> ID4;
ELEM3 -> ID5;
DEF1 [label=DEF];
DEF2 [label=DEF];
SET1 [label=SET];
SC1 [label=";"];
SC3 [label=";"];
SET2 [label=SET];
SC2 [label=";"];
OPEN1 [label="{"];
OPEN2 [label="{"];
CLOSE1 [label="}"];
CLOSE2 [label="}"];
ELEM1 [label=ELEMENT];
ELEM2 [label=ELEMENT];
ELEM3 [label=ELEMENT];
ID1 [label=cities];
ID2 [label=insects];
ID3 [label=andover];
ID4 [label=boston];
ID5 [label=fly];
}
```

### 5. `jsort.gv`
Source: [graphs/directed/jsort.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/jsort.gv)

```dot
digraph prof {
	size="6,4"; ratio = fill;
	node [style=filled];
	start -> main [color="0.002 0.999 0.999"];
	start -> on_exit [color="0.649 0.701 0.701"];
	main -> sort [color="0.348 0.839 0.839"];
	main -> merge [color="0.515 0.762 0.762"];
	main -> term [color="0.647 0.702 0.702"];
	main -> signal [color="0.650 0.700 0.700"];
	main -> sbrk [color="0.650 0.700 0.700"];
	main -> unlink [color="0.650 0.700 0.700"];
	main -> newfile [color="0.650 0.700 0.700"];
	main -> fclose [color="0.650 0.700 0.700"];
	main -> close [color="0.650 0.700 0.700"];
	main -> brk [color="0.650 0.700 0.700"];
	main -> setbuf [color="0.650 0.700 0.700"];
	main -> copyproto [color="0.650 0.700 0.700"];
	main -> initree [color="0.650 0.700 0.700"];
	main -> safeoutfil [color="0.650 0.700 0.700"];
	main -> getpid [color="0.650 0.700 0.700"];
	main -> sprintf [color="0.650 0.700 0.700"];
	main -> creat [color="0.650 0.700 0.700"];
	main -> rem [color="0.650 0.700 0.700"];
	main -> oldfile [color="0.650 0.700 0.700"];
	sort -> msort [color="0.619 0.714 0.714"];
	sort -> filbuf [color="0.650 0.700 0.700"];
	sort -> newfile [color="0.650 0.700 0.700"];
	sort -> fclose [color="0.650 0.700 0.700"];
	sort -> setbuf [color="0.650 0.700 0.700"];
	sort -> setfil [color="0.650 0.700 0.700"];
	msort -> qsort [color="0.650 0.700 0.700"];
	msort -> insert [color="0.650 0.700 0.700"];
	msort -> wline [color="0.650 0.700 0.700"];
	msort -> div [color="0.650 0.700 0.700"];
	msort -> cmpsave [color="0.650 0.700 0.700"];
	merge -> insert [color="0.650 0.700 0.700"];
	merge -> rline [color="0.650 0.700 0.700"];
	merge -> wline [color="0.650 0.700 0.700"];
	merge -> unlink [color="0.650 0.700 0.700"];
	merge -> fopen [color="0.650 0.700 0.700"];
	merge -> fclose [color="0.650 0.700 0.700"];
	merge -> setfil [color="0.650 0.700 0.700"];
	merge -> mul [color="0.650 0.700 0.700"];
	merge -> setbuf [color="0.650 0.700 0.700"];
	merge -> cmpsave [color="0.650 0.700 0.700"];
	insert -> cmpa [color="0.650 0.700 0.700"];
	wline -> flsbuf [color="0.649 0.700 0.700"];
	qsort -> cmpa [color="0.650 0.700 0.700"];
	rline -> filbuf [color="0.649 0.700 0.700"];
	xflsbuf -> write [color="0.650 0.700 0.700"];
	flsbuf -> xflsbuf [color="0.649 0.700 0.700"];
	filbuf -> read [color="0.650 0.700 0.700"];
	term -> unlink [color="0.650 0.700 0.700"];
	term -> signal [color="0.650 0.700 0.700"];
	term -> setfil [color="0.650 0.700 0.700"];
	term -> exit [color="0.650 0.700 0.700"];
	endopen -> open [color="0.650 0.700 0.700"];
	fopen -> endopen [color="0.639 0.705 0.705"];
	fopen -> findiop [color="0.650 0.700 0.700"];
	newfile -> fopen [color="0.634 0.707 0.707"];
	newfile -> setfil [color="0.650 0.700 0.700"];
	fclose -> fflush [color="0.642 0.704 0.704"];
	fclose -> close [color="0.650 0.700 0.700"];
	fflush -> xflsbuf [color="0.635 0.707 0.707"];
	malloc -> morecore [color="0.325 0.850 0.850"];
	malloc -> demote [color="0.650 0.700 0.700"];
	morecore -> sbrk [color="0.650 0.700 0.700"];
	morecore -> getfreehdr [color="0.650 0.700 0.700"];
	morecore -> free [color="0.650 0.700 0.700"];
	morecore -> getpagesize [color="0.650 0.700 0.700"];
	morecore -> putfreehdr [color="0.650 0.700 0.700"];
	morecore -> udiv [color="0.650 0.700 0.700"];
	morecore -> umul [color="0.650 0.700 0.700"];
	on_exit -> malloc [color="0.325 0.850 0.850"];
	signal -> sigvec [color="0.650 0.700 0.700"];
	moncontrol -> profil [color="0.650 0.700 0.700"];
	getfreehdr -> sbrk [color="0.650 0.700 0.700"];
	free -> insert [color="0.650 0.700 0.700"];
	insert -> getfreehdr [color="0.650 0.700 0.700"];
	setfil -> div [color="0.650 0.700 0.700"];
	setfil -> rem [color="0.650 0.700 0.700"];
	sigvec -> sigblock [color="0.650 0.700 0.700"];
	sigvec -> sigsetmask [color="0.650 0.700 0.700"];
	doprnt -> urem [color="0.650 0.700 0.700"];
	doprnt -> udiv [color="0.650 0.700 0.700"];
	doprnt -> strlen [color="0.650 0.700 0.700"];
	doprnt -> localeconv [color="0.650 0.700 0.700"];
	sprintf -> doprnt [color="0.650 0.700 0.700"];
cmpa [color="0.000 1.000 1.000"];
wline [color="0.201 0.753 1.000"];
insert [color="0.305 0.625 1.000"];
rline [color="0.355 0.563 1.000"];
sort [color="0.408 0.498 1.000"];
qsort [color="0.449 0.447 1.000"];
write [color="0.499 0.386 1.000"];
read [color="0.578 0.289 1.000"];
msort [color="0.590 0.273 1.000"];
merge [color="0.603 0.258 1.000"];
unlink [color="0.628 0.227 1.000"];
filbuf [color="0.641 0.212 1.000"];
open [color="0.641 0.212 1.000"];
sbrk [color="0.647 0.204 1.000"];
signal [color="0.647 0.204 1.000"];
moncontrol [color="0.647 0.204 1.000"];
xflsbuf [color="0.650 0.200 1.000"];
flsbuf [color="0.650 0.200 1.000"];
div [color="0.650 0.200 1.000"];
cmpsave [color="0.650 0.200 1.000"];
rem [color="0.650 0.200 1.000"];
setfil [color="0.650 0.200 1.000"];
close [color="0.650 0.200 1.000"];
fclose [color="0.650 0.200 1.000"];
fflush [color="0.650 0.200 1.000"];
setbuf [color="0.650 0.200 1.000"];
endopen [color="0.650 0.200 1.000"];
findiop [color="0.650 0.200 1.000"];
fopen [color="0.650 0.200 1.000"];
mul [color="0.650 0.200 1.000"];
newfile [color="0.650 0.200 1.000"];
sigblock [color="0.650 0.200 1.000"];
sigsetmask [color="0.650 0.200 1.000"];
sigvec [color="0.650 0.200 1.000"];
udiv [color="0.650 0.200 1.000"];
urem [color="0.650 0.200 1.000"];
brk [color="0.650 0.200 1.000"];
getfreehdr [color="0.650 0.200 1.000"];
strlen [color="0.650 0.200 1.000"];
umul [color="0.650 0.200 1.000"];
doprnt [color="0.650 0.200 1.000"];
copyproto [color="0.650 0.200 1.000"];
creat [color="0.650 0.200 1.000"];
demote [color="0.650 0.200 1.000"];
exit [color="0.650 0.200 1.000"];
free [color="0.650 0.200 1.000"];
getpagesize [color="0.650 0.200 1.000"];
getpid [color="0.650 0.200 1.000"];
initree [color="0.650 0.200 1.000"];
insert [color="0.650 0.200 1.000"];
localeconv [color="0.650 0.200 1.000"];
main [color="0.650 0.200 1.000"];
malloc [color="0.650 0.200 1.000"];
morecore [color="0.650 0.200 1.000"];
oldfile [color="0.650 0.200 1.000"];
on_exit [color="0.650 0.200 1.000"];
profil [color="0.650 0.200 1.000"];
putfreehdr [color="0.650 0.200 1.000"];
safeoutfil [color="0.650 0.200 1.000"];
sprintf [color="0.650 0.200 1.000"];
term [color="0.650 0.200 1.000"];
}
```

### 6. `ldbxtried.gv`
Source: [graphs/directed/ldbxtried.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/ldbxtried.gv)

```dot
digraph g {
graph [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
node [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
shape = "box"
color = "black"
width = "0.5"
style = "filled"
];
edge [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"n0" [
label = "18519\n?"
color = "lightblue"
];
"n1" [
label = "4836"
shape = "ellipse"
color = "maroon1"
];
"n2" [
label = "ttyqa"
shape = "ellipse"
color = "maroon1"
];
"n448" [
label = "21079\nlefty"
color = "lightblue"
];
"n449" [
label = "tried.lefty"
shape = "ellipse"
color = "maroon1"
];
"n454" [
fontsize = "7"
label = "bunting\n6000"
shape = "doublecircle"
color = "green"
];
"n460" [
label = ""
shape = "doublecircle"
color = "yellow"
];
"n461" [
label = ""
shape = "doublecircle"
color = "yellow"
];
"n462" [
label = "21084\ntried"
color = "lightblue"
];
"n464" [
label = "21086\nldbx"
color = "lightblue"
];
"n466" [
label = "ldbx"
shape = "ellipse"
color = "maroon1"
];
"n468" [
label = "21087\nlefty"
color = "lightblue"
];
"n469" [
label = "sh21086.1"
shape = "ellipse"
color = "maroon1"
];
"n474" [
fontsize = "7"
label = "bunting\n6000"
shape = "doublecircle"
color = "green"
];
"n479" [
label = "ldbx.lefty"
shape = "ellipse"
color = "maroon1"
];
"n482" [
label = ""
shape = "doublecircle"
color = "yellow"
];
"n483" [
label = ""
shape = "doublecircle"
color = "yellow"
];
"n484" [
label = "21088\ndot"
color = "lightblue"
];
"n486" [
label = ""
shape = "doublecircle"
color = "yellow"
];
"n487" [
label = ""
shape = "doublecircle"
color = "yellow"
];
"n488" [
label = "21089\nxterm"
color = "lightblue"
];
"n496" [
fontsize = "7"
label = "bunting\n6000"
shape = "doublecircle"
color = "green"
];
"n500" [
label = "ptyq2"
shape = "ellipse"
color = "maroon1"
];
"n503" [
label = "21090\nldbxmp"
color = "lightblue"
];
"n505" [
label = "ttyq2"
shape = "ellipse"
color = "maroon1"
];
"n512" [
label = "ptyq5"
shape = "ellipse"
color = "maroon1"
];
"n513" [
label = "ttyq5"
shape = "ellipse"
color = "maroon1"
];
"n514" [
label = "21091\ndbx"
color = "lightblue"
];
"n518" [
label = "tty"
shape = "ellipse"
color = "maroon1"
];
"n526" [
label = "delaunay.c"
shape = "ellipse"
color = "maroon1"
];
subgraph "cluster0" {
graph [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
label = "toucan"
color = "black"
];
node [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
shape = "box"
color = "black"
width = "0.5"
style = "filled"
];
edge [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"n0"
"n468"
"n486"
"n460"
"n487"
"n514"
"n461"
"n488"
"n462"
"n464"
"n482"
"n483"
"n448"
"n484"
"n503"
}
"n0" -> "n1" [
dir = "both"
];
"n0" -> "n2" [
dir = "both"
];
"n0" -> "n2" [
dir = "both"
];
"n0" -> "n2" [
dir = "both"
];
"n0" -> "n448" [
style = "dotted"
];
"n448" -> "n2" [
dir = "both"
];
"n448" -> "n2" [
dir = "both"
];
"n448" -> "n2" [
dir = "both"
];
"n448" -> "n449" [
dir = "back"
];
"n448" -> "n454" [
dir = "both"
];
"n448" -> "n460" [
dir = "back"
];
"n448" -> "n461" [
dir = "forward"
];
"n448" -> "n462" [
style = "dotted"
];
"n462" -> "n2" [
dir = "both"
];
"n462" -> "n2" [
dir = "both"
];
"n462" -> "n2" [
dir = "both"
];
"n462" -> "n449" [
dir = "back"
];
"n462" -> "n460" [
dir = "forward"
];
"n462" -> "n461" [
dir = "back"
];
"n462" -> "n460" [
dir = "forward"
];
"n462" -> "n461" [
dir = "back"
];
"n0" -> "n464" [
style = "dotted"
];
"n464" -> "n2" [
dir = "both"
];
"n464" -> "n2" [
dir = "both"
];
"n464" -> "n2" [
dir = "both"
];
"n464" -> "n466" [
dir = "back"
];
"n464" -> "n468" [
style = "dotted"
];
"n468" -> "n2" [
dir = "both"
];
"n468" -> "n2" [
dir = "both"
];
"n468" -> "n469" [
dir = "back"
];
"n468" -> "n474" [
dir = "both"
];
"n468" -> "n479" [
dir = "back"
];
"n468" -> "n482" [
dir = "back"
];
"n468" -> "n483" [
dir = "forward"
];
"n468" -> "n484" [
style = "dotted"
];
"n484" -> "n2" [
dir = "both"
];
"n484" -> "n483" [
dir = "back"
];
"n484" -> "n479" [
dir = "back"
];
"n484" -> "n482" [
dir = "forward"
];
"n468" -> "n486" [
dir = "back"
];
"n468" -> "n487" [
dir = "forward"
];
"n468" -> "n488" [
style = "dotted"
];
"n488" -> "n486" [
dir = "forward"
];
"n488" -> "n2" [
dir = "both"
];
"n488" -> "n487" [
dir = "back"
];
"n488" -> "n469" [
dir = "back"
];
"n488" -> "n2" [
dir = "both"
];
"n488" -> "n479" [
dir = "back"
];
"n488" -> "n496" [
dir = "both"
];
"n488" -> "n500" [
dir = "both"
];
"n488" -> "n503" [
style = "dotted"
];
"n503" -> "n479" [
dir = "back"
];
"n503" -> "n486" [
dir = "forward"
];
"n503" -> "n487" [
dir = "back"
];
"n503" -> "n505" [
dir = "both"
];
"n503" -> "n505" [
dir = "both"
];
"n503" -> "n505" [
dir = "forward"
];
"n503" -> "n512" [
dir = "both"
];
"n503" -> "n514" [
style = "dotted"
];
"n514" -> "n487" [
dir = "back"
];
"n514" -> "n486" [
dir = "forward"
];
"n514" -> "n479" [
dir = "back"
];
"n514" -> "n505" [
dir = "forward"
];
"n503" -> "n486" [
dir = "forward"
];
"n514" -> "n518" [
dir = "back"
];
"n514" -> "n513" [
dir = "both"
];
"n514" -> "n513" [
dir = "both"
];
"n514" -> "n518" [
dir = "back"
];
"n514" -> "n526" [
dir = "back"
];
"n503" -> "n487" [
dir = "back"
];
}
```

### 7. `mike.gv`
Source: [graphs/directed/mike.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/mike.gv)

```dot
digraph mike{
size = "8,8";
	a -> A;
	a -> m;
	a -> E;
	t -> O;
	r -> V;
	r -> Q;
	p -> B;
	m -> R;
	l -> C;
	c -> C;
	W -> X;
	W -> D;
	V -> W;
	T -> U;
	Q -> T;
	Q -> H;
	Q -> A;
	O -> K;
	L -> U;
	K -> L;
	K -> J;
	K -> E;
	J -> I;
	R -> B;
	P -> F;
	H -> R;
	H -> P;
	U -> H;
	G -> U;
	E -> G;
	C -> Z;
	C -> D;
	S -> D;
	B -> N;
	B -> D;
	B -> S;
	M -> B;
	A -> M;
	N -> Y;
}
```

### 8. `nhg.gv`
Source: [graphs/directed/nhg.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/nhg.gv)

```dot
digraph automata_0 {
	size ="8.5, 11";
	node [shape = circle];
	0 [ style = filled, color=lightgrey ];
	2 [ shape = doublecircle ];
	0 -> 2 [ label = "a " ];
	0 -> 1 [ label = "other " ];
	1 -> 2 [ label = "a " ];
	1 -> 1 [ label = "other " ];
	2 -> 2 [ label = "a " ];
	2 -> 1 [ label = "other " ];
	"Machine: a" [ shape = plaintext ];
}
```

### 9. `pgram.gv`
Source: [graphs/directed/pgram.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/pgram.gv)

```dot
digraph test {

    size="7,9.5";
    page="8,10.5";
    ratio=fill;
    rankdir=LR;

    { rank=same;
      node [shape=house];
      A;C;E;G;I;K;M;O;Q;S;U;W;Y;
      node [shape=invhouse];
      B;D;F;H;J;L;N;P;R;T;V;X;Z;
    }

    { rank=same;
      node [shape=parallelogram];
      "Parallelogram" [label="This is a test\nof a multiline\nlabel in an\nparallelogram with approx\nsquare aspect"];
      "a ----- long thin parallelogram";
      "xx" [label="m"];
      "yy" [label="a\nb\nc\nd\ne\nf"];
      node [shape=octagon];
      "Octagon" [label="This is a test\nof a multiline\nlabel in an\noctagon with approx\nsquare aspect"];
      node [shape=parallelogram];
      "Parallelogram" [label="This is a test\nof a multiline\nlabel in an\nparallelogram with approx\nsquare aspect"];
      "a ----- long thin parallelogram";
      "zz" [label="m"];
      "qq" [label="a\nb\nc\nd\ne\nf"];
      ordering=out;
    }

    Parallelogram -> A;
    Parallelogram -> B;
    Parallelogram -> C;
    Parallelogram -> D;
    Parallelogram -> E;
    Parallelogram -> F;
    Parallelogram -> G;
    Parallelogram -> H;
    Parallelogram -> I;
    Parallelogram -> J;
    Parallelogram -> K;
    Parallelogram -> L;
    Parallelogram -> M;
    Parallelogram -> N;
    Parallelogram -> O;
    Parallelogram -> P;
    Parallelogram -> Q;
    Parallelogram -> R;
    Parallelogram -> S;
    Parallelogram -> T;
    Parallelogram -> U;
    Parallelogram -> V;
    Parallelogram -> W;
    Parallelogram -> X;
    Parallelogram -> Y;
    Parallelogram -> Z;

    { rank=same;
      node [shape=triangle];
      a;c;e;g;i;k;m;o;q;s;u;w;y;
      node [shape=tripleoctagon];
      b;d;f;h;j;l;n;p;r;t;v;x;z;
    }

    a -> Parallelogram -> Octagon;
    b -> Parallelogram -> Octagon;
    c -> Parallelogram -> Octagon;
    d -> Parallelogram -> Octagon;
    e -> Parallelogram -> Octagon;
    f -> Parallelogram -> Octagon;
    g -> Parallelogram -> Octagon;
    h -> Parallelogram -> Octagon;
    i -> Parallelogram -> Octagon;
    j -> Parallelogram -> Octagon;
    k -> Parallelogram -> Octagon;
    l -> Parallelogram -> Octagon;
    m -> Parallelogram -> Octagon;
    n -> Parallelogram -> Octagon;
    o -> Parallelogram -> Octagon;
    p -> Parallelogram -> Octagon;
    q -> Parallelogram -> Octagon;
    r -> Parallelogram -> Octagon;
    s -> Parallelogram -> Octagon;
    t -> Parallelogram -> Octagon;
    u -> Parallelogram -> Octagon;
    v -> Parallelogram -> Octagon;
    w -> Parallelogram -> Octagon;
    x -> Parallelogram -> Octagon;
    y -> Parallelogram -> Octagon;
    z -> Parallelogram -> Octagon;
}
```

### 10. `pm2way.gv`
Source: [graphs/directed/pm2way.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/pm2way.gv)

```dot
digraph g {
graph [
];
node [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
shape = "box"
color = "black"
width = "0.5"
];
edge [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"22690" [
label = "22690\n?"
pname = "?"
kind = "proc"
];
"22692" [
label = "22692\ndotty"
pname = "dotty"
kind = "proc"
];
"116842+2595" [
label = "116842+2595\n/home/ek/work/sun4/bin/dotty"
fname = "/home/ek/work/sun4/bin/dotty"
shape = "ellipse"
kind = "file"
];
"22693" [
label = "22693\nlefty"
pname = "lefty"
kind = "proc"
];
"182440-1" [
label = "182440-1\n182441-1\npipe"
fontsize = "7"
fname = "pipe"
shape = "doublecircle"
subkind = "pipe"
kind = "file"
];
"182442-1" [
label = "182442-1\n182443-1\npipe"
fontsize = "7"
fname = "pipe"
shape = "doublecircle"
subkind = "pipe"
kind = "file"
];
"22694" [
label = "22694\ndot"
pname = "dot"
kind = "proc"
];
"4761+2595" [
label = "4761+2595\n/home/ek/pm2.dot"
fname = "/home/ek/pm2.dot"
shape = "ellipse"
kind = "file"
];
"22690" -> "22692" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"22692" -> "116842+2595" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "back"
color = "black"
];
"22692" -> "22693" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"22693" -> "182440-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "back"
color = "black"
];
"22693" -> "182442-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "forward"
color = "black"
];
"22693" -> "22694" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"22694" -> "182440-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "forward"
color = "black"
];
"22694" -> "182442-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "back"
color = "black"
];
"22693" -> "4761+2595" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "back"
color = "black"
];
}
```

### 11. `pmpipe.gv`
Source: [graphs/directed/pmpipe.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/pmpipe.gv)

```dot
digraph g {
graph [
];
node [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
shape = "box"
color = "black"
width = "0.5"
];
edge [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"23296" [
label = "23296\n?"
pname = "?"
kind = "proc"
];
"182948-1" [
label = "182948-1\n182949-1\npipe"
fontsize = "7"
fname = "pipe"
shape = "doublecircle"
subkind = "pipe"
kind = "file"
];
"23310" [
label = "23310\ncat"
pname = "cat"
kind = "proc"
];
"182950-1" [
label = "182950-1\n182951-1\npipe"
fontsize = "7"
fname = "pipe"
shape = "doublecircle"
subkind = "pipe"
kind = "file"
];
"23311" [
label = "23311\ncat"
pname = "cat"
kind = "proc"
];
"182952-1" [
label = "182952-1\n182953-1\npipe"
fontsize = "7"
fname = "pipe"
shape = "doublecircle"
subkind = "pipe"
kind = "file"
];
"23312" [
label = "23312\ncat"
pname = "cat"
kind = "proc"
];
"182954-1" [
label = "182954-1\n182955-1\npipe"
fontsize = "7"
fname = "pipe"
shape = "doublecircle"
subkind = "pipe"
kind = "file"
];
"23313" [
label = "23313\ncat"
pname = "cat"
kind = "proc"
];
"79893+2568" [
label = "79893+2568\n/usr/share/lib/termcap"
fname = "/usr/share/lib/termcap"
shape = "ellipse"
kind = "file"
];
"85+2560" [
label = "85+2560\n?"
fname = "?"
shape = "ellipse"
kind = "file"
];
"23314" [
label = "23314\ncat"
pname = "cat"
kind = "proc"
];
"4151865284+0" [
label = "4151865284+0\n/tmp/termcap"
fname = "/tmp/termcap"
shape = "ellipse"
kind = "file"
];
"23296" -> "23310" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"23296" -> "23311" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"23311" -> "182948-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "back"
color = "black"
];
"23310" -> "182948-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "forward"
color = "black"
];
"23296" -> "23312" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"23312" -> "182952-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "forward"
color = "black"
];
"23312" -> "182950-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "back"
color = "black"
];
"23296" -> "23313" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"23313" -> "182954-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "forward"
color = "black"
];
"23311" -> "182950-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "forward"
color = "black"
];
"23310" -> "79893+2568" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "back"
color = "black"
];
"23296" -> "85+2560" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "both"
color = "black"
];
"23296" -> "23314" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
color = "black"
];
"23314" -> "85+2560" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "both"
color = "black"
];
"23314" -> "182954-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "back"
color = "black"
];
"23296" -> "85+2560" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "both"
color = "black"
];
"23314" -> "4151865284+0" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "forward"
color = "black"
];
"23313" -> "182952-1" [
fontsize = "14"
fontname = "Times-Roman"
fontcolor = "black"
dir = "back"
color = "black"
];
}
```

### 12. `triedds.gv`
Source: [graphs/directed/triedds.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/triedds.gv)

```dot
digraph g {
graph [
rankdir = "LR"
];
node [
fontsize = "16"
shape = "ellipse"
];
edge [
];
"node0" [
label = "<f0> 0x10ba8| <f1>"
shape = "record"
];
"node1" [
label = "<f0> 0xf7fc4380| <f1> | <f2> |-1"
shape = "record"
];
"node2" [
label = "<f0> 0xf7fc44b8| | |2"
shape = "record"
];
"node3" [
label = "<f0> 3.43322790286038071e-06|44.79998779296875|0"
shape = "record"
];
"node4" [
label = "<f0> 0xf7fc4380| <f1> | <f2> |2"
shape = "record"
];
"node5" [
label = "<f0> (nil)| | |-1"
shape = "record"
];
"node6" [
label = "<f0> 0xf7fc4380| <f1> | <f2> |1"
shape = "record"
];
"node7" [
label = "<f0> 0xf7fc4380| <f1> | <f2> |2"
shape = "record"
];
"node8" [
label = "<f0> (nil)| | |-1"
shape = "record"
];
"node9" [
label = "<f0> (nil)| | |-1"
shape = "record"
];
"node10" [
label = "<f0> (nil)| <f1> | <f2> |-1"
shape = "record"
];
"node11" [
label = "<f0> (nil)| <f1> | <f2> |-1"
shape = "record"
];
"node12" [
label = "<f0> 0xf7fc43e0| | |1"
shape = "record"
];
"node0":f0 -> "node1":f0 [
id = 0
];
"node0":f1 -> "node2":f0 [
id = 1
];
"node1":f0 -> "node3":f0 [
id = 2
];
"node1":f1 -> "node4":f0 [
id = 3
];
"node1":f2 -> "node5":f0 [
id = 4
];
"node4":f0 -> "node3":f0 [
id = 5
];
"node4":f1 -> "node6":f0 [
id = 6
];
"node4":f2 -> "node10":f0 [
id = 7
];
"node6":f0 -> "node3":f0 [
id = 8
];
"node6":f1 -> "node7":f0 [
id = 9
];
"node6":f2 -> "node9":f0 [
id = 10
];
"node7":f0 -> "node3":f0 [
id = 11
];
"node7":f1 -> "node1":f0 [
id = 12
];
"node7":f2 -> "node8":f0 [
id = 13
];
"node10":f1 -> "node11":f0 [
id = 14
];
"node10":f2 -> "node12":f0 [
id = 15
];
"node11":f2 -> "node1":f0 [
id = 16
];
}
```

### 13. `unix.gv`
Source: [graphs/directed/unix.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/unix.gv)

```dot
/* courtesy Ian Darwin and Geoff Collyer, Softquad Inc. */
digraph unix {
size="6,6";
	"5th Edition" -> "6th Edition";
	"5th Edition" -> "PWB 1.0";
	"6th Edition" -> "LSX";
	"6th Edition" -> "1 BSD";
	"6th Edition" -> "Mini Unix";
	"6th Edition" -> "Wollongong";
	"6th Edition" -> "Interdata";
	"Interdata" -> "Unix/TS 3.0";
	"Interdata" -> "PWB 2.0";
	"Interdata" -> "7th Edition";
	"7th Edition" -> "8th Edition";
	"7th Edition" -> "32V";
	"7th Edition" -> "V7M";
	"7th Edition" -> "Ultrix-11";
	"7th Edition" -> "Xenix";
	"7th Edition" -> "UniPlus+";
	"V7M" -> "Ultrix-11";
	"8th Edition" -> "9th Edition";
	"1 BSD" -> "2 BSD";
	"2 BSD" -> "2.8 BSD";
	"2.8 BSD" -> "Ultrix-11";
	"2.8 BSD" -> "2.9 BSD";
	"32V" -> "3 BSD";
	"3 BSD" -> "4 BSD";
	"4 BSD" -> "4.1 BSD";
	"4.1 BSD" -> "4.2 BSD";
	"4.1 BSD" -> "2.8 BSD";
	"4.1 BSD" -> "8th Edition";
	"4.2 BSD" -> "4.3 BSD";
	"4.2 BSD" -> "Ultrix-32";
	"PWB 1.0" -> "PWB 1.2";
	"PWB 1.0" -> "USG 1.0";
	"PWB 1.2" -> "PWB 2.0";
	"USG 1.0" -> "CB Unix 1";
	"USG 1.0" -> "USG 2.0";
	"CB Unix 1" -> "CB Unix 2";
	"CB Unix 2" -> "CB Unix 3";
	"CB Unix 3" -> "Unix/TS++";
	"CB Unix 3" -> "PDP-11 Sys V";
	"USG 2.0" -> "USG 3.0";
	"USG 3.0" -> "Unix/TS 3.0";
	"PWB 2.0" -> "Unix/TS 3.0";
	"Unix/TS 1.0" -> "Unix/TS 3.0";
	"Unix/TS 3.0" -> "TS 4.0";
	"Unix/TS++" -> "TS 4.0";
	"CB Unix 3" -> "TS 4.0";
	"TS 4.0" -> "System V.0";
	"System V.0" -> "System V.2";
	"System V.2" -> "System V.3";
}
```

### 14. `unix2.gv`
Source: [graphs/directed/unix2.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/unix2.gv)

```dot
/* Courtesy of Ian Darwin <ian@darwinsys.com>
 * and Geoff Collyer <geoff@plan9.bell-labs.com>
 * Mildly updated by Ian Darwin in 2000.
 */
digraph unix {
	size="6,6";
	node [color=lightblue2, style=filled];
	"5th Edition" -> "6th Edition";
	"5th Edition" -> "PWB 1.0";
	"6th Edition" -> "LSX";
	"6th Edition" -> "1 BSD";
	"6th Edition" -> "Mini Unix";
	"6th Edition" -> "Wollongong";
	"6th Edition" -> "Interdata";
	"Interdata" -> "Unix/TS 3.0";
	"Interdata" -> "PWB 2.0";
	"Interdata" -> "7th Edition";
	"7th Edition" -> "8th Edition";
	"7th Edition" -> "32V";
	"7th Edition" -> "V7M";
	"7th Edition" -> "Ultrix-11";
	"7th Edition" -> "Xenix";
	"7th Edition" -> "UniPlus+";
	"V7M" -> "Ultrix-11";
	"8th Edition" -> "9th Edition";
	"9th Edition" -> "10th Edition";
	"1 BSD" -> "2 BSD";
	"2 BSD" -> "2.8 BSD";
	"2.8 BSD" -> "Ultrix-11";
	"2.8 BSD" -> "2.9 BSD";
	"32V" -> "3 BSD";
	"3 BSD" -> "4 BSD";
	"4 BSD" -> "4.1 BSD";
	"4.1 BSD" -> "4.2 BSD";
	"4.1 BSD" -> "2.8 BSD";
	"4.1 BSD" -> "8th Edition";
	"4.2 BSD" -> "4.3 BSD";
	"4.2 BSD" -> "Ultrix-32";
	"4.3 BSD" -> "4.4 BSD";
	"4.4 BSD" -> "FreeBSD";
	"4.4 BSD" -> "NetBSD";
	"4.4 BSD" -> "OpenBSD";
	"PWB 1.0" -> "PWB 1.2";
	"PWB 1.0" -> "USG 1.0";
	"PWB 1.2" -> "PWB 2.0";
	"USG 1.0" -> "CB Unix 1";
	"USG 1.0" -> "USG 2.0";
	"CB Unix 1" -> "CB Unix 2";
	"CB Unix 2" -> "CB Unix 3";
	"CB Unix 3" -> "Unix/TS++";
	"CB Unix 3" -> "PDP-11 Sys V";
	"USG 2.0" -> "USG 3.0";
	"USG 3.0" -> "Unix/TS 3.0";
	"PWB 2.0" -> "Unix/TS 3.0";
	"Unix/TS 1.0" -> "Unix/TS 3.0";
	"Unix/TS 3.0" -> "TS 4.0";
	"Unix/TS++" -> "TS 4.0";
	"CB Unix 3" -> "TS 4.0";
	"TS 4.0" -> "System V.0";
	"System V.0" -> "System V.2";
	"System V.2" -> "System V.3";
	"System V.3" -> "System V.4";
}
```

### 15. `viewfile.gv`
Source: [graphs/directed/viewfile.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/viewfile.gv)

```dot
digraph Viewfile {
node [ style = filled ];
atoi [color=green];
chkmalloc [color=green];
close [color=green];
error [color=blue];
exit [color=blue];
fclose [color=green];
fgets [color=red];
fopen [color=green];
fprintf [color=blue];
free [color=blue];
free_list [color=blue];
fstat [color=green];
getopt [color=green];
init_list [color=green];
insert_list [color=green];
main [color=green];
makeargs [color=blue];
makepairs [color=green];
malloc [color=green];
open [color=green];
printf [color=red];
read [color=green];
rewind [color=green];
viewline [color=green];
viewlines [color=green];
walk_list [color=green];
write [color=green];
fclose -> close [color=green];
fgets -> fstat [color=green];
fgets -> read [color=green];
fopen -> open [color=green];
printf -> write [color=green];
main -> fgets [color=blue];
main -> getopt [color=green];
main -> makeargs [color=blue];
main -> makepairs [color=green];
main -> chkmalloc [color=green];
main -> error [color=blue];
main -> viewlines [color=green];
makeargs -> chkmalloc [color=blue];
makepairs -> atoi [color=green];
makepairs -> init_list [color=green];
makepairs -> insert_list [color=green];
makepairs -> chkmalloc [color=green];
free_list -> free [color=blue];
init_list -> chkmalloc [color=green];
insert_list -> chkmalloc [color=green];
walk_list -> error [color=blue];
walk_list -> viewline [color=green];
chkmalloc -> malloc [color=green];
chkmalloc -> error [color=blue];
error -> exit [color=blue];
error -> fprintf [color=blue];
error -> error [color=blue];
viewline -> fgets [color=red];
viewline -> printf [color=red];
viewline -> rewind [color=green];
viewlines -> fclose [color=green];
viewlines -> fopen [color=green];
viewlines -> walk_list [color=green];
viewlines -> viewline [color=blue];
}
```

### 16. `switch.gv`
Source: [graphs/directed/switch.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/switch.gv)

```dot
digraph G {
	graph [center=true rankdir=LR bgcolor="#808080"]
	edge [dir=none]
	node [width=0.3 height=0.3 label=""]
	{ node [shape=circle style=invis]
		1 2 3 4 5 6 7 8  10 20 30 40 50 60 70 80
	}
	{ node [shape=circle]
		a b c d e f g h  i j k l m n o p  q r s t u v w x
	}
	{ node [shape=diamond]
		A B C D E F G H  I J K L M N O P  Q R S T U V W X
	}
	1 -> a -> {A B} [color="#0000ff"]
	2 -> b -> {B A} [color="#ff0000"]
	3 -> c -> {C D} [color="#ffff00"]
	4 -> d -> {D C} [color="#00ff00"]
	5 -> e -> {E F} [color="#000000"]
	6 -> f -> {F E} [color="#00ffff"]
	7 -> g -> {G H} [color="#ffffff"]
	8 -> h -> {H G} [color="#ff00ff"]
	{ edge [color="#ff0000:#0000ff"]
		A -> i -> {I K}
		B -> j -> {J L}
	}
	{ edge [color="#00ff00:#ffff00"]
		C -> k -> {K I}
		D -> l -> {L J}
	}
	{ edge [color="#00ffff:#000000"]
		E -> m -> {M O}
		F -> n -> {N P}
	}
	{ edge [color="#ff00ff:#ffffff"]
		G -> o -> {O M}
		H -> p -> {P N}
	}
	{ edge [color="#00ff00:#ffff00:#ff0000:#0000ff"]
		I -> q -> {Q U}
		J -> r -> {R V}
		K -> s -> {S W}
		L -> t -> {T X}
	}
	{ edge [color="#ff00ff:#ffffff:#00ffff:#000000"]
		M -> u -> {U Q}
		N -> v -> {V R}
		O -> w -> {W S}
		P -> x -> {X T}
	}
	{ edge [color="#ff00ff:#ffffff:#00ffff:#000000:#00ff00:#ffff00:#ff0000:#0000ff"]
		Q -> 10
		R -> 20
		S -> 30
		T -> 40
		U -> 50
		V -> 60
		W -> 70
		X -> 80
	}
}
```
