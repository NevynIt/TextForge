declare module "markdown-it" {
  export interface MarkdownItToken {
    content: string;
    info: string;
    map?: [number, number];
  }

  export default class MarkdownIt {
    constructor(options?: Record<string, unknown>);
    renderer: {
      rules: Record<string, ((tokens: MarkdownItToken[], index: number) => string) | undefined>;
    };
    render(source: string): string;
  }
}
