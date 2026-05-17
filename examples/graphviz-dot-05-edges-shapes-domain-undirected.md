# Graphviz DOT examples — 05 Edges, shapes, domain models, and undirected graphs

Arrowhead/edge variants, domain-specific directed examples, polygon/shape tests, and all undirected Graphviz examples.

## Documentation links

- [DOT language](https://graphviz.org/doc/info/lang.html)
- [Attributes](https://graphviz.org/docs/attrs/)
- [Node shapes](https://graphviz.org/doc/info/shapes.html)
- [Arrow shapes](https://graphviz.org/doc/info/arrows.html)
- [HTML-like labels](https://graphviz.org/doc/info/shapes.html#html)
- [Command-line tools/layout engines](https://graphviz.org/docs/layouts/)

## Examples

### 1. `arrows.gv`
Source: [graphs/directed/arrows.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/arrows.gv)

```dot
digraph G {
	graph [rankdir=LR nodesep=0]
	node [shape=point label=""]
	edge [fontsize=10]
	_box -> box [arrowhead=box label=box]
	box -> boxbox [arrowhead=boxbox label=boxbox]
	_box -> lbox [arrowhead=lbox label=lbox]
	lbox -> lboxlbox [arrowhead=lboxlbox label=lboxlbox]
	_box -> rbox [arrowhead=rbox label=rbox]
	rbox -> rboxrbox [arrowhead=rboxrbox label=rboxrbox]
	_box -> olbox [arrowhead=olbox label=olbox]
	olbox -> olboxolbox [arrowhead=olboxolbox label=olboxolbox]
	_box -> orbox [arrowhead=orbox label=orbox]
	orbox -> orboxorbox [arrowhead=orboxorbox label=orboxorbox]
	_box -> obox [arrowhead=obox label=obox]
	obox -> oboxobox [arrowhead=oboxobox label=oboxobox]
	_crow -> crow [arrowhead=crow label=crow]
	crow -> crowcrow [arrowhead=crowcrow label=crowcrow]
	_crow -> lcrow [arrowhead=lcrow label=lcrow]
	lcrow -> lcrowlcrow [arrowhead=lcrowlcrow label=lcrowlcrow]
	_crow -> rcrow [arrowhead=rcrow label=rcrow]
	rcrow -> rcrowrcrow [arrowhead=rcrowrcrow label=rcrowrcrow]
	_diamond -> diamond [arrowhead=diamond label=diamond]
	diamond -> diamonddiamond [arrowhead=diamonddiamond label=diamonddiamond]
	_diamond -> ldiamond [arrowhead=ldiamond label=ldiamond]
	ldiamond -> ldiamondldiamond [arrowhead=ldiamondldiamond label=ldiamondldiamond]
	_diamond -> rdiamond [arrowhead=rdiamond label=rdiamond]
	rdiamond -> rdiamondrdiamond [arrowhead=rdiamondrdiamond label=rdiamondrdiamond]
	_diamond -> oldiamond [arrowhead=oldiamond label=oldiamond]
	oldiamond -> oldiamondoldiamond [arrowhead=oldiamondoldiamond label=oldiamondoldiamond]
	_diamond -> ordiamond [arrowhead=ordiamond label=ordiamond]
	ordiamond -> ordiamondordiamond [arrowhead=ordiamondordiamond label=ordiamondordiamond]
	_diamond -> odiamond [arrowhead=odiamond label=odiamond]
	odiamond -> odiamondodiamond [arrowhead=odiamondodiamond label=odiamondodiamond]
	_dot -> dot [arrowhead=dot label=dot]
	dot -> dotdot [arrowhead=dotdot label=dotdot]
	_dot -> odot [arrowhead=odot label=odot]
	odot -> odotodot [arrowhead=odotodot label=odotodot]
	_inv -> inv [arrowhead=inv label=inv]
	inv -> invinv [arrowhead=invinv label=invinv]
	_inv -> linv [arrowhead=linv label=linv]
	linv -> linvlinv [arrowhead=linvlinv label=linvlinv]
	_inv -> rinv [arrowhead=rinv label=rinv]
	rinv -> rinvrinv [arrowhead=rinvrinv label=rinvrinv]
	_inv -> olinv [arrowhead=olinv label=olinv]
	olinv -> olinvolinv [arrowhead=olinvolinv label=olinvolinv]
	_inv -> orinv [arrowhead=orinv label=orinv]
	orinv -> orinvorinv [arrowhead=orinvorinv label=orinvorinv]
	_inv -> oinv [arrowhead=oinv label=oinv]
	oinv -> oinvoinv [arrowhead=oinvoinv label=oinvoinv]
	_none -> none [arrowhead=none label=none]
	none -> nonenone [arrowhead=nonenone label=nonenone]
	_normal -> normal [arrowhead=normal label=normal]
	normal -> normalnormal [arrowhead=normalnormal label=normalnormal]
	_normal -> lnormal [arrowhead=lnormal label=lnormal]
	lnormal -> lnormallnormal [arrowhead=lnormallnormal label=lnormallnormal]
	_normal -> rnormal [arrowhead=rnormal label=rnormal]
	rnormal -> rnormalrnormal [arrowhead=rnormalrnormal label=rnormalrnormal]
	_normal -> olnormal [arrowhead=olnormal label=olnormal]
	olnormal -> olnormalolnormal [arrowhead=olnormalolnormal label=olnormalolnormal]
	_normal -> ornormal [arrowhead=ornormal label=ornormal]
	ornormal -> ornormalornormal [arrowhead=ornormalornormal label=ornormalornormal]
	_normal -> onormal [arrowhead=onormal label=onormal]
	onormal -> onormalonormal [arrowhead=onormalonormal label=onormalonormal]
	_tee -> tee [arrowhead=tee label=tee]
	tee -> teetee [arrowhead=teetee label=teetee]
	_tee -> ltee [arrowhead=ltee label=ltee]
	ltee -> lteeltee [arrowhead=lteeltee label=lteeltee]
	_tee -> rtee [arrowhead=rtee label=rtee]
	rtee -> rteertee [arrowhead=rteertee label=rteertee]
	_vee -> vee [arrowhead=vee label=vee]
	vee -> veevee [arrowhead=veevee label=veevee]
	_vee -> lvee [arrowhead=lvee label=lvee]
	lvee -> lveelvee [arrowhead=lveelvee label=lveelvee]
	_vee -> rvee [arrowhead=rvee label=rvee]
	rvee -> rveervee [arrowhead=rveervee label=rveervee]
	_curve -> curve [arrowhead=curve label=curve]
	curve -> curvecurve [arrowhead=curvecurve label=curvecurve]
	_curve -> lcurve [arrowhead=lcurve label=lcurve]
	lcurve -> lcurvelcurve [arrowhead=lcurvelcurve label=lcurvelcurve]
	_curve -> rcurve [arrowhead=rcurve label=rcurve]
	rcurve -> rcurvercurve [arrowhead=rcurvercurve label=rcurvercurve]
	_icurve -> icurve [arrowhead=icurve label=icurve]
	icurve -> icurveicurve [arrowhead=icurveicurve label=icurveicurve]
	_icurve -> licurve [arrowhead=licurve label=licurve]
	licurve -> licurvelicurve [arrowhead=licurvelicurve label=licurvelicurve]
	_icurve -> ricurve [arrowhead=ricurve label=ricurve]
	ricurve -> ricurvericurve [arrowhead=ricurvericurve label=ricurvericurve]
}
```

### 2. `awilliams.gv`
Source: [graphs/directed/awilliams.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/awilliams.gv)

```dot
digraph pvn {
	ordering=out;

	node_1 -> node_2;
	node_1 [label="ID: 1\ntype: 48\nnbr out: 0\nnbr chi: 11"];
	node_2 [label="ID: 2\ntype: 8\nnbr out: 0\nnbr chi: 0"];
	node_1 -> node_3;
	node_3 [label="ID: 3\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_1 -> node_4;
	node_4 [label="ID: 4\ntype: 6\nnbr out: 0\nnbr chi: 0"];
	node_1 -> node_5;
	node_5 [label="ID: 5\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_1 -> node_6;
	node_6 [label="ID: 6\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_1 -> node_7;
	node_7 [label="ID: 7\ntype: 49\nnbr out: 0\nnbr chi: 0"];
	node_7 -> node_8;
	node_8 [label="ID: 8\ntype: 45\nnbr out: 2\nnbr chi: 0"];
	node_8 -> node_9;
	node_9 [label="ID: 9\ntype: 48\nnbr out: 0\nnbr chi: 4"];
	node_9 -> node_10;
	node_10 [label="ID: 10\ntype: 8\nnbr out: 0\nnbr chi: 0"];
	node_9 -> node_11;
	node_11 [label="ID: 11\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_9 -> node_12;
	node_12 [label="ID: 12\ntype: 5\nnbr out: 0\nnbr chi: 0"];
	node_9 -> node_13;
	node_13 [label="ID: 13\ntype: 16\nnbr out: 0\nnbr chi: 0"];
	node_8 -> node_14;
	node_14 [label="ID: 14\ntype: 39\nnbr out: 1\nnbr chi: 0"];
	node_14 -> node_15;
	node_15 [label="ID: 15\ntype: 55\nnbr out: 0\nnbr chi: 0"];
	node_15 -> node_16;
	node_16 [label="ID: 16\ntype: 48\nnbr out: 0\nnbr chi: 3"];
	node_16 -> node_17;
	node_17 [label="ID: 17\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_16 -> node_18;
	node_18 [label="ID: 18\ntype: 6\nnbr out: 0\nnbr chi: 0"];
	node_16 -> node_19;
	node_19 [label="ID: 19\ntype: 45\nnbr out: 1\nnbr chi: 0"];
	node_19 -> node_20;
	node_20 [label="ID: 20\ntype: 48\nnbr out: 0\nnbr chi: 5"];
	node_20 -> node_21;
	node_21 [label="ID: 21\ntype: 38\nnbr out: 0\nnbr chi: 0"];
	node_20 -> node_22;
	node_22 [label="ID: 22\ntype: 8\nnbr out: 0\nnbr chi: 0"];
	node_20 -> node_23;
	node_23 [label="ID: 23\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_20 -> node_24;
	node_24 [label="ID: 24\ntype: 5\nnbr out: 0\nnbr chi: 0"];
	node_20 -> node_25;
	node_25 [label="ID: 25\ntype: 16\nnbr out: 0\nnbr chi: 0"];
	node_19 -> node_26;
	node_26 [label="ID: 26\ntype: 41\nnbr out: 12\nnbr chi: 0"];
	node_26 -> node_27;
	node_27 [label="ID: 27\ntype: 48\nnbr out: 0\nnbr chi: 5"];
	node_27 -> node_28;
	node_28 [label="ID: 28\ntype: 38\nnbr out: 0\nnbr chi: 0"];
	node_27 -> node_29;
	node_29 [label="ID: 29\ntype: 8\nnbr out: 0\nnbr chi: 0"];
	node_27 -> node_30;
	node_30 [label="ID: 30\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_27 -> node_31;
	node_31 [label="ID: 31\ntype: 5\nnbr out: 0\nnbr chi: 0"];
	node_27 -> node_32;
	node_32 [label="ID: 32\ntype: 16\nnbr out: 0\nnbr chi: 0"];
	node_26 -> node_27;
	node_26 -> node_27;
	node_26 -> node_27;
	node_26 -> node_27;
	node_26 -> node_27;
	node_26 -> node_27;
	node_26 -> node_27;
	node_26 -> node_27;
	node_26 -> node_27;
	node_26 -> node_27;
	node_26 -> node_27;
	node_26 -> node_33;
	node_33 [label="ID: 33\ntype: 48\nnbr out: 0\nnbr chi: 5"];
	node_33 -> node_34;
	node_34 [label="ID: 34\ntype: 38\nnbr out: 0\nnbr chi: 0"];
	node_33 -> node_35;
	node_35 [label="ID: 35\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_33 -> node_36;
	node_36 [label="ID: 36\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_33 -> node_37;
	node_37 [label="ID: 37\ntype: 20\nnbr out: 0\nnbr chi: 0"];
	node_33 -> node_38;
	node_38 [label="ID: 38\ntype: 16\nnbr out: 0\nnbr chi: 0"];
	node_15 -> node_39;
	node_39 [label="ID: 39\ntype: 45\nnbr out: 1\nnbr chi: 0"];
	node_39 -> node_40;
	node_40 [label="ID: 40\ntype: 16\nnbr out: 0\nnbr chi: 0"];
	node_39 -> node_41;
	node_41 [label="ID: 41\ntype: 48\nnbr out: 0\nnbr chi: 3"];
	node_41 -> node_42;
	node_42 [label="ID: 42\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_41 -> node_43;
	node_43 [label="ID: 43\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_41 -> node_44;
	node_44 [label="ID: 44\ntype: 6\nnbr out: 0\nnbr chi: 0"];
	node_15 -> node_45;
	node_45 [label="ID: 45\ntype: 48\nnbr out: 0\nnbr chi: 4"];
	node_45 -> node_46;
	node_46 [label="ID: 46\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_45 -> node_47;
	node_47 [label="ID: 47\ntype: 45\nnbr out: 1\nnbr chi: 0"];
	node_47 -> node_48;
	node_48 [label="ID: 48\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_47 -> node_49;
	node_49 [label="ID: 49\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_45 -> node_50;
	node_50 [label="ID: 50\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_45 -> node_51;
	node_51 [label="ID: 51\ntype: 45\nnbr out: 1\nnbr chi: 0"];
	node_51 -> node_52;
	node_52 [label="ID: 52\ntype: 45\nnbr out: 1\nnbr chi: 0"];
	node_52 -> node_53;
	node_53 [label="ID: 53\ntype: 54\nnbr out: 0\nnbr chi: 0"];
	node_52 -> node_54;
	node_54 [label="ID: 54\ntype: 16\nnbr out: 0\nnbr chi: 0"];
	node_51 -> node_55;
	node_55 [label="ID: 55\ntype: 48\nnbr out: 0\nnbr chi: 3"];
	node_55 -> node_56;
	node_56 [label="ID: 56\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_55 -> node_57;
	node_57 [label="ID: 57\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_55 -> node_58;
	node_58 [label="ID: 58\ntype: 6\nnbr out: 0\nnbr chi: 0"];
	node_15 -> node_59;
	node_59 [label="ID: 59\ntype: 48\nnbr out: 0\nnbr chi: 5"];
	node_59 -> node_60;
	node_60 [label="ID: 60\ntype: 38\nnbr out: 0\nnbr chi: 0"];
	node_59 -> node_61;
	node_61 [label="ID: 61\ntype: 8\nnbr out: 0\nnbr chi: 0"];
	node_59 -> node_62;
	node_62 [label="ID: 62\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_59 -> node_63;
	node_63 [label="ID: 63\ntype: 5\nnbr out: 0\nnbr chi: 0"];
	node_59 -> node_64;
	node_64 [label="ID: 64\ntype: 16\nnbr out: 0\nnbr chi: 0"];
	node_15 -> node_65;
	node_65 [label="ID: 65\ntype: 48\nnbr out: 0\nnbr chi: 5"];
	node_65 -> node_66;
	node_66 [label="ID: 66\ntype: 38\nnbr out: 0\nnbr chi: 0"];
	node_65 -> node_67;
	node_67 [label="ID: 67\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_65 -> node_68;
	node_68 [label="ID: 68\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_65 -> node_69;
	node_69 [label="ID: 69\ntype: 20\nnbr out: 0\nnbr chi: 0"];
	node_65 -> node_70;
	node_70 [label="ID: 70\ntype: 16\nnbr out: 0\nnbr chi: 0"];
	node_14 -> node_71;
	node_71 [label="ID: 71\ntype: 45\nnbr out: 1\nnbr chi: 0"];
	node_71 -> node_72;
	node_72 [label="ID: 72\ntype: 16\nnbr out: 0\nnbr chi: 0"];
	node_71 -> node_73;
	node_73 [label="ID: 73\ntype: 48\nnbr out: 0\nnbr chi: 3"];
	node_73 -> node_74;
	node_74 [label="ID: 74\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_73 -> node_75;
	node_75 [label="ID: 75\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_73 -> node_76;
	node_76 [label="ID: 76\ntype: 6\nnbr out: 0\nnbr chi: 0"];
	node_8 -> node_77;
	node_77 [label="ID: 77\ntype: 45\nnbr out: 1\nnbr chi: 0"];
	node_77 -> node_78;
	node_78 [label="ID: 78\ntype: 16\nnbr out: 0\nnbr chi: 0"];
	node_77 -> node_79;
	node_79 [label="ID: 79\ntype: 48\nnbr out: 0\nnbr chi: 3"];
	node_79 -> node_80;
	node_80 [label="ID: 80\ntype: 14\nnbr out: 0\nnbr chi: 0"];
	node_79 -> node_81;
	node_81 [label="ID: 81\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_79 -> node_82;
	node_82 [label="ID: 82\ntype: 6\nnbr out: 0\nnbr chi: 0"];
	node_1 -> node_83;
	node_83 [label="ID: 83\ntype: 38\nnbr out: 0\nnbr chi: 0"];
	node_1 -> node_84;
	node_84 [label="ID: 84\ntype: 8\nnbr out: 0\nnbr chi: 0"];
	node_1 -> node_85;
	node_85 [label="ID: 85\ntype: 1\nnbr out: 0\nnbr chi: 0"];
	node_1 -> node_86;
	node_86 [label="ID: 86\ntype: 5\nnbr out: 0\nnbr chi: 0"];
	node_1 -> node_87;
	node_87 [label="ID: 87\ntype: 16\nnbr out: 0\nnbr chi: 0"];
}
```

### 3. `biological.gv`
Source: [graphs/directed/biological.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/biological.gv)

```dot
digraph g {
	rankdir=LR;

	node [shape=rpromoter colorscheme=rdbu5 color=1 style=filled fontcolor=3]; Hef1a; TRE; UAS; Hef1aLacOid;
	Hef1aLacOid [label="Hef1a-LacOid"];
	node [shape=rarrow colorscheme=rdbu5 color=5 style=filled fontcolor=3]; Gal4VP16; LacI; rtTA3; DeltamCherry;
	Gal4VP16 [label="Gal4-VP16"];	
	product [shape=oval style=filled colorscheme=rdbu5 color=2 label=""];
	repression [shape=oval label="LacI repression" fontcolor=black style=dotted];
	node [shape=oval style=filled colorscheme=rdbu5 color=4 fontcolor=5];
	combination [label="rtTA3 + Doxycycline"];
	LacIprotein [label="LacI"];
	rtTA3protein [label="rtTA3"];
	Gal4VP16protein [label="Gal4-VP16"];
	

	subgraph cluster_0 {
		colorscheme=rdbu5;
		color=3;
		node [colorscheme=rdbu5 fontcolor=3];
		Hef1a -> Gal4VP16 [arrowhead=none];
		Gal4VP16 -> UAS [arrowhead=none];
		UAS -> LacI [arrowhead=none];
		LacI -> Hef1aLacOid [arrowhead=none];
		Hef1aLacOid -> rtTA3 [arrowhead=none];
		rtTA3 -> TRE [arrowhead=none];
		TRE -> DeltamCherry [arrowhead=none]
	}
	
	Gal4VP16 -> Gal4VP16protein;
	Gal4VP16protein -> UAS;
	LacI -> LacIprotein;
	LacIprotein -> repression;
	repression -> Hef1aLacOid [arrowhead=tee];
	IPTG -> repression [arrowhead=tee];
	rtTA3 -> rtTA3protein;
	rtTA3protein -> combination;
	combination -> TRE;
	Doxycycline -> combination;
	DeltamCherry -> product;
	
	
		
}
```

### 4. `fig6.gv`
Source: [graphs/directed/fig6.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/fig6.gv)

```dot
digraph G {
	size = "8,8";
	{rank=min S8 S24 S1 S35 S30}
	{rank=max T8 T24 T1 T35 T30}
	S8 -> 9;
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

### 5. `honda-tokoro.gv`
Source: [graphs/directed/honda-tokoro.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/honda-tokoro.gv)

```dot
digraph "Honda-Tokoro" {
rankdir="LR" ranksep="0.2" edge[labelfontsize="8" fontsize="8" labeldistance="0.8" arrowsize="0.9" labelangle="-30" dir="none"] nodesep="0.2" node[width="0" height="0" fontsize="10"]

/*Net net00*/

n000 [label="z"]
n001->n000 [headlabel=":s:" arrowhead="invdot"]
n001 [label="m"]
n002->n001 [samehead="m002" headlabel=":r:" samearrowhead="1" arrowhead="invdot" arrowtail="inv"]
n002 [label="p1"]
n003->n002 [headlabel=":s:" arrowhead="dot"]
n003 [label="b"]
n004->n003 
n004 [label="x1"]
n022->n004 [weight="0" headlabel=":s/r:" fontsize="8" arrowhead="invdot"]
n003->n002 [samehead="m000" fontsize="8" samearrowhead="1" arrowtail="inv"]
n005->n002 [samehead="m000" headlabel=":u:" fontsize="8" samearrowhead="1" arrowhead="dot" arrowtail="inv"]
n005->n001 [samehead="m002" samearrowhead="1"]
n005 [label="b"]
n006->n005 [arrowtail="inv"]
n006 [label="p2"]
n007->n006 [headlabel=":s:" arrowhead="dot"]
n007 [label="b"]
n008->n007 
n008 [label="x2"]
n022->n008 [weight="0" headlabel=":s/r:" fontsize="8" arrowhead="invdot"]
n007->n006 [samehead="m001" headlabel=":u:" fontsize="8" samearrowhead="1" arrowhead="dot" arrowtail="inv"]
n009->n006 [samehead="m001" samearrowhead="1" arrowtail="inv"]
n009 [label="b2"]
n022->n009 [fontsize="8"]
n022->n009 [fontsize="8"]
n010->n006 [samehead="m001" samearrowhead="1" arrowtail="inv"]
n010 [label="b2"]
n022->n010 [fontsize="8"]
n022->n010 [fontsize="8"]
n011->n000 [headlabel=":r:" arrowhead="invdot" arrowtail="inv"]
n011 [label="n"]
n012->n011 [samehead="m005" headlabel=":s:" samearrowhead="1" arrowhead="dot"]
n012 [label="b"]
n013->n012 
n013 [label="c1"]
n014->n013 [headlabel=":r:" arrowhead="invdot"]
n014 [label="b"]
n015->n014 [arrowtail="inv"]
n015 [label="y1"]
n023->n015 [weight="0" headlabel=":s/r:" fontsize="8" arrowhead="dot"]
n016->n015 [samehead="m003" headlabel=":u:" fontsize="8" samearrowhead="1" arrowhead="dot" arrowtail="inv"]
n018->n015 [samehead="m003" fontsize="8" samearrowhead="1" arrowtail="inv"]
n014->n011 [samehead="m006" headlabel=":u:" fontsize="8" samearrowhead="1" arrowhead="dot" arrowtail="inv"]
n012->n011 [samehead="m006" fontsize="8" samearrowhead="1" arrowtail="inv"]
n016->n011 [samehead="m005" samearrowhead="1"]
n016 [label="b"]
n017->n016 
n017 [label="c2"]
n018->n017 [headlabel=":r:" arrowhead="invdot"]
n018 [label="b"]
n019->n018 [arrowtail="inv"]
n019 [label="y2"]
n023->n019 [weight="0" headlabel=":s/r:" fontsize="8" arrowhead="dot"]
n020->n019 [samehead="m004" headlabel=":u:" samearrowhead="1" arrowhead="dot" arrowtail="inv"]
n020 [label="b2"]
n023->n020 [fontsize="8"]
n023->n020 [fontsize="8"]
n021->n019 [samehead="m004" samearrowhead="1" arrowtail="inv"]
n021 [label="b2"]
n023->n021 [fontsize="8"]
n023->n021 [fontsize="8"]
n022 [width="0.5" label="[P]" shape="box" style="dashed" height="0.35"]
n023 [width="0.5" label="[Q]" shape="box" style="dashed" height="0.35"]
{/*L=x1*/rank=same n004 n015}
{/*L=p1*/rank=same n002 n013}
{/*L=b*/rank=same n009 n010 n020 n021}
{/*L=x2*/rank=same n008 n019}
{/*L=p2*/rank=same n006 n017}
{/*L=m*/rank=same n001 n011}
}
```

### 6. `oldarrows.gv`
Source: [graphs/directed/oldarrows.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/oldarrows.gv)

```dot
digraph G {
  // leave some space for the head/taillabels
  graph [ranksep=1.5 splines=true overlap=false]

  // to avoid confusion, remember this:
  // it's spelt tail/head, but it's read start/end

  // put head/tail labels farther from the node
  edge [labeldistance=3]

  // not interested in node labels
  node [shape=circle width=0.5 label=""]

  {
    edge [dir=back samehead=ahead samearrowhead=1]
    a->Z [arrowtail=none taillabel=none]
    b->Z [arrowtail=normal taillabel=normal]
    c->Z [arrowtail=inv taillabel=inv]
    d->Z [arrowtail=dot taillabel=dot]
    e->Z [arrowtail=odot taillabel=odot]
    f->Z [arrowtail=invdot taillabel=invdot]
    g->Z [arrowtail=invodot taillabel=invodot]
    h->Z [arrowtail=open taillabel=open]
    i->Z [arrowtail=halfopen taillabel=halfopen arrowhead=inv headlabel=samehead]
    j->Z [arrowtail=empty taillabel=empty]
    k->Z [arrowtail=invempty taillabel=invempty]
    l->Z [arrowtail=diamond taillabel=diamond]
    m->Z [arrowtail=odiamond taillabel=odiamond]
    n->Z [arrowtail=box taillabel=box]
    o->Z [arrowtail=obox taillabel=obox]
    p->Z [arrowtail=tee taillabel=tee]
    q->Z [arrowtail=crow taillabel=crow]
  }
  {
    edge [sametail=atail samearrowtail=1]
    Z->A [arrowhead=none headlabel=none]
    Z->B [arrowhead=normal headlabel=normal]
    Z->C [arrowhead=inv headlabel=inv]
    Z->D [arrowhead=dot headlabel=dot]
    Z->E [arrowhead=odot headlabel=odot]
    Z->F [arrowhead=invdot headlabel=invdot]
    Z->G [arrowhead=invodot headlabel=invodot]
    Z->H [arrowhead=open headlabel=open]
    Z->I [arrowhead=halfopen headlabel=halfopen arrowtail=inv taillabel=sametail]
    Z->J [arrowhead=empty headlabel=empty]
    Z->K [arrowhead=invempty headlabel=invempty]
    Z->L [arrowhead=diamond headlabel=diamond]
    Z->M [arrowhead=odiamond headlabel=odiamond]
    Z->N [arrowhead=box headlabel=box]
    Z->O [arrowhead=obox headlabel=obox]
    Z->P [arrowhead=tee headlabel=tee]
    Z->Q [arrowhead=crow headlabel=crow]
  }
}
```

### 7. `polypoly.gv`
Source: [graphs/directed/polypoly.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/polypoly.gv)

```dot
digraph polypoly {
	
    size="7,9.5";
    page="8.5,11";
    ratio=fill;
    node [shape=polygon];

    { rank=same;
      node [sides=0];
      node [peripheries=1];
      0000 [label="M"];
      0001 [label="MMMMMMMMMM"];
      0002 [label="M\nM\nM\nM\nM\nM"];
      0003 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
      node [peripheries=2];
      0010 [label="M"];
      0011 [label="MMMMMMMMMM"];
      0012 [label="M\nM\nM\nM\nM\nM"];
      0013 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
      node [distortion=-.3];
      0110 [label="M"];
      0111 [label="MMMMMMMMMM"];
      0112 [label="M\nM\nM\nM\nM\nM"];
      0113 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
    }
    { rank=same;
      node [sides=3];
      node [peripheries=1];
      node [orientation=0];
      3000 [label="M"];
      3001 [label="MMMMMMMMMM"];
      3002 [label="M\nM\nM\nM\nM\nM"];
      3003 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
      node [peripheries=2];
      node [orientation=60];
      3110 [label="M"];
      3111 [label="MMMMMMMMMM"];
      3112 [label="M\nM\nM\nM\nM\nM"];
      3113 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
    }
    3000->0000;
    { rank=same;
      node [sides=4];
      node [peripheries=1];
      node [orientation=0];
      4000 [label="M"];
      4001 [label="MMMMMMMMMM"];
      4002 [label="M\nM\nM\nM\nM\nM"];
      4003 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
      node [peripheries=2];
      node [orientation=45];
      4110 [label="M"];
      4111 [label="MMMMMMMMMM"];
      4112 [label="M\nM\nM\nM\nM\nM"];
      4113 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
    }
    4000->3000;
    { rank=same;
      node [sides=5];
      node [peripheries=1];
      node [orientation=0];
      5000 [label="M"];
      5001 [label="MMMMMMMMMM"];
      5002 [label="M\nM\nM\nM\nM\nM"];
      5003 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
      node [peripheries=2];
      node [orientation=36];
      5110 [label="M"];
      5111 [label="MMMMMMMMMM"];
      5112 [label="M\nM\nM\nM\nM\nM"];
      5113 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
    }
    5000->4000;
    { rank=same;
      node [sides=6];
      node [peripheries=1];
      node [orientation=0];
      6000 [label="M"];
      6001 [label="MMMMMMMMMM"];
      6002 [label="M\nM\nM\nM\nM\nM"];
      6003 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
      node [peripheries=2];
      node [orientation=30];
      6110 [label="M"];
      6111 [label="MMMMMMMMMM"];
      6112 [label="M\nM\nM\nM\nM\nM"];
      6113 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
    }
    6000->5000;
    { rank=same;
      node [sides=7];
      node [peripheries=1];
      node [orientation=0];
      7000 [label="M"];
      7001 [label="MMMMMMMMMM"];
      7002 [label="M\nM\nM\nM\nM\nM"];
      7003 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
      node [peripheries=2];
      node [orientation=25.7];
      7110 [label="M"];
      7111 [label="MMMMMMMMMM"];
      7112 [label="M\nM\nM\nM\nM\nM"];
      7113 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
    }
    7000->6000;
    { rank=same;
      node [sides=8];
      node [peripheries=1];
      node [orientation=0];
      8000 [label="M"];
      8001 [label="MMMMMMMMMM"];
      8002 [label="M\nM\nM\nM\nM\nM"];
      8003 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
      node [peripheries=2];
      node [orientation=22.5];
      8110 [label="M"];
      8111 [label="MMMMMMMMMM"];
      8112 [label="M\nM\nM\nM\nM\nM"];
      8113 [label="MMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM\nMMMMMMMMMM"];
    }
    8000->7000;
    { rank=same;
      node [sides=4];
      node [peripheries=1];
      node [regular=1];
      node [distortion=.5];
      node [orientation=0];
      9000 [label="M"];
      node [orientation=45.];
      9001 [label="M"];
      node [orientation=90.];
      9002 [label="M"];
      node [orientation=135.];
      9003 [label="M"];
      node [orientation=180.];
      9004 [label="M"];
      node [orientation=225.];
      9005 [label="M"];
      node [orientation=270.];
      9006 [label="M"];
      node [orientation=315.];
      9007 [label="M"];
      node [peripheries=2];
      node [orientation=0];
      9010 [label="M"];
      node [orientation=45.];
      9011 [label="M"];
      node [orientation=90.];
      9012 [label="M"];
      node [orientation=135.];
      9013 [label="M"];
      node [orientation=180.];
      9014 [label="M"];
      node [orientation=225.];
      9015 [label="M"];
      node [orientation=270.];
      9016 [label="M"];
      node [orientation=315.];
      9017 [label="M"];
    }
    9000->8000;
}
```

### 8. `ER.gv`
Source: [graphs/undirected/ER.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/undirected/ER.gv)

```dot
graph ER {
	node [shape=box]; course; institute; student;
	node [shape=ellipse]; {node [label="name"] name0; name1; name2;}
		code; grade; number;
	node [shape=diamond,style=filled,color=lightgrey]; "C-I"; "S-C"; "S-I";

	name0 -- course;
	code -- course;
	course -- "C-I" [label="n",len=1.00];
	"C-I" -- institute [label="1",len=1.00];
	institute -- name1;
	institute -- "S-I" [label="1",len=1.00];
	"S-I" -- student [label="n",len=1.00];
	student -- grade;
	student -- name2;
	student -- number;
	student -- "S-C" [label="m",len=1.00];
	"S-C" -- course [label="n",len=1.00];

	label = "\n\nEntity Relation Diagram\ndrawn by NEATO";
	fontsize=20;
}
```

### 9. `Heawood.gv`
Source: [graphs/undirected/Heawood.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/undirected/Heawood.gv)

```dot
/*
 * The transitive 6-net, also known as Heawood's graph,
 * can be used to test the "stability points" of the layout
 * algorithm.

 * The "ideal" layout occurs when len="2.5". The layout
 * loses the regularity when smaller values are used.
 */
graph "Heawood" {
	node [
		fontname = "Arial"
		label = "\N"
		shape = "circle"
		width = "0.50000"
		height = "0.500000"
		color = "black"
	]
	edge [
		color = "black"
	]
	/* The outer wheel */
	"0" -- "1" -- "2" -- "3" -- "4" -- "5" -- "6" -- "7" -- "8" -- "9" -- "10" -- "11" -- "12" -- "13" -- "0";
	/* The internal edges. The len = makes them internal */
	"0" -- "5" [len = 2.5];
	"2" -- "7" [len = 2.5];
	"4" -- "9" [len = 2.5];
	"6" -- "11" [len = 2.5];
	"8" -- "13" [len = 2.5];
	"10" -- "1" [len = 2.5];
	"12" -- "3" [len = 2.5];
}
```

### 10. `Petersen.gv`
Source: [graphs/undirected/Petersen.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/undirected/Petersen.gv)

```dot
/*
 * The transitive 5-net, also known as Petersen's graph,
 * can be used to test the "stability points" of the layout
 * algorithm.
 * 
 * The "ideal" layout is achieved for certain random seed
 * values when len=1.5.  For len=2.5 or above, the layout
 * is stable. Sometimes, the graph is rendered "inside-out".
 */ 
graph "Petersen" {
	node [
		fontname = "Arial"
		label = "\N"
		shape = "circle"
		width = "0.400000"
		height = "0.400000"
		color = "black"
	]
	edge [
		color = "black"
	]
	/* Outer wheel. The len= is what makes it outer */
	"0" -- "1" -- "2" -- "3" -- "4" -- "0" [
		color = "blue"
		len = 2.6
	]
	"0" -- "5" [
		color = "red"
		weight = "5"
	]
	"1" -- "6" [
		color = "red"
		weight = "5"
	]
	"2" -- "7" [
		color = "red"
		weight = "5"
	]
	"3" -- "8" [
		color = "red"
		weight = "5"
	]
	"4" -- "9" [
		color = "red"
		weight = "5"
	]
	"5" -- "7" -- "9" -- "6" -- "8" -- "5";
}
```

### 11. `ngk10_4.gv`
Source: [graphs/undirected/ngk10_4.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/undirected/ngk10_4.gv)

```dot
graph G {
	graph [splines=true overlap=false]
	1 -- 30 [f=1];
	1 -- 40 [f=14];
	8 -- 46 [f=1];
	8 -- 16 [f=18];
	10 -- 25 [f=1];
	10 -- 19 [f=5];
	10 -- 33 [f=1];
	12 -- 8 [f=1];
	12 -- 36 [f=5];
	12 -- 17 [f=16];
	13 -- 38 [f=1];
	13 -- 24 [f=19];
	24 -- 49 [f=1];
	24 -- 13 [f=1];
	24 -- 47 [f=12];
	24 -- 12 [f=19];
	25 -- 27 [f=1];
	25 -- 12 [f=1];
	27 -- 12 [f=1];
	27 -- 14 [f=8];
	29 -- 10 [f=1];
	29 -- 8 [f=17];
	30 -- 24 [f=1];
	30 -- 44 [f=15];
	38 -- 29 [f=1];
	38 -- 35 [f=15];
	2 -- 42 [f=2];
	2 -- 35 [f=3];
	2 -- 11 [f=19];
	14 -- 18 [f=2];
	14 -- 24 [f=15];
	14 -- 38 [f=18];
	18 -- 49 [f=2];
	18 -- 47 [f=20];
	26 -- 41 [f=2];
	26 -- 42 [f=15];
	31 -- 39 [f=2];
	31 -- 47 [f=17];
	31 -- 25 [f=14];
	37 -- 26 [f=2];
	37 -- 16 [f=14];
	39 -- 50 [f=2];
	39 -- 14 [f=2];
	39 -- 18 [f=17];
	39 -- 47 [f=10];
	41 -- 31 [f=2];
	41 -- 8 [f=16];
	42 -- 44 [f=2];
	42 -- 29 [f=12];
	44 -- 37 [f=2];
	44 -- 32 [f=15];
	3 -- 20 [f=2];
	3 -- 28 [f=19];
	6 -- 45 [f=2];
	6 -- 28 [f=10];
	9 -- 6 [f=2];
	9 -- 16 [f=1];
	15 -- 16 [f=2];
	15 -- 48 [f=2];
	16 -- 50 [f=2];
	16 -- 32 [f=14];
	16 -- 39 [f=8];
	20 -- 33 [f=2];
	33 -- 9 [f=2];
	33 -- 46 [f=3];
	33 -- 48 [f=17];
	45 -- 15 [f=2];
	4 -- 17 [f=4];
	4 -- 15 [f=6];
	4 -- 12 [f=16];
	17 -- 21 [f=4];
	19 -- 35 [f=4];
	19 -- 15 [f=9];
	19 -- 43 [f=4];
	21 -- 19 [f=4];
	21 -- 50 [f=4];
	23 -- 36 [f=4];
	34 -- 23 [f=4];
	34 -- 24 [f=11];
	35 -- 34 [f=4];
	35 -- 16 [f=6];
	35 -- 18 [f=16];
	36 -- 46 [f=4];
	5 -- 7 [f=1];
	5 -- 36 [f=6];
	7 -- 32 [f=1];
	7 -- 11 [f=2];
	7 -- 14 [f=17];
	11 -- 40 [f=1];
	11 -- 50 [f=1];
	22 -- 46 [f=1];
	28 -- 43 [f=1];
	28 -- 8 [f=18];
	32 -- 28 [f=1];
	32 -- 39 [f=13];
	32 -- 42 [f=15];
	40 -- 22 [f=1];
	40 -- 47 [f=1];
	43 -- 11 [f=1];
	43 -- 17 [f=19];
}
```

### 12. `process.gv`
Source: [graphs/undirected/process.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/undirected/process.gv)

```dot
graph G {
	run -- intr;
	intr -- runbl;
	runbl -- run;
	run -- kernel;
	kernel -- zombie;
	kernel -- sleep;
	kernel -- runmem;
	sleep -- swap;
	swap -- runswap;
	runswap -- new;
	runswap -- runmem;
	new -- runmem;
	sleep -- runmem;
}
```
