import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { TextForgeWorkbenchApp } from './workbench/components/app.js';
import { createTextForgeWorkbenchController } from './workbench/controller/index.js';

let mountedShell;

export function bootTextForgeShell(rootElement) {
  if (mountedShell) {
    mountedShell.root.unmount();
    mountedShell.controller.dispose();
  }

  const controller = createTextForgeWorkbenchController();
  const root = createRoot(rootElement);
  root.render(React.createElement(TextForgeWorkbenchApp, { controller }));
  mountedShell = { controller, root };
  return mountedShell;
}
