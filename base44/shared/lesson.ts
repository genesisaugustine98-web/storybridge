export const LESSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lessonTitle', 'curriculumObjective', 'outcomes', 'examples', 'plan', 'teacherScript', 'activity', 'assessment', 'handout'],
  properties: {
    lessonTitle: { type: 'string' },
    curriculumObjective: { type: 'string' },
    outcomes: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
    examples: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'kind', 'useInLesson', 'evidenceRef'],
        properties: {
          name: { type: 'string' },
          kind: { type: 'string' },
          useInLesson: { type: 'string' },
          evidenceRef: { type: 'string' },
        },
      },
    },
    plan: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['phase', 'minutes', 'teacherMoves', 'learnersDo'],
        properties: {
          phase: { type: 'string' },
          minutes: { type: 'number' },
          teacherMoves: { type: 'array', items: { type: 'string' } },
          learnersDo: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    teacherScript: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['cue', 'say'],
        properties: {
          cue: { type: 'string' },
          say: { type: 'string' },
          note: { type: 'string' },
        },
      },
    },
    activity: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'minutes', 'grouping', 'steps', 'successLooksLike'],
      properties: {
        title: { type: 'string' },
        minutes: { type: 'number' },
        grouping: { type: 'string' },
        materials: { type: 'array', items: { type: 'string' } },
        steps: { type: 'array', items: { type: 'string' } },
        successLooksLike: { type: 'array', items: { type: 'string' } },
      },
    },
    assessment: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'marks', 'answer', 'rubric'],
        properties: {
          question: { type: 'string' },
          marks: { type: 'number' },
          answer: { type: 'string' },
          rubric: {
            type: 'array',
            minItems: 2,
            maxItems: 3,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['band', 'descriptor'],
              properties: {
                band: { type: 'string' },
                descriptor: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handout: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'intro', 'sections', 'footer'],
      properties: {
        title: { type: 'string' },
        intro: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['heading', 'body'],
            properties: {
              heading: { type: 'string' },
              body: { type: 'string' },
              prompts: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        footer: { type: 'string' },
      },
    },
  },
};

export const COMPARE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'changes', 'cautions'],
  properties: {
    summary: { type: 'string' },
    changes: {
      type: 'array',
      minItems: 2,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['area', 'baseline', 'informed'],
        properties: {
          area: { type: 'string' },
          baseline: { type: 'string' },
          informed: { type: 'string' },
        },
      },
    },
    cautions: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' } },
  },
};

const HOUSE_STYLE = `Write for a real Nigerian secondary-school classroom. Be concrete and short — a teacher should be able to teach from this without rewriting it.
Use Nigerian spellings and exam-board phrasing (WAEC/NECO style). Never address pupils as a group in the script using invented names.`;

function briefLines(brief) {
  return [
    `- Class level: ${brief.classLevel}`,
    `- Objective or topic: ${brief.objective}`,
    `- Lesson duration: ${brief.duration} minutes`,
    `- Available materials: ${(brief.materials || []).join('; ') || 'chalkboard and talk only'}`,
  ].join('\n');
}

export function baselinePrompt(brief) {
  return `You are an experienced Nigerian English Language teacher writing a curriculum-only lesson plan.

BRIEF
${briefLines(brief)}

TASK
Produce one complete lesson exactly to the JSON schema.

RULES FOR THIS BASELINE DRAFT
- Plan strictly inside ${brief.duration} minutes and use only the listed materials.
- Do NOT mention any film, television show, book title, musician, artist, sports figure, or named place. No pop culture at all.
- In "examples", give up to 3 neutral, curriculum-style artefacts a teacher would normally use (for example "a school notice on the board", "an official health poster", "a textbook comprehension passage"). Set evidenceRef to "curriculum:generic" for every one.
- This draft is the control condition of a comparison. Keep it competent and plain, not weak or obviously bad.
- 3 assessment questions only, each with a short answer and a 2-3 band rubric.
- The handout must be printable and usable with no internet access.

${HOUSE_STYLE}`;
}

export function informedPrompt(brief, evidence) {
  const lines = (evidence.candidates || []).map((c, i) => {
    const drivers = (c.drivers || [])
      .map((d) => `${d.seed}${typeof d.score === 'number' ? ` (${d.score})` : ''}`)
      .join('; ');
    return `${i + 1}. "${c.name}" — ${c.typeLabel}; Qloo affinity ${c.affinity}${drivers ? `; linked to the teacher's anchors: ${drivers}` : ''}; entity id ${c.entityId}`;
  }).join('\n');

  const anchorList = (evidence.anchors || [])
    .filter((a) => a.resolved)
    .map((a) => `"${a.label}" (${a.kind}) -> Qloo entity "${a.resolved.name}" [${a.resolved.entityId}]`)
    .join('\n') || 'none resolved';

  return `You are an experienced Nigerian English Language teacher writing a culturally grounded lesson plan.

BRIEF
${briefLines(brief)}

TEACHER-CHOSEN CULTURAL ANCHORS (resolved by Qloo)
${anchorList}

QLOO AFFINITY RESULTS (real API output — this list is the ONLY cultural material you may cite)
${lines || 'none'}

TASK
Produce one complete lesson exactly to the JSON schema.

RULES
- Choose at most 3 examples in "examples", and copy each "name" EXACTLY from the Qloo list above. Choose ones you can genuinely teach persuasive language with.
- Set "evidenceRef" to "qloo:<the entity id from that row>".
- "useInLesson" must explain the classroom move in one or two sentences — what the teacher asks pupils to notice in that example. It is your teaching reasoning, not Qloo's.
- Do NOT write any affinity number, percentage or score anywhere in the prose. The teacher sees the real scores in the evidence panel; you must not restate or re-round them.
- NEVER claim that an affinity score shows pupils will like something, learn from it, or that it suits their age or level. Affinity only describes taste adjacency between audiences.
- If a chosen example could be unsuitable for a classroom, say so plainly in "useInLesson" and let the teacher decide.
- Plan strictly inside ${brief.duration} minutes and use only the listed materials.
- 3 assessment questions only, each with a short answer and a 2-3 band rubric.
- The handout must be printable and usable with no internet access.

${HOUSE_STYLE}`;
}

