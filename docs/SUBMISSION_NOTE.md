# Proposed final submission note — verify local UI modes before sending

Hi Vishnu,

I built **Move with AiRA**, an AI-first fictional movement experience that starts with the person's needs rather than a preset workout. Someone can say “I need a two-minute energy boost with room to move” or “I'm at my desk and want a gentle reset,” and AiRA creates visibly different five-step sessions. Each plan includes a short rationale, named movements, timing, previews and space-conscious adaptations.

The main journey works fully offline using a transparent, deterministic movement planner and nine vetted movement options. I also built an **optional consent-gated OpenAI planner**: the model may propose session content in a strict JSON schema, but trusted code validates every movement, duration, phase and small-space constraint before rendering. The source clearly marks which plans use offline rules and which would come from a live model. I haven't verified a real model account call, so I don't claim to have tested it live.

The session is rendered using the starter's OpenUI architecture and trusted timer engine. AiRA guides each selected movement with an original expressive companion, illustrated movement scene and context-aware cues. People can pause, extend recovery, compare two next-movement options, choose a gentler alternative, and stop when they want. Changes propagate to the actual future interval and factual summary. A short reviewer tour and the original wiring/demo tools remain available.

**Tests completed in the build environment:** TypeScript, static safety lint, 82 Node/unit/HTTP tests, including simulated model responses (safe accepted, invalid rejected), and a local HTTP smoke check (GET / and planner assets returned 200, unauthorized planning returned 403). **Not verified here:** Playwright browser journey (restricted Chromium/dependency environment), real OpenAI/Claude calls, audio, physical activity or production integrations. I would verify the browser on the target machine and update this statement to match the actual results.

Best,
Navadeep

---

# Draft submission note — verify the browser before sending

Hi Vishnu,

I built **Move with AiRA**, a short fictional movement session designed to help people stay in their activity rather than manage an interface. The user chooses time and pace, previews five named movements (from Shoulder rolls to Slow arm reach), and sees one instruction, illustrated gesture and timer at a time. Transitions are manual by default, with optional three-second hands-free progression and a clear hold control.

The interaction I refined most is **"I need an easier next move."** During March in place or recovery, AiRA changes the upcoming **Side steps** into **Gentle weight shifts**: the preview, instruction, illustrated pose, future countdown and final session record all change together. The user can undo this before the next activity. Recovery can also be extended by ten seconds without resetting elapsed progress. Pause, skip and early exit are guarded and reflected accurately in the summary.

The original illustrated AiRA-like companion is a custom SVG rendered from trusted session state: its pose and expression change when the user pauses, recovers, chooses a lighter alternative, or finishes. A personal closing postcard acknowledges actual decisions and never invents physical results.

For the v4 creative pass I added a **Scene Director** that goes quiet during active movement and changes its presentation for recovery, pause, adaptation and completion. An illustrated **Choice Canvas** lets users compare two future movements and select or undo a path without resetting the current timer. The scene directions are transparent, local rules, not hidden model decisions.


I also added **Explore the interactive preview** on the welcome screen, a brief three-moment experience designed to make the key adaptation immediately discoverable. It uses the real local session engine for the movement choices and recovery timer, while recording skipped previews honestly and never implying that the entire workout was completed. The reviewer can jump into the full five-phase experience afterward.

I kept the starter's OpenUI parser, trusted component registry, screen navigation, timer ledger, local server and provider adapters. The main experience works offline without credentials. Optional, explicitly consented OpenAI text coaching receives only allowlisted simulated context including the active movement. It cannot change the workout timer or progression. The generic sample and builder harness remain available inside an expandable Studio.

**Modes/tests confirmed in the current workspace (update this after local browser review):** deterministic Mock session logic, TypeScript validation, safety lint, 73 Node tests and local HTTP service. **Not yet verified:** complete Chromium/Playwright journey (the test-runner dependency was unavailable, and a direct Chromium attempt timed out), real OpenAIAPI/ClaudeCLI calls, audio, motion tracking or production integration.

Best,
Navadeep

**Final presentation refinement:** I consolidated live-workout coaching into one Scene Director. The contextual check-in now exposes the two illustrated next-movement choices directly during March in place. Optional model-generated text appears in that same scene with attribution and cannot change session state. The reviewer preview now explains each interactive moment clearly. Please update the tested-mode paragraph with actual browser results before sending.
