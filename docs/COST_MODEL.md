# StoryBridge cost and quota model

StoryBridge uses hosted services, so it is not guaranteed to run at zero cost.

## Cost centres

| Service | Usage driver | Current control |
|---|---|---|
| Base44 hosted LLM | Baseline lesson, optional informed lesson, optional comparison | Hosted platform quotas; no per-user daily cap implemented in repository |
| Qloo | Anchor resolution, genre-tag resolution and insights | One teacher-provided anchor set; up to four anchors; no local daily spend ceiling |
| Hosting/runtime | Teacher UI and server functions | Base44 plan and runtime limits |
| Browser export/print | Local generation of printable output | No additional AI inference required after lesson is generated |

A request can make more than one model call. In the ordinary curriculum-only or demo path, only the baseline lesson call is needed; a Qloo-informed path may also make an informed lesson call and a comparison call.

Qloo entity resolution can attempt more than one search per anchor. The number of calls therefore depends on the anchors and provider responses.

## Before requesting AI credits

- Add per-user, per-day and per-month invocation ceilings.
- Reserve a known budget before starting a multi-call lesson workflow.
- Record model, request count, latency, failure, tokens/units when exposed and actual provider usage.
- Stop rather than silently switching to a paid model when free quotas are exhausted.
- Cache only within the provider terms and avoid retaining Qloo response data beyond the permitted period.
- Publish cost per successfully generated and teacher-accepted lesson, not just per model call.

Do not claim zero operating cost or unlimited free usage.
