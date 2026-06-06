import { dirnameWorkspacePath } from '@textforge/workspace';

export const workbenchUiStateStorageKey = 'textforge-workbench-ui-state:v1';
export const workbenchUiStateResourcePath = '/.textforge/state/workbench-ui.json';
export const workbenchUiStateFolderPath = dirnameWorkspacePath(workbenchUiStateResourcePath);

export function readStoredWorkbenchUiState() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(workbenchUiStateStorageKey);
    if (!raw) {
      return undefined;
    }

    return parseWorkbenchUiState(raw);
  } catch {
    return undefined;
  }
}

export function parseWorkbenchUiState(raw) {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function writeStoredWorkbenchUiState(state) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(workbenchUiStateStorageKey, JSON.stringify(state));
  } catch {
    // Ignore local UI-state persistence failures.
  }
}
