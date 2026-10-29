# StoryBridge — Curriculum-to-Culture Lesson Agent

**Live demo:** https://story-bridge-curriculum-to-culture-150cd3d4.base44.app  
**Source repository:** https://github.com/genesisaugustine98-web/storybridge  
**License:** MIT (see `LICENSE`)

StoryBridge is a curriculum-to-culture lesson agent for Nigerian secondary-school English Language teachers. It converts a teacher’s curriculum objective into a reviewable lesson, shows what Qloo cultural-affinity evidence contributes, and compares the result against a curriculum-only baseline.


StoryBridge turns **one** English Language curriculum objective into **one** practical, culturally grounded,
teacher-reviewable lesson for Nigerian secondary schools.

It has a single job on purpose. Brief in, lesson out — with the cultural step shown transparently rather than
folded into a chatbot answer.

---

## What you get per run

1. A concise lesson plan with timings, matched to the duration and materials you actually have
2. A teacher script with cues and what to say
3. One classroom activity with success criteria
4. Exactly three assessment questions
5. Model answers and a marking rubric per question
6. A one-page printable handout that works offline (print or save as PDF)
7. A side-by-side comparison against a curriculum-only draft, with an explanation of what changed

Teachers are told, in the product, that every suggestion is a draft and must be reviewed before use.

---

## How it is built

| Piece | What it does |
| --- | --- |
| `src/pages/Studio.jsx` | The four-step studio: brief → culture check → lesson → compare |
| `src/pages/Methodology.jsx` | About & methodology panel (what is evidence, what is reasoning, what needs a key) |
| `base44/functions/qlooEvidence/entry.ts` | Server-only Qloo calls: entity resolution + Insights affinity results, with a real call trace |
| `base44/functions/generateLesson/entry.ts` | Drafts the baseline and informed lessons, then grounds every cited example back in the verified results |
| `base44/shared/qloo.ts` | Qloo HTTP client, kind→entity-type map, parsing helpers |
| `base44/shared/lesson.ts` | JSON schemas, prompts, normalisation and the example-grounding/validation step |

There is **no database and no stored lesson**: no pupil records, no accounts, no saved taste profiles.

---

## Required secret

The culture check needs a Qloo API key, read **only** on the server:

```
QLOO_API_KEY
```

Add it in the app dashboard: **Dashboard → Secrets → new secret → `QLOO_API_KEY`**. It is read with
`secrets.get('QLOO_API_KEY')` inside the backend function. It is never sent to the browser, never placed in a URL,
and never returned in a response.

### Without the key

The app still runs, honestly:

- the header shows **Qloo setup needed**
- the culture check shows a setup state with the exact reason
- a clearly labelled **demo mode** is offered, which uses only references the teacher typed — no Qloo entities,
  no affinity scores, and no claim that a taste API endorsed anything

The app only displays **Qloo live** after a real server-side call has succeeded.

---

## Qloo API endpoints used

Base host: `https://hackathon.api.qloo.com`. Auth header: `X-Api-Key: <QLOO_API_KEY>` (server side only).

| Method | Path | Parameters sent | Purpose |
| --- | --- | --- | --- |
| `GET` | `/search` | `query`, `types` (mapped from the anchor kind), `take=3`, `sort_by=match` | Resolve a teacher anchor to a real Qloo entity id. If the mapped type returns nothing, the search is repeated once without a type filter. |
| `GET` | `/v2/insights` | `filter.type` (film / book / music artist), `signal.interests.entities` (resolved anchor ids, comma separated), `take=8`, `feature.explainability=true` | Affinity-ranked related entities, used as the candidate classroom examples. |

Example (server-side shape, key never in source):

```bash
curl -G 'https://hackathon.api.qloo.com/v2/insights' \
  --header "X-Api-Key: $QLOO_API_KEY" \
  --data-urlencode 'filter.type=urn:entity:movie' \
  --data-urlencode 'signal.interests.entities=<resolved-anchor-entity-id>' \
  --data-urlencode 'take=8' \
  --data-urlencode 'feature.explainability=true'
```

Values read from the Insights response:

