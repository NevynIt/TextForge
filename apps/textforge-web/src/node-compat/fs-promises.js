const unsupportedFilesystemAccess = () => {
  throw new Error('Node fs/promises APIs are unavailable in the browser TextForge shell.');
};

export const readFile = unsupportedFilesystemAccess;

export default {
  readFile,
};
