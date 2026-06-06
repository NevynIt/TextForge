export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeTokens {
  readonly brand: string;
  readonly accent: string;
  readonly background: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly border: string;
  readonly text: string;
  readonly mutedText: string;
  readonly danger: string;
  readonly warning: string;
  readonly success: string;
}

export interface TypographyTokens {
  readonly family: string;
  readonly size: string;
  readonly lineHeight: string;
  readonly weightRegular: number;
  readonly weightStrong: number;
}

export interface WorkbenchTheme {
  readonly id: string;
  readonly name: string;
  readonly mode: ThemeMode;
  readonly colors: ThemeTokens;
  readonly typography: TypographyTokens;
  readonly radius: string;
  readonly shadow: string;
}

export declare function createWorkbenchTheme(overrides?: Partial<WorkbenchTheme>): WorkbenchTheme;
export declare const defaultTheme: WorkbenchTheme;

