# ITM Markdown Report Smoke

```tf-md
%metadata {
  title: "ITM Markdown Report Smoke"
}
%require itm
%require itm-pub
```

```itm name=report-model
&roadmap [Capability] Capability roadmap
  &foundation [Capability] Foundation
  &delivery [Capability] Delivery
delivery @depends_on:foundation
```

## Catalogue

```itm-pub
source: report-model
projection: catalogue
title: "Catalogue smoke publication"
```

## Matrix

```itm-pub
source: report-model
projection: matrix
title: "Matrix smoke publication"
```

## Report

```itm-pub
source: report-model
projection: report
title: "Report smoke publication"
```
