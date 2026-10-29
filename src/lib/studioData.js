export const CLASS_LEVELS = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

export const DURATIONS = [40, 45, 60, 80];

export const MATERIALS = [
  'Chalkboard / whiteboard',
  'Printed handout',
  'English textbook',
  'Projector or TV',
  'Phone speaker',
  'Newspaper clippings',
  'Talk only',
];

export const ANCHOR_KINDS = [
  'Film',
  'Book',
  'Artist',
  'Music genre',
  'Sport',
  'Place',
  'Radio programme',
  'TV show',
];

export const STEPS = [
  { id: 1, label: 'Brief', hint: 'Class, objective, materials' },
  { id: 2, label: 'Culture check', hint: 'Qloo evidence for your anchors' },
  { id: 3, label: 'Lesson', hint: 'Plan, script, activity, assessment' },
  { id: 4, label: 'Compare', hint: 'Curriculum-only vs Qloo-informed' },
];

export const EXAMPLE_BRIEF = {
  classLevel: 'SSS 2',
  objective: 'Persuasive language in public-service messages',
  duration: 45,
  materials: ['Chalkboard / whiteboard', 'Printed handout', 'Phone speaker'],
  anchors: [
    { label: 'Nollywood drama', kind: 'Film' },
    { label: 'Fela Kuti', kind: 'Artist' },
    { label: 'Afrobeats', kind: 'Music genre' },
  ],
};

export const EMPTY_BRIEF = {
  classLevel: 'SSS 2',
  objective: '',
  duration: 45,
  materials: [],
  anchors: [],
};