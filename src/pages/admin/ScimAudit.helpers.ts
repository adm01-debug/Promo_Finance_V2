export const operations = [
  'all',
  'list',
  'get',
  'create',
  'update',
  'patch',
  'replace',
  'delete',
  'auth',
];

export const resources = [
  'all',
  'Users',
  'Groups',
  'ServiceProviderConfig',
  'Schemas',
  'ResourceTypes',
];

export function statusVariant(code: number) {
  if (code >= 500) return 'destructive' as const;
  if (code >= 400) return 'secondary' as const;
  if (code >= 200 && code < 300) return 'default' as const;
  return 'outline' as const;
}

export function formatMs(ms: number | null) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
