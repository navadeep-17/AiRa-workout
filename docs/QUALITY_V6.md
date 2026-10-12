# AiRA — final quality sprint (v6)

## Objective

The assignment requests an AI-guided **fictional** workout with candidate-owned interaction and presentation. We kept the working five-phase local simulation and refined its visual hierarchy rather than adding new workouts or unsupported sensors.

## Changes

1. **One companion voice.** During the live workout, the Scene Director is the only primary coaching surface. The redundant lower local-text guidance panel and repeated “AiRA says” line are no longer displayed; the panel remains functional when loading the original OpenUI wiring fixture.
2. **Contextual adaptation.** During March in place, “Your pace, your choice” invites the user to explore the existing two real, illustrated alternatives. Selecting a path changes the upcoming movement's name, instructions, preview, future time and eventual summary; it does not reset the current interval. The choice remains reversible before that next activity starts.
3. **Model cue attribution.** When a user separately enables OpenAIAPI and consents, generated text appears *in the same Scene Director*, labeled `AI COACH · OPTIONAL RESPONSE`, and never gains control of the local workout. A pending request or provider error leaves the timer and locally directed scene intact. The on-screen response is inert text, not executable UI or a claim of actual movement detection.
4. **Reviewer clarity.** The existing three-moment preview now provides a short instruction at each step, still records no fabricated completions and still allows exit/reset.

## Evaluation path

- Run `npm ci --ignore-scripts`, `npm run check`, `npx playwright install chromium`, `npm run test:ui`, `npm start` with Node >= 22.18.
- Choose **Make my session → See my plan → Start**, finish Shoulder rolls, then inspect **March in place**. Confirm one clear AiRA cue and choose **Explore two paths for what comes next** in the contextual check-in. Verify the current timer retains its progress while the upcoming movement changes.
- Alternatively, choose **Explore the interactive preview** on the welcome screen; select Gentle weight shifts, enter recovery, add 10 seconds, and view the clearly labeled preview postcard.
- The on-device Playwright spec `tests/browser/quality.spec.mjs` adds the check-in, no-duplicate coaching, mobile-overflow and synthetic model-cue tests. Also inspect screenshots on desktop and mobile, keyboard focus, reduced motion and actual animation timing manually.

## Runtime honesty

- **Mock/offline session:** Local state transitions, timers, preview and scene guidance verified in Node unit/HTTP tests.
- **OpenAIAPI coaching:** Synthetic-transport validation and browser test defined. No live provider call or real API response verified here.
- **ClaudeCLI:** Preserved from starter, not tested in a live workout.
- **Browser:** The environment blocks Chromium navigation to `127.0.0.1`; Playwright end-to-end and visual quality must be verified on the reviewer's machine.
- **Voice/sensors:** Not implemented or claimed. The starter's lint explicitly prohibits browser audio and sensor-related APIs.
