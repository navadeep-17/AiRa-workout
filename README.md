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
- Original provider adapters, builder state inspection, run export and generic fixture retained.

See [Product, architecture and tested modes](docs/MOVE.md), [Exercise](docs/EXERCISE.md), and [Harness](docs/HARNESS.md).

## Test and package

```sh
npm run check
npx playwright install chromium
npm run test:ui
npm run package
```

The source export is `output/workout-source.zip`; `.env`, packages, compiled artifacts, history and credentials are excluded. A live OpenAI or Claude session is optional, requires explicit local enablement and consent, and has not been tested in this submission. No real voice, body sensing, or medical/exercise recommendations are provided.