# Move with AiRA — a workout shaped around your moment (v7)

**AI-first product direction:** The user describes a moment in natural language. AiRA proposes an actual timed session with chosen movements, personalized duration, and space-conscious alternatives—not merely a fixed workout with generated motivational text.

Open the local app and try **Boost my energy** and **Desk reset**. Both produce different movement sequences using the same trusted timer and OpenUI renderer. The default planner is **offline rules**, visibly labeled as such. A consent-gated **OpenAIAPI plan generator** can optionally propose a validated plan; it is not required for the core journey and has not been tested against a real account.

**Quick start (Node >=22.18):**

```sh
npm ci --ignore-scripts
npm run check
npm start
```

Visit `http://127.0.0.1:4319` and use **Shape my session**. See [v7 architecture, examples, restrictions and review path](docs/AI_FIRST_V7.md). The prior fixed-session setup and interactive reviewer preview remain available as secondary paths.

**Safety and claims:** This is a fictional simulation: no real physical activity, biometrics, calorie counts, audio or sensors are measured. All model output is untrusted until validated against a finite movement catalog and bounded integer timings. The app itself owns every timer, pause, skip and phase transition.

**Verification status:** 82 unit/HTTP tests, TypeScript and lint passed in the local source workspace on Node 22.16 (below the specified >=22.18 runtime). A synthetic transport covered valid and invalid model-proposed plans. Full Chromium UI execution and a real OpenAI call remain unverified here; run `npm run test:ui` on the evaluator machine and document the outcomes honestly.

---

# Move with AiRA — an adaptive workout moment

**AiRA AI Product Builder assessment** · built on the provided `workout-starter` harness.

> AiRA handles the flow. You set the pace.

Instead of a workout dashboard, this is a complete *fictional* five-phase guided movement experience. Select time and pace, preview five named movements, start guided intervals, add recovery, swap the upcoming Side steps for Gentle weight shifts, or stop whenever you like. The closing screen records what actually happened rather than claiming activity was performed.

## Run locally

Requires Node.js **22.18+** and npm. From the project root:

```sh
npm ci --ignore-scripts
npm start
```

Open **http://127.0.0.1:4319**. It starts in **Mock** with no provider credentials needed. Click **Make my session** to begin. Recommended evaluator path: Quick → Steady → See my plan → Start. Every countdown is a simulation; finishing one phase displays a clear Continue button.

To show the original starter fixture, use **Load original wiring sample** in the guidance lab. **Reset run** restores the Move welcome screen.

## Features

- Nine coherent OpenUI screens and five meaningful movement phases: Shoulder rolls, March in place, A breathing break, Side steps, and Slow arm reach. Every phase has a human-readable instruction and trusted inline vector illustration.
- Two total-length presets (75s / 105s), and Steady / Gentle pacing.
- Recovery +10s without timer reset, capped at +30s.
- Replacing Side steps with the 40%-shorter Gentle weight shifts alternative, or restoring the original, updates the activity, instructions, illustration, plan, future timer and final summary.
- Explicit pause/resume, skipping and early-exit confirmation.
- Accurate completion records and changes summary.
- Consumer-first responsive layout, illustrated movement guidance, reduced-motion support, keyboard focus, readable timer, and offline behavior. Provider settings, text commands and builder tools remain available in the expandable Studio section.
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

## Experience redesign v2

See [docs/IMPLEMENTATION_PLAN_V2.md](docs/IMPLEMENTATION_PLAN_V2.md) for the screen-by-screen scope and acceptance criteria. A meaningful workout phase is not just a timer: it has a named movement, a short instruction, an illustration, a responsive coaching cue, a visible countdown, and honest simulated completion tracking. All activity is optional and fictional; the app cannot verify what a person physically does.

**Verification status:** The v2 source passed 61 Node unit/HTTP tests, TypeScript checking and static safety lint in the build environment using Node 22.16 (below the documented 22.18+ runtime requirement). The browser UI tests exist but were **not run successfully** here: Chromium navigation to localhost was blocked by the environment. No real OpenAI or Claude model call was tested. Before submitting, run the browser suite on the target machine, manually inspect mobile/desktop, and update the mode note with the results actually observed.

## V3 — the living workout moment

An original expressive SVG companion responds to session state (hello, movement, recovery, adaptation, pause, finish). Choosing a gentler second movement updates the next card, timing, instruction, illustration, and factual summary. The summary closes with a personalized, deterministic postcard based on recorded decisions.

Optional **hands-free flow** appears in Plan preview and during active movement. When enabled, each simulated phase waits three seconds after completion before starting the next; **Stay here**, manual Continue and disabling hands-free remain available. Hands-free is OFF by default. The original OpenUI renderer and studio remain available; no sensors, physical results, synthetic voice, or provider calls are implied. Character animations honor `prefers-reduced-motion`.

## V4 — The Interactive Movement Film

AiRA's new **Scene Director** turns trusted session progress into six visual beats: Introduce, Quiet, Recover, Adapt, Paused and Transition. Instructions become quieter once the movement has begun rather than repeating chatter. This is deliberately **offline, deterministic scene direction**, not claimed as an LLM inference.

During March in place, choose **Explore two paths for what comes next** to open the illustrated **Choice Canvas**. During the breathing break, it is already available. Choose between Side steps and Gentle weight shifts: the illustration, instruction, next duration and summary reflect the choice. Switch back before the next phase starts. Neither choice resets the currently running timer. All choices are explicit, keyboard-operable and visibly selected.

See [docs/CREATIVE_V4.md](docs/CREATIVE_V4.md) for the design rationale and demonstration path. Tests now cover the scene beats and branching safeguards. Local unit/HTTP testing has passed; full browser and live-provider testing still require the evaluator machine.

## V5 — explore the experience quickly

The welcome screen now offers **Explore the interactive preview**. This fast interactive reviewer path opens the real Choice Canvas during March in place, lets you choose a future movement, jumps to a real breathing-break timer for an extra-ten-seconds demonstration, and closes with a **preview** postcard based only on actual visited phases and decisions. Jumped scenes are recorded as skipped, not as fabricated completions. A clear **Start a full workout** button resets all tour state.

See [docs/REVIEWER_EXPERIENCE.md](docs/REVIEWER_EXPERIENCE.md) for the three-moment script, safeguards and the desktop/mobile screenshot test. The provided harness's static safety policy excludes audio APIs, so voice narration was intentionally deferred. Local Node tests do not substitute for a full Playwright browser run; please verify on the target machine before submission.

## V6 — one companion voice and contextual adaptation

The active workout now presents a **single primary Scene Director** rather than multiple competing AiRA coaching panels. An optional, explicitly consented OpenAI text response is displayed *inside* that director with provider attribution; it never changes timers or progression, and errors leave the local scene usable. The original text panel remains available for the unmodified wiring fixture.

During March in place, a compact **Your pace, your choice** check-in introduces the two illustrated next-movement paths. The current countdown is preserved; users can preview the alternative before choosing and switch back until the next phase begins. The quick reviewer tour also explains its three moments with visible step guidance. No physical activity is tracked.

`tests/browser/quality.spec.mjs` adds on-device assertions for mobile overflow, one primary coaching panel, the contextual check-in, non-resetting adaptation, and a **synthetic** optional AI coaching response. Browser E2E tests remain pending until executed successfully on a machine that can navigate the local server; Node tests do not substitute for visual verification.
