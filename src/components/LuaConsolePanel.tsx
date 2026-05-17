import { useEffect, useRef, useState } from "preact/hooks";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import "@xterm/xterm/css/xterm.css";
import type { PipelineValue, TextDocument } from "../domain/types";
import type { RegisteredLuaAction } from "../lua/luaScriptRegistry";
import type { LuaRunResult } from "../lua/types";

interface LuaConsolePanelProps {
  activeDocument?: TextDocument;
  actions: RegisteredLuaAction[];
  onRunCommand: (source: string) => Promise<LuaRunResult>;
  onRunActiveDocument: () => Promise<LuaRunResult>;
  onOpenResult: (value: PipelineValue) => void;
}

export function LuaConsolePanel({
  activeDocument,
  actions,
  onRunCommand,
  onRunActiveDocument,
  onOpenResult
}: LuaConsolePanelProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const inputRef = useRef("");
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<PipelineValue | undefined>();

  useEffect(() => {
    if (!hostRef.current || terminalRef.current) {
      return;
    }
    const terminal = new Terminal({
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
    const fit = new FitAddon();
    const search = new SearchAddon();
    terminal.loadAddon(fit);
    terminal.loadAddon(search);
    terminal.open(hostRef.current);
    fit.fit();
    writeIntro(terminal);
    terminalRef.current = terminal;
    fitRef.current = fit;

    const resize = () => fit.fit();
    window.addEventListener("resize", resize);
    const disposable = terminal.onData((data) => {
      void handleTerminalData(data);
    });
    return () => {
      disposable.dispose();
      window.removeEventListener("resize", resize);
      terminal.dispose();
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
      await runAndWrite(command, () => onRunCommand(command));
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
        terminal.write(`${describePipelineValue(result.value)}\r\n`);
      } else if (!result.ok) {
        terminal.write(`error: ${result.error || "Lua execution failed."}\r\n`);
      }
    } finally {
      setRunning(false);
      terminal.write("> ");
    }
  }

  return (
    <div class="lua-console-panel">
      <div class="lua-console-toolbar">
        <button type="button" disabled={running || activeDocument?.languageId !== "text.lua"} onClick={() => void runAndWrite(activeDocument?.fileName || "active Lua document", onRunActiveDocument)}>
          Run active
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

function writeIntro(terminal: Terminal | null): void {
  terminal?.write("TextForge Lua Console\r\n");
  terminal?.write("Commands run locally in the same sandbox used by Lua actions.\r\n");
  terminal?.write("> ");
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
