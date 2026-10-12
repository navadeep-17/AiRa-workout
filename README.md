# Move with AiRA — an adaptive workout moment

**AiRA AI Product Builder assessment** · built on the provided `workout-starter` harness.

> AiRA handles the flow. You set the pace.

Instead of a workout dashboard, this is a complete *fictional* five-phase guided experience. Select time and pace, see your flow, begin, pause or extend recovery, lighten the next interval, skip safely or finish early. The closing screen records what actually happened rather than claiming activity was performed.

## Run locally

Requires Node.js **22.18+** and npm. From the `workout-starter` directory:

```sh
npm ci --ignore-scripts
npm start
```

Open **http://127.0.0.1:4319**. It starts in **Mock** with no provider credentials needed. Click **Make my session** to begin. Recommended evaluator path: Quick → Steady → See my plan → Start. Every countdown is a simulation; finishing one phase displays a clear Continue button.

To show the original starter fixture, use **Load original wiring sample** in the guidance lab. **Reset run** restores the Move welcome screen.

## Features

- Nine coherent OpenUI screens with a local trusted state machine and five timed phases.
- Two total-length presets (75s / 105s), and Steady / Gentle pacing.
- Recovery +10s without timer reset, capped at +30s.
- Upcoming interval shortening / undo with a real updated timer and plan.
- Explicit pause/resume, skipping and early-exit confirmation.
- Accurate completion records and changes summary.
- Warm responsive design, reduced motion, keyboard focus, readable timer and true offline operation.
- Context-sensitive visible coaching, stage-aware local text commands and quick command chips.
- Optional **OpenAIAPI coaching text** for free-form questions, with explicit opt-in and bounded state context. It cannot modify timers, screens or progression. Known controls always remain local and do not call the model. New questions invalidate stale replies when the session changes.
- Original provider adapters, builder state inspection, run export and generic fixture retained.

See [Product, architecture and tested modes](docs/MOVE.md), [Exercise](docs/EXERCISE.md), and [Harness](docs/HARNESS.md).

## Test and package

```sh
npm run check
npx playwright install chromium
npm run test:ui
npm run package
```

The source export is `output/workout-source.zip`; `.env`, packages, compiled artifacts, history and credentials are excluded. Live OpenAI coaching requires `ALLOW_LIVE_API=true` and a local `OPENAI_API_KEY` (see `.env.example`), selection of OpenAIAPI and explicit checkbox consent; only then do free-form coaching questions make model calls. No real provider credentials were used in automated tests; the coaching endpoint was tested with a synthetic transport. The original CLI/OpenUI wiring modes remain available in the original wiring sample. No real voice, body sensing, or medical/exercise recommendations are provided.

## Try optional live coaching

To try a **real** provider call, copy `.env.example` to a private `.env`, set `ALLOW_LIVE_API=true`, provide your own `OPENAI_API_KEY`, and choose a model available to your account (default `gpt-4.1-mini`). Restart the server, select **OpenAIAPI**, and explicitly check the consent box. Ask a free-form question such as “Give me a short encouraging thought for this phase.” The generated reply appears under **COACHING / ON-SCREEN TEXT** with provider attribution.

Commands such as “pause”, “more rest”, “gentle” and “what’s next?” never make an API call; they use trusted local code. If the API is unavailable, the workout timer and controls continue to function. **No live API key or real provider call was used during development checks.** Never commit `.env` or paste keys into the UI.