export function demoPrompt(brief, anchors) {
  const list = (anchors || []).map((a) => `- "${a.label}" (${a.kind})`).join('\n');
  return `You are an experienced Nigerian English Language teacher writing a lesson that uses only the teacher's own cultural references.

BRIEF
${briefLines(brief)}

TEACHER-SPECIFIED REFERENCES (the only cultural material you may use)
${list}

TASK
Produce one complete lesson exactly to the JSON schema.

RULES
- No Qloo data was available for this run. Do NOT invent any Qloo score, entity id, affinity or recommendation, and never imply that a taste API endorsed these choices.
- In "examples", use only the references listed above, copied exactly. Set "evidenceRef" to "teacher" for every one.
- "useInLesson" explains the classroom move in one or two sentences. This is your reasoning as a teacher, nothing more.
- Plan strictly inside ${brief.duration} minutes and use only the listed materials.
- 3 assessment questions only, each with a short answer and a 2-3 band rubric.
- The handout must be printable and usable with no internet access.

${HOUSE_STYLE}`;
}

export function comparePrompt(brief, baseline, informed, mode) {
  return `Compare two drafts of the same ${brief.classLevel} English Language lesson on "${brief.objective}".

DRAFT A — curriculum-only baseline (no cultural references at all):
${JSON.stringify(baseline)}

DRAFT B — ${mode === 'demo' ? 'teacher-anchor draft (no Qloo data available)' : 'Qloo-informed draft (its examples come from live Qloo affinity results, chosen by the teacher-facing model)'}:
${JSON.stringify(informed)}

TASK
Return the JSON object.
- "summary": 2-3 sentences on what actually changed between the drafts and why it matters for this classroom.
- "changes": 2-5 rows. Each row names what you compared ("Cultural examples", "Starter", "Main activity", "Assessment"), how the baseline handled it, how the informed draft handled it.
- "cautions": 1-3 short warnings a teacher should read before using the informed draft (for example: affinity is not evidence of learning suitability; content suitability must be checked by the teacher).

RULES
- Describe only what is visible in the two drafts. Do not add new Qloo findings, scores or entities.
- Never say an affinity score proves pupils will learn better or prefer something.
- Plain, specific English. No hype.`;
}

export function normalizeLesson(raw) {
  const safe = raw && typeof raw === 'object' ? raw : {};
  const arr = (v) => (Array.isArray(v) ? v : []);
  return {
    lessonTitle: safe.lessonTitle || 'Lesson draft',
    curriculumObjective: safe.curriculumObjective || '',
    outcomes: arr(safe.outcomes),
    examples: arr(safe.examples),
    plan: arr(safe.plan),
    teacherScript: arr(safe.teacherScript),
    activity: safe.activity && typeof safe.activity === 'object' ? safe.activity : { title: '', minutes: 0, grouping: '', steps: [], successLooksLike: [] },
    assessment: arr(safe.assessment).slice(0, 3),
    handout: safe.handout && typeof safe.handout === 'object'
      ? { ...safe.handout, sections: arr(safe.handout.sections) }
      : { title: '', intro: '', sections: [], footer: '' },
  };
}

const norm = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Rebuilds the example list from the evidence itself, so every score and entity
 * id shown in the UI comes from Qloo — never from the language model.
 */
export function groundExamples(examples, evidence, demo) {
  const candidates = Array.isArray(evidence.candidates) ? evidence.candidates : [];
  const anchors = Array.isArray(evidence.anchors) ? evidence.anchors : [];
  const kept = [];
  const removed = [];

  for (const example of examples) {
    const name = norm(example && example.name);
    if (!name) continue;

    if (demo) {
      const anchor = anchors.find((a) => {
        const label = norm(a.label);
        return label && (label === name || label.includes(name) || name.includes(label));
      });
      if (!anchor) {
        removed.push(example.name);
        continue;
      }
      if (kept.some((k) => k.name === anchor.label)) continue;
      kept.push({
        name: anchor.label,
        kind: anchor.kind,
        useInLesson: example.useInLesson || '',
        source: 'teacher',
        evidenceRef: 'teacher',
      });
      continue;
    }

    const hit = candidates.find((c) => norm(c.name) === name)
      || candidates.find((c) => norm(c.name).includes(name) || name.includes(norm(c.name)));
    if (!hit) {
      removed.push(example.name);
      continue;
    }
    if (kept.some((k) => k.entityId === hit.entityId)) continue;
    kept.push({
      name: hit.name,
      kind: hit.typeLabel,
      useInLesson: example.useInLesson || '',
      source: 'qloo',
      entityId: hit.entityId,
      affinity: hit.affinity,
      drivers: hit.drivers || [],
      evidenceRef: `qloo:${hit.entityId}`,
    });
  }

  return { examples: kept.slice(0, 3), removed };
}