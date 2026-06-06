export declare function renderGraphvizToSvg(source: string): Promise<string>;
export declare function renderMermaidToSvg(source: string, options?: { readonly document?: Document; readonly id?: string }): Promise<string>;
export declare function rasterizeSvgToPngBytes(
  svgText: string,
  options?: { readonly document?: Document; readonly width?: number; readonly height?: number },
): Promise<Uint8Array>;
