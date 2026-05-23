import { bootTextForgeShell } from './workbench.js';

const app = document.getElementById('app');

if (!app) {
  throw new Error('TextForge app root not found.');
}

bootTextForgeShell(app);
