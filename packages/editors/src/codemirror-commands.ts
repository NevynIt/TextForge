export declare const codeMirrorEditorCommandIds: ReadonlyArray<string>;

export declare const codeMirrorEditorCommandMetadata: Readonly<Record<string, {
  readonly label: string;
  readonly hotkey: string;
  readonly description: string;
  readonly keywords: ReadonlyArray<string>;
  readonly order: number;
}>>;

export declare const codeMirrorEditorCommandMap: Readonly<Record<string, (target: unknown) => boolean>>;

export declare function deleteSelectedLines(target: unknown): boolean;

export declare function toggleLineCommentIfSupported(view: unknown): boolean;

export declare function runCodeMirrorEditorCommand(view: unknown, commandId: string): boolean;

export declare function createCodeMirrorEditorCommandTarget(view: unknown): {
  readonly commandIds: ReadonlyArray<string>;
  execute(commandId: string): boolean;
};

export declare function createCodeMirrorEditorKeymap(): ReadonlyArray<unknown>;
