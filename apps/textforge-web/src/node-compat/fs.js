const unsupportedFilesystemAccess = () => {
  throw new Error('Node fs APIs are unavailable in the browser TextForge shell.');
};

export const constants = {
  O_CREAT: 0x40,
  O_EXCL: 0x80,
  O_RDWR: 0x02,
};

export const close = unsupportedFilesystemAccess;
export const closeSync = unsupportedFilesystemAccess;
export const mkdir = unsupportedFilesystemAccess;
export const mkdirSync = unsupportedFilesystemAccess;
export const open = unsupportedFilesystemAccess;
export const openSync = unsupportedFilesystemAccess;
export const readFileSync = unsupportedFilesystemAccess;
export const realpath = unsupportedFilesystemAccess;
export const realpathSync = unsupportedFilesystemAccess;
export const renameSync = unsupportedFilesystemAccess;
export const rm = unsupportedFilesystemAccess;
export const rmSync = unsupportedFilesystemAccess;
export const rmdir = unsupportedFilesystemAccess;
export const rmdirSync = unsupportedFilesystemAccess;
export const stat = unsupportedFilesystemAccess;
export const statSync = unsupportedFilesystemAccess;
export const unlink = unsupportedFilesystemAccess;
export const unlinkSync = unsupportedFilesystemAccess;
export const writeSync = unsupportedFilesystemAccess;

export default {
  close,
  closeSync,
  constants,
  mkdir,
  mkdirSync,
  open,
  openSync,
  readFileSync,
  realpath,
  realpathSync,
  renameSync,
  rm,
  rmSync,
  rmdir,
  rmdirSync,
  stat,
  statSync,
  unlink,
  unlinkSync,
  writeSync,
};
