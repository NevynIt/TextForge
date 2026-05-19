import { useEffect, useRef, useState } from "preact/hooks";
import type { Terminal as XTermTerminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import type { PipelineValue, TextDocument } from "../domain/types";
import type { RegisteredLuaAction } from "../lua/luaScriptRegistry";
import type { LuaRunResult } from "../lua/types";

interface LuaConsolePanelProps {
  activeDocument?: TextDocument;
  actions: RegisteredLuaAction[];
  onRunCommand: (source: string) => Promise<LuaRunResult>;
  onRunActiveDocument: () => Promise<LuaRunResult>;
  onRunSelection: () => Promise<LuaRunResult>;
  selectedText?: string;
  onOpenResult: (value: PipelineValue) => void;
}

export function LuaConsolePanel({
  activeDocument,
  actions,
  onRunCommand,
  onRunActiveDocument,
  onRunSelection,
  selectedText,
  onOpenResult
}: LuaConsolePanelProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTermTerminal | null>(null);
  const fitRef = useRef<{ fit: () => void } | null>(null);
  const inputRef = useRef("");
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<PipelineValue | undefined>();

  useEffect(() => {
    if (!hostRef.current || terminalRef.current) {
      return;
    }
    let disposed = false;
    let cleanup = () => {};
    const resize = () => fitRef.current?.fit();
    window.addEventListener("resize", resize);
    void Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit"), import("@xterm/addon-search")]).then(
      ([terminalMod, fitMod, searchMod]) => {
        if (disposed || !hostRef.current) {
          return;
        }
        const terminal = new terminalMod.Terminal({
          convertEol: true,
          cursorBlink: true,
          fontFamily: "Consolas, 'Liberation Mono', monospace",
          fontSize: 13,
          theme: {
            background: "#151c21",
            foreground: "#f6f3e8",
            cursor: "#f6f3e8",
            selectionBackground: "#35566a"
          }
        });
        const fit = new fitMod.FitAddon();
        const search = new searchMod.SearchAddon();
        terminal.loadAddon(fit);
        terminal.loadAddon(search);
        terminal.open(hostRef.current);
        fit.fit();
        terminal.focus();
        writeIntro(terminal);
        terminalRef.current = terminal;
        fitRef.current = fit;
        const disposable = terminal.onData((data) => {
          void handleTerminalData(data);
        });
        cleanup = () => {
          disposable.dispose();
          terminal.dispose();
        };
      }
    );
    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      cleanup();
      terminalRef.current = null;
      fitRef.current = null;
    };
  }, []);

  useEffect(() => {
    fitRef.current?.fit();
  });

  async function handleTerminalData(data: string): Promise<void> {
    const terminal = terminalRef.current;
    if (!terminal || running) {
      return;
    }
    if (data === "\r") {
      const command = inputRef.current.trim();
      terminal.write("\r\n");
      inputRef.current = "";
      historyIndexRef.current = -1;
      if (!command) {
        terminal.write("> ");
        return;
      }
      historyRef.current = [...historyRef.current, command].slice(-100);
      await runAndWrite(command, () => executeConsoleCommand(command));
      return;
    }
    if (data === "\u007f") {
      if (inputRef.current.length) {
        inputRef.current = inputRef.current.slice(0, -1);
        terminal.write("\b \b");
      }
      return;
    }
    if (data === "\u001b[A" || data === "\u001b[B") {
      navigateHistory(data === "\u001b[A" ? -1 : 1);
      return;
    }
    if (data >= " " && data !== "\u007f") {
      inputRef.current += data;
      terminal.write(data);
    }
  }

  function navigateHistory(direction: number): void {
    const terminal = terminalRef.current;
    if (!terminal || !historyRef.current.length) {
      return;
    }
    const history = historyRef.current;
    const current = historyIndexRef.current < 0 ? history.length : historyIndexRef.current;
    const next = Math.max(0, Math.min(history.length - 1, current + direction));
    historyIndexRef.current = next;
    const value = history[next] || "";
    terminal.write(`\r\x1b[2K> ${value}`);
    inputRef.current = value;
  }

  async function runAndWrite(label: string, runner: () => Promise<LuaRunResult>): Promise<void> {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }
    setRunning(true);
    terminal.write(`running ${label}\r\n`);
    try {
      const result = await runner();
      if (result.output) {
        terminal.write(`${result.output}\r\n`);
      }
      if (result.ok && result.value) {
        setLastResult(result.value);
        const preview = describeTextPreview(result.value);
        if (preview) {
          terminal.write(`${preview}\r\n`);
        }
        terminal.write(`${describePipelineValue(result.value)}\r\n`);
      } else if (!result.ok) {
        terminal.write(`error: ${result.error || "Lua execution failed."}\r\n`);
      }
    } finally {
      setRunning(false);
      terminal.write("> ");
    }
  }

  async function executeConsoleCommand(command: string): Promise<LuaRunResult> {
    const parsed = parseConsoleCommand(command);
    if (parsed.kind === "help") {
      return { ok: true, output: consoleHelpText(actions), value: undefined };
    }
    if (parsed.kind === "actions") {
      return { ok: true, output: describeActions(actions), value: undefined };
    }
    if (parsed.kind === "selection") {
      return onRunSelection();
    }
    if (parsed.kind === "open-last") {
      if (!lastResult) {
        return { ok: false, output: "", error: "No previous result to open." };
      }
      onOpenResult(lastResult);
      return { ok: true, output: "opened previous result as document", value: undefined };
    }
    if (parsed.kind === "pipeline") {
      return onRunCommand(`return run(${luaString(parsed.id)})`);
    }
    if (parsed.kind === "action") {
      return onRunCommand(`return run_action(${luaString(parsed.id)})`);
    }
    if (parsed.kind === "open") {
      const result = await executeOpenCommand(parsed.command);
      if (result.ok && result.value) {
        onOpenResult(result.value);
        return { ...result, output: [result.output, "opened result as document"].filter(Boolean).join("\n") };
      }
      return result;
    }
    return onRunCommand(command);
  }

  async function executeOpenCommand(command: string): Promise<LuaRunResult> {
    const parsed = parseConsoleCommand(command);
    if (parsed.kind === "selection") {
      return onRunSelection();
    }
    if (parsed.kind === "pipeline") {
      return onRunCommand(`return run(${luaString(parsed.id)})`);
    }
    if (parsed.kind === "action") {
      return onRunCommand(`return run_action(${luaString(parsed.id)})`);
    }
    return onRunCommand(command);
  }

  return (
    <div class="lua-console-panel">
      <div class="lua-console-toolbar">
        <button type="button" disabled={running || activeDocument?.languageId !== "text.lua"} onClick={() => void runAndWrite(activeDocument?.fileName || "active Lua document", onRunActiveDocument)}>
          Run active
        </button>
        <button type="button" disabled={running || activeDocument?.languageId !== "text.lua" || !selectedText?.trim()} onClick={() => void runAndWrite("selected Lua", onRunSelection)}>
          Run selection
        </button>
        <button type="button" disabled={!lastResult} onClick={() => lastResult && onOpenResult(lastResult)}>
          Open result
        </button>
        <button
          type="button"
          onClick={() => {
            terminalRef.current?.clear();
            writeIntro(terminalRef.current);
          }}
        >
          Clear
        </button>
        <span>{actions.length} Lua action{actions.length === 1 ? "" : "s"}</span>
      </div>
      <div class="lua-terminal" ref={hostRef} />
    </div>
  );
}

