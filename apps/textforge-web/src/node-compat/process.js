const unsupportedProcessAccess = () => {
  throw new Error('Node process APIs are unavailable in the browser TextForge shell.');
};

const createWritableStream = (writer) => ({
  fd: -1,
  write(value) {
    writer(String(value ?? ''));
    return true;
  },
});

const existingProcess = typeof globalThis.process === 'object' && globalThis.process !== null
  ? globalThis.process
  : {};

const browserProcess = {
  ...existingProcess,
  env: {
    ...(existingProcess.env ?? {}),
  },
  versions: {
    ...(existingProcess.versions ?? {}),
    node: existingProcess.versions?.node ?? '20',
  },
  pid: existingProcess.pid ?? 0,
  stdin: existingProcess.stdin ?? { fd: -1 },
  stdout: existingProcess.stdout ?? createWritableStream((value) => console.info(value)),
  stderr: existingProcess.stderr ?? createWritableStream((value) => console.error(value)),
  addListener: typeof existingProcess.addListener === 'function'
    ? existingProcess.addListener.bind(existingProcess)
    : () => browserProcess,
  on: typeof existingProcess.on === 'function'
    ? existingProcess.on.bind(existingProcess)
    : () => browserProcess,
  removeListener: typeof existingProcess.removeListener === 'function'
    ? existingProcess.removeListener.bind(existingProcess)
    : () => browserProcess,
  cwd: typeof existingProcess.cwd === 'function'
    ? existingProcess.cwd.bind(existingProcess)
    : () => '/',
  uptime: typeof existingProcess.uptime === 'function'
    ? existingProcess.uptime.bind(existingProcess)
    : () => performance.now() / 1000,
  exit: unsupportedProcessAccess,
};

globalThis.process = browserProcess;

export default browserProcess;
