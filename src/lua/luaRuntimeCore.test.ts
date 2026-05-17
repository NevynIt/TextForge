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
});
