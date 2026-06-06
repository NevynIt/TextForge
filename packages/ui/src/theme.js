export function createWorkbenchTheme(overrides = {}) {
  const defaultTheme = {
    id: 'textforge-default',
    name: 'TextForge Default',
    mode: 'system',
    colors: {
      brand: '#152033',
      accent: '#2f8f88',
      background: '#0b1020',
      surface: '#101728',
      surfaceRaised: '#161f33',
      border: '#2a3347',
      text: '#e6edf7',
      mutedText: '#8fa0b8',
      danger: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
    },
    typography: {
      family: '"Inter", "Segoe UI", sans-serif',
      size: '14px',
      lineHeight: '1.5',
      weightRegular: 400,
      weightStrong: 600,
    },
    radius: '10px',
    shadow: '0 10px 24px rgb(2 6 23 / 0.18)',
  };

  return {
    ...defaultTheme,
    ...overrides,
    colors: {
      ...defaultTheme.colors,
      ...(overrides.colors ?? {}),
    },
    typography: {
      ...defaultTheme.typography,
      ...(overrides.typography ?? {}),
    },
  };
}

export const defaultTheme = createWorkbenchTheme();

