import { createIssue, createResult } from './result.js';

function isRemoteUri(uri) {
  return /^https?:\/\//i.test(uri);
}

export function createCspCheck(options = {}) {
  return {
    id: options.id ?? 'security.csp',
    kind: 'csp',
    label: options.label ?? 'Content Security Policy',
    run(context) {
      const csp = context.manifest?.contentSecurityPolicy?.trim() ?? '';
      const diagnostics = [];

      if (!csp) {
        diagnostics.push(createIssue('Missing content security policy.', 'warning', context.resource));
      } else {
        if (!/default-src/i.test(csp)) {
          diagnostics.push(createIssue('CSP should declare a default-src directive.', 'warning', context.resource));
        }

        if (/unsafe-inline/i.test(csp)) {
          diagnostics.push(createIssue('CSP must not allow unsafe-inline.', 'error', context.resource));
        }
      }

      return createResult('security.csp', 'csp', diagnostics, 'CSP inspected.');
    },
  };
}

export function createManifestCheck(options = {}) {
  return {
    id: options.id ?? 'security.manifest',
    kind: 'manifest',
    label: options.label ?? 'Web app manifest',
    run(context) {
      const manifest = context.manifest;
      const diagnostics = [];

      if (!manifest) {
        diagnostics.push(createIssue('Missing web app manifest snapshot.', 'warning', context.resource));
      } else {
        if (!manifest.name && !manifest.shortName) {
          diagnostics.push(createIssue('Manifest should provide a name or shortName.', 'warning', context.resource));
        }

        if (!manifest.startUrl) {
          diagnostics.push(createIssue('Manifest should define a startUrl.', 'warning', context.resource));
        }

        if (!manifest.display) {
          diagnostics.push(createIssue('Manifest should define a display mode.', 'warning', context.resource));
        }
      }

      return createResult('security.manifest', 'manifest', diagnostics, 'Manifest inspected.');
    },
  };
}

export function createServiceWorkerCheck(options = {}) {
  return {
    id: options.id ?? 'security.serviceWorker',
    kind: 'service-worker',
    label: options.label ?? 'Service worker presence',
    run(context) {
      const diagnostics = [];
      const hasServiceWorker = context.manifest?.serviceWorker === true;

      if (!hasServiceWorker) {
        diagnostics.push(createIssue('Service worker registration was not declared.', 'warning', context.resource));
      }

      return createResult('security.serviceWorker', 'service-worker', diagnostics, 'Service worker inspected.');
    },
  };
}

export function createRemoteAssetCheck(options = {}) {
  return {
    id: options.id ?? 'security.remoteAsset',
    kind: 'remote-asset',
    label: options.label ?? 'Remote asset origin check',
    run(context) {
      const allowedOrigins = new Set(context.profile.allowRemoteOrigins ?? []);
      const diagnostics = (context.artifacts ?? []).flatMap((artifact) => {
        if (!isRemoteUri(artifact.uri)) {
          return [];
        }

        if (artifact.origin && allowedOrigins.has(artifact.origin)) {
          return [];
        }

        return [createIssue(`Remote asset ${artifact.uri} is not on an allowed origin.`, 'error', context.resource)];
      });

      return createResult('security.remoteAsset', 'remote-asset', diagnostics, 'Remote assets inspected.');
    },
  };
}

export function createForbiddenBrowserApiCheck(options = {}) {
  return {
    id: options.id ?? 'security.privilegedApi',
    kind: 'privileged-api',
    label: options.label ?? 'Forbidden browser API check',
    run(context) {
      const allowedApis = new Set(context.profile.allowedPrivilegedBrowserApis ?? []);
      const diagnostics = (context.privilegedApis ?? []).flatMap((api) =>
        allowedApis.has(api)
          ? []
          : [createIssue(`Privileged browser API ${api} is not allowed by the profile.`, 'error', context.resource)],
      );

      return createResult('security.privilegedApi', 'privileged-api', diagnostics, 'Privileged API use inspected.');
    },
  };
}

export function createForbiddenFilesystemApiCheck(options = {}) {
  return {
    id: options.id ?? 'security.filesystemApi',
    kind: 'filesystem-api',
    label: options.label ?? 'Forbidden filesystem API check',
    run(context) {
      const allowedApis = new Set(context.profile.allowedPrivilegedFilesystemApis ?? []);
      const diagnostics = (context.filesystemApis ?? []).flatMap((api) =>
        allowedApis.has(api)
          ? []
          : [createIssue(`Privileged filesystem API ${api} is not allowed by the profile.`, 'error', context.resource)],
      );

      return createResult('security.filesystemApi', 'filesystem-api', diagnostics, 'Filesystem API use inspected.');
    },
  };
}
