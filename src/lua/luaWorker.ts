import { executeLuaInProcess } from "./luaRuntimeCore";
import type { LuaRunRequest } from "./types";

self.onmessage = (event: MessageEvent<{ id: string; request: LuaRunRequest }>) => {
  const { id, request } = event.data;
  const result = executeLuaInProcess(request);
  self.postMessage({ id, result });
};
