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
