export function platform() {
  return 'browser';
}

export function tmpdir() {
  return '/tmp';
}

export const constants = {
  errno: {
    EBADF: 9,
    ENOENT: 2,
  },
};

export default {
  constants,
  platform,
  tmpdir,
};
