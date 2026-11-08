# StoryBridge project readiness

Review date: 8 November 2026.

## Product

StoryBridge creates teacher-reviewable Nigerian secondary-school lessons from one English Language learning objective. It can compare a curriculum-led draft with a version informed by teacher-selected cultural references.

## Implemented in the repository

- React/Vite teacher studio and printable handout.
- Base44 teacher registration/login UI and teacher account entity.
- Server-side Qloo entity/tag resolution and affinity candidate retrieval.
- Explicit teacher review before Qloo candidates can be used.
- Post-generation grounding of cited examples against the verified Qloo candidate set.
- Curriculum-only and teacher-reference demo paths when Qloo is unavailable.
- Backend authentication checks added to both generation and Qloo evidence functions in this branch.

## Validation note

The repository's existing `typecheck` script currently reports broad type errors in legacy JSX pages and generated UI component declarations (including Register, ResetPassword and Studio). Lint passes in the PR run; the validation workflow uses lint plus a production build and does not pretend that the typecheck is clean. Repairing the legacy component typings remains a separate technical-debt task.

## Not established

- No independent teacher/user count, repeat-use data or school deployment is claimed.
- No measured improvement in learning outcomes or teacher preparation time is claimed.
- No formal independent evaluation of cultural accuracy, age appropriateness or lesson quality is published.
- No locally hosted/offline lesson-generation model is implemented. Printing/exporting a generated handout works offline after generation.
- No provider-level daily/monthly AI spend cap is implemented.
- No pupil record or student-account workflow is intended; platform-level teacher account data still exists in Base44.
- Dependency reproducibility should be improved with a committed lockfile if the project's deployment workflow supports one.

## Integration and cost boundaries

- Base44 provides teacher authentication and hosted LLM integration.
- Qloo is optional and its API key is stored as a server-side Base44 secret.
- A single lesson run may invoke the baseline LLM and, depending on mode and evidence, an informed LLM and comparison LLM. Qloo anchor resolution may make multiple calls per teacher-selected anchor.
- Free API access is not guaranteed, and no zero-cost claim is made.

## Next milestones

1. Pass the new clean-install lint/typecheck/build workflow.
2. Confirm Base44 function access rules and teacher account settings in the live app.
3. Configure per-user and per-day generation quotas at the platform/backend level.
4. Run a small teacher pilot and record preparation time, corrections, factual errors and cultural suitability.
5. Add a reproducible evaluation set with teacher-rated lessons.
6. Publish a data-processing and retention review for Base44 and Qloo.
