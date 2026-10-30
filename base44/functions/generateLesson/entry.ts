import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  COMPARE_SCHEMA,
  LESSON_SCHEMA,
  baselinePrompt,
  comparePrompt,
  demoPrompt,
  groundExamples,
  informedPrompt,
  normalizeLesson,
} from '../../shared/lesson.ts';

const MAX_ANCHORS = 4;

function cleanBrief(input) {
  const brief = input && typeof input === 'object' ? input : {};
  const objective = typeof brief.objective === 'string' ? brief.objective.trim().slice(0, 400) : '';
  const classLevel = typeof brief.classLevel === 'string' ? brief.classLevel.slice(0, 12) : 'SSS 2';
  const duration = Number(brief.duration);
  return {
    classLevel,
    objective,
    duration: Number.isFinite(duration) && duration >= 20 && duration <= 180 ? Math.round(duration) : 45,
    materials: Array.isArray(brief.materials) ? brief.materials.slice(0, 8).map(String) : [],
  };
}

function cleanAnchors(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((a) => a && typeof a.label === 'string' && a.label.trim())
    .slice(0, MAX_ANCHORS)
    .map((a) => ({ label: a.label.trim().slice(0, 80), kind: typeof a.kind === 'string' ? a.kind : 'Other' }));
}

function cleanEvidence(input) {
  const evidence = input && typeof input === 'object' ? input : {};
  return {
    mode: typeof evidence.mode === 'string' ? evidence.mode : 'unknown',
    anchors: Array.isArray(evidence.anchors)
      ? evidence.anchors.slice(0, MAX_ANCHORS).map((a) => ({
        label: String(a && a.label ? a.label : ''),
        kind: String(a && a.kind ? a.kind : ''),
        resolved: a && a.resolved && a.resolved.tagId
          ? { tagId: String(a.resolved.tagId), name: String(a.resolved.name || ''), typeLabel: 'genre' }
          : a && a.resolved && a.resolved.entityId
            ? { entityId: String(a.resolved.entityId), name: String(a.resolved.name || '') }
            : null,
      }))
      : [],
    candidates: Array.isArray(evidence.candidates)
      ? evidence.candidates.slice(0, 12).map((c) => ({
        entityId: String(c && c.entityId ? c.entityId : ''),
        name: String(c && c.name ? c.name : ''),
        typeLabel: String(c && c.typeLabel ? c.typeLabel : 'entity'),
        affinity: typeof (c && c.affinity) === 'number' ? c.affinity : null,
        drivers: Array.isArray(c && c.drivers)
          ? c.drivers.slice(0, 4).map((d) => ({ seed: String(d && d.seed ? d.seed : ''), score: typeof (d && d.score) === 'number' ? d.score : null }))
          : [],
      })).filter((c) => c.entityId && c.name && typeof c.affinity === 'number')
      : [],
  };
}

export default async function (req) {
  try {
    const payload = await req.json().catch(() => ({}));
    const brief = cleanBrief(payload.brief);
    const evidence = cleanEvidence(payload.evidence);
    const demo = payload.demo === true || evidence.mode === 'demo';
    const anchors = cleanAnchors(payload.anchors && payload.anchors.length ? payload.anchors : evidence.anchors);
    const curriculumOnly = !demo && evidence.mode === 'curriculum';

    if (brief.objective.length < 8) {
      return Response.json({ error: 'A learning objective of at least 8 characters is required.' }, { status: 400 });
    }

    if (demo && !anchors.length) {
      return Response.json({ error: 'Demo mode needs at least one teacher-entered reference.' }, { status: 400 });
    }
    if (!demo && !curriculumOnly && !evidence.candidates.length) {
      return Response.json({ error: 'No Qloo candidates were supplied. Continue with your own references without Qloo, or remove the anchors to build a curriculum-only lesson.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    const informedText = demo
      ? demoPrompt(brief, anchors)
      : informedPrompt(brief, evidence);

    const baselineRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: baselinePrompt(brief),
      response_json_schema: LESSON_SCHEMA,
      model: 'automatic',
    });
    const baseline = normalizeLesson(baselineRes);

    const informedRes = (demo || curriculumOnly)
      ? null
      : await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: informedText,
        response_json_schema: LESSON_SCHEMA,
        model: 'automatic',
      });
    const informed = curriculumOnly ? normalizeLesson(baselineRes) : normalizeLesson(informedRes);

    const grounded = curriculumOnly
      ? {
        examples: (informed.examples || []).slice(0, 3).map((example) => ({
          ...example,
          source: 'curriculum',
          evidenceRef: 'curriculum:generic',
        })),
        removed: [],
      }
      : groundExamples(informed.examples, { ...evidence, anchors }, demo);
    informed.examples = grounded.examples;

    const comparisonRes = curriculumOnly
      ? null
      : await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: comparePrompt(brief, baseline, informed, demo ? 'demo' : 'qloo'),
        response_json_schema: COMPARE_SCHEMA,
        model: 'automatic',
      });

    const comparison = curriculumOnly
      ? {
        summary: 'No cultural anchors were supplied, so StoryBridge produced a curriculum-only lesson without making Qloo recommendations.',
        changes: [
          { area: 'Cultural examples', baseline: 'Uses neutral curriculum examples.', informed: 'No cultural references were added because none were supplied.' },
          { area: 'Evidence', baseline: 'Based on the lesson objective and teaching brief.', informed: 'No Qloo entities, affinity scores or recommendations were used.' },
        ],
        cautions: ['This is a curriculum-only draft. Add teacher-chosen cultural anchors to request Qloo recommendations.'],
      }
      : comparisonRes && typeof comparisonRes === 'object'
        ? {
          summary: String(comparisonRes.summary || ''),
          changes: Array.isArray(comparisonRes.changes) ? comparisonRes.changes.slice(0, 5) : [],
          cautions: Array.isArray(comparisonRes.cautions) ? comparisonRes.cautions.slice(0, 3) : [],
        }
        : { summary: '', changes: [], cautions: [] };

    return Response.json({
      brief,
      mode: demo ? 'demo' : curriculumOnly ? 'curriculum' : 'qloo',
      baseline: {
        ...baseline,
        examples: (baseline.examples || []).slice(0, 3).map((e) => ({
          name: e.name,
          kind: e.kind || 'curriculum artefact',
          useInLesson: e.useInLesson,
          source: 'curriculum',
          evidenceRef: 'curriculum:generic',
        })),
      },
      informed,
      comparison,
      validation: {
        cited: grounded.examples.length,
        removed: grounded.removed,
        note: curriculumOnly
          ? 'No Qloo recommendations were used. The lesson uses neutral curriculum examples only.'
          : grounded.removed.length
            ? `${grounded.removed.length} cited item(s) were not in the verified result set and were removed.`
            : 'Every cited example was checked against the verified result set.',
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error && error.message ? error.message : 'Lesson generation failed.' }, { status: 500 });
  }
}