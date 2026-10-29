export const pct = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '—';

export const mins = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? `${value} min` : '';

export const shortId = (id) => (id ? `${String(id).slice(0, 8)}…` : '');