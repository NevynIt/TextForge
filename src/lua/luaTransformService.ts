import type { LuaActionDescriptor, LuaRunRequest, LuaRunResult } from "./types";
import { defaultLuaLimits } from "./types";

interface PendingLuaRun {
  resolve: (result: LuaRunResult) => void;
  reject: (error: Error) => void;
  timer: number;
  worker: Worker;
}

export class LuaTransformService {
  private sequence = 0;
  private pending = new Map<string, PendingLuaRun>();

  async run(request: LuaRunRequest): Promise<LuaRunResult> {
    if (typeof Worker === "undefined" || isLocalFileProtocol()) {
      return runInProcess(request);
    }
    const id = `lua-${++this.sequence}`;
    const limits = { ...defaultLuaLimits, ...(request.limits || {}) };
    let worker: Worker;
    try {
      worker = new Worker(new URL("./luaWorker.ts", import.meta.url), { type: "module" });
    } catch {
      return runInProcess(request);
    }
    return new Promise<LuaRunResult>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(id);
        worker.terminate();
        resolve({
          ok: false,
          output: "",
          error: "Lua execution exceeded instruction/time limit."
        });
      }, Math.max(50, limits.maxWallTimeMs + 100));
      this.pending.set(id, { resolve, reject, timer, worker });
      worker.onmessage = (event: MessageEvent<{ id: string; result: LuaRunResult }>) => {
        const pending = this.pending.get(event.data.id);
        if (!pending) {
          return;
        }
        window.clearTimeout(pending.timer);
        pending.worker.terminate();
        this.pending.delete(event.data.id);
        pending.resolve(event.data.result);
      };
      worker.onerror = (event) => {
        const pending = this.pending.get(id);
        if (!pending) {
          return;
        }
        window.clearTimeout(pending.timer);
        pending.worker.terminate();
        this.pending.delete(id);
        pending.resolve({ ok: false, output: "", error: event.message || "Lua worker failed." });
      };
      worker.postMessage({ id, request: { ...request, limits } });
    });
  }

  async inspectActions(request: Omit<LuaRunRequest, "mode">): Promise<LuaActionDescriptor[]> {
    const result = await this.run({ ...request, mode: "inspect" });
    if (!result.ok) {
      return [];
    }
    return result.actions || [];
  }
}

function isLocalFileProtocol(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "file:";
}

async function runInProcess(request: LuaRunRequest): Promise<LuaRunResult> {
  const { executeLuaInProcess } = await import("./luaRuntimeCore");
  return executeLuaInProcess(request);
}
