import { bootTextForgeShell } from './workbench.js';

export function mountTextForgeShell(rootElement = document.getElementById('app')) {
  if (!rootElement) {
    throw new Error('TextForge app root not found.');
  }

  bootTextForgeShell(rootElement);
}
