# AiRA v4: The Interactive Movement Film

**Creative premise:** A workout should feel directed, not managed. AiRA does not need a chat window to show that the experience understands choices.

## Scene Director

`src/shared/scene-director.ts` is a deterministic, presentation-only selector. It observes trusted state (movement, elapsed/remaining time, pause, completion, adapted plan and recovery) and returns a *scene beat* with a chapter label, one primary line and a supporting hint. The browser projects those allowed values into the scene; there is no generated HTML, executable model output or timer control.

- **Introduce:** At the beginning of a phase, describe the movement briefly.
- **Quiet:** After the first few seconds of activity, reduce verbal guidance rather than continuously narrating.
- **Recover:** A breathing break changes the scene to a gentler visual tone; added rest is acknowledged.
- **Adapt:** A chosen alternative changes the upcoming movement and AiRA's scene direction.
- **Paused:** Remind users that their timing is preserved.
- **Transition:** Celebrate the completed simulated phase and explain manual or opt-in hands-free continuation.

The Scene Director is not claimed to be live generative AI. The existing optional OpenAI text coach remains consent-gated and cannot mutate workout state.

## Choice Canvas

During **March in place**, `Explore two paths for what comes next` opens two illustrated, accessible choices. At the **breathing break**, those choices are available without an extra request. The alternatives are:

- **Keep your rhythm:** Side steps, with the original `flow_b` duration.
- **The gentler path:** Gentle weight shifts, approximately 40% shorter (with the 10-second minimum already enforced by the trusted state machine).

The controls communicate their selected state with `aria-pressed`. The user sees the activity title, instruction, illustration, duration and a short explanation before choosing. Switching affects the upcoming phase only; the currently running countdown is not reset. The user can switch back until the upcoming phase begins. Once a phase is complete or a confirmation is open, the choices cannot alter the upcoming phase.

No sensor readings, measured exertion, physical-completion claims or medical advice are introduced. The entire session remains a fictional simulation.

## How to demonstrate

1. Start **Quick → Steady** and observe AiRA's opening cue change into a quiet scene after four seconds.
2. Complete Shoulder rolls and enter March in place.
3. Open **Explore two paths**; select **Gentle weight shifts**. Watch the next movement, planned time, illustration and direction change.
4. Switch back to **Side steps**; optionally choose Gentle again to demonstrate that the decision is reversible.
5. Move to A breathing break, where the Choice Canvas is already visible; add ten seconds of rest, keeping elapsed progress.
6. Finish the simulated activity and show the factual summary/postcard. Optional hands-free progression is still user-controlled.

## Verification status

`npm run check`: TypeScript, static safety lint and **70** Node/unit/HTTP tests passed in the available Node 22.16 development environment. The compiled HTTP server returned 200. New browser regression tests cover choices and scene beats but are **not claimed as passed** here: `@playwright/test` was absent and offline npm installation could not fetch it; a direct Chromium navigation attempt also timed out in the environment. Run `npm ci --ignore-scripts && npm run check && npx playwright install chromium && npm run test:ui` on Node >= 22.18 in the target environment. Live OpenAI and Claude calls remain untested.
