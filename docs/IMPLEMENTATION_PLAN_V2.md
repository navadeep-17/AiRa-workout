# Move with AiRA — experience redesign (v2)

## Objective

Deliver a coherent **fictional, bodyweight-inspired workout walkthrough** rather than an abstract interval timer. Preserve the assignment starter's OpenUI document, trusted browser renderer, local state machine, provider isolation, and manual run-export tooling.

## Golden path (75-second Quick/Steady simulation)

1. Welcome and personalization: choose Quick or Unhurried, and Steady or Gentle.
2. Preview: see named movements, a human-readable instruction per phase, and the plan total.
3. Shoulder rolls (10s): prepare with an obvious movement visual and short instruction.
4. March in place (20s): timer, motion illustration, short cue, and Pause/Skip.
5. Recovery break (15s): show next move, extend rest +10s without resetting the clock, or choose a lighter next move.
6. Side steps (20s) by default; **Gentle weight shifts (12s)** after choosing lighter (reversible before phase starts). The actual movement, visual, instructions, and summary must all change.
7. Slow arm reach (10s): deliberate ending.
8. Accurate summary: report named movements, completed/skipped phases, elapsed simulated time, and the adjustments made.

## Product constraints

- *One dominant action per phase*: pause/resume or continue, with relevant secondary options.
- **The app never measures or asserts physical activity**. Timer completion means simulated phase completion only.
- **Adaptations are trusted local state transitions.** Optional model text may advise, but cannot mutate timers or UI state.
- Context in the optional coaching API should include the current movement by allowlisted name, not an invented sensor reading.
- Mobile experience prioritizes the workout; all developer harness tools are still accessible in an expandable studio.
- Preserve the generic wiring fixture and its test route; test both consumer and technical views.

## Acceptance tests

- Quick and Unhurried totals remain 75s and 105s; Gentle preserves the total with longer recovery.
- Every phase has a specific activity name, simple instruction, and corresponding local illustration (never generic 'flow' labels alone).
- `lightenNext()` changes the future movement to Gentle weight shifts *and* changes the timer; `undoLighten()` restores Side steps.
- Pause / resume / +10 recovery / skip / end early retain accurate elapsed time, completed/skipped records, and phase-specific summaries.
- Local typed coaching requests such as 'what's next' mention the actual upcoming movement and adjusted duration.
- Free-form coaching requests use opt-in live model text only; local workout remains usable during timeout/failure.
- Legacy OpenUI wiring and builder tools still work after opening the optional Studio panel.
- Run `npm run check` and `npm run test:ui` when dependencies and browser are available. Clearly record environment limitations.

## Release plan

1. **Core meaning**: movement catalog, adaptive variant, contextual messages, regression tests.
2. **Experience design**: human-centered illustrations, activity cues, plan and summary.
3. **Consumer-first navigation**: put developer harness tools in a secondary expandable studio.
4. **Verification**: unit, TypeScript, lint, browser where possible, GitHub commit and exact source zip.
