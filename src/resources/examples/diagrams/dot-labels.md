# Graphviz DOT examples — 03 Records, tables, text, fonts, and i18n

Record nodes, HTML-like tables, labels, fonts, C-style text, Latin-1, Japanese, and Russian text examples.

## Documentation links

- [DOT language](https://graphviz.org/doc/info/lang.html)
- [Attributes](https://graphviz.org/docs/attrs/)
- [Node shapes](https://graphviz.org/doc/info/shapes.html)
- [Arrow shapes](https://graphviz.org/doc/info/arrows.html)
- [HTML-like labels](https://graphviz.org/doc/info/shapes.html#html)
- [Command-line tools/layout engines](https://graphviz.org/docs/layouts/)

## Examples

### 1. `Latin1.gv`
Source: [graphs/directed/Latin1.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/Latin1.gv)

```dot
digraph G {
graph [charset=latin1]
node [fontsize=10]
a [label = "���������������������������"];
}
```

### 2. `ctext.gv`
Source: [graphs/directed/ctext.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/ctext.gv)

```dot
digraph G {
	xyz [label = "hello\nworld",color="slateblue",fontsize=24,fontname="Palatino-Italic",style=filled,fontcolor="hotpink"];
	node [style=filled];
	red [color=red];
	green [color=green];
	blue [color=blue,fontcolor=black];
	cyan [color=cyan];
	magenta [color=magenta];
	yellow [color=yellow];
	orange [color=orange];
	red -> green;
	red -> blue;
	blue -> cyan;
	blue -> magenta;
	green -> yellow;
	green -> orange;
}
```

### 3. `hashtable.gv`
Source: [graphs/directed/hashtable.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/hashtable.gv)

```dot
digraph G {
	nodesep=.05;
	rankdir=LR;
	node [shape=record,width=.1,height=.1];

	node0 [label = "<f0> |<f1> |<f2> |<f3> |<f4> |<f5> |<f6> | ",height=2.0];
	node [width = 1.5];
	node1 [label = "{<n> n14 | 719 |<p> }"];
	node2 [label = "{<n> a1  | 805 |<p> }"];
	node3 [label = "{<n> i9  | 718 |<p> }"];
	node4 [label = "{<n> e5  | 989 |<p> }"];
	node5 [label = "{<n> t20 | 959 |<p> }"] ;
	node6 [label = "{<n> o15 | 794 |<p> }"] ;
	node7 [label = "{<n> s19 | 659 |<p> }"] ;

	node0:f0 -> node1:n;
	node0:f1 -> node2:n;
	node0:f2 -> node3:n;
	node0:f5 -> node4:n;
	node0:f6 -> node5:n;
	node2:p -> node6:n;
	node4:p -> node7:n;
}
```

### 4. `japanese.gv`
Source: [graphs/directed/japanese.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/japanese.gv)

```dot
digraph G {
  graph [label="下駄配列の派生図"]

  getas [label = "下駄配列"];
  new_getas  [label = "新下駄配列"];
  getas_in_fine_weather [label = "日和下駄配列"];
  black_lacquered_getas [label = "黒塗り下駄配列"];
  black_lacquered_getas_made_of_paulownia [label = "黒塗り桐下駄配列"];
  lacquered_getas [label = "塗り下駄配列"];
  new_JIS_getas [label = "新JIS下駄配列"];

  getas -> {
    getas_in_fine_weather
    lacquered_getas
    new_JIS_getas new_getas
    lacquered_getas
  };

  lacquered_getas -> black_lacquered_getas;
  black_lacquered_getas -> black_lacquered_getas_made_of_paulownia;
  black_lacquered_getas_made_of_paulownia -> black_lacquered_getas;

  black_lacquered_getas -> getas_in_fine_weather [style = dotted];
}
```

### 5. `psfonttest.gv`
Source: [graphs/directed/psfonttest.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/psfonttest.gv)

```dot
digraph G {
rankdir=LR
nodesep=0
node [shape=none margin=0]
edge [color=white]
"AvantGarde-Book" [fontname="AvantGarde-Book"]
"AvantGarde-Demi" [fontname="AvantGarde-Demi"]
"AvantGarde-BookOblique" [fontname="AvantGarde-BookOblique"]
"AvantGarde-DemiOblique" [fontname="AvantGarde-DemiOblique"]

"AvantGarde-Book" -> "AvantGarde-Demi" ->  "AvantGarde-BookOblique" -> "AvantGarde-DemiOblique"

"Bookman-Light" [fontname="Bookman-Light"]
"Bookman-Demi" [fontname="Bookman-Demi"]
"Bookman-LightItalic" [fontname="Bookman-LightItalic"]
"Bookman-DemiItalic" [fontname="Bookman-DemiItalic"]

"Bookman-Light" -> "Bookman-Demi" -> "Bookman-LightItalic" -> "Bookman-DemiItalic" 

"Courier" [fontname="Courier"]
"Courier-Bold" [fontname="Courier-Bold"]
"Courier-Oblique" [fontname="Courier-Oblique"]
"Courier-BoldOblique" [fontname="Courier-BoldOblique"]

"Courier" -> "Courier-Bold" -> "Courier-Oblique" -> "Courier-BoldOblique"

"Helvetica" [fontname="Helvetica"]
"Helvetica-Bold" [fontname="Helvetica-Bold"]
"Helvetica-Oblique" [fontname="Helvetica-Oblique"]
"Helvetica-BoldOblique" [fontname="Helvetica-BoldOblique"]

"Helvetica-Narrow" [fontname="Helvetica-Narrow"]
"Helvetica-Narrow-Bold" [fontname="Helvetica-Narrow-Bold"]
"Helvetica-Narrow-Oblique" [fontname="Helvetica-Narrow-Oblique"]
"Helvetica-Narrow-BoldOblique" [fontname="Helvetica-Narrow-BoldOblique"]

"Helvetica" -> "Helvetica-Bold" -> "Helvetica-Oblique" -> "Helvetica-BoldOblique"

"Helvetica-Narrow" -> "Helvetica-Narrow-Bold" -> "Helvetica-Narrow-Oblique" -> "Helvetica-Narrow-BoldOblique"

"NewCenturySchlbk-Roman" [fontname="NewCenturySchlbk-Roman"]
"NewCenturySchlbk-Bold" [fontname="NewCenturySchlbk-Bold"]
"NewCenturySchlbk-Italic" [fontname="NewCenturySchlbk-Italic"]
"NewCenturySchlbk-BoldItalic" [fontname="NewCenturySchlbk-BoldItalic"]

"NewCenturySchlbk-Roman" -> "NewCenturySchlbk-Bold" -> "NewCenturySchlbk-Italic" -> "NewCenturySchlbk-BoldItalic" 

"Palatino-Roman" [fontname="Palatino-Roman"]
"Palatino-Bold" [fontname="Palatino-Bold"]
"Palatino-Italic" [fontname="Palatino-Italic"]
"Palatino-BoldItalic" [fontname="Palatino-BoldItalic"]

"Palatino-Roman" -> "Palatino-Bold" -> "Palatino-Italic" -> "Palatino-BoldItalic"

"Times-Roman" [fontname="Times-Roman"]
"Times-Bold" [fontname="Times-Bold"]
"Times-Italic" [fontname="Times-Italic"]
"Times-BoldItalic" [fontname="Times-BoldItalic"]

"Times-Roman" -> "Times-Bold" -> "Times-Italic" -> "Times-BoldItalic"

"ZapfChancery-MediumItalic" [fontname="ZapfChancery-MediumItalic"]
"ZapfDingbats" [fontname="ZapfDingbats"]
"Symbol" [fontname="Symbol"]

"Symbol" -> "ZapfDingbats" -> "ZapfChancery-MediumItalic"
}
```

### 6. `record2.gv`
Source: [graphs/directed/record2.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/record2.gv)

```dot
digraph G {
    node [shape=record];
    a [label = "<f0> foo | x | <f1> bar"];
    b [label = "a | { <f0> foo | x | <f1> bar } | b"];
    a:f0 -> b:f1 
}
```

### 7. `records.gv`
Source: [graphs/directed/records.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/records.gv)

```dot
digraph G {
	rankdir=LR;
	node [shape=record];
	a [ label ="<bala> Graphs can\lbe fun\l|<f1> mid|<f2> right\r"];
	b [ label ="<left>   |<mid> b |   " ];
	c [ label ="<p1>   | c |<p2>   " ];
	x [ label ="<p1>   | x |<p2>   " ];
	y [ label ="<p1>   | y |<p2>   " ];
	z [ label ="   | z |<p2>   " ];
	a:bala -> b:left;
	a:f1 -> d;
	a:f2 -> y:"p1";
	c:"p1" -> d;
	b:mid -> x:"p1";
	c:"p2" -> y:"p2";
	b:left -> z:"p2";
}
```

### 8. `russian.gv`
Source: [graphs/directed/russian.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/russian.gv)

```dot
   digraph G {
Контрагенты -> БанковскиеСчета;
Организации -> БанковскиеСчета;
ВопросыДляАнкетирования -> ВариантыОтветовОпросов;
Контрагенты -> ДоговорыВзаиморасчетов;
Номенклатура -> ЕдиницыИзмерения;
НоменклатурныеГруппы -> ЕдиницыИзмерения;
СвойстваОбектов -> ЗначенияСвойствОбектов;
}
```

### 9. `structs.gv`
Source: [graphs/directed/structs.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/structs.gv)

```dot
digraph structs {
node [shape=record];
    struct1 [shape=record,label="<f0> left|<f1> middle|<f2> right"];
    struct2 [shape=record,label="<f0> one|<f1> two"];
    struct3 [shape=record,label="hello\nworld |{ b |{c|<here> d|e}| f}| g | h"];
    struct1:f1 -> struct2:f0;
    struct1:f2 -> struct3:here;
}
```

### 10. `table.gv`
Source: [graphs/directed/table.gv](https://github.com/mhansen/graphviz/blob/a03c5201b7aa2942ce994cb8d072abb3202bec2a/graphs/directed/table.gv)

```dot
digraph structs {
    node [shape=plaintext];

    struct1 [label=<<TABLE CELLPADDING="10" BORDER="0">
	<TR>
	    <TD HEIGHT="30" WIDTH="90">a</TD>
	    <TD>b</TD>
	    <TD>c</TD>
	</TR>
    </TABLE>>];

    struct2 [label=<<TABLE>
	<TR>
	    <TD COLSPAN="3">elefantel</TD>
	    <TD ROWSPAN="2" VALIGN="bottom" ALIGN="right">two</TD>
	</TR><TR>
	    <TD COLSPAN="2" ROWSPAN="2"><TABLE BGCOLOR="grey">
		<TR>
		    <TD>buca</TD>
		</TR><TR>
		    <TD BGCOLOR="yellow">c</TD>
		</TR><TR>
		    <TD>f</TD>
		</TR>
	    </TABLE></TD>
	    <TD>patratos</TD>
	</TR><TR>
	    <TD COLSPAN="2" ALIGN="right">4</TD>
	</TR>
	</TABLE>
    >];

    struct3 [label=<<TABLE CELLPADDING="5">
	<TR>
	    <TD ROWSPAN="3">Hello</TD>
	    <TD ROWSPAN="2" COLSPAN="3"><TABLE BORDER="4">
		<TR>
		    <TD COLSPAN="3">b</TD>
		</TR><TR>
		    <TD>a</TD>
		    <TD>dino</TD>
		    <TD>y</TD>
		</TR><TR>
		    <TD COLSPAN="3">rhino</TD>
		</TR>
	    </TABLE></TD>
	</TR><TR>
	    <TD COLSPAN="2">climb</TD>
	    <TD ROWSPAN="2">Up</TD>
	</TR><TR>
	    <TD COLSPAN="3">low</TD>
	</TR>
    </TABLE>>];

    struct1 -> struct3;
    struct1 -> struct2;
}
```
