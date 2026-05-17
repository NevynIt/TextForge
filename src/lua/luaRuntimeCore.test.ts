import { describe, expect, it } from "vitest";
import { executeLuaInProcess } from "./luaRuntimeCore";

describe("Lua runtime core", () => {
  it("runs Lua against the active text input with bundled tf modules", () => {
    const result = executeLuaInProcess({
      mode: "script",
      source: `
        local tree = require("tf.tree")
        local nodes = input:parse_itt()
        local count = 0
        tree.walk(nodes, function()
          count = count + 1
        end)
        print("nodes", count)
        return input:emit_text("text.plain", tostring(count))
      `,
      input: {
        kind: "text",
        languageId: "text.indented-tree",
        text: "&root Root\n  Child\n"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.output).toContain("nodes\t2");
    expect(result.value).toMatchObject({ kind: "text", languageId: "text.plain", text: "2" });
  });

  it("does not expose browser or system modules to Lua", () => {
    const result = executeLuaInProcess({
      mode: "script",
      source: `
        assert(window == nil)
        assert(document == nil)
        assert(_G["fet" .. "ch"] == nil)
        assert(_G["XML" .. "HttpRequest"] == nil)
        local ok_js = pcall(require, "js")
        local ok_socket = pcall(require, "socket")
        assert(ok_js == false)
        assert(ok_socket == false)
        return "sandboxed"
      `
    });

    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({ kind: "text", text: "sandboxed" });
  });

  it("stops infinite loops with the instruction limit", () => {
    const result = executeLuaInProcess({
      mode: "script",
      source: "while true do end",
      limits: { maxInstructions: 20_000, maxWallTimeMs: 100 }
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Lua execution exceeded instruction/time limit");
  });

  it("reports invalid graph model returns instead of accepting them", () => {
    const result = executeLuaInProcess({
      mode: "script",
      source: `
        return {
          kind = "model",
          modelType = "model.graph",
          data = { nodes = "bad", edges = {} }
        }
      `
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("invalid graph model");
    expect(result.diagnostics?.[0]).toMatchObject({
      source: "lua-runtime",
      severity: "error",
      languageId: "text.lua"
    });
  });

  it("maps Lua syntax errors into source diagnostics", () => {
    const result = executeLuaInProcess({
      mode: "script",
      source: "local value =\nreturn value",
      fileName: "broken.lua"
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics?.[0]).toMatchObject({
      source: "lua-runtime",
      severity: "error",
      line: 1,
      column: 0
    });
    expect(result.diagnostics?.[0]?.message).toContain("Lua error:");
  });

  it("offsets selected Lua diagnostics back to the source document", () => {
    const result = executeLuaInProcess({
      mode: "script",
      source: "print('before')\nlocal value =",
      fileName: "selected.lua",
      sourceOffset: { from: 42, line: 7, column: 4 }
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics?.[0]).toMatchObject({
      line: 8,
      column: 0
    });
    expect(result.diagnostics?.[0]?.from).toBeGreaterThan(42);
  });

  it("lets Lua call whitelisted built-in transformation steps", () => {
    const result = executeLuaInProcess({
      mode: "script",
      source: `
        local graph = run("itt-to-graph")
        return input:emit_json(graph)
      `,
      input: {
        kind: "text",
        languageId: "text.indented-tree",
        text: "&a A\n  &b B @a\n"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.value?.kind).toBe("text");
    expect(result.value && "text" in result.value ? result.value.text : "").toContain('"modelType": "model.graph"');
  });

  it("exposes CSV parse and emit helpers to Lua", () => {
    const result = executeLuaInProcess({
      mode: "script",
      source: `
        local table = input:parse_csv(";")
        table.rows[#table.rows + 1] = { "Grace", "5" }
        return input:emit_csv(table, ";")
      `,
      input: {
        kind: "text",
        languageId: "text.csv",
        text: "name;score\nAda;3\n"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({
      kind: "text",
      languageId: "text.csv",
      text: "name;score\nAda;3\nGrace;5\n"
    });
  });

  it("lets Lua call the built-in delimited table bridge", () => {
    const result = executeLuaInProcess({
      mode: "command",
      source: `run("delimited-to-table")`,
      input: {
        kind: "text",
        languageId: "text.csv",
        text: "name,score\nAda,3\n"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({ kind: "model", modelType: "model.table" });
  });

  it("lets Lua console helpers call registered Lua actions", () => {
    const result = executeLuaInProcess({
      mode: "command",
      source: `run_action("uppercase")`,
      input: { kind: "text", languageId: "text.plain", text: "hello" },
      actions: [
        {
          id: "uppercase",
          name: "Uppercase",
          category: "Lua Transform",
          input: "text.plain",
          output: "text.plain",
          source: `
            return {
              id = "uppercase",
              name = "Uppercase",
              input = "text.plain",
              output = "text.plain",
              run = function(input)
                return input:emit_text("text.plain", string.upper(input.text))
              end
            }
          `,
          fileName: "uppercase.lua"
        }
      ]
    });

    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({ kind: "text", languageId: "text.plain", text: "HELLO" });
  });

  it("enforces Lua action input contracts for nested calls", () => {
    const result = executeLuaInProcess({
      mode: "command",
      source: `run_action("graph-only")`,
      input: { kind: "text", languageId: "text.plain", text: "hello" },
      actions: [
        {
          id: "graph-only",
          name: "Graph Only",
          category: "Lua Transform",
          input: "model.graph",
          output: "text.plain",
          source: `return { id = "graph-only", run = function(input) return input:emit_text("text.plain", "ok") end }`,
          fileName: "graph-only.lua"
        }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("expects model.graph, received text.plain");
  });

  it("enforces Lua action output contracts for nested calls", () => {
    const result = executeLuaInProcess({
      mode: "command",
      source: `run_action("bad-output")`,
      input: { kind: "text", languageId: "text.plain", text: "hello" },
      actions: [
        {
          id: "bad-output",
          name: "Bad Output",
          category: "Lua Transform",
          input: "text.plain",
          output: "text.json",
          source: `return { id = "bad-output", run = function(input) return input:emit_text("text.plain", "ok") end }`,
          fileName: "bad-output.lua"
        }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("declares text.json, returned text.plain");
  });

  it("limits recursive Lua action composition", () => {
    const result = executeLuaInProcess({
      mode: "command",
      source: `run_action("self")`,
      input: { kind: "text", languageId: "text.plain", text: "hello" },
      limits: { maxRecursionDepth: 2 },
      actions: [
        {
          id: "self",
          name: "Self",
          category: "Lua Transform",
          input: "text.plain",
          output: "text.plain",
          source: `return { id = "self", run = function(input) return action("self", input) end }`,
          fileName: "self.lua"
        }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("recursion limit exceeded");
  });
});
