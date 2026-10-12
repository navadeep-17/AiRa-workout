# Draft submission note — verify the browser before sending

Hi Vishnu,

I built **Move with AiRA**, a short fictional movement session designed to help people stay in their activity rather than manage an interface. The user chooses time and pace, previews five named movements (from Shoulder rolls to Slow arm reach), and sees one instruction, illustrated gesture and timer at a time. Each transition is explicit so the user stays in control.

The interaction I refined most is **"I need an easier next move."** During the first movement or recovery, AiRA changes the upcoming **Side steps** into **Gentle weight shifts**: the preview, instruction, illustrated pose, future countdown and final session record all change together. The user can undo this before the next activity. Recovery can also be extended by ten seconds without resetting elapsed progress. Pause, skip and early exit are guarded and reflected accurately in the summary.

I kept the starter's OpenUI parser, trusted component registry, screen navigation, timer ledger, local server and provider adapters. The main experience works offline without credentials. Optional, explicitly consented OpenAI text coaching receives only allowlisted simulated context including the active movement. It cannot change the workout timer or progression. The generic sample and builder harness remain available inside an expandable Studio.

**Modes/tests confirmed so far:** deterministic Mock session logic, TypeScript validation, safety lint, 61 Node tests and local HTTP service. **Not yet verified:** complete Chromium/Playwright journey (this environment blocks localhost browser navigation), real OpenAIAPI/ClaudeCLI calls, audio, motion tracking or production integration.

Best,
Navadeep