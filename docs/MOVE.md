# Move with AiRA: product decisions and mode coverage

## What it is

A short, locally simulated adaptive session. The promise is **AiRA handles the flow; you set the pace**. The user starts with time and pace selection, reviews a five-phase plan, runs a timer, modifies the plan in context, and finishes with an accurate summary of completed, skipped and partially used intervals.

The reviewer golden path is Quick / Steady: Settle in 10 s, Flow A 20 s, Recovery 15 s, Flow B 20 s, Wind down 10 s = 75 s. Unhurried is 105 s. Gentle redistributes time toward recovery, keeping the selected total.

Signature interactions: (1) +10 s Recovery, retaining timer status and consumed time, capped at +30 s; (2) shorten upcoming Flow B to 60% (min 10 s) and optionally undo before it starts. Pausing, finishing, skipping and ending are all guarded; timer expiry does not advance automatically.

## Architecture

We kept the starter's parser, OpenUI document, screen cursor, component registry, prop validation, trusted browser renderers, providers, HTTP transport, local tools and run-export mechanism. Nine `Screen` nodes each contain a registered `Workout(stage)` component. That renderer projects the trusted `WorkoutSession` state machine (`src/shared/workout-session.ts`). A stage transition changes the OpenUI cursor, keeping visible screens and exported document in sync.

The provided `TimerLedger` is reused for the current simulated phase. A tested `extend()` operation adds remaining time without `ensure()` resetting a running or paused timer. The session reducer controls all stateful actions; untrusted generated UI data cannot run code.

## Modes and honesty

- **Mock:** The entire session and action controls work offline. The adjacent lab exposes stage-aware command chips and recognizes `more rest`, `slower`, `pause`, `resume`, `skip`, `end session`, `continue`, `what's next`, `how much time`, and `undo`. These are local, deterministic rules; these do not invoke a language model and are not presented as real AI reasoning.
- **OpenAIAPI / ClaudeCLI:** An isolated OpenAIAPI coaching endpoint provides optional generated text for free-form questions after explicit consent. Local commands remain local, and no provider owns or mutates trusted session state. The original provider adapters remain for the generic wiring fixture; ClaudeCLI was not integrated into the workout coach. The author did **not** make a live provider call in this build.
- **Voice/media:** Not supported. All coaching is visible text. No activity, health, calories or sensors are measured.

## Accessibility and resilience

Large controls, selected-state announcements (`aria-pressed`), a semantic simulated countdown (`role=timer`), confirmation dialogs, clear waiting states, high-visibility focus, responsive layout and reduced-motion handling. A model outage cannot interrupt the local phase timer. Current state/records can be examined under Builder tools.

## Testing

Run `npm run check` and `PLAYWRIGHT_CHROME_PATH=/path/to/chrome npm run test:ui`. The source package is produced by `npm run package`. The existing wiring sample is retained for harness regression under **Load original wiring sample**. Reset returns to Move's welcome screen.

## Product refinement — contextual text guidance

The active phase now renders coaching copy from trusted session state rather than always showing a generic phrase. Pause, waiting, recovery extension, gentle pacing, and the lighter second flow have distinct guidance. The Mock lab offers phase-relevant example commands and handles unknown requests without clearing or replacing the workout screens. No mock response is represented as an LLM call. Ending a completed but unadvanced phase records it as completed, and a completed phase cannot be skipped.

## Optional model-generated coaching (OpenAIAPI)

The model never owns the workout state. `POST /api/coach` is a separate, local-token-protected endpoint accepting only a short question and an allowlisted simulated context (phase, time, pace, pause, completed/skipped counts and adjustments). It requires `openai-api`, locally enabled API credentials and explicit consent. The OpenAI Responses API returns a short structured `cue`, rendered as inert text with provider attribution. It cannot emit OpenUI changes, tools or JavaScript. The local state machine remains usable while the model is pending or errors. A phase change, reset, consent removal or provider switch aborts/invalidates stale replies. Commands like “pause”, “more rest”, and “slow down” remain local in every provider mode.

Provider tests use an injected synthetic fetch response, not real OpenAI or Claude credentials. No real model request has been executed by the author. Mock remains the default and remains fully offline.

## v2 — movement-first experience

The five trusted stages remain keyed `settle`, `flow_a`, `recovery`, `flow_b`, and `wind_down`, retaining OpenUI and current timer semantics. The displayed activities are now **Shoulder rolls**, **March in place**, **A breathing break**, **Side steps**, and **Slow arm reach**. Every activity has a specific instruction, a simple original SVG-style vector figure rendered by the trusted DOM renderer, and contextual text guidance.

**One coherent change:** during March in place or Recovery, "Make next flow lighter" changes the *actual upcoming activity* from Side steps to **Gentle weight shifts** with its own instruction/illustration and a shorter countdown, not just a caption. Undo restores the original. Session records now snapshot the movement title on completion or skip, so summary content describes what was offered at the time, not a future/default plan. Rest +10 still preserves elapsed time.

The main preview leads the page. An expandable Studio contains the opt-in provider settings, text commands, legacy wiring fixture and builder tools without removing test access. Local mock simulation remains functional with no credentials; the optional model receives a validated current `movement` name, but it still has no authority to change trusted state.

**v2 verification:** 61 Node tests pass, as do TypeScript and safety lint; Chromium blocks localhost navigation in this execution environment, so fresh v2 Playwright/browser screenshots require a local run. A new browser specification covers mobile clarity and the fully adapted golden path. Live provider modes were not tested with real credentials.