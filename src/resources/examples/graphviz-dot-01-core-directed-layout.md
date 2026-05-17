# Graphviz DOT examples — 01 Core directed layout

Basic directed graphs, layered layout stress tests, compact examples, and general graph topology tests.

## Documentation links

- [DOT language](https://graphviz.org/doc/info/lang.html)
- [Attributes](https://graphviz.org/docs/attrs/)
- [Node shapes](https://graphviz.org/doc/info/shapes.html)
- [Arrow shapes](https://graphviz.org/doc/info/arrows.html)
- [HTML-like labels](https://graphviz.org/doc/info/shapes.html#html)
- [Command-line tools/layout engines](https://graphviz.org/docs/layouts/)

## Examples

### 1. `KW91.gv`
Source: [graphs/directed/KW91.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/KW91.gv)

```dot
digraph G {
	style=bold;
	subgraph cluster_outer {
		Act_1 -> Act_21;
		Act_1 -> Act_23;
		Act_25 -> Act_3;
		subgraph cluster_inner {
			label = "                          Act_2";
			{Act_21 -> Act_22 [minlen=2]; rank=same;}
			Act_22 -> Act_23;
			Act_22 -> Act_24;
			{Act_23 -> Act_24 [minlen=2]; rank=same;}
			Act_23 -> Act_25;
			Act_24 -> Act_25;
		}
	}
	Ext_1 -> Act_1;
	Act_3 -> Ext_2;
	Ext_3 -> Act_24;
}
```

### 2. `NaN.gv`
Source: [graphs/directed/NaN.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/NaN.gv)

```dot
digraph xyz {
orientation=landscape;
ratio=compress;
size="16,10";
AbstractMemory -> Memory;
AliasedMemory -> AliasedMemory;
AliasedMemory -> Memory;
Architecture -> ROOT;
Assembly -> ROOT;
AtomProperties -> NRAtom;
AtomWr -> Wr;
Break -> Break;
Break -> Target;
Breakpoint -> Breakpoint;
Breakpoint -> Event;
Breakpoint -> ROOT;
CDB -> Target;
CDB -> Thread;
CommonFrame -> Target;
ControlOps -> InterpF;
Displayed -> Displayed;
Displayed -> InterpTypes;
ETimer -> RTHeapRep;
Event -> Event;
Event -> ROOT;
Event -> Target;
EventHandler -> ROOT;
EventHandler -> StandardEvents;
Expression -> ROOT;
ExpressionServer -> Expression;
FollowBreakpoint -> Breakpoint;
Formatter -> ROOT;
Formatter -> Thread;
Frame -> Frame;
Frame -> Memory;
Frame -> Target;
FrameClass -> Frame;
IntIntTbl -> IntIntTbl;
IntIntTbl -> ROOT;
Interp -> InterpF;
Interp -> ROOT;
InterpF -> Interp;
InterpF -> InterpF;
InterpF -> ROOT;
InterpScan -> TokenStream;
InterpTypes -> InterpTypes;
InterpTypes -> ROOT;
List -> Thread;
LoadState -> LoadState;
LoadState -> LoadStateRep;
LoadState -> ROOT;
LoadStateRep -> LoadState;
LocationRep -> Memory;
MC68Frame -> CommonFrame;
MC68GCommonFrame -> EventHandler;
MUTEX  -> ROOT;
Memory -> Displayed;
Memory -> InterpTypes;
MipsFrame -> CommonFrame;
MipsFrame -> InterpTypes;
MipsGCommonFrame -> EventHandler;
NRAtom -> AtomProperties;
NRAtom -> ROOT;
NopBreakpoint -> Breakpoint;
PSFormatter -> InterpTypes;
PSInterp -> InterpTypes;
PSLoadState -> InterpTypes;
PSMemory -> InterpTypes;
ProtectedWire -> ProtectedWire;
ProtectedWire -> Wire;
RTHeap -> RTHeapRep;
RTHeapRep -> ROOT;
Rd -> RdClass;
RdClass -> MUTEX;
RegisterMemory -> Memory;
Scope -> ROOT;
Scope -> Scope;
Scope -> Target;
SourceLoc -> Target;
SourceMap -> ROOT;
SparcFrame -> CommonFrame;
SparcGCommonFrame -> EventHandler;
StandardEvents -> StandardEvents;
StandardEvents -> Target;
StreamWire -> Wire;
Symbol -> Displayed;
Symbol -> Symbol;
TThread -> ROOT;
TThread -> Target;
Target -> Displayed;
Target -> Event;
Target -> FrameClass;
Target -> ROOT;
Target -> TThread;
Target -> Target;
Target -> TargetF;
Target -> Thread;
TargetF -> Target;
TargetState -> Assembly;
TextRd -> Rd;
TextWr -> Wr;
Thread -> ROOT;
Thread -> Thread;
TokenStream -> ROOT;
TokenStream -> TokenStream;
Trap -> ROOT;
TrapMemory -> Memory;
UFileRd -> Rd;
UFileRd -> UFileRd;
UFileWr -> UFileWr;
UFileWr -> Wr;
UnixHandler -> Event;
UnixHandler -> UnixHandler;
UserBreak -> Break;
UserBreak -> Breakpoint;
UserBreak -> Event;
UserBreak -> Trap;
UserBreak -> UserBreak;
VaxFrame -> CommonFrame;
VaxGCommonFrame -> EventHandler;
Wire -> ROOT;
Wire -> TrapMemory;
Wire -> Wire;
Wr -> WrClass;
WrClass -> MUTEX;
}
```

### 3. `abstract.gv`
Source: [graphs/directed/abstract.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/abstract.gv)

```dot
digraph abstract {
	size="6,6";
	S24 -> 27;
	S24 -> 25;
	S1 -> 10;
	S1 -> 2;
	S35 -> 36;
	S35 -> 43;
	S30 -> 31;
	S30 -> 33;
	9 -> 42;
	9 -> T1;
	25 -> T1;
	25 -> 26;
	27 -> T24;
	2 -> 3;
	2 -> 16;
	2 -> 17;
	2 -> T1;
	2 -> 18;
	10 -> 11;
	10 -> 14;
	10 -> T1;
	10 -> 13;
	10 -> 12;
	31 -> T1;
	31 -> 32;
	33 -> T30;
	33 -> 34;
	42 -> 4;
	26 -> 4;
	3 -> 4;
	16 -> 15;
	17 -> 19;
	18 -> 29;
	11 -> 4;
	14 -> 15;
	37 -> 39;
	37 -> 41;
	37 -> 38;
	37 -> 40;
	13 -> 19;
	12 -> 29;
	43 -> 38;
	43 -> 40;
	36 -> 19;
	32 -> 23;
	34 -> 29;
	39 -> 15;
	41 -> 29;
	38 -> 4;
	40 -> 19;
	4 -> 5;
	19 -> 21;
	19 -> 20;
	19 -> 28;
	5 -> 6;
	5 -> T35;
	5 -> 23;
	21 -> 22;
	20 -> 15;
	28 -> 29;
	6 -> 7;
	15 -> T1;
	22 -> 23;
	22 -> T35;
	29 -> T30;
	7 -> T8;
	23 -> T24;
	23 -> T1;
}
```

### 4. `alf.gv`
Source: [graphs/directed/alf.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/alf.gv)

```dot
digraph Alf {
size = "6,9";
node [ shape = record ];
Decl [ label = "\n\nDecl|{name|access|decl_flags|extern_c_linkage}"];
Nontype_decl [ label = "Nontype_decl|{type}"];
Defined_decl [ label = "Defined_decl|{linkage}"];
Data_decl [ label = "Data_decl|{storage_class}"];
Function_decl [ label = "Function_decl|{formals|defaults}"];
Data [ label = "Data|{initializer}"];
Function [ label = "Function|{body}"];
Constructor [ label = "Constructor|{member_initializers}"];
Aggregate ->  Type_decl ;
Class -> Aggregate;
Union -> Aggregate;
Data -> Data_decl;
Data -> Defn;
Data_decl -> Defined_decl;
Data_member ->  Nontype_decl ;
Defined_decl -> Nontype_decl;
Defn -> Defined_decl;
Enum ->  Type_decl ;
Enumerator ->  Nontype_decl ;
Function -> Defn;
Function -> Function_decl;
Constructor -> Function;
Destructor -> Function;
Function_decl -> Defined_decl;
Nontype_decl ->  Decl ;
Template_type_arg ->  Type_decl ;
Type_decl ->  Decl ;
Typedef ->  Type_decl ;
}
```

### 5. `crazy.gv`
Source: [graphs/directed/crazy.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/crazy.gv)

```dot
digraph "unix" {
	graph [	fontname = "Helvetica-Oblique",
		fontsize = 36,
		label = "\n\n\n\nObject Oriented Graphs\nStephen North, 3/19/93",
		size = "6,6" ];
	node [	shape = polygon,
		sides = 4,
		distortion = "0.0",
		orientation = "0.0",
		skew = "0.0",
		color = white,
		style = filled,
		fontname = "Helvetica-Outline" ];
	"5th Edition" [sides=9, distortion="0.936354", orientation=28, skew="-0.126818", color=salmon2];
	"6th Edition" [sides=5, distortion="0.238792", orientation=11, skew="0.995935", color=deepskyblue];
	"PWB 1.0" [sides=8, distortion="0.019636", orientation=79, skew="-0.440424", color=goldenrod2];
	LSX [sides=9, distortion="-0.698271", orientation=22, skew="-0.195492", color=burlywood2];
	"1 BSD" [sides=7, distortion="0.265084", orientation=26, skew="0.403659", color=gold1];
	"Mini Unix" [distortion="0.039386", orientation=2, skew="-0.461120", color=greenyellow];
	Wollongong [sides=5, distortion="0.228564", orientation=63, skew="-0.062846", color=darkseagreen];
	Interdata [distortion="0.624013", orientation=56, skew="0.101396", color=dodgerblue1];
	"Unix/TS 3.0" [sides=8, distortion="0.731383", orientation=43, skew="-0.824612", color=thistle2];
	"PWB 2.0" [sides=6, distortion="0.592100", orientation=34, skew="-0.719269", color=darkolivegreen3];
	"7th Edition" [sides=10, distortion="0.298417", orientation=65, skew="0.310367", color=chocolate];
	"8th Edition" [distortion="-0.997093", orientation=50, skew="-0.061117", color=turquoise3];
	"32V" [sides=7, distortion="0.878516", orientation=19, skew="0.592905", color=steelblue3];
	V7M [sides=10, distortion="-0.960249", orientation=32, skew="0.460424", color=navy];
	"Ultrix-11" [sides=10, distortion="-0.633186", orientation=10, skew="0.333125", color=darkseagreen4];
	Xenix [sides=8, distortion="-0.337997", orientation=52, skew="-0.760726", color=coral];
	"UniPlus+" [sides=7, distortion="0.788483", orientation=39, skew="-0.526284", color=darkolivegreen3];
	"9th Edition" [sides=7, distortion="0.138690", orientation=55, skew="0.554049", color=coral3];
	"2 BSD" [sides=7, distortion="-0.010661", orientation=84, skew="0.179249", color=blanchedalmond];
	"2.8 BSD" [distortion="-0.239422", orientation=44, skew="0.053841", color=lightskyblue1];
	"2.9 BSD" [distortion="-0.843381", orientation=70, skew="-0.601395", color=aquamarine2];
	"3 BSD" [sides=10, distortion="0.251820", orientation=18, skew="-0.530618", color=lemonchiffon];
	"4 BSD" [sides=5, distortion="-0.772300", orientation=24, skew="-0.028475", color=darkorange1];
	"4.1 BSD" [distortion="-0.226170", orientation=38, skew="0.504053", color=lightyellow1];
	"4.2 BSD" [sides=10, distortion="-0.807349", orientation=50, skew="-0.908842", color=darkorchid4];
	"4.3 BSD" [sides=10, distortion="-0.030619", orientation=76, skew="0.985021", color=lemonchiffon2];
	"Ultrix-32" [distortion="-0.644209", orientation=21, skew="0.307836", color=goldenrod3];
	"PWB 1.2" [sides=7, distortion="0.640971", orientation=84, skew="-0.768455", color=cyan];
	"USG 1.0" [distortion="0.758942", orientation=42, skew="0.039886", color=blue];
	"CB Unix 1" [sides=9, distortion="-0.348692", orientation=42, skew="0.767058", color=firebrick];
	"USG 2.0" [distortion="0.748625", orientation=74, skew="-0.647656", color=chartreuse4];
	"CB Unix 2" [sides=10, distortion="0.851818", orientation=32, skew="-0.020120", color=greenyellow];
	"CB Unix 3" [sides=10, distortion="0.992237", orientation=29, skew="0.256102", color=bisque4];
	"Unix/TS++" [sides=6, distortion="0.545461", orientation=16, skew="0.313589", color=mistyrose2];
	"PDP-11 Sys V" [sides=9, distortion="-0.267769", orientation=40, skew="0.271226", color=cadetblue1];
	"USG 3.0" [distortion="-0.848455", orientation=44, skew="0.267152", color=bisque2];
	"Unix/TS 1.0" [distortion="0.305594", orientation=75, skew="0.070516", color=orangered];
	"TS 4.0" [sides=10, distortion="-0.641701", orientation=50, skew="-0.952502", color=crimson];
	"System V.0" [sides=9, distortion="0.021556", orientation=26, skew="-0.729938", color=darkorange1];
	"System V.2" [sides=6, distortion="0.985153", orientation=33, skew="-0.399752", color=darkolivegreen4];
	"System V.3" [sides=7, distortion="-0.687574", orientation=58, skew="-0.180116", color=lightsteelblue1];
	"5th Edition" -> "6th Edition";
	"5th Edition" -> "PWB 1.0";
	"6th Edition" -> LSX;
	"6th Edition" -> "1 BSD";
	"6th Edition" -> "Mini Unix";
	"6th Edition" -> Wollongong;
	"6th Edition" -> Interdata;
	Interdata -> "Unix/TS 3.0";
	Interdata -> "PWB 2.0";
	Interdata -> "7th Edition";
	"7th Edition" -> "8th Edition";
	"7th Edition" -> "32V";
	"7th Edition" -> V7M;
	"7th Edition" -> "Ultrix-11";
	"7th Edition" -> Xenix;
	"7th Edition" -> "UniPlus+";
	V7M -> "Ultrix-11";
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

### 6. `longflat.gv`
Source: [graphs/directed/longflat.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/longflat.gv)

```dot
digraph if
{
rankdir=LR;
  {rank=same;b;c;}
  a->b;
  c->b[label="long long long"];
}
```

### 7. `rowe.gv`
Source: [graphs/directed/rowe.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/rowe.gv)

```dot
digraph rowe {
	node [shape  = box];
	size = "6,6";
	1 -> 2;
	1 -> 10;
	10 -> 14;
	10 -> 12;
	10 -> 13;
	10 -> 11;
	2 -> 18;
	2 -> 17;
	2 -> 16;
	2 -> 3;
	11 -> 4;
	16 -> 4;
	3 -> 4;
	4 -> 5;
	13 -> 19;
	17 -> 19;
	5 -> 23;
	5 -> 35;
	5 -> 6;
	37 -> 39;
	37 -> 41;
	37 -> 40;
	37 -> 38;
	19 -> 20;
	19 -> 28;
	19 -> 21;
	12 -> 29;
	18 -> 29;
	41 -> 29;
	28 -> 29;
	29 -> 30;
	30 -> 31;
	30 -> 33;
	31 -> 32;
	21 -> 22;
	32 -> 23;
	22 -> 23;
	6 -> 7;
	23 -> 24;
	7 -> 8;
	24 -> 25;
	24 -> 27;
	35 -> 43;
	35 -> 36;
	8 -> 9;
	14 -> 15;
	39 -> 15;
	20 -> 15;
	33 -> 34;
	43 -> 40;
	43 -> 38;
	25 -> 26;
	9 -> 42;
	10 -> 1;
	15 -> 1;
	23 -> 1;
	31 -> 1;
	2 -> 1;
	25 -> 1;
	9 -> 1;
	38 -> 4;
	26 -> 4;
	42 -> 4;
	40 -> 19;
	36 -> 19;
	34 -> 29;
	33 -> 30;
	27 -> 24;
}
```

### 8. `tree.gv`
Source: [graphs/directed/tree.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/tree.gv)

```dot
digraph g {
node [shape = record,height=.1];
node0[label = "<f0> |<f1> G|<f2> "];
node1[label = "<f0> |<f1> E|<f2> "];
node2[label = "<f0> |<f1> B|<f2> "];
node3[label = "<f0> |<f1> F|<f2> "];
node4[label = "<f0> |<f1> R|<f2> "];
node5[label = "<f0> |<f1> H|<f2> "];
node6[label = "<f0> |<f1> Y|<f2> "];
node7[label = "<f0> |<f1> A|<f2> "];
node8[label = "<f0> |<f1> C|<f2> "];
"node0":f2 -> "node4":f1;
"node0":f0 -> "node1":f1;
"node1":f0 -> "node2":f1;
"node1":f2 -> "node3":f1;
"node2":f2 -> "node8":f1;
"node2":f0 -> "node7":f1;
"node4":f2 -> "node6":f1;
"node4":f0 -> "node5":f1;
}
```

### 9. `try.gv`
Source: [graphs/directed/try.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/try.gv)

```dot
digraph G {
	subgraph cluster_small {
		a -> b;
		label=small;
	}

	subgraph cluster_big {
		p -> q -> r -> s -> t;
		label=big;
		t -> p;
	}

	t -> a;
	b -> q;
}
```

### 10. `world.gv`
Source: [graphs/directed/world.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/world.gv)

```dot
digraph world {
size="7,7";
	{rank=same; S8 S24 S1 S35 S30;}
	{rank=same; T8 T24 T1 T35 T30;}
	{rank=same; 43 37 36 10 2;}
	{rank=same; 25 9 38 40 13 17 12 18;}
	{rank=same; 26 42 11 3 33 19 39 14 16;}
	{rank=same; 4 31 34 21 41 28 20;}
	{rank=same; 27 5 22 32 29 15;}
	{rank=same; 6 23;}
	{rank=same; 7;}

	S8 -> 9;
	S24 -> 25;
	S24 -> 27;
	S1 -> 2;
	S1 -> 10;
	S35 -> 43;
	S35 -> 36;
	S30 -> 31;
	S30 -> 33;
	9 -> 42;
	9 -> T1;
	25 -> T1;
	25 -> 26;
	27 -> T24;
	2 -> {3 ; 16 ; 17 ; T1 ; 18}
	10 -> { 11 ; 14 ; T1 ; 13; 12;}
	31 -> T1;
	31 -> 32;
	33 -> T30;
	33 -> 34;
	42 -> 4;
	26 -> 4;
	3 -> 4;
	16 -> 15;
	17 -> 19;
	18 -> 29;
	11 -> 4;
	14 -> 15;
	37 -> {39 ; 41 ; 38 ; 40;}
	13 -> 19;
	12 -> 29;
	43 -> 38;
	43 -> 40;
	36 -> 19;
	32 -> 23;
	34 -> 29;
	39 -> 15;
	41 -> 29;
	38 -> 4;
	40 -> 19;
	4 -> 5;
	19 -> {21 ; 20 ; 28;}
	5 -> {6 ; T35 ; 23;}
	21 -> 22;
	20 -> 15;
	28 -> 29;
	6 -> 7;
	15 -> T1;
	22 -> T35;
	22 -> 23;
	29 -> T30;
	7 -> T8;
	23 -> T24;
	23 -> T1;
}
```
