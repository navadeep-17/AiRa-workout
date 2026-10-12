# AiRA v8 — OpenUI Director (implementation plan and design record)

## Problem and product bet

The original assignment asks for an AI-guided **fictional** workout and candidate ownership of guidance, screen content and progression. The starter's differentiator is a protocol in which each assistant turn can create or patch declarative OpenUI statements. The previous fixed `Workout(stage)` experience delegated all guidance, transitions and exercise selection to handwritten application code. It remains in the repo as a fallback, but no longer leads the product.

**Product thesis:** the next visible scene is authored in an AI turn rather than selected from a hardcoded workout screen. The companion is a presenter, not the source of truth.

## Architecture and sequence

1. Welcome is a small declarative OpenUI screen, not a fixed workout controller. The primary user message is sent to the existing `Conversation`/`/api/turn` pipeline with a Director-mode client event.
2. The responder emits a complete or incremental `openui` fence containing one `Screen`, a `Movement(id)` using a **fixed movement catalog**, one `Timer(label, seconds)` for timed moments, text/Cue, and contextual `FollowUps`. State is parsed and validated by the existing `ScreenDocument`; any invalid patch leaves the previous screen intact.
3. The trusted renderer displays the named movement with a local illustration and catalog-derived instruction, while the trusted timer ledger owns start/pause/finish. No model-authored HTML or JavaScript is rendered.
4. Timer events and user interventions enter `client_events`; the next model turn receives the current `ui_state`, the event trail and the user's current request. The AI may replace named OpenUI statements and thereby revise the screen and next activity.
5. Mock mode follows the **same protocol** with deterministic screen patches. It is clearly marked simulated, not passed off as LLM inference. A configured OpenAI/CLI mode follows the provider consent path; model-generated output uses the same validator.
6. The legacy v7 experience remains accessible explicitly through the Studio. Reset returns to Director mode.

## Acceptance scenarios

- **Energy:** Start with “a quick energy boost and some room” -> first screen features March in place. Finish timer -> another distinct screen containing a breathing break. Following timer -> next activity and a close.
- **Desk / compact:** “I'm at my desk; very little space” -> wrist/desk movement, with a different movement ID and visible catalog instructions.
- **Interruption:** “No jumping / make it gentler” mid-session -> patched Movement, Cue and Timer; the previous activity does not claim completion.
- **Guardrails:** An unknown `Movement` ID or a timer exceeding the Director's duration cap is rejected on server and client; document keeps previous screen. Only allowlisted components are accepted in Director turns.
- **Safety / consent:** Mock runs offline; real API calls require explicit provider setup and opt-in. No microphone, sound, sensors, exercise detection, or medical prescription. Users can always pause/stop the simulation.
- **Testing:** TypeScript + lint + Node/unit/HTTP suite. Browser checks are included but should be described as unverified if Chromium cannot run.

## Non-goals

No infinite exercise generation, sensing, programmatic generated code, fitness claims, remote account or physical outcome assessment. Do not let model text directly mutate clock state. Avoid a dashboard, gamification and further visual redesign until the interaction has been verified.
