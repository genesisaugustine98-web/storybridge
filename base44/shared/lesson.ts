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
      minItems: 0,
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

const HOUSE_STYLE = `Write for a real Nigerian secondary-school classroom and the subject implied by the teacher's objective. Do not assume every lesson is English Language. Be concrete and short — a teacher should be able to teach from this without rewriting it.
Use Nigerian spellings and relevant Nigerian curriculum or exam-board phrasing where appropriate (including WAEC/NECO for senior secondary work). Never address pupils as a group in the script using invented names.`;

function briefLines(brief) {
  return [
    `- Class level: ${brief.classLevel}`,
    `- Objective or topic: ${brief.objective}`,
    `- Lesson duration: ${brief.duration} minutes`,
    `- Available materials: ${(brief.materials || []).join('; ') || 'chalkboard and talk only'}`,
  ].join('\n');
}

export function baselinePrompt(brief) {
  return `You are an experienced Nigerian secondary-school teacher preparing a curriculum-only lesson in the subject most clearly indicated by the teacher's objective.

BRIEF
${briefLines(brief)}

TASK
Produce one complete lesson exactly to the JSON schema. Preserve the teacher's objective and subject; do not silently replace the topic with a different one.

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
    .map((a) => (a.resolved.tagId
      ? `"${a.label}" (${a.kind}) -> Qloo genre tag "${a.resolved.name}" [${a.resolved.tagId}]`
      : `"${a.label}" (${a.kind}) -> Qloo entity "${a.resolved.name}" [${a.resolved.entityId}]`))
    .join('\n') || 'none resolved';

  return `You are an experienced Nigerian secondary-school teacher preparing a lesson in the subject most clearly indicated by the teacher's objective.

BRIEF
${briefLines(brief)}

TEACHER-CHOSEN CULTURAL ANCHORS (resolved by Qloo)
${anchorList}

QLOO DISCOVERY CANDIDATES (all were explicitly selected by the teacher after reviewing this list)
${lines || 'none'}

IMPORTANT EVIDENCE LIMIT
Qloo affinity describes audience taste adjacency only. It does NOT establish subject relevance, conceptual similarity, classroom suitability, age suitability, pupil preference, or learning benefit. Qloo provides only the title, broad type, affinity value, and possible link to a teacher-chosen anchor. It does not provide verified information about the work's plot, scenes, characters, lyrics, quotations, factual claims, messages, language level, or educational content.

TASK
Produce one complete lesson exactly to the JSON schema. Preserve the teacher's stated objective, subject, class level, and duration. Do not silently change the topic.

STRICT RULES
- Select zero to three examples, and use only titles copied EXACTLY from the teacher-selected Qloo list above.
- A Qloo candidate may be used only when its relevance to this exact objective is clear from information supplied by the teacher. An affinity score, title, type, or link to an anchor is NOT proof of relevance.
- If relevance is uncertain, do not force the candidate into the lesson. Return an empty examples array when none can be justified. A sound curriculum-led lesson is better than a fabricated cultural connection.
- Do not invent or imply any facts about a film, book, artist, song, programme, person, or place. Do not describe a plot, scene, character, lyric, quotation, moral, argument, or educational message unless the teacher supplied that information in the brief.
- When a selected resource is used, refer to its title only as a teacher-previewed optional resource. Write the classroom step so the teacher supplies a verified excerpt or detail after previewing it; do not invent what pupils will see or hear.
- For each included example, set evidenceRef to "qloo:<the exact entity id from that row>". The useInLesson field must state the teacher's verification step as well as the proposed classroom use.
- Do not add unselected candidates, substitute lookalikes, fabricate local examples as Qloo output, or restate affinity numbers in the lesson prose.
- Never claim the results predict what these pupils will enjoy, learn from, or are suitable for.
- Plan strictly inside ${brief.duration} minutes and use only the listed materials.
- 3 assessment questions only, each with a short answer and a 2-3 band rubric.
- The handout must be printable and usable with no internet access.

${HOUSE_STYLE}`;
}

export function demoPrompt(brief, anchors) {
  const list = (anchors || []).map((a) => `- "${a.label}" (${a.kind})`).join('\n');
  return `You are an experienced Nigerian secondary-school teacher preparing a lesson in the subject most clearly indicated by the teacher's objective, using only the teacher's own references.

BRIEF
${briefLines(brief)}

TEACHER-SPECIFIED REFERENCES (the only cultural material you may use)
${list}

TASK
Produce one complete lesson exactly to the JSON schema. Preserve the teacher's objective and subject.

RULES
- No Qloo data was used for this lesson. Do NOT invent a Qloo score, entity id, affinity or recommendation.
- Use a teacher-specified reference only if it is directly relevant to the objective and you can explain that relevance from information the teacher supplied. Otherwise leave it out.
- Do not invent or imply facts about the reference's plot, scenes, lyrics, quotations, message, or educational value. Ask the teacher to supply a verified excerpt or detail after previewing it.
- In "examples", use only the references listed above, copied exactly. Set evidenceRef to "teacher" for every one.
- If none can be justified, return an empty examples array and write a strong curriculum-led lesson.
- Plan strictly inside ${brief.duration} minutes and use only the listed materials.
- 3 assessment questions only, each with a short answer and a 2-3 band rubric.
- The handout must be printable and usable with no internet access.

${HOUSE_STYLE}`;
}

export function comparePrompt(brief, baseline, informed, mode) {
  return `Compare two drafts of the same ${brief.classLevel} lesson on "${brief.objective}".

DRAFT A — curriculum-only baseline:
${JSON.stringify(baseline)}

DRAFT B — ${mode === 'demo' ? 'teacher-reference draft (no Qloo data)' : 'draft made using only teacher-approved Qloo candidates'}:
${JSON.stringify(informed)}

TASK
Return the JSON object.
- Describe only differences that are plainly visible in the two supplied drafts.
- Do not say the Qloo-informed draft is better, more engaging, more effective, or more culturally relevant unless the actual lesson content demonstrates a specific, supportable reason.
- Do not infer a candidate's plot, themes, scenes, educational value, pupil popularity, or age suitability from its title, type, or affinity score.
- If Draft B contains no approved cultural examples, say that the Qloo discovery did not produce a usable classroom example and the lesson remains curriculum-led.
- "changes": 2-5 rows about actual changes ("Cultural examples", "Starter", "Main activity", "Assessment"), not imagined learning gains.
- "cautions": include that affinity is audience taste adjacency, not evidence of curriculum relevance, learning suitability, or pupil preference.

RULES
- Never invent new Qloo findings, scores, entities, or entities' content.
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
        return label && label === name;
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

    const hit = candidates.find((c) => norm(c.name) === name);
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