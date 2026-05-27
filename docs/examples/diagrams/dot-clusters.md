# Graphviz DOT examples — 02 Clusters, subgraphs, and layout constraints

Clustered diagrams, subgraphs, ranks, process-like layouts, state-layout examples, and layout-shape stress cases.

## Documentation links

- [DOT language](https://graphviz.org/doc/info/lang.html)
- [Attributes](https://graphviz.org/docs/attrs/)
- [Node shapes](https://graphviz.org/doc/info/shapes.html)
- [Arrow shapes](https://graphviz.org/doc/info/arrows.html)
- [HTML-like labels](https://graphviz.org/doc/info/shapes.html#html)
- [Command-line tools/layout engines](https://graphviz.org/docs/layouts/)

## Examples

### 1. `clust.gv`
Source: [graphs/directed/clust.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/clust.gv)

```dot
digraph G {
	subgraph cluster_0 {
		label = "hello world";
		a -> b;
		a -> c;
		color = hotpink;
	}

	subgraph cluster_1 {
		label = "MSDOT";
		style= "dashed";
		color=purple;
		x -> y;
		x -> z;
		y -> z;
		y -> q;
	}

	top -> a;
	top -> y;
	y -> b;
}
```

### 2. `clust1.gv`
Source: [graphs/directed/clust1.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/clust1.gv)

```dot
digraph G {
	subgraph cluster_c0 {a0 -> a1 -> a2 -> a3;}
	subgraph cluster_c1 {b0 -> b1 -> b2 -> b3;}
	x -> a0;
	x -> b0;
	a1 -> a3;
	a3 -> a0;
}
```

### 3. `clust2.gv`
Source: [graphs/directed/clust2.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/clust2.gv)

```dot
digraph G {
	subgraph cluster_c0 {a0 -> a1 -> a2 -> a3;}
	subgraph cluster_c1 {b0 -> b1 -> b2 -> b3;}
	x -> a0;
	x -> b0;
	a1 -> b3;
	b3 -> a1;
}
```

### 4. `clust3.gv`
Source: [graphs/directed/clust3.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/clust3.gv)

```dot
digraph G {
	subgraph cluster_c0 {a0 -> a1 -> a2 -> a3;}
	subgraph cluster_c1 {b0 -> b1 -> b2 -> b3;}
	x -> a0;
	x -> b0;
	a1 -> b3;
	b1 -> a3;
}
```

### 5. `clust4.gv`
Source: [graphs/directed/clust4.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/clust4.gv)

```dot
digraph G {

	subgraph cluster_0 {
		style=filled;
		color=lightgrey;
		node [style=filled,color=white];
		a0 -> a1 -> a2 -> a3;
		label = "process #1";
	}

	subgraph cluster_1 {
		node [style=filled];
		b0 -> b1 -> b2 -> b3;
		label = "process #2";
		color=blue
	}
	start -> a0;
	start -> b0;
	a1 -> b3;
	b2 -> a3;
	a3 -> a0;
	a3 -> end;
	b3 -> end;

	start [shape=Mdiamond];
	end [shape=Msquare];
}
```

### 6. `clust5.gv`
Source: [graphs/directed/clust5.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/clust5.gv)

```dot
digraph G {
size="6,6";
	a -> b -> c;

	subgraph cluster0 {
		x0 -> y0;
		x0 -> z0;
	}

	subgraph cluster1 {
		x1 -> y1;
		x1 -> z1;
	}

	subgraph cluster2 {
		x2 -> y2;
		x2 -> z2;
	}

	a -> x0;
	b -> x1;
	b -> x2;
	a -> z2;
	c -> z1;
}
```

### 7. `proc3d.gv`
Source: [graphs/directed/proc3d.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/proc3d.gv)

```dot
digraph g {
graph [
fontname=Courier,
fontsize=24,
ranksep = 1.0,
size="10,7.5",
orientation=land,
style="setlinewidth(8)"
page = "8.5,11",
center=true
];
node [
shape = "box"
width = "0.5"
];
edge [
];
subgraph cluster_0 {
label="gryphon"
"22342"
"22343"
"22346"
"22347"
"22351"
"22344"
"22345"
"22348"
"22350"
"22357"
}
subgraph cluster_1 {
label=toucan
"22349"
"22352"
"22356"
"22361"
"22369"
"22353"
"22355"
"22360"
"22365"
"22374"
}
subgraph cluster_2 {
label=parker
"22354"
"22359"
"22375"
}
subgraph cluster_3 {
label=condor
"22358"
"22362"
"22367"
"22373"
"22378"
}
subgraph cluster_4 {
label=kite
"22363"
"22366"
"22371"
"22376"
"22380"
}
subgraph cluster_5 {
label=coot
"22368"
"22372"
"22377"
"22379"
"22381"
}
"22316" [
label = "22316\nksh"
pname = "ksh"
kind = "proc"
];
"22324" [
label = "22324\nnmake"
pname = "nmake"
kind = "proc"
];
"22337" [
label = "22337\nksh"
pname = "ksh"
kind = "proc"
];
"22342" [
label = "22342\nksh"
pname = "ksh"
kind = "proc"
];
"22343" [
label = "22343\ngcc"
pname = "gcc"
kind = "proc"
];
"22344" [
label = "22344\nksh"
pname = "ksh"
kind = "proc"
];
"22345" [
label = "22345\ngcc"
pname = "gcc"
kind = "proc"
];
"22346" [
label = "22346\ncpp"
pname = "cpp"
kind = "proc"
];
"22347" [
label = "22347\ncc1"
pname = "cc1"
kind = "proc"
];
"22348" [
label = "22348\ncpp"
pname = "cpp"
kind = "proc"
];
"93736-32246" [
label = "93736-32246\n/home/ek/work/src/lefty/lefty.c"
fname = "/home/ek/work/src/lefty/lefty.c"
shape = "ellipse"
kind = "file"
];
"22349" [
label = "22349\nksh"
pname = "ksh"
kind = "proc"
];
"22350" [
label = "22350\ncc1"
pname = "cc1"
kind = "proc"
];
"93627-32246" [
label = "93627-32246\n/home/ek/work/src/lefty/gfxview.c"
fname = "/home/ek/work/src/lefty/gfxview.c"
shape = "ellipse"
kind = "file"
];
"22351" [
label = "22351\nas"
pname = "as"
kind = "proc"
];
"22352" [
label = "22352\ngcc"
pname = "gcc"
kind = "proc"
];
"22353" [
label = "22353\nksh"
pname = "ksh"
kind = "proc"
];
"22354" [
label = "22354\nksh"
pname = "ksh"
kind = "proc"
];
"22355" [
label = "22355\ngcc"
pname = "gcc"
kind = "proc"
];
"22356" [
label = "22356\ncpp"
pname = "cpp"
kind = "proc"
];
"22357" [
label = "22357\nas"
pname = "as"
kind = "proc"
];
"22358" [
label = "22358\nksh"
pname = "ksh"
kind = "proc"
];
"22359" [
label = "22359\ngcc"
pname = "gcc"
kind = "proc"
];
"22360" [
label = "22360\ncpp"
pname = "cpp"
kind = "proc"
];
"22361" [
label = "22361\ncc1"
pname = "cc1"
kind = "proc"
];
"93645-32246" [
label = "93645-32246\n/home/ek/work/src/lefty/txtview.c"
fname = "/home/ek/work/src/lefty/txtview.c"
shape = "ellipse"
kind = "file"
];
"22362" [
label = "22362\ngcc"
pname = "gcc"
kind = "proc"
];
"22363" [
label = "22363\nksh"
pname = "ksh"
kind = "proc"
];
"22365" [
label = "22365\ncc1"
pname = "cc1"
kind = "proc"
];
"22366" [
label = "22366\ngcc"
pname = "gcc"
kind = "proc"
];
"93638-32246" [
label = "93638-32246\n/home/ek/work/src/lefty/internal.c"
fname = "/home/ek/work/src/lefty/internal.c"
shape = "ellipse"
kind = "file"
];
"22367" [
label = "22367\ncpp"
pname = "cpp"
kind = "proc"
];
"22368" [
label = "22368\nksh"
pname = "ksh"
kind = "proc"
];
"22369" [
label = "22369\nas"
pname = "as"
kind = "proc"
];
"93642-32246" [
label = "93642-32246\n/home/ek/work/src/lefty/lex.c"
fname = "/home/ek/work/src/lefty/lex.c"
shape = "ellipse"
kind = "file"
];
"22371" [
label = "22371\ncpp"
pname = "cpp"
kind = "proc"
];
"22372" [
label = "22372\ngcc"
pname = "gcc"
kind = "proc"
];
"22373" [
label = "22373\ncc1"
pname = "cc1"
kind = "proc"
];
"88860-32246" [
label = "88860-32246\n/home/ek/dev/src/lefty/stringify.c"
fname = "/home/ek/dev/src/lefty/stringify.c"
shape = "ellipse"
kind = "file"
];
"22374" [
label = "22374\nas"
pname = "as"
kind = "proc"
];
"22375" [
label = "22375\nas"
pname = "as"
kind = "proc"
];
"22376" [
label = "22376\ncc1"
pname = "cc1"
kind = "proc"
];
"93626-32246" [
label = "93626-32246\n/home/ek/work/src/lefty/exec.c"
fname = "/home/ek/work/src/lefty/exec.c"
shape = "ellipse"
kind = "file"
];
"22377" [
label = "22377\ncpp"
pname = "cpp"
kind = "proc"
];
"22378" [
label = "22378\nas"
pname = "as"
kind = "proc"
];
"22379" [
label = "22379\ncc1"
pname = "cc1"
kind = "proc"
];
"93643-32246" [
label = "93643-32246\n/home/ek/work/src/lefty/parse.c"
fname = "/home/ek/work/src/lefty/parse.c"
shape = "ellipse"
kind = "file"
];
"22380" [
label = "22380\nas"
pname = "as"
kind = "proc"
];
"22381" [
label = "22381\nas"
pname = "as"
kind = "proc"
];
"37592-32246" [
label = "37592-32246\n/home/ek/dev/src/lefty/exec.h"
fname = "/home/ek/dev/src/lefty/exec.h"
shape = "ellipse"
kind = "file"
];
"135504-32246" [
label = "135504-32246\n/home/ek/work/sun4/lefty/display.o"
fname = "/home/ek/work/sun4/lefty/display.o"
shape = "ellipse"
kind = "file"
];
"22316" -> "22324" [
];
"22324" -> "22337" [
];
"22337" -> "22342" [
];
"22342" -> "22343" [
];
"22337" -> "22344" [
];
"22344" -> "22345" [
];
"22343" -> "22346" [
];
"22343" -> "22347" [
];
"22345" -> "22348" [
];
"22346" -> "93736-32246" [
];
"22337" -> "22349" [
];
"22345" -> "22350" [
];
"22348" -> "93627-32246" [
];
"22343" -> "22351" [
];
"22349" -> "22352" [
];
"22337" -> "22353" [
];
"22337" -> "22354" [
];
"22353" -> "22355" [
];
"22352" -> "22356" [
];
"22345" -> "22357" [
];
"22337" -> "22358" [
];
"22354" -> "22359" [
];
"22355" -> "22360" [
];
"22352" -> "22361" [
];
"22356" -> "93645-32246" [
];
"22358" -> "22362" [
];
"22337" -> "22363" [
];
"22355" -> "22365" [
];
"22363" -> "22366" [
];
"22360" -> "93638-32246" [
];
"22362" -> "22367" [
];
"22337" -> "22368" [
];
"22352" -> "22369" [
];
"22324" -> "93642-32246" [
];
"22366" -> "22371" [
];
"22368" -> "22372" [
];
"22362" -> "22373" [
];
"22367" -> "88860-32246" [
];
"22355" -> "22374" [
];
"22359" -> "22375" [
];
"22366" -> "22376" [
];
"22371" -> "93626-32246" [
];
"22372" -> "22377" [
];
"22362" -> "22378" [
];
"22372" -> "22379" [
];
"22377" -> "93643-32246" [
];
"22366" -> "22380" [
];
"22372" -> "22381" [
];
"22371" -> "37592-32246" [
];
"22375" -> "135504-32246" [
];

/* hack to increase node separation */
{	rank = same; "22337" -> "93642-32246" [style=invis,minlen=10]; }

}
```

### 8. `sdh.gv`
Source: [graphs/directed/sdh.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/sdh.gv)

```dot
digraph G {
	graph [bgcolor=black];	/* set background */
	edge [color=white];
	graph[page="8.5,11",size="7.5,7",ratio=fill,center=1];
	node[style=filled,label=""];
	subgraph ds3CTP {
		rank = same;
		node[shape=box,color=green];
		ds3CTP_1_1;
		ds3CTP_1_2;
		ds3CTP_5_1;
		ds3CTP_5_2;
	}
	subgraph t3TTP {
		rank = same;
		node[shape=invtriangle,color=red];
		t3TTP_1_1;
		t3TTP_5_2;
	}
	subgraph vc3TTP {
		rank = same;
		node[shape=invtriangle,color=red];
		vc3TTP_1_2;
		vc3TTP_5_1;
	}
	subgraph fabric {
		rank = same;
		node[shape=hexagon,color=blue];
		fabric_1_2;
		fabric_4_1;
		fabric_5_1;
	}
	subgraph xp {
		rank = same;
		node[shape=diamond,color=blue];
		xp_1_2;
		xp_4_1;
		xp_5_1;
	}
	subgraph au3CTP {
		rank = same;
		node[shape=box,color=green];
		au3CTP_1_2;
		au3CTP_4_1;
		au3CTP_4_2;
		au3CTP_5_1;
	}
	subgraph aug {
		rank = same;
		node[shape=invtrapezium,color=pink];
		aug_1_2;
		aug_4_1;
		aug_4_2;
		aug_5_1;
	}
	subgraph protectionTTP {
		rank = same;
		node[shape=invtriangle,color=red];
		prTTP_1_2;
		prTTP_4_1;
		prTTP_4_2;
		prTTP_5_1;
	}
	subgraph protectionGroup {
		rank = same;
		node[shape=hexagon,color=blue];
		pg_1_2;
		pg_4_1;
		pg_4_2;
		pg_5_1;
	}
	subgraph protectionUnit {
		rank = same;
		node[shape=diamond,color=blue];
		pu_1_2;
		pu_4_1;
		pu_4_2;
		pu_5_1;
	}
	subgraph protectionCTP {
		node[shape=box,color=green];
		prCTP_1_2;
		prCTP_4_1;
		prCTP_4_2;
		prCTP_5_1;
	}
	subgraph msTTP {
		rank = same;
		node[shape=invtriangle,color=red];
		msTTP_1_2;
		msTTP_4_1;
		msTTP_4_2;
		msTTP_5_1;
	}
	subgraph msCTP {
		rank = same;
		node[shape=box,color=green];
		msCTP_1_2;
		msCTP_3_1;
		msCTP_3_2;
		msCTP_4_1;
		msCTP_4_2;
		msCTP_5_1;
	}
	subgraph rsTTP {
		rank = same;
		node[shape=invtriangle,color=red];
		rsTTP_1_2;
		rsTTP_3_1;
		rsTTP_3_2;
		rsTTP_4_1;
		rsTTP_4_2;
		rsTTP_5_1;
	}
	subgraph rsCTP {
		rank = same;
		node[shape=box,color=green];
		rsCTP_1_2;
		rsCTP_2_1;
		rsCTP_2_2;
		rsCTP_3_1;
		rsCTP_3_2;
		rsCTP_4_1;
		rsCTP_4_2;
		rsCTP_5_1;
	}
	subgraph spiTTP {
		rank = same;
		node[shape=invtriangle,color=red];
		spiTTP_1_2;
		spiTTP_2_1;
		spiTTP_2_2;
		spiTTP_3_1;
		spiTTP_3_2;
		spiTTP_4_1;
		spiTTP_4_2;
		spiTTP_5_1;
	}
	subgraph me {
		rank = same;
		node[shape=box,peripheries=2];
		me_1;
		me_2;
		me_3;
		me_4;
		me_5;
	}
	subgraph client_server {
		edge[style=dotted,dir=none,weight=100];
		ds3CTP_1_1->t3TTP_1_1;
		ds3CTP_1_2->vc3TTP_1_2;
		au3CTP_1_2->aug_1_2->prTTP_1_2;
		prCTP_1_2->msTTP_1_2;
		msCTP_1_2->rsTTP_1_2;
		rsCTP_1_2->spiTTP_1_2;
		rsCTP_2_1->spiTTP_2_1;
		rsCTP_2_2->spiTTP_2_2;
		msCTP_3_1->rsTTP_3_1;
		rsCTP_3_1->spiTTP_3_1;
		msCTP_3_2->rsTTP_3_2;
		rsCTP_3_2->spiTTP_3_2;
		au3CTP_4_1->aug_4_1->prTTP_4_1;
		prCTP_4_1->msTTP_4_1;
		msCTP_4_1->rsTTP_4_1;
		rsCTP_4_1->spiTTP_4_1;
		au3CTP_4_2->aug_4_2->prTTP_4_2;
		prCTP_4_2->msTTP_4_2;
		msCTP_4_2->rsTTP_4_2;
		rsCTP_4_2->spiTTP_4_2;
		ds3CTP_5_1->vc3TTP_5_1;
		au3CTP_5_1->aug_5_1->prTTP_5_1;
		prCTP_5_1->msTTP_5_1;
		msCTP_5_1->rsTTP_5_1;
		rsCTP_5_1->spiTTP_5_1;
		ds3CTP_5_2->t3TTP_5_2;
	}
	subgraph trail {
		edge[style=dashed,dir=none];
		vc3TTP_1_2->vc3TTP_5_1;
		prTTP_1_2->prTTP_4_1;
		prTTP_4_2->prTTP_5_1;
		msTTP_1_2->msTTP_4_1;
		msTTP_4_2->msTTP_5_1;
		rsTTP_1_2->rsTTP_3_1;
		rsTTP_3_2->rsTTP_4_1;
		rsTTP_4_2->rsTTP_5_1;
		spiTTP_1_2->spiTTP_2_1;
		spiTTP_2_2->spiTTP_3_1;
		spiTTP_3_2->spiTTP_4_1;
		spiTTP_4_2->spiTTP_5_1;
	}
	subgraph contain {
		pu_1_2->pg_1_2;
		pu_4_1->pg_4_1;
		pu_4_2->pg_4_2;
		pu_5_1->pg_5_1;
		xp_1_2->fabric_1_2;
		xp_4_1->fabric_4_1;
		xp_5_1->fabric_5_1;
		fabric_1_2->me_1;
		fabric_4_1->me_4;
		fabric_5_1->me_5;
		pg_1_2->me_1;
		pg_4_1->me_4;
		pg_4_2->me_4;
		pg_5_1->me_5;
		t3TTP_1_1->me_1;
		t3TTP_5_2->me_5;
		vc3TTP_1_2->me_1;
		vc3TTP_5_1->me_5;
		prTTP_1_2->me_1;
		prTTP_4_1->me_4;
		prTTP_4_2->me_4;
		prTTP_5_1->me_5;
		msTTP_1_2->me_1;
		msTTP_4_1->me_4;
		msTTP_4_2->me_4;
		msTTP_5_1->me_5;
		rsTTP_1_2->me_1;
		rsTTP_3_1->me_3;
		rsTTP_3_2->me_3;
		rsTTP_4_1->me_4;
		rsTTP_4_2->me_4;
		rsTTP_5_1->me_5;
		spiTTP_1_2->me_1;
		spiTTP_2_1->me_2;
		spiTTP_2_2->me_2;
		spiTTP_3_1->me_3;
		spiTTP_3_2->me_3;
		spiTTP_4_1->me_4;
		spiTTP_4_2->me_4;
		spiTTP_5_1->me_5;
	}
	subgraph connectedBy {
		vc3TTP_1_2->fabric_1_2;
		au3CTP_1_2->fabric_1_2;
		au3CTP_4_1->fabric_4_1;
		au3CTP_4_2->fabric_4_1;
		vc3TTP_5_1->fabric_5_1;
		au3CTP_5_1->fabric_5_1;
		prTTP_1_2->pg_1_2;
		prTTP_4_1->pg_4_1;
		prTTP_4_2->pg_4_2;
		prTTP_5_1->pg_5_1;
		prCTP_1_2->pg_1_2;
		prCTP_4_1->pg_4_1;
		prCTP_4_2->pg_4_2;
		prCTP_5_1->pg_5_1;
	}
	subgraph crossConnection {
		edge[style=dotted,dir=none];
		vc3TTP_1_2->xp_1_2->au3CTP_1_2;
		prTTP_1_2->pu_1_2->prCTP_1_2;
		prTTP_4_1->pu_4_1->prCTP_4_1;
		au3CTP_4_1->xp_4_1->au3CTP_4_2;
		prTTP_4_2->pu_4_2->prCTP_4_2;
		prTTP_5_1->pu_5_1->prCTP_5_1;
		vc3TTP_5_1->xp_5_1->au3CTP_5_1;
	}
	subgraph bindingConnection {
		edge[style=bold,dir=none,weight=100];
		ds3CTP_1_1->ds3CTP_1_2;
		vc3TTP_1_2->au3CTP_1_2;
		prTTP_1_2->prCTP_1_2;
		msTTP_1_2->msCTP_1_2;
		rsTTP_1_2->rsCTP_1_2;
		rsCTP_2_1->rsCTP_2_2;
		rsTTP_3_1->rsCTP_3_1;
		msCTP_3_1->msCTP_3_2;
		rsTTP_3_2->rsCTP_3_2;
		prTTP_4_1->prCTP_4_1;
		msTTP_4_1->msCTP_4_1;
		rsTTP_4_1->rsCTP_4_1;
		au3CTP_4_1->au3CTP_4_2;
		prTTP_4_2->prCTP_4_2;
		msTTP_4_2->msCTP_4_2;
		rsTTP_4_2->rsCTP_4_2;
		prTTP_5_1->prCTP_5_1;
		msTTP_5_1->msCTP_5_1;
		rsTTP_5_1->rsCTP_5_1;
		ds3CTP_5_1->ds3CTP_5_2;
		vc3TTP_5_1->au3CTP_5_1;
	}
}
```

### 9. `shells.gv`
Source: [graphs/directed/shells.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/shells.gv)

```dot
digraph shells {
	size="7,8";
	node [fontsize=24, shape = plaintext];

	1972 -> 1976;
	1976 -> 1978;
	1978 -> 1980;
	1980 -> 1982;
	1982 -> 1984;
	1984 -> 1986;
	1986 -> 1988;
	1988 -> 1990;
	1990 -> future;

	node [fontsize=20, shape = box];
	{ rank=same;  1976 Mashey Bourne; }
	{ rank=same;  1978 Formshell csh; }
	{ rank=same;  1980 esh vsh; }
	{ rank=same;  1982 ksh "System-V"; }
	{ rank=same;  1984 v9sh tcsh; }
	{ rank=same;  1986 "ksh-i"; }
	{ rank=same;  1988 KornShell Perl rc; }
	{ rank=same;  1990 tcl Bash; }
	{ rank=same;  "future" POSIX "ksh-POSIX"; }

	Thompson -> Mashey;
	Thompson -> Bourne;
	Thompson -> csh;
	csh -> tcsh;
	Bourne -> ksh;
	Bourne -> esh;
	Bourne -> vsh;
	Bourne -> "System-V";
	Bourne -> v9sh;
	v9sh -> rc;
	Bourne -> Bash;
	"ksh-i" -> Bash;
	KornShell -> Bash;
	esh -> ksh;
	vsh -> ksh;
	Formshell -> ksh;
	csh -> ksh;
	KornShell -> POSIX;
	"System-V" -> POSIX;
	ksh -> "ksh-i";
	"ksh-i" -> KornShell;
	KornShell -> "ksh-POSIX";
	Bourne -> Formshell;

	edge [style=invis];
	1984 -> v9sh -> tcsh ;
	1988 -> rc -> KornShell;
	Formshell -> csh;
	KornShell -> Perl;
}
```

### 10. `states.gv`
Source: [graphs/directed/states.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/states.gv)

```dot
/*
The command line is

  dot -Tps -Grankdir=LR states.gv > states.ps

and the file is:
*/
digraph states {
    size="3,2";
	rankdir=LR;
    node [shape=ellipse];
    empty [label = "Empty"];
    stolen [label = "Stolen"];
    waiting [label = "Waiting"];
    full [label = "Full"];
    empty -> full [label = "return"]
    empty -> stolen [label = "dispatch", wt=28]
    stolen -> full [label = "return"];
    stolen -> waiting [label = "touch"];
    waiting -> full [label = "return"];
  }
```

### 11. `train11.gv`
Source: [graphs/directed/train11.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/train11.gv)

```dot
digraph G {
	size="6,6";
	node [shape=circle,fontsize=8];
	rankdir=LR;
	st9 -> st9 [label="11/1"];
	st9 -> st10 [label="10/1"];
	st8 -> st8 [label="10/1"];
	st8 -> st0 [label="00/-"];
	st7 -> st8 [label="10/1"];
	st7 -> st7 [label="00/1"];
	st6 -> st6 [label="01/1"];
	st6 -> st0 [label="00/-"];
	st5 -> st6 [label="01/1"];
	st5 -> st5 [label="11/1"];
	st4 -> st4 [label="01/1"];
	st4 -> st0 [label="00/-"];
	st3 -> st4 [label="01/1"];
	st3 -> st3 [label="00/1"];
	st2 -> st9 [label="11/1"];
	st2 -> st7 [label="00/1"];
	st2 -> st2 [label="01/1"];
	st10 -> st10 [label="10/1"];
	st10 -> st0 [label="00/-"];
	st1 -> st5 [label="11/1"];
	st1 -> st3 [label="00/1"];
	st1 -> st1 [label="10/1"];
	st0 -> st2 [label="01/-"];
	st0 -> st1 [label="10/-"];
	st0 -> st0 [label="00/0"];
}
```

### 12. `trapeziumlr.gv`
Source: [graphs/directed/trapeziumlr.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/trapeziumlr.gv)

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
      node [shape=trapezium];
      "Trapezium";
      ordering=out;
    }

    Trapezium -> A;
    Trapezium -> B;
    Trapezium -> C;
    Trapezium -> D;
    Trapezium -> E;
    Trapezium -> F;
    Trapezium -> G;
    Trapezium -> H;
    Trapezium -> I;
    Trapezium -> J;
    Trapezium -> K;
    Trapezium -> L;
    Trapezium -> M;
    Trapezium -> N;
    Trapezium -> O;
    Trapezium -> P;
    Trapezium -> Q;
    Trapezium -> R;
    Trapezium -> S;
    Trapezium -> T;
    Trapezium -> U;
    Trapezium -> V;
    Trapezium -> W;
    Trapezium -> X;
    Trapezium -> Y;
    Trapezium -> Z;

    { rank=same;
      node [shape=parallelogram];
      a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z;
    }

    a -> Trapezium;
    b -> Trapezium;
    c -> Trapezium;
    d -> Trapezium;
    e -> Trapezium;
    f -> Trapezium;
    g -> Trapezium;
    h -> Trapezium;
    i -> Trapezium;
    j -> Trapezium;
    k -> Trapezium;
    l -> Trapezium;
    m -> Trapezium;
    n -> Trapezium;
    o -> Trapezium;
    p -> Trapezium;
    q -> Trapezium;
    r -> Trapezium;
    s -> Trapezium;
    t -> Trapezium;
    u -> Trapezium;
    v -> Trapezium;
    w -> Trapezium;
    x -> Trapezium;
    y -> Trapezium;
    z -> Trapezium;
}
```
