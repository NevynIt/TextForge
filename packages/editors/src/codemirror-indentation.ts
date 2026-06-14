export declare const INDENT_UNIT = "  ";
export declare const INDENT_WIDTH: number;

export declare function spacesToNextIndentStop(column: number, width?: number): number;

export declare function resolveGoToLinePosition(
  doc: { readonly lines: number; line(lineNumber: number): { readonly from: number; readonly length: number } },
  input: string | number,
): number | undefined;

export declare function insertSmartIndentation(target: unknown): boolean;

export declare function dedentSmartIndentation(target: unknown): boolean;

export declare function insertIndentedNewline(target: unknown): boolean;
