# AiRA — interactive reviewer preview (v5)

## Why this exists

The creative moment in the full 75-second session is a user's ability to reshape the **next** scene. A recruiter might miss that by leaving early. The welcome screen now offers **Explore the interactive preview**: a compact, hands-on route through a real movement choice, real recovery control and honest postcard. This is not a slideshow and not a fake completed workout.

## Three moments (approximately 30–45 seconds of interaction)

1. **Choose a path.** Open the interactive preview from the welcome screen. The live March in place interval and Choice Canvas appear; change Side steps to Gentle weight shifts. The upcoming activity illustration, instructions and planned time respond; the current timer is not reset. You may change back.
2. **Make room to recover.** Choose **Next: Explore recovery**. This records the current preview phase accurately (skipped if still running, completed if actually elapsed) and starts the real breathing-break timer. Choose **Give me 10 more seconds** and observe the running timer retain elapsed progress.
3. **Read the postcard.** Choose **See your preview postcard**. The summary reflects your selected changes and time actually spent in visited phases. It is explicitly labeled **not a completed workout**. Untouched phases are never marked completed. **Start a full workout** returns to a clean welcome with no carried-over decisions.

## Important product boundaries

- The preview uses the same `WorkoutSession`, `TimerLedger`, `Workout(stage)` renderer, and guarded adjustment actions as the full workout.
- Jumping between preview scenes records a partial scene as **skipped**, never as completed. If the timer really expires, it may truthfully be recorded as completed.
- The shortcut is only available from the welcome screen and keeps the full regular workout available.
- The starter's safety lint disallows speech/audio APIs; no spoken narration was added.
- The preview is **not** evidence of actual physical activity, health or motion tracking. Model calls are neither needed nor implied.

## Local verification (Node >=22.18 required)

```sh
npm ci --ignore-scripts
npm run check
npx playwright install chromium
npm run build
npm run test:ui
npm start
```

The Playwright suite includes `tests/browser/reviewer.spec.mjs`, which saves screenshots for both **390px and 1280px** to `test-results/reviewer-evidence/` after executing the interaction. Review those screenshots and the on-screen animation manually before submission. Screenshots only count as evidence **after** the tests have successfully run; tests are not claimed as passing in the build container.

## Release status

Local TypeScript checking, static safety lint, unit/HTTP tests and source packaging should be verified after this change. Browser validation is pending on a machine with the Playwright runner and an unrestricted Chromium runtime. No real OpenAI/Claude provider call has been verified.
