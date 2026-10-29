export const QLOO_HOST = 'https://hackathon.api.qloo.com';

export const MAX_ANCHORS = 4;

// Anchor kind -> Qloo entity types used when resolving the teacher's reference.
// `types` is sent as a repeated query parameter (Qloo documents it as an array).
export const KIND_TYPES = {
  Film: ['urn:entity:movie'],
  'TV show': ['urn:entity:tv_show'],
  Book: ['urn:entity:book'],
  Artist: ['urn:entity:artist'],
  'Music genre': ['urn:entity:artist'],
  Sport: ['urn:entity:person'],
  Place: ['urn:entity:locality', 'urn:entity:place'],
  'Radio programme': ['urn:entity:podcast'],
};

// Cross-domain example pools we ask Qloo Insights about for every run.
export const EXAMPLE_TYPES = [
  { type: 'urn:entity:movie', label: 'film' },
  { type: 'urn:entity:book', label: 'book' },
  { type: 'urn:entity:artist', label: 'music artist' },
];

export function typeLabel(subtype) {
  if (!subtype) return 'entity';
  const raw = String(subtype).split(':').pop();
  return raw.replace(/_/g, ' ');
}

function buildUrl(path, params) {
  const url = new URL(QLOO_HOST + path);
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') url.searchParams.append(key, String(item));
      });
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function errorMessage(status, body, fallback) {
  if (body && typeof body === 'object') {
    const parts = [];
    if (body.reason) parts.push(String(body.reason));
    if (body.message) parts.push(String(body.message));
    if (!parts.length && body.error) parts.push(String(body.error));
    if (parts.length) return parts.join(' — ');
  }
  return fallback || `HTTP ${status}`;
}

/**
 * One real Qloo GET call. Never throws: every failure is reported back so the
 * UI can stay truthful about what happened.
 */
export async function qlooGet({ path, params, apiKey, label, summary, timeoutMs = 12000 }) {
  const url = buildUrl(path, params);
  const started = Date.now();

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'X-Api-Key': apiKey, accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });

    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }

    return {
      label,
      path: url.pathname,
      summary: summary || '',
      status: res.status,
      ok: res.ok,
      ms: Date.now() - started,
      body,
      message: res.ok ? '' : errorMessage(res.status, body, `HTTP ${res.status}`),
    };
  } catch (error) {
    return {
      label,
      path: url.pathname,
      summary: summary || '',
      status: 0,
      ok: false,
      ms: Date.now() - started,
      body: null,
      message: error && error.name === 'TimeoutError'
        ? `Timed out after ${Math.round(timeoutMs / 1000)}s`
        : (error && error.message) || 'Network error',
    };
  }
}

export function pickEntity(result) {
  if (!result || !result.entity_id) return null;
  return {
    entityId: result.entity_id,
    name: result.name || '(unnamed entity)',
    subtype: result.subtype || result.type || '',
    typeLabel: typeLabel(result.subtype || result.type),
    popularity: typeof result.popularity === 'number' ? result.popularity : null,
  };
}

/** Per-recommendation explainability: which seed entities drove a result. */
export function extractDrivers(entity, seedNamesById) {
  const ex = entity && entity.query ? entity.query.explainability : null;
  if (!ex) return [];

  let list = [];
  if (Array.isArray(ex)) list = ex;
  else if (Array.isArray(ex.entities)) list = ex.entities;
  else if (Array.isArray(ex.contributors)) list = ex.contributors;
  else if (Array.isArray(ex.signal)) list = ex.signal;

  const out = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const id = item.entity_id || item.id || (item.entity && item.entity.entity_id);
    if (!id || !seedNamesById[id]) continue;
    const score = typeof item.score === 'number'
      ? item.score
      : (typeof item.affinity === 'number' ? item.affinity : null);
    out.push({ seed: seedNamesById[id], entityId: id, score });
  }
  return out;
}

export function round(value, places = 4) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}