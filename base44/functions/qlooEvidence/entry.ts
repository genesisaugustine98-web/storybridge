import { secrets } from 'base44:runtime';
import { EXAMPLE_TYPES, KIND_TYPES, MAX_ANCHORS, TAG_TAKE, extractDrivers, matchesAnchor, pickEntity, pickTag, qlooGet, round, significantTokens, tagRank, typeLabel } from '../../shared/qloo.ts';

const ENDPOINTS = [
  { method: 'GET', path: '/search', note: 'Resolves each teacher anchor into a real Qloo entity id.' },
  { method: 'GET', path: '/v2/tags', note: 'Resolves a Music genre anchor into a real Qloo genre tag id.' },
  { method: 'GET', path: '/v2/insights', note: 'Affinity-ranked related entities, used as candidate classroom examples.' },
];

function readKey() {
  try {
    return secrets.get('QLOO_API_KEY') || '';
  } catch {
    return '';
  }
}

function cleanAnchors(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((a) => a && typeof a.label === 'string' && a.label.trim())
    .slice(0, MAX_ANCHORS)
    .map((a) => ({
      label: a.label.trim().slice(0, 80),
      kind: KIND_TYPES[a.kind] ? a.kind : 'Other',
    }));
}

// Belt and braces: the key must never travel back to the browser, whatever a
// Qloo error body happens to echo.
function scrub(text, apiKey) {
  const value = text === undefined || text === null ? '' : String(text);
  return apiKey ? value.split(apiKey).join('[redacted]') : value;
}

// The trace row the UI renders: real path, real status, and Qloo's own error
// detail when the call failed.
function callRow(call, apiKey) {
  const row = {
    label: call.label,
    path: call.path,
    summary: call.summary,
    status: call.status,
    ok: call.ok,
    ms: call.ms,
  };
  if (!call.ok && call.message) row.message = scrub(call.message, apiKey);
  return row;
}

const SEARCH_TAKE = 6;

// One /search call, with every result checked against the anchor's wording.
async function searchVerified({ anchor, query, types, apiKey }) {
  const params = { query, take: SEARCH_TAKE, sort_by: 'match' };
  if (types.length) params.types = types;

  const call = await qlooGet({
    path: '/search',
    params,
    apiKey,
    label: `search${types.length ? '' : ' (all types)'}: ${query}`,
    summary: `query "${query}"${types.length ? `; types=${types.join(',')}` : '; no type filter'}; take=${SEARCH_TAKE}`,
  });

  const results = (call.body && Array.isArray(call.body.results)) ? call.body.results : [];
  const verified = [];
  const rejected = [];

  for (const raw of results) {
    const entity = pickEntity(raw);
    if (!entity) continue;
    if (matchesAnchor(query, entity.name)) verified.push(entity);
    else rejected.push(entity);
  }

  call.summary += `; ${verified.length}/${results.length} named your anchor`;

  return { call, verified, rejected };
}

async function resolveAnchor(anchor, apiKey) {
  const types = KIND_TYPES[anchor.kind] || [];
  const reduced = significantTokens(anchor.label).join(' ');
  const attempts = [];

  if (types.length) attempts.push({ query: anchor.label, types });
  attempts.push({ query: anchor.label, types: [] });
  // Last try with only the identifying words, which drops filler such as the
  // "drama" in "Nollywood drama" — the word that produced the false matches.
  if (reduced && reduced.toLowerCase() !== anchor.label.toLowerCase().trim()) {
    attempts.push({ query: reduced, types });
  }

  const calls = [];
  const rejected = [];
  let entity = null;

  for (const attempt of attempts) {
    const result = await searchVerified({ anchor, ...attempt, apiKey });
    calls.push(result.call);

    if (!result.call.ok) {
      // A rejected key fails every further call too: stop here.
      if (result.call.status === 401 || result.call.status === 403) break;
      continue;
    }

    if (result.verified.length) {
      entity = result.verified[0];
      break;
    }

    for (const near of result.rejected) rejected.push(near.name);
  }

  return { anchor, calls, entity, tag: null, rejected };
}

// One /v2/tags call for a music-genre anchor, same strict name check applied to
// the tag names Qloo returns.
async function searchTags({ query, apiKey }) {
  const call = await qlooGet({
    path: '/v2/tags',
    params: { 'filter.query': query, take: TAG_TAKE },
    apiKey,
    label: `tags: ${query}`,
    summary: `filter.query "${query}"; take=${TAG_TAKE}`,
  });

  const tags = (call.body && call.body.results && Array.isArray(call.body.results.tags))
    ? call.body.results.tags
    : [];

  const verified = [];
  const rejected = [];

  for (const raw of tags) {
    const tag = pickTag(raw);
    if (!tag) continue;
    if (matchesAnchor(query, tag.name)) verified.push(tag);
    else rejected.push(tag);
  }

  verified.sort((a, b) => tagRank(a) - tagRank(b));

  call.summary += `; ${verified.length}/${tags.length} named your anchor`;

  return { call, verified, rejected, total: tags.length };
}

