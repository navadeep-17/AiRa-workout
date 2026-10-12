# The Living Workout — creative product decisions (v3)

## The idea

**The workout keeps up with you.** A small, original SVG companion expresses the local session state and gives the user one useful action at a time. The main screen is the workout, not a chat interface. The fictional demo does not measure actual exercise, reps or physiology.

## What feels alive

- **Expression reflects real state:** greeting, moving, recovering, responding to a gentler-choice adaptation, quietly waiting, and celebrating a completed or user-ended session. This is a presentation of validated `WorkoutSession` state, not an avatar pretending to see the user.
- **Adaptation changes the scene:** choosing “Make next flow lighter” transforms Side steps into Gentle weight shifts and updates the next-move card, animation, instructional copy, countdown, and recorded summary. A user may undo this until the adapted phase starts.
- **Time becomes less managerial:** optional Hands-free Flow lets a finished interval settle for three seconds before proceeding. Off by default. The user can continue sooner, remain on the current screen, disable hands-free, pause in an active phase, skip, or end. No background AI model is needed.
- **A factual ending:** the summary includes a short, deterministic postcard that references the user's actual adjustments and respects an early exit. No fake biometric measures, voice, or exercise detection.

## Why this fits the brief

The assignment asks for an AI-guided fictional workout with candidate-owned interaction, guidance, presentation and progression, using the provided starter. This release preserves its OpenUI protocol, component renderer and simulation timers while improving the human experience. Optional OpenAIAPI coaching remains text-only, consent-gated, and isolated from the trusted state machine.

## Review journey

1. Select Quick and Steady; enable Hands-free Flow at the plan if desired.
2. Start Shoulder rolls; notice the expressive on-screen companion.
3. During March in place, select “Make next flow lighter.” The upcoming move changes to Gentle weight shifts.
4. During A breathing break, select “Give me 10 more seconds”; observe that the running timer retains elapsed progress.
5. Let the next scene appear automatically (if enabled), or choose Continue manually.
6. Finish Slow arm reach; see a postcard accurately acknowledging the user's choices.

## Verification and limitations

The automated Node suite includes hands-free timing, early-ending guards, pause/resume and adaptive movement records. `npm run check` completed with 65 passing tests using a local TypeScript install and injected available Node type definitions. The compiled HTTP server returned 200. Chromium headless screenshot attempts timed out in the current environment; no completed browser-E2E run or fresh screenshot is claimed. Real OpenAI/Claude provider calls were not tested. For a fuller review on a machine with Playwright installed, run `npm run test:ui` and inspect both mobile and desktop.