function writeIntro(terminal: XTermTerminal | null): void {
  terminal?.write("TextForge Lua Console\r\n");
  terminal?.write("Commands run locally in the same sandbox used by Lua actions.\r\n");
  terminal?.write("Type help for shortcuts.\r\n");
  terminal?.write("> ");
}

type ParsedConsoleCommand =
  | { kind: "help" }
  | { kind: "actions" }
  | { kind: "selection" }
  | { kind: "open-last" }
  | { kind: "pipeline"; id: string }
  | { kind: "action"; id: string }
  | { kind: "open"; command: string }
  | { kind: "lua" };

function parseConsoleCommand(command: string): ParsedConsoleCommand {
  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "help" || lower === "?") {
    return { kind: "help" };
  }
  if (lower === "actions") {
    return { kind: "actions" };
  }
  if (lower === "selection" || lower === "run selection") {
    return { kind: "selection" };
  }
  if (lower === "open last") {
    return { kind: "open-last" };
  }
  if (lower.startsWith("open ")) {
    return { kind: "open", command: trimmed.slice(5).trim() };
  }
  if (lower.startsWith("run ")) {
    return { kind: "pipeline", id: trimmed.slice(4).trim() };
  }
  if (lower.startsWith("pipeline ")) {
    return { kind: "pipeline", id: trimmed.slice(9).trim() };
  }
  if (lower.startsWith("action ")) {
    return { kind: "action", id: trimmed.slice(7).trim() };
  }
  if (lower.startsWith("run-action ")) {
    return { kind: "action", id: trimmed.slice(11).trim() };
  }
  return { kind: "lua" };
}

