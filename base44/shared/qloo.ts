export const QLOO_HOST = 'https://hackathon.api.qloo.com';

export const MAX_ANCHORS = 4;

// Anchor kind -> Qloo entity types used when resolving the teacher's reference.
// Every value below is from the API's own list of accepted types (actor, album,
// artist, author, book, brand, destination, director, locality, movie, person,
// place, podcast, tv_show, videogame). There is no music-genre type, so a genre
// anchor is searched untyped and then checked by name like every other anchor.
// `types` is sent as a repeated query parameter (Qloo documents it as an array).
export const KIND_TYPES = {
  Film: ['urn:entity:movie'],
  'TV show': ['urn:entity:tv_show'],
  Book: ['urn:entity:book'],
  Artist: ['urn:entity:artist'],
  'Music genre': [],
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
    subtype: result.subtype || result.type || (Array.isArray(result.types) ? result.types[0] : '') || '',
    typeLabel: typeLabel(result.subtype || result.type || (Array.isArray(result.types) ? result.types[0] : '')),
    popularity: typeof result.popularity === 'number' ? result.popularity : null,
  };
}

// /v2/tags returns { results: { tags: [{ id, name, type, parents, popularity }] } }.
// `take` is accepted (take=1 was verified to limit the list).
export const TAG_TAKE = 20;

/** A tag hit, kept as the evidence object for a Music genre anchor. */
export function pickTag(tag) {
  if (!tag || !tag.id || !tag.name) return null;
  return {
    tagId: String(tag.id),
    name: String(tag.name),
    typeLabel: 'genre',
    tagType: String(tag.type || ''),
    popularity: typeof tag.popularity === 'number' ? tag.popularity : null,
  };
}

/**
 * Genre tags first: a music-genre anchor wants the genre taxonomy, not a place
 * tag that merely shares the word ("Afro Beats Parties"), which Qloo also
 * returns for the same query.
 */
export function tagRank(tag) {
  return String(tag && tag.tagType).startsWith('urn:tag:genre:') ? 0 : 1;
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

// ---------------------------------------------------------------------------
// Anchor verification.
//
// /search is a fuzzy text match and returns no relevance score, so a 200 can
// hand back something that shares only a filler word with the teacher's anchor
// ("Nollywood drama" -> "Confessions of a Teenage Drama Queen"). Seeding Qloo
// with that would quietly put a wrong interest into the evidence chain, so every
// candidate is checked against the anchor's own wording first.
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'to', 'with', 'de', 'la']);

// Words that describe the *kind* of thing, not which thing: matching on them
// alone is what produces the false positives above.
const GENERIC_WORDS = new Set([
  'drama', 'film', 'films', 'movie', 'movies', 'series', 'show', 'shows', 'tv', 'book',
  'books', 'novel', 'music', 'genre', 'artist', 'artists', 'singer', 'band', 'group',
  'radio', 'programme', 'program', 'sport', 'sports', 'place', 'documentary', 'comedy',
  'album', 'song', 'songs', 'rapper', 'actor', 'actress', 'poet', 'poetry', 'theatre',
  'theater', 'game', 'videogame', 'podcast',
]);

/** Lowercase, strip punctuation: the comparable form of any name. */
export function nameKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The words in an anchor that identify *which* thing the teacher named. */
export function significantTokens(label) {
  return String(label || '')
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9']/g, ''))
    .filter((word) => {
      if (word.length < 2) return false;
      const key = word.toLowerCase();
      return !STOPWORDS.has(key) && !GENERIC_WORDS.has(key);
    });
}

const LEADING_ARTICLES = new Set(['the', 'a', 'an']);

/**
 * True only when the name Qloo returned carries the words we searched for as a
 * run — "Things Fall Apart" in "Things Fall Apart (The African Trilogy, #1)",
 * "Nollywood" in "Nollywood - Filmbusiness African Style".
 *
 * Checking a contiguous phrase rather than loose words is what keeps
 * "great cinema" from being answered by "Omniplex Cinema Birmingham - Great
 * Park", or "Afrobeats" by a bar called "Afro Beats": both recycle the anchor's
 * words but name something else. The one tolerance is the final word extending
 * ("afrobeat" answering "Afrobeats"). No match means the anchor stays
 * unresolved — never seeded with a lookalike.
 */
export function matchesAnchor(query, entityName) {
  const phrase = nameKey(query).split(' ').filter(Boolean);
  while (phrase.length && LEADING_ARTICLES.has(phrase[0])) phrase.shift();

  const words = nameKey(entityName).split(' ').filter(Boolean);
  if (!phrase.length || !words.length) return false;

  for (let start = 0; start + phrase.length <= words.length; start += 1) {
    let matched = true;
    for (let index = 0; index < phrase.length; index += 1) {
      const token = phrase[index];
      const word = words[start + index];
      const isLast = index === phrase.length - 1;
      if (word !== token && !(isLast && token.length >= 4 && word.startsWith(token))) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
}

export function round(value, places = 4) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}