// Genre anchors are tags in Qloo, not entities: nothing is searched in /search,
// so the entity types stay out of the way for this kind.
async function resolveGenreAnchor(anchor, apiKey) {
  const reduced = significantTokens(anchor.label).join(' ');
  const queries = [anchor.label];
  if (reduced && reduced.toLowerCase() !== anchor.label.toLowerCase().trim()) queries.push(reduced);

  const calls = [];
  const rejected = [];
  let tag = null;

  for (const query of queries) {
    const result = await searchTags({ query, apiKey });
    calls.push(result.call);

    if (!result.call.ok) {
      if (result.call.status === 401 || result.call.status === 403) break;
      continue;
    }

    if (result.verified.length) {
      tag = result.verified[0];
      break;
    }

    for (const near of result.rejected) rejected.push(near.name);
  }

  return { anchor, calls, entity: null, tag, rejected };
}

function unresolvedNote(anchor, rejected) {
  const closest = rejected.length
    ? `Qloo's closest suggestion, "${rejected[0]}", does not carry your wording, so it was rejected rather than seeded.`
    : `Qloo returned nothing for "${anchor.label}".`;
  return anchor.kind === 'Music genre'
    ? `${closest} No confident matching genre tag came back — try a more specific or alternative wording, such as the style's local name, a named artist, or a sub-genre.`
    : closest;
}