function consoleHelpText(actions: RegisteredLuaAction[]): string {
  return [
    "Lua console shortcuts:",
    "  help                 show this message",
    "  actions              list registered Lua actions",
    "  run selection        run selected Lua from the active editor",
    "  run <pipeline-id>    run a whitelisted built-in bridge, e.g. run itm-to-graph",
    "  action <action-id>   run a registered Lua action",
    "  open <command>       run a shortcut or Lua expression and open the result as a document",
    "  open last            open the previous result as a document",
    "Lua helpers available in code: run(id), run_action(id), action(id), parse_itm(), parse_markdown().",
    actions.length ? `${actions.length} Lua action${actions.length === 1 ? "" : "s"} registered.` : "No Lua actions registered."
  ].join("\r\n");
}

function describeActions(actions: RegisteredLuaAction[]): string {
  if (!actions.length) {
    return "No Lua actions registered. Open a .lua document returning an action object.";
  }
  return actions
    .map((action) => `${action.id} - ${action.name} (${formatContract(action.input)} -> ${action.output})`)
    .join("\r\n");
}

function luaString(value: string): string {
  return JSON.stringify(value);
}

function describePipelineValue(value: PipelineValue): string {
  if (value.kind === "text") {
    return `returned ${value.languageId} text (${value.text.length} chars)`;
  }
  if (value.kind === "model") {
    return `returned ${value.modelType}`;
  }
  return `returned ${value.kind}`;
}

function describeTextPreview(value: PipelineValue): string {
  if (value.kind !== "text" || !value.text) {
    return "";
  }
  const maxLength = 800;
  const suffix = value.text.length > maxLength ? "\n..." : "";
  return value.text.slice(0, maxLength).replace(/\r?\n/g, "\r\n") + suffix;
}

interface LuaScriptManagerPanelProps {
  documents: TextDocument[];
  actions: RegisteredLuaAction[];
  onNewScript: () => void;
}

export function LuaScriptManagerPanel({ documents, actions, onNewScript }: LuaScriptManagerPanelProps) {
  const luaDocuments = documents.filter((document) => document.languageId === "text.lua" || document.fileName.toLowerCase().endsWith(".lua"));
  return (
    <div class="lua-script-panel">
      <div class="lua-console-toolbar">
        <button type="button" onClick={onNewScript}>New Lua script</button>
        <span>{luaDocuments.length} open Lua document{luaDocuments.length === 1 ? "" : "s"}</span>
      </div>
      <section>
        <h3>Registered actions</h3>
        {actions.length ? (
          <ul class="lua-action-list">
            {actions.map((action) => (
              <li key={action.pipelineId}>
                <strong>{action.name}</strong>
                <span>{formatContract(action.input)}{" -> "}{action.output}</span>
                <small>{action.documentName || action.fileName}{action.description ? ` - ${action.description}` : ""}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p class="empty-state">Open or create a Lua document returning an action object to register actions.</p>
        )}
      </section>
      <section>
        <h3>Accepted action shape</h3>
        <pre>{luaBoilerplate}</pre>
      </section>
    </div>
  );
}

function formatContract(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}

const luaBoilerplate = `return {
  id = "uppercase-lines",
  name = "Uppercase lines",
  category = "Lua Transform",
  input = "text.plain",
  output = "text.plain",
  run = function(input)
    return input:emit_text("text.plain", string.upper(input.text))
  end
}`;
