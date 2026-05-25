# Phase 4 Markdown Preview {#phase4-preview .hero}

```tf-md
%metadata {
  title: "Phase 4 Markdown Preview"
  profile: "tf-md"
  profileVersion: "0.1"
}

%style .hero {
  color: "#12324f"
  font-weight: "700"
}

%style .callout {
  border-left: "4px solid #1f8b7d"
  padding-left: "1rem"
}
```

This bundled example exercises the Phase 4 TF-MD baseline. {.callout}

![Bundled phase 4 asset](assets/phase-4-diagram.svg)

## Mermaid example {.hero}

```mermaid
flowchart TD
  Need["Need"] --> Preview["Markdown preview"]
  Preview --> Assets["Generated assets"]
  Assets --> Verify["file:// validation"]
```

## Graphviz example

```graphviz
digraph G {
  rankdir=LR;
  Source -> Preview;
  Preview -> Export;
  Export -> Validate;
}
```