- `results.entities[].entity_id`, `.name`, `.subtype`
- `results.entities[].query.affinity` — shown exactly as returned, rounded to 4 decimals for display only
- `results.entities[].query.explainability` — used, when present, to name which anchors a result is linked to

Anchor kind → entity type: film → `urn:entity:movie`; TV show → `urn:entity:tv_show`; book → `urn:entity:book`;
artist → `urn:entity:artist`; music genre → `urn:entity:artist` (genre text resolves to representative artists);
sport → `urn:entity:person`; place → `urn:entity:locality` / `urn:entity:place`; radio programme → `urn:entity:podcast`.

If Qloo's response shape changes or a parameter is rejected, the function reports the failure verbatim and the UI
shows an unavailable state. It never substitutes demo data for a failed live call.

---

## How a lesson is kept truthful

1. The server collects the verified candidate list (names, entity ids, affinity, drivers).
2. The lesson writer is given that list and may cite **only** names from it. It is explicitly forbidden from
   writing any affinity number in the prose.
3. After generation, the server rebuilds every cited example from the Qloo payload itself — real name, real entity
   id, real affinity, real drivers. So no Qloo number in the UI originates from the language model.
4. Cited items that are not in the verified list are removed, and the removal is reported in the lesson header.
5. In demo mode, examples are matched against the teacher's own anchors and labelled *teacher-specified*.

The comparison summary is labelled as the model's reasoning, not as API output.

---

## Privacy

- No pupil names, accounts or taste profiles anywhere.
- Cultural anchors are chosen by the teacher and describe culture, not children.
- Lessons are not persisted server-side; they live in the browser for the session, and the printable handout is the
  only artefact the teacher keeps.

---

## Testing

### In the app

1. Open the app. With no key configured, the header reads **Qloo setup needed** — that is the expected honest state.
2. Press **Load this brief** to fill the example run: SSS 2 · *Persuasive language in public-service messages* ·
   45 min · anchors Nollywood drama / Fela Kuti / Afrobeats.
3. **Check cultural evidence** → either live Qloo results (with a call trace) or the setup state.
4. Choose **Continue in demo mode** to verify the no-Qloo path end to end.
5. **Build the lesson** → check the plan, script, activity and assessment tabs, then **Open printable handout** and
   print/save as PDF.
6. **Compare with the curriculum-only draft** → confirm the two example lists differ and every Qloo number matches
   the culture-check panel.

### Backend functions (dashboard function tester)

`qlooEvidence`:

```json
{ "probe": true }
```

```json
{ "anchors": [{ "label": "Nollywood drama", "kind": "Film" }, { "label": "Afrobeats", "kind": "Music genre" }] }
```

`generateLesson` (demo path needs no Qloo key):

```json
{
  "brief": {
    "classLevel": "SSS 2",
    "objective": "Persuasive language in public-service messages",
    "duration": 45,
    "materials": ["Chalkboard / whiteboard", "Printed handout"]
  },
  "anchors": [{ "label": "Nollywood drama", "kind": "Film" }],
  "demo": true,
  "evidence": { "mode": "demo", "anchors": [{ "label": "Nollywood drama", "kind": "Film" }], "candidates": [] }
}
```

Expected: a JSON object with `baseline`, `informed`, `comparison` and `validation`. In demo mode every
`informed.examples[].source` must be `teacher`, and no affinity field should appear.

---

## What still requires a Qloo key

Everything in step two: anchor resolution, affinity results, the call trace, and the "Qloo-informed" comparison.
Only **demo mode** (teacher references only) works without a key.

---

## Licence

Released under the MIT Licence — see `LICENSE`.

Guidance for anyone reusing this:

- The app's own source is MIT: reuse and modify it freely, keep the copyright notice.
- Qloo's API and its returned data are governed by Qloo's own terms of service. Do not redistribute Qloo response
  data as if it were yours, and do not cache it beyond what your Qloo agreement allows.
- Lesson text generated for a teacher is theirs to use and adapt in class.
- Fonts are Fraunces and Inter, served by Google Fonts under the SIL Open Font Licence.
- If you add images or datasets, record their licence in a `NOTICE` file.