export default async function (req) {
  try {
    const payload = await req.json().catch(() => ({}));
    const anchors = cleanAnchors(payload.anchors);
    const probe = payload.probe === true;

    const apiKey = readKey();
    if (!apiKey) {
      return Response.json({
        mode: 'setup',
        detail: 'No QLOO_API_KEY is configured on the server, so no Qloo call can be made. Nothing on this screen is Qloo data.',
        anchors: anchors.map((a) => ({ ...a, resolved: null })),
        candidates: [],
        calls: [],
        endpoints: ENDPOINTS,
        fetchedAt: new Date().toISOString(),
      });
    }

    // Connection test: two real calls. /search comes first because /v2/insights
    // needs a real entity id in signal.interests.entities — asking it without one
    // is what made the old probe come back HTTP 400.
    if (probe || anchors.length === 0) {
      const search = await qlooGet({
        path: '/search',
        params: { query: 'The Dark Knight', types: ['urn:entity:movie'], take: 1 },
        apiKey,
        label: 'connection test 1 of 2 — /search',
        summary: 'query "The Dark Knight", types=urn:entity:movie, take=1',
      });

      if (!search.ok) {
        return Response.json({
          mode: 'unavailable',
          detail: `The connection test stopped at /search — Qloo returned HTTP ${search.status}. ${scrub(search.message, apiKey)}`.trim(),
          anchors: [],
          candidates: [],
          calls: [callRow(search, apiKey)],
          endpoints: ENDPOINTS,
          fetchedAt: new Date().toISOString(),
        });
      }

      const seed = ((search.body && Array.isArray(search.body.results)) ? search.body.results : [])
        .map(pickEntity)
        .find(Boolean);

      if (!seed) {
        return Response.json({
          mode: 'no-matches',
          detail: '/search answered HTTP 200 but returned no entity for "The Dark Knight". The Insights step was not attempted: it needs a real entity id, and inventing one would be fake data.',
          anchors: [],
          candidates: [],
          calls: [callRow(search, apiKey)],
          endpoints: ENDPOINTS,
          fetchedAt: new Date().toISOString(),
        });
      }

      const insights = await qlooGet({
        path: '/v2/insights',
        params: {
          'filter.type': 'urn:entity:movie',
          'signal.interests.entities': seed.entityId,
          take: 1,
        },
        apiKey,
        label: 'connection test 2 of 2 — /v2/insights',
        summary: `filter.type=urn:entity:movie; signal.interests.entities=${seed.entityId}; take=1`,
      });

      const calls = [callRow(search, apiKey), callRow(insights, apiKey)];

      if (!insights.ok) {
        return Response.json({
          mode: 'unavailable',
          detail: `/search found ${seed.name} (${seed.entityId}), but /v2/insights returned HTTP ${insights.status}. ${scrub(insights.message, apiKey)}`.trim(),
          anchors: [],
          candidates: [],
          calls,
          endpoints: ENDPOINTS,
          fetchedAt: new Date().toISOString(),
        });
      }

      return Response.json({
        mode: 'live',
        detail: `Both live calls succeeded — /search HTTP ${search.status}, /v2/insights HTTP ${insights.status} — seeded with the real entity id for ${seed.name}.`,
        anchors: [],
        candidates: [],
        calls,
        endpoints: ENDPOINTS,
        fetchedAt: new Date().toISOString(),
      });
    }

    const resolved = await Promise.all(anchors.map((anchor) => (
      anchor.kind === 'Music genre' ? resolveGenreAnchor(anchor, apiKey) : resolveAnchor(anchor, apiKey)
    )));

    const calls = [];
    for (const item of resolved) {
      for (const call of item.calls) calls.push(callRow(call, apiKey));
    }

    const seedEntities = resolved.filter((r) => r.entity).map((r) => r.entity);
    const seedIds = seedEntities.map((e) => e.entityId);
    const seedNamesById = {};
    for (const entity of seedEntities) seedNamesById[entity.entityId] = entity.name;

    // Verified genre tags seed Insights through a different parameter.
    const tagIds = resolved.filter((r) => r.tag).map((r) => r.tag.tagId);

    const anchorRows = resolved.map((r) => ({
      label: r.anchor.label,
      kind: r.anchor.kind,
      resolved: r.tag || r.entity,
      note: (r.tag || r.entity) ? '' : unresolvedNote(r.anchor, r.rejected),
    }));

    if (!seedIds.length && !tagIds.length) {
      const firstError = calls.find((c) => !c.ok);
      const rejectedCount = resolved.reduce((total, r) => total + (r.rejected ? r.rejected.length : 0), 0);
      return Response.json({
        mode: firstError && (firstError.status === 401 || firstError.status === 403) ? 'unavailable' : 'no-matches',
        detail: firstError && (firstError.status === 401 || firstError.status === 403)
          ? `Qloo rejected the API key: ${firstError.label} returned ${firstError.status}.`
          : rejectedCount
            ? `Qloo answered, but none of its suggestions carried your anchors' wording — ${rejectedCount} ${rejectedCount === 1 ? 'result was' : 'results were'} rejected, so there are no affinity results to show. Nothing has been invented to fill the gap.`
            : 'Qloo resolved none of your anchors, so there are no affinity results to show. Nothing has been invented to fill the gap.',
        anchors: anchorRows,
        candidates: [],
        calls,
        endpoints: ENDPOINTS,
        fetchedAt: new Date().toISOString(),
      });
    }

    // Only verified signals go in: entity ids, genre-tag ids, or both together.
    // Insights is never called with neither (Qloo answers that with HTTP 400).
    const signalParams = {};
    if (seedIds.length) signalParams['signal.interests.entities'] = seedIds.join(',');
    if (tagIds.length) signalParams['signal.interests.tags'] = tagIds.join(',');
    const signalNote = [
      seedIds.length ? `${seedIds.length} entity id${seedIds.length === 1 ? '' : 's'}` : '',
      tagIds.length ? `${tagIds.length} genre tag${tagIds.length === 1 ? '' : 's'}` : '',
    ].filter(Boolean).join(' + ');

    const insightCalls = await Promise.all(
      EXAMPLE_TYPES.map((target) => qlooGet({
        path: '/v2/insights',
        params: { 'filter.type': target.type, ...signalParams, take: 8, 'feature.explainability': 'true' },
        apiKey,
        label: `insights: ${target.label}`,
        summary: `filter.type=${target.type}; ${signalNote}; take=8`,
        timeoutMs: 15000,
      }))
    );

    for (const call of insightCalls) {
      calls.push(callRow(call, apiKey));
    }

    const candidates = [];
    const seen = new Set();

    for (const call of insightCalls) {
      const entities = call.body && call.body.results && Array.isArray(call.body.results.entities)
        ? call.body.results.entities
        : [];
      for (const entity of entities) {
        if (!entity || !entity.entity_id || seen.has(entity.entity_id)) continue;
        const affinity = round(entity.query && entity.query.affinity, 4);
        if (typeof affinity !== 'number') continue;
        seen.add(entity.entity_id);
        candidates.push({
          entityId: entity.entity_id,
          name: entity.name || '(unnamed entity)',
          typeLabel: typeLabel(entity.subtype),
          subtype: entity.subtype || '',
          affinity,
          drivers: extractDrivers(entity, seedNamesById),
        });
      }
    }

    candidates.sort((a, b) => b.affinity - a.affinity);
    const top = candidates.slice(0, 12);

    const failed = calls.filter((c) => !c.ok);
    const hardFail = failed.find((c) => c.status === 401 || c.status === 403);

    if (hardFail) {
      return Response.json({
        mode: 'unavailable',
        detail: `Qloo rejected the request (${hardFail.status}) during ${hardFail.label}.`,
        anchors: anchorRows,
        candidates: [],
        calls,
        endpoints: ENDPOINTS,
        fetchedAt: new Date().toISOString(),
      });
    }

    return Response.json({
      mode: top.length ? 'live' : 'no-matches',
      detail: top.length
        ? `${top.length} live Qloo ${top.length === 1 ? 'result' : 'results'} from ${calls.length} server-side ${calls.length === 1 ? 'call' : 'calls'}.`
        : 'Qloo answered, but returned no related entities with an affinity score for these anchors.',
      anchors: anchorRows,
      candidates: top,
      calls,
      endpoints: ENDPOINTS,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({
      mode: 'unavailable',
      detail: `The culture check could not run: ${error && error.message ? error.message : 'unknown error'}.`,
      anchors: [],
      candidates: [],
      calls: [],
      endpoints: ENDPOINTS,
      fetchedAt: new Date().toISOString(),
    }, { status: 200 });
  }
}