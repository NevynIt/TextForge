declare module "jsmind" {
  export default class jsMind {
    constructor(options: Record<string, unknown>);
    show(mind: unknown, keepCenter?: boolean): void;
    resize?(): void;
    expand_all?(): void;
    collapse_all?(): void;
    expand_to_depth?(depth: number): void;
    expand_node?(id: string): void;
    collapse_node?(id: string): void;
    get_node?(id: string): any;
    select_node?(id: string): void;
    scroll_node_to_center?(id: string): void;
  }
}

declare module "jsmind/style/jsmind.css";

declare module "graphology-layout/circular.js" {
  const layout: { assign: (graph: unknown, options?: Record<string, unknown>) => void };
  export default layout;
}

declare module "graphology-layout/random.js" {
  const layout: { assign: (graph: unknown, options?: Record<string, unknown>) => void };
  export default layout;
}

declare module "graphology-layout-forceatlas2" {
  const layout: {
    assign: (graph: unknown, options?: Record<string, unknown>) => void;
    inferSettings?: (graph: unknown) => Record<string, unknown>;
  };
  export default layout;
}

declare module "graphology-layout-noverlap" {
  const layout: { assign: (graph: unknown, options?: Record<string, unknown>) => void };
  export default layout;
}

declare module "graphology-metrics/centrality/pagerank.js" {
  const pagerank: (graph: unknown, options?: Record<string, unknown>) => Record<string, number>;
  export default pagerank;
}
