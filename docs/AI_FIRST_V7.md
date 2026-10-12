# Move with AiRA v7 — AI-first personalized movement scenes

## Why this direction

The exercise asks us to build an AI-guided fictional workout, owning what the AI says, how it changes the screen, and how the session progresses. Prior iterations had a fixed sequence with AI text layered on top. V7 addresses that product gap: session content now responds to a natural-language request rather than always showing the same five activities.

## Product journey

1. At welcome, the user describes their intent, time and available space, or selects one of three example requests.
2. The offline planner interprets `energize`, `reset`, or `unwind`; `room` or `compact`; and a 60–180-second demo duration. It chooses five timed phases from a nine-movement allowlist and gives a short rationale.
3. The user previews the actual movements and durations, turns optional hands-free flow on or off, and starts when ready.
4. Each active screen shows the selected movement's title, gesture illustration, instruction, duration and Scene Director cue. The local timer and user controls remain authoritative.
5. During the first working movement or recovery, two visible upcoming paths allow a reversible substitution. The next movement's instruction, illustration, duration and session record change together.
6. The final summary reports only simulated phases and actual local changes. It never claims measured exercise, reps, calories or health results.

## Example request contrasts

| Input | Offline interpretation | Main activity | Upcoming activity | Total |
|---|---|---|---|---|
| `I need an energy boost, I have 2 minutes and room to move.` | Energize, room | March in place | Side steps | 120s |
| `I am sitting at my desk with very little space. A gentle reset for 2 minutes.` | Reset, compact | Wrist and finger release | Gentle weight shifts | 120s |
| `I want to unwind quietly for 90 seconds.` | Unwind, room | Gentle weight shifts | Shoulder rolls | 90s |

The offline planner is **deterministic and rule-based, not a language model**. The main experience does not require a key. Durations are exact; every phase is >=10 seconds, including a real recovery phase.

## Optional live AI planning

The existing opt-in OpenAIAPI provider can also draft an entire plan. To enable it, configure `.env` per README, open Studio, select OpenAIAPI and check consent. From the welcome page choose **Use live AI to shape it**. The server `/api/plan` sends the bounded request and known catalog to the Responses API. It requests a strict JSON schema and then separately validates: allowed movement IDs, five ordered phases, recovery phase, compact-space constraints, integer durations, exact requested total, and rationale. Any invalid or unavailable response is rejected, while the offline planner remains available.

No API key crosses to the browser, and model output is only validated **data**, not executable HTML, timer commands or arbitrary OpenUI. The trusted `Workout(stage)` renderer projects the plan onto the existing declarative OpenUI screen structure. Live-generated plans are marked **LIVE AI-ASSISTED**; offline plans are marked **RULE-BASED OFFLINE**.

## Architecture and trade-offs

- `src/shared/session-planner.ts`: movement catalog, request interpretation, offline planner, plan validation, alternatives.
- `src/shared/workout-session.ts`: applies validated plans to the five trusted timer slots; keeps pause, recovery, skip, record and summary semantics.
- `src/web/workout-view.ts`: request-first creation, provenance, dynamically rendered plan, controls and summary.
- `src/server/plan.ts` and `src/server/app.ts`: explicit-consent, same-origin token-protected optional plan endpoint.
- `src/web/app.ts`: live plan request lifecycle and stale-response protection.
- `tests/session-planner.test.mjs`, `tests/http.test.mjs`, `tests/browser/planner.spec.mjs`: contrasting examples, validation, HTTP transport and browser journeys.

The safe catalog is intentionally finite and does not attempt to prescribe or validate exercise technique. The UI remains a **fictional demo** with no sensors. The legacy fixed-session setup and interactive reviewer tour are preserved as secondary paths.

## Verification and limitations

- Confirmed in the current build workspace: TypeScript, static lint, 82 Node/unit/HTTP tests, TypeScript/safety lint, 82 unit/HTTP tests, and a local HTTP smoke check (GET / and planner assets returned 200; unauthorized POST /api/plan returned 403). Source package is verified during release packaging.
- Browser Playwright tests were **authored** but could not be executed in the earlier restricted Chromium environment; rerun on a machine with the dependency and working browser.
- No real external OpenAI request has been made or claimed. The optional endpoint is covered by synthetic transport tests, which prove request validation and response rejection but not actual model quality or account/model access.

## Review path

1. Choose **Boost my energy** and **Shape my session**. Notice March in place and Side steps in the two-minute plan.
2. Use **Adjust choices**, choose **Desk reset** and shape it again. Notice Wrist and finger release, Gentle weight shifts, and the small-space explanation.
3. Start the desk plan. Try pausing, continuing, and selecting an alternative for the next movement.
4. Read the factual summary.
5. If desired, configure a live provider in the Studio and explicitly opt in before using the AI-generated plan button.
