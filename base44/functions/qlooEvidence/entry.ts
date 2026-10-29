import { secrets } from 'base44:runtime';
import { EXAMPLE_TYPES, KIND_TYPES, MAX_ANCHORS, extractDrivers, pickEntity, qlooGet, round, typeLabel } from '../../shared/qloo.ts';

const ENDPOINTS = [
  { method: 'GET', path: '/search', note: 'Resolves each teacher anchor into a real Qloo entity id.' },
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

async function resolveAnchor(anchor, apiKey) {
  const types = KIND_TYPES[anchor.kind] || [];
  const query = { query: anchor.label, take: 3, sort_by: 'match' };
  const first = await qlooGet({
    path: '/search',
    params: { ...query, types },
    apiKey,
    label: `search: ${anchor.label}`,
    summary: `query "${anchor.label}"`,
  });

  const results = (first.body && Array.isArray(first.body.results)) ? first.body.results : [];
  const best = results.map(pickEntity).find(Boolean);

  if (best) return { anchor, call: first, entity: best };

  // Nothing in the mapped type(s): ask again without a type filter so the
  // teacher still sees exactly what Qloo returned — never a guess.
  const fallback = await qlooGet({
    path: '/search',
    params: query,
    apiKey,
    label: `search (all types): ${anchor.label}`,
    summary: `query "${anchor.label}"`,
  });
  const fallbackResults = (fallback.body && Array.isArray(fallback.body.results)) ? fallback.body.results : [];
  const fallbackBest = fallbackResults.map(pickEntity).find(Boolean);

  return { anchor, call: fallback, entity: fallbackBest || null, firstCall: first };
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

    // A real (small) call — the app only says "live" after Qloo actually answers.
    if (probe || anchors.length === 0) {
      const ping = await qlooGet({
        path: '/v2/insights',
        params: { 'filter.type': 'urn:entity:movie', take: 1 },
        apiKey,
        label: 'status check',
        summary: 'filter.type=urn:entity:movie, take=1',
      });

      if (!ping.ok) {
        return Response.json({
          mode: 'unavailable',
          detail: `The server has a key, but Qloo did not answer successfully: ${ping.message}.`,
          anchors: [],
          candidates: [],
          calls: [{ label: ping.label, path: ping.path, summary: ping.summary, status: ping.status, ok: ping.ok, ms: ping.ms }],
          endpoints: ENDPOINTS,
          fetchedAt: new Date().toISOString(),
        });
      }

      return Response.json({
        mode: 'live',
        detail: 'Qloo answered a live status call, so server-side calls are working.',
        anchors: [],
        candidates: [],
        calls: [{ label: ping.label, path: ping.path, summary: ping.summary, status: ping.status, ok: true, ms: ping.ms }],
        endpoints: ENDPOINTS,
        fetchedAt: new Date().toISOString(),
      });
    }

    const resolved = await Promise.all(anchors.map((anchor) => resolveAnchor(anchor, apiKey)));

    const calls = [];
    for (const item of resolved) {
      if (item.firstCall && item.firstCall !== item.call) {
        calls.push({ label: item.firstCall.label, path: item.firstCall.path, summary: item.firstCall.summary, status: item.firstCall.status, ok: item.firstCall.ok, ms: item.firstCall.ms });
      }
      calls.push({ label: item.call.label, path: item.call.path, summary: item.call.summary, status: item.call.status, ok: item.call.ok, ms: item.call.ms });
    }

    const seedEntities = resolved.filter((r) => r.entity).map((r) => r.entity);
    const seedIds = seedEntities.map((e) => e.entityId);
    const seedNamesById = {};
    for (const entity of seedEntities) seedNamesById[entity.entityId] = entity.name;

    const anchorRows = resolved.map((r) => ({
      label: r.anchor.label,
      kind: r.anchor.kind,
      resolved: r.entity,
      note: r.entity ? '' : `Qloo returned no entity for "${r.anchor.label}".`,
    }));

    if (!seedIds.length) {
      const firstError = calls.find((c) => !c.ok);
      return Response.json({
        mode: firstError && (firstError.status === 401 || firstError.status === 403) ? 'unavailable' : 'no-matches',
        detail: firstError && (firstError.status === 401 || firstError.status === 403)
          ? `Qloo rejected the API key: ${firstError.label} returned ${firstError.status}.`
          : 'Qloo resolved none of your anchors, so there are no affinity results to show. Nothing has been invented to fill the gap.',
        anchors: anchorRows,
        candidates: [],
        calls,
        endpoints: ENDPOINTS,
        fetchedAt: new Date().toISOString(),
      });
    }

    const insightCalls = await Promise.all(
      EXAMPLE_TYPES.map((target) => qlooGet({
        path: '/v2/insights',
        params: {
          'filter.type': target.type,
          'signal.interests.entities': seedIds.join(','),
          take: 8,
          'feature.explainability': 'true',
        },
        apiKey,
        label: `insights: ${target.label}`,
        summary: `filter.type=${target.type}; ${seedIds.length} seed ${seedIds.length === 1 ? 'entity' : 'entities'}; take=8`,
        timeoutMs: 15000,
      }))
    );

    for (const call of insightCalls) {
      calls.push({ label: call.label, path: call.path, summary: call.summary, status: call.status, ok: call.ok, ms: call.ms });
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