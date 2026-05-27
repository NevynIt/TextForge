import '@textforge/vendor/xterm.css';
import './styles.css';
import { mountTextForgeShell } from './main.js';

function loadTextForgeShell() {
  mountTextForgeShell();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadTextForgeShell, { once: true });
} else {
  loadTextForgeShell();
}
